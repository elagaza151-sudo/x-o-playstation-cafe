(function () {
  const sb = window.supabase.createClient(window.XO_SUPABASE_URL, window.XO_SUPABASE_PUBLISHABLE_KEY);
  window.xoSupabase = sb;
  let profile = null;
  let saveQueue = Promise.resolve();
  const shared = { bookings: [], tournaments: [], settings: {}, inventory: [], inventoryMovements: [] };
  const safeError = e => (e && e.message) || 'حدث خطأ في الاتصال بالخادم';
  window.xoManagerCloud = {
    get profile() { return profile; },
    get shared() { return shared; },
    async login(username, password) {
      const response = await fetch(window.XO_SUPABASE_URL + '/functions/v1/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': window.XO_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({ username, password })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'اسم المستخدم أو كلمة المرور غير صحيحة');
      const { data: sessionData, error: sessionError } = await sb.auth.setSession({ access_token: result.access_token, refresh_token: result.refresh_token });
      if (sessionError) throw sessionError;
      const { data: p, error: pe } = await sb.from('staff_profiles').select('*').eq('user_id', sessionData.user.id).eq('active', true).single();
      if (pe || !p) { await sb.auth.signOut(); throw new Error('الحساب غير مضاف كموظف نشط. اطلب من المدير تفعيل صلاحيتك.'); }
      profile = p; return p;
    },
    async boot() {
      const { data: sessionData } = await sb.auth.getSession();
      if (!sessionData.session) return null;
      const { data: p } = await sb.from('staff_profiles').select('*').eq('user_id', sessionData.session.user.id).eq('active', true).maybeSingle();
      profile = p || null;
      if (profile) await this.refresh();
      return profile;
    },
    async refresh() {
      const [b, t, s, ps, orders, regs, inventory, movements] = await Promise.all([
        sb.from('bookings').select('*').order('created_at', { ascending: false }),
        sb.from('tournaments').select('*').order('created_at', { ascending: false }),
        sb.from('app_settings').select('setting_key,setting_value'),
        sb.from('pos_state').select('state').eq('id', 1).maybeSingle(),
        sb.from('cafe_orders').select('*').order('created_at', { ascending: false }),
        sb.from('tournament_registrations').select('*').order('created_at'),
        sb.from('inventory_items').select('*').eq('active',true).order('category').order('name'),
        sb.from('inventory_movements').select('*, inventory_items(name,unit)').order('created_at',{ascending:false}).limit(100)
      ]);
      if (b.error) throw b.error; if (t.error) throw t.error; if (s.error) throw s.error; if (orders.error) throw orders.error; if (regs.error) throw regs.error; if (inventory.error) throw inventory.error; if (movements.error) throw movements.error;
      shared.bookings = (b.data || []).map(x => ({ id:x.id, name:x.customer_name, roomName:x.room_name, roomPrice:Number(x.room_price), date:x.booking_date, time:String(x.booking_time).slice(0,5), hours:Number(x.hours), total:Number(x.total), deposit:Number(x.deposit), paymentMethod:x.payment_method, paymentRef:x.payment_reference, status:x.status, reviewedBy:x.reviewed_by || '', createdAt:x.created_at }));
      shared.tournaments = (t.data || []).map(x => ({ id:x.id, name:x.name, game:x.game, date:x.tournament_date, rules:x.rules, prize:x.prize, format:x.format, details:x.details, capacity:x.capacity, status:x.status, participants:(regs.data||[]).filter(r=>r.tournament_id===x.id).map(r=>({id:r.id,name:r.participant_name,phone:r.phone,team:r.assigned_team})) }));
      shared.orders = orders.data || [];
      shared.inventory = inventory.data || [];
      shared.inventoryMovements = movements.data || [];
      shared.settings = Object.fromEntries((s.data || []).map(x => [x.setting_key, x.setting_value]));
      if (ps.data?.state && window.xoManagerApplyState) window.xoManagerApplyState(ps.data.state); else if (window.xoManagerGetState) await this.savePos(window.xoManagerGetState());
      return shared;
    },
    async savePos(state) {
      const snapshot = JSON.parse(JSON.stringify(state));
      saveQueue = saveQueue.catch(() => {}).then(async () => {
        const { error } = await sb.from('pos_state').upsert({ id:1, state:snapshot, updated_by:(await sb.auth.getUser()).data.user?.id || null, updated_at:new Date().toISOString() });
        if (error) throw error;
      });
      return saveQueue;
    },
    async saveCatalog(state) {
      if (profile?.role !== 'manager') throw new Error('المدير فقط يمكنه تعديل المنيو والأسعار');
      const catalog = { rooms: state.rooms.map(r=>({name:r.n,rate:r.rate})), menu: state.menu.map(m=>({name:m[0],price:m[1]})), updatedAt:new Date().toISOString() };
      const { data:u } = await sb.auth.getUser();
      const { error } = await sb.from('app_settings').upsert({ setting_key:'public_catalog', setting_value:catalog, updated_by:u.user.id, updated_at:new Date().toISOString() });
      if (error) throw error; await this.refresh();
    },
    async savePayment(settings) {
      if (profile?.role !== 'manager') throw new Error('المدير فقط يمكنه تعديل بيانات الدفع');
      const { error } = await sb.from('app_settings').upsert({ setting_key:'payment_public', setting_value:settings, updated_by:(await sb.auth.getUser()).data.user.id, updated_at:new Date().toISOString() });
      if (error) throw error;
      await this.refresh();
    },
    async bookingStatus(id, status) {
      const { data: u } = await sb.auth.getUser();
      const { error } = await sb.from('bookings').update({ status, reviewed_by:u.user.id, reviewed_at:new Date().toISOString() }).eq('id', id);
      if (error) throw error; await this.refresh();
    },
    async createTournament(t) {
      const { data:u } = await sb.auth.getUser();
      const { error } = await sb.from('tournaments').insert({ name:t.name, game:t.game, tournament_date:t.date || null, rules:t.rules, prize:t.prize, format:t.format, details:t.details, capacity:t.capacity, status:'published', created_by:u.user.id });
      if (error) throw error; await this.refresh();
    },
    async assignRandomTeams(tournamentId) {
      const { data, error } = await sb.from('tournament_registrations').select('id').eq('tournament_id', tournamentId);
      if (error) throw error;
      const shuffled = (data || []).slice().sort(() => Math.random() - 0.5);
      for (let i=0; i<shuffled.length; i++) {
        const { error: updateError } = await sb.from('tournament_registrations').update({ assigned_team: i % 2 ? 'الفريق الثاني' : 'الفريق الأول' }).eq('id', shuffled[i].id);
        if (updateError) throw updateError;
      }
      await this.refresh();
    },
    async updateOrder(id, status) {
      const { error } = await sb.from('cafe_orders').update({ status }).eq('id', id);
      if (error) throw error; await this.refresh();
    },
    async updateTournament(id, patch) {
      const { error } = await sb.from('tournaments').update(patch).eq('id', id);
      if (error) throw error; await this.refresh();
    },
    async deleteTournament(id) {
      const { error: childError } = await sb.from('tournament_registrations').delete().eq('tournament_id', id);
      if (childError) throw childError;
      const { error } = await sb.from('tournaments').delete().eq('id', id);
      if (error) throw error; await this.refresh();
    },
    async registrations(tournamentId) {
      const { data, error } = await sb.from('tournament_registrations').select('*').eq('tournament_id', tournamentId).order('created_at');
      if (error) throw error; return data || [];
    },
    async saveInventoryItem(item) {
      if (profile?.role !== 'manager') throw new Error('المدير فقط يمكنه تعديل الجرد');
      const payload = { name:item.name, category:item.category, unit:item.unit, quantity:item.quantity, min_quantity:item.min_quantity, unit_cost:item.unit_cost, active:true, updated_at:new Date().toISOString() };
      const query = item.id ? sb.from('inventory_items').update(payload).eq('id',item.id) : sb.from('inventory_items').insert({...payload,created_by:(await sb.auth.getUser()).data.user.id});
      const { error } = await query;
      if (error) throw error;
      await this.refresh();
    },
    async adjustInventory(id, type, quantity, note) {
      if (profile?.role !== 'manager') throw new Error('المدير فقط يمكنه تعديل الكميات');
      const item = shared.inventory.find(x=>x.id===id);
      if (!item) throw new Error('الصنف غير موجود');
      const amount = Number(quantity);
      if (!(amount>0)) throw new Error('اكتب كمية صحيحة');
      const before = Number(item.quantity), after = type==='set' ? amount : type==='add' ? before+amount : before-amount;
      if (after<0) throw new Error('الكمية غير كافية للصرف');
      const { error: updateError } = await sb.from('inventory_items').update({quantity:after,updated_at:new Date().toISOString()}).eq('id',id);
      if (updateError) throw updateError;
      const { data:u } = await sb.auth.getUser();
      const { error } = await sb.from('inventory_movements').insert({item_id:id,movement_type:type,quantity:amount,before_quantity:before,after_quantity:after,note:note||null,created_by:u.user.id});
      if (error) throw error;
      await this.refresh();
    },
    async deleteInventoryItem(id) {
      if (profile?.role !== 'manager') throw new Error('المدير فقط يمكنه حذف الأصناف');
      const { error } = await sb.from('inventory_items').update({active:false,updated_at:new Date().toISOString()}).eq('id',id);
      if (error) throw error;
      await this.refresh();
    },
    async logout() { profile = null; await sb.auth.signOut(); }
  };
})();

(function () {
  const sb = window.supabase.createClient(window.XO_SUPABASE_URL, window.XO_SUPABASE_PUBLISHABLE_KEY);
  window.xoSupabase = sb;
  const $ = id => document.getElementById(id);
  const state = { payment: { depositPercent: 30 }, catalog: null, tournaments: [] };
  window.xoCustomerCloud = {
    state,
    async init() {
      const { data: settings, error } = await sb.from('app_settings').select('setting_key,setting_value').in('setting_key', ['payment_public','public_catalog']);
      if (!error) (settings||[]).forEach(row => { if(row.setting_key==='payment_public') Object.assign(state.payment,row.setting_value||{}); if(row.setting_key==='public_catalog') state.catalog=row.setting_value; });
      if (state.catalog) {
        if (Array.isArray(window.ROOMS)) state.catalog.rooms?.forEach((r,i)=>{ if(window.ROOMS[i]) { window.ROOMS[i].n=r.name||window.ROOMS[i].n; window.ROOMS[i].p=Number(r.rate??window.ROOMS[i].p); }});
        if (window.MENU) Object.keys(window.MENU).forEach(k=>window.MENU[k].forEach(item=>{ const match=(state.catalog.menu||[]).find(m=>m.name===item[0]); if(match) item[2]=Number(match.price); }));
        if(window.renderRooms) window.renderRooms(); if(window.renderMenu) window.renderMenu(); if(window.calc) window.calc();
      }
      const { data: tours } = await sb.from('tournaments').select('*').eq('status', 'published').order('created_at', { ascending: false });
      state.tournaments = tours || [];
      return state;
    },
    async createBooking(payload) {
      const { error } = await sb.from('bookings').insert({
        customer_name: payload.name, room_name: payload.roomName, room_price: payload.roomPrice,
        booking_date: payload.date, booking_time: payload.time, hours: payload.hours,
        total: payload.total, deposit: payload.deposit, payment_method: payload.paymentMethod,
        payment_reference: payload.paymentRef, status: 'pending', created_by: 'customer_website'
      });
      if (error) throw error;
    },
    async createOrder(payload) {
      const { error } = await sb.from('cafe_orders').insert({
        customer_name: payload.customerName || null, room_name: payload.roomName || null,
        items: payload.items, total: payload.total, status: 'new', source: 'customer_website'
      });
      if (error) throw error;
    },
    async registerTournament(id, name, phone) {
      const { error } = await sb.from('tournament_registrations').insert({ tournament_id: id, participant_name: name, phone });
      if (error) throw error;
    }
  };
  document.addEventListener('DOMContentLoaded', () => window.xoCustomerCloud.init().then(() => {
    window.dispatchEvent(new CustomEvent('xo-cloud-ready'));
    sb.channel('xo-public-settings').on('postgres_changes',{event:'*',schema:'public',table:'app_settings'},async () => {
      try { await window.xoCustomerCloud.init(); window.dispatchEvent(new CustomEvent('xo-cloud-ready')); } catch(err) { console.error(err); }
    }).on('postgres_changes',{event:'*',schema:'public',table:'tournaments'},async () => {
      try { await window.xoCustomerCloud.init(); window.dispatchEvent(new CustomEvent('xo-cloud-ready')); } catch(err) { console.error(err); }
    }).subscribe();
  }).catch(err => console.error('X/O cloud initialization:', err)));
})();

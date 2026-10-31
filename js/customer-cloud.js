(function () {
  const sb = window.supabase.createClient(window.XO_SUPABASE_URL, window.XO_SUPABASE_PUBLISHABLE_KEY);
  window.xoSupabase = sb;
  const $ = id => document.getElementById(id);
  const state = { payment: { depositPercent: 30 }, catalog: null, tournaments: [] };
  function saveTracking(kind, id, token) {
    if (!id || !token) return;
    const key = 'xo_my_' + (kind === 'booking' ? 'bookings' : 'orders') + '_v1';
    const ids = JSON.parse(localStorage.getItem(key) || '[]');
    if (!ids.includes(id)) localStorage.setItem(key, JSON.stringify([id, ...ids].slice(0, 30)));
    const tokenKey = 'xo_tracking_tokens_v1';
    const tokens = JSON.parse(localStorage.getItem(tokenKey) || '{}');
    tokens[id] = token;
    localStorage.setItem(tokenKey, JSON.stringify(tokens));
  }
  async function submitPublic(payload) {
    const response = await fetch(window.XO_SUPABASE_URL + '/functions/v1/customer-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': window.XO_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || 'تعذر إرسال الطلب');
    return result;
  }
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
      const result = await submitPublic({ action: 'booking', ...payload });
      if (result.id) {
        saveTracking('booking', result.id, result.trackingToken);
        localStorage.setItem('xo_last_booking_status_' + result.id, 'pending');
      }
      return result;
    },
    async createOrder(payload) {
      const result = await submitPublic({ action: 'order', ...payload });
      if (result.id) {
        saveTracking('order', result.id, result.trackingToken);
        localStorage.setItem('xo_last_order_status_' + result.id, 'new');
      }
      return result;
    },
    async getStatus(kind, id) {
      const tokens = JSON.parse(localStorage.getItem('xo_tracking_tokens_v1') || '{}');
      return submitPublic({ action: 'status', kind, id, trackingToken: tokens[id] || '' });
    },
    async registerTournament(id, name, phone) {
      return submitPublic({ action: 'register', tournamentId: id, name, phone });
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

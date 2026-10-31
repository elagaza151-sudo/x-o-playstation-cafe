(function(){
  var KEY=document.getElementById('main')?'xo_manager_notifications_v1':'xo_customer_notifications_v1', seenTimers={}, audioCtx=null;
  function read(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch(e){return[]}}
  function write(items){try{localStorage.setItem(KEY,JSON.stringify(items.slice(0,80)))}catch(e){}}
  function escapeHtml(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
  function soundEnabled(){return localStorage.getItem('xo_notification_sound')!=='off'}
  function playSound(type){
    if(!soundEnabled())return;
    try{
      var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
      if(!audioCtx)audioCtx=new AC();if(audioCtx.state==='suspended')audioCtx.resume();
      var now=audioCtx.currentTime,notes=type==='booking'?[660,880,1046]:type==='order'?[880,660,880]:[523,659,784];
      notes.forEach(function(freq,i){var osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),start=now+i*.13;osc.type='sine';osc.frequency.setValueAtTime(freq,start);gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.12,start+.025);gain.gain.exponentialRampToValueAtTime(.0001,start+.20);osc.connect(gain);gain.connect(audioCtx.destination);osc.start(start);osc.stop(start+.22)});
    }catch(e){}
  }
  function notify(title,body,type){
    var items=read(),item={id:Date.now()+'_'+Math.random().toString(36).slice(2),title:title,body:body||'',type:type||'info',at:new Date().toISOString(),read:false};
    items.unshift(item);write(items);render();toast(title+(body?' — '+body:''));playSound(type||'info');
    if('Notification'in window&&Notification.permission==='granted'){
      try{new Notification(title,{body:body||'',tag:item.id})}catch(e){}
    }
    window.dispatchEvent(new CustomEvent('xo-notification',{detail:item}));
    return item;
  }
  function toast(message){
    var el=document.getElementById('xoNotifyToast');
    if(!el){el=document.createElement('div');el.id='xoNotifyToast';document.body.appendChild(el)}
    el.textContent=message;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){el.classList.remove('show')},4200);
  }
  function render(){
    var host=document.getElementById('xoNotifyHost');
    if(!host)return;
    var items=read(),unread=items.filter(function(x){return!x.read}).length;
    host.innerHTML='<button type="button" id="xoNotifyBell" aria-label="الإشعارات">🔔 <b>'+unread+'</b></button><section id="xoNotifyPanel" hidden><header><strong>الإشعارات</strong><button type="button" id="xoNotifyReadAll">قراءة الكل</button></header><div class="xoNotifyList">'+(items.length?items.map(function(x){return '<article class="'+(x.read?'read':'')+'"><b>'+escapeHtml(x.title)+'</b><p>'+escapeHtml(x.body)+'</p><small>'+new Date(x.at).toLocaleString('ar-EG')+'</small></article>'}).join(''):'<p class="empty">لا توجد إشعارات حتى الآن</p>')+'</div><footer><button type="button" id="xoNotifySound">'+(soundEnabled()?'كتم الصوت':'تشغيل الصوت')+'</button><button type="button" id="xoNotifyTestSound">تجربة الصوت</button><button type="button" id="xoNotifyEnable">تفعيل تنبيهات الجهاز</button><button type="button" id="xoNotifyClear">مسح الإشعارات</button></footer></section>';
    document.getElementById('xoNotifyBell').onclick=function(){if(window.AudioContext||window.webkitAudioContext){try{if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume()}catch(e){}}var p=document.getElementById('xoNotifyPanel');p.hidden=!p.hidden};
    document.getElementById('xoNotifyReadAll').onclick=function(){write(read().map(function(x){x.read=true;return x}));render()};
    document.getElementById('xoNotifyClear').onclick=function(){write([]);render()};
    var soundBtn=document.getElementById('xoNotifySound');if(soundBtn)soundBtn.onclick=function(){localStorage.setItem('xo_notification_sound',soundEnabled()?'off':'on');render()};
    var testBtn=document.getElementById('xoNotifyTestSound');if(testBtn)testBtn.onclick=function(){playSound('booking');toast('دي نغمة تجريبية للإشعارات')};
    document.getElementById('xoNotifyEnable').onclick=function(){if(!('Notification'in window)){toast('المتصفح لا يدعم إشعارات الجهاز');return}Notification.requestPermission().then(function(p){toast(p==='granted'?'تم تفعيل إشعارات الجهاز':'لم يتم السماح بالإشعارات')})};
  }
  function addHost(){
    if(document.getElementById('xoNotifyHost'))return;
    var h=document.createElement('div');h.id='xoNotifyHost';document.body.appendChild(h);
    var style=document.createElement('style');style.textContent='#xoNotifyHost{position:fixed;z-index:9999;top:14px;left:14px;font:14px Rubik,Tahoma,sans-serif;color:#f3f7f5}#xoNotifyBell{border:1px solid #ffffff35;border-radius:30px;background:#124843;color:#fff;padding:10px 14px;cursor:pointer;box-shadow:0 5px 20px #0003}#xoNotifyBell b{display:inline-grid;place-items:center;min-width:20px;height:20px;border-radius:50%;background:#ffd23f;color:#1e1b00;margin-inline-start:5px}#xoNotifyPanel{position:absolute;top:48px;left:0;width:min(360px,calc(100vw - 28px));max-height:70vh;overflow:hidden;background:#0c3a36;border:1px solid #ffffff35;border-radius:14px;box-shadow:0 16px 50px #0007}#xoNotifyPanel[hidden]{display:none}#xoNotifyPanel header,#xoNotifyPanel footer{display:flex;justify-content:space-between;align-items:center;padding:12px;border-bottom:1px solid #ffffff25}#xoNotifyPanel footer{border:0;border-top:1px solid #ffffff25}#xoNotifyPanel button{background:#ffd23f;color:#1e1b00;border:0;border-radius:8px;padding:7px 10px;cursor:pointer}#xoNotifyPanel .xoNotifyList{overflow:auto;max-height:55vh}#xoNotifyPanel article{padding:12px;border-bottom:1px solid #ffffff1c}#xoNotifyPanel article.read{opacity:.55}#xoNotifyPanel p{margin:4px 0;color:#b8d2cc}#xoNotifyPanel small{color:#9dbfb8}#xoNotifyPanel .empty{padding:18px;text-align:center}#xoNotifyToast{position:fixed;z-index:10000;bottom:22px;left:50%;transform:translate(-50%,20px);opacity:0;pointer-events:none;background:#ffd23f;color:#1e1b00;padding:12px 18px;border-radius:12px;box-shadow:0 8px 28px #0005;max-width:min(90vw,520px);transition:.25s;font:700 14px Rubik,Tahoma,sans-serif}#xoNotifyToast.show{opacity:1;transform:translate(-50%,0)}';
    document.head.appendChild(style);render();
  }
  function isManager(){return !!document.getElementById('main')}
  function managerRealtime(){
    var sb=window.xoSupabase;if(!sb||!isManager())return;
    var channel=null;
    function connect(){
      if(channel)return;
      channel=sb.channel('xo-notification-feed')
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'bookings'},function(p){var b=p.new||{};notify('طلب حجز جديد',(b.customer_name||'عميل')+' — '+(b.room_name||'')+'، '+(b.booking_date||'')+' '+String(b.booking_time||'').slice(0,5),'booking')})
        .on('postgres_changes',{event:'UPDATE',schema:'public',table:'bookings'},function(p){var b=p.new||{};notify('تحديث الحجز',(b.customer_name||'')+' — '+(b.status==='confirmed'?'تم تأكيد الحجز':b.status==='rejected'?'تم رفض الحجز':'تم تعديل بيانات الحجز'),'booking')})
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'cafe_orders'},function(p){var o=p.new||{};notify('طلب كافيتريا جديد',(o.room_name||'بدون رقم غرفة')+' — '+Number(o.total||0)+' جنيه','order')})
        .subscribe();
    }
    sb.auth.onAuthStateChange(function(event,session){if(session)connect()});
  }
  function customerRealtime(){
    if(isManager())return;
    async function poll(){
      var cloud=window.xoCustomerCloud;
      if(!cloud||!cloud.getStatus)return;
      var bookings=[],orders=[];
      try{bookings=JSON.parse(localStorage.getItem('xo_my_bookings_v1')||'[]')}catch(e){}
      try{orders=JSON.parse(localStorage.getItem('xo_my_orders_v1')||'[]')}catch(e){}
      for(var i=0;i<bookings.length;i++){
        try{
          var res=await cloud.getStatus('booking',bookings[i]),b=res.record;if(!b)continue;
          var key='xo_last_booking_status_'+b.id,prev=localStorage.getItem(key);
          if(prev===null)localStorage.setItem(key,b.status);
          else if(prev!==b.status){localStorage.setItem(key,b.status);
            if(b.status==='confirmed')notify('تم تأكيد حجزك','حجز '+b.room_name+' أصبح مؤكدًا. نتشرف بزيارتك!','booking');
            else if(b.status==='rejected')notify('تعذر تأكيد الحجز','تواصل مع المكان لمعرفة التفاصيل.','booking');
          }
        }catch(e){}
      }
      for(var j=0;j<orders.length;j++){
        try{
          var ores=await cloud.getStatus('order',orders[j]),o=ores.record;if(!o)continue;
          var okey='xo_last_order_status_'+o.id,oprev=localStorage.getItem(okey);
          if(oprev===null)localStorage.setItem(okey,o.status);
          else if(oprev!==o.status){localStorage.setItem(okey,o.status);
            var labels={preparing:'بدأ تجهيز طلبك',ready:'طلبك جاهز للاستلام',delivered:'تم تسليم طلبك',cancelled:'تم إلغاء طلبك'};
            if(labels[o.status])notify(labels[o.status],o.room_name?'طلب الغرفة '+o.room_name:'طلب الكافيتريا','order');
          }
        }catch(e){}
      }
    }
    poll();setInterval(poll,20000);
  }
  function checkSessions(){
    if(!isManager()||!window.xoManagerGetState)return;
    var s=window.xoManagerGetState(),now=Date.now();
    (s.rooms||[]).forEach(function(r){if(!r.ss)return;var elapsed=now-Number(r.ss.s||now),hours=Math.floor(elapsed/3600000),duration=Number(r.ss.durationMs||0),key=String(r.id);
      if(hours>=1&&!seenTimers[key+'_hour']){seenTimers[key+'_hour']=true;notify('عدّى ساعة على الجلسة',r.n+' — الوقت شغال بالفعل','timer')}
      if(duration>0&&elapsed>=duration&&!seenTimers[key+'_ended']){seenTimers[key+'_ended']=true;notify('مدة الحجز انتهت',r.n+(r.ss.c?' — '+r.ss.c:''),'timer')}
    });
  }
  window.xoNotify={notify:notify,refresh:render,requestPermission:function(){if('Notification'in window&&Notification.permission==='default')Notification.requestPermission()}};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){addHost();managerRealtime();customerRealtime();checkSessions();setInterval(checkSessions,15000)});else{addHost();managerRealtime();customerRealtime();checkSessions();setInterval(checkSessions,15000)}
})();
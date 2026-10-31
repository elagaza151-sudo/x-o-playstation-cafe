insert into public.app_settings(setting_key,setting_value)
values ('public_catalog', '{
  "rooms":[
    {"name":"غرفة VIP","rate":120},{"name":"غرفة VIP 2","rate":120},{"name":"غرفة VIP 3","rate":120},
    {"name":"غرفة عائلية","rate":90},{"name":"غرفة عائلية 2","rate":90},{"name":"الصالة المفتوحة","rate":50},
    {"name":"الصالة 2","rate":50},{"name":"الصالة 3","rate":50},{"name":"غرفة VIP 4","rate":120},
    {"name":"الصالة 4","rate":50},{"name":"غرفة عائلية 3","rate":90},{"name":"الصالة 5","rate":50}
  ],
  "menu":[
    {"name":"قهوة تركي","price":35},{"name":"نسكافيه","price":40},{"name":"كابتشينو","price":55},
    {"name":"لاتيه","price":58},{"name":"آيس لاتيه","price":65},{"name":"موهيتو","price":55},
    {"name":"ريد بول","price":60},{"name":"مياه","price":15},{"name":"عصير مانجا","price":55},
    {"name":"سموذي بيري","price":70},{"name":"ميلك شيك أوريو","price":75},{"name":"ساندوتش بيتزا","price":80},
    {"name":"برجر","price":120},{"name":"تشيكن كرسبي","price":95},{"name":"بطاطس","price":45},
    {"name":"ناتشوز","price":65},{"name":"بوب كورن","price":30},{"name":"وافل نوتيلا","price":75}
  ]
}'::jsonb)
on conflict (setting_key) do nothing;

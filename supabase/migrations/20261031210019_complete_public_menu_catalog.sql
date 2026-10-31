update public.app_settings
set setting_value = jsonb_set(setting_value, '{menu}', '[
  {"name":"قهوة تركي","price":35},{"name":"إسبريسو","price":40},{"name":"كابتشينو","price":55},{"name":"لاتيه","price":58},{"name":"فلات وايت","price":62},{"name":"نسكافيه","price":40},
  {"name":"آيس لاتيه","price":65},{"name":"آيس موكا","price":70},{"name":"كولد برو","price":68},{"name":"موهيتو","price":55},{"name":"ريد بول","price":60},{"name":"مياه معدنية","price":15},
  {"name":"عصير مانجا","price":55},{"name":"فراولة بالحليب","price":55},{"name":"ليمون بالنعناع","price":45},{"name":"سموذي ميكس بيري","price":70},{"name":"ميلك شيك أوريو","price":75},{"name":"كوكتيل فواكه","price":65},
  {"name":"ساندوتش بيتزا","price":80},{"name":"برجر لحمة","price":120},{"name":"تشيكن كرسبي","price":95},{"name":"باستا ألفريدو","price":110},{"name":"ناتشوز بالجبنة","price":65},{"name":"هوت دوج","price":70},
  {"name":"بطاطس مقلية","price":45},{"name":"بوب كورن","price":30},{"name":"وافل نوتيلا","price":75},{"name":"كوكيز دافية","price":60},{"name":"براونيز","price":50},{"name":"تشيز كيك","price":70}
]'::jsonb)
where setting_key='public_catalog';

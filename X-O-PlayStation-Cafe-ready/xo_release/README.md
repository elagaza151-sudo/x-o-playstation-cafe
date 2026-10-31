# X/O PlayStation & Cafe

واجهة عربية RTL لعملاء المكان ولوحة تشغيل الموظفين، مرتبطة بمشروع Supabase قائم.

## الملفات
- `index.html` — صفحة العملاء.
- `manager.html` — لوحة التشغيل.
- `js/supabase-config.js` — عنوان المشروع ومفتاح Publishable العام فقط.
- `js/customer-cloud.js` — حجوزات العملاء وطلبات الكافيه والبطولات.
- `js/manager-cloud.js` — تسجيل دخول الموظفين، حفظ حالة نقطة البيع، الإعدادات والتحديثات الحية.
- `supabase/migrations/` — تغييرات قاعدة البيانات التي أضيفت أثناء الربط.

## تشغيل محلي
افتح مجلد المشروع باستخدام VS Code ثم شغّل Live Server، أو ارفع الملفات إلى GitHub Pages. لا تفتح الصفحات عبر `file://` لأن المتصفح قد يمنع بعض الاتصالات.

## ربط Supabase الحالي
- Project: `X/O`
- Project ref: `gblaspbcogadllomofpi`
- URL: `https://gblaspbcogadllomofpi.supabase.co`
- المفتاح الموجود في `js/supabase-config.js` هو Publishable key، ومسموح وجوده في المتصفح مع RLS.
- ممنوع تمامًا وضع `service_role` أو أي Secret key في ملفات الواجهة.

## حسابات الموظفين
قاعدة البيانات فيها بالفعل 4 سجلات موظفين نشطة: مدير وثلاثة شيفتات. تسجيل الدخول أصبح بالبريد الإلكتروني وكلمة المرور عبر Supabase Auth، وليس بحسابات demo المخزنة في HTML. البريد المسجل للمدير `admin@gmail.com`، وللشيفتات `shift1@gmail.com` و`shift2@gmail.com` و`shift3@gmail.com`. كلمات المرور لا يمكن قراءتها من قاعدة البيانات؛ استخدم كلمة المرور التي تم تعيينها عند إنشاء حساب Auth أو أعد ضبطها من Authentication → Users.

لو المستخدمون الأربعة لديهم حسابات Auth بالفعل، استخدم بريد كل حساب وكلمة مروره. لو احتجت إنشاء/إعادة ضبط حساب:
1. افتح Supabase Dashboard → Authentication → Users.
2. أنشئ المستخدم بالبريد وكلمة المرور (أو أرسل دعوة بريدية).
3. انسخ User UID.
4. في SQL Editor نفّذ (استبدل UID وبيانات الموظف):

```sql
insert into public.staff_profiles (user_id, display_name, role, shift_name, active)
values ('USER-UUID-HERE', 'مدير X/O', 'manager', 'الإدارة', true)
on conflict (user_id) do update set
  display_name = excluded.display_name,
  role = excluded.role,
  shift_name = excluded.shift_name,
  active = true;
```

للموظف استخدم `role = 'shift'` واسم الشيفت المناسب. لا تجعل أي حساب موظف مديرًا إلا إذا كان مخولًا بذلك.

## النشر على GitHub Pages
1. أنشئ Repository جديدًا باسم `x-o-playstation-cafe`.
2. ارفع محتويات هذا المجلد إلى جذر `main`.
3. من Settings → Pages اختر GitHub Actions كمصدر للنشر (ملف workflow موجود بالفعل).
4. رابط العملاء سيكون `https://elagaza151-sudo.github.io/x-o-playstation-cafe/`.
5. رابط لوحة الإدارة سيكون `https://elagaza151-sudo.github.io/x-o-playstation-cafe/manager.html`.

## ملاحظات تشغيل مهمة
- حجوزات الموقع تحفظ في `bookings` وتظهر للموظفين في صفحة «طلبات الحجز من الموقع».
- طلبات الكافيه تحفظ في `cafe_orders` وتظهر في تبويب الكافيه، ويمكن تعليمها «تم التسليم».
- البطولات والتسجيلات تحفظ في `tournaments` و`tournament_registrations`.
- بيانات التشغيل اليومية تحفظ في `pos_state` وتُشارك بين أجهزة الموظفين.
- الأسعار والمنيو التي يغيرها المدير في الإعدادات تُنشر للواجهة العامة عبر `app_settings.public_catalog`.
- مرجع العربون يُراجع يدويًا قبل تأكيد الحجز؛ الموقع لا ينفذ تحصيلًا إلكترونيًا تلقائيًا.
- أداة «اسأل الذكاء الاصطناعي» ما زالت واجهة تجريبية ولا تتصل بمزود AI. مولد الفرق وعجلة الأسماء أدوات محلية داخل المتصفح.
- لا تعتبر المشروع جاهزًا للتشغيل التجاري قبل إتمام اختبار تسجيل الدخول بحسابات الموظفين، والحجز، وطلبات الكافيه، وتحديث الأسعار على جهازين مختلفين.

## تنبيهات الأمان
- كل جداول `public` المستخدمة في النظام عليها RLS، وتم التحقق من صلاحيات Data API الأساسية.
- فحص Supabase ما زال يعرض تحذيرًا على دالة `tournament_has_space` لأنها SECURITY DEFINER ومطلوبة للتحقق من سعة البطولة أثناء التسجيل العام، وتحذيرًا منفصلًا لأن حماية كلمات المرور المسرّبة غير مفعّلة في إعدادات Auth. فعّل Leaked Password Protection قبل التشغيل الفعلي.
- لا يوجد تحصيل إلكتروني تلقائي؛ الموظف يراجع رقم مرجع التحويل يدويًا.

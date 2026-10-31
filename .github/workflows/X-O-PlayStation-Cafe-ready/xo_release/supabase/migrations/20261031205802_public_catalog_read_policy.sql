drop policy if exists "public read public catalog" on public.app_settings;
create policy "public read public catalog" on public.app_settings
for select to anon, authenticated
using (setting_key in ('payment_public','public_catalog'));

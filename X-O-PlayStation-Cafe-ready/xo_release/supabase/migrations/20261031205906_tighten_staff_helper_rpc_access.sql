drop policy if exists "public read published tournaments" on public.tournaments;
create policy "public read published tournaments" on public.tournaments
for select to anon using (status = 'published');
create policy "staff read tournaments" on public.tournaments
for select to authenticated using (status = 'published' or public.is_active_staff());
revoke execute on function public.is_manager() from public;
grant execute on function public.is_manager() to authenticated;
revoke execute on function public.is_active_staff() from public;
grant execute on function public.is_active_staff() to authenticated;

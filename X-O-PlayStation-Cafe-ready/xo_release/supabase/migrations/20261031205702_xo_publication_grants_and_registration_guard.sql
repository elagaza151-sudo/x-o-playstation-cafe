grant select on public.app_settings to anon, authenticated;
grant select, insert on public.bookings to anon, authenticated;
grant select, update on public.bookings to authenticated;
grant insert on public.cafe_orders to anon, authenticated;
grant select, update on public.cafe_orders to authenticated;
grant select on public.tournaments to anon, authenticated;
grant insert, update, delete on public.tournaments to authenticated;
grant insert on public.tournament_registrations to anon, authenticated;
grant select, update, delete on public.tournament_registrations to authenticated;
grant select, insert, update on public.pos_state to authenticated;
grant select on public.staff_profiles to authenticated;
create unique index if not exists tournament_registrations_unique_phone
on public.tournament_registrations (tournament_id, phone);
do $$
declare tbl text;
begin
  foreach tbl in array array['bookings','cafe_orders','tournaments','tournament_registrations','pos_state'] loop
    if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=tbl) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;
insert into public.app_settings(setting_key,setting_value)
values ('payment_public','{"depositPercent":30,"instapay":"","bank":"","wallet":""}'::jsonb)
on conflict (setting_key) do nothing;

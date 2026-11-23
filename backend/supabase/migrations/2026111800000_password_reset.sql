alter table public.support_ticket
  add column kind text not null default 'report'
  constraint support_ticket_kind_valid check (kind in ('report', 'password_reset'));

create or replace function public.user_id_for_email(lookup text)
  returns uuid
  language sql
  security definer
  set search_path to ''
  as $$
    select id from auth.users where lower(email) = lower(lookup) limit 1
  $$;

revoke execute on function public.user_id_for_email(text) from public, anon, authenticated;
grant execute on function public.user_id_for_email(text) to service_role;
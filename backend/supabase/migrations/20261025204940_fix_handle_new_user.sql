-- New sign-ups (including guests) get a row in public."user".
-- The old version inserted into public.profile, which doesn't exist, so every sign-up failed.
create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
begin
  insert into public."user" (id, username, is_guest)
  values (
    new.id,
    -- guests (and anyone who skipped the field) get a placeholder name, e.g. guest_3f9a1c2b
    coalesce(nullif(new.raw_user_meta_data->>'username', ''), 'guest_' || left(new.id::text, 8)),
    new.is_anonymous
  );
  return new;
end;
$function$;

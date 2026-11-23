create or replace function public.handle_new_user()
  returns trigger
  language plpgsql
  security definer
  set search_path to ''
  as $function$
declare
  name text := nullif(new.raw_user_meta_data->>'username', '');
begin
  while name is null or exists (select 1 from public."user" where username = name) loop
    name := 'Guest' || lpad(floor(random() * 10000)::int::text, 4, '0');
  end loop;

  insert into public."user" (id, username, is_guest)
  values (new.id, name, new.is_anonymous);
  return new;
end;
$function$;

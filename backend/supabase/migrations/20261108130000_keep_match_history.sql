alter table public.match add column table_name text;
alter table public.match alter column table_id drop not null;
alter table public.match drop constraint match_table_id_fkey;
alter table public.match add constraint match_table_id_fkey foreign key (table_id) references public."table"(id) on delete set null;

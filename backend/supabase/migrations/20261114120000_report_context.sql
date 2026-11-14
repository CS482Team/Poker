alter table public.support_ticket
  add column table_id uuid,
  add column table_name text;

alter table public.chat_message drop constraint chat_message_table_id_fkey;
alter table public.match drop constraint match_table_id_fkey;

alter table public.match_log alter column action_type type text;

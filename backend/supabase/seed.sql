-- TEST DATABASE SEED
-- Test using docker locally.
-- Run with `npx supabase db reset`.

set session_replication_role = replica;

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-000000000001', 'maya@test.local'),
  ('00000000-0000-0000-0000-000000000002', 'theo@test.local'),
  ('00000000-0000-0000-0000-000000000003', 'lina@test.local'),
  ('00000000-0000-0000-0000-000000000004', 'noah@test.local'),
  ('00000000-0000-0000-0000-000000000005', 'alex@test.local');

insert into public."user" (id, username, chip_balance)
values
  ('00000000-0000-0000-0000-000000000001', 'Maya', 1840),
  ('00000000-0000-0000-0000-000000000002', 'Theo', 2120),
  ('00000000-0000-0000-0000-000000000003', 'Lina',  980),
  ('00000000-0000-0000-0000-000000000004', 'Noah', 1560),
  ('00000000-0000-0000-0000-000000000005', 'Alex', 2450);

set session_replication_role = origin;

insert into public."table" (name, max_players, buy_in, status, minimum_bet, ante, bot_count)
values
  ('Dummy Table 1', 6,  100, 0,  5, 1, 0),
  ('Dummy Table 2', 4,  500, 0, 20, 5, 0),
  ('Dummy Table 3', 2, 1000, 1, 50, 10, 0);

insert into public.table_players (table_id, user_id, seat_number, stack)
select t.id, p.user_id::uuid, p.seat_number, p.stack
from public."table" t
join (values
  ('Dummy Table 1', '00000000-0000-0000-0000-000000000001', 0, 1840),
  ('Dummy Table 1', '00000000-0000-0000-0000-000000000002', 1, 2120),
  ('Dummy Table 1', '00000000-0000-0000-0000-000000000003', 2,  980),
  ('Dummy Table 1', '00000000-0000-0000-0000-000000000004', 3, 1560),
  ('Dummy Table 1', '00000000-0000-0000-0000-000000000005', 4, 2450),
  ('Dummy Table 2', '00000000-0000-0000-0000-000000000001', 0,  500),
  ('Dummy Table 2', '00000000-0000-0000-0000-000000000002', 1,  500),
  ('Dummy Table 3', '00000000-0000-0000-0000-000000000003', 0, 1000),
  ('Dummy Table 3', '00000000-0000-0000-0000-000000000004', 1, 1000)
) as p(table_name, user_id, seat_number, stack) on p.table_name = t.name;

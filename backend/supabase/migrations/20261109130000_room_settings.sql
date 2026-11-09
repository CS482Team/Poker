alter table public."table"
  add column chat_enabled boolean not null default true,
  add column turn_timer_enabled boolean not null default false;

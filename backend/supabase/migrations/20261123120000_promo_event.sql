alter table public.event drop constraint event_multiplier_check;
alter table public.event add constraint event_multiplier_check check (multiplier >= 1.1 and multiplier <= 3);

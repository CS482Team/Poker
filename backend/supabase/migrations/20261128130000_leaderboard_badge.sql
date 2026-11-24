-- Leaderboard badges: the top 3 players when a week, month or season ends each keep a badge for it
-- (place 1 gold, 2 silver, 3 bronze). Players tied on a place share it. The backend awards them once
-- a period has closed (see BadgeService). The all-time badge is live, so it isn't stored here.
create table public.leaderboard_badge (
  user_id      uuid        not null references public."user"(id) on delete cascade,
  timeframe    text        not null check (timeframe in ('week', 'month', 'season')),
  period_start timestamptz not null,
  place        smallint    not null check (place between 1 and 3),
  awarded_at   timestamptz not null default now(),
  primary key (user_id, timeframe, period_start)
);

-- No policies: only the backend (service role) reads and writes badges
alter table public.leaderboard_badge enable row level security;

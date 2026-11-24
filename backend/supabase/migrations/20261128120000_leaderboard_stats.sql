-- Leaderboard (#22): each ranked player's current balance and hand totals for a time window, added up in the database
-- so the backend never pulls every hand. Guests and admins are left out; unfinished hands don't count.
-- p_from null means "from the beginning"; the window is [p_from, p_to).
create or replace function public.leaderboard_stats(p_from timestamptz, p_to timestamptz)
returns table (
  user_id      uuid,
  username     text,
  avatar_url   text,
  balance      integer,
  hands_played integer,
  hands_won    integer,
  net_winnings bigint
)
language sql
stable
set search_path = ''
as $$
  select
    u.id,
    u.username,
    u.avatar_url,
    u.chip_balance,
    count(*)::integer,
    (count(*) filter (where mp.net_result > 0))::integer,
    coalesce(sum(mp.net_result), 0)::bigint
  from public.match_players mp
  join public.match m on m.id = mp.match_id
  join public."user" u on u.id = mp.user_id
  where m.ended_at is not null
    and (p_from is null or m.ended_at >= p_from)
    and m.ended_at < p_to
    and not u.is_guest
    and u.role = 0
  group by u.id, u.username, u.avatar_url, u.chip_balance
$$;

-- Only the backend (service role) calls it
revoke execute on function public.leaderboard_stats(timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.leaderboard_stats(timestamptz, timestamptz) to service_role;

-- Range scans on finished hands
create index if not exists match_ended_at_idx on public.match (ended_at);

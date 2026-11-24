-- Friends list (#32): tidy up the friendship table that came with the original schema, before the backend starts using it.
--
-- One row per pair of players, whoever asked first:
--   status 0 = pending: sender_id asked receiver_id, who hasn't answered yet
--   status 1 = accepted: they're friends (both directions)
-- Declining, cancelling and unfriending all delete the row, so either player can ask again later.
-- (Blocking could come back as a new status later; widen friendship_status_valid when it does.)

-- Only the statuses the app uses. The old check was added NOT VALID (existing rows never checked) and allowed 0–3.
-- Nothing has written to this table yet; if this fails, look at the rows with other statuses before deleting anything.
alter table public.friendship drop constraint if exists friendship_status_valid;
alter table public.friendship add constraint friendship_status_valid check (status in (0, 1));

-- The original schema made the same rule twice: keep one "can't friend yourself" check
alter table public.friendship drop constraint if exists friendship_check;

-- ...and the same "one row per pair, in either direction" index twice: keep one
drop index if exists public.friendship_pair_key;

comment on table public.friendship is 'Friend requests and friendships: one row per pair. status 0 = pending (sender asked receiver), 1 = accepted.';
comment on column public.friendship.sender_id is 'Who sent the request';
comment on column public.friendship.receiver_id is 'Who received it, and must accept it';
comment on column public.friendship.status is '0 = pending, 1 = accepted. Declining or removing deletes the row.';

-- Only the backend (service role) touches friendships. RLS with no policies already hides the rows from the browser;
-- this also takes back the table rights the original schema handed to anon and authenticated (including TRUNCATE).
revoke all on table public.friendship from anon, authenticated;

-- Cosmetic shop (S21): catalog, ownership, equipped loadout, atomic purchase
-- The type / rarity / slot lists must match shared/Cosmetics.ts

-- 1. shop_item: make the catalog data-driven
alter table public.shop_item
  alter column item_type set not null,
  add column rarity text not null default 'common',
  add column style jsonb not null default '{}'::jsonb,
  add column is_active boolean not null default true,
  add column sort_order integer not null default 0,
  add constraint shop_item_type_valid
    check (item_type in ('card_back', 'avatar', 'avatar_border', 'name_tag', 'emote', 'theme')),
  add constraint shop_item_rarity_valid
    check (rarity in ('common', 'rare', 'epic', 'legendary')),
  add constraint shop_item_name_key unique (name);

-- cost must be positive (the base schema allowed 0)
alter table public.shop_item
  drop constraint shop_item_cost_check;
alter table public.shop_item
  add constraint shop_item_cost_check check (cost > 0);

-- 2. user_inventory: ownership of items
alter table public.user_inventory
  drop column is_equipped;
-- look up owners by item (admin deletes, "who owns this"); the PK index starts with user_id
create index user_inventory_item_idx on public.user_inventory (item_id);


-- 3. user_loadout: what is equipped, one row per slot
create table public.user_loadout (
  user_id     uuid        not null,
  slot        text        not null,
  item_id     uuid        not null,
  equipped_at timestamptz not null default now(),
  constraint user_loadout_pkey primary key (user_id, slot),
  constraint user_loadout_slot_check check (slot in ('card_back','avatar','avatar_border','name_tag','theme','emote_1','emote_2','emote_3','emote_4')),
  constraint user_loadout_inventory_fkey foreign key (user_id, item_id) references public.user_inventory (user_id, item_id) on delete cascade
);
-- RLS turns on by itself through the ensure_rls event trigger; no policies are needed
-- because only the backend (service_role) reads this table


-- 4. purchase_item: buy one item in a single transaction, returns the new balance
-- Error messages are a contract with ShopService, see PURCHASE_ERRORS in shared/Cosmetics.ts
create or replace function public.purchase_item(p_user uuid, p_item uuid)
returns integer
language plpgsql
set search_path = ''
as $$
declare
  v_cost    integer;
  v_active  boolean;
  v_balance integer;
begin
  -- a. the item must exist and still be on sale
  select cost, is_active into v_cost, v_active
  from public.shop_item
  where id = p_item;

  if not found then
    raise exception 'item_not_found';
  end if;

  if not v_active then
    raise exception 'item_inactive';
  end if;

  -- b. lock the buyer's row so two purchases at once wait in line instead of both spending the same chips
  select chip_balance into v_balance
  from public."user"
  where id = p_user
  for update;

  if not found then
    raise exception 'user_not_found';
  end if;

  -- c. each item can only be owned once
  if exists (select 1 from public.user_inventory where user_id = p_user and item_id = p_item) then
    raise exception 'already_owned';
  end if;

  -- d. enough chips?
  if v_balance < v_cost then
    raise exception 'insufficient_funds';
  end if;

  -- e. take the chips (relative to the stored value) and read back the new balance
  update public."user"
  set chip_balance = chip_balance - v_cost
  where id = p_user
  returning chip_balance into v_balance;

  -- f. grant the item
  insert into public.user_inventory (user_id, item_id)
  values (p_user, p_item);

  -- g. audit trail, reason matches SHOP_PURCHASE_REASON in shared/Rules.ts
  insert into public.balance_log (user_id, delta, reason)
  values (p_user, -v_cost, 'shop_purchase');

  -- h.
  return v_balance;
end;
$$;


-- 5. equip_item: put an owned item into a loadout slot, replacing whatever was there
-- Error messages are a contract with ShopService, see EQUIP_ERRORS in shared/Cosmetics.ts
create or replace function public.equip_item(p_user uuid, p_item uuid, p_slot text)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_type text;
begin
  select item_type into v_type
  from public.shop_item
  where id = p_item;

  if not found then
    raise exception 'item_not_found';
  end if;

  -- emotes go in any wheel slot, everything else only in the slot named after its type
  if (v_type = 'emote' and p_slot not in ('emote_1', 'emote_2', 'emote_3', 'emote_4'))
     or (v_type <> 'emote' and p_slot <> v_type) then
    raise exception 'wrong_slot';
  end if;

  -- the composite FK would also reject this, but this gives ShopService a clear message
  if not exists (select 1 from public.user_inventory where user_id = p_user and item_id = p_item) then
    raise exception 'not_owned';
  end if;

  insert into public.user_loadout (user_id, slot, item_id)
  values (p_user, p_slot, p_item)
  on conflict (user_id, slot)
  do update set item_id = excluded.item_id, equipped_at = now();
end;
$$;


-- 6. Lock down the functions: Postgres lets everyone execute new functions by default,
-- and Supabase exposes public functions to anyone with the anon key. Only the backend may call these.
revoke all on function public.purchase_item(uuid, uuid) from public, anon, authenticated;
grant execute on function public.purchase_item(uuid, uuid) to service_role;

revoke all on function public.equip_item(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.equip_item(uuid, uuid, text) to service_role;

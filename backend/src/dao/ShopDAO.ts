/* database access for the shop: shop_item, user_inventory and user_loadout */
import type { Loadout, LoadoutSlot, ShopItem } from "../../../shared/Cosmetics"
import { getSupabase } from "../config/Supabase"

const ITEM_COLUMNS = "id, name, description, item_type, rarity, cost, asset_url, style"

export async function getActiveItems(): Promise<ShopItem[]> {
  const { data, error } = await getSupabase().from("shop_item").select(ITEM_COLUMNS).eq("is_active", true).order("sort_order")

  if (error) throw error

  return data.map(toShopItem)
}

export async function getOwnedItemIds(userId: string): Promise<string[]> {
  const { data, error } = await getSupabase().from("user_inventory").select("item_id").eq("user_id", userId)

  if (error) throw error

  return data.map((row: { item_id: string }) => row.item_id)
}

/* takes the chips, grants the item and logs it in one transaction; a refusal throws with one of PURCHASE_ERRORS as its message */
export async function purchaseItem(userId: string, itemId: string): Promise<number> {
  const { data, error } = await getSupabase().rpc("purchase_item", { p_user: userId, p_item: itemId })

  if (error) throw error

  return data
}

export async function getInventory(userId: string): Promise<ShopItem[]> {
  const { data, error } = await getSupabase().from("user_inventory").select(`shop_item(${ITEM_COLUMNS})`).eq("user_id", userId).order("acquired_at")

  if (error) throw error

  return data.map((row: any) => toShopItem(row.shop_item))
}

export async function getLoadout(userId: string): Promise<Loadout> {
  const { data, error } = await getSupabase().from("user_loadout").select(LOADOUT_COLUMNS).eq("user_id", userId)

  if (error) throw error

  const loadout: Loadout = {}
  for (const row of data as any[]) addToLoadout(loadout, row)
  return loadout
}

export async function getLoadouts(userIds: string[]): Promise<Record<string, Loadout>> {
  if (userIds.length === 0) return {}

  const { data, error } = await getSupabase().from("user_loadout").select(`user_id, ${LOADOUT_COLUMNS}`).in("user_id", userIds)

  if (error) throw error

  const loadouts: Record<string, Loadout> = {}
  for (const row of data as any[]) addToLoadout((loadouts[row.user_id] ??= {}), row)
  return loadouts
}

// user_loadout points at user_inventory (so only owned items can be equipped), which points at shop_item
const LOADOUT_COLUMNS = `slot, user_inventory(shop_item(${ITEM_COLUMNS}))`

function addToLoadout(loadout: Loadout, row: any) {
  loadout[row.slot as LoadoutSlot] = toShopItem(row.user_inventory.shop_item)
}

/* equip_item checks ownership and that the item fits the slot */
export async function equipItem(userId: string, itemId: string, slot: LoadoutSlot): Promise<void> {
  const { error } = await getSupabase().rpc("equip_item", { p_user: userId, p_item: itemId, p_slot: slot })

  if (error) throw error
}

export async function unequipSlot(userId: string, slot: LoadoutSlot): Promise<void> {
  const { error } = await getSupabase().from("user_loadout").delete().eq("user_id", userId).eq("slot", slot)

  if (error) throw error
}

function toShopItem(row: any): ShopItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    type: row.item_type,
    rarity: row.rarity,
    cost: row.cost,
    assetUrl: row.asset_url,
    style: row.style,
  }
}

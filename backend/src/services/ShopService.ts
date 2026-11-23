/* shop rules, between ShopController (HTTP) and ShopDAO (database) */
import { EQUIP_ERRORS, PURCHASE_ERRORS, type EquipError, type Loadout, type LoadoutSlot, type PublicCosmetics, type PurchaseError, type ShopItem } from "../../../shared/Cosmetics"
import type { Table } from "../../../shared/Table"
import { equipItem, getActiveItems, getInventory, getLoadout, getLoadouts, getOwnedItemIds, purchaseItem, unequipSlot } from "../dao/ShopDAO"

export type ShopErrorCode = PurchaseError | EquipError

/* an expected refusal (not enough chips, not owned...), as opposed to a crash */
export class ShopError extends Error {
  constructor(public readonly code: ShopErrorCode) {
    super(code)
    this.name = "ShopError"
  }
}

export async function listItems(userId: string | null): Promise<ShopItem[]> {
  const items = await getActiveItems()
  if (!userId) return items

  const owned = new Set(await getOwnedItemIds(userId))
  return items.map((item) => ({ ...item, owned: owned.has(item.id) }))
}

export async function buyItem(userId: string, itemId: string): Promise<{ balance: number }> {
  try {
    return { balance: await purchaseItem(userId, itemId) }
  } catch (error) {
    throw asShopError(error, PURCHASE_ERRORS)
  }
}

export async function listInventory(userId: string): Promise<ShopItem[]> {
  const items = await getInventory(userId)
  return items.map((item) => ({ ...item, owned: true }))
}

export async function loadoutOf(userId: string): Promise<Loadout> {
  return getLoadout(userId)
}

export async function equip(userId: string, itemId: string, slot: LoadoutSlot): Promise<void> {
  try {
    await equipItem(userId, itemId, slot)
  } catch (error) {
    throw asShopError(error, EQUIP_ERRORS)
  }
}

export async function unequip(userId: string, slot: LoadoutSlot): Promise<void> {
  await unequipSlot(userId, slot)
}

/* adds what other players can see to each seat; themes are personal and emotes arrive as events */
export async function withCosmetics(table: Table): Promise<Table> {
  const loadouts = await getLoadouts(table.seats.map((seat) => seat.userId))
  return { ...table, seats: table.seats.map((seat) => ({ ...seat, cosmetics: publicCosmetics(loadouts[seat.userId] ?? {}) })) }
}

function publicCosmetics(loadout: Loadout): PublicCosmetics {
  const visible: PublicCosmetics = {}
  for (const slot of PUBLIC_SLOTS) {
    const item = loadout[slot]
    if (item) visible[slot] = item
  }
  return visible
}

const PUBLIC_SLOTS = ["avatar", "avatar_border", "name_tag", "card_back"] as const

/* expected refusals become ShopErrors; anything else is passed on so it answers 500 */
function asShopError(error: unknown, codes: readonly ShopErrorCode[]): unknown {
  const message = (error as { message?: unknown })?.message
  return codes.includes(message as ShopErrorCode) ? new ShopError(message as ShopErrorCode) : error
}

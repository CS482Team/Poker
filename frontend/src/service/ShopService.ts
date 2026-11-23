/* calls to the backend shop API (see backend/src/route/ShopRouter.ts) */
import { authHeaders } from "@/service/AuthService"
import type { EquipError, Loadout, LoadoutSlot, PurchaseError, ShopItem } from "@shared/Cosmetics"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/* `message` is safe to show the player; `code` is set when the server refused for a known reason */
export class ShopRequestError extends Error {
  constructor(message: string, public readonly code?: PurchaseError | EquipError) {
    super(message)
    this.name = "ShopRequestError"
  }
}

export async function fetchShopItems(): Promise<ShopItem[]> {
  const res = await fetch(`${API_URL}/shop/items`, { headers: await authHeaders() })
  if (!res.ok) throw new ShopRequestError(`Failed to load the shop (${res.status})`)
  return res.json()
}

export async function buyItem(itemId: string): Promise<number> {
  const res = await fetch(`${API_URL}/shop/items/${itemId}/purchase`, { method: "POST", headers: await authHeaders() })
  if (res.status === 401) throw new ShopRequestError("Sign in to buy items")
  if (!res.ok) {
    // refusals come back as { error, code }; anything else gets a general message
    const body = await res.json().catch(() => null)
    throw new ShopRequestError(body?.error ?? `Purchase failed (${res.status})`, body?.code)
  }
  const { balance } = await res.json()
  return balance
}

export async function fetchInventory(): Promise<ShopItem[]> {
  return getSignedIn("/shop/inventory", "Couldn't load your items")
}

export async function fetchLoadout(): Promise<Loadout> {
  return getSignedIn("/shop/loadout", "Couldn't load your loadout")
}

/* returns the whole loadout, since moving an emote changes two slots */
export async function equipItem(slot: LoadoutSlot, itemId: string): Promise<Loadout> {
  const res = await fetch(`${API_URL}/shop/loadout/${slot}`, { method: "PUT", headers: await authHeaders(), body: JSON.stringify({ itemId }) })
  if (!res.ok) throw await refusal(res, "Couldn't update your loadout")
  return res.json()
}

export async function unequipSlot(slot: LoadoutSlot): Promise<Loadout> {
  const res = await fetch(`${API_URL}/shop/loadout/${slot}`, { method: "DELETE", headers: await authHeaders() })
  if (!res.ok) throw await refusal(res, "Couldn't update your loadout")
  return res.json()
}

async function getSignedIn<T>(path: string, failMessage: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, { headers: await authHeaders() })
  if (res.status === 401) throw new ShopRequestError("Sign in to see your items")
  if (!res.ok) throw new ShopRequestError(`${failMessage} (${res.status})`)
  return res.json()
}

async function refusal(res: Response, fallback: string): Promise<ShopRequestError> {
  const body = await res.json().catch(() => null)
  return new ShopRequestError(body?.error ?? `${fallback} (${res.status})`, body?.code)
}

const LOADOUT_EVENT = "loadout-changed"

/* lets the navbar avatar and table theme update straight away after equipping */
export function announceLoadout(loadout: Loadout): void {
  window.dispatchEvent(new CustomEvent<Loadout>(LOADOUT_EVENT, { detail: loadout }))
}

export function onLoadoutChange(listener: (loadout: Loadout) => void): () => void {
  const handle = (event: Event) => listener((event as CustomEvent<Loadout>).detail)
  window.addEventListener(LOADOUT_EVENT, handle)
  return () => window.removeEventListener(LOADOUT_EVENT, handle)
}

/* HTTP handling for /shop; the rules live in ShopService */
import type { Request, Response } from "express"
import { LOADOUT_SLOTS, type LoadoutSlot } from "../../../shared/Cosmetics"
import { buyItem, equip, listInventory, listItems, loadoutOf, ShopError, unequip, type ShopErrorCode } from "../services/ShopService"

/* refusals answer { error, code }: a sentence for the player and a code for the frontend */
const REFUSALS: Record<ShopErrorCode, { status: number; message: string }> = {
  item_not_found: { status: 404, message: "That item doesn't exist." },
  user_not_found: { status: 404, message: "We couldn't find your account." },
  item_inactive: { status: 409, message: "That item is no longer for sale." },
  already_owned: { status: 409, message: "You already own this item." },
  insufficient_funds: { status: 402, message: "You don't have enough chips." },
  wrong_slot: { status: 400, message: "That item doesn't go in that slot." },
  not_owned: { status: 403, message: "You don't own that item." },
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getItems(_req: Request, res: Response) {
  res.json(await listItems(res.locals.userId))
}

export async function purchase(req: Request<{ id: string }>, res: Response) {
  // a bad id would only fail inside Postgres as a 500, so catch it here as a 400
  if (!UUID.test(req.params.id)) {
    res.status(400).json({ error: "Invalid item id" })
    return
  }

  try {
    res.json(await buyItem(res.locals.userId, req.params.id))
  } catch (error) {
    refuse(res, error)
  }
}

export async function getInventory(_req: Request, res: Response) {
  res.json(await listInventory(res.locals.userId))
}

export async function getLoadout(_req: Request, res: Response) {
  res.json(await loadoutOf(res.locals.userId))
}

export async function equipSlot(req: Request<{ slot: string }, {}, { itemId?: unknown }>, res: Response) {
  if (!isSlot(req.params.slot)) {
    res.status(400).json({ error: "Invalid slot" })
    return
  }
  const { itemId } = req.body ?? {}
  if (typeof itemId !== "string" || !UUID.test(itemId)) {
    res.status(400).json({ error: "Invalid item id" })
    return
  }

  try {
    await equip(res.locals.userId, itemId, req.params.slot)
    // the whole loadout, since moving an emote changes two slots
    res.json(await loadoutOf(res.locals.userId))
  } catch (error) {
    refuse(res, error)
  }
}

export async function unequipSlot(req: Request<{ slot: string }>, res: Response) {
  if (!isSlot(req.params.slot)) {
    res.status(400).json({ error: "Invalid slot" })
    return
  }
  await unequip(res.locals.userId, req.params.slot)
  res.json(await loadoutOf(res.locals.userId))
}

function isSlot(slot: string): slot is LoadoutSlot {
  return (LOADOUT_SLOTS as readonly string[]).includes(slot)
}

function refuse(res: Response, error: unknown) {
  if (!(error instanceof ShopError)) throw error
  const { status, message } = REFUSALS[error.code]
  res.status(status).json({ error: message, code: error.code })
}

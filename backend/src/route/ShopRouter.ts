/* /shop routes; everything except the catalog needs a signed in player */
import { Router } from "express"
import { equipSlot, getInventory, getItems, getLoadout, purchase, unequipSlot } from "../controller/ShopController"
import { optionalUser } from "../util/OptionalUser"
import { requireUser } from "../util/RequireUser"

export const shopRouter = Router()
shopRouter.get("/items", optionalUser, getItems)
shopRouter.post("/items/:id/purchase", requireUser, purchase)
shopRouter.get("/inventory", requireUser, getInventory)
shopRouter.get("/loadout", requireUser, getLoadout)
shopRouter.put("/loadout/:slot", requireUser, equipSlot)
shopRouter.delete("/loadout/:slot", requireUser, unequipSlot)

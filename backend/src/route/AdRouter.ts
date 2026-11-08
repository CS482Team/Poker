import { Router } from "express"
import { addAd, changeAd, listActiveAds, listAds, removeAd, updateAd } from "../controller/AdController"
import { requireAdmin } from "../util/RequireAdmin"

export const adRouter = Router()
adRouter.get("/active", listActiveAds)
adRouter.use(requireAdmin)
adRouter.get("/", listAds)
adRouter.post("/", addAd)
adRouter.put("/:id", changeAd)
adRouter.patch("/:id", updateAd)
adRouter.delete("/:id", removeAd)

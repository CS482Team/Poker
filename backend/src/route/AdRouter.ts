import { Router } from "express"
import { addAd, listAds, removeAd, updateAd } from "../controller/AdController"
import { requireAdmin } from "../util/RequireAdmin"

export const adRouter = Router()
adRouter.use(requireAdmin)
adRouter.get("/", listAds)
adRouter.post("/", addAd)
adRouter.patch("/:id", updateAd)
adRouter.delete("/:id", removeAd)

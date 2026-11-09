import { Router } from "express"
import { addAd, changeAd, claimAd, listActiveAds, listAds, removeAd, startWatching, updateAd } from "../controller/AdController"
import { requireAdmin } from "../util/RequireAdmin"
import { requireUser } from "../util/RequireUser"

export const adRouter = Router()
adRouter.get("/active", listActiveAds)
adRouter.post("/:id/watch", requireUser, startWatching)
adRouter.post("/:id/claim", requireUser, claimAd)
adRouter.use(requireUser, requireAdmin)
adRouter.get("/", listAds)
adRouter.post("/", addAd)
adRouter.put("/:id", changeAd)
adRouter.patch("/:id", updateAd)
adRouter.delete("/:id", removeAd)

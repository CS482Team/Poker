import { Router } from "express"
import { listPlayerHands, listPlayers, removePlayer, unbanPlayer } from "../controller/AdminController"
import { requireAdmin } from "../util/RequireAdmin"
import { requireUser } from "../util/RequireUser"

export const adminRouter = Router()
adminRouter.use(requireUser, requireAdmin)
adminRouter.get("/", (_, res) => res.status(204).end())
adminRouter.get("/players", listPlayers)
adminRouter.get("/players/:id/hands", listPlayerHands)
adminRouter.delete("/players/:id", removePlayer)
adminRouter.post("/players/:id/unban", unbanPlayer)

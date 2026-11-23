import { Router } from "express"
import { listPlayerHands, listPlayers, modifyChips, removePlayer, resetPassword, showHand, unbanPlayer } from "../controller/AdminController"
import { listReports, showReport } from "../controller/ReportController"
import { requireAdmin } from "../util/RequireAdmin"
import { requireUser } from "../util/RequireUser"

export const adminRouter = Router()
adminRouter.use(requireUser, requireAdmin)
adminRouter.get("/", (_, res) => res.status(204).end())
adminRouter.get("/players", listPlayers)
adminRouter.get("/players/:id/hands", listPlayerHands)
adminRouter.get("/hands/:id", showHand)
adminRouter.get("/reports", listReports)
adminRouter.get("/reports/:id", showReport)
adminRouter.patch("/players/:id/balance", modifyChips)
adminRouter.delete("/players/:id", removePlayer)
adminRouter.post("/players/:id/unban", unbanPlayer)
adminRouter.post("/players/:id/password", resetPassword)

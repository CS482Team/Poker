import { Router } from "express"
import { addEvent, showActiveEvent, stopEvent } from "../controller/EventController"
import { requireAdmin } from "../util/RequireAdmin"
import { requireUser } from "../util/RequireUser"

export const eventRouter = Router()
eventRouter.get("/active", showActiveEvent)
eventRouter.post("/", requireUser, requireAdmin, addEvent)
eventRouter.delete("/:id", requireUser, requireAdmin, stopEvent)

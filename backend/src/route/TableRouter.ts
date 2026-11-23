import { Router } from "express"
import { addTable, getTableById, joinTable, leaveTable, listTables, updateSettings } from "../controller/TableController"
import { requireUser } from "../util/RequireUser"

export const tableRouter = Router()
tableRouter.get("/", listTables)
tableRouter.post("/", requireUser, addTable)
tableRouter.get("/:id", getTableById)
tableRouter.post("/:id/players", requireUser, joinTable)
tableRouter.delete("/:id/players/me", requireUser, leaveTable)
tableRouter.patch("/:id", requireUser, updateSettings)

import { Router } from "express"
import { addTable, getTableById, joinTable, leaveTable, listTables } from "../controller/TableController"

export const tableRouter = Router()
tableRouter.get("/", listTables)
tableRouter.post("/", addTable)
tableRouter.get("/:id", getTableById)
tableRouter.post("/:id/players", joinTable)
tableRouter.delete("/:id/players/:userId", leaveTable)

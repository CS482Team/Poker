import { Router } from "express"
import { addTable, getTableById, listTables } from "../controller/TableController"

export const tableRouter = Router()
tableRouter.get("/", listTables)
tableRouter.post("/", addTable)
tableRouter.get("/:id", getTableById)

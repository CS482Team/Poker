import { Router } from "express"
import { getTableById, listTables } from "../controller/TableController"

export const tableRouter = Router()
tableRouter.get("/", listTables)
tableRouter.get("/:id", getTableById)

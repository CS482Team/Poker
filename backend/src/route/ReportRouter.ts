import { Router } from "express"
import { addReport } from "../controller/ReportController"
import { requireUser } from "../util/RequireUser"

export const reportRouter = Router()
reportRouter.post("/", requireUser, addReport)

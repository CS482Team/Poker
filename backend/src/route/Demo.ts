import { Router } from "express"
import { dealDemoController } from "../controller/Demo"

// TODO: demo only; remove once rooms (S12/S14) and per-player views exist
export const demoRouter = Router()

demoRouter.post("/demo/deal", dealDemoController)
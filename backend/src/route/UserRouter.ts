import { Router } from "express"
import { getUserBalance } from "../controller/UserController"

export const userRouter = Router()
userRouter.get("/:id/balance", getUserBalance)
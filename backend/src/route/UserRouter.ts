import { Router } from "express"
import { getMyHandsHistory, getUserBalance } from "../controller/UserController"

export const userRouter = Router()
userRouter.get("/me/hands", getMyHandsHistory)
userRouter.get("/:id/balance", getUserBalance)
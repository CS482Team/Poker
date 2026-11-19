import { Router } from "express"
import { getMyHandsHistory, getUserBalance, getUserUsername } from "../controller/UserController"

export const userRouter = Router()
userRouter.get("/me/hands", getMyHandsHistory)
userRouter.get("/:id/balance", getUserBalance)
userRouter.get("/:id/username", getUserUsername)
userRouter.get("/me/daily-reward", requireUser, getDailyRewardStatus)
userRouter.post("/me/daily-reward", requireUser, claimDailyReward)

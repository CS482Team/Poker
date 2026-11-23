import { Router } from "express"
import { claimDailyReward, getDailyRewardStatus, getMyBalance, getMyHandsHistory, getUserUsername } from "../controller/UserController"
import { requireUser } from "../util/RequireUser"

export const userRouter = Router()
userRouter.get("/me/hands", getMyHandsHistory)
userRouter.get("/me/balance", requireUser, getMyBalance)
userRouter.get("/me/daily-reward", requireUser, getDailyRewardStatus)
userRouter.post("/me/daily-reward", requireUser, claimDailyReward)
userRouter.get("/:id/username", getUserUsername)

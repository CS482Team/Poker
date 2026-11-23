import { Router } from "express"
import { changeAvatar, changeEmail, changeUsername, claimDailyReward, getDailyRewardStatus, getMe, getMyBalance, getMyHandsHistory, getUserUsername } from "../controller/UserController"
import { requireUser } from "../util/RequireUser"

export const userRouter = Router()
userRouter.get("/me", requireUser, getMe)
userRouter.patch("/me/username", requireUser, changeUsername)
userRouter.patch("/me/avatar", requireUser, changeAvatar)
userRouter.patch("/me/email", requireUser, changeEmail)
userRouter.get("/me/hands", getMyHandsHistory)
userRouter.get("/me/balance", requireUser, getMyBalance)
userRouter.get("/me/daily-reward", requireUser, getDailyRewardStatus)
userRouter.post("/me/daily-reward", requireUser, claimDailyReward)
userRouter.get("/:id/username", getUserUsername)

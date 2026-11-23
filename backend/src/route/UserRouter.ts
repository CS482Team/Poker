import { Router } from "express"
import { getMyHandsHistory, getUserBalance, getUserUsername, getMe, changeUsername, changeAvatar, changeEmail } from "../controller/UserController"
import { requireUser } from "../util/RequireUser"

export const userRouter = Router()
userRouter.get("/me", requireUser, getMe)
userRouter.patch("/me/username", requireUser, changeUsername)
userRouter.patch("/me/avatar", requireUser, changeAvatar)
userRouter.patch("/me/email", requireUser, changeEmail)
userRouter.get("/me/hands", getMyHandsHistory)
userRouter.get("/:id/balance", getUserBalance)
userRouter.get("/:id/username", getUserUsername)

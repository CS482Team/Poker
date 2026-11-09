import { Router } from "express"
import { getUserBalance, getUserUsername } from "../controller/UserController"

export const userRouter = Router()
userRouter.get("/:id/balance", getUserBalance)
userRouter.get("/:id/username", getUserUsername)
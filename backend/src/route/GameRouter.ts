import { Router } from "express"
import { actionController, againController, drawController } from "../controller/GameController"
import { requireUser } from "../util/RequireUser"

export const gameRouter = Router()

gameRouter.post("/game/:gameId/action", requireUser, actionController)
gameRouter.post("/game/:gameId/draw", requireUser, drawController)
gameRouter.post("/game/:gameId/again", requireUser, againController)

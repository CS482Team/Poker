import { Router } from "express"
import { actionController, drawController } from "../controller/GameController"

export const gameRouter = Router()

gameRouter.post("/game/:gameId/action", actionController)
gameRouter.post("/game/:gameId/draw", drawController)

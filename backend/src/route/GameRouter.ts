import { Router } from "express"
import { actionController } from "../controller/GameController"

export const gameRouter = Router()

gameRouter.post("/game/:gameId/action", actionController)

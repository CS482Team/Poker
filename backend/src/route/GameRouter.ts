import { Router } from "express"
import { actionController, playerViewController } from "../controller/GameController"

export const gameRouter = Router()

gameRouter.get("/game/:gameId/view/:playerId", playerViewController)
gameRouter.post("/game/:gameId/action", actionController)

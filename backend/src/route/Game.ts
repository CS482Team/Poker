import { Router } from "express"
import { actionController, playerViewController, startGameController } from "../controller/Game"

export const gameRouter = Router()

gameRouter.post("/game", startGameController)
gameRouter.get("/game/:gameId/view/:playerId", playerViewController)
gameRouter.post("/game/:gameId/action", actionController)
gameRouter.post("/game/:gameId/draw", drawController)
import { Router } from "express"
import { playerViewController, startGameController } from "../controller/Game"

export const gameRouter = Router()

gameRouter.post("/game", startGameController)
gameRouter.get("/game/:gameId/view/:playerId", playerViewController)

import { Router } from "express"
import { playerViewController } from "../controller/GameController"

export const gameRouter = Router()

gameRouter.get("/game/:gameId/view/:playerId", playerViewController)

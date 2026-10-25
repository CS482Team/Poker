import type { Request, Response } from "express"
import type { ActionType, PlayerAction } from "../../../shared/Actions"
import { takeAction } from "../services/GameService"
import type { ActError } from "../services/GameService"
import { sendViews } from "../socket/io"

const ACTION_TYPES: ActionType[] = ["fold", "check", "call", "bet", "raise"]

const ACT_ERROR_STATUS: Record<ActError, number> = {
  "game-not-found": 404,
  "unknown-player": 404,
  "not-your-turn": 409,
  "wrong-phase": 409,
  "illegal-action": 400,
}

// TODO take playerId from the auth token once auth exists
export function actionController(req: Request, res: Response): void {
  const playerId: unknown = req.body?.playerId
  const type: unknown = req.body?.action?.type
  const amount: unknown = req.body?.action?.amount
  const validAmount = amount === undefined || typeof amount === "number"
  if (typeof playerId !== "string" || !ACTION_TYPES.includes(type as ActionType) || !validAmount) {
    res.status(400).json({ error: "invalid-action" })
    return
  }

  const action: PlayerAction = amount === undefined ? { type: type as ActionType } : { type: type as ActionType, amount }
  const result = takeAction(String(req.params.gameId), playerId, action)
  if (!result.ok) {
    res.status(ACT_ERROR_STATUS[result.error]).json({ error: result.error })
    return
  }
  sendViews(result.value.tableId, result.value.players.map(p => p.id))
  res.status(204).end()
}

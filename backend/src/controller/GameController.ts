import type { Request, Response } from "express"
import type { ActionType, PlayerAction } from "../../../shared/Actions"
import { getPlayerView, takeAction } from "../services/GameService"
import type { ActError } from "../services/GameService"
import { sendViews } from "../socket/io"

const ACTION_TYPES: ActionType[] = ["fold", "check", "call", "bet", "raise"]

// HTTP status for each reason an action can be refused
const ACT_ERROR_STATUS: Record<ActError, number> = {
  "game-not-found": 404,
  "player-not-in-game": 404,
  "unknown-player": 404,
  "not-your-turn": 409,
  "wrong-phase": 409,
  "illegal-action": 400,
}

// GET /game/:gameId/view/:playerId
// The game as one player sees it: their own cards only.
export function playerViewController(req: Request, res: Response): void {
  const result = getPlayerView(String(req.params.gameId), String(req.params.playerId))
  if (!result.ok) {
    res.status(404).json({ error: result.error })
    return
  }
  res.json(result.value)
}

// POST /game/:gameId/action  body: { playerId: string, action: { type, amount? } }
//   type: "fold" | "check" | "call" | "bet" | "raise"; amount (bet/raise only): the total to bet this round
// Applies a betting action and returns that player's updated view. The engine checks the amount is allowed.
// TODO: take playerId from the verified Supabase token instead of the body once auth exists (S7)
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
  res.json(result.value)
}

import type { Request, Response } from "express"
import type { ActionType, PlayerAction } from "../../../shared/Actions"
import type { GameState } from "../../../shared/GameState"
import { drawCards, nextHand, takeAction } from "../services/GameService"
import type { ActError, DrawCardsError } from "../services/GameService"
import { sendViews } from "../socket/io"

const NEXT_HAND_DELAY = 5000

export function sendGame(game: GameState) {
  sendViews(game.tableId, game.players.map(p => p.id))
  if (game.phase === "hand-complete") {
    setTimeout(() => dealNextHand(game.tableId).catch(console.error), NEXT_HAND_DELAY)
  }
}

async function dealNextHand(tableId: string) {
  sendViews(tableId, await nextHand(tableId))
}

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
  sendGame(result.value)
  res.status(204).end()
}

const DRAW_ERROR_STATUS: Record<DrawCardsError, number> = {
  "game-not-found": 404,
  "not-your-turn": 409,
  "wrong-phase": 409,
}

function isDiscardList(discard: unknown): discard is number[] {
  return Array.isArray(discard)
    && discard.every(i => Number.isInteger(i) && i >= 0 && i <= 4)
    && new Set(discard).size === discard.length
}

// TODO take playerId from the auth token once auth exists
export function drawController(req: Request, res: Response): void {
  const playerId: unknown = req.body?.playerId
  const discard: unknown = req.body?.discard
  if (typeof playerId !== "string" || !isDiscardList(discard)) {
    res.status(400).json({ error: "invalid-draw" })
    return
  }

  const result = drawCards(String(req.params.gameId), playerId, discard)
  if (!result.ok) {
    res.status(DRAW_ERROR_STATUS[result.error]).json({ error: result.error })
    return
  }
  sendGame(result.value)
  res.status(204).end()
}

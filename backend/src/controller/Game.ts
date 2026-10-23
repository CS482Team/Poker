import type { Request, Response } from "express"
import type { SeatInput } from "../game/GameState"
import { findOrCreateDemoTable } from "../dao/TableDao"
import { DEMO_SEATS } from "../services/Demo"
import { getPlayerView, startGame, StartGameError, takeAction } from "../services/Game"
import type { ActError } from "../services/Game"
import type { ActionType, PlayerAction } from "../game/Betting"

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

// True when the body's seats look like SeatInput[] (ids and names as text, stacks as whole numbers ≥ 0)
function isSeatList(value: unknown): value is SeatInput[] {
  return (
    Array.isArray(value) &&
    value.every(
      s =>
        typeof s === "object" &&
        s !== null &&
        typeof s.id === "string" &&
        typeof s.name === "string" &&
        Number.isInteger(s.stack) &&
        s.stack >= 0,
    )
  )
}

// POST /game  body: { seats?: SeatInput[] }
// Starts a game and deals the first hand. Without seats, uses the demo bots.
export async function startGameController(req: Request, res: Response): Promise<void> {
  const seats: unknown = req.body?.seats ?? DEMO_SEATS
  if (!isSeatList(seats)) {
    res.status(400).json({ error: "invalid-seats" })
    return
  }

  try {
    // TODO: use the room's table and settings once rooms exist (S12/S13)
    const table = await findOrCreateDemoTable()
    res.status(201).json(await startGame(table, seats))
  } catch (err) {
    if (err instanceof StartGameError) {
      res.status(400).json({ error: err.reason })
      return
    }
    console.error("start game failed:", err)
    res.status(500).json({ error: "start-failed" })
  }
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
  res.json(result.value)
}

export function drawController(req: Request, res: Response): void {
    const { playerId, discard } = req.body ?? {}
    // shape check only: a string id, and 0–5 whole numbers between 0 and 4 with no repeats
    if (typeof playerId !== "string" || !isDiscardList(discard)) {
        res.status(400).json({ error: "invalid-draw" })
        return
    }
    const result = drawCards(String(req.params.gameId), playerId, discard)
    if (!result.ok) { res.status(statusFor(result.error)).json({ error: result.error }); return }
    res.json(result.value) // the player's updated view, with new cards
}
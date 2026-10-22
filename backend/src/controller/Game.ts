import type { Request, Response } from "express"
import type { SeatInput } from "../game/GameState"
import { findOrCreateDemoTable } from "../dao/TableDao"
import { DEMO_SEATS } from "../services/Demo"
import { getPlayerView, startGame, StartGameError } from "../services/Game"

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

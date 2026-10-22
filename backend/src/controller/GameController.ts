import type { Request, Response } from "express"
import { getPlayerView } from "../services/GameService"

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

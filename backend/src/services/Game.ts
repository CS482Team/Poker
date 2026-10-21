import type { GameState } from "../../../shared/GameState"
import type { Card } from "../game/Card"
import { createGame, startHand } from "../game/Dealer"
import { getTable } from "../dao/TableDao"

// TODO this file is still free game to replace

const MAX_BETS_PER_ROUND = 4
const games = new Map<string, GameState>()
 
export async function startIfReady(tableId: string): Promise<GameState | null> {
  if (games.has(tableId)) return null
  const table = await getTable(tableId)
  if (!table) return null

  const seats = [...table.seats]
    .sort((a, b) => a.seatNumber - b.seatNumber)
    .map((s) => ({ id: s.userId, name: s.username, stack: s.stack }))

  const config = {
    ante: table.ante,
    smallBet: table.minimumBet,
    bigBet: table.minimumBet * 2,
    maxBetsPerRound: MAX_BETS_PER_ROUND,
  }

  const created = createGame(tableId, seats, config)
  if (!created.ok) return null
  const started = startHand(created.value)
  if (!started.ok) return null

  games.set(tableId, started.value)
  return started.value
}

export function endGame(tableId: string) {
  games.delete(tableId)
}

export function getHand(tableId: string, userId: string): Card[] | null {
  return games.get(tableId)?.players.find((p) => p.id === userId)?.hand ?? null
}

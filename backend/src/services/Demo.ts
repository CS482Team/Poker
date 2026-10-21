import type { Card, Rng } from "../game/Card"
import type { PlayerStatus, SeatInput } from "../game/GameState"
import { findOrCreateDemoTable } from "../dao/TableDao"
import { startGame } from "./Game"
import { gameStore } from "./GameStore"

// TODO: demo only; remove once rooms (S12/S14) and per-player views exist
export const DEMO_SEATS: SeatInput[] = [
  { id: "bot-0", name: "Alice", stack: 100 },
  { id: "bot-1", name: "Bob", stack: 100 },
  { id: "bot-2", name: "Cara", stack: 100 },
  { id: "bot-3", name: "Dan", stack: 100 },
]

export interface DemoPlayer { seat: number; name: string; stack: number; status: PlayerStatus; hand: Card[] }
export interface DemoDeal {
  gameId: string // the game is kept in the game store, so it can be continued (bet, draw)
  matchId: string
  pot: number
  dealerSeat: number
  toActSeat: number | null
  players: DemoPlayer[]
}

// Starts a hand at the demo table with bot players and returns every player's cards
export async function dealDemo(rng?: Rng): Promise<DemoDeal> {
  const table = await findOrCreateDemoTable()
  const { gameId, matchId } = await startGame(table, DEMO_SEATS, rng)

  const game = gameStore.get(gameId)
  if (!game) throw new Error("demo game missing from the store")

  return {
    gameId,
    matchId,
    pot: game.pot,
    dealerSeat: game.dealerIndex,
    toActSeat: game.toActIndex,
    players: game.players.map((p, seat) => ({ seat, name: p.name, stack: p.stack, status: p.status, hand: p.hand })),
  }
}

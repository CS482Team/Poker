import { createGame, startHand } from "../game/Dealer"
import type { Card, Rng } from "../game/Card"
import type { PlayerStatus, SeatInput, TableConfig } from "../game/GameState"
import { findOrCreateDemoTable } from "../model/Table"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../model/Match"


// TODO: demo only; remove once rooms (S12/S14) and per-player views exist
const DEMO_SEATS: SeatInput[] = [
  { id: "bot-0", name: "Alice", stack: 100 },
  { id: "bot-1", name: "Bob", stack: 100 },
  { id: "bot-2", name: "Cara", stack: 100 },
  { id: "bot-3", name: "Dan", stack: 100 },
]
const MAX_BETS_PER_ROUND = 4

export interface DemoPlayer { seat: number; name: string; stack: number; status: PlayerStatus; hand: Card[] }
export interface DemoDeal { matchId: string; pot: number; dealerSeat: number; toActSeat: number | null; players: DemoPlayer[] }

// Starts a hand at the demo table with bot players, saves it, and returns every player's cards
export async function dealDemo(rng?: Rng): Promise<DemoDeal> {
  const table = await findOrCreateDemoTable()
  const config: TableConfig = {
    ante: table.ante,
    smallBet: table.minimum_bet,
    bigBet: table.minimum_bet * 2,
    maxBetsPerRound: MAX_BETS_PER_ROUND,
  }

  const created = createGame(table.id, DEMO_SEATS, config)
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, rng)
  if (!started.ok) throw new Error(started.error)
  const game = started.value

  const matchNumber = await nextMatchNumber(table.id)
  const matchId = await insertMatch({
    tableId: table.id,
    matchNumber,
    pot: game.pot,
    dealerSeat: game.dealerIndex,
  })
  await insertMatchPlayers(matchId, game.players.map((p, seat) => ({ seatNumber: seat, userId: null, botName: p.name })))

  return {
    matchId,
    pot: game.pot,
    dealerSeat: game.dealerIndex,
    toActSeat: game.toActIndex,
    players: game.players.map((p, seat) => ({ seat, name: p.name, stack: p.stack, status: p.status, hand: p.hand })),
  }
}
import { createGame, startHand } from "../game/Dealer"
import type { Rng } from "../../../shared/Card"
import type { GameState, PlayerId, Result, SeatInput, StartError, TableConfig } from "../../../shared/GameState"
import type { PlayerView } from "../../../shared/PlayerView"
import type { Table } from "../../../shared/Table"
import { getTable } from "../dao/TableDAO"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import { gameDAO } from "../dao/GameDAO"
import { applyAction, getLegalActions } from "../game/Betting"
import type { ActionError } from "../game/Betting"
import type { PlayerAction } from "../../../shared/Actions"
import { applyDraw } from "../game/Drawer"
import type { DrawError } from "../game/Drawer"
import { scoreHands } from "../game/Ender"

// Table settings from the database → the engine's config
export function configForTable(table: Pick<Table, "ante" | "minimumBet">): TableConfig {
  return {
    ante: table.ante,
    minBet: Math.max(1, table.minimumBet), // the column defaults to 0; a bet must be at least 1 chip
  }
}

// Creates a game at a table, deals the first hand, keeps it in the game store,
// and saves the match rows.
export async function startGame(table: Pick<Table, "id" | "ante" | "minimumBet">, seats: SeatInput[], rng?: Rng): Promise<Result<GameState, StartError>> {
  const created = createGame(table.id, seats, configForTable(table))
  if (!created.ok) return created
  const started = startHand(created.value, rng)
  if (!started.ok) return started
  const game = started.value

  gameDAO.save(game)

  const matchNumber = await nextMatchNumber(table.id)
  const matchId = await insertMatch({ tableId: table.id, matchNumber, pot: game.pot, dealerSeat: game.dealerIndex })
  // TODO bots need a name, not a user id
  await insertMatchPlayers(matchId, game.players.map((p, seat) => ({ seatNumber: seat, userId: p.id, botName: null })))

  return started
}

export function getTableView(tableId: string, userId: PlayerId): PlayerView | null {
  const game = gameDAO.findByTable(tableId)
  return game ? toPlayerView(game, userId) : null
}

function toPlayerView(game: GameState, playerId: PlayerId): PlayerView | null {
  const seat = game.players.findIndex(p => p.id === playerId)
  const me = game.players[seat]
  if (!me) return null

  return {
    gameId: game.id,
    tableId: game.tableId,
    phase: game.phase,
    pot: game.pot,
    handNumber: game.handNumber,
    dealerSeat: game.dealerIndex,
    toActSeat: game.toActIndex,
    round: game.round,
    you: { seat, hand: me.hand, legalActions: getLegalActions(game, playerId) },
    players: game.players.map((p, i) => ({
      seat: i,
      id: p.id,
      name: p.name,
      stack: p.stack,
      status: p.status,
      betThisRound: p.betThisRound,
      cardCount: p.hand.length,
    })),
    winners: game.winners,
  }
}

// TODO save antes to player stacks
export async function startIfReady(tableId: string): Promise<PlayerId[] | null> {
  if (gameDAO.findByTable(tableId)) return null
  const table = await getTable(tableId)
  if (!table) return null

  const seats = [...table.seats]
    .sort((a, b) => a.seatNumber - b.seatNumber)
    .map(s => ({ id: s.userId, name: s.username, stack: s.stack }))
  const started = await startGame(table, seats)
  return started.ok ? seats.map(s => s.id) : null
}

export function endGame(tableId: string) {
  const game = gameDAO.findByTable(tableId)
  if (game) gameDAO.delete(game.id)
}

export type ActError = "game-not-found" | ActionError

export function takeAction(gameId: string, playerId: PlayerId, action: PlayerAction): Result<GameState, ActError> {
  const game = gameDAO.get(gameId)
  if (!game) return { ok: false, error: "game-not-found" }

  const result = applyAction(game, playerId, action)
  if (result.ok) gameDAO.save(finishIfShowdown(result.value))
  return result
}

export type DrawCardsError = "game-not-found" | DrawError

export function drawCards(gameId: string, playerId: PlayerId, discard: number[]): Result<GameState, DrawCardsError> {
  const game = gameDAO.get(gameId)
  if (!game) return { ok: false, error: "game-not-found" }

  const result = applyDraw(game, playerId, discard)
  if (result.ok) gameDAO.save(finishIfShowdown(result.value))
  return result
}

function finishIfShowdown(game: GameState): GameState {
  // TODO save stacks to table_players so leaving cashes out the right amount
  if (game.phase === "showdown") scoreHands(game)
  return game
}

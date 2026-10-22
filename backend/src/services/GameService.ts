import { createGame, startHand } from "../game/Dealer"
import type { Rng } from "../../../shared/Card"
import type { PlayerId, Result, SeatInput, StartError, TableConfig } from "../../../shared/GameState"
import type { PlayerView, ViewError } from "../../../shared/PlayerView"
import type { Table } from "../../../shared/Table"
import { getTable } from "../dao/TableDAO"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import { gameDAO } from "../dao/GameDAO"

const MAX_BETS_PER_ROUND = 4 // fixed-limit: one bet + three raises

// Table settings from the database → the engine's config
export function configForTable(table: Pick<Table, "ante" | "minimumBet">): TableConfig {
  return {
    ante: table.ante,
    smallBet: table.minimumBet,
    bigBet: table.minimumBet * 2,
    maxBetsPerRound: MAX_BETS_PER_ROUND,
  }
}

export interface StartedGame { gameId: string; matchId: string }

// Creates a game at a table, deals the first hand, keeps it in the game store,
// and saves the match rows. Throws if the seats can't start a hand.
export async function startGame(table: Pick<Table, "id" | "ante" | "minimumBet">, seats: SeatInput[], rng?: Rng): Promise<StartedGame> {
  const created = createGame(table.id, seats, configForTable(table))
  if (!created.ok) throw new StartGameError(created.error)
  const started = startHand(created.value, rng)
  if (!started.ok) throw new StartGameError(started.error)
  const game = started.value

  gameDAO.save(game)

  const matchNumber = await nextMatchNumber(table.id)
  const matchId = await insertMatch({ tableId: table.id, matchNumber, pot: game.pot, dealerSeat: game.dealerIndex })
  // TODO bots need a name, not a user id
  await insertMatchPlayers(matchId, game.players.map((p, seat) => ({ seatNumber: seat, userId: p.id, botName: null })))

  return { gameId: game.id, matchId }
}

// A rule from the engine (e.g. too few players) stopped the game from starting
export class StartGameError extends Error {
  constructor(public readonly reason: StartError) {
    super(reason)
  }
}

// The game as seen by one player (never includes the deck or other players' cards)
export function getPlayerView(gameId: string, playerId: PlayerId): Result<PlayerView, ViewError> {
  const game = gameDAO.get(gameId)
  if (!game) return { ok: false, error: "game-not-found" }

  const seat = game.players.findIndex(p => p.id === playerId)
  const me = game.players[seat]
  if (!me) return { ok: false, error: "player-not-in-game" }

  return {
    ok: true,
    value: {
      gameId: game.id,
      phase: game.phase,
      pot: game.pot,
      handNumber: game.handNumber,
      dealerSeat: game.dealerIndex,
      toActSeat: game.toActIndex,
      round: game.round,
      you: { seat, hand: me.hand },
      players: game.players.map((p, i) => ({
        seat: i,
        id: p.id,
        name: p.name,
        stack: p.stack,
        status: p.status,
        betThisRound: p.betThisRound,
        cardCount: p.hand.length,
      })),
    },
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
  try {
    await startGame(table, seats)
    return seats.map(s => s.id)
  } catch (err) {
    if (err instanceof StartGameError) return null
    throw err
  }
}

export function endGame(tableId: string) {
  const game = gameDAO.findByTable(tableId)
  if (game) gameDAO.delete(game.id)
}

export function getTableView(tableId: string, userId: PlayerId): PlayerView | null {
  const game = gameDAO.findByTable(tableId)
  const view = game ? getPlayerView(game.id, userId) : null
  return view?.ok ? view.value : null
}

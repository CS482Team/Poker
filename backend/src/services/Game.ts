import { createGame, startHand } from "../game/Dealer"
import type { Card, Rng } from "../game/Card"
import type { BettingRound, Phase, PlayerId, PlayerStatus, Result, SeatInput, StartError, TableConfig } from "../game/GameState"
import type { TableRow } from "../dao/TableDao"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDao"
import { applyAction, getLegalActions } from "../game/Betting"
import type { ActionError, LegalAction, PlayerAction } from "../game/Betting"
import { gameStore } from "./GameStore"

// Table settings from the database → the engine's config
export function configForTable(table: TableRow): TableConfig {
  return {
    ante: table.ante,
    minBet: Math.max(1, table.minimum_bet), // the column defaults to 0; a bet must be at least 1 chip
  }
}

export interface StartedGame { gameId: string; matchId: string }

// Creates a game at a table, deals the first hand, keeps it in the game store,
// and saves the match rows. Throws if the seats can't start a hand.
export async function startGame(table: TableRow, seats: SeatInput[], rng?: Rng): Promise<StartedGame> {
  const created = createGame(table.id, seats, configForTable(table))
  if (!created.ok) throw new StartGameError(created.error)
  const started = startHand(created.value, rng)
  if (!started.ok) throw new StartGameError(started.error)
  const game = started.value

  gameStore.save(game)

  const matchNumber = await nextMatchNumber(table.id)
  const matchId = await insertMatch({ tableId: table.id, matchNumber, pot: game.pot, dealerSeat: game.dealerIndex })
  // TODO: seats are all stored as bots until auth/rooms give real user ids (S7/S14)
  await insertMatchPlayers(matchId, game.players.map((p, seat) => ({ seatNumber: seat, userId: null, botName: p.name })))

  return { gameId: game.id, matchId }
}

// A rule from the engine (e.g. too few players) stopped the game from starting
export class StartGameError extends Error {
  constructor(public readonly reason: StartError) {
    super(reason)
  }
}

// What one player is allowed to see: their own cards, and only card counts for everyone else
export interface PublicPlayer {
  seat: number
  id: PlayerId
  name: string
  stack: number
  status: PlayerStatus
  betThisRound: number
  cardCount: number
}

export interface PlayerView {
  gameId: string
  phase: Phase
  pot: number
  handNumber: number
  dealerSeat: number
  toActSeat: number | null
  round: BettingRound | null
  you: { seat: number; hand: Card[]; legalActions: LegalAction[] } // legalActions is empty when it isn't your turn
  players: PublicPlayer[]
}

export type ViewError = "game-not-found" | "player-not-in-game"

// The game as seen by one player (never includes the deck or other players' cards)
export function getPlayerView(gameId: string, playerId: PlayerId): Result<PlayerView, ViewError> {
  const game = gameStore.get(gameId)
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
    },
  }
}

export type ActError = ViewError | ActionError

// Applies a betting action (check, call, bet, raise, fold) to a stored game and returns the player's updated view
export function takeAction(gameId: string, playerId: PlayerId, action: PlayerAction): Result<PlayerView, ActError> {
  const game = gameStore.get(gameId)
  if (!game) return { ok: false, error: "game-not-found" }

  const result = applyAction(game, playerId, action)
  if (!result.ok) return result

  gameStore.save(result.value)
  return getPlayerView(gameId, playerId)
}

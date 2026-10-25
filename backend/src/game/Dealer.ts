import { randomUUID } from "crypto"
import type { GameState, PlayerState, Result, SeatInput, StartError, TableConfig } from "../../../shared/GameState"
import { createDeck, shuffle } from "./Deck"
import type { Rng } from "../../../shared/Card"
import { nextSeat } from "./Turn"
import { MAX_PLAYERS, MIN_PLAYERS } from "../../../shared/Rules"

const HAND_SIZE = 5

export function createGame(
  tableId: string,
  seats: SeatInput[],
  config: TableConfig,
): Result<GameState, StartError> {
  if (seats.length < MIN_PLAYERS) return { ok: false, error: "too-few-players" }
  if (seats.length > MAX_PLAYERS) return { ok: false, error: "too-many-players" }

  const players: PlayerState[] = seats.map(seat => ({
    id: seat.id,
    name: seat.name,
    stack: seat.stack,
    hand: [],
    status: "active",
    betThisRound: 0,
    totalContributed: 0,
    hasActed: false,
  }))

  return {
    ok: true,
    value: {
      id: randomUUID(),
      tableId,
      config,
      players,
      dealerIndex: 0,
      toActIndex: null,
      phase: "waiting",
      deck: [],
      pot: 0,
      round: null,
      handNumber: 0,
    },
  }
}

export function startHand(state: GameState, rng: Rng = Math.random): Result<GameState, StartError> {
  // 1. Only start a hand when no hand is in progress
  if (state.phase !== "waiting" && state.phase !== "hand-complete") {
    return { ok: false, error: "wrong-phase" }
  }

  // 2. Fresh copy of every player for the new hand; anyone with no chips sits out
  const players = state.players.map((p): PlayerState => ({
    ...p,
    hand: [],
    status: p.stack > 0 ? "active" : "sitting-out",
    betThisRound: 0,
    totalContributed: 0,
    hasActed: false,
  }))
  const inHand = (p: PlayerState) => p.status !== "sitting-out"
  if (players.filter(inHand).length < MIN_PLAYERS) return { ok: false, error: "too-few-players" }

  // 3. Move the dealer button (the first hand starts the search before seat 0, so seat 0 deals if it can)
  const from = state.handNumber === 0 ? -1 : state.dealerIndex
  const dealerIndex = nextSeat(players, from, inHand)!

  // 4. Antes: everyone in the hand pays the ante, or all their chips if they have less
  let pot = 0
  for (const p of players) {
    if (!inHand(p)) continue
    const ante = Math.min(state.config.ante, p.stack)
    p.stack -= ante
    p.totalContributed += ante
    pot += ante
    if (p.stack === 0) p.status = "all-in"
  }

  // 5. Deal 5 cards each, one at a time, starting left of the dealer
  const deck = shuffle(createDeck(), rng)
  for (let card = 0; card < HAND_SIZE; card++) {
    for (let step = 1; step <= players.length; step++) {
      const p = players[(dealerIndex + step) % players.length]!
      if (inHand(p)) p.hand.push(deck.pop()!)
    }
  }

  // 6. Start the pre-draw betting round (S2 will replace this with startBettingRound)
  return {
    ok: true,
    value: {
      ...state,
      players,
      dealerIndex,
      toActIndex: nextSeat(players, dealerIndex, p => p.status === "active"),
      phase: "predraw-betting",
      deck,
      pot,
      round: { street: "predraw", betSize: state.config.smallBet, currentBet: 0, betsMade: 0 },
      handNumber: state.handNumber + 1,
    },
  }
}

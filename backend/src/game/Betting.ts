import type { GameState, PlayerId, PlayerState, Result, Street } from "./GameState"
import { advanceTurn, firstToAct, isInHand, isPlayersTurn } from "./Turn"

// Fixed-limit betting (S2). Amounts are never chosen by the player:
// a bet or raise is always one bet size (small bet before the draw, big bet after).

export type ActionType = "fold" | "check" | "call" | "bet" | "raise"
export interface PlayerAction { type: ActionType }
export interface LegalAction { type: ActionType; amount: number } // chips this action costs the player (0 for fold/check)
export type ActionError = "wrong-phase" | "unknown-player" | "not-your-turn" | "illegal-action"

// Can still put chips in this round (folded, all-in and sitting-out players can't)
const canBet = (p: PlayerState) => p.status === "active"

// Still has to act: hasn't acted since the last bet/raise, or hasn't matched the current bet
const stillToAct = (currentBet: number) => (p: PlayerState) =>
  canBet(p) && (!p.hasActed || p.betThisRound < currentBet)

const isBettingPhase = (state: GameState) => state.phase === "predraw-betting" || state.phase === "postdraw-betting"

// Starts a betting round: fresh per-round bets, the right bet size, and the first active player left of the dealer.
// Called by startHand's caller for pre-draw and by the draw (S3) for post-draw.
export function startBettingRound(state: GameState, street: Street): GameState {
  const next: GameState = {
    ...state,
    phase: street === "predraw" ? "predraw-betting" : "postdraw-betting",
    players: state.players.map(p => ({ ...p, betThisRound: 0, hasActed: false })),
    round: {
      street,
      betSize: street === "predraw" ? state.config.smallBet : state.config.bigBet,
      currentBet: 0,
      betsMade: 0,
    },
  }
  // Nobody to bet against (everyone else folded or all-in): skip straight past this round
  if (next.players.filter(canBet).length < 2) return endRound(next)
  return { ...next, toActIndex: firstToAct(next, canBet) }
}

// What the player may do right now, with the chip cost of each. Empty when it isn't their turn.
export function getLegalActions(state: GameState, playerId: PlayerId): LegalAction[] {
  const round = state.round
  if (!isBettingPhase(state) || !round || !isPlayersTurn(state, playerId)) return []
  const p = state.players.find(pl => pl.id === playerId)!

  const toCall = round.currentBet - p.betThisRound
  const canRaise = round.betsMade < state.config.maxBetsPerRound
  const actions: LegalAction[] = [{ type: "fold", amount: 0 }]

  if (toCall === 0) {
    actions.push({ type: "check", amount: 0 })
    if (canRaise) actions.push({ type: round.betsMade === 0 ? "bet" : "raise", amount: Math.min(round.betSize, p.stack) })
  } else {
    actions.push({ type: "call", amount: Math.min(toCall, p.stack) }) // less than toCall = all-in for less
    if (canRaise && p.stack > toCall) actions.push({ type: "raise", amount: Math.min(toCall + round.betSize, p.stack) })
  }
  return actions
}

// Applies one player's action. Returns the new state, or why the action isn't allowed.
export function applyAction(state: GameState, playerId: PlayerId, action: PlayerAction): Result<GameState, ActionError> {
  if (!isBettingPhase(state) || !state.round) return { ok: false, error: "wrong-phase" }
  const seat = state.players.findIndex(p => p.id === playerId)
  if (seat < 0) return { ok: false, error: "unknown-player" }
  if (!isPlayersTurn(state, playerId)) return { ok: false, error: "not-your-turn" }

  const legal = getLegalActions(state, playerId).find(a => a.type === action.type)
  if (!legal) return { ok: false, error: "illegal-action" }

  const players = state.players.map(p => ({ ...p }))
  const me = players[seat]!
  const round = { ...state.round }
  let pot = state.pot

  if (action.type === "fold") me.status = "folded"

  if (legal.amount > 0) {
    me.stack -= legal.amount
    me.betThisRound += legal.amount
    me.totalContributed += legal.amount
    pot += legal.amount
    if (me.stack === 0) me.status = "all-in"
  }

  if (action.type === "bet" || action.type === "raise") {
    round.currentBet = me.betThisRound
    round.betsMade += 1
    // A bet or raise reopens the action: everyone else has to respond again
    for (const p of players) if (p !== me) p.hasActed = false
  }
  me.hasActed = true

  const next: GameState = { ...state, players, round, pot }
  if (players.filter(isInHand).length <= 1) return { ok: true, value: endRound(next) } // everyone else folded
  if (!players.some(stillToAct(round.currentBet))) return { ok: true, value: endRound(next) }
  return { ok: true, value: advanceTurn(next, stillToAct(round.currentBet)) }
}

// Closes the betting round: to the draw after pre-draw, to showdown after post-draw
// or when only one player is left in the hand (S4 pays out the pot).
function endRound(state: GameState): GameState {
  const onePlayerLeft = state.players.filter(isInHand).length <= 1
  if (onePlayerLeft || state.round?.street === "postdraw") {
    return { ...state, phase: "showdown", round: null, toActIndex: null }
  }
  // Draw (S3): everyone still in the hand draws in turn, starting left of the dealer (all-in players draw too)
  const players = state.players.map(p => ({ ...p, hasActed: false }))
  const next: GameState = { ...state, phase: "draw", round: null, players }
  return { ...next, toActIndex: firstToAct(next, isInHand) }
}

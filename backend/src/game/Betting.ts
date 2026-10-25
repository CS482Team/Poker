import type { LegalAction, PlayerAction } from "../../../shared/Actions"
import type { GameState, PlayerId, PlayerState, Result, Street } from "../../../shared/GameState"
import { advanceTurn, firstToAct, isInHand, isPlayersTurn } from "./Turn"

// No-limit betting (S2). Players choose how much to bet or raise, from the minimum up to their whole stack.
// Bet/raise amounts are "to" amounts: the player's total bet for this round after the action.

export type ActionError = "wrong-phase" | "unknown-player" | "not-your-turn" | "illegal-action"

// Can still put chips in this round (folded, all-in and sitting-out players can't)
const canBet = (p: PlayerState) => p.status === "active"

// Still has to act: hasn't acted since the last full bet/raise, or hasn't matched the current bet
const stillToAct = (currentBet: number) => (p: PlayerState) =>
  canBet(p) && (!p.hasActed || p.betThisRound < currentBet)

const isBettingPhase = (state: GameState) => state.phase === "predraw-betting" || state.phase === "postdraw-betting"

// Starts a betting round: fresh per-round bets, the table's minimum bet, and the first active player left of the dealer.
// Used for pre-draw and by the draw (S3) for post-draw.
export function startBettingRound(state: GameState, street: Street): GameState {
  const next: GameState = {
    ...state,
    phase: street === "predraw" ? "predraw-betting" : "postdraw-betting",
    players: state.players.map(p => ({ ...p, betThisRound: 0, hasActed: false })),
    round: { street, currentBet: 0, minRaise: state.config.minBet },
  }
  // Nobody to bet against (everyone else folded or all-in): skip straight past this round
  if (next.players.filter(canBet).length < 2) return endRound(next)
  return { ...next, toActIndex: firstToAct(next, canBet) }
}

// What the player may do right now. Empty when it isn't their turn.
export function getLegalActions(state: GameState, playerId: PlayerId): LegalAction[] {
  const round = state.round
  if (!isBettingPhase(state) || !round || !isPlayersTurn(state, playerId)) return []
  const p = state.players.find(pl => pl.id === playerId)!

  const toCall = round.currentBet - p.betThisRound
  const allIn = p.betThisRound + p.stack // the most this player can have bet this round
  const actions: LegalAction[] = [{ type: "fold" }]

  if (toCall === 0) {
    actions.push({ type: "check" })
    if (round.currentBet === 0 && p.stack > 0) {
      actions.push({ type: "bet", min: Math.min(state.config.minBet, allIn), max: allIn })
    }
    return actions
  }

  actions.push({ type: "call", amount: Math.min(toCall, p.stack) })
  // Raising needs chips beyond the call, and the action must be open to this player:
  // anyone who already acted can only raise again after a full raise (a short all-in doesn't reopen it)
  if (p.stack > toCall && !p.hasActed) {
    actions.push({ type: "raise", min: Math.min(round.currentBet + round.minRaise, allIn), max: allIn })
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

  // How many chips go in, and the player's bet total afterwards
  let chips = 0
  if (legal.type === "call") chips = legal.amount
  if (legal.type === "bet" || legal.type === "raise") {
    const to = action.amount
    if (to === undefined || !Number.isInteger(to) || to < legal.min || to > legal.max) {
      return { ok: false, error: "illegal-action" }
    }
    chips = to - me.betThisRound
  }

  if (action.type === "fold") me.status = "folded"
  me.stack -= chips
  me.betThisRound += chips
  me.totalContributed += chips
  if (me.stack === 0 && chips > 0) me.status = "all-in"

  if (legal.type === "bet" || legal.type === "raise") {
    const raiseBy = me.betThisRound - round.currentBet
    round.currentBet = me.betThisRound
    if (raiseBy >= round.minRaise) {
      // A full bet/raise sets the new minimum raise and reopens the action for everyone else
      round.minRaise = raiseBy
      for (const p of players) if (p !== me) p.hasActed = false
    }
    // A short all-in raise: others must still match it, but players who already acted can't re-raise
  }
  me.hasActed = true

  const next: GameState = { ...state, players, round, pot: state.pot + chips }
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

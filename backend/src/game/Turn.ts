import type { GameState, PlayerId, PlayerState } from "../../../shared/GameState"

// Turn order helpers shared by betting (S2) and the draw (S3).
// Each takes a `canAct` rule, so the same helpers work for both:
//   betting: p => p.status === "active" && …   draw: p => isInHand(p) && !p.hasActed

// Index of the next seat after `from` (wrapping around the table) whose player passes `check`, or null if nobody does
export function nextSeat(players: PlayerState[], from: number, check: (p: PlayerState) => boolean): number | null {
  for (let step = 1; step <= players.length; step++) {
    const i = (from + step) % players.length
    if (check(players[i]!)) return i
  }
  return null
}

// Still part of this hand: hasn't folded or sat out (all-in players are still in; they just can't bet)
export function isInHand(p: PlayerState): boolean {
  return p.status === "active" || p.status === "all-in"
}

// First player left of the dealer who passes `canAct` (where betting rounds and the draw start), or null
export function firstToAct(state: GameState, canAct: (p: PlayerState) => boolean): number | null {
  return nextSeat(state.players, state.dealerIndex, canAct)
}

// True only for the player whose turn it is
export function isPlayersTurn(state: GameState, playerId: PlayerId): boolean {
  if (state.toActIndex === null) return false
  return state.players[state.toActIndex]?.id === playerId
}

// Passes the turn to the next player after the current one who passes `canAct`;
// toActIndex becomes null when nobody can act. Update the acting player (e.g. hasActed) before calling.
export function advanceTurn(state: GameState, canAct: (p: PlayerState) => boolean): GameState {
  const from = state.toActIndex ?? state.dealerIndex
  return { ...state, toActIndex: nextSeat(state.players, from, canAct) }
}

import type { GameState, PlayerId, Result } from "../../../shared/GameState"
import { startBettingRound } from "./Betting"
import { advanceTurn, isInHand, isPlayersTurn } from "./Turn"

export type DrawError = "wrong-phase" | "not-your-turn"

export function applyDraw(state: GameState, playerId: PlayerId, discard: number[]): Result<GameState, DrawError> {
  if (state.phase !== "draw") return { ok: false, error: "wrong-phase" }
  if (!isPlayersTurn(state, playerId)) return { ok: false, error: "not-your-turn" }

  const deck = [...state.deck]
  const players = state.players.map(p => ({ ...p }))
  const me = players.find(p => p.id === playerId)!

  me.hand = me.hand.map((card, i) => (discard.includes(i) ? deck.pop()! : card))
  me.hasActed = true

  const next = advanceTurn({ ...state, deck, players }, p => isInHand(p) && !p.hasActed)
  if (next.toActIndex === null) return { ok: true, value: startBettingRound(next, "postdraw") }
  return { ok: true, value: next }
}

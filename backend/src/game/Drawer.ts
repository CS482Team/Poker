import type { GameState, PlayerState, Result, SeatInput, TableConfig } from "./GameState"

export function applyDraw(state: GameState, playerId: PlayerId, discard: number[]): Result<GameState, DrawError> {
    // 1. Is a draw allowed right now, by this player?
    if (state.phase !== "draw") return { ok: false, error: "wrong-phase" }
    if (!isPlayersTurn(state, playerId)) return { ok: false, error: "not-your-turn" }

    // 2. Copy what we'll change, so the input is never touched
    const deck = [...state.deck]
    const players = state.players.map(p => ({ ...p }))
    const me = players.find(p => p.id === playerId)!

    // 3. Swap each discarded position for a card off the top of the deck (the end of the array)
    me.hand = me.hand.map((card, i) => (discard.includes(i) ? deck.pop()! : card))
    me.hasActed = true // this player has drawn

    // 4. Next drawer, or start the post-draw betting when everyone's done
    const next = advanceTurn({ ...state, deck, players }, p => isInHand(p) && !p.hasActed)
    if (next.toActIndex === null) return { ok: true, value: startBettingRound(next, "postdraw") }
    return { ok: true, value: next }
}
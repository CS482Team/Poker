import { applyAction } from "../../src/game/Betting"
import { createGame, startHand } from "../../src/game/Dealer"
import { applyDraw } from "../../src/game/Drawer"
import type { GameState } from "../../../shared/GameState"

function atDraw(): GameState {
  const created = createGame("t1", [
    { id: "a", name: "Alice", stack: 100 },
    { id: "b", name: "Bob", stack: 100 },
  ], { ante: 1, minBet: 2 })
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, () => 0.5)
  if (!started.ok) throw new Error(started.error)
  let state = started.value
  for (const id of ["b", "a"]) {
    const result = applyAction(state, id, { type: "check" })
    if (!result.ok) throw new Error(result.error)
    state = result.value
  }
  return state
}

describe("applyDraw", () => {
  it("swaps the chosen cards for cards off the deck", () => {
    const state = atDraw()
    const result = applyDraw(state, "b", [0, 1])
    if (!result.ok) throw new Error(result.error)
    const bob = result.value.players.find(p => p.id === "b")!
    expect(bob.hand.slice(2)).toEqual(state.players[1]!.hand.slice(2))
    expect(bob.hand[0]).toEqual(state.deck[state.deck.length - 1])
    expect(result.value.deck.length).toBe(state.deck.length - 2)
  })

  it("starts post-draw betting once everyone has drawn", () => {
    const first = applyDraw(atDraw(), "b", [])
    if (!first.ok) throw new Error(first.error)
    const second = applyDraw(first.value, "a", [])
    expect(second.ok && second.value.phase).toBe("postdraw-betting")
  })

  it("rejects a draw out of turn", () => {
    expect(applyDraw(atDraw(), "a", [])).toEqual({ ok: false, error: "not-your-turn" })
  })

  it("rejects a draw outside the draw phase", () => {
    expect(applyDraw({ ...atDraw(), phase: "showdown" }, "b", [])).toEqual({ ok: false, error: "wrong-phase" })
  })
})

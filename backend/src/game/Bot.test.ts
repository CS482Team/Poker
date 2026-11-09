import { applyAction } from "../game/Betting"
import { botBet, botDiscard } from "../game/Bot"
import { createGame, startHand } from "../game/Dealer"
import type { Card, Rank, Suit } from "../../../shared/Card"
import type { GameState } from "../../../shared/GameState"

const card = (rank: Rank, suit: Suit = "hearts"): Card => ({ rank, suit })
const weak = [card(2, "spades"), card(5), card(8, "clubs"), card(10, "diamonds"), card(13, "spades")]
const quads = [card(9, "spades"), card(9), card(9, "clubs"), card(9, "diamonds"), card(2)]
const kings = [card(13, "spades"), card(13), card(4, "clubs"), card(7, "diamonds"), card(2)]
const flush = [card(2), card(5), card(8), card(10), card(13)]
const drawy = [card(5), card(6), card(7), card(8), card(13, "spades")]

function dealt(hands: Record<string, Card[]>): GameState {
  const created = createGame("t1", [
    { id: "a", name: "Alice", stack: 100 },
    { id: "b", name: "Bob", stack: 100 },
    { id: "c", name: "Cara", stack: 100 },
  ], { ante: 1, minBet: 2 })
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, () => 0.5)
  if (!started.ok) throw new Error(started.error)
  for (const p of started.value.players) p.hand = hands[p.id] ?? weak
  return started.value
}

function facingBet(hand: Card[]): GameState {
  const result = applyAction(dealt({ c: hand }), "b", { type: "bet", amount: 2 })
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe("botDiscard", () => {
  it("keeps made hands and throws away unmatched cards", () => {
    expect(botDiscard(dealt({ b: flush }), "b")).toEqual([])
    expect(botDiscard(dealt({ b: kings }), "b")).toEqual([2, 3, 4])
    expect(botDiscard(dealt({ b: quads }), "b", () => 0.9)).toEqual([4])
    expect(botDiscard(dealt({ b: quads }), "b", () => 0.1)).toEqual([])
  })

  it("throws the lowest cards of a high card hand", () => {
    const state = dealt({ b: weak })
    expect(botDiscard(state, "b")).toEqual([0, 1, 2])
    state.players[1]!.botBluff = true
    expect(botDiscard(state, "b")).toEqual([0, 1])
  })
})

describe("botBet", () => {
  it("bets a strong hand and checks a weak one", () => {
    expect(botBet(dealt({ b: quads }), "b", () => 0.5).type).toBe("bet")
    expect(botBet(dealt({ b: weak }), "b", () => 0.05)).toEqual({ type: "check" })
  })

  it("raises, calls or folds when facing a bet", () => {
    expect(botBet(facingBet(quads), "c", () => 0.5).type).toBe("raise")
    expect(botBet(facingBet(kings), "c", () => 0.5)).toEqual({ type: "call" })
    expect(botBet(facingBet(weak), "c", () => 0.5)).toEqual({ type: "fold" })
  })

  it("gets braver with a flush or straight draw and sometimes bluffs", () => {
    const state = dealt({ b: drawy })
    expect(botBet(state, "b", () => 0.95).type).toBe("bet")
    expect(state.players[1]!.botBluff).toBe(true)
  })

  it("stays confident when bluffing after the draw", () => {
    const state = { ...dealt({ b: kings }), phase: "postdraw-betting" as const }
    state.players[1]!.botBluff = true
    expect(botBet(state, "b", () => 0.95).type).toBe("bet")
  })
})

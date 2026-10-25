import { scoreHands } from "../../src/game/Ender"
import { createGame } from "../../src/game/Dealer"
import type { Card, Rank, Suit } from "../../../shared/Card"
import type { GameState } from "../../../shared/GameState"

const suited = (suit: Suit, ...ranks: Rank[]): Card[] => ranks.map(rank => ({ rank, suit }))
const mixed = (...ranks: Rank[]): Card[] => ranks.map((rank, i) => ({ rank, suit: i === 0 ? "hearts" : "spades" }))

function showdown(...hands: Card[][]): GameState {
  const created = createGame("room-1", hands.map((_, i) => ({ id: `p${i}`, name: `P${i}`, stack: 100 })), { ante: 1, minBet: 2 })
  if (!created.ok) throw new Error(created.error)
  created.value.players.forEach((p, i) => { p.hand = hands[i] })
  return { ...created.value, phase: "showdown", pot: 30 }
}

function winCondOf(hand: Card[]): number {
  const state = showdown(hand, mixed(2, 3, 4, 5, 7))
  scoreHands(state)
  return state.players[0].winCond
}

function stacksAfter(...hands: Card[][]): number[] {
  const state = showdown(...hands)
  scoreHands(state)
  return state.players.map(p => p.stack)
}

describe("endGame", () => {
    it("checks for royal flush", () => {
        expect(winCondOf(suited("spades", 14, 13, 12, 11, 10))).toBe(10)
    })

    it("checks for straight flush", () => {
        expect(winCondOf(suited("hearts", 9, 8, 7, 6, 5))).toBe(9)
    })

    it("checks for flush", () => {
        expect(winCondOf(suited("hearts", 14, 10, 8, 6, 3))).toBe(6)
    })

    it("checks for straight", () => {
        expect(winCondOf(mixed(9, 8, 7, 6, 5))).toBe(5)
    })

    it("checks for four-of-a-kind", () => {
        expect(winCondOf(mixed(9, 9, 9, 9, 2))).toBe(8)
    })

    it("checks for full house", () => {
        expect(winCondOf(mixed(9, 9, 9, 4, 4))).toBe(7)
        expect(winCondOf(mixed(9, 9, 4, 4, 4))).toBe(7)
    })

    it("checks for three-of-a-kind", () => {
        expect(winCondOf(mixed(9, 9, 9, 5, 2))).toBe(4)
    })

    it("checks for two pair", () => {
        expect(winCondOf(mixed(9, 9, 5, 5, 2))).toBe(3)
    })

    it("checks for pair", () => {
        expect(winCondOf(mixed(9, 9, 6, 5, 2))).toBe(2)
    })

    it("checks for high card", () => {
        expect(winCondOf(mixed(13, 10, 8, 6, 3))).toBe(1)
    })

    it("delivers payout to winner", () => {
        const state = showdown(suited("spades", 14, 13, 12, 11, 10), mixed(9, 9, 6, 5, 2))
        scoreHands(state)
        expect(state.players.map(p => p.stack)).toEqual([130, 100])
        expect(state.pot).toBe(0)
        expect(state.phase).toBe("hand-complete")
    })

    it("splits pot for royal flush tie", () => {
        expect(stacksAfter(suited("spades", 14, 13, 12, 11, 10), suited("hearts", 14, 13, 12, 11, 10))).toEqual([115, 115])
    })

    it("checks for matching tie", () => {
        expect(stacksAfter(mixed(9, 9, 9, 13, 2), mixed(10, 10, 10, 5, 2))).toEqual([100, 130])
    })

    it("checks for full house tie", () => {
        expect(stacksAfter(mixed(13, 13, 4, 4, 4), mixed(9, 9, 9, 2, 2))).toEqual([100, 130])
    })

    it("checks highest for flush", () => {
        expect(stacksAfter(suited("hearts", 14, 10, 8, 6, 3), suited("spades", 14, 10, 8, 6, 2))).toEqual([130, 100])
    })

    it("splits even flushes", () => {
        expect(stacksAfter(suited("hearts", 14, 10, 8, 6, 3), suited("spades", 14, 10, 8, 6, 3))).toEqual([115, 115])
    })

    it("checks highest pairs for 2 pair", () => {
        expect(stacksAfter(mixed(13, 13, 3, 3, 2), mixed(12, 12, 11, 11, 2))).toEqual([130, 100])
    })

    it("checks second pair for 2 pair", () => {
        expect(stacksAfter(mixed(13, 13, 3, 3, 2), mixed(13, 13, 4, 4, 2))).toEqual([100, 130])
    })

    it("splits for tied 2 pair", () => {
        expect(stacksAfter(mixed(13, 13, 4, 4, 2), mixed(13, 13, 4, 4, 2))).toEqual([115, 115])
    })

    it("checks highest pair", () => {
        expect(stacksAfter(mixed(9, 9, 6, 5, 2), mixed(10, 10, 6, 5, 2))).toEqual([100, 130])
    })

    it("splits even pair", () => {
        expect(stacksAfter(mixed(9, 9, 6, 5, 2), mixed(9, 9, 6, 5, 2))).toEqual([115, 115])
    })

    it("checks for highest high card", () => {
        expect(stacksAfter(mixed(13, 10, 8, 6, 3), mixed(14, 10, 8, 6, 3))).toEqual([100, 130])
    })

    it("splits even high card", () => {
        expect(stacksAfter(mixed(13, 10, 8, 6, 3), mixed(13, 10, 8, 6, 3))).toEqual([115, 115])
    })

    it("checks for A-2-3-4-5 straight", () => {
        expect(winCondOf(mixed(14, 5, 4, 3, 2))).toBe(5)
        expect(stacksAfter(mixed(14, 5, 4, 3, 2), mixed(6, 5, 4, 3, 2))).toEqual([100, 130])
    })

    it("checks kickers for pair", () => {
        expect(stacksAfter(mixed(9, 9, 13, 5, 2), mixed(9, 9, 12, 5, 2))).toEqual([130, 100])
    })

    it("checks kicker for 2 pair", () => {
        expect(stacksAfter(mixed(13, 13, 4, 4, 3), mixed(13, 13, 4, 4, 2))).toEqual([130, 100])
    })

    it("pays side pots to the best hand that could win them", () => {
        const state = showdown(suited("spades", 14, 13, 12, 11, 10), mixed(9, 9, 6, 5, 2), mixed(13, 10, 8, 6, 3))
        state.players[0].status = "all-in"
        state.players.forEach((p, i) => { p.totalContributed = i === 0 ? 10 : 30 })
        state.pot = 70
        scoreHands(state)
        expect(state.players.map(p => p.stack)).toEqual([130, 140, 100])
    })

    //Note: there may be some room here for remainder tests but this seems excessive at this moment
})

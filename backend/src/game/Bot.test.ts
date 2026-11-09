import { applyAction, getLegalActions, startBettingRound } from "../game/Betting"
import type { ActionType, PlayerAction } from "../../../shared/Actions"
import { createGame, startHand } from "../game/Dealer"
import type { GameState, PlayerState, SeatInput, TableConfig } from "../../../shared/GameState"

// No-limit: bets and raises can be any amount from the minimum up to the player's whole stack
const config: TableConfig = { ante: 1, minBet: 2 }
const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100, botFlag: true },
  { id: "b", name: "Bob", stack: 100, botFlag: true },
  { id: "c", name: "Cara", stack: 100, botFlag: true },
]

// A dealt 3-player hand: Alice deals (seat 0), Bob acts first, everyone has 99 chips and the pot is 3
function dealt(s: SeatInput[] = seats): GameState {
  const created = createGame("room-1", s, config)
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, () => 0.5)
  if (!started.ok) throw new Error(started.error)
  return started.value
}

// Applies [player, action, amount?] steps in order, failing the test if any step is rejected.
// Amounts for bet/raise are "to" amounts: the player's total bet this round afterwards.
function play(state: GameState, steps: [string, ActionType, number?][]): GameState {
  return steps.reduce((s, [playerId, type, amount]) => {
    const action: PlayerAction = amount === undefined ? { type } : { type, amount }
    const result = applyAction(s, playerId, action)
    if (!result.ok) throw new Error(`${playerId} ${type} ${amount ?? ""}: ${result.error}`)
    return result.value
  }, state)
}

const player = (state: GameState, id: string): PlayerState => state.players.find(p => p.id === id)!
const types = (state: GameState, id: string) => getLegalActions(state, id).map(a => a.type)
const withStacks = (c: number): SeatInput[] => [seats[0]!, seats[1]!, { id: "c", name: "Cara", stack: c }]

describe("botDiscard", () => {
  it("check passes the turn to the next player", () => {
    const state = play(dealt(), [["b", "check"]])
    expect(state.toActIndex).toBe(2)
    expect(player(state, "b").hasActed).toBe(true)
  })

  it("bet moves the chosen amount from the player's stack into the pot", () => {
    const state = play(dealt(), [["b", "bet", 10]])
    expect(player(state, "b")).toMatchObject({ stack: 89, betThisRound: 10, totalContributed: 11 })
    expect(state.pot).toBe(13)
    expect(state.round).toMatchObject({ currentBet: 10, minRaise: 10 })
  })

  it("call matches the current bet", () => {
    const state = play(dealt(), [["b", "bet", 10], ["c", "call"]])
    expect(player(state, "c").betThisRound).toBe(10)
    expect(state.pot).toBe(23)
    expect(state.toActIndex).toBe(0)
  })

  it("raise sets the new bet, raises the minimum raise, and makes earlier players act again", () => {
    const state = play(dealt(), [["b", "check"], ["c", "bet", 10], ["a", "raise", 30]])
    expect(state.round).toMatchObject({ currentBet: 30, minRaise: 20 })
    expect(player(state, "a").betThisRound).toBe(30)
    expect(state.toActIndex).toBe(1) // Bob checked earlier, but now faces the raise
    expect(types(state, "b")).toEqual(["fold", "call", "raise"])
  })

  it("betting the whole stack puts the player all-in", () => {
    const state = play(dealt(), [["b", "bet", 99]])
    expect(player(state, "b")).toMatchObject({ stack: 0, status: "all-in" })
  })

  it("fold takes the player out of the hand and skips them afterwards", () => {
    const state = play(dealt(), [["b", "bet", 10], ["c", "fold"]])
    expect(player(state, "c").status).toBe("folded")
    expect(state.toActIndex).toBe(0)
  })

  it("a short stack who calls goes all-in and is skipped from then on", () => {
    const state = play(dealt(withStacks(5)), [["b", "bet", 10], ["c", "call"]])
    expect(player(state, "c")).toMatchObject({ stack: 0, status: "all-in", betThisRound: 4 })
    expect(state.toActIndex).toBe(0)
  })

  it("a short all-in raise doesn't change the minimum raise", () => {
    const state = play(dealt(withStacks(13)), [["b", "bet", 10], ["c", "raise", 12]])
    expect(state.round).toMatchObject({ currentBet: 12, minRaise: 10 })
  })

  it("does not change the state passed in", () => {
    const before = dealt()
    play(before, [["b", "bet", 10]])
    expect(player(before, "b").stack).toBe(99)
    expect(before.pot).toBe(3)
  })
 
})
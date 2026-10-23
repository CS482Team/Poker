import { scoreHands } from "../../../src/game/Ender"
import { applyAction, getLegalActions, startBettingRound } from "../../../src/game/Betting"
import type { ActionType, PlayerAction } from "../../../src/game/Betting"
import { createGame, startHand } from "../../../src/game/Dealer"
import type { GameState, PlayerState, SeatInput, TableConfig } from "../../../src/game/GameState"
const config: TableConfig = { ante: 1, smallBet: 2, bigBet: 4, maxBetsPerRound: 4 }

const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
  { id: "c", name: "Cara", stack: 100 },
]

const key = (c: Card) => `${c.rank}-${c.suit}`

//TODO: Edit intitialization of betting tests to set up for ender tests

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


// Helper: create a game and start the first hand, failing the test if either step errors
function dealtGame(s: SeatInput[] = seats): GameState {
  const created = createGame("room-1", s, config)
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, seededRng(1))
  if (!started.ok) throw new Error(started.error)
  return started.value
}

//TODO: Add tests

describe("endGame", () => {
    it("checks for royal flush", () => {
        const game = dealtGame();
        const result = scoreHands("room-1");

    })
})

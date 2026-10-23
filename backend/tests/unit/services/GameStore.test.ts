import { createGameStore } from "../../../src/services/GameStore"
import { createGame } from "../../../src/game/Dealer"
import type { GameState, SeatInput, TableConfig } from "../../../src/game/GameState"

const config: TableConfig = { ante: 1, minBet: 2 }
const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
]

// A fresh game with a unique id, from the real engine
function newGame(): GameState {
  const created = createGame("room-1", seats, config)
  if (!created.ok) throw new Error(created.error)
  return created.value
}

describe("GameStore", () => {
  it("returns a saved game by its id", () => {
    const store = createGameStore()
    const game = newGame()

    store.save(game)

    expect(store.get(game.id)).toEqual(game)
  })

  it("returns null for a game it doesn't have", () => {
    const store = createGameStore()
    expect(store.get("no-such-game")).toBeNull()
  })

  it("replaces a game when it's saved again with the same id", () => {
    const store = createGameStore()
    const game = newGame()
    store.save(game)

    store.save({ ...game, pot: 10 })

    expect(store.get(game.id)?.pot).toBe(10)
  })

  it("keeps different games separate", () => {
    const store = createGameStore()
    const first = newGame()
    const second = newGame()

    store.save(first)
    store.save(second)

    expect(store.get(first.id)).toEqual(first)
    expect(store.get(second.id)).toEqual(second)
  })

  it("forgets a deleted game", () => {
    const store = createGameStore()
    const game = newGame()
    store.save(game)

    store.delete(game.id)

    expect(store.get(game.id)).toBeNull()
  })

  it("gives each store its own games", () => {
    const one = createGameStore()
    const two = createGameStore()
    const game = newGame()

    one.save(game)

    expect(two.get(game.id)).toBeNull()
  })
})
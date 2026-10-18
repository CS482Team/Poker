import { createGame, startHand } from "./Dealer"
import type { GameState, SeatInput, TableConfig } from "./GameState"
import type { Card, Rng } from "./Card"

const config: TableConfig = { ante: 1, smallBet: 2, bigBet: 4, maxBetsPerRound: 4 }

const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
  { id: "c", name: "Cara", stack: 100 },
]

const key = (c: Card) => `${c.rank}-${c.suit}`

// A tiny seeded random generator, so shuffles are repeatable in tests
function seededRng(seed: number): Rng {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

// Helper: create a game and start the first hand, failing the test if either step errors
function dealtGame(s: SeatInput[] = seats): GameState {
  const created = createGame("room-1", s, config)
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, seededRng(1))
  if (!started.ok) throw new Error(started.error)
  return started.value
}

describe("createGame", () => {
  it("starts in the waiting phase with an empty pot", () => {
    const result = createGame("room-1", seats, config)
    expect(result.ok).toBe(true)
    if (!result.ok) return          // tells TypeScript result.value exists below
    expect(result.value.phase).toBe("waiting")
    expect(result.value.pot).toBe(0)
  })

  it("rejects fewer than 2 players", () => {
    const result = createGame("room-1", seats.slice(0, 1), config)
    expect(result).toEqual({ ok: false, error: "too-few-players" })

  })

  it("rejects more than 6 players", () => {
    const sevenSeats: SeatInput[] = Array.from({ length: 7 }, (_, i) => ({
      id: `p${i}`,
      name: `Player ${i}`,
      stack: 100,
    }))
    const result = createGame("room-1", sevenSeats, config)
    expect(result).toEqual({ ok: false, error: "too-many-players" })
  })
})

describe("startHand", () => {
  it("takes the ante from every player", () => {
    const game = dealtGame()
    for (const p of game.players) {
      expect(p.stack).toBe(100 - config.ante)
    }
  })

  it("puts the antes in the pot", () => {
    const game = dealtGame()
    expect(game.pot).toBe(config.ante * 3)
  })

  it("deals 5 cards to each player", () => {
    const game = dealtGame()
    for (const p of game.players) {
      expect(p.hand).toHaveLength(5)
    }
  })

  it("removes the dealt cards from the deck", () => {
    const game = dealtGame()
    expect(game.deck).toHaveLength(52 - 15)
  })

  it("never deals the same card twice", () => {
    const game = dealtGame()
    const allCards = [...game.players.flatMap(p => p.hand), ...game.deck]
    const unique = new Set(allCards.map(key))
    expect(allCards).toHaveLength(52)
    expect(unique.size).toBe(52)
  })

  it("starts the pre-draw betting round", () => {
    const game = dealtGame()
    expect(game.phase).toBe("predraw-betting")
    expect(game.round?.betSize).toBe(config.smallBet)
  })

  it("gives the first turn to the player left of the dealer", () => {
    const game = dealtGame()
    expect(game.toActIndex).toBe((game.dealerIndex + 1) % game.players.length)
  })

  it("puts a player who can't cover the ante all-in", () => {
    const bigAnte: TableConfig = { ...config, ante: 2 }
    const shortSeats: SeatInput[] = [
      { id: "a", name: "Alice", stack: 100 },
      { id: "b", name: "Bob", stack: 1 },   // can't cover the ante of 2
      { id: "c", name: "Cara", stack: 100 },
    ]

    const created = createGame("room-1", shortSeats, bigAnte)
    if (!created.ok) throw new Error(created.error)
    const started = startHand(created.value, seededRng(1))
    if (!started.ok) throw new Error(started.error)
    const game = started.value

    const bob = game.players.find(p => p.id === "b")!
    expect(bob.stack).toBe(0)
    expect(bob.status).toBe("all-in")
    expect(game.pot).toBe(2 + 1 + 2)
  })

  it("rejects starting a hand that's already in progress", () => {
    const game = dealtGame()
    const result = startHand(game, seededRng(2))
    expect(result).toEqual({ ok: false, error: "wrong-phase" })
  })
    it("sits out a player with no chips and deals them nothing", () => {
    const game = dealtGame([...seats, { id: "d", name: "Dan", stack: 0 }])
    const dan = game.players.find(p => p.id === "d")!
    expect(dan.status).toBe("sitting-out")
    expect(dan.hand).toHaveLength(0)
    expect(game.pot).toBe(3)
  })

  it("rejects a hand when fewer than 2 players have chips", () => {
    const created = createGame("room-1", [{ id: "a", name: "Alice", stack: 100 }, { id: "b", name: "Bob", stack: 0 }], config)
    if (!created.ok) throw new Error(created.error)
    expect(startHand(created.value, seededRng(1))).toEqual({ ok: false, error: "too-few-players" })
  })

  it("moves the dealer button to the next player on the next hand", () => {
    const first = dealtGame()
    const next = startHand({ ...first, phase: "hand-complete" }, seededRng(2))
    if (!next.ok) throw new Error(next.error)
    expect(next.value.dealerIndex).toBe(1)
    expect(next.value.handNumber).toBe(2)
  })

  it("has nobody to act when every player is all-in after the antes", () => {
    const game = dealtGame([
      { id: "a", name: "Alice", stack: 1 },
      { id: "b", name: "Bob", stack: 1 },
    ])
    expect(game.players.every(p => p.status === "all-in")).toBe(true)
    expect(game.toActIndex).toBeNull()
  })

})

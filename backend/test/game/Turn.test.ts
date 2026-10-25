import { advanceTurn, firstToAct, isInHand, isPlayersTurn, nextSeat } from "../../src/game/Turn"
import { createGame, startHand } from "../../src/game/Dealer"
import type { GameState, PlayerState, PlayerStatus, SeatInput, TableConfig } from "../../../shared/GameState"

const config: TableConfig = { ante: 1, minBet: 2 }
const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
  { id: "c", name: "Cara", stack: 100 },
  { id: "d", name: "Dan", stack: 100 },
]

// A dealt 4-player hand (dealer seat 0, Bob to act), with optional per-seat statuses
function dealtGame(statuses: PlayerStatus[] = []): GameState {
  const created = createGame("table-1", seats, config)
  if (!created.ok) throw new Error(created.error)
  const started = startHand(created.value, () => 0.5)
  if (!started.ok) throw new Error(started.error)
  const game = started.value
  return { ...game, players: game.players.map((p, i) => ({ ...p, status: statuses[i] ?? p.status })) }
}

const isActive = (p: PlayerState) => p.status === "active"

describe("nextSeat", () => {
  it("finds the next matching seat after the given one", () => {
    expect(nextSeat(dealtGame().players, 0, isActive)).toBe(1)
  })

  it("wraps around the table past the last seat", () => {
    expect(nextSeat(dealtGame().players, 3, isActive)).toBe(0)
  })

  it("skips seats that don't match", () => {
    const players = dealtGame(["active", "folded", "all-in", "active"]).players
    expect(nextSeat(players, 0, isActive)).toBe(3)
  })

  it("returns null when nobody matches", () => {
    expect(nextSeat(dealtGame().players, 0, () => false)).toBeNull()
  })
})

describe("isInHand", () => {
  it("counts active and all-in players as still in the hand", () => {
    const players = dealtGame(["active", "all-in", "folded", "sitting-out"]).players
    expect(players.map(isInHand)).toEqual([true, true, false, false])
  })
})

describe("firstToAct", () => {
  it("is the first eligible player left of the dealer", () => {
    expect(firstToAct(dealtGame(), isActive)).toBe(1)
  })

  it("skips ineligible players left of the dealer", () => {
    expect(firstToAct(dealtGame(["active", "folded", "active", "active"]), isActive)).toBe(2)
  })

  it("is null when nobody is eligible", () => {
    expect(firstToAct(dealtGame(["all-in", "all-in", "folded", "all-in"]), isActive)).toBeNull()
  })
})

describe("isPlayersTurn", () => {
  it("is true only for the player whose turn it is", () => {
    const game = dealtGame()
    expect(isPlayersTurn(game, "b")).toBe(true)
    expect(isPlayersTurn(game, "a")).toBe(false)
  })

  it("is false for everyone when nobody is to act", () => {
    expect(isPlayersTurn({ ...dealtGame(), toActIndex: null }, "b")).toBe(false)
  })

  it("is false for someone who isn't in the game", () => {
    expect(isPlayersTurn(dealtGame(), "stranger")).toBe(false)
  })
})

describe("advanceTurn", () => {
  it("passes the turn to the next eligible player", () => {
    expect(advanceTurn(dealtGame(), isActive).toActIndex).toBe(2)
  })

  it("skips players who can't act", () => {
    const game = dealtGame(["active", "active", "folded", "active"])
    expect(advanceTurn(game, isActive).toActIndex).toBe(3)
  })

  it("comes back around once the rule allows it (e.g. betting reopened by a raise)", () => {
    const game = { ...dealtGame(), toActIndex: 3 }
    expect(advanceTurn(game, isActive).toActIndex).toBe(0)
  })

  it("sets nobody to act when no one else can act (e.g. everyone has drawn)", () => {
    const game = dealtGame()
    const players = game.players.map(p => ({ ...p, hasActed: true }))
    const next = advanceTurn({ ...game, players }, p => !p.hasActed)
    expect(next.toActIndex).toBeNull()
  })

  it("starts from left of the dealer when nobody is currently to act", () => {
    expect(advanceTurn({ ...dealtGame(), toActIndex: null }, isActive).toActIndex).toBe(1)
  })

  it("does not change the state passed in", () => {
    const game = dealtGame()
    advanceTurn(game, isActive)
    expect(game.toActIndex).toBe(1)
  })
})

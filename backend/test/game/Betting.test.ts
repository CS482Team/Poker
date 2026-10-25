import { applyAction, getLegalActions, startBettingRound } from "../../src/game/Betting"
import type { ActionType, PlayerAction } from "../../../shared/Actions"
import { createGame, startHand } from "../../src/game/Dealer"
import type { GameState, PlayerState, SeatInput, TableConfig } from "../../../shared/GameState"

// No-limit: bets and raises can be any amount from the minimum up to the player's whole stack
const config: TableConfig = { ante: 1, minBet: 2 }
const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
  { id: "c", name: "Cara", stack: 100 },
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

describe("startBettingRound", () => {
  it("starts the pre-draw round at the table's minimum bet with the first player left of the dealer", () => {
    const state = startBettingRound({ ...dealt(), round: null, toActIndex: null }, "predraw")
    expect(state.phase).toBe("predraw-betting")
    expect(state.round).toEqual({ street: "predraw", currentBet: 0, minRaise: 2 })
    expect(state.toActIndex).toBe(1)
  })

  it("starts the post-draw round with fresh per-round bets and the same minimum", () => {
    const base = dealt()
    const afterDraw: GameState = {
      ...base,
      phase: "draw",
      round: null,
      players: base.players.map(p => ({ ...p, betThisRound: 6, hasActed: true })),
    }
    const state = startBettingRound(afterDraw, "postdraw")
    expect(state.phase).toBe("postdraw-betting")
    expect(state.round).toEqual({ street: "postdraw", currentBet: 0, minRaise: 2 })
    expect(state.players.every(p => p.betThisRound === 0 && !p.hasActed)).toBe(true)
  })

  it("skips folded and all-in players when choosing who acts first", () => {
    const base = dealt()
    const players = base.players.map(p => (p.id === "b" ? { ...p, status: "folded" as const } : p))
    expect(startBettingRound({ ...base, players }, "predraw").toActIndex).toBe(2)
  })

  it("skips the round when fewer than two players can still bet", () => {
    const base = dealt()
    const players = base.players.map(p => (p.id === "a" ? p : { ...p, status: "all-in" as const, stack: 0 }))
    expect(startBettingRound({ ...base, players }, "predraw").phase).toBe("draw")
  })
})

describe("getLegalActions", () => {
  it("lets the first player fold, check, or bet anything from the minimum to all-in", () => {
    expect(getLegalActions(dealt(), "b")).toEqual([
      { type: "fold" },
      { type: "check" },
      { type: "bet", min: 2, max: 99 },
    ])
  })

  it("lets a player facing a bet call it or raise by at least the same amount again", () => {
    const state = play(dealt(), [["b", "bet", 10]])
    expect(getLegalActions(state, "c")).toEqual([
      { type: "fold" },
      { type: "call", amount: 10 },
      { type: "raise", min: 20, max: 99 },
    ])
  })

  it("makes the next raise at least as big as the last one", () => {
    const state = play(dealt(), [["b", "bet", 10], ["c", "raise", 25]]) // a raise of 15
    expect(getLegalActions(state, "a")).toContainEqual({ type: "raise", min: 40, max: 99 })
  })

  it("only offers a short stack an all-in call when they can't cover the bet", () => {
    const state = play(dealt(withStacks(5)), [["b", "bet", 10]])
    expect(getLegalActions(state, "c")).toEqual([
      { type: "fold" },
      { type: "call", amount: 4 },
    ])
  })

  it("lets a stack too small for a full raise go all-in as a raise", () => {
    const state = play(dealt(withStacks(16)), [["b", "bet", 10]])
    expect(getLegalActions(state, "c")).toContainEqual({ type: "raise", min: 15, max: 15 })
  })

  it("doesn't let a player raise again after only a short all-in raise", () => {
    // Bob bets 10, Cara goes all-in to 12 (a raise of 2: less than a full raise), Alice calls
    const state = play(dealt(withStacks(13)), [["b", "bet", 10], ["c", "raise", 12], ["a", "call"]])
    expect(types(state, "b")).toEqual(["fold", "call"])
  })

  it("gives nothing to a player when it isn't their turn", () => {
    expect(getLegalActions(dealt(), "c")).toEqual([])
  })

  it("gives nothing outside a betting round", () => {
    expect(getLegalActions({ ...dealt(), phase: "draw" }, "b")).toEqual([])
  })
})

describe("applyAction", () => {
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

  describe("rejects", () => {
    it("acting out of turn", () => {
      expect(applyAction(dealt(), "c", { type: "check" })).toEqual({ ok: false, error: "not-your-turn" })
    })

    it("a player who isn't in the game", () => {
      expect(applyAction(dealt(), "zed", { type: "check" })).toEqual({ ok: false, error: "unknown-player" })
    })

    it("acting outside a betting round", () => {
      expect(applyAction({ ...dealt(), phase: "draw" }, "b", { type: "check" })).toEqual({ ok: false, error: "wrong-phase" })
    })

    it("checking when facing a bet", () => {
      const state = play(dealt(), [["b", "bet", 10]])
      expect(applyAction(state, "c", { type: "check" })).toEqual({ ok: false, error: "illegal-action" })
    })

    it.each([
      ["below the minimum bet", 1],
      ["more than the player's stack", 100],
      ["a fraction of a chip", 2.5],
    ])("a bet %s", (_why, amount) => {
      expect(applyAction(dealt(), "b", { type: "bet", amount })).toEqual({ ok: false, error: "illegal-action" })
    })

    it("a bet with no amount", () => {
      expect(applyAction(dealt(), "b", { type: "bet" })).toEqual({ ok: false, error: "illegal-action" })
    })

    it("a raise smaller than the minimum raise", () => {
      const state = play(dealt(), [["b", "bet", 10]])
      expect(applyAction(state, "c", { type: "raise", amount: 15 })).toEqual({ ok: false, error: "illegal-action" })
    })
  })

  describe("ending the round", () => {
    it("moves to the draw when everyone checks, with the first player left of the dealer to draw", () => {
      const state = play(dealt(), [["b", "check"], ["c", "check"], ["a", "check"]])
      expect(state.phase).toBe("draw")
      expect(state.round).toBeNull()
      expect(state.toActIndex).toBe(1)
      expect(state.players.every(p => !p.hasActed)).toBe(true)
    })

    it("moves to the draw once a bet has been called all the way round", () => {
      const state = play(dealt(), [["b", "bet", 10], ["c", "call"], ["a", "call"]])
      expect(state.phase).toBe("draw")
      expect(state.pot).toBe(33)
    })

    it("does not end while someone still has to answer a raise", () => {
      const state = play(dealt(), [["b", "bet", 10], ["c", "call"], ["a", "raise", 30], ["b", "call"]])
      expect(state.phase).toBe("predraw-betting")
      expect(state.toActIndex).toBe(2)
    })

    it("goes straight to showdown when everyone else folds", () => {
      const state = play(dealt(), [["b", "bet", 10], ["c", "fold"], ["a", "fold"]])
      expect(state.phase).toBe("showdown")
      expect(state.toActIndex).toBeNull()
      expect(state.players.filter(p => p.status !== "folded").map(p => p.id)).toEqual(["b"])
    })

    it("goes to showdown when the post-draw round is complete", () => {
      const preDrawDone = play(dealt(), [["b", "check"], ["c", "check"], ["a", "check"]])
      const postDraw = startBettingRound(preDrawDone, "postdraw")
      const state = play(postDraw, [["b", "bet", 20], ["c", "call"], ["a", "call"]])
      expect(state.phase).toBe("showdown")
      expect(state.pot).toBe(63)
    })
  })
})

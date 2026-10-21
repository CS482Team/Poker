import { applyAction, getLegalActions, startBettingRound } from "../../../src/game/Betting"
import type { PlayerAction } from "../../../src/game/Betting"
import { createGame, startHand } from "../../../src/game/Dealer"
import type { GameState, PlayerState, SeatInput, TableConfig } from "../../../src/game/GameState"

// Fixed-limit: small bet 2 before the draw, big bet 4 after, max 4 bets (1 bet + 3 raises) per round
const config: TableConfig = { ante: 1, smallBet: 2, bigBet: 4, maxBetsPerRound: 4 }
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

// Applies a list of [player, action] steps, failing the test if any step is rejected
function play(state: GameState, steps: [string, PlayerAction["type"]][]): GameState {
  return steps.reduce((s, [playerId, type]) => {
    const result = applyAction(s, playerId, { type })
    if (!result.ok) throw new Error(`${playerId} ${type}: ${result.error}`)
    return result.value
  }, state)
}

const player = (state: GameState, id: string): PlayerState => state.players.find(p => p.id === id)!
const types = (state: GameState, id: string) => getLegalActions(state, id).map(a => a.type)

describe("startBettingRound", () => {
  it("starts the pre-draw round with the small bet and the first player left of the dealer", () => {
    const state = startBettingRound({ ...dealt(), round: null, toActIndex: null }, "predraw")
    expect(state.phase).toBe("predraw-betting")
    expect(state.round).toEqual({ street: "predraw", betSize: 2, currentBet: 0, betsMade: 0 })
    expect(state.toActIndex).toBe(1)
  })

  it("starts the post-draw round with the big bet and fresh per-round bets", () => {
    const afterDraw: GameState = {
      ...dealt(),
      phase: "draw",
      round: null,
      players: dealt().players.map(p => ({ ...p, betThisRound: 6, hasActed: true })),
    }
    const state = startBettingRound(afterDraw, "postdraw")
    expect(state.phase).toBe("postdraw-betting")
    expect(state.round?.betSize).toBe(4)
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
    const state = startBettingRound({ ...base, players }, "predraw")
    expect(state.phase).toBe("draw")
  })
})

describe("getLegalActions", () => {
  it("lets the first player fold, check or bet the small bet when nobody has bet", () => {
    expect(getLegalActions(dealt(), "b")).toEqual([
      { type: "fold", amount: 0 },
      { type: "check", amount: 0 },
      { type: "bet", amount: 2 },
    ])
  })

  it("lets a player facing a bet fold, call or raise by one bet", () => {
    const state = play(dealt(), [["b", "bet"]])
    expect(getLegalActions(state, "c")).toEqual([
      { type: "fold", amount: 0 },
      { type: "call", amount: 2 },
      { type: "raise", amount: 4 },
    ])
  })

  it("stops offering a raise once the round has hit the 4-bet cap", () => {
    const state = play(dealt(), [["b", "bet"], ["c", "raise"], ["a", "raise"], ["b", "raise"]])
    expect(state.round?.betsMade).toBe(4)
    expect(types(state, "c")).toEqual(["fold", "call"])
  })

  it("only offers a short stack an all-in call for what they have left", () => {
    const state = play(dealt([seats[0]!, seats[1]!, { id: "c", name: "Cara", stack: 2 }]), [["b", "bet"]])
    expect(getLegalActions(state, "c")).toEqual([
      { type: "fold", amount: 0 },
      { type: "call", amount: 1 },
    ])
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

  it("bet moves the small bet from the player's stack into the pot", () => {
    const state = play(dealt(), [["b", "bet"]])
    expect(player(state, "b").stack).toBe(97)
    expect(player(state, "b").betThisRound).toBe(2)
    expect(player(state, "b").totalContributed).toBe(3)
    expect(state.pot).toBe(5)
    expect(state.round).toMatchObject({ currentBet: 2, betsMade: 1 })
  })

  it("call matches the current bet", () => {
    const state = play(dealt(), [["b", "bet"], ["c", "call"]])
    expect(player(state, "c").betThisRound).toBe(2)
    expect(state.pot).toBe(7)
    expect(state.toActIndex).toBe(0)
  })

  it("raise adds one bet on top and makes earlier players act again", () => {
    const state = play(dealt(), [["b", "check"], ["c", "bet"], ["a", "raise"]])
    expect(state.round).toMatchObject({ currentBet: 4, betsMade: 2 })
    expect(player(state, "a").betThisRound).toBe(4)
    expect(state.toActIndex).toBe(1) // Bob checked earlier, but now faces the raise
    expect(types(state, "b")).toEqual(["fold", "call", "raise"])
  })

  it("fold takes the player out of the hand and skips them afterwards", () => {
    const state = play(dealt(), [["b", "bet"], ["c", "fold"]])
    expect(player(state, "c").status).toBe("folded")
    expect(state.toActIndex).toBe(0)
  })

  it("a short stack who calls goes all-in and is skipped from then on", () => {
    const short = dealt([seats[0]!, seats[1]!, { id: "c", name: "Cara", stack: 2 }])
    const state = play(short, [["b", "bet"], ["c", "call"]])
    expect(player(state, "c")).toMatchObject({ stack: 0, status: "all-in" })
    expect(state.toActIndex).toBe(0)
  })

  it("does not change the state passed in", () => {
    const before = dealt()
    play(before, [["b", "bet"]])
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
      const state = play(dealt(), [["b", "bet"]])
      expect(applyAction(state, "c", { type: "check" })).toEqual({ ok: false, error: "illegal-action" })
    })

    it("raising past the 4-bet cap", () => {
      const state = play(dealt(), [["b", "bet"], ["c", "raise"], ["a", "raise"], ["b", "raise"]])
      expect(applyAction(state, "c", { type: "raise" })).toEqual({ ok: false, error: "illegal-action" })
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
      const state = play(dealt(), [["b", "bet"], ["c", "call"], ["a", "call"]])
      expect(state.phase).toBe("draw")
      expect(state.pot).toBe(9)
    })

    it("does not end while someone still has to answer a raise", () => {
      const state = play(dealt(), [["b", "bet"], ["c", "call"], ["a", "raise"], ["b", "call"]])
      expect(state.phase).toBe("predraw-betting")
      expect(state.toActIndex).toBe(2)
    })

    it("goes straight to showdown when everyone else folds", () => {
      const state = play(dealt(), [["b", "bet"], ["c", "fold"], ["a", "fold"]])
      expect(state.phase).toBe("showdown")
      expect(state.toActIndex).toBeNull()
      expect(state.players.filter(p => p.status !== "folded").map(p => p.id)).toEqual(["b"])
    })

    it("goes to showdown when the post-draw round is complete", () => {
      const preDrawDone = play(dealt(), [["b", "check"], ["c", "check"], ["a", "check"]])
      const postDraw = startBettingRound(preDrawDone, "postdraw")
      const state = play(postDraw, [["b", "bet"], ["c", "call"], ["a", "call"]])
      expect(state.phase).toBe("showdown")
      expect(state.pot).toBe(15)
    })
  })
})

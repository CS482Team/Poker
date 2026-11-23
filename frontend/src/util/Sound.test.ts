import { soundsForViewChange } from "@/util/Sound"
import type { PlayerView, PublicPlayer } from "@shared/PlayerView"

const me: PublicPlayer = { seat: 0, id: "me", name: "Me", stack: 1000, status: "active", betThisRound: 0, lastAction: null, cardCount: 5 }
const maya: PublicPlayer = { ...me, seat: 1, id: "maya", name: "Maya" }

function view(changes: Partial<PlayerView> = {}): PlayerView {
  return {
    gameId: "g1", tableId: "t1", phase: "predraw-betting", pot: 20, handNumber: 1, dealerSeat: 0, toActSeat: 1, round: null,
    you: { seat: 0, hand: [], legalActions: [] }, players: [me, maya], winners: [], winnings: {},
    ...changes,
  }
}

describe("soundsForViewChange", () => {
  it("stays quiet on the first view, so joining a table doesn't make noise", () => {
    expect(soundsForViewChange(null, view())).toEqual([])
  })

  it("stays quiet when the view goes away", () => {
    expect(soundsForViewChange(view(), null)).toEqual([])
  })

  it("deals when a new hand starts", () => {
    expect(soundsForViewChange(view(), view({ handNumber: 2 }))).toEqual(["deal"])
  })

  it("plays the sound for each action a player takes", () => {
    const after = (action: PublicPlayer["lastAction"], bet = 0) => view({ players: [me, { ...maya, lastAction: action, betThisRound: bet }] })
    expect(soundsForViewChange(view(), after("check"))).toEqual(["check"])
    expect(soundsForViewChange(view(), after("call", 10))).toEqual(["chips"])
    expect(soundsForViewChange(view(), after("bet", 10))).toEqual(["chips"])
    expect(soundsForViewChange(view(), after("raise", 20))).toEqual(["chips"])
    expect(soundsForViewChange(view(), after("fold"))).toEqual(["fold"])
  })

  it("plays a raise again when the same player raises again", () => {
    const raised = view({ players: [me, { ...maya, lastAction: "raise", betThisRound: 20 }] })
    const reraised = view({ players: [me, { ...maya, lastAction: "raise", betThisRound: 40 }] })
    expect(soundsForViewChange(raised, reraised)).toEqual(["chips"])
  })

  it("doesn't replay an action that hasn't changed", () => {
    const checked = view({ players: [me, { ...maya, lastAction: "check" }] })
    expect(soundsForViewChange(checked, { ...checked, pot: 30 })).toEqual([])
  })

  it("chimes when the turn comes to you", () => {
    expect(soundsForViewChange(view({ toActSeat: 1 }), view({ toActSeat: 0 }))).toEqual(["turn"])
    // not when it's someone else's turn, or when it was already yours
    expect(soundsForViewChange(view({ toActSeat: 0 }), view({ toActSeat: 1 }))).toEqual([])
    expect(soundsForViewChange(view({ toActSeat: 0 }), view({ toActSeat: 0, pot: 30 }))).toEqual([])
  })

  it("never chimes for spectators", () => {
    const watching = { seat: -1, hand: [], legalActions: [] }
    expect(soundsForViewChange(view({ you: watching, toActSeat: 1 }), view({ you: watching, toActSeat: 0 }))).toEqual([])
  })

  it("celebrates when the pot is won", () => {
    expect(soundsForViewChange(view(), view({ winners: ["maya"], winnings: { maya: 20 } }))).toEqual(["win"])
  })

  it("plays an action and the turn chime together, each once", () => {
    const before = view({ toActSeat: 1 })
    const after = view({ toActSeat: 0, players: [me, { ...maya, lastAction: "call", betThisRound: 10 }] })
    expect(soundsForViewChange(before, after)).toEqual(["chips", "turn"])
  })
})

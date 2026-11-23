import { closeVote, configForTable, getTableView, humanTurn, leaveGame, openVote, startGame, takeAction, timeOut, voteToPlayAgain, voteWon } from "../services/GameService"
import { gameDAO } from "../dao/GameDAO"
import { insertMatch, insertMatchAction, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import type { SeatInput } from "../../../shared/GameState"

jest.mock("../dao/MatchDAO")
jest.mock("../dao/TableDAO", () => ({ getTable: jest.fn() }))

const table = { id: "t1", name: "Ruby", ante: 1, minimumBet: 2 }
const seats: SeatInput[] = [
  { id: "a", name: "Alice", stack: 100 },
  { id: "b", name: "Bob", stack: 100 },
  { id: "c", name: "Cara", stack: 100 },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(nextMatchNumber).mockResolvedValue(3)
  jest.mocked(insertMatch).mockResolvedValue("m1")
  jest.mocked(insertMatchPlayers).mockResolvedValue(undefined)
  jest.mocked(insertMatchAction).mockResolvedValue(undefined)
})

describe("configForTable", () => {
  it("uses the table's ante and minimum bet", () => {
    expect(configForTable(table)).toEqual({ ante: 1, minBet: 2 })
  })

  it("never lets the minimum bet be 0 chips (the column defaults to 0)", () => {
    expect(configForTable({ ...table, minimumBet: 0 }).minBet).toBe(1)
  })
})

async function started() {
  const result = await startGame(table, seats)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

afterEach(() => {
  const game = gameDAO.findByTable("t1")
  if (game) gameDAO.delete(game.id)
})

describe("startGame", () => {
  it("stores the dealt game and saves the match", async () => {
    const game = await started()
    expect(gameDAO.get(game.id)?.phase).toBe("predraw-betting")
    expect(insertMatch).toHaveBeenCalledWith({ tableId: "t1", tableName: "Ruby", matchNumber: 3, pot: 3, dealerSeat: 0 })
    expect(insertMatchPlayers).toHaveBeenCalledWith("m1", [
      { seatNumber: 0, userId: "a", botName: null, dealt: game.players[0]!.hand },
      { seatNumber: 1, userId: "b", botName: null, dealt: game.players[1]!.hand },
      { seatNumber: 2, userId: "c", botName: null, dealt: game.players[2]!.hand },
    ])
  })

  it("refuses to start with fewer than 2 players", async () => {
    expect(await startGame(table, seats.slice(0, 1))).toEqual({ ok: false, error: "too-few-players" })
    expect(insertMatch).not.toHaveBeenCalled()
  })
})

describe("getTableView", () => {
  it("shows the player only their own cards and actions", async () => {
    const game = await started()
    const bob = getTableView("t1", "b")!
    expect(bob.you.hand).toEqual(game.players[1]!.hand)
    expect(bob.you.legalActions.map(a => a.type)).toEqual(["fold", "check", "bet"])
    expect(getTableView("t1", "c")!.you.legalActions).toEqual([])
    expect(bob.players.every(p => p.cards === null && p.handName === null)).toBe(true)
    expect(bob).not.toHaveProperty("deck")
  })

  it("shows everyone's cards once the hand is over", async () => {
    const game = await started()
    expect(getTableView("t1", "b")!.players[0]!.cards).toBeNull()
    gameDAO.save({ ...game, phase: "hand-complete", players: game.players.map((p, i) => (i === 2 ? { ...p, status: "folded" } : p)) })
    const view = getTableView("t1", "b")!
    expect(view.players[0]!.cards).toEqual(game.players[0]!.hand)
    expect(view.players[2]!.cards).toEqual(game.players[2]!.hand)
    expect(view.players[0]!.handName).toMatch(/High Card|Pair|Two Pair|Three of a Kind|Straight|Flush|Full House|Four of a Kind|Royal Flush/)
  })

  it("shows someone not in the hand the table without any cards", async () => {
    await started()
    const view = getTableView("t1", "stranger")!
    expect(view.you).toEqual({ seat: -1, hand: [], legalActions: [] })
    expect(view.players).toHaveLength(3)
  })
})

describe("takeAction", () => {
  it("saves the new state", async () => {
    const game = await started()
    const result = takeAction(game.id, "b", { type: "bet", amount: 2 })
    expect(result.ok).toBe(true)
    expect(gameDAO.get(game.id)?.pot).toBe(5)
  })

  it("logs the action with the chips put in", async () => {
    const game = await started()
    takeAction(game.id, "b", { type: "bet", amount: 2 })
    expect(insertMatchAction).toHaveBeenCalledWith({ matchId: "m1", seatNumber: 1, userId: "b", type: "bet", amount: 2, cardsDiscarded: null })
  })

  it("leaves the game alone when the action is refused", async () => {
    const game = await started()
    expect(takeAction(game.id, "c", { type: "check" })).toEqual({ ok: false, error: "not-your-turn" })
    expect(gameDAO.get(game.id)?.pot).toBe(3)
  })

  it("reports a game that doesn't exist", () => {
    expect(takeAction("no-such-game", "b", { type: "check" })).toEqual({ ok: false, error: "game-not-found" })
  })

  it("folds a player who leaves and pays the last one left", async () => {
    await started()
    expect(leaveGame("t1", "b")!.toActIndex).toBe(2)
    const ended = leaveGame("t1", "c")!
    expect(ended.phase).toBe("hand-complete")
    expect(ended.players[0]!.stack).toBe(102)
    expect(ended.winnings).toEqual({ a: 3 })
  })

  it("pays the pot when the hand reaches showdown", async () => {
    const game = await started()
    takeAction(game.id, "b", { type: "fold" })
    takeAction(game.id, "c", { type: "fold" })
    const ended = gameDAO.get(game.id)!
    expect(ended.phase).toBe("hand-complete")
    expect(ended.players[0]!.stack).toBe(102)
  })
})

describe("winnings", () => {
  it("starts each hand with nobody having won anything", async () => {
    expect((await started()).winnings).toEqual({})
  })

  it("records how many chips the winner took from the pot", async () => {
    const game = await started() // pot is 3: everyone anted 1
    takeAction(game.id, "b", { type: "fold" })
    takeAction(game.id, "c", { type: "fold" })
    expect(gameDAO.get(game.id)!.winnings).toEqual({ a: 3 })
  })

  it("shows every player who won and how much", async () => {
    const game = await started()
    takeAction(game.id, "b", { type: "fold" })
    takeAction(game.id, "c", { type: "fold" })
    expect(getTableView("t1", "b")!.winnings).toEqual({ a: 3 })
  })
})

describe("play again vote", () => {
  it("waits for the delay and enough votes", async () => {
    const game = await started()
    openVote("t1", 2, 1000)
    voteToPlayAgain(game.id, "a")
    expect(voteWon("t1", 2000)).toBe(false)
    voteToPlayAgain(game.id, "b")
    expect(voteWon("t1", 500)).toBe(false)
    expect(voteWon("t1", 2000)).toBe(true)
    closeVote("t1")
  })
})

describe("turn timeout", () => {
  it("checks or folds for a player who runs out of time", async () => {
    await started()
    const turn = humanTurn("t1")!
    expect(timeOut("t1", "old turn")).toBeNull()
    expect(timeOut("t1", turn)).not.toBeNull()
    expect(humanTurn("t1")).not.toBe(turn)
  })
})

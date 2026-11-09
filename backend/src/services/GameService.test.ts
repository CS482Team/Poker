import { configForTable, getTableView, leaveGame, startGame, takeAction } from "../services/GameService"
import { gameDAO } from "../dao/GameDAO"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
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
      { seatNumber: 0, userId: "a", botName: null },
      { seatNumber: 1, userId: "b", botName: null },
      { seatNumber: 2, userId: "c", botName: null },
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
    expect(JSON.stringify(bob.players)).not.toContain("hand")
    expect(bob).not.toHaveProperty("deck")
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

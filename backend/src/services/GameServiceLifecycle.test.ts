import { drawCards, endGame, getTableView, isBotTurn, leaveGame, nextHand, playBot, startIfReady, takeAction } from "../services/GameService"
import { gameDAO } from "../dao/GameDAO"
import { getTable } from "../dao/TableDAO"
import { finishMatch, insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import { updateStack } from "../dao/TablePlayersDAO"

jest.mock("../dao/MatchDAO")
jest.mock("../dao/TablePlayersDAO")
jest.mock("../dao/TableDAO", () => ({ getTable: jest.fn() }))

const seat = (userId: string, seatNumber: number) => ({ userId, username: userId, seatNumber, stack: 100 })
const table = (seats: ReturnType<typeof seat>[]) => ({ id: "t1", name: "Ruby", ante: 1, minimumBet: 2, seats })

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(nextMatchNumber).mockResolvedValue(1)
  jest.mocked(insertMatch).mockResolvedValue("m1")
  jest.mocked(insertMatchPlayers).mockResolvedValue(undefined)
})

describe("table games", () => {
  it("deals once two players are seated, and each sees their cards", async () => {
    jest.mocked(getTable).mockResolvedValue(table([seat("a", 0), seat("b", 1)]) as never)
    expect(await startIfReady("t1")).toEqual(["a", "b"])
    expect(getTableView("t1", "a")?.you.hand).toHaveLength(5)
    expect(await startIfReady("t1")).toBeNull()
    endGame("t1")
    expect(getTableView("t1", "a")).toBeNull()
  })

  it("does not deal for a lone player or a missing table", async () => {
    jest.mocked(getTable).mockResolvedValue(table([seat("a", 0)]) as never)
    expect(await startIfReady("t1")).toBeNull()
    jest.mocked(getTable).mockResolvedValue(null)
    expect(await startIfReady("t1")).toBeNull()
  })

  it("saves stacks and deals the next hand with the next dealer", async () => {
    jest.mocked(getTable).mockResolvedValue(table([seat("a", 0), seat("b", 1)]) as never)
    await startIfReady("t1")
    gameDAO.findByTable("t1")!.phase = "hand-complete"
    expect(await nextHand("t1")).toEqual(["a", "b"])
    expect(updateStack).toHaveBeenCalledTimes(2)
    expect(finishMatch).toHaveBeenCalledWith("m1", null, 2, [{ seatNumber: 0, netResult: -1 }, { seatNumber: 1, netResult: -1 }])
    const game = gameDAO.findByTable("t1")!
    expect(game.players[game.dealerIndex]!.id).toBe("b")
    endGame("t1")
  })

  it("ends the game when the next hand can't be dealt", async () => {
    jest.mocked(getTable).mockResolvedValue(table([seat("a", 0), seat("b", 1)]) as never)
    await startIfReady("t1")
    gameDAO.findByTable("t1")!.phase = "hand-complete"
    jest.mocked(getTable).mockResolvedValue(table([seat("a", 0)]) as never)
    expect(await nextHand("t1")).toEqual(["a", "b"])
    expect(gameDAO.findByTable("t1")).toBeNull()
  })

  it("ends nothing when there is no game", () => {
    endGame("nope")
    expect(gameDAO.findByTable("nope")).toBeNull()
  })
})

describe("bots", () => {
  async function dealWithBots(botCount: number) {
    jest.spyOn(Math, "random").mockReturnValue(0.5)
    jest.mocked(getTable).mockResolvedValue({ ...table([seat("a", 0)]), maxPlayers: 4, buyIn: 100, botCount } as never)
    return startIfReady("t1")
  }

  afterEach(() => {
    endGame("t1")
    jest.restoreAllMocks()
  })

  it("fills the open seats with bots", async () => {
    expect(await dealWithBots(2)).toEqual(["a", "bot-0", "bot-1"])
    expect(jest.mocked(insertMatchPlayers).mock.calls[0]![1][1]).toMatchObject({ userId: null, botName: "NormalPete" })
  })

  it("lets the bots finish the hand after the person leaves", async () => {
    await dealWithBots(2)
    leaveGame("t1", "a")
    while (playBot("t1"));
    expect(gameDAO.findByTable("t1")!.phase).toBe("hand-complete")
  })

  it("keeps the bots for the next hand", async () => {
    await dealWithBots(2)
    gameDAO.findByTable("t1")!.phase = "hand-complete"
    expect(await nextHand("t1")).toEqual(["a", "bot-0", "bot-1"])
    expect(updateStack).toHaveBeenCalledTimes(1)
  })

  it("plays one bot move at a time", async () => {
    await dealWithBots(1)
    expect(isBotTurn("t1")).toBe(true)
    expect(playBot("t1")!.toActIndex).toBe(0)
    expect(playBot("t1")).toBeNull()
  })

  it("lets a person draw between bot moves", async () => {
    await dealWithBots(1)
    const gameId = getTableView("t1", "a")!.gameId
    playBot("t1")
    takeAction(gameId, "a", { type: "check" })
    playBot("t1")
    expect(drawCards(gameId, "a", []).ok).toBe(true)
  })
})

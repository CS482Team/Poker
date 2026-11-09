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
  it("fills seats with bots that play until the hand is over", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5)
    jest.mocked(getTable).mockResolvedValue({ ...table([seat("a", 0)]), maxPlayers: 4, buyIn: 100, botCount: 2 } as never)
    expect(await startIfReady("t1")).toEqual(["a", "bot-0", "bot-1"])
    expect(jest.mocked(insertMatchPlayers).mock.calls[0]![1][1]).toMatchObject({ userId: null, botName: "NormalPete" })
    leaveGame("t1", "a")
    while (playBot("t1"));
    expect(gameDAO.findByTable("t1")!.phase).toBe("hand-complete")
    expect(await nextHand("t1")).toEqual(["a", "bot-0", "bot-1"])
    expect(updateStack).toHaveBeenCalledTimes(1)
    endGame("t1")
    jest.restoreAllMocks()
  })

  it("lets the bots play after a person bets and draws", async () => {
    jest.spyOn(Math, "random").mockReturnValue(0.5)
    jest.mocked(getTable).mockResolvedValue({ ...table([seat("a", 0)]), maxPlayers: 4, buyIn: 100, botCount: 1 } as never)
    await startIfReady("t1")
    const gameId = getTableView("t1", "a")!.gameId
    expect(playBot("t1")!.toActIndex).toBe(0)
    expect(playBot("t1")).toBeNull()
    takeAction(gameId, "a", { type: "check" })
    expect(isBotTurn("t1")).toBe(true)
    playBot("t1")
    expect(drawCards(gameId, "a", []).ok).toBe(true)
    playBot("t1")
    expect(getTableView("t1", "a")).toMatchObject({ phase: "postdraw-betting", toActSeat: 0 })
    expect(drawCards(gameId, "a", [])).toEqual({ ok: false, error: "wrong-phase" })
    expect(drawCards("no-such-game", "a", [])).toEqual({ ok: false, error: "game-not-found" })
    endGame("t1")
    jest.restoreAllMocks()
  })
})

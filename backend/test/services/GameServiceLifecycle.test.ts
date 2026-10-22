import { endGame, getTableView, startIfReady } from "../../src/services/GameService"
import { gameDAO } from "../../src/dao/GameDAO"
import { getTable } from "../../src/dao/TableDAO"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../../src/dao/MatchDAO"

jest.mock("../../src/dao/MatchDAO")
jest.mock("../../src/dao/TableDAO", () => ({ getTable: jest.fn() }))

const seat = (userId: string, seatNumber: number) => ({ userId, username: userId, seatNumber, stack: 100 })
const table = (seats: ReturnType<typeof seat>[]) => ({ id: "t1", ante: 1, minimumBet: 2, seats })

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

  it("ends nothing when there is no game", () => {
    endGame("nope")
    expect(gameDAO.findByTable("nope")).toBeNull()
  })
})

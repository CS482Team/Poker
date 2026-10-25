import { configForTable, getPlayerView, startGame } from "../../src/services/GameService"
import { gameDAO } from "../../src/dao/GameDAO"
import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../../src/dao/MatchDAO"
import type { SeatInput } from "../../../shared/GameState"

jest.mock("../../src/dao/MatchDAO")
jest.mock("../../src/dao/TableDAO", () => ({ getTable: jest.fn() }))

const table = { id: "t1", ante: 1, minimumBet: 2 }
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
  it("uses the table's ante and minimum bet, with the big bet at double", () => {
    expect(configForTable(table)).toEqual({ ante: 1, smallBet: 2, bigBet: 4, maxBetsPerRound: 4 })
  })
})

async function started() {
  const result = await startGame(table, seats)
  if (!result.ok) throw new Error(result.error)
  return result.value
}

describe("startGame", () => {
  it("keeps the dealt game in the store, ready for pre-draw betting", async () => {
    const { gameId } = await started()

    const game = gameDAO.get(gameId)
    expect(game?.phase).toBe("predraw-betting")
    expect(game?.pot).toBe(3)
    for (const p of game?.players ?? []) expect(p.hand).toHaveLength(5)
    gameDAO.delete(gameId)
  })

  it("saves the match with the table's next match number", async () => {
    const { gameId, matchId } = await started()

    expect(insertMatch).toHaveBeenCalledWith({ tableId: "t1", matchNumber: 3, pot: 3, dealerSeat: 0 })
    expect(insertMatchPlayers).toHaveBeenCalledWith("m1", [
      { seatNumber: 0, userId: "a", botName: null },
      { seatNumber: 1, userId: "b", botName: null },
      { seatNumber: 2, userId: "c", botName: null },
    ])
    expect(matchId).toBe("m1")
    gameDAO.delete(gameId)
  })

  it("refuses to start with fewer than 2 players, and saves nothing", async () => {
    expect(await startGame(table, seats.slice(0, 1))).toEqual({ ok: false, error: "too-few-players" })
    expect(insertMatch).not.toHaveBeenCalled()
  })

  it("refuses to deal when fewer than 2 players have chips", async () => {
    const broke = [{ id: "a", name: "Alice", stack: 100 }, { id: "b", name: "Bob", stack: 0 }]
    expect(await startGame(table, broke)).toEqual({ ok: false, error: "too-few-players" })
  })
})

describe("getPlayerView", () => {
  it("shows the player their own cards and only card counts for everyone else", async () => {
    const { gameId } = await started()
    const game = gameDAO.get(gameId)!

    const result = getPlayerView(gameId, "b")

    if (!result.ok) throw new Error(result.error)
    expect(result.value.you).toEqual({ seat: 1, hand: game.players[1]!.hand })
    expect(result.value.players.map(p => p.cardCount)).toEqual([5, 5, 5])
    expect(JSON.stringify(result.value.players)).not.toContain("hand")
    expect(result.value).not.toHaveProperty("deck")
    expect(result.value.toActSeat).toBe(1)
    gameDAO.delete(gameId)
  })

  it("reports a game that doesn't exist", () => {
    expect(getPlayerView("no-such-game", "a")).toEqual({ ok: false, error: "game-not-found" })
  })

  it("reports a player who isn't in the game", async () => {
    const { gameId } = await started()
    expect(getPlayerView(gameId, "stranger")).toEqual({ ok: false, error: "player-not-in-game" })
    gameDAO.delete(gameId)
  })
})

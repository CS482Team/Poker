import request from "supertest"
import { app } from "../../src/app"
import { getPlayerView, startGame, StartGameError, takeAction } from "../../src/services/Game"
import type { PlayerView } from "../../src/services/Game"
import { findOrCreateDemoTable } from "../../src/dao/TableDao"
import { DEMO_SEATS } from "../../src/services/Demo"

jest.mock("../../src/dao/TableDao")
jest.mock("../../src/services/Game", () => ({
  ...jest.requireActual("../../src/services/Game"),
  startGame: jest.fn(),
  getPlayerView: jest.fn(),
  takeAction: jest.fn(),
}))

const table = { id: "t1", ante: 1, minimum_bet: 2 }

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(findOrCreateDemoTable).mockResolvedValue(table)
})

describe("POST /game", () => {
  it("starts a game with the demo bots when no seats are sent", async () => {
    jest.mocked(startGame).mockResolvedValue({ gameId: "g1", matchId: "m1" })

    const res = await request(app).post("/game")

    expect(res.status).toBe(201)
    expect(res.body).toEqual({ gameId: "g1", matchId: "m1" })
    expect(startGame).toHaveBeenCalledWith(table, DEMO_SEATS)
  })

  it("starts a game with the seats sent in the body", async () => {
    jest.mocked(startGame).mockResolvedValue({ gameId: "g1", matchId: "m1" })
    const seats = [{ id: "a", name: "Alice", stack: 50 }, { id: "b", name: "Bob", stack: 50 }]

    const res = await request(app).post("/game").send({ seats })

    expect(res.status).toBe(201)
    expect(startGame).toHaveBeenCalledWith(table, seats)
  })

  it("rejects seats that aren't a list of { id, name, stack }", async () => {
    const res = await request(app).post("/game").send({ seats: [{ id: "a", stack: -5 }] })

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: "invalid-seats" })
    expect(startGame).not.toHaveBeenCalled()
  })

  it("returns 400 with the engine's reason when the game can't start", async () => {
    jest.mocked(startGame).mockRejectedValue(new StartGameError("too-few-players"))

    const res = await request(app).post("/game")

    expect(res.status).toBe(400)
    expect(res.body).toEqual({ error: "too-few-players" })
  })

  it("returns 500 when saving fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
    jest.mocked(startGame).mockRejectedValue(new Error("db down"))

    const res = await request(app).post("/game")

    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: "start-failed" })
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })
})

describe("GET /game/:gameId/view/:playerId", () => {
  it("returns the player's view", async () => {
    const view: PlayerView = {
      gameId: "g1",
      phase: "predraw-betting",
      pot: 4,
      handNumber: 1,
      dealerSeat: 0,
      toActSeat: 1,
      round: null,
      you: { seat: 0, hand: [], legalActions: [] },
      players: [],
    }
    jest.mocked(getPlayerView).mockReturnValue({ ok: true, value: view })

    const res = await request(app).get("/game/g1/view/a")

    expect(res.status).toBe(200)
    expect(res.body).toEqual(view)
    expect(getPlayerView).toHaveBeenCalledWith("g1", "a")
  })

  it("returns 404 when the game or player isn't found", async () => {
    jest.mocked(getPlayerView).mockReturnValue({ ok: false, error: "game-not-found" })

    const res = await request(app).get("/game/nope/view/a")

    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "game-not-found" })
  })
})

describe("POST /game/:gameId/action", () => {
  const view: PlayerView = {
    gameId: "g1",
    phase: "predraw-betting",
    pot: 5,
    handNumber: 1,
    dealerSeat: 0,
    toActSeat: 2,
    round: { street: "predraw", betSize: 2, currentBet: 2, betsMade: 1 },
    you: { seat: 1, hand: [], legalActions: [] },
    players: [],
  }

  it("applies the action and returns the player's updated view", async () => {
    jest.mocked(takeAction).mockReturnValue({ ok: true, value: view })

    const res = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "bet" } })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(view)
    expect(takeAction).toHaveBeenCalledWith("g1", "b", { type: "bet" })
  })

  it("rejects a missing player or an unknown action type", async () => {
    const noPlayer = await request(app).post("/game/g1/action").send({ action: { type: "bet" } })
    const badType = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "all-in" } })

    expect(noPlayer.status).toBe(400)
    expect(badType.status).toBe(400)
    expect(badType.body).toEqual({ error: "invalid-action" })
    expect(takeAction).not.toHaveBeenCalled()
  })

  it.each([
    ["game-not-found", 404],
    ["not-your-turn", 409],
    ["wrong-phase", 409],
    ["illegal-action", 400],
  ] as const)("returns %s as HTTP %i", async (error, status) => {
    jest.mocked(takeAction).mockReturnValue({ ok: false, error })

    const res = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "check" } })

    expect(res.status).toBe(status)
    expect(res.body).toEqual({ error })
  })
})

import request from "supertest"
import { app } from "../../src/app"
import { getPlayerView, takeAction } from "../../src/services/GameService"
import { sendViews } from "../../src/socket/io"
import type { PlayerView } from "../../../shared/PlayerView"

jest.mock("../../src/services/GameService")
jest.mock("../../src/socket/io")

beforeEach(() => jest.clearAllMocks())

describe("GET /game/:gameId/view/:playerId", () => {
  it("returns the player's view", async () => {
    jest.mocked(getPlayerView).mockReturnValue({ ok: true, value: { id: "g1" } } as never)
    const res = await request(app).get("/game/g1/view/a")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ id: "g1" })
  })

  it("404s when the game is not found", async () => {
    jest.mocked(getPlayerView).mockReturnValue({ ok: false, error: "game-not-found" })
    const res = await request(app).get("/game/g1/view/a")
    expect(res.status).toBe(404)
    expect(res.body).toEqual({ error: "game-not-found" })
  })
})

describe("POST /game/:gameId/action", () => {
  const view: PlayerView = {
    gameId: "g1",
    tableId: "t1",
    phase: "predraw-betting",
    pot: 5,
    handNumber: 1,
    dealerSeat: 0,
    toActSeat: 2,
    round: { street: "predraw", currentBet: 10, minRaise: 10 },
    you: { seat: 1, hand: [], legalActions: [] },
    players: [
      { seat: 0, id: "a", name: "Alice", stack: 99, status: "active", betThisRound: 0, cardCount: 5 },
      { seat: 1, id: "b", name: "Bob", stack: 89, status: "active", betThisRound: 10, cardCount: 5 },
    ],
  }

  it("applies the action, returns the player's updated view and sends everyone theirs", async () => {
    jest.mocked(takeAction).mockReturnValue({ ok: true, value: view })

    const res = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "bet", amount: 10 } })

    expect(res.status).toBe(200)
    expect(res.body).toEqual(view)
    expect(takeAction).toHaveBeenCalledWith("g1", "b", { type: "bet", amount: 10 })
    expect(sendViews).toHaveBeenCalledWith("t1", ["a", "b"])
  })

  it("passes actions without an amount through unchanged", async () => {
    jest.mocked(takeAction).mockReturnValue({ ok: true, value: view })

    await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "call" } })

    expect(takeAction).toHaveBeenCalledWith("g1", "b", { type: "call" })
  })

  it("rejects a missing player or an unknown action type", async () => {
    const noPlayer = await request(app).post("/game/g1/action").send({ action: { type: "bet" } })
    const badType = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "all-in" } })
    const badAmount = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "bet", amount: "lots" } })

    expect(noPlayer.status).toBe(400)
    expect(badType.status).toBe(400)
    expect(badAmount.status).toBe(400)
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
    expect(sendViews).not.toHaveBeenCalled()
  })
})

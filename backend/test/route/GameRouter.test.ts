import request from "supertest"
import { app } from "../../src/app"
import { drawCards, takeAction } from "../../src/services/GameService"
import { sendViews } from "../../src/socket/io"

jest.mock("../../src/services/GameService")
jest.mock("../../src/socket/io")

beforeEach(() => jest.clearAllMocks())

describe("POST /game/:gameId/action", () => {
  it("applies the action and sends everyone their view", async () => {
    jest.mocked(takeAction).mockReturnValue({ ok: true, value: { tableId: "t1", players: [{ id: "a" }, { id: "b" }] } } as never)
    const res = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "bet", amount: 10 } })
    expect(res.status).toBe(204)
    expect(takeAction).toHaveBeenCalledWith("g1", "b", { type: "bet", amount: 10 })
    expect(sendViews).toHaveBeenCalledWith("t1", ["a", "b"])
  })

  it("rejects a bad request", async () => {
    const res = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "all-in" } })
    expect(res.status).toBe(400)
    expect(takeAction).not.toHaveBeenCalled()
  })

  it("maps a refused action to its status", async () => {
    jest.mocked(takeAction).mockReturnValue({ ok: false, error: "not-your-turn" })
    const res = await request(app).post("/game/g1/action").send({ playerId: "b", action: { type: "check" } })
    expect(res.status).toBe(409)
    expect(res.body).toEqual({ error: "not-your-turn" })
    expect(sendViews).not.toHaveBeenCalled()
  })
})

describe("POST /game/:gameId/draw", () => {
  it("draws and sends everyone their view", async () => {
    jest.mocked(drawCards).mockReturnValue({ ok: true, value: { tableId: "t1", players: [{ id: "a" }] } } as never)
    const res = await request(app).post("/game/g1/draw").send({ playerId: "a", discard: [0, 2] })
    expect(res.status).toBe(204)
    expect(drawCards).toHaveBeenCalledWith("g1", "a", [0, 2])
    expect(sendViews).toHaveBeenCalledWith("t1", ["a"])
  })

  it("rejects a bad discard list", async () => {
    const res = await request(app).post("/game/g1/draw").send({ playerId: "a", discard: [7] })
    expect(res.status).toBe(400)
  })

  it("rejects duplicate discards", async () => {
    const res = await request(app).post("/game/g1/draw").send({ playerId: "a", discard: [0, 0] })
    expect(res.status).toBe(400)
  })

  it("maps a refused draw to its status", async () => {
    jest.mocked(drawCards).mockReturnValue({ ok: false, error: "wrong-phase" })
    const res = await request(app).post("/game/g1/draw").send({ playerId: "a", discard: [] })
    expect(res.status).toBe(409)
  })
})

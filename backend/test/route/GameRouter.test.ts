import request from "supertest"
import { app } from "../../src/app"
import { getPlayerView } from "../../src/services/GameService"

jest.mock("../../src/services/GameService")

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

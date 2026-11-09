import request from "supertest"
import { app } from "../app"
import { getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers, getRole, getUserIdFromToken } from "../dao/UserDAO"

jest.mock("../dao/MatchDAO", () => ({ getPlayerHands: jest.fn() }))
jest.mock("../dao/UserDAO", () => ({ getAllPlayers: jest.fn(), getRole: jest.fn(), getUserIdFromToken: jest.fn() }))

const player = { id: "u1", username: "Maya", balance: 500, handsPlayed: 3 }
const hand = { matchId: "m1", tableName: "Ruby", handNumber: 2, pot: 80, winner: "Maya", netResult: 40, endedAt: "2026-11-08" }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getUserIdFromToken).mockResolvedValue("admin")
  jest.mocked(getRole).mockResolvedValue(1)
})

describe("AdminRouter", () => {
  it("lists players", async () => {
    jest.mocked(getAllPlayers).mockResolvedValue([player])
    const res = await request(app).get("/admin/players").set("Authorization", "Bearer token")
    expect(res.body).toEqual([player])
  })

  it("lists a player's hands", async () => {
    jest.mocked(getPlayerHands).mockResolvedValue([hand])
    const res = await request(app).get("/admin/players/u1/hands").set("Authorization", "Bearer token")
    expect(res.body).toEqual([hand])
    expect(getPlayerHands).toHaveBeenCalledWith("u1")
  })

  it("keeps non admins out", async () => {
    jest.mocked(getRole).mockResolvedValue(0)
    const res = await request(app).get("/admin/players").set("Authorization", "Bearer token")
    expect(res.status).toBe(403)
  })
})

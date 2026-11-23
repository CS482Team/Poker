import request from "supertest"
import { app } from "../app"
import { getHand, getPlayerHands } from "../dao/MatchDAO"
import { getAllPlayers, getRole, getUserIdFromToken, removeUser, setBalance, unbanUser } from "../dao/UserDAO"
import { getEmail, setPassword } from "../dao/AuthDAO"
import { getReport, resolveReport, resolveResets } from "../dao/ReportDAO"

jest.mock("../dao/MatchDAO", () => ({ getHand: jest.fn(), getPlayerHands: jest.fn() }))
jest.mock("../dao/UserDAO", () => ({ getAllPlayers: jest.fn(), getRole: jest.fn(), getUserIdFromToken: jest.fn(), removeUser: jest.fn(), setBalance: jest.fn(), unbanUser: jest.fn() }))
jest.mock("../dao/AuthDAO", () => ({ getEmail: jest.fn(), setPassword: jest.fn() }))
jest.mock("../dao/ReportDAO", () => ({ getReport: jest.fn(), resolveReport: jest.fn(), resolveResets: jest.fn(), getReports: jest.fn() }))

const player = { id: "u1", username: "Maya", balance: 500, handsPlayed: 3, banned: false }
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

  it("shows one hand", async () => {
    jest.mocked(getHand).mockResolvedValue({ id: "m1", handNumber: 1, pot: 3, endedAt: null, players: [], actions: [] })
    const res = await request(app).get("/admin/hands/m1").set("Authorization", "Bearer token")
    expect(res.body.handNumber).toBe(1)
    jest.mocked(getHand).mockResolvedValue(null)
    expect((await request(app).get("/admin/hands/m2").set("Authorization", "Bearer token")).status).toBe(404)
  })

  it("removes a player", async () => {
    const res = await request(app).delete("/admin/players/u1").set("Authorization", "Bearer token")
    expect(res.status).toBe(204)
    expect(removeUser).toHaveBeenCalledWith("u1")
  })

  it("unbans a player", async () => {
    const res = await request(app).post("/admin/players/u1/unban").set("Authorization", "Bearer token")
    expect(res.status).toBe(204)
    expect(unbanUser).toHaveBeenCalledWith("u1")
  })

  it("modifies a player's chips", async () => {
    const res = await request(app).patch("/admin/players/u1/balance").set("Authorization", "Bearer token").send({ balance: 900 })
    expect(res.status).toBe(204)
    expect(setBalance).toHaveBeenCalledWith("u1", 900)
  })

  it("rejects a bad balance", async () => {
    const res = await request(app).patch("/admin/players/u1/balance").set("Authorization", "Bearer token").send({ balance: -5 })
    expect(res.status).toBe(400)
    expect(setBalance).not.toHaveBeenCalled()
  })

  it("keeps non admins out", async () => {
    jest.mocked(getRole).mockResolvedValue(0)
    const res = await request(app).get("/admin/players").set("Authorization", "Bearer token")
    expect(res.status).toBe(403)
  })
})

describe("POST /admin/players/:id/password", () => {
  it("sets the new password and returns the email to pass it on to", async () => {
    jest.mocked(getEmail).mockResolvedValue("maya@test.local")
    const res = await request(app).post("/admin/players/u1/password").set("Authorization", "Bearer token").send({ password: "newpass1" })
    expect(res.body).toEqual({ email: "maya@test.local" })
    expect(setPassword).toHaveBeenCalledWith("u1", "newpass1")
    expect(resolveResets).toHaveBeenCalledWith("u1")
  })

  it("rejects a short password or a guest", async () => {
    expect((await request(app).post("/admin/players/u1/password").set("Authorization", "Bearer token").send({ password: "123" })).status).toBe(400)
    jest.mocked(getEmail).mockResolvedValue(null)
    expect((await request(app).post("/admin/players/u1/password").set("Authorization", "Bearer token").send({ password: "newpass1" })).status).toBe(400)
    expect(setPassword).not.toHaveBeenCalled()
  })
})

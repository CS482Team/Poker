import request from "supertest"
import { app } from "../app"
import { logBalanceChange } from "../dao/BalanceLogDAO"
import { getActiveEvent } from "../dao/EventDAO"
import { createTable, deleteTable, getAllTables, getTable, updateTableSettings } from "../dao/TableDAO"
import { addPlayer, countPlayers, removePlayer } from "../dao/TablePlayersDAO"
import { getBalance, getProfile, getUserIdFromToken, getUsername, setBalance } from "../dao/UserDAO"
import { sendSystemMessage } from "../services/ChatService"

jest.mock("../dao/TableDAO", () => ({
  getAllTables: jest.fn(),
  getTable: jest.fn(),
  createTable: jest.fn(),
  deleteTable: jest.fn(),
  updateTableSettings: jest.fn(),
}))
jest.mock("../dao/TablePlayersDAO", () => ({
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  countPlayers: jest.fn(),
}))
jest.mock("../dao/UserDAO", () => ({
  getUserIdFromToken: jest.fn(),
  getProfile: jest.fn(),
  getBalance: jest.fn(),
  getUsername: jest.fn(),
  setBalance: jest.fn(),
}))
jest.mock("../dao/EventDAO", () => ({ getActiveEvent: jest.fn() }))
jest.mock("../dao/BalanceLogDAO", () => ({
  logBalanceChange: jest.fn(),
}))
// cosmetics are tested in ShopService.test.ts; here the table passes straight through
jest.mock("../services/ShopService", () => ({ withCosmetics: async (table: unknown) => table }))
jest.mock("../services/ChatService", () => ({
  ...jest.requireActual("../services/ChatService"),
  sendSystemMessage: jest.fn(),
}))

const validTable = { name: "Table", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 }
const seat = { userId: "u1", username: "Maya", seatNumber: 0, stack: 150 }
const detail = { id: "t1", name: "Table", hostId: "u1", maxPlayers: 2, buyIn: 150, status: 1, variant: "five-card-draw", minimumBet: 5, ante: 1, botCount: 0, chatEnabled: true, turnTimerEnabled: true, seats: [seat] }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getUserIdFromToken).mockImplementation(async (token) => token)
  jest.mocked(getProfile).mockResolvedValue({ id: "u1", username: "Maya", avatarUrl: null, email: "", isGuest: false })
})

describe("tables", () => {
  it("lists tables", async () => {
    jest.mocked(getAllTables).mockResolvedValue([])
    const res = await request(app).get("/tables")
    expect(res.status).toBe(200)
  })

  it("gets a table", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    const res = await request(app).get("/tables/t1")
    expect(res.body.name).toBe("Table")
  })

  it("returns 404 for a missing table", async () => {
    jest.mocked(getTable).mockResolvedValue(null)
    const res = await request(app).get("/tables/missing")
    expect(res.status).toBe(404)
  })

  it("creates a table", async () => {
    jest.mocked(createTable).mockResolvedValue("new-id")
    const res = await request(app).post("/tables").set("Authorization", "Bearer u1").send(validTable)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: "new-id" })
  })

  it("does not let guests create tables", async () => {
    jest.mocked(getProfile).mockResolvedValue({ id: "u1", username: "Guest1234", avatarUrl: null, email: "", isGuest: true })
    const res = await request(app).post("/tables").set("Authorization", "Bearer u1").send(validTable)
    expect(res.status).toBe(403)
    expect(createTable).not.toHaveBeenCalled()
  })

  it("rejects an invalid table", async () => {
    const res = await request(app).post("/tables").set("Authorization", "Bearer u1").send({ ...validTable, maxPlayers: 7 })
    expect(res.status).toBe(400)
  })

  it("rejects bots that fill every seat", async () => {
    const res = await request(app).post("/tables").set("Authorization", "Bearer u1").send({ ...validTable, botCount: validTable.maxPlayers })
    expect(res.status).toBe(400)
  })
})

describe("players", () => {
  it("seats a player at the first free seat", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(1000)
    const res = await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(res.status).toBe(204)
    expect(addPlayer).toHaveBeenCalledWith("t1", "me", 1, 150, 0)
    expect(setBalance).toHaveBeenCalledWith("me", 850)
    expect(logBalanceChange).toHaveBeenCalledWith("me", -150, "buy_in")
  })

  it("multiplies the stack during a promo event", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(1000)
    jest.mocked(getActiveEvent).mockResolvedValue({ id: "e1", name: "Double", multiplier: 2, expiresAt: "2999-01-01" })
    await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(addPlayer).toHaveBeenCalledWith("t1", "me", 1, 300, 150)
    expect(setBalance).toHaveBeenCalledWith("me", 850)
  })

  it("rejects a join without enough balance", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(10)
    const res = await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(res.status).toBe(409)
    expect(addPlayer).not.toHaveBeenCalled()
  })

  it("does not seat a player twice", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    await request(app).post("/tables/t1/players").set("Authorization", "Bearer u1")
    expect(addPlayer).not.toHaveBeenCalled()
  })

  it("rejects a join when the table is full", async () => {
    jest.mocked(getTable).mockResolvedValue({ ...detail, maxPlayers: 1 })
    const res = await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(res.status).toBe(409)
  })

  it("rejects a join when bots fill the open seats", async () => {
    jest.mocked(getTable).mockResolvedValue({ ...detail, botCount: 1 })
    const res = await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(res.status).toBe(409)
  })

  it("rejects a join without a user", async () => {
    const res = await request(app).post("/tables/t1/players")
    expect(res.status).toBe(401)
  })

  it("returns 404 when joining a missing table", async () => {
    jest.mocked(getTable).mockResolvedValue(null)
    const res = await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(res.status).toBe(404)
  })

  it("returns the stack to the balance when a player leaves", async () => {
    jest.mocked(removePlayer).mockResolvedValue({ stack: 200, bonus: 0 })
    jest.mocked(getBalance).mockResolvedValue(800)
    jest.mocked(countPlayers).mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(setBalance).toHaveBeenCalledWith("u1", 1000)
    expect(logBalanceChange).toHaveBeenCalledWith("u1", 200, "cash_out")
  })

  it("keeps the promo bonus at the table when a player leaves", async () => {
    jest.mocked(removePlayer).mockResolvedValue({ stack: 300, bonus: 150 })
    jest.mocked(getBalance).mockResolvedValue(850)
    jest.mocked(countPlayers).mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(setBalance).toHaveBeenCalledWith("u1", 1000)
    expect(logBalanceChange).toHaveBeenCalledWith("u1", 150, "cash_out")
  })

  it("keeps the table when players remain", async () => {
    jest.mocked(countPlayers).mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(deleteTable).not.toHaveBeenCalled()
  })

  it("deletes the table when the last player leaves", async () => {
    jest.mocked(countPlayers).mockResolvedValue(0)
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(deleteTable).toHaveBeenCalledWith("t1")
  })
})

describe("chat announcements", () => {
  it("announces a player joining", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(1000)
    jest.mocked(getUsername).mockResolvedValue("Cara")
    await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(getUsername).toHaveBeenCalledWith("me")
    expect(sendSystemMessage).toHaveBeenCalledWith("t1", "Cara joined the table")
  })

  it("announces a player leaving when others remain", async () => {
    jest.mocked(removePlayer).mockResolvedValue({ stack: 200, bonus: 0 })
    jest.mocked(getBalance).mockResolvedValue(800)
    jest.mocked(countPlayers).mockResolvedValue(1)
    jest.mocked(getUsername).mockResolvedValue("Maya")
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(sendSystemMessage).toHaveBeenCalledWith("t1", "Maya left the table")
  })

  it("says nothing when the last player leaves, since the chat is deleted with the table", async () => {
    jest.mocked(removePlayer).mockResolvedValue({ stack: 200, bonus: 0 })
    jest.mocked(getBalance).mockResolvedValue(800)
    jest.mocked(countPlayers).mockResolvedValue(0)
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(sendSystemMessage).not.toHaveBeenCalled()
  })

  it("says nothing when someone who wasn't seated leaves", async () => {
    jest.mocked(removePlayer).mockResolvedValue(null)
    jest.mocked(countPlayers).mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(sendSystemMessage).not.toHaveBeenCalled()
  })

  it("still seats the player when the chat message fails", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(1000)
    jest.mocked(getUsername).mockResolvedValue("Cara")
    jest.mocked(sendSystemMessage).mockRejectedValue(new Error("db down"))
    jest.spyOn(console, "error").mockImplementation(() => {})
    const res = await request(app).post("/tables/t1/players").set("Authorization", "Bearer me")
    expect(res.status).toBe(204)
    expect(addPlayer).toHaveBeenCalled()
  })

  it("still lets the player leave when the chat message fails", async () => {
    jest.mocked(removePlayer).mockResolvedValue({ stack: 200, bonus: 0 })
    jest.mocked(getBalance).mockResolvedValue(800)
    jest.mocked(countPlayers).mockResolvedValue(1)
    jest.mocked(getUsername).mockRejectedValue(new Error("db down"))
    jest.spyOn(console, "error").mockImplementation(() => {})
    const res = await request(app).delete("/tables/t1/players/me").set("Authorization", "Bearer u1")
    expect(res.status).toBe(204)
    expect(setBalance).toHaveBeenCalledWith("u1", 1000)
  })
})

describe("settings", () => {
  const settings = { name: " New name ", botCount: 1, chatEnabled: false, turnTimerEnabled: true }

  it("lets the host change the settings", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    const res = await request(app).patch("/tables/t1").set("Authorization", "Bearer u1").send(settings)
    expect(res.status).toBe(204)
    expect(updateTableSettings).toHaveBeenCalledWith("t1", { name: "New name", botCount: 1, chatEnabled: false, turnTimerEnabled: true })
  })

  it("rejects a change from someone who is not the host", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    const res = await request(app).patch("/tables/t1").set("Authorization", "Bearer other").send(settings)
    expect(res.status).toBe(403)
    expect(updateTableSettings).not.toHaveBeenCalled()
  })

  it("rejects as many bots as seats", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    const res = await request(app).patch("/tables/t1").set("Authorization", "Bearer u1").send({ ...settings, botCount: 2 })
    expect(res.status).toBe(400)
  })

  it("returns 404 for a missing table", async () => {
    jest.mocked(getTable).mockResolvedValue(null)
    const res = await request(app).patch("/tables/t1").set("Authorization", "Bearer u1").send(settings)
    expect(res.status).toBe(404)
  })
})
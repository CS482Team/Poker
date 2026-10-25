import request from "supertest"
import { app } from "../../src/app"
import { logBalanceChange } from "../../src/dao/BalanceLogDAO"
import { createTable, deleteTable, getAllTables, getTable } from "../../src/dao/TableDAO"
import { addPlayer, countPlayers, removePlayer } from "../../src/dao/TablePlayersDAO"
import { getBalance, setBalance } from "../../src/dao/UserDAO"

jest.mock("../../src/dao/TableDAO", () => ({
  getAllTables: jest.fn(),
  getTable: jest.fn(),
  createTable: jest.fn(),
  deleteTable: jest.fn(),
}))
jest.mock("../../src/dao/TablePlayersDAO", () => ({
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  countPlayers: jest.fn(),
}))
jest.mock("../../src/dao/UserDAO", () => ({
  getBalance: jest.fn(),
  setBalance: jest.fn(),
}))
jest.mock("../../src/dao/BalanceLogDAO", () => ({
  logBalanceChange: jest.fn(),
}))

const validTable = { hostId: "u1", name: "Table", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 }
const seat = { userId: "u1", username: "Maya", seatNumber: 0, stack: 150 }
const detail = { id: "t1", name: "Table", maxPlayers: 2, buyIn: 150, status: 1, variant: "five-card-draw", minimumBet: 5, ante: 1, seats: [seat] }

beforeEach(() => {
  jest.resetAllMocks()
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
    const res = await request(app).post("/tables").send(validTable)
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ id: "new-id" })
  })

  it("rejects an invalid table", async () => {
    const res = await request(app).post("/tables").send({ ...validTable, maxPlayers: 7 })
    expect(res.status).toBe(400)
  })
})

describe("players", () => {
  it("seats a player at the first free seat", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(1000)
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(204)
    expect(addPlayer).toHaveBeenCalledWith("t1", "me", 1, 150)
    expect(setBalance).toHaveBeenCalledWith("me", 850)
    expect(logBalanceChange).toHaveBeenCalledWith("me", -150, "buy_in")
  })

  it("rejects a join without enough balance", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    jest.mocked(getBalance).mockResolvedValue(10)
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(409)
    expect(addPlayer).not.toHaveBeenCalled()
  })

  it("does not seat a player twice", async () => {
    jest.mocked(getTable).mockResolvedValue(detail)
    await request(app).post("/tables/t1/players").send({ userId: "u1" })
    expect(addPlayer).not.toHaveBeenCalled()
  })

  it("rejects a join when the table is full", async () => {
    jest.mocked(getTable).mockResolvedValue({ ...detail, maxPlayers: 1 })
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(409)
  })

  it("rejects a join without a user", async () => {
    const res = await request(app).post("/tables/t1/players").send({})
    expect(res.status).toBe(400)
  })

  it("returns 404 when joining a missing table", async () => {
    jest.mocked(getTable).mockResolvedValue(null)
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(404)
  })

  it("returns the stack to the balance when a player leaves", async () => {
    jest.mocked(removePlayer).mockResolvedValue(200)
    jest.mocked(getBalance).mockResolvedValue(800)
    jest.mocked(countPlayers).mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/u1")
    expect(setBalance).toHaveBeenCalledWith("u1", 1000)
    expect(logBalanceChange).toHaveBeenCalledWith("u1", 200, "cash_out")
  })

  it("keeps the table when players remain", async () => {
    jest.mocked(countPlayers).mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/u1")
    expect(deleteTable).not.toHaveBeenCalled()
  })

  it("deletes the table when the last player leaves", async () => {
    jest.mocked(countPlayers).mockResolvedValue(0)
    await request(app).delete("/tables/t1/players/u1")
    expect(deleteTable).toHaveBeenCalledWith("t1")
  })
})

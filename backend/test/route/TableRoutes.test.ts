import request from "supertest"
import { app } from "../../src/app"
import * as dao from "../../src/db/TableDAO"

jest.mock("../../src/db/TableDAO", () => ({
  getAllTables: jest.fn(),
  getTable: jest.fn(),
  createTable: jest.fn(),
  addPlayer: jest.fn(),
  removePlayer: jest.fn(),
  countPlayers: jest.fn(),
  deleteTable: jest.fn(),
}))

const mockedDao = jest.mocked(dao)

const validTable = { name: "Room", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 }
const seat = { userId: "u1", username: "Maya", seatNumber: 0, stack: 150 }
const detail = { id: "t1", name: "Room", maxPlayers: 2, buyIn: 150, seats: [seat] }

beforeEach(() => {
  jest.resetAllMocks()
})

describe("tables", () => {
  it("lists tables", async () => {
    mockedDao.getAllTables.mockResolvedValue([])
    const res = await request(app).get("/tables")
    expect(res.status).toBe(200)
  })

  it("gets a table", async () => {
    mockedDao.getTable.mockResolvedValue(detail)
    const res = await request(app).get("/tables/t1")
    expect(res.body.name).toBe("Room")
  })

  it("returns 404 for a missing table", async () => {
    mockedDao.getTable.mockResolvedValue(null)
    const res = await request(app).get("/tables/missing")
    expect(res.status).toBe(404)
  })

  it("creates a table", async () => {
    mockedDao.createTable.mockResolvedValue("new-id")
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
    mockedDao.getTable.mockResolvedValue(detail)
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(204)
    expect(mockedDao.addPlayer).toHaveBeenCalledWith("t1", "me", 1, 150)
  })

  it("does not seat a player twice", async () => {
    mockedDao.getTable.mockResolvedValue(detail)
    await request(app).post("/tables/t1/players").send({ userId: "u1" })
    expect(mockedDao.addPlayer).not.toHaveBeenCalled()
  })

  it("rejects a join when the table is full", async () => {
    mockedDao.getTable.mockResolvedValue({ ...detail, maxPlayers: 1 })
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(409)
  })

  it("rejects a join without a user", async () => {
    const res = await request(app).post("/tables/t1/players").send({})
    expect(res.status).toBe(400)
  })

  it("returns 404 when joining a missing table", async () => {
    mockedDao.getTable.mockResolvedValue(null)
    const res = await request(app).post("/tables/t1/players").send({ userId: "me" })
    expect(res.status).toBe(404)
  })

  it("keeps the table when players remain", async () => {
    mockedDao.countPlayers.mockResolvedValue(1)
    await request(app).delete("/tables/t1/players/u1")
    expect(mockedDao.deleteTable).not.toHaveBeenCalled()
  })

  it("deletes the table when the last player leaves", async () => {
    mockedDao.countPlayers.mockResolvedValue(0)
    await request(app).delete("/tables/t1/players/u1")
    expect(mockedDao.deleteTable).toHaveBeenCalledWith("t1")
  })
})

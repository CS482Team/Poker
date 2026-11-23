import request from "supertest"
import { app } from "../app"
import { createEvent, endEvent, getActiveEvent } from "../dao/EventDAO"
import { getRole, getUserIdFromToken } from "../dao/UserDAO"

jest.mock("../dao/EventDAO", () => ({ getActiveEvent: jest.fn(), createEvent: jest.fn(), endEvent: jest.fn() }))
jest.mock("../dao/UserDAO", () => ({ getRole: jest.fn(), getUserIdFromToken: jest.fn() }))

const event = { id: "e1", name: "Double", multiplier: 2, expiresAt: "2999-01-01" }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getUserIdFromToken).mockResolvedValue("admin")
  jest.mocked(getRole).mockResolvedValue(1)
})

describe("EventRouter", () => {
  it("returns the active event", async () => {
    jest.mocked(getActiveEvent).mockResolvedValue(event)
    const res = await request(app).get("/events/active")
    expect(res.body).toEqual(event)
  })

  it("creates an event", async () => {
    jest.mocked(getActiveEvent).mockResolvedValue(null)
    const res = await request(app).post("/events").set("Authorization", "Bearer token").send({ name: "Double", multiplier: 2, days: 3 })
    expect(res.status).toBe(201)
    expect(createEvent).toHaveBeenCalledWith("Double", 2, 3, "admin")
  })

  it("rejects a multiplier out of range", async () => {
    const res = await request(app).post("/events").set("Authorization", "Bearer token").send({ name: "Huge", multiplier: 5, days: 3 })
    expect(res.status).toBe(400)
  })

  it("allows only one running event", async () => {
    jest.mocked(getActiveEvent).mockResolvedValue(event)
    const res = await request(app).post("/events").set("Authorization", "Bearer token").send({ name: "Double", multiplier: 2, days: 3 })
    expect(res.status).toBe(409)
    expect(createEvent).not.toHaveBeenCalled()
  })

  it("ends an event", async () => {
    const res = await request(app).delete("/events/e1").set("Authorization", "Bearer token")
    expect(res.status).toBe(204)
    expect(endEvent).toHaveBeenCalledWith("e1")
  })
})

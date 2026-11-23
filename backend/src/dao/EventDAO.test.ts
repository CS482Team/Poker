import { createEvent, endEvent, getActiveEvent } from "../dao/EventDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("EventDAO", () => {
  it("reads the newest active event", async () => {
    mockState.result = { data: { id: "e1", name: "Double", multiplier: "2.00", expires_at: "2999-01-01" } }
    expect(await getActiveEvent()).toEqual({ id: "e1", name: "Double", multiplier: 2, expiresAt: "2999-01-01" })
    expect(calls).toContainEqual(["from", ["event"]])
  })

  it("returns null with no active event", async () => {
    mockState.result = { data: null }
    expect(await getActiveEvent()).toBeNull()
  })

  it("creates an event", async () => {
    await createEvent("Double", 2, 3, "admin")
    expect(calls).toContainEqual(["from", ["event"]])
    expect(calls.find(([name]) => name === "insert")![1][0]).toMatchObject({ name: "Double", multiplier: 2, created_by: "admin" })
  })

  it("ends an event", async () => {
    await endEvent("e1")
    expect(calls).toContainEqual(["eq", ["id", "e1"]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getActiveEvent()).rejects.toThrow("db down")
    await expect(createEvent("Double", 2, 3, "admin")).rejects.toThrow("db down")
    await expect(endEvent("e1")).rejects.toThrow("db down")
  })
})

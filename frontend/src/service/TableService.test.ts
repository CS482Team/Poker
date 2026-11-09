import { createTable, fetchTable, fetchTables, joinTable, leaveTable } from "@/service/TableService"

const table = { hostId: "u1", name: "Table", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 }

function respond(ok: boolean, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

describe("tableService", () => {
  it("fetches tables", async () => {
    respond(true, [{ id: "t1" }])
    expect(await fetchTables()).toEqual([{ id: "t1" }])
    expect(await fetchTable("t1")).toEqual([{ id: "t1" }])
  })

  it("creates a table", async () => {
    respond(true, { id: "new-id" })
    expect(await createTable(table)).toBe("new-id")
  })

  it("joins and leaves", async () => {
    respond(true)
    await joinTable("t1", "u1")
    await leaveTable("t1", "u1")
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it("shows the server's reason when joining fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: "Insufficient balance" }) })
    await expect(joinTable("t1", "u1")).rejects.toThrow("Failed to join table: Insufficient balance")
  })

  it("shows the server's reason when creating or leaving fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "Invalid table" }) })
    await expect(createTable(table)).rejects.toThrow("Failed to create table: Invalid table")
    await expect(leaveTable("t1", "u1")).rejects.toThrow("Failed to leave table: Invalid table")
  })

  it("falls back to the status code when the server gives no reason", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 502, json: async () => Promise.reject(new Error("not json")) })
    await expect(joinTable("t1", "u1")).rejects.toThrow("Failed to join table (502)")
  })

  it("throws when a request fails", async () => {
    respond(false)
    await expect(fetchTables()).rejects.toThrow("500")
    await expect(fetchTable("t1")).rejects.toThrow("500")
    await expect(createTable(table)).rejects.toThrow("500")
    await expect(joinTable("t1", "u1")).rejects.toThrow("500")
    await expect(leaveTable("t1", "u1")).rejects.toThrow("500")
  })
})

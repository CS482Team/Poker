import { createTable, fetchTable, fetchTables, joinTable, leaveTable } from "@/service/tableService"

const table = { hostId: "u1", name: "Room", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 }

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

  it("throws when a request fails", async () => {
    respond(false)
    await expect(fetchTables()).rejects.toThrow("500")
    await expect(fetchTable("t1")).rejects.toThrow("500")
    await expect(createTable(table)).rejects.toThrow("500")
    await expect(joinTable("t1", "u1")).rejects.toThrow("500")
    await expect(leaveTable("t1", "u1")).rejects.toThrow("500")
  })
})

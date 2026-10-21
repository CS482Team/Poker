import { createTable, deleteTable, getAllTables, getTable } from "../../src/dao/TableDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const newTable = { hostId: "u1", name: "New", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 }

beforeEach(resetMock)

describe("TableDAO", () => {
  it("lists tables", async () => {
    mockState.result = {
      data: [{ id: "t1", name: "One", status: 0, variant: "five_card_draw", buy_in: 100, minimum_bet: 5, ante: 1, max_players: 6, bot_count: 1, table_players: [{ count: 2 }] }],
    }
    const tables = await getAllTables()
    expect(tables[0].players).toBe(3)
  })

  it("gets a table with its seats", async () => {
    mockState.result = {
      data: { id: "t1", name: "One", max_players: 6, buy_in: 100, table_players: [{ user_id: "u1", seat_number: 2, stack: 100, user: { username: "Maya" } }] },
    }
    const table = await getTable("t1")
    expect(table?.seats[0].username).toBe("Maya")
  })

  it("returns null for a missing table", async () => {
    mockState.result = { data: null }
    expect(await getTable("missing")).toBeNull()
  })

  it("creates a table with its host", async () => {
    mockState.result = { data: { id: "new-id" } }
    expect(await createTable(newTable)).toBe("new-id")
    expect(calls).toContainEqual(["insert", [{ name: "New", max_players: 4, buy_in: 100, minimum_bet: 5, ante: 1, host_id: "u1" }]])
  })

  it("deletes the table by id", async () => {
    await deleteTable("t1")
    expect(calls).toContainEqual(["from", ["table"]])
    expect(calls).toContainEqual(["eq", ["id", "t1"]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getAllTables()).rejects.toThrow("db down")
    await expect(getTable("t1")).rejects.toThrow("db down")
    await expect(createTable(newTable)).rejects.toThrow("db down")
    await expect(deleteTable("t1")).rejects.toThrow("db down")
  })
})

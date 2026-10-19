import {
  addPlayer,
  countPlayers,
  createTable,
  deleteTable,
  getAllTables,
  getTable,
  removePlayer,
} from "../../src/db/TableDAO"

const mockState: { result: object } = { result: {} }
const mockQuery: Record<string, unknown> = {
  select: () => mockQuery,
  insert: () => mockQuery,
  delete: () => mockQuery,
  eq: () => mockQuery,
  order: () => mockQuery,
  single: () => Promise.resolve(mockState.result),
  maybeSingle: () => Promise.resolve(mockState.result),
  then: (resolve: (value: object) => void) => resolve(mockState.result),
}

jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ from: () => mockQuery }),
}))

const failure = { error: new Error("db down") }

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

  it("creates a table", async () => {
    mockState.result = { data: { id: "new-id" } }
    const id = await createTable({ name: "New", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 })
    expect(id).toBe("new-id")
  })

  it("counts players", async () => {
    mockState.result = { count: 3 }
    expect(await countPlayers("t1")).toBe(3)
  })

  it("adds, removes and deletes without error", async () => {
    mockState.result = {}
    await addPlayer("t1", "u1", 0, 100)
    await removePlayer("t1", "u1")
    await deleteTable("t1")
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getAllTables()).rejects.toThrow("db down")
    await expect(getTable("t1")).rejects.toThrow("db down")
    await expect(createTable({ name: "New", maxPlayers: 4, buyIn: 100, minimumBet: 5, ante: 1 })).rejects.toThrow("db down")
    await expect(addPlayer("t1", "u1", 0, 100)).rejects.toThrow("db down")
    await expect(removePlayer("t1", "u1")).rejects.toThrow("db down")
    await expect(countPlayers("t1")).rejects.toThrow("db down")
    await expect(deleteTable("t1")).rejects.toThrow("db down")
  })
})

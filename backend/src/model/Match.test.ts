import { insertMatch, insertMatchPlayers, nextMatchNumber} from "./Match"
import { getSupabase } from "../config/Supabase"

jest.mock("../config/Supabase")

// Fake Supabase query: every method returns the same object, and `await` on it gives `result`
function fakeQuery(result: { data: unknown; error: unknown }) {
  const q: { [method: string]: jest.Mock } = {}
  for (const m of ["select", "insert", "update", "eq", "order", "limit", "single", "maybeSingle"]) q[m] = jest.fn(() => q)
  q.then = jest.fn((resolve: (v: unknown) => void) => resolve(result))
  return q
}

// Make getSupabase().from(...) return the given fake query
function useFakeQuery(q: ReturnType<typeof fakeQuery>) {
  const from = jest.fn(() => q)
  jest.mocked(getSupabase).mockReturnValue({ from } as unknown as ReturnType<typeof getSupabase>)
  return from
}

describe("insertMatch", () => {
  it("inserts a match row and returns its id", async () => {
    const q = fakeQuery({ data: { id: "m1" }, error: null })
    const from = useFakeQuery(q)

    const id = await insertMatch({ tableId: "t1", matchNumber: 1, pot: 4, dealerSeat: 0 })

    expect(from).toHaveBeenCalledWith("match")
    expect(q.insert).toHaveBeenCalledWith({ table_id: "t1", match_number: 1, pot: 4, dealer_seat: 0 })
    expect(id).toBe("m1")
  })

  it("throws when Supabase returns an error", async () => {
    useFakeQuery(fakeQuery({ data: null, error: new Error("boom") }))
    await expect(insertMatch({ tableId: "t1", matchNumber: 1, pot: 4, dealerSeat: 0 })).rejects.toThrow("boom")
  })
})

describe("insertMatchPlayers", () => {
  it("inserts one row per player, with bots stored by name", async () => {
    const q = fakeQuery({ data: null, error: null })
    const from = useFakeQuery(q)

    await insertMatchPlayers("m1", [
      { seatNumber: 0, userId: null, botName: "Alice" },
      { seatNumber: 1, userId: null, botName: "Bob" },
    ])

    expect(from).toHaveBeenCalledWith("match_players")
    expect(q.insert).toHaveBeenCalledWith([
      { match_id: "m1", seat_number: 0, user_id: null, bot_name: "Alice" },
      { match_id: "m1", seat_number: 1, user_id: null, bot_name: "Bob" },
    ])
  })
  it("throws when Supabase returns an error", async () => {
    useFakeQuery(fakeQuery({ data: null, error: new Error("boom") }))
    await expect(insertMatchPlayers("m1", [])).rejects.toThrow("boom")
  })
})

describe("nextMatchNumber", () => {
  it("returns 1 for a table with no matches yet", async () => {
    const q = fakeQuery({ data: null, error: null })
    useFakeQuery(q)

    expect(await nextMatchNumber("t1")).toBe(1)
    expect(q.eq).toHaveBeenCalledWith("table_id", "t1")
  })

  it("returns one more than the table's highest match number", async () => {
    useFakeQuery(fakeQuery({ data: { match_number: 7 }, error: null }))
    expect(await nextMatchNumber("t1")).toBe(8)
  })
  it("throws when Supabase returns an error", async () => {
    useFakeQuery(fakeQuery({ data: null, error: new Error("boom") }))
    await expect(nextMatchNumber("t1")).rejects.toThrow("boom")
  })
})

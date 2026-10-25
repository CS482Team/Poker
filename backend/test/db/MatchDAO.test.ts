import { insertMatch, insertMatchPlayers, nextMatchNumber } from "../../src/dao/MatchDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("MatchDao", () => {
  it("saves a match and returns its id", async () => {
    mockState.result = { data: { id: "m1" } }
    expect(await insertMatch({ tableId: "t1", matchNumber: 1, pot: 3, dealerSeat: 0 })).toBe("m1")
    expect(calls).toContainEqual(["from", ["match"]])
  })

  it("saves the players of a match", async () => {
    await insertMatchPlayers("m1", [{ seatNumber: 0, userId: "a", botName: null }])
    expect(calls).toContainEqual(["from", ["match_players"]])
  })

  it("numbers the next match one higher", async () => {
    mockState.result = { data: { match_number: 4 } }
    expect(await nextMatchNumber("t1")).toBe(5)
  })

  it("starts a new table at match 1", async () => {
    mockState.result = { data: null }
    expect(await nextMatchNumber("t1")).toBe(1)
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(nextMatchNumber("t1")).rejects.toThrow("db down")
    await expect(insertMatch({ tableId: "t1", matchNumber: 1, pot: 0, dealerSeat: 0 })).rejects.toThrow("db down")
    await expect(insertMatchPlayers("m1", [])).rejects.toThrow("db down")
  })
})

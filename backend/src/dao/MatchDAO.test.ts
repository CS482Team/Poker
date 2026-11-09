import { finishMatch, getPlayerHands, insertMatch, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("MatchDao", () => {
  it("saves a match and returns its id", async () => {
    mockState.result = { data: { id: "m1" } }
    expect(await insertMatch({ tableId: "t1", tableName: "Ruby", matchNumber: 1, pot: 3, dealerSeat: 0 })).toBe("m1")
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

  it("saves the winner and each player's result", async () => {
    await finishMatch("m1", "a", 480, [{ seatNumber: 0, netResult: 40 }])
    expect(calls).toContainEqual(["eq", ["id", "m1"]])
    expect(calls).toContainEqual(["update", [expect.objectContaining({ winner_id: "a", pot: 480 })]])
    expect(calls).toContainEqual(["update", [{ net_result: 40 }]])
    expect(calls).toContainEqual(["eq", ["seat_number", 0]])
  })

  it("lists a player's finished hands", async () => {
    mockState.result = {
      data: [
        { net_result: 40, match: { id: "m1", table_name: "Ruby", match_number: 2, pot: 80, ended_at: "2026-11-08", winner: { username: "Maya" } } },
        { net_result: 0, match: { id: "m2", table_name: "Ruby", match_number: 3, pot: 0, ended_at: null, winner: null } },
      ],
    }
    expect(await getPlayerHands("a")).toEqual([{ matchId: "m1", tableName: "Ruby", handNumber: 2, pot: 80, winner: "Maya", netResult: 40, endedAt: "2026-11-08" }])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(nextMatchNumber("t1")).rejects.toThrow("db down")
    await expect(insertMatch({ tableId: "t1", tableName: "Ruby", matchNumber: 1, pot: 0, dealerSeat: 0 })).rejects.toThrow("db down")
    await expect(insertMatchPlayers("m1", [])).rejects.toThrow("db down")
    await expect(finishMatch("m1", null, 0, [])).rejects.toThrow("db down")
    await expect(getPlayerHands("a")).rejects.toThrow("db down")
  })
})

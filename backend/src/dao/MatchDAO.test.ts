import { finishMatch, getHand, getPlayerHands, getTableHands, insertMatch, insertMatchAction, insertMatchPlayers, nextMatchNumber } from "../dao/MatchDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const ace = { rank: 14, suit: "spades" } as const

beforeEach(resetMock)

describe("MatchDao", () => {
  it("saves a match and returns its id", async () => {
    mockState.result = { data: { id: "m1" } }
    expect(await insertMatch({ tableId: "t1", tableName: "Ruby", matchNumber: 1, pot: 3, dealerSeat: 0 })).toBe("m1")
    expect(calls).toContainEqual(["from", ["match"]])
  })

  it("saves the players of a match", async () => {
    await insertMatchPlayers("m1", [{ seatNumber: 0, userId: "a", botName: null, dealt: [ace] }])
    expect(calls).toContainEqual(["from", ["match_players"]])
    expect(calls).toContainEqual(["insert", [[{ match_id: "m1", seat_number: 0, user_id: "a", bot_name: null, hand_history: { dealt: [ace] } }]]])
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
    await finishMatch("m1", "a", 480, [{ seatNumber: 0, netResult: 40, handRank: "Pair", dealt: [ace], final: [ace] }])
    expect(calls).toContainEqual(["eq", ["id", "m1"]])
    expect(calls).toContainEqual(["update", [expect.objectContaining({ winner_id: "a", pot: 480 })]])
    expect(calls).toContainEqual(["update", [{ net_result: 40, hand_rank: "Pair", hand_history: { dealt: [ace], final: [ace] } }]])
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

  it("saves a player's action", async () => {
    await insertMatchAction({ matchId: "m1", seatNumber: 1, userId: null, type: "bet", amount: 5, cardsDiscarded: null })
    expect(calls).toContainEqual(["insert", [{ match_id: "m1", seat_number: 1, user_id: null, action_type: "bet", amount: 5, cards_discarded: null }]])
  })

  it("lists a table's hands with players and actions in order", async () => {
    mockState.result = {
      data: [{
        id: "m1", match_number: 2, pot: 10, ended_at: null,
        match_players: [
          { seat_number: 1, bot_name: "McBot", net_result: 0, hand_rank: null, hand_history: { dealt: [ace] }, user: null },
          { seat_number: 0, bot_name: null, net_result: 0, hand_rank: null, hand_history: null, user: { username: "Maya" } },
        ],
        match_log: [
          { seat_number: 1, action_type: "call", amount: 2, cards_discarded: null, created_at: "2026-11-14T10:00:02Z" },
          { seat_number: 0, action_type: "bet", amount: 2, cards_discarded: null, created_at: "2026-11-14T10:00:01Z" },
        ],
      }],
    }
    const [hand] = await getTableHands("t1", "2026-11-14T11:00:00Z")
    expect(hand!.players.map(p => p.name)).toEqual(["Maya", "McBot"])
    expect(hand!.players[1]!.dealt).toEqual([ace])
    expect(hand!.actions.map(a => a.type)).toEqual(["bet", "call"])
    expect(calls).toContainEqual(["lte", ["started_at", "2026-11-14T11:00:00Z"]])
  })

  it("gets one hand", async () => {
    mockState.result = { data: { id: "m1", match_number: 1, pot: 3, ended_at: null, match_players: [], match_log: [] } }
    expect((await getHand("m1"))?.handNumber).toBe(1)
    mockState.result = { data: null }
    expect(await getHand("missing")).toBeNull()
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(nextMatchNumber("t1")).rejects.toThrow("db down")
    await expect(insertMatch({ tableId: "t1", tableName: "Ruby", matchNumber: 1, pot: 0, dealerSeat: 0 })).rejects.toThrow("db down")
    await expect(insertMatchPlayers("m1", [])).rejects.toThrow("db down")
    await expect(finishMatch("m1", null, 0, [])).rejects.toThrow("db down")
    await expect(getPlayerHands("a")).rejects.toThrow("db down")
    await expect(getTableHands("t1", "now")).rejects.toThrow("db down")
    await expect(getHand("m1")).rejects.toThrow("db down")
  })
})

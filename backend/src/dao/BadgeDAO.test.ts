import { getBadges, insertBadges } from "../dao/BadgeDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const NOV_16 = new Date("2026-11-16T00:00:00Z")

beforeEach(resetMock)

describe("BadgeDAO", () => {
  it("records badges with their place, leaving ones already awarded alone", async () => {
    await insertBadges([{ userId: "u1", timeframe: "week", periodStart: NOV_16, place: 2 }])
    expect(calls).toContainEqual(["from", ["leaderboard_badge"]])
    expect(calls).toContainEqual([
      "upsert",
      [[{ user_id: "u1", timeframe: "week", period_start: "2026-11-16T00:00:00.000Z", place: 2 }], { onConflict: "user_id,timeframe,period_start", ignoreDuplicates: true }],
    ])
  })

  it("does nothing when there are no badges to record", async () => {
    await insertBadges([])
    expect(calls).toHaveLength(0)
  })

  it("reads the badges of several players at once", async () => {
    mockState.awaited = { data: [{ user_id: "u2", timeframe: "month", period_start: "2026-10-01T00:00:00+00:00", place: 1 }] }
    expect(await getBadges(["u1", "u2"])).toEqual([{ userId: "u2", timeframe: "month", periodStart: new Date("2026-10-01T00:00:00Z"), place: 1 }])
    expect(calls).toContainEqual(["in", ["user_id", ["u1", "u2"]]])
  })

  it("doesn't query for nobody", async () => {
    expect(await getBadges([])).toEqual([])
    expect(calls).toHaveLength(0)
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(insertBadges([{ userId: "u1", timeframe: "week", periodStart: NOV_16, place: 1 }])).rejects.toThrow("db down")
    await expect(getBadges(["u1"])).rejects.toThrow("db down")
  })
})

import { dailyRewardStatus } from "./DailyReward"

const now = new Date("2026-11-20T12:00:00Z")
const hoursAgo = (hours: number) => new Date(now.getTime() - hours * 60 * 60 * 1000)

describe("dailyRewardStatus", () => {
  it("starts at day 1", () => {
    expect(dailyRewardStatus(null, 0, now)).toEqual({ day: 1, canClaim: true, nextClaimAt: null })
  })

  it("waits a day between claims", () => {
    expect(dailyRewardStatus(hoursAgo(5), 2, now)).toEqual({ day: 3, canClaim: false, nextClaimAt: "2026-11-21T07:00:00.000Z" })
  })

  it("moves to the next day", () => {
    expect(dailyRewardStatus(hoursAgo(30), 2, now)).toEqual({ day: 3, canClaim: true, nextClaimAt: null })
  })

  it("resets after a missed day", () => {
    expect(dailyRewardStatus(hoursAgo(50), 4, now).day).toBe(1)
  })

  it("goes back to day 1 after day 7", () => {
    expect(dailyRewardStatus(hoursAgo(30), 7, now).day).toBe(1)
  })
})

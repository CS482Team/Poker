import { claimDailyReward, fetchDailyReward } from "@/service/RewardService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(ok: boolean, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

describe("rewardService", () => {
  it("loads and claims the daily reward", async () => {
    respond(true, { day: 1 })
    expect(await fetchDailyReward()).toEqual({ day: 1 })
    await claimDailyReward()
    expect(jest.mocked(global.fetch).mock.calls[1]![0]).toContain("/users/me/daily-reward")
    expect(jest.mocked(global.fetch).mock.calls[1]![1]?.method).toBe("POST")
  })

  it("throws when a request fails", async () => {
    respond(false)
    await expect(fetchDailyReward()).rejects.toThrow("500")
    await expect(claimDailyReward()).rejects.toThrow("500")
  })
})

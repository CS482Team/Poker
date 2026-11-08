import { claimAd, fetchActiveAds, startWatching } from "@/service/AdService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(status: number, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body })
}

describe("adService", () => {
  it("fetches active ads", async () => {
    respond(200, [{ id: "a1" }])
    expect(await fetchActiveAds()).toEqual([{ id: "a1" }])
  })

  it("starts watching and claims the reward", async () => {
    respond(200, { reward: 500 })
    await startWatching("a1")
    expect(await claimAd("a1")).toBe(500)
  })

  it("asks logged out players to log in", async () => {
    respond(401)
    await expect(startWatching("a1")).rejects.toThrow("Log in to earn chips")
  })

  it("throws when a request fails", async () => {
    respond(500)
    await expect(fetchActiveAds()).rejects.toThrow("500")
    await expect(startWatching("a1")).rejects.toThrow("500")
    await expect(claimAd("a1")).rejects.toThrow("500")
  })
})

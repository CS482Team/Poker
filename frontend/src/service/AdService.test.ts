import { fetchActiveAds } from "@/service/AdService"

function respond(ok: boolean, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

describe("adService", () => {
  it("fetches active ads", async () => {
    respond(true, [{ id: "a1" }])
    expect(await fetchActiveAds()).toEqual([{ id: "a1" }])
  })

  it("throws when the request fails", async () => {
    respond(false)
    await expect(fetchActiveAds()).rejects.toThrow("500")
  })
})

import { createAd, deleteAd, fetchAds, isAdmin, setAdActive } from "@/service/AdminService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

const ad = { title: "Bonus", rewardAmount: 500 }

function respond(ok: boolean, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

describe("adminService", () => {
  it("checks for an admin with the session token", async () => {
    respond(true)
    expect(await isAdmin()).toBe(true)
    const [, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(options?.headers).toMatchObject({ Authorization: "Bearer token" })
  })

  it("fetches ads", async () => {
    respond(true, [{ id: "a1" }])
    expect(await fetchAds()).toEqual([{ id: "a1" }])
  })

  it("creates, updates and deletes ads", async () => {
    respond(true)
    await createAd(ad)
    await setAdActive("a1", true)
    await deleteAd("a1")
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it("throws when a request fails", async () => {
    respond(false)
    expect(await isAdmin()).toBe(false)
    await expect(fetchAds()).rejects.toThrow("500")
    await expect(createAd(ad)).rejects.toThrow("500")
    await expect(setAdActive("a1", true)).rejects.toThrow("500")
    await expect(deleteAd("a1")).rejects.toThrow("500")
  })
})

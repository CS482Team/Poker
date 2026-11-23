import { createAd, deleteAd, editAd, fetchAds, fetchPlayerHands, fetchHand, fetchPlayers, fetchReport, fetchReports, isAdmin, modifyChips, removePlayer, resetPassword, setAdActive, unbanPlayer } from "@/service/AdminService"

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

  it("fetches players and their hands", async () => {
    respond(true, [{ id: "u1" }])
    expect(await fetchPlayers()).toEqual([{ id: "u1" }])
    await fetchPlayerHands("u1")
    expect(jest.mocked(global.fetch).mock.calls[1]![0]).toContain("/admin/players/u1/hands")
  })

  it("fetches reports", async () => {
    respond(true, [{ id: 1 }])
    expect(await fetchReports()).toEqual([{ id: 1 }])
    expect(jest.mocked(global.fetch).mock.calls[0]![0]).toContain("/admin/reports")
    await fetchReport(2)
    expect(jest.mocked(global.fetch).mock.calls[1]![0]).toContain("/admin/reports/2")
    await fetchHand("m1")
    expect(jest.mocked(global.fetch).mock.calls[2]![0]).toContain("/admin/hands/m1")
  })

  it("removes a player", async () => {
    respond(true)
    await removePlayer("u1")
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain("/admin/players/u1")
    expect(options?.method).toBe("DELETE")
  })

  it("unbans a player", async () => {
    respond(true)
    await unbanPlayer("u1")
    expect(jest.mocked(global.fetch).mock.calls[0]![0]).toContain("/admin/players/u1/unban")
  })

  it("modifies a player's chips", async () => {
    respond(true)
    await modifyChips("u1", 900)
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain("/admin/players/u1/balance")
    expect(options?.body).toBe(JSON.stringify({ balance: 900 }))
  })

  it("creates, updates and deletes ads", async () => {
    respond(true)
    await createAd(ad)
    await editAd("a1", ad)
    await setAdActive("a1", true)
    await deleteAd("a1")
    expect(global.fetch).toHaveBeenCalledTimes(4)
  })

  it("throws when a request fails", async () => {
    respond(false)
    expect(await isAdmin()).toBe(false)
    await expect(fetchAds()).rejects.toThrow("500")
    await expect(createAd(ad)).rejects.toThrow("500")
    await expect(editAd("a1", ad)).rejects.toThrow("500")
    await expect(setAdActive("a1", true)).rejects.toThrow("500")
    await expect(deleteAd("a1")).rejects.toThrow("500")
    await expect(fetchPlayers()).rejects.toThrow("500")
    await expect(fetchPlayerHands("u1")).rejects.toThrow("500")
    await expect(fetchReports()).rejects.toThrow("500")
    await expect(removePlayer("u1")).rejects.toThrow("500")
    await expect(unbanPlayer("u1")).rejects.toThrow("500")
    await expect(modifyChips("u1", 900)).rejects.toThrow("500")
  })

  it("sets a player's new password and returns their email", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ email: "maya@test.local" }) })
    expect(await resetPassword("u7", "newpass1")).toEqual({ email: "maya@test.local" })
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toMatch(/\/admin\/players\/u7\/password$/)
    expect(options?.method).toBe("POST")
  })

  it("passes on why a password reset was refused", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, json: async () => ({ error: "Passwords are at least 6 characters" }) })
    await expect(resetPassword("u7", "x")).rejects.toThrow("Passwords are at least 6 characters")
  })
})

import { changeAvatar, changeEmail, changeUsername, fetchMyProfile } from "@/service/ProfileService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(status: number, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body })
}

describe("ProfileService", () => {
  it("loads your profile", async () => {
    respond(200, { username: "Maya" })
    expect(await fetchMyProfile()).toEqual({ username: "Maya" })
    expect(jest.mocked(global.fetch).mock.calls[0]![0]).toMatch(/\/users\/me$/)
  })

  it("throws when the profile can't load", async () => {
    respond(500)
    await expect(fetchMyProfile()).rejects.toThrow("500")
  })

  it("saves each setting to its own route", async () => {
    respond(204)
    await changeUsername("Maya")
    await changeAvatar(null)
    await changeEmail("secret1", "new@test.local")
    const calls = jest.mocked(global.fetch).mock.calls
    expect(calls.map(([url, init]) => [String(url).split("/users/me/")[1], (init as RequestInit).method, JSON.parse((init as RequestInit).body as string)])).toEqual([
      ["username", "PATCH", { username: "Maya" }],
      ["avatar", "PATCH", { avatarUrl: null }],
      ["email", "PATCH", { password: "secret1", email: "new@test.local" }],
    ])
  })

  it("passes on the server's reason when a save is refused", async () => {
    respond(409, { error: "That username is taken" })
    await expect(changeUsername("Maya")).rejects.toThrow("That username is taken")
    respond(500)
    await expect(changeUsername("Maya")).rejects.toThrow("Could not save (500)")
  })
})

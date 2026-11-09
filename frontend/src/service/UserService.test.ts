import { fetchUsername, getCurrentUserId } from "@/service/UserService"

beforeEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321"
  localStorage.clear()
})

describe("userService", () => {
  it("uses the signed in user", () => {
    localStorage.setItem("sb-127-auth-token", JSON.stringify({ user: { id: "u1" } }))
    expect(getCurrentUserId()).toBe("u1")
  })

  it("is empty when nobody is signed in", () => {
    expect(getCurrentUserId()).toBe("")
  })

  it("is empty when the session is unreadable", () => {
    localStorage.setItem("sb-127-auth-token", "{bad")
    expect(getCurrentUserId()).toBe("")
  })

  it("loads a username", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ username: "Maya" }) }) as never
    expect(await fetchUsername("u1")).toBe("Maya")
  })
})

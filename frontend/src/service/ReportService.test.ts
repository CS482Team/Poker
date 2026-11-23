import { requestPasswordReset, sendReport } from "@/service/ReportService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

describe("ReportService", () => {
  it("asks for a password reset", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    await requestPasswordReset("maya@test.local")
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain("/reports/password-reset")
    expect(options?.body).toBe(JSON.stringify({ email: "maya@test.local" }))
  })

  it("posts the message", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    await sendReport("Table froze", "t1")
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toContain("/reports")
    expect(options?.body).toBe(JSON.stringify({ message: "Table froze", tableId: "t1" }))
  })

  it("throws when it fails", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 })
    await expect(sendReport("hi", "t1")).rejects.toThrow("Couldn't send your message (500)")
  })

  it("asks for a password reset without needing to be signed in", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 202 })
    await requestPasswordReset("maya@test.local")
    const [url, options] = jest.mocked(global.fetch).mock.calls[0]!
    expect(url).toMatch(/\/reports\/password-reset$/)
    expect(options?.body).toBe(JSON.stringify({ email: "maya@test.local" }))
  })

  it("passes on the server's reason when a reset request is refused", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 429, json: async () => ({ error: "Too many requests. Try again in a few minutes" }) })
    await expect(requestPasswordReset("a@b.com")).rejects.toThrow("Too many requests")
  })

})

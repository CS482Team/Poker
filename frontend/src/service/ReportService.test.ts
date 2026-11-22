import { sendReport } from "@/service/ReportService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

describe("ReportService", () => {
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
})

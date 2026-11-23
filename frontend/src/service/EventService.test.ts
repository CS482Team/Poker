import { createEvent, endEvent, fetchActiveEvent } from "@/service/EventService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(ok: boolean, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => body })
}

describe("eventService", () => {
  it("fetches the active event", async () => {
    respond(true, { id: "e1" })
    expect(await fetchActiveEvent()).toEqual({ id: "e1" })
    expect(jest.mocked(global.fetch).mock.calls[0]![0]).toContain("/events/active")
  })

  it("starts and ends events", async () => {
    respond(true)
    await createEvent("Double", 2, 3)
    await endEvent("e1")
    expect(jest.mocked(global.fetch).mock.calls[0]![1]?.body).toBe(JSON.stringify({ name: "Double", multiplier: 2, days: 3 }))
    expect(jest.mocked(global.fetch).mock.calls[1]![0]).toContain("/events/e1")
  })

  it("throws when a request fails", async () => {
    respond(false)
    await expect(fetchActiveEvent()).rejects.toThrow("500")
    await expect(createEvent("Double", 2, 3)).rejects.toThrow("500")
    await expect(endEvent("e1")).rejects.toThrow("500")
  })
})

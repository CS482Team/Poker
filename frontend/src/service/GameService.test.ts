import { act, draw } from "@/service/GameService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(ok: boolean) {
  global.fetch = jest.fn().mockResolvedValue({ ok, status: ok ? 200 : 409, json: async () => ({}) })
}

describe("gameService", () => {
  it("sends a bet or raise with the player, the action type and the amount", async () => {
    respond(true)
    await act("g1", "raise", 30)
    const [url, init] = jest.mocked(fetch).mock.calls[0]!
    expect(url).toBe(`${process.env.NEXT_PUBLIC_API_URL}/game/g1/action`)
    expect(init?.method).toBe("POST")
    expect(JSON.parse(String(init?.body))).toEqual({ action: { type: "raise", amount: 30 } })
  })

  it("leaves the amount out for actions that don't take one", async () => {
    respond(true)
    await act("g1", "call")
    const [, init] = jest.mocked(fetch).mock.calls[0]!
    expect(JSON.parse(String(init?.body))).toEqual({ action: { type: "call" } })
  })

  it("throws when the action is refused", async () => {
    respond(false)
    await expect(act("g1", "check")).rejects.toThrow("Failed to act (409)")
  })

  it("sends the discard list to draw", async () => {
    respond(true)
    await draw("g1", [0, 3])
    const [url, init] = jest.mocked(fetch).mock.calls[0]!
    expect(url).toBe(`${process.env.NEXT_PUBLIC_API_URL}/game/g1/draw`)
    expect(JSON.parse(String(init?.body))).toEqual({ discard: [0, 3] })
  })

  it("throws when the draw is refused", async () => {
    respond(false)
    await expect(draw("g1", [])).rejects.toThrow("Failed to draw (409)")
  })
})

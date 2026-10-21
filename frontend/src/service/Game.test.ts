import { act, getView, startGame } from "./Game"

// A fake fetch response with the given status and JSON body
function respond(status: number, body: unknown) {
  return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) } as Response)
}

beforeEach(() => {
  global.fetch = jest.fn()
})

describe("game service", () => {
  it("starts a game with a POST to /game", async () => {
    jest.mocked(fetch).mockReturnValue(respond(201, { gameId: "g1", matchId: "m1" }))

    await expect(startGame()).resolves.toEqual({ gameId: "g1", matchId: "m1" })
    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/game", expect.objectContaining({ method: "POST" }))
  })

  it("gets one player's view of a game", async () => {
    jest.mocked(fetch).mockReturnValue(respond(200, { gameId: "g1" }))

    await getView("g1", "bot-1")

    expect(fetch).toHaveBeenCalledWith("http://localhost:4000/game/g1/view/bot-1", expect.anything())
  })

  it("sends a bet or raise with the player, the action type and the amount", async () => {
    jest.mocked(fetch).mockReturnValue(respond(200, { gameId: "g1" }))

    await act("g1", "bot-1", "raise", 30)

    const [url, init] = jest.mocked(fetch).mock.calls[0]!
    expect(url).toBe("http://localhost:4000/game/g1/action")
    expect(init?.method).toBe("POST")
    expect(JSON.parse(String(init?.body))).toEqual({ playerId: "bot-1", action: { type: "raise", amount: 30 } })
  })

  it("leaves the amount out for actions that don't take one", async () => {
    jest.mocked(fetch).mockReturnValue(respond(200, { gameId: "g1" }))

    await act("g1", "bot-1", "call")

    const [, init] = jest.mocked(fetch).mock.calls[0]!
    expect(JSON.parse(String(init?.body))).toEqual({ playerId: "bot-1", action: { type: "call" } })
  })

  it("throws the backend's error code when a request is refused", async () => {
    jest.mocked(fetch).mockReturnValue(respond(409, { error: "not-your-turn" }))
    await expect(act("g1", "bot-2", "check")).rejects.toThrow("not-your-turn")
  })

  it("falls back to the HTTP status when the error has no body", async () => {
    jest.mocked(fetch).mockReturnValue(
      Promise.resolve({ ok: false, status: 500, json: () => Promise.reject(new Error("no json")) } as Response),
    )
    await expect(startGame()).rejects.toThrow("Request failed (500)")
  })
})

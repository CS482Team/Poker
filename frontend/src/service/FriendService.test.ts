import { acceptFriendRequest, fetchFriends, fetchRecentPlayers, removeFriend, sendFriendRequest } from "@/service/FriendService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

function respond(status: number, body?: unknown) {
  global.fetch = jest.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body })
}

const lastCall = () => jest.mocked(global.fetch).mock.calls.at(-1)! as [string, RequestInit]

describe("FriendService", () => {
  it("loads your friends and recent players, signed in", async () => {
    respond(200, { friends: [], incoming: [], outgoing: [] })
    expect(await fetchFriends()).toEqual({ friends: [], incoming: [], outgoing: [] })
    expect(lastCall()[0]).toMatch(/\/friends$/)
    expect(lastCall()[1].headers).toMatchObject({ Authorization: "Bearer token" })
    respond(200, [])
    await fetchRecentPlayers()
    expect(lastCall()[0]).toMatch(/\/friends\/recent$/)
  })

  it("sends a request by username", async () => {
    respond(201, { status: "requested", player: { userId: "u2", username: "Theo", avatarUrl: null } })
    expect((await sendFriendRequest("Theo")).status).toBe("requested")
    expect(lastCall()[1]).toMatchObject({ method: "POST", body: JSON.stringify({ username: "Theo" }) })
  })

  it("accepts and removes by player id", async () => {
    respond(204)
    await acceptFriendRequest("u2")
    expect(lastCall()[0]).toMatch(/\/friends\/u2\/accept$/)
    expect(lastCall()[1].method).toBe("POST")
    await removeFriend("u2")
    expect(lastCall()[0]).toMatch(/\/friends\/u2$/)
    expect(lastCall()[1].method).toBe("DELETE")
  })

  it("passes on the server's explanation when it refuses", async () => {
    respond(404, { error: "There's no player with that username.", code: "user_not_found" })
    await expect(sendFriendRequest("Nobody")).rejects.toThrow("There's no player with that username.")
  })

  it("falls back to the status when there's no explanation", async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => { throw new Error("not json") } })
    await expect(fetchFriends()).rejects.toThrow("Could not load your friends (500)")
  })
})

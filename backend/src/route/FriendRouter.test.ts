import request from "supertest"
import { app } from "../app"
import { requestAttempts } from "../controller/FriendController"
import { getUserIdFromToken } from "../dao/UserDAO"
import { acceptFriend, FriendError, listFriends, recentPlayers, removeFriend, sendRequest } from "../services/FriendService"

jest.mock("../dao/UserDAO", () => ({ getUserIdFromToken: jest.fn() }))
jest.mock("../services/FriendService", () => {
  const actual = jest.requireActual("../services/FriendService")
  return { FriendError: actual.FriendError, listFriends: jest.fn(), sendRequest: jest.fn(), acceptFriend: jest.fn(), removeFriend: jest.fn(), recentPlayers: jest.fn() }
})

const THEO = "00000000-0000-0000-0000-000000000002"
const theo = { userId: THEO, username: "Theo", avatarUrl: null }

beforeEach(() => {
  jest.resetAllMocks()
  requestAttempts.forget("u1")
  jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
})

const signedIn = (req: request.Test) => req.set("Authorization", "Bearer token")

describe("/friends", () => {
  it("needs a signed in player for everything", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue(null)
    for (const req of [request(app).get("/friends"), request(app).get("/friends/recent"), request(app).post("/friends"), request(app).post(`/friends/${THEO}/accept`), request(app).delete(`/friends/${THEO}`)]) {
      expect((await req).status).toBe(401)
    }
    expect(listFriends).not.toHaveBeenCalled()
  })

  it("GET lists your friends and requests", async () => {
    const list = { friends: [{ ...theo, since: "2026-11-20T00:00:00Z", table: null }], incoming: [], outgoing: [] }
    jest.mocked(listFriends).mockResolvedValue(list)
    const res = await signedIn(request(app).get("/friends"))
    expect(res.status).toBe(200)
    expect(res.body).toEqual(list)
    expect(listFriends).toHaveBeenCalledWith("u1")
  })

  it("GET /recent lists players you could add", async () => {
    jest.mocked(recentPlayers).mockResolvedValue([{ ...theo, lastPlayedAt: "2026-11-23T10:00:00Z" }])
    const res = await signedIn(request(app).get("/friends/recent"))
    expect(res.status).toBe(200)
    expect(res.body).toHaveLength(1)
  })
})

describe("POST /friends", () => {
  it("sends a request (201)", async () => {
    jest.mocked(sendRequest).mockResolvedValue({ status: "requested", player: theo })
    const res = await signedIn(request(app).post("/friends").send({ username: "  Theo " }))
    expect(res.status).toBe(201)
    expect(res.body).toEqual({ status: "requested", player: theo })
    expect(sendRequest).toHaveBeenCalledWith("u1", "Theo")
  })

  it("answers 200 when it became a friendship straight away", async () => {
    jest.mocked(sendRequest).mockResolvedValue({ status: "accepted", player: theo })
    expect((await signedIn(request(app).post("/friends").send({ username: "Theo" }))).status).toBe(200)
  })

  it("rejects a missing or impossible username", async () => {
    for (const body of [{}, { username: 5 }, { username: "ab" }, { username: "x".repeat(21) }]) {
      expect((await signedIn(request(app).post("/friends").send(body))).status).toBe(400)
    }
    expect(sendRequest).not.toHaveBeenCalled()
  })

  it.each([
    ["guest", 403],
    ["user_not_found", 404],
    ["self", 400],
    ["target_guest", 400],
    ["already_friends", 409],
    ["already_requested", 409],
  ] as const)("explains a %s refusal with %i", async (code, status) => {
    jest.mocked(sendRequest).mockRejectedValue(new FriendError(code))
    const res = await signedIn(request(app).post("/friends").send({ username: "Theo" }))
    expect(res.status).toBe(status)
    expect(res.body.code).toBe(code)
    expect(res.body.error).toEqual(expect.any(String))
  })

  it("limits how many requests one player can send", async () => {
    jest.mocked(sendRequest).mockResolvedValue({ status: "requested", player: theo })
    for (let i = 0; i < 20; i++) await signedIn(request(app).post("/friends").send({ username: "Theo" }))
    const res = await signedIn(request(app).post("/friends").send({ username: "Theo" }))
    expect(res.status).toBe(429)
    expect(sendRequest).toHaveBeenCalledTimes(20)
  })

  it("answers 500 for an unexpected failure", async () => {
    jest.spyOn(console, "error").mockImplementation(() => {})
    jest.mocked(sendRequest).mockRejectedValue(new Error("db down"))
    expect((await signedIn(request(app).post("/friends").send({ username: "Theo" }))).status).toBe(500)
  })
})

describe("POST /friends/:userId/accept", () => {
  it("accepts a request (204)", async () => {
    const res = await signedIn(request(app).post(`/friends/${THEO}/accept`))
    expect(res.status).toBe(204)
    expect(acceptFriend).toHaveBeenCalledWith("u1", THEO)
  })

  it("404s when the request is gone", async () => {
    jest.mocked(acceptFriend).mockRejectedValue(new FriendError("request_not_found"))
    expect((await signedIn(request(app).post(`/friends/${THEO}/accept`))).status).toBe(404)
  })

  it("rejects an id that isn't a uuid, before it reaches the database", async () => {
    expect((await signedIn(request(app).post("/friends/not-an-id/accept"))).status).toBe(400)
    expect(acceptFriend).not.toHaveBeenCalled()
  })
})

describe("DELETE /friends/:userId", () => {
  it("removes a friend or request (204)", async () => {
    const res = await signedIn(request(app).delete(`/friends/${THEO}`))
    expect(res.status).toBe(204)
    expect(removeFriend).toHaveBeenCalledWith("u1", THEO)
  })

  it("404s when there's nothing to remove", async () => {
    jest.mocked(removeFriend).mockRejectedValue(new FriendError("not_found"))
    expect((await signedIn(request(app).delete(`/friends/${THEO}`))).status).toBe(404)
  })

  it("rejects an id that isn't a uuid, so it can't change the database filter", async () => {
    expect((await signedIn(request(app).delete("/friends/x),status.eq.1"))).status).toBe(400)
    expect(removeFriend).not.toHaveBeenCalled()
  })
})

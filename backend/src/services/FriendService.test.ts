import { acceptRequest, deleteFriendship, findPlayerByUsername, getFriendship, getFriendships, getRecentOpponents, getSeatedTables, insertRequest } from "../dao/FriendDAO"
import type { FriendshipRow } from "../dao/FriendDAO"
import { getProfile } from "../dao/UserDAO"
import { acceptFriend, FriendError, listFriends, recentPlayers, RECENT_LIMIT, removeFriend, sendRequest } from "./FriendService"

jest.mock("../dao/FriendDAO", () => ({
  ...jest.requireActual("../dao/FriendDAO"), // PENDING and ACCEPTED
  findPlayerByUsername: jest.fn(),
  getFriendships: jest.fn(),
  getFriendship: jest.fn(),
  insertRequest: jest.fn(),
  acceptRequest: jest.fn(),
  deleteFriendship: jest.fn(),
  getSeatedTables: jest.fn(),
  getRecentOpponents: jest.fn(),
}))
jest.mock("../dao/UserDAO", () => ({ getProfile: jest.fn() }))

const ME = "me"
const p = (id: string) => ({ id, username: id[0]!.toUpperCase() + id.slice(1), avatar_url: null })

function row(sender: string, receiver: string, status: number, created_at = "2026-11-20T00:00:00Z"): FriendshipRow {
  return { sender_id: sender, receiver_id: receiver, status, created_at, sender: p(sender), receiver: p(receiver) }
}

/* expects the promise to fail with this FriendError code */
async function refused(promise: Promise<unknown>, code: string) {
  await expect(promise).rejects.toEqual(new FriendError(code as never))
  await expect(promise).rejects.toBeInstanceOf(FriendError)
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getProfile).mockResolvedValue({ id: ME, username: "Me", avatarUrl: null, email: "", isGuest: false })
  jest.mocked(findPlayerByUsername).mockResolvedValue({ id: "theo", username: "Theo", avatarUrl: "/t.svg", isGuest: false })
  jest.mocked(getSeatedTables).mockResolvedValue(new Map())
  jest.mocked(getFriendships).mockResolvedValue([])
})

describe("listFriends", () => {
  it("splits friends from requests you sent and received", async () => {
    jest.mocked(getFriendships).mockResolvedValue([
      row(ME, "theo", 1),
      row("lina", ME, 1),
      row("noah", ME, 0, "2026-11-21T00:00:00Z"),
      row("alex", ME, 0, "2026-11-22T00:00:00Z"),
      row(ME, "maya", 0),
    ])
    const list = await listFriends(ME)
    expect(list.friends.map((f) => f.username)).toEqual(["Lina", "Theo"])
    expect(list.incoming.map((r) => r.username)).toEqual(["Alex", "Noah"]) // newest first
    expect(list.outgoing).toEqual([{ userId: "maya", username: "Maya", avatarUrl: null, sentAt: "2026-11-20T00:00:00Z" }])
  })

  it("says where friends are seated, listing them first so you can join", async () => {
    jest.mocked(getFriendships).mockResolvedValue([row(ME, "alex", 1), row(ME, "theo", 1)])
    jest.mocked(getSeatedTables).mockResolvedValue(new Map([["theo", { id: "t1", name: "Velvet Room" }]]))
    const { friends } = await listFriends(ME)
    expect(getSeatedTables).toHaveBeenCalledWith(["alex", "theo"])
    expect(friends[0]).toEqual({ userId: "theo", username: "Theo", avatarUrl: null, since: "2026-11-20T00:00:00Z", table: { id: "t1", name: "Velvet Room" } })
    expect(friends[1]!.table).toBeNull()
  })

  it("is empty for a player with no friends", async () => {
    expect(await listFriends(ME)).toEqual({ friends: [], incoming: [], outgoing: [] })
  })
})

describe("sendRequest", () => {
  it("sends a request", async () => {
    jest.mocked(getFriendship).mockResolvedValue(null)
    jest.mocked(insertRequest).mockResolvedValue(true)
    expect(await sendRequest(ME, "theo")).toEqual({ status: "requested", player: { userId: "theo", username: "Theo", avatarUrl: "/t.svg" } })
    expect(findPlayerByUsername).toHaveBeenCalledWith("theo")
    expect(insertRequest).toHaveBeenCalledWith(ME, "theo")
  })

  it("accepts instead when they'd already asked you", async () => {
    jest.mocked(getFriendship).mockResolvedValue({ senderId: "theo", status: 0 })
    jest.mocked(acceptRequest).mockResolvedValue(true)
    expect((await sendRequest(ME, "Theo")).status).toBe("accepted")
    expect(acceptRequest).toHaveBeenCalledWith("theo", ME)
    expect(insertRequest).not.toHaveBeenCalled()
  })

  it("refuses guests, unknown names, yourself and guest targets", async () => {
    jest.mocked(getProfile).mockResolvedValueOnce({ id: ME, username: "Guest1", avatarUrl: null, email: "", isGuest: true })
    await refused(sendRequest(ME, "Theo"), "guest")
    jest.mocked(findPlayerByUsername).mockResolvedValueOnce(null)
    await refused(sendRequest(ME, "Nobody"), "user_not_found")
    jest.mocked(findPlayerByUsername).mockResolvedValueOnce({ id: ME, username: "Me", avatarUrl: null, isGuest: false })
    await refused(sendRequest(ME, "Me"), "self")
    jest.mocked(findPlayerByUsername).mockResolvedValueOnce({ id: "g", username: "Guest2", avatarUrl: null, isGuest: true })
    await refused(sendRequest(ME, "Guest2"), "target_guest")
    expect(insertRequest).not.toHaveBeenCalled()
  })

  it("refuses when you're already friends or already asked", async () => {
    jest.mocked(getFriendship).mockResolvedValueOnce({ senderId: "theo", status: 1 })
    await refused(sendRequest(ME, "Theo"), "already_friends")
    jest.mocked(getFriendship).mockResolvedValueOnce({ senderId: ME, status: 0 })
    await refused(sendRequest(ME, "Theo"), "already_requested")
  })

  it("accepts their request if they sent it at the same moment as yours", async () => {
    jest.mocked(getFriendship).mockResolvedValueOnce(null).mockResolvedValueOnce({ senderId: "theo", status: 0 })
    jest.mocked(insertRequest).mockResolvedValue(false) // theirs landed first
    jest.mocked(acceptRequest).mockResolvedValue(true)
    expect((await sendRequest(ME, "Theo")).status).toBe("accepted")
  })

  it("sends yours if they cancel theirs just as you answer", async () => {
    jest.mocked(getFriendship).mockResolvedValueOnce({ senderId: "theo", status: 0 }).mockResolvedValueOnce(null)
    jest.mocked(acceptRequest).mockResolvedValue(false)
    jest.mocked(insertRequest).mockResolvedValue(true)
    expect((await sendRequest(ME, "Theo")).status).toBe("requested")
  })
})

describe("acceptFriend", () => {
  it("accepts a request sent to you", async () => {
    jest.mocked(acceptRequest).mockResolvedValue(true)
    await acceptFriend(ME, "theo")
    expect(acceptRequest).toHaveBeenCalledWith("theo", ME)
  })

  it("refuses when there's no request to accept", async () => {
    jest.mocked(acceptRequest).mockResolvedValue(false)
    await refused(acceptFriend(ME, "theo"), "request_not_found")
  })
})

describe("removeFriend", () => {
  it("removes the friendship or request", async () => {
    jest.mocked(deleteFriendship).mockResolvedValue(true)
    await removeFriend(ME, "theo")
    expect(deleteFriendship).toHaveBeenCalledWith(ME, "theo")
  })

  it("refuses when there's nothing between you", async () => {
    jest.mocked(deleteFriendship).mockResolvedValue(false)
    await refused(removeFriend(ME, "theo"), "not_found")
  })
})

describe("recentPlayers", () => {
  const seen = (id: string, played_at: string) => ({ ...p(id), played_at })

  it("lists each recent opponent once, latest first, skipping friends and requests", async () => {
    jest.mocked(getRecentOpponents).mockResolvedValue([
      seen("theo", "2026-11-23T10:00:00Z"),
      seen("lina", "2026-11-23T09:00:00Z"),
      seen("theo", "2026-11-22T10:00:00Z"),
      seen("noah", "2026-11-21T10:00:00Z"),
      seen("alex", "2026-11-20T10:00:00Z"),
    ])
    jest.mocked(getFriendships).mockResolvedValue([row(ME, "lina", 1), row("noah", ME, 0)])
    expect(await recentPlayers(ME)).toEqual([
      { userId: "theo", username: "Theo", avatarUrl: null, lastPlayedAt: "2026-11-23T10:00:00Z" },
      { userId: "alex", username: "Alex", avatarUrl: null, lastPlayedAt: "2026-11-20T10:00:00Z" },
    ])
  })

  it(`lists at most ${RECENT_LIMIT}`, async () => {
    jest.mocked(getRecentOpponents).mockResolvedValue(Array.from({ length: 20 }, (_, i) => seen(`player${i}`, "2026-11-23T10:00:00Z")))
    expect(await recentPlayers(ME)).toHaveLength(RECENT_LIMIT)
  })
})

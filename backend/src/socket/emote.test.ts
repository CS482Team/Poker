import { createServer, Server as HttpServer } from "http"
import type { AddressInfo } from "net"
import { Server } from "socket.io"
import { io as connect, Socket } from "socket.io-client"
import { getUserIdFromToken } from "../dao/UserDAO"
import { EmoteError, playEmote } from "../services/EmoteService"
import { emoteRoom, registerEmotes } from "./emote"
import { RateLimiter } from "./RateLimiter"

jest.mock("../dao/UserDAO", () => ({ getUserIdFromToken: jest.fn() }))
jest.mock("../services/EmoteService", () => ({ ...jest.requireActual("../services/EmoteService"), playEmote: jest.fn() }))

const laugh = { id: "e1", name: "Big Laugh", description: "", type: "emote" as const, rarity: "rare" as const, cost: 500, assetUrl: null, style: { text: "😂" } }
const played = { tableId: "t1", userId: "u1", emote: laugh }
const send = { tableId: "t1", slot: "emote_2", token: "token" }

let http: HttpServer
let io: Server
let client: Socket
let limiter: RateLimiter

beforeAll(async () => {
  http = createServer()
  io = new Server(http)
  io.on("connection", (socket) => {
    registerEmotes(socket, (e) => io.to(emoteRoom(e.tableId)).emit("emote:played", e), limiter)
  })
  await new Promise<void>((resolve) => http.listen(0, resolve))
})

beforeEach(async () => {
  jest.resetAllMocks()
  limiter = new RateLimiter(1, 3000) // fresh each test, so cooldowns don't leak between tests
  jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
  jest.mocked(playEmote).mockResolvedValue(played)
  client = connect(`http://localhost:${(http.address() as AddressInfo).port}`)
  await new Promise<void>((resolve) => client.once("connect", () => resolve()))
})

afterEach(() => client.disconnect())
afterAll(() => io.close())

/* emits an event and waits for the server's reply */
function ask(event: string, ...args: unknown[]) {
  return new Promise((resolve) => client.emit(event, ...args, resolve))
}

describe("emote socket", () => {
  it("names a table's emote room", () => {
    expect(emoteRoom("t1")).toBe("emote:t1")
  })

  it("plays an emote to everyone in the table's emote room", async () => {
    await ask("emote:join", "t1")
    const heard = new Promise((resolve) => client.once("emote:played", resolve))
    expect(await ask("emote:send", send)).toEqual({ ok: true })
    expect(await heard).toEqual(played)
    expect(playEmote).toHaveBeenCalledWith("t1", "u1", "emote_2")
  })

  it("works out who is sending from their session token", async () => {
    await ask("emote:send", send)
    expect(getUserIdFromToken).toHaveBeenCalledWith("token")
  })

  it("refuses a missing or expired token", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue(null)
    expect(await ask("emote:send", send)).toEqual({ ok: false, error: "Sign in to use emotes" })
    expect(await ask("emote:send", { tableId: "t1", slot: "emote_2" })).toEqual({ ok: false, error: "Sign in to use emotes" })
    expect(playEmote).not.toHaveBeenCalled()
  })

  it("allows one emote per cooldown", async () => {
    expect(await ask("emote:send", send)).toEqual({ ok: true })
    expect(await ask("emote:send", send)).toEqual({ ok: false, error: "Slow down: one emote every 3 seconds" })
    expect(playEmote).toHaveBeenCalledTimes(1)
  })

  it("passes on why an emote was refused", async () => {
    jest.mocked(playEmote).mockRejectedValue(new EmoteError("That wheel slot is empty"))
    expect(await ask("emote:send", send)).toEqual({ ok: false, error: "That wheel slot is empty" })
  })

  it("hides unexpected errors", async () => {
    jest.mocked(playEmote).mockRejectedValue(new Error("db down"))
    expect(await ask("emote:send", send)).toEqual({ ok: false, error: "Emote not sent" })
  })
})

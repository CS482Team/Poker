import { createServer, Server as HttpServer } from "http"
import type { AddressInfo } from "net"
import { Server } from "socket.io"
import { io as connect, Socket } from "socket.io-client"
import { ChatError, getHistory, sendMessage } from "../services/ChatService"
import { chatRoom, registerChat } from "./chat"

jest.mock("../services/ChatService", () => ({
  ...jest.requireActual("../services/ChatService"),
  getHistory: jest.fn(),
  sendMessage: jest.fn(),
}))

const message = { id: 1, tableId: "t1", userId: "u1", name: "Maya", body: "hi", createdAt: "" }
const hi = { tableId: "t1", userId: "u1", body: "hi" }

let http: HttpServer
let io: Server
let client: Socket

beforeAll(async () => {
  http = createServer()
  io = new Server(http)
  io.on("connection", (socket) => {
    registerChat(socket, (m) => io.to(chatRoom(m.tableId)).emit("chat:message", m))
  })
  await new Promise<void>((resolve) => http.listen(0, resolve))
})

beforeEach(async () => {
  jest.resetAllMocks()
  client = connect(`http://localhost:${(http.address() as AddressInfo).port}`)
  await new Promise((resolve) => client.once("connect", resolve))
})

afterEach(() => {
  client.disconnect()
})

afterAll(() => {
  io.close()
})

/* emits an event and waits for the server's reply */
function ask(event: string, ...args: unknown[]) {
  return new Promise((resolve) => client.emit(event, ...args, resolve))
}

describe("chat socket", () => {
  it("names a table's chat room", () => {
    expect(chatRoom("t1")).toBe("chat:t1")
  })

  it("joins a table's chat and gets its history", async () => {
    jest.mocked(getHistory).mockResolvedValue([message])
    expect(await ask("chat:join", "t1")).toEqual([message])
  })

  it("gives an empty history when it can't be loaded", async () => {
    jest.mocked(getHistory).mockRejectedValue(new Error("db down"))
    expect(await ask("chat:join", "t1")).toEqual([])
  })

  it("sends a new message to everyone in the table's chat", async () => {
    jest.mocked(getHistory).mockResolvedValue([])
    jest.mocked(sendMessage).mockResolvedValue(message)
    await ask("chat:join", "t1")
    const received = new Promise((resolve) => client.once("chat:message", resolve))
    expect(await ask("chat:send", hi)).toEqual({ ok: true })
    expect(await received).toEqual(message)
    expect(sendMessage).toHaveBeenCalledWith("t1", "u1", "hi")
  })

  it("tells the sender why a message was refused", async () => {
    jest.mocked(sendMessage).mockRejectedValue(new ChatError("Only seated players can chat"))
    expect(await ask("chat:send", hi)).toEqual({ ok: false, error: "Only seated players can chat" })
  })

  it("hides unexpected errors", async () => {
    jest.mocked(sendMessage).mockRejectedValue(new Error("db down"))
    expect(await ask("chat:send", hi)).toEqual({ ok: false, error: "Message not sent" })
  })

  it("slows down a player who sends too fast", async () => {
    jest.mocked(sendMessage).mockResolvedValue(message)
    for (let i = 0; i < 5; i++) await ask("chat:send", hi)
    expect(await ask("chat:send", hi)).toEqual({ ok: false, error: "You're sending messages too fast" })
  })
})
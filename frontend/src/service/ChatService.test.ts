import { io } from "socket.io-client"
import { watchChat } from "@/service/ChatService"

jest.mock("socket.io-client", () => ({ io: jest.fn() }))

const handlers: Record<string, (data?: unknown) => void> = {}
const socket = {
  on: jest.fn((event: string, handler: (data?: unknown) => void) => {
    handlers[event] = handler
  }),
  emit: jest.fn(),
  disconnect: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(io).mockReturnValue(socket as never)
})

describe("ChatService", () => {
  it("joins a table's chat and passes history and new messages on", () => {
    const onHistory = jest.fn()
    const onMessage = jest.fn()
    const chat = watchChat("t1", "u1", onHistory, onMessage)
    handlers.connect()
    expect(socket.emit).toHaveBeenCalledWith("chat:join", "t1", onHistory)
    handlers["chat:message"]({ id: 1 })
    expect(onMessage).toHaveBeenCalledWith({ id: 1 })
    chat.stop()
    expect(socket.disconnect).toHaveBeenCalled()
  })

  it("sends a message and gives back the server's reply", async () => {
    socket.emit.mockImplementation((_event: string, _payload: unknown, ack?: (reply: unknown) => void) => ack?.({ ok: true }))
    const chat = watchChat("t1", "u1", jest.fn(), jest.fn())
    await expect(chat.send("hi")).resolves.toEqual({ ok: true })
    expect(socket.emit).toHaveBeenCalledWith("chat:send", { tableId: "t1", userId: "u1", body: "hi" }, expect.any(Function))
  })
})
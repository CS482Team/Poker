import { io } from "socket.io-client"
import { watchEmotes } from "@/service/EmoteService"

jest.mock("socket.io-client", () => ({ io: jest.fn() }))
jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

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

describe("EmoteService", () => {
  it("joins a table's emotes and passes each played emote on", () => {
    const onPlayed = jest.fn()
    const emotes = watchEmotes("t1", onPlayed)
    handlers.connect()
    expect(socket.emit).toHaveBeenCalledWith("emote:join", "t1")
    handlers["emote:played"]({ userId: "u2" })
    expect(onPlayed).toHaveBeenCalledWith({ userId: "u2" })
    emotes.stop()
    expect(socket.disconnect).toHaveBeenCalled()
  })

  it("sends an emote and gives back the server's reply", async () => {
    socket.emit.mockImplementation((_event: string, _payload: unknown, ack?: (reply: unknown) => void) => ack?.({ ok: true }))
    const emotes = watchEmotes("t1", jest.fn())
    await expect(emotes.send("emote_2")).resolves.toEqual({ ok: true })
    expect(socket.emit).toHaveBeenCalledWith("emote:send", { tableId: "t1", slot: "emote_2" }, expect.any(Function))
  })
})

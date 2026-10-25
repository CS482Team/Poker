import { io } from "socket.io-client"
import { watchTable, watchTables } from "@/service/SocketService"

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

describe("socketService", () => {
  it("watches a table and its game on one socket", () => {
    const onTable = jest.fn()
    const onView = jest.fn()
    const stop = watchTable("t1", "u1", onTable, onView)
    handlers.connect()
    handlers.table({ id: "t1" })
    handlers.view({ id: "g1" })
    expect(io).toHaveBeenCalledTimes(1)
    expect(socket.emit).toHaveBeenCalledWith("watch", "t1")
    expect(socket.emit).toHaveBeenCalledWith("watchHand", { tableId: "t1", userId: "u1" })
    expect(onTable).toHaveBeenCalledWith({ id: "t1" })
    expect(onView).toHaveBeenCalledWith({ id: "g1" })
    stop()
    expect(socket.disconnect).toHaveBeenCalled()
  })

  it("watches the lobby and passes updates on", () => {
    const onTables = jest.fn()
    watchTables(onTables)
    handlers.connect()
    handlers.tables([])
    expect(socket.emit).toHaveBeenCalledWith("watchLobby", undefined)
    expect(onTables).toHaveBeenCalledWith([])
  })
})

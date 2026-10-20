import { io } from "socket.io-client"
import { watchTable, watchTables } from "@/service/socketService"

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
  it("watches a table and passes updates on", () => {
    const onTable = jest.fn()
    const stop = watchTable("t1", onTable)
    handlers.connect()
    handlers.table({ id: "t1" })
    expect(socket.emit).toHaveBeenCalledWith("watch", "t1")
    expect(onTable).toHaveBeenCalledWith({ id: "t1" })
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

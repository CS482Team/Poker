import { createServer, Server as HttpServer } from "http"
import type { AddressInfo } from "net"
import { io as connect, Socket } from "socket.io-client"
import { getAllTables, getTable } from "../../src/dao/TableDAO"
import { broadcastChange, initSocket, sendViews } from "../../src/socket/io"
import { getTableView } from "../../src/services/GameService"

jest.mock("../../src/dao/TableDAO", () => ({
  getAllTables: jest.fn(),
  getTable: jest.fn(),
}))

jest.mock("../../src/services/GameService", () => ({ getTableView: jest.fn() }))

const detail = { id: "t1", name: "Table", maxPlayers: 2, buyIn: 100, status: 1, variant: "five-card-draw", minimumBet: 5, ante: 1, seats: [] }

let server: HttpServer
let client: Socket

function next(event: string) {
  return new Promise((resolve) => client.once(event, resolve))
}

beforeAll(async () => {
  server = createServer()
  initSocket(server)
  await new Promise<void>((resolve) => server.listen(0, resolve))
})

beforeEach(async () => {
  jest.mocked(getTable).mockResolvedValue(detail)
  jest.mocked(getAllTables).mockResolvedValue([])
  client = connect(`http://localhost:${(server.address() as AddressInfo).port}`)
  await next("connect")
})

afterEach(() => {
  client.disconnect()
})

afterAll(() => {
  server.closeAllConnections()
  server.close()
})

function join(event: string, ...args: unknown[]) {
  return new Promise<void>((resolve) => client.emit(event, ...args, resolve))
}

describe("socket", () => {
  it("sends the table to watchers of that table", async () => {
    await join("watch", "t1")
    const received = next("table")
    await broadcastChange("t1")
    expect(await received).toEqual(detail)
  })

  it("sends the table list to lobby watchers", async () => {
    await join("watchLobby")
    const received = next("tables")
    await broadcastChange("t1")
    expect(await received).toEqual([])
  })

  it("does not send a deleted table", async () => {
    jest.mocked(getTable).mockResolvedValue(null)
    await join("watch", "t1")
    await join("watchLobby")
    const handler = jest.fn()
    client.on("table", handler)
    const lobby = next("tables")
    await broadcastChange("t1")
    await lobby
    expect(handler).not.toHaveBeenCalled()
  })

  it("sends a player their view when they watch it", async () => {
    jest.mocked(getTableView).mockReturnValue({ id: "g1" } as never)
    const received = next("view")
    await join("watchHand", { tableId: "t1", userId: "a" })
    expect(await received).toEqual({ id: "g1" })
  })

  it("pushes views to the players in a table", async () => {
    jest.mocked(getTableView).mockReturnValue({ id: "g1" } as never)
    await join("watchHand", { tableId: "t1", userId: "a" })
    const received = next("view")
    sendViews("t1", ["a", "b"])
    expect(await received).toEqual({ id: "g1" })
  })
})

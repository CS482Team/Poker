import { createServer, Server as HttpServer } from "http"
import type { AddressInfo } from "net"
import { io as connect, Socket } from "socket.io-client"
import { getAllTables, getTable } from "../dao/TableDAO"
import { broadcastChange, broadcastChat, broadcastEmote, initSocket, sendViews } from "../socket/io"
import { getTableView } from "../services/GameService"

jest.mock("../dao/TableDAO", () => ({
  getAllTables: jest.fn(),
  getTable: jest.fn(),
}))

jest.mock("../services/GameService", () => ({ getTableView: jest.fn() }))
jest.mock("../dao/UserDAO", () => ({ getUserIdFromToken: async (token: string) => token }))
// cosmetics are tested in ShopService.test.ts; here the table passes straight through
jest.mock("../services/ShopService", () => ({ withCosmetics: async (table: unknown) => table }))
jest.mock("../services/BadgeService", () => ({ withBadges: async (table: unknown) => table }))
jest.mock("../services/ChatService", () => ({ getHistory: jest.fn().mockResolvedValue([]) }))

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

async function signIn(token: string) {
  client.disconnect()
  client = connect(`http://localhost:${(server.address() as AddressInfo).port}`, { auth: { token } })
  await next("connect")
}

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
    await signIn("a")
    const received = next("view")
    await join("watchHand", "t1")
    expect(await received).toEqual({ id: "g1" })
    expect(getTableView).toHaveBeenLastCalledWith("t1", "a")
  })

  it("pushes views to everyone watching a table", async () => {
    jest.mocked(getTableView).mockReturnValue({ id: "g1" } as never)
    await signIn("a")
    await join("watchHand", "t1")
    const received = next("view")
    sendViews("t1")
    expect(await received).toEqual({ id: "g1" })
    expect(getTableView).toHaveBeenLastCalledWith("t1", "a")
  })
  it("sends chat messages to that table's chat", async () => {
    const message = { id: 1, tableId: "t1", userId: "u1", name: "Maya", avatarUrl: null, body: "hi", createdAt: "" }
    await join("chat:join", "t1")
    const received = next("chat:message")
    broadcastChat(message)
    expect(await received).toEqual(message)
  })
  it("sends played emotes to that table's emote room", async () => {
    const played = { tableId: "t1", userId: "u1", emote: { id: "e1", name: "Big Laugh", description: "", type: "emote" as const, rarity: "rare" as const, cost: 500, assetUrl: null, style: { text: "😂" } } }
    await join("emote:join", "t1")
    const received = next("emote:played")
    broadcastEmote(played)
    expect(await received).toEqual(played)
  })
})

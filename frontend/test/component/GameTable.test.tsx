import { act, fireEvent, render, screen } from "@testing-library/react"
import GameTable from "@/component/GameTable"
import { act as playAction, draw } from "@/service/GameService"
import { watchTable } from "@/service/SocketService"
import { fetchTable, leaveTable } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/TableService", () => ({
  fetchTable: jest.fn(),
  leaveTable: jest.fn(),
}))

jest.mock("@/service/SocketService", () => ({
  watchTable: jest.fn(() => jest.fn()),
}))

jest.mock("@/service/GameService", () => ({ act: jest.fn(), draw: jest.fn() }))

jest.mock("@/service/CurrentTableService", () => ({
  clearCurrentTableId: jest.fn(),
}))

const table = {
  id: "t1",
  name: "Table One",
  maxPlayers: 6,
  buyIn: 100,
  status: 1,
  variant: "five_card_draw",
  minimumBet: 5,
  ante: 1,
  seats: [
    { userId: getCurrentUserId(), username: "Alex", seatNumber: 0, stack: 2450 },
    { userId: "u2", username: "Maya", seatNumber: 1, stack: 1840 },
  ],
}

const view = {
  gameId: "g1",
  toActSeat: 0,
  players: [{ seat: 0, name: "Alex" }],
  you: { seat: 0, hand: [], legalActions: [{ type: "check" }] },
}

async function showView(shown: object = view) {
  render(<GameTable id="t1" />)
  await screen.findByText("Maya")
  act(() => jest.mocked(watchTable).mock.calls[0][3](shown as never))
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchTable).mockResolvedValue(table)
})

describe("GameTable", () => {
  it("shows the players and Me for the current user", async () => {
    render(<GameTable id="t1" />)
    expect(await screen.findByText("Maya")).toBeInTheDocument()
    expect(screen.getByText("Me")).toBeInTheDocument()
  })

  it("shows a player who joins over the socket", async () => {
    render(<GameTable id="t1" />)
    await screen.findByText("Maya")
    const push = jest.mocked(watchTable).mock.calls[0][2]
    act(() => push({ ...table, seats: [...table.seats, { userId: "u3", username: "Sam", seatNumber: 2, stack: 100 }] }))
    expect(screen.getByText("Sam")).toBeInTheDocument()
  })

  it("shows the error", async () => {
    jest.mocked(fetchTable).mockRejectedValue(new Error("Failed"))
    render(<GameTable id="t1" />)
    expect(await screen.findByText("Failed")).toBeInTheDocument()
  })

  it("leaves and goes to the lobby", async () => {
    render(<GameTable id="t1" />)
    fireEvent.click(await screen.findByRole("button", { name: "Leave table" }))
    await screen.findByText("Maya")
    expect(leaveTable).toHaveBeenCalledWith("t1", getCurrentUserId())
    expect(mockPush).toHaveBeenCalledWith("/")
  })

  it("sends an action from the action bar", async () => {
    await showView()
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    expect(playAction).toHaveBeenCalledWith("g1", getCurrentUserId(), "check", undefined)
  })

  it("shows a refused action", async () => {
    jest.mocked(playAction).mockRejectedValue(new Error("Failed to act (409)"))
    await showView()
    fireEvent.click(screen.getByRole("button", { name: "Check" }))
    expect(await screen.findByText("Failed to act (409)")).toBeInTheDocument()
  })

  it("draws the selected cards", async () => {
    const hand = [{ rank: 14, suit: "spades" }, { rank: 13, suit: "hearts" }]
    await showView({ ...view, phase: "draw", you: { seat: 0, hand, legalActions: [] } })
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[1]!)
    fireEvent.click(screen.getByRole("button", { name: "Draw" }))
    expect(draw).toHaveBeenCalledWith("g1", getCurrentUserId(), [1])
  })
})

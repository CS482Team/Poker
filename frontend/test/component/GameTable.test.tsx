import { act, fireEvent, render, screen } from "@testing-library/react"
import GameTable from "@/component/GameTable"
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
  watchHand: jest.fn(() => jest.fn()),
}))

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
    const push = jest.mocked(watchTable).mock.calls[0][1]
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
})

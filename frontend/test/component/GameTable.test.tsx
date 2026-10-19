import { fireEvent, render, screen } from "@testing-library/react"
import GameTable from "@/component/GameTable"
import { fetchTable, leaveTable } from "@/service/tableService"
import { CURRENT_USER_ID } from "@/service/userService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/tableService", () => ({
  POLL_INTERVAL_MS: 3000,
  fetchTable: jest.fn(),
  leaveTable: jest.fn(),
}))

jest.mock("@/service/currentTableService", () => ({
  clearCurrentTableId: jest.fn(),
}))

const table = {
  id: "t1",
  name: "Room One",
  maxPlayers: 6,
  buyIn: 100,
  seats: [
    { userId: CURRENT_USER_ID, username: "Alex", seatNumber: 0, stack: 2450 },
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

  it("shows the error", async () => {
    jest.mocked(fetchTable).mockRejectedValue(new Error("Failed"))
    render(<GameTable id="t1" />)
    expect(await screen.findByText("Failed")).toBeInTheDocument()
  })

  it("leaves and goes to the lobby", async () => {
    render(<GameTable id="t1" />)
    fireEvent.click(await screen.findByRole("button", { name: "Leave table" }))
    await screen.findByText("Maya")
    expect(leaveTable).toHaveBeenCalledWith("t1", CURRENT_USER_ID)
    expect(mockPush).toHaveBeenCalledWith("/")
  })
})

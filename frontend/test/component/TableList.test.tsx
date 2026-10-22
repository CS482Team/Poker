import { act, fireEvent, render, screen } from "@testing-library/react"
import TableList from "@/component/TableList"
import { getCurrentTableId } from "@/service/CurrentTableService"
import { watchTables } from "@/service/SocketService"
import { fetchTables, joinTable } from "@/service/TableService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/TableService", () => ({
  fetchTables: jest.fn(),
  joinTable: jest.fn(),
  createTable: jest.fn(),
}))

jest.mock("@/service/SocketService", () => ({
  watchTables: jest.fn(() => jest.fn()),
}))

jest.mock("@/service/CurrentTableService", () => ({
  getCurrentTableId: jest.fn(),
  setCurrentTableId: jest.fn(),
}))

const seat = (userId: string, seatNumber: number) => ({ userId, username: userId, seatNumber, stack: 100 })

const table = {
  id: "t1",
  name: "Table One",
  status: 0,
  variant: "five_card_draw",
  buyIn: 100,
  minimumBet: 10,
  ante: 5,
  maxPlayers: 6,
  seats: [seat("u1", 0), seat("u2", 1)],
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getCurrentTableId).mockReturnValue(null)
})

describe("TableList", () => {
  it("shows the tables", async () => {
    jest.mocked(fetchTables).mockResolvedValue([table])
    render(<TableList />)
    expect(await screen.findByText("Table One")).toBeInTheDocument()
  })

  it("shows tables pushed over the socket", async () => {
    jest.mocked(fetchTables).mockResolvedValue([])
    render(<TableList />)
    await screen.findByText("No tables yet.")
    const push = jest.mocked(watchTables).mock.calls[0][0]
    act(() => push([table]))
    expect(screen.getByText("Table One")).toBeInTheDocument()
  })

  it("shows the error", async () => {
    jest.mocked(fetchTables).mockRejectedValue(new Error("Failed"))
    render(<TableList />)
    expect(await screen.findByText("Failed")).toBeInTheDocument()
  })

  it("joins and opens the table", async () => {
    jest.mocked(fetchTables).mockResolvedValue([table])
    render(<TableList />)
    fireEvent.click(await screen.findByRole("button", { name: "Join" }))
    await screen.findByText("Table One")
    expect(joinTable).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/table/t1")
  })

  it("returns to the current table", async () => {
    jest.mocked(getCurrentTableId).mockReturnValue("t1")
    jest.mocked(fetchTables).mockResolvedValue([table])
    render(<TableList />)
    fireEvent.click(await screen.findByRole("button", { name: "Return" }))
    expect(joinTable).not.toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/table/t1")
  })

  it("disables a full table", async () => {
    jest.mocked(fetchTables).mockResolvedValue([{ ...table, seats: [0, 1, 2, 3, 4, 5].map((n) => seat(`u${n}`, n)) }])
    render(<TableList />)
    expect(await screen.findByRole("button", { name: "Full" })).toBeDisabled()
  })
})

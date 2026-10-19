import { fireEvent, render, screen } from "@testing-library/react"
import TableList from "@/component/TableList"
import { getCurrentTableId } from "@/service/currentTableService"
import { fetchTables, joinTable } from "@/service/tableService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/tableService", () => ({
  POLL_INTERVAL_MS: 3000,
  fetchTables: jest.fn(),
  joinTable: jest.fn(),
  createTable: jest.fn(),
}))

jest.mock("@/service/currentTableService", () => ({
  getCurrentTableId: jest.fn(),
  setCurrentTableId: jest.fn(),
}))

const table = {
  id: "t1",
  name: "Room One",
  status: 0,
  variant: "five_card_draw",
  buyIn: 100,
  minimumBet: 10,
  ante: 5,
  maxPlayers: 6,
  players: 2,
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getCurrentTableId).mockReturnValue(null)
})

describe("TableList", () => {
  it("shows the tables", async () => {
    jest.mocked(fetchTables).mockResolvedValue([table])
    render(<TableList />)
    expect(await screen.findByText("Room One")).toBeInTheDocument()
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
    await screen.findByText("Room One")
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
    jest.mocked(fetchTables).mockResolvedValue([{ ...table, players: 6 }])
    render(<TableList />)
    expect(await screen.findByRole("button", { name: "Full" })).toBeDisabled()
  })
})

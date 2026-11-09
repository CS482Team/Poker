import { render, screen } from "@testing-library/react"
import AuthBrand from "@/app/components/AuthBrand"
import { fetchTables } from "@/service/TableService"

jest.mock("@/service/TableService", () => ({ fetchTables: jest.fn() }))

const seat = { userId: "u1", username: "Maya", seatNumber: 0, stack: 100 }
const table = { id: "t1", name: "One", status: 0, variant: "five-card-draw", buyIn: 100, minimumBet: 5, ante: 1, maxPlayers: 6, seats: [seat, { ...seat, userId: "u2" }] }

describe("AuthBrand", () => {
  it("shows real table and player counts", async () => {
    jest.mocked(fetchTables).mockResolvedValue([table, { ...table, id: "t2", seats: [seat] }])
    render(<AuthBrand />)
    expect(await screen.findByText("3")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
  })

  it("shows zero when tables can't load", async () => {
    jest.mocked(fetchTables).mockRejectedValue(new Error("down"))
    render(<AuthBrand />)
    expect(await screen.findAllByText("0")).toHaveLength(2)
  })
})

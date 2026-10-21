import { fireEvent, render, screen } from "@testing-library/react"
import Table from "./Table"
import { dealDemo } from "@/service/Game"
import type { DemoDeal } from "@/service/Game"
import type { Suit } from "@/util/Card"

jest.mock("@/service/Game")

// Five cards of one suit, so every card in the deal is different
const hand = (suit: Suit) => [2, 3, 4, 5, 6].map(rank => ({ rank, suit }))

const deal: DemoDeal = {
  matchId: "m1",
  pot: 4,
  dealerSeat: 0,
  toActSeat: 1,
  players: [
    { seat: 0, name: "Alice", stack: 99, status: "active", hand: [{ rank: 14, suit: "spades" }, ...hand("hearts").slice(1)] },
    { seat: 1, name: "Bob", stack: 99, status: "active", hand: hand("clubs") },
    { seat: 2, name: "Cara", stack: 99, status: "active", hand: hand("diamonds") },
    { seat: 3, name: "Dan", stack: 99, status: "active", hand: [2, 3, 4, 5, 6].map(rank => ({ rank: rank + 5, suit: "spades" as Suit })) },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("Table (demo game room)", () => {
  it("shows an empty table before the first deal", () => {
    render(<Table />)
    expect(screen.getByText("Click Deal to start a hand")).toBeInTheDocument()
  })

  it("seats every player after clicking Deal", async () => {
    jest.mocked(dealDemo).mockResolvedValue(deal)
    render(<Table />)

    fireEvent.click(screen.getByRole("button", { name: "Deal" }))

    expect(await screen.findAllByText("99 chips")).toHaveLength(4)
    expect(screen.getByText("Pot")).toBeInTheDocument()
  })

  it("shows your cards face-up and the bots' cards face-down", async () => {
    jest.mocked(dealDemo).mockResolvedValue(deal)
    render(<Table />)

    fireEvent.click(screen.getByRole("button", { name: "Deal" }))

    expect(await screen.findByAltText("A♠")).toBeInTheDocument()
    expect(screen.getAllByAltText("Face-down card")).toHaveLength(15)
  })

  it("flips the bots' cards face-up with Reveal all", async () => {
    jest.mocked(dealDemo).mockResolvedValue(deal)
    render(<Table />)
    fireEvent.click(screen.getByRole("button", { name: "Deal" }))
    await screen.findByAltText("A♠")

    fireEvent.click(screen.getByLabelText("Reveal all"))

    expect(screen.queryAllByAltText("Face-down card")).toHaveLength(0)
    expect(screen.getByAltText("2♣")).toBeInTheDocument()
  })

  it("shows whose turn it is", async () => {
    jest.mocked(dealDemo).mockResolvedValue(deal)
    render(<Table />)

    fireEvent.click(screen.getByRole("button", { name: "Deal" }))

    expect(await screen.findByText("Bob to act")).toBeInTheDocument()
  })

  it("shows an error when the deal fails", async () => {
    jest.mocked(dealDemo).mockRejectedValue(new Error("Deal failed (500)"))
    render(<Table />)

    fireEvent.click(screen.getByRole("button", { name: "Deal" }))

    expect(await screen.findByText("Deal failed (500)")).toBeInTheDocument()
  })
})

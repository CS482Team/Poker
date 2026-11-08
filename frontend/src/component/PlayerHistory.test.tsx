import { fireEvent, render, screen } from "@testing-library/react"
import PlayerHistory from "@/component/PlayerHistory"
import { fetchPlayerHands, fetchPlayers } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ fetchPlayers: jest.fn(), fetchPlayerHands: jest.fn() }))

const maya = { id: "u1", username: "Maya", balance: 1840, handsPlayed: 3 }
const theo = { id: "u2", username: "Theo", balance: 2120, handsPlayed: 0 }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(fetchPlayers).mockResolvedValue([maya, theo])
  jest.mocked(fetchPlayerHands).mockResolvedValue([
    { matchId: "m1", tableName: "The Ruby", handNumber: 1, pot: 480, winner: "Maya", netResult: 240, endedAt: "2026-11-08T12:00:00Z" },
    { matchId: "m2", tableName: "The Ruby", handNumber: 2, pot: 300, winner: "Theo", netResult: -150, endedAt: "2026-11-07T12:00:00Z" },
  ])
})

describe("PlayerHistory", () => {
  it("shows a player's hands once picked", async () => {
    render(<PlayerHistory />)
    fireEvent.click(await screen.findByRole("button", { name: /Maya/ }))
    expect(await screen.findByText("Won $240")).toBeInTheDocument()
    expect(screen.getByText("Lost $150")).toBeInTheDocument()
    expect(screen.getByText("$1,840", { selector: "p" })).toBeInTheDocument()
    expect(screen.getByText("$90")).toBeInTheDocument()
    expect(screen.getByText(`Hand #1 · Pot $480 · Won by Maya`)).toBeInTheDocument()
    expect(fetchPlayerHands).toHaveBeenCalledWith("u1")
  })

  it("searches and picks another player", async () => {
    render(<PlayerHistory />)
    expect(await screen.findByText("Select a player to see their history.")).toBeInTheDocument()
    jest.mocked(fetchPlayerHands).mockResolvedValue([])
    fireEvent.change(screen.getByLabelText("Search players"), { target: { value: "the" } })
    expect(screen.queryByRole("button", { name: /Maya/ })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Theo/ }))
    expect(await screen.findByText("No hands yet.")).toBeInTheDocument()
    expect(fetchPlayerHands).toHaveBeenCalledWith("u2")
  })

  it("shows errors", async () => {
    jest.mocked(fetchPlayers).mockRejectedValue(new Error("Failed to load players (500)"))
    render(<PlayerHistory />)
    expect(await screen.findByText("Failed to load players (500)")).toBeInTheDocument()
  })
})

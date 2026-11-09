import { render, screen } from "@testing-library/react"
import MyHistory from "@/component/MyHistory"
import { fetchMyHands } from "@/service/HistoryService"

jest.mock("@/service/HistoryService", () => ({ fetchMyHands: jest.fn() }))

describe("MyHistory", () => {
  it("lists the player's hands", async () => {
    jest.mocked(fetchMyHands).mockResolvedValue([
      { matchId: "m1", tableName: "The Ruby", handNumber: 2, pot: 300, winner: "Maya", netResult: 120, endedAt: "2026-11-09T12:00:00Z" },
    ])
    render(<MyHistory />)
    expect(await screen.findByText("Won $120")).toBeInTheDocument()
  })

  it("asks a signed out player to sign in", async () => {
    jest.mocked(fetchMyHands).mockRejectedValue(new Error("Failed to load history (401)"))
    render(<MyHistory />)
    expect(await screen.findByText("Sign in to see your game history.")).toBeInTheDocument()
  })
})

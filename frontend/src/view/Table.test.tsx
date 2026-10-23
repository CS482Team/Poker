import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import Table, { statusText } from "./Table"
import { act, getView, startGame } from "@/service/Game"
import type { LegalAction, PlayerView, PublicPlayer } from "@/service/Game"
import type { Card } from "@/util/Card"

jest.mock("@/service/Game")

const NAMES = ["Alice", "Bob", "Cara", "Dan"]
const players: PublicPlayer[] = NAMES.map((name, seat) => ({
  seat,
  id: `bot-${seat}`,
  name,
  stack: 99,
  status: "active",
  betThisRound: 0,
  cardCount: 5,
}))
const hand: Card[] = [2, 3, 4, 5, 14].map(rank => ({ rank, suit: "spades" }))
const opening: LegalAction[] = [
  { type: "fold" },
  { type: "check" },
  { type: "bet", min: 2, max: 99 },
]

// A player's view of the demo hand: Alice deals, so Bob (seat 1) acts first
function viewFor(seat: number, overrides: Partial<PlayerView> = {}): PlayerView {
  return {
    gameId: "g1",
    phase: "predraw-betting",
    pot: 4,
    handNumber: 1,
    dealerSeat: 0,
    toActSeat: 1,
    round: { street: "predraw", currentBet: 0, minRaise: 2 },
    you: { seat, hand, legalActions: seat === 1 ? opening : [] },
    players,
    ...overrides,
  }
}

const seatOf = (playerId: string) => Number(playerId.split("-")[1])

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(startGame).mockResolvedValue({ gameId: "g1", matchId: "m1" })
  jest.mocked(getView).mockImplementation(async (_game, playerId) => viewFor(seatOf(playerId)))
})

async function dealIn() {
  render(<Table />)
  fireEvent.click(screen.getByRole("button", { name: "Deal" }))
  await screen.findByText("Your turn, Bob")
}

describe("Table (game room)", () => {
  it("shows an empty table before the first deal", () => {
    render(<Table />)
    expect(screen.getByText("Click Deal to start a hand")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Fold" })).toBeDisabled()
  })

  it("starts a game and follows the turn to the first player to act", async () => {
    await dealIn()
    expect(getView).toHaveBeenCalledWith("g1", "bot-0")
    expect(getView).toHaveBeenLastCalledWith("g1", "bot-1")
    expect(screen.getAllByText("99 chips")).toHaveLength(4)
  })

  it("shows only the viewer's cards face-up; everyone else's are backs", async () => {
    await dealIn()
    expect(screen.getByAltText("A♠")).toBeInTheDocument()
    expect(screen.getAllByAltText("Face-down card")).toHaveLength(15)
  })

  it("offers exactly the legal actions, with their amounts", async () => {
    await dealIn()
    expect(screen.getByRole("button", { name: "Fold" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Check" })).toBeEnabled()
    expect(screen.getByRole("button", { name: "Bet 2" })).toBeEnabled()
  })

  it("sends the chosen action for the viewer, then follows the turn", async () => {
    jest.mocked(act).mockResolvedValue(viewFor(1, { toActSeat: 2, pot: 6 }))
    jest.mocked(getView).mockImplementation(async (_game, playerId) =>
      viewFor(seatOf(playerId), jest.mocked(act).mock.calls.length ? { toActSeat: 2, pot: 6 } : {}),
    )
    await dealIn()

    fireEvent.click(screen.getByRole("button", { name: "Bet 2" }))

    expect(await screen.findByText("Your turn, Cara")).toBeInTheDocument()
    expect(act).toHaveBeenCalledWith("g1", "bot-1", "bet", 2)
    expect(screen.getByText("6")).toBeInTheDocument()
  })

  it("disables the buttons when it isn't the viewer's turn", async () => {
    await dealIn()

    fireEvent.change(screen.getByLabelText("Viewing as"), { target: { value: "bot-3" } })

    expect(await screen.findByText("Bob to act")).toBeInTheDocument()
    expect(getView).toHaveBeenLastCalledWith("g1", "bot-3")
    expect(screen.getByLabelText("Follow turn")).not.toBeChecked()
    expect(screen.getByRole("button", { name: "Fold" })).toBeDisabled()
  })

  it("jumps back to the player to act when follow turn is switched on again", async () => {
    await dealIn()
    fireEvent.change(screen.getByLabelText("Viewing as"), { target: { value: "bot-3" } })
    await screen.findByText("Bob to act")

    fireEvent.click(screen.getByLabelText("Follow turn"))

    expect(await screen.findByText("Your turn, Bob")).toBeInTheDocument()
  })

  it("keeps the same viewer after acting when follow turn is off", async () => {
    jest.mocked(act).mockResolvedValue(viewFor(1, { toActSeat: 2, pot: 6 }))
    await dealIn()
    fireEvent.click(screen.getByLabelText("Follow turn"))
    await waitFor(() => expect(screen.getByRole("button", { name: "Bet 2" })).toBeEnabled())

    fireEvent.click(screen.getByRole("button", { name: "Bet 2" }))

    expect(await screen.findByText("Cara to act")).toBeInTheDocument()
    expect(getView).not.toHaveBeenCalledWith("g1", "bot-2")
  })

  it("sends a fold when Fold is clicked", async () => {
    jest.mocked(act).mockResolvedValue(viewFor(1, { toActSeat: 2 }))
    await dealIn()

    fireEvent.click(screen.getByRole("button", { name: "Fold" }))

    await waitFor(() => expect(act).toHaveBeenCalledWith("g1", "bot-1", "fold", undefined))
  })

  it("sends a check when Check is clicked", async () => {
    jest.mocked(act).mockResolvedValue(viewFor(1, { toActSeat: 2 }))
    await dealIn()

    fireEvent.click(screen.getByRole("button", { name: "Check" }))

    await waitFor(() => expect(act).toHaveBeenCalledWith("g1", "bot-1", "check", undefined))
  })

  it("bets the amount chosen on the slider", async () => {
    jest.mocked(act).mockResolvedValue(viewFor(1, { toActSeat: 2 }))
    await dealIn()

    fireEvent.change(screen.getByLabelText("Bet amount"), { target: { value: "40" } })
    fireEvent.click(screen.getByRole("button", { name: "Bet 40" }))

    await waitFor(() => expect(act).toHaveBeenCalledWith("g1", "bot-1", "bet", 40))
  })

  it("labels the top of the slider as all-in", async () => {
    await dealIn()

    fireEvent.change(screen.getByLabelText("Bet amount"), { target: { value: "99" } })

    expect(screen.getByRole("button", { name: "All-in 99" })).toBeEnabled()
  })

  it("offers call and raise-to when facing a bet", async () => {
    const facingBet = viewFor(1, {
      round: { street: "predraw", currentBet: 10, minRaise: 10 },
      you: {
        seat: 1,
        hand,
        legalActions: [{ type: "fold" }, { type: "call", amount: 10 }, { type: "raise", min: 20, max: 99 }],
      },
    })
    jest.mocked(getView).mockImplementation(async (_game, playerId) => (playerId === "bot-1" ? facingBet : viewFor(seatOf(playerId))))
    jest.mocked(act).mockResolvedValue(viewFor(1, { toActSeat: 2 }))
    render(<Table />)
    fireEvent.click(screen.getByRole("button", { name: "Deal" }))

    fireEvent.click(await screen.findByRole("button", { name: "Call 10" }))
    expect(screen.getByRole("button", { name: "Raise to 20" })).toBeInTheDocument()
    await waitFor(() => expect(act).toHaveBeenCalledWith("g1", "bot-1", "call", undefined))
  })

  it("shows the backend's error when a request fails", async () => {
    jest.mocked(startGame).mockRejectedValue(new Error("start-failed"))
    render(<Table />)

    fireEvent.click(screen.getByRole("button", { name: "Deal" }))

    expect(await screen.findByText("start-failed")).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole("button", { name: "Deal" })).toBeEnabled())
  })

  it("marks folded and all-in players", async () => {
    const changed = players.map(p =>
      p.seat === 2 ? { ...p, status: "folded" as const } : p.seat === 3 ? { ...p, status: "all-in" as const, betThisRound: 1 } : p,
    )
    jest.mocked(getView).mockImplementation(async (_game, playerId) => viewFor(seatOf(playerId), { players: changed }))
    await dealIn()

    expect(screen.getByText("Folded")).toBeInTheDocument()
    expect(screen.getByText("All-in")).toBeInTheDocument()
    expect(screen.getByText("Bet 1")).toBeInTheDocument()
  })
})

describe("statusText", () => {
  it("says what comes next once betting ends", () => {
    expect(statusText(viewFor(1, { phase: "draw", toActSeat: 1 }))).toBe("Betting round over: the draw is next (S3)")
    expect(statusText(viewFor(1, { phase: "showdown", toActSeat: null }))).toBe("Betting over: showdown is next (S4)")
  })

  it("handles a betting round with nobody to act", () => {
    expect(statusText(viewFor(1, { toActSeat: null }))).toBe("Waiting for the next round")
  })

  it("asks you to deal when there's no game", () => {
    expect(statusText(null)).toBe("Deal to start a hand")
  })

  it("tests clicks of cards", async() => {
    //jest.mocked(dealDemo).mockResolvedValue(deal)
    //render(<Table />)
    fireEvent.click(screen.getByRole("button", { name: "A♠" }))
    expect(screen.getByRole("button", { name: "A♠, selected to discard" })).toHaveAttribute("aria-pressed", "true")
  })
})
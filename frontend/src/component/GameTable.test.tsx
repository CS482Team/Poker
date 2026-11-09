import { act, fireEvent, render, screen, within } from "@testing-library/react"
import GameTable from "@/component/GameTable"
import { clearCurrentTableId } from "@/service/CurrentTableService"
import { act as playAction, draw } from "@/service/GameService"
import { watchTable } from "@/service/SocketService"
import { fetchTable, leaveTable } from "@/service/TableService"
import { getCurrentUserId } from "@/service/UserService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/ChatService", () => ({
  watchChat: () => ({ send: jest.fn(), stop: jest.fn() }),
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
  botCount: 0,
  seats: [
    { userId: getCurrentUserId(), username: "Alex", seatNumber: 0, stack: 2450 },
    { userId: "u2", username: "Maya", seatNumber: 1, stack: 1840 },
  ],
}

const view = {
  gameId: "g1",
  pot: 0,
  toActSeat: 0,
  players: [{ seat: 0, id: getCurrentUserId(), name: "Alex", stack: 2450 }],
  you: { seat: 0, hand: [], legalActions: [{ type: "check" }] },
  winners: [],
  winnings: {},
}

// players as the game sends them; `seat` is their place in the game's turn order
const alex = { seat: 0, id: getCurrentUserId(), name: "Alex", stack: 2450, status: "active", betThisRound: 0, cardCount: 5 }
const maya = { seat: 1, id: "u2", name: "Maya", stack: 1840, status: "active", betThisRound: 0, cardCount: 5 }

/* the seat on the table showing this name */
function seatOf(name: string) {
  return screen.getByText(name).closest("[data-seat]") as HTMLElement
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
    expect(clearCurrentTableId).toHaveBeenCalled()
  })

  it("leaves and goes to the lobby", async () => {
    render(<GameTable id="t1" />)
    fireEvent.click(await screen.findByRole("button", { name: "Leave" }))
    await screen.findByText("Maya")
    expect(leaveTable).toHaveBeenCalledWith("t1", getCurrentUserId())
    expect(mockPush).toHaveBeenCalledWith("/dashboard")
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

  it("shows the pot and live stacks", async () => {
    await showView({ ...view, pot: 40, toActSeat: null, players: [{ seat: 1, id: "u2", name: "Maya", stack: 1800 }], winners: ["u2"] })
    expect(screen.getByText("$40")).toBeInTheDocument()
    expect(screen.getByLabelText("Winner")).toBeInTheDocument()
    expect(screen.getByText("$1,800")).toBeInTheDocument()
    expect(screen.getByText("Round over, waiting for next round")).toBeInTheDocument()
  })

  it("shows the pot", async () => {
    await showView({ ...view, pot: 1200 })
    expect(screen.getByText("Pot")).toBeInTheDocument()
    expect(screen.getByText("$1,200")).toBeInTheDocument()
  })

  it("tells you when you won the hand, and how much", async () => {
    await showView({ ...view, players: [alex, maya], winners: [alex.id], winnings: { [alex.id]: 120 } })
    expect(screen.getByRole("status")).toHaveTextContent("You won 120 chips")
  })

  it("names the player who won the hand", async () => {
    await showView({ ...view, players: [alex, maya], winners: ["u2"], winnings: { u2: 1200 } })
    expect(screen.getByRole("status")).toHaveTextContent("Maya won 1,200 chips")
  })

  it("shows each share of a split pot", async () => {
    await showView({ ...view, players: [alex, maya], winners: [alex.id, "u2"], winnings: { [alex.id]: 15, u2: 15 } })
    expect(screen.getByRole("status")).toHaveTextContent("You won 15 chips · Maya won 15 chips")
  })

  it("shows the pot, not a winner, while the hand is being played", async () => {
    await showView({ ...view, pot: 40, players: [alex, maya] })
    expect(screen.queryByRole("status")).not.toBeInTheDocument()
    expect(screen.getByText("$40")).toBeInTheDocument()
    expect(document.querySelector("[data-pot-slide]")).not.toBeInTheDocument()
  })

  it("slides the pot to the winner's seat instead of writing who won", async () => {
    await showView({ ...view, players: [alex, maya], winners: ["u2"], winnings: { u2: 1200 } })
    const slide = document.querySelector("[data-pot-slide]") as HTMLElement
    expect(slide).toHaveTextContent("$1,200")
    expect(slide.style.getPropertyValue("--to-left")).toBe(seatOf("Maya").style.left)
    expect(slide.style.getPropertyValue("--to-top")).toBe(seatOf("Maya").style.top)
    // the words are still there for screen readers, just not on screen
    expect(screen.getByRole("status")).toHaveClass("sr-only")
  })

  it("slides each share of a split pot to its own winner", async () => {
    await showView({ ...view, players: [alex, maya], winners: [alex.id, "u2"], winnings: { [alex.id]: 15, u2: 15 } })
    const slides = [...document.querySelectorAll<HTMLElement>("[data-pot-slide]")]
    expect(slides.map((s) => s.style.getPropertyValue("--to-left"))).toEqual([seatOf("Me").style.left, seatOf("Maya").style.left])
  })

  it("shows an open seat for every empty seat at the table", async () => {
    render(<GameTable id="t1" />)
    await screen.findByText("Maya")
    expect(screen.getAllByRole("img", { name: "Open seat" })).toHaveLength(4) // 6 max players, 2 seated
  })

  it("keeps players in their own seat when others join", async () => {
    render(<GameTable id="t1" />)
    await screen.findByText("Maya")
    const before = seatOf("Maya").style.left
    const push = jest.mocked(watchTable).mock.calls[0][2]
    act(() => push({ ...table, seats: [...table.seats, { userId: "u3", username: "Sam", seatNumber: 4, stack: 100 }] }))
    expect(seatOf("Maya").style.left).toBe(before)
    expect(screen.getAllByRole("img", { name: "Open seat" })).toHaveLength(3)
  })

  it("fans out an opponent's face-down cards", async () => {
    await showView({ ...view, players: [alex, maya] })
    expect(screen.getByRole("img", { name: "Maya has 5 cards" })).toBeInTheDocument()
  })

  it("doesn't fan out your own cards, since your hand is shown below", async () => {
    await showView({ ...view, players: [alex, maya] })
    expect(screen.queryByRole("img", { name: /^Me has/ })).not.toBeInTheDocument()
  })

  it("fades a folded player and hides their cards", async () => {
    await showView({ ...view, players: [{ ...alex, lastAction: "check" }, { ...maya, status: "folded" }] })
    expect(screen.queryByRole("img", { name: /Maya has/ })).not.toBeInTheDocument()
    expect(screen.getByText("Folded")).toBeInTheDocument()
    expect(within(seatOf("Me")).getByText("Check")).toBeInTheDocument()
    expect(seatOf("Maya")).toHaveClass("opacity-50")
  })

  it("makes the player whose turn it is glow", async () => {
    await showView({ ...view, toActSeat: 1, players: [alex, maya] })
    expect(seatOf("Maya").querySelector(".seat-portrait")).toHaveClass("animate-turn-glow")
    expect(seatOf("Me").querySelector(".seat-portrait")).not.toHaveClass("animate-turn-glow")
  })

  it("marks the dealer", async () => {
    await showView({ ...view, dealerSeat: 1, players: [alex, maya] })
    expect(within(seatOf("Maya")).getByLabelText("Dealer")).toBeInTheDocument()
    expect(within(seatOf("Me")).queryByLabelText("Dealer")).not.toBeInTheDocument()
  })

  it("says how many cards you're discarding", async () => {
    const hand = [{ rank: 14, suit: "spades" }, { rank: 13, suit: "hearts" }, { rank: 2, suit: "clubs" }]
    await showView({ ...view, phase: "draw", you: { seat: 0, hand, legalActions: [] } })
    expect(screen.getByText("Keeping all 3 cards")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "K♥" }))
    expect(screen.getByText("Discarding 1 card")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "2♣" }))
    expect(screen.getByText("Discarding 2 cards")).toBeInTheDocument()
  })

  it("draws the selected cards", async () => {
    const hand = [{ rank: 14, suit: "spades" }, { rank: 13, suit: "hearts" }]
    await showView({ ...view, phase: "draw", you: { seat: 0, hand, legalActions: [] } })
    fireEvent.click(screen.getAllByRole("button", { pressed: false })[1]!)
    fireEvent.click(screen.getByRole("button", { name: "Draw" }))
    expect(draw).toHaveBeenCalledWith("g1", getCurrentUserId(), [1])
  })

  it("seats bots in the open seats with a blue ring", async () => {
    await showView({ ...view, players: [...view.players, { seat: 2, id: "bot-0", name: "Taks", stack: 90 }] })
    expect(screen.getByText("Taks")).toBeInTheDocument()
    expect(screen.getByText("BOT").closest(".seat-portrait")).toHaveStyle({ borderColor: "#72bbea" })
  })

  it("greys out a player who joined mid-hand and hides their controls", async () => {
    await showView({ ...view, you: { seat: -1, hand: [], legalActions: [] }, players: [maya] })
    expect(within(seatOf("Me")).getByText("Spectating")).toBeInTheDocument()
    expect(seatOf("Me")).toHaveClass("opacity-50")
    expect(screen.queryByRole("button", { name: "Fold" })).not.toBeInTheDocument()
  })
})

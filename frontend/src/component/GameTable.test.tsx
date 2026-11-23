import { act, fireEvent, render, screen, within } from "@testing-library/react"
import GameTable from "@/component/GameTable"
import { makeItem } from "@/component/cosmetic/makeItem"
import { clearCurrentTableId } from "@/service/CurrentTableService"
import { act as playAction, draw } from "@/service/GameService"
import { watchTable } from "@/service/SocketService"
import { watchEmotes } from "@/service/EmoteService"
import { playEffect } from "@/service/SoundService"
import { useMyLoadout } from "@/hook/useMyLoadout"
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
jest.mock("@/service/EmoteService", () => ({ watchEmotes: jest.fn() }))
jest.mock("@/service/SoundService", () => ({ playEffect: jest.fn() }))
jest.mock("@/hook/useMyLoadout", () => ({ useMyLoadout: jest.fn(() => ({})) }))

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
  hostId: "u2",
  chatEnabled: false,
  turnTimerEnabled: false,
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

const sendEmote = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchTable).mockResolvedValue(table)
  jest.mocked(watchEmotes).mockReturnValue({ send: sendEmote, stop: jest.fn() })
  jest.mocked(useMyLoadout).mockReturnValue({})
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

  it("fans your own cards face down at your seat too, so you can see your card back", async () => {
    await showView({ ...view, players: [alex, maya] })
    expect(screen.getByRole("img", { name: "You have 5 cards" })).toBeInTheDocument()
  })

  it("draws each player's fan in their own equipped card back", async () => {
    const rays = makeItem({ id: "c1", name: "Diamond Flare", type: "card_back", style: { pattern: "rays" } })
    jest.mocked(fetchTable).mockResolvedValue({ ...table, seats: [table.seats[0]!, { ...table.seats[1]!, cosmetics: { card_back: rays } }] })
    await showView({ ...view, players: [alex, maya] })
    const mayaFan = screen.getByRole("img", { name: "Maya has 5 cards" })
    expect(mayaFan.querySelector("[data-pattern='rays']")).not.toBeNull()
    // you have no card back equipped, so you get the house deck
    expect(screen.getByRole("img", { name: "You have 5 cards" }).querySelector("[data-pattern]")).toBeNull()
  })

  it("shows a player's name tag title under their name", async () => {
    const spender = makeItem({ id: "t1", name: "Big Spender", type: "name_tag", rarity: "legendary", style: { text: "Big Spender", animation: "shimmer" } })
    jest.mocked(fetchTable).mockResolvedValue({ ...table, seats: [table.seats[0]!, { ...table.seats[1]!, cosmetics: { name_tag: spender } }] })
    render(<GameTable id="t1" />)
    await screen.findByText("Maya")
    const title = within(seatOf("Maya")).getByText("Big Spender")
    expect(title).toHaveClass("name-tag-title", "rarity-legendary", "animate-shimmer")
    // players without a tag just show their name
    expect(seatOf("Me").querySelector(".name-tag-title")).toBeNull()
  })

  it("shows a player's equipped avatar and border on their seat", async () => {
    const fox = makeItem({ id: "a1", name: "Sly Fox", type: "avatar", assetUrl: "/cosmetic/avatar/sly-fox.svg" })
    const ruby = makeItem({ id: "b1", name: "Ruby Glow", type: "avatar_border", style: { color: "#e0115f" } })
    jest.mocked(fetchTable).mockResolvedValue({ ...table, seats: [table.seats[0]!, { ...table.seats[1]!, cosmetics: { avatar: fox, avatar_border: ruby } }] })
    render(<GameTable id="t1" />)
    await screen.findByText("Maya")
    const portrait = seatOf("Maya").querySelector(".seat-portrait") as HTMLElement
    expect(portrait.querySelector("img")).toHaveAttribute("src", "/cosmetic/avatar/sly-fox.svg")
    expect(portrait).toHaveStyle({ borderColor: "#e0115f" })
  })

  it("fades a folded player and hides their cards", async () => {
    await showView({ ...view, players: [{ ...alex, lastAction: "check" }, { ...maya, status: "folded" }] })
    expect(screen.queryByRole("img", { name: /Maya has/ })).not.toBeInTheDocument()
    expect(screen.getByText("Folded")).toBeInTheDocument()
    expect(within(seatOf("Me")).getByText("Check")).toBeInTheDocument()
    expect(seatOf("Maya")).toHaveClass("opacity-50")
  })

  it("rings the player whose turn it is", async () => {
    await showView({ ...view, toActSeat: 1, players: [alex, maya] })
    expect(seatOf("Maya").querySelector(".seat-portrait")).toHaveClass("on-turn")
    expect(seatOf("Me").querySelector(".seat-portrait")).not.toHaveClass("on-turn")
  })

  it("keeps a glowing border's own animation on their turn, so the turn ring stays distinct from it", async () => {
    const ruby = makeItem({ id: "b1", name: "Ruby Glow", type: "avatar_border", style: { color: "#e0115f", animation: "glow" } })
    jest.mocked(fetchTable).mockResolvedValue({ ...table, seats: [table.seats[0]!, { ...table.seats[1]!, cosmetics: { avatar_border: ruby } }] })
    await showView({ ...view, toActSeat: 1, players: [alex, maya] })
    const portrait = seatOf("Maya").querySelector(".seat-portrait")
    expect(portrait).toHaveClass("on-turn")
    expect(portrait).toHaveClass("animate-glow")
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

  describe("emotes", () => {
    const laugh = makeItem({ id: "e1", name: "Big Laugh", type: "emote", style: { text: "😂" } })

    afterEach(() => jest.useRealTimers())

    it("pops a played emote up over that player's seat, then lets it go", async () => {
      render(<GameTable id="t1" />)
      await screen.findByText("Maya")
      jest.useFakeTimers()
      const onPlayed = jest.mocked(watchEmotes).mock.calls[0]![1]
      act(() => onPlayed({ tableId: "t1", userId: "u2", emote: laugh }))
      expect(within(seatOf("Maya")).getByRole("img", { name: "Maya played Big Laugh" })).toHaveTextContent("😂")

      act(() => jest.advanceTimersByTime(3000))
      expect(screen.queryByRole("img", { name: "Maya played Big Laugh" })).not.toBeInTheDocument()
    })

    it("gives seated players their emote wheel, which sends through the table's emote connection", async () => {
      jest.mocked(useMyLoadout).mockReturnValue({ emote_2: laugh })
      sendEmote.mockResolvedValue({ ok: true })
      render(<GameTable id="t1" />)
      await screen.findByText("Maya")
      fireEvent.click(screen.getByRole("button", { name: "Emotes" }))
      await act(async () => fireEvent.click(screen.getByRole("button", { name: "Send Big Laugh" })))
      expect(sendEmote).toHaveBeenCalledWith("emote_2")
      expect(watchEmotes).toHaveBeenCalledWith("t1", expect.any(Function))
    })

    it("hides the wheel from spectators", async () => {
      jest.mocked(fetchTable).mockResolvedValue({ ...table, seats: [table.seats[1]!] })
      render(<GameTable id="t1" />)
      await screen.findByText("Maya")
      expect(screen.queryByRole("button", { name: "Emotes" })).not.toBeInTheDocument()
    })
  })

  describe("sounds", () => {
    it("stays quiet on the first view, then plays the sounds for what changed", async () => {
      await showView({ ...view, handNumber: 1, players: [alex, maya] })
      expect(playEffect).not.toHaveBeenCalled()

      const push = jest.mocked(watchTable).mock.calls[0]![3]
      act(() => push({ ...view, handNumber: 2, players: [alex, maya] } as never))
      expect(playEffect).toHaveBeenCalledWith("deal")
    })

    it("pops when someone plays an emote", async () => {
      render(<GameTable id="t1" />)
      await screen.findByText("Maya")
      const onPlayed = jest.mocked(watchEmotes).mock.calls[0]![1]
      act(() => onPlayed({ tableId: "t1", userId: "u2", emote: makeItem({ name: "Big Laugh", type: "emote", style: { text: "😂" } }) }))
      expect(playEffect).toHaveBeenCalledWith("emote")
    })
  })
})

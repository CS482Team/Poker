import { fireEvent, render, screen, within } from "@testing-library/react"
import Leaderboard from "@/component/Leaderboard"
import { fetchLeaderboard } from "@/service/LeaderboardService"
import type { Leaderboard as Board, LeaderboardEntry } from "@shared/Leaderboard"

jest.mock("@/service/LeaderboardService", () => ({ fetchLeaderboard: jest.fn() }))

function entry(over: Partial<LeaderboardEntry>): LeaderboardEntry {
  return { rank: 1, movement: 0, userId: "u1", username: "Maya", avatarUrl: null, balance: 2250, netWinnings: 1250, handsPlayed: 8, handsWon: 4, winRate: 0.5, ...over }
}

const maya = entry({ movement: 2 })
const theo = entry({ rank: 2, movement: -1, userId: "u2", username: "Theo", netWinnings: -300, handsPlayed: 6, handsWon: 1, winRate: 1 / 6 })
const ana = entry({ rank: 3, movement: null, userId: "u3", username: "Ana", netWinnings: 0, avatarUrl: "https://img.test/ana.png" })
const leo = entry({ rank: 4, movement: 0, userId: "u4", username: "Leo", netWinnings: -400 })

function board(over: Partial<Board> = {}): Board {
  return {
    timeframe: "week",
    label: "This week",
    periodStart: "2026-11-23T00:00:00.000Z",
    periodEnd: "2026-11-30T00:00:00.000Z",
    comparedTo: "last week",
    minHands: 5,
    updatedAt: "2026-11-25T15:30:00.000Z",
    totalRanked: 4,
    top: [maya, theo, ana, leo],
    me: null,
    ...over,
  }
}

const rows = () => within(screen.getAllByRole("rowgroup")[1]!).getAllByRole("row")

beforeEach(() => jest.mocked(fetchLeaderboard).mockReset())

describe("Leaderboard", () => {
  it("shows loading placeholders until the standings arrive", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    expect(screen.getByText("Loading leaderboard…")).toBeInTheDocument()
    await screen.findByText("Maya")
    expect(screen.queryByText("Loading leaderboard…")).not.toBeInTheDocument()
  })

  it("lists players with rank, movement, net winnings, balance and stats", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    await screen.findByText("Maya")
    const [first, second, third, fourth] = rows()
    expect(first).toHaveTextContent("#1+2Up 2 places since last weekMMaya+1,250$2,2508450%")
    expect(second).toHaveTextContent("#2-1Down 1 place since last week")
    expect(second).toHaveTextContent("−300")
    expect(second).toHaveTextContent("17%")
    expect(third).toHaveTextContent("NewNewly ranked since last week")
    expect(within(third!).getByRole("cell", { name: "0" })).toBeInTheDocument()
    expect(fourth).toHaveTextContent("–No change since last week")
  })

  it("shows a picture, or initials when there isn't one", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    const { container } = render(<Leaderboard />)
    await screen.findByText("Maya")
    expect(container.querySelector("img")).toHaveAttribute("src", "https://img.test/ana.png")
    expect(within(rows()[0]!).getByText("M")).toBeInTheDocument()
  })

  it("shows the period's dates and when it was last updated", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    expect(await screen.findByText("Nov 23 – Nov 29, 2026 (UTC)")).toBeInTheDocument()
    expect(screen.getByText(/Last updated/)).toBeInTheDocument()
  })

  it("covers every hand for all-time", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board({ timeframe: "all", label: "All-time", periodStart: null, periodEnd: "2026-11-25T15:30:00.000Z" }))
    render(<Leaderboard />)
    expect(await screen.findByText("Every hand through Nov 25, 2026 (UTC)")).toBeInTheDocument()
  })

  it("loads weekly first, and switches timeframe", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    await screen.findByText("Maya")
    expect(fetchLeaderboard).toHaveBeenLastCalledWith("week")
    expect(screen.getByRole("button", { name: "Weekly" })).toHaveAttribute("aria-pressed", "true")

    jest.mocked(fetchLeaderboard).mockResolvedValue(board({ timeframe: "season", label: "Season 4, 2026" }))
    fireEvent.click(screen.getByRole("button", { name: "Season" }))
    expect(screen.getByRole("button", { name: "Season" })).toHaveAttribute("aria-pressed", "true")
    expect(await screen.findByText("Season 4, 2026")).toBeInTheDocument()
    expect(fetchLeaderboard).toHaveBeenLastCalledWith("season")
  })

  it("ignores a slow answer for a timeframe the player already left", async () => {
    let answerWeek: (b: Board) => void = () => {}
    jest.mocked(fetchLeaderboard)
      .mockReturnValueOnce(new Promise((resolve) => (answerWeek = resolve)))
      .mockResolvedValueOnce(board({ timeframe: "month", label: "November 2026" }))
    render(<Leaderboard />)
    fireEvent.click(screen.getByRole("button", { name: "Monthly" }))
    await screen.findByText("November 2026")
    answerWeek(board())
    await Promise.resolve()
    expect(screen.queryByText("This week")).not.toBeInTheDocument()
  })

  it("refreshes the standings", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    await screen.findByText("Maya")
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }))
    await screen.findByText("Maya")
    expect(fetchLeaderboard).toHaveBeenCalledTimes(2)
  })

  it("explains scoring, qualifying and tiebreakers", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    await screen.findByText("Maya")
    expect(screen.getByText("How ranking works")).toBeInTheDocument()
    expect(screen.getByText(/play at least 5 hands in the period/)).toBeInTheDocument()
    expect(screen.getByText(/more hands won ranks higher, then fewer hands played/)).toBeInTheDocument()
    expect(screen.getByText(/places gained or lost since last week/)).toBeInTheDocument()
    expect(screen.getByText(/the ranking uses net winnings for the period/)).toBeInTheDocument()
  })

  it("says when no one has qualified yet", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board({ top: [], totalRanked: 0 }))
    render(<Leaderboard />)
    expect(await screen.findByText("No one has qualified this week yet. Play 5 hands to get on the board.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("tells visitors without a standing how players get ranked", async () => {
    jest.mocked(fetchLeaderboard).mockResolvedValue(board())
    render(<Leaderboard />)
    expect(await screen.findByText("Signed-up players are ranked once they've played 5 hands this week.")).toBeInTheDocument()
  })

  describe("the signed-in player", () => {
    it("highlights their row and shows the chips to the next rank", async () => {
      jest.mocked(fetchLeaderboard).mockResolvedValue(board({ me: { entry: theo, balance: 700, handsPlayed: 6, handsToQualify: 0, nextRank: { rank: 1, chipsNeeded: 1551 }, topTier: null } }))
      render(<Leaderboard />)
      expect(await screen.findByLabelText("Your standing")).toHaveTextContent("You're #2 of 4 · Balance $700 · 1,551 chips to pass #1")
      expect(rows()[1]).toHaveAttribute("aria-current", "true")
      expect(within(rows()[1]!).getByText("(you)")).toBeInTheDocument()
      expect(screen.queryByLabelText("Your rank")).not.toBeInTheDocument()
    })

    it("says when they're top of the board", async () => {
      jest.mocked(fetchLeaderboard).mockResolvedValue(board({ me: { entry: maya, balance: 2250, handsPlayed: 8, handsToQualify: 0, nextRank: null, topTier: null } }))
      render(<Leaderboard />)
      expect(await screen.findByLabelText("Your standing")).toHaveTextContent("You're #1 of 4 · Balance $2,250 · top of the board")
    })

    it("pins their row under the board when they're outside it", async () => {
      const me = entry({ rank: 14, userId: "u9", username: "Zoe", netWinnings: -900 })
      jest.mocked(fetchLeaderboard).mockResolvedValue(board({ totalRanked: 20, me: { entry: me, balance: 100, handsPlayed: 8, handsToQualify: 0, nextRank: { rank: 13, chipsNeeded: 40 }, topTier: { rank: 10, chipsNeeded: 650 } } }))
      render(<Leaderboard />)
      expect(await screen.findByLabelText("Your standing")).toHaveTextContent("You're #14 of 20 · Balance $100 · 40 chips to pass #13 · 650 to reach the top 10")
      expect(screen.getByLabelText("Your rank")).toHaveTextContent("#14")
      expect(screen.getByLabelText("Your rank")).toHaveTextContent("Zoe(you)")
    })

    it("says how many hands they still need to qualify", async () => {
      jest.mocked(fetchLeaderboard).mockResolvedValue(board({ me: { entry: null, balance: 950, handsPlayed: 4, handsToQualify: 1, nextRank: null, topTier: null } }))
      render(<Leaderboard />)
      expect(await screen.findByLabelText("Your standing")).toHaveTextContent("Play 1 more hand this week to get ranked · 4 played so far · Balance $950")
    })

    it("uses the plural when several hands are needed", async () => {
      jest.mocked(fetchLeaderboard).mockResolvedValue(board({ top: [], totalRanked: 0, me: { entry: null, balance: 1000, handsPlayed: 0, handsToQualify: 5, nextRank: null, topTier: null } }))
      render(<Leaderboard />)
      expect(await screen.findByLabelText("Your standing")).toHaveTextContent("Play 5 more hands this week to get ranked")
    })
  })

  it("shows an error and tries again", async () => {
    jest.mocked(fetchLeaderboard).mockRejectedValueOnce(new Error("Failed to load leaderboard (500)")).mockResolvedValueOnce(board())
    render(<Leaderboard />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load leaderboard (500)")
    fireEvent.click(screen.getByRole("button", { name: "Try again" }))
    expect(await screen.findByText("Maya")).toBeInTheDocument()
  })
})

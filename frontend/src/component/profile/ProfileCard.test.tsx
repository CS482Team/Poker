import { fireEvent, render, screen } from "@testing-library/react"
import ProfileCard from "@/component/profile/ProfileCard"
import { fetchMyProfile } from "@/service/ProfileService"

jest.mock("@/service/ProfileService", () => ({ fetchMyProfile: jest.fn(), changeUsername: jest.fn(), changeAvatar: jest.fn(), changeEmail: jest.fn() }))

const maya = { id: "u1", username: "Maya", avatarUrl: "data:image/png;base64,AAAA", email: "maya@test.local", isGuest: false, badges: [] }

describe("ProfileCard", () => {
  it("shows your picture, name and email", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue(maya)
    render(<ProfileCard />)
    expect(await screen.findByRole("heading", { name: "Maya" })).toBeInTheDocument()
    expect(screen.getByText("maya@test.local")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Your profile" }).querySelector("img")).toHaveAttribute("src", maya.avatarUrl)
  })

  it("says when you're a guest instead of showing an email", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue({ ...maya, email: null, isGuest: true })
    render(<ProfileCard />)
    expect(await screen.findByText("Guest account")).toBeInTheDocument()
  })

  it("shows the badges you've earned", async () => {
    const badges = [
      { timeframe: "week" as const, place: 1 as const, periodStart: "2026-11-16T00:00:00.000Z", title: "Weekly Champion", period: "Week of Nov 16, 2026" },
      { timeframe: "season" as const, place: 3 as const, periodStart: "2026-07-01T00:00:00.000Z", title: "Season Third Place", period: "Season 3, 2026" },
      { timeframe: "all" as const, place: 2 as const, periodStart: null, title: "All-time Runner-up", period: "Right now" },
    ]
    jest.mocked(fetchMyProfile).mockResolvedValue({ ...maya, badges })
    render(<ProfileCard />)
    const list = await screen.findByRole("list", { name: "Badges" })
    expect(list.children).toHaveLength(3)
    expect(screen.getByText("Weekly Champion")).toBeInTheDocument()
    expect(screen.getByText("Season 3, 2026")).toBeInTheDocument()
    expect(screen.getByRole("img", { name: "Season Third Place, Season 3, 2026" })).toBeInTheDocument()
    // the live all-time badge says it only lasts while they stay in the top 3
    expect(screen.getByText(/Right now · while you hold the spot/)).toBeInTheDocument()
  })

  it("explains how to earn a badge when you have none", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue(maya)
    render(<ProfileCard />)
    const link = await screen.findByRole("link", { name: "leaderboard" })
    expect(link).toHaveAttribute("href", "/leaderboard")
    expect(link.parentElement).toHaveTextContent("Finish in the top 3 on the leaderboard for a week, month or season to earn a badge.")
  })

  it("doesn't show badges to guests, who can't be ranked", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue({ ...maya, email: null, isGuest: true })
    render(<ProfileCard />)
    await screen.findByText("Guest account")
    expect(screen.queryByRole("heading", { name: "Badges" })).not.toBeInTheDocument()
  })

  it("opens the edit form", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue(maya)
    render(<ProfileCard />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit profile" }))
    expect(screen.getByRole("dialog", { name: "Edit profile" })).toBeInTheDocument()
  })

  it("explains when the profile can't load", async () => {
    jest.mocked(fetchMyProfile).mockRejectedValue(new Error("Could not load your profile (500)"))
    render(<ProfileCard />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your profile (500)")
  })
})
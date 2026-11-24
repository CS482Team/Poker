import { fireEvent, render, screen } from "@testing-library/react"
import ProfileMenu from "@/component/layout/ProfileMenu"
import { isAdmin } from "@/service/AdminService"
import { announceLoadout, fetchLoadout } from "@/service/ShopService"
import { makeItem } from "@/component/cosmetic/makeItem"
import { act, waitFor } from "@testing-library/react"
import { supabase } from "@/app/supabaseClient"
import { fetchFriends } from "@/service/FriendService"
import { isGuest } from "@/service/UserService"
import { fetchMyProfile } from "@/service/ProfileService"

const mockPush = jest.fn()

jest.mock("@/service/AdminService", () => ({ isAdmin: jest.fn() }))
jest.mock("@/service/ProfileService", () => ({ fetchMyProfile: jest.fn().mockRejectedValue(new Error("Sign in")) }))
jest.mock("@/service/FriendService", () => ({ fetchFriends: jest.fn() }))
jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ push: mockPush }) }))
jest.mock("@/service/UserService", () => ({ getCurrentUserId: () => "u1", isGuest: jest.fn(() => false) }))
jest.mock("@/service/ShopService", () => {
  const actual = jest.requireActual("@/service/ShopService")
  return { ...actual, fetchLoadout: jest.fn() }
})
jest.mock("@/app/supabaseClient", () => ({ supabase: { auth: { getSession: jest.fn(), signOut: jest.fn() } } }))

beforeEach(() => {
  jest.mocked(fetchLoadout).mockRejectedValue(new Error("Sign in to see your items"))
  // most tests don't care about friends: leave the lookup pending so it never updates the menu mid-test
  jest.mocked(fetchFriends).mockClear().mockReturnValue(new Promise(() => {}))
})

describe("ProfileMenu", () => {
  it("links admins to the admin page", async () => {
    jest.mocked(isAdmin).mockResolvedValue(true)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin")
  })

  it("links everyone else to just their profile", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "Profile" })).toHaveAttribute("href", "/profile")
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument()
  })

  it("treats a failed check as a normal player", async () => {
    jest.mocked(isAdmin).mockRejectedValue(new Error("down"))
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "Profile" })).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument()
  })

  it("closes when you click somewhere else", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "Profile" })).toBeInTheDocument()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument()
  })
})

describe("ProfileMenu log out", () => {
  it("signs you out and goes to the login page", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    fireEvent.click(screen.getByRole("button", { name: "Log out" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"))
    expect(supabase.auth.signOut).toHaveBeenCalled()
  })
})

describe("ProfileMenu shop links", () => {
  it("links to your cosmetics", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "My Items" })).toHaveAttribute("href", "/shop/my-items")
  })
})

describe("ProfileMenu avatar", () => {
  const fox = makeItem({ id: "a1", name: "Sly Fox", type: "avatar", assetUrl: "/cosmetic/avatar/sly-fox.svg" })
  const panda = makeItem({ id: "a2", name: "Panda", type: "avatar", assetUrl: "/cosmetic/avatar/panda.svg" })

  beforeEach(() => jest.mocked(isAdmin).mockResolvedValue(false))

  it("shows the plain person icon when no avatar is equipped (or you're signed out)", async () => {
    render(<ProfileMenu />)
    const button = screen.getByRole("button", { name: "Profile menu" })
    await act(async () => {})
    expect(button.querySelector("svg")).not.toBeNull()
    expect(button.querySelector("img")).toBeNull()
  })

  it("shows your equipped avatar", async () => {
    jest.mocked(fetchLoadout).mockResolvedValue({ avatar: fox })
    render(<ProfileMenu />)
    const button = screen.getByRole("button", { name: "Profile menu" })
    await waitFor(() => expect(button.querySelector("img")).toHaveAttribute("src", "/cosmetic/avatar/sly-fox.svg"))
  })

  it("switches straight away when you equip a different avatar", async () => {
    jest.mocked(fetchLoadout).mockResolvedValue({ avatar: fox })
    render(<ProfileMenu />)
    const button = screen.getByRole("button", { name: "Profile menu" })
    // wait for the fetched avatar first, so it can't land after the announcement
    await waitFor(() => expect(button.querySelector("img")).toHaveAttribute("src", "/cosmetic/avatar/sly-fox.svg"))
    act(() => announceLoadout({ avatar: panda }))
    expect(screen.getByRole("button", { name: "Profile menu" }).querySelector("img")).toHaveAttribute("src", "/cosmetic/avatar/panda.svg")
  })
})

describe("ProfileMenu friends", () => {
  const request = { userId: "u2", username: "Theo", avatarUrl: null, sentAt: "2026-11-24T00:00:00Z" }

  it("links to your friends", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    jest.mocked(fetchFriends).mockResolvedValue({ friends: [], incoming: [], outgoing: [] })
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "Friends" })).toHaveAttribute("href", "/friends")
  })

  it("shows how many friend requests are waiting", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    jest.mocked(fetchFriends).mockResolvedValue({ friends: [], incoming: [request, { ...request, userId: "u3" }], outgoing: [] })
    render(<ProfileMenu />)
    const button = await screen.findByRole("button", { name: "Profile menu, 2 friend requests" })
    fireEvent.click(button)
    expect(screen.getByRole("link", { name: /Friends/ })).toContainElement(screen.getByLabelText("2 friend requests"))
  })

  it("doesn't look up friends for guests", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    jest.mocked(isGuest).mockReturnValueOnce(true)
    render(<ProfileMenu />)
    await waitFor(() => expect(isAdmin).toHaveBeenCalled())
    expect(fetchFriends).not.toHaveBeenCalled()
  })
})

describe("ProfileMenu badge", () => {
  const badge = (timeframe: "week" | "month" | "season" | "all", place: 1 | 2 | 3, title: string) => ({ timeframe, place, periodStart: timeframe === "all" ? null : "2026-11-16T00:00:00.000Z", title, period: "p" })

  it("shows your best badge on your avatar", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    jest.mocked(fetchMyProfile).mockResolvedValueOnce({
      id: "u1", username: "Maya", avatarUrl: null, email: null, isGuest: false,
      badges: [badge("week", 3, "Weekly Third Place"), badge("all", 1, "All-time Champion"), badge("month", 1, "Monthly Champion")],
    })
    render(<ProfileMenu />)
    const button = screen.getByRole("button", { name: "Profile menu" })
    await waitFor(() => expect(button.querySelector(".avatar-badge")).not.toBeNull())
    expect(button.querySelector(".avatar-badge")).toHaveAccessibleName("All-time Champion, p")
  })

  it("shows none when you have no badges", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<ProfileMenu />)
    await waitFor(() => expect(isAdmin).toHaveBeenCalled())
    expect(screen.getByRole("button", { name: "Profile menu" }).querySelector(".avatar-badge")).toBeNull()
  })
})

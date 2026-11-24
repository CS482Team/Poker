import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import FriendsPage, { ago } from "@/component/friends/FriendsPage"
import { getCurrentTableId, setCurrentTableId } from "@/service/CurrentTableService"
import { acceptFriendRequest, fetchFriends, fetchRecentPlayers, removeFriend, sendFriendRequest } from "@/service/FriendService"
import { joinTable } from "@/service/TableService"
import { isGuest } from "@/service/UserService"
import type { FriendsList } from "@shared/Friends"

const mockPush = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }))
jest.mock("@/service/FriendService", () => ({
  fetchFriends: jest.fn(),
  fetchRecentPlayers: jest.fn(),
  sendFriendRequest: jest.fn(),
  acceptFriendRequest: jest.fn(),
  removeFriend: jest.fn(),
}))
jest.mock("@/service/TableService", () => ({ joinTable: jest.fn() }))
jest.mock("@/service/CurrentTableService", () => ({ getCurrentTableId: jest.fn(), setCurrentTableId: jest.fn() }))
jest.mock("@/service/UserService", () => ({ isGuest: jest.fn() }))

const NOW = new Date().toISOString()
const player = (userId: string, username: string) => ({ userId, username, avatarUrl: null })
const list: FriendsList = {
  friends: [
    { ...player("u2", "Theo"), since: NOW, table: { id: "t1", name: "Velvet Room" } },
    { ...player("u3", "Lina"), since: NOW, table: null },
  ],
  incoming: [{ ...player("u4", "Noah"), sentAt: NOW }],
  outgoing: [{ ...player("u5", "Alex"), sentAt: NOW }],
}

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(isGuest).mockReturnValue(false)
  jest.mocked(getCurrentTableId).mockReturnValue(null)
  jest.mocked(fetchFriends).mockResolvedValue(list)
  jest.mocked(fetchRecentPlayers).mockResolvedValue([{ ...player("u6", "Maya"), lastPlayedAt: NOW }])
})

const row = (name: string) => screen.getByRole("group", { name })
const openTab = (name: RegExp) => fireEvent.click(screen.getByRole("tab", { name }))

describe("FriendsPage", () => {
  it("lists friends with where they're playing, and counts requests", async () => {
    render(<FriendsPage />)
    expect(await within(await screen.findByRole("group", { name: "Theo" })).findByText("At Velvet Room")).toBeInTheDocument()
    expect(within(row("Lina")).getByText("Not at a table")).toBeInTheDocument()
    expect(within(row("Lina")).queryByRole("button", { name: "Join" })).not.toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Friends 2" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getByRole("tab", { name: "Requests 1" })).toBeInTheDocument()
  })

  it("joins a friend's table and goes there", async () => {
    render(<FriendsPage />)
    fireEvent.click(within(await screen.findByRole("group", { name: "Theo" })).getByRole("button", { name: "Join" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/table/t1"))
    expect(joinTable).toHaveBeenCalledWith("t1")
    expect(setCurrentTableId).toHaveBeenCalledWith("t1")
  })

  it("just goes back when you're already at that table", async () => {
    jest.mocked(getCurrentTableId).mockReturnValue("t1")
    render(<FriendsPage />)
    fireEvent.click(within(await screen.findByRole("group", { name: "Theo" })).getByRole("button", { name: "Return" }))
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/table/t1"))
    expect(joinTable).not.toHaveBeenCalled()
  })

  it("explains when you can't join (e.g. the table is full)", async () => {
    jest.mocked(joinTable).mockRejectedValue(new Error("Failed to join table: Table is full"))
    render(<FriendsPage />)
    fireEvent.click(within(await screen.findByRole("group", { name: "Theo" })).getByRole("button", { name: "Join" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Table is full")
    expect(mockPush).not.toHaveBeenCalled()
  })

  it("asks before removing a friend", async () => {
    render(<FriendsPage />)
    fireEvent.click(within(await screen.findByRole("group", { name: "Lina" })).getByRole("button", { name: "Remove Lina" }))
    expect(within(row("Lina")).getByText("Remove Lina?")).toBeInTheDocument()
    fireEvent.click(within(row("Lina")).getByRole("button", { name: "Cancel" }))
    expect(removeFriend).not.toHaveBeenCalled()

    fireEvent.click(within(row("Lina")).getByRole("button", { name: "Remove Lina" }))
    fireEvent.click(within(row("Lina")).getByRole("button", { name: "Remove" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Removed Lina from your friends.")
    expect(removeFriend).toHaveBeenCalledWith("u3")
    expect(fetchFriends).toHaveBeenCalledTimes(2) // reloaded
  })

  it("sends a request by username and clears the box", async () => {
    jest.mocked(sendFriendRequest).mockResolvedValue({ status: "requested", player: player("u9", "Sam") })
    render(<FriendsPage />)
    const box = await screen.findByLabelText("Add a friend")
    fireEvent.change(box, { target: { value: "  sam " } })
    fireEvent.click(screen.getByRole("button", { name: "Send request" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Friend request sent to Sam.")
    expect(sendFriendRequest).toHaveBeenCalledWith("sam")
    expect(box).toHaveValue("")
  })

  it("says when a request made you friends straight away", async () => {
    jest.mocked(sendFriendRequest).mockResolvedValue({ status: "accepted", player: player("u4", "Noah") })
    render(<FriendsPage />)
    fireEvent.change(await screen.findByLabelText("Add a friend"), { target: { value: "Noah" } })
    fireEvent.click(screen.getByRole("button", { name: "Send request" }))
    expect(await screen.findByRole("status")).toHaveTextContent("You and Noah are now friends.")
  })

  it("keeps the name and explains when a request is refused", async () => {
    jest.mocked(sendFriendRequest).mockRejectedValue(new Error("There's no player with that username."))
    render(<FriendsPage />)
    const box = await screen.findByLabelText("Add a friend")
    fireEvent.change(box, { target: { value: "Nobody" } })
    fireEvent.click(screen.getByRole("button", { name: "Send request" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("There's no player with that username.")
    expect(box).toHaveValue("Nobody")
  })

  it("won't send a name that's too short", async () => {
    render(<FriendsPage />)
    fireEvent.change(await screen.findByLabelText("Add a friend"), { target: { value: "ab" } })
    expect(screen.getByRole("button", { name: "Send request" })).toBeDisabled()
  })

  it("accepts, declines and cancels requests", async () => {
    render(<FriendsPage />)
    await screen.findByRole("group", { name: "Theo" })
    openTab(/Requests/)
    expect(within(row("Noah")).getByText(/Wants to be friends/)).toBeInTheDocument()
    expect(within(row("Alex")).getByText(/Request sent/)).toBeInTheDocument()

    fireEvent.click(within(row("Noah")).getByRole("button", { name: "Accept" }))
    expect(await screen.findByRole("status")).toHaveTextContent("You and Noah are now friends.")
    expect(acceptFriendRequest).toHaveBeenCalledWith("u4")

    fireEvent.click(within(row("Noah")).getByRole("button", { name: "Decline" }))
    await waitFor(() => expect(removeFriend).toHaveBeenCalledWith("u4"))
    fireEvent.click(within(row("Alex")).getByRole("button", { name: "Cancel request" }))
    await waitFor(() => expect(removeFriend).toHaveBeenCalledWith("u5"))
  })

  it("adds players from recent games", async () => {
    jest.mocked(sendFriendRequest).mockResolvedValue({ status: "requested", player: player("u6", "Maya") })
    render(<FriendsPage />)
    await screen.findByRole("group", { name: "Theo" })
    openTab(/Recent players/)
    expect(within(row("Maya")).getByText("Played just now")).toBeInTheDocument()
    fireEvent.click(within(row("Maya")).getByRole("button", { name: "Add" }))
    expect(await screen.findByRole("status")).toHaveTextContent("Friend request sent to Maya.")
    expect(sendFriendRequest).toHaveBeenCalledWith("Maya")
  })

  it("explains each empty tab", async () => {
    jest.mocked(fetchFriends).mockResolvedValue({ friends: [], incoming: [], outgoing: [] })
    jest.mocked(fetchRecentPlayers).mockResolvedValue([])
    render(<FriendsPage />)
    expect(await screen.findByText(/No friends yet/)).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Requests" })).toBeInTheDocument() // no count when there are none
    openTab(/Requests/)
    expect(screen.getByText("No friend requests right now.")).toBeInTheDocument()
    openTab(/Recent players/)
    expect(screen.getByText(/Players from your recent games/)).toBeInTheDocument()
  })

  it("explains when the list can't load", async () => {
    jest.mocked(fetchFriends).mockRejectedValue(new Error("Could not load your friends (500)"))
    render(<FriendsPage />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your friends (500)")
  })

  it("asks guests to sign up instead", async () => {
    jest.mocked(isGuest).mockReturnValue(true)
    await act(async () => render(<FriendsPage />))
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute("href", "/signup")
    expect(fetchFriends).not.toHaveBeenCalled()
  })
})

describe("ago", () => {
  const now = new Date("2026-11-24T12:00:00Z")
  it("says how long ago, roughly", () => {
    expect(ago("2026-11-24T11:59:30Z", now)).toBe("just now")
    expect(ago("2026-11-24T11:55:00Z", now)).toBe("5 min ago")
    expect(ago("2026-11-24T09:00:00Z", now)).toBe("3 h ago")
    expect(ago("2026-11-23T09:00:00Z", now)).toBe("yesterday")
    expect(ago("2026-11-20T12:00:00Z", now)).toBe("4 days ago")
  })
})

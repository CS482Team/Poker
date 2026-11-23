import { fireEvent, render, screen } from "@testing-library/react"
import ProfileMenu from "@/component/ProfileMenu"
import { isAdmin } from "@/service/AdminService"
import { announceLoadout, fetchLoadout } from "@/service/ShopService"
import { makeItem } from "@/component/cosmetic/makeItem"
import { act, waitFor } from "@testing-library/react"
import { supabase } from "@/app/supabaseClient"

const mockPush = jest.fn()

jest.mock("@/service/AdminService", () => ({ isAdmin: jest.fn() }))
jest.mock("next/navigation", () => ({ usePathname: () => "/dashboard", useRouter: () => ({ push: mockPush }) }))
jest.mock("@/service/UserService", () => ({ getCurrentUserId: () => "u1" }))
jest.mock("@/service/ShopService", () => {
  const actual = jest.requireActual("@/service/ShopService")
  return { ...actual, fetchLoadout: jest.fn() }
})
jest.mock("@/app/supabaseClient", () => ({ supabase: { auth: { getSession: jest.fn(), signOut: jest.fn() } } }))

beforeEach(() => jest.mocked(fetchLoadout).mockRejectedValue(new Error("Sign in to see your items")))

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

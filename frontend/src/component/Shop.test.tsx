import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import Shop from "@/component/Shop"
import { makeItem } from "@/component/cosmetic/makeItem"
import { announceBalance, fetchBalance } from "@/service/BalanceService"
import { buyItem, fetchShopItems } from "@/service/ShopService"
import { fetchUsername, getCurrentUserId } from "@/service/UserService"

jest.mock("@/service/ShopService", () => ({ fetchShopItems: jest.fn(), buyItem: jest.fn() }))
jest.mock("@/service/BalanceService", () => ({ fetchBalance: jest.fn(), announceBalance: jest.fn() }))
jest.mock("@/service/UserService", () => ({ getCurrentUserId: jest.fn(), fetchUsername: jest.fn() }))

const fox = makeItem({ id: "a1", name: "Sly Fox", type: "avatar", cost: 1400, owned: false })
const panda = makeItem({ id: "a2", name: "Panda", type: "avatar", cost: 200, owned: true })
const lattice = makeItem({ id: "c1", name: "Midnight Lattice", type: "card_back", cost: 300, owned: false })

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getCurrentUserId).mockReturnValue("u1")
  jest.mocked(fetchUsername).mockResolvedValue("charley")
  jest.mocked(fetchBalance).mockResolvedValue(1000)
  jest.mocked(fetchShopItems).mockResolvedValue([fox, panda, lattice])
})

describe("Shop", () => {
  it("shows your balance in the header", async () => {
    render(<Shop />)
    // the box shows "…" first, then the balance once it loads
    const box = screen.getByLabelText("Available balance")
    await waitFor(() => expect(box).toHaveTextContent("1,000"))
  })

  it("has a tab for each category that has items, avatars first", async () => {
    render(<Shop />)
    const tabs = await screen.findAllByRole("tab")
    expect(tabs.map((tab) => tab.textContent)).toEqual(["Avatars", "Card backs"])
    expect(tabs[0]).toHaveAttribute("aria-selected", "true")
  })

  it("shows the selected category's items and how many you own", async () => {
    render(<Shop />)
    const panel = await screen.findByRole("tabpanel")
    expect(within(panel).getByRole("heading", { name: "Sly Fox" })).toBeInTheDocument()
    expect(within(panel).queryByRole("heading", { name: "Midnight Lattice" })).not.toBeInTheDocument()
    expect(within(panel).getByText("1 of 2 owned")).toBeInTheDocument()
  })

  it("switches category when you pick a tab", async () => {
    render(<Shop />)
    fireEvent.click(await screen.findByRole("tab", { name: "Card backs" }))
    expect(within(screen.getByRole("tabpanel")).getByRole("heading", { name: "Midnight Lattice" })).toBeInTheDocument()
  })

  it("after buying, marks the item owned and updates the balance everywhere", async () => {
    jest.mocked(buyItem).mockResolvedValue(700)
    render(<Shop />)
    fireEvent.click(await screen.findByRole("tab", { name: "Card backs" }))
    fireEvent.click(screen.getByRole("button", { name: "Buy Midnight Lattice" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))

    expect(await screen.findByText("Owned")).toBeInTheDocument()
    expect(screen.getByLabelText("Available balance")).toHaveTextContent("700")
    expect(buyItem).toHaveBeenCalledWith("c1")
    expect(announceBalance).toHaveBeenCalledWith(700)
  })

  it("lets guests browse with a sign in prompt instead of a balance", async () => {
    jest.mocked(getCurrentUserId).mockReturnValue("")
    render(<Shop />)
    expect(await screen.findByRole("heading", { name: "Sly Fox" })).toBeInTheDocument()
    expect(fetchBalance).not.toHaveBeenCalled()
    expect(screen.getAllByRole("link", { name: "Sign in to buy" }).length).toBeGreaterThan(0)
  })

  it("explains when the shop can't load", async () => {
    jest.mocked(fetchShopItems).mockRejectedValue(new Error("Failed to load the shop (500)"))
    render(<Shop />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load the shop (500)")
  })
})

describe("Shop links", () => {
  it("links signed in players to their items", async () => {
    render(<Shop />)
    expect(await screen.findByRole("link", { name: "My items" })).toHaveAttribute("href", "/shop/my-items")
  })
})

import { fireEvent, render, screen, within } from "@testing-library/react"
import MyItemsPage from "@/component/MyItemsPage"
import { makeItem } from "@/component/cosmetic/makeItem"
import { announceLoadout, equipItem, fetchInventory, fetchLoadout, ShopRequestError, unequipSlot } from "@/service/ShopService"
import { fetchUsername, getCurrentUserId } from "@/service/UserService"

// the real ShopService (for its error class) imports the Supabase client, which needs a URL
jest.mock("@/app/supabaseClient", () => ({ supabase: { auth: { getSession: jest.fn() } } }))
jest.mock("@/service/ShopService", () => {
  const actual = jest.requireActual("@/service/ShopService")
  return { ShopRequestError: actual.ShopRequestError, fetchInventory: jest.fn(), fetchLoadout: jest.fn(), equipItem: jest.fn(), unequipSlot: jest.fn(), announceLoadout: jest.fn() }
})
jest.mock("@/service/UserService", () => ({ getCurrentUserId: jest.fn(), fetchUsername: jest.fn() }))

const lattice = makeItem({ id: "c1", name: "Midnight Lattice", type: "card_back", owned: true })
const spender = makeItem({ id: "t1", name: "Big Spender", type: "name_tag", rarity: "legendary", style: { text: "Big Spender" }, owned: true })

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getCurrentUserId).mockReturnValue("u1")
  jest.mocked(fetchUsername).mockResolvedValue("charley")
  jest.mocked(fetchInventory).mockResolvedValue([lattice, spender])
  jest.mocked(fetchLoadout).mockResolvedValue({})
})

describe("MyItemsPage", () => {
  it("shows your items once they load", async () => {
    render(<MyItemsPage />)
    expect(await screen.findByRole("article", { name: "Midnight Lattice" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "My items" })).toBeInTheDocument()
  })

  it("equips an item and shows it on your look", async () => {
    jest.mocked(equipItem).mockResolvedValue({ name_tag: spender })
    render(<MyItemsPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Equip Big Spender" }))

    const look = await screen.findByRole("region", { name: "Your look" })
    expect(await within(look).findByText("Big Spender")).toBeInTheDocument()
    expect(equipItem).toHaveBeenCalledWith("name_tag", "t1")
    // so the navbar avatar updates without a reload
    expect(announceLoadout).toHaveBeenCalledWith({ name_tag: spender })
  })

  it("takes an item off", async () => {
    jest.mocked(fetchLoadout).mockResolvedValue({ card_back: lattice })
    jest.mocked(unequipSlot).mockResolvedValue({})
    render(<MyItemsPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Unequip Midnight Lattice" }))
    expect(await screen.findByRole("button", { name: "Equip Midnight Lattice" })).toBeInTheDocument()
    expect(unequipSlot).toHaveBeenCalledWith("card_back")
  })

  it("explains when equipping fails", async () => {
    jest.mocked(equipItem).mockRejectedValue(new ShopRequestError("You don't own that item.", "not_owned"))
    render(<MyItemsPage />)
    fireEvent.click(await screen.findByRole("button", { name: "Equip Big Spender" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("You don't own that item.")
  })

  it("asks guests to sign in without calling the API", async () => {
    jest.mocked(getCurrentUserId).mockReturnValue("")
    render(<MyItemsPage />)
    expect(await screen.findByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/")
    expect(fetchInventory).not.toHaveBeenCalled()
  })

  it("explains when your items can't load", async () => {
    jest.mocked(fetchInventory).mockRejectedValue(new Error("Couldn't load your items (500)"))
    render(<MyItemsPage />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Couldn't load your items (500)")
  })

  it("links back to the shop", async () => {
    render(<MyItemsPage />)
    expect(await screen.findByRole("link", { name: "Back to the shop" })).toHaveAttribute("href", "/shop")
  })
})

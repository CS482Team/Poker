import { equipItem, getActiveItems, getInventory, getLoadout, getLoadouts, getOwnedItemIds, purchaseItem, unequipSlot } from "../dao/ShopDAO"
import { buyItem, equip, listInventory, listItems, loadoutOf, ShopError, unequip, withCosmetics } from "./ShopService"

jest.mock("../dao/ShopDAO", () => ({
  getActiveItems: jest.fn(),
  getOwnedItemIds: jest.fn(),
  purchaseItem: jest.fn(),
  getInventory: jest.fn(),
  getLoadout: jest.fn(),
  getLoadouts: jest.fn(),
  equipItem: jest.fn(),
  unequipSlot: jest.fn(),
}))

const lattice = { id: "i1", name: "Midnight Lattice", description: "", type: "card_back" as const, rarity: "common" as const, cost: 300, assetUrl: null, style: {} }
const laugh = { ...lattice, id: "i2", name: "Big Laugh", type: "emote" as const }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getActiveItems).mockResolvedValue([lattice, laugh])
})

describe("listItems", () => {
  it("returns the catalog without ownership for guests", async () => {
    expect(await listItems(null)).toEqual([lattice, laugh])
    expect(getOwnedItemIds).not.toHaveBeenCalled()
  })

  it("marks which items a signed in player owns", async () => {
    jest.mocked(getOwnedItemIds).mockResolvedValue(["i2"])
    expect(await listItems("u1")).toEqual([
      { ...lattice, owned: false },
      { ...laugh, owned: true },
    ])
  })
})

describe("buyItem", () => {
  it("returns the new balance", async () => {
    jest.mocked(purchaseItem).mockResolvedValue(700)
    expect(await buyItem("u1", "i1")).toEqual({ balance: 700 })
    expect(purchaseItem).toHaveBeenCalledWith("u1", "i1")
  })

  it.each(["item_not_found", "item_inactive", "already_owned", "insufficient_funds", "user_not_found"])("turns the database's %s into a ShopError", async (code) => {
    jest.mocked(purchaseItem).mockRejectedValue({ message: code })
    const error = await buyItem("u1", "i1").catch((e) => e)
    expect(error).toBeInstanceOf(ShopError)
    expect(error.code).toBe(code)
  })

  it("lets unexpected database errors through untouched", async () => {
    const down = new Error("db down")
    jest.mocked(purchaseItem).mockRejectedValue(down)
    await expect(buyItem("u1", "i1")).rejects.toBe(down)
  })
})

describe("inventory and loadout", () => {
  it("lists what the player owns, all marked owned", async () => {
    jest.mocked(getInventory).mockResolvedValue([lattice])
    expect(await listInventory("u1")).toEqual([{ ...lattice, owned: true }])
  })

  it("reads the player's loadout", async () => {
    jest.mocked(getLoadout).mockResolvedValue({ card_back: lattice })
    expect(await loadoutOf("u1")).toEqual({ card_back: lattice })
  })

  it("equips an item into a slot", async () => {
    await equip("u1", "i2", "emote_3")
    expect(equipItem).toHaveBeenCalledWith("u1", "i2", "emote_3")
  })

  it.each(["item_not_found", "wrong_slot", "not_owned"])("turns the database's %s into a ShopError", async (code) => {
    jest.mocked(equipItem).mockRejectedValue({ message: code })
    const error = await equip("u1", "i1", "avatar").catch((e) => e)
    expect(error).toBeInstanceOf(ShopError)
    expect(error.code).toBe(code)
  })

  it("lets unexpected equip errors through untouched", async () => {
    const down = new Error("db down")
    jest.mocked(equipItem).mockRejectedValue(down)
    await expect(equip("u1", "i1", "avatar")).rejects.toBe(down)
  })

  it("empties a slot", async () => {
    await unequip("u1", "card_back")
    expect(unequipSlot).toHaveBeenCalledWith("u1", "card_back")
  })
})

describe("withCosmetics", () => {
  const table = {
    id: "t1", name: "T", hostId: null, status: 1, variant: "five-card-draw", buyIn: 100, minimumBet: 5, ante: 1,
    maxPlayers: 4, botCount: 0, chatEnabled: true, turnTimerEnabled: false,
    seats: [
      { userId: "u1", username: "Maya", seatNumber: 0, stack: 100 },
      { userId: "u2", username: "Theo", seatNumber: 1, stack: 100 },
    ],
  }
  const fox = { ...lattice, id: "a1", name: "Sly Fox", type: "avatar" as const }
  const theme = { ...lattice, id: "th1", type: "theme" as const }

  it("adds each seated player's visible cosmetics, leaving out theme and emotes", async () => {
    jest.mocked(getLoadouts).mockResolvedValue({ u1: { avatar: fox, card_back: lattice, theme, emote_1: laugh } })
    const result = await withCosmetics(table)
    expect(getLoadouts).toHaveBeenCalledWith(["u1", "u2"])
    expect(result.seats[0]!.cosmetics).toEqual({ avatar: fox, card_back: lattice })
    expect(result.seats[1]!.cosmetics).toEqual({})
  })
})

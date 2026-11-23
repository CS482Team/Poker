import { equipItem, getActiveItems, getInventory, getLoadout, getLoadouts, getOwnedItemIds, purchaseItem, unequipSlot } from "../dao/ShopDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

const row = {
  id: "i1",
  name: "Big Spender",
  description: "Gold, shimmering, impossible to miss.",
  item_type: "name_tag",
  rarity: "legendary",
  cost: 3500,
  asset_url: null,
  style: { text: "Big Spender", color: "#f2c14e", animation: "shimmer" },
}

describe("ShopDAO", () => {
  it("lists items on sale in shop order, mapped to ShopItems", async () => {
    mockState.awaited = { data: [row] }
    expect(await getActiveItems()).toEqual([
      {
        id: "i1",
        name: "Big Spender",
        description: "Gold, shimmering, impossible to miss.",
        type: "name_tag",
        rarity: "legendary",
        cost: 3500,
        assetUrl: null,
        style: { text: "Big Spender", color: "#f2c14e", animation: "shimmer" },
      },
    ])
    expect(calls).toContainEqual(["from", ["shop_item"]])
    expect(calls).toContainEqual(["eq", ["is_active", true]])
    expect(calls).toContainEqual(["order", ["sort_order"]])
  })

  it("lists the ids of the items a player owns", async () => {
    mockState.awaited = { data: [{ item_id: "i1" }, { item_id: "i2" }] }
    expect(await getOwnedItemIds("u1")).toEqual(["i1", "i2"])
    expect(calls).toContainEqual(["from", ["user_inventory"]])
    expect(calls).toContainEqual(["eq", ["user_id", "u1"]])
  })

  it("buys through the purchase_item database function and returns the new balance", async () => {
    mockState.result = { data: 650 }
    expect(await purchaseItem("u1", "i1")).toBe(650)
    expect(calls).toContainEqual(["rpc", ["purchase_item", { p_user: "u1", p_item: "i1" }]])
  })

  it("passes the database's error up so the service can read its code", async () => {
    mockState.result = { error: { message: "insufficient_funds" } }
    await expect(purchaseItem("u1", "i1")).rejects.toEqual({ message: "insufficient_funds" })
  })

  it("lists everything a player owns as ShopItems, oldest first", async () => {
    mockState.awaited = { data: [{ shop_item: row }] }
    const items = await getInventory("u1")
    expect(items.map((item) => item.name)).toEqual(["Big Spender"])
    expect(calls).toContainEqual(["from", ["user_inventory"]])
    expect(calls).toContainEqual(["eq", ["user_id", "u1"]])
    expect(calls).toContainEqual(["order", ["acquired_at"]])
  })

  it("reads the loadout as slot -> item, following user_inventory to the item", async () => {
    mockState.awaited = { data: [{ slot: "name_tag", user_inventory: { shop_item: row } }, { slot: "emote_2", user_inventory: { shop_item: { ...row, id: "i2", item_type: "emote" } } }] }
    const loadout = await getLoadout("u1")
    expect(loadout.name_tag?.name).toBe("Big Spender")
    expect(loadout.emote_2?.id).toBe("i2")
    expect(calls).toContainEqual(["from", ["user_loadout"]])
    expect(calls).toContainEqual(["eq", ["user_id", "u1"]])
  })

  it("reads several players' loadouts in one query, grouped by player", async () => {
    mockState.awaited = {
      data: [
        { user_id: "u1", slot: "avatar", user_inventory: { shop_item: { ...row, id: "a1", item_type: "avatar" } } },
        { user_id: "u1", slot: "card_back", user_inventory: { shop_item: { ...row, id: "c1", item_type: "card_back" } } },
        { user_id: "u2", slot: "avatar", user_inventory: { shop_item: { ...row, id: "a2", item_type: "avatar" } } },
      ],
    }
    const loadouts = await getLoadouts(["u1", "u2", "u3"])
    expect(loadouts.u1?.avatar?.id).toBe("a1")
    expect(loadouts.u1?.card_back?.id).toBe("c1")
    expect(loadouts.u2?.avatar?.id).toBe("a2")
    expect(loadouts.u3).toBeUndefined()
    expect(calls).toContainEqual(["in", ["user_id", ["u1", "u2", "u3"]]])
  })

  it("skips the query when there are no players", async () => {
    expect(await getLoadouts([])).toEqual({})
    expect(calls).toEqual([])
  })

  it("equips through the equip_item database function", async () => {
    mockState.result = { data: null }
    await equipItem("u1", "i1", "emote_2")
    expect(calls).toContainEqual(["rpc", ["equip_item", { p_user: "u1", p_item: "i1", p_slot: "emote_2" }]])
  })

  it("passes equip refusals up for the service to read", async () => {
    mockState.result = { error: { message: "not_owned" } }
    await expect(equipItem("u1", "i1", "avatar")).rejects.toEqual({ message: "not_owned" })
  })

  it("empties a slot", async () => {
    mockState.awaited = { error: null }
    await unequipSlot("u1", "card_back")
    expect(calls).toContainEqual(["from", ["user_loadout"]])
    expect(calls).toContainEqual(["delete", []])
    expect(calls).toContainEqual(["eq", ["user_id", "u1"]])
    expect(calls).toContainEqual(["eq", ["slot", "card_back"]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getActiveItems()).rejects.toThrow("db down")
    await expect(getOwnedItemIds("u1")).rejects.toThrow("db down")
    await expect(getInventory("u1")).rejects.toThrow("db down")
    await expect(getLoadout("u1")).rejects.toThrow("db down")
    await expect(unequipSlot("u1", "avatar")).rejects.toThrow("db down")
    await expect(getLoadouts(["u1"])).rejects.toThrow("db down")
  })
})

/**
 * Test helper for building ShopItems without repeating every field.
 */
import type { ShopItem } from "@shared/Cosmetics"

/**
 * Returns a plain common card back, with any fields you pass replacing the defaults.
 * @example makeItem({ name: "Big Laugh", type: "emote", style: { text: "😂" } })
 */
export function makeItem(overrides: Partial<ShopItem> = {}): ShopItem {
  return {
    id: "item-1",
    name: "Test Item",
    description: "",
    type: "card_back",
    cost: 100,
    rarity: "common",
    assetUrl: null,
    style: {},
    ...overrides,
  }
}

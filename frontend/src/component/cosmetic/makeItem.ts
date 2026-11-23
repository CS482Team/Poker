/* test helper: builds a ShopItem from just the fields you care about */
import type { ShopItem } from "@shared/Cosmetics"

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

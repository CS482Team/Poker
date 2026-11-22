// Shared types for cosmetics and shop items
// These lists must match the CHECK constraints in the shop migration

export const COSMETIC_TYPES = ["card_back", "avatar", "avatar_border", "name_tag", "emote", "theme"] as const
export type CosmeticType = (typeof COSMETIC_TYPES)[number]

export const RARITIES = ["common", "rare", "epic", "legendary"] as const // lowest to highest
export type Rarity = (typeof RARITIES)[number]

// Card back designs drawn in CSS; each colour combination is its own shop item
export const CARD_BACK_PATTERNS = ["solid", "lattice", "rays", "rings"] as const
export type CardBackPattern = (typeof CARD_BACK_PATTERNS)[number]

export interface CosmeticStyle {
  // optional CSS values, read by that type's renderer
  pattern?: CardBackPattern // card backs only
  color?: string
  accent?: string
  gradient?: string
  text?: string // the name tag subtitle ("Big Spender") or an emote's emoji
  animation?: "shimmer" | "glow"
}

export interface ShopItem {
  id: string
  name: string
  description: string // one line shown on the shop card, e.g. "A polished gold ring for your portrait."
  type: CosmeticType
  cost: number
  rarity: Rarity
  assetUrl: string | null // image based items (avatars, card back art, emotes)
  style: CosmeticStyle // CSS based items (colours, gradients, tag text)
  owned?: boolean // only filled in when the request is logged in
}

// An emote wheel holds several emotes, every other slot holds one item
export const EMOTE_SLOT_COUNT = 4
export type EmoteSlot = `emote_${1 | 2 | 3 | 4}`
export type LoadoutSlot = Exclude<CosmeticType, "emote"> | EmoteSlot

export type Loadout = Partial<Record<LoadoutSlot, ShopItem>>

// What other players see at the table: no theme (personal) and no emote wheel (emotes arrive as socket events)
export type PublicCosmetics = Partial<Record<"card_back" | "avatar" | "avatar_border" | "name_tag", ShopItem>>

// Errors raised by purchase_item, the SQL and ShopService must spell these the same
export const PURCHASE_ERRORS = ["item_not_found", "item_inactive", "already_owned", "insufficient_funds", "user_not_found"] as const
export type PurchaseError = (typeof PURCHASE_ERRORS)[number]

// Errors raised by equip_item
export const EQUIP_ERRORS = ["item_not_found", "wrong_slot", "not_owned"] as const
export type EquipError = (typeof EQUIP_ERRORS)[number]

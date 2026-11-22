/**
 * Cosmetic helpers shared by the shop, My items and (later) the table.
 * Pure functions only: no React, no fetching, so they're easy to test and reuse.
 */
import type { CosmeticType, ShopItem } from "@shared/Cosmetics"

/** Display names for each category, used for shop tabs and My items headings. */
export const COSMETIC_LABELS: Record<CosmeticType, string> = {
  avatar: "Avatars",
  card_back: "Card backs",
  avatar_border: "Avatar borders",
  name_tag: "Name tags",
  emote: "Emotes",
  theme: "Themes",
}

// The house colours, used when a card back doesn't set its own
const HOUSE_COLOR = "#7a0f14"
const HOUSE_ACCENT = "#d4a24c"
const DEEP = "#0b0708" // the near-black every gradient fades into

/**
 * Builds the CSS `background` value for a card back.
 *
 * If the item has art (`assetUrl`) that image is used. Otherwise its `style.pattern`
 * is drawn in its `style.color` and `style.accent`, so one pattern can be sold in
 * many colours without any image files. Unknown or missing patterns draw as "solid".
 *
 * Colours are expected as 6-digit hex (e.g. "#16161a"): two more hex digits are
 * appended to the accent for transparency (e.g. "#c0c0c855").
 *
 * @example cardBackBackground(midnightLattice) // "repeating-linear-gradient(45deg, ..."
 */
export function cardBackBackground(item: ShopItem): string {
  if (item.assetUrl) return `url("${item.assetUrl}") center / cover`

  const c = item.style.color ?? HOUSE_COLOR
  const a = item.style.accent ?? HOUSE_ACCENT
  const base = `linear-gradient(160deg, ${c}, ${DEEP})`

  switch (item.style.pattern) {
    // two sets of thin diagonal lines crossing over the base colour
    case "lattice":
      return `repeating-linear-gradient(45deg, ${a}55 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, ${a}55 0 1px, transparent 1px 9px), ${base}`
    // alternating wedges spinning out from the center
    case "rays":
      return `repeating-conic-gradient(from 0deg at 50% 50%, ${c} 0deg 9deg, ${a}cc 9deg 18deg)`
    // circles rippling out from the center
    case "rings":
      return `repeating-radial-gradient(circle at 50% 50%, ${c} 0 7px, ${a}aa 7px 10px)`
    default:
      return base
  }
}

/**
 * The letter shown in a portrait when a player has no avatar picture.
 * @example initialOf("charley") // "C"
 */
export function initialOf(name: string): string {
  return (name[0] ?? "?").toUpperCase()
}

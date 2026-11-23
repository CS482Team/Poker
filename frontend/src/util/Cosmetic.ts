/* cosmetic helpers shared by the shop, My items and the table */
import type { CosmeticType, ShopItem } from "@shared/Cosmetics"

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

/* a card back's art, or its pattern in its colours; colours are 6-digit hex because two digits get appended for transparency */
export function cardBackBackground(item: ShopItem): string {
  if (item.assetUrl) return `url("${item.assetUrl}") center / cover`

  const c = item.style.color ?? HOUSE_COLOR
  const a = item.style.accent ?? HOUSE_ACCENT
  const base = `linear-gradient(160deg, ${c}, ${DEEP})`

  switch (item.style.pattern) {
    case "lattice":
      return `repeating-linear-gradient(45deg, ${a}55 0 1px, transparent 1px 9px), repeating-linear-gradient(-45deg, ${a}55 0 1px, transparent 1px 9px), ${base}`
    case "rays":
      return `repeating-conic-gradient(from 0deg at 50% 50%, ${c} 0deg 9deg, ${a}cc 9deg 18deg)`
    case "rings":
      return `repeating-radial-gradient(circle at 50% 50%, ${c} 0 7px, ${a}aa 7px 10px)`
    default:
      return base
  }
}

export function initialOf(name: string): string {
  return (name[0] ?? "?").toUpperCase()
}

/* the CSS variables the table reads (site.css .poker-table); unset ones fall back to the house red table */
export function themeVariables(item: ShopItem): Record<string, string> {
  const felt = item.style.color ?? "#a5222a"
  const accent = item.style.accent ?? HOUSE_ACCENT
  const rail = item.style.rail ?? "#181818"
  const mix = (color: string, other: string, percent: number) => `color-mix(in srgb, ${color}, ${other} ${percent}%)`

  return {
    "--felt-hi": mix(felt, "white", 16),
    "--felt": felt,
    "--felt-lo": mix(felt, "black", 32),
    "--felt-pattern": feltPattern(item.style.pattern, accent),
    "--trim": `${accent}99`,
    "--trim-style": "dashed",
    "--rail-hi": mix(rail, "white", 30),
    "--rail-mid": mix(rail, "white", 8),
    "--rail": rail,
    "--rail-lo": mix(rail, "black", 40),
    "--rail-edge": mix(rail, "white", 18),
    "--rail-inlay": `${accent}cc`,
  }
}

function feltPattern(pattern: ShopItem["style"]["pattern"], accent: string): string {
  switch (pattern) {
    case "lattice":
      return `repeating-linear-gradient(45deg, ${accent}1f 0 1px, transparent 1px 22px), repeating-linear-gradient(-45deg, ${accent}1f 0 1px, transparent 1px 22px)`
    case "rays":
      return `repeating-conic-gradient(from 0deg at 50% 45%, ${accent}16 0deg 5deg, transparent 5deg 10deg)`
    case "rings":
      return `repeating-radial-gradient(ellipse at 50% 45%, transparent 0 26px, ${accent}22 26px 28px)`
    default:
      return "linear-gradient(transparent, transparent)" // an empty layer, so the background list stays valid
  }
}

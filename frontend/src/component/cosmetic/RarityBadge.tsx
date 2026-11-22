/**
 * RarityBadge: the small coloured rarity label on shop and My items tiles.
 */
import type { Rarity } from "@shared/Cosmetics"

/**
 * Shows an item's rarity, e.g. LEGENDARY in gold.
 *
 * The colours live in site.css: each `.rarity-*` class sets a `--rarity` variable,
 * which the tile's top edge and name tag titles also read. To change a rarity's
 * colour, change it there and every place updates together.
 */
export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  return <span className={`rarity-badge rarity-${rarity}`}>{rarity}</span>
}

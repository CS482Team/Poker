/* the coloured rarity label on item tiles */
import type { Rarity } from "@shared/Cosmetics"

/* the colours live in site.css (.rarity-*), shared with tile edges and name tag titles */
export default function RarityBadge({ rarity }: { rarity: Rarity }) {
  return <span className={`rarity-badge rarity-${rarity}`}>{rarity}</span>
}

import PlayingCard from "@/component/table/PlayingCard"
import type { Card } from "@shared/Card"
import type { ShopItem } from "@shared/Cosmetics"

// Rotation (degrees) of each card in the fan, left to right: a gentle arc
const ANGLES = [-12, -6, 0, 6, 12]

interface Props {
  count: number
  cards?: Card[] | null
  back?: ShopItem | undefined
}

export default function CardFan({ count, cards, back }: Props) {
  return (
    // w-max: the fan sizes to its cards, so a narrow seat can't squeeze them
    <div className="flex w-max">
      {Array.from({ length: count }, (_, i) => {
        const angle = ANGLES[i] ?? 0
        return (
          // each card pivots from its bottom edge, like a hand of cards held in a fan
          <div
            key={i}
            className={`shrink-0 origin-bottom ${i > 0 ? "-ml-5" : ""}`}
            style={{ transform: `rotate(${angle}deg) translateY(${Math.abs(angle) / 2}px)` }}
          >
            <PlayingCard card={cards?.[i] ?? null} size="md" index={i} back={back} />
          </div>
        )
      })}
    </div>
  )
}

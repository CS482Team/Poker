import PlayingCard from "@/component/PlayingCard"
import type { ShopItem } from "@shared/Cosmetics"

// Rotation (degrees) of each card in the fan, left to right: a gentle arc
const ANGLES = [-12, -6, 0, 6, 12]

interface Props {
  count: number
  back?: ShopItem | undefined // the house deck without one
}

/* A player's cards, face down: the game never sends you other players' faces.
   Each card deals in with a short stagger (PlayingCard's deal-in animation). */
export default function CardFan({ count, back }: Props) {
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
            <PlayingCard card={null} size="md" index={i} back={back} />
          </div>
        )
      })}
    </div>
  )
}

import PlayingCard from "../PlayingCard"
import type { Card } from "@shared/Card"

// Rotation (degrees) of each card in the fan, left to right
const ANGLES = [-16, -8, 0, 8, 16]

export default function CardFan({ cards, faceUp }: { cards: Card[]; faceUp: boolean }) {
  return (
    <div className="flex">
      {cards.map((card, i) => {
        const angle = ANGLES[i] ?? 0
        return (
          <div
            key={i}
            className={i > 0 ? "-ml-7" : ""}
            style={{ transform: `rotate(${angle}deg) translateY(${Math.abs(angle) / 2}px)` }}
          >
            <PlayingCard card={faceUp ? card : null} size="sm" index={i} />
          </div>
        )
      })}
    </div>
  )
}

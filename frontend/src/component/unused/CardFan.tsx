import PlayingCard from "../PlayingCard"

// Rotation (degrees) of each card in the fan, left to right
const ANGLES = [-16, -8, 0, 8, 16]

// Another player's cards, face down: the game never sends you their faces
export default function CardFan({ count }: { count: number }) {
  return (
    <div className="flex">
      {Array.from({ length: count }, (_, i) => {
        const angle = ANGLES[i] ?? 0
        return (
          <div
            key={i}
            className={i > 0 ? "-ml-7" : ""}
            style={{ transform: `rotate(${angle}deg) translateY(${Math.abs(angle) / 2}px)` }}
          >
            <PlayingCard card={null} size="sm" index={i} />
          </div>
        )
      })}
    </div>
  )
}

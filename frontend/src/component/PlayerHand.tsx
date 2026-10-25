import PlayingCard from "./PlayingCard"
import type { Card } from "@shared/Card"
import { cardLabel } from "@/util/Card"

interface PlayerHandProps {
  cards: Card[]
  selected?: number[]
  canSelect?: boolean
  onToggle?: (index: number) => void
}

export default function PlayerHand({ cards, selected = [], canSelect = false, onToggle }: PlayerHandProps) {
  return (
    <div className="flex justify-center gap-2">
      {cards.map((card, i) => {
        const isSelected = selected.includes(i)
        return (
          <button
            key={cardLabel(card)}
            type="button"
            disabled={!canSelect}
            aria-pressed={isSelected}
            aria-label={cardLabel(card)}
            onClick={() => onToggle?.(i)}
            className={`rounded-md transition-transform disabled:cursor-default ${isSelected ? "-translate-y-5 ring-4 ring-turn" : ""}`}
          >
            <PlayingCard card={card} size="lg" index={i} />
          </button>
        )
      })}
    </div>
  )
}

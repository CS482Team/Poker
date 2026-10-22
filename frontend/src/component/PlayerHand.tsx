import PlayingCard from "./PlayingCard"
import type { Card } from "@/util/Card"
import { cardLabel } from "@/util/Card"


interface PlayerHandProps {
    cards: Card[]
    selected?: number[] // positions (0–4) the player has picked
    canSelect?: boolean // true only during the draw, on your turn
    onToggle?: (index: number) => void // called with the card's position when clicked

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
                        aria-label={`${cardLabel(card)}${isSelected ? ", selected to discard" : ""}`}
                        onClick={() => onToggle?.(i)}
                        className={`rounded-md transition-transform disabled:cursor-default ${
                        isSelected ? "-translate-y-5 ring-4 ring-turn" : canSelect ? "hover:-translate-y-2" : ""
                        }`}
                     >
                        <PlayingCard card={card} size="lg" index={i} />
                    </button>
                )
            })}
        </div>
    )
}

/*export default function PlayerHand({ cards }: { cards: Card[] }) {
  return (
    <div className="flex justify-center gap-2">
      {cards.map((card, i) => (
        <PlayingCard key={cardLabel(card)} card={card} size="lg" index={i} />
      ))}
    </div>
 )
}*/
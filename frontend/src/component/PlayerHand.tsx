import PlayingCard from "./PlayingCard"
import type { Card } from "@/util/Card"
import { cardLabel } from "@/util/Card"

export default function PlayerHand({ cards }: { cards: Card[] }) {
  return (
    <div className="flex justify-center gap-2">
      {cards.map((card, i) => (
        <PlayingCard key={cardLabel(card)} card={card} size="lg" index={i} />
      ))}
    </div>
  )
}

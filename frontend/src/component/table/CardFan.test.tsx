import { render, screen } from "@testing-library/react"
import CardFan from "@/component/table/CardFan"
import { cardLabel } from "@/util/Card"
import type { Card } from "@shared/Card"

describe("CardFan", () => {
  it("draws cards face down", () => {
    render(<CardFan count={2} />)
    expect(screen.getAllByAltText("Face-down card")).toHaveLength(2)
  })

  it("shows the cards face up when they are revealed", () => {
    const cards: Card[] = [{ rank: 14, suit: "hearts" }, { rank: 10, suit: "spades" }]
    render(<CardFan count={2} cards={cards} />)
    expect(screen.getByAltText(cardLabel(cards[0]!))).toBeInTheDocument()
    expect(screen.getByAltText(cardLabel(cards[1]!))).toBeInTheDocument()
  })
})

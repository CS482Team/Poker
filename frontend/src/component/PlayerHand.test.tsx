import { fireEvent, render, screen } from "@testing-library/react"
import PlayerHand from "@/component/PlayerHand"
import type { Card } from "@shared/Card"

const hand: Card[] = [
  { rank: 14, suit: "spades" },
  { rank: 13, suit: "hearts" },
  { rank: 12, suit: "clubs" },
]

describe("PlayerHand", () => {
  it("marks the cards picked to discard with a red border", () => {
    render(<PlayerHand cards={hand} selected={[1]} canSelect />)
    const [first, second] = screen.getAllByRole("button")
    expect(second).toHaveAttribute("aria-pressed", "true")
    expect(second).toHaveClass("ring-red-500")
    expect(first).not.toHaveClass("ring-red-500")
  })

  it("passes the clicked card's position back", () => {
    const onToggle = jest.fn()
    render(<PlayerHand cards={hand} canSelect onToggle={onToggle} />)
    fireEvent.click(screen.getAllByRole("button")[2]!)
    expect(onToggle).toHaveBeenCalledWith(2)
  })

  it("can't be picked outside your draw turn", () => {
    render(<PlayerHand cards={hand} />)
    for (const card of screen.getAllByRole("button")) expect(card).toBeDisabled()
  })
})

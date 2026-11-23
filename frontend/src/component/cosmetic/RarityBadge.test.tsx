import { render, screen } from "@testing-library/react"
import RarityBadge from "@/component/cosmetic/RarityBadge"

describe("RarityBadge", () => {
  it("names the rarity", () => {
    render(<RarityBadge rarity="legendary" />)
    expect(screen.getByText("legendary")).toBeInTheDocument()
  })

  it("uses that rarity's colour", () => {
    render(<RarityBadge rarity="epic" />)
    expect(screen.getByText("epic")).toHaveClass("rarity-epic")
  })
})

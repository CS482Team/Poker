import { render, screen } from "@testing-library/react"
import NameTag from "@/component/cosmetic/NameTag"
import { makeItem } from "@/component/cosmetic/makeItem"

describe("NameTag", () => {
  it("shows just the name when no tag is equipped", () => {
    const { container } = render(<NameTag username="charley" />)
    expect(screen.getByText("charley")).toBeInTheDocument()
    expect(container.querySelector(".name-tag-title")).toBeNull()
  })

  it("shows the tag's title under the name", () => {
    render(<NameTag username="charley" tag={makeItem({ type: "name_tag", name: "Gold Tag", style: { text: "Big Spender" } })} />)
    expect(screen.getByText("charley")).toBeInTheDocument()
    expect(screen.getByText("Big Spender")).toBeInTheDocument()
  })

  it("falls back to the item name when the tag has no text", () => {
    render(<NameTag username="charley" tag={makeItem({ type: "name_tag", name: "Table Royalty" })} />)
    expect(screen.getByText("Table Royalty")).toBeInTheDocument()
  })

  it("colours the title by rarity unless the tag sets its own colour", () => {
    const { rerender } = render(<NameTag username="c" tag={makeItem({ type: "name_tag", rarity: "rare", style: { text: "Shark" } })} />)
    expect(screen.getByText("Shark")).toHaveClass("rarity-rare")
    expect(screen.getByText("Shark")).not.toHaveStyle({ color: "#ffd700" })

    rerender(<NameTag username="c" tag={makeItem({ type: "name_tag", style: { text: "Shark", color: "#ffd700" } })} />)
    expect(screen.getByText("Shark")).toHaveStyle({ color: "#ffd700" })
  })

  it("adds the shimmer animation when the tag asks for it", () => {
    render(<NameTag username="c" tag={makeItem({ type: "name_tag", style: { text: "Big Spender", animation: "shimmer" } })} />)
    expect(screen.getByText("Big Spender")).toHaveClass("animate-shimmer")
  })
})

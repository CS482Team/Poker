import { render, screen } from "@testing-library/react"
import CardFan from "@/component/CardFan"
import { makeItem } from "@/component/cosmetic/makeItem"

describe("CardFan", () => {
  it("shows one face-down card per card held", () => {
    render(<CardFan count={5} />)
    expect(screen.getAllByAltText("Face-down card")).toHaveLength(5)
  })

  it("fans the cards out from the middle", () => {
    const { container } = render(<CardFan count={5} />)
    const angles = [...container.firstElementChild!.children].map((card) => (card as HTMLElement).style.transform)
    expect(angles[0]).toContain("rotate(-12deg)")
    expect(angles[2]).toContain("rotate(0deg)")
    expect(angles[4]).toContain("rotate(12deg)")
  })

  it("shows nothing for an empty hand", () => {
    render(<CardFan count={0} />)
    expect(screen.queryByAltText("Face-down card")).not.toBeInTheDocument()
  })

  it("draws the cards in the player's equipped card back", () => {
    render(<CardFan count={2} back={makeItem({ name: "Diamond Flare", style: { pattern: "rays" } })} />)
    const faces = screen.getAllByRole("img", { name: "Face-down card" })
    expect(faces).toHaveLength(2)
    expect(faces[0]).toHaveAttribute("data-pattern", "rays")
    expect(screen.queryByAltText("Face-down card")).not.toBeInTheDocument() // not the default back image
  })

  it("shimmers when the card back does, like its shop preview", () => {
    render(<CardFan count={1} back={makeItem({ name: "Gold Foil", style: { pattern: "rays", animation: "shimmer" } })} />)
    expect(screen.getByRole("img", { name: "Face-down card" })).toHaveClass("animate-shimmer")
  })
})

import { render, screen } from "@testing-library/react"
import CardFan from "@/component/CardFan"

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
})

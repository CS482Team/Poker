import { fireEvent, render, screen } from "@testing-library/react"
import ItemPreview from "@/component/cosmetic/ItemPreview"
import { makeItem } from "@/component/cosmetic/makeItem"

describe("ItemPreview", () => {
  it("draws a card back in its pattern", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Diamond Flare", type: "card_back", style: { pattern: "rays" } })} />)
    expect(screen.getByRole("img", { name: "Diamond Flare preview" })).toHaveAttribute("data-pattern", "rays")
  })

  it("defaults a card back with no pattern to solid", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Plain", type: "card_back" })} />)
    expect(screen.getByRole("img", { name: "Plain preview" })).toHaveAttribute("data-pattern", "solid")
  })

  it("shows an avatar image", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Sly Fox", type: "avatar", assetUrl: "/cosmetic/avatar/sly-fox.svg" })} />)
    expect(screen.getByRole("img", { name: "Sly Fox preview" }).querySelector("img")).toHaveAttribute("src", "/cosmetic/avatar/sly-fox.svg")
  })

  it("falls back to the initial if the avatar image fails to load", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Broken", type: "avatar", assetUrl: "/missing.svg" })} />)
    const preview = screen.getByRole("img", { name: "Broken preview" })
    fireEvent.error(preview.querySelector("img")!)
    expect(preview.querySelector("img")).toBeNull()
    expect(preview).toHaveTextContent("C")
  })

  it("rings the player's initial with the border colour", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Ruby Glow", type: "avatar_border", style: { color: "#e0115f", animation: "glow" } })} />)
    const ring = screen.getByRole("img", { name: "Ruby Glow preview" })
    expect(ring).toHaveTextContent("C")
    expect(ring).toHaveStyle({ borderColor: "#e0115f" })
    expect(ring).toHaveClass("animate-glow")
  })

  it("shows a name tag under the player's own name", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Royalty", type: "name_tag", style: { text: "Table Royalty" } })} />)
    expect(screen.getByText("charley")).toBeInTheDocument()
    expect(screen.getByText("Table Royalty")).toBeInTheDocument()
  })

  it("shows an emote's emoji", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Big Laugh", type: "emote", style: { text: "😂" } })} />)
    expect(screen.getByRole("img", { name: "Big Laugh preview" })).toHaveTextContent("😂")
  })

  it("shows a theme as a swatch of its colours", () => {
    render(<ItemPreview username="charley" item={makeItem({ name: "Emerald", type: "theme", style: { color: "#0b6b3a", accent: "#e9c46a" } })} />)
    expect(screen.getByRole("img", { name: "Emerald preview" })).toHaveClass("theme-swatch")
  })
})

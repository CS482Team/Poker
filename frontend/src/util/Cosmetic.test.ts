import { makeItem } from "@/component/cosmetic/makeItem"
import { cardBackBackground, initialOf } from "@/util/Cosmetic"

describe("cardBackBackground", () => {
  const colours = { color: "#16161a", accent: "#c0c0c8" }

  it("uses the art when the card back has an image", () => {
    expect(cardBackBackground(makeItem({ assetUrl: "/cosmetic/card_back/foil.png" }))).toBe('url("/cosmetic/card_back/foil.png") center / cover')
  })

  it("draws a crosshatch for lattice", () => {
    const bg = cardBackBackground(makeItem({ style: { pattern: "lattice", ...colours } }))
    expect(bg).toContain("repeating-linear-gradient(45deg")
    expect(bg).toContain("repeating-linear-gradient(-45deg")
    expect(bg).toContain("#c0c0c8")
  })

  it("draws rays from the center", () => {
    expect(cardBackBackground(makeItem({ style: { pattern: "rays", ...colours } }))).toContain("repeating-conic-gradient")
  })

  it("draws rings from the center", () => {
    expect(cardBackBackground(makeItem({ style: { pattern: "rings", ...colours } }))).toContain("repeating-radial-gradient")
  })

  it("falls back to a solid gradient in the house colours", () => {
    const bg = cardBackBackground(makeItem())
    expect(bg).toContain("linear-gradient")
    expect(bg).toContain("#7a0f14")
  })
})

describe("initialOf", () => {
  it("takes the first letter, capitalised", () => {
    expect(initialOf("charley")).toBe("C")
  })

  it("shows a question mark for an empty name", () => {
    expect(initialOf("")).toBe("?")
  })
})

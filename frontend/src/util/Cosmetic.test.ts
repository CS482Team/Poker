import { makeItem } from "@/component/cosmetic/makeItem"
import { cardBackBackground, initialOf, themeVariables } from "@/util/Cosmetic"

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

describe("themeVariables", () => {
  const emerald = makeItem({ type: "theme", style: { pattern: "lattice", color: "#137a4c", accent: "#e9c46a", rail: "#3a2414" } })

  it("sets the felt colour with a lighter centre and darker edge", () => {
    const vars = themeVariables(emerald)
    expect(vars["--felt"]).toBe("#137a4c")
    expect(vars["--felt-hi"]).toContain("#137a4c")
    expect(vars["--felt-lo"]).toContain("#137a4c")
  })

  it("weaves the matching deck's pattern into the felt in the accent colour", () => {
    expect(themeVariables(emerald)["--felt-pattern"]).toContain("repeating-linear-gradient(45deg, #e9c46a")
    expect(themeVariables(makeItem({ type: "theme", style: { pattern: "rays", accent: "#ff5a5f" } }))["--felt-pattern"]).toContain("repeating-conic-gradient")
    expect(themeVariables(makeItem({ type: "theme", style: { pattern: "rings", accent: "#5aa9ff" } }))["--felt-pattern"]).toContain("repeating-radial-gradient")
  })

  it("stitches the trim and inlays the rail in the accent colour, on a rail of its own colour", () => {
    const vars = themeVariables(emerald)
    expect(vars["--trim"]).toContain("#e9c46a")
    expect(vars["--trim-style"]).toBe("dashed")
    expect(vars["--rail"]).toBe("#3a2414")
    expect(vars["--rail-inlay"]).toContain("#e9c46a")
  })

  it("uses a plain felt and the house colours for anything the theme leaves out", () => {
    const vars = themeVariables(makeItem({ type: "theme" }))
    expect(vars["--felt"]).toBe("#a5222a")
    expect(vars["--felt-pattern"]).toBe("linear-gradient(transparent, transparent)")
  })
})

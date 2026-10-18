/** @jest-environment node */
import fs from "fs"
import path from "path"
import { CARD_BACK_IMAGE, cardImage, cardLabel } from "./Card"
import type { Suit } from "./Card"

const SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"]
const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

describe("cardLabel", () => {
  it("shows face cards as letters", () => {
    expect(cardLabel({ rank: 14, suit: "spades" })).toBe("A♠")
    expect(cardLabel({ rank: 12, suit: "diamonds" })).toBe("Q♦")
  })

  it("shows number cards as numbers", () => {
    expect(cardLabel({ rank: 10, suit: "hearts" })).toBe("10♥")
  })
})

describe("cardImage", () => {
  it("uses the deck's file names: rank code then suit letter", () => {
    expect(cardImage({ rank: 14, suit: "spades" })).toBe("/card/AS.svg")
    expect(cardImage({ rank: 10, suit: "diamonds" })).toBe("/card/TD.svg")
    expect(cardImage({ rank: 2, suit: "clubs" })).toBe("/card/2C.svg")
  })

  // Catches a broken mapping or missing file if the deck is swapped later
  it("has an image file for all 52 cards and the back", () => {
    const exists = (url: string) => fs.existsSync(path.join(process.cwd(), "public", url))
    for (const suit of SUITS) {
      for (const rank of RANKS) expect(exists(cardImage({ rank, suit }))).toBe(true)
    }
    expect(exists(CARD_BACK_IMAGE)).toBe(true)
  })
})

import { createDeck, shuffle, SUITS } from "./Card"
import type { Card, Rng } from "./Card"

// A tiny seeded random generator, so shuffles are repeatable in tests
function seededRng(seed: number): Rng {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
}

const key = (c: Card) => `${c.rank}-${c.suit}`

// Test deck creation
describe("createDeck", () => {
  it("returns 52 cards", () => {
    const deck = createDeck()      // act
    expect(deck).toHaveLength(52)  // assert
  })

  //deck shouldn't have dups
  it("has no duplicate cards", () => {
    const deck = createDeck();
    const unique = new Set(deck.map(key))
    expect(unique.size).toBe(52)
  })

  // deck should have even number of each suit
  it("has 13 cards of each suit", () => {
    const deck = createDeck();
    for (const suit of SUITS) {
        expect(deck.filter(c => c.suit === suit)).toHaveLength(13)
    }
  })
})

describe("shuffle", () => {
  it("returns the same 52 cards", () => {
    const original = createDeck()
    const shuffled = shuffle(original, seededRng(3))
    expect(shuffled).toHaveLength(52)
    expect(shuffled.map(key).sort()).toEqual(original.map(key).sort())
    // hint: same length, and every card from createDeck() is still in there
  })

  it("does not change the deck passed in", () => {
    const original = createDeck()
    const copy = [...original]
    shuffle(original, seededRng(7))
    expect(original).toEqual(copy)
  })

  it("gives the same order for the same seed", () => {
    const a = shuffle(createDeck(), seededRng(42))
    const b = shuffle(createDeck(), seededRng(42))
    expect(a).toEqual(b)
  })

  it("gives a different order for a different seed", () => {
    const a = shuffle(createDeck(), seededRng(1))
    const b = shuffle(createDeck(), seededRng(2))
    expect(a).not.toEqual(b)
  })
  it("uses Math.random when no rng is given", () => {
    const shuffled = shuffle(createDeck())
    expect(shuffled).toHaveLength(52)
  })

})

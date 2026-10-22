import type { Card, Rank, Rng, Suit } from "../../../shared/Card"

const SUITS: Suit[] = ["clubs", "diamonds", "hearts", "spades"]
const RANKS: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]

// Builds a fresh, ordered 52-card deck: every rank of every suit
export function createDeck(): Card[] {
    const deck: Card[] = []
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({ rank, suit })
        }
    }
    return deck
}

// Fisher yates shuffle
export function shuffle(deck: Card[], rng: Rng = Math.random): Card[] {

    // copy deck as to not change original
    const copy = [...deck]

    // Loop i from last index down to 1
    for (let i = copy.length - 1; i > 0; i--) {

        // Pick random index from 0 to i 
        const j = Math.floor(rng() * (i + 1))

        // swap copy[i] and copy[j]
        ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]

    }
    //return copy
    return copy
}
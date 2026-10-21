export const SUITS = ["clubs", "diamonds", "hearts", "spades"] as const
export type Suit = (typeof SUITS)[number]
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 // 11=J 12=Q 13=K 14=A 
export interface Card { rank: Rank; suit: Suit }
export type Rng = () => number // same contract as Math.random
export const RANKS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14] as const


//Function for creating deck, loops through SUITS and RANKS and pushs both to return array for deck
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
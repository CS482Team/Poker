export type Suit = "clubs" | "diamonds" | "hearts" | "spades"
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 // 11=J 12=Q 13=K 14=A
export interface Card { rank: Rank; suit: Suit }
export type Rng = () => number // same contract as Math.random

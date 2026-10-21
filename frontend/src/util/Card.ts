// Mirrors the backend's Card type (backend/src/game/Card.ts); keep in sync
export type Suit = "clubs" | "diamonds" | "hearts" | "spades"
export interface Card { rank: number; suit: Suit } // 11=J 12=Q 13=K 14=A

const RANK_LABELS: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" }
const SUIT_SYMBOLS: Record<Suit, string> = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" }

// e.g. { rank: 14, suit: "spades" } → "A♠"
export function cardLabel(card: Card): string {
  return `${RANK_LABELS[card.rank] ?? card.rank}${SUIT_SYMBOLS[card.suit]}`
}

const RANK_CODES: Record<number, string> = { 10: "T", 11: "J", 12: "Q", 13: "K", 14: "A" }

// Image for a card in public/card/, e.g. { rank: 10, suit: "diamonds" } → "/card/TD.svg"
// Swapping decks later only means changing this function
export function cardImage(card: Card): string {
  const rank = RANK_CODES[card.rank] ?? String(card.rank)
  return `/card/${rank}${card.suit[0].toUpperCase()}.svg`
}

export const CARD_BACK_IMAGE = "/card/back.png"

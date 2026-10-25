import type { Card, Suit } from "@shared/Card"

const FACE_RANKS: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" }
const SUIT_SYMBOLS: Record<Suit, string> = { clubs: "♣", diamonds: "♦", hearts: "♥", spades: "♠" }

// e.g. { rank: 14, suit: "spades" } → "A♠"
export function cardLabel(card: Card): string {
  return `${FACE_RANKS[card.rank] ?? card.rank}${SUIT_SYMBOLS[card.suit]}`
}

// Image for a card in public/card/, e.g. { rank: 10, suit: "diamonds" } → "/card/TD.svg"
// Swapping decks later only means changing this function
export function cardImage(card: Card): string {
  const rank = card.rank === 10 ? "T" : (FACE_RANKS[card.rank] ?? String(card.rank))
  return `/card/${rank}${card.suit[0].toUpperCase()}.svg`
}

export const CARD_BACK_IMAGE = "/card/back.png"

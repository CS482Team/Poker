import Image from "next/image"
import type { Card } from "@shared/Card"
import type { ShopItem } from "@shared/Cosmetics"
import { CARD_BACK_IMAGE, cardImage, cardLabel } from "@/util/Card"
import { cardBackBackground } from "@/util/Cosmetic"
import type { CSSProperties } from "react"

const SIZES = {
  sm: { width: 44, height: 62 },
  md: { width: 40, height: 56 }, // opponents' card fans
  lg: { width: 100, height: 140 },
}

interface PlayingCardProps {
  card: Card | null // null = face down
  size: keyof typeof SIZES
  index?: number // position in the hand; staggers the deal-in animation
  back?: ShopItem | undefined // the house deck without one
}

export default function PlayingCard({ card, size, index = 0, back }: PlayingCardProps) {
  const { width, height } = SIZES[size]
  const deal = { animationDelay: `${index * 60}ms` }

  if (!card && back) {
    const style = { ...deal, width, height, background: cardBackBackground(back), "--accent": back.style.accent ?? "#d4a24c" } as CSSProperties
    return <div role="img" aria-label="Face-down card" data-pattern={back.assetUrl ? "art" : (back.style.pattern ?? "solid")} className={`card-back-face animate-deal-in rounded-md shadow-lg ${back.style.animation === "shimmer" ? "animate-shimmer" : ""}`} style={style} />
  }

  return (
    <Image
      src={card ? cardImage(card) : CARD_BACK_IMAGE}
      alt={card ? cardLabel(card) : "Face-down card"}
      width={width}
      height={height}
      unoptimized
      className="animate-deal-in rounded-md shadow-lg"
      style={deal}
    />
  )
}

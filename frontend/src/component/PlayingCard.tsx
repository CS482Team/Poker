import Image from "next/image"
import type { Card } from "@shared/Card"
import { CARD_BACK_IMAGE, cardImage, cardLabel } from "@/util/Card"

const SIZES = {
  sm: { width: 44, height: 62 },
  lg: { width: 100, height: 140 },
}

interface PlayingCardProps {
  card: Card | null // null = face down
  size: "sm" | "lg"
  index?: number // position in the hand; staggers the deal-in animation
}

export default function PlayingCard({ card, size, index = 0 }: PlayingCardProps) {
  const { width, height } = SIZES[size]
  return (
    <Image
      src={card ? cardImage(card) : CARD_BACK_IMAGE}
      alt={card ? cardLabel(card) : "Face-down card"}
      width={width}
      height={height}
      unoptimized
      className="animate-deal-in rounded-md shadow-lg"
      style={{ animationDelay: `${index * 60}ms` }}
    />
  )
}

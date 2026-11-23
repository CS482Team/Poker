/* a player's name with their name tag title underneath */
import type { ShopItem } from "@shared/Cosmetics"

interface Props {
  username: string
  /** leave out to show just the name */
  tag?: ShopItem | undefined
  /** "md" for seats and lists, "lg" for big previews */
  size?: "md" | "lg"
}

export default function NameTag({ username, tag, size = "md" }: Props) {
  return (
    <span className={`name-tag ${size}`}>
      <span className="name-tag-name">{username}</span>
      {tag && <NameTagTitle tag={tag} />}
    </span>
  )
}

/* just the title line, for layouts that place the name themselves (the seat labels) */
export function NameTagTitle({ tag, className = "" }: { tag: ShopItem; className?: string }) {
  return (
    <span
      className={`name-tag-title rarity-${tag.rarity} ${tag.style.animation === "shimmer" ? "animate-shimmer" : ""} ${className}`}
      style={tag.style.color ? { color: tag.style.color } : undefined}
    >
      {tag.style.text ?? tag.name}
    </span>
  )
}

/**
 * NameTag: a player's name with their equipped name tag shown underneath
 * (the Nitro Type-style title, e.g. "BIG SPENDER" in gold).
 * Used in previews now, and at the table seats and in chat later.
 */
import type { ShopItem } from "@shared/Cosmetics"

interface Props {
  /** The player's username, shown on the first line. */
  username: string
  /** The equipped name tag item. Leave it out and only the name is shown. */
  tag?: ShopItem | undefined
  /** "md" (16px) for seats and lists, "lg" (22px) for previews. */
  size?: "md" | "lg"
}

/**
 * Renders the name and, if a tag is equipped, its title on a second line.
 *
 * - Title text comes from `tag.style.text`, falling back to the item's name.
 * - Title colour comes from `tag.style.color`, falling back to the rarity colour.
 * - `tag.style.animation === "shimmer"` adds a moving highlight across the title.
 */
export default function NameTag({ username, tag, size = "md" }: Props) {
  return (
    <span className={`name-tag ${size}`}>
      <span className="name-tag-name">{username}</span>
      {tag && (
        <span
          className={`name-tag-title rarity-${tag.rarity} ${tag.style.animation === "shimmer" ? "animate-shimmer" : ""}`}
          style={tag.style.color ? { color: tag.style.color } : undefined}
        >
          {tag.style.text ?? tag.name}
        </span>
      )}
    </span>
  )
}

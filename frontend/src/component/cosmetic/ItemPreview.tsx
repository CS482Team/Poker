/* what any cosmetic looks like on the player */
import Avatar from "@/component/cosmetic/Avatar"
import NameTag from "@/component/cosmetic/NameTag"
import { cardBackBackground, themeVariables } from "@/util/Cosmetic"
import type { CosmeticType, ShopItem } from "@shared/Cosmetics"
import type { CSSProperties, ReactNode } from "react"

interface PreviewProps {
  item: ShopItem
  /** whose portrait or name the preview is drawn on */
  username: string
}

/* one preview per category; a new category only needs an entry here */
const PREVIEWS: Record<CosmeticType, (props: PreviewProps) => ReactNode> = {
  card_back: CardBackPreview,
  avatar: AvatarPreview,
  avatar_border: BorderPreview,
  name_tag: NameTagPreview,
  emote: EmotePreview,
  theme: ThemePreview,
}

export default function ItemPreview({ item, username }: PreviewProps) {
  const Preview = PREVIEWS[item.type]
  return <Preview item={item} username={username} />
}

function label(item: ShopItem) {
  return `${item.name} preview`
}

function animationClass(item: ShopItem) {
  return item.style.animation ? `animate-${item.style.animation}` : ""
}

function CardBackPreview({ item }: PreviewProps) {
  // --accent is read by the ::after diamond in site.css
  const style = { background: cardBackBackground(item), "--accent": item.style.accent ?? "#d4a24c" } as CSSProperties
  return <div role="img" aria-label={label(item)} data-pattern={item.style.pattern ?? "solid"} className={`card-back-preview ${animationClass(item)}`} style={style} />
}

function AvatarPreview({ item, username }: PreviewProps) {
  return (
    <div role="img" aria-label={label(item)} className="cosmetic-portrait">
      <Avatar username={username} url={item.assetUrl} />
    </div>
  )
}

function BorderPreview({ item, username }: PreviewProps) {
  const color = item.style.color ?? "#d8d4d4"
  // --ring is read by the glow animation in site.css so it glows in the border's colour
  const style = { borderColor: color, "--ring": color } as CSSProperties
  return (
    <div role="img" aria-label={label(item)} className={`cosmetic-portrait ${animationClass(item)}`} style={style}>
      <Avatar username={username} />
    </div>
  )
}

function NameTagPreview({ item, username }: PreviewProps) {
  return (
    <div role="img" aria-label={label(item)} className="name-tag-preview">
      {/* "md", like at the table, so long titles stay on one line in the narrow preview column */}
      <NameTag username={username} tag={item} size="md" />
    </div>
  )
}

function EmotePreview({ item }: PreviewProps) {
  return (
    <div role="img" aria-label={label(item)} className={`emote-preview rarity-${item.rarity}`}>
      {item.assetUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.assetUrl} alt="" className="size-3/5" />
      ) : (
        item.style.text
      )}
    </div>
  )
}

function ThemePreview({ item }: PreviewProps) {
  const shimmer = item.style.animation === "shimmer" ? "shimmer" : ""
  return (
    // the wrapper keeps the rail behind the felt (like the real table's wrapper), not on top of it
    <div className="theme-preview-wrap">
      <div role="img" aria-label={label(item)} className={`theme-preview ${shimmer}`} style={themeVariables(item) as CSSProperties}>
        <span className="table-line theme-preview-line" />
      </div>
    </div>
  )
}

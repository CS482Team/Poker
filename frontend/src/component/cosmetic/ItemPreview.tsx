/**
 * ItemPreview: shows what any cosmetic looks like on the player.
 *
 * Each category has its own small preview component, picked from the PREVIEWS
 * table by the item's type. Callers never need to know which kind of item they
 * have: the shop, My items and a future admin form just render <ItemPreview item={...} />.
 *
 * Adding a new category: write one more preview function below and add it to PREVIEWS.
 * TypeScript will complain until every CosmeticType has an entry.
 */
import Avatar from "@/component/cosmetic/Avatar"
import NameTag from "@/component/cosmetic/NameTag"
import { cardBackBackground } from "@/util/Cosmetic"
import type { CosmeticType, ShopItem } from "@shared/Cosmetics"
import type { CSSProperties, ReactNode } from "react"

interface PreviewProps {
  /** The item to preview. */
  item: ShopItem
  /** Whose portrait or name the preview is shown on (usually the signed-in player). */
  username: string
}

/** One preview renderer per category. */
const PREVIEWS: Record<CosmeticType, (props: PreviewProps) => ReactNode> = {
  card_back: CardBackPreview,
  avatar: AvatarPreview,
  avatar_border: BorderPreview,
  name_tag: NameTagPreview,
  emote: EmotePreview,
  theme: ThemePreview,
}

/** Renders the right preview for the item's category. */
export default function ItemPreview({ item, username }: PreviewProps) {
  const Preview = PREVIEWS[item.type]
  return <Preview item={item} username={username} />
}

/** Screen-reader label shared by every preview, e.g. "Sly Fox preview". */
function label(item: ShopItem) {
  return `${item.name} preview`
}

/** Maps style.animation to its CSS class ("glow" becomes "animate-glow"), or nothing. */
function animationClass(item: ShopItem) {
  return item.style.animation ? `animate-${item.style.animation}` : ""
}

/** A mini card: its pattern and colours, with the diamond emblem in the accent colour. */
function CardBackPreview({ item }: PreviewProps) {
  // --accent is read by the ::after diamond in site.css
  const style = { background: cardBackBackground(item), "--accent": item.style.accent ?? "#d4a24c" } as CSSProperties
  return <div role="img" aria-label={label(item)} data-pattern={item.style.pattern ?? "solid"} className={`card-back-preview ${animationClass(item)}`} style={style} />
}

/** The avatar picture in a plain portrait ring. */
function AvatarPreview({ item, username }: PreviewProps) {
  return (
    <div role="img" aria-label={label(item)} className="cosmetic-portrait">
      <Avatar username={username} url={item.assetUrl} />
    </div>
  )
}

/** The player's initial inside the border's coloured ring (plus glow or shimmer). */
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

/** The player's own name with this tag's title under it, the way it looks at the table. */
function NameTagPreview({ item, username }: PreviewProps) {
  return (
    <div role="img" aria-label={label(item)} className="name-tag-preview">
      <NameTag username={username} tag={item} size="lg" />
    </div>
  )
}

/** The emote's emoji (style.text) or image in a bubble ringed with its rarity colour. */
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

/** Themes are a stretch goal; for now, a swatch of the theme's two colours. */
function ThemePreview({ item }: PreviewProps) {
  const style = { background: `linear-gradient(135deg, ${item.style.color ?? "#151213"}, ${item.style.accent ?? "#5a1a1e"})` }
  return <div role="img" aria-label={label(item)} className="theme-swatch" style={style} />
}

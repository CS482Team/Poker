/**
 * MyItems: the locker where players see their look and equip what they own.
 *
 * Layout, top to bottom:
 *   1. "Your look": avatar + border, name tag, card back, and the 4-slot emote wheel
 *   2. One section per category the player owns something in, each a grid of item tiles
 *
 * This component only displays data and reports clicks through onEquip / onUnequip.
 * It doesn't fetch or save anything, so the page that uses it decides what equipping
 * means (calling the API, updating context, etc.) and the component stays easy to test.
 */
import Avatar from "@/component/cosmetic/Avatar"
import ItemPreview from "@/component/cosmetic/ItemPreview"
import NameTag from "@/component/cosmetic/NameTag"
import RarityBadge from "@/component/cosmetic/RarityBadge"
import { CARD_BACK_IMAGE } from "@/util/Card"
import { COSMETIC_LABELS } from "@/util/Cosmetic"
import { COSMETIC_TYPES, EMOTE_SLOT_COUNT, type EmoteSlot, type Loadout, type LoadoutSlot, type ShopItem } from "@shared/Cosmetics"
import Link from "next/link"
import type { CSSProperties } from "react"

interface Props {
  /** The signed-in player's name, shown in the previews. */
  username: string
  /** Every item the player owns. */
  items: ShopItem[]
  /** What the player currently has equipped, by slot. */
  loadout: Loadout
  /** Called when the player wants `item` in `slot` (replacing whatever was there). */
  onEquip: (item: ShopItem, slot: LoadoutSlot) => void
  /** Called when the player wants `slot` emptied. */
  onUnequip: (slot: LoadoutSlot) => void
}

/** ["emote_1", "emote_2", "emote_3", "emote_4"], built from the shared slot count. */
const EMOTE_SLOTS = Array.from({ length: EMOTE_SLOT_COUNT }, (_, i) => `emote_${i + 1}` as EmoteSlot)

/** The whole locker; shows an empty state with a shop link if the player owns nothing. */
export default function MyItems({ username, items, loadout, onEquip, onUnequip }: Props) {
  if (items.length === 0) {
    return (
      <section className="panel p-8 text-center">
        <p className="text-lg">You don&apos;t own any cosmetics yet.</p>
        <Link href="/shop" className="primary-action mt-5">
          Visit the shop
        </Link>
      </section>
    )
  }

  // keep the shared category order (COSMETIC_TYPES) and skip categories with nothing owned
  const groups = COSMETIC_TYPES.map((type) => ({ type, owned: items.filter((item) => item.type === type) })).filter((group) => group.owned.length > 0)

  return (
    <div className="flex flex-col gap-8">
      <YourLook username={username} loadout={loadout} onUnequip={onUnequip} />

      {groups.map(({ type, owned }) => (
        <section key={type} aria-labelledby={`my-${type}`}>
          <h2 id={`my-${type}`} className="mb-4 text-[28px] font-bold">
            {COSMETIC_LABELS[type]}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {owned.map((item) => (
              <ItemTile key={item.id} item={item} username={username} loadout={loadout} onEquip={onEquip} onUnequip={onUnequip} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

/**
 * The player's full look in one place: everything equipped, as other players will see it.
 * Filled emote wheel slots are buttons that empty the slot.
 */
function YourLook({ username, loadout, onUnequip }: Pick<Props, "username" | "loadout" | "onUnequip">) {
  // the equipped border recolours the portrait ring; --ring lets the glow animation match it
  const border = loadout.avatar_border
  const ring = border ? ({ borderColor: border.style.color, "--ring": border.style.color } as CSSProperties) : undefined
  const ringAnimation = border?.style.animation ? `animate-${border.style.animation}` : ""

  return (
    <section aria-labelledby="your-look" className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
      {/* visually hidden, but names the region for screen readers */}
      <h2 id="your-look" className="sr-only">
        Your look
      </h2>

      <div className="flex items-center gap-5">
        <div className={`cosmetic-portrait large ${ringAnimation}`} style={ring}>
          <Avatar username={username} url={loadout.avatar?.assetUrl} />
        </div>
        <NameTag username={username} tag={loadout.name_tag} size="lg" />
      </div>

      <div className="flex items-center gap-6 sm:ml-auto">
        {/* no card back equipped means the house deck everyone starts with */}
        {loadout.card_back ? (
          <ItemPreview item={loadout.card_back} username={username} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={CARD_BACK_IMAGE} alt="Default card back" className="card-back-preview" />
        )}

        <div>
          <p className="eyebrow">Emote wheel</p>
          <ul className="grid grid-cols-4 gap-2">
            {EMOTE_SLOTS.map((slot, i) => {
              const emote = loadout[slot]
              return (
                <li key={slot}>
                  {emote ? (
                    <button type="button" className="emote-slot filled" aria-label={`Remove ${emote.name} from slot ${i + 1}`} title="Remove" onClick={() => onUnequip(slot)}>
                      {emote.style.text}
                    </button>
                  ) : (
                    <span className="emote-slot">Empty</span>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}

/**
 * One owned item: preview on the left; rarity, name and equip controls on the right.
 * Emotes get a slot picker; everything else gets a single Equip / Unequip button.
 */
function ItemTile({ item, username, loadout, onEquip, onUnequip }: Omit<Props, "items"> & { item: ShopItem }) {
  return (
    <article aria-label={item.name} className={`panel shop-tile rarity-${item.rarity}`}>
      <div className="shop-tile-preview">
        <ItemPreview item={item} username={username} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-5">
        <RarityBadge rarity={item.rarity} />
        <h3 className="text-[22px] font-semibold leading-tight">{item.name}</h3>
        <div className="mt-auto pt-4">
          {/* for non-emotes, the slot has the same name as the type, e.g. "card_back" */}
          {item.type === "emote" ? <EmoteSlotPicker item={item} loadout={loadout} onEquip={onEquip} onUnequip={onUnequip} /> : <EquipButton item={item} slot={item.type} loadout={loadout} onEquip={onEquip} onUnequip={onUnequip} />}
        </div>
      </div>
    </article>
  )
}

/** Props shared by the equip controls. */
type ActionProps = Pick<Props, "loadout" | "onEquip" | "onUnequip"> & { item: ShopItem }

/** "Equip" when the item isn't on, or "✓ Equipped" plus "Unequip" when it is. */
function EquipButton({ item, slot, loadout, onEquip, onUnequip }: ActionProps & { slot: LoadoutSlot }) {
  if (loadout[slot]?.id !== item.id) {
    return (
      <button type="button" className="primary-action" aria-label={`Equip ${item.name}`} onClick={() => onEquip(item, slot)}>
        Equip
      </button>
    )
  }
  return (
    <div className="flex items-center gap-3">
      {/* the ✓ is added by CSS (::before) so screen readers just hear "Equipped" */}
      <span className="equipped-label">Equipped</span>
      <button type="button" className="secondary-action" aria-label={`Unequip ${item.name}`} onClick={() => onUnequip(slot)}>
        Unequip
      </button>
    </div>
  )
}

/**
 * Buttons 1–4 for choosing which wheel slot an emote sits in.
 * The slot(s) it's already in are highlighted; pressing one of those takes it out.
 */
function EmoteSlotPicker({ item, loadout, onEquip, onUnequip }: ActionProps) {
  return (
    <div>
      <p className="eyebrow">Wheel slot</p>
      <div className="flex gap-2">
        {EMOTE_SLOTS.map((slot, i) => {
          const here = loadout[slot]?.id === item.id
          return (
            <button key={slot} type="button" className={`slot-button ${here ? "active" : ""}`} aria-pressed={here} aria-label={`Put ${item.name} in slot ${i + 1}`} onClick={() => (here ? onUnequip(slot) : onEquip(item, slot))}>
              {i + 1}
            </button>
          )
        })}
      </div>
    </div>
  )
}

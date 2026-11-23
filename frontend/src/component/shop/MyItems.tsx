/* the locker: your look, then everything you own grouped by category */
import Avatar from "@/component/cosmetic/Avatar"
import ItemPreview from "@/component/cosmetic/ItemPreview"
import NameTag from "@/component/cosmetic/NameTag"
import RarityBadge from "@/component/cosmetic/RarityBadge"

import { CARD_BACK_IMAGE } from "@/util/Card"
import { COSMETIC_LABELS } from "@/util/Cosmetic"
import { COSMETIC_TYPES, EMOTE_SLOT_COUNT, type EmoteSlot, type Loadout, type LoadoutSlot, type ShopItem } from "@shared/Cosmetics"
import type { CSSProperties } from "react"

interface Props {
  username: string
  /** everything you own */
  items: ShopItem[]
  /** what you have on, by slot */
  loadout: Loadout
  /** replaces whatever is in the slot */
  onEquip: (item: ShopItem, slot: LoadoutSlot) => void
  onUnequip: (slot: LoadoutSlot) => void
}

const EMOTE_SLOTS = Array.from({ length: EMOTE_SLOT_COUNT }, (_, i) => `emote_${i + 1}` as EmoteSlot)

/* only displays and reports clicks; the page decides what equipping does */
export default function MyItems({ username, items, loadout, onEquip, onUnequip }: Props) {
  if (items.length === 0) {
    return (
      <section className="panel p-8 text-center">
        <p className="text-base">You don&apos;t own any cosmetics yet.</p>
      </section>
    )
  }

  const groups = COSMETIC_TYPES.map((type) => ({ type, owned: items.filter((item) => item.type === type) })).filter((group) => group.owned.length > 0)

  return (
    <div className="flex flex-col gap-8">
      <YourLook username={username} loadout={loadout} onUnequip={onUnequip} />

      {groups.map(({ type, owned }) => (
        <section key={type} aria-labelledby={`my-${type}`}>
          <h2 id={`my-${type}`} className="mb-4 text-[34px] font-bold">
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

function YourLook({ username, loadout, onUnequip }: Pick<Props, "username" | "loadout" | "onUnequip">) {
  const border = loadout.avatar_border
  const ring = border ? ({ borderColor: border.style.color, "--ring": border.style.color } as CSSProperties) : undefined
  const ringAnimation = border?.style.animation ? `animate-${border.style.animation}` : ""

  return (
    <section aria-labelledby="your-look" className="panel flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
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
        <div className="your-look-card">
            {loadout.card_back ? (
            <ItemPreview item={loadout.card_back} username={username} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={CARD_BACK_IMAGE} alt="Default card back" className="card-back-preview" />
          )}
        </div>

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

function ItemTile({ item, username, loadout, onEquip, onUnequip }: Omit<Props, "items"> & { item: ShopItem }) {
  return (
    <article aria-label={item.name} className={`panel shop-tile rarity-${item.rarity}`}>
      <div className="shop-tile-preview">
        <ItemPreview item={item} username={username} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 p-5">
        <RarityBadge rarity={item.rarity} />
        <h3 className="text-[26px] font-semibold leading-tight">{item.name}</h3>
        <div className={`mt-auto pt-4 ${item.type === "emote" ? "" : "flex justify-end"}`}>
          {/* for non-emotes, the slot has the same name as the type, e.g. "card_back" */}
          {item.type === "emote" ? <EmoteSlotPicker item={item} loadout={loadout} onEquip={onEquip} onUnequip={onUnequip} /> : <EquipButton item={item} slot={item.type} loadout={loadout} onEquip={onEquip} onUnequip={onUnequip} />}
        </div>
      </div>
    </article>
  )
}

type ActionProps = Pick<Props, "loadout" | "onEquip" | "onUnequip"> & { item: ShopItem }

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

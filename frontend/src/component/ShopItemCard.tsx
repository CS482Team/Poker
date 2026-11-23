"use client"

/* one item for sale: preview, details and buy controls (Buy, confirm, buying, owned) */
import ItemPreview from "@/component/cosmetic/ItemPreview"
import RarityBadge from "@/component/cosmetic/RarityBadge"
import type { ShopItem } from "@shared/Cosmetics"
import Link from "next/link"
import { useState } from "react"

interface Props {
  /** `owned` comes from the API for signed in players */
  item: ShopItem
  username: string
  /** null while it loads, or for guests */
  balance: number | null
  /** false shows a sign in link instead of Buy */
  signedIn: boolean
  /** should throw an Error with a message for the player if it fails */
  onBuy: (item: ShopItem) => Promise<void>
}

export default function ShopItemCard({ item, username, balance, signedIn, onBuy }: Props) {
  const [stage, setStage] = useState<"idle" | "confirming" | "buying">("idle")
  const [error, setError] = useState<string | null>(null)

  async function confirm() {
    setStage("buying")
    setError(null)
    try {
      await onBuy(item)
      // on success the page marks the item owned, which swaps this card to "Owned"
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed")
      setStage("idle")
    }
  }

  return (
    <article aria-label={item.name} className={`panel shop-tile rarity-${item.rarity}`}>
      <div className="shop-tile-preview">
        <ItemPreview item={item} username={username} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-5">
        <RarityBadge rarity={item.rarity} />
        <h3 className="text-[22px] font-semibold leading-tight">{item.name}</h3>
        <p className="text-base text-[#b8aeae]">{item.description}</p>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-4">
          <p className="shop-price">
            <span>{item.cost.toLocaleString()}</span> chips
          </p>
          <Actions item={item} balance={balance} signedIn={signedIn} stage={stage} onStart={() => setStage("confirming")} onConfirm={confirm} onCancel={() => setStage("idle")} />
        </div>

        {error && (
          <p role="alert" className="shop-error">
            {error}
          </p>
        )}
      </div>
    </article>
  )
}

interface ActionProps extends Pick<Props, "item" | "balance" | "signedIn"> {
  stage: "idle" | "confirming" | "buying"
  onStart: () => void
  onConfirm: () => void
  onCancel: () => void
}

function Actions({ item, balance, signedIn, stage, onStart, onConfirm, onCancel }: ActionProps) {
  if (item.owned) return <span className="equipped-label">Owned</span>

  if (!signedIn) {
    return (
      <Link href="/" className="secondary-action">
        Sign in to buy
      </Link>
    )
  }

  // balance still loading: show the button, but don't let it be pressed yet
  if (balance === null) {
    return (
      <button type="button" className="primary-action buy-action" disabled>
        Buy
      </button>
    )
  }

  if (balance < item.cost) {
    return (
      <button type="button" className="secondary-action" disabled>
        Need {(item.cost - balance).toLocaleString()} more
      </button>
    )
  }

  if (stage === "idle") {
    return (
      <button type="button" className="primary-action buy-action" aria-label={`Buy ${item.name}`} onClick={onStart}>
        Buy
      </button>
    )
  }

  return (
    <div className="shop-confirm">
      <p>Balance after: {(balance - item.cost).toLocaleString()} chips</p>
      <div className="flex gap-2">
        <button type="button" className="primary-action buy-action" onClick={onConfirm} disabled={stage === "buying"}>
          {stage === "buying" ? "Buying…" : "Confirm"}
        </button>
        <button type="button" className="secondary-action" onClick={onCancel} disabled={stage === "buying"}>
          Cancel
        </button>
      </div>
    </div>
  )
}

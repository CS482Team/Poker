"use client"

/* one item for sale: preview, details and buy controls (Buy, confirm, buying, owned) */
import BuyModal from "@/component/BuyModal"
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
      setStage("idle")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed")
      setStage("confirming")
    }
  }

  function close() {
    setStage("idle")
    setError(null)
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
          <Actions item={item} balance={balance} signedIn={signedIn} onStart={() => setStage("confirming")} />
        </div>
      </div>
      {stage !== "idle" && balance !== null && <BuyModal item={item} balance={balance} buying={stage === "buying"} error={error} onBuy={confirm} onClose={close} />}
    </article>
  )
}

interface ActionProps extends Pick<Props, "item" | "balance" | "signedIn"> {
  onStart: () => void
}

function Actions({ item, balance, signedIn, onStart }: ActionProps) {
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
      <button type="button" className="secondary-action" disabled>
        Buy
      </button>
    )
  }

  if (balance < item.cost) {
    return <span className="text-sm text-[#9e9393]">Not enough chips</span>
  }

  return (
    <button type="button" className="secondary-action" aria-label={`Buy ${item.name}`} onClick={onStart}>
      Buy
    </button>
  )
}

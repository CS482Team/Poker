"use client"

import ProfileMenu from "@/component/layout/ProfileMenu"
import { getCurrentTableId } from "@/service/CurrentTableService"
import { watchTable } from "@/service/SocketService"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import BalanceDisplay from "@/component/layout/BalanceDisplay"
import Icon, { SHOP } from "@/component/common/Icon"
import VolumeControl from "@/component/layout/VolumeControl"

export default function Nav() {
  const pathname = usePathname()
  const [tableId, setTableId] = useState<string | null>(null)

  const [myTurn, setMyTurn] = useState(false)

  useEffect(() => setTableId(getCurrentTableId()), [pathname])

  useEffect(() => {
    setMyTurn(false)
    if (!tableId) return
    return watchTable(tableId, () => {}, (view) => setMyTurn(!!view && view.you.seat >= 0 && view.toActSeat === view.you.seat))
  }, [tableId])

  // The sign-in and sign-up pages have their own full-screen layout
  if (pathname === "/" || pathname === "/signup") return null

  return (
    <nav className="site-header py-3">
      {/* three columns: logo on the left, tabs centred, profile menu on the right */}
      <div className="mx-auto grid max-w-[calc(1280px_-_2*var(--gutter))] grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* the brand, small and colourless, pressed into the bar */}
        <div className="flex items-center gap-2 justify-self-start">
          <Link
            href="/dashboard"
            aria-label="Hearts & Diamonds, back to the lobby"
            className="nav-mark rounded-md text-3xl leading-none focus-visible:outline-2 focus-visible:outline-white/40"
          >
            H&amp;D
          </Link>
          <VolumeControl />
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard" className={pathname === "/dashboard" ? "nav-tab active" : "nav-tab"}>
            Lobby
          </Link>
          {tableId && (
            <Link href={`/table/${tableId}`} className={pathname.startsWith("/table") ? "nav-tab active" : "nav-tab"}>
              Table
              {myTurn && !pathname.startsWith("/table") && <span role="img" aria-label="Your turn" className="turn-dot" />}
            </Link>
          )}
        </div>
        <div className="flex items-center justify-end gap-3">
          <Link href="/shop" aria-label="Shop" title="Shop" className={pathname === "/shop" ? "shop-nav-button active" : "shop-nav-button"}>
            <Icon d={SHOP} size={20} />
          </Link>
          <BalanceDisplay />
          <ProfileMenu />
        </div>

      </div>
    </nav>
  )
}

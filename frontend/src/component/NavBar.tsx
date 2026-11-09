"use client"

import ProfileMenu from "@/component/ProfileMenu"
import { getCurrentTableId } from "@/service/CurrentTableService"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Nav() {
  const pathname = usePathname()
  const [tableId, setTableId] = useState<string | null>(null)

  useEffect(() => setTableId(getCurrentTableId()), [pathname])

  // The sign-in and sign-up pages have their own full-screen layout
  if (pathname === "/" || pathname === "/signup") return null

  return (
    <nav className="site-header py-3">
      {/* three columns: logo on the left, tabs centred, profile menu on the right */}
      <div className="mx-auto grid max-w-[calc(1280px_-_2*var(--gutter))] grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* the brand, small and colourless, pressed into the bar */}
        <Link
          href="/dashboard"
          aria-label="Hearts & Diamonds, back to the lobby"
          className="nav-mark flex items-center gap-1.5 justify-self-start rounded-md focus-visible:outline-2 focus-visible:outline-white/40"
        >
          <span aria-hidden className="text-sm leading-none">
            &hearts;&diams;
          </span>
          <span aria-hidden className="hidden text-[11px] uppercase leading-none tracking-[0.18em] sm:inline">
            Hearts &amp; Diamonds
          </span>
        </Link>
        <div className="flex gap-2">
          <Link href="/dashboard" className={pathname === "/dashboard" ? "nav-tab active" : "nav-tab"}>
            Lobby
          </Link>
          {tableId && (
            <Link href={`/table/${tableId}`} className={pathname.startsWith("/table") ? "nav-tab active" : "nav-tab"}>
              Table
            </Link>
          )}
        </div>
        <div className="flex justify-end">
          <ProfileMenu />
        </div>
      </div>
    </nav>
  )
}

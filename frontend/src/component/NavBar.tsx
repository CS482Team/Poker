"use client"

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
    // three columns: logo on the left, tabs centred, an empty right column to balance it
    <nav className="site-header grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-3">
      {/* small version of the sign-in page's brand */}
      <Link
        href="/dashboard"
        aria-label="Hearts & Diamonds, back to the lobby"
        className="flex items-center gap-2 justify-self-start rounded-md focus-visible:outline-2 focus-visible:outline-[#e5484d]"
      >
        <span aria-hidden className="text-2xl leading-none text-[#e5484d]">
          &hearts;&diams;
        </span>
        <span aria-hidden className="font-display hidden text-lg leading-none sm:inline">
          Hearts &amp; Diamonds
        </span>
      </Link>
      <div className="flex gap-2">
        <Link href="/dashboard" className={pathname === "/dashboard" ? "nav-tab active" : "nav-tab"}>
          Lobby
        </Link>
        {tableId ? (
          <Link href={`/table/${tableId}`} className={pathname.startsWith("/table") ? "nav-tab active" : "nav-tab"}>
            Table
          </Link>
        ) : (
          <span className="nav-tab opacity-40">Table</span>
        )}
      </div>
    </nav>
  )
}

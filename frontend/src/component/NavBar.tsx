"use client"

import DevUserSwitch from "@/component/DevUserSwitch"
import { getCurrentTableId } from "@/service/CurrentTableService"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

export default function Nav() {
  const pathname = usePathname()
  const [tableId, setTableId] = useState<string | null>(null)

  useEffect(() => setTableId(getCurrentTableId()), [pathname])

  return (
    <nav className="site-header relative flex justify-center gap-2 py-3">
      <Link href="/" className={pathname === "/" ? "nav-tab active" : "nav-tab"}>
        Lobby
      </Link>
      {tableId ? (
        <Link href={`/table/${tableId}`} className={pathname.startsWith("/table") ? "nav-tab active" : "nav-tab"}>
          Table
        </Link>
      ) : (
        <span className="nav-tab opacity-40">Table</span>
      )}
      <DevUserSwitch />
    </nav>
  )
}

"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Nav() {
  const pathname = usePathname()
  const onTable = pathname.startsWith("/table")

  return (
    <nav className="site-header flex justify-center gap-2 py-3">
      <Link href="/" className={pathname === "/" ? "nav-tab active" : "nav-tab"}>
        Lobby
      </Link>
      {onTable ? (
        <Link href={pathname} className="nav-tab active">
          Table
        </Link>
      ) : (
        <span className="nav-tab opacity-40">Table</span>
      )}
    </nav>
  )
}

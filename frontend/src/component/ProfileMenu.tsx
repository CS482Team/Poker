"use client"

import { isAdmin } from "@/service/AdminService"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

export default function ProfileMenu() {
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  useEffect(() => {
    if (!open) return
    function closeOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", closeOutside)
    return () => document.removeEventListener("mousedown", closeOutside)
  }, [open])

  return (
    <div ref={menuRef} className="relative">
      <button type="button" aria-label="Profile menu" onClick={() => setOpen(!open)} className="avatar-initial size-11!">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
        </svg>
      </button>
      {open && (
        <div className="profile-menu">
          {admin ? (
            <Link href="/admin" onClick={() => setOpen(false)}>
              Admin
            </Link>
          ) : (
            <p className="p-2.5 text-[13px] text-[#9e9393]">Coming soon</p>
          )}
        </div>
      )}
    </div>
  )
}

"use client"

import { supabase } from "@/app/supabaseClient"
import Avatar from "@/component/cosmetic/Avatar"
import { AvatarBadge } from "@/component/badge/BadgeIcon"
import Icon, { ITEMS, LEAVE, SHIELD, USER } from "@/component/common/Icon"
import { useMyLoadout } from "@/hook/useMyLoadout"
import { isAdmin } from "@/service/AdminService"
import { fetchMyProfile } from "@/service/ProfileService"
import { type Badge, featuredBadge } from "@shared/Badges"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type CSSProperties } from "react"

export default function ProfileMenu() {
  const router = useRouter()
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [picture, setPicture] = useState<string | null>(null)
  const [badge, setBadge] = useState<Badge | null>(null)
  const loadout = useMyLoadout()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => {
        setPicture(profile.avatarUrl)
        setBadge(featuredBadge(profile.badges ?? []))
      })
      .catch(() => setPicture(null))
  }, [])

  useEffect(() => {
    if (!open) return
    function closeOutside(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", closeOutside)
    return () => document.removeEventListener("mousedown", closeOutside)
  }, [open])

  async function logOut() {
    await supabase.auth.signOut()
    setOpen(false)
    router.push("/")
  }

  const avatarUrl = loadout.avatar?.assetUrl ?? picture
  const border = loadout.avatar_border
  const ring = border ? ({ borderColor: border.style.color, "--ring": border.style.color } as CSSProperties) : undefined
  const ringAnimation = border?.style.animation ? `animate-${border.style.animation}` : ""

  return (
    <div ref={menuRef} className="relative">
      <button type="button" aria-label="Profile menu" onClick={() => setOpen(!open)} className={`avatar-initial relative size-11! ${ringAnimation}`} style={ring}>
        {avatarUrl ? (
          <Avatar username="" url={avatarUrl} />
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
          </svg>
        )}
        <AvatarBadge badge={badge} size={18} />
      </button>
      {open && (
        <div className="profile-menu">
          <Link href="/profile" onClick={() => setOpen(false)}>
            <Icon d={USER} />
            Profile
          </Link>
          <Link href="/shop/my-items" onClick={() => setOpen(false)}>
            <Icon d={ITEMS} />
            My Items
          </Link>
          {admin && (
            <Link href="/admin" onClick={() => setOpen(false)}>
              <Icon d={SHIELD} />
              Admin
            </Link>
          )}
          <button type="button" className="sign-out" onClick={logOut}>
            <Icon d={LEAVE} />
            Log out
          </button>
        </div>
      )}
    </div>
  )
}

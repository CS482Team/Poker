"use client"

import { supabase } from "@/app/supabaseClient"
import Avatar from "@/component/cosmetic/Avatar"
import Icon, { FRIENDS, ITEMS, LEAVE, SHIELD, USER } from "@/component/common/Icon"
import { useMyLoadout } from "@/hook/useMyLoadout"
import { isAdmin } from "@/service/AdminService"
import { fetchFriends } from "@/service/FriendService"
import { fetchMyProfile } from "@/service/ProfileService"
import { isGuest } from "@/service/UserService"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, type CSSProperties } from "react"

export default function ProfileMenu() {
  const router = useRouter()
  const [admin, setAdmin] = useState(false)
  const [open, setOpen] = useState(false)
  const [picture, setPicture] = useState<string | null>(null)
  const [requests, setRequests] = useState(0) // friend requests waiting on you
  const loadout = useMyLoadout()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    isAdmin()
      .then(setAdmin)
      .catch(() => setAdmin(false))
  }, [])

  useEffect(() => {
    fetchMyProfile()
      .then((profile) => setPicture(profile.avatarUrl))
      .catch(() => setPicture(null))
  }, [])

  // checked again each time the menu opens, so it catches requests that arrived since the page loaded
  useEffect(() => {
    if (isGuest()) return
    fetchFriends()
      .then((list) => setRequests(list.incoming.length))
      .catch(() => setRequests(0))
  }, [open])

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
      <button type="button" aria-label={requests > 0 ? `Profile menu, ${requests} friend request${requests === 1 ? "" : "s"}` : "Profile menu"} onClick={() => setOpen(!open)} className={`avatar-initial relative size-11! ${ringAnimation}`} style={ring}>
        {avatarUrl ? (
          <Avatar username="" url={avatarUrl} />
        ) : (
          <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
          </svg>
        )}
        {requests > 0 && <span aria-hidden className="absolute -top-0.5 -right-0.5 size-3 rounded-full border-2 border-[#1e1a1a] bg-red-500" />}
      </button>
      {open && (
        <div className="profile-menu">
          <Link href="/profile" onClick={() => setOpen(false)}>
            <Icon d={USER} />
            Profile
          </Link>
          <Link href="/friends" onClick={() => setOpen(false)}>
            <Icon d={FRIENDS} />
            Friends
            {requests > 0 && (
              <span aria-label={`${requests} friend request${requests === 1 ? "" : "s"}`} className="ml-auto rounded-full bg-red-500 px-1.5 text-xs font-semibold text-white">
                {requests}
              </span>
            )}
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

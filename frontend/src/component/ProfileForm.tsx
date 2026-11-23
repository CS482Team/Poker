"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { fetchMyProfile, getCurrentUserId } from "@/service/UserService"
import { MyProfile } from "@shared/User"
import ImagePicker from "@/component/ImagePicker"

const labelClass = "grid gap-1.5 text-sm text-[#b5a9a9]"
const inputClass = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef] [color-scheme:dark]"
const numberClass = `${inputClass} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`

export default function ProfileForm({profile, onCancel }: {profile: MyProfile | null; onCancel: () => void}) {
  //const router = useRouter()
  const [username, setUsername] = useState<string>(profile?.username ?? "")
  const [email, setEmail] = useState<string>(profile?.email ?? "")
  const [avatarUrl, setAvatarUrl] = useState<string>(profile?.avatarUrl ?? "")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMyProfile()
      .then((username) => setUsername((current) => current))
      .then((email) => setEmail((current) => current))
      .then((avatarUrl) => setAvatarUrl((current) => current))
      .catch(() => {})
  }, [])

  // async function submit(e: React.FormEvent) {

  // }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form className="w-full max-w-[460px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Edit Profile</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <div className="grid gap-4 sm:col-span-2 sm:grid-cols-3">
            <label className={labelClass}>
              Username
                <input type="string" value={username} onChange={(e) => setUsername(e.target.value)} className={`${inputClass} pl-7`} />
            </label>
            <label className={labelClass}>
              Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-7`} />
            </label>
          </div>
          <ImagePicker avatarUrl={avatarUrl} onChange={setAvatarUrl} className="aspect-video w-full">
            Choose image
          </ImagePicker>
          {error && <p className="text-sm text-red-400 sm:col-span-2">{error}</p>}
          <div className="flex items-center gap-2">
            {imageUrl && (
              <button type="button" onClick={() => setAvatarUrl(null)} className="secondary-action small danger">
                Remove
              </button>
            )}
          </div>
          <div className="mt-3 flex justify-end sm:col-span-2">
            <button type="submit" className="primary-action">
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

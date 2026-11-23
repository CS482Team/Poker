import ImagePicker from "@/component/ImagePicker"
import { changeAvatar, changeEmail, changeUsername } from "@/service/ProfileService"
import type { MyProfile } from "@shared/User"
import { useState, type FormEvent } from "react"


const labelClass = "grid gap-1.5 text-sm text-[#b5a9a9]"
const inputClass = "w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[#f5f2ef] [color-scheme:dark]"

interface Props {
  profile: MyProfile
  onCancel: () => void
  /** called with the profile as saved, so the page can show it straight away */
  onSaved: (profile: MyProfile) => void
}

export default function ProfileForm({ profile, onCancel, onSaved }: Props) {
  const [username, setUsername] = useState(profile.username)
  const [email, setEmail] = useState(profile.email ?? "")
  const [password, setPassword] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatarUrl)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const newEmail = email.trim().toLowerCase()
  // changing the email needs the current password (the backend checks it)
  const emailChanged = !profile.isGuest && newEmail !== (profile.email ?? "")

  // only sends what changed; stops at the first refusal and shows why
  async function submit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      if (username.trim() !== profile.username) await changeUsername(username)
      if (avatarUrl !== profile.avatarUrl) await changeAvatar(avatarUrl)
      if (emailChanged) await changeEmail(password, newEmail)
      onSaved({ ...profile, username: username.trim(), avatarUrl, email: emailChanged ? newEmail : profile.email })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <form role="dialog" aria-label="Edit profile" onSubmit={submit} className="w-full max-w-[460px] rounded-lg border border-black/70 bg-[#181414] text-[#f5f2ef] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-xl font-bold">Edit profile</h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="text-2xl text-[#b5a9a9]">
            ×
          </button>
        </div>

        <div className="grid gap-4 p-5">
          <label className={labelClass}>
            Username
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={20} className={inputClass} />
          </label>
          {!profile.isGuest && (
            <label className={labelClass}>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </label>
          )}
          {emailChanged && (
            <label className={labelClass}>
              Current password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required className={inputClass} />
            </label>
          )}

          <div className="grid gap-2">
            <span className={labelClass}>Picture</span>
            <ImagePicker imageUrl={avatarUrl} onChange={setAvatarUrl} className="aspect-square w-32">
              Choose image
            </ImagePicker>
            {avatarUrl && (
              <button type="button" onClick={() => setAvatarUrl(null)} className="secondary-action small danger w-fit">
                Remove picture
              </button>
            )}
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" className="secondary-action" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="primary-action" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}

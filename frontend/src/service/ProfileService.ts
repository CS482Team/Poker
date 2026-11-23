import { authHeaders } from "@/service/AuthService"
import type { MyProfile } from "@shared/User"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export async function fetchMyProfile(): Promise<MyProfile> {
  const res = await fetch(`${API_URL}/users/me`, { headers: await authHeaders() })
  if (!res.ok) throw new Error(`Could not load your profile (${res.status})`)
  return res.json()
}

async function patchMe(path: string, body: object): Promise<void> {
  const res = await fetch(`${API_URL}/users/me/${path}`, { method: "PATCH", headers: await authHeaders(), body: JSON.stringify(body) })
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Could not save (${res.status})`)
}

export const changeUsername = (username: string) => patchMe("username", { username })
export const changeAvatar = (avatarUrl: string | null) => patchMe("avatar", { avatarUrl })
export const changeEmail = (password: string, email: string) => patchMe("email", { password, email })

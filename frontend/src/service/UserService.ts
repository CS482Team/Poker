import { authHeaders } from "@/service/AuthService";
import type { MyProfile } from "@shared/User";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchMyProfile(): Promise<MyProfile> {
  const res = await fetch(`${API_URL}/users/me`, { headers: await authHeaders() });
  if (!res.ok) throw new Error(`Could not load your profile (${res.status})`);
  return res.json();
}

async function patchMe(path: string, body: object): Promise<void> {
  const res = await fetch(`${API_URL}/users/me/${path}`, { method: "PATCH", headers: await authHeaders(), body: JSON.stringify(body) });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Could not save (${res.status})`);
}

export const changeUsername = (username: string) => patchMe("username", { username });
export const changeAvatar = (avatarUrl: string | null) => patchMe("avatar", { avatarUrl });
export const changeEmail = (password: string, email: string) => patchMe("email", { password, email });

/* DEMO ONLY: reads the signed-in Supabase user straight from browser storage, where supabase-js
   saves the session, so this stays synchronous for its callers. A real version should use a React
   context fed by supabase.auth.onAuthStateChange. */
function signedInUserId(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  const key = `sb-${new URL(url).hostname.split(".")[0]}-auth-token`;
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null")?.user?.id ?? null;
  } catch {
    return null;
  }
}

export function getCurrentUserId(): string {
  return signedInUserId() ?? "";
}

export async function fetchUsername(userId: string): Promise<string> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/username`);
  if (!res.ok) throw new Error("Could not load username");
  const body = (await res.json()) as { username: string };
  return body.username;
}

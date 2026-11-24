import { authHeaders } from "@/service/AuthService"
import type { FriendRequestResult, FriendsList, RecentPlayer } from "@shared/Friends"

const API_URL = process.env.NEXT_PUBLIC_API_URL

/* the server's own sentence when it sends one (e.g. "There's no player with that username."), otherwise a fallback */
async function failure(res: Response, fallback: string): Promise<Error> {
  const reason = await res.json().then((body) => body?.error, () => undefined)
  return new Error(typeof reason === "string" ? reason : `${fallback} (${res.status})`)
}

export async function fetchFriends(): Promise<FriendsList> {
  const res = await fetch(`${API_URL}/friends`, { headers: await authHeaders() })
  if (!res.ok) throw await failure(res, "Could not load your friends")
  return res.json()
}

export async function fetchRecentPlayers(): Promise<RecentPlayer[]> {
  const res = await fetch(`${API_URL}/friends/recent`, { headers: await authHeaders() })
  if (!res.ok) throw await failure(res, "Could not load recent players")
  return res.json()
}

/* "requested", or "accepted" when they had already asked you */
export async function sendFriendRequest(username: string): Promise<FriendRequestResult> {
  const res = await fetch(`${API_URL}/friends`, { method: "POST", headers: await authHeaders(), body: JSON.stringify({ username }) })
  if (!res.ok) throw await failure(res, "Could not send the request")
  return res.json()
}

export async function acceptFriendRequest(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/friends/${userId}/accept`, { method: "POST", headers: await authHeaders() })
  if (!res.ok) throw await failure(res, "Could not accept the request")
}

/* unfriend, cancel a request you sent, or decline one you received */
export async function removeFriend(userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/friends/${userId}`, { method: "DELETE", headers: await authHeaders() })
  if (!res.ok) throw await failure(res, "Could not remove them")
}

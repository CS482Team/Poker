/* friends list rules, between FriendController (HTTP) and FriendDAO (database) */
import type { Friend, FriendErrorCode, FriendPlayer, FriendRequest, FriendRequestResult, FriendsList, RecentPlayer } from "../../../shared/Friends"
import { ACCEPTED, acceptRequest, deleteFriendship, findPlayerByUsername, getFriendship, getFriendships, getRecentOpponents, getSeatedTables, insertRequest } from "../dao/FriendDAO"
import type { FriendshipRow, PlayerRow } from "../dao/FriendDAO"
import { getProfile } from "../dao/UserDAO"

/* how many of a player's latest hands "recent players" looks through, and how many players it lists */
export const RECENT_HANDS = 30
export const RECENT_LIMIT = 12

/* an expected refusal (unknown name, already friends...), as opposed to a crash */
export class FriendError extends Error {
  constructor(public readonly code: FriendErrorCode) {
    super(code)
    this.name = "FriendError"
  }
}

const player = (row: PlayerRow): FriendPlayer => ({ userId: row.id, username: row.username, avatarUrl: row.avatar_url })

/* a player's friends (with where they're seated), and the requests waiting on them or on others */
export async function listFriends(userId: string): Promise<FriendsList> {
  const rows = await getFriendships(userId)
  const other = (row: FriendshipRow) => (row.sender_id === userId ? row.receiver : row.sender)
  const accepted = rows.filter((r) => r.status === ACCEPTED)
  const seated = await getSeatedTables(accepted.map((r) => other(r).id))

  const friends: Friend[] = accepted
    .map((r) => ({ ...player(other(r)), since: r.created_at, table: seated.get(other(r).id) ?? null }))
    .sort((a, b) => Number(b.table !== null) - Number(a.table !== null) || a.username.localeCompare(b.username))
  const request = (r: FriendshipRow): FriendRequest => ({ ...player(other(r)), sentAt: r.created_at })
  const newestFirst = (a: FriendRequest, b: FriendRequest) => b.sentAt.localeCompare(a.sentAt)
  const pending = rows.filter((r) => r.status !== ACCEPTED)

  return {
    friends,
    incoming: pending.filter((r) => r.receiver_id === userId).map(request).sort(newestFirst),
    outgoing: pending.filter((r) => r.sender_id === userId).map(request).sort(newestFirst),
  }
}

/* Asks the player with this username to be friends. If they'd already asked you, that's a yes and you're friends now. */
export async function sendRequest(userId: string, username: string): Promise<FriendRequestResult> {
  const [me, target] = await Promise.all([getProfile(userId), findPlayerByUsername(username)])
  if (me.isGuest) throw new FriendError("guest")
  if (!target) throw new FriendError("user_not_found")
  if (target.id === userId) throw new FriendError("self")
  if (target.isGuest) throw new FriendError("target_guest")

  const result = (status: FriendRequestResult["status"]): FriendRequestResult => ({ status, player: { userId: target.id, username: target.username, avatarUrl: target.avatarUrl } })

  // twice at most: if a request appears between the check and the insert (both asked at once), look again
  for (let attempt = 0; attempt < 2; attempt++) {
    const existing = await getFriendship(userId, target.id)
    if (existing?.status === ACCEPTED) throw new FriendError("already_friends")
    if (existing && existing.senderId === userId) throw new FriendError("already_requested")
    if (existing) {
      if (await acceptRequest(target.id, userId)) return result("accepted")
      continue // they cancelled it just now; try sending ours
    }
    if (await insertRequest(userId, target.id)) return result("requested")
  }
  throw new FriendError("already_requested")
}

/* accepts the request `senderId` sent this player */
export async function acceptFriend(userId: string, senderId: string): Promise<void> {
  if (!(await acceptRequest(senderId, userId))) throw new FriendError("request_not_found")
}

/* unfriends, cancels a request you sent, or declines one you received: all of them just remove the row */
export async function removeFriend(userId: string, otherId: string): Promise<void> {
  if (!(await deleteFriendship(userId, otherId))) throw new FriendError("not_found")
}

/* signed-up players from your latest hands that you could add: not friends, and no request either way */
export async function recentPlayers(userId: string): Promise<RecentPlayer[]> {
  const [opponents, rows] = await Promise.all([getRecentOpponents(userId, RECENT_HANDS), getFriendships(userId)])
  const known = new Set(rows.flatMap((r) => [r.sender_id, r.receiver_id]))
  const recent = new Map<string, RecentPlayer>()
  for (const o of opponents) {
    if (known.has(o.id) || recent.has(o.id)) continue // newest first, so the first sighting is the latest
    recent.set(o.id, { ...player(o), lastPlayedAt: o.played_at })
  }
  return [...recent.values()].slice(0, RECENT_LIMIT)
}

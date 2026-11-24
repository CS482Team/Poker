/* another player, as the friends list shows them */
export interface FriendPlayer {
  userId: string
  username: string
  avatarUrl: string | null
}

/* someone you're friends with */
export interface Friend extends FriendPlayer {
  since: string                                // ISO date the request was sent
  table: { id: string; name: string } | null   // where they're seated right now, to join them; null if nowhere
}

/* a request waiting on an answer */
export interface FriendRequest extends FriendPlayer {
  sentAt: string // ISO date
}

/* GET /friends */
export interface FriendsList {
  friends: Friend[]           // seated players first, then by name
  incoming: FriendRequest[]   // sent to you, newest first
  outgoing: FriendRequest[]   // sent by you, newest first
}

/* GET /friends/recent: signed-up players you've shared a hand with lately, who aren't friends or asked yet */
export interface RecentPlayer extends FriendPlayer {
  lastPlayedAt: string // ISO date
}

/* POST /friends: "requested" sent a request; "accepted" means they had already asked you, so you're now friends */
export interface FriendRequestResult {
  status: "requested" | "accepted"
  player: FriendPlayer
}

export type FriendErrorCode =
  | "guest"              // you're on a guest account
  | "user_not_found"     // no player by that name
  | "self"               // that's you
  | "target_guest"       // they're on a guest account
  | "already_friends"
  | "already_requested"  // you already asked them
  | "request_not_found"  // nothing to accept
  | "not_found"          // no friendship or request with them to remove

/* HTTP handling for /friends; the rules live in FriendService */
import type { Request, Response } from "express"
import type { FriendErrorCode } from "../../../shared/Friends"
import { acceptFriend, FriendError, listFriends, recentPlayers, removeFriend, sendRequest } from "../services/FriendService"
import { RateLimiter } from "../socket/RateLimiter"

/* refusals answer { error, code }: a sentence for the player and a code for the frontend */
const REFUSALS: Record<FriendErrorCode, { status: number; message: string }> = {
  guest: { status: 403, message: "Sign up to add friends. Guest accounts can't have a friends list." },
  user_not_found: { status: 404, message: "There's no player with that username." },
  self: { status: 400, message: "You can't add yourself." },
  target_guest: { status: 400, message: "That player is on a guest account, so they can't be added." },
  already_friends: { status: 409, message: "You're already friends." },
  already_requested: { status: 409, message: "You've already sent them a request." },
  request_not_found: { status: 404, message: "That request isn't there anymore." },
  not_found: { status: 404, message: "You're not friends with that player." },
}

/* friend requests: 20 per 10 minutes per player, so nobody can spam the whole player base */
export const requestAttempts = new RateLimiter(20, 10 * 60_000)

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/* handles GET /friends */
export async function getFriends(_req: Request, res: Response) {
  res.json(await listFriends(res.locals.userId))
}

/* handles GET /friends/recent */
export async function getRecentPlayers(_req: Request, res: Response) {
  res.json(await recentPlayers(res.locals.userId))
}

/* handles POST /friends { username } */
export async function addFriend(req: Request<{}, {}, { username?: unknown }>, res: Response) {
  const username = typeof req.body?.username === "string" ? req.body.username.trim() : ""
  if (username.length < 3 || username.length > 20) {
    res.status(400).json({ error: "Enter a username (3 to 20 characters)" })
    return
  }
  if (!requestAttempts.allow(res.locals.userId)) {
    res.status(429).json({ error: "Too many friend requests. Wait a few minutes and try again" })
    return
  }
  try {
    const result = await sendRequest(res.locals.userId, username)
    res.status(result.status === "requested" ? 201 : 200).json(result)
  } catch (error) {
    refuse(res, error)
  }
}

/* handles POST /friends/:userId/accept */
export async function acceptRequest(req: Request<{ userId: string }>, res: Response) {
  if (!validId(req.params.userId, res)) return
  try {
    await acceptFriend(res.locals.userId, req.params.userId)
    res.status(204).end()
  } catch (error) {
    refuse(res, error)
  }
}

/* handles DELETE /friends/:userId: unfriend, cancel your request, or decline theirs */
export async function deleteFriend(req: Request<{ userId: string }>, res: Response) {
  if (!validId(req.params.userId, res)) return
  try {
    await removeFriend(res.locals.userId, req.params.userId)
    res.status(204).end()
  } catch (error) {
    refuse(res, error)
  }
}

/* the id goes into a database filter, so only a real uuid gets through */
function validId(id: string, res: Response) {
  if (UUID.test(id)) return true
  res.status(400).json({ error: "Invalid player id" })
  return false
}

function refuse(res: Response, error: unknown) {
  if (!(error instanceof FriendError)) throw error
  const { status, message } = REFUSALS[error.code]
  res.status(status).json({ error: message, code: error.code })
}

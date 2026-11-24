/* /friends routes; all of them need a signed in player */
import { Router } from "express"
import { acceptRequest, addFriend, deleteFriend, getFriends, getRecentPlayers } from "../controller/FriendController"
import { requireUser } from "../util/RequireUser"

export const friendRouter = Router()
friendRouter.use(requireUser)
friendRouter.get("/", getFriends)
friendRouter.get("/recent", getRecentPlayers)
friendRouter.post("/", addFriend)
friendRouter.post("/:userId/accept", acceptRequest)
friendRouter.delete("/:userId", deleteFriend)

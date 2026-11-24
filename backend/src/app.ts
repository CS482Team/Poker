import express from "express"
import cors from "cors"

import { adRouter } from "./route/AdRouter"
import { adminRouter } from "./route/AdminRouter"
import { eventRouter } from "./route/EventRouter"
import { friendRouter } from "./route/FriendRouter"
import { gameRouter } from "./route/GameRouter"
import { reportRouter } from "./route/ReportRouter"
import { shopRouter } from "./route/ShopRouter"
import { tableRouter } from "./route/TableRouter"
import { userRouter } from "./route/UserRouter"

export const app = express()
app.use(cors())
// TODO: move ad images to a storage bucket instead of the request body
app.use(express.json({ limit: "5mb" }))
app.get("/health", (_, res) => res.json({ ok: true }))
app.use("/admin", adminRouter)
app.use("/ads", adRouter)
app.use("/reports", reportRouter)
app.use("/events", eventRouter)
app.use("/friends", friendRouter)
app.use("/shop", shopRouter)
app.use("/tables", tableRouter)
app.use(gameRouter)
app.use("/users", userRouter)

import express from "express"
import cors from "cors"

import { adRouter } from "./route/AdRouter"
import { gameRouter } from "./route/GameRouter"
import { tableRouter } from "./route/TableRouter"
import { requireAdmin } from "./util/RequireAdmin"
import { requireUser } from "./util/RequireUser"

export const app = express()
app.use(cors())
app.use(express.json())
app.get("/health", (_, res) => res.json({ ok: true }))
app.get("/admin", requireUser, requireAdmin, (_, res) => res.status(204).end())
app.use("/ads", adRouter)
app.use("/tables", tableRouter)
app.use(gameRouter)

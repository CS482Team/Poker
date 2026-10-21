import express from "express"
import cors from "cors"
import { demoRouter } from "./route/Demo"
import { gameRouter } from "./route/Game"

export const app = express()
app.use(cors())
app.use(express.json())
app.get("/health", (_, res) => res.json({ ok: true }))
app.use(demoRouter)
app.use(gameRouter)

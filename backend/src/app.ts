import express from "express"
import cors from "cors"

export const app = express()
app.use(cors())
app.get("/health", (_, res) => res.json({ ok: true }))

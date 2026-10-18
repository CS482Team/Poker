import express from "express"
import cors from "cors"
import { demoRouter } from "./route/Demo"

export const app = express()
app.use(cors())
app.get("/health", (_, res) => res.json({ ok: true }))
app.use(demoRouter)

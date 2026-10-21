import express from "express"
import cors from "cors"

import { tableRouter } from "./route/TableRoutes"

export const app = express()
app.use(cors())
app.use(express.json())
app.get("/health", (_, res) => res.json({ ok: true }))
app.use("/tables", tableRouter)

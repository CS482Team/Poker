import { Router } from "express"
import { dealDemo } from "../controller/Demo"

// TODO: demo only; remove once rooms (S12/S14) and per-player views exist
export const demoRouter = Router()

demoRouter.post("/demo/deal", async (_req, res) => {
  try {
    res.json(await dealDemo())
  } catch (err) {
    console.error("demo deal failed:", err)
    res.status(500).json({ error: "deal-failed" })
  }
})
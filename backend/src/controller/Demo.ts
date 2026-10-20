import type { Request, Response } from "express"
import { dealDemo } from "../services/Demo"

export async function dealDemoController(_req: Request, res: Response): Promise<void> {
  try {
    res.json(await dealDemo())
  } catch (err) {
    console.error("demo deal failed:", err)
    res.status(500).json({ error: "deal-failed" })
  }
}
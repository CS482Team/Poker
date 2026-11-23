import { Request, Response } from "express"
import { createEvent, endEvent, getActiveEvent } from "../dao/EventDAO"

export async function showActiveEvent(_req: Request, res: Response) {
  res.json(await getActiveEvent())
}

export async function addEvent(req: Request<{}, {}, { name: string; multiplier: number; days: number }>, res: Response) {
  const { name, multiplier, days } = req.body
  if (typeof name !== "string" || name.trim() === "" || typeof multiplier !== "number" || multiplier < 1.1 || multiplier > 3 || !Number.isInteger(days) || days < 1) {
    res.status(400).json({ error: "Invalid event" })
    return
  }
  if (await getActiveEvent()) {
    res.status(409).json({ error: "An event is already running" })
    return
  }
  await createEvent(name.trim(), multiplier, days, res.locals.userId)
  res.status(201).end()
}

export async function stopEvent(req: Request<{ id: string }>, res: Response) {
  await endEvent(req.params.id)
  res.status(204).end()
}

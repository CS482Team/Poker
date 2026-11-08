import { Request, Response } from "express"
import type { NewAd } from "../../../shared/Ad"
import { createAd, deleteAd, editAd, getActiveAds, getAllAds, setAdActive } from "../dao/AdDAO"

export async function listAds(_req: Request, res: Response) {
  res.json(await getAllAds())
}

export async function listActiveAds(_req: Request, res: Response) {
  res.json(await getActiveAds())
}

export async function addAd(req: Request<{}, {}, NewAd>, res: Response) {
  if (!isValidNewAd(req.body)) {
    res.status(400).json({ error: "Invalid ad" })
    return
  }
  const id = await createAd({ ...req.body, title: req.body.title.trim() }, res.locals.userId)
  res.status(201).json({ id })
}

export async function changeAd(req: Request<{ id: string }, {}, NewAd>, res: Response) {
  if (!isValidNewAd(req.body)) {
    res.status(400).json({ error: "Invalid ad" })
    return
  }
  await editAd(req.params.id, { ...req.body, title: req.body.title.trim() })
  res.status(204).end()
}

export async function updateAd(req: Request<{ id: string }, {}, { active: boolean }>, res: Response) {
  if (typeof req.body.active !== "boolean") {
    res.status(400).json({ error: "Invalid ad" })
    return
  }
  await setAdActive(req.params.id, req.body.active)
  res.status(204).end()
}

export async function removeAd(req: Request<{ id: string }>, res: Response) {
  await deleteAd(req.params.id)
  res.status(204).end()
}

function isValidNewAd(body: NewAd) {
  return (
    typeof body.title === "string" &&
    body.title.trim() !== "" &&
    Number.isInteger(body.rewardAmount) &&
    body.rewardAmount >= 0
  )
}

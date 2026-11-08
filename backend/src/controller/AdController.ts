import { Request, Response } from "express"
import type { NewAd } from "../../../shared/Ad"
import { createAdClaim } from "../dao/AdClaimDAO"
import { createAd, deleteAd, editAd, getActiveAds, getAd, getAllAds, setAdActive } from "../dao/AdDAO"
import { logBalanceChange } from "../dao/BalanceLogDAO"
import { getBalance, setBalance } from "../dao/UserDAO"
import { finishWatch, startWatch } from "../services/AdWatchService"

export async function listAds(_req: Request, res: Response) {
  res.json(await getAllAds())
}

export async function listActiveAds(_req: Request, res: Response) {
  res.json(await getActiveAds())
}

export async function startWatching(req: Request<{ id: string }>, res: Response) {
  const ad = await getAd(req.params.id)
  if (!ad?.active) {
    res.status(404).json({ error: "Ad not found" })
    return
  }
  startWatch(res.locals.userId, ad.id)
  res.status(204).end()
}

export async function claimAd(req: Request<{ id: string }>, res: Response) {
  const userId = res.locals.userId
  const ad = await getAd(req.params.id)
  if (!ad?.active) {
    res.status(404).json({ error: "Ad not found" })
    return
  }
  if (!finishWatch(userId, ad.id)) {
    res.status(409).json({ error: "Watch the whole ad first" })
    return
  }
  await setBalance(userId, (await getBalance(userId)) + ad.rewardAmount)
  await logBalanceChange(userId, ad.rewardAmount, "ad_reward")
  await createAdClaim(userId, ad.id)
  res.json({ reward: ad.rewardAmount })
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

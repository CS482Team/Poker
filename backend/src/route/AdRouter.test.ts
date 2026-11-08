import request from "supertest"
import { app } from "../app"
import { createAdClaim } from "../dao/AdClaimDAO"
import { createAd, deleteAd, editAd, getActiveAds, getAd, getAllAds, setAdActive } from "../dao/AdDAO"
import { logBalanceChange } from "../dao/BalanceLogDAO"
import { getBalance, getRole, getUserIdFromToken, setBalance } from "../dao/UserDAO"
import { finishWatch, startWatch } from "../services/AdWatchService"

jest.mock("../dao/AdDAO", () => ({
  getAllAds: jest.fn(),
  getActiveAds: jest.fn(),
  getAd: jest.fn(),
  createAd: jest.fn(),
  setAdActive: jest.fn(),
  deleteAd: jest.fn(),
  editAd: jest.fn(),
}))
jest.mock("../dao/UserDAO", () => ({
  getRole: jest.fn(),
  getUserIdFromToken: jest.fn(),
  getBalance: jest.fn(),
  setBalance: jest.fn(),
}))
jest.mock("../dao/AdClaimDAO", () => ({ createAdClaim: jest.fn() }))
jest.mock("../dao/BalanceLogDAO", () => ({ logBalanceChange: jest.fn() }))
jest.mock("../services/AdWatchService", () => ({ startWatch: jest.fn(), finishWatch: jest.fn() }))

const liveAd = { id: "a1", title: "Bonus", rewardAmount: 500, active: true }

const validAd = { title: " Bonus ", rewardAmount: 500 }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getUserIdFromToken).mockResolvedValue("admin")
  jest.mocked(getRole).mockResolvedValue(1)
})

function asAdmin(req: request.Test) {
  return req.set("Authorization", "Bearer token")
}

describe("admin access", () => {
  it("lets an admin in", async () => {
    const res = await asAdmin(request(app).get("/admin"))
    expect(res.status).toBe(204)
  })

  it("rejects a request without a token", async () => {
    const res = await request(app).get("/admin")
    expect(res.status).toBe(401)
  })

  it("rejects a bad token", async () => {
    jest.mocked(getUserIdFromToken).mockResolvedValue(null)
    const res = await asAdmin(request(app).get("/admin"))
    expect(res.status).toBe(401)
  })

  it("rejects a non admin", async () => {
    jest.mocked(getRole).mockResolvedValue(0)
    const res = await asAdmin(request(app).post("/ads")).send(validAd)
    expect(res.status).toBe(403)
    expect(createAd).not.toHaveBeenCalled()
  })
})

describe("watching ads", () => {
  it("starts watching for a signed in player", async () => {
    jest.mocked(getAd).mockResolvedValue(liveAd)
    const res = await asAdmin(request(app).post("/ads/a1/watch"))
    expect(res.status).toBe(204)
    expect(startWatch).toHaveBeenCalledWith("admin", "a1")
    expect(getRole).not.toHaveBeenCalled()
  })

  it("rejects watching without signing in", async () => {
    const res = await request(app).post("/ads/a1/watch")
    expect(res.status).toBe(401)
  })

  it("rejects a missing or paused ad", async () => {
    jest.mocked(getAd).mockResolvedValue({ ...liveAd, active: false })
    expect((await asAdmin(request(app).post("/ads/a1/watch"))).status).toBe(404)
    expect((await asAdmin(request(app).post("/ads/a1/claim"))).status).toBe(404)
  })

  it("pays the reward after a full watch", async () => {
    jest.mocked(getAd).mockResolvedValue(liveAd)
    jest.mocked(finishWatch).mockReturnValue(true)
    jest.mocked(getBalance).mockResolvedValue(1000)
    const res = await asAdmin(request(app).post("/ads/a1/claim"))
    expect(res.body).toEqual({ reward: 500 })
    expect(setBalance).toHaveBeenCalledWith("admin", 1500)
    expect(logBalanceChange).toHaveBeenCalledWith("admin", 500, "ad_reward")
    expect(createAdClaim).toHaveBeenCalledWith("admin", "a1")
  })

  it("refuses to pay before the watch is done", async () => {
    jest.mocked(getAd).mockResolvedValue(liveAd)
    jest.mocked(finishWatch).mockReturnValue(false)
    const res = await asAdmin(request(app).post("/ads/a1/claim"))
    expect(res.status).toBe(409)
    expect(setBalance).not.toHaveBeenCalled()
  })
})

describe("active ads", () => {
  it("lists active ads without signing in", async () => {
    jest.mocked(getActiveAds).mockResolvedValue([])
    const res = await request(app).get("/ads/active")
    expect(res.status).toBe(200)
    expect(getUserIdFromToken).not.toHaveBeenCalled()
  })
})

describe("ads", () => {
  it("lists ads", async () => {
    jest.mocked(getAllAds).mockResolvedValue([])
    const res = await asAdmin(request(app).get("/ads"))
    expect(res.status).toBe(200)
  })

  it("creates an ad for the admin", async () => {
    jest.mocked(createAd).mockResolvedValue("a1")
    const res = await asAdmin(request(app).post("/ads")).send(validAd)
    expect(res.status).toBe(201)
    expect(createAd).toHaveBeenCalledWith({ title: "Bonus", rewardAmount: 500 }, "admin")
  })

  it("rejects an invalid ad", async () => {
    const res = await asAdmin(request(app).post("/ads")).send({ title: " ", rewardAmount: -1 })
    expect(res.status).toBe(400)
  })

  it("edits an ad", async () => {
    const res = await asAdmin(request(app).put("/ads/a1")).send(validAd)
    expect(res.status).toBe(204)
    expect(editAd).toHaveBeenCalledWith("a1", { title: "Bonus", rewardAmount: 500 })
  })

  it("rejects an invalid edit", async () => {
    const res = await asAdmin(request(app).put("/ads/a1")).send({ title: "", rewardAmount: 5 })
    expect(res.status).toBe(400)
    expect(editAd).not.toHaveBeenCalled()
  })

  it("pauses an ad", async () => {
    const res = await asAdmin(request(app).patch("/ads/a1")).send({ active: false })
    expect(res.status).toBe(204)
    expect(setAdActive).toHaveBeenCalledWith("a1", false)
  })

  it("rejects an invalid update", async () => {
    const res = await asAdmin(request(app).patch("/ads/a1")).send({ active: "no" })
    expect(res.status).toBe(400)
  })

  it("deletes an ad", async () => {
    const res = await asAdmin(request(app).delete("/ads/a1"))
    expect(res.status).toBe(204)
    expect(deleteAd).toHaveBeenCalledWith("a1")
  })

  it("rejects a delete from a non admin", async () => {
    jest.mocked(getRole).mockResolvedValue(0)
    const res = await asAdmin(request(app).delete("/ads/a1"))
    expect(res.status).toBe(403)
    expect(deleteAd).not.toHaveBeenCalled()
  })
})

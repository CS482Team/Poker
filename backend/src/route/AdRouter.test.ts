import request from "supertest"
import { app } from "../app"
import { createAd, deleteAd, getAllAds, setAdActive } from "../dao/AdDAO"
import { getRole, getUserIdFromToken } from "../dao/UserDAO"

jest.mock("../dao/AdDAO", () => ({
  getAllAds: jest.fn(),
  createAd: jest.fn(),
  setAdActive: jest.fn(),
  deleteAd: jest.fn(),
}))
jest.mock("../dao/UserDAO", () => ({
  getRole: jest.fn(),
  getUserIdFromToken: jest.fn(),
}))

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

import request from "supertest"
import { app } from "../app"
import { dealDemo } from "../controller/Demo"

jest.mock("../controller/Demo")

describe("POST /demo/deal", () => {
  it("returns the deal as JSON", async () => {
    const deal = { matchId: "m1", pot: 4, dealerSeat: 0, players: [] }
    jest.mocked(dealDemo).mockResolvedValue(deal)

    const res = await request(app).post("/demo/deal")

    expect(res.status).toBe(200)
    expect(res.body).toEqual(deal)
  })

  it("returns 500 when dealing fails", async () => {
    jest.mocked(dealDemo).mockRejectedValue(new Error("db down"))
    const res = await request(app).post("/demo/deal")
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: "deal-failed" })
  })
})
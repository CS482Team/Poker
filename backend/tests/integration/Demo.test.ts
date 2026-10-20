import request from "supertest"
import { app } from "../../src/app"
import { dealDemo } from "../../src/services/Demo"

jest.mock("../../src/services/Demo")

describe("POST /demo/deal", () => {
  it("returns the deal as JSON", async () => {
    const deal = { matchId: "m1", pot: 4, dealerSeat: 0, toActSeat: 1, players: [] }
    jest.mocked(dealDemo).mockResolvedValue(deal)

    const res = await request(app).post("/demo/deal")

    expect(res.status).toBe(200)
    expect(res.body).toEqual(deal)
  })

  it("returns 500 when dealing fails", async () => {
    const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
    jest.mocked(dealDemo).mockRejectedValue(new Error("db down"))
    const res = await request(app).post("/demo/deal")
    expect(res.status).toBe(500)
    expect(res.body).toEqual({ error: "deal-failed" })
    expect(consoleError).toHaveBeenCalledWith("demo deal failed:", expect.any(Error))
    consoleError.mockRestore()
  })
})
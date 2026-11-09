import request from "supertest"
import { app } from "../app"
import { getBalance } from "../dao/UserDAO"

jest.mock("../dao/UserDAO", () => ({
  getBalance: jest.fn(),
  setBalance: jest.fn(),
}))

beforeEach(() => {
  jest.resetAllMocks()
})

describe("users", () => {
  it("returns a user's balance", async () => {
    jest.mocked(getBalance).mockResolvedValue(2500)
    const res = await request(app).get("/users/u1/balance")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ balance: 2500 })
    expect(getBalance).toHaveBeenCalledWith("u1")
  })
})
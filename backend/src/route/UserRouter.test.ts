import request from "supertest"
import { app } from "../app"
import { getBalance, getUsername } from "../dao/UserDAO"

jest.mock("../dao/UserDAO", () => ({
  getBalance: jest.fn(),
  getUsername: jest.fn(),
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

  it("returns a user's username", async () => {
    jest.mocked(getUsername).mockResolvedValue("Maya")
    const res = await request(app).get("/users/u1/username")
    expect(res.body).toEqual({ username: "Maya" })
  })
})

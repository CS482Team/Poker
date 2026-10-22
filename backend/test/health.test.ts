import request from "supertest"
import { app } from "../src/app"

jest.mock("../src/config/Supabase", () => ({ getSupabase: () => ({}) }))

describe("GET /health", () => {
  it("returns ok", async () => {
    const res = await request(app).get("/health")
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })
})
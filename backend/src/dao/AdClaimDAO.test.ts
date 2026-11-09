import { createAdClaim } from "../dao/AdClaimDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("AdClaimDAO", () => {
  it("records a claim", async () => {
    await createAdClaim("u1", "a1")
    expect(calls).toContainEqual(["from", ["ad_claim"]])
    expect(calls).toContainEqual(["insert", [{ user_id: "u1", ad_id: "a1" }]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(createAdClaim("u1", "a1")).rejects.toThrow("db down")
  })
})

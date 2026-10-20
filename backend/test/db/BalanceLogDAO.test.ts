import { logBalanceChange } from "../../src/db/BalanceLogDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("BalanceLogDAO", () => {
  it("writes the change to the log", async () => {
    await logBalanceChange("u1", -100, "buy_in")
    expect(calls).toContainEqual(["from", ["balance_log"]])
    expect(calls).toContainEqual(["insert", [{ user_id: "u1", delta: -100, reason: "buy_in" }]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(logBalanceChange("u1", -100, "buy_in")).rejects.toThrow("db down")
  })
})

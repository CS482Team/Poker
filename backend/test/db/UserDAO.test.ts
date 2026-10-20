import { getBalance, setBalance } from "../../src/db/UserDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("UserDAO", () => {
  it("reads a balance", async () => {
    mockState.result = { data: { chip_balance: 500 } }
    expect(await getBalance("u1")).toBe(500)
  })

  it("saves the new balance on the user", async () => {
    await setBalance("u1", 400)
    expect(calls).toContainEqual(["from", ["user"]])
    expect(calls).toContainEqual(["update", [{ chip_balance: 400 }]])
    expect(calls).toContainEqual(["eq", ["id", "u1"]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getBalance("u1")).rejects.toThrow("db down")
    await expect(setBalance("u1", 400)).rejects.toThrow("db down")
  })
})

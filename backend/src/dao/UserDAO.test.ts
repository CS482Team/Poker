import { getBalance, getRole, getUserIdFromToken, setBalance } from "../dao/UserDAO"
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

  it("reads a role", async () => {
    mockState.result = { data: { role: 1 } }
    expect(await getRole("u1")).toBe(1)
  })

  it("finds the user for a token", async () => {
    mockState.result = { data: { user: { id: "u1" } } }
    expect(await getUserIdFromToken("token")).toBe("u1")
  })

  it("returns null for a bad token", async () => {
    mockState.result = { data: { user: null } }
    expect(await getUserIdFromToken("bad")).toBeNull()
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(getBalance("u1")).rejects.toThrow("db down")
    await expect(setBalance("u1", 400)).rejects.toThrow("db down")
    await expect(getRole("u1")).rejects.toThrow("db down")
  })
})

import { addPlayer, countPlayers, removePlayer, updateStack } from "../../src/dao/TablePlayersDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

describe("TablePlayersDAO", () => {
  it("counts players", async () => {
    mockState.result = { count: 3 }
    expect(await countPlayers("t1")).toBe(3)
  })

  it("deletes the seat and returns the stack of a removed player", async () => {
    mockState.result = { data: { stack: 100 } }
    expect(await removePlayer("t1", "u1")).toBe(100)
    expect(calls).toContainEqual(["delete", []])
    expect(calls).toContainEqual(["eq", ["table_id", "t1"]])
    expect(calls).toContainEqual(["eq", ["user_id", "u1"]])
  })

  it("returns null and deletes nothing when the player was not seated", async () => {
    mockState.result = { data: null }
    expect(await removePlayer("t1", "u1")).toBeNull()
    expect(calls).not.toContainEqual(["delete", []])
  })

  it("seats a player", async () => {
    await addPlayer("t1", "u1", 2, 100)
    expect(calls).toContainEqual(["insert", [{ table_id: "t1", user_id: "u1", seat_number: 2, stack: 100 }]])
  })

  it("saves a player's stack", async () => {
    await updateStack("t1", "u1", 120)
    expect(calls).toContainEqual(["update", [{ stack: 120 }]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(countPlayers("t1")).rejects.toThrow("db down")
    await expect(removePlayer("t1", "u1")).rejects.toThrow("db down")
    await expect(addPlayer("t1", "u1", 0, 100)).rejects.toThrow("db down")
  })

  it("throws when the delete fails after the lookup", async () => {
    mockState.result = { data: { stack: 100 } }
    mockState.awaited = failure
    await expect(removePlayer("t1", "u1")).rejects.toThrow("db down")
  })
})

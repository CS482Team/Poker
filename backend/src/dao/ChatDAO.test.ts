import { insertMessage, recentMessages } from "./ChatDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

beforeEach(resetMock)

const row = {
  id: 1,
  table_id: "t1",
  user_id: "u1",
  body: "hi",
  created_at: "2026-11-06T10:00:00Z",
  user: { username: "Maya", avatar_url: "https://img.test/maya.png" },
}
const message = {
  id: 1,
  tableId: "t1",
  userId: "u1",
  name: "Maya",
  avatarUrl: "https://img.test/maya.png",
  body: "hi",
  createdAt: "2026-11-06T10:00:00Z",
}

describe("ChatDAO", () => {
  it("saves a message and returns it with the sender's name and avatar", async () => {
    mockState.result = { data: row }
    expect(await insertMessage("t1", "u1", "hi")).toEqual(message)
    expect(calls).toContainEqual(["from", ["chat_message"]])
    expect(calls).toContainEqual(["insert", [{ table_id: "t1", user_id: "u1", body: "hi" }]])
  })

  it("gives a sender with no profile picture a null avatar", async () => {
    mockState.result = { data: { ...row, user: { username: "Maya", avatar_url: null } } }
    expect((await insertMessage("t1", "u1", "hi")).avatarUrl).toBeNull()
  })

  it("gives a system message no name or avatar", async () => {
    mockState.result = { data: { ...row, user_id: null, user: null } }
    expect(await insertMessage("t1", null, "hi")).toEqual({ ...message, userId: null, name: null, avatarUrl: null })
  })

  it("gets the latest messages oldest first", async () => {
    mockState.result = { data: [{ ...row, id: 2 }, row] }
    const messages = await recentMessages("t1", 50)
    expect(messages.map((m) => m.id)).toEqual([1, 2])
    expect(calls).toContainEqual(["eq", ["table_id", "t1"]])
    expect(calls).toContainEqual(["order", ["id", { ascending: false }]])
    expect(calls).toContainEqual(["limit", [50]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(recentMessages("t1", 50)).rejects.toThrow("db down")
  })
})
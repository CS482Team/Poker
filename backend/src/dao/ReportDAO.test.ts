import { createReport, getReport, getReports } from "./ReportDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const row = { id: 2, body: "Table froze", created_at: "2026-11-14T10:00:00Z", table_id: "t1", table_name: "Ruby", user: { username: "Maya" } }
const report = { id: 2, username: "Maya", body: "Table froze", createdAt: "2026-11-14T10:00:00Z", tableId: "t1", tableName: "Ruby" }

beforeEach(resetMock)

describe("ReportDAO", () => {
  it("saves a report", async () => {
    await createReport("u1", "Table froze", { id: "t1", name: "Ruby" })
    expect(calls).toContainEqual(["from", ["support_ticket"]])
    expect(calls).toContainEqual(["insert", [{ user_id: "u1", body: "Table froze", table_id: "t1", table_name: "Ruby" }]])
  })

  it("lists reports newest first with the sender's name", async () => {
    mockState.result = { data: [row] }
    expect(await getReports()).toEqual([report])
    expect(calls).toContainEqual(["order", ["id", { ascending: false }]])
  })

  it("gets one report", async () => {
    mockState.result = { data: row }
    expect(await getReport(2)).toEqual(report)
    mockState.result = { data: null }
    expect(await getReport(3)).toBeNull()
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(createReport("u1", "hi", null)).rejects.toThrow("db down")
    await expect(getReport(1)).rejects.toThrow("db down")
    await expect(getReports()).rejects.toThrow("db down")
  })
})

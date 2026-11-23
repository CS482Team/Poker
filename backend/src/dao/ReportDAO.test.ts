import { createReport, getReport, getReports, hasOpenReset, resolveReport } from "./ReportDAO"
import { calls, failure, mockState, resetMock } from "./mockSupabase"

jest.mock("@supabase/supabase-js", () => require("./mockSupabase").supabaseMock)

const row = { id: 2, user_id: "u1", kind: "report", status: "open", body: "Table froze", created_at: "2026-11-14T10:00:00Z", table_id: "t1", table_name: "Ruby", user: { username: "Maya" } }
const report = { id: 2, username: "Maya", body: "Table froze", createdAt: "2026-11-14T10:00:00Z", tableId: "t1", tableName: "Ruby", userId: "u1", kind: "report", status: "open" }

beforeEach(resetMock)

describe("ReportDAO", () => {
  it("saves a report", async () => {
    await createReport("u1", "Table froze", { id: "t1", name: "Ruby" })
    expect(calls).toContainEqual(["from", ["support_ticket"]])
    expect(calls).toContainEqual(["insert", [{ user_id: "u1", body: "Table froze", table_id: "t1", table_name: "Ruby", kind: "report" }]])
  })

  it("lists reports newest first with the sender's name", async () => {
    mockState.result = { data: [row] }
    expect(await getReports()).toEqual([report])
    expect(calls).toContainEqual(["order", ["id", { ascending: false }]])
  })

  it("checks for a reset request that's still waiting", async () => {
    mockState.awaited = { count: 1, error: null }
    expect(await hasOpenReset("u1")).toBe(true)
    expect(calls).toContainEqual(["eq", ["kind", "password_reset"]])
    expect(calls).toContainEqual(["eq", ["status", "open"]])
    mockState.awaited = { count: 0, error: null }
    expect(await hasOpenReset("u1")).toBe(false)
  })

  it("marks a request resolved", async () => {
    mockState.awaited = { error: null }
    await resolveReport(7)
    expect(calls).toContainEqual(["update", [{ status: "resolved" }]])
    expect(calls).toContainEqual(["eq", ["id", 7]])
  })

  it("throws when resolving or checking fails", async () => {
    mockState.result = failure
    await expect(hasOpenReset("u1")).rejects.toThrow("db down")
    await expect(resolveReport(7)).rejects.toThrow("db down")
  })

  it("gets one report", async () => {
    mockState.result = { data: row }
    expect(await getReport(2)).toEqual(report)
    mockState.result = { data: null }
    expect(await getReport(3)).toBeNull()
  })

  it("finds an open reset request", async () => {
    mockState.result = { count: 1 }
    expect(await hasOpenReset("u1")).toBe(true)
  })

  it("marks a report resolved", async () => {
    await resolveReport(2)
    expect(calls).toContainEqual(["update", [{ status: "resolved" }]])
  })

  it("throws when the database fails", async () => {
    mockState.result = failure
    await expect(createReport("u1", "hi", null)).rejects.toThrow("db down")
    await expect(getReport(1)).rejects.toThrow("db down")
    await expect(getReports()).rejects.toThrow("db down")
  })
})

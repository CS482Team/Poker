import request from "supertest"
import { app } from "../app"
import { messagesBefore } from "../dao/ChatDAO"
import { getTableHands } from "../dao/MatchDAO"
import { createReport, getReport, getReports, hasOpenReset, resolveReport } from "../dao/ReportDAO"
import { findUserIdByEmail, getEmail, setPassword } from "../dao/AuthDAO"
import { getTable } from "../dao/TableDAO"
import { getRole, getUserIdFromToken } from "../dao/UserDAO"

jest.mock("../dao/ReportDAO", () => ({ createReport: jest.fn(), getReport: jest.fn(), getReports: jest.fn(), hasOpenReset: jest.fn(), resolveReport: jest.fn() }))
jest.mock("../dao/AuthDAO", () => ({ findUserIdByEmail: jest.fn(), getEmail: jest.fn(), setPassword: jest.fn() }))
jest.mock("../dao/MatchDAO", () => ({ getTableHands: jest.fn() }))
jest.mock("../dao/ChatDAO", () => ({ messagesBefore: jest.fn() }))
jest.mock("../dao/TableDAO", () => ({ getTable: jest.fn() }))
jest.mock("../dao/UserDAO", () => ({ getRole: jest.fn(), getUserIdFromToken: jest.fn() }))

const report = { id: 2, username: "Maya", body: "Table froze", createdAt: "2026-11-14T10:00:00Z", tableId: "t1", tableName: "Ruby" }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(getUserIdFromToken).mockResolvedValue("u1")
  jest.mocked(getRole).mockResolvedValue(1)
})

function asUser(req: request.Test) {
  return req.set("Authorization", "Bearer token")
}

describe("ReportRouter", () => {
  it("sends a report from a player at a table", async () => {
    jest.mocked(getTable).mockResolvedValue({ id: "t1", name: "Ruby" } as never)
    const res = await asUser(request(app).post("/reports")).send({ message: " Table froze ", tableId: "t1" })
    expect(res.status).toBe(201)
    expect(createReport).toHaveBeenCalledWith("u1", "Table froze", { id: "t1", name: "Ruby" })
  })

  it("rejects a blank or long report", async () => {
    expect((await asUser(request(app).post("/reports")).send({ message: "  " })).status).toBe(400)
    expect((await asUser(request(app).post("/reports")).send({ message: "a".repeat(501) })).status).toBe(400)
    expect(createReport).not.toHaveBeenCalled()
  })

  it("needs a signed in player", async () => {
    const res = await request(app).post("/reports").send({ message: "hi" })
    expect(res.status).toBe(401)
  })

  it("lists reports for admins only", async () => {
    jest.mocked(getReports).mockResolvedValue([])
    expect((await asUser(request(app).get("/admin/reports"))).status).toBe(200)
    jest.mocked(getRole).mockResolvedValue(0)
    expect((await asUser(request(app).get("/admin/reports"))).status).toBe(403)
  })

  it("shows the table's hands and chat up to the report", async () => {
    jest.mocked(getReport).mockResolvedValue(report)
    jest.mocked(getTableHands).mockResolvedValue([])
    jest.mocked(messagesBefore).mockResolvedValue([])
    const res = await asUser(request(app).get("/admin/reports/2"))
    expect(res.body).toEqual({ hands: [], chat: [] })
    expect(getTableHands).toHaveBeenCalledWith("t1", report.createdAt)
    expect(messagesBefore).toHaveBeenCalledWith("t1", report.createdAt, 100)
  })

  it("404s a missing report", async () => {
    jest.mocked(getReport).mockResolvedValue(null)
    expect((await asUser(request(app).get("/admin/reports/9"))).status).toBe(404)
  })

  it("files a reset request for a known email", async () => {
    jest.mocked(findUserIdByEmail).mockResolvedValue("u1")
    jest.mocked(hasOpenReset).mockResolvedValue(false)
    const res = await request(app).post("/reports/password-reset").send({ email: "maya@test.local" })
    expect(res.status).toBe(202)
    expect(createReport).toHaveBeenCalledWith("u1", "Asked for a password reset", null, "password_reset")
  })

  it("answers the same for an unknown email", async () => {
    jest.mocked(findUserIdByEmail).mockResolvedValue(null)
    const res = await request(app).post("/reports/password-reset").send({ email: "nobody@test.local" })
    expect(res.status).toBe(202)
    expect(createReport).not.toHaveBeenCalled()
  })

  it("lets an admin set the new password", async () => {
    jest.mocked(getReport).mockResolvedValue({ ...report, kind: "password_reset", status: "open", userId: "u9" } as never)
    jest.mocked(getEmail).mockResolvedValue("maya@test.local")
    const res = await asUser(request(app).post("/admin/reports/2/password")).send({ password: "secret12" })
    expect(res.body).toEqual({ email: "maya@test.local" })
    expect(setPassword).toHaveBeenCalledWith("u9", "secret12")
    expect(resolveReport).toHaveBeenCalledWith(2)
  })
})

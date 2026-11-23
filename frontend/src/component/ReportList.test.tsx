import { fireEvent, render, screen } from "@testing-library/react"
import ReportList from "@/component/ReportList"
import { fetchReports } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ fetchReports: jest.fn() }))
jest.mock("@/component/ReportModal", () => () => <p>Report details</p>)

const report = { id: 1, username: "Maya", body: "Table froze", createdAt: "2026-11-14T10:00:00Z", tableId: "t1", tableName: "Ruby", userId: "m1", kind: "report" as const, status: "open" as const }

beforeEach(() => jest.resetAllMocks())

describe("ReportList", () => {
  it("lists reports and opens one", async () => {
    jest.mocked(fetchReports).mockResolvedValue([report])
    render(<ReportList />)
    fireEvent.click(await screen.findByText("Table froze"))
    expect(screen.getByText("Report details")).toBeInTheDocument()
  })

  it("shows an empty state", async () => {
    jest.mocked(fetchReports).mockResolvedValue([])
    render(<ReportList />)
    expect(await screen.findByText("No reports yet.")).toBeInTheDocument()
  })

  it("shows when reports can't load", async () => {
    jest.mocked(fetchReports).mockRejectedValue(new Error("Failed to load reports (500)"))
    render(<ReportList />)
    expect(await screen.findByText("Failed to load reports (500)")).toBeInTheDocument()
  })
})

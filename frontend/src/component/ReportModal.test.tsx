import { fireEvent, render, screen } from "@testing-library/react"
import ReportModal from "@/component/ReportModal"
import { fetchReport, resetPassword } from "@/service/AdminService"
import { waitFor } from "@testing-library/react"

jest.mock("@/service/AdminService", () => ({ fetchReport: jest.fn(), resetPassword: jest.fn() }))

const report = { id: 1, username: "Maya", body: "Bob is cheating", createdAt: "2026-11-14T10:00:00Z", tableId: "t1", tableName: "Ruby", userId: "u1", kind: "report" as const, status: "open" as const }
const hand = {
  id: "m1",
  handNumber: 3,
  pot: 40,
  endedAt: "2026-11-14T09:59:00Z",
  players: [{ seat: 0, name: "Bob", dealt: [{ rank: 14 as const, suit: "hearts" as const }], final: null, handRank: "High Card", netResult: 20 }],
  actions: [{ seat: 0, type: "bet", amount: 20, cardsDiscarded: null }],
}
const chat = { id: 1, tableId: "t1", userId: "u2", name: "Bob", avatarUrl: null, body: "gg", createdAt: "2026-11-14T09:58:00Z" }

beforeEach(() => jest.resetAllMocks())

describe("ReportModal", () => {
  it("shows the hands, then the chat", async () => {
    jest.mocked(fetchReport).mockResolvedValue({ hands: [hand], chat: [chat] })
    render(<ReportModal report={report} onClose={jest.fn()} />)
    expect(await screen.findByText("Hand #3")).toBeInTheDocument()
    expect(screen.getByText("A♥")).toBeInTheDocument()
    expect(screen.getByText(/Bob won \$20/)).toBeInTheDocument()
    expect(screen.getByText("Before draw")).toBeInTheDocument()
    expect(screen.getByText("bet $20")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("tab", { name: "Chat (1)" }))
    expect(screen.getByText("gg")).toBeInTheDocument()
  })

  it("closes when clicking outside it", async () => {
    jest.mocked(fetchReport).mockResolvedValue({ hands: [], chat: [] })
    const onClose = jest.fn()
    render(<ReportModal report={report} onClose={onClose} />)
    fireEvent.click(await screen.findByText("Bob is cheating"))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("dialog").parentElement!)
    expect(onClose).toHaveBeenCalled()
  })

  it("shows when the report can't load", async () => {
    jest.mocked(fetchReport).mockRejectedValue(new Error("Failed to load report (500)"))
    render(<ReportModal report={report} onClose={jest.fn()} />)
    expect(await screen.findByText("Failed to load report (500)")).toBeInTheDocument()
  })

  it("points password resets to Players", () => {
    render(<ReportModal report={{ ...report, kind: "password_reset" as const, tableId: null, tableName: null }} onClose={jest.fn()} />)
    expect(screen.getByText(/from Players/)).toBeInTheDocument()
  })
})

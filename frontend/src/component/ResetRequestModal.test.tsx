import { act, fireEvent, render, screen } from "@testing-library/react"
import ResetRequestModal from "@/component/ResetRequestModal"
import { requestPasswordReset } from "@/service/ReportService"

jest.mock("@/service/ReportService", () => ({ requestPasswordReset: jest.fn() }))

describe("ResetRequestModal", () => {
  it("sends a reset request for the email", async () => {
    render(<ResetRequestModal email="maya@test.local" onClose={jest.fn()} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Send Request" })))
    expect(requestPasswordReset).toHaveBeenCalledWith("maya@test.local")
    expect(screen.getByText(/Request sent/)).toBeInTheDocument()
  })
})

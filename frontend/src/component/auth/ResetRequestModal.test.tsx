import { fireEvent, render, screen } from "@testing-library/react"
import ResetRequestModal from "@/component/auth/ResetRequestModal"
import { requestPasswordReset } from "@/service/ReportService"

jest.mock("@/service/ReportService", () => ({ requestPasswordReset: jest.fn() }))

beforeEach(() => jest.resetAllMocks())

describe("ResetRequestModal", () => {
  it("starts with the email already typed on the sign-in form", () => {
    render(<ResetRequestModal email="maya@test.local" onClose={jest.fn()} />)
    expect(screen.getByLabelText("Your email")).toHaveValue("maya@test.local")
  })

  it("sends the request, then says an admin will reset it without saying whether the account exists", async () => {
    jest.mocked(requestPasswordReset).mockResolvedValue()
    render(<ResetRequestModal email="" onClose={jest.fn()} />)
    fireEvent.change(screen.getByLabelText("Your email"), { target: { value: " maya@test.local " } })
    fireEvent.click(screen.getByRole("button", { name: "Request reset" }))
    expect(await screen.findByRole("status")).toHaveTextContent("If that email has an account")
    expect(requestPasswordReset).toHaveBeenCalledWith("maya@test.local")
  })

  it("shows why a request failed", async () => {
    jest.mocked(requestPasswordReset).mockRejectedValue(new Error("Too many requests. Try again in a few minutes"))
    render(<ResetRequestModal email="maya@test.local" onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Request reset" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many requests")
  })

  it("closes", () => {
    const onClose = jest.fn()
    render(<ResetRequestModal email="" onClose={onClose} />)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onClose).toHaveBeenCalled()
  })
})

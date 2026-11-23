import { act, fireEvent, render, screen } from "@testing-library/react"
import ResetPasswordModal from "@/component/ResetPasswordModal"
import { resetPassword } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ resetPassword: jest.fn() }))

const maya = { id: "u1", username: "Maya", balance: 500, handsPlayed: 0, banned: false }

describe("ResetPasswordModal", () => {
  it("sets a random password and shows it with the email", async () => {
    jest.mocked(resetPassword).mockResolvedValue({ email: "maya@test.local" })
    render(<ResetPasswordModal player={maya} onClose={jest.fn()} />)
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Reset Password" })))
    const password = jest.mocked(resetPassword).mock.calls[0]![1]
    expect(password).toHaveLength(10)
    expect(screen.getByText(password)).toBeInTheDocument()
    expect(screen.getByText("Send this to maya@test.local.")).toBeInTheDocument()
  })
})

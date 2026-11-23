import { act, fireEvent, render, screen } from "@testing-library/react"
import PasswordResetModal from "@/component/PasswordResetModal"
import { resetPassword } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ resetPassword: jest.fn() }))

const report = { id: 4, username: "Maya", body: "Asked for a password reset", createdAt: "2026-11-14T10:00:00Z", tableId: null, tableName: null, userId: "u1", kind: "password_reset" as const, status: "open" as const }

describe("PasswordResetModal", () => {
  it("sets the new password and shows who to send it to", async () => {
    jest.mocked(resetPassword).mockResolvedValue("maya@test.local")
    const onDone = jest.fn()
    render(<PasswordResetModal report={report} onClose={jest.fn()} onDone={onDone} />)
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "secret12" } })
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Set Password" })))
    expect(resetPassword).toHaveBeenCalledWith(4, "secret12")
    expect(screen.getByText("Password set. Send it to maya@test.local.")).toBeInTheDocument()
    expect(onDone).toHaveBeenCalled()
  })
})

import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdminMenu from "@/component/AdminMenu"
import { isAdmin } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ isAdmin: jest.fn() }))

describe("AdminMenu", () => {
  it("links admins to the admin page", async () => {
    jest.mocked(isAdmin).mockResolvedValue(true)
    render(<AdminMenu />)
    fireEvent.click(await screen.findByRole("button", { name: "Account menu" }))
    expect(screen.getByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin")
  })

  it("hides from everyone else", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<AdminMenu />)
    await waitFor(() => expect(isAdmin).toHaveBeenCalled())
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument()
  })

  it("hides when the check fails", async () => {
    jest.mocked(isAdmin).mockRejectedValue(new Error("down"))
    render(<AdminMenu />)
    await waitFor(() => expect(isAdmin).toHaveBeenCalled())
    expect(screen.queryByRole("button", { name: "Account menu" })).not.toBeInTheDocument()
  })
})

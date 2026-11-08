import { fireEvent, render, screen } from "@testing-library/react"
import ProfileMenu from "@/component/ProfileMenu"
import { isAdmin } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ isAdmin: jest.fn() }))

describe("ProfileMenu", () => {
  it("links admins to the admin page", async () => {
    jest.mocked(isAdmin).mockResolvedValue(true)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByRole("link", { name: "Admin" })).toHaveAttribute("href", "/admin")
  })

  it("shows coming soon to everyone else", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByText("Coming soon")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: "Admin" })).not.toBeInTheDocument()
  })

  it("treats a failed check as a normal player", async () => {
    jest.mocked(isAdmin).mockRejectedValue(new Error("down"))
    render(<ProfileMenu />)
    fireEvent.click(screen.getByRole("button", { name: "Profile menu" }))
    expect(await screen.findByText("Coming soon")).toBeInTheDocument()
  })
})

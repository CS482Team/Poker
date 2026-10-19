import { render, screen } from "@testing-library/react"
import Nav from "@/component/Nav"
import { usePathname } from "next/navigation"

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}))

describe("Nav", () => {
  it("hides the table link in the lobby", () => {
    jest.mocked(usePathname).mockReturnValue("/")
    render(<Nav />)
    expect(screen.queryByRole("link", { name: "Table" })).not.toBeInTheDocument()
  })

  it("shows the table link on a table page", () => {
    jest.mocked(usePathname).mockReturnValue("/table/abc")
    render(<Nav />)
    expect(screen.getByRole("link", { name: "Table" })).toBeInTheDocument()
  })
})

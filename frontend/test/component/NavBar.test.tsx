import { render, screen } from "@testing-library/react"
import Nav from "@/component/NavBar"
import { usePathname } from "next/navigation"
import { getCurrentTableId } from "@/service/CurrentTableService"

jest.mock("@/service/CurrentTableService", () => ({ getCurrentTableId: jest.fn() }))
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}))

describe("Nav", () => {
  beforeEach(() => jest.mocked(getCurrentTableId).mockReturnValue(null))

  it("hides the table link in the lobby", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard")
    render(<Nav />)
    expect(screen.queryByRole("link", { name: "Table" })).not.toBeInTheDocument()
  })

  it("links back to your table from the lobby", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard")
    jest.mocked(getCurrentTableId).mockReturnValue("abc")
    render(<Nav />)
    expect(screen.getByRole("link", { name: "Table" })).toHaveAttribute("href", "/table/abc")
  })

  it("shows the table link on a table page", () => {
    jest.mocked(usePathname).mockReturnValue("/table/abc")
    jest.mocked(getCurrentTableId).mockReturnValue("abc")
    render(<Nav />)
    expect(screen.getByRole("link", { name: "Table" })).toBeInTheDocument()
  })
})

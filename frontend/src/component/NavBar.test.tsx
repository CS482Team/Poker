import { act, render, screen } from "@testing-library/react"
import Nav from "@/component/NavBar"
import { usePathname } from "next/navigation"
import { getCurrentTableId } from "@/service/CurrentTableService"
import { watchTable } from "@/service/SocketService"

jest.mock("@/component/ProfileMenu", () => () => null)
jest.mock("@/service/CurrentTableService", () => ({ getCurrentTableId: jest.fn() }))
jest.mock("@/service/SocketService", () => ({ watchTable: jest.fn(() => jest.fn()) }))
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(),
}))

describe("Nav", () => {
  beforeEach(() => jest.mocked(getCurrentTableId).mockReturnValue(null))

  it("hides the table tab when not at a table", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard")
    render(<Nav />)
    expect(screen.queryByText("Table")).not.toBeInTheDocument()
  })

  it("links back to your table from the lobby", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard")
    jest.mocked(getCurrentTableId).mockReturnValue("abc")
    render(<Nav />)
    expect(screen.getByRole("link", { name: "Table" })).toHaveAttribute("href", "/table/abc")
  })

  it("shows the Hearts & Diamonds logo, linking to the lobby", () => {
    jest.mocked(usePathname).mockReturnValue("/table/abc")
    render(<Nav />)
    expect(screen.getByRole("link", { name: "Hearts & Diamonds, back to the lobby" })).toHaveAttribute("href", "/dashboard")
  })

  it("no longer has the dev user switch, now that people sign in", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard")
    render(<Nav />)
    expect(screen.queryByLabelText("Dev user")).not.toBeInTheDocument()
  })

  it("shows the table link on a table page", () => {
    jest.mocked(usePathname).mockReturnValue("/table/abc")
    jest.mocked(getCurrentTableId).mockReturnValue("abc")
    render(<Nav />)
    expect(screen.getByRole("link", { name: "Table" })).toBeInTheDocument()
  })

  it("flashes a dot on the table tab when it's your turn", () => {
    jest.mocked(usePathname).mockReturnValue("/dashboard")
    jest.mocked(getCurrentTableId).mockReturnValue("abc")
    render(<Nav />)
    act(() => jest.mocked(watchTable).mock.lastCall![3]({ toActSeat: 1, you: { seat: 1 } } as never))
    expect(screen.getByRole("img", { name: "Your turn" })).toBeInTheDocument()
  })
})

import { render, screen, waitFor } from "@testing-library/react"
import AdminPanel from "@/component/admin/AdminPanel"
import { isAdmin } from "@/service/AdminService"

const mockRouter = { replace: jest.fn() }

jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }))
jest.mock("@/service/AdminService", () => ({ isAdmin: jest.fn() }))
jest.mock("@/component/admin/AdManager", () => () => <p>Ad list</p>)
jest.mock("@/component/admin/PlayerHistory", () => () => <p>Player list</p>)
jest.mock("@/component/admin/ReportList", () => () => <p>Report list</p>)
jest.mock("@/component/admin/PromoManager", () => () => <p>Promo</p>)

beforeEach(() => jest.resetAllMocks())

describe("AdminPanel", () => {
  it("sends non admins to the lobby", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<AdminPanel />)
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard"))
  })

  it("shows ads, players and reports", async () => {
    jest.mocked(isAdmin).mockResolvedValue(true)
    render(<AdminPanel />)
    expect(await screen.findByText("Ad list")).toBeInTheDocument()
    expect(screen.getByText("Player list")).toBeInTheDocument()
    expect(screen.getByText("Report list")).toBeInTheDocument()
  })
})

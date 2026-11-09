import { render, screen, waitFor } from "@testing-library/react"
import AdminPanel from "@/component/AdminPanel"
import { isAdmin } from "@/service/AdminService"

const mockRouter = { replace: jest.fn() }

jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }))
jest.mock("@/service/AdminService", () => ({ isAdmin: jest.fn() }))
jest.mock("@/component/AdManager", () => () => <p>Ad list</p>)
jest.mock("@/component/PlayerHistory", () => () => <p>Player list</p>)

beforeEach(() => jest.resetAllMocks())

describe("AdminPanel", () => {
  it("sends non admins to the lobby", async () => {
    jest.mocked(isAdmin).mockResolvedValue(false)
    render(<AdminPanel />)
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard"))
  })

  it("shows ads and players", async () => {
    jest.mocked(isAdmin).mockResolvedValue(true)
    render(<AdminPanel />)
    expect(await screen.findByText("Ad list")).toBeInTheDocument()
    expect(screen.getByText("Player list")).toBeInTheDocument()
  })
})

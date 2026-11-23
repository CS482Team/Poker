import { act, render, screen } from "@testing-library/react"
import BalanceDisplay from "@/component/layout/BalanceDisplay"
import { announceBalance, fetchBalance } from "@/service/BalanceService"

jest.mock("@/app/supabaseClient", () => ({
  supabase: { auth: { getSession: async () => ({ data: { session: { access_token: "token" } } }) } },
}))

jest.mock("next/navigation", () => ({ usePathname: () => "/shop" }))
jest.mock("@/service/UserService", () => ({ getCurrentUserId: () => "u1" }))
jest.mock("@/service/BalanceService", () => {
  const actual = jest.requireActual("@/service/BalanceService")
  return { ...actual, fetchBalance: jest.fn() }
})

describe("BalanceDisplay", () => {
  it("shows the player's chips", async () => {
    jest.mocked(fetchBalance).mockResolvedValue(1000)
    render(<BalanceDisplay />)
    expect(await screen.findByText("$1,000")).toBeInTheDocument()
  })

  it("updates straight away when a purchase announces a new balance", async () => {
    jest.mocked(fetchBalance).mockResolvedValue(1000)
    render(<BalanceDisplay />)
    await screen.findByText("$1,000")
    act(() => announceBalance(850))
    expect(screen.getByText("$850")).toBeInTheDocument()
  })
})

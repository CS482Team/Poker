import { fireEvent, render, screen } from "@testing-library/react"
import DailyRewards from "@/component/lobby/DailyRewards"
import { announceBalance } from "@/service/BalanceService"
import { claimDailyReward, fetchDailyReward } from "@/service/RewardService"

jest.mock("@/service/RewardService", () => ({ fetchDailyReward: jest.fn(), claimDailyReward: jest.fn() }))
jest.mock("@/service/BalanceService", () => ({ announceBalance: jest.fn() }))

beforeEach(() => jest.resetAllMocks())

describe("DailyRewards", () => {
  it("claims today's reward", async () => {
    jest.mocked(fetchDailyReward)
      .mockResolvedValueOnce({ day: 2, canClaim: true, nextClaimAt: null })
      .mockResolvedValueOnce({ day: 3, canClaim: false, nextClaimAt: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
    jest.mocked(claimDailyReward).mockResolvedValue({ day: 2, reward: 200, balance: 1200 })
    render(<DailyRewards />)
    fireEvent.click(await screen.findByRole("button", { name: "Claim 200 chips" }))
    expect(await screen.findByText(/^\d+[hm]$/)).toBeInTheDocument()
    expect(announceBalance).toHaveBeenCalledWith(1200)
  })

  it("shows errors", async () => {
    jest.mocked(fetchDailyReward).mockRejectedValue(new Error("Failed to load daily reward (500)"))
    render(<DailyRewards />)
    expect(await screen.findByText("Failed to load daily reward (500)")).toBeInTheDocument()
  })
})

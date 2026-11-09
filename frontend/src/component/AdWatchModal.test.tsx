import { act, fireEvent, render, screen } from "@testing-library/react"
import AdWatchModal from "@/component/AdWatchModal"
import { claimAd, startWatching } from "@/service/AdService"

jest.mock("@/service/AdService", () => ({ startWatching: jest.fn(), claimAd: jest.fn() }))

const ad = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }

beforeEach(() => {
  jest.resetAllMocks()
  jest.useFakeTimers()
})

afterEach(() => jest.useRealTimers())

async function renderStarted() {
  jest.mocked(startWatching).mockResolvedValue()
  render(<AdWatchModal ad={ad} onClose={jest.fn()} />)
  await act(async () => {})
}

async function waitSeconds(count: number) {
  for (let i = 0; i < count; i++) await act(async () => jest.advanceTimersByTime(1000))
}

describe("AdWatchModal", () => {
  it("pays out after ten seconds", async () => {
    jest.mocked(claimAd).mockResolvedValue(500)
    await renderStarted()
    await waitSeconds(9)
    expect(claimAd).not.toHaveBeenCalled()
    await waitSeconds(1)
    expect(claimAd).toHaveBeenCalledWith("a1")
    expect(screen.getByText("You earned $500!")).toBeInTheDocument()
    await waitSeconds(5)
    expect(screen.getByText("Watched")).toBeInTheDocument()
    expect(claimAd).toHaveBeenCalledTimes(1)
  })

  it("can be closed at any time", async () => {
    const onClose = jest.fn()
    jest.mocked(startWatching).mockResolvedValue()
    render(<AdWatchModal ad={ad} onClose={onClose} />)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onClose).toHaveBeenCalled()
  })

  it("shows why it can't start", async () => {
    jest.mocked(startWatching).mockRejectedValue(new Error("Log in to earn chips"))
    render(<AdWatchModal ad={ad} onClose={jest.fn()} />)
    expect(await screen.findByText("Log in to earn chips")).toBeInTheDocument()
  })

  it("shows a failed claim", async () => {
    jest.mocked(claimAd).mockRejectedValue(new Error("Failed to claim reward (409)"))
    await renderStarted()
    await waitSeconds(10)
    expect(screen.getByText("Failed to claim reward (409)")).toBeInTheDocument()
  })
})

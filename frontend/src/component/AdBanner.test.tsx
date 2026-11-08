import { render, screen } from "@testing-library/react"
import AdBanner, { EXTERNAL_AD } from "@/component/AdBanner"
import { fetchActiveAds } from "@/service/AdService"

jest.mock("@/service/AdService", () => ({ fetchActiveAds: jest.fn() }))

const ad = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }

afterEach(() => jest.restoreAllMocks())

describe("AdBanner", () => {
  it("shows a random active ad", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([ad])
    jest.spyOn(Math, "random").mockReturnValue(0.9)
    render(<AdBanner />)
    expect(await screen.findByText("Weekend bonus")).toBeInTheDocument()
    expect(screen.getByText("Advertisement")).toBeInTheDocument()
  })

  it("can show the external ad", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([ad])
    jest.spyOn(Math, "random").mockReturnValue(0)
    render(<AdBanner />)
    expect(await screen.findByText(EXTERNAL_AD)).toBeInTheDocument()
  })

  it("falls back to the external ad when loading fails", async () => {
    jest.mocked(fetchActiveAds).mockRejectedValue(new Error("down"))
    render(<AdBanner />)
    expect(await screen.findByText(EXTERNAL_AD)).toBeInTheDocument()
  })
})

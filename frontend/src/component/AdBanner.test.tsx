import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdBanner from "@/component/AdBanner"
import { fetchActiveAds } from "@/service/AdService"
import { fetchActiveEvent } from "@/service/EventService"

jest.mock("@/service/AdService", () => ({ fetchActiveAds: jest.fn() }))
jest.mock("@/service/EventService", () => ({ fetchActiveEvent: jest.fn() }))
jest.mock("@/component/AdWatchModal", () => () => <p>Watching</p>)

const ad = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }

beforeEach(() => jest.mocked(fetchActiveEvent).mockResolvedValue(null))
afterEach(() => jest.restoreAllMocks())

describe("AdBanner", () => {
  it("shows a random active ad", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([{ ...ad, id: "a0", title: "Other" }, ad])
    jest.spyOn(Math, "random").mockReturnValue(0.9)
    render(<AdBanner />)
    expect(await screen.findByText("Weekend bonus")).toBeInTheDocument()
    expect(screen.getByText("Advertisement")).toBeInTheDocument()
  })

  it("opens the ad when clicked", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([ad])
    render(<AdBanner />)
    fireEvent.click(await screen.findByRole("button", { name: /Weekend bonus/ }))
    expect(screen.getByText("Watching")).toBeInTheDocument()
  })

  it("shows the promo event before the ad", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([ad])
    jest.mocked(fetchActiveEvent).mockResolvedValue({ id: "e1", name: "Double Chips", multiplier: 2, expiresAt: "2999-01-01" })
    render(<AdBanner />)
    expect(await screen.findByText("2X Chip Multiplier")).toBeInTheDocument()
    expect(screen.getByText("Special Event")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: /Chip Multiplier/ }))
    expect(screen.getByRole("dialog", { name: "Event" })).toBeInTheDocument()
  })

  it("shows nothing when ads can't load", async () => {
    jest.mocked(fetchActiveAds).mockRejectedValue(new Error("down"))
    jest.mocked(fetchActiveEvent).mockRejectedValue(new Error("down"))
    const { container } = render(<AdBanner />)
    await waitFor(() => expect(fetchActiveAds).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})

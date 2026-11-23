import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdBanner from "@/component/ads/AdBanner"
import { fetchActiveAds } from "@/service/AdService"
import { fetchActiveEvent } from "@/service/EventService"

jest.mock("@/service/AdService", () => ({ fetchActiveAds: jest.fn() }))
jest.mock("@/service/EventService", () => ({ fetchActiveEvent: jest.fn() }))
jest.mock("@/component/ads/AdWatchModal", () => ({ ad }: { ad: { title: string } }) => <p>Watching {ad.title}</p>)

const ad = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }
const other = { ...ad, id: "a2", title: "Other" }

beforeEach(() => jest.mocked(fetchActiveEvent).mockResolvedValue(null))
afterEach(() => jest.restoreAllMocks())

describe("AdBanner", () => {
  it("shows two ads", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([ad, other])
    jest.spyOn(Math, "random").mockReturnValue(0)
    render(<AdBanner />)
    expect(await screen.findByText("Weekend bonus")).toBeInTheDocument()
    expect(screen.getByText("Other")).toBeInTheDocument()
  })

  it("opens an ad when clicked", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([ad, other])
    render(<AdBanner />)
    fireEvent.click(await screen.findByRole("button", { name: /Other/ }))
    expect(screen.getByText("Watching Other")).toBeInTheDocument()
  })

  it("shows the special event", async () => {
    jest.mocked(fetchActiveAds).mockResolvedValue([])
    jest.mocked(fetchActiveEvent).mockResolvedValue({ id: "e1", name: "Double Chips", multiplier: 2, expiresAt: "2999-01-01" })
    render(<AdBanner />)
    fireEvent.click(await screen.findByRole("button", { name: /2X Chip Multiplier/ }))
    expect(screen.getByRole("dialog", { name: "Event" })).toBeInTheDocument()
  })

  it("shows nothing when nothing loads", async () => {
    jest.mocked(fetchActiveAds).mockRejectedValue(new Error("down"))
    jest.mocked(fetchActiveEvent).mockRejectedValue(new Error("down"))
    const { container } = render(<AdBanner />)
    await waitFor(() => expect(fetchActiveAds).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})

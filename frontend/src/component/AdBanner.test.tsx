import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdBanner from "@/component/AdBanner"
import { fetchActiveAds } from "@/service/AdService"

jest.mock("@/service/AdService", () => ({ fetchActiveAds: jest.fn() }))
jest.mock("@/component/AdWatchModal", () => () => <p>Watching</p>)

const ad = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }

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

  it("shows nothing when ads can't load", async () => {
    jest.mocked(fetchActiveAds).mockRejectedValue(new Error("down"))
    const { container } = render(<AdBanner />)
    await waitFor(() => expect(fetchActiveAds).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })
})

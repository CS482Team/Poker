import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdManager from "@/component/AdManager"
import { createAd, deleteAd, fetchAds, setAdActive } from "@/service/AdminService"

const mockRouter = { replace: jest.fn() }

jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}))

jest.mock("@/service/AdminService", () => ({
  createAd: jest.fn(),
  deleteAd: jest.fn(),
  fetchAds: jest.fn(),
  setAdActive: jest.fn(),
}))

const activeAd = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(fetchAds).mockResolvedValue([activeAd])
})

describe("AdManager", () => {
  it("sends non admins to the lobby", async () => {
    jest.mocked(fetchAds).mockRejectedValue(new Error("403"))
    render(<AdManager />)
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/dashboard"))
  })

  it("lists ads", async () => {
    render(<AdManager />)
    expect(await screen.findByText("Weekend bonus")).toBeInTheDocument()
    expect(screen.getByText("Active")).toBeInTheDocument()
  })

  it("saves an ad", async () => {
    render(<AdManager />)
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "New ad" } })
    fireEvent.change(screen.getByLabelText("Reward (chips)"), { target: { value: "250" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(createAd).toHaveBeenCalledWith({ title: "New ad", rewardAmount: 250 }))
    await waitFor(() => expect(screen.getByLabelText("Title")).toHaveValue(""))
  })

  it("pauses an active ad", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Pause" }))
    await waitFor(() => expect(setAdActive).toHaveBeenCalledWith("a1", false))
  })

  it("activates an inactive ad", async () => {
    jest.mocked(fetchAds).mockResolvedValue([{ ...activeAd, active: false }])
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Activate" }))
    await waitFor(() => expect(setAdActive).toHaveBeenCalledWith("a1", true))
  })

  it("deletes an ad", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete" }))
    await waitFor(() => expect(deleteAd).toHaveBeenCalledWith("a1"))
  })

  it("shows save, update and delete errors", async () => {
    jest.mocked(createAd).mockRejectedValue(new Error("Save failed"))
    jest.mocked(setAdActive).mockRejectedValue(new Error("Update failed"))
    jest.mocked(deleteAd).mockRejectedValue(new Error("Delete failed"))
    render(<AdManager />)
    fireEvent.change(await screen.findByLabelText("Title"), { target: { value: "New ad" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Save failed")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Pause" }))
    expect(await screen.findByText("Update failed")).toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    expect(await screen.findByText("Delete failed")).toBeInTheDocument()
  })
})

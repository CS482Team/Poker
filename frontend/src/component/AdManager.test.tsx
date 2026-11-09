import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdManager from "@/component/AdManager"
import { createAd, deleteAd, editAd, fetchAds, setAdActive } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({
  createAd: jest.fn(),
  deleteAd: jest.fn(),
  editAd: jest.fn(),
  fetchAds: jest.fn(),
  setAdActive: jest.fn(),
}))

const activeAd = { id: "a1", title: "Weekend bonus", rewardAmount: 500, active: true }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(fetchAds).mockResolvedValue([activeAd])
})

describe("AdManager", () => {
  it("shows when ads can't load", async () => {
    jest.mocked(fetchAds).mockRejectedValue(new Error("Failed to load ads (500)"))
    render(<AdManager />)
    expect(await screen.findByText("Failed to load ads (500)")).toBeInTheDocument()
  })

  it("lists ads", async () => {
    render(<AdManager />)
    expect(await screen.findByText("Weekend bonus")).toBeInTheDocument()
    expect(screen.getByRole("switch")).toHaveAttribute("aria-checked", "true")
  })

  it("shows an empty state", async () => {
    jest.mocked(fetchAds).mockResolvedValue([])
    render(<AdManager />)
    expect(await screen.findByText("No ads yet.")).toBeInTheDocument()
  })

  it("creates an ad in a modal", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "New Ad" }))
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New ad" } })
    fireEvent.click(screen.getByRole("button", { name: "Create" }))
    await waitFor(() => expect(screen.queryByRole("button", { name: "Create" })).not.toBeInTheDocument())
    expect(createAd).toHaveBeenCalledWith({ title: "New ad", rewardAmount: 500 })
  })

  it("edits an ad in place", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit ad" }))
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Better bonus" } })
    fireEvent.change(screen.getByLabelText("Reward"), { target: { value: "750" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(editAd).toHaveBeenCalledWith("a1", { title: "Better bonus", rewardAmount: 750 }))
  })

  it("saves with enter and cancels with escape", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit ad" }))
    fireEvent.keyDown(screen.getByLabelText("Title"), { key: "Enter" })
    await waitFor(() => expect(editAd).toHaveBeenCalled())
    fireEvent.click(await screen.findByRole("button", { name: "Edit ad" }))
    fireEvent.keyDown(screen.getByLabelText("Title"), { key: "Escape" })
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument()
  })

  it("cancels an edit", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit ad" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.queryByLabelText("Title")).not.toBeInTheDocument()
  })

  it("toggles an ad", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("switch"))
    await waitFor(() => expect(setAdActive).toHaveBeenCalledWith("a1", false))
  })

  it("asks before deleting", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete ad" }))
    expect(deleteAd).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole("button", { name: "Delete" }))
    await waitFor(() => expect(deleteAd).toHaveBeenCalledWith("a1"))
  })

  it("can back out of a delete", async () => {
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("button", { name: "Delete ad" }))
    fireEvent.click(screen.getByRole("button", { name: "Keep ad" }))
    expect(screen.getByRole("button", { name: "Delete ad" })).toBeInTheDocument()
  })

  it("shows errors", async () => {
    jest.mocked(setAdActive).mockRejectedValue(new Error("Update failed"))
    render(<AdManager />)
    fireEvent.click(await screen.findByRole("switch"))
    expect(await screen.findByText("Update failed")).toBeInTheDocument()
  })
})

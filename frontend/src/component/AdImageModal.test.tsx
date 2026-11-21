import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import AdImageModal from "@/component/AdImageModal"
import { editAd } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ editAd: jest.fn() }))

const ad = { id: "a1", title: "Bonus", rewardAmount: 500, active: true, imageUrl: "data:image/png;base64,x" }

beforeEach(() => jest.resetAllMocks())

describe("AdImageModal", () => {
  it("removes the image", async () => {
    const onSaved = jest.fn()
    render(<AdImageModal ad={ad} onCancel={jest.fn()} onSaved={onSaved} />)
    fireEvent.click(screen.getByRole("button", { name: "Remove" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(editAd).toHaveBeenCalledWith("a1", { title: "Bonus", rewardAmount: 500, imageUrl: null })
  })

  it("shows the error", async () => {
    jest.mocked(editAd).mockRejectedValue(new Error("Failed to save ad (413)"))
    render(<AdImageModal ad={ad} onCancel={jest.fn()} onSaved={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByText("Failed to save ad (413)")).toBeInTheDocument()
  })
})

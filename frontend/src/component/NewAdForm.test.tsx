import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import NewAdForm from "@/component/NewAdForm"
import { createAd } from "@/service/AdminService"

jest.mock("@/service/AdminService", () => ({ createAd: jest.fn() }))

beforeEach(() => jest.resetAllMocks())

function submit() {
  fireEvent.change(screen.getByLabelText("Title"), { target: { value: "New ad" } })
  fireEvent.change(screen.getByLabelText("Reward (chips)"), { target: { value: "250" } })
  fireEvent.click(screen.getByRole("button", { name: "Create" }))
}

describe("NewAdForm", () => {
  it("creates the ad", async () => {
    const onCreated = jest.fn()
    render(<NewAdForm onCancel={jest.fn()} onCreated={onCreated} />)
    submit()
    await waitFor(() => expect(onCreated).toHaveBeenCalled())
    expect(createAd).toHaveBeenCalledWith({ title: "New ad", rewardAmount: 250 })
  })

  it("shows the error", async () => {
    jest.mocked(createAd).mockRejectedValue(new Error("Failed"))
    render(<NewAdForm onCancel={jest.fn()} onCreated={jest.fn()} />)
    submit()
    expect(await screen.findByText("Failed")).toBeInTheDocument()
  })

  it("cancels", () => {
    const onCancel = jest.fn()
    render(<NewAdForm onCancel={onCancel} onCreated={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalled()
  })
})

import { fireEvent, render, screen } from "@testing-library/react"
import PromoManager from "@/component/admin/PromoManager"
import { createEvent, endEvent, fetchActiveEvent } from "@/service/EventService"

jest.mock("@/service/EventService", () => ({ fetchActiveEvent: jest.fn(), createEvent: jest.fn(), endEvent: jest.fn() }))

const event = { id: "e1", name: "Double Chips", multiplier: 2, expiresAt: "2999-01-01T12:00:00Z" }

beforeEach(() => jest.resetAllMocks())

describe("PromoManager", () => {
  it("starts an event", async () => {
    jest.mocked(fetchActiveEvent).mockResolvedValueOnce(null).mockResolvedValueOnce(event)
    render(<PromoManager />)
    fireEvent.change(await screen.findByLabelText("Name"), { target: { value: "Double Chips" } })
    fireEvent.click(screen.getByRole("button", { name: "More multiplier" }))
    fireEvent.click(screen.getByRole("button", { name: "Start" }))
    expect(await screen.findByText("Double Chips")).toBeInTheDocument()
    expect(screen.getByText("2X")).toBeInTheDocument()
    expect(createEvent).toHaveBeenCalledWith("Double Chips", 2.1, 3)
  })

  it("ends the running event", async () => {
    jest.mocked(fetchActiveEvent).mockResolvedValueOnce(event).mockResolvedValueOnce(null)
    render(<PromoManager />)
    fireEvent.click(await screen.findByRole("button", { name: "End" }))
    expect(await screen.findByRole("button", { name: "Start" })).toBeInTheDocument()
    expect(endEvent).toHaveBeenCalledWith("e1")
  })
})

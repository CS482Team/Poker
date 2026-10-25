import { fireEvent, render, screen } from "@testing-library/react"
import ActionBar from "@/component/ActionBar"

const onAction = jest.fn()

beforeEach(() => jest.clearAllMocks())

describe("ActionBar", () => {
  it("calls and raises", () => {
    render(<ActionBar legalActions={[{ type: "fold" }, { type: "call", amount: 5 }, { type: "raise", min: 10, max: 50 }]} busy={false} status="" onAction={onAction} />)
    fireEvent.click(screen.getByRole("button", { name: "Call 5" }))
    fireEvent.click(screen.getByRole("button", { name: "Raise to 10" }))
    expect(onAction).toHaveBeenCalledWith("call")
    expect(onAction).toHaveBeenCalledWith("raise", 10)
  })

  it("bets all-in from the slider", () => {
    render(<ActionBar legalActions={[{ type: "check" }, { type: "bet", min: 5, max: 20 }]} busy={false} status="" onAction={onAction} />)
    fireEvent.change(screen.getByLabelText("Bet amount"), { target: { value: "20" } })
    fireEvent.click(screen.getByRole("button", { name: "All-in 20" }))
    expect(onAction).toHaveBeenCalledWith("bet", 20)
  })

  it("disables everything when it isn't your turn", () => {
    render(<ActionBar legalActions={[]} busy={false} status="Maya to act" onAction={onAction} />)
    expect(screen.getByRole("button", { name: "Fold" })).toBeDisabled()
    expect(screen.getByText("Maya to act")).toBeInTheDocument()
  })
})

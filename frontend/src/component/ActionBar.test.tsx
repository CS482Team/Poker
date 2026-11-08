import { fireEvent, render, screen } from "@testing-library/react"
import ActionBar from "@/component/ActionBar"
import type { LegalAction } from "@shared/Actions"

const onAction = jest.fn()

beforeEach(() => jest.clearAllMocks())

/* a bet of $min to $max is open, as at the start of a betting round */
function renderBet(min: number, max: number) {
  const legal: LegalAction[] = [{ type: "fold" }, { type: "check" }, { type: "bet", min, max }]
  render(<ActionBar legalActions={legal} busy={false} status="" onAction={onAction} />)
}

function slide(step: number) {
  fireEvent.change(screen.getByLabelText("Bet size"), { target: { value: String(step) } })
}

function typeAmount(text: string) {
  fireEvent.change(screen.getByLabelText("Bet amount"), { target: { value: text } })
}

describe("ActionBar", () => {
  it("calls and raises", () => {
    render(<ActionBar legalActions={[{ type: "fold" }, { type: "call", amount: 5 }, { type: "raise", min: 10, max: 50 }]} busy={false} status="" onAction={onAction} />)
    fireEvent.click(screen.getByRole("button", { name: "Call $5" }))
    fireEvent.click(screen.getByRole("button", { name: "Raise to $10" }))
    expect(onAction).toHaveBeenCalledWith("call")
    expect(onAction).toHaveBeenCalledWith("raise", 10)
  })

  it("bets all-in from the end of the slider", () => {
    renderBet(5, 20) // steps: 5, 10, 15, 20
    slide(3)
    fireEvent.click(screen.getByRole("button", { name: "All-in $20" }))
    expect(onAction).toHaveBeenCalledWith("bet", 20)
  })

  it("moves the slider in $5 steps, keeping the minimum and all-in reachable", () => {
    renderBet(2, 63) // steps: 2, 5, 10, ... 60, 63
    expect(screen.getByRole("button", { name: "Bet $2" })).toBeInTheDocument()
    slide(1)
    expect(screen.getByRole("button", { name: "Bet $5" })).toBeInTheDocument()
    slide(2)
    expect(screen.getByRole("button", { name: "Bet $10" })).toBeInTheDocument()
    slide(12)
    expect(screen.getByRole("button", { name: "Bet $60" })).toBeInTheDocument()
    slide(13)
    expect(screen.getByRole("button", { name: "All-in $63" })).toBeInTheDocument()
  })

  it("tells screen readers the slider's amount, not its step number", () => {
    renderBet(2, 63)
    slide(2)
    expect(screen.getByLabelText("Bet size")).toHaveAttribute("aria-valuetext", "$10")
  })

  it("keeps the amount box in step with the slider", () => {
    renderBet(2, 63)
    slide(3)
    expect(screen.getByLabelText("Bet amount")).toHaveValue(15)
  })

  it("bets a typed amount, even one off the $5 steps", () => {
    renderBet(2, 63)
    typeAmount("23")
    fireEvent.click(screen.getByRole("button", { name: "Bet $23" }))
    expect(onAction).toHaveBeenCalledWith("bet", 23)
  })

  it("places the typed bet with Enter", () => {
    renderBet(2, 63)
    typeAmount("40")
    fireEvent.keyDown(screen.getByLabelText("Bet amount"), { key: "Enter" })
    expect(onAction).toHaveBeenCalledWith("bet", 40)
  })

  it("won't bet an amount outside what's allowed, and says the range", () => {
    renderBet(2, 63)
    typeAmount("100")
    expect(screen.getByText("Enter $2 to $63")).toBeInTheDocument()
    const bet = screen.getByRole("button", { name: /Bet|All-in/ })
    expect(bet).toBeDisabled()
    fireEvent.keyDown(screen.getByLabelText("Bet amount"), { key: "Enter" })
    expect(onAction).not.toHaveBeenCalled()
  })

  it("won't bet part of a chip", () => {
    renderBet(2, 63)
    typeAmount("7.5")
    expect(screen.getByRole("button", { name: /Bet|All-in/ })).toBeDisabled()
  })

  it("goes back to the last good amount when you leave the box", () => {
    renderBet(2, 63)
    typeAmount("23")
    typeAmount("999")
    fireEvent.blur(screen.getByLabelText("Bet amount"))
    expect(screen.getByLabelText("Bet amount")).toHaveValue(23)
    expect(screen.getByRole("button", { name: "Bet $23" })).toBeEnabled()
  })

  it("disables everything when it isn't your turn", () => {
    render(<ActionBar legalActions={[]} busy={false} status="Maya to act" onAction={onAction} />)
    expect(screen.getByRole("button", { name: "Fold" })).toBeDisabled()
    expect(screen.getByLabelText("Bet amount")).toBeDisabled()
    expect(screen.getByText("Maya to act")).toBeInTheDocument()
  })
})

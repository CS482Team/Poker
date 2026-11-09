import { act, render, screen } from "@testing-library/react"
import Dots from "@/component/Dots"

describe("Dots", () => {
  it("cycles from one to three dots", () => {
    jest.useFakeTimers()
    render(<Dots />)
    expect(screen.getByText(".")).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(1000))
    expect(screen.getByText("...")).toBeInTheDocument()
    act(() => jest.advanceTimersByTime(500))
    expect(screen.getByText(".")).toBeInTheDocument()
    jest.useRealTimers()
  })
})

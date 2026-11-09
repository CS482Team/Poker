import { render, screen } from "@testing-library/react"
import EmptySeat from "@/component/EmptySeat"

describe("EmptySeat", () => {
  it("labels the seat as open", () => {
    render(<EmptySeat />)
    expect(screen.getByText("Open seat")).toBeInTheDocument()
  })
})

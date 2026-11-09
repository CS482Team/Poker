import { render, screen } from "@testing-library/react"
import EmptySeat from "@/component/EmptySeat"

describe("EmptySeat", () => {
  it("labels the seat as open", () => {
    render(<EmptySeat />)
    expect(screen.getByRole("img", { name: "Open seat" })).toBeInTheDocument()
  })
})

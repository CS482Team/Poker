import { render, screen } from "@testing-library/react"
import Home from "./page"

describe("Home", () => {
  it("shows the title", () => {
    render(<Home />)
    expect(screen.getByRole("heading", { name: "Poker" })).toBeInTheDocument()
  })
})

import { render, screen } from "@testing-library/react"
import Home from "./page"

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

jest.mock("@/service/TableService", () => ({
  fetchTables: jest.fn().mockResolvedValue([]),
}))

jest.mock("@/service/SocketService", () => ({
  watchTables: jest.fn(() => jest.fn()),
}))

jest.mock("@/service/CurrentTableService", () => ({
  getCurrentTableId: jest.fn(),
}))

describe("Home", () => {
  it("shows the lobby", async () => {
    render(<Home />)
    expect(await screen.findByRole("heading", { name: /Tables/ })).toBeInTheDocument()
  })
})

import { fireEvent, render, screen } from "@testing-library/react"
import NewTableForm from "@/component/NewTableForm"
import { createTable, joinTable } from "@/service/TableService"
import { fetchUsername } from "@/service/UserService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/TableService", () => ({
  createTable: jest.fn(),
  joinTable: jest.fn(),
}))

jest.mock("@/service/UserService", () => ({
  getCurrentUserId: () => "u1",
  fetchUsername: jest.fn(),
}))

jest.mock("@/service/CurrentTableService", () => ({
  setCurrentTableId: jest.fn(),
}))

function submit() {
  fireEvent.change(screen.getByLabelText("Table Name"), { target: { value: "My Table" } })
  fireEvent.click(screen.getByRole("button", { name: "Create" }))
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(fetchUsername).mockResolvedValue("Maya")
})

describe("NewTableForm", () => {
  it("creates, joins and opens the table", async () => {
    jest.mocked(createTable).mockResolvedValue("new-id")
    render(<NewTableForm onCancel={jest.fn()} />)
    fireEvent.click(screen.getByRole("button", { name: "More bots" }))
    fireEvent.click(screen.getByRole("button", { name: "More bots" }))
    submit()
    await screen.findByRole("button", { name: "Create" })
    expect(createTable).toHaveBeenCalledWith(expect.objectContaining({ botCount: 2 }))
    expect(joinTable).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith("/table/new-id")
  })

  it("shows the error", async () => {
    jest.mocked(createTable).mockRejectedValue(new Error("Failed"))
    render(<NewTableForm onCancel={jest.fn()} />)
    submit()
    expect(await screen.findByText("Failed")).toBeInTheDocument()
  })

  it("cancels", () => {
    const onCancel = jest.fn()
    render(<NewTableForm onCancel={onCancel} />)
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onCancel).toHaveBeenCalled()
  })

  it("names the table after the user", async () => {
    render(<NewTableForm onCancel={jest.fn()} />)
    expect(await screen.findByDisplayValue("Maya's room")).toBeInTheDocument()
  })

  it("lowers the bots when the seats are lowered", () => {
    render(<NewTableForm onCancel={jest.fn()} />)
    for (let i = 0; i < 5; i++) fireEvent.click(screen.getByRole("button", { name: "More bots" }))
    fireEvent.click(screen.getByRole("button", { name: "Fewer seats" }))
    expect(screen.getByText("4")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "More bots" })).toBeDisabled()
  })
})

import { fireEvent, render, screen } from "@testing-library/react"
import NewTableForm from "@/component/NewTableForm"
import { createTable, joinTable } from "@/service/TableService"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/service/TableService", () => ({
  createTable: jest.fn(),
  joinTable: jest.fn(),
}))

jest.mock("@/service/CurrentTableService", () => ({
  setCurrentTableId: jest.fn(),
}))

function submit() {
  fireEvent.change(screen.getByLabelText("Table name"), { target: { value: "My Table" } })
  fireEvent.click(screen.getByRole("button", { name: "Create" }))
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("NewTableForm", () => {
  it("creates, joins and opens the table", async () => {
    jest.mocked(createTable).mockResolvedValue("new-id")
    render(<NewTableForm onCancel={jest.fn()} />)
    submit()
    await screen.findByRole("button", { name: "Create" })
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
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(onCancel).toHaveBeenCalled()
  })
})

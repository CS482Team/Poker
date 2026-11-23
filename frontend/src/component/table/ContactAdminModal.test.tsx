import { fireEvent, render, screen } from "@testing-library/react"
import ContactAdminModal from "@/component/table/ContactAdminModal"
import { sendReport } from "@/service/ReportService"

jest.mock("@/service/ReportService", () => ({ sendReport: jest.fn() }))

beforeEach(() => jest.resetAllMocks())

function write(text: string) {
  fireEvent.change(screen.getByLabelText("Message"), { target: { value: text } })
}

describe("ContactAdminModal", () => {
  it("sends the message and thanks the player", async () => {
    render(<ContactAdminModal tableId="t1" onClose={jest.fn()} />)
    write(" Table froze ")
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(await screen.findByText("Message sent")).toBeInTheDocument()
    expect(sendReport).toHaveBeenCalledWith("Table froze", "t1")
  })

  it("can't send a blank message", () => {
    render(<ContactAdminModal tableId="t1" onClose={jest.fn()} />)
    write("   ")
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled()
  })

  it("shows the error", async () => {
    jest.mocked(sendReport).mockRejectedValue(new Error("Couldn't send your message (500)"))
    render(<ContactAdminModal tableId="t1" onClose={jest.fn()} />)
    write("hi")
    fireEvent.click(screen.getByRole("button", { name: "Send" }))
    expect(await screen.findByText("Couldn't send your message (500)")).toBeInTheDocument()
  })

  it("closes with escape", () => {
    const onClose = jest.fn()
    render(<ContactAdminModal tableId="t1" onClose={onClose} />)
    fireEvent.keyDown(screen.getByLabelText("Message"), { key: "Escape" })
    expect(onClose).toHaveBeenCalled()
  })
})

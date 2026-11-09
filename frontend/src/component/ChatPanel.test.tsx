import { act, fireEvent, render, screen } from "@testing-library/react"
import ChatPanel from "@/component/ChatPanel"
import { watchChat } from "@/service/ChatService"
import type { ChatMessage } from "@shared/Chat"

jest.mock("@/service/ChatService", () => ({ watchChat: jest.fn() }))

const props = { tableId: "t1", userId: "u1" }
const hello: ChatMessage = {
  id: 1,
  tableId: "t1",
  userId: "u2",
  name: "Bob",
  avatarUrl: null,
  body: "Good luck all",
  createdAt: "2026-11-06T10:24:00Z",
}
const send = jest.fn()
const stop = jest.fn()
let onMessage: (message: ChatMessage) => void

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(watchChat).mockImplementation((_tableId, _userId, onHistory, handler) => {
    onHistory([hello])
    onMessage = handler
    return { send, stop }
  })
})

function type(text: string) {
  fireEvent.change(screen.getByPlaceholderText("Message"), { target: { value: text } })
}

describe("ChatPanel", () => {
  it("keeps the header to just the title, since the table shows its own details", () => {
    render(<ChatPanel {...props} seated />)
    expect(screen.getByRole("heading", { name: "Chat" })).toBeInTheDocument()
    expect(screen.queryByText(/online/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Hand #/)).not.toBeInTheDocument()
  })

  it("shows the chat history", () => {
    render(<ChatPanel {...props} seated />)
    expect(screen.getByText("Good luck all")).toBeInTheDocument()
    expect(screen.getByText("Bob")).toBeInTheDocument()
  })

  it("shows new messages as they arrive", () => {
    render(<ChatPanel {...props} seated />)
    act(() => onMessage({ ...hello, id: 2, body: "Deal me in" }))
    expect(screen.getByText("Deal me in")).toBeInTheDocument()
  })

  it("calls your own messages Me", () => {
    render(<ChatPanel {...props} seated />)
    act(() => onMessage({ ...hello, id: 2, userId: "u1", name: "James" }))
    expect(screen.getByText("Me")).toBeInTheDocument()
  })

  it("shows the sender's avatar", () => {
    const { container } = render(<ChatPanel {...props} seated />)
    act(() => onMessage({ ...hello, id: 2, avatarUrl: "https://img.test/bob.png" }))
    expect(container.querySelector("img")).toHaveAttribute("src", "https://img.test/bob.png")
  })

  it("shows your own avatar on your messages", () => {
    const { container } = render(<ChatPanel {...props} seated />)
    act(() => onMessage({ ...hello, id: 2, userId: "u1", avatarUrl: "https://img.test/me.png" }))
    expect(container.querySelector("img")).toHaveAttribute("src", "https://img.test/me.png")
  })

  it("shows the initial when there's no avatar", () => {
    const { container } = render(<ChatPanel {...props} seated />)
    expect(container.querySelector("img")).toBeNull()
    expect(screen.getByText("B")).toBeInTheDocument()
  })

  it("falls back to the initial when the avatar fails to load", () => {
    const { container } = render(<ChatPanel {...props} seated />)
    act(() => onMessage({ ...hello, id: 2, name: "Cara", avatarUrl: "https://img.test/broken.png" }))
    fireEvent.error(container.querySelector("img")!)
    expect(container.querySelector("img")).toBeNull()
    expect(screen.getByText("C")).toBeInTheDocument()
  })

  it("shows system messages", () => {
    jest.mocked(watchChat).mockImplementation((_t, _u, onHistory) => {
      onHistory([{ ...hello, userId: null, name: null, body: "Bob joined the table" }])
      return { send, stop }
    })
    render(<ChatPanel {...props} seated />)
    expect(screen.getByText("Bob joined the table")).toBeInTheDocument()
  })

  it("labels the message box for screen readers", () => {
    render(<ChatPanel {...props} seated />)
    expect(screen.getByLabelText("Chat message")).toBeInTheDocument()
  })

  it("counts characters as you type", () => {
    render(<ChatPanel {...props} seated />)
    type("hi")
    expect(screen.getByText("2/160")).toBeInTheDocument()
  })

  it("sends a message and clears the box", async () => {
    send.mockResolvedValue({ ok: true })
    render(<ChatPanel {...props} seated />)
    type("hi")
    await act(async () => fireEvent.click(screen.getByText("Send")))
    expect(send).toHaveBeenCalledWith("hi")
    expect(screen.getByPlaceholderText("Message")).toHaveValue("")
  })

  it("fills the message with a quick chat", () => {
    render(<ChatPanel {...props} seated />)
    fireEvent.click(screen.getByText("Nice hand"))
    expect(screen.getByLabelText("Chat message")).toHaveValue("Nice hand")
    expect(send).not.toHaveBeenCalled()
  })

  it("shows why a message was refused", async () => {
    send.mockResolvedValue({ ok: false, error: "You're sending messages too fast" })
    render(<ChatPanel {...props} seated />)
    type("hi")
    await act(async () => fireEvent.click(screen.getByText("Send")))
    expect(screen.getByText("You're sending messages too fast")).toBeInTheDocument()
  })

  it("does not send an empty message", async () => {
    render(<ChatPanel {...props} seated />)
    type("   ")
    await act(async () => fireEvent.click(screen.getByText("Send")))
    expect(send).not.toHaveBeenCalled()
  })

  it("only lets seated players chat", () => {
    render(<ChatPanel {...props} seated={false} />)
    expect(screen.getByPlaceholderText("Take a seat")).toBeDisabled()
    expect(screen.queryByText("Nice hand")).not.toBeInTheDocument()
  })

  it("leaves the chat when closed", () => {
    const { unmount } = render(<ChatPanel {...props} seated />)
    unmount()
    expect(stop).toHaveBeenCalled()
  })

  it("shows a Contact Admin button that does nothing yet", () => {
    render(<ChatPanel {...props} seated />)
    expect(screen.getByText("Contact Admin")).toBeDisabled()
  })
})
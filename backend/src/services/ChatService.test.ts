import { MAX_CHAT_LENGTH } from "../../../shared/Rules"
import { insertMessage, recentMessages } from "../dao/ChatDAO"
import { isSeated } from "../dao/TablePlayersDAO"
import { ChatError, getHistory, sendMessage, sendSystemMessage } from "./ChatService"

jest.mock("../dao/ChatDAO", () => ({ insertMessage: jest.fn(), recentMessages: jest.fn() }))
jest.mock("../dao/TablePlayersDAO", () => ({ isSeated: jest.fn() }))

const message = { id: 1, tableId: "t1", userId: "u1", name: "Maya", body: "hi", createdAt: "" }

beforeEach(() => {
  jest.resetAllMocks()
  jest.mocked(isSeated).mockResolvedValue(true)
  jest.mocked(insertMessage).mockResolvedValue(message)
})

describe("ChatService", () => {
  it("saves a trimmed message from a seated player", async () => {
    expect(await sendMessage("t1", "u1", "  hi  ")).toEqual(message)
    expect(insertMessage).toHaveBeenCalledWith("t1", "u1", "hi")
  })

  it("rejects an empty message", async () => {
    await expect(sendMessage("t1", "u1", "   ")).rejects.toThrow(ChatError)
    expect(insertMessage).not.toHaveBeenCalled()
  })

  it("rejects a message over the length limit", async () => {
    await expect(sendMessage("t1", "u1", "x".repeat(MAX_CHAT_LENGTH + 1))).rejects.toThrow(ChatError)
  })

  it("rejects a message that is not text", async () => {
    await expect(sendMessage("t1", "u1", 42 as never)).rejects.toThrow(ChatError)
  })

  it("rejects a player who is not seated", async () => {
    jest.mocked(isSeated).mockResolvedValue(false)
    await expect(sendMessage("t1", "u1", "hi")).rejects.toThrow("Only seated players can chat")
  })

  it("saves a system message with no user", async () => {
    await sendSystemMessage("t1", "Maya joined the table")
    expect(insertMessage).toHaveBeenCalledWith("t1", null, "Maya joined the table")
  })

  it("gets the last 50 messages", async () => {
    jest.mocked(recentMessages).mockResolvedValue([message])
    expect(await getHistory("t1")).toEqual([message])
    expect(recentMessages).toHaveBeenCalledWith("t1", 50)
  })
})
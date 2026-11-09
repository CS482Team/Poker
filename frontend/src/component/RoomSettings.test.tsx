import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import RoomSettings from "@/component/RoomSettings"
import { updateTableSettings } from "@/service/TableService"

jest.mock("@/service/TableService", () => ({ updateTableSettings: jest.fn() }))
jest.mock("@/service/UserService", () => ({ getCurrentUserId: () => "u1" }))

const table = { id: "t1", name: "Ruby", hostId: "u1", status: 1, variant: "five_card_draw", buyIn: 100, minimumBet: 10, ante: 5, maxPlayers: 4, botCount: 1, chatEnabled: true, turnTimerEnabled: false, seats: [] }

describe("RoomSettings", () => {
  it("saves the settings and closes", async () => {
    const onClose = jest.fn()
    render(<RoomSettings table={table} onClose={onClose} />)
    fireEvent.click(screen.getByRole("button", { name: "More bots" }))
    fireEvent.click(screen.getByLabelText(/Chat/))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(updateTableSettings).toHaveBeenCalledWith("t1", "u1", { name: "Ruby", botCount: 2, chatEnabled: false, turnTimerEnabled: false })
  })
})

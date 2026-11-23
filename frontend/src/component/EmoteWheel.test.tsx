import { act, fireEvent, render, screen } from "@testing-library/react"
import EmoteWheel from "@/component/EmoteWheel"
import { makeItem } from "@/component/cosmetic/makeItem"

const laugh = makeItem({ id: "e1", name: "Big Laugh", type: "emote", style: { text: "😂" } })
const crown = makeItem({ id: "e2", name: "Crown", type: "emote", rarity: "legendary", style: { text: "👑" } })

function open() {
  fireEvent.click(screen.getByRole("button", { name: "Emotes" }))
}

describe("EmoteWheel", () => {
  afterEach(() => jest.useRealTimers())

  it("opens to show your four wheel slots", () => {
    render(<EmoteWheel wheel={[laugh, undefined, crown, undefined]} onSend={jest.fn()} />)
    open()
    expect(screen.getByRole("button", { name: "Send Big Laugh" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Send Crown" })).toBeInTheDocument()
    expect(screen.getAllByRole("button", { name: "Empty slot" })).toHaveLength(2)
    screen.getAllByRole("button", { name: "Empty slot" }).forEach((slot) => expect(slot).toBeDisabled())
  })

  it("sends the emote from that slot, closes, and cools down", async () => {
    jest.useFakeTimers()
    const onSend = jest.fn().mockResolvedValue({ ok: true })
    render(<EmoteWheel wheel={[laugh, undefined, crown, undefined]} onSend={onSend} />)
    open()
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Send Crown" })))

    expect(onSend).toHaveBeenCalledWith("emote_3")
    expect(screen.queryByRole("button", { name: "Send Crown" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Emotes" })).toBeDisabled()

    act(() => jest.advanceTimersByTime(3000))
    expect(screen.getByRole("button", { name: "Emotes" })).toBeEnabled()
  })

  it("explains when an emote is refused", async () => {
    render(<EmoteWheel wheel={[laugh, undefined, undefined, undefined]} onSend={jest.fn().mockResolvedValue({ ok: false, error: "Slow down" })} />)
    open()
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Send Big Laugh" })))
    expect(screen.getByRole("status")).toHaveTextContent("Slow down")
  })

  it("points you to My items when nothing is equipped", () => {
    render(<EmoteWheel wheel={[undefined, undefined, undefined, undefined]} onSend={jest.fn()} />)
    open()
    expect(screen.getByRole("link", { name: "Equip emotes" })).toHaveAttribute("href", "/shop/my-items")
  })

  it("closes when you press the button again", () => {
    render(<EmoteWheel wheel={[laugh, undefined, undefined, undefined]} onSend={jest.fn()} />)
    open()
    open()
    expect(screen.queryByRole("button", { name: "Send Big Laugh" })).not.toBeInTheDocument()
  })
})

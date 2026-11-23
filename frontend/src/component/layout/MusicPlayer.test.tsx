import { fireEvent, render } from "@testing-library/react"
import MusicPlayer from "@/component/layout/MusicPlayer"
import { startMusic } from "@/service/SoundService"

jest.mock("@/service/SoundService", () => ({ startMusic: jest.fn() }))

describe("MusicPlayer", () => {
  beforeEach(() => jest.clearAllMocks())

  it("waits for the player's first click or key press before starting music (browsers block it until then)", () => {
    render(<MusicPlayer />)
    expect(startMusic).not.toHaveBeenCalled()
    fireEvent.pointerDown(document.body)
    expect(startMusic).toHaveBeenCalledTimes(1)
  })

  it("starts it only once", () => {
    render(<MusicPlayer />)
    fireEvent.keyDown(document.body, { key: "a" })
    fireEvent.pointerDown(document.body)
    expect(startMusic).toHaveBeenCalledTimes(1)
  })
})

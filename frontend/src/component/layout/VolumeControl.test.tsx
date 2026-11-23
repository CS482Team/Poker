import { act, fireEvent, render, screen } from "@testing-library/react"
import VolumeControl from "@/component/layout/VolumeControl"
import { getSoundSettings, onSoundSettingsChange, playEffect, setSoundSettings } from "@/service/SoundService"

jest.mock("@/service/SoundService", () => {
  let settings = { music: 0.3, effects: 0.8, muted: false }
  const listeners = new Set<() => void>()
  return {
    DEFAULT_SOUND_SETTINGS: { music: 0.3, effects: 0.8, muted: false },
    getSoundSettings: jest.fn(() => settings),
    setSoundSettings: jest.fn((change: object) => {
      settings = { ...settings, ...change }
      listeners.forEach((l) => l())
    }),
    onSoundSettingsChange: jest.fn((l: () => void) => {
      listeners.add(l)
      return () => listeners.delete(l)
    }),
    playEffect: jest.fn(),
  }
})

function open() {
  fireEvent.click(screen.getByRole("button", { name: "Sound settings" }))
}

beforeEach(() => {
  jest.clearAllMocks()
  act(() => setSoundSettings({ music: 0.3, effects: 0.8, muted: false }))
  jest.clearAllMocks()
})

describe("VolumeControl", () => {
  it("opens to show the music and effects volumes", () => {
    render(<VolumeControl />)
    open()
    expect(screen.getByRole("slider", { name: "Music volume" })).toHaveValue("30")
    expect(screen.getByRole("slider", { name: "Effects volume" })).toHaveValue("80")
  })

  it("changes each volume", () => {
    render(<VolumeControl />)
    open()
    fireEvent.change(screen.getByRole("slider", { name: "Music volume" }), { target: { value: "55" } })
    expect(setSoundSettings).toHaveBeenCalledWith({ music: 0.55 })
    fireEvent.change(screen.getByRole("slider", { name: "Effects volume" }), { target: { value: "10" } })
    expect(setSoundSettings).toHaveBeenCalledWith({ effects: 0.1 })
  })

  it("plays a sample when you let go of the effects slider, so you can hear the level", () => {
    render(<VolumeControl />)
    open()
    fireEvent.pointerUp(screen.getByRole("slider", { name: "Effects volume" }))
    expect(playEffect).toHaveBeenCalledWith("chips")
  })

  it("mutes and unmutes everything, and shows it on the button", () => {
    render(<VolumeControl />)
    open()
    fireEvent.click(screen.getByRole("button", { name: "Mute all sound" }))
    expect(setSoundSettings).toHaveBeenCalledWith({ muted: true })
    expect(screen.getByRole("button", { name: "Sound settings (muted)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Unmute" })).toBeInTheDocument()
  })

  it("closes when you click somewhere else", () => {
    render(<VolumeControl />)
    open()
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole("slider", { name: "Music volume" })).not.toBeInTheDocument()
  })

  it("reads the saved settings and keeps up with changes", () => {
    render(<VolumeControl />)
    expect(getSoundSettings).toHaveBeenCalled()
    expect(onSoundSettingsChange).toHaveBeenCalled()
  })
})

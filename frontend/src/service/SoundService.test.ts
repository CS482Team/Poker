/* the service keeps settings in module state, so each test loads a fresh copy */
type Service = typeof import("@/service/SoundService")

const played: { src: string; volume: number; loop: boolean }[] = []
const music = { paused: true }

class FakeAudio {
  volume = 1
  loop = false
  paused = true
  constructor(public src: string) {}
  play() {
    this.paused = false
    played.push({ src: this.src, volume: this.volume, loop: this.loop })
    if (this.loop) music.paused = false
    return Promise.resolve()
  }
  pause() {
    this.paused = true
    if (this.loop) music.paused = true
  }
}

async function load(saved?: object): Promise<Service> {
  jest.resetModules()
  localStorage.clear()
  if (saved) localStorage.setItem("hd-sound", JSON.stringify(saved))
  return import("@/service/SoundService")
}

beforeEach(() => {
  played.length = 0
  music.paused = true
  global.Audio = FakeAudio as never
})

describe("SoundService", () => {
  it("starts with sensible defaults", async () => {
    const sound = await load()
    expect(sound.getSoundSettings()).toEqual({ music: 0.2, effects: 0.8, muted: false })
  })

  it("remembers settings in this browser", async () => {
    let sound = await load()
    sound.setSoundSettings({ music: 0.5 })
    const saved = localStorage.getItem("hd-sound")

    jest.resetModules()
    localStorage.setItem("hd-sound", saved!)
    sound = await import("@/service/SoundService")
    expect(sound.getSoundSettings().music).toBe(0.5)
  })

  it("ignores saved settings it can't read", async () => {
    jest.resetModules()
    localStorage.setItem("hd-sound", "not json")
    const sound = await import("@/service/SoundService")
    expect(sound.getSoundSettings()).toEqual({ music: 0.2, effects: 0.8, muted: false })
  })

  it("keeps volumes between 0 and 1", async () => {
    const sound = await load()
    sound.setSoundSettings({ music: 4, effects: -1 })
    expect(sound.getSoundSettings()).toMatchObject({ music: 1, effects: 0 })
  })

  it("tells listeners about changes until they stop listening", async () => {
    const sound = await load()
    const listener = jest.fn()
    const stop = sound.onSoundSettingsChange(listener)
    sound.setSoundSettings({ muted: true })
    expect(listener).toHaveBeenCalledTimes(1)
    stop()
    sound.setSoundSettings({ muted: false })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("plays an effect at the effects volume, scaled by that sound's own level", async () => {
    const sound = await load({ music: 0.3, effects: 0.5, muted: false })
    sound.playEffect("chips")
    expect(played).toHaveLength(1)
    expect(played[0]!.src).toBe("/sound/chips.ogg")
    expect(played[0]!.volume).toBeGreaterThan(0)
    expect(played[0]!.volume).toBeLessThanOrEqual(0.5)
  })

  it("stays silent when muted or when effects are at zero", async () => {
    let sound = await load({ music: 0.3, effects: 0.8, muted: true })
    sound.playEffect("chips")
    sound = await load({ music: 0.3, effects: 0, muted: false })
    sound.playEffect("chips")
    expect(played).toHaveLength(0)
  })

  it("loops the music at the music volume, and follows later changes", async () => {
    const sound = await load({ music: 0.4, effects: 0.8, muted: false })
    sound.startMusic()
    expect(played).toEqual([{ src: "/sound/music.ogg", volume: 0.4, loop: true }])

    sound.setSoundSettings({ muted: true })
    expect(music.paused).toBe(true)
    sound.setSoundSettings({ muted: false })
    expect(music.paused).toBe(false)
    sound.setSoundSettings({ music: 0 })
    expect(music.paused).toBe(true)
  })

  it("doesn't start the music while muted", async () => {
    const sound = await load({ music: 0.4, effects: 0.8, muted: true })
    sound.startMusic()
    expect(played).toHaveLength(0)
  })

  it("doesn't start the music early: changing volume before startMusic stays silent", async () => {
    const sound = await load()
    sound.setSoundSettings({ music: 0.6 })
    expect(played).toHaveLength(0)
  })

  it("survives a browser that refuses to play", async () => {
    global.Audio = class extends FakeAudio {
      play() {
        return Promise.reject(new Error("NotAllowedError"))
      }
    } as never
    const sound = await load()
    expect(() => sound.playEffect("deal")).not.toThrow()
    expect(() => sound.startMusic()).not.toThrow()
  })
})

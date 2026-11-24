import { render, screen } from "@testing-library/react"
import BadgeIcon, { AvatarBadge } from "@/component/badge/BadgeIcon"
import type { Badge, BadgePlace, BadgeTimeframe } from "@shared/Badges"

const badge = (timeframe: BadgeTimeframe, place: BadgePlace): Badge => ({ timeframe, place, periodStart: null, title: `${timeframe} ${place}`, period: "p" })

function shapeAndSymbol(b: Badge) {
  const { container } = render(<BadgeIcon badge={b} />)
  const [shape, symbol] = container.querySelectorAll("path")
  const stop = container.querySelector("stop")
  return { shape: shape!.getAttribute("d"), symbol: symbol!.getAttribute("d"), metal: stop!.getAttribute("stop-color") }
}

describe("BadgeIcon", () => {
  it("names the badge for screen readers and on hover", () => {
    render(<BadgeIcon badge={{ ...badge("week", 1), title: "Weekly Champion", period: "Week of Nov 16, 2026" }} />)
    const icon = screen.getByRole("img", { name: "Weekly Champion, Week of Nov 16, 2026" })
    expect(icon.querySelector("title")).toHaveTextContent("Weekly Champion, Week of Nov 16, 2026")
  })

  it("gives every timeframe its own outline and symbol", () => {
    const looks = (["week", "month", "season", "all"] as const).map((tf) => shapeAndSymbol(badge(tf, 1)))
    expect(new Set(looks.map((l) => l.shape)).size).toBe(4)
    expect(new Set(looks.map((l) => l.symbol)).size).toBe(4)
  })

  it("colors gold, silver and bronze by place", () => {
    const metals = ([1, 2, 3] as const).map((place) => shapeAndSymbol(badge("week", place)).metal)
    expect(new Set(metals).size).toBe(3)
  })

  it("keeps gradients separate when several badges are on screen", () => {
    const { container } = render(<><BadgeIcon badge={badge("week", 1)} /><BadgeIcon badge={badge("week", 2)} /></>)
    const ids = [...container.querySelectorAll("linearGradient")].map((g) => g.id)
    expect(new Set(ids).size).toBe(2)
  })
})

describe("AvatarBadge", () => {
  it("shows nothing without a badge", () => {
    const { container } = render(<AvatarBadge badge={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it("pins the badge to the avatar's corner", () => {
    render(<AvatarBadge badge={badge("all", 2)} />)
    expect(screen.getByRole("img")).toHaveClass("avatar-badge")
  })
})

import type { Badge, BadgePlace, BadgeTimeframe } from "@shared/Badges"
import { useId } from "react"

/* metal by place: [light, dark] for the gradient */
export const METALS: Record<BadgePlace, { name: string; light: string; dark: string }> = {
  1: { name: "Gold", light: "#fbe59a", dark: "#c08a22" },
  2: { name: "Silver", light: "#f4f7fa", dark: "#8d98a3" },
  3: { name: "Bronze", light: "#f3b886", dark: "#9a5126" },
}

/* each timeframe has its own outline and symbol, so they read apart even at a glance */
const SHAPES: Record<BadgeTimeframe, string> = {
  week: "M12 1a11 11 0 1 1 0 22 11 11 0 0 1 0-22z", // round medal
  month: "M6 1h12a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H6a5 5 0 0 1-5-5V6a5 5 0 0 1 5-5z", // rounded square
  season: "M12 .8 22 4.6v7.2c0 5.8-4.1 9.9-10 11.4C6.1 21.7 2 17.6 2 11.8V4.6z", // shield
  all: "M12 .6 22 6.3v11.4l-10 5.7-10-5.7V6.3z", // hexagon
}

/* symbols drawn in a 24-unit box, filled */
const SYMBOLS: Record<BadgeTimeframe, string> = {
  week: "M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z", // star
  month: "M14.5 3.5a8.5 8.5 0 1 0 6 13.5 7 7 0 0 1-6-13.5z", // crescent moon
  season: "M7 4h10v4.5a5 5 0 0 1-10 0zM7 6H4.5a2.5 2.5 0 0 0 2.6 4M17 6h2.5a2.5 2.5 0 0 1-2.6 4M10.5 13.2h3V16h-3zM8 17h8v3H8z", // trophy
  all: "M3.5 8l4.5 3.5L12 5l4 6.5L20.5 8 19 18H5zM5 19.5h14V21H5z", // crown
}

interface Props {
  badge: Badge
  size?: number
  className?: string
}

/* A leaderboard medal: its outline and symbol say the timeframe (week, month, season, all-time), its metal the place */
export default function BadgeIcon({ badge, size = 20, className = "" }: Props) {
  const id = useId()
  const metal = METALS[badge.place]
  const label = `${badge.title}, ${badge.period}`
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} role="img" aria-label={label} className={`badge-icon ${className}`}>
      <title>{label}</title>
      <defs>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={metal.light} />
          <stop offset="1" stopColor={metal.dark} />
        </linearGradient>
      </defs>
      <path d={SHAPES[badge.timeframe]} fill={`url(#${id}-metal)`} stroke="#2a1d14" strokeWidth="1.2" strokeLinejoin="round" />
      <g transform="translate(5.4 5.4) scale(0.55)" fill="#3b2610" stroke="#3b2610" strokeWidth="0.6" strokeLinejoin="round">
        <path d={SYMBOLS[badge.timeframe]} fillRule="evenodd" />
      </g>
    </svg>
  )
}

/* the medal pinned to the corner of an avatar; the parent must be positioned */
export function AvatarBadge({ badge, size = 22, className = "" }: { badge: Badge | null | undefined; size?: number; className?: string }) {
  if (!badge) return null
  return <BadgeIcon badge={badge} size={size} className={`avatar-badge ${className}`} />
}

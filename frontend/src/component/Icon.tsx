export const PLUS = "M12 5v14M5 12h14"
export const PENCIL = "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"
export const TRASH = "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
export const CHECK = "M20 6 9 17l-5-5"
export const CROSS = "M18 6 6 18M6 6l12 12"
export const JOIN = "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
export const LEAVE = "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M8 7l-5 5 5 5M3 12h12"
export const RETURN = "M5 12h14M13 6l6 6-6 6"
export const LOCK = "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"

export default function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

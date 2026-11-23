export const PLUS = "M12 5v14M5 12h14"
export const PENCIL = "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"
export const TRASH = "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
export const CHECK = "M20 6 9 17l-5-5"
export const CROSS = "M18 6 6 18M6 6l12 12"
export const JOIN = "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"
export const LEAVE = "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M8 7l-5 5 5 5M3 12h12"
export const RETURN = "M5 12h14M13 6l6 6-6 6"
export const PLAY = "M7 4v16l13-8z"
export const LOCK = "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4"
export const GAVEL = "M1 21h12v2H1zM5.245 8.07l2.83-2.827 14.14 14.142-2.828 2.828zM12.317 1l5.657 5.656-2.83 2.83-5.654-5.66zM3.825 9.485l5.657 5.657-2.828 2.828-5.657-5.657z"
export const RESTORE = "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8M3 3v5h5"
export const IMAGE ="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6M15.5 9.5h.01"

export default function Icon({ d, size = 16, solid }: { d: string; size?: number; solid?: string }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
      {solid && <path d={solid} fill="currentColor" stroke="none" />}
    </svg>
  )
}

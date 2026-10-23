import type { PublicPlayer } from "@/service/Game"

interface DevSeatSwitchProps {
  players: PublicPlayer[]
  playerId: string
  followTurn: boolean
  onSelect: (playerId: string) => void
  onFollowTurnChange: (follow: boolean) => void
}

// TODO: dev only. Lets one browser play every seat until sign-in exists (S7);
// then the viewer is the logged-in user and this component is removed.
export default function DevSeatSwitch({ players, playerId, followTurn, onSelect, onFollowTurnChange }: DevSeatSwitchProps) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2">
        Viewing as
        <select
          value={playerId}
          onChange={e => onSelect(e.target.value)}
          className="rounded border border-black/40 bg-neutral-800 px-2 py-1"
        >
          {players.map(p => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={followTurn}
          onChange={e => onFollowTurnChange(e.target.checked)}
          className="accent-red-600"
        />
        Follow turn
      </label>
    </div>
  )
}

import Image from "next/image"
import type { StaticImageData } from "next/image"
import CardFan from "./CardFan"
import type { PublicPlayer } from "@/service/Game"

interface SeatProps {
  player: PublicPlayer
  avatar: StaticImageData
  isDealer: boolean
  isToAct: boolean
  showCards: boolean // false for the viewer's seat; their cards show in PlayerHand instead
}

export default function Seat({ player, avatar, isDealer, isToAct, showCards }: SeatProps) {
  const folded = player.status === "folded"
  return (
    <div className={`flex flex-col items-center ${folded ? "opacity-50" : ""}`}>
      {showCards && !folded && (
        <div className="-mb-5">
          <CardFan count={player.cardCount} />
        </div>
      )}
      <div className="relative z-10">
        <Image
          src={avatar}
          alt={player.name}
          width={72}
          height={72}
          className={`rounded-full border-4 bg-panel shadow-lg ${isToAct ? "border-turn animate-turn-glow" : "border-white"}`}
        />
        {isDealer && (
          <span className="absolute -right-1 bottom-0 flex size-6 items-center justify-center rounded-full bg-white text-xs font-bold text-black shadow">
            D
          </span>
        )}
      </div>
      <div className="mt-1 whitespace-nowrap rounded bg-panel/90 px-3 py-1 text-sm shadow">
        <span className="font-semibold">{player.name}</span>
        <span className="ml-2 text-white/70">{player.stack} chips</span>
      </div>
      {folded && <span className="mt-1 text-xs uppercase text-white/70">Folded</span>}
      {player.status === "all-in" && <span className="mt-1 text-xs uppercase text-turn">All-in</span>}
      {!folded && player.betThisRound > 0 && (
        <span className="mt-1 rounded-full bg-black/40 px-2 text-xs">Bet {player.betThisRound}</span>
      )}
    </div>
  )
}

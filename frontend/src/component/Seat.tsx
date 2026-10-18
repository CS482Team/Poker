import Image from "next/image"
import type { StaticImageData } from "next/image"
import CardFan from "./CardFan"
import type { DemoPlayer } from "@/service/Game"

interface SeatProps {
  player: DemoPlayer
  avatar: StaticImageData
  isDealer: boolean
  isToAct: boolean
  faceUp: boolean // show this player's cards face-up (Reveal all)
  showCards: boolean // false for your seat; your cards show in PlayerHand instead
}

export default function Seat({ player, avatar, isDealer, isToAct, faceUp, showCards }: SeatProps) {
  return (
    <div className="flex flex-col items-center">
      {showCards && (
        <div className="-mb-5">
          <CardFan cards={player.hand} faceUp={faceUp} />
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
    </div>
  )
}

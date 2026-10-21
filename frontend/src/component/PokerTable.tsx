import Seat from "./Seat"
import EmptySeat from "./EmptySeat"
import type { DemoDeal } from "@/service/Game"
import { OPEN_SPOTS, SPOT_POSITION, spotForSeat } from "@/util/SeatLayout"
import me from "@/asset/me2.png"
import bot1 from "@/asset/bot1.png"
import bot2 from "@/asset/bot2.png"
import bot3 from "@/asset/bot3.png"

// Avatar for each seat (seat 0 = you)
const AVATARS = [me, bot1, bot2, bot3]

interface PokerTableProps {
  deal: DemoDeal | null
  revealAll: boolean
}

export default function PokerTable({ deal, revealAll }: PokerTableProps) {
  return (
    <div className="relative mx-auto aspect-[2/1] w-full max-w-4xl">
      {/* rim */}
      <div className="absolute inset-0 rounded-[50%] bg-gradient-to-b from-neutral-600 to-neutral-950 shadow-2xl" />

      {/* felt */}
      <div className="absolute inset-5 rounded-[50%] bg-[radial-gradient(ellipse_at_center,var(--color-felt),var(--color-felt-dark))] shadow-[inset_0_0_40px_rgba(0,0,0,0.6)]">
        <div className="absolute inset-6 rounded-[50%] border border-white/10" />
        <span className="absolute inset-0 flex select-none items-center justify-center text-8xl font-bold text-white/5">
          H&D
        </span>
        {deal ? (
          <div className="absolute left-1/2 top-[34%] flex -translate-x-1/2 items-center gap-2 text-lg">
            <span className="size-4 rounded-full border-2 border-white bg-card-red" />
            Pot <strong>{deal.pot}</strong>
          </div>
        ) : (
          <p className="absolute inset-0 flex items-center justify-center text-lg text-white/70">
            Click Deal to start a hand
          </p>
        )}
      </div>

      {/* seats, centred on their spot around the oval */}
      {deal?.players.map(player => (
        <div
          key={player.seat}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={SPOT_POSITION[spotForSeat(player.seat)]}
        >
          <Seat
            player={player}
            avatar={AVATARS[player.seat] ?? bot1}
            isDealer={player.seat === deal.dealerSeat}
            isToAct={player.seat === deal.toActSeat}
            faceUp={revealAll}
            showCards={player.seat !== 0}
          />
        </div>
      ))}
      {deal &&
        OPEN_SPOTS.map(spot => (
          <div key={spot} className="absolute -translate-x-1/2 -translate-y-1/2" style={SPOT_POSITION[spot]}>
            <EmptySeat />
          </div>
        ))}
    </div>
  )
}

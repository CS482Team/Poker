import BadgeIcon, { METALS } from "@/component/badge/BadgeIcon"
import type { Badge } from "@shared/Badges"
import Link from "next/link"

/* the leaderboard badges a player has earned, best first, one pill per top-3 finish */
export default function BadgeList({ badges }: { badges: Badge[] }) {
  return (
    <section aria-labelledby="badges-heading" className="mb-6">
      <h2 id="badges-heading" className="mb-2 text-lg font-semibold">Badges</h2>
      {badges.length === 0 ? (
        <p className="text-sm text-[#9e9393]">
          Finish in the top 3 on the <Link href="/leaderboard" className="underline hover:text-white">leaderboard</Link> for a week, month or season to earn a badge.
        </p>
      ) : (
        <ul aria-label="Badges" className="flex flex-wrap gap-2">
          {badges.map((b) => {
            const metal = METALS[b.place]
            return (
              <li
                key={`${b.timeframe}-${b.periodStart ?? "live"}`}
                className="flex items-center gap-2 rounded-full border py-1 pl-1.5 pr-3"
                style={{ borderColor: `${metal.dark}99`, background: `${metal.dark}22` }}
              >
                <BadgeIcon badge={b} size={26} />
                <span className="text-sm leading-tight">
                  <span className="font-semibold" style={{ color: metal.light }}>{b.title}</span>
                  <span className="block text-xs text-[#b8aeae]">{b.period}{b.periodStart === null && " · while you hold the spot"}</span>
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

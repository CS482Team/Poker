import { AD_WATCH_SECONDS } from "../../../shared/Rules"

const watching = new Map<string, { adId: string; startedAt: number }>()

export function startWatch(userId: string, adId: string) {
  watching.set(userId, { adId, startedAt: Date.now() })
}

export function finishWatch(userId: string, adId: string): boolean {
  const watch = watching.get(userId)
  if (!watch || watch.adId !== adId || Date.now() - watch.startedAt < AD_WATCH_SECONDS * 1000) return false
  watching.delete(userId)
  return true
}

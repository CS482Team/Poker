import { authHeaders } from "@/service/AuthService"

export async function fetchBalance(): Promise<number> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/balance`, { headers: await authHeaders() })
  if (!res.ok) throw new Error("Could not load balance")
  const body = (await res.json()) as { balance: number }
  return body.balance
}

const BALANCE_EVENT = "balance-changed"

/* updates the navbar straight away instead of on the next page change */
export function announceBalance(balance: number): void {
  window.dispatchEvent(new CustomEvent<number>(BALANCE_EVENT, { detail: balance }))
}

export function onBalanceChange(listener: (balance: number) => void): () => void {
  const handle = (event: Event) => listener((event as CustomEvent<number>).detail)
  window.addEventListener(BALANCE_EVENT, handle)
  return () => window.removeEventListener(BALANCE_EVENT, handle)
}

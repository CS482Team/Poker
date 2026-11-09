export async function fetchBalance(userId: string): Promise<number> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${userId}/balance`)
  if (!res.ok) throw new Error("Could not load balance")
  const body = (await res.json()) as { balance: number }
  return body.balance
}
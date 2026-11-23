import { authHeaders } from "@/service/AuthService";
import type { PromoEvent } from "@shared/Event";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchActiveEvent(): Promise<PromoEvent | null> {
  const res = await fetch(`${API_URL}/events/active`);
  if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
  return res.json();
}

export async function createEvent(name: string, multiplier: number, days: number): Promise<void> {
  const res = await fetch(`${API_URL}/events`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ name, multiplier, days }),
  });
  if (!res.ok) throw new Error(`Failed to start event (${res.status})`);
}

export async function endEvent(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/events/${id}`, { method: "DELETE", headers: await authHeaders() });
  if (!res.ok) throw new Error(`Failed to end event (${res.status})`);
}

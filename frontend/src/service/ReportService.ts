import { authHeaders } from "@/service/AuthService";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function sendReport(message: string, tableId: string): Promise<void> {
  const res = await fetch(`${API_URL}/reports`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify({ message, tableId }),
  });
  if (!res.ok) throw new Error(`Couldn't send your message (${res.status})`);
}

export async function requestPasswordReset(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/reports/password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? `Couldn't send your request (${res.status})`);
}
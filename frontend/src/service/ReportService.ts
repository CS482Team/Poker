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

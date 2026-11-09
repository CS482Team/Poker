import type { NewTable, Table } from "@shared/Table";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/* The error to show for a failed request: the server's reason when it sends one
   (e.g. "Failed to join table: Insufficient balance"), otherwise the status code */
async function requestError(res: Response, what: string): Promise<Error> {
  const reason = await res.json().then((body) => body?.error, () => undefined);
  return new Error(typeof reason === "string" ? `${what}: ${reason}` : `${what} (${res.status})`);
}

export async function fetchTables(): Promise<Table[]> {
  const res = await fetch(`${API_URL}/tables`);
  if (!res.ok) throw new Error(`Failed to load tables (${res.status})`);
  return res.json();
}

export async function fetchTable(id: string): Promise<Table> {
  const res = await fetch(`${API_URL}/tables/${id}`);
  if (!res.ok) throw new Error(`Failed to load table (${res.status})`);
  return res.json();
}

export async function createTable(table: NewTable): Promise<string> {
  const res = await fetch(`${API_URL}/tables`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(table),
  });
  if (!res.ok) throw await requestError(res, "Failed to create table");
  const { id } = await res.json();
  return id;
}

export async function joinTable(id: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tables/${id}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw await requestError(res, "Failed to join table");
}

export async function leaveTable(id: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tables/${id}/players/${userId}`, { method: "DELETE" });
  if (!res.ok) throw await requestError(res, "Failed to leave table");
}

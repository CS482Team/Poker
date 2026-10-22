import type { NewTable, Table } from "@shared/Table";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

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
  if (!res.ok) throw new Error(`Failed to create table (${res.status})`);
  const { id } = await res.json();
  return id;
}

export async function joinTable(id: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tables/${id}/players`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error(`Failed to join table (${res.status})`);
}

export async function leaveTable(id: string, userId: string): Promise<void> {
  const res = await fetch(`${API_URL}/tables/${id}/players/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to leave table (${res.status})`);
}

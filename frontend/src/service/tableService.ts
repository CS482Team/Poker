import type { Table, TableDetail } from "@shared/table";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchTables(): Promise<Table[]> {
  const res = await fetch(`${API_URL}/tables`);
  if (!res.ok) throw new Error(`Failed to load tables (${res.status})`);
  return res.json();
}

export async function fetchTable(id: string): Promise<TableDetail> {
  const res = await fetch(`${API_URL}/tables/${id}`);
  if (!res.ok) throw new Error(`Failed to load table (${res.status})`);
  return res.json();
}

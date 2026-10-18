const CURRENT_TABLE_KEY = "currentTableId";

export function getCurrentTableId(): string | null {
  return localStorage.getItem(CURRENT_TABLE_KEY);
}

export function setCurrentTableId(id: string) {
  localStorage.setItem(CURRENT_TABLE_KEY, id);
}

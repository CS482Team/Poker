import { getCurrentUserId } from "@/service/userService";

/* keeps each user's current table separate so two users can test in one browser */
function key() {
  return `currentTableId:${getCurrentUserId()}`;
}

export function getCurrentTableId(): string | null {
  return localStorage.getItem(key());
}

export function setCurrentTableId(id: string) {
  localStorage.setItem(key(), id);
}

export function clearCurrentTableId() {
  localStorage.removeItem(key());
}

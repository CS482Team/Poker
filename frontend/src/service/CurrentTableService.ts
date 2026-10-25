import { getCurrentUserId } from "@/service/UserService";

/* TODO temp remove once the server knows which table a user is at
   used rn so two users can test in one browser */
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

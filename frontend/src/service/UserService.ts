const USER_KEY = "devUserId";

/* TODO for testing only, replace with the logged in user and delete after auth made */
export const DEV_USERS = [
  { id: "00000000-0000-0000-0000-000000000001", name: "User 1" },
  { id: "00000000-0000-0000-0000-000000000002", name: "User 2" },
];

/* gets the id of the user this browser tab is playing as */
export function getCurrentUserId(): string {
  return sessionStorage.getItem(USER_KEY) ?? DEV_USERS[0].id;
}

/* switches which user this browser tab is playing as */
export function setCurrentUserId(id: string) {
  sessionStorage.setItem(USER_KEY, id);
}

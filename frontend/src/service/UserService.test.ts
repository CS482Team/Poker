import { DEV_USERS, getCurrentUserId, setCurrentUserId } from "@/service/UserService"

beforeEach(() => sessionStorage.clear())

describe("userService", () => {
  it("defaults to the first dev user", () => {
    expect(getCurrentUserId()).toBe(DEV_USERS[0].id)
  })

  it("remembers the chosen user", () => {
    setCurrentUserId(DEV_USERS[1].id)
    expect(getCurrentUserId()).toBe(DEV_USERS[1].id)
  })
})

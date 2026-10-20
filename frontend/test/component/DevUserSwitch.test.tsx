import { fireEvent, render, screen } from "@testing-library/react"
import DevUserSwitch from "@/component/DevUserSwitch"
import { DEV_USERS, getCurrentUserId } from "@/service/userService"

beforeEach(() => {
  sessionStorage.clear()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

describe("DevUserSwitch", () => {
  it("shows the current user", () => {
    sessionStorage.setItem("devUserId", DEV_USERS[1].id)
    render(<DevUserSwitch />)
    expect(screen.getByLabelText("Dev user")).toHaveValue(DEV_USERS[1].id)
  })

  it("switches the user", () => {
    render(<DevUserSwitch />)
    fireEvent.change(screen.getByLabelText("Dev user"), { target: { value: DEV_USERS[1].id } })
    expect(getCurrentUserId()).toBe(DEV_USERS[1].id)
  })
})

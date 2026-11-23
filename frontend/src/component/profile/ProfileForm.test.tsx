import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import ProfileForm from "@/component/profile/ProfileForm"
import { changeAvatar, changeEmail, changeUsername } from "@/service/ProfileService"
import type { MyProfile } from "@shared/User"

jest.mock("@/service/ProfileService", () => ({ changeUsername: jest.fn(), changeAvatar: jest.fn(), changeEmail: jest.fn() }))

const maya: MyProfile = { id: "u1", username: "Maya", avatarUrl: null, email: "maya@test.local", isGuest: false }

function setup(profile: MyProfile = maya) {
  const onSaved = jest.fn()
  const onCancel = jest.fn()
  render(<ProfileForm profile={profile} onSaved={onSaved} onCancel={onCancel} />)
  return { onSaved, onCancel }
}

beforeEach(() => jest.resetAllMocks())

describe("ProfileForm", () => {

  it("saves only what changed, then hands back the updated profile", async () => {
    const { onSaved } = setup()
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Maya2" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ...maya, username: "Maya2" }))
    expect(changeUsername).toHaveBeenCalledWith("Maya2")
    expect(changeAvatar).not.toHaveBeenCalled()
    expect(changeEmail).not.toHaveBeenCalled()
  })

  it("asks for your current password only when the email changes", async () => {
    const { onSaved } = setup()
    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "new@test.local" } })
    fireEvent.change(screen.getByLabelText("Current password"), { target: { value: "secret1" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith({ ...maya, email: "new@test.local" }))
    expect(changeEmail).toHaveBeenCalledWith("secret1", "new@test.local")
  })

  it("lets you remove your picture", async () => {
    const { onSaved } = setup({ ...maya, avatarUrl: "data:image/png;base64,AAAA" })
    fireEvent.click(screen.getByRole("button", { name: "Remove" }))
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    await waitFor(() => expect(onSaved).toHaveBeenCalled())
    expect(changeAvatar).toHaveBeenCalledWith(null)
  })

  it("shows why a save failed and stays open", async () => {
    jest.mocked(changeUsername).mockRejectedValue(new Error("That username is taken"))
    const { onSaved } = setup()
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "Taken" } })
    fireEvent.click(screen.getByRole("button", { name: "Save" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("That username is taken")
    expect(onSaved).not.toHaveBeenCalled()
  })

  it("hides the email for guests", () => {
    setup({ ...maya, email: null, isGuest: true })
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument()
  })

  it("closes without saving", () => {
    const { onCancel } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(onCancel).toHaveBeenCalled()
  })
})
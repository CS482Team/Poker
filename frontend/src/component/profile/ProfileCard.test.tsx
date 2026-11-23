import { fireEvent, render, screen } from "@testing-library/react"
import ProfileCard from "@/component/profile/ProfileCard"
import { fetchMyProfile } from "@/service/ProfileService"

jest.mock("@/service/ProfileService", () => ({ fetchMyProfile: jest.fn(), changeUsername: jest.fn(), changeAvatar: jest.fn(), changeEmail: jest.fn() }))

const maya = { id: "u1", username: "Maya", avatarUrl: "data:image/png;base64,AAAA", email: "maya@test.local", isGuest: false }

describe("ProfileCard", () => {
  it("shows your picture, name and email", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue(maya)
    render(<ProfileCard />)
    expect(await screen.findByRole("heading", { name: "Maya" })).toBeInTheDocument()
    expect(screen.getByText("maya@test.local")).toBeInTheDocument()
    expect(screen.getByRole("region", { name: "Your profile" }).querySelector("img")).toHaveAttribute("src", maya.avatarUrl)
  })

  it("says when you're a guest instead of showing an email", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue({ ...maya, email: null, isGuest: true })
    render(<ProfileCard />)
    expect(await screen.findByText("Guest account")).toBeInTheDocument()
  })

  it("opens the edit form", async () => {
    jest.mocked(fetchMyProfile).mockResolvedValue(maya)
    render(<ProfileCard />)
    fireEvent.click(await screen.findByRole("button", { name: "Edit profile" }))
    expect(screen.getByRole("dialog", { name: "Edit profile" })).toBeInTheDocument()
  })

  it("explains when the profile can't load", async () => {
    jest.mocked(fetchMyProfile).mockRejectedValue(new Error("Could not load your profile (500)"))
    render(<ProfileCard />)
    expect(await screen.findByRole("alert")).toHaveTextContent("Could not load your profile (500)")
  })
})
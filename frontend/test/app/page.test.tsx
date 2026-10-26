import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import Home from "@/app/page"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/app/supabaseClient.ts", () => ({
  supabase: {
    auth: {
      signInAnonymously: jest.fn().mockResolvedValue({ error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: { email: "a@b.com" } }, error: null }),
    },
  },
}))

describe("Home", () => {
  it("signs in", async () => {
    render(<Home />)
    fireEvent.click(screen.getByText("Sign Up"))
    fireEvent.click(screen.getByText("Forgot password?"))
    fireEvent.click(screen.getByText("Play as Guest"))
    fireEvent.change(screen.getByPlaceholderText("Email"), { target: { value: "a@b.com" } })
    fireEvent.change(screen.getByPlaceholderText("Your Password"), { target: { value: "secret1" } })
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }))
    expect(await screen.findByText("Logged in as a@b.com")).toBeInTheDocument()
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard"))
  })
})

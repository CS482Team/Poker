import { fireEvent, render } from "@testing-library/react"
import Avatar, { initials } from "@/component/Avatar"

describe("Avatar", () => {
  it("shows the picture when there is one", () => {
    const { container } = render(<Avatar name="Maya" url="https://img.test/maya.png" />)
    expect(container.querySelector("img")).toHaveAttribute("src", "https://img.test/maya.png")
  })

  it("falls back to initials when the picture fails to load", () => {
    const { container } = render(<Avatar name="Maya" url="https://img.test/broken.png" />)
    fireEvent.error(container.querySelector("img")!)
    expect(container).toHaveTextContent("M")
  })

  it("takes up to two initials", () => {
    expect(initials("Maya")).toBe("M")
    expect(initials("johnny christmas")).toBe("JC")
    expect(initials("  a b c ")).toBe("AB")
    expect(initials(null)).toBe("?")
    expect(initials("   ")).toBe("?")
  })
})

import { act, render } from "@testing-library/react"
import ThemeApplier from "@/component/layout/ThemeApplier"
import { makeItem } from "@/component/cosmetic/makeItem"
import { announceLoadout, fetchLoadout } from "@/service/ShopService"
import { getCurrentUserId } from "@/service/UserService"

jest.mock("next/navigation", () => ({ usePathname: () => "/table/t1" }))
jest.mock("@/service/UserService", () => ({ getCurrentUserId: jest.fn() }))
jest.mock("@/app/supabaseClient", () => ({ supabase: { auth: { getSession: jest.fn() } } }))
jest.mock("@/service/ShopService", () => {
  const actual = jest.requireActual("@/service/ShopService")
  return { ...actual, fetchLoadout: jest.fn() }
})

const sapphire = makeItem({ id: "th1", name: "Sapphire Vault Table", type: "theme", style: { pattern: "rings", color: "#123a7a", accent: "#5aa9ff", rail: "#0d1626" } })
const gold = makeItem({ id: "th2", name: "Gold Foil Table", type: "theme", style: { pattern: "rays", color: "#6b4a12", accent: "#f2c14e", animation: "shimmer" } })
const root = document.documentElement

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(getCurrentUserId).mockReturnValue("u1")
  root.removeAttribute("style")
  delete root.dataset.tableShimmer
})

describe("ThemeApplier", () => {
  it("dresses the table in your equipped theme", async () => {
    jest.mocked(fetchLoadout).mockResolvedValue({ theme: sapphire })
    render(<ThemeApplier />)
    await act(async () => {})
    expect(root.style.getPropertyValue("--felt")).toBe("#123a7a")
    expect(root.style.getPropertyValue("--rail")).toBe("#0d1626")
  })

  it("leaves the house table alone when no theme is equipped", async () => {
    jest.mocked(fetchLoadout).mockResolvedValue({})
    render(<ThemeApplier />)
    await act(async () => {})
    expect(root.style.getPropertyValue("--felt")).toBe("")
  })

  it("switches straight away when you equip or take off a theme", async () => {
    jest.mocked(fetchLoadout).mockResolvedValue({ theme: sapphire })
    render(<ThemeApplier />)
    await act(async () => {})

    act(() => announceLoadout({ theme: gold }))
    expect(root.style.getPropertyValue("--felt")).toBe("#6b4a12")
    expect(root.dataset.tableShimmer).toBeDefined()

    act(() => announceLoadout({}))
    expect(root.style.getPropertyValue("--felt")).toBe("")
    expect(root.dataset.tableShimmer).toBeUndefined()
  })

  it("doesn't ask the server when nobody is signed in", async () => {
    jest.mocked(getCurrentUserId).mockReturnValue("")
    render(<ThemeApplier />)
    await act(async () => {})
    expect(fetchLoadout).not.toHaveBeenCalled()
  })
})

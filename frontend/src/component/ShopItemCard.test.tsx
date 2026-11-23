import { fireEvent, render, screen } from "@testing-library/react"
import ShopItemCard from "@/component/ShopItemCard"
import { makeItem } from "@/component/cosmetic/makeItem"

const flare = makeItem({ id: "i1", name: "Diamond Flare", description: "Crimson rays burst from a bright diamond core.", rarity: "rare", cost: 650, style: { pattern: "rays" } })

function setup(props: Partial<Parameters<typeof ShopItemCard>[0]> = {}) {
  const onBuy = props.onBuy ?? jest.fn().mockResolvedValue(undefined)
  render(<ShopItemCard item={flare} username="charley" balance={1000} signedIn onBuy={onBuy} {...props} />)
  return { onBuy }
}

describe("ShopItemCard", () => {
  it("shows the preview, rarity, name and price", () => {
    setup()
    expect(screen.getByRole("img", { name: "Diamond Flare preview" })).toBeInTheDocument()
    expect(screen.getByText("rare")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Diamond Flare" })).toBeInTheDocument()
    expect(screen.getByText("650")).toBeInTheDocument()
  })

  it("confirms in a modal with your balance afterwards", async () => {
    const { onBuy } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    expect(screen.getByRole("dialog", { name: "Buy Diamond Flare" })).toHaveTextContent("350 chips")
    expect(onBuy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: /^Buy for/ }))
    expect(onBuy).toHaveBeenCalledWith(flare)
  })

  it("can close the modal", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    fireEvent.click(screen.getByRole("button", { name: "Close" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("disables buying while the purchase is in flight", async () => {
    setup({ onBuy: () => new Promise(() => {}) })
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    fireEvent.click(screen.getByRole("button", { name: /^Buy for/ }))
    expect(await screen.findByRole("button", { name: "Buying…" })).toBeDisabled()
  })

  it("shows the reason when a purchase fails", async () => {
    setup({ onBuy: jest.fn().mockRejectedValue(new Error("You don't have enough chips.")) })
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    fireEvent.click(screen.getByRole("button", { name: /^Buy for/ }))
    expect(await screen.findByRole("alert")).toHaveTextContent("You don't have enough chips.")
  })

  it("can't be bought without enough chips", () => {
    setup({ balance: 400 })
    expect(screen.getByText("Not enough chips")).toBeInTheDocument()
    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("shows owned items as owned instead of for sale", () => {
    setup({ item: { ...flare, owned: true } })
    expect(screen.getByText("Owned")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Buy/ })).not.toBeInTheDocument()
  })

  it("asks guests to sign in", () => {
    setup({ signedIn: false, balance: null })
    expect(screen.getByRole("link", { name: "Sign in to buy" })).toHaveAttribute("href", "/")
  })
})

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
  it("shows the preview, rarity, name, description and price", () => {
    setup()
    expect(screen.getByRole("img", { name: "Diamond Flare preview" })).toBeInTheDocument()
    expect(screen.getByText("rare")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Diamond Flare" })).toBeInTheDocument()
    expect(screen.getByText("Crimson rays burst from a bright diamond core.")).toBeInTheDocument()
    expect(screen.getByText("650")).toBeInTheDocument()
  })

  it("asks you to confirm, showing your balance afterwards, before buying", async () => {
    const { onBuy } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    expect(screen.getByText("Balance after: 350 chips")).toBeInTheDocument()
    expect(onBuy).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(onBuy).toHaveBeenCalledWith(flare)
  })

  it("can back out of the confirm", () => {
    setup()
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }))
    expect(screen.getByRole("button", { name: "Buy Diamond Flare" })).toBeInTheDocument()
  })

  it("disables the confirm while the purchase is in flight, so it can't be sent twice", async () => {
    setup({ onBuy: () => new Promise(() => {}) })
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(await screen.findByRole("button", { name: "Buying…" })).toBeDisabled()
  })

  it("shows the reason on the card when a purchase fails", async () => {
    setup({ onBuy: jest.fn().mockRejectedValue(new Error("You don't have enough chips.")) })
    fireEvent.click(screen.getByRole("button", { name: "Buy Diamond Flare" }))
    fireEvent.click(screen.getByRole("button", { name: "Confirm" }))
    expect(await screen.findByRole("alert")).toHaveTextContent("You don't have enough chips.")
    expect(screen.getByRole("button", { name: "Buy Diamond Flare" })).toBeInTheDocument()
  })

  it("says how many more chips you need when you can't afford it", () => {
    setup({ balance: 400 })
    expect(screen.getByRole("button", { name: "Need 250 more" })).toBeDisabled()
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

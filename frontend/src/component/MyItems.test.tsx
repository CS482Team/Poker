import { fireEvent, render, screen, within } from "@testing-library/react"
import MyItems from "@/component/MyItems"
import { makeItem } from "@/component/cosmetic/makeItem"
import type { Loadout } from "@shared/Cosmetics"

const lattice = makeItem({ id: "back-1", name: "Midnight Lattice", type: "card_back", rarity: "common", style: { pattern: "lattice" } })
const flare = makeItem({ id: "back-2", name: "Diamond Flare", type: "card_back", rarity: "rare", style: { pattern: "rays" } })
const spender = makeItem({ id: "tag-1", name: "Big Spender", type: "name_tag", rarity: "legendary", style: { text: "Big Spender" } })
const laugh = makeItem({ id: "emote-1", name: "Big Laugh", type: "emote", rarity: "rare", style: { text: "😂" } })

function setup(loadout: Loadout = {}, items = [lattice, flare, spender, laugh]) {
  const onEquip = jest.fn()
  const onUnequip = jest.fn()
  render(<MyItems username="charley" items={items} loadout={loadout} onEquip={onEquip} onUnequip={onUnequip} />)
  return { onEquip, onUnequip }
}

describe("MyItems", () => {
  it("points new players to the shop", () => {
    setup({}, [])
    expect(screen.getByText("You don't own any cosmetics yet.")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Visit the shop" })).toHaveAttribute("href", "/shop")
  })

  it("groups owned items by category", () => {
    setup()
    expect(screen.getByRole("heading", { name: "Card backs" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Name tags" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Emotes" })).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: "Avatars" })).not.toBeInTheDocument()
  })

  it("shows each item's rarity", () => {
    setup()
    const tile = screen.getByRole("article", { name: "Big Spender" })
    expect(within(tile).getByText("legendary")).toBeInTheDocument()
  })

  it("equips an item into the slot for its type", () => {
    const { onEquip } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Equip Diamond Flare" }))
    expect(onEquip).toHaveBeenCalledWith(flare, "card_back")
  })

  it("marks the equipped item and lets you take it off", () => {
    const { onUnequip } = setup({ card_back: lattice })
    const tile = screen.getByRole("article", { name: "Midnight Lattice" })
    expect(within(tile).getByText("Equipped")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Equip Midnight Lattice" })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole("button", { name: "Unequip Midnight Lattice" }))
    expect(onUnequip).toHaveBeenCalledWith("card_back")
  })

  it("puts an emote in the wheel slot you pick", () => {
    const { onEquip } = setup()
    fireEvent.click(screen.getByRole("button", { name: "Put Big Laugh in slot 2" }))
    expect(onEquip).toHaveBeenCalledWith(laugh, "emote_2")
  })

  it("takes an emote out when you press its slot again", () => {
    const { onUnequip } = setup({ emote_3: laugh })
    const slot = screen.getByRole("button", { name: "Put Big Laugh in slot 3" })
    expect(slot).toHaveAttribute("aria-pressed", "true")
    fireEvent.click(slot)
    expect(onUnequip).toHaveBeenCalledWith("emote_3")
  })

  it("previews your look with the equipped name tag under your name", () => {
    setup({ name_tag: spender })
    const look = screen.getByRole("region", { name: "Your look" })
    expect(within(look).getByText("charley")).toBeInTheDocument()
    expect(within(look).getByText("Big Spender")).toBeInTheDocument()
  })

  it("shows the emote wheel, with a way to clear a filled slot", () => {
    const { onUnequip } = setup({ emote_1: laugh })
    const look = screen.getByRole("region", { name: "Your look" })
    expect(within(look).getAllByText("Empty")).toHaveLength(3)
    fireEvent.click(within(look).getByRole("button", { name: "Remove Big Laugh from slot 1" }))
    expect(onUnequip).toHaveBeenCalledWith("emote_1")
  })
})

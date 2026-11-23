"use client"

/* dresses the poker table in your equipped theme */
import { useMyLoadout } from "@/hook/useMyLoadout"
import { themeVariables } from "@/util/Cosmetic"
import { useEffect } from "react"

/* puts your theme's CSS variables on the page root, where the table's CSS reads them; only your own screen changes */
export default function ThemeApplier() {
  const theme = useMyLoadout().theme

  useEffect(() => {
    if (!theme) return
    const root = document.documentElement
    const vars = themeVariables(theme)
    for (const [name, value] of Object.entries(vars)) root.style.setProperty(name, value)
    // a slow sheen across the rail (e.g. Gold Foil), switched on in CSS by this attribute
    if (theme.style.animation === "shimmer") root.dataset.tableShimmer = ""

    return () => {
      for (const name of Object.keys(vars)) root.style.removeProperty(name)
      delete root.dataset.tableShimmer
    }
  }, [theme])

  return null
}

import "./globals.css"
import { Oswald } from "next/font/google"
import type { Metadata } from "next"

const oswald = Oswald({ subsets: ["latin"], variable: "--font-oswald" })

export const metadata: Metadata = { title: "Hearts & Diamonds" }

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={oswald.variable}>
      <body>{children}</body>
    </html>
  )
}
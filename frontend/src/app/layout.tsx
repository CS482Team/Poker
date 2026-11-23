import MusicPlayer from "@/component/layout/MusicPlayer";
import Nav from "@/component/layout/NavBar";
import ThemeApplier from "@/component/layout/ThemeApplier";
import { Suspense } from "react";
import "./globals.css";
import "./site.css";

export const metadata = { title: "Hearts & Diamonds" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="app-shell min-h-screen text-[#f5f2ef]">
        <Suspense>
          <Nav />
          <ThemeApplier />
          <MusicPlayer />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
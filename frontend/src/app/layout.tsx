import Nav from "@/component/NavBar";
import { Suspense } from "react";
import "./globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body className="app-shell min-h-screen text-[#f5f2ef]">
        <Suspense>
          <Nav />
        </Suspense>
        {children}
      </body>
    </html>
  )
}
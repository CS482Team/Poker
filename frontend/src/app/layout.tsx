import Nav from "@/component/Nav";
import { Suspense } from "react";
import "./globals.css";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>
        <Suspense>
          <Nav />
        </Suspense>
        {children}
      </body>
    </html>
  );
}

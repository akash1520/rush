import "./globals.css";
import type { ReactNode } from "react";
import { Providers } from "../lib/providers";

export const metadata = {
  title: "Rush",
  description: "Rush is a tool for building websites with AI assistance",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg-light dark:bg-bg-dark text-fg-light dark:text-fg-dark font-mono antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}




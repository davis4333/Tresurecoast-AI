import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treasure Coast AI",
  description: "Capture leads while you sleep."
};

/**
 * Root layout - minimal HTML shell.
 *
 * ClerkProvider is NOT here to avoid build-time validation issues.
 * Authenticated routes use ClerkProvider in their own layout (/app/app/layout.tsx).
 * Public routes use their own layout (/(public)/layout.tsx).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}

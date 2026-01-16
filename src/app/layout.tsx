import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treasure Coast AI",
  description: "Capture leads while you sleep."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">{children}</body>
    </html>
  );
}

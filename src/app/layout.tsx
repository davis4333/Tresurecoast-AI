import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treasure Coast AI",
  description: "Capture leads while you sleep."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {clerkPubKey ? (
          <ClerkProvider publishableKey={clerkPubKey}>
            {children}
          </ClerkProvider>
        ) : (
          children
        )}
      </body>
    </html>
  );
}

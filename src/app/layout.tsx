import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Treasure Coast AI",
  description: "Capture leads while you sleep."
};

function shouldUseClerk(): boolean {
  if (process.env.DEV_BYPASS_AUTH === "true" && process.env.NODE_ENV !== "production") {
    return false;
  }
  const pk = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  return pk.startsWith("pk_");
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const useClerk = shouldUseClerk();
  const clerkPubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {useClerk ? (
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

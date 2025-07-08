"use client";

import { ConvexReactClient, ConvexProvider } from "convex/react"; // Import ConvexProvider
// import { ConvexProviderWithClerk } from "convex/react-clerk"; // Remove Clerk specific provider
// import { ClerkProvider } from "@clerk/nextjs"; // Remove Clerk provider

// IMPORTANT: Replace this with your actual Convex deployment URL
// You can find this in your Convex dashboard or the output of `npx convex dev`
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!;

if (!convexUrl) {
  throw new Error(
    "NEXT_PUBLIC_CONVEX_URL is not set. Please set it in your .env.local file."
  );
}

const convex = new ConvexReactClient(convexUrl);

// Using ConvexProvider directly as Clerk is not in use.

export function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      {children}
    </ConvexProvider>
  );
}
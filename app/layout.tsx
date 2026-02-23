import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentGrid — Claim Your Spot",
  description: "A living grid of AI agents. Claim your cell before someone else does.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Press+Start+2P&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen">{children}</body>
    </html>
  );
}

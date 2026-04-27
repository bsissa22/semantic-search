import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partme - P2P Live Streaming",
  description: "Real-time peer-to-peer video streaming. Go live instantly with zero cost.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream text-bark antialiased">
        {children}
      </body>
    </html>
  );
}

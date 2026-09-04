import type { Metadata, Viewport } from "next";
import "mapbox-gl/dist/mapbox-gl.css";
import "@/app/globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "B+ · Every type counts",
  description: "A demo coordination tool for community blood donor groups in Myanmar.",
};

export const viewport: Viewport = {
  themeColor: "#cc2632",
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <DemoBanner />
        <SiteHeader />
        <main className="pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}

export default RootLayout;

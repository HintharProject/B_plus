import type { Metadata, Viewport } from "next";
import "@/app/globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { AppProviders } from "@/components/providers/app-providers";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SkipLink } from "@/components/skip-link";

export const metadata: Metadata = {
  title: {
    default: "B+ · သွေးအမျိုးအစားတိုင်း အရေးပါသည်",
    template: "%s · B+",
  },
  description: "A privacy-first blood donation coordination platform for Myanmar.",
};

export const viewport: Viewport = {
  themeColor: "#cc2632",
};

function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="my" suppressHydrationWarning>
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <AppProviders>
          <SkipLink />
          <SiteHeader />
          <main id="main-content" className="pb-28 md:pb-0">{children}</main>
          <SiteFooter />
          <BottomNav />
        </AppProviders>
      </body>
    </html>
  );
}

export default RootLayout;

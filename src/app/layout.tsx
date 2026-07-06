import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/components/providers/session-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { createPageMetadata } from "@/lib/seo";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  ...createPageMetadata({
    title: "topup.mn - Тоглоомын карт QPay-ээр авах",
    description:
      "Монголд Steam, Roblox, PUBG Mobile, Minecraft, PlayStation, Xbox, Nintendo зэрэг тоглоомын картуудыг QPay-ээр хурдан, хялбар худалдан аваарай.",
    keywords: [
      "тоглоомын карт",
      "Steam карт",
      "Roblox карт",
      "PUBG UC",
      "QPay тоглоомын карт",
      "gift card Mongolia",
    ],
  }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://topup.mn"),
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.png", sizes: "256x256", type: "image/png" },
    ],
    shortcut: "/favicon-32.png",
    apple: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body className="antialiased min-h-screen flex flex-col pb-[env(safe-area-inset-bottom)]">
        <SessionProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  );
}

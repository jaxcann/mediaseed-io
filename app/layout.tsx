import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CursorFollower } from "@/components/CursorFollower";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mediaseed.io"),
  title: "Mediaseed — a content network",
  description:
    "The HQ of the Mediaseed network — YouTube channels, daily games, and iOS apps, all grown in-house and made in Georgia.",
  keywords: [
    "Mediaseed",
    "content network",
    "YouTube channels",
    "daily game",
    "DAILY REBUILD",
    "Surgepod",
    "DayTapes",
    "iOS apps",
    "Georgia",
  ],
  authors: [{ name: "Mediaseed" }],
  creator: "Mediaseed",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediaseed.io",
    siteName: "Mediaseed",
    title: "Mediaseed — a content network",
    description:
      "The HQ of the Mediaseed network — YouTube channels, daily games, and iOS apps, all grown in-house and made in Georgia.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mediaseed — a content network",
    description:
      "Channels, games, and apps — all grown in-house. This is the HQ.",
    creator: "@mediaseed",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="bg-bg text-fg font-sans antialiased">
        <ScrollProgress />
        <CursorFollower />
        {children}
        {/* Vercel Web Analytics — activates once Analytics is enabled on the
            project in the Vercel dashboard; harmless no-op until then. */}
        <script defer src="/_vercel/insights/script.js" />
      </body>
    </html>
  );
}

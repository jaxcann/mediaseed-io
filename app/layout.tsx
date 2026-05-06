import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CursorFollower } from "@/components/CursorFollower";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mediaseed.io"),
  title: "Mediaseed — Social media + web for practices that take the long view",
  description:
    "A Georgia creative studio. Social, content, and web for medical, cosmetic, and hospitality practices — Atlanta metro to Athens. Planted from seed, grown deliberately.",
  keywords: [
    "Mediaseed",
    "social media management",
    "medical marketing",
    "dental marketing",
    "Georgia",
    "Atlanta",
    "Athens GA",
    "content production",
    "creative studio",
  ],
  authors: [{ name: "Jax Cannon" }],
  creator: "Jax Cannon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediaseed.io",
    siteName: "Mediaseed",
    title: "Mediaseed — Social media + web for practices that take the long view",
    description:
      "A Georgia creative studio. Social, content, and web for medical, cosmetic, and hospitality practices — Atlanta metro to Athens. Planted from seed, grown deliberately.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mediaseed",
    description:
      "Social media + web for practices that take the long view. A studio in Georgia.",
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
      </body>
    </html>
  );
}

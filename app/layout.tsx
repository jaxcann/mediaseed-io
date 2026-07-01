import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ScrollProgress } from "@/components/ScrollProgress";
import { CursorFollower } from "@/components/CursorFollower";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://mediaseed.io"),
  title: "Mediaseed — Jax Cannon · creative & developer",
  description:
    "The portfolio of Jax Cannon — video, social, web, and iOS apps, made in Georgia. Content that's crossed a million views, plus software shipped to the App Store.",
  keywords: [
    "Jax Cannon",
    "Mediaseed",
    "portfolio",
    "creative",
    "video editor",
    "content creator",
    "social media",
    "web developer",
    "iOS developer",
    "Georgia",
  ],
  authors: [{ name: "Jax Cannon" }],
  creator: "Jax Cannon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediaseed.io",
    siteName: "Mediaseed",
    title: "Mediaseed — Jax Cannon · creative & developer",
    description:
      "The portfolio of Jax Cannon — video, social, web, and iOS apps, made in Georgia. Content that's crossed a million views, plus software shipped to the App Store.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mediaseed — Jax Cannon",
    description:
      "Video, social, web, and iOS apps, made in Georgia. A portfolio of everything I make.",
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

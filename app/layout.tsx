import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ScrollProgress } from "@/components/ScrollProgress";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.mediaseed.io"),
  title: "Jax Cannon | media producer & AI-native builder",
  description:
    "Video, motion graphics, and social content, plus shipped software. 1M+ organic views for a 7-location medical practice, PBS post-production credits, two App Store apps, and two browser games.",
  keywords: [
    "Jax Cannon",
    "media producer",
    "motion graphics",
    "social media manager",
    "video editor",
    "AI-native",
    "creative technologist",
    "Surgepod",
    "DayTapes",
    "Fairways",
    "Athens Georgia",
  ],
  authors: [{ name: "Jax Cannon" }],
  creator: "Jax Cannon",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.mediaseed.io",
    siteName: "Jax Cannon | mediaseed",
    title: "Jax Cannon | media producer & AI-native builder",
    description:
      "Video, motion graphics, and social content, plus shipped software. 1M+ organic views, PBS credits, two App Store apps, two browser games.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jax Cannon | media producer & AI-native builder",
    description:
      "Video, motion, social, and shipped software. 1M+ organic views, PBS credits, 4 shipped projects.",
    creator: "@mediaseed",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
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
      <body className="bg-hq-cream text-hq-ink font-sans antialiased">
        <ScrollProgress />
        {children}
        {/* Vercel Web Analytics — activates once Analytics is enabled on the
            project in the Vercel dashboard; harmless no-op until then. */}
        <script defer src="/_vercel/insights/script.js" />
      </body>
    </html>
  );
}

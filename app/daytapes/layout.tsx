import type { Metadata, Viewport } from "next";
import { DayTapesNav } from "@/components/daytapes/Nav";
import { DayTapesFooter } from "@/components/daytapes/Footer";

export const metadata: Metadata = {
  title: "DayTapes — your day, on one tape",
  description:
    "DayTapes turns your day into a tape of tiny moments — photos, 3-second loops, and sticker cut-outs — then into comics, carousels, PunchCards, Tapegrams, and Live Tapes worth sharing. Private by design.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://mediaseed.io/daytapes",
    siteName: "DayTapes",
    title: "DayTapes — your day, on one tape",
    description:
      "Capture your day in tiny moments. Cut anything into a sticker. Share it as a comic, a carousel, a PunchCard, a Tapegram, or a Live Tape. Everything stays on your device.",
    images: [{ url: "/daytapes/comic.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DayTapes — your day, on one tape",
    description:
      "Capture your day in tiny moments. Private by design — everything stays on your device.",
    images: ["/daytapes/comic.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#E8743C",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function DayTapesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: tracking, leading, font-smoothing applied here so the daytapes
  // section visually steps outside the studio's Geist-led typography.
  return (
    <div className="daytapes-root bg-daytapes-ink text-white antialiased min-h-screen [text-rendering:optimizeLegibility]">
      <DayTapesNav />
      {children}
      <DayTapesFooter />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { DotField } from "@/components/DotField";
import { Reveal } from "@/components/Reveal";
import { AppCard, type AppEntry } from "@/components/AppCard";

export const metadata: Metadata = {
  title: "Apps — Mediaseed",
  description:
    "A small shelf of software shipped and in the works from the Mediaseed studio — Surgepod, Day Tapes, Pocket Pods.",
  openGraph: {
    title: "Apps — Mediaseed",
    description:
      "A small shelf of software shipped and in the works from the Mediaseed studio.",
    url: "https://mediaseed.io/apps",
    type: "website",
  },
};

const apps: Omit<AppEntry, "index" | "total">[] = [
  {
    name: "Surgepod",
    tagline: "All your stats. Nostalgic UI.",
    description:
      "A focused music player built around a tactile, hardware-inspired interface. Browse and play through a device-style UI, connect Apple Music or upload your own files, and quietly track total listening time, top songs, top artists, and top albums. No social, no algorithms, no attention games — just listening, well measured.",
    status: "live",
    platform: "iOS · iOS 26.1+",
    meta: ["Released 2025", "Free + Pro $4.99", "Music"],
    href: "https://apps.apple.com/us/app/surgepod-track-your-listening/id6758268658",
    cta: "View in App Store",
  },
  {
    name: "DayTapes",
    tagline: "Your whole day, on one tape.",
    description:
      "Catch your day in tiny moments — photos, 3-second loops, and sticker cut-outs — that stitch into a tape you can play back, then turn into comics, carousels, PunchCards, Tapegrams, and Live Tapes worth sharing. Private by design: everything stays on the phone.",
    status: "live",
    platform: "iOS · App Store",
    meta: ["Free + Pro", "Private by design", "Made in Georgia"],
    href: "https://apps.apple.com/us/app/daytapes/id6771819144",
    cta: "View in App Store",
  },
  {
    name: "Pocket Pods",
    tagline: "Podcasts, pocket-shaped.",
    description:
      "A pocket-first podcast experience for people who already know what they listen to. In active development. The goal isn't another discovery feed — it's the calmest possible place to keep the shows you actually care about.",
    status: "dev",
    platform: "iOS · in development",
    meta: ["Targeting 2026", "TestFlight soon"],
    cta: "Releasing soon",
  },
];

const liveCount = apps.filter((a) => a.status === "live").length;
const devCount = apps.filter((a) => a.status === "dev").length;

export default function AppsPage() {
  return (
    <>
      <Nav />
      <main>
        <section
          id="top"
          className="relative pt-32 sm:pt-36 pb-12 sm:pb-16 md:pt-44 md:pb-24 px-5 sm:px-6 md:px-10 overflow-hidden"
        >
          <DotField variant="hero" bloomCount={9} />

          <div className="relative mx-auto w-full max-w-content">
            <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-6 sm:mb-8 animate-fade-in">
              <span className="inline-flex items-center gap-2.5">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 hover:text-fg transition-colors"
                >
                  <ArrowLeft size={12} />
                  Studio
                </Link>
                <span aria-hidden="true" className="text-border-strong">
                  /
                </span>
                <span className="text-fg">Apps</span>
              </span>
            </div>

            <h1 className="text-[clamp(2.5rem,9vw,7rem)] font-medium tracking-tightest leading-[1.02] sm:leading-[0.98] text-fg max-w-[16ch] sm:max-w-[14ch] animate-fade-up">
              <span className="md:block">Software,</span>{" "}
              <span className="md:block text-muted">grown the same way.</span>
            </h1>

            <p
              className="mt-8 sm:mt-10 text-base md:text-xl text-muted max-w-2xl leading-relaxed animate-fade-up"
              style={{ animationDelay: "120ms", animationFillMode: "both", opacity: 0 }}
            >
              Small apps from the network — built for intention over
              engagement. Two in the App Store, more in the soil.
            </p>

            <div
              className="mt-10 sm:mt-14 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-muted-strong animate-fade-in flex flex-wrap items-center gap-x-3 gap-y-2"
              style={{ animationDelay: "240ms", animationFillMode: "both", opacity: 0 }}
            >
              <span>{liveCount} shipped</span>
              <span
                aria-hidden="true"
                className="hidden sm:inline-block h-1 w-1 rounded-full bg-border-strong"
              />
              <span>{devCount} in development</span>
              <span
                aria-hidden="true"
                className="hidden sm:inline-block h-1 w-1 rounded-full bg-border-strong"
              />
              <span>Made by Mediaseed</span>
            </div>
          </div>
        </section>

        <section className="py-12 sm:py-16 md:py-24 px-5 sm:px-6 md:px-10">
          <div className="mx-auto max-w-content space-y-4 sm:space-y-5 md:space-y-6">
            {apps.map((app, i) => (
              <AppCard
                key={app.name}
                app={{ ...app, index: i + 1, total: apps.length }}
                delay={i * 90}
              />
            ))}
          </div>

          <div className="mx-auto max-w-content mt-12 sm:mt-16 md:mt-20">
            <Reveal>
              <div className="rounded-xl border border-border bg-bg-elevated/30 p-6 sm:p-7 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                  <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-3">
                    More on the way
                  </div>
                  <p className="text-base sm:text-lg md:text-xl text-fg/85 max-w-xl leading-relaxed">
                    Want to know when the next one ships? The studio sends a
                    short note when something new lands.
                  </p>
                </div>
                <a
                  href="mailto:hello@mediaseed.io?subject=Notify%20me%20when%20new%20apps%20ship"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-fg text-bg px-6 py-4 sm:py-3.5 text-sm font-medium hover:bg-accent hover:text-fg transition-colors self-stretch md:self-start"
                >
                  Get notified
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </a>
              </div>
            </Reveal>
          </div>

          <div className="mx-auto max-w-content mt-10 sm:mt-12">
            <Reveal>
              <Link
                href="/"
                className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-muted hover:text-fg transition-colors"
              >
                <ArrowLeft size={13} />
                Back to the studio
              </Link>
            </Reveal>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

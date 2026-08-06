import type { Viewport } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Play,
  Gamepad2,
  Download,
  Youtube,
} from "lucide-react";
import { HqNav } from "@/components/hq/HqNav";
import { Particles } from "@/components/hq/Particles";
import { Marquee } from "@/components/hq/Marquee";
import { LatestDrops } from "@/components/hq/LatestDrops";
import { channels } from "@/components/hq/channels";
import { Reveal } from "@/components/Reveal";

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const apps = [
  {
    name: "Surgepod",
    blurb:
      "A focused music player with a tactile, hardware-inspired interface — and it quietly tracks everything you listen to.",
    store:
      "https://apps.apple.com/us/app/surgepod-track-your-listening/id6758268658",
    site: "/apps",
    siteLabel: "About the apps",
    from: "#7DD6E8",
    to: "#8B72EA",
  },
  {
    name: "DayTapes",
    blurb:
      "Your whole day on one tape — photos, 3-second loops, and cut-out stickers. Private by design; nothing leaves your phone.",
    store: "https://apps.apple.com/us/app/daytapes/id6771819144",
    site: "/daytapes",
    siteLabel: "Visit the site",
    from: "#FFC29E",
    to: "#E85DA8",
  },
];

export default function Page() {
  return (
    <div className="hq-root min-h-screen bg-hq-cream text-hq-ink">
      <HqNav />
      <main>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden">
          <Particles className="absolute inset-0 h-full w-full" />

          <div className="relative mx-auto w-full max-w-content px-5 sm:px-6 md:px-10 pt-24 pb-10 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-hq-ink/15 bg-hq-cream/70 backdrop-blur-sm px-4 py-2 font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-hq-ink-soft animate-fade-in">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #E85DA8, #8B72EA 50%, #38B8D8)",
                }}
              />
              A content network · est. 2024
            </div>

            <h1 className="mt-6 sm:mt-8 font-medium tracking-tightest leading-[0.92] text-[clamp(3.25rem,15vw,11rem)] animate-fade-up">
              <span className="hq-grad-text">mediaseed</span>
            </h1>

            <p
              className="mx-auto mt-6 sm:mt-8 max-w-2xl text-base md:text-xl text-hq-ink-soft leading-relaxed animate-fade-up"
              style={{ animationDelay: "120ms", animationFillMode: "both", opacity: 0 }}
            >
              Channels, games, and apps — all grown in-house, all shipped
              constantly. This is the HQ.
            </p>

            <div
              className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "240ms", animationFillMode: "both", opacity: 0 }}
            >
              <a
                href="#channels"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-hq-ink text-hq-cream px-6 py-4 sm:py-3.5 text-sm font-semibold hover:opacity-85 transition-opacity"
              >
                <Play size={15} className="fill-current" />
                Watch
              </a>
              <a
                href="/rebuild"
                className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink transition-transform hover:-translate-y-0.5"
                style={{
                  background:
                    "linear-gradient(94deg, #F6A8D8, #B9A8F5 45%, #7DD6E8)",
                }}
              >
                <Gamepad2 size={16} />
                Play
              </a>
              <Link
                href="/apps"
                className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-hq-ink/20 px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink hover:border-hq-ink transition-colors"
              >
                <Download size={15} />
                Download
              </Link>
            </div>

            <div
              className="mt-14 sm:mt-20 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-hq-ink-soft/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 animate-fade-in"
              style={{ animationDelay: "360ms", animationFillMode: "both", opacity: 0 }}
            >
              <span>5 channels</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-hq-ink/25" />
              <span>1 daily game</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-hq-ink/25" />
              <span>2 apps in the App Store</span>
            </div>
          </div>
        </section>

        <Marquee />

        {/* ── CHANNELS ─────────────────────────────────────────────────── */}
        <section id="channels" className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20">
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-hq-ink-soft mb-4 flex items-center gap-3">
                <Youtube size={13} className="text-hq-pink-deep" />
                Channels
              </div>
              <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl">
                Five channels.
                <span className="text-hq-ink-soft"> Pick your flavor.</span>
              </h2>
            </Reveal>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {channels.map((c, i) => (
                <Reveal key={c.handle} delay={(i % 3) * 80}>
                  <a
                    href={`https://www.youtube.com/@${c.handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block rounded-2xl border-2 border-hq-ink/10 bg-white/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]"
                  >
                    <div
                      className="relative h-28 sm:h-32 flex items-end p-4"
                      style={{
                        background: `linear-gradient(135deg, ${c.from}, ${c.to})`,
                      }}
                    >
                      <span className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/40 text-hq-ink opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight size={15} />
                      </span>
                      <span className="font-medium tracking-tightest text-[2.75rem] leading-none text-white/90 select-none">
                        {c.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="p-5">
                      <div className="text-lg font-semibold tracking-tight">
                        {c.name}
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-hq-ink-soft">
                        youtube.com/@{c.handle}
                      </div>
                      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-hq-ink group-hover:text-hq-pink-deep transition-colors">
                        Watch on YouTube
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </a>
                </Reveal>
              ))}

              {/* Sixth cell: network house ad */}
              <Reveal delay={160}>
                <div
                  className="flex h-full min-h-[220px] flex-col justify-center rounded-2xl p-6"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(246,168,216,0.35), rgba(185,168,245,0.35) 50%, rgba(125,214,232,0.35))",
                  }}
                >
                  <p className="text-xl font-semibold tracking-tight leading-snug">
                    More channels sprouting.
                  </p>
                  <p className="mt-2 text-sm text-hq-ink-soft leading-relaxed">
                    The network grows all the time — new shows, new formats, new
                    fevers. Watch this space.
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── LATEST DROPS ─────────────────────────────────────────────── */}
        <LatestDrops />

        {/* ── GAMES ────────────────────────────────────────────────────── */}
        <section id="games" className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20">
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-hq-ink-soft mb-4 flex items-center gap-3">
                <Gamepad2 size={13} className="text-hq-cyan-deep" />
                Games
              </div>
            </Reveal>

            <Reveal delay={80}>
              <a
                href="/rebuild"
                className="group relative block overflow-hidden rounded-3xl bg-hq-ink text-hq-cream transition-transform duration-300 hover:-translate-y-1"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(70% 90% at 80% 10%, rgba(232,93,168,0.55), transparent 60%), radial-gradient(60% 80% at 15% 90%, rgba(56,184,216,0.5), transparent 60%), radial-gradient(50% 60% at 55% 50%, rgba(139,114,234,0.35), transparent 70%)",
                  }}
                />
                <div className="relative p-7 sm:p-10 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-8">
                    <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase text-hq-cream/60 mb-4">
                      Daily · Free · In your browser
                    </div>
                    <h3 className="text-[clamp(2.25rem,8vw,4.5rem)] font-medium tracking-tightest leading-[0.95]">
                      DAILY
                      <br />
                      REBUILD
                    </h3>
                    <p className="mt-5 max-w-lg text-base md:text-lg text-hq-cream/70 leading-relaxed">
                      The daily NBA GM puzzle. Take over a broken roster, work
                      the trade machine, and rebuild your way back — new save
                      every day.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex md:justify-end">
                    <span className="inline-flex items-center gap-2 rounded-full bg-hq-cream text-hq-ink px-7 py-4 text-sm font-bold transition-transform group-hover:scale-105">
                      Play today&apos;s
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-6 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-hq-ink-soft/80">
                More games in the greenhouse.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── APPS ─────────────────────────────────────────────────────── */}
        <section id="apps" className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20">
          <div className="mx-auto max-w-content">
            <Reveal>
              <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-hq-ink-soft mb-4 flex items-center gap-3">
                <Download size={13} className="text-hq-lav-deep" />
                Apps
              </div>
              <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl">
                In the App Store.
                <span className="text-hq-ink-soft"> Built here.</span>
              </h2>
            </Reveal>

            <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 gap-5">
              {apps.map((app, i) => (
                <Reveal key={app.name} delay={i * 90}>
                  <div className="group relative h-full flex flex-col rounded-2xl border-2 border-hq-ink/10 bg-white/60 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)] overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
                      style={{
                        background: `linear-gradient(135deg, ${app.from}, ${app.to})`,
                      }}
                    />
                    <h3 className="relative text-2xl sm:text-3xl font-semibold tracking-tight">
                      {app.name}
                    </h3>
                    <p className="relative mt-3 text-sm sm:text-base text-hq-ink-soft leading-relaxed">
                      {app.blurb}
                    </p>
                    <div className="relative mt-8 pt-5 border-t border-hq-ink/10 flex flex-wrap items-center gap-x-6 gap-y-3">
                      <a
                        href={app.store}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-hq-ink hover:text-hq-pink-deep transition-colors"
                      >
                        App Store
                        <ArrowUpRight size={14} />
                      </a>
                      <Link
                        href={app.site}
                        className="inline-flex items-center gap-1.5 text-sm font-medium text-hq-ink-soft hover:text-hq-ink transition-colors"
                      >
                        {app.siteLabel}
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────────────── */}
        <section id="contact" className="py-20 sm:py-24 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-20">
          <div className="mx-auto max-w-content text-center">
            <Reveal>
              <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02]">
                Talk to the network.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-hq-ink-soft leading-relaxed">
                Partnerships, collabs, press, or a weird idea that fits the
                roster — the inbox is open.
              </p>
              <a
                href="mailto:hello@mediaseed.io"
                className="mt-8 inline-block text-[clamp(1.25rem,4.5vw,2.25rem)] font-semibold tracking-tight hq-grad-text hover:opacity-80 transition-opacity"
              >
                hello@mediaseed.io
              </a>
            </Reveal>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-hq-ink/10 px-5 sm:px-6 md:px-10 pt-10 pb-10"
        style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto max-w-content">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <span className="flex items-center gap-2 font-mono text-sm tracking-tight lowercase">
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  background:
                    "linear-gradient(135deg, #E85DA8, #8B72EA 50%, #38B8D8)",
                }}
              />
              mediaseed
            </span>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 font-mono text-[11px] tracking-[0.14em] uppercase text-hq-ink-soft">
              <Link href="/apps" className="hover:text-hq-ink transition-colors">
                Apps
              </Link>
              <Link href="/daytapes" className="hover:text-hq-ink transition-colors">
                DayTapes
              </Link>
              <a href="/rebuild" className="hover:text-hq-ink transition-colors">
                Rebuild
              </a>
              <a
                href="mailto:hello@mediaseed.io"
                className="hover:text-hq-ink transition-colors"
              >
                Email
              </a>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-hq-ink/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2 font-mono text-[11px] tracking-[0.14em] uppercase text-hq-ink-soft/70">
            <p>© 2026 Mediaseed. Made in Georgia.</p>
            <p>Always growing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

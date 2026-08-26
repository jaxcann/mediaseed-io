import type { Viewport } from "next";
import {
  ArrowUpRight,
  ArrowRight,
  Gamepad2,
  FileText,
  Mail,
  Clapperboard,
  Smartphone,
  User,
} from "lucide-react";
import { PortfolioNav } from "@/components/PortfolioNav";
import { CaseStudies } from "@/components/CaseStudies";
import { Particles } from "@/components/hq/Particles";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { MagneticButton } from "@/components/MagneticButton";

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

// Motion / logo-animation reel. `id` is a YouTube video ID.
// Entries with an empty id are hidden until filled in.
const motionReel: { id: string; title: string; detail: string }[] = [
  { id: "", title: "", detail: "" },
];

const games = [
  {
    name: "Daily Rebuild",
    tag: "Browser · Free · Daily",
    blurb:
      "The daily NBA GM puzzle. Take over a broken roster, work the trade machine, and rebuild your way back.",
    href: "https://dailyrebuild.app",
    linkLabel: "Play Daily Rebuild",
    from: "#38B8D8",
    to: "#8B72EA",
  },
  {
    name: "Backyard",
    tag: "Browser · Free · vs bots",
    blurb:
      "Gym-class capture the flag, three on three. Free movement worth mastering, eight backyards to fight over, and a whole street of kids to unlock.",
    href: "/ctf",
    linkLabel: "Play Backyard",
    from: "#FF9A62",
    to: "#E85DA8",
  },
];

const apps = [
  {
    name: "DayTapes",
    tag: "iOS · App Store",
    blurb:
      "Your whole day on one tape: photos, 3-second loops, and cut-out stickers. Private by design; nothing ever leaves your phone. I designed the tape metaphor, the sticker system, and every pixel of the interface.",
    href: "https://apps.apple.com/us/app/daytapes/id6771819144",
    from: "#FFC29E",
    to: "#E85DA8",
  },
  {
    name: "Surgepod",
    tag: "iOS · App Store",
    blurb:
      "A focused music player with a tactile, hardware-inspired interface that quietly tracks everything you listen to. Built for people who miss holding their music: click wheel energy, modern guts.",
    href: "https://apps.apple.com/us/app/surgepod-track-your-listening/id6758268658",
    from: "#7DD6E8",
    to: "#8B72EA",
  },
];

const experience = [
  {
    role: "Social Media & Web Manager",
    org: "Vascular Surgical Associates",
    dates: "Jan 2025 – Jul 2026",
  },
  {
    role: "Motion Graphics & Post-Production",
    org: "Chris Greer Media · Viewfinders on PBS",
    dates: "2024 – Present",
  },
  {
    role: "B.A. Entertainment & Media Studies, New Media Institute Certificate",
    org: "University of Georgia",
    dates: "Dec 2024",
  },
];

function SectionHeader({
  icon,
  eyebrow,
  title,
  soft,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  soft?: string;
}) {
  return (
    <Reveal>
      <div className="hq-eyebrow mb-4 flex items-center gap-3">
        {icon}
        {eyebrow}
      </div>
      <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl">
        {title}
        {soft && <span className="text-hq-ink-soft"> {soft}</span>}
      </h2>
    </Reveal>
  );
}

export default function Page() {
  const filledReel = motionReel.filter((w) => w.id);

  return (
    <div className="hq-root min-h-screen bg-hq-cream text-hq-ink">
      <PortfolioNav />
      <main>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden">
          <Particles className="absolute inset-0 h-full w-full" />

          <div className="relative mx-auto w-full max-w-content px-5 sm:px-6 md:px-10 pt-24 pb-10 text-center">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-hq-ink/15 bg-hq-cream/70 backdrop-blur-sm px-4 py-2 hq-eyebrow animate-fade-in">
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full hq-grad-bg" />
              Athens, GA · open to remote
            </div>

            <h1 className="mt-6 sm:mt-8 font-medium tracking-tightest leading-[0.92] text-[clamp(3rem,13vw,9.5rem)] animate-fade-up">
              <span className="hq-grad-text">Jax Cannon</span>
            </h1>

            <p
              className="mx-auto mt-6 sm:mt-8 max-w-2xl text-base md:text-xl text-hq-ink-soft leading-relaxed animate-fade-up"
              style={{ animationDelay: "120ms", animationFillMode: "both", opacity: 0 }}
            >
              Media producer and AI-native builder. I make video, motion
              graphics, and social content. I ship software.
            </p>

            <div
              className="mt-10 sm:mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 animate-fade-up"
              style={{ animationDelay: "240ms", animationFillMode: "both", opacity: 0 }}
            >
              <MagneticButton>
                <a
                  href="mailto:jaxonkale124@gmail.com"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-hq-ink text-hq-cream px-6 py-4 sm:py-3.5 text-sm font-semibold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                >
                  <Mail size={15} />
                  Email me
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="#case-studies"
                  className="hq-grad-bg-soft inline-flex items-center justify-center gap-2 rounded-full px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                >
                  <Clapperboard size={16} />
                  See the work
                </a>
              </MagneticButton>
              <MagneticButton>
                <a
                  href="/resume.pdf"
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-hq-ink/20 px-6 py-4 sm:py-3.5 text-sm font-semibold text-hq-ink transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-hq-ink"
                >
                  <FileText size={15} />
                  Resume
                </a>
              </MagneticButton>
            </div>

            <div
              className="mt-14 sm:mt-20 hq-meta text-hq-ink-soft/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 animate-fade-in"
              style={{ animationDelay: "360ms", animationFillMode: "both", opacity: 0 }}
            >
              <span>
                <CountUp to={1000000} decimals={0} suffix="+" className="text-hq-ink" />{" "}
                organic views
              </span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-hq-ink/25" />
              <span>PBS credits</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-hq-ink/25" />
              <span>4 shipped projects</span>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-hq-ink/25" />
              <span>Zero ad spend</span>
            </div>
          </div>
        </section>

        <CaseStudies />

        {/* ── MOTION & LOGO ANIMATION ──────────────────────────────────── */}
        <section
          id="motion"
          className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
        >
          <div className="mx-auto max-w-content">
            <SectionHeader
              icon={<Clapperboard size={13} className="text-hq-lav-deep" />}
              eyebrow="Motion & logo animation"
              title="Things that move."
            />

            {filledReel.length > 0 ? (
              <div className="mt-10 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filledReel.map((w, i) => (
                  <Reveal key={w.id} delay={(i % 3) * 80}>
                    <figure className="group rounded-2xl border-2 border-hq-ink/10 bg-white/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]">
                      <div className="aspect-video bg-hq-ink/5">
                        <iframe
                          className="h-full w-full"
                          src={`https://www.youtube-nocookie.com/embed/${w.id}`}
                          title={w.title}
                          loading="lazy"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <figcaption className="p-5">
                        <div className="text-base font-semibold tracking-tight">
                          {w.title}
                        </div>
                        {w.detail && (
                          <p className="mt-1 text-sm text-hq-ink-soft leading-relaxed">
                            {w.detail}
                          </p>
                        )}
                      </figcaption>
                    </figure>
                  </Reveal>
                ))}
              </div>
            ) : (
              <Reveal delay={80}>
                <p className="mt-10 text-base text-hq-ink-soft">
                  I&apos;m cutting the reel right now.{" "}
                  <a
                    href="mailto:jaxonkale124@gmail.com"
                    className="font-semibold text-hq-ink hover:text-hq-pink-deep transition-colors"
                  >
                    Email me
                  </a>{" "}
                  for samples in the meantime.
                </p>
              </Reveal>
            )}
          </div>
        </section>

        {/* ── GAMES ────────────────────────────────────────────────────── */}
        <section
          id="games"
          className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
        >
          <div className="mx-auto max-w-content">
            <SectionHeader
              icon={<Gamepad2 size={13} className="text-hq-cyan-deep" />}
              eyebrow="Web games"
              title="Playable, in your browser,"
              soft="right now."
            />

            {/* Fairways — feature card */}
            <Reveal delay={80}>
              <a
                href="/fairways"
                className="group relative block overflow-hidden rounded-3xl bg-hq-ink text-hq-cream transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(20,19,25,0.28)] mt-10 sm:mt-14"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(70% 90% at 80% 10%, rgba(125,214,232,0.55), transparent 60%), radial-gradient(60% 80% at 15% 90%, rgba(139,234,158,0.45), transparent 60%), radial-gradient(50% 60% at 55% 50%, rgba(139,114,234,0.35), transparent 70%)",
                  }}
                />
                <div className="relative p-7 sm:p-10 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-8">
                    <div className="hq-eyebrow text-hq-cream/60 mb-4">
                      Browser · Free · Built with Three.js
                    </div>
                    <h3 className="text-[clamp(2.25rem,8vw,4.5rem)] font-medium tracking-[-0.01em] leading-[0.95] uppercase">
                      Fairways
                    </h3>
                    <p className="mt-5 max-w-lg text-base md:text-lg text-hq-cream/70 leading-relaxed">
                      Design, route, and run your own golf course. A full
                      management sim with members, an economy, and tee sheets,
                      wrapped around a course builder.
                    </p>
                  </div>
                  <div className="md:col-span-4 flex md:justify-end">
                    <span className="inline-flex items-center gap-2 rounded-full bg-hq-cream text-hq-ink px-7 py-4 text-sm font-bold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105">
                      Play Fairways
                      <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {games.map((g, i) => (
                <Reveal key={g.name} delay={i * 90}>
                  <div className="group relative h-full flex flex-col rounded-2xl border-2 border-hq-ink/10 bg-white/60 p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)] overflow-hidden">
                    <div
                      aria-hidden="true"
                      className="absolute -top-16 -right-16 h-44 w-44 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
                      style={{
                        background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                      }}
                    />
                    <div className="relative hq-eyebrow">
                      {g.tag}
                    </div>
                    <h3 className="relative mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                      {g.name}
                    </h3>
                    <p className="relative mt-3 text-sm sm:text-base text-hq-ink-soft leading-relaxed">
                      {g.blurb}
                    </p>
                    {g.href && (
                      <div className="relative mt-auto pt-6">
                        <a
                          href={g.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-hq-ink hover:text-hq-pink-deep transition-colors"
                        >
                          {g.linkLabel}
                          <ArrowUpRight size={14} />
                        </a>
                      </div>
                    )}
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── APPS ─────────────────────────────────────────────────────── */}
        <section
          id="apps"
          className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
        >
          <div className="mx-auto max-w-content">
            <SectionHeader
              icon={<Smartphone size={13} className="text-hq-peach-deep" />}
              eyebrow="iOS apps"
              title="In the App Store."
              soft="Designed and built solo."
            />

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
                    <div className="relative hq-eyebrow">
                      {app.tag}
                    </div>
                    <h3 className="relative mt-3 text-2xl sm:text-3xl font-semibold tracking-tight">
                      {app.name}
                    </h3>
                    <p className="relative mt-3 text-sm sm:text-base text-hq-ink-soft leading-relaxed">
                      {app.blurb}
                    </p>
                    <div className="relative mt-auto pt-6">
                      <a
                        href={app.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-hq-ink hover:text-hq-pink-deep transition-colors"
                      >
                        Download on the App Store
                        <ArrowUpRight size={14} />
                      </a>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal delay={160}>
              <p className="mt-6 hq-meta text-hq-ink-soft/80">
                AI-assisted development across the stack, idea to App Store.
              </p>
            </Reveal>
          </div>
        </section>

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        <section
          id="about"
          className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
        >
          <div className="mx-auto max-w-content">
            <SectionHeader
              icon={<User size={13} className="text-hq-pink-deep" />}
              eyebrow="About"
              title="Who's making all this?"
            />

            <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-14">
              <div className="md:col-span-7">
                <p className="text-base md:text-lg text-hq-ink-soft leading-relaxed">
                  I&apos;m Jax Cannon, 24, based in Athens, Georgia. I studied
                  Entertainment &amp; Media Studies at UGA, cut my teeth in TV
                  post-production, then ran the entire digital presence for a
                  7-location surgical practice by myself. Along the way I
                  started building and shipping software with frontier AI
                  models. Two iOS apps, two browser games, PBS credits,
                  a million organic views.
                </p>
                <p className="mt-5 text-base md:text-lg text-hq-ink-soft leading-relaxed">
                  I work at the seam between media and AI: fast enough to ship
                  alone, careful enough that the work holds up. If your team
                  needs someone who can shoot it, cut it, animate it, post it,
                  and then build the tool that automates it, that&apos;s the job
                  I want.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <MagneticButton>
                    <a
                      href="/resume.pdf"
                      className="inline-flex items-center gap-2 rounded-full bg-hq-ink text-hq-cream px-6 py-3.5 text-sm font-semibold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                    >
                      <FileText size={15} />
                      Download resume
                    </a>
                  </MagneticButton>
                  <MagneticButton>
                    <a
                      href="mailto:jaxonkale124@gmail.com"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-hq-ink/20 px-6 py-3.5 text-sm font-semibold text-hq-ink transition-[transform,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-hq-ink"
                    >
                      <Mail size={15} />
                      jaxonkale124@gmail.com
                    </a>
                  </MagneticButton>
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="divide-y divide-hq-ink/10 border-y border-hq-ink/10">
                  {experience.map((e) => (
                    <div key={e.role} className="py-5">
                      <div className="hq-meta">
                        {e.dates}
                      </div>
                      <div className="mt-1.5 text-base font-semibold tracking-tight">
                        {e.role}
                      </div>
                      <div className="text-sm text-hq-ink-soft">{e.org}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────────────── */}
        <section
          id="contact"
          className="py-20 sm:py-24 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-20"
        >
          <div className="mx-auto max-w-content text-center">
            <Reveal>
              <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02]">
                Hiring? Let&apos;s talk.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base md:text-lg text-hq-ink-soft leading-relaxed">
                Full-time, contract, remote, or Georgia. If it involves video,
                motion, social, or building with AI, I&apos;m interested.
              </p>
              <a
                href="mailto:jaxonkale124@gmail.com"
                className="mt-8 inline-block text-[clamp(1.25rem,4.5vw,2.25rem)] font-semibold tracking-tight hq-grad-text hover:opacity-80 transition-opacity"
              >
                jaxonkale124@gmail.com
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
              <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full hq-grad-bg" />
              jax cannon
            </span>
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 hq-meta">
              <a href="/fairways" className="hover:text-hq-ink transition-colors">
                Fairways
              </a>
              <a
                href="https://dailyrebuild.app"
                className="hover:text-hq-ink transition-colors"
              >
                Daily Rebuild
              </a>
              <a href="/resume.pdf" className="hover:text-hq-ink transition-colors">
                Resume
              </a>
              <a
                href="mailto:jaxonkale124@gmail.com"
                className="hover:text-hq-ink transition-colors"
              >
                Email
              </a>
            </nav>
          </div>
          <div className="mt-8 pt-6 border-t border-hq-ink/10 flex flex-col md:flex-row md:items-center md:justify-between gap-2 hq-meta">
            <p>© 2026 Jax Cannon · mediaseed. Made in Georgia.</p>
            <p>Open to work.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

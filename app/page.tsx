import type { Viewport } from "next";
import {
  Gamepad2,
  FileText,
  Mail,
  Clapperboard,
  Smartphone,
  User,
} from "lucide-react";
import { PortfolioNav } from "@/components/PortfolioNav";
import { CaseStudies } from "@/components/CaseStudies";
import dynamic from "next/dynamic";
import { reels } from "@/components/reels";
import { MotionRail } from "@/components/MotionRail";
import {
  FairwaysFeature,
  GameCard,
  AppCard,
  games,
  apps,
} from "@/components/ProjectCards";
import { Particles } from "@/components/hq/Particles";
import { Reveal } from "@/components/Reveal";
import { MagneticButton } from "@/components/MagneticButton";

// Loaded only when there are reels to show, so the phone feed never ships empty.
const ReelsShowcase = dynamic(() =>
  import("@/components/ReelsShowcase").then((m) => m.ReelsShowcase),
);

export const viewport: Viewport = {
  themeColor: "#FAF6F0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const experience = [
  {
    role: "Social Media & Web Manager",
    org: "Vascular Surgical Associates",
    dates: "Jan 2025 – Jul 2026",
  },
  {
    role: "Motion Graphics & Post-Production",
    org: "Chris Greer Media · View Finders on PBS",
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
  return (
    <div className="hq-root min-h-screen bg-hq-cream text-hq-ink">
      <PortfolioNav />
      <main>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="relative min-h-[100svh] flex flex-col justify-center overflow-hidden">
          <Particles className="absolute inset-0 h-full w-full" />

          <div className="relative mx-auto w-full max-w-content px-5 sm:px-6 md:px-10 pt-24 pb-10 text-center">
            <h1 className="font-medium tracking-tightest leading-[0.92] text-[clamp(3rem,13vw,9.5rem)] animate-fade-up">
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
          </div>
        </section>

        <CaseStudies />

        {reels.length > 0 && <ReelsShowcase />}

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
            <MotionRail />
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

            <Reveal delay={80}>
              <FairwaysFeature className="mt-10 sm:mt-14" />
            </Reveal>

            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {games.map((g, i) => (
                <Reveal key={g.name} delay={i * 90}>
                  <GameCard game={g} />
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
                  <AppCard app={app} />
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
                  post-production, then spent a year and a half running
                  digital for a 7-location surgical practice. Along the way I
                  started building and shipping software with frontier AI
                  models. Two iOS apps, three browser games, PBS credits,
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
              <a href="/ctf" className="hover:text-hq-ink transition-colors">
                Backyard
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

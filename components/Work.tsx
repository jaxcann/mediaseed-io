import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { Spotlight } from "./Spotlight";
import { ReelEmbed, type Reel } from "./ReelEmbed";

type Project = {
  href: string;
  name: string;
  blurb: string;
  kind: string;
  external?: boolean;
};

const projects: Project[] = [
  {
    href: "/apps",
    name: "Apps",
    blurb: "iOS software I've designed and shipped — Surgepod is live in the App Store.",
    kind: "Software",
  },
  {
    href: "/daytapes",
    name: "DayTapes",
    blurb: "A full product microsite, designed and built from scratch.",
    kind: "Web · Product",
  },
  {
    href: "/jaxlendar",
    name: "Jaxlendar",
    blurb: "A daily log of everything I ship — updated in public, every day.",
    kind: "Web · Ongoing",
  },
];

// Each entry can later carry a `videoSrc: "/videos/reel-XX.mp4"` (self-hosted, recommended)
// or a `reelId: "..."` (Instagram embed). With neither set, the tile renders the
// "Reel coming soon" placeholder.
const reels: Reel[] = [
  {
    client: "Vascular surgical practice",
    description: "Patient education reel — clinical content with a screen-stop hook.",
  },
  {
    client: "Vascular surgical practice",
    description: "Procedure explainer, written with the surgeons.",
  },
  {
    client: "Vascular surgical practice",
    description: "Recurring messaging series — built to compound week over week.",
  },
  {
    client: "Dentist",
    description: "Cosmetic case content shot on-site, structured for compliance.",
  },
  {
    client: "Dentist",
    description: "Family and comfort-care vignettes from the operatory.",
  },
  {
    client: "TV show",
    description: "Field shooting and post for an ongoing regional series.",
  },
];

export function Work() {
  return (
    <section id="work" className="py-16 sm:py-20 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-24">
      <div className="mx-auto max-w-content">
        <SectionHeader
          eyebrow="Work"
          heading={
            <>
              Selected work.
              <span className="text-muted"> Video first — the rest lives across the site.</span>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {reels.map((reel, i) => (
            <Reveal key={`reel-${i}`} delay={(i % 3) * 80}>
              <Spotlight className="rounded-xl" size={420}>
                <ReelEmbed reel={reel} index={i + 1} total={reels.length} />
              </Spotlight>
            </Reveal>
          ))}
        </div>

        <Reveal delay={200}>
          <p className="mt-12 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong">
            More reels coming — client video lives behind consent, so this is a sampler.
          </p>
        </Reveal>

        {/* More work — cross-links to the rest of the portfolio */}
        <div className="mt-16 sm:mt-20">
          <Reveal>
            <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-6 flex items-center gap-3">
              <span className="divider-line block h-px w-10 sm:w-12 bg-accent" />
              More work
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 md:gap-6">
            {projects.map((p, i) => (
              <Reveal key={p.href} delay={i * 80}>
                <Spotlight className="rounded-xl h-full">
                  <Link
                    href={p.href}
                    className="group flex h-full flex-col rounded-xl border border-border bg-bg-elevated/40 p-6 md:p-7 transition-colors duration-300 hover:border-accent"
                  >
                    <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong mb-6">
                      {p.kind}
                    </div>
                    <h3 className="text-2xl md:text-3xl tracking-tight font-medium mb-3">
                      {p.name}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-8">
                      {p.blurb}
                    </p>
                    <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-medium text-fg group-hover:text-accent transition-colors">
                      Open
                      <ArrowUpRight
                        size={15}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </span>
                  </Link>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

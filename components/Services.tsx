import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { Spotlight } from "./Spotlight";

type Tier = {
  id: string;
  name: string;
  tagline: string;
  fit: string;
  features: string[];
};

const tiers: Tier[] = [
  {
    id: "seedling",
    name: "Seedling",
    tagline: "For practices planting their first roots in social.",
    fit: "Single-doc offices, smaller practices, restarts after a stalled account.",
    features: [
      "3 posts per week, written and shot in-house",
      "1 short-form reel per week",
      "Monthly half-day filming on location",
      "Monthly strategy + reporting call",
      "Hashtag, caption, and on-camera coaching",
    ],
  },
  {
    id: "sapling",
    name: "Sapling",
    tagline: "For practices serious about compounding growth.",
    fit: "Established practices ready to invest in a real content engine.",
    features: [
      "Daily Monday–Friday posting cadence",
      "2–3 reels per week, fully edited",
      "Biweekly filming, full-day production",
      "Light website edits and landing page updates",
      "Monthly performance report with named next moves",
      "Direct line to the studio, not a ticket queue",
    ],
  },
  {
    id: "canopy",
    name: "Canopy",
    tagline: "One studio handling everything outward-facing.",
    fit: "Practices that want social, web, and email running as one system.",
    features: [
      "Everything in Sapling, all of it",
      "Full website management and ongoing design",
      "Email, newsletter, and patient lifecycle copy",
      "Quarterly strategy off-site with the founder",
      "Reputation, reviews, and listings hygiene",
      "First call when a new channel is worth testing",
    ],
  },
];

export function Services() {
  return (
    <section id="services" className="py-16 sm:py-20 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-24">
      <div className="mx-auto max-w-content">
        <SectionHeader
          eyebrow="Services"
          heading={
            <>
              Three ways to grow.
              <span className="text-muted"> Pick the one that fits where you are.</span>
            </>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
          {tiers.map((tier, i) => (
            <Reveal key={tier.id} delay={i * 90}>
              <Spotlight className="h-full rounded-xl">
              <article className="group relative h-full flex flex-col rounded-xl border border-border bg-bg-elevated/40 p-6 sm:p-7 md:p-8 transition-colors duration-300 hover:border-accent overflow-hidden">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle, rgba(74,103,65,0.18) 1px, transparent 1px)",
                    backgroundSize: "18px 18px",
                    maskImage:
                      "radial-gradient(circle 220px at var(--mx, 50%) var(--my, 50%), black, transparent 70%)",
                    WebkitMaskImage:
                      "radial-gradient(circle 220px at var(--mx, 50%) var(--my, 50%), black, transparent 70%)",
                  }}
                />
                <div className="relative font-mono text-[11px] tracking-[0.18em] uppercase text-muted-strong mb-6">
                  {String(i + 1).padStart(2, "0")} · {tier.name}
                </div>

                <h3 className="relative text-3xl md:text-4xl tracking-tight font-medium mb-3">
                  {tier.name}
                </h3>
                <p className="relative text-muted text-sm md:text-base leading-relaxed mb-8">
                  {tier.tagline}
                </p>

                <ul className="relative space-y-3 mb-10">
                  {tier.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-start gap-3 text-sm leading-relaxed text-fg/85"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-[0.55rem] h-1 w-1 rounded-full bg-accent flex-shrink-0"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative mt-auto pt-6 border-t border-border">
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-strong mb-4">
                    Best fit
                  </p>
                  <p className="text-sm text-muted leading-relaxed mb-6">{tier.fit}</p>
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-fg group-hover:text-accent transition-colors"
                  >
                    Inquire
                    <ArrowUpRight
                      size={15}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </a>
                </div>
              </article>
              </Spotlight>
            </Reveal>
          ))}
        </div>

        <Reveal delay={300}>
          <p className="mt-12 font-mono text-[11px] tracking-[0.14em] uppercase text-muted-strong">
            Every engagement is scoped to the practice. No two gardens are the same.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

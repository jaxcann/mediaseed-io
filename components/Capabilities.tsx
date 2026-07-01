import { ArrowUpRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { SectionHeader } from "./SectionHeader";
import { Spotlight } from "./Spotlight";

type Capability = {
  id: string;
  name: string;
  description: string;
  skills: string[];
  linkHref: string;
  linkLabel: string;
};

const capabilities: Capability[] = [
  {
    id: "social",
    name: "Social & content",
    description:
      "Strategy, shooting, editing, and daily posting. I've taken an account from zero past a million views and kept it climbing.",
    skills: ["Short-form video", "Content strategy", "Copy"],
    linkHref: "#work",
    linkLabel: "See the work",
  },
  {
    id: "production",
    name: "Production",
    description:
      "Field production and post — the whole pipeline. Credited crew on a regional TV show, plus everything I shoot for social.",
    skills: ["Cinematography", "Editing", "Color"],
    linkHref: "#work",
    linkLabel: "See the work",
  },
  {
    id: "web",
    name: "Web",
    description:
      "Fast, modern marketing sites and product pages, designed and built from scratch — including this one and the DayTapes site.",
    skills: ["Next.js", "Design", "Motion"],
    linkHref: "/daytapes",
    linkLabel: "See a site",
  },
  {
    id: "software",
    name: "Software",
    description:
      "Native iOS apps, designed and shipped end to end. Surgepod is live in the App Store; DayTapes and Pocket Pods are on the way.",
    skills: ["SwiftUI", "Product design", "Ship"],
    linkHref: "/apps",
    linkLabel: "See the apps",
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="py-16 sm:py-20 md:py-32 px-5 sm:px-6 md:px-10 scroll-mt-24">
      <div className="mx-auto max-w-content">
        <SectionHeader
          eyebrow="What I do"
          heading={
            <>
              I work across the whole stack of a brand.
              <span className="text-muted"> Content, production, web, and software.</span>
            </>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 md:gap-6">
          {capabilities.map((cap, i) => (
            <Reveal key={cap.id} delay={(i % 2) * 90}>
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
                    {String(i + 1).padStart(2, "0")} · {cap.name}
                  </div>

                  <h3 className="relative text-2xl md:text-3xl tracking-tight font-medium mb-3">
                    {cap.name}
                  </h3>
                  <p className="relative text-muted text-sm md:text-base leading-relaxed mb-8">
                    {cap.description}
                  </p>

                  <div className="relative mb-10 flex flex-wrap gap-2">
                    {cap.skills.map((s) => (
                      <span
                        key={s}
                        className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-strong border border-border rounded-full px-3 py-1"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="relative mt-auto pt-6 border-t border-border">
                    <a
                      href={cap.linkHref}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-fg group-hover:text-accent transition-colors"
                    >
                      {cap.linkLabel}
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
            One person, the whole pipeline — from the first frame to the shipped build.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

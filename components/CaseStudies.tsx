"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, X, Briefcase } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";

type ArticleBlock = { h?: string; p: string };
type Clip = { id: string; title: string };
type Shot = { src: string; caption: string };

type CaseStudy = {
  key: string;
  client: string;
  period: string;
  mark: { type: "count"; to: number; suffix: string } | { type: "text"; text: string };
  markLabel: string;
  summary: string;
  tags: string[];
  article: ArticleBlock[];
  clips: Clip[];
  shots: Shot[];
};

const caseStudies: CaseStudy[] = [
  {
    key: "vsa",
    client: "Vascular Surgical Associates",
    period: "2025 – 2026",
    mark: { type: "count", to: 1000000, suffix: "+" },
    markLabel: "organic views. Zero ad spend.",
    summary:
      "Sole digital hire for a 7-location vascular surgery practice. I owned the whole pipeline: strategy, shooting, editing, publishing, plus the practice's website. A medical group with no digital presence became one with a real audience.",
    tags: ["Short-form video", "Strategy", "Editing", "Web"],
    article: [
      {
        h: "The brief",
        p: "Vascular Surgical Associates is a 7-location vascular surgery practice in Georgia. When I joined in January 2025 they had essentially no digital presence: dormant accounts, no content pipeline, no one on staff whose job it was to fix that. I was hired as the first and only digital media person.",
      },
      {
        h: "What I actually did",
        p: "Everything between the idea and the post. I set the content strategy, planned and shot video at the practices, edited every piece, wrote the copy, published, and read the analytics to decide what to make next. I also owned the practice's website. No agency, no team. One person, full pipeline.",
      },
      {
        h: "The results",
        p: "Over 1,000,000 organic views across platforms in a year and a half, with zero dollars of paid promotion. A medical specialty most people never think about became content people actually chose to watch.",
      },
    ],
    clips: [],
    shots: [],
  },
  {
    key: "viewfinders",
    client: "View Finders",
    period: "2024 – present",
    mark: { type: "text", text: "PBS" },
    markLabel: "broadcast post-production.",
    summary:
      "VFX and motion graphics for View Finders, the PBS series from Chris Greer Media, plus the show's social presence.",
    tags: ["VFX", "Motion graphics", "Broadcast", "Social"],
    article: [
      {
        h: "The show",
        p: "View Finders is a series made by Chris Greer Media for PBS, starring Chris Greer. Broadcast is a different discipline from social: shots are scrutinized on big screens, graphics have to survive compression and broadcast standards, and deadlines are air dates.",
      },
      {
        h: "My role",
        p: "I do VFX and motion graphics for the show: cleanup, compositing, titles, animated graphics. I also run its social media presence, cutting broadcast material down into pieces that work on a phone.",
      },
      {
        h: "How I got here",
        p: "I joined Chris Greer Media as the post-production intern in 2024 while finishing my degree at UGA. Chris kept me on after graduation, and the work has only grown since.",
      },
    ],
    clips: [],
    shots: [],
  },
  {
    key: "chris-greer-media",
    client: "Chris Greer Media",
    period: "2024 – present",
    mark: { type: "text", text: "5 sec" },
    markLabel: "logo animations & client motion graphics.",
    summary:
      "Logo animations and motion graphics for client campaigns: local businesses, brand work, and a feature documentary on sustainable grazing currently in post.",
    tags: ["Logo animation", "Motion graphics", "Client work", "Documentary"],
    article: [
      {
        h: "The work",
        p: "Alongside View Finders, Chris Greer Media runs a client practice: campaigns for local businesses, brand films, and independent projects. I handle the motion side: logo animations, animated graphics, and title work that gives small-business campaigns a finish they could not get anywhere else in town.",
      },
      {
        h: "Logo animations",
        p: "A logo animation is a brand's handshake. I build them to be short, clean, and unmistakable: the kind of five-second piece that makes a local business look like a national one at the top of every video they publish.",
      },
      {
        h: "The documentary",
        p: "The biggest current project is a feature documentary on sustainable grazing, now in post-production. I am building its motion graphics: data-driven visuals and animated sequences that have to hold up at feature length.",
      },
    ],
    clips: [],
    shots: [],
  },
];

const GRID_BG: React.CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(20,19,25,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,19,25,0.05) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

function Mark({ mark }: { mark: CaseStudy["mark"] }) {
  // background-clip:text paints nothing outside the element box, so the mark
  // must never overflow it: long text marks size down, and every mark keeps
  // a little line-height so ascenders aren't shaved.
  const long = mark.type === "text" && mark.text.length > 3;
  const size = long
    ? "text-[clamp(2.75rem,8vw,5.25rem)]"
    : "text-[clamp(3.5rem,10vw,6.5rem)]";
  return (
    <div
      className={`hq-grad-text ${size} font-medium tracking-tightest leading-none py-[0.16em] -my-[0.16em]`}
    >
      {mark.type === "count" ? (
        <CountUp to={mark.to} decimals={0} suffix={mark.suffix} />
      ) : (
        mark.text
      )}
    </div>
  );
}

export function CaseStudies() {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const open = caseStudies.find((c) => c.key === openKey) ?? null;

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpenKey(null);
      setClosing(false);
    }, 220);
  }, []);

  const openStudy = useCallback((key: string, trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpenKey(key);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = panel.querySelectorAll<HTMLElement>(
          'a[href], button:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      triggerRef.current?.focus();
    };
  }, [open, close]);

  return (
    <section
      id="case-studies"
      className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
    >
      <div className="mx-auto max-w-content">
        <Reveal>
          <div className="hq-eyebrow mb-4 flex items-center gap-3">
            <Briefcase size={13} className="text-hq-pink-deep" />
            Case studies
          </div>
          <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl">
            Experience
          </h2>
        </Reveal>

        <div className="mt-10 sm:mt-14 space-y-5">
          {caseStudies.map((cs, i) => (
            <Reveal key={cs.key} delay={i * 80}>
              <article
                onClick={(e) => openStudy(cs.key, e.currentTarget)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openStudy(cs.key, e.currentTarget);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`Open case study: ${cs.client}`}
                className="group relative cursor-pointer rounded-3xl border-2 border-hq-ink/10 bg-white/60 p-7 sm:p-10 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]"
              >
                <span className="absolute top-5 right-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-hq-ink/15 text-hq-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={15} />
                </span>
                <div className="md:col-span-5">
                  <div className="hq-eyebrow">
                    {cs.client} · {cs.period}
                  </div>
                  <div className="mt-4">
                    <Mark mark={cs.mark} />
                  </div>
                  <div className="mt-2 text-lg font-semibold tracking-tight">
                    {cs.markLabel}
                  </div>
                </div>
                <div className="md:col-span-7 flex flex-col">
                  <p className="text-base md:text-lg text-hq-ink-soft leading-relaxed">
                    {cs.summary}
                  </p>
                  <div className="mt-auto pt-6 flex flex-wrap items-center gap-2 hq-meta">
                    {cs.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-hq-ink/15 px-3 py-1.5"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="ml-auto inline-flex items-center gap-1.5 text-hq-ink font-semibold normal-case tracking-normal text-sm group-hover:text-hq-pink-deep transition-colors">
                      Read the story
                      <ArrowUpRight size={14} />
                    </span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>

      {/* ── MODAL ─────────────────────────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 md:p-10"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`cs-title-${open.key}`}
        >
          <button
            aria-label="Close"
            tabIndex={-1}
            onClick={close}
            className={`absolute inset-0 bg-hq-ink/40 backdrop-blur-sm cursor-default motion-reduce:animate-none ${
              closing ? "animate-fade-out" : "animate-fade-in"
            }`}
          />
          <div
            ref={panelRef}
            className={`relative w-full sm:max-w-3xl max-h-[92svh] sm:max-h-[86vh] overflow-y-auto overscroll-contain rounded-t-3xl sm:rounded-3xl border-2 border-hq-ink/10 bg-hq-cream shadow-[0_30px_90px_rgba(20,19,25,0.35)] motion-reduce:animate-none ${
              closing ? "animate-modal-out" : "animate-modal-in"
            }`}
            style={GRID_BG}
          >
            <div className="sticky top-0 z-10 flex justify-end p-4 sm:p-5 bg-gradient-to-b from-hq-cream via-hq-cream/80 to-transparent">
              <button
                ref={closeBtnRef}
                onClick={close}
                aria-label="Close case study"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-hq-ink/15 bg-hq-cream text-hq-ink hover:border-hq-ink transition-colors"
              >
                <X size={17} />
              </button>
            </div>

            <div className="px-6 sm:px-10 md:px-14 pb-[max(2.5rem,calc(env(safe-area-inset-bottom)+1.5rem))] sm:pb-14 -mt-6">
              <div className="hq-eyebrow">
                Case study · {open.period}
              </div>
              <h3
                id={`cs-title-${open.key}`}
                className="mt-3 text-[clamp(1.75rem,5vw,3rem)] font-medium tracking-tightest leading-[1.02]"
              >
                {open.client}
              </h3>
              <div className="mt-4 flex items-baseline gap-4 flex-wrap">
                <Mark mark={open.mark} />
                <span className="text-lg font-semibold tracking-tight">
                  {open.markLabel}
                </span>
              </div>

              <div className="mt-8 space-y-7">
                {open.article.map((b) => (
                  <div key={b.p.slice(0, 24)}>
                    {b.h && (
                      <h4 className="text-lg sm:text-xl font-semibold tracking-tight mb-2">
                        {b.h}
                      </h4>
                    )}
                    <p className="text-base md:text-lg text-hq-ink-soft leading-relaxed">
                      {b.p}
                    </p>
                  </div>
                ))}
              </div>

              {open.clips.length > 0 && (
                <div className="mt-10">
                  <h4 className="text-lg sm:text-xl font-semibold tracking-tight mb-4">
                    Watch
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {open.clips.map((c) => (
                      <figure
                        key={c.id}
                        className="rounded-2xl border-2 border-hq-ink/10 bg-white/70 overflow-hidden"
                      >
                        <div className="aspect-video bg-hq-ink/5">
                          <iframe
                            className="h-full w-full"
                            src={`https://www.youtube-nocookie.com/embed/${c.id}`}
                            title={c.title}
                            loading="lazy"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <figcaption className="p-3.5 text-sm font-medium tracking-tight">
                          {c.title}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              {open.shots.length > 0 && (
                <div className="mt-10">
                  <h4 className="text-lg sm:text-xl font-semibold tracking-tight mb-4">
                    Stills
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {open.shots.map((s) => (
                      <figure
                        key={s.src}
                        className="rounded-2xl border-2 border-hq-ink/10 bg-white/70 overflow-hidden"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt={s.caption} className="w-full" />
                        <figcaption className="p-3.5 text-sm text-hq-ink-soft">
                          {s.caption}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-10 pt-6 border-t border-hq-ink/10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2 hq-meta">
                  {open.tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full border border-hq-ink/15 px-3 py-1.5"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <a
                  href="mailto:jaxonkale124@gmail.com"
                  className="inline-flex items-center gap-2 rounded-full bg-hq-ink text-hq-cream px-5 py-3 text-sm font-semibold transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5"
                >
                  Work with me
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

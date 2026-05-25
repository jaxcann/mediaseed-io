import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Reveal } from "./Reveal";
import { Spotlight } from "./Spotlight";

export type AppEntry = {
  index: number;
  total: number;
  name: string;
  tagline: string;
  description: string;
  status: "live" | "dev";
  platform: string;
  meta?: string[];
  href?: string;
  cta?: string;
};

function StatusPill({ status }: { status: "live" | "dev" }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-accent">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inset-0 rounded-full bg-accent animate-ping-soft" />
          <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
        </span>
        Live
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
      <span className="h-1.5 w-1.5 rounded-full border border-muted" />
      In development
    </span>
  );
}

export function AppCard({ app, delay = 0 }: { app: AppEntry; delay?: number }) {
  const isLive = app.status === "live";
  const hasLink = Boolean(app.href);
  const isInternal = hasLink && app.href!.startsWith("/");

  const Outer: React.ElementType = hasLink
    ? isInternal
      ? Link
      : "a"
    : "div";
  const outerProps = hasLink
    ? isInternal
      ? { href: app.href }
      : { href: app.href, target: "_blank", rel: "noopener noreferrer" }
    : {};

  // CTA arrow: internal route → ArrowRight, external → ArrowUpRight
  const CtaArrow = isInternal ? ArrowRight : ArrowUpRight;

  return (
    <Reveal delay={delay}>
      <Spotlight className="rounded-xl" size={520} color="rgba(74, 103, 65, 0.14)">
        <Outer
          {...outerProps}
          className={`group block rounded-xl border border-border bg-bg-elevated/40 overflow-hidden transition-colors duration-300 ${
            hasLink ? "hover:border-accent cursor-pointer" : "hover:border-border-strong"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-0 md:gap-8 p-6 sm:p-7 md:p-10">
            <div className="md:col-span-4 flex flex-col justify-between gap-6 md:gap-0">
              <div className="flex items-center justify-between md:flex-col md:items-start gap-3">
                <span className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong">
                  {String(app.index).padStart(2, "0")} / {String(app.total).padStart(2, "0")}
                </span>
                <StatusPill status={app.status} />
              </div>

              <div className="hidden md:block mt-12">
                <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong mb-3">
                  Platform
                </div>
                <div className="text-sm text-muted">{app.platform}</div>
              </div>
            </div>

            <div className="md:col-span-8 mt-5 md:mt-0">
              <h3 className="text-[clamp(1.875rem,7vw,3rem)] md:text-5xl tracking-tightest font-medium leading-[1.02]">
                {app.name}
              </h3>
              <p className="mt-3 text-base md:text-lg text-fg/85">{app.tagline}</p>
              <p className="mt-5 sm:mt-6 text-sm md:text-base text-muted leading-relaxed max-w-xl">
                {app.description}
              </p>

              {app.meta && app.meta.length > 0 && (
                <div className="mt-6 sm:mt-7 flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-muted-strong">
                  {app.meta.map((m, i) => (
                    <span key={m} className="inline-flex items-center gap-3">
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className="h-1 w-1 rounded-full bg-border-strong"
                        />
                      )}
                      <span>{m}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-7 sm:mt-8 md:mt-10 flex items-center gap-2 text-sm font-medium">
                {hasLink ? (
                  <span className="inline-flex items-center gap-1.5 text-fg group-hover:text-accent transition-colors">
                    {app.cta ?? (isLive ? "View in App Store" : "Visit site")}
                    <CtaArrow
                      size={15}
                      className={`transition-transform ${
                        isInternal
                          ? "group-hover:translate-x-0.5"
                          : "group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      }`}
                    />
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-muted">
                    {app.cta ?? "Releasing soon"}
                  </span>
                )}
              </div>

              {/* Mobile platform line */}
              <div className="md:hidden mt-6 pt-5 border-t border-border font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong">
                {app.platform}
              </div>
            </div>
          </div>
        </Outer>
      </Spotlight>
    </Reveal>
  );
}

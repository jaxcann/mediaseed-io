"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Image from "next/image";
import { ArrowUpRight, Film, Play, Volume2, VolumeX, X } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";
import { reels, type Reel, type ReelClient } from "@/components/reels";

export { reels };
export type { Reel, ReelClient, ReelPlatform } from "@/components/reels";

type Filter = "All" | ReelClient;
const CLIENT_ORDER: ReelClient[] = ["VSA", "View Finders", "Other"];
// Only clients that actually have reels get a pill; with one client there is nothing to filter.
const FILTERS: Filter[] = ["All", ...CLIENT_ORDER.filter((c) => reels.some((r) => r.client === c))];

const GRID_BG: CSSProperties = {
  backgroundImage:
    "linear-gradient(to right, rgba(20,19,25,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(20,19,25,0.05) 1px, transparent 1px)",
  backgroundSize: "32px 32px",
};

// Desktop phone height. The screen's width is derived from it at 9:19.5.
const PHONE_STYLE = {
  "--ph": "min(68svh, 640px)",
  background: "linear-gradient(160deg, #2b2a34 0%, #141319 45%, #1d1c25 100%)",
} as CSSProperties;

const viewsDecimals = (n: number) => (n >= 1_000_000 ? 1 : 0);

/* ── Screens ─────────────────────────────────────────────────────────────── */

function PlaceholderScreen({ reel, compact = false }: { reel: Reel; compact?: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col justify-center bg-hq-cream text-hq-ink ${
        compact ? "p-3" : "p-7"
      }`}
      style={GRID_BG}
    >
      <span
        aria-hidden="true"
        className={`hq-grad-bg rounded-full ${compact ? "h-1.5 w-1.5 mb-2" : "h-2.5 w-2.5 mb-4"}`}
      />
      {!compact && (
        <div className="hq-eyebrow">
          {reel.client} · {reel.date}
        </div>
      )}
      <div
        className={`font-medium tracking-tightest ${
          compact ? "text-[11px] leading-tight" : "mt-2 text-2xl leading-[1.05]"
        }`}
      >
        {reel.title}
      </div>
      {!compact && <div className="hq-meta mt-3">Video coming soon</div>}
    </div>
  );
}

function ReelSurface({
  reel,
  compact = false,
}: {
  reel: Reel;
  compact?: boolean;
}) {
  if (reel.poster) {
    return (
      <Image
        src={reel.poster}
        alt=""
        fill
        draggable={false}
        sizes={compact ? "152px" : "(min-width: 768px) 296px, 100vw"}
        className="object-cover"
      />
    );
  }
  return <PlaceholderScreen reel={reel} compact={compact} />;
}

/* ── The phone overlay ───────────────────────────────────────────────────── */

function ReelsPhone({
  closing,
  onClose,
}: {
  closing: boolean;
  onClose: () => void;
}) {
  const [reduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [filter, setFilter] = useState<Filter>("All");
  const filtered = useMemo(
    () => (filter === "All" ? reels : reels.filter((r) => r.client === filter)),
    [filter],
  );
  const [activeId, setActiveId] = useState<string | null>(reels[0]?.id ?? null);
  const [muted, setMuted] = useState(true);
  // Under reduced motion nothing autoplays; a tap starts the active reel.
  const [paused, setPaused] = useState(reduced);

  const active = filtered.find((r) => r.id === activeId) ?? filtered[0] ?? null;
  const activeIndex = active ? filtered.indexOf(active) : -1;
  const activeIdRef = useRef(active?.id ?? null);
  activeIdRef.current = active?.id ?? null;

  const panelRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const scrollerRef = useRef<HTMLUListElement>(null);
  const videos = useRef(new Map<string, HTMLVideoElement>());
  const drag = useRef<{ y: number; moved: number } | null>(null);
  const suppressClick = useRef(false);

  const step = useCallback(
    (dir: 1 | -1) => {
      const root = scrollerRef.current;
      if (!root || filtered.length === 0) return;
      const idx = Math.max(activeIndex, 0);
      const next = Math.min(Math.max(idx + dir, 0), filtered.length - 1);
      root.scrollTo({
        top: next * root.clientHeight,
        behavior: reduced ? "auto" : "smooth",
      });
    },
    [activeIndex, filtered.length, reduced],
  );
  const stepRef = useRef(step);
  stepRef.current = step;

  const selectFilter = (f: Filter) => {
    if (f === filter) return;
    const next = f === "All" ? reels : reels.filter((r) => r.client === f);
    scrollerRef.current?.scrollTo({ top: 0 });
    setFilter(f);
    setActiveId(next[0]?.id ?? null);
    setPaused(reduced);
  };

  // Open: lock scroll, focus close. Close: unlock. Focus return is the parent's.
  useEffect(() => {
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Escape, Tab trap, arrow keys.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        stepRef.current(e.key === "ArrowDown" ? 1 : -1);
      }
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
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // The reel that fills 60% of the screen is the active one.
  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset.id;
          if (!id || id === activeIdRef.current) continue;
          setActiveId(id);
          setPaused(reduced);
        }
      },
      { root, threshold: 0.6 },
    );
    root.querySelectorAll<HTMLElement>("[data-id]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filtered, reduced]);

  // Only the active reel plays. Everyone else rewinds and waits.
  useEffect(() => {
    videos.current.forEach((v, id) => {
      v.muted = muted;
      if (id === active?.id && !paused) {
        v.play().catch(() => {});
      } else {
        v.pause();
        if (id !== active?.id) v.currentTime = 0;
      }
    });
  }, [active?.id, muted, paused]);

  const setVideoRef = (id: string) => (el: HTMLVideoElement | null) => {
    if (el) videos.current.set(id, el);
    else videos.current.delete(id);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    drag.current = { y: e.clientY, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) drag.current.moved = e.clientY - drag.current.y;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (Math.abs(d.moved) > 8) suppressClick.current = true;
    if (Math.abs(d.moved) > 40) step(d.moved < 0 ? 1 : -1);
  };
  const onScreenClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (active?.src) setPaused((p) => !p);
  };

  const pillClass = (on: boolean) =>
    `shrink-0 rounded-full border px-3.5 py-2 transition-colors duration-300 focus-visible:!outline-hq-cream md:focus-visible:!outline-hq-ink ${
      on
        ? "border-hq-cream bg-hq-cream text-hq-ink md:border-hq-ink md:bg-hq-ink md:text-hq-cream"
        : "border-hq-cream/40 text-hq-cream hover:border-hq-cream md:border-hq-ink/15 md:text-hq-ink-soft md:hover:border-hq-ink md:hover:text-hq-ink"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6 lg:p-10"
      role="dialog"
      aria-modal="true"
      aria-label="Reels"
    >
      <button
        aria-label="Close"
        tabIndex={-1}
        onClick={onClose}
        className={`absolute inset-0 bg-hq-ink/40 backdrop-blur-sm cursor-default motion-reduce:animate-none ${
          closing ? "animate-fade-out" : "animate-fade-in"
        }`}
      />

      {/* bg-[#141319] rather than bg-hq-ink: the global focus-ring rule keys
          off the `.bg-hq-ink` class, and this surface is cream on desktop. */}
      <div
        ref={panelRef}
        className={`relative flex h-full w-full flex-col overflow-hidden bg-[#141319] md:h-auto md:w-auto md:max-w-[58rem] md:max-h-[92svh] md:overflow-y-auto md:rounded-3xl md:border-2 md:border-hq-ink/10 md:bg-hq-cream md:shadow-[0_30px_90px_rgba(20,19,25,0.35)] motion-reduce:animate-none ${
          closing ? "animate-modal-out" : "animate-modal-in"
        }`}
        style={GRID_BG}
      >
        {/* Top bar: filter pills + close. Floats over the feed on mobile. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center gap-3 bg-gradient-to-b from-hq-ink/70 to-transparent px-4 pb-8 pt-[max(0.75rem,env(safe-area-inset-top))] md:static md:gap-4 md:bg-none md:px-8 md:pb-3 md:pt-6 lg:px-10">
          <div
            role="group"
            aria-label="Filter reels"
            className="hq-meta pointer-events-auto flex min-w-0 flex-1 gap-2 overflow-x-auto"
            style={{ scrollbarWidth: "none" }}
          >
            {FILTERS.length > 2 && FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                aria-pressed={f === filter}
                onClick={() => selectFilter(f)}
                className={pillClass(f === filter)}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Close reels"
            className="pointer-events-auto inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-hq-cream/30 bg-hq-ink/40 text-hq-cream backdrop-blur-sm transition-colors hover:border-hq-cream focus-visible:!outline-hq-cream md:border-hq-ink/15 md:bg-hq-cream md:text-hq-ink md:backdrop-blur-none md:hover:border-hq-ink md:focus-visible:!outline-hq-ink"
          >
            <X size={17} />
          </button>
        </div>

        {/* Body: phone + info */}
        <div className="absolute inset-0 md:static md:flex md:items-center md:gap-8 md:px-8 md:pb-10 md:pt-2 lg:gap-12 lg:px-10 lg:pb-12">
          {/* Phone frame. Bezel only on desktop; on mobile the screen is the viewport. */}
          <div
            className="relative h-full w-full md:h-auto md:w-fit md:shrink-0 md:rounded-[3rem] md:p-2.5 md:shadow-[0_18px_44px_rgba(20,19,25,0.35)] md:ring-1 md:ring-white/10"
            style={PHONE_STYLE}
          >
            <span aria-hidden="true" className="hidden md:block absolute -left-[3px] top-[17%] h-7 w-[3px] rounded-l-sm bg-[#2b2a34]" />
            <span aria-hidden="true" className="hidden md:block absolute -left-[3px] top-[24%] h-12 w-[3px] rounded-l-sm bg-[#2b2a34]" />
            <span aria-hidden="true" className="hidden md:block absolute -left-[3px] top-[35%] h-12 w-[3px] rounded-l-sm bg-[#2b2a34]" />
            <span aria-hidden="true" className="hidden md:block absolute -right-[3px] top-[27%] h-16 w-[3px] rounded-r-sm bg-[#2b2a34]" />

            <div className="relative h-full w-full select-none overflow-hidden bg-hq-ink md:h-[var(--ph)] md:w-[calc(var(--ph)*9/19.5)] md:rounded-[2.375rem] md:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
              {/* Dynamic island */}
              <span
                aria-hidden="true"
                className="hidden md:block absolute left-1/2 top-3 z-20 h-[22px] w-[88px] -translate-x-1/2 rounded-full bg-hq-ink ring-1 ring-white/5"
              />

              {/* The feed. Wider than the screen so any native scrollbar is clipped. */}
              <ul
                ref={scrollerRef}
                role="list"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
                onClick={onScreenClick}
                className="absolute inset-y-0 left-0 snap-y snap-mandatory overflow-y-auto overscroll-contain md:cursor-grab md:active:cursor-grabbing"
                style={{
                  width: "calc(100% + 24px)",
                  paddingRight: 24,
                  scrollbarWidth: "none",
                }}
              >
                {filtered.map((r, i) => {
                  // Only the active reel and its neighbours hold a live <video>;
                  // everything else shows its poster until it is nearly in view.
                  const near = Math.abs(i - Math.max(activeIndex, 0)) <= 1;
                  return (
                  <li
                    key={r.id}
                    data-id={r.id}
                    className="relative h-full w-full snap-start snap-always"
                    aria-current={r.id === active?.id ? "true" : undefined}
                  >
                    {r.src && near ? (
                      <video
                        ref={setVideoRef(r.id)}
                        src={r.src}
                        poster={r.poster || undefined}
                        muted
                        playsInline
                        loop
                        preload="metadata"
                        aria-label={r.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <ReelSurface reel={r} />
                    )}
                  </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="flex h-full w-full items-center justify-center bg-hq-cream p-7 text-center hq-meta">
                    No reels in this filter yet.
                  </li>
                )}
              </ul>

              {/* Paused glyph */}
              {active?.src && paused && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                >
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-hq-ink/50 text-hq-cream backdrop-blur-sm animate-fade-in motion-reduce:animate-none">
                    <Play size={24} fill="currentColor" className="ml-1" />
                  </span>
                </span>
              )}

              {/* Mute toggle. Persists across reels while the phone is open. */}
              {active?.src && (
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute" : "Mute"}
                  className="absolute right-4 bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-hq-ink/50 text-hq-cream backdrop-blur-sm transition-colors hover:bg-hq-ink/70 md:bottom-5"
                >
                  {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
              )}
            </div>
          </div>

          {/* Info panel. Sidebar on desktop, compact scrim at the bottom on mobile. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-hq-ink/85 via-hq-ink/45 to-transparent p-5 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))] pr-20 pt-20 text-hq-cream md:pointer-events-auto md:static md:w-[19rem] md:min-w-0 md:bg-none md:p-0 md:text-hq-ink lg:w-[22rem]">
            {active ? (
              <div key={active.id} className="animate-fade-in motion-reduce:animate-none">
                <div className="hq-eyebrow text-hq-cream/70 md:text-hq-ink-soft">
                  {active.client} · {active.date}
                </div>
                <h3
                  className="mt-2 text-xl font-medium tracking-tightest leading-[1.05] md:mt-3 md:text-[clamp(1.5rem,2.6vw,2.125rem)]"
                >
                  {active.title}
                </h3>
                <p className="hidden md:block mt-4 text-base text-hq-ink-soft leading-relaxed">
                  {active.description}
                </p>
                <div className="mt-3 flex items-baseline gap-3 md:mt-7">
                  <div className="hq-grad-text text-4xl font-medium tracking-tightest leading-none py-[0.16em] -my-[0.16em] md:text-[clamp(3rem,5vw,4.5rem)]">
                    <CountUp
                      key={active.id}
                      to={active.views}
                      decimals={viewsDecimals(active.views)}
                    />
                  </div>
                  <span className="hq-meta text-hq-cream/70 md:text-hq-ink-soft">
                    views
                  </span>
                </div>
                {active.url && (
                  <a
                    href={active.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-full bg-hq-cream px-4 py-2.5 text-sm font-semibold text-hq-ink transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 focus-visible:!outline-hq-cream md:mt-7 md:bg-hq-ink md:px-5 md:py-3 md:text-hq-cream md:focus-visible:!outline-hq-ink"
                  >
                    Open on {active.platform}
                    <ArrowUpRight size={14} />
                  </a>
                )}
                <div className="hidden md:flex mt-8 items-center gap-3 hq-meta">
                  <span className="tabular-nums">
                    {String(activeIndex + 1).padStart(2, "0")} /{" "}
                    {String(filtered.length).padStart(2, "0")}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Scroll, drag, or use arrow keys</span>
                </div>
              </div>
            ) : (
              <h3 className="hq-meta">
                No reels in this filter yet.
              </h3>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Section (closed state) ──────────────────────────────────────────────── */

export function ReelsShowcase() {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }, []);

  const openPhone = useCallback((trigger: HTMLElement) => {
    triggerRef.current = trigger;
    setOpen(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    return () => {
      triggerRef.current?.focus();
    };
  }, [open]);

  const first = reels[0];
  const clients = Array.from(new Set(reels.map((r) => r.client)));

  // No real reels yet means no section at all: placeholder numbers never ship.
  if (reels.length === 0) return null;

  return (
    <section
      id="reels"
      className="py-16 sm:py-20 md:py-28 px-5 sm:px-6 md:px-10 scroll-mt-20"
    >
      <div className="mx-auto max-w-content">
        <Reveal>
          <div
            onClick={(e) => openPhone(e.currentTarget)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openPhone(e.currentTarget);
              }
            }}
            role="button"
            tabIndex={0}
            aria-label="Watch the reels"
            className="group relative cursor-pointer overflow-hidden rounded-3xl border-2 border-hq-ink/10 bg-white/60 p-7 sm:p-10 md:p-14 grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center transition-all duration-300 hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)]"
          >
            <div
              aria-hidden="true"
              className="absolute -top-16 -right-16 h-56 w-56 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-45"
              style={{ background: "linear-gradient(135deg, #E85DA8, #38B8D8)" }}
            />
            <span className="absolute top-5 right-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-hq-ink/15 text-hq-ink opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight size={15} />
            </span>

            <div className="relative md:col-span-8 flex flex-col">
              <div className="hq-eyebrow flex items-center gap-3">
                <Film size={13} className="text-hq-cyan-deep" />
                Reels
              </div>
              <h2 className="mt-4 text-[clamp(2rem,6vw,3.5rem)] font-medium tracking-tightest leading-[1.02] max-w-xl">
                Short-form that earned its views.
              </h2>
              <p className="mt-4 max-w-lg text-base md:text-lg text-hq-ink-soft leading-relaxed">
                Vertical video, shot and cut for the phone it plays on.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-2 hq-meta">
                {clients.map((c) => (
                  <span
                    key={c}
                    className="rounded-full border border-hq-ink/15 px-3 py-1.5"
                  >
                    {c}
                  </span>
                ))}
                <span className="ml-auto inline-flex items-center gap-1.5 text-hq-ink font-semibold normal-case tracking-normal text-sm group-hover:text-hq-pink-deep transition-colors">
                  Watch the reels
                  <ArrowUpRight size={14} />
                </span>
              </div>
            </div>

            {/* Mini phone silhouette */}
            <div className="relative md:col-span-4 flex justify-center md:justify-end">
              <div
                aria-hidden="true"
                className="relative w-[7.5rem] sm:w-[8.5rem] md:w-[9.5rem] -rotate-3 rounded-[1.75rem] bg-hq-ink p-[6px] shadow-[0_24px_60px_rgba(20,19,25,0.25)] ring-1 ring-white/10 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:rotate-0 group-hover:-translate-y-1 motion-reduce:transition-none"
              >
                <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[1.4rem] bg-hq-ink">
                  {first && <ReelSurface reel={first} compact />}
                  <span className="absolute left-1/2 top-1.5 h-2.5 w-9 -translate-x-1/2 rounded-full bg-hq-ink ring-1 ring-white/5" />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-hq-ink/45 text-hq-cream backdrop-blur-sm">
                      <Play size={13} fill="currentColor" className="ml-0.5" />
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>

      {open && <ReelsPhone closing={closing} onClose={close} />}
    </section>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type RefObject,
} from "react";
import Image from "next/image";
import { Pause, Play } from "lucide-react";
import { Reveal } from "@/components/Reveal";

/**
 * One logo animation on the rail. Transparent video ships as a pair:
 *   mov   HEVC with alpha (Safari, iOS)         type: video/quicktime; codecs="hvc1"
 *   webm  VP9 with alpha (Chrome, Edge, Firefox) type: video/webm; codecs="vp9"
 * Entries with neither source are hidden. Poster is optional (PNG with alpha).
 */
export type MotionClip = {
  id: string;
  title: string;
  client: string;
  webm?: string;
  mov?: string;
  poster?: string;
};

// Fill the paths and the rail appears. Suggested layout:
//   public/media/motion/<id>.webm, <id>.mov, <id>.png
export const motionClips: MotionClip[] = [
  { id: "logo-01", title: "Logo animation 01", client: "Client", webm: "", mov: "", poster: "" },
  { id: "logo-02", title: "Logo animation 02", client: "Client", webm: "", mov: "", poster: "" },
  { id: "logo-03", title: "Logo animation 03", client: "Client", webm: "", mov: "", poster: "" },
  { id: "logo-04", title: "Logo animation 04", client: "Client", webm: "", mov: "", poster: "" },
  { id: "logo-05", title: "Logo animation 05", client: "Client", webm: "", mov: "", poster: "" },
  { id: "logo-06", title: "Logo animation 06", client: "Client", webm: "", mov: "", poster: "" },
];

/** Width in px of the edge fade. It shrinks to zero as the rail reaches either end. */
const FADE = 48;
/** How far (ms of travel) a released drag keeps going before it snaps. */
const MOMENTUM = 160;
const DRAG_THRESHOLD = 4;

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduced;
}

function useInView(ref: RefObject<Element>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    // Viewport root, so a card scrolled off the side of the rail counts as
    // hidden too (the rail's overflow clips it out of the intersection).
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return inView;
}

/** Resolves once the element's horizontal scroll has been still for a few frames. */
function onceSettled(el: HTMLElement, cb: () => void) {
  let last = el.scrollLeft;
  let still = 0;
  let raf = 0;
  const tick = () => {
    if (el.scrollLeft === last) still += 1;
    else still = 0;
    last = el.scrollLeft;
    if (still >= 3) cb();
    else raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}

function Plate({
  clip,
  reduced,
  onFocus,
}: {
  clip: MotionClip;
  reduced: boolean;
  onFocus: (el: HTMLElement) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inView = useInView(videoRef);
  const [wantsPlay, setWantsPlay] = useState(false);
  const [playing, setPlaying] = useState(false);

  // Autoplay only while visible. Under reduced motion nothing moves until
  // the viewer presses play, and it still pauses when scrolled away.
  const shouldPlay = inView && (reduced ? wantsPlay : true);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (shouldPlay) {
      // React 18 hydration does not reliably set `muted`; set it before play().
      v.muted = true;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [shouldPlay]);

  return (
    <li
      data-rail-item
      tabIndex={0}
      role="group"
      aria-labelledby={`${clip.id}-cap`}
      onFocus={(e) => {
        if (e.target === e.currentTarget) onFocus(e.currentTarget);
      }}
      className="group relative shrink-0 snap-start w-[calc(100vw-3.75rem)] sm:w-80 md:w-96 overflow-hidden rounded-2xl border-2 border-hq-ink/10 bg-white/60 outline-none transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-hq-ink/30 hover:shadow-[0_18px_50px_rgba(20,19,25,0.12)] focus-visible:outline-2 focus-visible:outline-hq-ink focus-visible:outline-offset-[3px]"
    >
      {/* Glass: the brand gradient as a faint tint, plus a white glint from the top left. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]"
        style={{ backgroundImage: "var(--hq-grad)" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.7),rgba(255,255,255,0)_55%)]"
      />

      <figure className="relative">
        <div className="relative aspect-[16/10]">
          {clip.poster && !playing && (
            <Image
              src={clip.poster}
              alt=""
              fill
              sizes="(min-width: 768px) 384px, (min-width: 640px) 320px, 100vw"
              className="object-contain"
            />
          )}
          <video
            ref={videoRef}
            className="relative h-full w-full object-contain"
            muted
            loop
            playsInline
            preload="none"
            aria-hidden="true"
            draggable={false}
            disablePictureInPicture
            disableRemotePlayback
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
          >
            {clip.mov && (
              <source src={clip.mov} type='video/quicktime; codecs="hvc1"' />
            )}
            {clip.webm && (
              <source src={clip.webm} type='video/webm; codecs="vp9"' />
            )}
          </video>

          {reduced && (
            <button
              type="button"
              onClick={() => setWantsPlay((p) => !p)}
              aria-label={`${playing ? "Pause" : "Play"} ${clip.title}`}
              className="absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-hq-ink text-hq-cream transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-105"
            >
              {playing ? (
                <Pause size={13} fill="currentColor" />
              ) : (
                <Play size={13} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          )}
        </div>

        <figcaption id={`${clip.id}-cap`} className="hq-meta flex items-baseline justify-between gap-4 border-t border-hq-ink/10 px-4 py-3">
          <span className="truncate text-hq-ink">{clip.title}</span>
          <span className="shrink-0">{clip.client}</span>
        </figcaption>
      </figure>
    </li>
  );
}

export function MotionRail({ items = motionClips }: { items?: MotionClip[] }) {
  const clips = items.filter((c) => c.webm || c.mov);
  const reduced = useReducedMotion();
  const railRef = useRef<HTMLUListElement>(null);
  const drag = useRef({
    active: false,
    moved: false,
    startX: 0,
    startLeft: 0,
    lastX: 0,
    lastT: 0,
    vx: 0,
    release: null as null | (() => void),
  });

  const getItems = useCallback(
    () =>
      Array.from(
        railRef.current?.querySelectorAll<HTMLElement>("[data-rail-item]") ?? [],
      ),
    [],
  );

  /** Snap positions: where each card's left edge meets the rail's scroll padding. */
  const getStops = useCallback(() => {
    const el = railRef.current;
    if (!el) return [];
    const pad = parseFloat(getComputedStyle(el).paddingLeft) || 0;
    const max = el.scrollWidth - el.clientWidth;
    return getItems().map((it) => Math.min(Math.max(0, it.offsetLeft - pad), max));
  }, [getItems]);

  const scrollToItem = useCallback(
    (item: HTMLElement) => {
      const el = railRef.current;
      if (!el) return;
      const idx = getItems().indexOf(item);
      const left = getStops()[idx];
      if (left === undefined) return;
      el.scrollTo({ left, behavior: reduced ? "auto" : "smooth" });
    },
    [getItems, getStops, reduced],
  );

  // Edge fades follow the scroll position: gone at either end, full in between.
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = Math.max(0, el.scrollWidth - el.clientWidth);
      const l = Math.min(Math.max(0, el.scrollLeft), FADE);
      const r = Math.min(Math.max(0, max - el.scrollLeft), FADE);
      el.style.setProperty("--fl", `${l}px`);
      el.style.setProperty("--fr", `${r}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [clips.length]);

  // Drag to scroll with a mouse or pen. Touch keeps native scrolling.
  const onPointerDown = (e: PointerEvent<HTMLUListElement>) => {
    if (e.pointerType === "touch" || e.button !== 0) return;
    const el = e.currentTarget;
    const d = drag.current;
    d.release?.();
    d.release = null;
    d.active = true;
    d.moved = false;
    d.startX = e.clientX;
    d.startLeft = el.scrollLeft;
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
    d.vx = 0;
    el.setPointerCapture(e.pointerId);
    // Snap would fight every scrollLeft write mid-drag; disable it until release.
    el.style.scrollSnapType = "none";
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
    // Keeps mousedown from focusing the card (which would scroll it) and from selecting text.
    e.preventDefault();
  };

  const onPointerMove = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const el = e.currentTarget;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) d.moved = true;
    if (!d.moved) return;
    el.scrollLeft = d.startLeft - dx;
    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      const v = (e.clientX - d.lastX) / dt;
      d.vx = d.vx * 0.6 + v * 0.4;
    }
    d.lastX = e.clientX;
    d.lastT = e.timeStamp;
  };

  const onPointerUp = (e: PointerEvent<HTMLUListElement>) => {
    const d = drag.current;
    if (!d.active) return;
    const el = e.currentTarget;
    d.active = false;
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
    el.style.cursor = "";
    el.style.userSelect = "";

    if (!d.moved) {
      el.style.scrollSnapType = "";
      return;
    }
    // A hand held still before release carries no momentum.
    const vx = e.timeStamp - d.lastT > 80 ? 0 : d.vx;
    const projected = el.scrollLeft - vx * MOMENTUM;
    const stops = getStops();
    const target =
      stops.length === 0
        ? el.scrollLeft
        : stops.reduce((best, s) =>
            Math.abs(s - projected) < Math.abs(best - projected) ? s : best,
          );
    el.scrollTo({ left: target, behavior: reduced ? "auto" : "smooth" });
    // Re-enable snap only once we rest on a stop, so it has nothing to correct.
    d.release = onceSettled(el, () => {
      el.style.scrollSnapType = "";
      d.release = null;
    });
  };

  // A drag that moved must not count as a click on whatever it ended over.
  const onClickCapture = (e: MouseEvent<HTMLUListElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    const items = getItems();
    if (items.length === 0) return;
    const current = (e.target as HTMLElement).closest<HTMLElement>("[data-rail-item]");
    const idx = current ? items.indexOf(current) : -1;
    let next = idx;
    if (e.key === "ArrowRight") next = Math.min(items.length - 1, idx + 1);
    if (e.key === "ArrowLeft") next = Math.max(0, idx - 1);
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = items.length - 1;
    e.preventDefault();
    if (next === idx || next < 0) return;
    items[next].focus({ preventScroll: true });
    scrollToItem(items[next]);
  };

  const onItemFocus = useCallback(
    (item: HTMLElement) => {
      if (drag.current.active) return;
      scrollToItem(item);
    },
    [scrollToItem],
  );

  if (clips.length === 0) {
    return (
      <Reveal delay={80}>
        <p className="mt-10 text-base text-hq-ink-soft">
          New logo animations are on the way.{" "}
          <a
            href="mailto:jaxonkale124@gmail.com"
            className="font-semibold text-hq-ink hover:text-hq-pink-deep transition-colors"
          >
            Email me
          </a>{" "}
          for samples in the meantime.
        </p>
      </Reveal>
    );
  }

  return (
    <Reveal delay={80}>
      <ul
        ref={railRef}
        aria-label="Logo animations"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        className="relative mt-10 sm:mt-14 -mx-5 sm:-mx-6 md:-mx-10 px-5 sm:px-6 md:px-10 scroll-pl-5 sm:scroll-pl-6 md:scroll-pl-10 pt-3 pb-12 -mb-9 flex gap-4 sm:gap-5 overflow-x-auto overscroll-x-contain snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [@media(pointer:fine)]:cursor-grab"
        style={
          {
            "--fl": "0px",
            "--fr": `${FADE}px`,
            WebkitMaskImage:
              "linear-gradient(to right, transparent, #000 var(--fl), #000 calc(100% - var(--fr)), transparent)",
            maskImage:
              "linear-gradient(to right, transparent, #000 var(--fl), #000 calc(100% - var(--fr)), transparent)",
          } as React.CSSProperties
        }
      >
        {clips.map((clip) => (
          <Plate key={clip.id} clip={clip} reduced={reduced} onFocus={onItemFocus} />
        ))}
      </ul>
    </Reveal>
  );
}

"use client";

import { useRef } from "react";
import { Play } from "lucide-react";

export type DropItem = {
  videoId: string;
  title: string;
  dateLabel: string;
  channelName: string;
  from: string;
  to: string;
};

// big / medium / small rhythm with subtle vertical drift — organic, not chaotic
const BUBBLE = [
  { size: "h-44 w-44 sm:h-56 sm:w-56", off: "mt-0", dur: "7.2s" },
  { size: "h-36 w-36 sm:h-44 sm:w-44", off: "mt-8 sm:mt-12", dur: "8.1s" },
  { size: "h-40 w-40 sm:h-52 sm:w-52", off: "mt-3 sm:mt-5", dur: "6.6s" },
  { size: "h-36 w-36 sm:h-40 sm:w-40", off: "mt-10 sm:mt-14", dur: "7.7s" },
];

export function DropsStrip({ drops }: { drops: DropItem[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const drag = useRef({ down: false, moved: false, startX: 0, startLeft: 0 });

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType !== "mouse") return; // touch scrolls natively
    const el = scrollerRef.current;
    if (!el) return;
    drag.current = {
      down: true,
      moved: false,
      startX: e.clientX,
      startLeft: el.scrollLeft,
    };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    const el = scrollerRef.current;
    if (!d.down || !el) return;
    const dx = e.clientX - d.startX;
    if (Math.abs(dx) > 6) d.moved = true;
    el.scrollLeft = d.startLeft - dx;
  }
  function endDrag() {
    drag.current.down = false;
  }
  function onClickCapture(e: React.MouseEvent) {
    // a drag shouldn't count as a click on a bubble
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  }

  return (
    <div className="relative">
      {/* edge fades */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 sm:w-20 bg-gradient-to-r from-hq-cream to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 sm:w-20 bg-gradient-to-l from-hq-cream to-transparent"
      />

      <div
        ref={scrollerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
        className="hq-drops-scroll overflow-x-auto snap-x snap-proximity cursor-grab active:cursor-grabbing select-none pb-4"
      >
        <div className="flex items-start gap-6 sm:gap-9 px-6 sm:px-16 md:px-24 w-max">
          {drops.map((d, i) => {
            const b = BUBBLE[i % BUBBLE.length];
            return (
              <a
                key={d.videoId}
                href={`https://www.youtube.com/watch?v=${d.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                className={`group block shrink-0 snap-center text-center ${b.off}`}
              >
                {/* the bubble: gradient ring → cream gap → image */}
                <span
                  className={`hq-bubble relative block rounded-full p-[3px] transition-transform duration-300 group-hover:scale-[1.045] ${b.size}`}
                  style={{
                    animationDelay: `${(i % 6) * 0.7}s`,
                    animationDuration: b.dur,
                    background: `linear-gradient(135deg, ${d.from}, ${d.to})`,
                    boxShadow: `0 12px 36px -10px ${d.to}55`,
                  }}
                >
                  <span className="block h-full w-full rounded-full border-[3px] border-hq-cream overflow-hidden bg-hq-cream-soft">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://i.ytimg.com/vi/${d.videoId}/hq720.jpg`}
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (!img.src.includes("hqdefault")) {
                          img.src = `https://i.ytimg.com/vi/${d.videoId}/hqdefault.jpg`;
                        }
                      }}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </span>
                  {/* play chip, hover only */}
                  <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-hq-cream/95 text-hq-ink shadow-lg">
                      <Play size={16} className="ml-0.5 fill-current" />
                    </span>
                  </span>
                </span>

                {/* caption lives OUTSIDE the circle — nothing fights the curve */}
                <span className="mt-4 block w-40 sm:w-52 mx-auto">
                  <span
                    className="block font-mono text-[9px] sm:text-[10px] tracking-[0.16em] uppercase"
                    style={{ color: d.to }}
                  >
                    {d.channelName} · {d.dateLabel}
                  </span>
                  <span className="mt-1 block text-xs sm:text-[13px] font-semibold leading-snug text-hq-ink/85 line-clamp-2 group-hover:text-hq-ink transition-colors">
                    {d.title}
                  </span>
                </span>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Play, Instagram, ArrowUpRight } from "lucide-react";

export type Reel = {
  client: string;
  handle: string;
  description: string;
  metric: string;
  /** Instagram reel ID, e.g. "DKRmrFHATbo". When omitted, the card opens the profile in a new tab instead of embedding. */
  reelId?: string;
};

type Props = {
  reel: Reel;
  index: number;
  total: number;
};

export function ReelEmbed({ reel, index, total }: Props) {
  const [active, setActive] = useState(false);
  const profileUrl = `https://www.instagram.com/${reel.handle}/`;
  const hasEmbed = Boolean(reel.reelId);

  function handleActivate() {
    if (hasEmbed) {
      setActive(true);
    } else {
      window.open(profileUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-bg-elevated/40 transition-colors hover:border-border-strong">
      {/* 9:16 stage */}
      <div className="relative aspect-[9/16] bg-[#0d0d0d] overflow-hidden">
        {active && reel.reelId ? (
          <iframe
            src={`https://www.instagram.com/reel/${reel.reelId}/embed/`}
            className="absolute inset-0 h-full w-full"
            allow="encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title={`${reel.client} reel on Instagram`}
          />
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            className="absolute inset-0 flex flex-col items-center justify-end text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={
              hasEmbed
                ? `Play reel from ${reel.client}`
                : `Open ${reel.client} on Instagram`
            }
          >
            {/* Layered backdrop */}
            <span
              aria-hidden="true"
              className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.03]"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at center, rgba(74,103,65,0.22), transparent 65%), radial-gradient(circle, rgba(250,250,250,0.05) 1px, transparent 1.2px)",
                backgroundSize: "100% 100%, 14px 14px",
              }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 top-0 h-2/3"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)",
              }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-2/3"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.65), transparent)",
              }}
            />

            {/* Top-left index */}
            <span className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.18em] uppercase text-fg/70">
              {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>

            {/* Top-right Instagram glyph */}
            <span className="absolute top-3.5 right-3.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-strong bg-bg/40 text-fg/70 transition-colors group-hover:text-accent group-hover:border-accent">
              <Instagram size={13} />
            </span>

            {/* Center play / open glyph */}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border-strong bg-bg/55 backdrop-blur-sm transition-all duration-300 group-hover:border-accent group-hover:bg-accent/15">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping-soft bg-accent/25"
                />
                {hasEmbed ? (
                  <Play size={22} className="relative ml-1 text-fg" />
                ) : (
                  <ArrowUpRight size={22} className="relative text-fg" />
                )}
              </span>
            </span>

            {/* Bottom plate */}
            <span className="relative w-full p-4 z-10">
              <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-fg/85 mb-1">
                @{reel.handle}
              </span>
              <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-accent">
                {hasEmbed ? "Tap to play ↘" : "Open profile ↗"}
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Caption block under the stage */}
      <div className="p-5 md:p-6">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-fg mb-2">
          {reel.client}
        </div>
        <p className="text-sm text-muted leading-relaxed mb-4">
          {reel.description}
        </p>
        <div className="font-mono text-[11px] text-accent">{reel.metric}</div>
      </div>
    </div>
  );
}

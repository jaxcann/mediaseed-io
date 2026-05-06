"use client";

import { useState } from "react";
import { Play, Instagram, ArrowUpRight, Film } from "lucide-react";

export type Reel = {
  client: string;
  description: string;
  metric?: string;
  /** Self-hosted video file URL, e.g. "/videos/reel-01.mp4". Takes precedence over reelId. */
  videoSrc?: string;
  /** Optional poster image (jpg/webp) shown before play. */
  poster?: string;
  /** Instagram reel ID, e.g. "DKRmrFHATbo". Used only when videoSrc is omitted. */
  reelId?: string;
  /** Instagram handle (without @). When provided alongside reelId, falls back to opening the profile. */
  handle?: string;
};

type Props = {
  reel: Reel;
  index: number;
  total: number;
};

export function ReelEmbed({ reel, index, total }: Props) {
  const [active, setActive] = useState(false);

  const hasVideo = Boolean(reel.videoSrc);
  const hasEmbed = !hasVideo && Boolean(reel.reelId);
  const hasProfileLink = !hasVideo && !hasEmbed && Boolean(reel.handle);
  const isPlaceholder = !hasVideo && !hasEmbed && !hasProfileLink;

  function handleActivate() {
    if (hasVideo || hasEmbed) {
      setActive(true);
    } else if (hasProfileLink && reel.handle) {
      window.open(
        `https://www.instagram.com/${reel.handle}/`,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-bg-elevated/40 transition-colors hover:border-border-strong">
      <div className="relative aspect-[9/16] bg-[#0d0d0d] overflow-hidden">
        {active && hasVideo ? (
          <video
            src={reel.videoSrc}
            poster={reel.poster}
            className="absolute inset-0 h-full w-full object-cover"
            controls
            autoPlay
            playsInline
            preload="metadata"
          />
        ) : active && hasEmbed && reel.reelId ? (
          <iframe
            src={`https://www.instagram.com/reel/${reel.reelId}/embed/`}
            className="absolute inset-0 h-full w-full"
            allow="encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title={`${reel.client} reel`}
          />
        ) : isPlaceholder ? (
          <PlaceholderStage index={index} total={total} />
        ) : (
          <button
            type="button"
            onClick={handleActivate}
            className="absolute inset-0 flex flex-col items-center justify-end text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={
              hasVideo || hasEmbed
                ? `Play reel from ${reel.client}`
                : `Open ${reel.client} on Instagram`
            }
          >
            <BackdropLayers />

            <span className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.18em] uppercase text-fg/70">
              {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
            </span>

            {hasProfileLink && (
              <span className="absolute top-3.5 right-3.5 inline-flex h-7 w-7 items-center justify-center rounded-full border border-border-strong bg-bg/40 text-fg/70 transition-colors group-hover:text-accent group-hover:border-accent">
                <Instagram size={13} />
              </span>
            )}

            <span className="absolute inset-0 flex items-center justify-center">
              <span className="relative flex h-16 w-16 items-center justify-center rounded-full border border-border-strong bg-bg/55 backdrop-blur-sm transition-all duration-300 group-hover:border-accent group-hover:bg-accent/15">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping-soft bg-accent/25"
                />
                {hasVideo || hasEmbed ? (
                  <Play size={22} className="relative ml-1 text-fg" />
                ) : (
                  <ArrowUpRight size={22} className="relative text-fg" />
                )}
              </span>
            </span>

            <span className="relative w-full p-4 z-10">
              {hasProfileLink && reel.handle && (
                <span className="block font-mono text-[10px] tracking-[0.18em] uppercase text-fg/85 mb-1">
                  @{reel.handle}
                </span>
              )}
              <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-accent">
                {hasVideo || hasEmbed ? "Tap to play ↘" : "Open profile ↗"}
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="p-5 md:p-6">
        <div className="font-mono text-[11px] tracking-[0.18em] uppercase text-fg mb-2">
          {reel.client}
        </div>
        <p className="text-sm text-muted leading-relaxed mb-4">
          {reel.description}
        </p>
        {reel.metric && (
          <div className="font-mono text-[11px] text-accent">{reel.metric}</div>
        )}
      </div>
    </div>
  );
}

function BackdropLayers() {
  return (
    <>
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
    </>
  );
}

function PlaceholderStage({ index, total }: { index: number; total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      <span
        aria-hidden="true"
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(250,250,250,0.05) 1px, transparent 1.2px)",
          backgroundSize: "14px 14px",
        }}
      />
      <span className="absolute top-4 left-4 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong">
        {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </span>

      <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border-strong text-muted-strong">
        <Film size={18} />
      </div>
      <div className="relative mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-muted-strong">
        Reel coming soon
      </div>
    </div>
  );
}

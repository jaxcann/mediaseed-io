"use client";

import { useState } from "react";
import Image from "next/image";
import { Play, Instagram, Youtube, Maximize2 } from "lucide-react";
import type { JaxlendarEntry, JaxlendarMedia } from "./data";
import { formatLongDate, weekdayName } from "./dateUtils";
import { Lightbox, type LightboxItem } from "./Lightbox";

export function EntryDetail({ entry }: { entry: JaxlendarEntry | null }) {
  const [lightbox, setLightbox] = useState<LightboxItem | null>(null);

  if (!entry) {
    return (
      <div className="rounded-xl border border-border bg-bg-elevated/30 p-8 md:p-12 text-center">
        <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-muted-strong">
          Nothing logged this day.
        </p>
      </div>
    );
  }

  const media = entry.media ?? [];

  return (
    <>
      <article className="rounded-xl border border-border bg-bg-elevated/30 overflow-hidden">
        <div className="p-6 sm:p-8 md:p-10">
          <div className="font-mono text-[11px] tracking-[0.16em] uppercase text-accent mb-3">
            {weekdayName(entry.date)} · {formatLongDate(entry.date)}
          </div>
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-medium tracking-tightest leading-[1.05]">
            {entry.title}
          </h3>
          {entry.summary && (
            <p className="mt-4 text-base md:text-lg text-muted leading-relaxed max-w-2xl">
              {entry.summary}
            </p>
          )}
          {entry.tags && entry.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted-strong border border-border rounded-full px-3 py-1"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {media.length > 0 && (
          <div className="px-6 sm:px-8 md:px-10 pb-6 sm:pb-8 md:pb-10">
            <div
              className={`grid gap-4 ${
                media.length === 1
                  ? "grid-cols-1"
                  : "grid-cols-1 sm:grid-cols-2"
              }`}
            >
              {media.map((m, i) => (
                <MediaBlock
                  key={i}
                  media={m}
                  onExpand={setLightbox}
                  wide={media.length % 2 === 1 && i === 0}
                />
              ))}
            </div>
          </div>
        )}
      </article>

      <Lightbox item={lightbox} onClose={() => setLightbox(null)} />
    </>
  );
}

function MediaBlock({
  media,
  onExpand,
  wide,
}: {
  media: JaxlendarMedia;
  onExpand: (item: LightboxItem) => void;
  wide?: boolean;
}) {
  const span = wide ? "sm:col-span-2" : "";

  switch (media.type) {
    case "image":
      return (
        <button
          type="button"
          onClick={() =>
            onExpand({
              kind: "image",
              src: media.src,
              alt: media.alt,
              caption: media.caption,
            })
          }
          className={`group relative block overflow-hidden rounded-lg border border-border bg-[#0d0d0d] ${span}`}
        >
          <div className="relative aspect-video">
            <Image
              src={media.src}
              alt={media.alt ?? ""}
              fill
              sizes="(max-width: 640px) 100vw, 600px"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <span className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border-strong bg-bg/50 text-fg/70 opacity-0 group-hover:opacity-100 transition-opacity">
            <Maximize2 size={13} />
          </span>
          {media.caption && <Caption>{media.caption}</Caption>}
        </button>
      );

    case "video":
      return (
        <button
          type="button"
          onClick={() =>
            onExpand({
              kind: "video",
              src: media.src,
              poster: media.poster,
              caption: media.caption,
            })
          }
          className={`group relative block overflow-hidden rounded-lg border border-border bg-[#0d0d0d] ${span}`}
        >
          <div className="relative aspect-video">
            {media.poster ? (
              <Image
                src={media.poster}
                alt={media.caption ?? "Video"}
                fill
                sizes="(max-width: 640px) 100vw, 600px"
                className="object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, rgba(250,250,250,0.05) 1px, transparent 1.2px)",
                  backgroundSize: "14px 14px",
                }}
              />
            )}
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-bg/55 backdrop-blur-sm transition-colors group-hover:border-accent group-hover:bg-accent/15">
                <Play size={20} className="ml-0.5 text-fg" />
              </span>
            </span>
          </div>
          {media.caption && <Caption>{media.caption}</Caption>}
        </button>
      );

    case "youtube":
      return (
        <LazyEmbed
          label="YouTube"
          icon={<Youtube size={20} className="text-fg" />}
          src={`https://www.youtube-nocookie.com/embed/${media.id}`}
          aspect="aspect-video"
          caption={media.caption}
          span={span}
        />
      );

    case "instagram":
      return (
        <LazyEmbed
          label="Instagram"
          icon={<Instagram size={18} className="text-fg" />}
          src={`https://www.instagram.com/reel/${media.id}/embed/`}
          aspect="aspect-[9/16]"
          caption={media.caption}
          span={span}
        />
      );
  }
}

function LazyEmbed({
  label,
  icon,
  src,
  aspect,
  caption,
  span,
}: {
  label: string;
  icon: React.ReactNode;
  src: string;
  aspect: string;
  caption?: string;
  span: string;
}) {
  const [active, setActive] = useState(false);

  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-[#0d0d0d] ${span}`}
    >
      <div className={`relative ${aspect}`}>
        {active ? (
          <iframe
            src={src}
            className="absolute inset-0 h-full w-full"
            allow="encrypted-media; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            title={`${label} embed`}
          />
        ) : (
          <button
            type="button"
            onClick={() => setActive(true)}
            className="group absolute inset-0 flex flex-col items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={`Load ${label} embed`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(ellipse at center, rgba(74,103,65,0.18), transparent 65%), radial-gradient(circle, rgba(250,250,250,0.05) 1px, transparent 1.2px)",
                backgroundSize: "100% 100%, 14px 14px",
              }}
            />
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-bg/55 backdrop-blur-sm transition-colors group-hover:border-accent group-hover:bg-accent/15">
              {icon}
            </span>
            <span className="relative mt-3 font-mono text-[10px] tracking-[0.16em] uppercase text-muted-strong">
              Load {label}
            </span>
          </button>
        )}
      </div>
      {caption && <Caption>{caption}</Caption>}
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="block px-4 py-3 text-left font-mono text-[10px] tracking-[0.14em] uppercase text-muted-strong border-t border-border">
      {children}
    </span>
  );
}

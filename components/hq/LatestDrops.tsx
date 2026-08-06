import { ArrowUpRight } from "lucide-react";
import { channels, type Channel } from "./channels";

/**
 * Latest Drops — the newest uploads across every network channel, merged into
 * one floating bubble strip. Sourced from YouTube's public RSS feeds (no API
 * key), fetched server-side and revalidated hourly. If every feed fails
 * (build sandbox, YouTube hiccup), the section renders nothing.
 */

type Drop = {
  videoId: string;
  title: string;
  published: string; // ISO
  channel: Channel;
};

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");
}

function parseFeed(xml: string, channel: Channel): Drop[] {
  const drops: Drop[] = [];
  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (videoId && title && published) {
      drops.push({ videoId, title: decodeEntities(title), published, channel });
    }
  }
  return drops;
}

async function fetchDrops(): Promise<Drop[]> {
  const results = await Promise.allSettled(
    channels.map(async (channel) => {
      const res = await fetch(
        `https://www.youtube.com/feeds/videos.xml?channel_id=${channel.channelId}`,
        { next: { revalidate: 3600 } },
      );
      if (!res.ok) throw new Error(`feed ${channel.handle}: ${res.status}`);
      return parseFeed(await res.text(), channel).slice(0, 6);
    }),
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<Drop[]> => r.status === "fulfilled",
    )
    .flatMap((r) => r.value)
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 12);
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// big / medium / small bubble rhythm, with alternating vertical drift
const SIZE = [
  "h-52 w-52 sm:h-64 sm:w-64",
  "h-40 w-40 sm:h-48 sm:w-48",
  "h-44 w-44 sm:h-56 sm:w-56",
  "h-36 w-36 sm:h-44 sm:w-44",
];
const OFFSET = ["mt-0", "mt-10 sm:mt-14", "mt-4 sm:mt-6", "mt-12 sm:mt-16"];

export async function LatestDrops() {
  let drops: Drop[] = [];
  try {
    drops = await fetchDrops();
  } catch {
    return null;
  }
  if (drops.length === 0) return null;

  return (
    <section id="drops" className="py-16 sm:py-20 md:py-28 scroll-mt-20 overflow-hidden">
      <div className="mx-auto max-w-content px-5 sm:px-6 md:px-10">
        <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.18em] uppercase text-hq-ink-soft mb-4 flex items-center gap-3">
          <span className="relative inline-flex h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-hq-pink-deep animate-ping-soft" />
            <span
              className="relative h-1.5 w-1.5 rounded-full"
              style={{
                background:
                  "linear-gradient(135deg, #E85DA8, #8B72EA 50%, #38B8D8)",
              }}
            />
          </span>
          Latest drops · every channel · auto-fresh
        </div>
        <h2 className="text-[clamp(2rem,7vw,3.75rem)] font-medium tracking-tightest leading-[1.02] max-w-2xl">
          Fresh off the network.
        </h2>
      </div>

      {/* Bubble strip — scrolls horizontally, bubbles bob on their own */}
      <div className="mt-10 sm:mt-14 overflow-x-auto pb-6 hq-drops-scroll">
        <div className="flex items-start gap-5 sm:gap-7 px-5 sm:px-10 md:px-14 w-max">
          {drops.map((d, i) => (
            <a
              key={d.videoId}
              href={`https://www.youtube.com/watch?v=${d.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`hq-bubble group relative block shrink-0 rounded-full ${SIZE[i % SIZE.length]} ${OFFSET[i % OFFSET.length]}`}
              style={{
                animationDelay: `${(i % 5) * 0.9}s`,
                padding: "4px",
                background: `linear-gradient(135deg, ${d.channel.from}, ${d.channel.to})`,
              }}
            >
              <span className="relative block h-full w-full overflow-hidden rounded-full bg-hq-ink">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://i.ytimg.com/vi/${d.videoId}/hqdefault.jpg`}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-hq-ink/85 via-hq-ink/10 to-transparent opacity-90"
                />
                <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5 text-center">
                  <span className="block font-mono text-[9px] sm:text-[10px] tracking-[0.16em] uppercase text-hq-cream/70">
                    {d.channel.name} · {dateLabel(d.published)}
                  </span>
                  <span className="mt-1 block text-[11px] sm:text-xs font-semibold leading-snug text-hq-cream line-clamp-2">
                    {d.title}
                  </span>
                </span>
                <span className="absolute top-3 right-1/2 translate-x-1/2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-hq-cream/90 text-hq-ink opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowUpRight size={14} />
                </span>
              </span>
            </a>
          ))}
        </div>
      </div>

      <p className="mx-auto max-w-content px-5 sm:px-6 md:px-10 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-hq-ink-soft/70">
        Drag sideways · tap a bubble to watch
      </p>
    </section>
  );
}

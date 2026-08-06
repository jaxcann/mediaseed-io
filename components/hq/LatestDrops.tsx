import { channels, type Channel } from "./channels";
import { DropsStrip, type DropItem } from "./DropsStrip";

/**
 * Latest Drops — the newest uploads across every network channel, merged into
 * one floating bubble strip. Sourced from YouTube's public RSS feeds (no API
 * key), fetched server-side and revalidated hourly. If every feed fails
 * (build sandbox, YouTube hiccup), the section renders nothing.
 */

type Parsed = {
  videoId: string;
  title: string;
  published: string;
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

function parseFeed(xml: string, channel: Channel): Parsed[] {
  const out: Parsed[] = [];
  for (const entry of xml.split("<entry>").slice(1)) {
    const videoId = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]*)<\/title>/)?.[1];
    const published = entry.match(/<published>([^<]+)<\/published>/)?.[1];
    if (videoId && title && published) {
      out.push({ videoId, title: decodeEntities(title), published, channel });
    }
  }
  return out;
}

function dateLabel(iso: string): string {
  const d = new Date(iso);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

async function fetchDrops(): Promise<DropItem[]> {
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
      (r): r is PromiseFulfilledResult<Parsed[]> => r.status === "fulfilled",
    )
    .flatMap((r) => r.value)
    .sort((a, b) => (a.published < b.published ? 1 : -1))
    .slice(0, 12)
    .map((p) => ({
      videoId: p.videoId,
      title: p.title,
      dateLabel: dateLabel(p.published),
      channelName: p.channel.name,
      from: p.channel.from,
      to: p.channel.to,
    }));
}

export async function LatestDrops() {
  let drops: DropItem[] = [];
  try {
    drops = await fetchDrops();
  } catch {
    return null;
  }
  if (drops.length === 0) return null;

  return (
    <section
      id="drops"
      className="py-16 sm:py-20 md:py-28 scroll-mt-20 overflow-hidden"
    >
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

      <div className="mt-10 sm:mt-14">
        <DropsStrip drops={drops} />
      </div>
    </section>
  );
}

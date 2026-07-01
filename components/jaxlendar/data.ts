// ─────────────────────────────────────────────────────────────────────────
// JAXLENDAR — a daily log of what I ship.
//
// TO ADD A DAY:
//   1. Drop any media into /public/jaxlendar/  (e.g. 2026-07-02-render.jpg)
//   2. Add one entry object to the `entries` array below. Order doesn't matter
//      — the calendar sorts by date. Use the day's real local date.
//   3. git add . && git commit -m "jaxlendar: 2026-07-02" && git push
//      (Vercel auto-deploys in ~45s.)
//
// A day with no media still renders cleanly (title + summary + tags).
// ─────────────────────────────────────────────────────────────────────────

export type JaxlendarMedia =
  | { type: "image"; src: string; alt?: string; caption?: string }
  | { type: "video"; src: string; poster?: string; caption?: string }
  | { type: "youtube"; id: string; caption?: string }
  | { type: "instagram"; id: string; caption?: string };

export type JaxlendarEntry = {
  /** Local calendar day, ISO "YYYY-MM-DD". */
  date: string;
  /** Short headline of what shipped that day. */
  title: string;
  /** Optional longer description. */
  summary?: string;
  /** Optional tags — rendered as mono chips. */
  tags?: string[];
  /** Optional media — images, self-hosted videos, or embeds. */
  media?: JaxlendarMedia[];
};

/** The day the log begins. Calendar can't page earlier than this month. */
export const JAXLENDAR_START = "2026-07-01";

export const entries: JaxlendarEntry[] = [
  {
    date: "2026-07-01",
    title: "Started the Jaxlendar",
    summary:
      "Day one. A running calendar of everything I make and ship — one entry a day, media and all. Also pushed the DayTapes microsite live at mediaseed.io/daytapes and wired it into the studio's apps page.",
    tags: ["studio", "web", "daytapes"],
    media: [
      // Examples — delete these and add your own:
      // { type: "image", src: "/jaxlendar/2026-07-01-shot.jpg", alt: "Shipped screen" },
      // { type: "video", src: "/jaxlendar/2026-07-01-clip.mp4", poster: "/jaxlendar/2026-07-01-clip.jpg" },
      // { type: "instagram", id: "DKRmrFHATbo" },
      // { type: "youtube", id: "dQw4w9WgXcQ" },
    ],
  },
];

// ── Derived helpers (don't edit) ──────────────────────────────────────────

/** Map of ISO date -> entry, for O(1) calendar lookups. */
export const entriesByDate: Map<string, JaxlendarEntry> = new Map(
  entries.map((e) => [e.date, e]),
);

/** Entries sorted newest-first. */
export const entriesDesc: JaxlendarEntry[] = [...entries].sort((a, b) =>
  a.date < b.date ? 1 : a.date > b.date ? -1 : 0,
);

/** Entries sorted oldest-first. */
export const entriesAsc: JaxlendarEntry[] = [...entries].sort((a, b) =>
  a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
);

/** The most recent entry (or null if none). */
export const latestEntry: JaxlendarEntry | null = entriesDesc[0] ?? null;

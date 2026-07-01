"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  entries,
  entriesByDate,
  latestEntry,
  JAXLENDAR_START,
  type JaxlendarEntry,
} from "./data";
import {
  MONTHS_LONG,
  WEEKDAYS_SHORT,
  addMonths,
  compareMonths,
  daysInMonth,
  firstWeekdayOfMonth,
  parseISO,
  prevDayISO,
  toISO,
  todayISO,
} from "./dateUtils";
import { EntryDetail } from "./EntryDetail";

const startYMD = parseISO(JAXLENDAR_START);
const startMonth = { y: startYMD.y, m: startYMD.m };
const latestYMD = latestEntry ? parseISO(latestEntry.date) : startYMD;

/** First image/poster we can use as a cell thumbnail, else null. */
function thumbFor(entry: JaxlendarEntry): string | null {
  for (const m of entry.media ?? []) {
    if (m.type === "image") return m.src;
    if (m.type === "video" && m.poster) return m.poster;
  }
  return null;
}

/** Consecutive-day streak ending at the most recent entry. */
function computeStreak(): number {
  if (!latestEntry) return 0;
  let streak = 0;
  let cursor = latestEntry.date;
  while (entriesByDate.has(cursor)) {
    streak += 1;
    cursor = prevDayISO(cursor);
  }
  return streak;
}

export function Jaxlendar() {
  const [cursor, setCursor] = useState<{ y: number; m: number }>({
    y: latestYMD.y,
    m: latestYMD.m,
  });
  const [selected, setSelected] = useState<string | null>(
    latestEntry?.date ?? null,
  );
  const [now, setNow] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const didUserSelect = useRef(false);

  // Resolve "today" only after mount to avoid SSR/client hydration mismatch.
  useEffect(() => {
    setNow(todayISO());
  }, []);

  const streak = useMemo(computeStreak, []);

  // Furthest month the calendar can page to: later of latest-entry month and
  // (once known) the real current month.
  const maxMonth = useMemo(() => {
    if (!now) return { y: latestYMD.y, m: latestYMD.m };
    const nowYMD = parseISO(now);
    const nowMonth = { y: nowYMD.y, m: nowYMD.m };
    return compareMonths(nowMonth, { y: latestYMD.y, m: latestYMD.m }) > 0
      ? nowMonth
      : { y: latestYMD.y, m: latestYMD.m };
  }, [now]);

  const canPrev = compareMonths(cursor, startMonth) > 0;
  const canNext = compareMonths(cursor, maxMonth) < 0;

  const grid = useMemo(() => buildGrid(cursor.y, cursor.m), [cursor]);

  const selectedEntry = selected ? entriesByDate.get(selected) ?? null : null;

  function selectDay(iso: string) {
    didUserSelect.current = true;
    setSelected(iso);
  }

  useEffect(() => {
    if (didUserSelect.current && detailRef.current) {
      detailRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selected]);

  return (
    <div>
      {/* Stat row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 font-mono text-[10px] sm:text-[11px] tracking-[0.14em] uppercase text-muted-strong mb-8">
        <span>
          {entries.length} {entries.length === 1 ? "day" : "days"} logged
        </span>
        <span className="h-1 w-1 rounded-full bg-border-strong" aria-hidden="true" />
        <span>
          Streak {streak} {streak === 1 ? "day" : "days"}
        </span>
        <span className="h-1 w-1 rounded-full bg-border-strong" aria-hidden="true" />
        <span>Since Jul 1, 2026</span>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-border bg-bg-elevated/30 p-4 sm:p-6 md:p-8">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-lg sm:text-xl font-medium tracking-tight">
            {MONTHS_LONG[cursor.m]}{" "}
            <span className="text-muted">{cursor.y}</span>
          </div>
          <div className="flex items-center gap-2">
            <NavButton
              disabled={!canPrev}
              onClick={() => setCursor((c) => addMonths(c.y, c.m, -1))}
              label="Previous month"
            >
              <ChevronLeft size={16} />
            </NavButton>
            <NavButton
              disabled={!canNext}
              onClick={() => setCursor((c) => addMonths(c.y, c.m, 1))}
              label="Next month"
            >
              <ChevronRight size={16} />
            </NavButton>
          </div>
        </div>

        {/* Weekday header */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
          {WEEKDAYS_SHORT.map((w) => (
            <div
              key={w}
              className="text-center font-mono text-[9px] sm:text-[10px] tracking-[0.14em] uppercase text-muted-strong py-1"
            >
              {w}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {grid.leading.map((_, i) => (
            <div key={`lead-${i}`} aria-hidden="true" />
          ))}
          {grid.days.map((day) => {
            const iso = toISO(cursor.y, cursor.m, day);
            const entry = entriesByDate.get(iso);
            const hasEntry = Boolean(entry);
            const isFuture = now ? iso > now : false;
            const isToday = now ? iso === now : false;
            const isSelected = iso === selected;
            const thumb = entry ? thumbFor(entry) : null;

            return (
              <button
                key={iso}
                type="button"
                disabled={!hasEntry}
                onClick={() => hasEntry && selectDay(iso)}
                aria-label={
                  hasEntry ? `${entry!.title} — ${iso}` : iso
                }
                aria-pressed={isSelected}
                className={[
                  "group relative aspect-square rounded-lg overflow-hidden transition-all duration-200 text-left",
                  hasEntry
                    ? "cursor-pointer border border-accent/40 hover:border-accent"
                    : "border border-border",
                  isSelected ? "ring-2 ring-accent ring-offset-2 ring-offset-bg" : "",
                  isFuture ? "opacity-25" : "",
                  !hasEntry && !isFuture ? "opacity-55" : "",
                ].join(" ")}
              >
                {thumb && (
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                {thumb && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-bg/80 via-bg/10 to-transparent"
                  />
                )}

                <span
                  className={`absolute top-1 left-1.5 font-mono text-[9px] sm:text-[10px] ${
                    thumb ? "text-fg" : hasEntry ? "text-fg" : "text-muted-strong"
                  }`}
                >
                  {day}
                </span>

                {/* Entry marker when no thumbnail */}
                {hasEntry && !thumb && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  </span>
                )}

                {/* Today marker */}
                {isToday && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-1 right-1 h-1 w-1 rounded-full bg-fg/60"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected entry detail */}
      <div ref={detailRef} className="mt-6 md:mt-8 scroll-mt-24">
        <EntryDetail entry={selectedEntry} />
      </div>
    </div>
  );
}

function NavButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-30 disabled:pointer-events-none"
    >
      {children}
    </button>
  );
}

function buildGrid(y: number, m: number) {
  const leadingCount = firstWeekdayOfMonth(y, m);
  const total = daysInMonth(y, m);
  return {
    leading: Array.from({ length: leadingCount }),
    days: Array.from({ length: total }, (_, i) => i + 1),
  };
}

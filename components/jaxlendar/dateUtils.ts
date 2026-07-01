// Pure, deterministic date helpers for Jaxlendar.
// All dates are treated as *local calendar days* — an ISO string "YYYY-MM-DD"
// is parsed by splitting on "-", never via `new Date(iso)` (which parses as UTC
// and shifts the day in negative-offset timezones). Constructing
// `new Date(y, m, d)` uses local time and is safe + deterministic.

export type YMD = { y: number; m: number; d: number }; // m is 0-based (Jan = 0)

export const WEEKDAYS_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const WEEKDAYS_LONG = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function parseISO(iso: string): YMD {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m: m - 1, d };
}

export function toISO(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function isoFromYMD({ y, m, d }: YMD): string {
  return toISO(y, m, d);
}

/** Number of days in month m (0-based) of year y. */
export function daysInMonth(y: number, m: number): number {
  return new Date(y, m + 1, 0).getDate();
}

/** Weekday index (0 = Sunday) of the 1st of month m (0-based) in year y. */
export function firstWeekdayOfMonth(y: number, m: number): number {
  return new Date(y, m, 1).getDay();
}

/** Weekday index (0 = Sunday) for a specific y/m(0-based)/d. */
export function weekdayOf(y: number, m: number, d: number): number {
  return new Date(y, m, d).getDay();
}

/** Move a {y, m} month cursor by `delta` months. Day is ignored. */
export function addMonths(y: number, m: number, delta: number): { y: number; m: number } {
  const total = y * 12 + m + delta;
  return { y: Math.floor(total / 12), m: ((total % 12) + 12) % 12 };
}

/** Compare two month cursors. Returns <0, 0, >0. */
export function compareMonths(
  a: { y: number; m: number },
  b: { y: number; m: number },
): number {
  return a.y * 12 + a.m - (b.y * 12 + b.m);
}

/** Compare two ISO date strings chronologically. */
export function compareISO(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/** "July 1, 2026" */
export function formatLongDate(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return `${MONTHS_LONG[m]} ${d}, ${y}`;
}

/** "Wednesday" */
export function weekdayName(iso: string): string {
  const { y, m, d } = parseISO(iso);
  return WEEKDAYS_LONG[weekdayOf(y, m, d)];
}

/** "Jul 1" — compact label */
export function formatShortDate(iso: string): string {
  const { m, d } = parseISO(iso);
  return `${MONTHS_LONG[m].slice(0, 3)} ${d}`;
}

/** Previous calendar day as ISO. */
export function prevDayISO(iso: string): string {
  const { y, m, d } = parseISO(iso);
  const dt = new Date(y, m, d - 1);
  return toISO(dt.getFullYear(), dt.getMonth(), dt.getDate());
}

/** Today, as a local ISO string. Client-only (nondeterministic) — never call during SSR. */
export function todayISO(): string {
  const now = new Date();
  return toISO(now.getFullYear(), now.getMonth(), now.getDate());
}

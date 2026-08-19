// ─────────────────────────────────────────────────────────────────────────────
//  Fairway — the day
// ─────────────────────────────────────────────────────────────────────────────
// Pure day maths, no three.js and no game state: where the light is, how many
// tee times a day holds, which of them book, and who is in the group. game.js
// feeds it the club's numbers and gets a day back — so a test can build a
// Saturday in December without touching the world, and the schedule a player
// reloads into is byte-for-byte the one they left.

export const AVG_GROUP = 3.24;          // expected size of a booked group (see SIZE_W)
export const DEMAND_D = 9;              // gpm that fills ~63% of the book (see fillFor)
export const WEEKEND_LIFT = 1.4;        // Saturdays and Sundays are busy. Really.

// ── The calendar ─────────────────────────────────────────────────────────────

// Which day of the year this is — a CALENDAR question, so it is answered from
// local midnight to local midnight and never from the instant. Subtracting the
// raw timestamps carried the time of day with it, so a day 23 or 25 hours long
// (the two DST turnovers) rounded to the neighbouring day for part of itself:
// the same dayKey laid out 38 tee times at half past midnight and 39 by nine in
// the morning, and the sheet was rebuilt underneath the player. Both ends are
// local midnights and the result is rounded, so a short or long day lands
// exactly on the integer it belongs to.
export function dayOfYear(d) {
  const y0 = new Date(d.getFullYear(), 0, 0).getTime();
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((t - y0) / 86400000);
}
// local calendar day — the key a saved sheet is stamped with
export function dayKey(d) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
    '-' + String(d.getDate()).padStart(2, '0');
}
export function isWeekend(d) { const w = d.getDay(); return w === 0 || w === 6; }
export function minuteOfDay(d) { return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60; }
export function midnightOf(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

// ── The shape of a day ───────────────────────────────────────────────────────
// A golf day is not a metronome. It is a handful of WAVES with quiet water
// between them: the dawn patrol, the morning rush, the long quiet middle, the
// afternoon wave, and the last of the light. Inside a wave the times sit at
// real golf spacing — eight minutes in the rush, a dozen at either end of the
// day — so a wave is genuinely busy and the gap after it is genuinely restful.
//
// The whole structure is derived from the light, so it shortens with the year
// on its own: a full summer day carries around forty bookable times and a
// December one under thirty, where the old five-minute sheet carried 174 and
// no single one of them could ever matter.
//
//   span   · share of the playing window this wave occupies (the lull takes
//            whatever is left, which is why high summer has a long quiet middle)
//   gap    · minutes between tee times inside the wave
//   demand · the share of the club's demand PRESSURE this part of the day gets.
//            A club sells its prime times first: at half occupancy the morning
//            rush is three-quarters gone while the quiet hours are barely
//            touched. It multiplies the pressure rather than the probability
//            (see bookingFor), so a wave fills early and then saturates like
//            any other book instead of clipping — which is what keeps the day's
//            total takings the same as a flat sheet's at every demand level.
//            Weighted across a day it averages to 1: it redistributes the
//            book, it never invents any of it.
export const WAVES = [
  { id: 'dawn',      name: 'First Light',     short: 'Dawn',      span: 0.048, gap: 12, demand: 0.75 },
  { id: 'morning',   name: 'Morning Rush',    short: 'Morning',   span: 0.105, gap: 8,  demand: 1.30 },
  { id: 'lull',      name: 'The Quiet Hours', short: 'Quiet',     span: 0,     gap: 62, demand: 0.50 },
  { id: 'afternoon', name: 'Afternoon Wave',  short: 'Afternoon', span: 0.105, gap: 8,  demand: 1.26 },
  { id: 'twilight',  name: 'Twilight',        short: 'Dusk',      span: 0.050, gap: 14, demand: 0.78 },
];
export const WAVE = {};
for (const w of WAVES) WAVE[w.id] = w;
const BREATH = 0.028;      // share of the window the course takes off between waves
const LULL_MIN_GAP = 46;   // …and the quiet hours never tighten past this
// The rush is a clock event, not a light event: people tee off before work, not
// before dawn. It never starts earlier than this, which is why a June morning
// has an hour and a half of empty first tee after the dawn patrol has gone
// through — and why a December one simply starts as soon as the dawn wave ends.
const RUSH_NO_EARLIER = 8 * 60;
// …and the same in reverse at the other end: the second wave is an afternoon
// thing. Left to hang off last light it would go out at ten to six in August,
// which is a twilight wave with the wrong name on it.
const AFT_NO_LATER = 16 * 60;
const TWI_SLOTS = 5;       // a long evening spreads over about this many times
const DAWN_SLOTS = 4;      // …and a long early light over about this many

// Sunrise and sunset for the player's own date, as minutes past local midnight.
// One cosine around midsummer — no latitude, no geolocation, no network. It is
// wrong by half an hour and right about everything that matters: the days are
// long in July, short in January, and they turn over on the solstice.
export function daylight(d) {
  const s = Math.cos((dayOfYear(d) - 172) / 365.25 * Math.PI * 2);   // +1 at midsummer
  const sunrise = Math.round(390 - s * 62);      // 6:30 ± 1h02
  const sunset = Math.round(1200 + s * 96);      // 20:00 ± 1h36
  // first tee at sunrise; the last group goes off with time to walk it in, and
  // finishes in the last of the light
  const first = Math.round(sunrise);
  const last = Math.round(sunset - 25);
  const dl = { sunrise, sunset, first, last };
  layOutDay(dl);
  return dl;
}

// Place the five waves inside [first, last] and write out every tee time.
// dl.times[i] is the minute of slot i; dl.wave[i] is the wave it belongs to;
// dl.parts is the day's shape as the book prints it.
function layOutDay(dl) {
  const W = Math.max(0, dl.last - dl.first);
  const times = [], wave = [], parts = [];
  const push = (w, from, to, gap) => {
    const at = times.length;
    if (to >= from && gap > 0) {
      for (let m = from; m <= to + 0.5; m += gap) { times.push(Math.round(m)); wave.push(w.id); }
    }
    parts.push({ id: w.id, name: w.name, short: w.short, demand: w.demand,
      from: at, n: times.length - at,
      start: times.length > at ? times[at] : Math.round(from),
      end: times.length > at ? times[times.length - 1] : Math.round(to) });
  };
  if (W < 60) {                       // no day worth splitting up
    push(WAVES[1], dl.first, dl.last, 12);
    finish(dl, times, wave, parts);
    return;
  }
  // Wave length is a share of the light, so the year shortens the book on its
  // own — but a wave is also a real thing with a real length, so high summer
  // does not inflate the rush into an afternoon. Ceilings keep the longest day
  // near forty times and the shortest near thirty.
  const breath = Math.max(12, Math.round(BREATH * W));
  const dawnLen = Math.min(40, Math.round(WAVES[0].span * W));
  const mainLen = Math.min(90, Math.round(WAVES[1].span * W));
  const twiLen = Math.min(44, Math.round(WAVES[4].span * W));

  // Same rule at the other end of the day: the rush will not go out before a
  // civilised hour, so on a long summer morning the early light has to belong
  // to somebody. It belongs to the dawn patrol, spread thin.
  const mornStart = Math.max(dl.first + dawnLen + breath, RUSH_NO_EARLIER);
  const mornEnd = mornStart + mainLen;
  const dawnEnd = mornStart - breath;
  const dawnGap = Math.max(WAVES[0].gap, (dawnEnd - dl.first) / DAWN_SLOTS);
  const aftStart = Math.min(dl.last - twiLen - breath - mainLen, AFT_NO_LATER);
  const aftEnd = aftStart + mainLen;
  // High summer used to leave a three-hour hole here: the afternoon is pinned
  // to go out by four, but the light lasts until nine. Nobody runs a course
  // that way — the evening is the best of it. Twilight now starts when the
  // afternoon is away and simply runs to the last light, at a gap wide enough
  // that a long evening stays a handful of unhurried times rather than a wave.
  const twiStart = Math.min(dl.last - twiLen, aftEnd + breath);
  const twiGap = Math.max(WAVES[4].gap, (dl.last - twiStart) / TWI_SLOTS);
  // the quiet hours are whatever the two waves leave between them
  const lullStart = mornEnd + breath;
  const lullEnd = aftStart - breath;
  const lullSpan = lullEnd - lullStart;
  const lullGap = lullSpan > 0
    ? Math.max(LULL_MIN_GAP, lullSpan / Math.max(1, Math.min(7, Math.round(lullSpan / WAVES[2].gap))))
    : 0;

  push(WAVES[0], dl.first, dawnEnd, dawnGap);
  push(WAVES[1], mornStart, mornEnd, WAVES[1].gap);
  push(WAVES[2], lullStart, lullEnd, lullGap);
  push(WAVES[3], aftStart, aftEnd, WAVES[3].gap);
  push(WAVES[4], twiStart, dl.last, twiGap);
  finish(dl, times, wave, parts);
}
function finish(dl, times, wave, parts) {
  dl.times = times;
  dl.wave = wave;
  dl.parts = parts;
  dl.slots = times.length;
  // the average minutes between tee times across the whole open day — what a
  // per-minute income figure has to divide by now that the gap is not constant
  dl.spacing = times.length > 1 ? (times[times.length - 1] - times[0]) / (times.length - 1) : 60;
}

export function slotMinute(dl, i) { return dl.times[i]; }
// index of the slot at or after `minute` (== dl.slots once the day is done)
export function slotIndexAt(dl, minute) {
  const t = dl.times;
  let lo = 0, hi = t.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (t[m] < minute) lo = m + 1; else hi = m; }
  return lo;
}
// which wave slot i belongs to — the book's row headings, and the answer to
// "when does the afternoon go out"
export function waveOf(dl, i) { return WAVE[dl.wave[i]] || null; }
export function partOf(dl, i) {
  for (const p of dl.parts) if (i >= p.from && i < p.from + p.n) return p;
  return null;
}
// the next part of the day that has not started yet, from `minute`
export function nextPart(dl, minute) {
  for (const p of dl.parts) if (p.n && p.start > minute) return p;
  return null;
}
// the part the clock is standing in, if any group is due within it
export function partAt(dl, minute) {
  for (const p of dl.parts) if (p.n && minute >= p.start && minute <= p.end) return p;
  return null;
}

// ── Deterministic rolls ──────────────────────────────────────────────────────
// Every booking is a pure function of (day, slot, fill). Nothing is stored to
// know who is playing at 3:40 — the day simply is what it is, on any machine,
// at any time, before or after a reload.

export function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mix(a, b) {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2545f491) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}
export function rand01(seed, i, salt) {
  return mix(seed, Math.imul(i + 1, 2654435761) + (salt || 0) * 40503) / 4294967296;
}

// Party sizes. A day of thirty tee times is a day of real groups: singles are
// a rarity, and the fourball is what golf is actually played in. Sixty-odd
// people go out where the old five-minute sheet sent four hundred, and each
// booking on the page is worth looking at.
const SIZE_W = [0.03, 0.19, 0.29, 0.49];

// 0 = the slot went unsold. Because the booked/empty roll is a fixed number per
// slot compared against `fill`, raising the fill rate only ever ADDS bookings —
// improving the club never rewrites a tee time that was already on the books.
// `dl` bends that threshold toward the wave the slot sits in. fill is
// 1 − e^(−press), so raising a slot's share of the pressure by `demand` is
// exactly 1 − (1 − fill)^demand: strictly increasing in fill (the promise above
// holds wave by wave), never above 1, and it hands a saturating rush's overflow
// to the quiet hours instead of throwing it away.
export function bookingFor(seed, i, fill, dl) {
  const w = dl && dl.wave ? (WAVE[dl.wave[i]] || null) : null;
  const f = w ? 1 - Math.pow(1 - fill, w.demand) : fill;
  if (rand01(seed, i, 1) >= f) return 0;
  const r = rand01(seed, i, 2);
  let acc = 0;
  for (let k = 0; k < 4; k++) { acc += SIZE_W[k]; if (r < acc) return k + 1; }
  return 4;
}

// How full the book gets. Demand pressure is the club's golfers-per-minute
// (economyOf — rating, Marketing, holes, Cart Fleet) measured against what the
// day's waves can physically take. press = 1 is a day that just fills; past
// that the club starts turning people away.
export function pressFor(gpm, weekend) {
  return Math.max(0, gpm) * (weekend ? WEEKEND_LIFT : 1) / DEMAND_D;
}
export function fillFor(gpm, weekend) {
  return 1 - Math.exp(-pressFor(gpm, weekend));
}
// groups that wanted a time and could not have one — the number that makes a
// great course feel great
export function turnedAway(gpm, weekend, slots) {
  return Math.round(slots * Math.max(0, pressFor(gpm, weekend) - 1));
}

// Who is actually in the group is people.js's business — this module only ever
// decides that a slot sold and how many seats went with it. Ask
// people.leadName(seed, slot) for the name on the booking.

// ── Clock formatting ─────────────────────────────────────────────────────────

export function hhmm(min) {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + String(m).padStart(2, '0') + ' ' + ap;
}
export function hhmmShort(min) {
  min = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(min / 60), m = min % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ':' + String(m).padStart(2, '0');
}

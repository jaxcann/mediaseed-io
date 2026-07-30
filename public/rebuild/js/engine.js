// REBUILD engine — pure game logic, no DOM. See DESIGN.md §8.

// ---------- seeded RNG (shared daily dice: seed never includes roster) ----------
export function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function roll(seedStr) {
  let a = hash32(seedStr) || 1;
  a |= 0; a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ---------- ratings & values ----------
const W8 = [1.0, 0.9, 0.8, 0.7, 0.55, 0.4, 0.3, 0.2];
const W8SUM = W8.reduce((a, b) => a + b, 0);
const REPLACEMENT = 66;

export function ovrAt(p, y) {
  if (p.ovr[y] != null) return p.ovr[y];
  const ys = Object.keys(p.ovr).map(Number).sort((a, b) => a - b);
  if (!ys.length) return REPLACEMENT;
  let best = ys[0];
  for (const yy of ys) if (yy <= y) best = yy;
  return p.ovr[best];
}
export function ageOf(p, y) { return p.age + (y - (p.year0 ?? y)); }

function ageMod(a) { return a <= 23 ? 1.25 : a <= 26 ? 1.1 : a <= 29 ? 1.0 : a <= 32 ? 0.75 : 0.5; }
export function playerValue(p, y) {
  const o = ovrAt(p, y);
  let v = Math.round(Math.max(0, o - 68) ** 2 * ageMod(ageOf(p, y)));
  // recent draftees trade at their pedigree, not their rookie rating (a #1 pick is a #1 pick)
  if (p.draftSlot != null && y - p.draftYear <= 1)
    v = Math.max(v, Math.round(slotValue(p.draftSlot) * (y === p.draftYear ? 0.9 : 0.75)));
  return v;
}

const SLOT_CURVE = [[1, 430], [3, 340], [5, 275], [8, 210], [10, 180], [14, 135], [17, 110], [20, 90], [25, 70], [30, 50], [60, 25]];
export function slotValue(slot) {
  const s = Math.max(1, Math.min(60, slot));
  for (let i = 1; i < SLOT_CURVE.length; i++) {
    const [s0, v0] = SLOT_CURVE[i - 1], [s1, v1] = SLOT_CURVE[i];
    if (s <= s1) return Math.round(v0 + (v1 - v0) * (s - s0) / (s1 - s0));
  }
  return 25;
}
export function slotFromWins(w) { return Math.max(1, Math.min(30, Math.round((w - 10) * 0.55))); }
const PICK_DEPRECIATION = [1, 0.89, 0.82, 0.71, 0.65]; // NBA 2K MyNBA default curve by years out
export function pickValue(state, pick, y) {
  const slot = resolveSlot(state, pick);
  const out = Math.min(4, Math.max(0, pick.year - y));
  return Math.round(slotValue(slot) * PICK_DEPRECIATION[out]);
}
export function resolveSlot(state, pick) {
  if (pick.slot === "OWN") return slotFromWins(state.lastWins);
  return pick.slot;
}

export function rotation(state, y) {
  const sorted = [...state.roster].sort((a, b) => ovrAt(b, y) - ovrAt(a, y));
  return sorted.slice(0, 8);
}
export function teamRating(state, y, { playoff = false } = {}) {
  const rot = rotation(state, y);
  let wsum = 0;
  for (let i = 0; i < 8; i++) wsum += W8[i] * (rot[i] ? ovrAt(rot[i], y) : REPLACEMENT);
  let rating = (wsum / W8SUM) * 1.35 - 20;
  const newcomers = rot.filter(p => p.acquiredYear === y && y > state.startYear).length;
  rating -= Math.min(3.5, newcomers * 0.7);
  if (playoff) {
    const best = rot[0] ? ovrAt(rot[0], y) : REPLACEMENT;
    rating += best >= 93 ? 2 : best >= 90 ? 1 : best <= 85 ? -2 : 0;
  }
  return Math.round(rating * 10) / 10;
}
export function projWins(rating) { return Math.max(11, Math.min(72, Math.round(41 + (rating - 85) * 2.6))); }

export function payroll(state) {
  return state.roster.reduce((s, p) => s + p.sal, 0) + state.deadMoney;
}
export function capSpace(state, pack, y) {
  return Math.round((pack.cap[y] - payroll(state)) * 10) / 10;
}
export function attract(state, y) {
  const best = state.roster.length ? Math.max(...state.roster.map(p => ovrAt(p, y))) : REPLACEMENT;
  return Math.round(state.lastWins + best - 55);
}

// ---------- game state ----------
export function newGame(pack, dateStr, practice = false) {
  const Y = pack.startYear;
  const roster = pack.roster.map(p => ({ ...p, year0: Y, acquiredYear: Y }));
  const picks = [];
  for (let y = Y + 1; y <= Y + 3; y++) picks.push({ year: y, slot: "OWN", via: pack.team.id });
  for (const pk of pack.picks) picks.push({ ...pk });
  return {
    packId: pack.id, dateStr, practice,
    year: Y, phase: "offseason",
    roster, picks, deadMoney: 0,
    moves: [], usedOffers: [], usedTargets: [], signedFAs: [], drafted: [],
    lastWins: pack.baselineWins,
    seasons: [], series: [], seriesIdx: 0,
    done: false, won: false, titleYear: null
  };
}

function move(state, type, desc, meta) { state.moves.push({ type, desc, year: state.year, meta }); }
export const moveCount = s => s.moves.length;
export const peakOvr = map => Math.max(...Object.values(map));

// ---------- offseason actions ----------
export function offerAvailable(state, o) {
  return state.phase === "offseason" &&
    state.year >= o.year && state.year <= (o.until ?? o.year) &&
    !state.usedOffers.includes(o.id) &&
    o.give.every(n => state.roster.some(p => p.name === n));
}
export function acceptOffer(state, pack, o) {
  if (!offerAvailable(state, o)) return { ok: false, error: "Offer not available." };
  const incoming = (o.get.players ?? []).length;
  if (state.roster.length - o.give.length + incoming > 15) return { ok: false, error: "Roster would exceed 15. Waive someone first." };
  const gaveValue = state.roster.filter(p => o.give.includes(p.name)).reduce((s, p) => s + playerValue(p, state.year), 0);
  state.roster = state.roster.filter(p => !o.give.includes(p.name));
  for (const pl of o.get.players ?? []) state.roster.push({ ...pl, year0: o.year, acquiredYear: state.year });
  for (const pk of o.get.picks ?? []) state.picks.push({ ...pk });
  const gotValue = (o.get.players ?? []).reduce((s, pl) => s + playerValue({ ...pl, year0: o.year }, state.year), 0) +
    (o.get.picks ?? []).reduce((s, pk) => s + slotValue(pk.slot), 0);
  state.usedOffers.push(o.id);
  move(state, "trade", `Traded ${o.give.join(" + ")} to ${o.team}`,
    { kind: "offer", gaveValue, gotValue, peaks: (o.get.players ?? []).map(pl => peakOvr(pl.ovr)) });
  return { ok: true };
}

export function targetAvailable(state, t) {
  return state.phase === "offseason" &&
    state.year >= (t.from ?? state.year) && state.year <= (t.until ?? 9999) &&
    !state.usedTargets.includes(t.name) &&
    !state.roster.some(p => p.name === t.name);
}
// ---------- front-office AI: CBA matching, team direction, GM temperament ----------
// Era-accurate salary matching for over-cap teams (per Larry Coon's CBA FAQ / ESPN Trade Machine):
//   1999 CBA (through 2004): 115% + $100k · 2005 CBA: 125% + $100k
//   2011 CBA: max(min(1.5·out+.1, out+5), 1.25·out+.1) · 2017 CBA: same with 1.75 in the low band
//   2023 CBA: max(min(2·out+.25, out+7.5), 1.25·out+.25)
// Under-cap teams absorb into room; minimum-salary players always pass matching.
export function cbaMaxIn(y, out) {
  if (y < 2005) return out * 1.15 + 0.1;
  if (y < 2011) return out * 1.25 + 0.1;
  if (y < 2017) return Math.max(Math.min(out * 1.5 + 0.1, out + 5), out * 1.25 + 0.1);
  if (y < 2023) return Math.max(Math.min(out * 1.75 + 0.1, out + 5), out * 1.25 + 0.1);
  return Math.max(Math.min(out * 2 + 0.25, out + 7.5), out * 1.25 + 0.25);
}
export function cbaName(y) {
  return y < 2005 ? "115% rule, '99 CBA" : y < 2011 ? "125% rule, '05 CBA"
    : y < 2017 ? "'11 CBA bands" : y < 2023 ? "'17 CBA bands" : "'23 CBA bands";
}
const MIN_SALARY = 2.5; // approx vet-minimum: always passes matching (Minimum Player Salary TPE)
export function salaryMatch(state, pack, outSal, inSal) {
  const y = state.year;
  if (payroll(state) - outSal + inSal <= pack.cap[y]) return { ok: true, how: "absorbed into cap room" };
  if (inSal <= MIN_SALARY) return { ok: true, how: "minimum-salary exception" };
  const maxIn = cbaMaxIn(y, outSal);
  // smallest outgoing salary that would legalize this incoming number
  let lo = 0, hi = 80;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (cbaMaxIn(y, mid) < inSal) lo = mid; else hi = mid; }
  return { ok: inSal <= maxIn, how: cbaName(y), maxIn, needOut: hi };
}

const TEMPERS = [["Ruthless", 1.08], ["Stubborn", 1.04], ["By-the-book", 1.0], ["Motivated", 0.96], ["Desperate", 0.92]];
export function gmTemper(team) { return TEMPERS[hash32("gm|" + team) % TEMPERS.length]; }

export const DIR_LABEL = {
  rebuilding: "Rebuilding — wants youth & picks",
  contending: "All-in — wants ready-now help",
  retooling: "Retooling — open to anything",
};
// what an asset is worth IN THE OTHER GM'S EYES, given their team's direction
export function perceivedPlayerValue(t, p, y) {
  const dir = t.direction ?? "retooling";
  let v = playerValue(p, y);
  const age = ageOf(p, y), o = ovrAt(p, y);
  if (dir === "rebuilding") {
    if (p.sal >= 12 && age >= 30 && o < 80) return Math.round(v * 0.35);   // bad contract
    if (age <= 25) v *= 1.2;
    else if (age >= 31) v *= 0.65;
  } else if (dir === "contending") {
    if (o >= 80) v *= 1.15;
    else if (age <= 23 && o < 75) v *= 0.75;
  }
  return Math.round(v);
}
export function perceivedPickValue(t, state, pk, y) {
  const dir = t.direction ?? "retooling";
  const mult = dir === "rebuilding" ? 1.25 : dir === "contending" ? 0.7 : 1.0;
  return Math.round(pickValue(state, pk, y) * mult);
}

// assets: { players: [names], picks: [indices into state.picks] }
export function evalTrade(state, pack, t, assets) {
  const y = state.year;
  const players = state.roster.filter(p => assets.players.includes(p.name));
  const picks = assets.picks.map(i => state.picks[i]).filter(Boolean);
  const value = players.reduce((s, p) => s + perceivedPlayerValue(t, p, y), 0) +
    picks.reduce((s, pk) => s + perceivedPickValue(t, state, pk, y), 0);
  const rawValue = players.reduce((s, p) => s + playerValue(p, y), 0) +
    picks.reduce((s, pk) => s + pickValue(state, pk, y), 0);
  const outSal = players.reduce((s, p) => s + p.sal, 0);
  const room = capSpace(state, pack, y);
  const match = salaryMatch(state, pack, outSal, t.sal);
  const temper = gmTemper(t.team);
  const cost = Math.round(t.cost * temper[1]);
  const rosterOk = state.roster.length - players.length + 1 <= 15;
  // 2K-style star gate: an 86+ target demands a headline piece, not quantity-for-quality
  const bestPiece = Math.max(0,
    ...players.map(p => perceivedPlayerValue(t, p, y)),
    ...picks.map(pk => perceivedPickValue(t, state, pk, y)));
  const starGate = ovrAt(t, y) >= 86;
  const centerOk = !starGate || bestPiece >= Math.round(cost * 0.33);
  return { value, rawValue, cost, baseCost: t.cost, temper: temper[0], dir: t.direction ?? "retooling",
    outSal, salaryOk: match.ok, match, rosterOk, room, starGate, centerOk, bestPiece,
    centerNeed: Math.round(cost * 0.33),
    ok: value >= cost && match.ok && rosterOk && centerOk };
}

// the other GM proposes the cheapest single addition that would close the deal
export function counterOffer(state, pack, t, assets) {
  const y = state.year;
  const candidates = [
    ...state.roster.filter(p => !assets.players.includes(p.name))
      .map(p => ({ type: "player", key: p.name, label: p.name, pv: perceivedPlayerValue(t, p, y) })),
    ...state.picks.map((pk, i) => ({ type: "pick", key: i, pv: perceivedPickValue(t, state, pk, y),
      label: `the ${pk.year} 1st${pk.slot === "OWN" ? "" : ` (#${pk.slot})`}` }))
      .filter(c => !assets.picks.includes(c.key)),
  ].sort((a, b) => a.pv - b.pv);
  for (const c of candidates) {
    const trial = c.type === "player"
      ? { players: [...assets.players, c.key], picks: assets.picks }
      : { players: assets.players, picks: [...assets.picks, c.key] };
    if (evalTrade(state, pack, t, trial).ok) return c;
  }
  return null;
}
export function executeTrade(state, pack, t, assets) {
  const ev = evalTrade(state, pack, t, assets);
  if (!ev.ok) return { ok: false, error: !ev.salaryOk ? "Salaries don't match." : !ev.rosterOk ? "Roster would exceed 15." : "They want more." };
  state.roster = state.roster.filter(p => !assets.players.includes(p.name));
  const keep = new Set(assets.picks);
  state.picks = state.picks.filter((_, i) => !keep.has(i));
  state.roster.push({ name: t.name, pos: t.pos, age: t.age, sal: t.sal, ovr: t.ovr, year0: t.from ?? state.year, acquiredYear: state.year });
  state.usedTargets.push(t.name);
  move(state, "trade", `Acquired ${t.name} from ${t.team}`,
    { kind: "trade", name: t.name, peak: peakOvr(t.ovr), cost: t.cost, paid: ev.value });
  return { ok: true };
}

export function faStatus(state, pack, fa) {
  const y = state.year;
  const att = attract(state, y);
  const room = capSpace(state, pack, y);
  const signedHere = state.signedFAs.includes(`${y}:${fa.name}`);
  const onRoster = state.roster.some(p => p.name === fa.name);
  return {
    att, room, wants: att >= fa.pull, affords: room >= fa.ask,
    rosterOk: state.roster.length < 15,
    ok: !signedHere && !onRoster && att >= fa.pull && room >= fa.ask && state.roster.length < 15
  };
}
export function signFA(state, pack, fa) {
  const st = faStatus(state, pack, fa);
  if (!st.ok) return { ok: false, error: !st.wants ? "Not interested in your situation." : !st.affords ? "Not enough cap space." : "No roster spot." };
  state.roster.push({ name: fa.name, pos: fa.pos, age: fa.age, sal: fa.ask, ovr: fa.ovr, year0: state.year, acquiredYear: state.year });
  state.signedFAs.push(`${state.year}:${fa.name}`);
  move(state, "sign", `Signed ${fa.name} ($${fa.ask}M)`,
    { kind: "sign", name: fa.name, ask: fa.ask, peak: peakOvr(fa.ovr), cap: pack.cap[state.year] });
  return { ok: true };
}

// ---------- shop a player (2K-style "find a trade") ----------
function invSlotValue(v) {
  for (let s = 1; s <= 60; s++) if (slotValue(s) <= v) return s;
  return 60;
}
export function shopOffer(state, pack, name) {
  if (state.phase !== "offseason") return null;
  const p = state.roster.find(x => x.name === name);
  if (!p) return null;
  const pickYear = Math.min(pack.startYear + 3, state.year + 1);
  if (pickYear < state.year + 1) return null;               // no draft left in the window
  const val = playerValue(p, state.year);
  if (val < 20) return null;                                 // nobody's calling about him
  const seedBase = state.practice ? `practice|${state.packId}` : state.dateStr;
  const u = roll(`${seedBase}|shop|${state.year}|${name}`);
  const back = Math.round(val * (0.7 + 0.18 * u));           // sellers eat a 12–30% haircut
  const pool = [...new Set([...(pack.tradeBlock ?? []).map(t => t.team), ...Object.values(pack.gauntlet).flat().map(g => g.team)])]
    .filter(tm => tm !== pack.team.id);
  const team = pool[hash32(`shopteam|${state.packId}|${state.year}|${name}`) % pool.length] ?? "???";
  const picks = [];
  const s1 = Math.max(8, invSlotValue(back));                // no top-7 picks from shopping
  picks.push({ year: pickYear, slot: s1, via: team });
  const rem = back - slotValue(s1);
  if (rem >= 25 && pickYear + 1 <= pack.startYear + 3)
    picks.push({ year: pickYear + 1, slot: Math.max(20, invSlotValue(rem)), via: team });
  return { name, team, picks, back, val };
}
export function executeShop(state, pack, name) {
  const o = shopOffer(state, pack, name);
  if (!o) return { ok: false, error: "No market for him right now." };
  const p = state.roster.find(x => x.name === name);
  state.roster = state.roster.filter(x => x.name !== name);
  for (const pk of o.picks) state.picks.push({ ...pk });
  move(state, "trade", `Traded ${name} to ${o.team} for draft capital`,
    { kind: "offer", gaveValue: o.val, gotValue: o.picks.reduce((s, pk) => s + slotValue(pk.slot), 0), peaks: [] });
  return { ok: true, offer: o };
}

export function waive(state, name) {
  const p = state.roster.find(x => x.name === name);
  if (!p) return { ok: false };
  state.roster = state.roster.filter(x => x.name !== name);
  state.deadMoney = Math.round((state.deadMoney + p.sal * 0.5) * 10) / 10;
  return { ok: true, dead: p.sal * 0.5 };
}

// ---------- draft ----------
export function picksForYear(state, y) {
  return state.picks
    .map((pk, i) => ({ ...pk, idx: i }))
    .filter(pk => pk.year === y)
    .sort((a, b) => resolveSlot(state, a) - resolveSlot(state, b));
}
export function availableProspects(state, pack, y, slot) {
  return (pack.draft[y] ?? [])
    .filter(d => d.realPick >= slot && !state.drafted.includes(d.name))
    .sort((a, b) => a.realPick - b.realPick);
}
function rookieSal(slot) { return slot <= 5 ? 6.0 : slot <= 14 ? 3.5 : slot <= 30 ? 2.2 : 1.2; }
export function draftPlayer(state, pack, pickIdx, prospectName) {
  const pk = state.picks[pickIdx];
  if (!pk || pk.year !== state.year) return { ok: false, error: "Bad pick." };
  const slot = resolveSlot(state, pk);
  const d = (pack.draft[state.year] ?? []).find(x => x.name === prospectName);
  if (!d || d.realPick < slot || state.drafted.includes(d.name)) return { ok: false, error: "Not available at this slot." };
  if (state.roster.length >= 15) return { ok: false, error: "No roster spot. Waive someone first." };
  state.roster.push({ name: d.name, pos: d.pos, age: d.age, sal: rookieSal(slot), ovr: d.ovr, year0: state.year, acquiredYear: state.year, draftSlot: slot, draftYear: state.year });
  state.drafted.push(d.name);
  state.draftLog = state.draftLog ?? [];
  state.draftLog.push({ name: d.name, slot, year: state.year, realPick: d.realPick, peak: peakOvr(d.ovr) });
  state.picks.splice(pickIdx, 1);
  return { ok: true, slot };
}
// ---------- scouting ----------
export const SCOUTS_PER_DRAFT = 2;
export function scoutsLeft(state, y) { return SCOUTS_PER_DRAFT - ((state.scoutUsed ?? {})[y] ?? 0); }
export function scoutProspect(state, pack, y, name) {
  state.scouted = state.scouted ?? {}; state.scoutUsed = state.scoutUsed ?? {};
  if (state.scouted[name]) return { ok: true, tier: state.scouted[name] };
  if (scoutsLeft(state, y) <= 0) return { ok: false, error: "No scouting trips left this summer." };
  const d = (pack.draft[y] ?? []).find(x => x.name === name);
  if (!d) return { ok: false, error: "Unknown prospect." };
  const peak = peakOvr(d.ovr);
  const tier = peak >= 90 ? "FRANCHISE" : peak >= 85 ? "ALL-STAR" : peak >= 79 ? "STARTER" : peak >= 73 ? "ROTATION" : "FRINGE";
  state.scouted[name] = tier;
  state.scoutUsed[y] = ((state.scoutUsed ?? {})[y] ?? 0) + 1;
  return { ok: true, tier };
}

export function passPick(state, pickIdx) {
  const pk = state.picks[pickIdx];
  if (!pk || pk.year !== state.year) return { ok: false };
  state.picks.splice(pickIdx, 1);
  return { ok: true };
}

// ---------- season & playoffs ----------
export function startSeason(state) {
  if (state.phase !== "offseason") return { ok: false };
  const y = state.year;
  const rating = teamRating(state, y);
  const wins = projWins(rating);
  state.seasons.push({ year: y, rating, wins, playoffResult: null });
  state.lastWins = wins;
  state.phase = "season";
  return { ok: true, rating, wins };
}

export function playoffPath(state, pack) {
  const y = state.year + 1; // playoff calendar year
  // "unless" lets a pack downgrade a gauntlet team when YOU rostered its era-defining star
  const g = (pack.gauntlet[y] ?? []).map(e =>
    e.unless && state.roster.some(p => p.name === e.unless.name)
      ? { ...e, ovr: e.unless.then } : { ...e });
  const mine = g.filter(t => t.conf === pack.team.conf).sort((a, b) => b.ovr - a.ovr);
  const other = g.filter(t => t.conf !== pack.team.conf).sort((a, b) => b.ovr - a.ovr);
  const weakest = mine.length ? mine[mine.length - 1].ovr : 88;
  const path = [
    { round: "First Round", team: "—", ovr: Math.max(84, weakest - 4) },
  ];
  if (mine.length >= 2) path.push({ round: "Conf Semifinals", team: mine[1].team, ovr: mine[1].ovr });
  else path.push({ round: "Conf Semifinals", team: "—", ovr: Math.max(85, weakest - 2) });
  path.push({ round: "Conf Finals", team: mine.length ? mine[0].team : "—", ovr: mine.length ? mine[0].ovr : 89 });
  path.push({ round: "NBA Finals", team: other.length ? other[0].team : "—", ovr: other.length ? other[0].ovr : 92 });
  return path;
}
export function seriesProb(myRating, oppOvr) {
  // +3 "built for the playoffs" edge keeps title odds sane vs a 4-series gauntlet
  const p = 1 / (1 + Math.exp(-(myRating - oppOvr + 3) / 6));
  return Math.max(0.03, Math.min(0.97, Math.round(p * 100) / 100));
}
export function titleOdds(state, pack) {
  const r = teamRating(state, state.year, { playoff: true });
  return playoffPath(state, pack).reduce((p, s) => p * seriesProb(r, s.ovr), 1);
}

export function enterPlayoffs(state, pack) {
  const season = state.seasons[state.seasons.length - 1];
  if (season.wins < 42) { season.playoffResult = "missed"; return endSeason(state, pack, "missed"); }
  const r = teamRating(state, state.year, { playoff: true });
  state.series = playoffPath(state, pack).map((s, i) => ({ ...s, p: seriesProb(r, s.ovr), won: null, idx: i }));
  state.seriesIdx = 0;
  state.phase = "playoffs";
  return { ok: true, playoffs: true };
}
function gameProbFromSeries(pSeries) {
  // per-game win prob g such that P(win a best-of-7 | g) == pSeries
  const seriesP = g => [1, 4, 10, 20].reduce((s, c, j) => s + c * g ** 4 * (1 - g) ** j, 0);
  let lo = 0.02, hi = 0.98;
  for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (seriesP(mid) < pSeries) lo = mid; else hi = mid; }
  return (lo + hi) / 2;
}
export function playNextSeries(state, pack) {
  const s = state.series[state.seriesIdx];
  if (!s) return { ok: false };
  // Daily: dice seeded by date+scenario+round+game — shared by everyone, independent of roster.
  // Practice: true randomness, so retries aren't cursed by a fixed seed.
  const g = gameProbFromSeries(s.p);
  const games = [];
  let w = 0, l = 0;
  while (w < 4 && l < 4) {
    const u = state.practice ? Math.random() : roll(`${state.dateStr}|${state.packId}|${state.year}|${s.idx}|g${games.length}`);
    if (u < g) { w++; games.push("W"); } else { l++; games.push("L"); }
  }
  s.games = games;
  s.won = w === 4;
  const season = state.seasons[state.seasons.length - 1];
  if (!s.won) {
    season.playoffResult = ["R1", "R2", "CF", "F"][s.idx];
    state.pendingEnd = "eliminated";
    return { ok: true, won: false, series: s, over: true };
  }
  state.seriesIdx++;
  if (state.seriesIdx >= state.series.length) {
    season.playoffResult = "CHAMP";
    state.pendingEnd = "champion";
    return { ok: true, won: true, series: s, champion: true };
  }
  return { ok: true, won: true, series: s };
}
// Applies the phase transition after a decisive series — kept separate so the UI
// can finish revealing the games before the screen changes.
export function continueAfterSeries(state, pack) {
  const pending = state.pendingEnd;
  state.pendingEnd = null;
  if (pending === "champion") {
    state.done = true; state.won = true; state.titleYear = state.year;
    state.phase = "victory";
    return { champion: true };
  }
  if (pending === "eliminated") {
    const season = state.seasons[state.seasons.length - 1];
    return endSeason(state, pack, season.playoffResult);
  }
  return {};
}
function endSeason(state, pack, result) {
  if (state.year >= pack.startYear + 3) {
    state.done = true; state.won = false; state.phase = "defeat";
    return { over: true, defeat: true, result };
  }
  state.year++;
  state.phase = "offseason";
  state.series = []; state.seriesIdx = 0;
  return { over: true, nextYear: state.year, result };
}
export function skipToOffseason(state, pack) { // called from season screen when playoffs missed handled in enterPlayoffs
  return endSeason(state, pack, "missed");
}

// ---------- sharing ----------
const RESULT_EMOJI = { missed: "🟥", R1: "🟨", R2: "🟨", CF: "🟧", F: "🥈", CHAMP: "🏆" };
export function golfLabel(n, par) {
  const d = n - par;
  if (d <= -3) return "Albatross";
  return { "-2": "Eagle", "-1": "Birdie", 0: "Even par", 1: "Bogey", 2: "Double bogey" }[d] ?? `+${d} over`;
}
export function shareText(state, pack, gameNo) {
  const grid = state.seasons.map(s => RESULT_EMOJI[s.playoffResult] ?? "⬛").join("");
  const n = moveCount(state);
  const head = state.practice ? `DAILY REBUILD (practice) — ${pack.startYear} ${pack.team.name}` : `DAILY REBUILD #${gameNo} — ${pack.startYear} ${pack.team.name}`;
  const tail = state.won
    ? `${n} move${n === 1 ? "" : "s"} · ${golfLabel(n, pack.par)} (Par ${pack.par}) · Title in Year ${state.titleYear - pack.startYear + 1}`
    : `No banner · ${n} move${n === 1 ? "" : "s"} (Par ${pack.par})`;
  return `${head}\n${grid}  ${tail}`;
}
export { RESULT_EMOJI };

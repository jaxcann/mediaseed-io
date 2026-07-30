import * as E from "./engine.js";
import PACKS from "../data/packs/index.js";
import HEADS from "../data/headshots.js";

// ---------- player avatars ----------
const headURL = id => `https://cdn.nba.com/headshots/nba/latest/260x190/${id}.png`;
function ava(name, cls = "") {
  const id = HEADS[name];
  const init = name.split(" ").filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return `<span class="ava ${cls}"><i>${esc(init)}</i>${id ? `<img loading="lazy" decoding="async" src="${headURL(id)}" alt="" onerror="this.remove()">` : ""}</span>`;
}

// ---------- sound (tiny WebAudio synth, no assets) ----------
const SFX = {
  get muted() { return localStorage.getItem("rebuild:muted") === "1"; },
  toggle() { localStorage.setItem("rebuild:muted", this.muted ? "0" : "1"); },
  ctx: null,
  tone(freq, dur, type, gain, delay = 0, slideTo) {
    try {
      this.ctx = this.ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = this.ctx.currentTime + delay;
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t0);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
      g.gain.setValueAtTime(gain, t0);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t0); o.stop(t0 + dur + 0.02);
    } catch { /* audio unavailable */ }
  },
  play(name) {
    if (this.muted) return;
    if (name === "tick") this.tone(1250, 0.035, "square", 0.015);
    else if (name === "swish") this.tone(880, 0.16, "sine", 0.05, 0, 300);
    else if (name === "win") { this.tone(523, 0.22, "triangle", 0.06); this.tone(784, 0.3, "triangle", 0.06, 0.11); }
    else if (name === "loss") this.tone(330, 0.32, "sawtooth", 0.04, 0, 215);
    else if (name === "champ") [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.34, "triangle", 0.065, i * 0.13));
  }
};

// ---------- daily rotation ----------
const EPOCH = Date.UTC(2026, 6, 29); // REBUILD #1
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function gameNumber() {
  const d = new Date();
  const local = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.floor((local - EPOCH) / 86400000) + 1;
}
function dailyPack() {
  const n = gameNumber() - 1;
  return PACKS[((n % PACKS.length) + PACKS.length) % PACKS.length];
}

// ---------- persistence ----------
const store = {
  key: (pack, practice) => practice ? `rebuild:practice:${pack.id}` : `rebuild:${todayStr()}:${pack.id}`,
  save() { if (A.state) localStorage.setItem(store.key(A.pack, A.state.practice), JSON.stringify(A.state)); },
  load(pack, practice) {
    try { const raw = localStorage.getItem(store.key(pack, practice)); return raw ? JSON.parse(raw) : null; }
    catch { return null; }
  },
  stats() { try { return JSON.parse(localStorage.getItem("rebuild:stats")) ?? {} } catch { return {} } },
  saveStats(s) { localStorage.setItem("rebuild:stats", JSON.stringify(s)); }
};
function recordStats() {
  if (A.state.practice || A.state.statsRecorded) return;
  const s = store.stats();
  s.played = (s.played ?? 0) + 1;
  if (A.state.won) {
    s.wins = (s.wins ?? 0) + 1;
    s.streak = (s.streak ?? 0) + 1;
    s.maxStreak = Math.max(s.maxStreak ?? 0, s.streak);
    const diff = E.moveCount(A.state) - A.pack.par;
    s.hist = s.hist ?? {}; s.hist[diff] = (s.hist[diff] ?? 0) + 1;
  } else s.streak = 0;
  store.saveStats(s);
  A.state.statsRecorded = true;
  store.save();
}

// ---------- app state ----------
const A = { pack: null, state: null, tab: "news", trade: null, draftPick: null, screen: "landing" };
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function startGame(pack, practice) {
  A.pack = pack;
  A.state = store.load(pack, practice) ?? E.newGame(pack, todayStr(), practice);
  if (!practice) {
    // stale daily from a previous date shouldn't leak in (key includes date, so this is fresh)
  }
  if (A.state.pendingEnd) E.continueAfterSeries(A.state, pack);
  A.tab = "news"; A.trade = null; A.draftPick = null; A.screen = "game";
  store.save();
  render();
}

// ---------- helpers ----------
const fmtM = v => `$${(Math.round(v * 10) / 10).toFixed(1)}M`;
const yearLabel = y => `${y}–${String((y + 1) % 100).padStart(2, "0")}`;
function ovrClass(o) { return o >= 90 ? "elite" : o >= 85 ? "star" : o >= 78 ? "starter" : o >= 72 ? "rot" : "fringe"; }
function ovrChip(o) { return `<span class="ovr ${ovrClass(o)}">${o}</span>`; }
function seasonIndex() { return A.state.year - A.pack.startYear + 1; }
const fmtPct = v => `${Math.round(v * 100)}%`;
function oddsDeltaChip(odds) {
  const prev = A._odds;
  A._odds = odds;
  if (prev == null || Math.abs(odds - prev) < 0.005) return "";
  const d = Math.round((odds - prev) * 100);
  return ` <em class="delta ${d > 0 ? "up" : "down"}">${d > 0 ? "+" : ""}${d}%</em>`;
}
function oddsAfter(fn) {
  try {
    const clone = JSON.parse(JSON.stringify(A.state));
    const r = fn(clone);
    if (r && r.ok === false) return null;
    return E.titleOdds(clone, A.pack);
  } catch { return null; }
}
function oddsGainChip(fn) {
  const now = E.titleOdds(A.state, A.pack);
  const after = oddsAfter(fn);
  if (after == null) return "";
  const d = Math.round((after - now) * 100);
  if (d === 0) return "";
  return `<span class="odds-gain ${d > 0 ? "up" : "down"}">${d > 0 ? "+" : ""}${d}% title odds</span>`;
}
function diffLabel(n, par) {
  const d = n - par;
  if (d < 0) return `${Math.abs(d)} under par`;
  if (d === 0) return "even par";
  return `${d} over par`;
}

// ---------- HUD ----------
function renderHUD() {
  const hud = $("#hud");
  if (A.screen !== "game") {
    document.body.classList.remove("themed");
    document.title = "DAILY REBUILD — the NBA time-machine";
    hud.innerHTML = `${A.screen === "landing" ? "" : `<div class="hud-brand">DAILY <span>REBUILD</span></div>`}
      <div class="hud-sub">THE NBA TIME-MACHINE · NO. ${gameNumber()}</div>
      <div class="hud-right"><button class="ghost" data-act="mute">${SFX.muted ? "🔇" : "🔊"}</button><button class="ghost" data-act="stats">STATS</button><button class="ghost" data-act="help">HOW</button></div>`;
    return;
  }
  const s = A.state, p = A.pack;
  const phaseTxt = { offseason: "OFFSEASON", season: "REGULAR SEASON", playoffs: "PLAYOFFS", victory: "CHAMPIONS", defeat: "GAME OVER" }[s.phase];
  const cap = E.capSpace(s, p, Math.min(s.year, p.startYear + 3));
  hud.innerHTML = `
    <div class="hud-team" style="--c1:${p.team.colors[0]};--c2:${p.team.colors[1]}">
      <div class="hud-abbr">${p.team.id}</div>
      <div class="hud-teamname">${esc(p.team.city)}<br><b>${esc(p.team.name)}</b></div>
    </div>
    <div class="hud-phase">
      <div class="hud-phase-main">${phaseTxt} <span class="hud-year">${s.phase === "playoffs" ? yearLabel(s.year) : s.phase === "offseason" ? s.year : yearLabel(s.year)}</span></div>
      <div class="hud-phase-sub">${s.practice ? `<span class="prac-chip">PRACTICE</span> · ` : ""}SEASON ${Math.min(seasonIndex(), 4)} OF 4 · ${esc(p.title).toUpperCase()}</div>
    </div>
    <div class="hud-leds">
      <div class="led"><label>MOVES</label><span class="led-num amber">${E.moveCount(s)}</span></div>
      <div class="led"><label>PAR</label><span class="led-num white">${p.par}</span></div>
      <div class="led"><label>CAP ROOM</label><span class="led-num ${cap >= 0 ? "green" : "red"}">${cap.toFixed(1)}</span></div>
    </div>
    <div class="hud-right"><button class="ghost" data-act="mute">${SFX.muted ? "🔇" : "🔊"}</button><button class="ghost" data-act="home">☰</button></div>`;
  document.body.classList.add("themed");
  document.body.style.setProperty("--teamc", p.team.colors[0]);
  document.title = `${p.startYear} ${p.team.name} · ${phaseTxt} — DAILY REBUILD`;
}

// ---------- ticker ----------
function renderTicker() {
  const t = $("#ticker");
  if (A.screen !== "game" || !A.state) { t.innerHTML = ""; t.style.display = "none"; return; }
  t.style.display = "";
  const items = (A.pack.events ?? []).filter(e => e.year === A.state.year).map(e => e.text);
  for (const m of A.state.moves.filter(m => m.year === A.state.year).slice(-3))
    items.unshift(`BREAKING: ${A.pack.team.name} — ${m.desc}`);
  items.push(`${A.pack.team.name.toUpperCase()} FRONT OFFICE: ${E.moveCount(A.state)} moves used · par ${A.pack.par}`);
  if (!A.state.practice) items.push(`DAILY REBUILD #${gameNumber()} · everyone gets the same dice today`);
  const line = items.map(i => `<span>${esc(i)}</span>`).join("<span class='tick-dot'>●</span>");
  t.innerHTML = `<div class="tick-inner">${line}<span class='tick-dot'>●</span>${line}</div>`;
}

// ---------- screens ----------
function render() {
  renderHUD();
  renderTicker();
  const scr = $("#screen");
  // only run entrance animations when the screen/tab actually changes, not on every action re-render
  const animKey = `${A.screen}|${A.state?.phase ?? ""}|${A.tab}|${A.state?.year ?? ""}|${A.pack?.id ?? ""}`;
  scr.classList.toggle("fresh", animKey !== A._animKey);
  A._animKey = animKey;
  if (A.screen === "landing") return renderLanding(scr);
  if (A.screen === "archive") return renderArchive(scr);
  const s = A.state;
  if (s.phase === "offseason") return renderOffseason(scr);
  if (s.phase === "season") return renderSeason(scr);
  if (s.phase === "playoffs") return renderPlayoffs(scr);
  if (s.phase === "victory" || s.phase === "defeat") return renderEnd(scr);
}

function renderLanding(scr) {
  const pack = dailyPack();
  const existing = store.load(pack, false);
  const done = existing?.done;
  scr.innerHTML = `
    <div class="landing">
      <div class="logo-poster"><img src="/rebuild/assets/logo.png" alt="DAILY REBUILD" draggable="false"></div>
      <div class="land-card" style="--c1:${pack.team.colors[0]};--c2:${pack.team.colors[1]}">
        <div class="land-no">TODAY'S SCENARIO · №${gameNumber()}</div>
        <div class="land-team">${pack.startYear} ${esc(pack.team.city)} ${esc(pack.team.name)}</div>
        <div class="land-title">“${esc(pack.title)}”</div>
        <div class="land-meta"><span class="pill diff-${pack.difficulty.toLowerCase()}">${pack.difficulty}</span><span class="pill">PAR ${pack.par}</span><span class="pill">4 SEASONS</span></div>
        <p class="land-intro">${esc(pack.intro)}</p>
        <button class="primary big" data-act="play-daily">${done ? "VIEW RESULT" : existing ? "RESUME REBUILD" : "TAKE THE JOB"}</button>
        ${done ? `<div class="land-result">${existing.seasons.map(x => E.RESULT_EMOJI[x.playoffResult] ?? "⬛").join("")} · ${existing.moves.length} move${existing.moves.length === 1 ? "" : "s"} · ${existing.won ? E.golfLabel(existing.moves.length, pack.par) : "No banner"}</div>` : ""}
      </div>
      <div class="land-links">
        <button class="ghost" data-act="help">How to play</button>
        <button class="ghost" data-act="stats">Stats</button>
        <button class="ghost" data-act="archive">Practice archive</button>
      </div>
    </div>`;
}

function renderArchive(scr) {
  const daily = dailyPack();
  scr.innerHTML = `
    <div class="archive">
      <h2>Practice Archive</h2>
      <p class="muted">Unranked replays. Daily dice don't apply — every scenario, any time.</p>
      <div class="arch-grid">
        ${PACKS.map(p => `
          <button class="arch-card" data-act="play-practice" data-id="${p.id}" style="--c1:${p.team.colors[0]}">
            <div class="arch-year">${p.startYear}</div>
            <div class="arch-name">${esc(p.team.city)} ${esc(p.team.name)}</div>
            <div class="arch-title">“${esc(p.title)}”</div>
            <div class="arch-meta"><span class="diff diff-${p.difficulty.toLowerCase()}">${p.difficulty}</span> · Par ${p.par}${p.id === daily.id ? " · TODAY" : ""}</div>
            <div class="arch-best">${bestFor(p.id) ? `🏆 Best: ${bestFor(p.id).moves} move${bestFor(p.id).moves === 1 ? "" : "s"} (${E.golfLabel(bestFor(p.id).moves, p.par)})` : "Unsolved"}</div>
          </button>`).join("")}
      </div>
      <button class="ghost" data-act="home">← Back</button>
    </div>`;
}

// ----- offseason -----
function renderOffseason(scr) {
  const s = A.state, p = A.pack, y = s.year;
  const picksNow = E.picksForYear(s, y);
  const rating = E.teamRating(s, y);
  const wins = E.projWins(rating);
  const odds = E.titleOdds(s, p);
  const offersN = (p.offers ?? []).filter(o => E.offerAvailable(s, o)).length;
  const tabs = [
    ["news", "FRONT OFFICE"], ["roster", "ROSTER"],
    ["trade", `TRADES${offersN ? ` <i>${offersN}</i>` : ""}`], ["fa", "FREE AGENTS"],
  ];
  if (y > p.startYear || picksNow.length) tabs.splice(2, 0, ["draft", `DRAFT${picksNow.length ? ` <i>${picksNow.length}</i>` : ""}`]);
  scr.innerHTML = `
    <div class="off">
      <nav class="tabs">${tabs.map(([id, label]) => `<button class="tab ${A.tab === id ? "on" : ""}" data-tab="${id}">${label}</button>`).join("")}</nav>
      <div class="panel" id="panel"></div>
      <div class="offbar">
        <div class="offbar-stat"><label>TEAM RATING</label><b>${rating.toFixed(1)}</b></div>
        <div class="offbar-stat"><label>PROJECTED</label><b>${wins}–${82 - wins}</b></div>
        <div class="offbar-stat odds"><label>TITLE ODDS</label><b>${fmtPct(odds)}${oddsDeltaChip(odds)}</b></div>
        <button class="primary" data-act="start-season">START ${yearLabel(y)} SEASON ▶</button>
      </div>
    </div>`;
  const panel = $("#panel");
  if (A.tab === "news") renderNews(panel);
  else if (A.tab === "roster") renderRoster(panel);
  else if (A.tab === "draft") renderDraft(panel);
  else if (A.tab === "trade") renderTrade(panel);
  else if (A.tab === "fa") renderFA(panel);
}

function renderNews(el) {
  const s = A.state, p = A.pack, y = s.year;
  const events = (p.events ?? []).filter(e => e.year === y);
  const log = s.moves.length
    ? s.moves.map(m => `<li><span class="log-year">${m.year}</span>${esc(m.desc)}</li>`).join("")
    : "<li class='muted'>No moves yet. Every move counts against par.</li>";
  const best = E.rotation(s, y)[0];
  const odds = E.titleOdds(s, p);
  const gaunt = (p.gauntlet[y + 1] ?? []).slice().sort((a, b) => b.ovr - a.ovr);
  const seasonsLeft = p.startYear + 4 - y;
  scrHTML(el, `
    ${y === p.startYear ? `<div class="card intro-card"><p>${esc(p.intro)}</p><p class="tip">☎ ${esc(p.tips)}</p></div>` : ""}
    <div class="grid2">
      <div class="card"><h3>State of the Franchise</h3>
        <div class="sit-grid">
          <div class="sit"><label>SEASONS LEFT</label><b>${seasonsLeft}</b></div>
          <div class="sit"><label>MOVES / PAR</label><b>${E.moveCount(s)}<span class="sit-dim">/${p.par}</span></b></div>
          <div class="sit"><label>TITLE ODDS</label><b class="amber">${fmtPct(odds)}</b></div>
          <div class="sit"><label>CAP ROOM</label><b>${fmtM(E.capSpace(s, p, y))}</b></div>
          <div class="sit wide"><label>FRANCHISE PLAYER</label><b class="sit-player">${best ? `${ava(best.name, "sm")} ${esc(best.name)} ${ovrChip(E.ovrAt(best, y))}` : "—"}</b></div>
          <div class="sit"><label>PICKS OWNED</label><b>${s.picks.filter(pk => pk.year > y || pk.year === y).length}</b></div>
          <div class="sit"><label>ROSTER</label><b>${s.roster.length}<span class="sit-dim">/15</span></b></div>
        </div>
      </div>
      <div class="card"><h3>Standing In Your Way — ${y + 1}</h3>
        <ul class="wire">${gaunt.map(t => `<li class="gaunt-li"><span class="pos">${t.conf}</span> <b>${t.team}</b> ${ovrChip(t.ovr)}</li>`).join("")}</ul>
      </div>
    </div>
    <div class="card"><h3>League Wire — Summer ${y}</h3>
      <ul class="wire">${events.map(e => `<li>${esc(e.text)}</li>`).join("") || "<li class='muted'>Quiet summer so far.</li>"}</ul></div>
    <div class="card"><h3>Your Moves</h3><ul class="movelog">${log}</ul></div>
    ${s.seasons.length ? `<div class="card"><h3>Season Results</h3><ul class="wire">${s.seasons.map(x =>
      `<li>${yearLabel(x.year)}: <b>${x.wins}–${82 - x.wins}</b> · ${resultWord(x.playoffResult)}</li>`).join("")}</ul></div>` : ""}
  `);
}
function resultWord(r) {
  return { missed: "missed playoffs", R1: "lost 1st round", R2: "lost conf semis", CF: "lost conf finals", F: "lost the Finals", CHAMP: "🏆 NBA CHAMPIONS" }[r] ?? "—";
}

function renderRoster(el) {
  const s = A.state, y = s.year;
  const sorted = [...s.roster].sort((a, b) => E.ovrAt(b, y) - E.ovrAt(a, y));
  scrHTML(el, `
    <div class="card">
      <h3>Roster · ${s.roster.length}/15 ${s.deadMoney ? `<span class="muted">· dead money ${fmtM(s.deadMoney)}</span>` : ""}</h3>
      <table class="tbl">
        <thead><tr><th></th><th>PLAYER</th><th>AGE</th><th>OVR</th><th>SALARY</th><th></th></tr></thead>
        <tbody>${sorted.map((p, i) => `
          ${i === 8 ? `<tr class="divider-row"><td colspan="6">— END OF ROTATION —</td></tr>` : ""}
          <tr class="${i < 8 ? "" : "bench"}">
            <td class="pos">${p.pos}</td>
            <td><span class="p-name">${ava(p.name)}<span>${esc(p.name)}${p.acquiredYear === y && y > A.pack.startYear ? " <span class='new-dot' title='New arrival — chemistry tax this season'>NEW</span>" : ""}</span></span></td>
            <td>${E.ageOf(p, y)}</td>
            <td>${ovrChip(E.ovrAt(p, y))}</td>
            <td>${fmtM(p.sal)}</td>
            <td><button class="mini danger arm" data-act="waive" data-name="${esc(p.name)}">WAIVE</button></td>
          </tr>`).join("")}</tbody>
      </table>
      <p class="muted small">Top 8 make the rotation. Waiving is free but leaves 50% dead money on your cap. New arrivals pay a small chemistry tax in year one.</p>
    </div>
    <div class="card"><h3>Draft Capital</h3>
      ${s.picks.length ? `<ul class="wire">${s.picks.map(pk => `<li>${pk.year} 1st — ${pk.slot === "OWN" ? `own (projects #${E.slotFromWins(s.lastWins)})` : `#${pk.slot} via ${pk.via}`}</li>`).join("")}</ul>` : "<p class='muted'>No picks left. Bold.</p>"}
    </div>`);
}

function renderDraft(el) {
  const s = A.state, p = A.pack, y = s.year;
  const picksNow = E.picksForYear(s, y);
  if (!picksNow.length) {
    return scrHTML(el, `<div class="card"><h3>${y} NBA Draft</h3><p class="muted">You hold no picks in this draft.</p></div>`);
  }
  const pk = picksNow.find(x => x.idx === A.draftPick) ?? picksNow[0];
  const slot = E.resolveSlot(s, pk);
  const avail = E.availableProspects(s, p, y, slot);
  scrHTML(el, `
    <div class="card">
      <h3>${y} NBA Draft — you're on the clock</h3>
      <div class="pickrow">${picksNow.map(x => {
        const sl = E.resolveSlot(s, x);
        return `<button class="pill ${x.idx === pk.idx ? "on" : ""}" data-act="sel-pick" data-idx="${x.idx}">PICK #${sl}${x.slot === "OWN" ? "" : ` (${x.via})`}</button>`;
      }).join("")}</div>
      <p class="muted small">The board shows what everyone knew on draft night — where they actually went. What they became… that's on you.
        Drafting is a free move, and you get <b>${E.scoutsLeft(s, y)} of ${E.SCOUTS_PER_DRAFT}</b> scouting trips: burn one to learn a prospect's true ceiling.</p>
      <table class="tbl">
        <thead><tr><th>REAL</th><th></th><th>PROSPECT</th><th>AGE</th><th>SCOUT'S NOTE</th><th></th><th></th></tr></thead>
        <tbody>${avail.map(d => {
          const tier = (s.scouted ?? {})[d.name];
          return `
          <tr>
            <td class="pos">#${d.realPick}</td><td class="pos">${d.pos}</td>
            <td><span class="p-name">${ava(d.name)}<span>${esc(d.name)}</span></span></td><td>${d.age}</td>
            <td class="muted small">${esc(d.note ?? "")}</td>
            <td>${tier ? `<span class="tier t-${tier.toLowerCase().replace("-", "")}">${tier}</span>`
              : `<button class="mini scout" data-act="scout" data-name="${esc(d.name)}" ${E.scoutsLeft(s, y) > 0 ? "" : "disabled"}>SCOUT</button>`}</td>
            <td><button class="mini arm" data-act="draft" data-idx="${pk.idx}" data-name="${esc(d.name)}">DRAFT</button></td>
          </tr>`;
        }).join("")}</tbody>
      </table>
      <button class="ghost small" data-act="pass-pick" data-idx="${pk.idx}">Pass on pick #${slot}</button>
    </div>`);
}

function renderTrade(el) {
  const s = A.state, p = A.pack, y = s.year;
  const offers = (p.offers ?? []).filter(o => E.offerAvailable(s, o));
  const targets = (p.tradeBlock ?? []).filter(t => E.targetAvailable(s, t));
  scrHTML(el, `
    ${offers.length ? `<div class="card"><h3>Incoming Calls</h3>
      ${offers.map(o => `
        <div class="offer">
          <div class="offer-head"><b>${o.team}</b> · ${esc(o.label)}</div>
          <div class="offer-body">
            <span class="give">OUT: ${o.give.map(esc).join(", ")}</span>
            <span class="get">IN: ${[...(o.get.players ?? []).map(x => x.name), ...(o.get.picks ?? []).map(pk => `${pk.year} 1st (#${pk.slot})`)].map(esc).join(", ")}</span>
          </div>
          <div class="offer-foot">${oddsGainChip(c => E.acceptOffer(c, A.pack, o))}
          <button class="mini primary arm" data-act="offer" data-id="${o.id}">ACCEPT · 1 MOVE</button></div>
        </div>`).join("")}</div>` : ""}
    <div class="card"><h3>Trade Block</h3>
      ${targets.length ? targets.map(t => `
        <div class="target ${A.trade === t.name ? "open" : ""}">
          <button class="target-row" data-act="sel-target" data-name="${esc(t.name)}">
            <span class="pos">${t.pos}</span>${ava(t.name)}<b>${esc(t.name)}</b><span class="muted">${t.team} · age ${E.ageOf({ age: t.age, year0: t.from ?? p.startYear }, y)}</span>
            ${ovrChip(E.ovrAt(t, y))}<span class="muted">${fmtM(t.sal)}</span><span class="ask">ASK ${t.cost}</span>
          </button>
          ${A.trade === t.name ? renderPackageBuilder(t) : ""}
        </div>`).join("") : "<p class='muted'>Nobody interesting is available this summer.</p>"}
      <p class="muted small">ASK is their price in value points — perception, not hindsight. Build a package they can't refuse.</p>
    </div>`);
}

function renderPackageBuilder(t) {
  const s = A.state, p = A.pack, y = s.year;
  A.pkg = A.pkg ?? { players: [], picks: [] };
  const ev = E.evalTrade(s, p, t, A.pkg);
  const pct = Math.min(100, Math.round(ev.value / ev.cost * 100));
  return `
    <div class="builder">
      <div class="builder-note">${esc(t.note ?? "")}</div>
      <button class="mini scout autopkg" data-act="pkg-auto" data-name="${esc(t.name)}">✦ AUTO-BUILD PACKAGE</button>
      <div class="builder-cols">
        <div><label>YOUR PLAYERS</label>
          ${s.roster.map(pl => `
            <button class="asset ${A.pkg.players.includes(pl.name) ? "sel" : ""}" data-act="pkg-player" data-name="${esc(pl.name)}">
              <span class="p-name">${ava(pl.name, "sm")}${esc(pl.name)}</span> <span>${E.ovrAt(pl, y)} OVR · ${fmtM(pl.sal)} · ${E.playerValue(pl, y)} val</span>
            </button>`).join("")}
        </div>
        <div><label>YOUR PICKS</label>
          ${s.picks.map((pk, i) => `
            <button class="asset ${A.pkg.picks.includes(i) ? "sel" : ""}" data-act="pkg-pick" data-idx="${i}">
              ${pk.year} 1st ${pk.slot === "OWN" ? "(own)" : `#${pk.slot} ${pk.via}`} <span>${E.pickValue(s, pk, y)} val</span>
            </button>`).join("") || "<p class='muted small'>None.</p>"}
        </div>
      </div>
      <div class="meter"><div class="meter-fill ${ev.value >= ev.cost ? "good" : ""}" style="width:${pct}%"></div><span>${ev.value} / ${ev.cost}</span></div>
      <div class="builder-foot">
        ${!ev.salaryOk ? "<span class='bad'>✗ salaries don't match</span>" : "<span class='ok'>✓ salaries work</span>"}
        ${!ev.rosterOk ? "<span class='bad'>✗ roster full</span>" : ""}
        ${ev.ok ? oddsGainChip(c => E.executeTrade(c, A.pack, t, A.pkg)) : ""}
        ${!ev.ok && ev.salaryOk && ev.value >= ev.cost * 0.8 ? `<span class="nudge">“Close. Sweeten it a little.” — ${t.team} GM</span>` : ""}
        <button class="mini primary arm" data-act="do-trade" data-name="${esc(t.name)}" ${ev.ok ? "" : "disabled"}>PROPOSE · 1 MOVE</button>
      </div>
    </div>`;
}

function renderFA(el) {
  const s = A.state, p = A.pack, y = s.year;
  const fas = (p.freeAgents[y] ?? []).filter(f => !s.signedFAs.includes(`${y}:${f.name}`) && !s.roster.some(r => r.name === f.name));
  const att = E.attract(s, y);
  scrHTML(el, `
    <div class="card">
      <h3>Free Agency — Summer ${y}</h3>
      <p class="muted small">Your pitch: <b>${att} ATTRACT</b> (last season's wins + best player − 55). Stars sign only if your situation clears their PULL. Cap room: <b>${fmtM(E.capSpace(s, p, y))}</b>.</p>
      ${fas.map(f => {
        const st = E.faStatus(s, p, f);
        return `
        <div class="fa-row">
          <span class="pos">${f.pos}</span>
          ${ava(f.name, "lg")}
          <div class="fa-name"><b>${esc(f.name)}</b><span class="muted small">age ${E.ageOf({ age: f.age, year0: y }, y)} · ${esc(f.note ?? "")}</span></div>
          ${ovrChip(E.ovrAt(f, y))}
          <span class="fa-ask">${fmtM(f.ask)}/yr</span>
          <span class="fa-pull ${st.wants ? "ok" : "bad"}">PULL ${f.pull}</span>
          ${st.ok ? oddsGainChip(c => E.signFA(c, A.pack, f)) : ""}
          <button class="mini primary arm" data-act="sign" data-name="${esc(f.name)}" ${st.ok ? "" : "disabled"}>${st.ok ? "SIGN · 1 MOVE" : !st.wants ? (f.pull - st.att <= 8 ? `SO CLOSE — NEED +${f.pull - st.att}` : "NOT INTERESTED") : !st.affords ? "NO CAP ROOM" : "ROSTER FULL"}</button>
        </div>`;
      }).join("") || "<p class='muted'>The market is bare.</p>"}
    </div>`);
}

// ----- season -----
function renderSeason(scr) {
  const s = A.state, p = A.pack;
  const season = s.seasons[s.seasons.length - 1];
  const y = s.year;
  const g = (p.gauntlet[y + 1] ?? []).slice().sort((a, b) => b.ovr - a.ovr);
  const made = season.wins >= 42;
  const odds = Math.round(E.titleOdds(s, p) * 100);
  scr.innerHTML = `
    <div class="season">
      <div class="score-flash">
        <div class="sf-label">${yearLabel(y)} FINAL RECORD</div>
        <div class="sf-record"><span id="winnum">0</span><span>–</span><span id="lossnum">0</span></div>
        <div class="sf-sub">TEAM RATING ${season.rating.toFixed(1)} · ${made ? `PLAYOFFS CLINCHED · TITLE ODDS ${odds}%` : "MISSED THE PLAYOFFS"}</div>
      </div>
      <div class="card"><h3>The Gauntlet — ${y + 1} Title Race</h3>
        <table class="tbl standings"><thead><tr><th></th><th></th><th>TEAM</th><th>RECORD</th><th>PWR</th></tr></thead><tbody>
          ${[...g.map(t => ({ team: t.team, conf: t.conf, ovr: t.ovr, wins: E.projWins(t.ovr), you: false })),
             { team: `${p.team.id} — YOU`, conf: p.team.conf, ovr: Math.round(E.teamRating(s, y, { playoff: true })), wins: season.wins, you: true }]
            .sort((a, b) => b.wins - a.wins)
            .map((t, i) => `<tr class="${t.you ? "you" : ""}"><td class="pos">${i + 1}</td><td class="pos">${t.conf}</td><td><b>${esc(t.team)}</b></td><td class="mono-cell">${t.wins}–${82 - t.wins}</td><td>${ovrChip(t.ovr)}</td></tr>`).join("")}
        </tbody></table>
      </div>
      <button class="primary big" data-act="${made ? "to-playoffs" : "skip-playoffs"}">${made ? "ENTER THE PLAYOFFS ▶" : seasonIndex() >= 4 ? "FACE THE MUSIC" : "TO NEXT OFFSEASON ▶"}</button>
    </div>`;
  countUp($("#winnum"), season.wins, 850);
  countUp($("#lossnum"), 82 - season.wins, 850);
}
function countUp(el, target, ms) {
  if (!el) return;
  const t0 = performance.now();
  const tick = now => {
    const k = Math.min(1, (now - t0) / ms);
    el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

// ----- playoffs -----
function renderPlayoffs(scr) {
  const s = A.state;
  A._poAt = Date.now();
  scr.innerHTML = `
    <div class="playoffs">
      <h2 class="po-head">${s.year + 1} NBA PLAYOFFS</h2>
      <div class="po-list">
        ${s.series.map((se, i) => {
          const state = se.won === true ? "won" : se.won === false ? "lost" : i === s.seriesIdx ? "live" : "future";
          const wl = se.games ? `${se.games.filter(g => g === "W").length}–${se.games.filter(g => g === "L").length}` : "";
          const fresh = A._revealSeries === i;
          const dots = se.games ? `<span class="gdots">${se.games.map((g, gi) =>
            `<i class="gdot ${g === "W" ? "w" : "l"}${fresh ? " pop" : ""}" ${fresh ? `style="animation-delay:${gi * 0.42}s"` : ""}></i>`).join("")}</span>` : "";
          return `
          <div class="po-series ${state}">
            <div class="po-round">${se.round}</div>
            <div class="po-opp">vs <b>${se.team === "—" ? "Field" : se.team}</b> ${ovrChip(se.ovr)}</div>
            <div class="po-odds">${Math.round(se.p * 100)}% win</div>
            <div class="po-result">${se.won != null
              ? `${dots}<span class="po-verdict${fresh ? " late" : ""}" ${fresh ? `style="animation-delay:${se.games.length * 0.42 + 0.15}s"` : ""}>${se.won ? `WON ${wl}` : `LOST ${wl}`}</span>`
              : i === s.seriesIdx ? `<button class="primary" data-act="play-series">PLAY SERIES ▶</button>` : "—"}</div>
          </div>`;
        }).join("")}
      </div>
      <p class="muted small center">Best of seven, game by game — dice seeded by today's date, same for every GM. Build a better team, load the dice.</p>
    </div>`;
}

// ----- end -----
const GRADE_QUIPS = { "A+": "Highway robbery.", "A": "Fleeced them.", "B": "Sharp work.", "C": "Fair deal.", "D": "They thank you.", "F": "Hang up next time." };
function letterFor(r, bands) { // bands: [[min, letter], ...] descending
  for (const [min, g] of bands) if (r >= min) return g;
  return "F";
}
function gradeMove(m) {
  const x = m.meta;
  if (!x) return null;
  if (x.kind === "trade") {
    const r = Math.max(0, x.peak - 68) ** 2 / Math.max(50, x.cost);
    return letterFor(r, [[3, "A+"], [1.8, "A"], [1.1, "B"], [0.72, "C"], [0.45, "D"]]);
  }
  if (x.kind === "offer") {
    const r = x.gotValue / Math.max(40, x.gaveValue);
    return letterFor(r, [[2.2, "A+"], [1.5, "A"], [1.0, "B"], [0.7, "C"], [0.45, "D"]]);
  }
  if (x.kind === "sign") {
    const r = ((x.peak - 70) * (x.cap ?? 60)) / Math.max(1, x.ask * 100);
    return letterFor(r, [[1.6, "A+"], [1.05, "A"], [0.7, "B"], [0.48, "C"], [0.32, "D"]]);
  }
  return null;
}
function gradeDraft(d) {
  const expected = Math.max(62, 84 - 0.55 * d.slot);
  return letterFor(d.peak - expected, [[12, "A+"], [8, "A"], [4, "B"], [0, "C"], [-5, "D"]]);
}
function gradeChip(g) { return g ? `<span class="grade g-${g.replace("+", "p").toLowerCase()}">${g}</span>` : ""; }
function reportCardHTML(s) {
  const rows = s.moves.map(m => ({ m, g: gradeMove(m) })).filter(x => x.g);
  const drafts = (s.draftLog ?? []);
  if (!rows.length && !drafts.length) return "";
  return `<div class="card"><h3>Front Office Report Card</h3>
    ${rows.map(({ m, g }) => `<div class="rc-row"><span class="log-year">${m.year}</span><span class="rc-desc">${esc(m.desc)}</span>${gradeChip(g)}<span class="rc-quip">${GRADE_QUIPS[g]}</span></div>`).join("")}
    ${drafts.map(d => { const g = gradeDraft(d); return `<div class="rc-row"><span class="log-year">${d.year}</span><span class="rc-desc">Drafted ${esc(d.name)} at #${d.slot}${d.realPick > d.slot + 4 ? ` <i class="steal">went #${d.realPick} in real life</i>` : ""}</span>${gradeChip(g)}<span class="rc-quip">${g === "A+" || g === "A" ? "Scouting immortality." : GRADE_QUIPS[g]}</span></div>`; }).join("")}
  </div>`;
}
function countdownHTML() {
  return `<div class="card countdown-card"><h3>Next Rebuild</h3><div class="countdown" id="countdown">—</div><p class="muted small">A new franchise, a new mess, tomorrow.</p></div>`;
}
function startCountdown() {
  clearInterval(A._cd);
  const el = $("#countdown");
  if (!el) return;
  const tick = () => {
    const now = new Date();
    const mid = new Date(now); mid.setHours(24, 0, 0, 0);
    const ms = mid - now;
    const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, sec = Math.floor(ms / 1000) % 60;
    el.textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };
  tick();
  A._cd = setInterval(tick, 1000);
}
function confetti() {
  if (A._confettiFor === store.key(A.pack, A.state.practice)) return;
  A._confettiFor = store.key(A.pack, A.state.practice);
  SFX.play("champ");
  const colors = [A.pack.team.colors[0], A.pack.team.colors[1], "#ffb000", "#ffffff"];
  for (let i = 0; i < 90; i++) {
    const el = document.createElement("i");
    el.className = "cf";
    el.style.cssText = `left:${Math.random() * 100}vw;background:${colors[i % 4]};animation-delay:${Math.random() * 1.2}s;animation-duration:${2.4 + Math.random() * 2}s;transform:rotate(${Math.random() * 360}deg);width:${6 + Math.random() * 7}px;height:${9 + Math.random() * 8}px;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 5200);
  }
}
function recordBest() {
  if (A.state.bestRecorded || !A.state.won) { A.state.bestRecorded = true; return; }
  A.state.bestRecorded = true;
  const key = `rebuild:best:${A.pack.id}`;
  let b = null; try { b = JSON.parse(localStorage.getItem(key)); } catch { /* corrupt */ }
  const moves = E.moveCount(A.state);
  if (!b || moves < b.moves) localStorage.setItem(key, JSON.stringify({ moves }));
}
function bestFor(packId) {
  try { return JSON.parse(localStorage.getItem(`rebuild:best:${packId}`)); } catch { return null; }
}
function renderEnd(scr) {
  const s = A.state, p = A.pack;
  recordStats();
  recordBest();
  store.save();
  const n = E.moveCount(s);
  const grid = s.seasons.map(x => E.RESULT_EMOJI[x.playoffResult] ?? "⬛").join("");
  const st = store.stats();
  scr.innerHTML = `
    <div class="end ${s.won ? "won" : "lost"}">
      <div class="end-banner" style="--c1:${p.team.colors[0]};--c2:${p.team.colors[1]}">
        ${s.won
          ? `<div class="end-troph">🏆</div><h1>BANNER ${s.titleYear + 1}</h1>
             <p>${esc(p.team.city)} — NBA Champions in Year ${s.titleYear - p.startYear + 1}.<br><b>${n} move${n === 1 ? "" : "s"}</b> · <b class="golf">${E.golfLabel(n, p.par)}</b> (par ${p.par}).</p>`
          : `<h1>NO BANNER</h1><p>Four seasons, ${n} move${n === 1 ? "" : "s"}, no parade. ${esc(p.team.city)} deserved better.</p>`}
      </div>
      <div class="card share-card">
        <div class="share-grid">${grid}</div>
        <pre class="share-pre">${esc(E.shareText(s, p, gameNumber()))}</pre>
        <button class="primary" data-act="share">COPY RESULT</button>
        <span class="copied" id="copied">Copied ✓</span>
      </div>
      ${reportCardHTML(s)}
      ${p.realOutcome ? `<div class="card real-card"><h3>What Really Happened</h3><p class="real-text">${esc(p.realOutcome)}</p></div>` : ""}
      <div class="card"><h3>Your Moves</h3>
        <ul class="movelog">${s.moves.map(m => `<li><span class="log-year">${m.year}</span>${esc(m.desc)}</li>`).join("") || "<li class='muted'>A zero-move run. Ice cold.</li>"}</ul>
      </div>
      ${s.practice ? "" : `<div class="card"><h3>Stats</h3>
        <div class="stat-row">
          <div><b>${st.played ?? 0}</b><label>played</label></div>
          <div><b>${st.played ? Math.round((st.wins ?? 0) / st.played * 100) : 0}%</b><label>banners</label></div>
          <div><b>${st.streak ?? 0}</b><label>streak</label></div>
          <div><b>${st.maxStreak ?? 0}</b><label>best streak</label></div>
        </div></div>`}
      ${s.practice ? "" : countdownHTML()}
      <div class="land-links">
        <button class="ghost" data-act="archive">Practice another era</button>
        ${s.practice ? `<button class="ghost" data-act="retry-practice">Retry this scenario</button>` : ""}
        <button class="ghost" data-act="home">Home</button>
      </div>
    </div>`;
  startCountdown();
  if (s.won) confetti();
}

function scrHTML(el, html) { el.innerHTML = html; }

// ---------- modals ----------
function showModal(html) {
  $("#modal").innerHTML = `<div class="modal-back" data-act="close-modal"><div class="modal-box" onclick="event.stopPropagation()">${html}<button class="ghost close" data-act="close-modal">Close</button></div></div>`;
}
function helpHTML() {
  return `<h2>How to Rebuild</h2>
  <ol class="help">
    <li>You're the GM at a real NBA crossroads. <b>Win a title within 4 seasons.</b></li>
    <li>Your score is <b>moves used</b> — trades and signings cost 1, drafting and waiving are free. Beat the par.</li>
    <li>You know the future. The game doesn't say it out loud. <i>Draft accordingly.</i></li>
    <li>Stars only sign if your situation clears their <b>PULL</b>. Trades need value AND matching salaries.</li>
    <li>Each draft you get <b>2 scouting trips</b> — burn one to learn a prospect's true ceiling before you pick.</li>
    <li>Seasons simulate from your roster. Playoff series run game by game, best of seven — dice seeded by the date, same for everyone. Skill loads the dice.</li>
  </ol>
  <p class="legend">🟥 missed playoffs&ensp;🟨 early exit&ensp;🟧 conf finals&ensp;🥈 lost the Finals&ensp;🏆 banner</p>`;
}
function statsHTML() {
  const st = store.stats();
  const hist = st.hist ?? {};
  const keys = Object.keys(hist).map(Number).sort((a, b) => a - b);
  return `<h2>Stats</h2>
  <div class="stat-row">
    <div><b>${st.played ?? 0}</b><label>played</label></div>
    <div><b>${st.played ? Math.round((st.wins ?? 0) / st.played * 100) : 0}%</b><label>banners</label></div>
    <div><b>${st.streak ?? 0}</b><label>streak</label></div>
    <div><b>${st.maxStreak ?? 0}</b><label>best</label></div>
  </div>
  ${keys.length ? `<h3>vs Par</h3>${keys.map(k => `<div class="hist-row"><label>${k > 0 ? "+" + k : k}</label><div class="hist-bar" style="width:${Math.min(100, hist[k] * 25)}%">${hist[k]}</div></div>`).join("")}` : "<p class='muted'>Win a daily to start your record.</p>"}`;
}

// ---------- actions ----------
function toast(msg, bad = false) {
  const t = $("#toast");
  t.textContent = msg; t.className = `show ${bad ? "bad" : ""}`;
  clearTimeout(toast._t); toast._t = setTimeout(() => t.className = "", 2200);
}

document.addEventListener("click", e => {
  const btn = e.target.closest("[data-act], [data-tab]");
  if (!btn) return;
  const act = btn.dataset.act;

  if (act !== "close-modal" && act !== "mute") SFX.play("tick");
  if (btn.dataset.tab) { A.tab = btn.dataset.tab; A.trade = null; A.pkg = null; return render(); }

  // two-step confirmation for destructive/irreversible buttons
  if (btn.classList.contains("arm") && !btn.disabled) {
    if (!btn.classList.contains("armed")) {
      document.querySelectorAll(".armed").forEach(b => { b.classList.remove("armed"); b.textContent = b.dataset.orig ?? b.textContent; });
      btn.dataset.orig = btn.textContent;
      btn.classList.add("armed"); btn.textContent = "SURE?";
      return;
    }
    btn.classList.remove("armed");
  }

  const s = A.state, p = A.pack;
  switch (act) {
    case "help": return showModal(helpHTML());
    case "stats": return showModal(statsHTML());
    case "close-modal": $("#modal").innerHTML = ""; return;
    case "mute": SFX.toggle(); return render();
    case "home": A.screen = "landing"; return render();
    case "archive": A.screen = "archive"; return render();
    case "play-daily": return startGame(dailyPack(), false);
    case "play-practice": return startGame(PACKS.find(x => x.id === btn.dataset.id), true);
    case "retry-practice": {
      localStorage.removeItem(store.key(p, true));
      return startGame(p, true);
    }
    case "sel-pick": A.draftPick = Number(btn.dataset.idx); return render();
    case "sel-target": A.trade = A.trade === btn.dataset.name ? null : btn.dataset.name; A.pkg = { players: [], picks: [] }; return render();
    case "pkg-player": {
      const n = btn.dataset.name;
      A.pkg.players = A.pkg.players.includes(n) ? A.pkg.players.filter(x => x !== n) : [...A.pkg.players, n];
      return render();
    }
    case "pkg-auto": {
      const t = p.tradeBlock.find(x => x.name === btn.dataset.name);
      const y = s.year;
      // protect the two best players; try fewest pieces first, then trim, then fix salary
      const protectNames = [...s.roster].sort((a, b) => E.ovrAt(b, y) - E.ovrAt(a, y)).slice(0, 2).map(x => x.name);
      const pool = [
        ...s.roster.filter(pl => !protectNames.includes(pl.name)).map(pl => ({ type: "p", key: pl.name, val: E.playerValue(pl, y) })),
        ...s.picks.map((pk, i) => ({ type: "k", key: i, val: E.pickValue(s, pk, y) }))
      ].sort((a, b) => b.val - a.val);
      const pkg = { players: [], picks: [] };
      let val = 0;
      for (const a of pool) {
        if (val >= t.cost) break;
        (a.type === "p" ? pkg.players : pkg.picks).push(a.key);
        val += a.val;
      }
      // trim any piece that isn't needed
      for (const a of [...pool].reverse()) {
        const inPkg = a.type === "p" ? pkg.players.includes(a.key) : pkg.picks.includes(a.key);
        if (inPkg && val - a.val >= t.cost) {
          if (a.type === "p") pkg.players = pkg.players.filter(k => k !== a.key);
          else pkg.picks = pkg.picks.filter(k => k !== a.key);
          val -= a.val;
        }
      }
      let ev = E.evalTrade(s, p, t, pkg);
      if (ev.value >= t.cost && !ev.salaryOk) {
        // add remaining players by salary until the money works
        const rest = s.roster.filter(pl => !protectNames.includes(pl.name) && !pkg.players.includes(pl.name))
          .sort((a, b) => b.sal - a.sal);
        for (const pl of rest) {
          pkg.players.push(pl.name);
          ev = E.evalTrade(s, p, t, pkg);
          if (ev.salaryOk) break;
        }
      }
      ev = E.evalTrade(s, p, t, pkg);
      if (!ev.ok) return toast(`No package works without touching ${protectNames.join(" or ")}.`, true);
      A.pkg = pkg;
      toast("Package assembled. Review it, then propose.");
      return render();
    }
    case "pkg-pick": {
      const i = Number(btn.dataset.idx);
      A.pkg.picks = A.pkg.picks.includes(i) ? A.pkg.picks.filter(x => x !== i) : [...A.pkg.picks, i];
      return render();
    }
    case "do-trade": {
      const t = p.tradeBlock.find(x => x.name === btn.dataset.name);
      const r = E.executeTrade(s, p, t, A.pkg);
      if (!r.ok) return toast(r.error, true);
      A.trade = null; A.pkg = null; store.save(); SFX.play("swish"); toast(`${t.name} arrives in ${p.team.city}.`);
      return render();
    }
    case "offer": {
      const o = p.offers.find(x => x.id === btn.dataset.id);
      const r = E.acceptOffer(s, p, o);
      if (!r.ok) return toast(r.error, true);
      store.save(); SFX.play("swish"); toast("Trade completed."); return render();
    }
    case "sign": {
      const fa = (p.freeAgents[s.year] ?? []).find(x => x.name === btn.dataset.name);
      const r = E.signFA(s, p, fa);
      if (!r.ok) return toast(r.error, true);
      store.save(); SFX.play("swish"); toast(`${fa.name} signs with ${p.team.city}.`); return render();
    }
    case "waive": {
      const r = E.waive(s, btn.dataset.name);
      if (r.ok) { store.save(); toast(`Waived. ${fmtM(r.dead)} dead money.`); }
      return render();
    }
    case "draft": {
      const r = E.draftPlayer(s, p, Number(btn.dataset.idx), btn.dataset.name);
      if (!r.ok) return toast(r.error, true);
      A.draftPick = null; store.save(); SFX.play("swish"); toast(`With pick #${r.slot}, you select ${btn.dataset.name}.`);
      return render();
    }
    case "scout": {
      const r = E.scoutProspect(s, p, s.year, btn.dataset.name);
      if (!r.ok) return toast(r.error, true);
      store.save();
      toast(`Scouts on ${btn.dataset.name}: ${r.tier}.`);
      return render();
    }
    case "pass-pick": {
      E.passPick(s, Number(btn.dataset.idx));
      A.draftPick = null; store.save(); return render();
    }
    case "start-season": {
      const r = E.startSeason(s);
      if (r.ok) store.save();
      return render();
    }
    case "to-playoffs": { E.enterPlayoffs(s, p); store.save(); return render(); }
    case "skip-playoffs": { E.enterPlayoffs(s, p); store.save(); return render(); } // handles missed internally
    case "play-series": {
      if (Date.now() - (A._poAt ?? 0) < 350) return; // guard against click-through from the previous screen
      if (A._revealTimer) return;                    // let the current reveal finish
      const r = E.playNextSeries(s, p);
      store.save();
      A._revealSeries = s.series.findIndex(x => x === r.series);
      const wait = (r.series?.games?.length ?? 0) * 420 + 550;
      render(); // stay on the bracket: game dots pop one by one
      A._revealTimer = setTimeout(() => {
        A._revealTimer = null; A._revealSeries = null;
        flashSeries(r.series.won);
        if (s.pendingEnd) { E.continueAfterSeries(s, p); store.save(); setTimeout(render, 950); }
        else render();
      }, wait);
      return;
    }
    case "share": {
      const txt = E.shareText(s, p, gameNumber());
      navigator.clipboard?.writeText(txt).then(() => $("#copied")?.classList.add("show"))
        .catch(() => toast("Copy failed — select the text manually", true));
      return;
    }
  }
});

function flashSeries(won) {
  SFX.play(won ? "win" : "loss");
  const el = document.createElement("div");
  el.className = `series-flash ${won ? "w" : "l"}`;
  el.textContent = won ? "SERIES WON" : "ELIMINATED";
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

window.PACKS = PACKS; // debug/console handle

// ---------- boot ----------
render();
if (!localStorage.getItem("rebuild:seenHelp")) {
  localStorage.setItem("rebuild:seenHelp", "1");
  showModal(helpHTML());
}

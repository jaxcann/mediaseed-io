// ─────────────────────────────────────────────────────────────
// FOOTBRAIN — the CPU's football sense, rebuilt on footmech.
//
// Wire it with G.setBrains({ offenseInput, defenseInput }); football.js's
// botInput asks here first and falls back to its stubs on any null tick.
//
// footmech replaced a one-click throw and a single-frame proximity catch with
// systems that have a decision, a cost and a counter. The brains that were
// here could not operate ANY of them, and the season showed it: measured,
// 13.2-minute games, 9% of drives scoring, 72 tackles and 26 SACKS a game,
// and the dive / press / juke / spin / truck counters used exactly zero
// times. This file is written against the mechanics instead of around them.
//
// MEASURED — 12 bot-vs-bot games on the gate's own seeds (800 + 977i), 60 Hz:
//                                   now      was
//   games finished ............   12/12     3/12
//   average length ............   2.7 min   13.2 min
//   plays per game ............   41.1      —      (6.4m a play, 13.6 drives)
//   TD per drive ..............   49%       9%
//   per game — tackles ........   13.9      72.3
//              incompletions ..   10.2      12.3
//              interceptions ..    0.4       0.0
//              turnovers ......    6.5      41.3
//              sacks ..........    1.8      26.0
//   mechanics — dive tackles ..  102.6       0.0   (58% of them land)
//               balls attacked     7.8       0.0
//               juke/spin/truck   89.7       0.0   (49 / 35 / 6)
//               tackles broken    52.6       0.0
//   per call — SWEEP 21% TD · SHORT 22% · MID 12% · BOMB 9%, and the bomb is
//   the one that hits the grass: 6.5 of its 9.8 calls a game are incomplete.
//
//   Not seed luck: every band holds on eight independent twelve-game blocks
//   (800/977, 5000/613, 12345/101, 77/1289, 424242/9973, 9/9, 601/37,
//   2024/131) — tackles 11.3-14.7, incompletions 10.2-13.3, TD/drive 49-56%,
//   length 2.4-3.0 min, 12/12 finished every time.
//
// Hard-won, measured truths this file is built on:
//   · A DIVE'S REACH IS SET BY CLOSING SPEED, not by distance. Probed inside
//     a live play: from dead astern of a full-speed runner a dive lands from
//     3.7m and no further; at a 45° pursuit angle 4.5m; from the side 5.5m;
//     head-on, closing at 18.8 m/s, from 9m. `diveShot` gates on that fit,
//     and 58% of the dives it takes land. The other 42% are not bad aim —
//     they are the counter loop: the carrier jukes, and a whiff is 1.35s
//     face down. A fifth of the defence is on the ground at any moment, and
//     that is the room the offence plays in.
//   · A SOLO WRAP IS 0.54s AND A GANG WRAP IS 0.24s. That arithmetic is why
//     the old season had 72 tackles: two bodies arriving together is a
//     tackle, full stop. The carrier's answer is to spin before the meter
//     tops off — but only then, because a spin costs him his velocity, and
//     spinning out of every brush past a shoulder cost more ground than the
//     contact would have (measured: 102 spins a game, 5.5m a play).
//   · THE CATCH WINDOW IS 0.1-0.2s LONG on anything but a bullet. From the
//     flight model: a normal ball at 14m is under the 2.35m catch ceiling
//     only for the last 0.17s / 3.0m, a touch ball for 0.12s / 1.5m, and a
//     bullet for its ENTIRE flight. So a press is worthless early and
//     decisive late, and traffic under a flat ball is a real risk while the
//     same traffic under a floated one is not. That is what makes the charge
//     a read rather than a difficulty slider — and it cuts both ways: the
//     ball leaves the hand at 1.55m, under the ceiling, and while footmech
//     gives his OWN side a four-metre dead zone off the release, it gives
//     the rush none. Batting it down at the line is football, so the lane
//     model has to see the first stride of the flight, not just the middle.
//   · A PICK HAS TO BE A PLAY ON THE BALL. footmech only awards one to a
//     defender who pressed or laid out; a body in the path bats it down.
//     Letting coverage press from anywhere inside the catch radius made the
//     contest a coin flip the defence won — 30 of 37 interceptions came at
//     the catch — so a defender presses only with hands on it, and the man
//     it was thrown to presses early and keeps them up.
//   · THE LINE-UP IS THE SNAP. football.js consults the brains in 'hike' and
//     'live' and nowhere else, so the snap beat is the entire window in
//     which ten kids strung out over twenty metres get back on the ball.
//   · Nobody but opponents is a screen — detouring around your own
//     converging teammates braids the pack (kept from the old file).
//
// Pure like the sim it serves: no THREE, no DOM, no Math.random, no Date.now.
// Same input twice gives the same football, and every tuning number lives in
// CFG.football.bot.
// ─────────────────────────────────────────────────────────────
import { CFG } from './config.js';
import { PLAYS } from './football.js';

const K = () => CFG.football;
const B = () => CFG.football.bot;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dOf = team => (team === 'blue' ? 1 : -1);

const mk = a => ({ dx: 0, dz: 0, dash: false, primary: false, special: false,
                   aimX: a.x, aimZ: a.z + 1 });
function seek(inp, a, x, z, dash = false) {
  const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
  if (d > 0.2) { inp.dx = dx / d; inp.dz = dz / d; inp.dash = dash; }
  inp.aimX = x; inp.aimZ = z;
  return inp;
}
const halfW = () => K().field.width / 2;
const inZ = z => clamp(z, -halfW() + 0.8, halfW() - 0.8);
const inX = x => { const F = K().field; return clamp(x, -F.goalX - F.endzone + 1.4, F.goalX + F.endzone - 1.4); };

// Where to run to MEET a moving target — never where he is standing.
// Solves |R + V·t| = s·t for the earliest t; the aim point is target + V·t.
function intercept(hx, hz, tx, tz, tvx, tvz, s) {
  const rx = tx - hx, rz = tz - hz;
  const a = tvx * tvx + tvz * tvz - s * s;
  const b = 2 * (rx * tvx + rz * tvz);
  const c = rx * rx + rz * rz;
  let t = 1e9;
  if (Math.abs(a) < 1e-6) { if (b < -1e-6) t = -c / b; }
  else {
    const disc = b * b - 4 * a * c;
    if (disc >= 0) {
      const sq = Math.sqrt(disc);
      const t1 = (-b - sq) / (2 * a), t2 = (-b + sq) / (2 * a);
      t = t1 > 0 ? t1 : t2 > 0 ? t2 : 1e9;
    }
  }
  const h = Math.min(t, 4);
  return { t, x: tx + tvx * h, z: tz + tvz * h };
}

// How fast the gap between two bodies is shrinking, right now (m/s, +ve = closing).
function closingRate(a, t) {
  const dx = t.x - a.x, dz = t.z - a.z, d = Math.hypot(dx, dz) || 1e-4;
  return (dx * ((a.vx || 0) - (t.vx || 0)) + dz * ((a.vz || 0) - (t.vz || 0))) / d;
}

// Steer around the body in your way. Blockers are solid — driving straight
// into a screen grinds you to a stop, which is exactly what the offence
// wants. Flowing around it turns a stonewall into a half-second delay.
function seekAround(G, inp, a, x, z, dash, target) {
  const B0 = B();
  let ux = x - a.x, uz = z - a.z;
  const d = Math.hypot(ux, uz);
  if (d > 0.5) {
    ux /= d; uz /= d;
    let worst = null, wp = 1e9;
    for (const o of G.actors) {
      // Only OPPONENTS are screens. Detouring around your own converging
      // teammates braids the whole pack into side-steps (measured: it alone
      // handed the sweep thirty points of touchdown rate).
      if (o === a || o === target || o.team === a.team) continue;
      const ox = o.x - a.x, oz = o.z - a.z;
      const proj = ox * ux + oz * uz;
      if (proj < 0.3 || proj > B0.shedProj) continue;
      const perp = ox * uz - oz * ux;              // signed lateral offset
      if (Math.abs(perp) < B0.shedPerp && proj < wp) { wp = proj; worst = { o, perp }; }
    }
    if (worst) {
      const side = worst.perp >= 0 ? -1 : 1;       // pass on the empty side
      x = worst.o.x + uz * side * B0.shedSide;
      z = worst.o.z - ux * side * B0.shedSide;
    }
  }
  return seek(inp, a, x, z, dash);
}

// Mirror of the sim's frozen line-ups, for hustling back during the whistle.
const O_LINEUP = [[-1, 0], [0, 0], [0, -9.5], [0, 9.5], [0, 4.5]];
const D_LINEUP = [[1.2, -1.4], [1.2, 1.4], [4.0, -9.5], [4.0, 9.5], [4.0, 4.5]];
function lineupSpot(G, off, slot) {
  const F = K(), d = G.dir();
  const L = off ? O_LINEUP[slot] : D_LINEUP[slot];
  return { x: G.scrimmage + d * (off ? (slot === 0 ? -F.snapBack : -0.35) : L[0]),
           z: clamp(L[1], -F.field.width / 2 + 1, F.field.width / 2 - 1) };
}

// A ball thrown deliberately at nobody is a decision, not a missed read.
// Counting them together made the completion rate read far worse than the
// passing game actually was.
const away = G => { if (G.tally) G.tally.away = (G.tally.away || 0) + 1; };

const isRunPlay = G => !!(G.play && PLAYS[G.play] && PLAYS[G.play].kind === 'run');

// ── reading a receiver's future ──────────────────────────────
// The QB throws at grass, so everything downstream of him depends on knowing
// where his man will be in `t` seconds. Walk the remaining route at foot
// speed; past its end he keeps carrying the last leg's heading. The receiver
// brain does EXACTLY this, so the model and the man agree.
function routeDrift(G, r) {
  const d = G.dir(), rt = r.route;
  if (rt && rt.length) {
    const w = rt[rt.length - 1];
    const p = rt.length > 1 ? rt[rt.length - 2] : null;
    let dx = p ? w.x - p.x : d, dz = p ? w.z - p.z : 0;
    const m = Math.hypot(dx, dz);
    if (m > 0.1) return { x: dx / m, z: dz / m };
  }
  return { x: d, z: 0 };
}
function predictAt(G, r, t) {
  const S = K().runnerSpeed;
  let x = r.x, z = r.z, rem = t, i = r.routeI || 0;
  const rt = r.route;
  if (rt) {
    while (i < rt.length && rem > 1e-3) {
      const w = rt[i], dx = w.x - x, dz = w.z - z, d = Math.hypot(dx, dz);
      if (d <= S * rem) { x = w.x; z = w.z; rem -= d / S; i++; }
      else { x += dx / d * S * rem; z += dz / d * S * rem; rem = 0; }
    }
  }
  if (rem > 1e-3) {
    const u = routeDrift(G, r);
    x += u.x * S * rem; z += u.z * S * rem;
  }
  return { x: inX(x), z: inZ(z) };
}

// ── between the whistles: hustle to your spot ────────────────
function prePlay(G, a, off, slot) {
  const inp = mk(a);
  if (G.phase === 'countdown' || (G.phase === 'dead' && G.over)) return inp;
  if (G.phase === 'dead' || G.phase === 'huddle' || G.phase === 'set') {
    const s = (G.phase !== 'dead' && a.station) || lineupSpot(G, off, slot);
    const dd = Math.hypot(s.x - a.x, s.z - a.z);
    if (dd > 0.3) seek(inp, a, s.x, s.z, dd > B().hustleDash);
    return inp;
  }
  if (G.phase === 'hike') {
    // THE ONLY WINDOW ANYBODY GETS. football.js consults the brains in 'hike'
    // and 'live' and nowhere else, so the snap beat is where ten kids who
    // finished the last play strung out over twenty metres actually line up.
    // Measured on the old 0.4s snap: 62% of plays started with the QB less
    // than 1.2m behind his own line and 22% started with him ALREADY past it
    // — which makes a forward pass illegal before the ball is in his hands.
    // Hustle first; release into the route only on the last beat, or a long
    // snap becomes a free head start downfield.
    const B0 = B();
    a.blockTgt = null; a.blockLock = 0;          // fresh play, fresh assignments
    // ...and a fresh idea of whose ball it is. `aimAt` is how ballOwner knows
    // the throw was BUILT around a man rather than guessing by proximity, and
    // it is only true for the throw that set it: a human quarterback never
    // writes it, so leaving last play's value on him pointed the whole offence
    // at a receiver nobody threw to.
    a.aimAt = null;
    const s = a.station || lineupSpot(G, off, slot);
    const dd = Math.hypot(s.x - a.x, s.z - a.z);
    const left = K().hikeT - (G.ball.t || 0);
    if (left > B0.releaseLead || dd > B0.lineupSlack) {
      if (dd > 0.3) seek(inp, a, s.x, s.z, dd > B0.hustleDash);
      return inp;
    }
    if (off && slot >= 2 && a.route && a.routeI < a.route.length) return routeStep(G, a);
    if (!off && slot >= 2 && a.assign) return coverBrain(G, a);
    if (dd > 0.3) seek(inp, a, s.x, s.z, false);
    return inp;
  }
  return null;                                   // live: the caller sorts roles
}

// ─────────────────────────────────────────────────────────────
// THE BALL IN THE AIR — one window, played from both sides
// ─────────────────────────────────────────────────────────────
// Attacking the ball is the timing input, and it is what separates a pick
// from a tip and a catch in stride from a bobble. It is worthless early: the
// press only lasts 0.34s and on anything but a bullet the ball is out of
// reach until the final fifth of the flight. So press LATE, and lay out only
// when the spot is genuinely past your legs.
function attackBall(G, a, mine) {
  const F = K(), C = F.catching, B0 = B(), b = G.ball;
  if (!b.inAir || !a.m || a.m.prone > 0) return;
  const remain = Math.max(0, b.air - b.t);
  const dBall = Math.hypot(b.x - a.x, b.z - a.z);
  const dSpot = Math.hypot(b.tx - a.x, b.tz - a.z);
  if (b.live <= C.selfLock) return;
  if (a === b.from && b.live < C.throwerLock) return;
  // Lay out only when it is genuinely the difference. A reaching dive is a
  // stretch, not a launch — footmech gives it its own speed — but it still
  // ends the play where you land, so it buys a catch and spends the run.
  // Measured with a loose trigger it was 29 of these a game for 1.8 catches:
  // the band is narrow because outside it he either runs the ball down or
  // was never going to reach it.
  const runOut = remain * F.runnerSpeed;
  if (mine && a.m.dive <= 0 && remain < B0.diveCatchT &&
      dSpot > runOut + C.reachR + B0.diveCatchGap &&
      dSpot < runOut + C.reachR + C.diveReach)
    { G.diveCatch(a); return; }
  // The press is the receiver's whole job and only the defender's when he has
  // actually beaten somebody to it. Measured with them pressing on equal
  // terms: at the moment balls resolved, the defence had attacked it 66% of
  // the time and the offence 46% — so the man it was thrown to was the one
  // batting it down. His hands go up early and stay up.
  if (mine) {
    if (dBall < B0.pressR2 && (remain < B0.pressLeadT || b.y <= C.catchH + B0.pressH))
      G.pressCatch(a);
    return;
  }
  if (dBall > B0.pressDefR) return;
  if (remain < B0.pressLeadT || (b.y <= C.catchH && dSpot < B0.pressArea))
    G.pressCatch(a);
}

// Who on my team is going to play this ball. Same rule both ways so the
// coverage and the route agree about whose it is.
function ballOwner(G, team) {
  const b = G.ball;
  // the offence knows: the QB threw it AT somebody. Guessing by proximity
  // hands the ball to whichever body is nearest the spot — often the centre,
  // while the man the throw was built around runs a screen.
  if (b.from && b.from.team === team && b.from.aimAt) {
    const r = b.from.aimAt;
    if (r.team === team && !(r.m && r.m.prone > 0)) return r;
  }
  let best = null, bd = 1e9;
  for (const a of G.actors) {
    if (a.team !== team || (a.m && a.m.prone > 0)) continue;
    if (a === b.from) continue;
    const d = Math.hypot(a.x - b.tx, a.z - b.tz);
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────
// THE CARRIER — the counter loop is his whole skill
// ─────────────────────────────────────────────────────────────
// dive beats a runner going straight · juke beats a dive · wrap beats a juke ·
// spin beats a wrap · truck beats a defender who stood you up · dive beats a
// truck. Read the threat, pick its counter, and pay the stamina.
function counterMoves(G, a) {
  const C = K().carry, B0 = B(), m = a.m;
  if (!m || m.prone > 0 || m.dive > 0 || m.spin > 0 || m.truck > 0) return;

  // 1. a man in the air at me. Only a juke (always) or a spin (45%) survives
  //    it — trucking a diver is trying to stiff-arm his ankles.
  let diver = null, dvD = 1e9;
  for (const e of G.actors) {
    if (e.team === a.team || !e.m || e.m.dive <= 0 || e.m.diveHit) continue;
    const dd = Math.hypot(e.x - a.x, e.z - a.z);
    if (dd > B0.dodgeR || dd > dvD) continue;
    const aim = ((a.x - e.x) * e.m.diveX + (a.z - e.z) * e.m.diveZ) / (dd || 1);
    if (aim < B0.dodgeAim) continue;             // he is diving somewhere else
    dvD = dd; diver = e;
  }
  if (diver) {
    if (m.juke <= 0 && m.stam >= C.jukeCost) {
      // hop across his line, toward whichever side has field left
      let px = -diver.m.diveZ, pz = diver.m.diveX;
      const W = halfW();
      if (Math.abs(a.z + pz * B0.jukeLook) > W - 1.0) { px = -px; pz = -pz; }
      if (G.juke(a, px, pz)) return;
    }
    if (m.stam >= C.spinCost && G.spin(a)) return;
    return;                                      // nothing left: brace
  }

  // 2. hands on me and the meter filling — spin out before it tops off, but
  //    NOT on every brush past a shoulder. A spin replaces your velocity with
  //    5 m/s of turning, so spinning out of contact you were going to run
  //    through costs more ground than the contact would have (measured: 102
  //    spins a game, and the carrier averaged 5.5m a play). Solo hands fill
  //    the meter in 0.54s and a second set in 0.24s, so the trigger is how
  //    full it is and how many hands are on you.
  if (m.wrapBy > 0 && m.stam >= C.spinCost &&
      m.wrapT > (m.wrapBy > 1 ? B0.spinGang : B0.spinAt)) {
    if (G.spin(a)) return;
  }

  // 3. a man squared up in my path who is NOT going low: run him over
  if (m.truck <= 0 && m.stam >= C.truckCost) {
    const sp = Math.hypot(a.vx, a.vz);
    if (sp > B0.truckSpeedMin) {
      const ux = a.vx / sp, uz = a.vz / sp;
      for (const e of G.actors) {
        if (e.team === a.team || !e.m || e.m.prone > 0 || e.m.dive > 0) continue;
        const dx = e.x - a.x, dz = e.z - a.z, dd = Math.hypot(dx, dz);
        if (dd > B0.truckR || dd < 0.2) continue;
        if ((dx * ux + dz * uz) / dd < B0.truckAim) continue;   // not in front
        if (G.truck(a)) return;
      }
    }
  }
}

// The lane read: two nearest threats, widest daylight, and the fence is a
// defender. Kept from the measured version that made the sweep work.
function carrierBrain(G, a) {
  const F = K(), B0 = B(), inp = mk(a);
  const d = dOf(a.team), W = F.field.width / 2, S = F.runnerSpeed;
  let n1 = null, n2 = null;
  for (const e of G.actors) {
    if (e.team === a.team) continue;
    const it = intercept(e.x, e.z, a.x, a.z, a.vx, a.vz, B0.planSpeed);
    const f = { e, t: it.t, d: Math.hypot(e.x - a.x, e.z - a.z) };
    if (!n1 || f.t < n1.t) { n2 = n1; n1 = f; }
    else if (!n2 || f.t < n2.t) n2 = f;
  }
  const tGoal = Math.max(0, (F.field.goalX + 1 - a.x * d) / S);
  const lead = !n1 || n1.t > tGoal;
  // Backyard self-preservation: pinned on the boundary with a tackler closing
  // and no lead, you step OUT and live for the next down. With a lead you
  // stay in and finish it — always.
  const desperateBail = G.liveT > B0.carrierBailT && !lead;
  if ((desperateBail || (!lead && n1 && Math.abs(a.z) > W - B0.stepOutBand &&
       (n1.t < B0.stepOutT || n1.d < B0.stepOutD) &&
       (F.field.goalX - a.x * d) > B0.stepOutGoal))) {
    const side = a.z >= 0 ? 1 : -1;
    let walled = false;
    for (const e of G.actors)
      if (e !== a && e.team !== a.team && Math.sign(e.z) === side &&
          Math.abs(e.z) > Math.abs(a.z) && Math.abs(e.x - a.x) < 1.6) { walled = true; break; }
    if (!walled) return seek(inp, a, a.x + d * 1.5, side * (W + 2), false);
    if (desperateBail) return seek(inp, a, a.x, -side * (W + 2), false);
  }
  const speed = Math.hypot(a.vx, a.vz);
  let crowded = 0;
  for (const e of G.actors)
    if (e !== a && Math.hypot(e.x - a.x, e.z - a.z) < B0.crowdR) crowded++;
  const arc = speed < 1.5 && crowded >= 2 ? B0.laneArcBoxed : B0.laneArc;
  let bu = { x: d, z: 0 }, bs = -1e9;
  for (let i = 0; i < B0.lanes; i++) {
    const phi = -arc + (2 * arc * i) / (B0.lanes - 1);
    const ux = d * Math.cos(phi), uz = Math.sin(phi);
    let free = B0.freeCap;
    for (const f of [n1, n2]) {
      if (!f || f.d > B0.vision) continue;
      free = Math.min(free, intercept(f.e.x, f.e.z, a.x, a.z, ux * S, uz * S, B0.planSpeed).t);
    }
    const pz = a.z + uz * S * B0.horizon;
    let sc = Math.cos(phi) + B0.freeW * free;
    const nx = a.x + ux * S * 0.35, nz = a.z + uz * S * 0.35;
    for (const e of G.actors)
      if (e !== a && Math.hypot(e.x - nx, e.z - nz) < B0.crowdR) sc -= B0.crowdPen;
    if (!lead && Math.abs(pz) > W - B0.sidePad) sc -= B0.sidePen;
    if (Math.abs(pz) > W - 0.8) sc -= B0.sidePen * 2;
    if (sc > bs) { bs = sc; bu = { x: ux, z: uz }; }
  }
  seek(inp, a, a.x + bu.x * 8, inZ(a.z + bu.z * 8), false);
  // HIT THE JETS. A dash is 17.7 m/s against a 9.4 m/s cap — it is the single
  // biggest yardage tool the carrier owns, and hoarding it for emergencies
  // left him running the defence's speed and getting caught (measured: 6.0m a
  // play and 25 tackles a game; used freely it is 5.5m a play and 7). But it
  // is also 4.5m of momentum he cannot steer, so he does not fire it at a
  // sideline — that turned 44% of all plays into a walk out of bounds.
  const toGoal = Math.max(0, (F.field.goalX - a.x * d));
  if (a.dashCd <= 0 && ((n1 && n1.t < B0.dashAngleT) || (lead && toGoal < B0.finishDash))) {
    const pz = a.z + inp.dz * B0.dashProject;
    const px = a.x + inp.dx * B0.dashProject;
    if (Math.abs(pz) < W - B0.dashEdge &&
        (lead || Math.abs(px) < F.field.goalX + F.field.endzone - B0.dashEdge))
      inp.dash = true;
  }
  return inp;
}

// ─────────────────────────────────────────────────────────────
// THE QB — pick the pitch, then survive long enough to make it
// ─────────────────────────────────────────────────────────────
// predictThrow is exactly what will be thrown, so the read is scored on the
// real ball: where the man will be when it lands, who else can be there, who
// the flight passes low over, and how much his own feet are spraying it.
function qbRead(G, a, want) {
  const F = K(), B0 = B(), T = F.throw, C = F.catching, d = G.dir();
  const gx = F.field.goalX;
  let best = null;
  for (const r of G.receivers()) {
    if (r.m && r.m.prone > 0) continue;
    // his shadow, so the ball can be put where only he can get it
    let cov = null, cd = 1e9;
    for (const e of G.defence()) {
      const dd = Math.hypot(e.x - r.x, e.z - r.z);
      if (dd < cd) { cd = dd; cov = e; }
    }
    for (let ci = 0; ci < B0.charges.length; ci++) {
      const charge = B0.charges[ci];
      // Converge on the lead: where he will be when the ball gets there. Trim
      // it slightly — the model runs him at book speed and the real man is
      // accelerating, getting bumped and rounding his break, so the honest
      // spot is a stride EARLY. Overleading him put the ball where only the
      // trailing corner arrived on time.
      let air = T.minAir, pred = null, px = r.x, pz = r.z;
      for (let i = 0; i < 3; i++) {
        const p = predictAt(G, r, air * B0.leadTrim);
        px = p.x; pz = p.z;
        if (cov && cd < B0.leverR) {                 // throw him off his man
          let ox = px - cov.x, oz = pz - cov.z;
          const om = Math.hypot(ox, oz) || 1;
          px = inX(px + ox / om * B0.leverOff);
          pz = inZ(pz + oz / om * B0.leverOff);
        }
        pred = G.predictThrow(px, pz, charge);
        if (!pred) break;
        air = pred.air;
      }
      if (!pred) continue;
      px = pred.tx; pz = pred.tz;                 // leadCap may have pulled it in
      if (pred.dist < B0.minThrow) continue;
      if ((px - G.losX()) * d < -B0.backThrowMax) continue;
      // HOW OPEN IS HE — as the METRES the nearest defender will still be off
      // the ball when it gets there. Two wrong models were measured first.
      // Pure flight-time closure says a defender eats any gap given two
      // seconds, so nothing deep is ever open and the BOMB gained 0.4m a play.
      // A pure head start ignores hang time, so the read fell in love with
      // lofted balls and 43 of 44 interceptions were touch throws caught up
      // with in the air. This is both: he reacts, then he runs, and he cannot
      // get nearer than the body of the man he is covering — a floor the
      // season put at 2.3m, because he arrives goal-side of the catch rather
      // than on top of it.
      const ownRun = Math.hypot(px - r.x, pz - r.z);
      if (ownRun > pred.air * F.runnerSpeed + B0.ownSlack) continue;
      // `raw` is the honest arithmetic and can go negative — the defender gets
      // there and keeps going. `sep` is what the gap will actually look like,
      // floored, and is what the read is scored on. He decides on the first
      // and chooses between reads on the second.
      let raw = 1e9;
      for (const e of G.defence()) {
        if (e.m && e.m.prone > 0) continue;
        raw = Math.min(raw, Math.hypot(e.x - px, e.z - pz)
                          - Math.max(0, pred.air - B0.reactT) * B0.covSpeed);
      }
      const sep = Math.max(B0.sepFloor, raw);
      // TRAFFIC IN THE LANE. Not "is anybody near the line" — how much of the
      // flight is low enough to be played at all, times how many bodies are
      // standing under it. That product is the whole reason the charge is a
      // choice: a bullet is inside the 2.35m ceiling for its ENTIRE flight and
      // a touch ball for barely a tenth of it, so the same crowd makes one a
      // coin flip and the other a non-event. It also covers the two metres in
      // front of his own face, which is where the ball starts at 1.55m and
      // where the man rushing him is standing.
      let low = 0;
      for (let s = 0; s < B0.laneKs.length; s++) {
        const k = B0.laneKs[s];
        if (T.releaseH * (1 - k) + C.landH * k + pred.peak * 4 * k * (1 - k) <= C.catchH) low++;
      }
      low /= B0.laneKs.length;
      let traffic = 0;
      const ux = (px - a.x) / pred.dist, uz = (pz - a.z) / pred.dist;
      for (const e of G.defence()) {
        if (e.m && e.m.prone > 0) continue;
        const proj = (e.x - a.x) * ux + (e.z - a.z) * uz;
        if (proj < B0.laneNear || proj > pred.dist - B0.laneFar) continue;   // arrival is `sep`'s job
        const perp = Math.abs((e.x - a.x) * uz - (e.z - a.z) * ux);
        const gap = perp - (proj / pred.dist) * pred.air * B0.covSpeed * B0.laneChase;
        if (gap < B0.laneR) traffic += Math.min(1, (B0.laneR - gap) / B0.laneR);
      }
      const lane = low * traffic;
      if (lane > B0.laneVeto) continue;           // that ball gets tipped, not caught
      // Two gates. `sep` against a want that decays: look for a genuine window
      // first, then take the best thing on the field. `raw` against a hard
      // floor: a man with a defender that far past him is not a read at any
      // urgency, and the ball goes in the flowerbed instead.
      if (sep < want || raw < B0.rawMin) continue;
      const depth = (px - G.losX()) * d;
      // Hang time is a liability, not a feature: every extra tenth is another
      // tenth of everybody running at the spot. Left unpriced, the read loved
      // lofted moon balls into the paint and 75 of them a season were picked.
      let sc = Math.min(sep, B0.sepCap) + B0.depthW * depth
             - B0.laneW * lane - B0.scatterW * pred.scatter - B0.airW * pred.air;
      if (px * dOf(a.team) > gx - 0.3 && sep > B0.ezSep) sc += B0.ezBonus;
      if (!best || sc > best.sc) best = { sc, px, pz, charge, sep, raw, air: pred.air, r };
    }
  }
  return best;
}

// Where to put a ball nobody should catch. Firing it at the sideline sounds
// safe and is not: the path crosses the whole field at head height, and
// measured, fifty of them in four games were tipped or picked. Find empty
// grass instead — the spot with the most daylight around it AND a clean line
// to it — and if there is none, this is a sack and he takes it.
function openGrass(G, a) {
  const F = K(), B0 = B(), d = G.dir(), W = halfW();
  let best = null, bs = B0.awayMin;
  for (let i = 0; i < B0.awayDirs; i++) {
    const th = -Math.PI * 0.5 + Math.PI * (i / (B0.awayDirs - 1));
    for (let r = 0; r < B0.awayRange.length; r++) {
      const rr = B0.awayRange[r];
      const x = a.x + d * Math.cos(th) * rr;
      const z = clamp(a.z + Math.sin(th) * rr, -W - B0.awayOut, W + B0.awayOut);
      if ((x - G.losX()) * d < -B0.backThrowMax) continue;
      let room = 1e9;
      for (const e of G.actors) {
        if (e === a) continue;
        room = Math.min(room, Math.hypot(e.x - x, e.z - z));
        // and nobody standing on the line to it either
        const ux = x - a.x, uz = z - a.z, m = Math.hypot(ux, uz) || 1;
        const proj = ((e.x - a.x) * ux + (e.z - a.z) * uz) / m;
        // count him from the release, not from a metre out — the man rushing
        // is standing exactly where a throw-away's first stride goes, and
        // skipping him is how fifteen of these a game got picked
        if (proj > B0.awayNear && proj < m - 1.0)
          room = Math.min(room, Math.abs((e.x - a.x) * uz - (e.z - a.z) * ux) / m + B0.awayLine);
      }
      if (room > bs) { bs = room; best = { x, z }; }
    }
  }
  return best;
}

// IS THERE A LANE. The crude version — "no defender within nine metres of a
// three-metre-wide corridor" — never fired on BOMB, which is the one call
// where it should: every cover man turns and runs with his receiver and the
// middle of the field empties out. This solves the same intercept the pursuit
// does, from the QB's side: pick the heading nobody can cut off, and go if
// nobody can cut it off for long enough to be worth the ball.
function scrambleLane(G, a) {
  const F = K(), B0 = B(), d = G.dir(), S = F.runnerSpeed, W = halfW();
  let bs = -1e9, bu = null;
  for (let i = 0; i < B0.lanes; i++) {
    const phi = -B0.scrambleArc + (2 * B0.scrambleArc * i) / (B0.lanes - 1);
    const ux = d * Math.cos(phi), uz = Math.sin(phi);
    if (Math.abs(a.z + uz * S * 1.0) > W - 1.0) continue;
    let free = B0.freeCap;
    for (const e of G.defence()) {
      if (e.m && e.m.prone > 0) continue;
      free = Math.min(free, intercept(e.x, e.z, a.x, a.z, ux * S, uz * S, B0.planSpeed).t);
    }
    const sc = free + Math.cos(phi) * B0.scrambleFwd;
    if (sc > bs) { bs = sc; bu = { x: ux, z: uz, free }; }
  }
  return bu;
}

// Escape the rush without leaving the pocket: sample the ways out and take
// the one that buys the most room while staying behind the line.
function escapeSpot(G, a) {
  const F = K(), B0 = B(), d = G.dir(), W = halfW();
  let bx = a.x, bz = a.z, bs = -1e9;
  for (let i = 0; i < B0.escapeDirs; i++) {
    const th = (i / B0.escapeDirs) * Math.PI * 2;
    const px = a.x + Math.cos(th) * B0.escapeStep;
    const pz = a.z + Math.sin(th) * B0.escapeStep;
    if (Math.abs(pz) > W - 1.2) continue;
    const ahead = (px - G.losX()) * d;
    if (ahead > -B0.pocketDepth) continue;   // stepping UP is not crossing the line
    let room = 1e9;
    for (const e of G.defence()) room = Math.min(room, Math.hypot(e.x - px, e.z - pz));
    let sc = room;
    if (ahead < -B0.deepPocket) sc -= B0.deepPen * (-B0.deepPocket - ahead);  // and not backwards
    if (sc > bs) { bs = sc; bx = px; bz = pz; }
  }
  return { x: bx, z: bz };
}

function qbBrain(G, a) {
  const F = K(), B0 = B(), inp = mk(a), d = G.dir();
  // A designed run is just a carry: hand it straight to the lane read. The
  // first version of this strung the keeper wide behind the line before
  // turning up, which is what a sweep looks like — and measured, it lost:
  // the play-side rusher wins the race to a corner he can stand still in, so
  // the string-out was 10.8 tackles and 5% touchdowns per twelve calls. Read
  // the front and go, and the same call is 20%+.
  if (isRunPlay(G)) return carrierBrain(G, a);

  let rd = 1e9;
  for (const e of G.defence()) rd = Math.min(rd, Math.hypot(e.x - a.x, e.z - a.z));
  const pressed = rd < B0.pressR, desperate = rd < B0.sackR;
  const t = G.liveT;
  // WHAT HE NEEDS TO SEE, in metres of daylight at the catch. It starts as a
  // real window — let the routes breathe — and falls away as the pocket does,
  // because a held ball is a sack and a sack costs the down AND the spot.
  let want = B0.sepWant - Math.max(0, t - B0.minHold) * B0.sepDecay;
  if (pressed) want -= B0.sepPress;
  if (G.down >= 4) want -= B0.sepFourth;
  want = Math.max(B0.sepMin, want);
  const best = qbRead(G, a, want);
  if (best && t >= B0.minHold) {
    // stamped only when the ball is actually gone — a refused throw must not
    // leave the offence believing it knows where the next one is going
    if (G.throwBall(best.px, best.pz, best.charge)) { a.aimAt = best.r; return inp; }
  }

  // Daylight? Tuck it and go — crossing the line makes it a run for keeps.
  // Bounded on purpose: a QB who runs whenever the middle looks empty turns
  // every pass play into a carry, which is how the first pass at this brain
  // produced 30 tackles a game.
  if (t > B0.tuckAfter && t < B0.tuckUntil) {
    const lane = scrambleLane(G, a);
    if (lane && lane.free > B0.scrambleFree)
      return seek(inp, a, a.x + lane.x * 10, inZ(a.z + lane.z * 10), true);
  }
  // Nothing there and out of time: put it in the flowerbed. An incompletion
  // keeps the spot and costs one down; a sack costs both, and a ball forced
  // into a bracket costs the drive. This is the relief valve.
  if (t > B0.minHold && ((desperate && t > B0.dumpT) || t > B0.bailT)) {
    a.aimAt = null;
    const g = openGrass(G, a);
    // A throw-away is a TOUCH ball. The pitch matters here more than anywhere:
    // a flat one stays under the 2.35m ceiling for its whole flight and the
    // rusher in his face is the first man who can play it, while a floated one
    // is over everybody's head within a stride of the hand.
    if (g && G.throwBall(g.x, g.z, B0.awayCharge)) { away(G); return inp; }
    if (G.throwBall(a.x + d * B0.awayX, (a.z >= 0 ? 1 : -1) * (F.field.width / 2 + B0.awayOut),
                    B0.awayCharge)) { away(G); return inp; }
  }
  if (pressed) {
    const s = escapeSpot(G, a);
    return seek(inp, a, s.x, s.z, desperate);
  }
  // clean: settle on the drop and SET YOUR FEET — moving sprays the ball
  return seek(inp, a, G.losX() - d * (F.snapBack + B0.dropDepth), a.z * 0.85, false);
}

// ─────────────────────────────────────────────────────────────
// BLOCKING — the QB has to exist for any of this to matter
// ─────────────────────────────────────────────────────────────
// footmech engages a block when a blocker is inside 1.3m of a rusher, which
// is barely outside the 1.24m two bodies can be pushed to. So a blocker aims
// at the man, not near him, and keeps driving: parked politely a metre off,
// he engages nothing.
function screenBrain(G, a, spot) {
  const B0 = B(), inp = mk(a);
  // STICKY: you block a KID, not a threat model. Perfect every-tick
  // re-targeting made three blockers erase three defenders for a whole play.
  let tgt = a.blockTgt;
  if (tgt && (tgt.team === a.team || (tgt.m && tgt.m.prone > 0) ||
              Math.hypot(tgt.x - spot.x, tgt.z - spot.z) > B0.blockR * 1.4)) tgt = null;
  if (!tgt) {
    if ((a.blockLock || 0) > G.liveT) a.blockTgt = null;
    else {
      let bst = null, bd = 1e9;
      for (const e of G.actors) {
        if (e.team === a.team || (e.m && e.m.prone > 0)) continue;
        const toSpot = Math.hypot(e.x - spot.x, e.z - spot.z);
        if (toSpot > B0.blockR) continue;
        const dd = toSpot + Math.hypot(e.x - a.x, e.z - a.z) * 0.5;
        if (dd < bd) { bd = dd; bst = e; }
      }
      tgt = bst || null;
      a.blockTgt = tgt;
      if (tgt) a.blockLock = G.liveT + B0.blockStickT;
    }
  }
  if (!tgt) return inp;
  const dx = spot.x - tgt.x, dz = spot.z - tgt.z, dd = Math.hypot(dx, dz) || 1;
  let px = tgt.x + dx / dd * B0.blockGap, pz = tgt.z + dz / dd * B0.blockGap;
  if (Math.hypot(px - spot.x, pz - spot.z) < B0.convoyR) {   // never kettle the carrier
    px = tgt.x - dx / dd * B0.blockGap; pz = tgt.z - dz / dd * B0.blockGap;
  }
  return seek(inp, a, px, pz, Math.hypot(tgt.x - a.x, tgt.z - a.z) > 4);
}

// ─────────────────────────────────────────────────────────────
// RECEIVERS — run it, then go and take the ball
// ─────────────────────────────────────────────────────────────
function routeStep(G, a) {
  const inp = mk(a);
  const w = a.route[a.routeI];
  const dd = Math.hypot(w.x - a.x, w.z - a.z);
  seek(inp, a, w.x, w.z, dd > B().routeDashLeg);
  if (dd < 0.9) a.routeI++;
  return inp;
}

function receiverBrain(G, a) {
  const F = K(), B0 = B(), b = G.ball;
  if (b.inAir) {
    const owner = ballOwner(G, a.team);
    if (owner === a) {
      attackBall(G, a, true);
      // and run at the spot, hard while there is ground to make up
      return seek(mk(a), a, b.tx, b.tz, Math.hypot(b.tx - a.x, b.tz - a.z) > 2.0);
    }
    return screenBrain(G, a, { x: b.tx, z: b.tz });
  }
  const car = G.carrier;
  if (car && car !== a && (G.thrown || G.crossed || isRunPlay(G)))
    return screenBrain(G, a, { x: car.x + car.vx * 0.4, z: car.z + car.vz * 0.4 });
  if (a.route && a.routeI < a.route.length) return routeStep(G, a);
  // route run dry: keep carrying the last leg's heading, sliding off your man.
  // predictAt models exactly this, which is what lets the QB lead him.
  const inp = mk(a), u = routeDrift(G, a);
  let ex = 0, ez = 0, ed = 1e9;
  for (const e of G.defence()) {
    const dd = Math.hypot(e.x - a.x, e.z - a.z);
    if (dd < ed) { ed = dd; ex = e.x; ez = e.z; }
  }
  let tx = a.x + u.x * B0.driftStep, tz = a.z + u.z * B0.driftStep;
  if (ed < B0.openR) {
    const pd = Math.hypot(a.x - ex, a.z - ez) || 1;
    tx += (a.x - ex) / pd * B0.openSlide; tz += (a.z - ez) / pd * B0.openSlide;
  }
  return seek(inp, a, inX(tx), inZ(tz), true);
}

// ── the centre: pass pro, then find work downfield ───────────
function centreBrain(G, a) {
  const B0 = B(), b = G.ball, car = G.carrier;
  if (b.inAir) return screenBrain(G, a, { x: b.tx, z: b.tz });
  if (car && car !== G.qb && (G.thrown || G.crossed || isRunPlay(G)))
    return screenBrain(G, a, { x: car.x + car.vx * 0.4, z: car.z + car.vz * 0.4 });
  const q = G.qb;
  if (!q) return mk(a);
  // take the man who will reach the QB first, and get ON him
  let bst = null, bt = 1e9;
  for (const e of G.defence()) {
    if (e.m && e.m.prone > 0) continue;
    const it = intercept(e.x, e.z, q.x, q.z, q.vx, q.vz, B0.planSpeed);
    if (it.t < bt) { bt = it.t; bst = e; }
  }
  if (!bst) return mk(a);
  const dx = q.x - bst.x, dz = q.z - bst.z, dd = Math.hypot(dx, dz) || 1;
  return seek(mk(a), a, bst.x + dx / dd * B0.blockGap, bst.z + dz / dd * B0.blockGap,
              Math.hypot(bst.x - a.x, bst.z - a.z) > 3.5);
}

// ─────────────────────────────────────────────────────────────
// THE DEFENCE
// ─────────────────────────────────────────────────────────────
// A dive is a commitment: it travels ~4.6m in 0.4s and a miss leaves you
// face down for over a second. Probed in a live play, it lands from 3.7m dead
// astern of a runner at full speed, 4.5m at a 45° angle, 5.5m from the side,
// and 9m head-on — i.e. its reach is set by CLOSING SPEED, not by distance.
// Dive only when the solution says it lands; otherwise keep your feet.
function diveShot(G, a, car, pad = 0) {
  const B0 = B();
  if (!a.m || a.m.dive > 0 || a.m.prone > 0 || a.m.block > 0) return false;
  const dx = car.x - a.x, dz = car.z - a.z, D = Math.hypot(dx, dz);
  if (D < 1e-3) return false;
  const reach = B0.diveBase + B0.diveClose * Math.max(0, closingRate(a, car)) - pad;
  if (D > reach) return false;
  // never dive into a man who is already going down under a gang wrap
  if (car.m && car.m.wrapBy >= 2 && car.m.wrapT > B0.diveSkipWrap) return false;
  const lead = B0.diveLead;
  return G.tackleDive(a, car.x + (car.vx || 0) * lead, car.z + (car.vz || 0) * lead);
}

// pursuit: the nearest attacks, the rest layer the lanes and gang the wrap
function pursuitBrain(G, a, car) {
  const F = K(), B0 = B(), inp = mk(a);
  const dAtk = dOf(car.team), W = F.field.width / 2;
  const mates = [];
  for (const e of G.actors)
    if (e.team === a.team)
      mates.push({ e, t: intercept(e.x, e.z, car.x, car.z, car.vx, car.vz, B0.planSpeed).t });
  mates.sort((p, q) => p.t - q.t);
  let rank = 0;
  for (let i = 0; i < mates.length; i++) if (mates[i].e === a) { rank = i; break; }

  // the hunter and his first mate may go low; the back end never does —
  // a whiffed dive from the last line of defence is six points.
  if (rank <= 1 && diveShot(G, a, car, rank === 0 ? 0 : B0.divePadMate)) return inp;

  // Predict the curve, not the drift: a carrier's future always bends toward
  // the goal line, so blend his heading goalward before solving.
  const cs = Math.hypot(car.vx, car.vz);
  const w = B0.pursuitGoalW;
  let bx = dAtk * w, bz = 0;
  if (cs > 0.5) { bx += (car.vx / cs) * (1 - w); bz += (car.vz / cs) * (1 - w); }
  const bl = Math.hypot(bx, bz) || 1;
  const pvx = bx / bl * Math.max(cs, 4), pvz = bz / bl * Math.max(cs, 4);
  const it = intercept(a.x, a.z, car.x, car.z, pvx, pvz, B0.planSpeed);
  const dd = Math.hypot(car.x - a.x, car.z - a.z);
  let tx, tz;
  if (rank === 0) { tx = it.x; tz = it.z; }
  else if (dd < B0.surroundR) {
    // CONTAIN: a moving wall he has to go around while the hunter works —
    // except when he is already wrapped, in which case pile on: the drag
    // clock fills 2.3× faster with a second set of hands on him.
    if (car.m && car.m.wrapBy > 0 && dd < B0.gangR) { tx = car.x; tz = car.z; }
    else {
      const side = (a.z - car.z) >= 0 ? 1 : -1;
      tx = car.x + dAtk * Math.cos(B0.containArc) * B0.containGap + car.vx * 0.2;
      tz = car.z + side * Math.sin(B0.containArc) * B0.containGap + car.vz * 0.2;
    }
  }
  else if (rank === 1) { tx = it.x; tz = it.z; }
  else {
    const depth = B0.cutoffGap * rank;
    const sp = Math.hypot(car.vx, car.vz);
    tx = car.x + dAtk * depth;
    tz = car.z + (sp > 1 ? car.vz / sp : 0) * depth * 0.7 + (rank % 2 ? 1 : -1) * B0.bracketZ;
    tx = clamp(tx, -F.field.goalX + 0.5, F.field.goalX - 0.5);
  }
  seekAround(G, inp, a, tx, clamp(tz, -W + 0.8, W - 0.8),
             rank === 0 ? dd > B0.hunterDash : dd > B0.dashChase, car);
  return inp;
}

// ── man coverage: leverage first, then the ball ──────────────
function coverBrain(G, a) {
  const F = K(), B0 = B(), inp = mk(a), d = G.dir();
  const m = a.assign;
  if (!m) return seek(inp, a, G.losX() + d * 4, a.z, false);
  const q = G.qb;
  // RUN FIT: a designed run and your man stayed in to block — fill the alley
  // at the line and stay goal-side. Designed runs ONLY.
  if (q && isRunPlay(G) && G.phase === 'live' && G.ball.holder === q && !G.thrown &&
      (Math.abs(q.vz) > B0.runKeyV || (q.x - G.losX()) * d > -B0.runKeyX) &&
      (m.x - G.losX()) * d < B0.fillDepth) {
    const it = intercept(a.x, a.z, q.x, q.z, q.vx, q.vz, B0.planSpeed);
    const dd = Math.hypot(q.x - a.x, q.z - a.z);
    let fx = it.x;
    if ((fx - G.losX()) * d < B0.fillLineX) fx = G.losX() + d * B0.fillLineX;
    seekAround(G, inp, a, fx, it.z, dd > B0.dashChase, q);
    return inp;
  }
  if ((m.x - a.x) * d > B0.beatBy) {             // beaten deep: recovery angle
    const p = predictAt(G, m, B0.recoverLead);
    return seek(inp, a, p.x + d * 1.2, p.z, true);
  }
  // Play where he is GOING. predictAt walks his actual route, so a cover man
  // sits on the break instead of trailing it.
  const p = predictAt(G, m, B0.covLead);
  let tz = p.z;
  const wide = Math.abs(m.z) > B0.shadeWideZ;
  tz += (wide ? Math.sign(m.z || 1) : (tz > 0 ? -1 : 1)) * B0.covShade;
  return seek(inp, a, p.x + d * B0.covLev, inZ(tz),
              Math.hypot(m.x - a.x, m.z - a.z) > B0.covDash);
}

// ── the rush: hold the count, then beat the body in front of you ─
function rushBrain(G, a, slot) {
  const F = K(), B0 = B(), inp = mk(a), d = G.dir(), q = G.qb;
  if (!q) return inp;
  const side = slot === 0 ? -1 : 1;
  const runKey = Math.abs(q.vz) > B0.runKeyV || (q.x - G.losX()) * d > -B0.runKeyX;
  if (G.blitzT < F.blitzCount && !runKey)        // ...one-mississippi...
    return seek(inp, a, G.losX() + d * B0.holdX, q.z + side * B0.rushSplit, false);

  const dd = Math.hypot(q.x - a.x, q.z - a.z);
  // SET THE EDGE on a sweeping QB still behind his line: the play-side rusher
  // sprints flat to the corner and stands in the upfield turn.
  const flow = q.vz > 0 ? 1 : -1;
  if (runKey && !G.crossed && Math.abs(q.vz) > B0.runKeyV) {
    const playSide = (side === flow);
    const ex = G.losX() + d * (playSide ? B0.holdX : 0.2);
    const ez = q.z + flow * (playSide ? B0.edgeLead : -B0.rushSplit);
    seekAround(G, inp, a, ex, inZ(ez), dd > B0.dashChase, q);
    if (G.ball.holder === q) diveShot(G, a, q);
    return inp;
  }
  // BEAT THE BLOCK: a blocker inside 1.3m owns you at half speed for 0.9s.
  // Don't run through him — take the angle he is not standing on, then close.
  let bl = null, bd = 1e9;
  for (const o of G.offence()) {
    if (o === q || (o.m && o.m.prone > 0)) continue;
    const od = Math.hypot(o.x - a.x, o.z - a.z);
    if (od < bd) { bd = od; bl = o; }
  }
  const it = intercept(a.x, a.z, q.x, q.z, q.vx, q.vz, B0.planSpeed);
  let tx = it.x, tz = it.z + side * B0.rushSplit * 0.5;
  if (bl && bd < B0.beatR) {
    // swing to the side of the QB the blocker is not covering
    const bs = (bl.z - q.z) >= 0 ? -1 : 1;
    tx = q.x - d * B0.beatDepth;
    tz = inZ(q.z + bs * B0.beatWide);
  }
  seekAround(G, inp, a, tx, inZ(tz), dd > B0.dashChase, q);
  if (G.ball.holder === q) diveShot(G, a, q, B0.diveSackPad);
  return inp;
}

// ── the ball is up: race it, contest it, or rally behind it ──
function defBallBrain(G, a) {
  const B0 = B(), b = G.ball, inp = mk(a);
  attackBall(G, a, false);
  const remain = Math.max(0, b.air - b.t);
  const dd = Math.hypot(b.tx - a.x, b.tz - a.z);
  const myT = dd / B0.planSpeed;
  const tgt = ballOwner(G, G.possession);
  const recT = tgt ? Math.hypot(tgt.x - b.tx, tgt.z - b.tz) / B0.planSpeed : 1e9;
  // How many of us go and get it. All five converging on one patch of grass
  // is not coverage, it is a scrum: it puts a body on the catch every time
  // and the receiver is wrapped before he has taken a step. The man with the
  // shortest route to it plays the ball and nobody else leaves his man.
  let rank = 0;
  for (const e of G.defence())
    if (e !== a && Math.hypot(e.x - b.tx, e.z - b.tz) < dd) rank++;
  if (rank >= B0.ballGoers) {
    // Everybody else STAYS ON HIS MAN. Rallying the whole secondary to the
    // landing spot puts four bodies goal-side of every catch before it is
    // made, and the receiver is wrapped on the first step — measured, a
    // completion was worth 6m and the drive needed 9m a play to reach the
    // house. Cover your own guy; the ball is somebody else's problem.
    if (a.assign && a.assign !== ballOwner(G, G.possession)) return coverBrain(G, a);
    return seek(inp, a, b.tx + G.dir() * B0.rallyDepth, b.tz, dd > 4);
  }
  if (myT + B0.pickMargin < Math.min(remain, recT))
    return seek(inp, a, b.tx, b.tz, dd > 2.2);                      // clean pick
  if (myT < remain + B0.ballSlack) {
    if (myT < recT + B0.contestWin)
      return seek(inp, a, b.tx + G.dir() * B0.raceOff, b.tz, dd > 2.2);
    return seek(inp, a, b.tx + G.dir() * B0.ballOff, b.tz, dd > 2.2);
  }
  return seek(inp, a, b.tx + G.dir() * B0.rallyDepth, b.tz, dd > 4);
}

// ─────────────────────────────────────────────────────────────
// The two entries. Return null to hand the tick back to the stub.
// ─────────────────────────────────────────────────────────────
export function offenseInput(G, a, slot) {
  const pre = prePlay(G, a, true, slot);
  if (pre !== null) return pre;
  if (G.phase !== 'live') return null;
  const b = G.ball;
  if (G.carrier === a && !b.inAir) {
    counterMoves(G, a);
    if (a === G.qb && !G.thrown && !G.crossed && b.holder === a) return qbBrain(G, a);
    return carrierBrain(G, a);
  }
  if (slot === 1) return centreBrain(G, a);
  if (slot >= 2) return receiverBrain(G, a);
  // the QB once the ball is gone. He is STILL the sim's carrier until somebody
  // catches it, so standing still hands the rush a free whistle on a live
  // pass — get off the spot.
  if (b.inAir) {
    let ex = 0, ez = 0, ed = 1e9;
    for (const e of G.defence()) {
      const dd = Math.hypot(e.x - a.x, e.z - a.z);
      if (dd < ed) { ed = dd; ex = e.x; ez = e.z; }
    }
    if (ed < B().qbFleeR) {
      const pd = Math.hypot(a.x - ex, a.z - ez) || 1;
      return seek(mk(a), a, a.x + (a.x - ex) / pd * 6, inZ(a.z + (a.z - ez) / pd * 6), true);
    }
    return mk(a);
  }
  if (G.carrier && G.carrier !== a)
    return screenBrain(G, a, { x: G.carrier.x + G.carrier.vx * 0.4, z: G.carrier.z + G.carrier.vz * 0.4 });
  return mk(a);
}

export function defenseInput(G, a, slot) {
  const pre = prePlay(G, a, false, slot);
  if (pre !== null) return pre;
  if (G.phase !== 'live') return null;
  const b = G.ball;
  if (G.carrier === a && !b.inAir) { counterMoves(G, a); return carrierBrain(G, a); }
  if (b.inAir) return defBallBrain(G, a);
  const car = G.carrier;
  if (car && (G.thrown || G.crossed)) return pursuitBrain(G, a, car);
  if (slot <= 1) return rushBrain(G, a, slot);
  return coverBrain(G, a);
}

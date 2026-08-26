import { CFG, TEAMS } from './config.js';
import { makeActor, stepActor, updateAim } from './actor.js';

// ─────────────────────────────────────────────────────────────
// KICKBALL — pure simulation, same bet as rules.js. No THREE, no DOM, no
// wall clock, no Math.random. A headless server runs this verbatim and the
// renderer only ever READS state off G.
//
// The sport is Backyard Baseball with a big red ball: the pitcher ROLLS it,
// the kicker times a kick, everybody else runs. Three innings, three outs a
// half. Runners and fielders are ordinary actors on the shared movement
// kernel (actor.js) — a kickball runner accelerates, corners and dashes
// exactly like a CTF flag carrier, which is the whole point.
//
// SKILL EXPRESSION, the two axes:
//   WHEN — timing against the moment the roll crosses the plate. Dead centre
//          is full power; drifting off it bleeds power, sprays the direction
//          and pops the ball up, so a mistimed mash is a lazy foul.
//   WHERE — the aim point IS the landing spot you are trying to reach. The
//          launch angle is solved from it, so aiming deep only works if your
//          timing bought you the power to get there. Aim into a gap.
// ─────────────────────────────────────────────────────────────

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const other = t => t === 'blue' ? 'red' : 'blue';

// ── geometry, pure functions of CFG so the view can ask too ──
export function diamond(K = CFG.kickball.field) {
  const s = K.basePath / Math.SQRT2;
  return [
    { x:  0, z: K.homeZ },            // 0 / 4 — home plate
    { x:  s, z: K.homeZ - s },        // 1
    { x:  0, z: K.homeZ - 2 * s },    // 2
    { x: -s, z: K.homeZ - s },        // 3
  ];
}
export function moundPos(K = CFG.kickball.field) {
  return { x: 0, z: K.homeZ - K.moundDist };
}
// Fair territory is the 90° wedge opening away from the plate. Both foul
// lines run through the corner bases, so |x| <= depth is the whole test.
export function isFair(x, z, K = CFG.kickball.field) {
  const oz = z - K.homeZ;
  return oz < 0 && Math.abs(x) <= -oz + 1e-9;
}
// Fielding stations in world space: [pitcher, left, right].
export function posts(K = CFG.kickball) {
  return K.posts.map(([x, d]) => ({ x, z: K.field.homeZ - d }));
}

// How much arc a kick aimed `want` deep is allowed. Aiming just past the
// infield buys a flat screamer; aiming at the fence buys a real fly ball,
// and you only clear the fence if your timing paid for the speed too.
export function loftCap(want, C = CFG.kickball.kick) {
  const f = clamp((want - C.aimMin) / (C.aimMax - C.aimMin), 0, 1);
  return C.flatCap + (C.arcCap - C.flatCap) * f;
}

// Launch solve: the flat arc that lands a projectile at `to`. Past the
// speed's reach it falls back to 45° and simply comes up short — which is
// what makes an over-ambitious aim point a catchable fly ball.
function launch(from, to, speed, minLoft, maxLoft, g) {
  const dx = to.x - from.x, dz = to.z - from.z;
  const R = Math.hypot(dx, dz) || 1e-4;
  const s = clamp(R * g / (speed * speed), 0, 1);
  const loft = clamp(Math.asin(s) / 2, minLoft, maxLoft);
  const h = Math.cos(loft) * speed;
  return { vx: dx / R * h, vz: dz / R * h, vy: Math.sin(loft) * speed, loft };
}

// per-actor deterministic noise, exactly bot.js's generator
function rnd(a) {
  a.seed ^= a.seed << 13; a.seed ^= a.seed >>> 17; a.seed ^= a.seed << 5;
  return ((a.seed >>> 0) / 4294967296);
}

export function makeKickball(world, opts = {}) {
  const K = CFG.kickball;
  const seed0 = (opts.seed ?? 1) | 0;
  let rngState = (seed0 ^ 0x6D2B79F5) | 0;
  const rng = () => {                       // deterministic game RNG
    rngState ^= rngState << 13; rngState ^= rngState >>> 17; rngState ^= rngState << 5;
    return (rngState >>> 0) / 4294967296;
  };

  const BASES = diamond();
  const MOUND = moundPos();
  const POSTS = posts();
  const HOME = BASES[0];
  const basePos = b => BASES[b % 4];

  // ── roster ────────────────────────────────────────────────
  const actors = [];
  for (const T of Object.values(TEAMS)) {
    for (let i = 0; i < CFG.match.teamSize; i++) {
      const a = makeActor(T.key, T.base.x * 0.2, HOME.z + K.field.benchZ, T.key === K.away && i === 0);
      a.variant = (T.key === 'blue' ? 0 : 3) + i;
      a.lineup = i;
      a.seed = ((T.key === 'blue' ? 0x9E3779B1 : 0x85EBCA77) ^ (i * 0x27D4EB2F) ^ (seed0 * 0x165667B1)) | 0;
      for (let w = 0; w < 8; w++) rnd(a);       // warm-up: xorshift's first
      // draws track the seed, and a systematic tilt there is a rigged game
      // The kernel's kit verbs are CTF verbs. Kickball owns primary/special,
      // so switch them off and the lunge/roll branches never fire.
      a.primary = 'none'; a.special = 'none';
      // Kickball's whole balance is the ratio of runner speed to ball speed —
      // the aim-depth tuning assumed CFG.kickball.runnerSpeed on the ground.
      // Pin it here so changing the CTF pace can never re-break this mode.
      a.kitSpeed = K.runnerSpeed / CFG.move.maxSpeed;
      a.kitAccel = K.runnerAccel / CFG.move.accel;
      a.throwCd = 0;
      a.skill = K.bot.skillLo + rnd(a) * (K.bot.skillHi - K.bot.skillLo);
      a.kb = { duty: 'bench', base: 0, plan: null, planAge: 0, holdT: 0, postIdx: i,
               timeErr: 0, aim: { x: 0, z: HOME.z - 20 } };
      actors.push(a);
    }
  }
  const player = actors.find(a => a.isPlayer);
  const teamActors = t => actors.filter(a => a.team === t);

  const score = { blue: 0, red: 0 };
  const ball = {
    x: MOUND.x, z: MOUND.z, y: K.ball.carryY, vx: 0, vz: 0, vy: 0,
    state: 'idle',            // idle | pitch | live | thrown | held | dead
    held: null, thrownBy: null, toBase: 0,
    kicked: false, grounded: true, fair: false, bounces: 0, apex: 0,
    grabT: 0, lockT: 0, kickedBy: null,
  };

  const G = {
    actors, world, player, score, ball, bases: BASES, mound: MOUND, posts: POSTS,
    events: [], over: null, phase: 'countdown', countT: K.countdown,
    countSaid: Math.ceil(K.countdown) + 1,
    inning: 1, half: 'top', outs: 0, strikes: 0, balls: 0, pitches: 0,
    kicking: K.away, fielding: K.home,
    runners: [], kicker: null, order: { blue: 0, red: 0 },
    line: [],                                   // per-inning runs, for the box score
    duty: { chaser: null, cover: {}, recvBase: 0 },
    spray: { blue: { x: 0, z: 0, vx: 0, vz: 0, n: 0 }, red: { x: 0, z: 0, vx: 0, vz: 0, n: 0 } },
    pitchT: 0, arriveT: 1, pitchLat: 0, kicked: false,
    liveT: 0, settleT: 0, deadT: 0, setupT: 0, halfT: 0,
    pending: { atBatOver: true },
    lastCall: '', lastPlay: '',
    // read-only helpers the renderer/UI can lean on
    basePos, isFair: (x, z) => isFair(x, z),
    runnerOn: b => G.runners.find(r => !r.out && !r.scored && r.base === b) || null,
    live: () => G.runners.filter(r => !r.out && !r.scored),
    step,
  };
  G.line.push({ blue: 0, red: 0 });

  function say(text, color, kind = 'info') { G.events.push({ text, color, t: 2.4, kind }); }

  // ── the spray chart ───────────────────────────────────────
  // Where each side has been putting the ball, as a decaying mean. This is the
  // only thing the defence knows that a player could not also see, and it is
  // the same thing: he keeps kicking it there.
  function noteSpray(x, z) {
    const s = G.spray[G.kicking], m = K.shade.memory;
    if (!s.n) { s.x = x; s.z = z; s.vx = 0; s.vz = 0; }
    else {
      // Spread is tracked per axis, because the two say different things. A
      // kicker can pull everything to one side and vary how deep, or spray it
      // side to side and land everything at the same depth — and the defence
      // should read whichever half of that is actually a pattern.
      s.vx += ((x - s.x) ** 2 - s.vx) * m;
      s.vz += ((z - s.z) ** 2 - s.vz) * m;
      s.x += (x - s.x) * m; s.z += (z - s.z) * m;
    }
    s.n++;
  }
  // Where slot `i` actually stands for this pitch: his post, leaned toward the
  // spray chart but never abandoning his half of the field.
  function postFor(i) {
    const p = POSTS[i], s = G.spray[G.kicking];
    if (!s.n) return p;
    // Only a TIGHT pattern is worth moving for. The mean of a ball sprayed all
    // over the yard points at nobody's gap, and chasing it just vacates the
    // spot you were already standing in — reading a kicker who has no pattern
    // is worse than not reading him. Each axis is read on its own.
    const warm = Math.min(1, s.n / K.shade.reads) * K.shade.pull;
    let ox = (s.x - p.x) * warm * clamp(1 - Math.sqrt(s.vx) / K.shade.spread, 0, 1);
    let oz = (s.z - p.z) * warm * clamp(1 - Math.sqrt(s.vz) / K.shade.spread, 0, 1);
    const m = Math.hypot(ox, oz);
    if (m > K.shade.max) { ox *= K.shade.max / m; oz *= K.shade.max / m; }
    return { x: p.x + ox, z: p.z + oz };
  }
  const kickColor = () => TEAMS[G.kicking].color;
  const fieldColor = () => TEAMS[G.fielding].color;

  // ── placement ─────────────────────────────────────────────
  function place(a, x, z) {
    a.x = a.px = x; a.z = a.pz = z;
    a.vx = a.vz = 0; a.lunge = null; a.roll = null; a.swing = null; a.grapple = null;
    a.glide = false; a.lock = 0; a.bufDash = 0; a.bufPrimary = 0;
  }
  const kickBox = () => ({ x: 0, z: HOME.z + K.field.boxAhead });
  const benchSpot = i => ({ x: (i % 2 ? 1 : -1) * K.field.benchX, z: HOME.z + K.field.benchZ });
  const runnerPos = r => r.a ? { x: r.a.x, z: r.a.z } : { x: r.x, z: r.z };
  const onBag = r => {
    const p = runnerPos(r), b = basePos(r.base);
    return Math.hypot(p.x - b.x, p.z - b.z) <= K.field.baseR;
  };
  const nearBase = (r, b) => {
    const p = runnerPos(r), bp = basePos(b);
    return Math.hypot(p.x - bp.x, p.z - bp.z) <= K.field.baseR;
  };

  // ── lineup ────────────────────────────────────────────────
  // Three to a side, so "bases loaded" would leave nobody to kick. The
  // sandlot answer: the lead runner steps off and a ghost holds the bag.
  function nextKicker() {
    const mates = teamActors(G.kicking);
    const busy = new Set(G.live().filter(r => r.a).map(r => r.a));
    for (let i = 0; i < mates.length; i++) {
      const idx = (G.order[G.kicking] + i) % mates.length;
      if (busy.has(mates[idx])) continue;
      G.order[G.kicking] = (idx + 1) % mates.length;
      return mates[idx];
    }
    let lead = null;
    for (const r of G.live()) if (r.a && (!lead || r.base > lead.base)) lead = r;
    const a = lead.a;
    const p = basePos(lead.base);
    lead.a = null; lead.ghost = true; lead.x = p.x; lead.z = p.z;
    G.order[G.kicking] = (mates.indexOf(a) + 1) % mates.length;
    say('GHOST RUNNER', kickColor(), 'ghost');
    return a;
  }

  function newAtBat() {
    G.strikes = 0; G.balls = 0;
    G.kicker = nextKicker();
    G.kicker.kb.timeErr = 0;
    setupPitch();
  }

  function setupPitch() {
    G.phase = 'setup'; G.setupT = K.play.setupT;
    G.pitchT = 0; G.arriveT = 1; G.kicked = false; G.liveT = 0; G.settleT = 0;
    const F = teamActors(G.fielding);
    for (const a of F) {
      const p = postFor(a.kb.postIdx);
      a.kb.post = p; place(a, p.x, p.z); a.kb.plan = null; a.kb.holdT = 0;
    }
    const box = kickBox();
    place(G.kicker, box.x, box.z);
    G.kicker.kb.aimed = false; G.kicker.kb.timed = false;
    let bench = 0;
    for (const a of teamActors(G.kicking)) {
      if (a === G.kicker) continue;
      if (G.live().some(r => r.a === a)) continue;
      const s = benchSpot(bench++); place(a, s.x, s.z);
    }
    for (const r of G.live()) {
      const p = basePos(r.base);
      if (r.a) place(r.a, p.x, p.z); else { r.x = p.x; r.z = p.z; }
      r.to = r.base; r.forced = false; r.mustReturn = false; r.origin = r.base;
    }
    const P = F[0];
    ball.state = 'idle'; ball.held = null; ball.thrownBy = null; ball.toBase = 0;
    ball.kicked = false; ball.kickedBy = null; ball.grounded = true; ball.bounces = 0; ball.apex = 0;
    ball.x = P.x; ball.z = P.z; ball.y = K.ball.carryY; ball.vx = ball.vz = ball.vy = 0;
  }

  function startPitch() {
    G.phase = 'pitch'; G.pitchT = 0; G.kicked = false; G.pitches++;
    G.pitchLat = (rng() - 0.5) * 2 * K.pitch.spread;
    const P = teamActors(G.fielding)[0];
    const from = { x: P.x, z: P.z };
    const to = { x: HOME.x + G.pitchLat, z: HOME.z };
    const d = Math.hypot(to.x - from.x, to.z - from.z) || 1e-4;
    G.arriveT = d / K.pitch.speed;
    ball.state = 'pitch'; ball.held = null; ball.grounded = true; ball.kicked = false;
    ball.x = from.x; ball.z = from.z; ball.y = K.ball.radius * 0.5;
    ball.vx = (to.x - from.x) / d * K.pitch.speed;
    ball.vz = (to.z - from.z) / d * K.pitch.speed;
    ball.vy = 0;
    say('', 0, 'pitch');
  }

  // ── the kick ──────────────────────────────────────────────
  function doKick(a, inp) {
    const C = K.kick;
    G.kicked = true;
    const dBall = Math.hypot(a.x - ball.x, a.z - ball.z);
    const off = G.pitchT - G.arriveT;
    const abs = Math.abs(off);
    if (dBall > C.reachR || abs > C.maxOff) { addStrike('SWING AND A MISS'); return; }

    // timing -> power: a dead-centre band, then a bleed toward nothing.
    const t = abs <= C.window ? 1 : 1 - (abs - C.window) / (C.maxOff - C.window);
    const q = Math.pow(t, C.powerCurve);
    const power = C.minPower + (C.maxPower - C.minPower) * q;

    // aim -> the landing spot you are asking for. θ is measured off dead
    // centre field, positive toward first base.
    const ax = (inp.aimX ?? a.x) - HOME.x, az = (inp.aimZ ?? (a.z - 18)) - HOME.z;
    let th = clamp(Math.atan2(ax, -az), -C.maxAngle, C.maxAngle);
    const want = clamp(Math.hypot(ax, az), C.aimMin, C.aimMax);
    th += off * C.sprayPerSec;                       // early pulls, late pushes

    const g = K.ball.g;
    const s = clamp(want * g / (power * power), 0, 1);
    const aimed = Math.min(Math.asin(s) / 2, loftCap(want, C));
    // signed, and that is the whole batting game: get under it early and it
    // hangs, come in late and you beat it into the dirt
    const loft = clamp(aimed + abs * C.popPerSec - off * C.topPerSec, C.minLoft, C.maxLoft);
    const h = Math.cos(loft) * power;

    ball.z = Math.min(ball.z, HOME.z);          // a late kick still leaves off the plate
    ball.y = K.ball.radius;
    ball.vx = Math.sin(th) * h; ball.vz = -Math.cos(th) * h; ball.vy = Math.sin(loft) * power;
    ball.state = 'live'; ball.held = null; ball.thrownBy = null; ball.toBase = 0;
    ball.kicked = true; ball.kickedBy = a; ball.grounded = false; ball.bounces = 0;
    ball.fair = false; ball.grabT = K.ball.grabDelay; ball.apex = ball.y;
    a.squash = 1;
    world.fx?.burst(ball.x, ball.z, -Math.sin(th), Math.cos(th), 10);

    // the kicker becomes the batter-runner, and the force chain follows
    G.runners.push({ a, ghost: false, base: 0, to: 1, origin: 0, forced: true,
                     mustReturn: false, out: false, scored: false, kicker: true,
                     playRun: false, x: a.x, z: a.z });
    recomputeForces();
    G.phase = 'live'; G.liveT = 0; G.settleT = 0;
    G.lastPlay = q > 0.92 ? 'CRUSHED IT' : q > 0.55 ? 'SOLID CONTACT' : 'OFF THE TOE';
    say(G.lastPlay, kickColor(), 'kick');
  }

  // Forced iff every base behind you is occupied — the chain starts at the
  // batter-runner, who is always forced to first.
  function recomputeForces() {
    let chain = true;
    for (let b = 0; b <= 3; b++) {
      const r = G.runners.find(x => !x.out && !x.scored && x.base === b);
      if (!r) { chain = false; continue; }
      r.forced = chain;
    }
  }

  // ── counts ────────────────────────────────────────────────
  function addStrike(label) {
    G.strikes++;
    G.lastCall = label;
    if (G.strikes >= K.strikes) {
      G.outs++;
      say('STRIKEOUT', fieldColor(), 'out');
      endPlay(true, K.play.deadT);
    } else {
      say(label, 0xfff8ea, 'strike');
      endPlay(false, K.pitch.gap);
    }
  }
  function addBall() {
    G.balls++;
    G.lastCall = 'BALL';
    if (G.balls >= K.balls) { walk(); return; }
    say('BALL', 0x9aa4b2, 'ball');
    endPlay(false, K.pitch.gap);
  }
  function walk() {
    say('WALK', kickColor(), 'walk');
    // batter to first, and every forced runner shuffles up one
    G.runners.push({ a: G.kicker, ghost: false, base: 0, to: 0, origin: 0, forced: true,
                     mustReturn: false, out: false, scored: false, kicker: true,
                     playRun: false, x: G.kicker.x, z: G.kicker.z });
    recomputeForces();
    const forced = G.live().filter(r => r.forced).sort((p, q) => q.base - p.base);
    for (const r of forced) {
      r.base += 1; r.to = r.base; r.forced = false;
      if (r.base === 4) scoreRun(r); else {
        const p = basePos(r.base);
        if (r.a) place(r.a, p.x, p.z); else { r.x = p.x; r.z = p.z; }
      }
    }
    endPlay(true, K.play.deadT);
  }

  function foulBall() {
    say('FOUL BALL', 0xffd94a, 'foul');
    undoPlayRuns();
    revertRunners();
    G.strikes++;
    // kickball keeps it simple: a foul is a strike, third one included
    if (G.strikes >= K.strikes) {
      G.outs++;
      say('FOUL OUT', fieldColor(), 'out');
      endPlay(true, K.play.deadT);
    } else endPlay(false, K.play.deadT);
  }

  function undoPlayRuns() {
    for (const r of G.runners) {
      if (!r.playRun) continue;
      r.playRun = false; r.scored = false;
      G.score[G.kicking] = Math.max(0, G.score[G.kicking] - 1);
      const li = G.line[G.line.length - 1];
      li[G.kicking] = Math.max(0, li[G.kicking] - 1);
      r.base = r.origin; r.to = r.origin;
    }
  }
  function revertRunners() {
    for (const r of G.runners) {
      if (r.out) continue;
      if (r.kicker) { r.gone = true; continue; }
      r.base = r.origin; r.to = r.origin; r.forced = false; r.mustReturn = false;
      const p = basePos(r.base);
      if (r.a) place(r.a, p.x, p.z); else { r.x = p.x; r.z = p.z; }
    }
    G.runners = G.runners.filter(r => !r.gone);
  }

  function homeRun() {
    say('HOME RUN!', kickColor(), 'homer');
    G.lastPlay = 'HOME RUN';
    for (const r of G.live()) { r.base = 4; r.to = 4; scoreRun(r); }
    ball.state = 'dead';
    world.fx?.burst(ball.x, ball.z, 0, 0, 40);
    endPlay(true, K.play.deadT * 1.6);
  }

  function scoreRun(r) {
    r.scored = true;
    if (G.outs >= K.outsPerHalf) return;          // no run on the third out
    r.playRun = true;
    G.score[G.kicking]++;
    G.line[G.line.length - 1][G.kicking]++;
    say('RUN SCORES', kickColor(), 'run');
    world.fx?.burst(HOME.x, HOME.z, 0, 0, 20);
  }

  function makeOut(r, label) {
    if (!r || r.out || r.scored || G.phase !== 'live') return;
    r.out = true; r.forced = false; r.mustReturn = false; r.to = r.base;
    G.outs++;
    G.lastPlay = label;
    say(label, fieldColor(), 'out');
    if (r.a) world.fx?.burst(r.a.x, r.a.z, 0, 0, 10);
    if (G.outs >= K.outsPerHalf) endPlay(true, K.play.deadT);
  }

  function flyOut(catcher) {
    const bat = G.runners.find(r => r.kicker && !r.out && !r.scored);
    makeOut(bat, 'CAUGHT!');
    // the force is off; everyone else has to get back and retouch
    for (const r of G.live()) {
      if (r.kicker) continue;
      r.forced = false; r.mustReturn = true; r.to = r.origin;
    }
    world.fx?.burst(catcher.x, catcher.z, 0, 0, 14);
  }

  // ── phase plumbing ────────────────────────────────────────
  function endPlay(atBatOver, wait) {
    if (G.phase === 'dead' || G.phase === 'half' || G.over) return;
    G.phase = 'dead'; G.deadT = wait ?? K.play.deadT;
    G.pending = { atBatOver };
    if (ball.state !== 'dead') ball.state = ball.held ? 'held' : 'live';
  }

  function resolveDead() {
    // pin any runner still between bags to the bag they last touched
    for (const r of G.live()) { r.to = r.base; r.forced = false; r.mustReturn = false; }
    G.runners = G.runners.filter(r => !r.out && !r.scored);
    for (const r of G.runners) { r.playRun = false; r.kicker = false; }
    if (checkWalkOff()) return;
    if (G.outs >= K.outsPerHalf || G.pitches >= K.play.maxPitches) {
      G.phase = 'half'; G.halfT = K.play.halfT; return;
    }
    if (G.pending.atBatOver) newAtBat(); else setupPitch();
  }

  function endHalf() {
    G.runners.length = 0;
    G.outs = 0; G.strikes = 0; G.balls = 0; G.pitches = 0;
    say(`${G.inning} ${G.half === 'top' ? 'TOP' : 'BOTTOM'} OVER`, 0xfff8ea, 'inning');
    if (G.half === 'top') G.half = 'bottom';
    else { G.half = 'top'; G.inning++; G.line.push({ blue: 0, red: 0 }); }
    G.kicking = other(G.kicking); G.fielding = other(G.fielding);
    if (checkGameOver()) return;
    say(`${G.half === 'top' ? 'TOP' : 'BOT'} ${G.inning}`, kickColor(), 'inning');
    newAtBat();
  }

  function finish(who) {
    G.over = who; G.phase = 'over';
    say(who === 'draw' ? 'CALLED — TIE GAME'
      : `${who.toUpperCase()} WINS ${Math.max(G.score.blue, G.score.red)}-${Math.min(G.score.blue, G.score.red)}`,
      who === 'draw' ? 0xfff8ea : TEAMS[who].color, 'over');
    return true;
  }

  // Home never bats in a game it already leads, and a go-ahead run in the
  // last half ends it on the spot.
  function checkWalkOff() {
    const H = K.home, A = K.away;
    if (G.half === 'bottom' && G.inning >= K.innings && G.score[H] > G.score[A]) return finish(H);
    return false;
  }
  function checkGameOver() {
    const H = K.home, A = K.away;
    if (G.inning > K.innings) {
      if (G.score[H] !== G.score[A]) return finish(G.score[H] > G.score[A] ? H : A);
      if (G.inning > K.maxInnings) return finish('draw');
    }
    if (G.half === 'bottom' && G.inning >= K.innings && G.score[H] > G.score[A]) return finish(H);
    return false;
  }

  // ── ball physics ──────────────────────────────────────────
  function stepBall(dt) {
    const P = K.ball;
    ball.grabT = Math.max(0, ball.grabT - dt);
    ball.lockT = Math.max(0, ball.lockT - dt);
    if (ball.held) {
      ball.x = ball.held.x; ball.z = ball.held.z; ball.y = P.carryY;
      ball.vx = ball.vz = ball.vy = 0;
      return;
    }
    if (ball.state === 'idle' || ball.state === 'dead') return;
    if (ball.state === 'pitch') { ball.x += ball.vx * dt; ball.z += ball.vz * dt; return; }

    ball.x += ball.vx * dt; ball.z += ball.vz * dt; ball.y += ball.vy * dt;
    if (!ball.grounded && ball.y > ball.apex) ball.apex = ball.y;
    if (ball.y > 0) {
      ball.vy -= P.g * dt;
      const d = Math.exp(-P.airDrag * dt);
      ball.vx *= d; ball.vz *= d;
    }
    if (ball.y <= 0) {
      ball.y = 0;
      if (touched()) return;                    // first contact decides fair or foul
      if (ball.vy < -1.0) {
        ball.vy = -ball.vy * P.restitution; ball.bounces++;
        ball.vx *= 0.84; ball.vz *= 0.84;
      } else {
        ball.vy = 0;
        const s = Math.hypot(ball.vx, ball.vz);
        if (s > 1e-4) {
          const ns = Math.max(0, s - (P.rollFric + s * P.rollDrag) * dt);
          ball.vx = ball.vx / s * ns; ball.vz = ball.vz / s * ns;
        }
      }
      // an overthrow that hits the dirt is just a loose ball again
      if (ball.state === 'thrown') { ball.state = 'live'; ball.toBase = 0; }
    }
    fence();
  }

  function fence() {
    const F = CFG.field, hw = F.w / 2, hh = F.h / 2, P = K.ball;
    if (ball.x >= -hw && ball.x <= hw && ball.z >= -hh && ball.z <= hh) return;
    const cx = clamp(ball.x, -hw, hw), cz = clamp(ball.z, -hh, hh);
    if (ball.kicked && !ball.grounded && ball.y > K.field.fenceY && isFair(cx, cz)) { homeRun(); return; }
    // Off the wall. Kicking one to the fence has to pay: the carom is a live
    // ball, not a lazy fly waiting to be caught on the way back in.
    if (ball.kicked && touched(cx, cz)) return;
    if (ball.x < -hw) { ball.x = -hw; ball.vx = Math.abs(ball.vx) * P.wallKeep; }
    if (ball.x > hw) { ball.x = hw; ball.vx = -Math.abs(ball.vx) * P.wallKeep; }
    if (ball.z < -hh) { ball.z = -hh; ball.vz = Math.abs(ball.vz) * P.wallKeep; }
    if (ball.z > hh) { ball.z = hh; ball.vz = -Math.abs(ball.vz) * P.wallKeep; }
    if (ball.state === 'thrown') { ball.state = 'live'; ball.toBase = 0; }
  }

  // Where a loose ball is worth running to. Airborne: the spot it comes
  // down. Rolling: a short lead so you meet it instead of trailing it.
  function interceptPoint() {
    const P = K.ball;
    if (ball.held) return { x: ball.x, z: ball.z };
    if (!ball.grounded || ball.y > 0.2 || ball.vy > 0.3) {
      const t = (ball.vy + Math.sqrt(Math.max(0, ball.vy * ball.vy + 2 * P.g * ball.y))) / P.g;
      return { x: ball.x + ball.vx * t, z: ball.z + ball.vz * t };
    }
    const s = Math.hypot(ball.vx, ball.vz);
    const lead = Math.min(K.bot.chaseLead + s * 0.06, 0.9);
    return { x: ball.x + ball.vx * lead, z: ball.z + ball.vz * lead };
  }

  // ── fielding: catches, pickups, throws ────────────────────
  // Only got a piece of it. The ball dies at his feet, hops, and stays live —
  // no out, but no free bases either: he is standing right on top of it.
  function knockDown(a) {
    const P = K.ball;
    const s = Math.hypot(ball.vx, ball.vz) || 1e-4;
    const ns = s * P.knockKeep;
    ball.vx = ball.vx / s * ns; ball.vz = ball.vz / s * ns;
    ball.vy = P.knockUp;
    ball.grabT = P.knockT;
    ball.state = 'live'; ball.toBase = 0; ball.thrownBy = null;
    a.squash = 0.85;
    G.lastPlay = 'KNOCKED DOWN';
    say('', 0, 'knock');
    touched();                       // a deflected ball is no longer a clean fly
  }

  // The ball has been touched — by a glove or by the wall. It stops being a
  // catchable fly on the spot and is fair or foul from here, exactly as if it
  // had hit the dirt. Without this a deflection is still scored an out and the
  // whole point of knocking one down is lost.
  function touched(x = ball.x, z = ball.z) {
    if (ball.grounded) return false;
    ball.grounded = true;
    if (!ball.kicked || G.phase !== 'live') return false;
    ball.fair = isFair(x, z);
    if (!ball.fair) { foulBall(); return true; }
    noteSpray(x, z);
    return false;
  }

  function fieldingPass() {
    if (G.phase !== 'live') return;
    if (ball.held || ball.state === 'idle' || ball.state === 'dead') return;
    if (ball.grabT > 0) return;
    const P = K.ball;
    // How long anyone has had to get set on this ball, against how long a ball
    // this hot takes to get set on. Clean hands open up gradually — a hard step
    // in this ratio would draw a single sharp depth line across the field with
    // hits on one side and outs on the other. A teammate's throw is exempt:
    // that is a catch you were waiting for, not one you had to react to.
    const sp = Math.hypot(ball.vx, ball.vz, ball.vy);
    const ready = ball.state === 'thrown' ? 1
                : clamp(G.liveT / (P.setBase + P.setPerSpeed * sp), 0, 1);
    for (const a of teamActors(G.fielding)) {
      if (ball.thrownBy === a && ball.lockT > 0) continue;
      const d = Math.hypot(a.x - ball.x, a.z - ball.z);
      if (d > P.catchR) continue;
      if (ball.y > P.reachY) continue;
      // A fly ball is one that went UP, not one that happens to be at a
      // particular height when you touch it. Testing the instant height turns
      // a steeply falling deep fly into a four-frame coin flip between an out
      // and a trapped single; testing how high it got makes a hanging ball an
      // out whenever somebody actually got under it, and keeps a screamer that
      // skimmed the grass a base hit no matter who it runs into.
      const high = !ball.grounded && ball.apex >= P.flyMinY;
      if (high && ball.vy > 0.5) continue;        // still climbing — nobody reacts to that
      // And whether he got there in time to plant his feet. Catching a fly on
      // the dead run is a different play from scooping up a roller: a kid still
      // sprinting when it drops gets a glove on it, not a catch. That is what
      // makes MAKING HIM RUN a real way to beat a defence, and what makes
      // standing in the right place worth anything.
      const sprint = high ? Math.min(1, Math.hypot(a.vx, a.vz) / CFG.move.maxSpeed) : 0;
      const set = ready * (1 - P.runPenalty * sprint);
      const cleanR = P.catchR * (P.hotR + (1 - P.hotR) * set);
      if (d > cleanR) { knockDown(a); return; }   // in reach, not set — deflected
      const isCatch = high && ball.kicked;
      ball.held = a; ball.state = 'held'; ball.toBase = 0; ball.thrownBy = null;
      a.kb.holdT = 0; a.kb.plan = null; a.kb.planAge = 99;
      a.squash = 0.7;
      if (isCatch) { noteSpray(ball.x, ball.z); flyOut(a); }
      else if (touched(a.x, a.z)) return;       // trapped on the short hop — fair or foul from here
      else say('', 0, 'field');
      return;
    }
  }

  function doThrow(a, inp) {
    const T = K.throw;
    const pt = { x: inp.aimX ?? a.x, z: inp.aimZ ?? a.z };
    let base = 0, bd = T.snapR;
    for (let b = 1; b <= 4; b++) {
      const p = basePos(b), d = Math.hypot(p.x - pt.x, p.z - pt.z);
      if (d < bd) { bd = d; base = b; }
    }
    const to = base ? basePos(base) : pt;
    const flat = base === 0;                       // open space = a bean throw
    const L = launch({ x: a.x, z: a.z }, to, T.speed,
                     flat ? T.beanLoft : T.minLoft, flat ? T.beanLoft : T.maxLoft, K.ball.g);
    ball.held = null; ball.state = 'thrown'; ball.thrownBy = a; ball.toBase = base;
    ball.x = a.x; ball.z = a.z; ball.y = K.ball.carryY;
    ball.vx = L.vx; ball.vz = L.vz; ball.vy = L.vy;
    ball.grounded = true; ball.kicked = false; ball.lockT = T.selfLock; ball.grabT = 0; ball.apex = 0;
    a.kb.holdT = 0; a.kb.plan = null; a.throwCd = T.cooldown;
    a.squash = 0.6;
    say('', 0, 'throw');
  }

  // ── outs ──────────────────────────────────────────────────
  function outsPass() {
    if (G.phase !== 'live') return;
    const T = K.throw;

    // classic kickball: a thrown ball that hits a runner off the bag
    if (ball.state === 'thrown' && ball.y < T.beanY) {
      for (const r of G.live()) {
        if (!r.a || onBag(r)) continue;
        if (Math.hypot(r.a.x - ball.x, r.a.z - ball.z) > r.a.r + T.beanR) continue;
        makeOut(r, 'BEANED!');
        ball.state = 'live'; ball.toBase = 0; ball.grounded = true;
        ball.vx *= -0.25; ball.vz *= -0.25; ball.vy = 1.2;
        break;
      }
    }

    const h = ball.held;
    if (!h || h.team !== G.fielding) return;
    for (let b = 1; b <= 4; b++) {
      const bp = basePos(b);
      if (Math.hypot(h.x - bp.x, h.z - bp.z) > K.field.baseR) continue;
      for (const r of G.live()) {
        if (r.forced && r.to === b) makeOut(r, b === 4 ? 'FORCE AT HOME' : 'FORCE OUT');
        else if (r.mustReturn && r.origin === b && !nearBase(r, b)) makeOut(r, 'DOUBLED OFF');
      }
    }
    for (const r of G.live()) {
      if (!r.a || onBag(r)) continue;
      if (Math.hypot(h.x - r.a.x, h.z - r.a.z) > h.r + r.a.r + T.tagR) continue;
      makeOut(r, 'TAGGED OUT');
    }
  }

  // ── runners ───────────────────────────────────────────────
  function stepRunners(dt) {
    for (const r of G.runners) {
      if (r.out || r.scored) continue;
      const tgt = basePos(r.to);
      if (r.ghost) {
        let dx = tgt.x - r.x, dz = tgt.z - r.z;
        const d = Math.hypot(dx, dz);
        const s = K.run.ghostSpeed * dt;
        if (d <= s) { r.x = tgt.x; r.z = tgt.z; } else { r.x += dx / d * s; r.z += dz / d * s; }
      } else if (r.a) { r.x = r.a.x; r.z = r.a.z; }
      if (r.mustReturn && nearBase(r, r.origin)) { r.mustReturn = false; r.base = r.origin; r.to = r.origin; }
      if (r.to === r.base) continue;
      if (Math.hypot(r.x - tgt.x, r.z - tgt.z) > K.run.arriveR) continue;
      const arrived = r.to;
      r.base = r.to; r.forced = false;
      if (arrived === 4) scoreRun(r);
      else if (r.mustReturn && arrived === r.origin) r.mustReturn = false;
    }
  }

  // Is taking the next bag worth it? Runner clock vs the ball's clock —
  // the same arithmetic a player does by eye.
  function wantsAdvance(r) {
    if (r.mustReturn || r.to !== r.base || r.base >= 4) return false;
    if (G.phase !== 'live') return false;
    if (ball.kicked && !ball.grounded && ball.y > K.ball.flyMinY) return false;   // fly in the air: hold
    const bp = basePos(r.base + 1), p = runnerPos(r);
    const tRun = Math.hypot(bp.x - p.x, bp.z - p.z) / CFG.move.maxSpeed;
    let tDef;
    if (ball.held) {
      tDef = K.bot.throwDelay + Math.hypot(bp.x - ball.x, bp.z - ball.z) / K.throw.speed;
    } else {
      const ip = interceptPoint();
      const c = G.duty.chaser;
      const tGet = c ? Math.hypot(c.x - ip.x, c.z - ip.z) / CFG.move.maxSpeed : 1.5;
      tDef = tGet + K.bot.throwDelay + Math.hypot(bp.x - ip.x, bp.z - ip.z) / K.throw.speed;
    }
    return tRun + K.bot.safety < tDef;
  }

  function playEndCheck(dt) {
    if (G.phase !== 'live') return;
    G.liveT += dt;
    const moving = G.live().some(r => r.to !== r.base);
    if (ball.held && !moving) {
      G.settleT += dt;
      if (G.settleT > K.play.settleT) { endPlay(true, K.play.deadT); return; }
    } else G.settleT = 0;
    if (G.liveT > K.play.maxLiveT) {
      for (const r of G.live()) {
        if (r.to === r.base) continue;
        r.base = r.to; r.forced = false;
        if (r.to === 4) scoreRun(r);
      }
      endPlay(true, K.play.deadT);
    }
  }

  // ── duties: who chases, who covers which bag ──────────────
  function assignDuties() {
    const D = G.duty;
    D.chaser = null; D.cover = {}; D.recvBase = 0;
    const F = teamActors(G.fielding);
    for (const a of F) a.kb.duty = a.kb.postIdx === 0 && G.phase !== 'live' ? 'pitch' : 'post';

    const inPlay = G.phase === 'live';
    if (inPlay) {
      if (ball.held && ball.held.team === G.fielding) D.chaser = ball.held;
      else {
        const ip = interceptPoint();
        let bd = 1e9;
        for (const a of F) {
          if (ball.state === 'thrown' && a === ball.thrownBy) continue;
          const d = Math.hypot(a.x - ip.x, a.z - ip.z);
          if (d < bd) { bd = d; D.chaser = a; }
        }
      }
    }

    const want = [];
    if (inPlay) {
      for (const r of G.live()) {
        if (r.to === r.base && !r.mustReturn) continue;
        const b = r.mustReturn ? r.origin : r.to;
        if (!want.includes(b)) want.push(b);
      }
      want.sort((p, q) => q - p);                  // lead base is worth the most
      if (ball.state === 'thrown' && ball.toBase) {
        D.recvBase = ball.toBase;
        const i = want.indexOf(ball.toBase);
        if (i >= 0) want.splice(i, 1);
        want.unshift(ball.toBase);
      }
    }

    const free = F.filter(a => a !== D.chaser);
    for (const b of want) {
      if (!free.length) break;
      const bp = basePos(b);
      let bi = 0, bd = 1e9;
      for (let i = 0; i < free.length; i++) {
        const d = Math.hypot(free[i].x - bp.x, free[i].z - bp.z);
        if (d < bd) { bd = d; bi = i; }
      }
      D.cover[b] = free[bi]; free.splice(bi, 1);
    }

    if (D.chaser) D.chaser.kb.duty = (ball.held === D.chaser) ? 'carry' : 'chase';
    for (const b in D.cover) { D.cover[b].kb.duty = 'cover'; D.cover[b].kb.base = +b; }

    // offense
    for (const a of teamActors(G.kicking)) a.kb.duty = 'bench';
    for (const r of G.live()) if (r.a) r.a.kb.duty = 'run';
    if (G.kicker && !G.live().some(r => r.a === G.kicker)) G.kicker.kb.duty = 'kick';
  }

  // What the fielder holding the ball is going to do about it.
  function pickPlay(a) {
    const T = K.throw, B = K.bot;
    const F = teamActors(G.fielding);
    let best = null;
    for (const r of G.live()) {
      const forceish = (r.forced && r.to !== r.base) || (r.mustReturn && !nearBase(r, r.origin));
      if (!forceish) continue;
      const tb = r.mustReturn ? r.origin : r.to;
      const bp = basePos(tb);
      const dSelf = Math.hypot(a.x - bp.x, a.z - bp.z);
      const p = runnerPos(r);
      const tRun = Math.hypot(p.x - bp.x, p.z - bp.z) / CFG.move.maxSpeed;
      // two ways to make the out: carry it to the bag, or throw to whoever
      // is covering. Take whichever actually beats the runner.
      const tSelf = dSelf / CFG.move.maxSpeed;
      let cd = 1e9;
      for (const f of F) {
        if (f === a) continue;
        const d = Math.hypot(f.x - bp.x, f.z - bp.z);
        if (d < cd) cd = d;
      }
      // The receiver is breaking cold off a post and has to turn around, so
      // charge him the ramp up to speed. Then the part that decides games: a
      // throw that beats its own receiver to the bag is not a missed out, it
      // is a live ball rolling to the fence — the most expensive thing a
      // defence can do. So the ball is not released until he can be standing
      // there, and `wait` is how long the carrier holds it.
      const flight = T.windup + dSelf / T.speed;
      const tRecv = cd / CFG.move.maxSpeed + B.coverRamp;
      const tThrow = Math.max(flight, tRecv);
      const kind = tThrow < tSelf ? 'throw' : 'run';
      const tBall = kind === 'throw' ? tThrow : tSelf;
      if (tBall + 0.04 >= tRun) continue;
      const value = tb * 10 + (tRun - tBall);
      if (!best || value > best.value)
        best = { kind, base: tb, pt: bp, value, wait: Math.max(0, tRecv - flight - B.recvSlack) };
    }
    if (best) return best;

    // no force: bean the lead runner who is off the bag, or go tag them
    let mark = null, markV = -1e9;
    for (const r of G.live()) {
      if (!r.a || onBag(r)) continue;
      const p = runnerPos(r);
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      if (d > T.maxRange) continue;
      const v = r.base * 10 - d;
      if (v > markV) { markV = v; mark = r; }
    }
    if (mark) {
      const p = runnerPos(mark);
      const d = Math.hypot(a.x - p.x, a.z - p.z);
      const lead = Math.min(0.5, d / T.speed);
      if (d < 3.2) return { kind: 'tag', base: 0, pt: p, target: mark, value: 0 };
      return { kind: 'bean', base: 0, target: mark, value: 0,
               pt: { x: mark.a.x + mark.a.vx * lead, z: mark.a.z + mark.a.vz * lead } };
    }
    // nothing doing — hold it, and the play dies on the settle timer
    return { kind: 'hold', base: 0, pt: MOUND, value: -1 };
  }

  // ── bot: same inputs a player has, no extra reach ─────────
  function seek(a, tx, tz, sprintAt = 4.0, stopR = 0) {
    let dx = tx - a.x, dz = tz - a.z;
    const d = Math.hypot(dx, dz) || 1e-4;
    if (d <= stopR) return { dx: 0, dz: 0, dash: false, primary: false, special: false, aimX: tx, aimZ: tz };
    dx /= d; dz /= d;
    const sp = Math.hypot(a.vx, a.vz);
    const aligned = sp > 0.5 ? (a.vx * dx + a.vz * dz) / sp : 1;
    return { dx, dz, dash: a.dashCd <= 0 && d > sprintAt && aligned > 0.88,
             primary: false, special: false, aimX: tx, aimZ: tz };
  }

  // Distance from the plate to the fence along a heading off dead centre.
  function fenceReach(th) {
    const F = CFG.field, dx = Math.sin(th), dz = -Math.cos(th);
    let d = 1e9;
    if (dx >  1e-6) d = Math.min(d, ( F.w / 2 - HOME.x) / dx);
    if (dx < -1e-6) d = Math.min(d, (-F.w / 2 - HOME.x) / dx);
    if (dz >  1e-6) d = Math.min(d, ( F.h / 2 - HOME.z) / dz);
    if (dz < -1e-6) d = Math.min(d, (-F.h / 2 - HOME.z) / dz);
    return d;
  }

  // Where the bot kicker asks for the ball. It scores the spot the ball will
  // ACTUALLY land given the power this kicker typically gets — asking for the
  // fence you cannot reach only drops the ball in the outfielder's lap.
  function pickAim(a) {
    const C = K.kick, P = K.ball, F = teamActors(G.fielding);
    const err = K.bot.timeErr * a.skill * 0.42;          // this kicker's usual miss
    const tq = err <= C.window ? 1 : 1 - (err - C.window) / (C.maxOff - C.window);
    const pw = C.minPower + (C.maxPower - C.minPower) * Math.pow(Math.max(0, tq), C.powerCurve);
    let best = null;
    for (let i = -3; i <= 3; i++) {
      const th = i * (C.maxAngle * 0.30);
      for (const want of [10, 14, 18, 22, 26, 31, 36, 41]) {
        const cap = loftCap(want, C);
        const s = clamp(want * P.g / (pw * pw), 0, 1);
        const loft = Math.min(Math.asin(s) / 2, cap);
        const h = Math.cos(loft) * pw, vy = Math.sin(loft) * pw;
        const hang = (vy + Math.sqrt(vy * vy + 2 * P.g * P.radius)) / P.g;
        const range = h * hang;
        const lx = HOME.x + Math.sin(th) * range, lz = HOME.z - Math.cos(th) * range;
        if (!isFair(lx, lz)) continue;
        // over the wall? that is worth more than any gap
        const wall = fenceReach(th);
        let over = 0;
        if (range > wall) {
          const t = wall / h;
          if (P.radius + vy * t - 0.5 * P.g * t * t > K.field.fenceY) over = 14;
        }
        // hang time is exactly how much ground a glove gets to cover
        const reach = CFG.move.maxSpeed * Math.max(0, hang - K.bot.readT) + P.catchR;
        let near = 1e9;
        for (const f of F) near = Math.min(near, Math.hypot(f.x - lx, f.z - lz));
        const edge = (-(lz - HOME.z)) - Math.abs(lx);     // room to the foul line
        const v = over + (near - reach) * 1.2 + Math.min(range, wall) * 0.12
                + Math.min(edge, 6) * 0.45 + rnd(a) * K.bot.aimJitter;
        if (!best || v > best.v) best = { v, x: HOME.x + Math.sin(th) * want,
                                             z: HOME.z - Math.cos(th) * want };
      }
    }
    return best ? { x: best.x, z: best.z } : { x: HOME.x, z: HOME.z - 22 };
  }

  function kickballBot(a, dt) {
    const kb = a.kb;
    const idle = { dx: 0, dz: 0, dash: false, primary: false, special: false,
                   aimX: a.x, aimZ: a.z - 6 };
    // nobody breaks on a ball they have not read yet
    if (G.phase === 'live' && a.team === G.fielding && ball.held !== a &&
        G.liveT < K.bot.readT) return idle;
    switch (kb.duty) {
      case 'kick': {
        const box = kickBox();
        const out = seek(a, box.x, box.z, 99, 0.3);
        if (G.phase !== 'pitch' || G.kicked) return out;
        if (!kb.aimed) { kb.aim = pickAim(a); kb.aimed = true; }
        if (!kb.timed) {
          const u = rnd(a), sgn = rnd(a) < 0.5 ? -1 : 1;
          kb.timeErr = sgn * Math.pow(u, K.bot.timeCurve) * K.bot.timeErr * a.skill;
          kb.timed = true;
        }
        out.aimX = kb.aim.x; out.aimZ = kb.aim.z;
        const takeIt = Math.abs(G.pitchLat) > K.pitch.zone / 2 && G.strikes < K.strikes - 1;
        out.primary = !takeIt && G.pitchT >= G.arriveT + kb.timeErr;
        return out;
      }
      case 'run': {
        const r = G.live().find(x => x.a === a);
        if (!r) return idle;
        const tgt = basePos(r.to);
        const out = seek(a, tgt.x, tgt.z, 2.6, r.to === r.base ? K.run.holdR : 0);
        if (r.to === r.base) out.special = wantsAdvance(r);
        return out;
      }
      case 'chase': {
        // Stop ON the spot rather than running through it: arriving early and
        // planting is worth more than arriving fast.
        const ip = interceptPoint();
        return seek(a, ip.x, ip.z, 2.6, K.ball.setR);
      }
      case 'carry': {
        const plan = kb.plan;
        if (!plan) return idle;
        if (plan.kind === 'run') return seek(a, plan.pt.x, plan.pt.z, 2.2);
        if (plan.kind === 'tag') return seek(a, plan.pt.x, plan.pt.z, 2.2);
        if (plan.kind === 'hold') return { ...idle, aimX: MOUND.x, aimZ: MOUND.z };
        const out = { ...idle, aimX: plan.pt.x, aimZ: plan.pt.z };
        out.primary = kb.holdT >= Math.max(K.throw.windup, plan.wait || 0) && a.throwCd <= 0;
        return out;
      }
      case 'cover': {
        const bp = basePos(kb.base);
        // shade a step toward the ball so the throw arrives in front of you
        const ox = ball.x - bp.x, oz = ball.z - bp.z, d = Math.hypot(ox, oz) || 1;
        const pull = Math.min(K.bot.coverPull, d * 0.15);
        return seek(a, bp.x + ox / d * pull, bp.z + oz / d * pull, 2.6, 0.12);
      }
      case 'bench': {
        const mates = teamActors(a.team).filter(m => m !== G.kicker && !G.live().some(r => r.a === m));
        const s = benchSpot(Math.max(0, mates.indexOf(a)));
        return seek(a, s.x, s.z, 99, 0.5);
      }
      default: {
        const p = kb.post || POSTS[kb.postIdx];
        return seek(a, p.x, p.z, 99, 0.3);
      }
    }
  }

  // ─────────────────────────────────────────────────────────
  function step(dt, playerInput) {
    if (G.over) return;
    for (const e of G.events) e.t -= dt;
    G.events = G.events.filter(e => e.t > 0);

    if (G.phase === 'countdown') {
      G.countT -= dt;
      const n = Math.ceil(G.countT);
      if (n < G.countSaid) {
        G.countSaid = n;
        if (n >= 1 && n <= 3) say(String(n), 0xfff8ea, 'count');
      }
      if (G.countT <= 0) { say('PLAY BALL!', 0xffd94a, 'go'); newAtBat(); }
      return;
    }

    // phase clocks
    if (G.phase === 'setup') { G.setupT -= dt; if (G.setupT <= 0) startPitch(); }
    else if (G.phase === 'dead') { G.deadT -= dt; if (G.deadT <= 0) { resolveDead(); if (G.over) return; } }
    else if (G.phase === 'half') { G.halfT -= dt; if (G.halfT <= 0) { endHalf(); if (G.over) return; } }
    else if (G.phase === 'pitch') {
      G.pitchT += dt;
      if (!G.kicked && G.pitchT > G.arriveT + K.pitch.takeT) {
        if (Math.abs(G.pitchLat) <= K.pitch.zone / 2) addStrike('STRIKE'); else addBall();
      }
    }

    assignDuties();

    // Phase 1 — every decision comes off the same frozen snapshot.
    // playerInput may be a function (a, i) => input | null, exactly as in
    // rules.js, so a server can drive any slot from the network.
    const inputs = actors.map((a, i) => {
      const ext = typeof playerInput === 'function' ? playerInput(a, i)
                : (a.isPlayer ? playerInput : null);
      return ext || kickballBot(a, dt);
    });

    // Phase 2 — actions that need world knowledge
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i], inp = inputs[i];
      a.throwCd = Math.max(0, a.throwCd - dt);
      if (ball.held === a) {
        a.kb.holdT += dt; a.kb.planAge += dt;
        if (!a.kb.plan || a.kb.planAge > 0.25) { a.kb.plan = pickPlay(a); a.kb.planAge = 0; }
      } else { a.kb.holdT = 0; a.kb.plan = null; a.kb.planAge = 99; }

      if (!inp.primary) continue;
      if (a === G.kicker && G.phase === 'pitch' && !G.kicked) doKick(a, inp);
      else if (ball.held === a && a.throwCd <= 0 && a.kb.holdT >= K.throw.windup) doThrow(a, inp);
    }
    // a runner's SPECIAL is "take the next bag" — bots press it too
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i], inp = inputs[i];
      if (!inp.special || G.phase !== 'live') continue;
      const r = G.live().find(x => x.a === a);
      if (r && r.to === r.base && !r.mustReturn && r.base < 4) r.to = r.base + 1;
    }
    // A ghost has no body to press a button with, so nothing was ever moving
    // him: he sat on his bag while the roster filled up behind him and the
    // half-inning could never end. He advances when he is forced to and never
    // on his own — an imaginary runner does not take chances.
    if (G.phase === 'live') {
      for (const r of G.live()) {
        if (!r.ghost || !r.forced || r.to !== r.base || r.mustReturn || r.base >= 4) continue;
        r.to = r.base + 1;
      }
    }

    // Phase 3 — advance everyone on the shared kernel
    for (let i = 0; i < actors.length; i++) updateAim(actors[i], inputs[i], dt);
    for (let i = 0; i < actors.length; i++) stepActor(actors[i], inputs[i], dt, world);

    stepBall(dt);
    stepRunners(dt);
    fieldingPass();
    outsPass();
    playEndCheck(dt);
  }

  return G;
}

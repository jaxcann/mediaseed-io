// ─────────────────────────────────────────────────────────────
// FOOTBALL — 5-on-5, backyard rules, after Madden 09 All-Play's 5-on-5:
// no kicks, no punts, no penalties. Four downs to march the LENGTH of the
// yard; fail and it's a turnover on the spot. A touchdown is ONE point and
// the first team to five goes home happy. Four plays in the book, and the
// routes are yours to draw over the top.
//
// Pure simulation: no THREE, no DOM, no Math.random, no Date.now. The field
// runs along X — the team in possession attacks toward dir * goalX — and the
// same actor kernel that runs CTF runs everyone here.
// ─────────────────────────────────────────────────────────────
import { CFG, TEAMS } from './config.js';
import { makeActor, stepActor, updateAim, separateBodies } from './actor.js';
import * as MECH from './footmech.js';

const K = () => CFG.football;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// Offensive line-up, scrimmage-relative: [along (toward defence), lateral].
// Slot order is load-bearing: 0=QB, 1=centre, 2..4 = the three receivers.
const O_LINEUP = [
  [-1, 0],          // QB (snapBack applied separately)
  [0, 0],           // centre, on the ball
  [0, -9.5],        // X receiver, wide left
  [0, 9.5],         // Z receiver, wide right
  [0, 4.5],         // slot
];
// Defensive line-up: 0..1 rushers on the line, 2..4 cover men over the WRs.
const D_LINEUP = [
  [1.2, -1.4],
  [1.2, 1.4],
  [4.0, -9.5],
  [4.0, 9.5],
  [4.0, 4.5],
];

// The book. Four plays, exactly. Waypoints are [along, lateral] from each
// receiver's own line-up spot; the engine mirrors laterals for nobody — routes
// are authored absolute per slot, which keeps them readable as plays.
export const PLAYS = {
  sweep: {
    name: 'SWEEP', kind: 'run',
    blurb: 'QB keeps it wide. Receivers clear out and get in the way.',
    routes: { 2: [[7, -2]], 3: [[8, 2]], 4: [[6, 3]] },
  },
  short: {
    name: 'SHORT', kind: 'pass',
    blurb: 'Quick outs. The ball comes out before the rush arrives.',
    routes: { 2: [[4, 0], [5, -4]], 3: [[4, 0], [5, 4]], 4: [[3, 0], [4, -3]] },
  },
  mid: {
    name: 'MID', kind: 'pass',
    blurb: 'Crossers over the middle. Throw them open.',
    routes: { 2: [[7, 0], [9, 6]], 3: [[7, 0], [9, -6]], 4: [[6, 0], [8, -4]] },
  },
  long: {
    name: 'BOMB', kind: 'pass',
    blurb: 'Everybody go deep. The classic backyard call.',
    routes: { 2: [[16, -1]], 3: [[16, 1]], 4: [[13, 0]] },
  },
};
export const PLAY_KEYS = ['sweep', 'short', 'mid', 'long'];

export function makeFootball(world, opts = {}) {
  const F = K();
  const seed0 = (opts.seed ?? 1) | 0;
  let rngState = (seed0 ^ 0x51ed270b) | 0;
  const rng = () => {
    rngState ^= rngState << 13; rngState ^= rngState >>> 17; rngState ^= rngState << 5;
    return (rngState >>> 0) / 4294967296;
  };

  const actors = [];
  for (const T of ['blue', 'red']) {
    for (let i = 0; i < 5; i++) {
      const a = makeActor(T, 0, 0, T === 'blue' && i === 0);
      a.variant = (T === 'blue' ? 0 : 3) + i;
      a.kit = 'runner';
      a.kitSpeed = F.runnerSpeed / CFG.move.maxSpeed;
      a.kitAccel = F.runnerAccel / CFG.move.accel;
      a.r = 0.62;
      a.primary = 'lunge'; a.special = 'none';
      a.seed = ((T === 'blue' ? 0x9e3779b1 : 0x85ebca77) ^ (i * 0x27d4eb2f) ^ (seed0 * 0x165667b1)) | 0;
      MECH.initMech(a);
      actors.push(a);
    }
  }

  const G = {
    actors, world, player: actors[0],
    score: { blue: 0, red: 0 },
    events: [], over: null,
    phase: 'countdown', countT: F.countdown, countSaid: Math.ceil(F.countdown) + 1,
    possession: rng() < 0.5 ? 'blue' : 'red',   // the coin toss
    down: 1,
    scrimmage: 0,                            // set just below, once the toss is known
    ball: { x: 0, y: 0.3, z: 0, vx: 0, vy: 0, vz: 0,
            holder: null, inAir: false, hike: false, t: 0, air: 0,
            tx: 0, tz: 0 },
    play: null, routes: {},                  // slot -> [{x,z}] world coords
    carrier: null, qb: null,
    // the throw: charge picks the pitch, the cursor picks the spot
    aim: { active: false, charge: 0, tx: 0, tz: 0, pred: null },
    throwWind: 0, pending: null,
    spotlight: null,                         // who the eyes are on right now
    tally: {},
    thrown: false, crossed: false,           // QB past the line = it's a run now
    blitzT: 0, liveT: 0, deadT: 0,
    lastResult: '', drive: 0,
    // read-only helpers the view and control layer lean on
    dir: () => (G.possession === 'blue' ? 1 : -1),
    losX: () => G.scrimmage,
    offence: () => actors.filter(a => a.team === G.possession),
    defence: () => actors.filter(a => a.team !== G.possession),
    receivers: () => G.offence().slice(2),
    toGo: () => Math.max(0, (F.field.goalX - G.dir() * G.scrimmage)),
    callPlay, setRoute, snap, step,
    // mechanics, all of them deterministic and all of them refusable
    beginCharge: () => MECH.beginCharge(G),
    stepCharge: (dt, tx, tz) => MECH.stepCharge(G, dt, tx, tz),
    releaseThrow: (tx, tz) => MECH.releaseThrow(G, tx, tz),
    canThrow: () => MECH.canThrow(G),
    predictThrow: (tx, tz, ch) => MECH.predictThrow(G, tx, tz, ch ?? G.aim.charge),
    pressCatch: a => MECH.pressCatch(G, a),
    diveCatch: a => MECH.diveCatch(G, a),
    tackleDive: (a, x, z) => MECH.tryDive(G, a, x, z),
    juke: (a, x, z) => MECH.tryJuke(G, a, x, z),
    spin: a => MECH.trySpin(G, a),
    truck: a => MECH.tryTruck(G, a),
    claimant: team => MECH.ballClaimant(G, team),
  };
  G.scrimmage = (G.possession === 'blue' ? -1 : 1) * (F.field.goalX - 4);
  const say = (text, color, kind = 'info') => { G.events.push({ text, color, t: 2.4, kind }); };

  // ── line-up ──────────────────────────────────────────────
  function slotOf(a) { return actors.filter(x => x.team === a.team).indexOf(a); }
  function lineupSpot(a) {
    const off = a.team === G.possession;
    const d = G.dir();
    const L = off ? O_LINEUP[slotOf(a)] : D_LINEUP[slotOf(a)];
    const along = off ? (slotOf(a) === 0 ? -F.snapBack : -0.35) : L[0];
    return { x: G.scrimmage + d * along,
             z: clamp(L[1], -F.field.width / 2 + 1, F.field.width / 2 - 1) };
  }
  // Everyone starts ON THE LINE. Without this the ten of them sit in one pile
  // at the origin for the whole countdown and then sprint to their spots when
  // the first huddle breaks — a headless test can never see it, and it is the
  // very first thing a player does.
  function placeAll() {
    for (const a of actors) {
      const s = lineupSpot(a);
      a.station = s; a.x = s.x; a.z = s.z; a.vx = 0; a.vz = 0;
    }
  }

  function toHuddle() {
    G.phase = 'huddle';
    G.play = null; G.routes = {}; G.thrown = false; G.crossed = false;
    G.carrier = null; G.blitzT = 0; G.liveT = 0;
    G.qb = G.offence()[0];
    G.ball.holder = null; G.ball.inAir = false; G.ball.hike = false;
    G.ball.x = G.scrimmage; G.ball.z = 0; G.ball.y = 0.3;
    G.ball.vx = G.ball.vy = G.ball.vz = 0;
    G.aim.active = false; G.aim.charge = 0; G.aim.pred = null;
    G.throwWind = 0; G.pending = null; G.spotlight = null;
    for (const a of actors) {
      MECH.resetMech(a);
      a.route = null; a.routeI = 0; a.assign = null;
      a.tagged = false; a.respawnT = 0; a.stun = 0;
      const s = lineupSpot(a);
      if (a.team !== G.possession) s.x += G.dir() * (rng() - 0.5) * 1.2;
      a.station = s;                        // bots walk here during the huddle
      // ...but a touchdown moves the line half a field. Trot back when it is
      // close, reset when it is a hike.
      if (Math.hypot(s.x - a.x, s.z - a.z) > 12) { a.x = s.x; a.z = s.z; a.vx = 0; a.vz = 0; }
    }
    G.drive++;
  }

  // ── the four calls + Call Your Shots ─────────────────────
  function callPlay(key) {
    if (G.phase !== 'huddle' && G.phase !== 'set') return false;
    if (!PLAYS[key]) return false;
    G.play = key;
    const d = G.dir();
    G.routes = {};
    const recs = G.offence();
    for (const [slot, wps] of Object.entries(PLAYS[key].routes)) {
      const a = recs[+slot];
      const s = lineupSpot(a);
      G.routes[+slot] = wps.map(([along, lat]) =>
        ({ x: clamp(s.x + d * along, -F.field.goalX - F.field.endzone + 1, F.field.goalX + F.field.endzone - 1),
           z: clamp(s.z + lat, -F.field.width / 2 + 0.8, F.field.width / 2 - 0.8) }));
    }
    G.phase = 'set';
    return true;
  }
  // "Call Your Shots": overwrite one receiver's route with a hand-drawn one.
  // Points arrive in world coords from the control layer, already on the field.
  function setRoute(slot, pts) {
    if (G.phase !== 'set' && G.phase !== 'huddle') return false;
    if (slot < 2 || slot > 4 || !Array.isArray(pts) || !pts.length) return false;
    G.routes[slot] = pts.slice(0, K().routeMax).map(p =>
      ({ x: clamp(p.x, -F.field.goalX - F.field.endzone + 1, F.field.goalX + F.field.endzone - 1),
         z: clamp(p.z, -F.field.width / 2 + 0.8, F.field.width / 2 - 0.8) }));
    return true;
  }

  function snap() {
    if (G.phase !== 'set' || !G.play) return false;
    G.phase = 'hike';
    G.ball.hike = true; G.ball.t = 0;
    for (const a of G.offence()) {
      const slot = slotOf(a);
      a.route = G.routes[slot] ? G.routes[slot].slice() : null;
      a.routeI = 0;
    }
    // man assignments: each cover man takes the receiver he lined up over
    const recs = G.offence(), defs = G.defence();
    defs[2].assign = recs[2]; defs[3].assign = recs[3]; defs[4].assign = recs[4];
    say('', 0, 'hike');
    return true;
  }

  // ── throwing ─────────────────────────────────────────────
  // Two doors into the same mechanic. The player CHARGES (footmech decides
  // the pitch from how long he held it, and scatters the ball if his feet
  // were moving or a rusher was in his face); a bot or a test calls
  // throwBall directly with the charge it wants and the ball leaves now.
  function throwBall(tx, tz, charge = 0.5) {
    if (!MECH.canThrow(G)) return false;
    const pred = MECH.predictThrow(G, tx, tz, charge);
    if (!pred || pred.dist < 1.2) return false;
    G.pending = { ...pred, charge };
    if (!MECH.launch(G)) return false;
    say('', 0, 'throw');
    return true;
  }
  G.throwBall = throwBall;

  // ── the down ends ────────────────────────────────────────
  function dead(spotX, why, color = 0xfff8ea) {
    if (G.phase !== 'live') return;
    G.phase = 'dead'; G.deadT = K().deadT;
    G.lastResult = why;
    const F2 = K().field;
    const d = G.dir();
    const gained = (spotX - G.scrimmage) * d;
    const spot = clamp(spotX, -F2.goalX + 0.5, F2.goalX - 0.5);
    if (why !== 'incomplete') G.scrimmage = spot;
    G.down++;
    if (G.down > 4) {
      G.possession = G.possession === 'blue' ? 'red' : 'blue';
      G.down = 1;
      say('TURNOVER ON DOWNS', TEAMS[G.possession].color, 'turnover');
    } else if (why === 'incomplete') {
      say(`DOWN ${G.down} — INCOMPLETE`, color, 'down');
    } else {
      say(`DOWN ${G.down} — ${gained >= 0 ? '+' : ''}${gained.toFixed(0)}`, color, 'down');
    }
  }
  function touchdown(team) {
    if (G.phase !== 'live') return;
    G.phase = 'dead'; G.deadT = K().celebrateT;
    G.score[team]++;
    say('TOUCHDOWN!', TEAMS[team].color, 'td');
    G.lastResult = 'touchdown';
    if (G.score[team] >= K().firstTo) { G.over = team; say('', 0, 'gameover'); return; }
    // backyard rule: the other team takes over from their own end
    G.possession = team === 'blue' ? 'red' : 'blue';
    G.down = 1;
    G.scrimmage = (G.possession === 'blue' ? -1 : 1) * (K().field.goalX - 4);
  }
  function intercepted(by) {
    // possession flips LIVE — pick it off and run it back
    G.possession = by.team;
    G.down = 1;
    G.thrown = true; G.crossed = true;       // no lateral silliness after a pick
    G.liveT = 0; G.blitzT = 0;               // the returner gets a fresh play clock
    G.carrier = by;
    G.ball.holder = by; G.ball.inAir = false;
    say('INTERCEPTED!', TEAMS[by.team].color, 'int');
  }

  // ── per-tick brains ──────────────────────────────────────
  // The fallback bots below are just enough to close the loop. Real brains
  // (pursuit angles, leverage coverage, QB reads) plug in via setBrains —
  // still pure, still deterministic, just written in their own module.
  let brains = null;
  G.setBrains = b => { brains = b || null; };
  function botInput(a, dt) {
    if (brains && (G.phase === 'live' || G.phase === 'hike')) {
      const off = a.team === G.possession;
      const slot = actors.filter(x => x.team === a.team).indexOf(a);
      const ext = off ? brains.offenseInput?.(G, a, slot) : brains.defenseInput?.(G, a, slot);
      if (ext) return ext;
    }
    const inp = { dx: 0, dz: 0, dash: false, primary: false, special: false,
                  aimX: a.x, aimZ: a.z + 1 };
    const seek = (x, z, dash = false) => {
      const dx = x - a.x, dz = z - a.z, d = Math.hypot(dx, dz);
      if (d > 0.25) { inp.dx = dx / d; inp.dz = dz / d; inp.dash = dash && d > 3; }
      inp.aimX = x; inp.aimZ = z;
    };
    const off = a.team === G.possession;
    const slot = slotOf(a);
    const d = G.dir();

    if (G.phase === 'huddle' || G.phase === 'set' || G.phase === 'hike') {
      if (a.station) seek(a.station.x, a.station.z);
      return inp;
    }
    if (G.phase !== 'live') return inp;

    if (G.carrier === a) {
      // run for daylight: toward the goal line, bending away from the nearest chaser
      let gx = d * (K().field.goalX + 2), gz = a.z;
      let nd = 1e9, nx = 0, nz = 0;
      for (const e of G.defence()) {
        const dd = Math.hypot(e.x - a.x, e.z - a.z);
        if (dd < nd) { nd = dd; nx = e.x; nz = e.z; }
      }
      if (nd < 5) gz = a.z + (a.z > nz ? 3.5 : -3.5);
      seek(gx, clamp(gz, -K().field.width / 2 + 1, K().field.width / 2 - 1), true);
      return inp;
    }
    if (off) {
      if (a === G.qb && !G.thrown && G.ball.holder === a) {
        // bot QB: wait for a route to come open, then throw; scramble if the rush arrives
        const rushNear = G.defence().some(e => Math.hypot(e.x - a.x, e.z - a.z) < 2.2);
        if (G.liveT > 1.1 || rushNear) {
          let best = null, bestSep = -1;
          for (const r of G.receivers()) {
            let sep = 1e9;
            for (const e of G.defence()) sep = Math.min(sep, Math.hypot(e.x - r.x, e.z - r.z));
            if (sep > bestSep) { bestSep = sep; best = r; }
          }
          if (best && (bestSep > 2.6 || G.liveT > 2.6)) {
            const lead = 1.1;
            throwBall(best.x + best.vx * lead * 0.35, best.z + best.vz * lead * 0.35);
          } else if (rushNear) {
            seek(a.x - d * 2.5, a.z + (a.z > 0 ? -3 : 3));
          }
        }
        return inp;
      }
      if (a.route && a.routeI < a.route.length) {
        const w = a.route[a.routeI];
        seek(w.x, w.z, true);
        if (Math.hypot(w.x - a.x, w.z - a.z) < 0.9) a.routeI++;
        return inp;
      }
      // route done: work back toward the QB's throwing lane, stay a target
      if (!G.thrown && G.qb) seek(a.x + d * 0.5, a.z + (G.qb.z > a.z ? 0.6 : -0.6));
      return inp;
    }
    // defence
    if (G.ball.inAir) {
      // play the ball if it lands near you
      const dd = Math.hypot(G.ball.tx - a.x, G.ball.tz - a.z);
      if (dd < 7) { seek(G.ball.tx, G.ball.tz, true); return inp; }
    }
    if (G.carrier) { seek(G.carrier.x, G.carrier.z, true); return inp; }
    if (slot <= 1) {
      // rusher: hold the count, then go get the QB
      if (G.blitzT >= K().blitzCount && G.qb) seek(G.qb.x, G.qb.z, true);
      else seek(G.scrimmage + d * 1.2, a.z);
      return inp;
    }
    if (a.assign) {
      // man coverage: mirror your man from the goal side
      seek(a.assign.x + d * 1.1, a.assign.z, true);
      return inp;
    }
    return inp;
  }

  // ── the step ─────────────────────────────────────────────
  function step(dt, playerInput) {
    for (const e of G.events) e.t -= dt;
    G.events = G.events.filter(e => e.t > 0);
    if (G.over) return;

    if (G.phase === 'countdown') {
      G.countT -= dt;
      const n = Math.ceil(G.countT);
      if (n < G.countSaid) { G.countSaid = n; if (n >= 1 && n <= 3) say(String(n), 0xfff8ea, 'count'); }
      if (G.countT <= 0) { toHuddle(); say('FIRST TO ' + K().firstTo + ' — 4 DOWNS TO THE HOUSE', 0xffd94a, 'go'); }
      return;
    }
    if (G.phase === 'dead') {
      G.deadT -= dt;
      stepBodies(dt, playerInput);
      if (G.deadT <= 0) toHuddle();
      return;
    }
    if (G.phase === 'hike') {
      G.ball.t += dt;
      const q = G.qb, c = G.offence()[1];
      const k = clamp(G.ball.t / K().hikeT, 0, 1);
      G.ball.x = c.x + (q.x - c.x) * k; G.ball.z = c.z + (q.z - c.z) * k;
      G.ball.y = 0.5 + Math.sin(k * Math.PI) * 0.5;
      if (k >= 1) {
        G.ball.holder = q; G.carrier = q;
        G.phase = 'live'; G.liveT = 0; G.blitzT = 0;
      }
      stepBodies(dt, playerInput);
      return;
    }
    if (G.phase === 'huddle' || G.phase === 'set') {
      stepBodies(dt, playerInput);
      return;
    }

    // ── live ──
    G.liveT += dt; G.blitzT += dt;
    stepBodies(dt, playerInput);

    const b = G.ball, F2 = K().field, d = G.dir();

    // the QB tucking it and crossing the line turns the play into a run
    if (!G.thrown && G.carrier === G.qb && G.qb &&
        (G.qb.x - G.scrimmage) * d > 0.4) G.crossed = true;

    // the windup: the ball has not left yet and he is a sitting duck
    if (G.throwWind > 0) {
      G.throwWind -= dt;
      if (G.throwWind <= 0 && G.pending) { MECH.launch(G); say('', 0, 'throw'); }
    }

    if (b.inAir) {
      const out = MECH.stepFlight(G, dt);
      if (out) { const r = resolveBall(out); if (r) return r; }
    } else if (b.holder) {
      b.x = b.holder.x; b.z = b.holder.z; b.y = 1.0;
    }

    // contact: a committed dive, or hands on you that fill a wrap meter —
    // and the carrier's counters, which are what make either survivable
    if (G.carrier && G.phase === 'live') {
      const car = G.carrier;
      MECH.stepBlocks(G, dt);
      if (MECH.resolveContact(G, dt) === 'down') {
        car.m.prone = Math.max(car.m.prone, 0.5);
        const behind = (car.x - G.scrimmage) * d < -0.5;
        if (car === G.qb && !G.thrown && behind) { say('', 0, 'sack'); return dead(car.x, 'sacked'); }
        say('', 0, 'tackle');
        return dead(car.x, 'tackled');
      }
      // scoring and the sidelines
      if (car.x * dOf(car.team) > F2.goalX) return touchdown(car.team);
      if (Math.abs(car.z) > F2.width / 2) return dead(car.x, 'out of bounds');
      if (Math.abs(car.x) > F2.goalX + F2.endzone) return dead(car.x, 'out of bounds');
    }
  }
  const dOf = team => (team === 'blue' ? 1 : -1);

  // What the catch window handed back. Every branch here is a real football
  // outcome, and each one is reachable by a player's own hands.
  function resolveBall(out) {
    const b = G.ball, C = K().catching;
    switch (out.kind) {
      case 'catch': {
        b.inAir = false; b.holder = out.who; G.carrier = out.who;
        if (out.dove) {
          // He laid out for it: he has the ball and the play ends where he
          // lands — but the goal line has to be checked FIRST, because dead()
          // clamps the spot inside the field and would turn a lay-out score
          // into first-and-goal at the half-metre line.
          out.who.m.prone = Math.max(out.who.m.prone, 0.45);
          say('', 0, 'divecatch');
          if (out.who.x * G.dir() > K().field.goalX) return touchdown(out.who.team);
          return dead(out.who.x, 'diving catch');
        }
        if (!out.stride) out.who.m.gather = C.pressT;   // bobbled it, lost a beat
        say('', 0, out.stride ? 'catchStride' : 'catch');
        return null;
      }
      case 'int':
        b.inAir = false;
        intercepted(out.who);
        return null;
      case 'swat':
        b.inAir = false; b.y = C.landH;
        say('BROKEN UP', TEAMS[out.who.team].color, 'swat');
        return dead(G.scrimmage, 'incomplete');
      case 'drop':
        b.inAir = false; b.y = C.landH;
        say('DROPPED', 0xfff8ea, 'drop');
        return dead(G.scrimmage, 'incomplete');
      default:
        say('', 0, 'incomplete');
        return dead(G.scrimmage, 'incomplete');
    }
  }

  function stepBodies(dt, playerInput) {
    const inputs = actors.map(a => {
      const ext = typeof playerInput === 'function' ? playerInput(a) : (a.isPlayer ? playerInput : null);
      return ext || botInput(a, dt);
    });
    // Timers and stamina first, then throttle each actor by what his current
    // state allows — the kernel reads input magnitude as throttle, so being
    // wrapped, blocked, gassed or gathering a bobble all cost real speed.
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i];
      MECH.stepMech(G, a, dt);
      const mul = MECH.speedMul(G, a);
      if (mul !== 1) { inputs[i] = { ...inputs[i], dx: inputs[i].dx * mul, dz: inputs[i].dz * mul }; }
    }
    for (let i = 0; i < actors.length; i++) updateAim(actors[i], inputs[i], dt);
    for (let i = 0; i < actors.length; i++) stepActor(actors[i], inputs[i], dt, world);
    // the committed moves add their own displacement — a dive really travels
    for (const a of actors) MECH.applyMechMotion(G, a, dt);
    separateBodies(actors, world);
    // Keep everyone on the yard — EXCEPT the carrier's sidelines. Clamping his
    // z walled him in and made out-of-bounds unreachable; he must be free to
    // step out so the whistle can catch him at the spot.
    const F2 = K().field;
    for (const a of actors) {
      a.x = clamp(a.x, -F2.goalX - F2.endzone + a.r, F2.goalX + F2.endzone - a.r);
      if (a !== G.carrier) a.z = clamp(a.z, -F2.width / 2 + a.r, F2.width / 2 - a.r);
      else a.z = clamp(a.z, -F2.width / 2 - 2, F2.width / 2 + 2);
    }
  }

  placeAll();
  return G;
}

// ─────────────────────────────────────────────────────────────
// FOOTMECH — the mechanics that belong to football and nothing else.
//
// The first cut of this mode borrowed CTF's lunge for tackling, threw the
// ball with one instant click, and resolved catches with a single-frame
// proximity test at the moment of arrival: within 1.3m you had it, outside
// it the ball hit the grass. That is why it played badly — there was no
// skill to express and no agency at the moment that matters.
//
// Everything here replaces that with systems that have a decision, a cost
// and a counter:
//
//   THE THROW    hold to wind up. Charge picks the pitch — a floated TOUCH
//                ball, a NORMAL throw, or a flat BULLET — and the cursor
//                picks the spot. You are throwing at grass, leading your
//                man, and your feet matter: throwing on the run or with a
//                rusher in your face scatters the ball. Release costs a
//                windup you can be sacked during.
//
//   THE FLIGHT   the ball is a physical object, not a lookup. It arcs by
//                type, and ANYONE it passes low over can play it. That
//                makes the bullet's risk emergent rather than authored:
//                flat balls are catchable early and in stride, and they are
//                also the ones that get jumped over the middle. A touch
//                ball sails safely over traffic but hangs long enough for
//                the safety to arrive.
//
//   THE CATCH    a window, not an instant. As the ball drops into reach you
//                press to attack it; timing near the arrival earns an
//                in-stride catch that keeps your speed, sloppy timing gets
//                a bobble, and out of reach you can DIVE for it — extra
//                reach, but you land on your face and the play ends there.
//                Doing nothing still attempts a catch at lower quality, so
//                a player who never learns the timing can still move the
//                ball. Defenders in the same window swat it down or take it.
//
//   THE CARRY    juke, spin, truck, sprint — on a stamina bar so none of it
//                is spam. Each one beats a different defensive answer.
//
//   THE TACKLE   the dive is a commitment: it travels, it can miss, and a
//                miss puts you on the ground. Contact without a dive is a
//                WRAP that slows the carrier while it fills, and a second
//                defender arriving fills it twice as fast.
//
// The counters close a loop, which is where the skill lives:
//   dive beats a runner going straight · juke beats a dive · wrap beats a
//   juke · spin beats a wrap · truck beats a defender who stood you up ·
//   and a dive beats a truck, because you cannot stiff-arm a man's ankles.
//
// Pure, like everything the sim touches: no THREE, no DOM, no Math.random,
// no Date.now. Randomness is per-actor xorshift off a.seed, every constant
// lives in CFG.football, and the same input twice gives the same football.
// ─────────────────────────────────────────────────────────────
import { CFG } from './config.js';

const K = () => CFG.football;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist2 = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);

// deterministic per-actor noise, same generator the brains use
function rnd(a) {
  a.seed ^= a.seed << 13; a.seed ^= a.seed >>> 17; a.seed ^= a.seed << 5;
  return ((a.seed >>> 0) / 4294967296);
}

// ── per-actor mechanical state ───────────────────────────────
export function initMech(a) {
  a.m = {
    stam: 1,                       // 0..1, the budget every special move spends
    juke: 0, jukeX: 0, jukeZ: 0,   // active timers + direction
    spin: 0, truck: 0,
    dive: 0, diveX: 0, diveZ: 0, diveHit: false, diveDur: 1, diveSpd: 0,
    prone: 0,                      // face down: whiffed dive, dive catch, trucked
    wrapT: 0,                      // how long THIS carrier has been wrapped
    wrapBy: 0,                     // how many hands are on him right now
    block: 0, blockedBy: null,     // engaged as a blocker / being blocked
    catchPress: 0,                 // fresh press window for attacking the ball
    catchLock: 0,                  // re-press cooldown, stops mashing
    gather: 0,                     // bobble recovery: you have it but you're slow
    lastMove: '',                  // for the view's callouts
    moveT: 0,
  };
  return a.m;
}
export function resetMech(a) {
  const m = a.m || initMech(a);
  m.stam = 1;
  m.juke = m.spin = m.truck = m.dive = m.prone = 0;
  m.diveDur = 1; m.diveSpd = 0;
  m.wrapT = 0; m.wrapBy = 0; m.block = 0; m.blockedBy = null;
  m.catchPress = 0; m.catchLock = 0; m.gather = 0; m.diveHit = false;
  m.lastMove = ''; m.moveT = 0;
}

export const busy = a => a.m && (a.m.dive > 0 || a.m.spin > 0 || a.m.truck > 0 || a.m.prone > 0);
export const canAct = a => a.m && a.m.prone <= 0 && a.m.dive <= 0 && a.m.spin <= 0 && a.m.truck <= 0;
export const moving = a => Math.hypot(a.vx || 0, a.vz || 0);

// How fast this actor may move right now, as a multiplier the sim applies to
// his input. Every state that should cost you speed is expressed here rather
// than scattered through the step.
export function speedMul(G, a) {
  const C = K(), m = a.m;
  if (!m) return 1;
  if (m.prone > 0) return 0;
  if (m.gather > 0) return C.carry.gatherSlow;
  let s = 1;
  if (m.block > 0) s *= C.block.slow;                 // engaged with a blocker
  if (G.carrier === a && m.wrapBy > 0) s *= C.tackle.wrapSlow;
  if (m.stam < C.carry.tiredAt) s *= C.carry.tiredMul;  // gassed
  return s;
}

// ── timers, stamina, and the moves' own motion ───────────────
export function stepMech(G, a, dt) {
  const C = K(), m = a.m || initMech(a);
  const dec = k => { if (m[k] > 0) m[k] = Math.max(0, m[k] - dt); };
  dec('juke'); dec('spin'); dec('truck'); dec('prone');
  dec('catchPress'); dec('catchLock'); dec('gather'); dec('block');
  if (m.moveT > 0) m.moveT = Math.max(0, m.moveT - dt);
  if (m.dive > 0) {
    m.dive = Math.max(0, m.dive - dt);
    if (m.dive === 0 && !m.diveHit) m.prone = C.tackle.diveWhiff;   // you missed
  }
  if (m.block > 0 && m.blockedBy && dist2(a.x, a.z, m.blockedBy.x, m.blockedBy.z) > C.block.engageR * 1.8)
    { m.block = 0; m.blockedBy = null; }
  // stamina: spent by the moves, refilled whenever you are not sprinting
  const sprinting = G.carrier === a && moving(a) > C.carry.sprintAt;
  m.stam = clamp(m.stam + (sprinting ? -C.carry.sprintDrain : C.carry.stamRegen) * dt, 0, 1);
}

// The committed moves are kinematic: they add their own displacement on top
// of whatever the actor kernel did, so a dive really travels and a juke
// really leaves the ground you were standing on.
export function applyMechMotion(G, a, dt) {
  const C = K(), m = a.m;
  if (!m) return;
  let vx = 0, vz = 0;
  if (m.dive > 0) {
    // Each dive carries its own duration and speed: a tackle LAUNCHES, a
    // reaching catch merely extends. Normalising both by the tackle's timing
    // made receivers overshoot the ball they were diving for.
    const k = clamp(m.dive / (m.diveDur || C.tackle.diveT), 0, 1);
    vx += m.diveX * (m.diveSpd || C.tackle.diveSpeed) * k;
    vz += m.diveZ * (m.diveSpd || C.tackle.diveSpeed) * k;
  }
  if (m.juke > 0) {
    const k = Math.sin((m.juke / C.carry.jukeT) * Math.PI * 0.5);
    vx += m.jukeX * C.carry.jukeSpeed * k;
    vz += m.jukeZ * C.carry.jukeSpeed * k;
  }
  if (m.spin > 0) {
    // a spin carries you forward through the tackle, not sideways
    const d = G.dir && G.carrier === a ? G.dir() : 1;
    vx += d * C.carry.spinSpeed * (m.spin / C.carry.spinT);
  }
  if (m.truck > 0) {
    const s = Math.hypot(a.vx || 0, a.vz || 0) || 1;
    vx += ((a.vx || 0) / s) * C.carry.truckSpeed * (m.truck / C.carry.truckT);
    vz += ((a.vz || 0) / s) * C.carry.truckSpeed * (m.truck / C.carry.truckT);
  }
  if (vx || vz) { a.x += vx * dt; a.z += vz * dt; a.vx = vx; a.vz = vz; }
}

// ── the moves ────────────────────────────────────────────────
const spend = (a, cost) => { if (a.m.stam < cost) return false; a.m.stam -= cost; return true; };
const mark = (a, name) => { a.m.lastMove = name; a.m.moveT = 0.5; };
// every committed move counts itself — the gate proves the loop is used
const tick = (G, k) => { if (G.tally) G.tally[k] = (G.tally[k] || 0) + 1; };

export function tryJuke(G, a, dirX, dirZ) {
  const C = K().carry;
  if (!canAct(a) || a.m.juke > 0) return false;
  const d = Math.hypot(dirX, dirZ);
  if (d < 0.01) return false;
  if (!spend(a, C.jukeCost)) return false;
  a.m.juke = C.jukeT; a.m.jukeX = dirX / d; a.m.jukeZ = dirZ / d;
  mark(a, 'juke');
  tick(G, 'juke');
  return true;
}
export function trySpin(G, a) {
  const C = K().carry;
  if (!canAct(a)) return false;
  if (!spend(a, C.spinCost)) return false;
  a.m.spin = C.spinT;
  // a spin sheds every hand on you — that is the whole point of it
  a.m.wrapT = 0; a.m.wrapBy = 0;
  mark(a, 'spin');
  tick(G, 'spin');
  return true;
}
export function tryTruck(G, a) {
  const C = K().carry;
  if (!canAct(a)) return false;
  if (!spend(a, C.truckCost)) return false;
  a.m.truck = C.truckT;
  mark(a, 'truck');
  tick(G, 'truck');
  return true;
}
export function tryDive(G, a, aimX, aimZ) {
  const C = K().tackle;
  if (!canAct(a)) return false;
  let dx = aimX - a.x, dz = aimZ - a.z;
  const d = Math.hypot(dx, dz) || 1;
  a.m.dive = C.diveT; a.m.diveX = dx / d; a.m.diveZ = dz / d; a.m.diveHit = false;
  a.m.diveDur = C.diveT; a.m.diveSpd = C.diveSpeed;
  mark(a, 'dive');
  tick(G, 'dive');
  return true;
}
// Attacking the ball: the press that turns an automatic attempt into a
// timed one. Locked briefly after each press so mashing cannot help.
export function pressCatch(G, a) {
  const C = K().catching;
  if (!a.m || a.m.catchLock > 0 || a.m.prone > 0) return false;
  a.m.catchPress = C.pressT; a.m.catchLock = C.pressLock;
  tick(G, 'press');
  return true;
}
export function diveCatch(G, a) {
  const C = K().catching;
  if (!canAct(a)) return false;
  const b = G.ball;
  let dx = b.x - a.x, dz = b.z - a.z;
  const d = Math.hypot(dx, dz) || 1;
  a.m.dive = C.diveT; a.m.diveX = dx / d; a.m.diveZ = dz / d; a.m.diveHit = false;
  a.m.diveDur = C.diveT; a.m.diveSpd = C.diveSpeed;
  a.m.catchPress = C.pressT;
  mark(a, 'divecatch');
  tick(G, 'divecatch');
  return true;
}

// ── the throw ────────────────────────────────────────────────
export function throwType(charge) {
  const T = K().throw;
  return charge < T.touchAt ? 'touch' : charge > T.bulletAt ? 'bullet' : 'normal';
}
// What the ball will do if released right now — the view draws its arc from
// this, so what you are shown is exactly what gets thrown.
export function predictThrow(G, tx, tz, charge) {
  const T = K().throw, q = G.qb;
  if (!q) return null;
  const type = throwType(charge);
  let dx = tx - q.x, dz = tz - q.z;
  let dist = Math.hypot(dx, dz);
  if (dist > T.leadCap) { const s = T.leadCap / dist; tx = q.x + dx * s; tz = q.z + dz * s; dist = T.leadCap; }
  const speed = T.speed[type];
  const air = Math.max(T.minAir, dist / speed);
  const peak = T.arc[type] * Math.sqrt(Math.max(1, dist));
  return { type, tx, tz, dist, speed, air, peak, scatter: scatterOf(G, charge, dist) };
}
function scatterOf(G, charge, dist) {
  const T = K().throw, q = G.qb;
  if (!q) return 0;
  let s = T.scatterBase;
  const spd = Math.hypot(q.vx || 0, q.vz || 0) / Math.max(1, K().runnerSpeed);
  s += spd * T.scatterMove;                                  // set your feet
  let press = 0;
  for (const e of G.defence()) press = Math.max(press, 1 - dist2(q.x, q.z, e.x, e.z) / T.pressR);
  s += Math.max(0, press) * T.scatterPress;                  // and get it off clean
  if (throwType(charge) === 'bullet') s += T.scatterBullet;
  return s * (dist / 10);
}

export function beginCharge(G) {
  if (!canThrow(G)) return false;
  G.aim.active = true; G.aim.charge = 0;
  return true;
}
export function stepCharge(G, dt, tx, tz) {
  const T = K().throw;
  if (!G.aim.active) return;
  G.aim.charge = clamp(G.aim.charge + dt * T.chargeRate, 0, 1);
  G.aim.tx = tx; G.aim.tz = tz;
  G.aim.pred = predictThrow(G, tx, tz, G.aim.charge);
}
export const canThrow = G =>
  G.phase === 'live' && !G.thrown && !G.crossed && G.qb && G.ball.holder === G.qb &&
  G.throwWind <= 0 && canAct(G.qb);

// Release starts a windup you can be sacked during — holding a full bullet
// with a free rusher closing is a real bet, not a free option.
export function releaseThrow(G, tx, tz) {
  if (!canThrow(G)) { G.aim.active = false; return false; }
  const pred = predictThrow(G, tx, tz, G.aim.charge);
  if (!pred || pred.dist < 1.2) { G.aim.active = false; return false; }
  G.throwWind = K().throw.windup;
  G.pending = { ...pred, charge: G.aim.charge };
  G.aim.active = false;
  return true;
}
// Called by the sim when the windup finishes: the ball actually leaves.
export function launch(G) {
  const p = G.pending, q = G.qb, b = G.ball;
  if (!p || !q) return false;
  const a = q, ang = rnd(a) * Math.PI * 2, r = rnd(a) * p.scatter;
  b.tx = p.tx + Math.cos(ang) * r;
  b.tz = p.tz + Math.sin(ang) * r;
  b.sx = q.x; b.sz = q.z; b.sy = K().throw.releaseH;
  b.x = b.sx; b.z = b.sz; b.y = b.sy;
  b.air = Math.max(K().throw.minAir, dist2(b.sx, b.sz, b.tx, b.tz) / p.speed);
  b.peak = p.peak; b.type = p.type; b.t = 0;
  b.inAir = true; b.holder = null; b.from = q; b.live = 0;
  // Nobody carries a ball that is in the air. Leaving the passer as the
  // carrier meant a defender could wrap him after the release and end a play
  // whose pass was still in flight — erasing a completion and spotting the
  // ball back at his feet.
  G.carrier = null;
  G.thrown = true; G.pending = null;
  return true;
}

// ── flight and the catch window ──────────────────────────────
// Returns null while the ball is still up, or an outcome for the sim to act
// on: {kind:'catch'|'int'|'swat'|'drop'|'ground', who}
export function stepFlight(G, dt) {
  const C = K().catching, b = G.ball;
  if (!b.inAir) return null;
  b.t += dt; b.live += dt;
  const k = clamp(b.t / b.air, 0, 1);
  b.x = b.sx + (b.tx - b.sx) * k;
  b.z = b.sz + (b.tz - b.sz) * k;
  b.y = b.sy * (1 - k) + C.landH * k + b.peak * 4 * k * (1 - k);

  // Anyone the ball passes low over may play it. Nothing is scripted toward
  // the intended man — this is what makes a flat ball through traffic a
  // genuine risk and a floated one over the top genuinely safe.
  if (b.y <= C.catchH && b.live > C.selfLock) {
    let off = null, offS = -1e9, def = null, defS = -1e9;
    const travelled = dist2(b.sx, b.sz, b.x, b.z);
    for (const a of G.actors) {
      if (a.m?.prone > 0 && a.m.dive <= 0) continue;
      if (a === b.from && b.live < C.throwerLock) continue;
      // A pass is not catchable by your OWN side until it has cleared the
      // line — otherwise the centre standing a metre in front of the QB
      // snags his own quarterback's throw, which is what measurement showed
      // happening. The defence has no such rule: batting the ball down at
      // the line is football.
      if (a.team === G.possession && travelled < C.offMinDist) continue;
      const d = dist2(a.x, a.z, b.x, b.z);
      let reach = C.reachR;
      if (a.m?.dive > 0) reach += C.diveReach;                  // laid out for it
      if (a.m?.catchPress > 0) reach += C.pressReach;           // attacking the ball
      if (d > reach) continue;
      // score: how well you have the ball played, best wins the collision
      let s = reach - d;
      if (a.m?.catchPress > 0) s += C.pressBonus;
      if (a.m?.dive > 0) s += C.diveBonus;
      if (a.team === G.possession) { if (s > offS) { offS = s; off = a; } }
      else if (s > defS) { defS = s; def = a; }
    }
    if (def && defS >= offS) {
      // The defender got there first — but a takeaway has to be EARNED. He
      // only comes down with it if he actually attacked the ball (pressed or
      // laid out); a body that merely happens to be in the path bats it down.
      // Deliberately asymmetric with the receiver's hands-off attempt: the
      // offence gets a floor so casual play still moves the ball, while every
      // interception is somebody's timing.
      const attacked = def.m.catchPress > 0 || def.m.dive > 0;
      const clean = attacked && defS > C.pickAt && (!off || defS > offS + C.pickMargin);
      return clean ? { kind: 'int', who: def } : { kind: 'swat', who: def, at: off };
    }
    if (off) {
      const contested = !!def || G.actors.some(e =>
        e.team !== G.possession && dist2(e.x, e.z, b.x, b.z) < C.contestR);
      let drop = C.dropBase;
      if (off.m.catchPress <= 0) drop += C.dropAuto;            // hands-off attempt
      if (contested) drop += C.dropContest;
      if (b.type === 'bullet' && dist2(b.sx, b.sz, b.x, b.z) < C.bulletNear) drop += C.dropBullet;
      const back = (off.vx || 0) * (b.tx - b.sx) + (off.vz || 0) * (b.tz - b.sz);
      if (back < 0) drop += C.dropBack;                          // over the shoulder
      drop = clamp(drop, 0, C.dropMax);
      if (rnd(off) < drop) return { kind: 'drop', who: off };
      // clean hands: a well-timed press keeps your feet, anything else gathers
      const stride = off.m.catchPress > 0 && off.m.dive <= 0;
      return { kind: 'catch', who: off, stride, dove: off.m.dive > 0 };
    }
  }
  if (k >= 1) { b.y = C.landH; b.inAir = false; return { kind: 'ground' }; }
  return null;
}

// ── contact: dives, wraps, blocks, and breaking them ─────────
// Returns 'down' when the carrier is on the ground, else null.
export function resolveContact(G, dt) {
  const C = K(), car = G.carrier;
  if (!car) return null;
  const m = car.m;
  let hands = 0, gang = 0;

  for (const e of G.actors) {
    if (e.team === car.team || !e.m) continue;
    const d = dist2(e.x, e.z, car.x, car.z);

    // a committed dive: it connects on contact, and the carrier's counters
    // are what can still save him
    if (e.m.dive > 0 && !e.m.diveHit && d < C.tackle.diveR) {
      e.m.diveHit = true;
      if (m.juke > 0) { e.m.prone = C.tackle.diveWhiff; markBreak(G, car, 'juked'); continue; }
      if (m.spin > 0 && rnd(car) < C.carry.spinVsDive) { e.m.prone = C.tackle.diveWhiff; markBreak(G, car, 'spun'); continue; }
      return 'down';                                   // clean hit, he is down
    }
    if (e.m.dive > 0) continue;                        // airborne, not wrapping

    if (d < C.tackle.wrapR + car.r * 0.2) {
      // a truck runs over a defender who is standing you up, unless he is
      // already low — you cannot stiff-arm a man's ankles
      if (m.truck > 0 && e.m.prone <= 0) {
        e.m.prone = C.carry.truckStun; markBreak(G, car, 'trucked'); continue;
      }
      if (e.m.prone > 0) continue;
      hands++; if (hands > 1) gang++;
    }
  }
  m.wrapBy = hands;
  if (hands > 0) {
    if (m.spin > 0) { m.wrapT = 0; return null; }      // spinning out of it
    m.wrapT += dt * C.tackle.wrapFill * (1 + gang * (C.tackle.gangMul - 1));
    if (m.wrapT >= 1) return 'down';
  } else {
    m.wrapT = Math.max(0, m.wrapT - dt * C.tackle.wrapDrain);
  }
  return null;
}
function markBreak(G, car, how) {
  car.m.lastMove = how; car.m.moveT = 0.6;
  G.events.push({ text: '', color: 0, t: 1.0, kind: 'broke', how });
  G.tally && (G.tally.broke = (G.tally.broke || 0) + 1);
}

// Blockers: hold your man. An engaged defender is slowed by speedMul for as
// long as his blocker stays with him — break contact (or beat him to a spot)
// and you are free again the moment the timer laps. There is deliberately no
// shed cooldown: measured, blocking already holds 94% of live frames and the
// rush still gets home 1.8 times a game, so a grace period on top would only
// hand the defence a game it is already winning.
export function stepBlocks(G, dt) {
  const C = K().block;
  for (const a of G.actors) {
    if (!a.m || a.team !== G.possession || a === G.carrier) continue;
    if (a.m.prone > 0) continue;
    for (const e of G.defence()) {
      if (!e.m || e.m.dive > 0 || e.m.prone > 0) continue;
      if (dist2(a.x, a.z, e.x, e.z) < C.engageR) {
        if (e.m.block <= 0) { e.m.block = C.shedT; e.m.blockedBy = a; }
        break;
      }
    }
  }
}

// Who the eyes should be on while the ball is up: the man with the best
// claim on it. The control layer hands the player this actor.
export function ballClaimant(G, team) {
  const b = G.ball;
  if (!b.inAir) return null;
  let best = null, bd = 1e9;
  for (const a of G.actors) {
    if (a.team !== team) continue;
    const d = dist2(a.x, a.z, b.tx, b.tz);
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}

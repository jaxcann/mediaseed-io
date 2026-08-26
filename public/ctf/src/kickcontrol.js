import { CFG } from './config.js';

// ─────────────────────────────────────────────────────────────
// Backyard Baseball control: you are the whole TEAM, not one kid.
//
//   Kicking  — you're the kicker at the plate. Once the ball is live you
//              command every runner: send them, hold them, send one.
//   Fielding — you're whoever is closest to the ball, automatically, and
//              control hands off as the play develops. Throw to a bag with
//              a number key, or at the cursor with a click.
//
// Everyone you aren't driving keeps their normal AI, so the team plays.
// ─────────────────────────────────────────────────────────────
const BASE_KEYS = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4, Digit0: 4 };

// Rough interception point: run the ball forward a beat and meet it there.
function interceptGuess(G, me) {
  const b = G.ball;
  if (!b || b.held) return null;
  const sp = Math.hypot(b.vx || 0, b.vz || 0);
  if (sp < 0.5) return { x: b.x, z: b.z };
  const d = Math.hypot(b.x - me.x, b.z - me.z);
  const t = Math.min(1.6, d / Math.max(6, sp) );
  return { x: b.x + (b.vx || 0) * t * 0.6, z: b.z + (b.vz || 0) * t * 0.6 };
}

// Where the out is: the furthest-along forced runner, else first base.
function smartBase(G) {
  const live = G.live().filter(r => r.a || r.ghost);
  let best = 1, bestBase = -1;
  for (const r of live) {
    if (!r.forced) continue;
    const to = r.to ?? r.base;
    if (to > bestBase) { bestBase = to; best = to; }
  }
  if (bestBase > 0) return best;
  // nobody forced — cut it off in front of the lead runner
  let lead = null;
  for (const r of live) if (!lead || (r.to ?? r.base) > (lead.to ?? lead.base)) lead = r;
  return lead ? Math.min(4, (lead.to ?? lead.base)) : 1;
}

export function makeKickControl() {
  const S = { steering: null, hint: '', baseTap: 0, throwHeld: false, throwLock: 0, lastTarget: 1 };

  // who the human is physically driving this tick
  function activeFielder(G) {
    if (G.ball.held && G.ball.held.team === G.fielding) return G.ball.held;
    if (G.duty.chaser && G.duty.chaser.team === G.fielding) return G.duty.chaser;
    // nobody assigned yet — take the closest body to the ball
    let best = null, bd = 1e9;
    for (const a of G.actors) {
      if (a.team !== G.fielding) continue;
      const d = Math.hypot(a.x - G.ball.x, a.z - G.ball.z);
      if (d < bd) { bd = d; best = a; }
    }
    return best;
  }

  // Build the per-actor input driver the sim expects.
  // `inp` is the raw player input for this tick; `keys` is the live key set.
  function driver(G, inp, keys, myTeam, dt = 1/60) {
    S.throwLock = Math.max(0, S.throwLock - dt);
    const taps = S.taps || new Set();
    const baseKey = [...taps].map(k => BASE_KEYS[k]).find(Boolean) || 0;
    const spaceDown = keys.has('Space');
    const sendAll = spaceDown && !S.sendHeld;                  // rising edge only
    S.sendHeld = spaceDown;
    const holdAll = keys.has('ShiftLeft') || keys.has('ShiftRight');
    if (sendAll) S.sendPulse = 0.25;                           // brief window so it reaches every runner
    S.sendPulse = Math.max(0, (S.sendPulse || 0) - dt);
    const sending = sendAll || S.sendPulse > 0;
    const zero = { dx: 0, dz: 0, dash: false, primary: false, special: false, aimX: inp.aimX, aimZ: inp.aimZ };

    if (myTeam === G.kicking) {
      const runners = G.live().filter(r => r.a && r.a.team === myTeam);
      S.hint = G.phase === 'pitch' ? 'CLICK to kick — aim where you want it'
             : runners.length ? 'SPACE send all · SHIFT hold · 1/2/3 send one runner'
             : '';
      S.steering = G.phase === 'pitch' ? G.kicker : (runners[0]?.a ?? null);
      return (a) => {
        if (a.team !== myTeam) return null;
        // the kid at the plate
        if (a === G.kicker && a.kb.duty === 'kick') return { ...inp, special: false };
        const r = runners.find(x => x.a === a);
        if (!r) return null;                                   // bench: let the AI stand there
        // The sim owns the path: r.to is what this runner is committed to, and
        // `special` only means anything while they're standing on the bag. So
        // we always run to r.to and just decide WHEN to send them.
        const onBag = r.to === r.base;
        const commanded = sending || (baseKey && r.base === baseKey);
        if (!commanded && !holdAll && onBag && !r.forced) return null;   // no order: run their own read
        const send = !holdAll && (commanded || r.forced);
        const p = G.basePos(r.to);
        let dx = p.x - a.x, dz = p.z - a.z;
        const d = Math.hypot(dx, dz) || 1;
        const stopR = onBag && !send ? 0.45 : 0;
        const moving = d > stopR;
        return {
          dx: moving ? dx / d : 0, dz: moving ? dz / d : 0,
          dash: inp.dash, primary: false,
          special: onBag ? send : false,
          aimX: p.x, aimZ: p.z,
        };
      };
    }

    // ── fielding ──
    const me = activeFielder(G);
    S.steering = me;
    const holding = G.ball.held === me;
    S.hint = holding ? '1/2/3/4 throw to a bag · CLICK throw at cursor'
                     : 'WASD chase it down — control follows the ball';
    // One press, one throw. A held button must never machine-gun the ball
    // around the infield — every wild throw is a free base.
    const wantThrow = inp.primary || !!baseKey;
    const throwEdge = wantThrow && !S.throwHeld && S.throwLock <= 0;
    S.throwHeld = wantThrow;
    let aimX = inp.aimX, aimZ = inp.aimZ, throwNow = false;
    if (holding) {
      // Number keys pick the bag. A bare click throws to the smart bag — the
      // lead force — so a new player is never punished for not knowing where
      // the out is. That's the Backyard Baseball courtesy.
      const target = baseKey || smartBase(G);
      const p = G.basePos(target);
      aimX = p.x; aimZ = p.z;                                  // always face the play
      if (throwEdge) { throwNow = true; S.throwLock = 0.45; S.baseTap = 0.35; S.lastTarget = target; }
    }
    const steering = Math.hypot(inp.dx, inp.dz) > 0.05;
    // Where the ball is GOING, not where it is. Chasing a live ball's current
    // position means trailing it forever — this is the difference between a
    // fielder who looks competent and one who never catches anything.
    const lead = interceptGuess(G, me);
    return (a) => {
      if (a !== me) return null;                               // teammates cover on AI
      // Hands off, the kid still plays: he runs his own read until you push a
      // direction. Holding the ball always yields to you — the throw is the
      // decision that matters.
      if (!steering && !holding && !throwNow) return null;
      let dx = inp.dx, dz = inp.dz;
      if (steering && !holding && lead) {
        const bs = Math.hypot(G.ball.vx || 0, G.ball.vz || 0);
        // slow roller: you drive. screamer: his instinct drives, you aim it.
        const assist = Math.min(0.82, 0.18 + bs / 26);
        const lx = lead.x - a.x, lz = lead.z - a.z, d = Math.hypot(lx, lz) || 1;
        dx = dx * (1 - assist) + (lx / d) * assist;
        dz = dz * (1 - assist) + (lz / d) * assist;
        const m2 = Math.hypot(dx, dz) || 1;
        dx /= m2; dz /= m2;
      }
      return { dx, dz, dash: inp.dash, primary: throwNow, special: false, aimX, aimZ };
    };
  }

  return {
    get steering() { return S.steering; },
    get hint() { return S.hint; },
    // taps are edge-triggered keys captured since the last sim tick
    setTaps(t) { S.taps = t; },
    driver,
    tick(dt) { S.baseTap = Math.max(0, S.baseTap - dt); S.throwLock = Math.max(0, S.throwLock - dt); },
  };
}

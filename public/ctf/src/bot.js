import { CFG } from './config.js';

// Bots drive the exact same kernel and the same kits you do. No extra reach,
// no perfect aim, a human-ish reaction delay — everything they do, you can do.
function rnd(a) {
  a.seed ^= a.seed << 13; a.seed ^= a.seed >>> 17; a.seed ^= a.seed << 5;
  return ((a.seed >>> 0) / 4294967296);
}

export function botInput(a, G, dt) {
  const mine = G.flags[a.team];
  const theirs = G.flags[a.team === 'blue' ? 'red' : 'blue'];
  a.think = (a.think || 0) + dt;

  let tx, tz, mark = null, attacking = false;

  const B = G.teamBase(a.team);
  const mateCarrier = theirs.carrier && theirs.carrier.team === a.team && theirs.carrier !== a ? theirs.carrier : null;
  if (a.hasFlag) {
    tx = B.x; tz = B.z;
  } else if (mine.carrier) {
    mark = mine.carrier;
  } else if (mine.dropped && !mine.air) {
    tx = mine.x; tz = mine.z;
  } else if (mateCarrier && a.role !== 'def') {
    // GET OPEN: run a lane ahead of the carrier toward home, offset to the side
    const cx = mateCarrier.x, cz = mateCarrier.z;
    const toHx = B.x - cx, toHz = B.z - cz, d = Math.hypot(toHx, toHz) || 1;
    tx = cx + toHx / d * 7 - toHz / d * (a.lane ?? 0) * 0.5;
    tz = cz + toHz / d * 7 + toHx / d * (a.lane ?? 0) * 0.5;
  } else if (a.role === 'def') {
    // INTERCEPT: stand between the nearest threat and the flag, not on a fixed spot
    let th = null, thD = 1e9;
    for (const e of G.actors) {
      if (e.team === a.team || e.tagged) continue;
      const d = Math.hypot(e.x - mine.x, e.z - mine.z);
      if (d < 17 && d < thD) { thD = d; th = e; }
    }
    if (th) {
      const ox = th.x - mine.x, oz = th.z - mine.z, d = Math.hypot(ox, oz) || 1;
      tx = mine.x + ox / d * Math.min(4, d * 0.5); tz = mine.z + oz / d * Math.min(4, d * 0.5);
    } else { tx = B.x + a.guardX; tz = B.z + a.guardZ; }
  } else {
    tx = theirs.x; tz = theirs.z; attacking = true;
  }
  if (mark) { tx = mark.x; tz = mark.z; }

  // portal kit: if my pads are down and the far one shortcuts my route, take it
  if (a.kit === 'portal') {
    const mine = G.portals.filter(p => p.owner === a);
    if (mine.length === 2) {
      const dNow = Math.hypot(tx - a.x, tz - a.z);
      for (const p of mine) {
        const q = mine.find(o => o !== p);
        const viaPad = Math.hypot(p.x - a.x, p.z - a.z) + Math.hypot(tx - q.x, tz - q.z);
        if (viaPad < dNow - 6 && a.tpCd <= 0) { tx = p.x; tz = p.z; break; }
      }
    }
  }

  // approach down your own lane until close — mirrored teams stop meeting
  // head-on at the flowerbed and trading forever
  let distRaw = Math.hypot(tx - a.x, tz - a.z);
  if (attacking && distRaw > 10 && a.lane !== undefined) tz += a.lane;

  let dx = tx - a.x, dz = tz - a.z;
  const dist = Math.hypot(dx, dz) || 1;
  dx /= dist; dz /= dist;

  // whisker avoidance
  for (const c of G.world.colliders) {
    const ox = c.x - a.x, oz = c.z - a.z;
    const d = Math.hypot(ox, oz);
    const rad = (c.type === 'circle' ? c.r : Math.hypot(c.hw, c.hh)) + 1.7;
    if (d < rad && d > 0.01 && (ox*dx + oz*dz) > 0) {
      const push = (rad - d) / rad;
      dx += (-oz/d) * push * 2.0 * (a.avoidSign || 1);
      dz += ( ox/d) * push * 2.0 * (a.avoidSign || 1);
    }
  }
  // carrying: bend away from the nearest chaser so they can't line up a lunge
  if (a.hasFlag) {
    for (const e of G.actors) {
      if (e.team === a.team || e.tagged) continue;
      const ox = e.x - a.x, oz = e.z - a.z, d = Math.hypot(ox, oz);
      if (d < 5.5 && d > 0.01) { const k = (5.5 - d) / 5.5; dx -= ox / d * k * 1.4; dz -= oz / d * k * 1.4; }
    }
  }
  const L2 = Math.hypot(dx, dz) || 1; dx /= L2; dz /= L2;
  // Arrival damping. A static target (a guard spot, a stationary flag) gets a
  // deadzone and a taper; a moving target (a carrier) is chased flat out.
  const chasing = !!mark || !!a.hasFlag;
  if (!chasing) {
    const stopR = 0.7, easeR = 3.0;
    if (dist < stopR) { dx = 0; dz = 0; }
    else if (dist < easeR) { const k = (dist - stopR) / (easeR - stopR); dx *= k; dz *= k; }
  }

  const sp = Math.hypot(a.vx, a.vz);
  const aligned = sp > 0.5 ? (a.vx*dx + a.vz*dz) / sp : 1;

  // nearest live enemy
  let near = null, nearD = 1e9;
  for (const b of G.actors) {
    if (b.team === a.team || b.tagged || b.invuln > 0) continue;
    const d = Math.hypot(b.x - a.x, b.z - a.z);
    if (d < nearD) { nearD = d; near = b; }
  }

  // ── aim: lead the target, with standing error so they stay readable ──
  let aimX = a.x + dx * 6, aimZ = a.z + dz * 6;
  if (near && nearD < 12) {
    const lead = a.kit === 'slingshot' ? nearD / CFG.kits.balloon.speed : Math.min(0.32, nearD / 22);
    const e = (a.aimErr ??= (rnd(a) - 0.5) * (CFG.bot?.aimErr ?? 0.5));
    aimX = near.x + near.vx * lead + e;
    aimZ = near.z + near.vz * lead - e;
  }

  const RB = CFG.bot ?? { reflexLo: 0.12, reflexHi: 0.18 };
  const reflex = (a.reflex ??= RB.reflexLo + rnd(a) * RB.reflexHi);
  const L = CFG.lunge;

  // ── primary ──
  let primary = false;
  const hostile = near && (mark === near || nearD < 4.5 || near.hasFlag);
  if (a.primary === 'balloon') {
    primary = !!near && nearD < 10 && nearD > 2 && a.balloonCd <= 0 && a.think > reflex;
  } else {
    const closing = near ? ((near.x - a.x)*a.vx + (near.z - a.z)*a.vz) / (nearD || 1) : 0;
    const threat = L.reach + (L.impulse + Math.max(0, closing) * L.stack) * L.reachPerSpeed;
    primary = !!hostile && a.lungeCd <= 0 && !a.lunge && a.think > reflex
              && nearD < threat + 1.6 + Math.max(0, closing) * (L.windup + L.active);
  }
  if (primary) a.think = 0;

  // ── special, per kit ──
  let special = false;
  switch (a.special) {
    case 'toss': {
      // hand it forward when a teammate is meaningfully closer to home
      if (a.hasFlag && a.tossCd <= 0) {
        const myD = Math.hypot(a.x - B.x, a.z - B.z);
        const pressured = near && nearD < 4.2;
        let best = null, bestScore = -1e9;
        for (const b of G.actors) {
          if (b.team !== a.team || b === a || b.tagged || b.hasFlag) continue;
          const d = Math.hypot(b.x - a.x, b.z - a.z);
          if (d > CFG.kits.toss.range || d < 1.5) continue;
          const bD = Math.hypot(b.x - B.x, b.z - B.z);
          // is the receiver open? nearest enemy to them
          let cover = 1e9;
          for (const e of G.actors) if (e.team !== a.team && !e.tagged) cover = Math.min(cover, Math.hypot(e.x - b.x, e.z - b.z));
          const gain = myD - bD;
          const score = gain + (cover > 3.5 ? 3 : -6) + (b.kit === 'dog' ? 2 : 0);
          if ((gain > 2.5 || (pressured && gain > -3 && cover > 3.0)) && score > bestScore) { bestScore = score; best = b; }
        }
        if (best) { special = true; aimX = best.x + best.vx * 0.3; aimZ = best.z + best.vz * 0.3; }
      }
      break;
    }
    case 'roll': {
      // bowl the carrier off their line — or just cover ground with it
      special = a.rollCd <= 0 && aligned > 0.6 && !a.roll &&
                ((!!mark && nearD < 7) || (dist > 9 && (attacking || a.hasFlag)));
      break;
    }
    case 'grapple': {
      // yank the flag when the line is clean
      if (a.grappleCd <= 0 && !a.grapple && !a.hasFlag && !theirs.carrier && !theirs.air) {
        const d = Math.hypot(theirs.x - a.x, theirs.z - a.z);
        if (d > 2 && d < CFG.kits.grapple.flagRange) {
          special = true; aimX = theirs.x; aimZ = theirs.z;
        }
      }
      break;
    }
    case 'kite': {
      // swing so the arc sweeps TOWARD the target, release when pointed at it
      if (a.swing) {
        const tdx = tx - a.x, tdz = tz - a.z, td = Math.hypot(tdx, tdz) || 1;
        const al = (a.vx * tdx + a.vz * tdz) / (td * (sp || 1));
        special = (a.swing.t > 0.3 && al > 0.9) || a.swing.t > 1.4;
      } else if (a.swingCd <= 0 && (attacking || a.hasFlag || mark) && dist > 9 && sp > 5 && aligned > 0.7) {
        special = true;
        // anchor ahead and to one side; pick the side whose arc bends toward the target
        const side = (dx * -dz + dz * dx) >= 0 ? 1 : -1;
        const s = (a.avoidSign || 1) * side;
        aimX = a.x + dx * 4.5 - dz * s * 4.5;
        aimZ = a.z + dz * 4.5 + dx * s * 4.5;
      }
      break;
    }
    case 'hurdle': {
      // kickflip to clear a defender in the way, or a low prop on the route
      if (a.hurdleCd <= 0 && a.air <= 0 && sp > 5) {
        if (near && nearD < 4.5 && ((near.x - a.x) * dx + (near.z - a.z) * dz) / (nearD || 1) > 0.75) special = true;
        else for (const c of G.world.colliders) {
          if (!c.low) continue;
          const ox = c.x - a.x, oz = c.z - a.z, d = Math.hypot(ox, oz);
          if (d < 4 && d > 1 && (ox * dx + oz * dz) / d > 0.9) { special = true; break; }
        }
      }
      break;
    }
    case 'horn': {
      // blast when two or more enemies are in the cone, or one is right on top of us
      if (a.hornCd <= 0) {
        let inCone = 0, best = null, bestD = 1e9;
        for (const e of G.actors) {
          if (e.team === a.team || e.tagged) continue;
          const ox = e.x - a.x, oz = e.z - a.z, d = Math.hypot(ox, oz) || 1;
          if (d > CFG.kits.karen.hornRange) continue;
          inCone++;
          if (d < bestD) { bestD = d; best = e; }
        }
        const carrierInCone = mark && Math.hypot(mark.x - a.x, mark.z - a.z) < CFG.kits.karen.hornRange;
        if (best && (carrierInCone || inCone >= 2 || bestD < 5.0)) {
          if (carrierInCone) best = mark;
          special = true; aimX = best.x + best.vx * 0.15; aimZ = best.z + best.vz * 0.15;
        }
      }
      break;
    }
    case 'duck': {
      // flatten out to shoot a gap under something
      if (a.duckCd <= 0 && a.duck <= 0 && sp > 4) {
        for (const c of G.world.colliders) {
          if (!c.low) continue;
          const ox = c.x - a.x, oz = c.z - a.z, d = Math.hypot(ox, oz);
          if (d < 5 && d > 1 && (ox * dx + oz * dz) / d > 0.88) { special = true; break; }
        }
      }
      break;
    }
    case 'spray': {
      // soak the ground between a chaser and our carrier, or in front of a thief
      if (a.sprayCd <= 0) {
        const tgt = mine.carrier || (near && nearD < 9 ? near : null);
        if (tgt) {
          special = true;
          aimX = tgt.x + tgt.vx * 0.4; aimZ = tgt.z + tgt.vz * 0.4;
        } else if (a.role === 'def' && G.threat(a.team)) {
          const B = G.teamBase(a.team);
          special = true; aimX = B.x + (a.team === 'blue' ? 5 : -5); aimZ = B.z + (a.lane || 0) * 0.4;
        }
      }
      break;
    }
    case 'portal': {
      // one pad near base, its twin near midfield — a standing escape route
      const B = G.teamBase(a.team);
      const minePads = G.portals.filter(p => p.owner === a);
      if (a.portalCd <= 0) {
        const homeD = Math.hypot(a.x - B.x, a.z - B.z);
        if (minePads.length === 0 && homeD < 8) { special = true; aimX = B.x; aimZ = B.z + 3; }
        else if (minePads.length === 1 && Math.abs(a.x) < 6) { special = true; aimX = a.x; aimZ = a.z; }
      }
      break;
    }
  }

  const dash = a.dashCd <= 0 && !a.lunge && !a.roll && !a.swing && dist > 5 && aligned > 0.9;

  return { dx, dz, dash, primary, special, aimX, aimZ };
}

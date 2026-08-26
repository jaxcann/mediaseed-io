import { CFG } from './config.js';
import { applyKit } from './kits.js';

export function makeActor(team, x, z, isPlayer=false) {
  const a = {
    team, isPlayer,
    x, z, px:x, pz:z,
    vx:0, vz:0,
    facing: team === 'blue' ? Math.PI/2 : -Math.PI/2,
    aim: team === 'blue' ? Math.PI/2 : -Math.PI/2,
    r: 0.62,
    dashCd:0, lock:0,
    lunge: null, lungeCd:0,
    tagged:false, respawnT:0, invuln:0,
    hasFlag:null,
    squash:0, dustAcc:0, whiff:0,
    bufDash:0, bufPrimary:0,        // input buffer: a press arriving early still fires
    spawn: { x, z },
  };
  applyKit(a, 'runner');
  return a;
}

const clamp = (v,a,b) => v<a?a:v>b?b:v;
const BUF = 0.16;                      // input buffer window (s)
const angLerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI*2)) - Math.PI; return a + d * t; };

// ─────────────────────────────────────────────────────────────
// One kernel, every kit, every bot. Kits are stat nudges and extra verbs on
// the same physics — never a separate physics.
//
//   DASH   — mobility. Stacks with the speed you already carry.
//   LUNGE  — the tag. Mouse-aimed, telegraphed, whiffs are punished, and
//            reach scales with momentum. (Slingshot trades this for a balloon,
//            which lives in rules.js as a world entity.)
//   ROLL   — Guard: a sideways barrel roll. Long, fast, mildly steerable,
//            bowls people over. Commits hard.
//   GRAPPLE— Grappler: rules.js finds the anchor; the pull itself is here.
//   SWING  — Nahele: a kite line to a fixed anchor. Velocity is projected
//            onto the tangent — real pendulum, so exits are earned, not given.
// ─────────────────────────────────────────────────────────────
export function stepActor(a, input, dt, world) {
  a.px = a.x; a.pz = a.z;

  a.dashCd  = Math.max(0, a.dashCd  - dt);
  a.lungeCd = Math.max(0, a.lungeCd - dt);
  a.rollCd  = Math.max(0, a.rollCd  - dt);
  a.grappleCd = Math.max(0, a.grappleCd - dt);
  a.swingCd = Math.max(0, a.swingCd - dt);
  a.lock    = Math.max(0, a.lock    - dt);
  a.invuln  = Math.max(0, a.invuln  - dt);
  a.squash  = Math.max(0, a.squash  - dt * 4.5);
  a.whiff   = Math.max(0, a.whiff   - dt);
  a.tpCd    = Math.max(0, (a.tpCd || 0) - dt);
  a.wet     = Math.max(0, (a.wet || 0) - dt);
  a.onIce   = Math.max(0, (a.onIce || 0) - dt);
  a.spinT   = a.spinT || 0;
  a.hurdleCd = Math.max(0, (a.hurdleCd || 0) - dt);
  a.duckCd  = Math.max(0, (a.duckCd || 0) - dt);
  a.duck    = Math.max(0, (a.duck || 0) - dt);
  a.hornCd  = Math.max(0, (a.hornCd || 0) - dt);
  a.sprayCd = Math.max(0, (a.sprayCd || 0) - dt);
  a.stun    = Math.max(0, (a.stun || 0) - dt);
  if (a.air > 0) {
    a.air -= dt;
    if (a.air <= 0) { a.air = 0; a.squash = 0.8; world.fx?.burst(a.x, a.z, 0, 0, 8); }
  }
  // Stunned (air horn): you keep every bit of your momentum, you just can't
  // steer out of it. That's what makes the horn a shove, not a stop.
  // This has to happen BEFORE the buffer writes below: the dash and lunge
  // branches read a.bufDash/a.bufPrimary, never input.*, so a stunned player
  // pressing dash still landed it — roll, hurdle and duck were blocked but
  // dash and lunge fired straight through.
  const stunned = a.stun > 0;
  if (stunned) input = { dx: 0, dz: 0, dash: false, primary: false, special: false,
                         aimX: input.aimX, aimZ: input.aimZ };

  // buffer presses for a few frames so "slightly early" means "on time"
  if (input.dash)    a.bufDash = BUF;
  if (input.primary) a.bufPrimary = BUF;
  a.bufDash = Math.max(0, a.bufDash - dt); a.bufPrimary = Math.max(0, a.bufPrimary - dt);
  if (stunned) { a.bufDash = 0; a.bufPrimary = 0; }   // and nothing survives in the buffer

  if (a.tagged) {
    a.respawnT -= dt;
    a.vx = a.vz = 0;
    a.lunge = null; a.roll = null; a.grapple = null; a.swing = null; a.glide = false;
    if (a.respawnT <= 0) {
      a.tagged = false;
      a.x = a.px = a.spawn.x; a.z = a.pz = a.spawn.z;
      a.invuln = CFG.tag.invuln;
    }
    return;
  }

  const M = CFG.move, D = CFG.dash, L = CFG.lunge, KG = CFG.kits;

  let dx = input.dx, dz = input.dz;
  const inLen = Math.hypot(dx, dz);
  let throttle = 0;
  if (inLen > 0.06) { dx /= inLen; dz /= inLen; throttle = Math.min(1, inLen); }
  else { dx = dz = 0; }

  // ── aim ──
  // updateAim is the CALLER's job, once per tick, before the step. It used to
  // also run here, so aim smoothed twice a tick everywhere the sim ran and only
  // once in the client's prediction — a divergence on every fast flick, on the
  // aimed lunge. aimSmooth was retuned 22 -> 44 to keep the feel identical:
  // 1-e^(-44·dt) is exactly two steps of 1-e^(-22·dt).
  const aimX = Math.sin(a.aim), aimZ = Math.cos(a.aim);

  // ── LUNGE ──
  if (a.lunge) {
    a.lunge.t += dt;
    const p = a.lunge;
    if (p.phase === 'wind' && p.t >= L.windup) {
      p.phase = 'active'; p.t = 0;
      const along = Math.max(0, a.vx*p.dx + a.vz*p.dz);
      p.power = Math.min(L.maxSpeed, L.impulse + along * L.stack);
      a.vx = p.dx * p.power; a.vz = p.dz * p.power;
      a.squash = 1;
      world.fx?.burst(a.x, a.z, -p.dx, -p.dz, 8);
    } else if (p.phase === 'active' && p.t >= L.active) {
      p.phase = 'recover'; p.t = 0;
      // config.js has always said "recovery punishes a whiff" and it never did:
      // measured, a lunge that connected and a lunge that missed both cost
      // exactly 0.550s, differential 0.000. a.whiff was written here and read
      // only by the sound and the replay — nothing in the kernel. Now a landed
      // tag lets you go again sooner and a miss leaves you hanging, which is
      // what makes an aimed lunge a gamble instead of a free swing.
      p.rec = p.hit ? L.hitRecover : L.recover + L.whiffExtra;
      if (!p.hit) a.whiff = p.rec;
    } else if (p.phase === 'recover' && p.t >= (p.rec ?? L.recover)) {
      a.lunge = null;
    }
  } else if (a.bufPrimary > 0 && a.primary === 'lunge' && a.lungeCd <= 0 && !a.roll && !a.swing) {
    a.bufPrimary = 0;
    a.lunge = { phase:'wind', t:0, dx:aimX, dz:aimZ, power:0, hit:false };
    a.lungeCd = L.cooldown;
  }

  const ph = a.lunge?.phase;

  // ── ROLL (Guard) ──
  if (a.roll) {
    const R = KG.guard, r = a.roll;
    r.t += dt;
    // gentle steering while barrelling — a rolling keg, not a homing missile
    if (dx || dz) {
      const want = Math.atan2(dx, dz);
      const cur  = Math.atan2(r.dx, r.dz);
      const na = angLerp(cur, want, clamp(R.rollSteer * dt, 0, 1));
      r.dx = Math.sin(na); r.dz = Math.cos(na);
    }
    const k = clamp(1 - r.t / R.rollDur, 0, 1);       // speed tapers off
    const sp = R.rollSpeed * (0.55 + 0.45 * Math.max(0, k));
    a.vx = r.dx * sp; a.vz = r.dz * sp;
    a.facing = Math.atan2(r.dx, r.dz);
    if (r.t >= R.rollDur) { a.roll = null; a.squash = 0.7; }
  } else if (input.special && a.special === 'roll' && a.rollCd <= 0 && !ph) {
    let ux = dx, uz = dz;
    if (!ux && !uz) { ux = Math.sin(a.facing); uz = Math.cos(a.facing); }
    a.roll = { t:0, dx:ux, dz:uz, spin:0 };
    a.rollCd = KG.guard.rollCd;
    a.squash = 1;
    world.fx?.burst(a.x, a.z, -ux, -uz, 12);
  }

  // ── HURDLE (Skater): a kickflip that carries you clean over people,
  //    hedges, and anything else flagged low. You can still be tagged out of
  //    the air — the kickflip clears obstacles, not opponents.
  if (a.special === 'hurdle' && input.special && a.hurdleCd <= 0 && a.air <= 0 && !ph && !a.roll) {
    const S = KG.skater;
    let ux = dx, uz = dz;
    if (!ux && !uz) { ux = Math.sin(a.facing); uz = Math.cos(a.facing); }
    const along = Math.max(0, a.vx*ux + a.vz*uz);
    const mag = Math.max(S.hurdleSpeed, along * 1.05);      // a fast approach makes a longer hurdle
    a.vx = ux*mag; a.vz = uz*mag;
    a.air = S.hurdleT; a.airT = S.hurdleT; a.airKind = 'hurdle';
    a.hurdleCd = S.hurdleCd;
    a.squash = 1;
    world.fx?.burst(a.x, a.z, -ux, -uz, 10);
  }

  // ── DUCK (Lil T): flattens onto the trike and rides under low props ──
  if (a.special === 'duck' && input.special && a.duckCd <= 0 && a.duck <= 0) {
    a.duck = KG.lilt.duckT; a.duckCd = KG.lilt.duckCd;
    world.fx?.burst(a.x, a.z, 0, 0, 6);
  }

  // ── GRAPPLE pull (anchor decided in rules.js) ──
  if (a.grapple?.phase === 'pull') {
    const G = KG.grapple, g = a.grapple;
    g.t += dt;
    let gx = g.x - a.x, gz = g.z - a.z;
    const d = Math.hypot(gx, gz) || 1e-4;
    gx /= d; gz /= d;
    a.vx += gx * G.pull * dt; a.vz += gz * G.pull * dt;
    const sp = Math.hypot(a.vx, a.vz);
    if (sp > G.pullMax) { a.vx = a.vx/sp*G.pullMax; a.vz = a.vz/sp*G.pullMax; }
    a.facing = Math.atan2(gx, gz);
    if (d < G.arrive || g.t > G.maxT || input.dash) {
      a.grapple = null; a.glide = false; a.squash = 0.6;
    }
  }

  // ── KITE SWING (anchor decided in rules.js) ──
  if (a.swing) {
    const K = KG.kite, s = a.swing;
    s.t += dt;
    let rx = a.x - s.ax, rz = a.z - s.az;
    const d = Math.hypot(rx, rz) || 1e-4;
    rx /= d; rz /= d;
    // taut line: kill outward velocity, keep the tangent — that's a pendulum
    const vr = a.vx*rx + a.vz*rz;
    if (d >= s.len && vr > 0) { a.vx -= rx*vr; a.vz -= rz*vr; }
    // pump along whichever way you're already swinging
    let tx = -rz, tz = rx;
    const vt = a.vx*tx + a.vz*tz;
    const dir = vt >= 0 ? 1 : -1;
    a.vx += tx * dir * K.boost * dt;
    a.vz += tz * dir * K.boost * dt;
    const sp = Math.hypot(a.vx, a.vz);
    if (sp > K.maxSpeed) { a.vx = a.vx/sp*K.maxSpeed; a.vz = a.vz/sp*K.maxSpeed; }
    // hard clamp to the circle
    if (d > s.len) { a.x = s.ax + rx*s.len; a.z = s.az + rz*s.len; }
    a.facing = Math.atan2(a.vx, a.vz);
    if ((input.special && s.t > 0.15) || s.t > K.maxT) {
      a.swing = null; a.glide = true; a.swingCd = K.cooldown; a.squash = 0.6;
    }
  }

  // gliding: the kite keeps your exit speed alive until you fall back to cap
  const inSpecialMove = !!(a.roll || a.grapple || a.swing);

  // ── DASH ──
  if (a.bufDash > 0 && a.dashCd <= 0 && !ph && !inSpecialMove) {
    a.bufDash = 0;
    let ux = dx, uz = dz;
    if (!ux && !uz) { ux = Math.sin(a.facing); uz = Math.cos(a.facing); }
    const along = Math.max(0, a.vx*ux + a.vz*uz);
    const mag = Math.min(D.maxSpeed, D.impulse + along * D.stack);
    a.vx = ux*mag; a.vz = uz*mag;
    a.dashCd = D.cooldown; a.lock = D.lock; a.squash = 1;
    a.glide = false;
    world.fx?.burst(a.x, a.z, -ux, -uz, 10);
  }

  // ── board: it pops out once you're rolling and tucks away when you slow ──
  if (a.kit === 'skater') {
    const s = Math.hypot(a.vx, a.vz);
    if (!a.board && s > KG.skater.boardAt) a.board = true;
    else if (a.board && s < KG.skater.boardOff) a.board = false;
  }

  // ── locomotion ──
  const kitSp = a.kitSpeed * (a.halfMul || 1);
  const kitAc = a.kitAccel * (a.halfMulAccel || 1);
  const steering = a.lock <= 0 && ph !== 'active' && !inSpecialMove && a.air <= 0;
  const accel = (ph === 'wind'    ? M.accel * L.windControl
              :  ph === 'recover' ? M.accel * L.recControl
              :  M.accel) * kitAc;
  // wheels change how you hold a line: a board carves, a trike understeers
  let vehicleGrip = 1, vehicleCap = 1, keepMul = 1;
  if (a.board)      { vehicleGrip = KG.skater.boardGrip / M.grip; vehicleCap = KG.skater.boardMax / M.maxSpeed; keepMul = KG.skater.boardKeep / 0.7; }
  else if (a.trike) { vehicleGrip = KG.lilt.trikeGrip / M.grip;   vehicleCap = KG.lilt.trikeMax / M.maxSpeed;   keepMul = KG.lilt.trikeKeep / 0.7; }
  if (a.duck > 0) vehicleCap *= KG.lilt.duckBoost;
  const grip  = (ph ? M.grip * M.lungeGrip : M.grip) * vehicleGrip * (a.wet > 0 ? M.wetGrip : 1);
  const cap   = M.maxSpeed * kitSp * vehicleCap * (a.hasFlag ? M.carrySlow : 1)
              * (ph === 'wind' ? L.windControl : ph === 'recover' ? L.recControl : 1)
              * (throttle > 0 ? throttle : 1);          // ease in, don't slam

  if (steering && (dx || dz)) {
    const speed = Math.hypot(a.vx, a.vz);
    let fwd = a.vx*dx + a.vz*dz;
    let lx = a.vx - dx*fwd, lz = a.vz - dz*fwd;
    // MOMENTUM REDIRECT: a turn carries part of your speed into the new
    // heading instead of rebuilding from zero. Shallow turns keep nearly all
    // of it; a hard 90° keeps a quarter; a full reversal keeps a quarter too.
    // The corner still costs you — it just doesn't stall you.
    if (speed > 0.5) {
      const align = fwd / speed;                       // cos of the turn angle
      // Continuous on both sides of straight-ahead. The old form had two
      // discontinuities: `align < 0 ? 0.12 : ...` stepped at exactly 90° (a
      // measured 17.4% speed loss for 0.2° of stick), and the flat `lx *= 0.5`
      // stepped again wherever fwd happened to cross keep — a 30.7% loss inside
      // a single 0.1° step at 64.6°. Both are now ramps.
      const fwdKeep = Math.min(M.keepMax, (M.keepBase + M.keepCurve * align * align) * keepMul);
      const kf = align >= 0
        ? fwdKeep
        : M.revFloor + (M.keepBase * keepMul - M.revFloor) * (1 + align);
      const keep = Math.min(cap, speed) * kf;
      if (fwd < keep) {
        // Bleed the lateral in proportion to how much the redirect had to lift
        // the forward component, so it eases in from zero at the crossover
        // instead of snapping to half.
        const t = Math.min(1, (keep - fwd) / Math.max(1e-4, keep));
        const damp = 1 - (1 - M.latCut) * t;
        fwd = keep; lx *= damp; lz *= damp;
      }
    }
    // FRONT-LOADED ACCEL: quick off the line, soft into top speed
    const frac = clamp(fwd / cap, 0, 1);
    const accelNow = accel * (0.7 + 1.3 * (1 - frac) * (1 - frac));
    if (fwd < cap) fwd = Math.min(cap, fwd + accelNow*dt);
    const g = Math.exp(-grip*dt);
    lx *= g; lz *= g;
    a.vx = dx*fwd + lx;
    a.vz = dz*fwd + lz;
    a.facing = Math.atan2(dx, dz);
  } else if (steering) {
    // Stopping obeys the surface and the wheels, same as turning does.
    const brake = M.brake
      * (1 - (1 - vehicleGrip) * M.vehicleBrake)
      * (a.wet > 0 ? M.wetBrake : 1);
    const sp = Math.hypot(a.vx, a.vz);
    if (sp > 1e-4) {
      const ns = Math.max(0, sp - brake*dt);
      a.vx = a.vx/sp*ns; a.vz = a.vz/sp*ns;
    }
  }

  // overspeed bleed
  const sp2 = Math.hypot(a.vx, a.vz);
  if (sp2 <= cap) a.glide = false;
  if (sp2 > cap && !inSpecialMove && a.air <= 0) {
    const d = ph === 'active' ? M.lungeDrag
            : a.glide         ? CFG.kits.kite.glideDrag
            : M.drag;
    const ns = Math.max(cap, sp2 - (sp2-cap)*d*dt - d*dt);
    a.vx = a.vx/sp2*ns; a.vz = a.vz/sp2*ns;
  }

  a.x += a.vx*dt;
  a.z += a.vz*dt;

  collide(a, world);
}

export const isLunging = a => a.lunge?.phase === 'active';
export const lungeReach = a => CFG.lunge.reach + (a.lunge?.power || 0) * CFG.lunge.reachPerSpeed;
// Aim smoothing, extracted so the rules pass can bring aim up to date BEFORE
// firing aimed specials — otherwise every horn/hose/toss aims one tick stale.
export function updateAim(a, input, dt) {
  if (input.aimX === undefined) return;
  const ax = input.aimX - a.x, az = input.aimZ - a.z;
  if (Math.hypot(ax, az) > 0.05) {
    let t = Math.atan2(ax, az), d = ((t - a.aim + Math.PI) % (Math.PI*2)) - Math.PI;
    a.aim = a.aim + d * (1 - Math.exp(-CFG.lunge.aimSmooth * dt));
  }
}

export const isRolling = a => !!a.roll;
export const isAirborne = a => (a.air || 0) > 0;
// a hurdling player can't be tagged — that's the whole point of the kickflip
// Airborne is untaggable — except a kickflip. A 0.44s immunity button on a 2s
// cooldown was worth ~7 points of win rate to the Skater and quietly undercut
// the one skill the whole game is built on. The trampoline keeps its immunity:
// that launch is committed, slow, and everyone can use it.
export const isTaggable = a => !a.tagged && a.invuln <= 0
  && ((a.air || 0) <= 0 || a.airKind === 'hurdle');


// ── bodies ──────────────────────────────────────────────────────────
// Two kids closing head-on used to reach 0.000 m apart and swap sides. One
// symmetric separation pass fixes that. Everything is read from a frozen
// snapshot and applied afterwards, so the result cannot depend on where an
// actor sits in the array.
//
// This lives here rather than inside makeGame because the client has to run the
// exact same pass when it predicts: the server separates and the client did
// not, which drifted the local kid over half a metre in under half a second of
// contact and then snapped him back on the next snapshot.
export function separateBodies(actors, world) {
  const B = CFG.move.bump;
  const n = actors.length;
  const sx = [], sz = [], svx = [], svz = [];
  for (let i = 0; i < n; i++) { const a = actors[i]; sx[i] = a.x; sz[i] = a.z; svx[i] = a.vx; svz[i] = a.vz; }
  const px = new Float64Array(n), pz = new Float64Array(n);
  const pvx = new Float64Array(n), pvz = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const a = actors[i];
    if (a.tagged || a.air > 0) continue;          // you fly over people
    for (let j = i + 1; j < n; j++) {
      const b = actors[j];
      if (b.tagged || b.air > 0) continue;
      let nx = sx[j] - sx[i], nz = sz[j] - sz[i];
      let d = Math.hypot(nx, nz);
      const min = a.r + b.r;
      if (d >= min) continue;
      if (d < 1e-4) { nx = 1; nz = 0; d = 1e-4; }  // exactly stacked: pick an axis
      else { nx /= d; nz /= d; }

      // a bigger kid gives less ground
      const ma = a.r * a.r, mb = b.r * b.r, tot = ma + mb;
      const wa = mb / tot, wb = ma / tot;
      const push = (min - d) * B.separate;
      px[i] -= nx * push * wa; pz[i] -= nz * push * wa;
      px[j] += nx * push * wb; pz[j] += nz * push * wb;

      // cancel only the closing speed along the contact normal — a glancing
      // run keeps its pace, a square-on collision does not
      const rel = (svx[j] - svx[i]) * nx + (svz[j] - svz[i]) * nz;
      if (rel < 0) {
        const imp = -rel * (1 + B.restitution);
        pvx[i] -= nx * imp * wa; pvz[i] -= nz * imp * wa;
        pvx[j] += nx * imp * wb; pvz[j] += nz * imp * wb;
      }
    }
  }
  for (let i = 0; i < n; i++) {
    const a = actors[i];
    if (!px[i] && !pz[i] && !pvx[i] && !pvz[i]) continue;
    a.x += px[i]; a.z += pz[i];
    a.vx += pvx[i]; a.vz += pvz[i];
    // The push lands after stepActor already resolved this actor against the
    // world, so it can shove somebody into a car or through the fence.
    // Re-resolve; collide() clamps to the pitch too, and cancels velocity
    // properly where a bare clamp would not.
    collide(a, world);
  }
}

// Circle vs world. Tangential velocity survives an impact, so cutting a
// corner tight against a hedge is faster than braking for it.
export function collide(a, world) {
  // Per-game bounds when the actor has them (CTF); CFG otherwise (kickball).
  const F = a.rules?.field ?? CFG.field, hw = F.w/2 - a.r, hh = F.h/2 - a.r;
  if (a.x < -hw) { a.x = -hw; a.vx = Math.max(0, a.vx); }
  if (a.x >  hw) { a.x =  hw; a.vx = Math.min(0, a.vx); }
  if (a.z < -hh) { a.z = -hh; a.vz = Math.max(0, a.vz); }
  if (a.z >  hh) { a.z =  hh; a.vz = Math.min(0, a.vz); }

  const overUnder = a.air > 0 || a.duck > 0;
  for (const c of world.colliders) {
    if (overUnder && c.low) continue;              // hurdled over, or ducked under
    let nx, nz, pen;
    if (c.type === 'circle') {
      nx = a.x - c.x; nz = a.z - c.z;
      const d = Math.hypot(nx, nz) || 1e-4;
      pen = (c.r + a.r) - d;
      if (pen <= 0) continue;
      nx /= d; nz /= d;
    } else {
      const cx = clamp(a.x, c.x - c.hw, c.x + c.hw);
      const cz = clamp(a.z, c.z - c.hh, c.z + c.hh);
      nx = a.x - cx; nz = a.z - cz;
      let d = Math.hypot(nx, nz);
      if (d > a.r) continue;
      if (d < 1e-4) {
        // Centre is inside the box — the offset gives no usable direction, and
        // normalising it here used to divide by 1e-4 and fling the actor out at
        // ten thousand times the penetration. Push out of the nearest face.
        const ex = c.hw - Math.abs(a.x - c.x), ez = c.hh - Math.abs(a.z - c.z);
        if (ex < ez) { nx = Math.sign(a.x - c.x) || 1; nz = 0; pen = ex + a.r; }
        else         { nx = 0; nz = Math.sign(a.z - c.z) || 1; pen = ez + a.r; }
      } else {
        pen = a.r - d; nx /= d; nz /= d;
      }
    }
    a.x += nx*pen; a.z += nz*pen;
    const vn = a.vx*nx + a.vz*nz;
    if (vn < 0) { a.vx -= nx*vn; a.vz -= nz*vn; }
  }
}

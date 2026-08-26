import { CFG, TEAMS } from './config.js';
import { makeActor, stepActor, isLunging, lungeReach, isRolling, isTaggable, updateAim, separateBodies } from './actor.js';
import { applyKit, KIT_KEYS, assignRoles } from './kits.js';
import { botInput } from './bot.js';
import { hazards as yardHazards, streamAngle, applyMapConfig } from './layout.js';

const other = t => t === 'blue' ? 'red' : 'blue';

// Pure simulation. No THREE, no DOM — a headless server runs this verbatim.
export function makeGame(world, opts = {}) {
  const seed0 = (opts.seed ?? 1) | 0;
  const yard = opts.yard || 'day';
  const map = opts.map || 'backyard';
  if (opts.applyMap !== false) applyMapConfig(CFG, map, TEAMS);       // field size + team size travel with the map
  // Everything the map scopes is snapshotted here, per game. CFG and TEAMS are
  // globals and the server runs several rooms at once — without this snapshot,
  // opening a match on The Block moved the field bounds, the flag posts and the
  // respawn timer of every match already in progress. A backyard flag would
  // return to x=-48 on a pitch only 48 wide and the match became unwinnable.
  const RULES = {
    field: { w: CFG.field.w, h: CFG.field.h },
    base: { blue: { ...TEAMS.blue.base }, red: { ...TEAMS.red.base } },
    teamSize: CFG.match.teamSize,
    scoreToWin: CFG.match.scoreToWin,
    duration: CFG.match.duration,
    respawn: CFG.tag.respawn,
  };
  const hazards = yardHazards(yard, map);
  let rngState = (seed0 ^ 0x6D2B79F5) | 0;
  const rng = () => {                       // deterministic match RNG
    rngState ^= rngState << 13; rngState ^= rngState >>> 17; rngState ^= rngState << 5;
    return (rngState >>> 0) / 4294967296;
  };

  const actors = [], flags = {};

  for (const T of Object.values(TEAMS)) {
    const HOME = RULES.base[T.key];
    flags[T.key] = { team: T.key, x: HOME.x, z: HOME.z, home: true,
                     carrier: null, dropped: false, returnT: 0,
                     air: null };           // air = { target, speed } while tossed

    for (let i = 0; i < RULES.teamSize; i++) {
      // Centre the spawn arc on the roster. `(i - 1)` only centres a team of
      // three: at five it put blue at z = -1.8..5.4, whose 180° rotation is not
      // red's set, so the two sides did not start as mirror images of each
      // other on the 5v5 map. Identical output for teamSize 3.
      const ang = (i - (RULES.teamSize - 1) / 2) * 0.75;
      const a = makeActor(T.key, HOME.x + (T.key === 'blue' ? 1.6 : -1.6), HOME.z + ang * 2.4,
                          T.key === 'blue' && i === 0);
      a.rules = RULES;                      // the kernel clamps to this game's pitch
      a.variant = (T.key === 'blue' ? 0 : 3) + i;
      a.role = i === 1 ? 'def' : 'atk';
      a.guardX = (T.key === 'blue' ? 4.5 : -4.5); a.guardZ = ang * 3.5;
      a.avoidSign = i % 2 ? 1 : -1;
      a.seed = ((T.key === 'blue' ? 0x9E3779B1 : 0x85EBCA77) ^ (i * 0x27D4EB2F) ^ (seed0 * 0x165667B1)) | 0;
      actors.push(a);
    }
  }

  const player = actors.find(a => a.isPlayer);
  const score = { blue: 0, red: 0 };
  const balloons = [];                       // { id,x,z,vx,vz,life,team,owner }
  const portals = [];                        // { id,x,z,dx,dz,team,life }
  const patches = [];                        // { id,x,z,r,life } — wet grass from the hose
  const horns = [];                          // { id,x,z,aim,life } — air-horn blasts, visual only
  let nextId = 1;
  const G = {
    actors, flags, score, world, player, balloons, portals, patches, horns, yard, map, hazards, hazT: 0,
    time: RULES.duration, over: null, events: [], rules: RULES,
    // Post-match card numbers. Counters only — nothing here feeds the sim,
    // so they cannot desync it.
    tally: { blue: { tags: 0, caps: 0, grabs: 0 }, red: { tags: 0, caps: 0, grabs: 0 } },
    phase: 'draft',
    teamBase: t => RULES.base[t],
    threat(team) {
      const B = RULES.base[team];
      return actors.some(a => a.team !== team && !a.tagged &&
        Math.hypot(a.x - B.x, a.z - B.z) < 14);
    },
    draft, step,
  };

  // ── the draft ─────────────────────────────────────────────
  // Player picks one kit; both teams fill from the pool, no duplicates
  // within a team. Seeded, so headless matches draft too.
  function draft(playerKit) {
    applyKit(player, playerKit);
    for (const T of ['blue', 'red']) {
      const taken = new Set(actors.filter(a => a.team === T && a.kit && a === player ? true : false)
        .map(a => a.kit));
      if (T === 'blue') taken.add(playerKit);
      for (const a of actors) {
        if (a.team !== T || a === player) continue;
        const pool = KIT_KEYS.filter(k => !taken.has(k));
        const pick = pool[Math.floor(rng() * pool.length) % pool.length];
        applyKit(a, pick);
        taken.add(pick);
      }
    }
    // bots get a deterministic attack lane so mirrored teams don't meet
    // head-on at midfield and trade forever
    for (const a of actors) a.lane = (rng() - 0.5) * 12;
    assignRoles(actors);
    G.phase = 'countdown'; G.countT = CFG.match.countdown; G.countSaid = Math.ceil(CFG.match.countdown) + 1;
  }
  if (opts.autodraft) draft(KIT_KEYS[Math.floor(rng() * KIT_KEYS.length)]);

  function say(text, color, kind = 'info') { G.events.push({ text, color, t: 2.4, kind }); }

  function dropFlag(a) {
    if (!a.hasFlag) return;
    const f = a.hasFlag;
    f.carrier = null; f.dropped = true; f.home = false; f.air = null;
    f.lock = CFG.match.dropLock;               // nobody grabs it off the ground instantly
    f.returnT = CFG.match.flagReturn;
    f.x = a.x; f.z = a.z;
    a.hasFlag = null;
  }
  function returnFlag(f) {
    const B = RULES.base[f.team];
    f.x = B.x; f.z = B.z; f.home = true; f.dropped = false;
    f.carrier = null; f.returnT = 0; f.air = null;
  }
  function tagOut(att, vic, d) {
    if (vic.tagged) return;
    const had = !!vic.hasFlag;
    dropFlag(vic);
    vic.tagged = true; vic.respawnT = RULES.respawn;
    G.tally[att.team].tags++;
    const nx = (vic.x - att.x)/(d || 1), nz = (vic.z - att.z)/(d || 1);
    vic.vx += nx * CFG.tag.knock; vic.vz += nz * CFG.tag.knock;
    world.fx?.burst(vic.x, vic.z, nx, nz, 18);
    if (had) say(`${att.team.toUpperCase()} STOPS THE RUNNER`, TEAMS[att.team].color, 'tag');
    else say('', 0, 'tag');
    if (att.isPlayer) say('TAGGED!', 0xffd94a);
    if (vic.isPlayer) say('TAGGED OUT', 0xff4d4d, 'hurt');
    G.lastTag = { x: vic.x, z: vic.z, team: att.team };
  }

  // ── specials that need world knowledge ────────────────────
  function fireBalloon(a) {
    const B = CFG.kits.balloon;
    const ax = Math.sin(a.aim), az = Math.cos(a.aim);
    // inherit a bit of your run — moving shots lead further
    balloons.push({ id: nextId++, x: a.x + ax*0.8, z: a.z + az*0.8,
                    vx: ax*B.speed + a.vx*0.35, vz: az*B.speed + a.vz*0.35,
                    life: B.life, team: a.team, owner: a });
    a.balloonCd = B.cooldown;
    a.squash = 0.6;
    world.fx?.burst(a.x, a.z, -ax, -az, 5);
  }

  function tossFlag(a) {
    const T = CFG.kits.toss;
    if (!a.hasFlag || a.tossCd > 0) return;
    // best teammate: inside the aim cone, nearest to the cursor ray
    const ax = Math.sin(a.aim), az = Math.cos(a.aim);
    let best = null, bestScore = -1;
    for (const b of actors) {
      if (b.team !== a.team || b === a || b.tagged || b.hasFlag) continue;
      const ox = b.x - a.x, oz = b.z - a.z;
      const d = Math.hypot(ox, oz);
      if (d < 0.5 || d > T.range) continue;
      const align = (ox*ax + oz*az) / d;
      if (align < T.cone) continue;
      const s = align * 2 - d / T.range;
      if (s > bestScore) { bestScore = s; best = b; }
    }
    if (!best) { say('NO ONE OPEN', 0x9aa4b2); a.tossCd = 0.3; return; }
    const f = a.hasFlag;
    a.hasFlag = null; f.carrier = null;
    f.air = { target: best, speed: T.speed };
    a.tossCd = T.cooldown;
    a.squash = 0.7;
    say('FLAG UP!', TEAMS[a.team].color);
  }

  // Karen's air horn: an instant cone. It does not tag — it shoves everyone
  // in front of her and takes their steering away for half a second. A wall
  // of sound, used to break up a run or peel someone off a carrier.
  function blowHorn(a) {
    const K = CFG.kits.karen;
    if (a.hornCd > 0) return;
    a.hornCd = K.hornCd;
    const ax = Math.sin(a.aim), az = Math.cos(a.aim);
    horns.push({ id: nextId++, x: a.x, z: a.z, aim: a.aim, life: 0.35 });
    let hit = 0;
    for (const b of actors) {
      if (b === a || b.tagged) continue;
      const ox = b.x - a.x, oz = b.z - a.z;
      const d = Math.hypot(ox, oz) || 1e-4;
      if (d > K.hornRange) continue;
      if ((ox*ax + oz*az) / d < K.hornArc) continue;          // outside the cone
      const falloff = 1 - d / K.hornRange * 0.5;
      b.vx += (ox/d) * K.hornKnock * falloff;
      b.vz += (oz/d) * K.hornKnock * falloff;
      if (b.team !== a.team) {
        b.stun = Math.max(b.stun || 0, K.hornStun);
        hit++;
        // startled into dropping it — the horn's real job
        if (b.hasFlag) { dropFlag(b); say('FUMBLE!', TEAMS[a.team].color, 'tag'); }
      }
      b.squash = 0.9;
    }
    if (hit) say('AIR HORN!', 0xffd94a, 'horn'); else say('HOOOONK', 0x9aa4b2, 'horn');
    world.fx?.burst(a.x + ax, a.z + az, ax, az, 14);
  }

  // The Hose: lays down wet grass. Standing on it means almost no grip, so a
  // sprayed lane is a lane nobody can corner out of.
  function spray(a) {
    const H = CFG.kits.hose;
    if (a.sprayCd > 0) return;
    a.sprayCd = H.cooldown;
    const ax = Math.sin(a.aim), az = Math.cos(a.aim);
    const want = Math.hypot((a.aimWX ?? a.x) - a.x, (a.aimWZ ?? a.z) - a.z);
    const dist = Math.max(2, Math.min(H.range, want || H.range));
    const px = a.x + ax * dist, pz = a.z + az * dist;
    // merge into a nearby patch rather than stacking dozens of them
    const near = patches.find(p => Math.hypot(p.x - px, p.z - pz) < H.patchR * 0.6);
    if (near) near.life = H.patchLife;
    else {
      patches.push({ id: nextId++, x: px, z: pz, r: H.patchR, life: H.patchLife, team: a.team });
      if (patches.length > H.maxPatches) patches.shift();
    }
    // the jet nudges whoever is standing in it
    for (const b of actors) {
      if (b === a || b.tagged) continue;
      const d = Math.hypot(b.x - px, b.z - pz);
      if (d < H.patchR + b.r) { b.vx += ax * H.push * 0.4; b.vz += az * H.push * 0.4; b.wet = H.wetTime; }
    }
    world.fx?.trail(px, pz, -ax, -az);
  }

  function placePortal(a) {
    const P = CFG.kits.portal;
    if (a.portalCd > 0) return;
    const ax = Math.sin(a.aim), az = Math.cos(a.aim);
    const dist = Math.min(P.range, Math.hypot(a.aimWX - a.x, a.aimWZ - a.z) || P.range);
    const x = a.x + ax*dist, z = a.z + az*dist;
    const F = RULES.field;
    const px = Math.max(-F.w/2+1, Math.min(F.w/2-1, x));
    const pz = Math.max(-F.h/2+1, Math.min(F.h/2-1, z));
    const mine = portals.filter(p => p.owner === a);
    if (mine.length >= 2) portals.splice(portals.indexOf(mine[0]), 1);   // oldest goes
    const p = { id: nextId++, x: px, z: pz, dx: ax, dz: az, life: P.life, owner: a, team: a.team };
    portals.push(p);
    a.portalCd = P.placeCd;
    say(mine.length === 0 ? 'PORTAL SET' : 'PORTAL LINKED', 0xc46bff);
  }

  function fireGrapple(a) {
    const K = CFG.kits.grapple;
    if (a.grappleCd > 0 || a.grapple) return;
    const ax = Math.sin(a.aim), az = Math.cos(a.aim);

    // 1) the flag, if the line passes near it — yank it home to your hands
    for (const key of ['blue', 'red']) {
      const f = flags[key];
      if (f.carrier || f.air) continue;
      const isSteal  = key !== a.team && !a.hasFlag;
      const isRescue = key === a.team && f.dropped;
      if (!isSteal && !isRescue) continue;
      const ox = f.x - a.x, oz = f.z - a.z;
      const along = ox*ax + oz*az;
      if (along < 1 || along > K.flagRange) continue;
      const off = Math.hypot(ox - ax*along, oz - az*along);
      if (off > 1.25) continue;
      f.air = { zipTo: a, speed: along / K.zipT };
      a.grappleCd = K.cooldown;
      say('HOOKED IT!', 0xffd94a);
      return;
    }

    // 2) the yard: fence or prop along the aim line becomes an anchor
    let hitD = K.range + 1;
    const F = RULES.field;
    // fence walls
    if (ax >  1e-4) hitD = Math.min(hitD, ( F.w/2 - a.x) / ax);
    if (ax < -1e-4) hitD = Math.min(hitD, (-F.w/2 - a.x) / ax);
    if (az >  1e-4) hitD = Math.min(hitD, ( F.h/2 - a.z) / az);
    if (az < -1e-4) hitD = Math.min(hitD, (-F.h/2 - a.z) / az);
    // props: coarse ray-vs-circle
    for (const c of world.colliders) {
      const cr = c.type === 'circle' ? c.r : Math.min(c.hw, c.hh);
      const ox = c.x - a.x, oz = c.z - a.z;
      const along = ox*ax + oz*az;
      if (along < 0.5) continue;
      const off = Math.hypot(ox - ax*along, oz - az*along);
      if (off < cr + 0.3) hitD = Math.min(hitD, along - cr * 0.4);
    }
    if (hitD > K.range) { a.grappleCd = 0.5; say('NO GRIP', 0x9aa4b2); return; }
    a.grapple = { x: a.x + ax*hitD, z: a.z + az*hitD, phase:'pull', t: 0 };
    a.grappleCd = K.cooldown;
    world.fx?.burst(a.x, a.z, -ax, -az, 5);
  }

  function startSwing(a) {
    const K = CFG.kits.kite;
    if (a.swingCd > 0 || a.swing) return;
    const wx = a.aimWX ?? (a.x + Math.sin(a.aim) * 6);
    const wz = a.aimWZ ?? (a.z + Math.cos(a.aim) * 6);
    let ox = wx - a.x, oz = wz - a.z;
    let d = Math.hypot(ox, oz);
    if (d < 0.5) return;
    if (d > K.range) { ox *= K.range/d; oz *= K.range/d; d = K.range; }
    a.swing = { ax: a.x + ox, az: a.z + oz, len: Math.max(K.minLen, d), t: 0 };
    // entering with speed keeps it; entering slow gets a starter push
    if (Math.hypot(a.vx, a.vz) < 5) {
      const tx = -oz/d, tz = ox/d;
      a.vx += tx * 6; a.vz += tz * 6;
    }
    a.squash = 0.5;
  }

  // ─────────────────────────────────────────────────────────
  function step(dt, playerInput) {
    if (G.over) return;
    if (G.phase === 'countdown') {
      G.countT -= dt;
      const n = Math.ceil(G.countT);
      if (n < G.countSaid) {
        G.countSaid = n;
        if (n >= 1 && n <= 3) say(String(n), 0xfff8ea, 'count');
      }
      for (const e of G.events) e.t -= dt;
      G.events = G.events.filter(e => e.t > 0);
      if (G.countT <= 0) { G.phase = 'play'; say('GO!', 0xffd94a, 'go'); }
      return;
    }
    if (G.phase !== 'play') return;
    G.time -= dt;
    G.denyT = Math.max(0, (G.denyT || 0) - dt);
    for (const e of G.events) e.t -= dt;
    G.events = G.events.filter(e => e.t > 0);

    // Phase 1 — decisions from the same frozen snapshot.
    // playerInput may be a function (a, i) => input | null — the server uses
    // this to drive any slot from the network; null hands the slot to a bot.
    const inputs = actors.map((a, i) => {
      const ext = typeof playerInput === 'function' ? playerInput(a, i)
                : (a.isPlayer ? playerInput : null);
      return ext || botInput(a, G, dt);
    });

    // Guard's half-field engine + specials that need the world
    for (let i = 0; i < actors.length; i++) {
      const a = actors[i], inp = inputs[i];
      a.aimWX = inp.aimX; a.aimWZ = inp.aimZ;
      updateAim(a, inp, dt);                    // aim is current before any special fires
      if (a.kit === 'guard') {
        const KG = CFG.kits.guard;
        const home = RULES.base[a.team].x < 0 ? a.x < 0 : a.x > 0;
        a.halfMul = home ? KG.homeSpeed : KG.awaySpeed;
        a.halfMulAccel = home ? KG.homeAccel : KG.awayAccel;
      }
      if (a.tagged) continue;
      // The stun guard in stepActor only covers the kernel-local verbs. These
      // world-entity specials fire from here, before stepActor runs, so without
      // this a stunned Karen could counter-horn you on the very next tick — the
      // horn disabled dash, lunge, roll, hurdle and duck, but not itself.
      // Gate the abilities only: the cooldowns below must still tick, or being
      // stunned would also freeze your recovery.
      const stunned = (a.stun || 0) > 0;
      if (!stunned && inp.primary && a.primary === 'balloon' && a.balloonCd <= 0) fireBalloon(a);
      if (!stunned && inp.special) {
        if (a.special === 'toss')    tossFlag(a);
        if (a.special === 'portal')  placePortal(a);
        if (a.special === 'grapple') fireGrapple(a);
        if (a.special === 'kite')    startSwing(a);
        if (a.special === 'horn')    blowHorn(a);
        if (a.special === 'spray')   spray(a);
      }
      a.balloonCd = Math.max(0, a.balloonCd - dt);
      a.tossCd    = Math.max(0, a.tossCd - dt);
      a.portalCd  = Math.max(0, a.portalCd - dt);
    }

    // Phase 2 — advance everyone
    for (const a of actors) {
      a.trampCd = Math.max(0, (a.trampCd || 0) - dt);
      a.swimming = Math.max(0, (a.swimming || 0) - dt);
    }
    for (let i = 0; i < actors.length; i++) stepActor(actors[i], inputs[i], dt, world);
    separateBodies(actors, world);

    // Hazards: sprinkler streams sweep the yard (curved — water in flight
    // keeps the angle it was launched at)
    G.hazT += dt;
    for (const h of hazards) {
      if (h.kind === 'trampoline') {
        for (const a of actors) {
          if (a.tagged || a.air > 0 || (a.trampCd || 0) > 0) continue;
          if (Math.hypot(a.x - h.x, a.z - h.z) > h.r) continue;
          const sp = Math.hypot(a.vx, a.vz);
          a.vx *= h.boost; a.vz *= h.boost;
          a.air = h.launch; a.airT = h.launch; a.airKind = 'tramp';
          a.trampCd = 0.5;
          world.fx?.burst(a.x, a.z, 0, 0, 16);
          say('BOING!', 0xffd94a, 'boing');
        }
        continue;
      }
      if (h.kind === 'water') {
        for (const a of actors) {
          if (a.tagged || a.air > 0) continue;
          if (Math.hypot(a.x - h.x, a.z - h.z) > h.r) continue;
          a.vx *= Math.exp(-h.drag * dt * 6); a.vz *= Math.exp(-h.drag * dt * 6);
          a.swimming = 0.15;
          a.wet = Math.max(a.wet || 0, h.wet);
        }
        continue;
      }
      if (h.kind === 'spinner') {
        // The roundabout: a corner you do not carve yourself. Standing on it
        // rotates your velocity around its centre, so you leave pointing
        // somewhere you did not aim — and leave FASTER than you arrived if you
        // time stepping off. Capped by maxT so it cannot be used as a parking
        // spot, and it lets go of you the moment you are airborne.
        for (const a of actors) {
          if (a.tagged || a.air > 0) { a.spinT = 0; continue; }
          const on = Math.hypot(a.x - h.x, a.z - h.z) <= h.r;
          if (!on) {
            // stepping off with speed flings you along the tangent
            if ((a.spinT || 0) > 0.08) {
              const sp = Math.hypot(a.vx, a.vz);
              if (sp > 0.5) {
                const boost = Math.min(h.exitMax, sp * h.exit) / sp;
                a.vx *= boost; a.vz *= boost;
              }
            }
            a.spinT = 0;
            continue;
          }
          if ((a.spinT || 0) >= h.maxT) continue;      // it will only carry you so far
          a.spinT = (a.spinT || 0) + dt;
          const th = h.omega * dt;
          const c = Math.cos(th), s = Math.sin(th);
          const vx = a.vx * c - a.vz * s;              // rotate the velocity, not the body
          const vz = a.vx * s + a.vz * c;
          a.vx = vx * h.grip + a.vx * (1 - h.grip);
          a.vz = vz * h.grip + a.vz * (1 - h.grip);
        }
        continue;
      }
      if (h.kind === 'ice') {
        // Frozen ground. Deliberately reuses a.wet rather than adding a field:
        // wet already means "almost no grip" to the kernel, and now to braking
        // too, so ice is a surface you commit to rather than a wall you avoid.
        // It is renewed every tick you are on it, so you slide off the far edge
        // instead of stopping neatly at it.
        for (const a of actors) {
          if (a.tagged || a.air > 0) continue;      // sledding over it doesn't count
          if (Math.hypot(a.x - h.x, a.z - h.z) > h.r) continue;
          a.wet = Math.max(a.wet || 0, h.slick);
          a.onIce = 0.1;                            // view-only: skate marks and posture
        }
        continue;
      }
      if (h.kind !== 'sprinkler') continue;
      const arm = h.phase + G.hazT * h.speed;
      for (const a of actors) {
        if (a.tagged) continue;
        const ox = a.x - h.x, oz = a.z - h.z;
        const along = Math.hypot(ox, oz);
        if (along < 0.9 || along > h.len) continue;
        const sa = streamAngle(h, arm, along);
        let dA = Math.atan2(oz, ox) - sa;
        dA = Math.atan2(Math.sin(dA), Math.cos(dA));
        const halfWidth = (0.35 + along * 0.06) / along;     // angular half-width at this range
        if (Math.abs(dA) > halfWidth) continue;
        // shoved the way the stream is sweeping, and soaked
        const tx = -Math.sin(sa), tz = Math.cos(sa);
        const dir = h.speed > 0 ? 1 : -1;
        a.vx += tx * dir * 11 * dt; a.vz += tz * dir * 11 * dt;
        a.vx += Math.cos(sa) * 3 * dt; a.vz += Math.sin(sa) * 3 * dt;
        a.wet = 0.7;
      }
    }

    // Wet grass: patches fade, and anyone standing on one stays soaked
    for (let i = patches.length - 1; i >= 0; i--) {
      const p = patches[i];
      p.life -= dt;
      if (p.life <= 0) { patches.splice(i, 1); continue; }
      for (const a of actors) {
        if (a.tagged || a.air > 0) continue;                  // hurdling clears the puddle
        if (a.team === p.team) continue;                      // his side knows where the water is
        if (Math.hypot(a.x - p.x, a.z - p.z) < p.r + a.r * 0.5) a.wet = Math.max(a.wet || 0, CFG.kits.hose.wetTime);
      }
    }
    for (let i = horns.length - 1; i >= 0; i--) { horns[i].life -= dt; if (horns[i].life <= 0) horns.splice(i, 1); }

    // Portals: pads are world plumbing — anyone steps through
    const PT = CFG.kits.portal;
    for (let i = portals.length - 1; i >= 0; i--) {
      const p = portals[i];
      p.life -= dt;
      if (p.life <= 0) { portals.splice(i, 1); continue; }
    }
    for (const a of actors) {
      if (a.tagged || a.tpCd > 0) continue;
      for (const p of portals) {
        const twin = portals.find(q => q !== p && q.owner === p.owner);
        if (!twin) continue;
        if (Math.hypot(a.x - p.x, a.z - p.z) > PT.padR) continue;
        // out the other side, velocity rotated onto the exit facing
        const sp = Math.hypot(a.vx, a.vz);
        a.x = a.px = twin.x + twin.dx * PT.exitPush;
        a.z = a.pz = twin.z + twin.dz * PT.exitPush;
        a.vx = twin.dx * sp; a.vz = twin.dz * sp;
        a.facing = Math.atan2(twin.dx, twin.dz);
        a.tpCd = PT.tpCd;
        world.fx?.burst(p.x, p.z, 0, 0, 10);
        world.fx?.burst(twin.x, twin.z, 0, 0, 10);
        break;
      }
    }

    // Balloons fly, splash, tag
    const BC = CFG.kits.balloon;
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      b.life -= dt;
      b.x += b.vx * dt; b.z += b.vz * dt;
      let popped = b.life <= 0;
      const F = RULES.field;
      if (Math.abs(b.x) > F.w/2 || Math.abs(b.z) > F.h/2) popped = true;
      if (!popped) {
        for (const a of actors) {
          if (a.team === b.team || !isTaggable(a)) continue;
          if (Math.hypot(a.x - b.x, a.z - b.z) < a.r + BC.r) { popped = true; break; }
        }
      }
      if (popped) {
        for (const a of actors) {
          if (a.team === b.team || !isTaggable(a)) continue;
          const d = Math.hypot(a.x - b.x, a.z - b.z);
          if (d < a.r + BC.splash) tagOut(b.owner, a, d);
        }
        world.fx?.burst(b.x, b.z, 0, 0, 12);
        balloons.splice(i, 1);
      }
    }

    // Phase 3 — melee tags gathered, then applied at once. Simultaneous
    // lunges trade: both go down, no array-order favoritism.
    const hits = [];
    for (const a of actors) {
      if (a.tagged) continue;
      if (isLunging(a)) {
        for (const b of actors) {
          if (b.team === a.team || !isTaggable(b)) continue;
          const d = Math.hypot(a.x - b.x, a.z - b.z);
          if (d > b.r + lungeReach(a)) continue;
          hits.push({ a, b, d, tag: true });
          a.lunge.hit = true;
          break;
        }
      } else if (isRolling(a)) {
        // the Guard's roll bowls people over — a shove, not a tag
        for (const b of actors) {
          if (b.team === a.team || !isTaggable(b)) continue;
          const d = Math.hypot(a.x - b.x, a.z - b.z);
          if (d > b.r + a.r + 0.25) continue;
          hits.push({ a, b, d, tag: false });
        }
      }
    }
    for (const { a, b, d, tag } of hits) {
      if (tag) tagOut(a, b, d);
      else {
        const nx = (b.x - a.x)/(d || 1), nz = (b.z - a.z)/(d || 1);
        b.vx += nx * CFG.kits.guard.rollKnock;
        b.vz += nz * CFG.kits.guard.rollKnock;
        b.squash = 0.8;
        // The roll knocks the ball loose. It is not a tag — you stay on your
        // feet — but you are not walking out of his half with it either.
        // This is what makes the Guard worth a roster slot: he scores nothing
        // himself (0.06 flag grabs a game), so his defence has to convert.
        if (b.hasFlag) {
          dropFlag(b);
          say(`${a.team.toUpperCase()} KNOCKS IT LOOSE`, TEAMS[a.team].color, 'tag');
        }
        world.fx?.burst(b.x, b.z, nx, nz, 8);
      }
    }

    // Flags
    for (const key of ['blue', 'red']) {
      const f = flags[key];

      if (f.air) {                          // in flight: a toss or a grapple zip
        const t = f.air.target ?? f.air.zipTo;
        if (!t || t.tagged) { f.air = null; f.dropped = true; f.returnT = CFG.match.flagReturn; }
        else {
          let ox = t.x - f.x, oz = t.z - f.z;
          const d = Math.hypot(ox, oz) || 1e-4;
          const step = f.air.speed * dt;
          if (d <= Math.max(step, f.air.target ? catchRadius(t) : 0.9)) {
            f.x = t.x; f.z = t.z; f.air = null;
            if (key !== t.team && !t.hasFlag) {
              f.carrier = t; f.home = false; f.dropped = false; t.hasFlag = f;
              say('CAUGHT!', TEAMS[t.team].color, 'catch');
            } else if (key === t.team) { returnFlag(f); say('FLAG RETURNED', TEAMS[key].color); }
            else { f.dropped = true; f.returnT = CFG.match.flagReturn; }
          } else { f.x += ox/d * step; f.z += oz/d * step; }
        }
        continue;
      }

      if (f.carrier) {
        if (f.carrier.tagged) dropFlag(f.carrier);
        else { f.x = f.carrier.x; f.z = f.carrier.z; }
      } else if (f.dropped) {
        f.lock = Math.max(0, (f.lock || 0) - dt);
        f.returnT -= dt;
        if (f.returnT <= 0) { returnFlag(f); say(`${key.toUpperCase()} FLAG RETURNED`, TEAMS[key].color); }
      }

      // contested pickups go to whoever is genuinely closest
      let claim = null, claimD = 1e9, returner = false;
      for (const a of actors) {
        if (a.tagged || (f.lock || 0) > 0) continue;
        const reach = a.r + (a.kit === 'grappler' ? CFG.kits.grapple.pickupR : CFG.match.pickupR);
        const d = Math.hypot(a.x - f.x, a.z - f.z);
        if (d > reach) continue;
        if (a.team === f.team) { if (f.dropped) returner = true; }
        else if (!f.carrier && !a.hasFlag && d < claimD) { claim = a; claimD = d; }
      }
      if (returner) { returnFlag(f); say('FLAG RETURNED', TEAMS[key].color, 'return'); }
      else if (claim) {
        if (f.home) G.tally[claim.team].grabs++;    // a fresh grab, not a loose-ball recovery
        f.carrier = claim; f.dropped = false; f.home = false; claim.hasFlag = f;
        say(`${claim.team.toUpperCase()} HAS THE FLAG`, TEAMS[claim.team].color, 'pickup');
      }
    }

    // Scoring — your own flag must be home
    for (const a of actors) {
      if (!a.hasFlag) continue;
      const B = RULES.base[a.team];
      if (Math.hypot(a.x - B.x, a.z - B.z) > 2.5) continue;
      if (!flags[a.team].home) {
        // You are standing on your own base holding their flag and nothing
        // happens, with no toast, no sound and no denial cue. Say so — but only
        // once every couple of seconds, or it fires every tick you stand there.
        if (a.isPlayer && (G.denyT || 0) <= 0) {
          G.denyT = 2.4;
          say('YOUR FLAG IS OUT — GET IT BACK', TEAMS[a.team].color, 'deny');
        }
        continue;
      }
      const f = a.hasFlag;
      a.hasFlag = null; returnFlag(f);
      score[a.team]++; G.tally[a.team].caps++;
      say(`${a.team.toUpperCase()} SCORES!`, TEAMS[a.team].color, 'score');
      G.lastScore = { x: B.x, z: B.z, team: a.team };
      world.fx?.burst(B.x, B.z, 0, 0, 40);
      if (score[a.team] >= RULES.scoreToWin || G.overtime) {
        G.over = a.team;
        say('', 0, 'gameover');               // the score toast already announced it
      }
    }

    if (G.time <= 0 && !G.over) {
      if (score.blue !== score.red) {
        G.over = score.blue > score.red ? 'blue' : 'red';
        // a clock ending was completely silent — no event, no sting, the match
        // just stopped. Pure data; the view decides what it sounds like.
        say(`${G.over.toUpperCase()} WINS ON TIME`, TEAMS[G.over].color, 'gameover');
      } else if (!G.overtime) {
        // nobody goes home on a tie: one more minute, next capture wins
        G.overtime = true; G.time = 60;
        say('OVERTIME — NEXT CAPTURE WINS', 0xffd94a, 'overtime');
      } else { G.over = 'draw'; say('A DRAW — RECESS IS OVER', 0xfff8ea, 'gameover'); }
    }
  }

  function catchRadius(t) {
    return t.kit === 'dog' ? CFG.kits.dog.catchR : CFG.kits.toss.catchR;
  }

  return G;
}

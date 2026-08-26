// ─────────────────────────────────────────────────────────────
// Maps as pure data. Same footprint for all (camera, fence, balance), half
// the props authored and mirrored 180° so every map is fair by construction.
// world.js turns props into meshes; the sim only reads colliders/hazards.
// ─────────────────────────────────────────────────────────────
import { MATCH_DEFAULTS } from './config.js';

export const MAPS = {
  backyard: {
    name: 'Backyard', outdoor: true, ground: 'grass', border: 'fence', scatter: true,
    field: { w: 48, h: 33 }, teamSize: 3, baseX: 19.0,
    half: [
      { k:'tree',    x:-8.5,  z:-5.0,  col:{ type:'circle', r:0.95 } },
      { k:'hedge',   x:-9.0,  z: 5.5,  hw:3.2, hh:0.85, col:{ type:'box', hw:3.2, hh:0.85, low:true } },
      { k:'sandbox', x:-15.0, z:-9.0,  col:{ type:'box', hw:2.2, hh:2.2 } },
      { k:'pool',    x:-3.5,  z: 10.5, col:{ type:'circle', r:2.3 } },
      { k:'chair',   x:-16.5, z: 6.0,  col:{ type:'circle', r:0.75, low:true } },
      { k:'ball',    x:-12.0, z: 1.5,  col:null },
    ],
    center: [{ k:'stump', x:0, z:0, col:{ type:'circle', r:1.05 } }],
  },
  field: {
    name: 'PE Field', outdoor: true, ground: 'turf', border: 'stadium', scatter: false,
    field: { w: 48, h: 33 }, teamSize: 3, baseX: 19.0,
    half: [
      { k:'sled',     x:-8.0,  z:-5.5, col:{ type:'box', hw:1.3, hh:0.55, low:true } },
      { k:'dummy',    x:-4.0,  z: 6.5, col:{ type:'circle', r:0.5 } },
      { k:'dummy',    x:-11.5, z: 4.0, col:{ type:'circle', r:0.5 } },
      { k:'cooler',   x:-15.0, z:-9.5, col:{ type:'box', hw:0.9, hh:0.6 } },
      { k:'bench',    x:-16.0, z: 9.0, col:{ type:'box', hw:1.6, hh:0.45, low:true } },
      { k:'cone',     x:-6.0,  z:-11,  col:null },
      { k:'cone',     x:-13.0, z:-2.5, col:null },
      { k:'cone',     x:-2.5,  z: 2.5, col:null },
      { k:'goalpost', x:-23.0, z: 0,   col:{ type:'box', hw:0.25, hh:2.6 } },
    ],
    center: [{ k:'tee', x:0, z:0, col:null }],
  },
  gym: {
    name: 'Gymnasium', outdoor: false, ground: 'hardwood', border: 'walls', scatter: false,
    field: { w: 48, h: 33 }, teamSize: 3, baseX: 19.0,
    half: [
      { k:'hoop',     x:-22.3, z: 0,    col:{ type:'circle', r:0.55 } },
      { k:'rack',     x:-10.0, z:-8.5,  col:{ type:'box', hw:1.3, hh:0.5, low:true } },
      { k:'matstack', x:-6.0,  z: 5.0,  col:{ type:'box', hw:1.5, hh:1.0, low:true } },
      { k:'matstack', x:-13.0, z: 2.0,  col:{ type:'box', hw:1.0, hh:1.5, low:true } },
      { k:'bench',    x:-16.5, z: 8.5,  col:{ type:'box', hw:1.6, hh:0.45, low:true } },
      { k:'scooter',  x:-3.5,  z:-9.0,  col:null },
      { k:'scooter',  x:-17.0, z:-3.5,  col:null },
    ],
    center: [{ k:'centerlogo', x:0, z:0, col:null }],
  },
  // ── The Cul-de-Sac ────────────────────────────────────────────────
  // The first map whose cover is TALL, SOLID and CONVEX. Every other 3v3 map's
  // furniture is soft (hedge, matstack — hurdled and ducked) or one fat blob
  // (sandbox, pool). Six cars here are boxes you cannot go over, so a lunge duel
  // becomes an orbit: whoever holds the inside line of a car wins the corner.
  //
  // It also inverts the routing maths. backyard/field/gym all put the flags 38m
  // apart in a 33m-deep pitch, so any lateral route is a detour and everybody
  // meets frontally at midfield. Here it is 34m apart in a 36m-deep pitch, so
  // going sideways genuinely competes with going forward and the three lanes
  // are real choices.
  //
  // Because the half is mirrored 180° rather than reflected, each lane CHANGES
  // CHARACTER halfway across: you leave home screened by the van and arrive
  // naked into their bin squeeze, or cross your own open ground and arrive into
  // their cover. You pick a lane at your base and inherit a different problem.
  culdesac: {
    name: 'The Cul-de-Sac', outdoor: true, ground: 'asphalt', border: 'culdesac', scatter: false,
    field: { w: 44, h: 36 }, teamSize: 3, baseX: 17.0,
    half: [
      { k:'hoop',    x:-14.6, z:  6.8, col:{ type:'circle', r:0.55 } },        // over the garage
      { k:'car',     x:-12.2, z: -4.2, col:{ type:'box', hw:2.15, hh:0.95 } }, // hatchback across the driveway shoulder
      { k:'van',     x:-11.0, z:-11.0, col:{ type:'box', hw:2.6,  hh:1.15 } }, // the sight-blocker
      { k:'hedge',   x:-10.6, z:-15.7, hw:3.4, hh:0.85,
                     col:{ type:'box', hw:3.4, hh:0.85, low:true } },          // alley wall — hurdle or duck it
      { k:'hydrant', x: -8.0, z: 13.4, col:{ type:'circle', r:0.34 } },
      { k:'car',     x: -6.0, z: -4.6, col:{ type:'box', hw:1.0, hh:2.3 } },   // nosed in — THE orbit piece
      { k:'ramp',    x: -4.5, z:-12.8, col:null },                             // launch pad, no wall
      { k:'bin',     x: -4.2, z:  8.75, col:{ type:'circle', r:0.46 } },       // choke: 1.53m clear between
      { k:'bin',     x: -4.2, z: 11.20, col:{ type:'circle', r:0.46 } },       // matches the drawn bins; the Guard (r 0.80) still cannot thread it
      { k:'cone',    x: -2.6, z: -7.4, col:null },
      { k:'cone',    x:-13.0, z:  1.4, col:null },
      { k:'scooter', x:-16.2, z:  3.3, col:null },
      { k:'ball',    x:-11.6, z:  8.2, col:null },
    ],
    center: [
      // low: an ankle-height grate you hurdle or duck, not a wall at the exact
      // centre of the base-to-base line
      { k:'drain', x:0, z:0, col:{ type:'circle', r:0.9, low:true } },
    ],
  },
  // ── The Winter Yard ───────────────────────────────────────────────
  // The other maps are about geometry; this one is about TRACTION, and it is
  // the first map where the ground decides whether you can turn. Ice renews
  // a.wet every tick you stand on it, which the kernel already reads as almost
  // no grip — and, since braking now obeys the surface too, you slide off the
  // far edge of the pond rather than stopping at it.
  //
  // The pond sits dead on the base-to-base line, and going round its rim costs
  // about 1.4m of a 38m trip. So it is never a wall — it is a bet: the short
  // way is a committed straight line where you cannot dodge a lunge.
  //
  // The sled ramps close a loop. You go out over the north ramp and land on
  // their ice; you come home over the south one and land on your own. A blown
  // landing overruns into a low sled pile you have to hurdle — a real skill
  // test on the fast route with a survivable failure.
  winter: {
    name: 'The Winter Yard', outdoor: true, ground: 'snow', border: 'drift', scatter: false,
    field: { w: 48, h: 33 }, teamSize: 3, baseX: 19.0,
    half: [
      { k:'snowfort',  x:-14.2, z: -4.4, col:{ type:'box', hw:0.9, hh:2.6, low:true } },
      { k:'snowfort',  x:-14.2, z:  4.4, col:{ type:'box', hw:0.9, hh:2.6, low:true } },
      { k:'baretree',  x:-18.5, z: -9.5, col:{ type:'circle', r:0.95 } },
      { k:'snowbank',  x:-11.0, z:-11.8, hw:4.2, hh:1.0,
                       col:{ type:'box', hw:4.2, hh:1.0, low:true } },   // the plough ridge
      { k:'snowman',   x: -7.4, z: -7.8, col:{ type:'circle', r:0.85 } },
      { k:'sledramp',  x: -3.0, z:-11.0, col:null },
      { k:'snowbank',  x: -5.6, z: -2.4, hw:1.5, hh:0.85,
                       col:{ type:'box', hw:1.5, hh:0.85, low:true } },
      { k:'snowballs', x:-10.0, z: -3.0, col:null },
      { k:'firepit',   x:-17.0, z: 13.2, col:{ type:'circle', r:1.15 } },
      { k:'sledpile',  x:-12.0, z: 12.8, hw:1.4, hh:0.7,
                       col:{ type:'box', hw:1.4, hh:0.7, low:true } },
    ],
    center: [
      { k:'icepond', x:0, z:0, col:null },    // a bet, not a wall
    ],
  },
  // ── The Blacktop ──────────────────────────────────────────────────
  // The school lot at morning recess. Where the other 3v3 maps scatter
  // furniture across an open rectangle, this one is DENSE: roughly twice the
  // collider count, with real chokepoints and a climbing dome sitting exactly
  // where centre court should be, so the middle is something you go around or
  // through rather than across.
  //
  // Two new verbs make the lanes cost something. The roundabout spins your
  // velocity while you stand on it, so the fast diagonal hands you a corner you
  // did not choose — and pays you for stepping off it at the right moment. The
  // puddles reuse the water hazard with almost no drag, so they do not slow you,
  // they just take your grip exactly where the quick line has to change
  // direction. Both punish a greedy route rather than bad luck.
  blacktop: {
    name: 'The Blacktop', outdoor: true, ground: 'blacktop', border: 'chainlink', scatter: false,
    field: { w: 48, h: 33 }, teamSize: 3, baseX: 19.0,
    half: [
      { k:'junglegym',  x:  0.0, z: -8.6, col:{ type:'box', hw:1.7, hh:2.4 } },
      { k:'wallball',   x:-15.0, z: -7.0, col:{ type:'box', hw:0.45, hh:3.0 } },
      { k:'tetherball', x:-13.6, z: -2.4, col:{ type:'circle', r:0.34 } },
      { k:'bikerack',   x:-20.5, z:-12.2, hw:1.5, hh:0.45,
                        col:{ type:'box', hw:1.5, hh:0.45, low:true } },
      { k:'hopscotch',  x:-21.8, z:  3.2, col:null },
      { k:'hoop',       x:-17.6, z:  7.4, col:{ type:'circle', r:0.55 } },
      { k:'courtkey',   x:-13.6, z:  7.4, col:null },
      { k:'foursquare', x:-19.5, z: 13.2, col:null },
      { k:'foursquare', x:-13.2, z: 13.2, col:null },
      { k:'bench',      x:-21.0, z: 15.0, hw:1.6, hh:0.45,
                        col:{ type:'box', hw:1.6, hh:0.45, low:true } },
      { k:'swings',     x:-11.6, z: -4.0, hw:0.45, hh:3.4,
                        col:{ type:'box', hw:0.45, hh:3.4, low:true } },
      { k:'tunnel',     x: -8.2, z: -8.6, hw:1.4, hh:0.55,
                        col:{ type:'box', hw:1.4, hh:0.55, low:true } },
      { k:'slide',      x:-11.8, z:-12.4, col:{ type:'box', hw:1.0, hh:1.9 } },
      { k:'junglegym',  x: -5.4, z:-13.6, col:{ type:'box', hw:1.5, hh:1.5 } },
      { k:'mulchpad',   x: -6.5, z:-11.5, col:null },
      { k:'spinner',    x: -9.6, z:  8.6, col:null },
      { k:'puddle',     x: -3.6, z: 12.6, col:null },
      { k:'tetherball', x: -6.6, z:  4.6, col:{ type:'circle', r:0.34 } },
      { k:'cone',       x:-16.8, z:  1.6, col:null },
      { k:'ball',       x: -8.8, z: -1.6, col:null },
    ],
    center: [
      { k:'dome', x:0, z:0, col:{ type:'circle', r:2.5 } },
    ],
  },
  // ── The Splash Pad ────────────────────────────────────────────────
  // The one house on the street with the big above-ground pool, two in the
  // afternoon in August. The first 4v4 map, and the first where the pool is a
  // WALL rather than a route: you run around it, and it sits dead centre, so
  // the short line between the flags does not exist.
  //
  // Everything else is about traction. Three slip-n-slide lanes run down one
  // flank as a continuous slick ribbon — the fastest way across the map and the
  // one where you cannot change your mind — and because the half is mirrored
  // 180°, the lane that speeds you out of your own end is the one that dumps
  // you into their deck. Sprinklers keep the middle wet on a timer, the
  // springboards fling you over the pool shoulder, and nobody can stop where
  // they meant to.
  splashpad: {
    name: 'The Splash Pad', outdoor: true, ground: 'poolside', border: 'poolfence', scatter: true,
    field: { w: 56, h: 36 }, teamSize: 4, baseX: 22.0,
    half: [
      { k:'slidetower', x:-25.8, z:-13.2, col:{ type:'circle', r:1.15 } },
      { k:'slidelane',  x:-21.0, z:-13.2, col:null },
      { k:'slidelane',  x:-15.0, z:-13.2, col:null },
      { k:'slidelane',  x: -9.0, z:-13.2, col:null },
      { k:'hedge',      x:-19.0, z:-10.4, hw:2.6, hh:0.85,
                        col:{ type:'box', hw:2.6, hh:0.85, low:true } },
      { k:'hedge',      x:-11.0, z:-10.4, hw:2.4, hh:0.85,
                        col:{ type:'box', hw:2.4, hh:0.85, low:true } },
      { k:'kiddiepool', x:-11.5, z: -7.0, col:{ type:'circle', r:1.6, low:true } },
      { k:'towelrack',  x:-13.0, z: -1.0, hw:1.4, hh:0.45,
                        col:{ type:'box', hw:1.4, hh:0.45, low:true } },
      { k:'chair',      x: -4.0, z: -9.5, col:{ type:'circle', r:0.75, low:true } },
      { k:'deckrail',   x: -6.5, z:  8.5, col:{ type:'box', hw:3.4, hh:0.5 } },
      { k:'cooler',     x:-19.5, z:  6.5, col:{ type:'box', hw:0.9, hh:0.6 } },
      { k:'bench',      x:-15.0, z: 12.5, hw:1.6, hh:0.45,
                        col:{ type:'box', hw:1.6, hh:0.45, low:true } },
      { k:'umbrella',   x:  0.0, z: -8.0, col:{ type:'circle', r:0.9 } },
      { k:'hosereel',   x:  0.0, z:-16.8, col:null },
      { k:'shed',       x:-24.5, z: 11.0, col:{ type:'box', hw:2.6, hh:2.0 } },
      { k:'ball',       x:-17.5, z: -6.0, col:null },
      { k:'cone',       x: -3.0, z: 13.5, col:null },
      { k:'springboard',x: -6.6, z: -5.6, col:null },
    ],
    center: [
      { k:'aboveground', x:0, z:0, col:{ type:'circle', r:3.6 } },   // a wall, not a route
    ],
  },
  block: {
    name: 'The Block', outdoor: true, ground: 'grass', border: 'fence', scatter: true,
    field: { w: 112, h: 38 }, teamSize: 5, baseX: 48.0,   // one flag per END yard, not both in the middle
    // 5v5 needs its own match rules, not the 3v3 ones. On a field 2.3x as long
    // a race to 3 is unreachable — measured bot-vs-bot, only 2 matches in 26
    // were decided by the score at all; the other 24 ran out the clock. A race
    // to 2 with a longer respawn makes the carry convert: 19 of 26 now end on
    // merit, in 178s. Shortening the map instead was tried and made it worse.
    match: { scoreToWin: 2, duration: 240, respawn: 5.1 },
    // Three yards chained end to end, divided by neighbours' fences with gaps
    // you have to route through. ~2.7x the area of a single backyard.
    // Fairness rule still holds: half is authored, half is the 180° mirror —
    // so the pool sits dead centre (self-symmetric) and the trampolines come
    // as a mirrored pair, one per end yard.
    half: [
      // --- end yard (mirrored to the far end) ---
      { k:'stump',      x:  0.0, z:-13.5, col:{ type:'circle', r:1.05 } },  // mirrored to (0, +13.5)
      { k:'trampoline', x:-40.0, z:  6.0, col:null },      // you bounce ON it, not off it
      { k:'shed',       x:-47.0, z:-10.0, col:{ type:'box', hw:2.6, hh:2.0 } },
      { k:'hedge',      x:-33.0, z:-10.5, hw:4.0, hh:0.85, col:{ type:'box', hw:4.0, hh:0.85, low:true } },
      { k:'tree',       x:-28.0, z:  9.5, col:{ type:'circle', r:0.95 } },
      { k:'sandbox',    x:-45.0, z:  9.0, col:{ type:'box', hw:2.2, hh:2.2 } },
      { k:'chair',      x:-51.0, z:  4.0, col:{ type:'circle', r:0.75, low:true } },
      // --- the divider fence between yards, with a gap top and bottom ---
      { k:'divider',    x:-18.0, z:-13.0, hw:0.5, hh:5.0, col:{ type:'box', hw:0.5, hh:5.0 } },
      { k:'divider',    x:-18.0, z:  6.5, hw:0.5, hh:4.0, col:{ type:'box', hw:0.5, hh:4.0 } },
      // --- middle yard ---
      { k:'hedge',      x:-11.0, z:  9.0, hw:3.0, hh:0.85, col:{ type:'box', hw:3.0, hh:0.85, low:true } },
      { k:'tree',       x: -8.0, z:-10.0, col:{ type:'circle', r:0.95 } },
      { k:'ball',       x:-14.0, z: -2.0, col:null },
    ],
    center: [
      { k:'pool',    x:0, z:0, big:true, col:null },        // swimmable: the deep end is a hazard, not a wall
    ],
  },
};
export const MAP_KEYS = Object.keys(MAPS);

// Field size and team size travel with the map. CFG is global, so this is the
// single place that reconciles them — call it before makeGame/buildWorld.
export function applyMapConfig(CFG, mapKey, TEAMS) {
  const M = MAPS[mapKey] || MAPS.backyard;
  CFG.field.w = M.field.w; CFG.field.h = M.field.h;
  CFG.match.teamSize = M.teamSize;
  if (TEAMS) { TEAMS.blue.base.x = -M.baseX; TEAMS.red.base.x = M.baseX; }
  // Always write the whole set, never just the overrides — otherwise one
  // match on The Block would leave its rules behind for the next backyard game.
  const m = { ...MATCH_DEFAULTS, ...(M.match || {}) };
  CFG.match.scoreToWin = m.scoreToWin;
  CFG.match.duration   = m.duration;
  CFG.tag.respawn      = m.respawn;
  return M;
}

export function props(map = 'backyard') {
  const M = MAPS[map] || MAPS.backyard;
  const out = [];
  for (const p of M.half) { out.push(p); out.push({ ...p, x: -p.x, z: -p.z, rot: Math.PI }); }
  for (const p of M.center) out.push(p);
  return out;
}
export function colliders(map = 'backyard') {
  return props(map).filter(p => p.col).map(p => ({ ...p.col, x: p.x, z: p.z }));
}

// Hazards are per-map-per-yard. Sprinklers come on in the backyard at night:
// a rotating stream that shoves you sideways and leaves you WET — near-zero
// grip for a moment. Water in flight keeps its launch angle, so the stream
// lags the arm in a curve; sim and view share streamAngle().
const SPRINKLERS = [
  { x: -7.5, z: -1.5, speed: 0.9, len: 6.5, phase: 0, flight: 0.8 },
];
export const streamAngle = (h, armAng, along) => armAng - (along / h.len) * h.flight * h.speed;
export function hazards(yard, map = 'backyard') {
  const out = [];
  if (map === 'backyard' && yard === 'night') {
    // A 180° position mirror has to rotate the arm 180° too. This read
    // `phase: Math.PI`, which is only correct while the authored phase is 0.
    for (const h of SPRINKLERS) {
      out.push({ ...h, kind: 'sprinkler' });
      out.push({ ...h, x: -h.x, z: -h.z, phase: h.phase + Math.PI, kind: 'sprinkler' });
    }
  }
  if (map === 'splashpad') {
    // Slick is the same verb the Winter Yard's ice uses — near-zero grip that
    // renews while you stand in it — because "wet" is what the kernel already
    // understands and a second name for it would be a second thing to keep in
    // step. Every pair is authored by hand; hazards() is not mirrored.
    const WET = (x, z, r) => { out.push({ kind: 'ice', x, z, r, slick: 0.34 });
                               out.push({ kind: 'ice', x: -x, z: -z, r, slick: 0.34 }); };
    out.push({ kind: 'ice', x: 0, z: 0, r: 5.0, slick: 0.34 });   // the wet ring round the pool
    WET(-21.0, -13.2, 2.6);        // the slip-n-slide, three lanes end to end
    WET(-15.0, -13.2, 2.6);
    WET( -9.0, -13.2, 2.6);
    const SPR = { speed: 0.8, len: 6.8, flight: 0.7 };
    out.push({ ...SPR, kind: 'sprinkler', x: -14.0, z: -3.0, phase: 0 });
    out.push({ ...SPR, kind: 'sprinkler', x:  14.0, z:  3.0, phase: Math.PI });
    // springboards at the pool shoulder — over the wall rather than around it
    out.push({ kind: 'trampoline', x: -6.6, z: -5.6, r: 1.4, launch: 0.5, boost: 1.28 });
    out.push({ kind: 'trampoline', x:  6.6, z:  5.6, r: 1.4, launch: 0.5, boost: 1.28 });
  }
  if (map === 'blacktop') {
    // hazards() is not run through the props() mirror, so both halves of every
    // pair are authored by hand, the way the sprinklers and trampolines are.
    const SPIN = { r: 1.9, omega: 4.2, grip: 0.55, exit: 1.45, exitMax: 13.0, maxT: 0.9 };
    out.push({ ...SPIN, kind: 'spinner', x: -9.6, z:  8.6 });
    out.push({ ...SPIN, kind: 'spinner', x:  9.6, z: -8.6 });
    // Shallow, unlike The Block's deep end: almost no drag, so it does not slow
    // you — it just takes your grip where the fast diagonal has to turn.
    out.push({ kind: 'water', x: -3.6, z: 12.6, r: 2.2, drag: 0.06, wet: 1.1 });
    out.push({ kind: 'water', x:  3.6, z:-12.6, r: 2.2, drag: 0.06, wet: 1.1 });
  }
  if (map === 'winter') {
    // The pond, plus a landing ribbon under each sled ramp. hazards() does not
    // auto-mirror, so every entry is pushed as an explicit pair, exactly the way
    // the sprinklers and The Block's trampolines are.
    const ICE = (x, z, r) => { out.push({ kind: 'ice', x, z, r, slick: 0.30 });
                               out.push({ kind: 'ice', x: -x, z: -z, r, slick: 0.30 }); };
    out.push({ kind: 'ice', x: 0, z: 0, r: 4.6, slick: 0.30 });   // self-symmetric
    ICE(  4.0, -10.4, 3.4);        // near half of the landing ribbon
    ICE( 10.4,  -9.6, 4.0);        // far half — sized to catch a dashed launch
    // The sled run. Flatter and longer than The Block's trampolines.
    out.push({ kind: 'trampoline', x: -3.0, z: -11.0, r: 3.2, launch: 0.68, boost: 1.42 });
    out.push({ kind: 'trampoline', x:  3.0, z:  11.0, r: 3.2, launch: 0.68, boost: 1.42 });
  }
  if (map === 'culdesac') {
    // Open hydrants. Same verb as the backyard sprinklers, slower so the sweep
    // is readable, and aimed so each one sweeps the OTHER team's approach to
    // the bin squeeze — thread it wet and you slide out the far side.
    const HYD = { speed: 0.72, len: 7.4, flight: 0.65 };
    out.push({ ...HYD, kind: 'sprinkler', head: 'hydrant', x: -8.0, z:  13.4, phase: 0 });
    out.push({ ...HYD, kind: 'sprinkler', head: 'hydrant', x:  8.0, z: -13.4, phase: Math.PI });
    // Plywood bike ramps on cinder blocks. Dialled well down from The Block's
    // trampolines: r 1.5 is a sheet you have to actually hit, and the hop
    // clears the mouth of an alley without skipping a whole lane.
    out.push({ kind: 'trampoline', x: -4.5, z: -12.8, r: 1.5, launch: 0.42, boost: 1.22 });
    out.push({ kind: 'trampoline', x:  4.5, z:  12.8, r: 1.5, launch: 0.42, boost: 1.22 });
  }
  if (map === 'block') {
    // trampolines fling you over the divider fences — the fastest route
    // between yards, if you can aim a bounce
    out.push({ kind: 'trampoline', x: -40, z: 6, r: 3.2, launch: 0.62, boost: 1.35 });
    out.push({ kind: 'trampoline', x:  40, z: -6, r: 3.2, launch: 0.62, boost: 1.35 });
    // the deep end: swimming is slow, but it is the short way through
    out.push({ kind: 'water', x: 0, z: 0, r: 5.4, drag: 0.16, wet: 1.2 });
  }
  return out;
}

// An "arena" is what the player picks: a map plus a time of day.
export const ARENAS = [
  { key: 'backyard-day',   map: 'backyard', yard: 'day',   label: '☀️ Backyard' },
  { key: 'backyard-night', map: 'backyard', yard: 'night', label: '🌙 Backyard · sprinklers' },
  { key: 'field',          map: 'field',    yard: 'field', label: '🏈 PE Field' },
  { key: 'gym',            map: 'gym',      yard: 'gym',   label: '🏀 Gymnasium' },
  { key: 'culdesac',       map: 'culdesac', yard: 'street', label: '🚗 The Cul-de-Sac' },
  { key: 'winter',         map: 'winter',   yard: 'winter', label: '❄️ The Winter Yard' },
  { key: 'blacktop',       map: 'blacktop', yard: 'recess', label: '🏫 The Blacktop' },
  { key: 'splashpad',      map: 'splashpad', yard: 'noon',  label: '💦 The Splash Pad · 4v4' },
  { key: 'block',          map: 'block',    yard: 'day',   label: '🏘️ The Block · 5v5' },
];
export const arenaByKey = k => ARENAS.find(a => a.key === k) || ARENAS[0];

import * as THREE from 'three';
import { CFG, TEAMS } from './config.js';
import { toon, toonMap, outlined, grassTexture, scatterRng } from './art.js';
import { makeChar, animChar } from './chars.js';
import { makeProp } from './world.js';

// ─────────────────────────────────────────────────────────────
// Football presentation. Same rule as the CTF and kickball views: the sim
// never learns this file exists. Builds the backyard gridiron, and syncs
// actors, the ball, and the three bits of chalk language this sport runs on —
// the line of scrimmage, the drawn routes, and the "he's got it" ring.
//
// The field runs along X (CFG.football.field): goal lines at ±goalX, end
// zones behind them, sidelines at ±width/2. There are NO first downs — four
// downs to the house — so the only line that ever gets painted is scrimmage.
//
// ── AND: the mechanics layer, made visible ───────────────────
// footmech.js gave this sport a throw you charge, a catch window you press
// into, and a tackle you can juke, spin or truck your way out of. A player
// cannot learn a mechanic he cannot see, so everything below exists to put
// each of those on the grass in chalk:
//
//   THROW PREVIEW  the arc is drawn straight off G.aim.pred and mirrors
//                  footmech's own y formula, so it CANNOT lie about where the
//                  ball goes. Colour is the pitch (touch / normal / bullet), a
//                  pacer bead runs the arc at the real flight time so you feel
//                  a bullet before you throw one, and the spray ring's radius
//                  is literally pred.scatter — throw on the run and you watch
//                  your own accuracy open up.
//   CHARGE GAUGE   a chalk speedometer at the QB's feet whose pips are
//                  pre-coloured by band, so the fill SNAPS from blue to gold
//                  to red as it crosses touchAt and bulletAt.
//   CATCH WINDOW   the most important thing on the screen. A ring at the
//                  landing spot closes onto the exact size of a kid's hands
//                  (catching.reachR), and turns gold the instant a press
//                  issued NOW would still be hot on arrival (remaining air
//                  <= pressT). That single rule is the whole catch timing.
//   CONTACT        a wrap meter that fills the way footmech fills it, dust on
//                  a landed dive, kids that actually lie in the grass, and a
//                  chalk sticker for the counter that just beat you.
//
// Everything is pooled at attach and reused forever: no geometry, material or
// texture is built inside syncFootView, and V.owned catches every shared thing
// on the way out so nothing survives an attach/detach cycle.
// ─────────────────────────────────────────────────────────────
const FIELD = () => CFG.football.field;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// A plane laid flat with geometry.rotateX(-90) has its length axis along
// world -Z, so pointing it down a direction (dx,dz) means rotation.y =
// atan2(-dx, -dz). Same gotcha as the kickball base paths.
const flatStrip = (w, len) => { const g = new THREE.PlaneGeometry(w, len); g.rotateX(-Math.PI / 2); return g; };
const aimY = (dx, dz) => Math.atan2(-dx, -dz);

// The pitch palette. These three colours are the sport's whole vocabulary for
// "what kind of ball is this" — they dress the preview arc, the reticle, the
// spray ring, the charge gauge and the ball's own trail, so the word and the
// colour are learned together and never separately.
const PITCH = { touch: 0x59c8e0, normal: 0xffd94a, bullet: 0xff5a3d };
const CHALK = 0xfff8ea;

// a.m.lastMove -> the sticker. footmech marks the ATTEMPT ('juke') and the
// BREAK ('juked') with different names, and they deserve different volume:
// attempting a move is white chalk, beating a man with one is gold.
const MOVE_WORD = {
  juke: 'JUKE!', spin: 'SPIN!', truck: 'TRUCK!', dive: 'DIVE!',
  divecatch: 'LAID OUT!', juked: 'BROKEN!', spun: 'SPUN!', trucked: 'TRUCKED!',
};
// Warm colours only, and never PITCH.touch: this grass is 0x79c44a, and a pale
// blue sticker on it measured as the one callout you could not read at a
// glance. The pitch palette earns its blue on the ARC, where it sits against
// sky and shadow; on the lawn a callout gets cream, gold or orange.
const MOVE_COL = {
  juke: CHALK, spin: CHALK, truck: CHALK, dive: CHALK,
  divecatch: CHALK, juked: 0xffd94a, spun: 0xffd94a, trucked: 0xff8a3d,
};

// hex lerp — Color.setRGB takes LINEAR components while setHex takes sRGB, and
// mixing the two is how a "white to red" ramp comes out muddy pink.
function lerpHex(a, b, t) {
  const k = clamp(t, 0, 1);
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return ((ar + (br - ar) * k) | 0) << 16 | ((ag + (bg - ag) * k) | 0) << 8 | ((ab + (bb - ab) * k) | 0);
}

// ── THE ONE FORMULA ──────────────────────────────────────────
// A MIRROR of footmech.stepFlight's height, deliberately written out rather
// than approximated: the ball's y is
//     sy*(1-k) + landH*k + peak*4*k*(1-k)
// from the release height to the arrival height with the type's bulge on top.
// If footmech's arc ever changes, this line is the one that has to follow, and
// a preview that drew a prettier curve than the sim flies would be worse than
// no preview at all.
function arcY(k, peak) {
  const T = CFG.football.throw, C = CFG.football.catching;
  return T.releaseH * (1 - k) + C.landH * k + peak * 4 * k * (1 - k);
}

// ── the yard ─────────────────────────────────────────────────
let gridironGrass = null;
export function buildGridiron(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const F = FIELD();
  const HL = F.goalX + F.endzone;                 // centre to back line
  const HW = F.width / 2;

  // toonMap, not a bare MeshToonMaterial: without the gradientMap the ramp
  // falls back to a hard two-tone split (see art.js) and the lawn reads flat.
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(HL * 2 + 110, F.width + 110),
    toonMap({ map: gridironGrass ??= grassTexture() }));  // one texture, not one per rematch
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  root.add(ground);

  // Every fixed marking — stripes, end zones, boundary — is ONE canvas laid
  // over the pitch, drawn the way a kid drags a chalk wheel: two passes, a
  // wobble, nothing ruled. (turfLinesTexture is the idiom; this one wobbles.)
  const chalk = new THREE.Mesh(new THREE.PlaneGeometry(HL * 2, F.width),
    new THREE.MeshBasicMaterial({ map: chalkTexture(F), transparent: true, depthWrite: false }));
  chalk.rotation.x = -Math.PI / 2; chalk.position.y = 0.016;
  chalk.layers.set(1);                            // chalk shouldn't be inked
  root.add(chalk);

  // goalposts on each back line — pure decoration, nobody kicks in this sport
  for (const s of [-1, 1]) {
    const { obj } = makeProp('goalpost');
    obj.position.set(s * (HL + 0.9), 0, 0);
    root.add(obj);
  }

  // A low picket run OUTSIDE each end zone — the buildFence recipe (uneven
  // tops, a lazy tilt, two rails) at knee height, only across the two ends.
  const picketGeo = new THREE.BoxGeometry(0.3, 1.25, 0.09);
  const picketMat = toon(0xf4efe4);
  const picketMat2 = toon(0xded6c6);              // sun-faded boards mixed in
  const railGeo = new THREE.BoxGeometry(1, 0.12, 0.06);
  const railMat = toon(0xd9d2c4);
  let pi = 0;
  for (const s of [-1, 1]) {
    const px0 = s * (HL + 2.6);
    for (let t = -(HW + 2); t <= HW + 2; t += 0.45) {
      const p = new THREE.Mesh(picketGeo, (pi % 5 === 2) ? picketMat2 : picketMat);
      p.castShadow = true;
      const h = 1 + Math.sin(pi * 7.31) * 0.06;   // uneven tops
      p.scale.y = h;
      p.position.set(px0, 0.62 * h, t);
      p.rotation.y = Math.PI / 2;
      p.rotation.z = Math.sin(pi * 3.77) * 0.025;
      root.add(p); pi++;
    }
    for (const railY of [0.38, 0.92]) {
      const r = new THREE.Mesh(railGeo, railMat);
      r.scale.x = (HW + 2) * 2 + 0.9;
      r.position.set(px0 + s * 0.08, railY, 0);
      r.rotation.y = Math.PI / 2;
      root.add(r);
    }
  }

  // somebody's watching from the sideline — chair and drinks, out of play
  const chair = makeProp('chair').obj;
  chair.position.set(-7.5, 0, -(HW + 2.8));
  chair.rotation.y += 0.12;                       // faces the field already; just slouch it
  const cooler = makeProp('cooler').obj;
  cooler.position.set(-4.4, 0, -(HW + 3.1));
  cooler.rotation.y += -0.3;
  root.add(chair, cooler);

  return { root, colliders: [], fx: null, map: 'gridiron', ground,
           dispose() {
             scene.remove(root);
             root.traverse(o => {
               if (o.geometry) o.geometry.dispose?.();
               for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
                 if (!m) continue;
                 if (m.map && m.map !== gridironGrass) m.map.dispose?.();
                 m.dispose?.();
               }
             });
           } };
}

function chalkTexture(F) {
  const HL = F.goalX + F.endzone, W = F.width, HW = W / 2;
  const PX = 25;                                  // pixels per metre
  const c = document.createElement('canvas');
  c.width = Math.round(HL * 2 * PX); c.height = Math.round(W * PX);
  const x = c.getContext('2d');
  const rnd = scatterRng(9090);                   // the yard must look identical every load
  const X = u => (u / (HL * 2) + 0.5) * c.width;
  const Z = v => (v / W + 0.5) * c.height;

  // One hand-drawn chalk line: a jittered polyline drawn twice at different
  // weights — the straight-line cousin of the two-ring wobble on the CTF bases.
  const line = (ax, az, bx, bz, wM, alpha) => {
    const dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz) || 1;
    const nx = -dz / len, nz = dx / len;          // unit normal carries the wobble
    for (const [w2, a2, off] of [[wM, alpha, 0], [wM * 0.55, alpha * 0.45, 0.11]]) {
      x.strokeStyle = `rgba(255,250,236,${a2})`;
      x.lineWidth = w2 * PX; x.lineCap = 'round';
      x.beginPath();
      const n = Math.max(2, Math.ceil(len / 0.8));
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const j = (rnd() - 0.5) * 0.16 + off;     // metres of hand
        i ? x.lineTo(X(ax + dx * t + nx * j), Z(az + dz * t + nz * j))
          : x.moveTo(X(ax + dx * t + nx * j), Z(az + dz * t + nz * j));
      }
      x.stroke();
    }
  };

  // end zones: a darker mow tint and scuffed 45° chalk drags, clipped inside
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -HL : F.goalX;             // [x0 .. x0+endzone]
    x.save();
    x.beginPath();
    x.rect(X(x0), 0, F.endzone * PX, c.height);
    x.clip();
    x.fillStyle = 'rgba(16,64,10,.20)';
    x.fillRect(X(x0), 0, F.endzone * PX, c.height);
    for (let d = -W; d < F.endzone + W; d += 2.4)
      line(x0 + d, -HW, x0 + d + W, HW, 0.12, 0.2);
    x.restore();
  }

  // boundary: sidelines, back lines, and a heavier goal line at each end
  for (const s of [-1, 1]) {
    line(-HL + 0.1, s * (HW - 0.14), HL - 0.1, s * (HW - 0.14), 0.24, 0.85);   // sidelines
    line(s * (HL - 0.14), -HW + 0.1, s * (HL - 0.14), HW - 0.1, 0.24, 0.85);   // back lines
    line(s * F.goalX, -HW + 0.14, s * F.goalX, HW - 0.14, 0.3, 0.95);          // goal lines
  }
  // yard stripes every 4m between the goal lines
  for (let gx = -F.goalX + 4; gx <= F.goalX - 4 + 0.01; gx += 4)
    line(gx, -HW + 0.6, gx, HW - 0.6, 0.16, 0.5);

  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// One chalk sticker word, baked once at attach. White fill over a fat dark
// stroke offset a few pixels down: a sticker, not a font. The fill is WHITE on
// purpose so material.color can tint it per callout without needing a texture
// per colour (the dark stroke stays dark under any tint).
function wordTexture(text) {
  const c = document.createElement('canvas');
  c.width = 384; c.height = 128;
  const x = c.getContext('2d');
  x.textAlign = 'center'; x.textBaseline = 'middle';
  let size = 96;
  const font = s => `900 ${s}px "Fredoka", "Arial Black", sans-serif`;
  x.font = font(size);
  while (x.measureText(text).width > 340 && size > 26) { size -= 4; x.font = font(size); }
  x.lineJoin = 'round';
  x.lineWidth = 22; x.strokeStyle = 'rgba(26,16,10,.95)';
  x.strokeText(text, 192, 70);
  x.fillStyle = '#ffffff';
  x.fillText(text, 192, 64);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── attach / detach ──────────────────────────────────────────
let footRoot = null, footScene = null, footV = null;
export function detachFootView() {
  if (!footRoot) return;
  footScene.remove(footRoot);
  footRoot.traverse(o => {
    if (o.geometry) o.geometry.dispose?.();
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
      if (!m) continue;
      // maps too: every kid carries his own numberTexture, and before this
      // they were the one thing a rematch leaked a canvas of, every time.
      m.map?.dispose?.();
      m.dispose?.();
    }
  });
  // Pools share geometries and materials across many meshes, and several of
  // them (a hidden label, an empty route group) may not be mounted at all when
  // detach runs — so the traverse can miss them entirely. V.owned is the
  // manifest of every shared thing attach built; it is the real cleanup.
  for (const o of footV?.owned || []) o?.dispose?.();
  // Drop the back-references BOTH ways. G._fv is what syncFootView gates on,
  // and it used to outlive the view it pointed at — so a stray sync after a
  // detach ran happily against a disposed scene graph. Clearing it makes the
  // guard at the top of sync mean what it says, which is what lets us null
  // a.mesh too rather than leaving the whole dead graph reachable.
  if (footV?.g) footV.g._fv = null;
  for (const a of footV?.actors || []) a.mesh = null;
  footRoot = null; footScene = null; footV = null;
}

export function attachFootView(G, scene) {
  detachFootView();
  footScene = scene;
  const vroot = footRoot = new THREE.Group();
  scene.add(vroot);

  const TH = CFG.football.throw;
  const owned = [];
  const own = o => { owned.push(o); return o; };
  // every overlay is chalk, and chalk is never inked (layer 1 = skipped by the
  // outline pass in post.js). Groups don't propagate layers, hence the traverse.
  const ink = o => { o.traverse(c => c.layers.set(1)); return o; };
  const chalkMat = (color, opacity, extra) => own(new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, ...extra }));

  // ── shared geometry, built once, scaled per use ──
  const beadGeo  = own(new THREE.SphereGeometry(1, 8, 6));        // unit radius
  const ringGeo  = own(new THREE.RingGeometry(0.86, 1.0, 44));    // unit radius, laid flat
  ringGeo.rotateX(-Math.PI / 2);
  const sprayGeo = own(new THREE.RingGeometry(0.66, 1.0, 40));    // fatter band: a cloud, not a hoop
  sprayGeo.rotateX(-Math.PI / 2);
  const discGeo  = own(new THREE.CircleGeometry(1, 36));
  discGeo.rotateX(-Math.PI / 2);
  const tickGeo  = own(flatStrip(0.14, 0.46));
  const pipGeo   = own(flatStrip(0.20, 0.58));    // chunky: this is read at 20m, over grass
  const wrapGeo  = own(flatStrip(0.17, 0.42));
  const laneGeo  = own(flatStrip(0.34, 1));                       // scaled along Z to a length
  const quadGeo  = own(new THREE.PlaneGeometry(1, 1));            // billboards
  const barGeo   = own(new THREE.PlaneGeometry(1, 1));
  barGeo.translate(0.5, 0, 0);                                    // left-anchored: scale.x IS the fill

  for (const a of G.actors) {
    a.mesh = makeChar(a.team, a.variant ?? 0, a.kit || 'runner');
    vroot.add(a.mesh);
  }

  // THE BALL: a leather spheroid with a lace strip — the same football the
  // batting tee prop holds, given a flight model. rotation order YXZ so the
  // nose can be yawed down the throw and then pitched along the arc, while
  // the spiral spins a child group around the flight axis itself.
  const ball = new THREE.Group();
  ball.rotation.order = 'YXZ';
  const spin = new THREE.Group();
  const skin = outlined(new THREE.SphereGeometry(0.3, 20, 16), 0x8a5a35);
  skin.scale.set(1, 1, 1.7);                      // prolate: long axis is local +Z
  spin.add(skin);
  const lace = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.36), toon(0xfffdf5));
  lace.position.y = 0.29;
  spin.add(lace);
  for (let i = 0; i < 4; i++) {
    const cross = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.025, 0.03), toon(0xfffdf5));
    cross.position.set(0, 0.3, -0.11 + i * 0.075);
    spin.add(cross);
  }
  for (const s of [-1, 1]) {                      // the two white end stripes
    const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.026, 8, 22), toon(0xfffdf5));
    stripe.position.z = s * 0.31;
    spin.add(stripe);
  }
  ball.add(spin);
  const gloss = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false }));
  gloss.position.set(-0.07, 0.2, 0.08); gloss.scale.set(1.5, 0.55, 1.1); gloss.rotation.z = 0.4;
  gloss.layers.set(1);                            // sheen rides OUTSIDE the spin, so it stays up
  ball.add(gloss);
  vroot.add(ball);

  // THE BALL IS LIVE: a shell that lights the instant the ball drops below
  // catching.catchH, which is the exact height at which anyone underneath may
  // play it. Nothing else on the field announces that moment.
  const halo = new THREE.Mesh(own(new THREE.SphereGeometry(1, 14, 10)),
    chalkMat(CHALK, 0.3, { side: THREE.BackSide }));
  halo.visible = false; halo.layers.set(1);
  vroot.add(halo);

  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20),
    new THREE.MeshBasicMaterial({ color: 0x2a1a12, transparent: true, opacity: 0.32 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.02; shadow.layers.set(1);
  vroot.add(shadow);

  // BALL TRAIL. Type is written into the shape of it: a bullet drops beads
  // fast and stretches each one down the flight line into a dash, a touch ball
  // leaves a few lazy round ones. Same physics as always — this just makes the
  // difference between the pitches something you can see from the sideline.
  const trailMat = chalkMat(PITCH.normal, 0.6);
  const trail = [];
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(beadGeo, trailMat);
    m.visible = false; m.layers.set(1);
    vroot.add(m);
    trail.push({ m, life: 0, max: 1, x: 0, y: 0, z: 0, s: 0.14, ry: 0, ln: 1 });
  }

  // THE LINE OF SCRIMMAGE — no first downs in this sport, so this is the only
  // moving line on the yard. Two overlapping strokes at slightly different
  // weights and a hair of rotation: chalk, not a laser.
  const los = new THREE.Group();
  for (const [w, op, ox, rot] of [[0.26, 0.9, 0, 0], [0.13, 0.4, 0.09, 0.01]]) {
    const m = new THREE.Mesh(own(flatStrip(w, FIELD().width + 0.8)),
      chalkMat(CHALK, op, { side: THREE.FrontSide }));
    m.position.x = ox; m.rotation.y = rot;
    m.userData.op = op;                           // base weight, scaled by phase
    los.add(m);
  }
  los.position.y = 0.03;
  vroot.add(ink(los));

  // ROUTE PREVIEWS. All dashes and arrowheads share ONE geometry pair and ONE
  // material, so redrawing a route mid-drag (setRoute fires every mouse move)
  // allocates no geometry — the rebuild is just repooling Mesh wrappers.
  const routeGrp = new THREE.Group();
  routeGrp.position.y = 0.04;
  vroot.add(routeGrp);
  const dashGeo = own(flatStrip(0.18, 0.55));
  const arrowGeo = own(new THREE.CircleGeometry(0.5, 3));       // a chunky triangle
  arrowGeo.rotateX(-Math.PI / 2);                               // flat, nose along +X
  const routeMat = own(new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true,
    opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));

  // one soft pulsing ring: under the QB while the play is set, under whoever
  // has the ball once it's live — "this is the kid that matters right now"
  const puls = new THREE.Mesh(ringGeo, chalkMat(0xffd94a, 0.5));
  puls.position.y = 0.045; puls.scale.setScalar(0.9);
  puls.visible = false; puls.layers.set(1);
  vroot.add(puls);

  // ── THROW PREVIEW ────────────────────────────────────────
  // Nothing here is authored: every number comes out of G.aim.pred, which is
  // the same object footmech hands to launch(). What you see is the throw.
  const aimGrp = new THREE.Group();
  aimGrp.visible = false;
  vroot.add(aimGrp);
  const aimArcMat   = chalkMat(PITCH.normal, 0.5);
  const aimHeadMat  = chalkMat(PITCH.normal, 0.95);
  const aimRetMat   = chalkMat(PITCH.normal, 0.9);
  const aimSprayMat = chalkMat(PITCH.normal, 0.5);
  const aimFillMat  = chalkMat(PITCH.normal, 0.13);
  const beads = [];
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(beadGeo, aimArcMat);
    aimGrp.add(m); beads.push(m);
  }
  // the pacer runs the arc once per pred.air seconds — the preview keeps the
  // ball's actual clock, so a bullet's dot sprints and a touch ball's floats
  const pacer = new THREE.Mesh(beadGeo, aimHeadMat);
  aimGrp.add(pacer);
  // landing reticle: a ring, four ticks and a pip, right on pred.tx/tz (which
  // is the LEAD-CAPPED target, so aiming past your arm shows you the truth)
  const ret = new THREE.Group(); ret.position.y = 0.05;
  const retRing = new THREE.Mesh(ringGeo, aimRetMat); retRing.scale.setScalar(0.8);
  ret.add(retRing);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(tickGeo, aimRetMat);
    const ang = i * Math.PI / 2;
    t.position.set(Math.sin(ang) * 1.2, 0, Math.cos(ang) * 1.2);
    t.rotation.y = ang;
    ret.add(t);
  }
  const retDot = new THREE.Mesh(discGeo, aimRetMat); retDot.scale.setScalar(0.15);
  ret.add(retDot);
  aimGrp.add(ret);
  // SCATTER: the radius of this ring IS pred.scatter, in metres. Set your feet
  // and it is a tight little collar; throw on the run with a rusher in your
  // face and it swallows the receiver.
  const spray = new THREE.Mesh(sprayGeo, aimSprayMat); spray.position.y = 0.042;
  const sprayFill = new THREE.Mesh(discGeo, aimFillMat); sprayFill.position.y = 0.038;
  aimGrp.add(spray, sprayFill);
  ink(aimGrp);

  // ── CHARGE GAUGE ─────────────────────────────────────────
  // A chalk speedometer at the QB's feet, swung around to point down the
  // throw. Each pip is pre-coloured by the band it falls in, so the fill does
  // not fade between pitches — it SNAPS, at exactly touchAt and bulletAt.
  const chgGrp = new THREE.Group(); chgGrp.position.y = 0.055; chgGrp.visible = false;
  vroot.add(chgGrp);
  const litMats = { touch: chalkMat(PITCH.touch, 0.95),
                    normal: chalkMat(PITCH.normal, 0.95),
                    bullet: chalkMat(PITCH.bullet, 0.95) };
  // Unlit pips are CHALK, not ink. A dark tick on 0x79c44a grass disappears —
  // the empty half of the dial has to be a drawn thing you can see, or the
  // fill has nothing to fill and the gauge reads as a few loose marks.
  const dimMat = chalkMat(CHALK, 0.38);
  const pips = [];
  for (let i = 0; i < 20; i++) {
    const f = (i + 0.5) / 20;
    const band = f < TH.touchAt ? 'touch' : f > TH.bulletAt ? 'bullet' : 'normal';
    const m = new THREE.Mesh(pipGeo, dimMat);
    chgGrp.add(m);
    pips.push({ m, f, lit: litMats[band] });
  }
  ink(chgGrp);

  // ── CATCH WINDOW ─────────────────────────────────────────
  // The single most important thing this file draws. winRing closes onto
  // hitRing, and hitRing is exactly catching.reachR — the radius of a standing
  // kid's hands. When the two meet, the ball is in reach.
  const catchGrp = new THREE.Group(); catchGrp.visible = false;
  vroot.add(catchGrp);
  const winMat = chalkMat(CHALK, 0.85);
  const hitMat = chalkMat(CHALK, 0.3);
  const winRing = new THREE.Mesh(ringGeo, winMat); winRing.position.y = 0.062;
  const hitRing = new THREE.Mesh(ringGeo, hitMat); hitRing.position.y = 0.056;
  catchGrp.add(winRing, hitRing);
  // and the spotlight: G.claimant() picks the man with the best claim, and he
  // gets the ring, the cone and a lane showing the ground he still has to eat
  const claimMat = chalkMat(0xffd94a, 0.9);
  const claim = new THREE.Group();
  const claimRing = new THREE.Mesh(ringGeo, claimMat);
  claimRing.scale.setScalar(1.2); claimRing.position.y = 0.07;
  const claimCone = new THREE.Mesh(own(new THREE.ConeGeometry(0.3, 0.5, 4)), claimMat);
  claimCone.rotation.x = Math.PI; claimCone.position.y = 2.85;
  claim.add(claimRing, claimCone);
  const claimLaneMat = chalkMat(0xffd94a, 0.2);
  const claimLane = new THREE.Mesh(laneGeo, claimLaneMat);
  claimLane.position.y = 0.036;
  // the other team's best claim, quieter — this is what "contested" looks like
  const contestMat = chalkMat(PITCH.bullet, 0.5);
  const contest = new THREE.Mesh(ringGeo, contestMat);
  contest.scale.setScalar(1.2); contest.position.y = 0.066;
  catchGrp.add(claim, claimLane, contest);
  ink(catchGrp);

  // PRESS FLASH — one per kid, because a press is a thing a PLAYER did and it
  // has to be legible on whoever did it, not just on the ball.
  const press = G.actors.map(() => {
    const m = new THREE.Mesh(ringGeo, chalkMat(CHALK, 0));
    m.position.y = 0.09; m.visible = false; m.layers.set(1);
    vroot.add(m);
    return m;
  });

  // ── WRAP METER ───────────────────────────────────────────
  // a.m.wrapT runs 0..1 and at 1 he is down, so this is a literal readout of
  // how long he has left. A second set of hands fills it 2.3x faster, and the
  // ring shakes to say so.
  const wrapGrp = new THREE.Group(); wrapGrp.position.y = 0.05; wrapGrp.visible = false;
  vroot.add(wrapGrp);
  const wrapMat = chalkMat(CHALK, 0.95);
  const wrapPips = [];
  for (let i = 0; i < 18; i++) {
    const ang = (i / 18) * Math.PI * 2 - Math.PI / 2;
    const m = new THREE.Mesh(wrapGeo, wrapMat);
    m.position.set(Math.sin(ang) * 1.3, 0, Math.cos(ang) * 1.3);
    m.rotation.y = ang;                           // strip length runs along local Z = radial
    wrapGrp.add(m); wrapPips.push(m);
  }
  ink(wrapGrp);

  // ── CHALK POPS ───────────────────────────────────────────
  // expanding rings for the one-shot beats: a dive landing, a press, a hit
  const pops = [];
  for (let i = 0; i < 10; i++) {
    const m = new THREE.Mesh(ringGeo, chalkMat(CHALK, 0));
    m.position.y = 0.08; m.visible = false; m.layers.set(1);
    vroot.add(m);
    pops.push({ m, life: 0, max: 0.42, r0: 0.5, r1: 2.2 });
  }

  // ── STAMINA ──────────────────────────────────────────────
  // ONE bar, over the kid you are steering, and only while he is carrying.
  // Five stamina bars on a five-man field is a HUD, not a backyard.
  const stam = new THREE.Group(); stam.visible = false;
  const stamBack = new THREE.Mesh(quadGeo, chalkMat(0x2a1a12, 0.85, { side: THREE.DoubleSide }));
  stamBack.scale.set(1.64, 0.31, 1);
  const stamTrack = new THREE.Mesh(quadGeo, chalkMat(CHALK, 0.3));
  stamTrack.scale.set(1.5, 0.18, 1); stamTrack.position.z = 0.01;
  const stamFill = new THREE.Mesh(barGeo, chalkMat(0x8ede4a, 0.95));
  stamFill.position.set(-0.75, 0, 0.02);
  stam.add(stamBack, stamTrack, stamFill);
  vroot.add(ink(stam));

  // ── CALLOUT STICKERS ─────────────────────────────────────
  // Baked once per word, four slots that recycle. depthTest off + renderOrder
  // so a "TRUCKED!" never hides behind the kid it happened to.
  const words = {};
  for (const k of Object.keys(MOVE_WORD)) words[k] = own(wordTexture(MOVE_WORD[k]));
  const labels = [];
  for (let i = 0; i < 4; i++) {
    const mat = own(new THREE.MeshBasicMaterial({ map: words.juke, transparent: true,
      opacity: 0, depthWrite: false, depthTest: false, side: THREE.DoubleSide }));
    const m = new THREE.Mesh(quadGeo, mat);
    m.scale.set(2.5, 0.83, 1);
    m.visible = false; m.layers.set(1); m.renderOrder = 12;
    vroot.add(m);
    labels.push({ m, mat, life: 0, x: 0, z: 0 });
  }

  // per-actor edge detector: every one-shot in this file (dust, pops, stickers)
  // fires on a RISING edge of a footmech timer, so nothing is guessed and
  // nothing double-fires when the render outruns the fixed sim step
  const rec = G.actors.map(a => ({ a, dive: 0, prone: 0, presT: 0, moveT: 0, move: '',
                                   juke: 0, spin: 0, truck: 0,
                                   diveT0: 0.5, jukeT0: 0.3, spinT0: 0.5, truckT0: 0.4 }));

  footV = G._fv = {
    owned, g: G, actors: G.actors, t: 0, pby: 0.3, sig: '',
    ball, spin, halo, shadow, los, routeGrp, dashGeo, arrowGeo, routeMat, puls,
    trail, trailMat, trailT: 0, trailI: 0,
    aimGrp, beads, pacer, ret, spray, sprayFill,
    aimArcMat, aimHeadMat, aimRetMat, aimSprayMat, aimFillMat,
    chgGrp, pips, litMats, dimMat, band: '', bandPop: 0,
    catchGrp, winRing, hitRing, winMat, hitMat,
    claim, claimRing, claimCone, claimMat, claimLane, claimLaneMat, contest, contestMat,
    press, wrapGrp, wrapPips, wrapMat,
    pops, popI: 0, labels, labelI: 0, words,
    stam, stamFill, rec,
  };
}

// Routes rebuild only when this string changes — a cheap signature over the
// waypoints plus everything the lineup spots derive from.
function routesSig(G) {
  let s = G.possession + '|' + G.scrimmage.toFixed(2);
  for (const slot of [2, 3, 4]) {
    const r = G.routes[slot];
    if (!r) continue;
    s += '|' + slot;
    for (const p of r) s += ':' + p.x.toFixed(1) + ',' + p.z.toFixed(1);
  }
  return s;
}

function rebuildRoutes(G, V) {
  V.routeGrp.clear();
  V.routeMat.color.setHex(TEAMS[G.possession].color);
  const recs = G.offence();
  for (const slot of [2, 3, 4]) {
    const wps = G.routes[slot];
    if (!wps || !wps.length) continue;
    const a = recs[slot];
    const start = a?.station ?? a;                // lineup spot; the kid may still be jogging there
    if (!start) continue;
    const pts = [{ x: start.x, z: start.z }, ...wps];
    let carry = 0, lx = 0, lz = 1;                // dash phase flows through waypoints
    for (let i = 1; i < pts.length; i++) {
      const ax = pts[i - 1].x, az = pts[i - 1].z;
      const dx = pts[i].x - ax, dz = pts[i].z - az;
      const len = Math.hypot(dx, dz);
      if (len < 0.05) continue;
      lx = dx / len; lz = dz / len;
      let d = carry;
      while (d + 0.55 <= len) {
        const dash = new THREE.Mesh(V.dashGeo, V.routeMat);
        dash.position.set(ax + lx * (d + 0.275), 0, az + lz * (d + 0.275));
        dash.rotation.y = aimY(dx, dz);
        dash.layers.set(1);
        V.routeGrp.add(dash);
        d += 0.95;                                // 0.55 of chalk, 0.4 of lawn
      }
      carry = d - len;
    }
    const end = pts[pts.length - 1];
    const head = new THREE.Mesh(V.arrowGeo, V.routeMat);
    head.position.set(end.x, 0, end.z);
    head.rotation.y = Math.atan2(-lz, lx);        // nose is baked along +X
    head.layers.set(1);
    V.routeGrp.add(head);
  }
}

// ── pooled one-shots ─────────────────────────────────────────
const puff = (G, x, z, dx, dz, n) => G.world?.fx?.burst?.(x, z, dx || 0, dz || 0, n);

function popRing(V, x, z, colour, r1, r0 = 0.5, life = 0.42) {
  const P = V.pops[V.popI++ % V.pops.length];
  P.life = P.max = life; P.r0 = r0; P.r1 = r1;
  P.m.visible = true;
  P.m.position.set(x, 0.08, z);
  P.m.material.color.setHex(colour);
  P.m.material.opacity = 0.85;
  P.m.scale.setScalar(r0);
}

function callout(V, key, x, z) {
  const tex = V.words[key];
  if (!tex) return;                               // an unnamed move says nothing
  const L = V.labels[V.labelI++ % V.labels.length];
  L.life = 0.9; L.x = x; L.z = z;
  if (L.mat.map !== tex) { L.mat.map = tex; L.mat.needsUpdate = true; }
  L.mat.color.setHex(MOVE_COL[key] ?? CHALK);
  L.m.visible = true;
}

// Billboard. G._camera is set by main.js for this mode; the fallback pitch is
// the broadcast rig's own tilt (20.5 up, 25 back), so a stray attach without a
// camera still reads instead of showing an edge-on sliver.
function face(o, cam) {
  if (cam) o.quaternion.copy(cam.quaternion);
  else o.rotation.set(-0.62, 0, 0);
}

// ── the pose stack ───────────────────────────────────────────
// animChar wipes lean/bob and re-seats root.position.y every single frame, so
// every mechanical pose has to be laid on top of it, after it, not instead of
// it. It also owns nothing below the waist that we fight over: the dive and
// the prone lie both pivot the LEAN group about the feet, which is why a kid
// tips over like a bowling pin instead of sinking through the grass.
function poseMech(G, V, a, R) {
  const m = a.m, root = a.mesh;
  if (!m || !root) return;
  const u = root.userData;
  const px = root.position.x, pz = root.position.z;

  // ── rising edges: every one-shot in the file is triggered here ──
  if (m.dive > R.dive + 1e-6) {                     // he left his feet
    R.diveT0 = m.dive;
    puff(G, px, pz, -m.diveX * 1.4, -m.diveZ * 1.4, 5);
  }
  if (R.dive > 0 && m.dive <= 0) {                  // ...and he came down
    popRing(V, px, pz, m.diveHit ? 0xffd94a : CHALK, m.diveHit ? 3.0 : 2.1);
    puff(G, px, pz, m.diveX * 0.8, m.diveZ * 0.8, m.diveHit ? 14 : 8);
  }
  if (m.juke  > R.juke  + 1e-6) { R.jukeT0  = m.juke;  puff(G, px, pz, -m.jukeX, -m.jukeZ, 5); }
  if (m.spin  > R.spin  + 1e-6) { R.spinT0  = m.spin;  puff(G, px, pz, 0, 0, 6); }
  if (m.truck > R.truck + 1e-6) { R.truckT0 = m.truck; puff(G, px, pz, 0, 0, 7); }
  if (m.prone > R.prone + 1e-6 && R.dive <= 0) puff(G, px, pz, 0, 0, 6);
  if (m.catchPress > R.presT + 1e-6) popRing(V, px, pz, TEAMS[a.team].color, 2.1, 0.95, 0.3);
  if (m.moveT > R.moveT + 1e-6 || (m.moveT > 0 && m.lastMove !== R.move))
    callout(V, m.lastMove, px, pz);
  R.dive = m.dive; R.prone = m.prone; R.presT = m.catchPress;
  R.juke = m.juke; R.spin = m.spin; R.truck = m.truck;
  R.moveT = m.moveT; R.move = m.lastMove;

  // ── the pose itself ──
  if (u.dogLegs) return;          // no shoulders to drop; this sport fields none
  u.lean.position.y = 0;
  u.lean.rotation.y = 0;
  // Put the ground blob back before anything shrinks it. animChar only restores
  // its scale inside `root.position.y !== 0`, and animChar has already zeroed
  // root.position.y three lines earlier — so that branch is unreachable and a
  // kid who ever dived kept a shrunken shadow for the rest of the match.
  if (u.blob) u.blob.scale.setScalar(1);

  if (m.dive > 0) {
    // superman: off the ground, arms out, legs trailing. He really is
    // travelling — footmech's applyMechMotion moves him — so the lift is a
    // pure arc over the committed window.
    const p = clamp(1 - m.dive / (R.diveT0 || 0.5), 0, 1);
    const lift = Math.sin(p * Math.PI) * 0.62;
    root.position.y = lift;
    u.lean.rotation.x = 1.02 + 0.3 * Math.sin(p * Math.PI);
    u.lean.position.y = 0.34;
    u.armL.rotation.x = u.armR.rotation.x = -2.55;
    u.legL.rotation.x = 0.34; u.legR.rotation.x = 0.16;
    u.bob.scale.set(0.92, 1.08, 0.92);
    if (u.blob) {
      u.blob.scale.setScalar(Math.max(0.4, 1 - lift));
      u.blob.material.opacity = 0.3 * Math.max(0.25, 1 - lift * 0.9);
    }
  } else if (m.prone > 0) {
    // face down in the grass. The last 0.3s eases him back up rather than
    // snapping him vertical — charming, not ragdoll.
    const k = Math.min(1, m.prone / 0.3);
    u.lean.rotation.x = 1.44 * k;
    u.lean.position.y = 0.32 * k;
    u.lean.rotation.z = Math.sin(V.t * 3.4 + (a.variant || 0)) * 0.07 * k;
    u.armL.rotation.x = -2.3 * k; u.armR.rotation.x = -1.35 * k;
    u.legL.rotation.x = 0.3 * k; u.legR.rotation.x = -0.2 * k;
    u.bob.position.y = 0;
  } else {
    if (m.spin > 0) {
      // one full revolution over the window — the wrap-breaker, and it reads
      // as one because you can count the turn
      const p = clamp(1 - m.spin / (R.spinT0 || 0.5), 0, 1);
      u.lean.rotation.y = p * Math.PI * 2;
      u.bob.position.y += 0.05 * Math.sin(p * Math.PI);
      u.armL.rotation.x = u.armR.rotation.x = -0.95;
    }
    if (m.juke > 0) {
      // lean INTO the hop. Local +X is the character's own right-hand side
      // (root.rotation.y = face maps local X to (cos f, -sin f) in world), and
      // a positive lean.rotation.z tips the head toward local -X — hence the
      // minus, or he'd flinch away from the cut he is making.
      const amp = clamp(m.juke / (R.jukeT0 || 0.3), 0, 1);
      const f = u.face ?? a.aim ?? 0;
      const lat = m.jukeX * Math.cos(f) + m.jukeZ * -Math.sin(f);
      u.lean.rotation.z -= lat * 0.62 * amp;
      u.lean.rotation.x -= 0.12 * amp;
    }
    if (m.truck > 0) {
      const amp = clamp(m.truck / (R.truckT0 || 0.4), 0, 1);
      u.lean.rotation.x -= 0.5 * amp;                    // shoulder down
      u.armL.rotation.x = -1.9; u.armR.rotation.x = -0.35;  // and an arm out
      u.bob.scale.set(1.06, 0.94, 1.06);
    }
    if (m.catchPress > 0) {
      u.armL.rotation.x = u.armR.rotation.x = -2.4;      // hands to the ball
      u.lean.rotation.x -= 0.1;
    } else if (m.gather > 0) {
      u.armL.rotation.x = -1.6; u.armR.rotation.x = -1.85;  // juggling it
      u.lean.rotation.x += 0.16;
      u.lean.rotation.z += Math.sin(V.t * 26) * 0.05;
    }
    if (m.block > 0) {
      u.armL.rotation.x = u.armR.rotation.x = -1.45;     // hands inside
      u.legL.rotation.z = 0.2; u.legR.rotation.z = -0.2;
      u.lean.rotation.x -= 0.2;
    } else { u.legL.rotation.z = 0; u.legR.rotation.z = 0; }
    if (G.carrier === a && m.wrapBy > 0)                 // being dragged down
      u.lean.rotation.z += Math.sin(V.t * 30) * 0.07 * Math.min(2, m.wrapBy) * 0.5;
  }
}

// ── per-frame sync ───────────────────────────────────────────
export function syncFootView(G, dt, alpha) {
  const V = G._fv; if (!V) return;
  V.t += dt;
  const F = CFG.football, TH = F.throw, CA = F.catching;
  const cam = G._camera || null;

  for (let i = 0; i < G.actors.length; i++) {
    const a = G.actors[i];
    a.mesh.position.set(a.px + (a.x - a.px) * alpha, 0, a.pz + (a.z - a.pz) * alpha);
    animChar(a.mesh, a, dt);
    poseMech(G, V, a, V.rec[i]);
  }

  // ── the ball ──
  const b = G.ball;
  const type = b.type || 'normal';
  if (b.holder?.mesh) {
    // tucked: ride the interpolated carrier, nose along his aim
    const h = b.holder.mesh.position;
    V.ball.position.set(h.x + Math.sin(b.holder.aim) * 0.38, 1.02, h.z + Math.cos(b.holder.aim) * 0.38);
    V.ball.rotation.y = b.holder.aim;
    V.ball.rotation.x = -0.16;
    V.spin.rotation.x = 0; V.spin.rotation.z = 0;
  } else if (b.inAir) {
    // a SPIRAL: yaw the nose down the throw, pitch it along the arc (vertical
    // speed read frame-to-frame), and spin the lace group about the long axis.
    // The spin RATE is the pitch: a bullet is a tight fast spiral, a touch ball
    // turns over slowly and wobbles, which is the read you want on a ball you
    // are deciding whether to attack.
    V.ball.position.set(b.x, Math.max(0.3, b.y), b.z);
    const dx = b.tx - b.sx, dz = b.tz - b.sz;
    const hs = Math.hypot(dx, dz) / Math.max(0.01, b.air);
    const vy = (V.ball.position.y - V.pby) / Math.max(dt, 1e-4);
    V.ball.rotation.y = Math.atan2(dx, dz);
    V.ball.rotation.x = -Math.atan2(vy, Math.max(1, hs)) * 0.9;
    V.spin.rotation.x = type === 'touch' ? Math.sin(V.t * 9) * 0.13 : 0;
    V.spin.rotation.z -= dt * (type === 'bullet' ? 34 : type === 'touch' ? 11 : 21);
  } else if (G.phase === 'hike') {
    // the snap: end-over-end tumble back to the QB. (b.hike alone won't do as
    // the gate — the sim leaves it true until the next huddle.)
    V.ball.position.set(b.x, Math.max(0.25, b.y), b.z);
    if (G.qb) V.ball.rotation.y = Math.atan2(G.qb.x - b.x, G.qb.z - b.z);
    V.ball.rotation.x = 0;
    V.spin.rotation.x -= dt * 16;
  } else {
    // dead on the lawn: settle onto its belly, keep whatever yaw it had
    V.ball.position.set(b.x, Math.max(0.22, b.y), b.z);
    V.ball.rotation.x += (-0.5 - V.ball.rotation.x) * Math.min(1, dt * 6);
  }
  V.pby = V.ball.position.y;

  // ground shadow, tracking height honestly: tight and dark on the deck, wide
  // and faint at the apex, so you can read the ball's height off the grass
  V.shadow.position.set(V.ball.position.x, 0.02, V.ball.position.z);
  const hgt = Math.max(0, V.ball.position.y - 0.28);
  V.shadow.scale.setScalar(clamp(1.06 - hgt * 0.075, 0.34, 1.15));
  V.shadow.material.opacity = 0.34 * clamp(1 - hgt * 0.08, 0.1, 1);

  // "the ball is live": lit exactly while it is below catching.catchH, which is
  // the height at which footmech lets ANYONE under it play the ball
  const playable = !!b.inAir && b.y <= CA.catchH && (b.live || 0) > CA.selfLock;
  V.halo.visible = playable;
  if (playable) {
    const pulse = 0.5 + 0.5 * Math.sin(V.t * 22);
    V.halo.position.copy(V.ball.position);
    V.halo.rotation.copy(V.ball.rotation);
    V.halo.scale.set(0.6 + pulse * 0.09, 0.6 + pulse * 0.09, 0.95 + pulse * 0.16);
    V.halo.material.opacity = 0.2 + pulse * 0.24;
  }

  // trail: emitted on the ball's own clock, stretched down the flight line
  if (b.inAir) {
    V.trailMat.color.setHex(PITCH[type] ?? PITCH.normal);
    V.trailT -= dt;
    if (V.trailT <= 0) {
      V.trailT = type === 'bullet' ? 0.022 : type === 'normal' ? 0.034 : 0.055;
      const t = V.trail[V.trailI++ % V.trail.length];
      t.life = t.max = type === 'bullet' ? 0.4 : 0.3;
      t.x = V.ball.position.x; t.y = V.ball.position.y; t.z = V.ball.position.z;
      t.s = type === 'bullet' ? 0.145 : type === 'touch' ? 0.115 : 0.13;
      t.ln = type === 'bullet' ? 2.8 : type === 'touch' ? 1.0 : 1.6;
      t.ry = V.ball.rotation.y;
    }
  } else V.trailT = 0;
  for (const t of V.trail) {
    if (t.life <= 0) { if (t.m.visible) t.m.visible = false; continue; }
    t.life -= dt;
    const k = Math.max(0, t.life / t.max);
    t.m.visible = true;
    t.m.position.set(t.x, t.y, t.z);
    t.m.rotation.y = t.ry;
    t.m.scale.set(t.s * k, t.s * k, t.s * k * t.ln);
  }

  // ── line of scrimmage: bright while the play is being built, a ghost of
  //    itself once the ball is live, gone between drives ──
  V.los.position.x = G.losX();
  const pre = G.phase === 'huddle' || G.phase === 'set' || G.phase === 'hike';
  const fade = pre ? 1 : G.phase === 'live' ? 0.18 : G.phase === 'dead' ? 0.12 : 0;
  for (const m of V.los.children)
    m.material.opacity += (m.userData.op * fade - m.material.opacity) * Math.min(1, dt * 9);

  // ── route previews, live-updating as they're redrawn ──
  const drawing = G.phase === 'huddle' || G.phase === 'set';
  V.routeGrp.visible = drawing;
  if (drawing) {
    const sig = routesSig(G);
    if (sig !== V.sig) { V.sig = sig; rebuildRoutes(G, V); }
    V.routeMat.opacity = 0.72 + Math.sin(V.t * 3) * 0.12;   // chalk shimmer
  } else V.sig = '';

  // ── THROW PREVIEW ────────────────────────────────────────
  // While he is winding up, G.aim.pred is the live prediction. During the
  // windup (throwWind > 0) the decision is already MADE and he is a sitting
  // duck for it, so the same arc stays on the grass and flashes — that beat is
  // the price of the throw and it should be visible from the sideline.
  const winding = G.throwWind > 0 && !!G.pending;
  const pred = G.aim.active
    ? (G.aim.pred || G.predictThrow(G.aim.tx, G.aim.tz, G.aim.charge))
    : winding ? G.pending : null;
  const q = G.qb;
  V.aimGrp.visible = !!(pred && q && q.mesh);
  if (V.aimGrp.visible) {
    const col = PITCH[pred.type] ?? PITCH.normal;
    const flash = winding ? 0.55 + 0.45 * Math.sin(V.t * 40) : 1;
    V.aimArcMat.color.setHex(col);   V.aimArcMat.opacity = (winding ? 0.8 : 0.5) * flash;
    V.aimHeadMat.color.setHex(col);  V.aimHeadMat.opacity = 0.95 * flash;
    V.aimRetMat.color.setHex(col);   V.aimRetMat.opacity = 0.9 * flash;
    V.aimSprayMat.color.setHex(col); V.aimSprayMat.opacity = 0.5 * flash;
    V.aimFillMat.color.setHex(col);  V.aimFillMat.opacity = 0.13 * flash;

    const sx = q.mesh.position.x, sz = q.mesh.position.z;
    const dx = pred.tx - sx, dz = pred.tz - sz;
    for (let i = 0; i < V.beads.length; i++) {
      const k = i / (V.beads.length - 1);
      const m = V.beads[i];
      m.position.set(sx + dx * k, arcY(k, pred.peak), sz + dz * k);
      m.scale.setScalar(0.155 - k * 0.05 + (Math.abs(k - 0.5) < 0.03 ? 0.05 : 0));
    }
    const pk = (V.t / Math.max(0.05, pred.air)) % 1;      // one lap per flight
    V.pacer.position.set(sx + dx * pk, arcY(pk, pred.peak), sz + dz * pk);
    V.pacer.scale.setScalar(0.23);

    V.ret.position.set(pred.tx, 0.05, pred.tz);
    V.ret.scale.setScalar(1 + Math.sin(V.t * 6) * 0.06);
    // pred.scatter is metres, and launch() picks a uniform point inside that
    // radius — so this ring is not a metaphor, it is the actual bet.
    const sc = Math.max(0.28, pred.scatter);
    V.spray.position.set(pred.tx, 0.042, pred.tz);
    V.spray.scale.setScalar(sc);
    V.sprayFill.position.set(pred.tx, 0.038, pred.tz);
    V.sprayFill.scale.setScalar(sc);
  }

  // ── CHARGE GAUGE ─────────────────────────────────────────
  const charging = (G.aim.active || winding) && q && q.mesh;
  V.chgGrp.visible = !!charging;
  if (charging) {
    const ch = clamp(winding ? (G.pending.charge ?? 1) : G.aim.charge, 0, 1);
    const band = ch < TH.touchAt ? 'touch' : ch > TH.bulletAt ? 'bullet' : 'normal';
    if (band !== V.band) { V.band = band; V.bandPop = 1; }      // the SNAP
    V.bandPop = Math.max(0, V.bandPop - dt * 4);
    const px = q.mesh.position.x, pz = q.mesh.position.z;
    const ang = pred ? Math.atan2(pred.tx - px, pred.tz - pz) : (q.aim || 0);
    V.chgGrp.position.set(px, 0.055, pz);
    V.chgGrp.scale.setScalar(1 + V.bandPop * 0.14);
    for (const p of V.pips) {
      const w = ang + (p.f - 0.5) * 2.5;                        // a 143° dial, aimed downrange
      // 1.75m out: wide enough to clear his own body ring and the bodies of
      // the two rushers who will be standing on him while he holds this
      p.m.position.set(Math.sin(w) * 1.75, 0, Math.cos(w) * 1.75);
      p.m.rotation.y = w;
      p.m.material = ch >= p.f ? p.lit : V.dimMat;
      const near = Math.max(0, 1 - Math.abs(ch - p.f) * V.pips.length * 0.8);
      p.m.scale.set(1, 1, 1 + near * 0.9);                      // a bulge rides the fill
    }
    const fl = winding ? 0.55 + 0.45 * Math.sin(V.t * 40) : 1;
    for (const k of ['touch', 'normal', 'bullet'])
      V.litMats[k].opacity = (0.85 + V.bandPop * 0.15) * fl;
    V.dimMat.opacity = 0.38 * fl;
  }

  // ── CATCH WINDOW ─────────────────────────────────────────
  V.catchGrp.visible = !!b.inAir;
  if (b.inAir) {
    const air = Math.max(0.05, b.air || 1);
    const k = clamp((b.t || 0) / air, 0, 1);
    const remain = Math.max(0, air - (b.t || 0));
    // THE RULE, drawn: a press issued now stays hot for catching.pressT, so the
    // instant the remaining flight time drops under that, pressing now is a
    // press ON ARRIVAL. That is the whole timing, and it is one colour change.
    const hot = remain <= CA.pressT;
    V.winRing.position.set(b.tx, 0.062, b.tz);
    V.winRing.scale.setScalar(CA.reachR + (1 - k) * 4.6);       // closes onto hands
    V.winMat.color.setHex(hot ? 0xffd94a : CHALK);
    V.winMat.opacity = hot ? 0.95 : 0.5 + 0.16 * Math.sin(V.t * 8);
    V.hitRing.position.set(b.tx, 0.056, b.tz);
    V.hitRing.scale.setScalar(CA.reachR);                       // literally his reach
    V.hitMat.color.setHex(hot ? 0xffd94a : CHALK);
    V.hitMat.opacity = hot ? 0.55 + 0.3 * Math.abs(Math.sin(V.t * 26)) : 0.28;

    const who = G.claimant(G.possession);
    V.claim.visible = !!who?.mesh;
    V.claimLane.visible = false;
    if (V.claim.visible) {
      const wp = who.mesh.position;
      // ...and when HIS press is hot, the spotlight itself flashes. That is the
      // moment the player is being graded on, so it is the moment that shouts.
      const hp = who.m ? clamp(who.m.catchPress / CA.pressT, 0, 1) : 0;
      V.claim.position.set(wp.x, 0, wp.z);
      V.claimRing.scale.setScalar(1.2 + hp * 0.34);
      V.claimMat.color.setHex(hp > 0 ? lerpHex(TEAMS[who.team].color, 0xffffff, hp * 0.75)
                                     : TEAMS[who.team].color);
      V.claimMat.opacity = hp > 0 ? 0.6 + 0.4 * Math.abs(Math.sin(V.t * 34))
                                  : 0.7 + 0.3 * Math.abs(Math.sin(V.t * 9));
      V.claimCone.position.y = 2.85 + Math.sin(V.t * (hp > 0 ? 20 : 6)) * 0.12;
      const lx = b.tx - wp.x, lz = b.tz - wp.z;
      const len = Math.hypot(lx, lz);
      if (len > 1.2) {                                          // the ground he still owes
        V.claimLane.visible = true;
        V.claimLane.position.set(wp.x + lx / 2, 0.036, wp.z + lz / 2);
        V.claimLane.scale.set(1, 1, len);
        V.claimLane.rotation.y = aimY(lx, lz);
        V.claimLaneMat.color.setHex(TEAMS[who.team].color);
        V.claimLaneMat.opacity = 0.16 + 0.1 * Math.sin(V.t * 8);
      }
    }
    // and the other team's claim, so a contested ball LOOKS contested
    const foe = G.claimant(G.possession === 'blue' ? 'red' : 'blue');
    V.contest.visible = !!(foe?.mesh &&
      Math.hypot(foe.x - b.tx, foe.z - b.tz) < CA.contestR * 2.4);
    if (V.contest.visible) {
      V.contest.position.set(foe.mesh.position.x, 0.066, foe.mesh.position.z);
      V.contestMat.color.setHex(TEAMS[foe.team].color);
      V.contestMat.opacity = 0.3 + 0.22 * Math.abs(Math.sin(V.t * 14));
    }
  }

  // press flashes — hot for catching.pressT on whoever pressed, so you can see
  // your own timing land (and see the defender's, which is how you learn to
  // stop throwing into it)
  for (let i = 0; i < G.actors.length; i++) {
    const a = G.actors[i], m = V.press[i];
    const p = a.m ? a.m.catchPress : 0;
    if (p <= 0) { if (m.visible) m.visible = false; continue; }
    const k = clamp(p / CA.pressT, 0, 1);
    m.visible = true;
    m.position.set(a.mesh.position.x, 0.09, a.mesh.position.z);
    m.scale.setScalar(1.05 + (1 - k) * 1.5);
    m.material.color.setHex(TEAMS[a.team].color);
    m.material.opacity = 0.85 * k;
  }

  // ── WRAP METER ───────────────────────────────────────────
  const car = G.carrier;
  const wt = car?.m ? car.m.wrapT : 0;
  V.wrapGrp.visible = !!(car?.mesh && wt > 0.02 && G.phase === 'live');
  if (V.wrapGrp.visible) {
    const gang = (car.m.wrapBy || 0) > 1;
    V.wrapGrp.position.set(car.mesh.position.x, 0.05, car.mesh.position.z);
    V.wrapGrp.scale.setScalar(1 + wt * 0.06 + (gang ? Math.sin(V.t * 44) * 0.06 : 0));
    const n = Math.round(clamp(wt, 0, 1) * V.wrapPips.length);
    for (let i = 0; i < V.wrapPips.length; i++) V.wrapPips[i].visible = i < n;
    V.wrapMat.color.setHex(lerpHex(CHALK, 0xff3b30, wt));
    V.wrapMat.opacity = 0.7 + 0.3 * Math.abs(Math.sin(V.t * (6 + wt * 24)));
  }

  // ── the ring: QB while set, whoever HOLDS the ball while live ──
  // (deliberately not the QB once he has let it go — while the ball is up the
  // eyes belong to the claimant, and two spotlights would fight)
  const mark = G.phase === 'live' ? (b.inAir ? null : b.holder)
             : G.phase === 'set' ? G.qb : null;
  V.puls.visible = !!mark?.mesh;
  if (V.puls.visible) {
    V.puls.position.set(mark.mesh.position.x, 0.045, mark.mesh.position.z);
    V.puls.material.color.setHex(TEAMS[mark.team].color);
    V.puls.scale.setScalar(0.9 * (1 + Math.sin(V.t * 5) * 0.1));
    V.puls.material.opacity = 0.4 + Math.sin(V.t * 5) * 0.18;
  }

  // ── STAMINA, for the kid you are steering and nobody else ──
  // footcontrol keeps the steered actor internally; main.js may forward it as
  // G._steering. Without it, the honest fallback is "the carrier, if he is
  // ours" — which is exactly who you are driving in this mode anyway.
  const you = G._steering ||
    (G.carrier && G.player && G.carrier.team === G.player.team ? G.carrier : null);
  const showStam = !!(you?.mesh && you.m && you === car && b.holder === you && G.phase === 'live');
  V.stam.visible = showStam;
  if (showStam) {
    const s = clamp(you.m.stam, 0, 1);
    const gassed = s < F.carry.tiredAt;
    V.stam.position.set(you.mesh.position.x, 2.42, you.mesh.position.z);
    face(V.stam, cam);
    V.stamFill.scale.set(Math.max(0.001, 1.5 * s), 0.18, 1);
    V.stamFill.material.color.setHex(gassed ? 0xff3b30 : s < 0.4 ? 0xffd94a : 0x8ede4a);
    V.stamFill.material.opacity = gassed ? 0.6 + 0.4 * Math.abs(Math.sin(V.t * 18)) : 0.95;
  }

  // ── pooled one-shots: chalk pops, then the stickers on top ──
  for (const P of V.pops) {
    if (P.life <= 0) { if (P.m.visible) P.m.visible = false; continue; }
    P.life -= dt;
    const k = clamp(1 - P.life / P.max, 0, 1);
    P.m.visible = true;
    P.m.scale.setScalar(P.r0 + (P.r1 - P.r0) * (1 - (1 - k) * (1 - k)));   // ease out
    P.m.material.opacity = 0.85 * (1 - k);
  }
  for (const L of V.labels) {
    if (L.life <= 0) { if (L.m.visible) L.m.visible = false; continue; }
    L.life -= dt;
    const age = 0.9 - L.life;
    const fin = Math.min(1, age / 0.08);              // snaps in
    const fout = Math.min(1, L.life / 0.3);           // drifts out
    const pop = 1 + (1 - fin) * 0.55;
    L.m.visible = true;
    L.m.position.set(L.x, 2.5 + age * 1.25, L.z);
    face(L.m, cam);
    L.m.scale.set(2.5 * pop, 0.83 * pop, 1);
    L.mat.opacity = fin * fout;
  }
}

// ═════════════════════════════════════════════════════════════
// THE HUD IS NOT THIS FILE'S — and it already exists. index.html carries
// #fthud (score, down, distance, #ftResult), the four .ftplay cards, and the
// two text bands #ftPrompt and #ftHint; src/ui.js's updateFootHud fills them
// from G._prompt / G._hint, which main.js copies off footcontrol every frame.
//
// One trap, since it cost a whole layer of feedback once: #ftHint used to be a
// CHILD of #ftplays, and #ftplays is only `.on` while you are calling a play.
// Every live hint the control layer writes — "HOLD click charge · release
// throw", "click catch · click again to lay out" — was therefore painted into
// a hidden element and never seen, and G._prompt had no element at all. Both
// bands are now siblings of the play grid and show/hide with their content.
// If either ever goes quiet again, check the parent before the writer.
//
// If you want to name the pitch in WORDS as well as colour, the palette to
// match is the one at the top of this file, and nowhere else:
//   touch #59c8e0 · normal #ffd94a · bullet #ff5a3d
// Read it off G.aim.pred?.type while G.aim.active, or G.pending.type while
// G.throwWind > 0 — the same two objects the arc is drawn from.
// ═════════════════════════════════════════════════════════════

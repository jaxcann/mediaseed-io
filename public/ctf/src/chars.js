import * as THREE from 'three';
import { TEAMS, CFG } from './config.js';
import { toon, toonMap, outlined, rbox, numberTexture } from './art.js';
const CFG_HORN_CD = CFG.kits.karen.hornCd;

// ═════════════════════════════════════════════════════════════
// THE CAST
//
// One proportion system, one palette, one construction language. Everything
// is measured in HEAD units so the kids look like a set somebody designed
// rather than a pile of primitives that happen to share a scene.
//
//   HEAD          1.00   the read at gameplay distance
//   shoulders     0.92   just under a head wide — chunky, not heroic
//   torso height  0.88
//   whole kid     3.9 heads
//
// Rules that keep them feeling crafted:
//   · the jersey IS the torso — never a slab hung in front of it
//   · arms live OUTSIDE the silhouette, so the shape reads at a glance
//   · every joint nests: each segment strictly inside or outside its neighbour
//   · the head has a jaw, so it is a head and not a ball
// ═════════════════════════════════════════════════════════════
const HEAD = 0.46;
const SHOULDER_Y = 1.40, WAIST_Y = 0.60, HEAD_Y = 1.97, HIP = 0.62;

// Karen's horn takes your controls away for 0.45s and nothing said so — it read
// as dropped input. Three stars orbit the head while you're stunned.
function addStunStars(u, parent, y) {
  const stars = new THREE.Group();
  stars.position.y = y;
  stars.visible = false;
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(starGeometry(), toon(0xffd94a));
    s.position.set(Math.cos(i * 2.09) * 0.6, 0, Math.sin(i * 2.09) * 0.6);
    s.rotation.x = -Math.PI / 2;
    stars.add(s);
  }
  parent.add(stars); u.stars = stars;
}

let STAR_GEO = null;
function starGeometry() {
  if (STAR_GEO) return STAR_GEO;
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.125 : 0.28, a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  sh.closePath();
  return (STAR_GEO = new THREE.ExtrudeGeometry(sh, { depth: 0.045, bevelEnabled: false }));
}

// A coordinated palette. Skins run warm; hair is picked to sit against them.
const SKIN = [0xf7d2ac, 0xe9b98c, 0xcb9160, 0xa46c43, 0x7c4c2d, 0xf0c39a];
const HAIR = [0x2b1d16, 0x5c3a1e, 0xc9973f, 0x171310, 0x8a4f2a, 0x3e2b1c];
const SHORTS = 0x2d3850, SOCK = 0xfffdf6, SHOE = 0xfffdf6, SHOE_SOLE = 0xe4ddcd;

// ── the torso: a lathed profile, so it has shoulders and a waist ──
function torsoGeometry(wide) {
  const pts = [
    [0.001, WAIST_Y - 0.06],
    [0.30 * wide, WAIST_Y - 0.02],
    [0.355 * wide, WAIST_Y + 0.18],
    [0.385 * wide, WAIST_Y + 0.42],
    [0.395 * wide, WAIST_Y + 0.62],
    [0.375 * wide, SHOULDER_Y - 0.06],
    [0.30 * wide, SHOULDER_Y + 0.03],
    [0.165 * wide, SHOULDER_Y + 0.11],
    [0.001, SHOULDER_Y + 0.12],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(pts, 28);
}

// ── the head: a sphere with a jaw taper, so it reads as a head ──
function headGeometry() {
  const g = new THREE.SphereGeometry(HEAD, 32, 26);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    if (y < 0) {                                  // narrow and lift the lower half
      const t = Math.min(1, -y / HEAD);
      const k = 1 - t * t * 0.26;
      p.setX(i, p.getX(i) * k);
      p.setZ(i, p.getZ(i) * k);
      p.setY(i, y * 0.94);
    }
  }
  g.computeVertexNormals();
  return g;
}

// ── a hand: mitt with a thumb, so it reads as a hand at any distance ──
function makeHand(skin, s) {
  const g = new THREE.Group();
  const palm = outlined(new THREE.SphereGeometry(0.125 * s, 14, 12), skin, 0.012);
  palm.scale.set(1, 0.95, 0.85);
  const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.045 * s, 0.05 * s, 4, 8), toon(skin));
  thumb.position.set(0.09 * s, 0.02 * s, 0.05 * s);
  thumb.rotation.z = -0.7;
  g.add(palm, thumb);
  return g;
}

// ── a sneaker: one soft pill, stripe, sole, laces ──
function makeShoe(T, s = 1) {
  const g = new THREE.Group();
  const body = outlined(new THREE.CapsuleGeometry(0.15 * s, 0.2 * s, 6, 14), SHOE, 0.014);
  body.rotation.x = Math.PI / 2; body.position.set(0, 0.125 * s, 0.03 * s);
  body.scale.set(1.02, 0.76, 1.05);
  const sole = new THREE.Mesh(new THREE.CapsuleGeometry(0.152 * s, 0.2 * s, 4, 14), toon(SHOE_SOLE));
  sole.rotation.x = Math.PI / 2; sole.position.set(0, 0.038 * s, 0.03 * s);
  sole.scale.set(1.06, 0.24, 1.07);
  const stripe = new THREE.Mesh(rbox(0.3 * s, 0.05 * s, 0.13 * s, 0.02), toon(T.dark));
  stripe.position.set(0, 0.125 * s, -0.035 * s);
  const tongue = new THREE.Mesh(rbox(0.13 * s, 0.05 * s, 0.09 * s, 0.02), toon(0xe9e4d6));
  tongue.position.set(0, 0.225 * s, 0.09 * s);
  g.add(sole, body, stripe, tongue);
  return g;
}

export function makeChar(teamKey, variant, kit = 'runner') {
  const T = TEAMS[teamKey];
  const root  = new THREE.Group();
  const lean  = new THREE.Group();
  const bob   = new THREE.Group();
  const upper = new THREE.Group();
  root.add(lean); lean.add(bob); bob.add(upper);

  const u = { lean, bob, upper, t: 0, kit, isPlayer: false, blinkOff: (variant * 1.37) % 3.0 };
  root.userData = u;

  if (kit === 'dog') buildDog(u, T, bob, upper, lean);
  else buildKid(u, T, variant, kit, bob, upper, lean);
  if (kit === 'lilt') { lean.scale.setScalar(0.8); u.small = true; }

  const blob = new THREE.Mesh(new THREE.CircleGeometry(0.62, 22),
    new THREE.MeshBasicMaterial({ color: 0x1e3a12, transparent: true, opacity: 0.3 }));
  blob.rotation.x = -Math.PI/2; blob.position.y = 0.015; blob.layers.set(1);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.86, 30),
    new THREE.MeshBasicMaterial({ color: T.color, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI/2; ring.position.y = 0.02; ring.layers.set(1);
  root.add(blob, ring);
  u.blob = blob; u.ring = ring;
  return root;
}

function buildKid(u, T, variant, kit, bob, upper, lean) {
  const nahele = kit === 'nahele';
  const skin = nahele ? 0x7c4c2d : SKIN[variant % SKIN.length];
  const hair = nahele ? 0x171310 : HAIR[variant % HAIR.length];
  const wide = kit === 'guard' ? 1.38 : 1.0;
  const headY = kit === 'guard' ? HEAD_Y - 0.02 : HEAD_Y;

  // ── legs: hip-pivoted, bare, sock, sneaker. Radii nest strictly. ──
  const legL = new THREE.Group(), legR = new THREE.Group();
  const thighGeo = new THREE.CapsuleGeometry(0.115 * wide, 0.2, 6, 14);
  for (const [leg, sx] of [[legL, -1], [legR, 1]]) {
    const thigh = outlined(thighGeo, skin, 0.014);
    thigh.position.y = 0.44 - HIP;
    const sock = new THREE.Mesh(new THREE.CylinderGeometry(0.126 * wide, 0.134 * wide, 0.2, 16), toon(SOCK));
    sock.position.y = 0.19 - HIP;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.129 * wide, 0.129 * wide, 0.042, 16), toon(T.color));
    band.position.y = 0.245 - HIP;
    const shoe = makeShoe(T, wide); shoe.position.y = -HIP;
    leg.add(thigh, sock, band, shoe);
    leg.position.set(sx * 0.2 * wide, HIP, 0);
    leg.rotation.y = sx * 0.13;                       // toes out — a stance, not a stand
    bob.add(leg);
  }

  // ── shorts: a soft pill that sits ON the hips ──
  const shorts = outlined(new THREE.SphereGeometry(0.4 * wide, 20, 14), SHORTS, 0.018);
  shorts.position.y = WAIST_Y + 0.05;
  shorts.scale.set(kit === 'guard' ? 0.93 : 0.96, 0.56, kit === 'guard' ? 0.95 : 0.9);
  const hemGeo = new THREE.CylinderGeometry(0.2 * wide, 0.212 * wide, 0.13, 16);
  const hemL = new THREE.Mesh(hemGeo, toon(SHORTS)), hemR = new THREE.Mesh(hemGeo, toon(SHORTS));
  hemL.position.set(-0.2 * wide, WAIST_Y - 0.12, 0); hemR.position.set(0.2 * wide, WAIST_Y - 0.12, 0);

  // ── the jersey IS the torso ──
  const torso = outlined(torsoGeometry(wide), T.color, 0.018);
  // waistband hides the shirt/shorts seam
  const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.335 * wide, 0.35 * wide, 0.12, 24), toon(0x232c40));
  waist.position.y = WAIST_Y + 0.02;
  // collar rib
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.17 * wide, 0.035, 10, 24), toon(T.dark));
  collar.position.y = SHOULDER_Y + 0.11; collar.rotation.x = Math.PI/2;
  // the number, printed ON the chest curve
  const numGeo = new THREE.CylinderGeometry(0.4 * wide, 0.4 * wide, 0.36, 26, 1, true, -0.55, 1.1);
  const num = new THREE.Mesh(numGeo, new THREE.MeshBasicMaterial({
    map: numberTexture(variant + 1), transparent: true, side: THREE.DoubleSide }));
  num.position.y = WAIST_Y + 0.5;
  num.scale.setScalar(1.005);

  // ── arms: OUTSIDE the silhouette, sleeve buried in the shirt ──
  const armL = new THREE.Group(), armR = new THREE.Group();
  const sleeveR = 0.13 * wide, foreR = 0.098 * wide;
  const armX = 0.395 * wide + sleeveR * 0.34;
  for (const [arm, sx] of [[armL, -1], [armR, 1]]) {
    const sleeve = outlined(new THREE.CapsuleGeometry(sleeveR, 0.16, 8, 16), T.color, 0.014);
    sleeve.position.y = -0.05;
    const cuff = new THREE.Mesh(new THREE.CylinderGeometry(sleeveR * 1.02, sleeveR * 0.98, 0.05, 16), toon(T.dark));
    cuff.position.y = -0.17;
    const fore = outlined(new THREE.CapsuleGeometry(foreR, 0.2, 8, 16), skin, 0.013);
    fore.position.y = -0.3;
    const hand = makeHand(skin, wide); hand.position.set(0, -0.46, 0.03);
    hand.scale.x = sx;
    arm.add(sleeve, cuff, fore, hand);
    arm.position.set(sx * armX, SHOULDER_Y - 0.05, 0);
    arm.rotation.z = sx * -0.16;                      // hangs clear of the body
    arm.rotation.x = 0.1;
    upper.add(arm);
    if (sx < 0) u.handL = hand; else u.handR = hand;
  }

  // ── head, neck, face ──
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.152 * wide, 0.19 * wide, 0.3, 16), toon(skin));
  neck.position.y = SHOULDER_Y + 0.15;
  const head = outlined(headGeometry(), skin, 0.02);
  head.position.y = headY;
  const earGeo = new THREE.SphereGeometry(0.085, 12, 10);
  const earL = new THREE.Mesh(earGeo, toon(skin)), earR = new THREE.Mesh(earGeo, toon(skin));
  earL.position.set(-0.44, headY - 0.02, 0.0); earL.scale.set(0.62, 1.1, 0.9);
  earR.position.set( 0.44, headY - 0.02, 0.0); earR.scale.set(0.62, 1.1, 0.9);
  const eyeL = makeEye(), eyeR = makeEye();
  eyeL.position.set(-0.155, headY + 0.01, 0.408);
  eyeR.position.set( 0.155, headY + 0.01, 0.408);
  const gloss = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24, depthWrite: false }));
  gloss.position.set(-0.18, headY + 0.32, 0.27); gloss.scale.set(1.35, 0.5, 1);
  gloss.rotation.z = 0.5; gloss.layers.set(1);
  const cheekMat = new THREE.MeshBasicMaterial({ color: 0xef8a72, transparent: true, opacity: 0.2, depthWrite: false });
  const cheekL = new THREE.Mesh(new THREE.CircleGeometry(0.062, 12), cheekMat), cheekR = cheekL.clone();
  cheekL.position.set(-0.28, headY - 0.12, 0.362); cheekL.rotation.y = -0.62; cheekL.layers.set(1);
  cheekR.position.set( 0.28, headY - 0.12, 0.362); cheekR.rotation.y =  0.62; cheekR.layers.set(1);

  const hairG = buildHair(kit, variant, hair, headY, T);

  upper.add(shorts, hemL, hemR, waist, torso, num, collar, neck, head, earL, earR,
            gloss, cheekL, cheekR, eyeL, eyeR);
  if (!hairG.userData.replacesHair) upper.add(hairG);
  else upper.add(hairG);

  addKitProps(u, kit, T, skin, hair, headY, wide, upper, armL, armR, bob, lean);

  addStunStars(u, upper, headY + 0.56);

  u.legL = legL; u.legR = legR; u.armL = armL; u.armR = armR; u.wide = wide;
  u.eyes = [eyeL, eyeR]; u.hairG = hairG; u.head = head; u.torso = torso;
}

// ── one hairstyle per kid, built to read as a silhouette from above ──
function buildHair(kit, variant, hair, headY, T) {
  const g = new THREE.Group();
  g.userData = {};
  const cap = (phi, r = 0.468, y = 0.02) => {
    const m = outlined(new THREE.SphereGeometry(r, 22, 16, 0, Math.PI*2, 0, Math.PI*phi), hair, 0.018);
    m.position.y = headY + y; return m;
  };
  if (kit === 'skater') {                            // helmet, mum's orders
    const helm = outlined(new THREE.SphereGeometry(0.492, 22, 16, 0, Math.PI*2, 0, Math.PI*0.46), 0x4bbfe0, 0.016);
    helm.position.y = headY + 0.012;
    const vent = new THREE.Mesh(rbox(0.1, 0.05, 0.34, 0.02), toon(0x2f8fae));
    vent.position.set(0, headY + 0.44, 0.02);
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.022, 8, 26), toon(0xefe7d6));
    strap.position.y = headY - 0.08; strap.rotation.x = Math.PI/2 - 0.1;
    g.add(helm, vent, strap);
  } else if (kit === 'lilt') {                       // backwards cap
    const c = outlined(new THREE.SphereGeometry(0.478, 22, 16, 0, Math.PI*2, 0, Math.PI*0.45), 0xe04848, 0.016);
    c.position.y = headY + 0.01;
    const brim = outlined(rbox(0.44, 0.055, 0.32, 0.035), 0xc03a3a, 0.012);
    brim.position.set(0, headY + 0.14, -0.44); brim.rotation.x = -0.16;
    const btn = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), toon(0xffd94a));
    btn.position.y = headY + 0.48;
    g.add(c, brim, btn);
  } else if (kit === 'karen') {                      // the angled bob
    const bobc = cap(0.50, 0.494, 0.03); bobc.scale.set(1.03, 1.02, 1);
    const flipL = outlined(new THREE.SphereGeometry(0.165, 14, 12), hair, 0.012);
    const flipR = flipL.clone();
    flipL.position.set(-0.42, headY - 0.2, -0.03); flipL.scale.set(0.68, 1.4, 0.86);
    flipR.position.set( 0.42, headY - 0.2, -0.03); flipR.scale.set(0.68, 1.4, 0.86);
    const shades = new THREE.Mesh(rbox(0.6, 0.1, 0.1, 0.04), toon(0x2a2a2a));
    shades.position.set(0, headY + 0.41, 0.08); shades.rotation.x = -0.66;
    g.add(bobc, flipL, flipR, shades);
  } else if (kit === 'nahele') {                     // short curls
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2;
      const c = outlined(new THREE.SphereGeometry(0.155, 12, 10), hair, 0.013);
      c.position.set(Math.cos(a) * 0.33, headY + 0.27 + Math.sin(i * 2.3) * 0.03, Math.sin(a) * 0.31 - 0.03);
      g.add(c);
    }
    const top = outlined(new THREE.SphereGeometry(0.26, 14, 12), hair, 0.013);
    top.position.set(0, headY + 0.4, -0.03);
    g.add(cap(0.33, 0.466, 0.01), top);
  } else switch (variant % 3) {
    case 0: {                                        // bowl with a fringe
      g.add(cap(0.40));
      // the fringe is a squashed lobe over the brow, not a sphere slice —
      // slices at low segment counts render as visible flat facets
      const fringe = outlined(new THREE.SphereGeometry(0.2, 14, 12), hair, 0.012);
      fringe.position.set(0, headY + 0.2, 0.3);
      fringe.scale.set(1.85, 0.5, 0.5);
      g.add(fringe); break;
    }
    case 1: {                                        // soft spikes
      g.add(cap(0.34, 0.464));
      for (let i = 0; i < 5; i++) {
        const s = outlined(new THREE.SphereGeometry(0.115, 12, 10), hair, 0.012);
        const a = (i - 2) * 0.42;
        s.position.set(Math.sin(a) * 0.24, headY + 0.4, Math.cos(a) * 0.11 - 0.05);
        s.scale.set(0.82, 1.85, 0.82);
        s.rotation.set(-0.22 + (i % 2) * 0.18, 0, -a * 0.6);
        g.add(s);
      }
      break;
    }
    default: {                                       // high ponytail
      g.add(cap(0.38));
      const tie = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.028, 8, 14), toon(T.color));
      tie.position.set(0, headY + 0.43, -0.17); tie.rotation.x = 1.1;
      const tail = outlined(new THREE.CapsuleGeometry(0.095, 0.3, 6, 12), hair, 0.014);
      tail.position.set(0, headY + 0.28, -0.34); tail.rotation.x = 0.8;
      g.add(tie, tail);
      break;
    }
  }
  return g;
}

function addKitProps(u, kit, T, skin, hair, headY, wide, upper, armL, armR, bob, lean) {
  if (kit === 'runner') {
    const band = outlined(new THREE.TorusGeometry(0.452, 0.042, 10, 26), T.dark, 0.014);
    band.position.y = headY + 0.11; band.rotation.x = Math.PI/2 - 0.07;
    const knot = outlined(new THREE.SphereGeometry(0.07, 12, 10), T.dark, 0.012);
    knot.position.set(0.08, headY + 0.1, -0.45);
    const tail = new THREE.Mesh(new THREE.CapsuleGeometry(0.028, 0.18, 6, 10), toon(T.dark));
    tail.position.set(0.17, headY - 0.04, -0.47); tail.rotation.set(0.35, 0, 0.5);
    upper.add(band, knot, tail);
  }
  if (kit === 'slingshot') {
    const s = new THREE.Group();
    const handle = outlined(new THREE.CylinderGeometry(0.05, 0.062, 0.46, 10), 0xb07a42, 0.018);
    const fL = outlined(new THREE.CylinderGeometry(0.038, 0.038, 0.3, 10), 0xb07a42, 0.016);
    const fR = fL.clone();
    fL.position.set(-0.1, 0.34, 0); fL.rotation.z = 0.5;
    fR.position.set( 0.1, 0.34, 0); fR.rotation.z = -0.5;
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.24, 6), toon(0xd94a4a));
    band.position.y = 0.48; band.rotation.z = Math.PI/2;
    s.add(handle, fL, fR, band);
    s.position.set(0, -0.5, 0.09); s.rotation.x = 0.28;
    armR.add(s);
  }
  if (kit === 'portal') {
    const band = outlined(new THREE.TorusGeometry(0.47, 0.055, 10, 26), 0xc46bff, 0.014);
    band.position.y = headY + 0.14; band.rotation.x = 0.42;
    for (const sx of [-1, 1]) {
      const lens = outlined(new THREE.SphereGeometry(0.1, 12, 10), 0x59e8e0, 0.012);
      lens.position.set(sx * 0.145, headY + 0.2, 0.39);
      upper.add(lens);
    }
    upper.add(band);
  }
  if (kit === 'grappler') {
    const rig = outlined(rbox(0.19, 0.15, 0.22, 0.035), 0x8a939e, 0.014);
    rig.position.set(0, -0.4, 0.1);
    const hook = outlined(new THREE.ConeGeometry(0.07, 0.16, 8), 0xffd94a, 0.012);
    hook.position.set(0, -0.4, 0.26); hook.rotation.x = Math.PI/2;
    armR.add(rig, hook);
  }
  if (kit === 'guard') {
    const band = outlined(new THREE.TorusGeometry(0.462, 0.055, 12, 28), 0xfffdf6, 0.014);
    band.position.y = headY + 0.15; band.rotation.x = Math.PI/2 - 0.05;
    const stripe2 = new THREE.Mesh(new THREE.TorusGeometry(0.464, 0.02, 8, 28), toon(T.color));
    stripe2.position.y = headY + 0.15; stripe2.rotation.x = Math.PI/2 - 0.05;
    upper.add(stripe2);
    upper.add(band);
  }
  if (kit === 'karen') {
    const can = new THREE.Group();
    const body = outlined(new THREE.CylinderGeometry(0.088, 0.088, 0.24, 16), 0xe04848, 0.012);
    const horn = outlined(new THREE.ConeGeometry(0.13, 0.19, 16, 1, true), 0xefe7d6, 0.012);
    horn.position.y = 0.21; horn.rotation.x = Math.PI;
    can.add(body, horn);
    can.position.set(0, -0.52, 0.1); can.rotation.x = -1.35;
    armR.add(can);
    u.horn = can;
  }
  if (kit === 'hose') {
    const coil = new THREE.Group();
    for (let i = 0; i < 3; i++) {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.25 - i * 0.03, 0.044, 10, 24), toon(0x3f8c34));
      loop.position.set(0, -i * 0.045, -0.02 * i);
      coil.add(loop);
    }
    coil.position.set(-0.1, SHOULDER_Y - 0.32, -0.36); coil.rotation.set(0.42, 0.3, 0.2);
    const nozzle = new THREE.Group();
    const nb = outlined(new THREE.CylinderGeometry(0.052, 0.072, 0.26, 14), 0xffd94a, 0.012);
    nb.rotation.x = Math.PI/2;
    const tip = outlined(new THREE.ConeGeometry(0.058, 0.12, 12), 0x59c8e0, 0.01);
    tip.position.z = 0.19; tip.rotation.x = Math.PI/2;
    const grip = new THREE.Mesh(rbox(0.05, 0.14, 0.06, 0.02), toon(0x2f5fb3));
    grip.position.set(0, -0.1, -0.04);
    nozzle.add(nb, tip, grip);
    nozzle.position.set(0, -0.54, 0.14);
    armR.add(nozzle);
    const line = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.5, 8), toon(0x3f8c34));
    line.position.set(-0.28, SHOULDER_Y - 0.55, -0.12); line.rotation.set(0.3, 0, -0.5);
    upper.add(coil, line);
    u.nozzle = nozzle;
  }
  if (kit === 'skater') {
    const board = makeSkateboard();
    upper.add(board); u.board = board;
  }
  if (kit === 'lilt') {
    const trike = makeTrike();
    trike.position.set(0, -0.02, 0.1);
    lean.add(trike); u.trike = trike;
  }
  if (kit === 'nahele') {
    const kite = makeKite();
    kite.position.set(0, SHOULDER_Y - 0.02, -0.44);
    kite.rotation.x = 0.35; kite.scale.setScalar(0.5);
    upper.add(kite); u.kite = kite;
    for (const arm of [armL, armR]) {
      const wb = new THREE.Mesh(new THREE.CylinderGeometry(0.108, 0.108, 0.07, 14), toon(0xff5f6d));
      wb.position.y = -0.4; arm.add(wb);
    }
  }
}

// ── the dog: rebuilt with a real muzzle, chest, and floppy ears ──
function buildDog(u, T, bob, upper, lean) {
  const FUR = 0xd9a25f, DARK = 0xa9714a, CREAM = 0xf3ddb8;
  // chest forward, haunches back — a body with a direction
  const chest = outlined(new THREE.SphereGeometry(0.33, 20, 16), FUR, 0.016);
  chest.position.set(0, 0.56, 0.16); chest.scale.set(1, 0.98, 1.1);
  const rear = outlined(new THREE.SphereGeometry(0.31, 20, 16), FUR, 0.016);
  rear.position.set(0, 0.55, -0.34); rear.scale.set(1.02, 1, 1.05);
  const spine = new THREE.Mesh(new THREE.CapsuleGeometry(0.27, 0.4, 8, 16), toon(FUR));
  spine.rotation.x = Math.PI/2; spine.position.set(0, 0.56, -0.1);
  const patch = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 12), toon(DARK));
  patch.position.set(0.07, 0.75, -0.2); patch.scale.set(1, 0.42, 1.25);

  // a real neck, so the head is not fused to the shoulders
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.21, 0.2, 14), toon(FUR));
  neck.position.set(0, 0.74, 0.34); neck.rotation.x = 0.5;

  const head = outlined(new THREE.SphereGeometry(0.29, 20, 16), FUR, 0.016);
  head.position.set(0, 0.92, 0.5); head.scale.set(1, 0.96, 1.02);
  const muzzle = outlined(new THREE.CapsuleGeometry(0.115, 0.12, 8, 14), CREAM, 0.013);
  muzzle.rotation.x = Math.PI/2; muzzle.position.set(0, 0.84, 0.74); muzzle.scale.set(1.15, 1, 0.9);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 10), new THREE.MeshBasicMaterial({ color: 0x1a1410 }));
  nose.position.set(0, 0.88, 0.85); nose.scale.set(1.2, 0.9, 0.9);
  const tongue = new THREE.Mesh(rbox(0.085, 0.025, 0.15, 0.012), toon(0xf07a8a));
  tongue.position.set(0.02, 0.775, 0.82); tongue.rotation.x = 0.42;

  // ears that actually flop
  const earL = new THREE.Group(), earR = new THREE.Group();
  for (const [ear, sx] of [[earL, -1], [earR, 1]]) {
    const flap = outlined(new THREE.CapsuleGeometry(0.1, 0.3, 8, 14), DARK, 0.013);
    flap.scale.set(1, 1, 0.42); flap.position.y = -0.24;
    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.06, 0.2, 6, 10), toon(0xc48a5e));
    inner.scale.set(1, 1, 0.3); inner.position.set(0, -0.24, 0.05);
    ear.add(flap, inner);
    // high on the skull and swung well out, or the silhouette swallows them
    ear.position.set(sx * 0.2, 1.14, 0.46);
    ear.rotation.set(-0.3, 0, sx * 0.85);
    upper.add(ear);
  }
  const eyeL = makeEye(), eyeR = makeEye();
  eyeL.scale.setScalar(0.62); eyeR.scale.setScalar(0.62);
  eyeL.position.set(-0.115, 0.98, 0.72); eyeR.position.set(0.115, 0.98, 0.72);
  const brow = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), toon(CREAM));
  brow.position.set(-0.115, 1.05, 0.7); brow.scale.set(1, 0.5, 0.6);
  const brow2 = brow.clone(); brow2.position.x = 0.115;

  // collar at the NECK, tag hanging under the chin
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.205, 0.055, 12, 26), toon(T.color));
  collar.position.set(0, 0.79, 0.44); collar.rotation.x = 0.42;
  const buckle = new THREE.Mesh(rbox(0.07, 0.06, 0.03, 0.012), toon(0xf0e6d2));
  buckle.position.set(0, 0.79, 0.64);
  const tag = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.022, 14), toon(0xffd94a));
  tag.position.set(0, 0.66, 0.6); tag.rotation.x = Math.PI/2 - 0.3;

  const tail = new THREE.Group();
  const t1 = outlined(new THREE.CapsuleGeometry(0.072, 0.28, 8, 14), FUR, 0.012);
  t1.position.y = 0.17;
  const tip = outlined(new THREE.SphereGeometry(0.088, 12, 10), 0xfffdf5, 0.011);
  tip.position.y = 0.36;
  tail.add(t1, tip);
  tail.position.set(0, 0.68, -0.62); tail.rotation.x = -0.85;
  upper.add(tail);

  const legs = [];
  for (const [lx, lz, front] of [[-0.19, 0.26, 1], [0.19, 0.26, 1], [-0.2, -0.34, 0], [0.2, -0.34, 0]]) {
    const leg = new THREE.Group();
    const upperL = outlined(new THREE.CapsuleGeometry(0.082, 0.16, 6, 12), front ? FUR : DARK, 0.012);
    upperL.position.y = 0.18 - 0.44;
    const paw = outlined(new THREE.SphereGeometry(0.088, 12, 10), 0xfffdf5, 0.011);
    paw.position.y = 0.06 - 0.44; paw.scale.set(1, 0.72, 1.25);
    leg.add(upperL, paw);
    leg.position.set(lx, 0.44, lz);
    legs.push(leg); bob.add(leg);
  }
  const gloss = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.24, depthWrite: false }));
  gloss.position.set(-0.1, 1.1, 0.58); gloss.scale.set(1.3, 0.48, 1); gloss.rotation.z = 0.5; gloss.layers.set(1);

  upper.add(spine, rear, chest, patch, neck, head, muzzle, nose, tongue,
            eyeL, eyeR, brow, brow2, collar, buckle, tag, gloss);
  u.dogLegs = legs; u.tail = tail; u.ears = [earL, earR]; u.tongue = tongue;
  u.legL = legs[0]; u.legR = legs[1];
  u.armL = new THREE.Group(); u.armR = new THREE.Group();
  u.eyes = [eyeL, eyeR]; u.wide = 0.8;
  addStunStars(u, upper, 1.72);
}

function makeEye() {
  const g = new THREE.Group();
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.082, 14, 12),
    new THREE.MeshBasicMaterial({ color: 0x1a1410 }));
  const shine = new THREE.Mesh(new THREE.SphereGeometry(0.021, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  shine.position.set(0.026, 0.032, 0.062);
  g.add(dot, shine);
  return g;
}

export function makeSkateboard() {
  const g = new THREE.Group();
  const deck = outlined(rbox(0.34, 0.055, 0.94, 0.05), 0xe04848, 0.012);
  const grip = new THREE.Mesh(rbox(0.3, 0.02, 0.87, 0.04), toon(0x2a2a2a));
  grip.position.y = 0.04;
  const nose = new THREE.Mesh(rbox(0.3, 0.05, 0.12, 0.04), toon(0xe04848));
  nose.position.set(0, 0.05, 0.47); nose.rotation.x = -0.4;
  const tailk = nose.clone(); tailk.position.z = -0.47; tailk.rotation.x = 0.4;
  g.add(deck, grip, nose, tailk);
  const wheels = [];
  for (const dz of [-0.29, 0.29]) {
    const truck = new THREE.Mesh(rbox(0.24, 0.06, 0.09, 0.02), toon(0xb9b2a4));
    truck.position.set(0, -0.07, dz);
    g.add(truck);
    for (const dx of [-0.17, 0.17]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.075, 16), toon(0xffd94a));
      w.rotation.z = Math.PI/2; w.position.set(dx, -0.09, dz);
      g.add(w); wheels.push(w);
    }
  }
  g.userData.wheels = wheels;
  return g;
}

export function makeTrike() {
  const g = new THREE.Group();
  const frame = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.82, 12), toon(0xe04848));
  frame.rotation.x = 1.15; frame.position.set(0, 0.42, -0.1);
  const front = new THREE.Group();
  const fw = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.078, 12, 26), toon(0x2a2a2a));
  const fhub = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.1, 16), toon(0xf0e6d2));
  fhub.rotation.x = Math.PI/2;
  const pedalL = new THREE.Mesh(rbox(0.15, 0.05, 0.1, 0.02), toon(0xffd94a));
  const pedalR = pedalL.clone();
  pedalL.position.set(0.17, 0.13, 0.09); pedalR.position.set(-0.17, -0.13, -0.09);
  front.add(fw, fhub, pedalL, pedalR);
  front.position.set(0, 0.3, 0.52);
  const seat = outlined(rbox(0.27, 0.09, 0.44, 0.05), 0xffd94a, 0.012);
  seat.position.set(0, 0.56, -0.26);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.5, 12), toon(0xb9b2a4));
  bar.rotation.z = Math.PI/2; bar.position.set(0, 0.72, 0.4);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.42, 12), toon(0xb9b2a4));
  stem.position.set(0, 0.53, 0.44); stem.rotation.x = -0.25;
  for (const dx of [-0.24, 0.24]) {
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.12, 12), toon(0xe04848));
    grip.rotation.z = Math.PI/2; grip.position.set(dx, 0.72, 0.4);
    const s = new THREE.Mesh(rbox(0.022, 0.022, 0.22, 0.008), toon(0xff6bb5));
    s.position.set(dx * 1.15, 0.72, 0.3);
    g.add(grip, s);
  }
  for (const dx of [-0.34, 0.34]) {
    const rw = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.062, 10, 22), toon(0x2a2a2a));
    rw.position.set(dx, 0.19, -0.42);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.09, 14), toon(0xf0e6d2));
    hub.rotation.x = Math.PI/2; hub.position.set(dx, 0.19, -0.42);
    g.add(rw, hub);
  }
  g.add(frame, front, seat, bar, stem);
  g.userData.front = front;
  return g;
}

export function makeKite() {
  const kite = new THREE.Group();
  const sailGeo = new THREE.BufferGeometry();
  sailGeo.setFromPoints([
    new THREE.Vector3(0, 0.62, 0), new THREE.Vector3(-0.46, 0, 0), new THREE.Vector3(0, -0.78, 0),
    new THREE.Vector3(0, 0.62, 0), new THREE.Vector3(0, -0.78, 0), new THREE.Vector3(0.46, 0, 0),
  ]);
  sailGeo.computeVertexNormals();
  const sailL = new THREE.Mesh(sailGeo, new THREE.MeshToonMaterial({ color: 0xff5f6d, side: THREE.DoubleSide }));
  const sailR = sailL.clone();
  sailR.material = new THREE.MeshToonMaterial({ color: 0xffd94a, side: THREE.DoubleSide });
  sailR.scale.x = -1;
  const spar1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.4, 6), toon(0x8a5a35));
  const spar2 = spar1.clone(); spar2.scale.y = 0.66; spar2.rotation.z = Math.PI/2;
  kite.add(sailL, sailR, spar1, spar2);
  for (let i = 0; i < 3; i++) {
    const bow = new THREE.Mesh(rbox(0.16, 0.05, 0.02, 0.008), toon([0x59c8e0, 0xff8a3d, 0xc46bff][i]));
    bow.position.set(0, -0.95 - i * 0.22, 0);
    bow.rotation.z = (i % 2 ? 0.6 : -0.6);
    kite.add(bow);
  }
  return kite;
}

export function markPlayer(root) {
  const u = root.userData;
  u.isPlayer = true;
  u.ring.material.color.setHex(0xffffff);
  u.ring.scale.setScalar(1.14);
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.26, 0.4, 4),
    new THREE.MeshBasicMaterial({ color: 0xffd94a }));
  cone.rotation.x = Math.PI; cone.position.y = 2.62;
  cone.layers.set(1);
  root.add(cone);
  u.cone = cone;
}

export function makeFlag(teamKey) {
  const T = TEAMS[teamKey];
  const g = new THREE.Group();
  const pole = outlined(new THREE.CylinderGeometry(0.055, 0.055, 1.75, 10), 0xf0e6d2);
  pole.position.y = 0.87;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), toon(0xffd94a));
  knob.position.y = 1.76;
  const geo = new THREE.PlaneGeometry(0.9, 0.6, 10, 5);
  // the flag is the objective and is on screen constantly, and its normals are
  // rebuilt every frame by the ripple — the worst place in the game to lose the ramp
  const cloth = new THREE.Mesh(geo, toonMap({ color: T.color, side: THREE.DoubleSide }));
  cloth.position.set(0.48, 1.44, 0); cloth.castShadow = true;
  cloth.userData.wave = Float32Array.from(geo.attributes.position.array);
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.13),
    toonMap({ color: T.dark, side: THREE.DoubleSide }));
  stripe.position.set(0, 0, 0.006);
  cloth.add(stripe);
  g.add(pole, knob, cloth);
  g.userData.cloth = cloth;
  return g;
}

const angTo = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI*2)) - Math.PI; return a + d * t; };

export function animChar(root, a, dt) {
  const u = root.userData;
  const sp = Math.hypot(a.vx, a.vz);
  u.t += dt * (1 + sp * 0.8);

  const want = (a.roll || a.swing || a.grapple) ? a.facing : a.aim;
  u.face = u.face === undefined ? want : angTo(u.face, want, 1 - Math.exp(-18*dt));
  root.rotation.y = u.face;
  root.position.y = 0;
  u.bob.rotation.set(0, 0, 0);
  u.bob.position.x = 0;

  const fx = Math.sin(u.face), fz = Math.cos(u.face);
  const fwd = a.vx*fx + a.vz*fz;
  const lat = a.vx*fz - a.vz*fx;
  u.lean.rotation.x = THREE.MathUtils.lerp(u.lean.rotation.x, -fwd/12 * 0.22, 1 - Math.exp(-9*dt));
  // Smooth into a SEPARATE state and derive the visual from it. The trike used
  // to do `rotation.z *= 1.6` after this lerp — which fed the amplified value
  // back in as next frame's start, a recurrence with growth factor ~1.38 per
  // frame. It diverges (measured: 11,900 radians inside 40 frames); the only
  // bound was the lateral sign flipping, i.e. Lil T thrashing at the limit.
  u.leanZ = THREE.MathUtils.lerp(u.leanZ ?? 0, lat/12 * 0.55, 1 - Math.exp(-9*dt));
  u.lean.rotation.z = u.leanZ;

  const s = a.squash;
  const breathe = sp < 0.6 ? Math.sin(u.t * 2.6) * 0.012 : 0;
  u.bob.scale.set(1 - s*0.22 - breathe, 1 + s*0.3 + breathe * 1.6, 1 - s*0.22 - breathe);
  u.upper.rotation.z = sp < 0.6 ? Math.sin(u.t * 1.3) * 0.035
                                : THREE.MathUtils.lerp(u.upper.rotation.z, 0, 1 - Math.exp(-8*dt));

  const back = fwd < -0.5 ? -1 : 1;
  const swing = Math.min(1, sp/7) * 0.85 * back;
  if (u.dogLegs) {
    for (let i = 0; i < 4; i++)
      u.dogLegs[i].rotation.x = Math.sin(u.t*13 + (i === 0 || i === 3 ? 0 : Math.PI)) * swing;
    u.tail.rotation.z = Math.sin(u.t*11) * 0.5;
    u.ears[0].rotation.z =  0.34 + Math.sin(u.t*9) * 0.16 * Math.min(1, sp/5);
    u.ears[1].rotation.z = -0.34 - Math.sin(u.t*9 + 0.5) * 0.16 * Math.min(1, sp/5);
    u.ears[0].rotation.x = u.ears[1].rotation.x = -Math.min(0.5, sp * 0.06);
    u.tongue.rotation.x = 0.42 + Math.sin(u.t*7) * 0.1;
    u.bob.position.y = Math.abs(Math.sin(u.t*13)) * 0.05 * Math.min(1, sp/6);
  } else {
    const freq = u.kit === 'guard' ? 5.2 : 7;
    u.legL.rotation.x =  Math.sin(u.t*freq) * swing;
    u.legR.rotation.x = -Math.sin(u.t*freq) * swing;
    u.armL.rotation.x = -Math.sin(u.t*freq) * swing * 0.7 + 0.1;
    u.armR.rotation.x =  Math.sin(u.t*freq) * swing * 0.7 + 0.1;
    u.bob.position.y = Math.abs(Math.sin(u.t*freq)) * (u.kit === 'guard' ? 0.09 : 0.06) * Math.min(1, sp/6);
    if (u.kit === 'guard') u.bob.rotation.z = Math.sin(u.t*5.2) * 0.06 * Math.min(1, sp/6);
  }

  if (u.eyes) {
    const phase = (u.t * 0.45 + u.blinkOff) % 3.1;
    const blink = phase < 0.09 ? 0.12 : 1;
    for (const e of u.eyes) e.scale.y = blink * (u.dogLegs ? 0.62 : 1);
  }

  const ph = a.lunge?.phase;
  if (ph === 'wind') {
    u.bob.position.y = -0.13; u.lean.rotation.x = 0.34;
    u.armL.rotation.x = u.armR.rotation.x = 0.85;
  } else if (ph === 'active') {
    u.bob.scale.set(0.82, 0.9, 1.34); u.lean.rotation.x = -0.5;
    u.armL.rotation.x = u.armR.rotation.x = -2.1;
  } else if (ph === 'recover') {
    u.bob.position.y = -0.09; u.lean.rotation.x = 0.26;
    u.armL.rotation.x = u.armR.rotation.x = 0.35;
  }

  if (a.roll) {
    a.roll.spin += sp * dt / 0.55;
    u.bob.rotation.z = Math.PI/2; u.bob.rotation.y = 0; u.bob.rotation.x = a.roll.spin;
    u.bob.position.y = 0.42; u.upper.rotation.y = 0;
    u.armL.rotation.x = u.armR.rotation.x = -0.6;
    u.legL.rotation.x = 0.4; u.legR.rotation.x = -0.4;
  }

  // stunned: stars orbit the head and the body wobbles, so being frozen by the
  // air horn reads as "you got hit" and not as "the controls stopped working".
  if (u.stars) {
    const st = a.stun || 0;
    u.stars.visible = st > 0;
    if (st > 0) {
      u.stars.rotation.y += dt * 7.5;
      const pop = Math.min(1, st * 4);           // shrink away as it wears off
      u.stars.scale.setScalar(pop * (0.9 + 0.1 * Math.sin(u.t * 14)));
      u.stars.children.forEach((s, i) => {
        s.position.y = Math.sin(u.t * 9 + i * 2.1) * 0.05;
        s.rotation.z = u.t * 3 + i;
      });
      if (u.lean) u.lean.rotation.z = Math.sin(u.t * 22) * 0.13 * pop;
    }
  }

  if (u.board) {
    const on = a.board || a.air > 0;
    u.board.visible = true;
    if (on) {
      u.board.position.set(0, 0.1, 0.06);
      u.board.rotation.set(a.air > 0 ? -Math.sin((1 - a.air / (a.airT || 1)) * Math.PI) * 0.7 : 0.02, 0, 0);
      if (a.air > 0) u.board.rotation.z = (1 - a.air / (a.airT || 1)) * Math.PI * 2;
      u.legL.rotation.x = -0.15; u.legR.rotation.x = 0.35;
      u.legL.rotation.z = 0.12; u.legR.rotation.z = -0.12;
      u.lean.rotation.x = Math.min(u.lean.rotation.x, -0.12);
      for (const w of u.board.userData.wheels) w.rotation.x -= sp * dt * 3;
    } else {
      u.board.position.set(0.62, 0.98, 0.04);
      u.board.rotation.set(0, 0, 1.42);
      u.legL.rotation.z = u.legR.rotation.z = 0;
    }
  }

  if (u.trike) {
    u.trike.userData.front.rotation.x -= sp * dt * 2.2;
    const pedal = u.trike.userData.front.rotation.x;
    u.legL.rotation.x = Math.sin(pedal) * 0.5 - 0.5;
    u.legR.rotation.x = Math.sin(pedal + Math.PI) * 0.5 - 0.5;
    u.legL.rotation.z = 0.22; u.legR.rotation.z = -0.22;
    u.bob.position.y = 0.06;
    u.armL.rotation.x = u.armR.rotation.x = -1.05;
    u.lean.rotation.z = u.leanZ * 1.6;   // amplified VIEW of the smooth state, no feedback
    if (a.duck > 0) { u.lean.rotation.x = 0.8; u.bob.position.y = -0.12; }
  }

  if (u.horn) {
    const firing = (a.hornCd || 0) > CFG_HORN_CD - 0.25;
    u.armR.rotation.x = firing ? -1.75 : -0.55;
    u.horn.rotation.x = firing ? -1.6 : -1.35;
  }
  if (u.nozzle) u.armR.rotation.x = (a.sprayCd || 0) > 0.02 ? -1.5 : -0.5;

  if (u.kite) {
    const flying = !!a.swing || a.glide;
    u.kite.visible = !flying;
    if (flying) u.armL.rotation.x = u.armR.rotation.x = -2.4;
  }
  if (a.grapple) { u.armR.rotation.x = -1.8; u.armL.rotation.x = -1.2; }

  const kb = a.kb;
  if (kb) {
    if (kb.duty === 'pitch' && sp < 1) {
      u.armR.rotation.x = -0.9 + Math.sin(u.t * 1.6) * 0.25; u.lean.rotation.x = 0.1;
    } else if (kb.duty === 'post' || kb.duty === 'cover') {
      u.bob.position.y = -0.12; u.lean.rotation.x = 0.3;
      u.armL.rotation.x = u.armR.rotation.x = -0.75;
      u.legL.rotation.z = 0.18; u.legR.rotation.z = -0.18;
    } else if (kb.duty === 'chase') {
      u.armL.rotation.x = -Math.sin(u.t * 8) * 1.0;
      u.armR.rotation.x =  Math.sin(u.t * 8) * 1.0;
      u.lean.rotation.x = -0.3;
    } else if (kb.duty === 'carry') {
      u.armR.rotation.x = -2.5; u.armL.rotation.x = -1.1; u.lean.rotation.x = -0.12;
    } else if (kb.duty === 'kick') {
      u.lean.rotation.x = 0.16; u.armL.rotation.x = u.armR.rotation.x = -0.5;
    } else if (kb.duty === 'run') {
      u.armL.rotation.x = -Math.sin(u.t * 8) * 0.95;
      u.armR.rotation.x =  Math.sin(u.t * 8) * 0.95;
    }
  }

  if (a.air > 0) {
    const t = 1 - a.air / (a.airT || 1);
    root.position.y = Math.sin(t * Math.PI) * CFG.kits.skater.hurdleH;
    u.blob.material.opacity = 0.3 * (1 - Math.sin(t * Math.PI) * 0.7);
    u.blob.scale.setScalar(1 - Math.sin(t * Math.PI) * 0.3);
  } else if (root.position.y !== 0) { root.position.y = 0; u.blob.scale.setScalar(1); }

  root.visible = !a.tagged;
  if (a.air <= 0) u.blob.material.opacity = 0.3;
  u.ring.material.opacity = a.invuln > 0 ? 0.35 + 0.5*Math.abs(Math.sin(a.invuln*16)) : 0.9;
  if (u.cone) u.cone.position.y = 2.62 + Math.sin(u.t*3.2)*0.09;
  root.scale.setScalar(a.invuln > 0 ? 0.94 + (Math.sin(a.invuln*22)+1)*0.03 : 1);
}

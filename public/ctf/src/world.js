import * as THREE from 'three';
import { CFG, TEAMS } from './config.js';
import { toon, toonMap, outlined, grassTexture, scatterRng, rbox } from './art.js';
import { props as layoutProps, colliders as layoutColliders, MAPS, applyMapConfig } from './layout.js';

let grassTex = null, hardwoodTex = null, asphaltTex = null, snowTex = null, blackTex = null, poolTex = null;

// Builds one map into a single group. Call dispose() before building another.
export function buildWorld(scene, mapKey = 'backyard', fieldOverride = null) {
  const M = applyMapConfig(CFG, mapKey, TEAMS);
  // Story stops may widen the pitch beyond the map's own size (the finale is
  // this backyard at 60x41 for ten players). The override has to land AFTER
  // applyMapConfig and BEFORE anything reads CFG.field, or the sim clamps to a
  // pitch six metres wider than the fence that gets drawn.
  if (fieldOverride) { CFG.field.w = fieldOverride.w; CFG.field.h = fieldOverride.h; }
  const colliders = layoutColliders(mapKey), props = [];
  const F = CFG.field;
  const root = new THREE.Group();
  scene.add(root);
  const add = (...o) => root.add(...o);

  // ── ground ──
  let groundMat;
  if (M.ground === 'hardwood') groundMat = new THREE.MeshToonMaterial({ map: hardwoodTex ??= hardwoodTexture() });
  else if (M.ground === 'asphalt') groundMat = new THREE.MeshToonMaterial({ map: asphaltTex ??= asphaltTexture() });
  else if (M.ground === 'snow') groundMat = new THREE.MeshToonMaterial({ map: snowTex ??= snowTexture() });
  else if (M.ground === 'blacktop') groundMat = new THREE.MeshToonMaterial({ map: blackTex ??= blacktopTexture() });
  else if (M.ground === 'poolside') groundMat = new THREE.MeshToonMaterial({ map: poolTex ??= poolsideTexture() });
  else groundMat = new THREE.MeshToonMaterial({ map: grassTex ??= grassTexture() });
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(F.w + 110, F.h + 110), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  add(ground);
  // A soft shade beyond the fence line, so the eye settles on the play area.
  // It has to be keyed to the ground: a dark green wash reads as a void around
  // snow or blacktop, where the surround is not lawn.
  const BEYOND = { grass: 0x1d3d14, turf: 0x1d3d14, hardwood: 0x2a1e12,
                   asphalt: 0x241f18, snow: 0x7d97ad, blacktop: 0x232830, poolside: 0x1d3d14 };
  const beyond = new THREE.Mesh(new THREE.RingGeometry(Math.max(F.w, F.h) * 0.62, Math.max(F.w, F.h) * 1.6, 64),
    new THREE.MeshBasicMaterial({ color: BEYOND[M.ground] ?? 0x1d3d14,
                                  transparent: true, opacity: M.ground === 'snow' ? 0.3 : 0.22,
                                  depthWrite: false }));
  beyond.rotation.x = -Math.PI / 2; beyond.position.y = 0.008; beyond.layers.set(1);
  add(beyond);

  if (M.ground === 'turf') {
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(F.w, F.h),
      new THREE.MeshBasicMaterial({ map: turfLinesTexture(), transparent: true, depthWrite: false }));
    lines.rotation.x = -Math.PI / 2; lines.position.y = 0.014; lines.receiveShadow = true;
    add(lines);
  }
  if (M.ground === 'hardwood') {
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(F.w, F.h),
      new THREE.MeshBasicMaterial({ map: courtLinesTexture(), transparent: true, depthWrite: false }));
    lines.rotation.x = -Math.PI / 2; lines.position.y = 0.014;
    add(lines);
  }

  // worn dirt under each base — kids stand here all recess
  if (M.ground === 'grass') for (const T of Object.values(TEAMS)) {
    const dirt = new THREE.Mesh(new THREE.CircleGeometry(3.4, 28),
      new THREE.MeshToonMaterial({ color: 0x9a7a4e, transparent: true, opacity: 0.35 }));
    dirt.rotation.x = -Math.PI/2; dirt.position.set(T.base.x, 0.012, T.base.z);
    add(dirt);
  }

  if (M.ground === 'asphalt') {
    // road markings: the bulb's turning circle and a chalked flag box on each
    // driveway apron, painted into the ground rather than modelled
    const lines = new THREE.Mesh(new THREE.PlaneGeometry(F.w, F.h),
      new THREE.MeshBasicMaterial({ map: streetLinesTexture(), transparent: true, depthWrite: false }));
    lines.rotation.x = -Math.PI / 2; lines.position.y = 0.014;
    add(lines);
  }

  if (M.border === 'walls') buildGymWalls(add);
  else if (M.border === 'chainlink') buildChainlink(add, F);
  else if (M.border === 'poolfence') buildPoolFence(add, F);
  else if (M.border === 'culdesac') buildKerb(add, F);
  else if (M.border === 'drift') buildDrift(add, F);
  else if (M.border === 'stadium') { buildFence(add, 0xf4efe4, 0xd9d2c4); buildBleachers(add); }
  else buildFence(add, 0xc9a066, 0xa87f4b);

  // ── bases: chalk, scuffed on by hand, not a UI decal ──
  for (const T of Object.values(TEAMS)) {
    const b = new THREE.Group();
    const fill = new THREE.Mesh(new THREE.CircleGeometry(2.6, 44),
      new THREE.MeshBasicMaterial({ color: T.color, transparent: true, opacity: 0.14, depthWrite: false }));
    fill.rotation.x = -Math.PI/2; fill.position.y = 0.02;
    b.add(fill);
    // two hand-drawn passes at slightly different radii, so the line wobbles
    for (const [r0, r1, op, seg] of [[2.46, 2.72, 0.9, 44], [2.58, 2.78, 0.45, 40]]) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(r0, r1, seg),
        new THREE.MeshBasicMaterial({ color: T.color, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI/2; ring.position.y = 0.03;
      ring.rotation.z = Math.random() * 0.4;
      b.add(ring);
    }
    // chalk dashes radiating out, like somebody dragged the chalk
    for (let i = 0; i < 14; i++) {
      const a2 = i / 14 * Math.PI * 2;
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.5),
        new THREE.MeshBasicMaterial({ color: T.color, transparent: true, opacity: 0.5, depthWrite: false }));
      dash.rotation.x = -Math.PI/2; dash.rotation.z = -a2;
      dash.position.set(Math.sin(a2) * 3.0, 0.028, Math.cos(a2) * 3.0);
      b.add(dash);
    }
    b.position.set(T.base.x, 0, T.base.z);
    b.traverse(o => o.layers.set(1));                 // chalk shouldn't be inked
    add(b);
  }

  // ── props ──
  for (const p of layoutProps(mapKey)) {
    const { obj } = makeProp(p.k, p.big ? 'big' : (p.hw ?? p.col?.hw), p.hh ?? p.col?.hh);
    obj.position.set(p.x, 0, p.z);
    // COMPOSE, do not assign: some props set their own yaw in makeProp to line
    // up with their collider (a nosed-in car turns 90 degrees), and a bare
    // assignment threw that away — the car was drawn across its own hitbox.
    obj.rotation.y += p.rot || 0;                // the mirror copy faces centre too
    add(obj); props.push(obj);
  }

  const swayers = M.scatter ? scatter(root, colliders) : [];

  return {
    colliders, props, fx: null, ground, map: mapKey, swayers, indoor: !M.outdoor,
    dispose() {
      scene.remove(root);
      // Materials and their canvas textures leaked on every arena switch —
    // streetLinesTexture alone is a fresh 1024x838 canvas per buildWorld.
    const seen = new Set();
    root.traverse(o => {
      if (o.geometry && o.geometry !== ground.geometry) o.geometry.dispose?.();
      for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
        if (!m || seen.has(m)) continue;
        seen.add(m);
        if (m.map && m.map !== groundMat.map) m.map.dispose?.();
        m.dispose?.();
      }
    });
    },
  };
}

function buildFence(add, picketCol, railCol) {
  const F = CFG.field;
  const fence = new THREE.Group();
  const picket = new THREE.BoxGeometry(0.34, 2.1, 0.1);
  const picketMat = toon(picketCol);
  const picketMat2 = toon(new THREE.Color(picketCol).multiplyScalar(0.92).getHex());   // sun-faded boards mixed in
  const railGeo = new THREE.BoxGeometry(1, 0.16, 0.07);
  const railMat = toon(railCol);
  let pi = 0;
  for (const [len, ax, fixed] of [[F.w, 'x', F.h/2 + 1.2], [F.w, 'x', -(F.h/2 + 1.2)],
                                  [F.h, 'z', F.w/2 + 1.2], [F.h, 'z', -(F.w/2 + 1.2)]]) {
    for (let t = -len/2 - 1; t <= len/2 + 1; t += 0.45) {
      const p = new THREE.Mesh(picket, (pi % 5 === 2) ? picketMat2 : picketMat);
      p.castShadow = true;
      const h = 1 + Math.sin(pi * 7.31) * 0.045;           // uneven tops
      p.scale.y = h;
      const tilt = Math.sin(pi * 3.77) * 0.02;
      if (ax === 'x') { p.position.set(t, 1.05 * h, fixed); p.rotation.z = tilt; }
      else { p.position.set(fixed, 1.05 * h, t); p.rotation.y = Math.PI/2; p.rotation.z = tilt; }
      fence.add(p); pi++;
    }
    for (const railY of [0.55, 1.45]) {
      const r = new THREE.Mesh(railGeo, railMat);
      r.scale.x = len + 2.4;
      if (ax === 'x') r.position.set(0, railY, fixed + 0.09);
      else { r.position.set(fixed + 0.09, railY, 0); r.rotation.y = Math.PI/2; }
      fence.add(r);
    }
  }
  add(fence);
}

// Gym: cream block walls with a team-colour stripe and a grey baseboard on
// three sides; the camera side stays open so you can see in.
function buildGymWalls(add) {
  const F = CFG.field, H = 4.2;
  const wallMat = toon(0xf2e9d6), stripeMat = toon(0x2f5fb3), baseMat = toon(0x6f6a62);
  const segs = [[0, -(F.h/2 + 0.9), F.w + 3, 'x'], [-(F.w/2 + 0.9), 0, F.h + 2, 'z'], [(F.w/2 + 0.9), 0, F.h + 2, 'z']];
  for (const [x, z, len, ax] of segs) {
    const g = new THREE.Group();
    const wall = new THREE.Mesh(new THREE.BoxGeometry(len, H, 0.6), wallMat);
    wall.position.y = H / 2; wall.castShadow = true; wall.receiveShadow = true;
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(len, 0.5, 0.62), stripeMat);
    stripe.position.y = 1.9;
    const base = new THREE.Mesh(new THREE.BoxGeometry(len, 0.35, 0.66), baseMat);
    base.position.y = 0.18;
    // padded wall mats, every few metres
    for (let t = -len/2 + 3; t < len/2 - 2; t += 6) {
      const pad = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.2), toon(t % 12 === -(len/2 % 12) ? 0x3d7dff : 0xe04848));
      pad.position.set(t, 1.1, 0.4);
      g.add(pad);
    }
    g.add(wall, stripe, base);
    g.position.set(x, 0, z);
    if (ax === 'z') g.rotation.y = Math.PI / 2;
    add(g);
  }
  // ceiling with fluorescent strips — only ever seen from first person
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(F.w + 6, F.h + 6), toon(0x5d6470));
  ceil.rotation.x = Math.PI / 2; ceil.position.y = H - 0.02;
  add(ceil);
  for (let i = -2; i <= 2; i++) for (let j = -1; j <= 1; j++) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(4, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff8e6 }));
    strip.rotation.x = Math.PI / 2;                 // faces down: seen from first person, never from above
    strip.position.set(i * 9, H - 0.04, j * 9); strip.layers.set(1);
    add(strip);
  }
  // banners up high on the back wall
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.6), toon([0xffd94a, 0x3d7dff, 0xe04848, 0x59c8e0][i]));
    b.position.set(-9 + i * 6, 3.3, -(F.h/2 + 0.55));
    add(b);
  }
}

// Stadium: low white fence plus a row of bleachers along each long side.
function buildBleachers(add) {
  const F = CFG.field;
  for (const side of [-1, 1]) {
    const g = new THREE.Group();
    for (let r = 0; r < 4; r++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(F.w - 6, 0.5, 1.1), toon(r % 2 ? 0xa9b0b8 : 0xb8bfc7));
      step.position.set(0, 0.25 + r * 0.55, side * (F.h/2 + 2.6 + r * 1.1));
      step.castShadow = true;
      g.add(step);
    }
    // kids sitting: blocky little spectators in random shirts
    const rnd = scatterRng(side > 0 ? 77 : 78);
    for (let i = 0; i < 14; i++) {
      const r = (rnd() * 4) | 0, x = (rnd() - 0.5) * (F.w - 8);
      const kid = new THREE.Group();
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.3, 4, 8), toon([0xffd94a, 0x3d7dff, 0xe04848, 0x59c8e0, 0xc46bff, 0xff8a3d][i % 6]));
      body.position.y = 0.45;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), toon([0xf3c9a0, 0xc98a5e, 0x8a5a3a][i % 3]));
      head.position.y = 0.95;
      kid.add(body, head);
      kid.position.set(x, 0.5 + r * 0.55, side * (F.h/2 + 2.6 + r * 1.1));
      g.add(kid);
    }
    add(g);
  }
  // a scoreboard on one end
  const board = new THREE.Mesh(new THREE.BoxGeometry(5, 2.6, 0.3), toon(0x2a3a2a));
  board.position.set(F.w/2 + 3.5, 4.2, -8);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3, 8), toon(0x6f6a62));
  pole.position.set(F.w/2 + 3.5, 1.5, -8);
  add(board, pole);
}

// PE field: white yard lines every 4m, hash marks, tinted end zones
function turfLinesTexture() {
  const F = CFG.field;
  const c = document.createElement('canvas');
  c.width = 1440; c.height = 990;
  const x = c.getContext('2d');
  const px = c.width / F.w;
  x.clearRect(0, 0, c.width, c.height);
  // end zones
  x.fillStyle = 'rgba(61,125,255,.22)'; x.fillRect(0, 0, 3.5 * px, c.height);
  x.fillStyle = 'rgba(255,77,77,.22)';  x.fillRect(c.width - 3.5 * px, 0, 3.5 * px, c.height);
  x.strokeStyle = 'rgba(255,255,255,.85)'; x.lineWidth = 6;
  x.strokeRect(3, 3, c.width - 6, c.height - 6);
  for (let i = 1; i < 12; i++) {
    const X = 3.5 * px + i * ((F.w - 7) / 12) * px;
    x.beginPath(); x.moveTo(X, 0); x.lineTo(X, c.height); x.stroke();
    for (const Y of [c.height * 0.35, c.height * 0.65]) {
      x.beginPath(); x.moveTo(X - 14, Y); x.lineTo(X + 14, Y); x.stroke();
    }
  }
  x.beginPath(); x.moveTo(3.5 * px, 0); x.lineTo(3.5 * px, c.height); x.stroke();
  x.beginPath(); x.moveTo(c.width - 3.5 * px, 0); x.lineTo(c.width - 3.5 * px, c.height); x.stroke();
  x.font = '900 70px "Fredoka", "Arial Black", sans-serif'; x.fillStyle = 'rgba(255,255,255,.8)'; x.textAlign = 'center';
  ['10', '20', '30', '40', '50', '40', '30', '20', '10'].forEach((n, i) => {
    const X = 3.5 * px + (i + 1.5) * ((F.w - 7) / 12) * px;
    x.save(); x.translate(X, c.height * 0.18); x.fillText(n, 0, 0); x.restore();
    x.save(); x.translate(X, c.height * 0.86); x.rotate(Math.PI); x.fillText(n, 0, 0); x.restore();
  });
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hardwoodTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  const rnd = scatterRng(99);
  x.fillStyle = '#d9a25f'; x.fillRect(0, 0, 1024, 1024);
  const plankH = 1024 / 12;
  for (let r = 0; r < 12; r++) {
    let px0 = -rnd() * 300;
    while (px0 < 1024) {
      const len = 200 + rnd() * 260;
      const shade = 0.9 + rnd() * 0.2;
      x.fillStyle = `rgb(${Math.round(217 * shade)},${Math.round(162 * shade)},${Math.round(95 * shade)})`;
      x.fillRect(px0, r * plankH, len - 3, plankH - 3);
      px0 += len;
    }
  }
  // grain
  x.strokeStyle = 'rgba(120,70,30,.12)'; x.lineWidth = 1.5;
  for (let i = 0; i < 160; i++) {
    const y = rnd() * 1024; x.beginPath(); x.moveTo(0, y); x.lineTo(1024, y + (rnd() - 0.5) * 6); x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 2.8); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Hot, patched blacktop. Grey needs a lot of tonal noise or it reads as a void
// next to grass, so this is aggregate speckle plus tar seams and a few patches.
function asphaltTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  const rnd = scatterRng(3131);
  x.fillStyle = '#57534d'; x.fillRect(0, 0, 1024, 1024);
  // sun-bleached patches
  for (let i = 0; i < 26; i++) {
    const px = rnd() * 1024, pz = rnd() * 1024, r = 60 + rnd() * 190;
    const g = x.createRadialGradient(px, pz, 0, px, pz, r);
    const lift = 8 + rnd() * 16;
    g.addColorStop(0, `rgba(${87 + lift},${83 + lift},${77 + lift},.5)`);
    g.addColorStop(1, 'rgba(87,83,77,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
  }
  // aggregate
  for (let i = 0; i < 9000; i++) {
    const s = 0.8 + rnd() * 1.9, v = rnd();
    x.fillStyle = v > 0.55 ? `rgba(150,146,138,.30)` : `rgba(32,30,28,.34)`;
    x.fillRect(rnd() * 1024, rnd() * 1024, s, s);
  }
  // tar seams — the black snakes where the crack filler went on
  x.strokeStyle = 'rgba(24,22,20,.55)'; x.lineWidth = 3.5; x.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    let px = rnd() * 1024, pz = rnd() * 1024;
    x.beginPath(); x.moveTo(px, pz);
    for (let s = 0; s < 7; s++) { px += (rnd() - 0.5) * 300; pz += (rnd() - 0.5) * 300; x.lineTo(px, pz); }
    x.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.4); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Trodden snow. Almost-white needs texture or it becomes a silhouette-eating
// void, so this is a cool base with warm sun patches, boot scuffs and sparkle.
function snowTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  const rnd = scatterRng(1717);
  x.fillStyle = '#eef4f9'; x.fillRect(0, 0, 1024, 1024);
  // broad blue shade hollows and warm sunlit rises
  for (let i = 0; i < 30; i++) {
    const px = rnd() * 1024, pz = rnd() * 1024, r = 90 + rnd() * 230;
    const warm = rnd() > 0.5;
    const g = x.createRadialGradient(px, pz, 0, px, pz, r);
    g.addColorStop(0, warm ? 'rgba(255,250,232,.55)' : 'rgba(186,209,232,.5)');
    g.addColorStop(1, 'rgba(238,244,249,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
  }
  // boot scuffs
  x.strokeStyle = 'rgba(170,193,216,.34)'; x.lineWidth = 7; x.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    let px = rnd() * 1024, pz = rnd() * 1024;
    x.beginPath(); x.moveTo(px, pz);
    for (let s = 0; s < 4; s++) { px += (rnd() - 0.5) * 180; pz += (rnd() - 0.5) * 180; x.lineTo(px, pz); }
    x.stroke();
  }
  // sparkle
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = rnd() > 0.4 ? 'rgba(255,255,255,.9)' : 'rgba(206,226,244,.7)';
    x.fillRect(rnd() * 1024, rnd() * 1024, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.2); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A ploughed drift instead of a fence: a lumpy white berm you cannot cross.
// Laid along the rectangle the sim clamps to, same as the kerb.
function buildDrift(add, F) {
  const hw = F.w / 2, hh = F.h / 2;
  const snowMat = new THREE.MeshToonMaterial({ color: 0xdfe9f2 });
  for (const [sx, sz, pw, ph] of surroundFrame(hw, hh)) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), snowMat);
    v.rotation.x = -Math.PI / 2; v.position.set(sx, 0.02, sz);
    add(v);
  }
  const blobGeo = new THREE.SphereGeometry(1.5, 10, 8);
  const blobMat = [toon(0xffffff), toon(0xf3f9ff)];
  let n = 0;
  const run = (x0, z0, dx, dz, len) => {
    const count = Math.max(1, Math.round(len / 2.1));
    const step = len / count;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) * step;
      const wob = 0.75 + ((n * 7) % 5) * 0.16;
      const m = new THREE.Mesh(blobGeo, blobMat[n++ % 2]);
      m.castShadow = m.receiveShadow = true;
      m.position.set(x0 + dx * t, 0.5 * wob, z0 + dz * t);
      m.scale.set(1.5 * wob, 0.72 * wob, 1.0 * wob);
      m.rotation.y = dz ? Math.PI / 2 : 0;
      add(m);
    }
  };
  run(-hw, -hh,  1, 0, F.w);
  run(-hw,  hh,  1, 0, F.w);
  run(-hw, -hh,  0, 1, F.h);
  run( hw, -hh,  0, 1, F.h);
}

// The turning circle and a chalked flag box on each driveway apron.
function streetLinesTexture() {
  const W = 1024, H = 838;                       // 44x36 ratio
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const X = u => (u / 44 + 0.5) * W, Z = v => (v / 36 + 0.5) * H;
  x.clearRect(0, 0, W, H);
  // the bulb: a fat worn ring around the middle of the court
  x.strokeStyle = 'rgba(240,236,220,.30)'; x.lineWidth = 7;
  x.beginPath(); x.ellipse(X(0), Z(0), (13.5 / 44) * W, (13.5 / 36) * H, 0, 0, 7); x.stroke();
  // chalked flag box on each apron
  for (const bx of [-17, 17]) {
    x.strokeStyle = 'rgba(255,252,240,.62)'; x.lineWidth = 6;
    x.setLineDash([16, 10]);
    x.strokeRect(X(bx) - (2.6 / 44) * W, Z(0) - (2.6 / 36) * H, (5.2 / 44) * W, (5.2 / 36) * H);
    x.setLineDash([]);
  }
  // faded hopscotch off to one side, because kids
  x.strokeStyle = 'rgba(255,246,214,.34)'; x.lineWidth = 4;
  for (let i = 0; i < 5; i++) x.strokeRect(X(9.5) - 26, Z(-9 + i * 1.5) - 22, 52, 44);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Four planes tiling everything OUTSIDE a hw x hh pitch, as [cx, cz, w, h].
// Full sizes, so callers never have to remember whether to double them.
function surroundFrame(hw, hh, D = 60) {
  return [
    [0, -(hh + D / 2), (hw + D) * 2, D],
    [0,   hh + D / 2,  (hw + D) * 2, D],
    [-(hw + D / 2), 0, D, hh * 2],
    [  hw + D / 2,  0, D, hh * 2],
  ];
}

// August lawn gone patchy round a pool: bleached and worn where the traffic is,
// with damp darker ground near the middle.
function poolsideTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  const rnd = scatterRng(5150);
  x.fillStyle = '#79ad4a'; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 34; i++) {
    const px = rnd() * 1024, pz = rnd() * 1024, r = 70 + rnd() * 210;
    const g = x.createRadialGradient(px, pz, 0, px, pz, r);
    const dry = rnd() > 0.45;
    g.addColorStop(0, dry ? 'rgba(198,190,120,.42)' : 'rgba(74,120,64,.42)');
    g.addColorStop(1, 'rgba(121,173,74,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
  }
  // worn paths where wet feet go back and forth
  x.strokeStyle = 'rgba(186,172,116,.3)'; x.lineWidth = 26; x.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    let px = rnd() * 1024, pz = rnd() * 1024;
    x.beginPath(); x.moveTo(px, pz);
    for (let s = 0; s < 4; s++) { px += (rnd() - 0.5) * 420; pz += (rnd() - 0.5) * 420; x.lineTo(px, pz); }
    x.stroke();
  }
  for (let i = 0; i < 4200; i++) {
    x.fillStyle = rnd() > 0.5 ? 'rgba(146,196,92,.34)' : 'rgba(72,116,56,.3)';
    x.fillRect(rnd() * 1024, rnd() * 1024, 2.2, 4);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.2); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// White slatted pool fencing — the safety fence every above-ground pool has.
function buildPoolFence(add, F) {
  const hw = F.w / 2, hh = F.h / 2, H = 1.9;
  const lawn = new THREE.MeshToonMaterial({ color: 0x5f9440 });
  for (const [sx, sz, pw, ph] of surroundFrame(hw, hh)) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), lawn);
    v.rotation.x = -Math.PI / 2; v.position.set(sx, 0.02, sz);
    v.receiveShadow = true; add(v);
  }
  const slatGeo = rbox(0.16, H - 0.2, 0.1, 0.03);
  const railGeo = rbox(1.9, 0.13, 0.14, 0.04);
  const white = toon(0xf4f7f2), post = toon(0xe4e9e0);
  const run = (x0, z0, dx, dz, len) => {
    const n = Math.round(len / 0.44);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) * (len / n);
      const s = new THREE.Mesh(slatGeo, white);
      s.castShadow = true;
      s.position.set(x0 + dx * t, (H - 0.2) / 2 + 0.1, z0 + dz * t);
      s.rotation.y = dz ? Math.PI / 2 : 0;
      add(s);
    }
    for (const y of [0.45, H - 0.22]) {
      const m = Math.round(len / 1.9);
      for (let i = 0; i < m; i++) {
        const t = (i + 0.5) * (len / m);
        const r = new THREE.Mesh(railGeo, post);
        r.position.set(x0 + dx * t, y, z0 + dz * t + (dz ? 0 : 0.07));
        r.rotation.y = dz ? Math.PI / 2 : 0;
        r.scale.x = (len / m) / 1.9;
        add(r);
      }
    }
  };
  run(-hw, -hh, 1, 0, F.w); run(-hw, hh, 1, 0, F.w);
  run(-hw, -hh, 0, 1, F.h); run( hw, -hh, 0, 1, F.h);
}

// School-lot blacktop: newer and bluer than the cul-de-sac's road, with the
// faded ghosts of old paint under the current markings.
function blacktopTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  const rnd = scatterRng(8181);
  x.fillStyle = '#4c525c'; x.fillRect(0, 0, 1024, 1024);
  for (let i = 0; i < 22; i++) {
    const px = rnd() * 1024, pz = rnd() * 1024, r = 100 + rnd() * 200;
    const g = x.createRadialGradient(px, pz, 0, px, pz, r);
    g.addColorStop(0, rnd() > 0.5 ? 'rgba(108,114,124,.45)' : 'rgba(60,66,76,.45)');
    g.addColorStop(1, 'rgba(76,82,92,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
  }
  // ghosts of old games, painted over years ago
  for (let i = 0; i < 9; i++) {
    x.strokeStyle = ['rgba(230,200,120,.10)','rgba(200,90,80,.09)','rgba(150,200,230,.09)'][i % 3];
    x.lineWidth = 7 + rnd() * 5;
    const px = rnd() * 900, pz = rnd() * 900, s = 90 + rnd() * 190;
    rnd() > 0.5 ? x.strokeRect(px, pz, s, s)
                : (x.beginPath(), x.arc(px, pz, s / 2, 0, 7), x.stroke());
  }
  for (let i = 0; i < 7000; i++) {
    const v = rnd();
    x.fillStyle = v > 0.5 ? 'rgba(150,158,168,.26)' : 'rgba(30,34,40,.28)';
    x.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 1.6, 1 + rnd() * 1.6);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 2.2); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Chain-link fence: posts, a top rail and a translucent mesh panel. The mesh is
// a texture rather than geometry — woven wire at this camera is two grey pixels
// and a lot of triangles.
let linkTex = null;
function chainlinkTexture() {
  if (linkTex) return linkTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 64, 64);
  x.strokeStyle = 'rgba(214,222,230,.85)'; x.lineWidth = 3; x.lineCap = 'round';
  for (let i = -64; i < 128; i += 16) {
    x.beginPath(); x.moveTo(i, 0); x.lineTo(i + 64, 64); x.stroke();
    x.beginPath(); x.moveTo(i + 64, 0); x.lineTo(i, 64); x.stroke();
  }
  linkTex = new THREE.CanvasTexture(c);
  linkTex.wrapS = linkTex.wrapT = THREE.RepeatWrapping;
  return linkTex;
}
function buildChainlink(add, F) {
  const hw = F.w / 2, hh = F.h / 2, H = 3.2;
  const asphalt = new THREE.MeshToonMaterial({ color: 0x3c424c });
  for (const [sx, sz, pw, ph] of surroundFrame(hw, hh)) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), asphalt);
    v.rotation.x = -Math.PI / 2; v.position.set(sx, 0.02, sz);
    add(v);
  }
  const postGeo = new THREE.CylinderGeometry(0.09, 0.09, H, 8);
  const steel = toon(0xb9c2cb);
  const side = (x0, z0, dx, dz, len) => {
    const mesh = chainlinkTexture().clone();
    mesh.needsUpdate = true;
    mesh.repeat.set(len / 1.6, H / 1.6);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(len, H),
      new THREE.MeshBasicMaterial({ map: mesh, transparent: true, opacity: 0.55,
                                    side: THREE.DoubleSide, depthWrite: false }));
    panel.position.set(x0 + dx * len / 2, H / 2, z0 + dz * len / 2);
    panel.rotation.y = dz ? Math.PI / 2 : 0;
    panel.layers.set(1);                       // wire mesh must not be inked
    add(panel);
    const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, len, 6), steel);
    rail.position.set(x0 + dx * len / 2, H, z0 + dz * len / 2);
    rail.rotation.z = Math.PI / 2;
    if (dz) rail.rotation.y = Math.PI / 2;
    add(rail);
    const n = Math.max(2, Math.round(len / 4.5));
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * len;
      const p = new THREE.Mesh(postGeo, steel);
      p.castShadow = true;
      p.position.set(x0 + dx * t, H / 2, z0 + dz * t);
      add(p);
    }
  };
  side(-hw, -hh, 1, 0, F.w);
  side(-hw,  hh, 1, 0, F.w);
  side(-hw, -hh, 0, 1, F.h);
  side( hw, -hh, 0, 1, F.h);
}

// A raised kerb with grass verge beyond it, instead of a fence.
// It follows the RECTANGLE the sim clamps to (actor.js collide()), not a circle:
// an inscribed ellipse both buried metres of playable road at the short ends and
// let players stand seven metres outside the kerb at the corners.
function buildKerb(add, F) {
  const hw = F.w / 2, hh = F.h / 2;
  // verge: a lawn frame around the blacktop, built as four planes
  const vergeMat = new THREE.MeshToonMaterial({ color: 0x5f9440 });
  // Four planes forming a frame OUTSIDE the pitch. Sizes are full width/height,
  // not half — doubling them here laid the side panels straight across the road.
  for (const [sx, sz, pw, ph] of surroundFrame(hw, hh)) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), vergeMat);
    v.rotation.x = -Math.PI / 2; v.position.set(sx, 0.02, sz);
    v.receiveShadow = true;
    add(v);
  }
  // one geometry and two materials shared across every block, rather than 64
  // ExtrudeGeometry triangulations and 64 materials for the same box
  const LEN = 1.8;                                // rbox grows by 2*bevel
  const kerbGeo = rbox(LEN - 0.1, 0.34, 0.7, 0.05);
  const kerbMat = [toon(0xe6e0d2), toon(0xdcd5c6)];
  let n = 0;
  const run = (x0, z0, dx, dz, len) => {
    const count = Math.max(1, Math.round(len / LEN));
    const step = len / count;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) * step;
      const m = new THREE.Mesh(kerbGeo, kerbMat[n++ % 2]);
      m.castShadow = m.receiveShadow = true;
      m.position.set(x0 + dx * t, 0.17, z0 + dz * t);
      m.rotation.y = dz ? Math.PI / 2 : 0;
      m.scale.x = step / LEN;
      add(m);
    }
  };
  run(-hw, -hh,  1, 0, F.w);
  run(-hw,  hh,  1, 0, F.w);
  run(-hw, -hh,  0, 1, F.h);
  run( hw, -hh,  0, 1, F.h);
}

// Basketball court lines drawn across the whole play area
function courtLinesTexture() {
  const F = CFG.field;
  const c = document.createElement('canvas');
  c.width = 1440; c.height = 990;
  const x = c.getContext('2d');
  const px = c.width / F.w, cx = c.width / 2, cy = c.height / 2;
  x.clearRect(0, 0, c.width, c.height);
  x.strokeStyle = 'rgba(255,255,255,.9)'; x.lineWidth = 7;
  x.strokeRect(1.2 * px, 1.2 * px, c.width - 2.4 * px, c.height - 2.4 * px);
  x.beginPath(); x.moveTo(cx, 1.2 * px); x.lineTo(cx, c.height - 1.2 * px); x.stroke();
  x.beginPath(); x.arc(cx, cy, 3.2 * px, 0, Math.PI * 2); x.stroke();
  x.fillStyle = 'rgba(61,125,255,.25)'; x.fill();
  for (const side of [-1, 1]) {
    const bx = side < 0 ? 1.2 * px : c.width - 1.2 * px;
    const dir = side < 0 ? 1 : -1;
    // key
    x.fillStyle = side < 0 ? 'rgba(61,125,255,.22)' : 'rgba(255,77,77,.22)';
    x.fillRect(Math.min(bx, bx + dir * 7 * px), cy - 3.2 * px, 7 * px, 6.4 * px);
    x.strokeRect(Math.min(bx, bx + dir * 7 * px), cy - 3.2 * px, 7 * px, 6.4 * px);
    x.beginPath(); x.arc(bx + dir * 7 * px, cy, 3.2 * px, -Math.PI / 2 * dir, Math.PI / 2 * dir, side > 0); x.stroke();
    // three-point arc
    x.beginPath(); x.arc(bx + dir * 1.6 * px, cy, 10.5 * px, -Math.PI / 2 * dir, Math.PI / 2 * dir, side > 0); x.stroke();
  }
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// ── ground clutter: tufts, dandelions, stones. All instanced, all
//    deterministic, none of it collides — it's texture you can run through. ──
// The in-ground pool at the centre of The Block: a sunken basin you can swim
// across slowly, or run all the way around.
function makeBigPool() {
  const g = new THREE.Group();
  const R = 5.4;
  const coping = new THREE.Mesh(new THREE.TorusGeometry(R + 0.35, 0.34, 12, 48), toon(0xf0e6d2));
  coping.rotation.x = Math.PI/2; coping.position.y = 0.1;
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.1, R + 0.1, 1.6, 44, 1, true), toon(0xdfe8ee));
  wall.position.y = -0.7; wall.material.side = THREE.DoubleSide;
  const floor2 = new THREE.Mesh(new THREE.CircleGeometry(R + 0.1, 44), toon(0x4fb8e8));
  floor2.rotation.x = -Math.PI/2; floor2.position.y = -1.5;
  const water = new THREE.Mesh(new THREE.CircleGeometry(R, 48),
    new THREE.MeshToonMaterial({ color: 0x39a9e0, transparent: true, opacity: 0.86 }));
  water.rotation.x = -Math.PI/2; water.position.y = -0.12;
  // lane line and a ladder, so it reads as a real in-ground pool
  const lane = new THREE.Mesh(new THREE.BoxGeometry(R * 2, 0.02, 0.18), toon(0x2a7fae));
  lane.position.y = -0.11;
  const ladder = new THREE.Group();
  for (const dx of [-0.22, 0.22]) {
    const rail = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 8, 16, Math.PI), toon(0xd9d9d9));
    rail.position.set(dx, 0.3, 0); rail.rotation.y = Math.PI/2;
    ladder.add(rail);
  }
  ladder.position.set(0, 0, R + 0.1);
  const floaty = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.22, 10, 22), toon(0xff6bb5));
  floaty.rotation.x = Math.PI/2; floaty.position.set(2.1, 0.02, -1.6);
  g.add(coping, wall, floor2, water, lane, ladder, floaty);
  return { obj: g };
}

function scatter(root, colliders) {
  const scene = root;
  const F = CFG.field;
  const rnd = scatterRng(4242);
  const spots = [];
  let guard = 0;
  while (spots.length < 110 && guard++ < 2000) {
    const x = (rnd() - 0.5) * (F.w - 3);
    const z = (rnd() - 0.5) * (F.h - 3);
    if (Math.hypot(x - TEAMS.blue.base.x, z) < 4 || Math.hypot(x - TEAMS.red.base.x, z) < 4) continue;
    let clear = true;
    for (const c of colliders) {
      const r = c.type === 'circle' ? c.r : Math.hypot(c.hw, c.hh);
      if (Math.hypot(x - c.x, z - c.z) < r + 0.6) { clear = false; break; }
    }
    if (clear) spots.push({ x, z, r: rnd() });
  }

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  const place = (mesh, list, scaleFn) => {
    mesh.count = list.length;
    list.forEach((s, i) => {
      Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.r * Math.PI * 2);
      V.set(s.x, 0, s.z);
      const sc = scaleFn(s);
      S.set(sc, sc, sc);
      M.compose(V, Q, S);
      mesh.setMatrixAt(i, M);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.castShadow = true;
    scene.add(mesh);
    made.push(mesh);
    return mesh;
  };
  const made = [];

  const tufts = spots.filter((_, i) => i % 3 !== 0);
  const tuftGeo = new THREE.ConeGeometry(0.09, 0.26, 5);
  tuftGeo.translate(0, 0.13, 0);
  place(new THREE.InstancedMesh(tuftGeo, toon(0x63a844), tufts.length), tufts, s => 0.7 + s.r * 0.7);

  const dands = spots.filter((_, i) => i % 5 === 0);
  const dandGeo = new THREE.SphereGeometry(0.085, 8, 6);
  dandGeo.translate(0, 0.3, 0);
  place(new THREE.InstancedMesh(dandGeo, toon(0xffd94a), dands.length), dands, s => 0.8 + s.r * 0.5);
  const stemGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.3, 4);
  stemGeo.translate(0, 0.15, 0);
  place(new THREE.InstancedMesh(stemGeo, toon(0x4f8f38), dands.length), dands, s => 0.8 + s.r * 0.5);

  const stones = spots.filter((_, i) => i % 9 === 4);
  const stoneGeo = new THREE.DodecahedronGeometry(0.14, 0);
  stoneGeo.translate(0, 0.06, 0);
  place(new THREE.InstancedMesh(stoneGeo, toon(0xb9b2a4), stones.length), stones, s => 0.6 + s.r * 0.9);
  return made.slice(0, 3);        // tufts + dandelion heads + stems bend; stones don't
}

// Exported for the football view: the gridiron borrows the goalpost, chair
// and cooler props rather than growing lookalike copies of them.
export function makeProp(kind, hw = 1, hh = 1) {
  switch (kind) {
    case 'tree': {
      const g = new THREE.Group();
      const trunk = outlined(new THREE.CylinderGeometry(0.42, 0.58, 2.4, 10), 0x8a5a35);
      trunk.position.y = 1.2;
      const root1 = outlined(new THREE.SphereGeometry(0.3, 8, 6), 0x7a4e2e, 0.015);
      root1.position.set(0.45, 0.1, 0.2); root1.scale.set(1.4, 0.5, 1);
      const c1 = outlined(new THREE.IcosahedronGeometry(2.0, 1), 0x4f9e3a); c1.position.set(0, 3.4, 0);
      const c2 = outlined(new THREE.IcosahedronGeometry(1.4, 1), 0x5fb347); c2.position.set(1.2, 2.9, 0.5);
      const c3 = outlined(new THREE.IcosahedronGeometry(1.2, 1), 0x469033); c3.position.set(-1.1, 3.0, -0.6);
      const c4 = outlined(new THREE.IcosahedronGeometry(1.0, 1), 0x58a940); c4.position.set(0.3, 4.4, -0.4);
      const c5 = outlined(new THREE.IcosahedronGeometry(0.9, 1), 0x3f8231); c5.position.set(-0.6, 2.5, 0.9);
      g.add(trunk, root1, c1, c2, c3, c4, c5);
      // sun caps: a lighter clump riding the top of each big one
      for (const [cx, cy, cz, r] of [[0, 4.2, 0, 1.25], [1.2, 3.6, 0.5, 0.8], [-1.1, 3.6, -0.6, 0.7]]) {
        const cap = outlined(new THREE.IcosahedronGeometry(r, 1), 0x7ccb5a, 0.015);
        cap.position.set(cx, cy, cz); cap.scale.y = 0.55;
        g.add(cap);
      }
      // apples
      for (const [ax, ay, az] of [[0.9, 3.9, 0.8], [-1.3, 3.4, 0.2], [0.4, 2.7, 1.3]]) {
        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), toon(0xe04848));
        apple.position.set(ax, ay, az); apple.castShadow = true;
        g.add(apple);
      }
      return { obj: g };
    }
    case 'hedge': {
      // a real bush: overlapping squashed blobs in varied greens, sitting on
      // a darker skirt, with a few berries tucked in
      const g = new THREE.Group();
      const greens = [0x3f8c34, 0x4a9c3e, 0x479a3b, 0x58a940, 0x3a8230];
      const n = Math.max(4, Math.round(hw * 2.2));
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0 : i / (n - 1) - 0.5;
        const blob = outlined(new THREE.IcosahedronGeometry(0.9, 1), greens[i % greens.length], 0.02);
        blob.position.set(t * hw * 1.85, 0.72 + Math.sin(i * 2.7) * 0.1, Math.sin(i * 1.9) * hh * 0.5);
        blob.scale.set(1.15, 0.95 + Math.sin(i * 3.1) * 0.12, 1.05);
        g.add(blob);
        // crown puffs
        if (i % 2 === 0) {
          const puff = outlined(new THREE.IcosahedronGeometry(0.5, 1), greens[(i + 2) % greens.length], 0.016);
          puff.position.set(t * hw * 1.85 + 0.2, 1.35, Math.sin(i * 1.9) * hh * 0.3);
          g.add(puff);
        }
      }
      // shadow skirt hugging the ground
      const skirt = new THREE.Mesh(new THREE.BoxGeometry(hw * 2.1, 0.3, hh * 2.2), toon(0x2e6b26));
      skirt.position.y = 0.15;
      g.add(skirt);
      // berries
      for (let i = 0; i < 5; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), toon(0xe04848));
        b.position.set((i / 4 - 0.5) * hw * 1.6, 0.85 + Math.sin(i * 5) * 0.25, hh * 0.55 + Math.sin(i * 2) * 0.2);
        g.add(b);
      }
      return { obj: g };
    }
    case 'sandbox': {
      const g = new THREE.Group();
      const sand = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.28, 4.0), toon(0xe8d29a));
      sand.position.y = 0.14; sand.receiveShadow = true;
      for (const [dx, dz, sx, sz] of [[0,2.05,4.4,0.34],[0,-2.05,4.4,0.34],[2.05,0,0.34,4.4],[-2.05,0,0.34,4.4]]) {
        const r = outlined(new THREE.BoxGeometry(sx, 0.42, sz), 0xb07a42);
        r.position.set(dx, 0.21, dz); g.add(r);
      }
      // toy bucket + shovel, abandoned mid-castle
      const bucket = outlined(new THREE.CylinderGeometry(0.16, 0.12, 0.24, 10), 0xff8a3d, 0.014);
      bucket.position.set(0.9, 0.4, -0.8); bucket.rotation.z = 0.25;
      const shovelH = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.5, 6), toon(0x59c8e0));
      shovelH.position.set(-0.7, 0.32, 0.9); shovelH.rotation.z = 1.2;
      const shovelS = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.02, 0.18), toon(0x59c8e0));
      shovelS.position.set(-0.98, 0.3, 0.9);
      const castle = outlined(new THREE.CylinderGeometry(0.22, 0.3, 0.34, 10), 0xdfc384, 0.014);
      castle.position.set(0.1, 0.44, 0.3);
      g.add(sand, bucket, shovelH, shovelS, castle);
      return { obj: g };
    }
    case 'pool': {
      if (hw === 'big') return makeBigPool();
      const g = new THREE.Group();
      const wall = outlined(new THREE.CylinderGeometry(2.3, 2.3, 0.72, 26, 1, true), 0x59c8e0);
      wall.position.y = 0.36;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.09, 8, 30), toon(0xfffdf5));
      rim.position.y = 0.72; rim.rotation.x = Math.PI/2;
      const water = new THREE.Mesh(new THREE.CircleGeometry(2.15, 32),
        new THREE.MeshToonMaterial({ color: 0x4fb8e8, transparent: true, opacity: 0.92 }));
      water.rotation.x = -Math.PI/2; water.position.y = 0.6;
      // pool floaty + duck
      const floaty = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.17, 10, 20), toon(0xff6bb5));
      floaty.position.set(0.7, 0.66, -0.5); floaty.rotation.x = Math.PI/2;
      const duck = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), toon(0xffd94a));
      duck.position.set(-0.8, 0.7, 0.6);
      const duckHead = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), toon(0xffd94a));
      duckHead.position.set(-0.8, 0.86, 0.72);
      const beak = new THREE.Mesh(new THREE.ConeGeometry(0.045, 0.1, 6), toon(0xff8a3d));
      beak.position.set(-0.8, 0.86, 0.84); beak.rotation.x = Math.PI/2;
      g.add(wall, rim, water, floaty, duck, duckHead, beak);
      return { obj: g };
    }
    case 'stump': {
      // the old tree stump — center stage for the midfield fight
      const g = new THREE.Group();
      const trunk = outlined(new THREE.CylinderGeometry(0.95, 1.1, 0.72, 14), 0x8a5a35);
      trunk.position.y = 0.36;
      // growth rings on top
      const top = new THREE.Mesh(new THREE.CircleGeometry(0.93, 20), toon(0xc99a64));
      top.rotation.x = -Math.PI/2; top.position.y = 0.735;
      for (const r of [0.7, 0.5, 0.3, 0.14]) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.018, 6, 24), toon(0xa87b4a));
        ring.rotation.x = Math.PI/2; ring.position.y = 0.742;
        g.add(ring);
      }
      // bark ridges
      for (let i = 0; i < 7; i++) {
        const a = i / 7 * Math.PI * 2;
        const ridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.09, 0.5, 4, 6), toon(0x7a4e2e));
        ridge.position.set(Math.cos(a) * 1.02, 0.34, Math.sin(a) * 1.02);
        g.add(ridge);
      }
      // one root flare + a mushroom shelf + a sprout of new growth
      const root = outlined(new THREE.SphereGeometry(0.34, 8, 6), 0x7a4e2e, 0.015);
      root.position.set(0.95, 0.08, 0.55); root.scale.set(1.5, 0.5, 1);
      const mushTop = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8, 0, Math.PI*2, 0, Math.PI/2), toon(0xe07a4a));
      mushTop.position.set(-0.95, 0.5, 0.3); mushTop.rotation.z = 0.5;
      const sprigStem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4, 5), toon(0x4f8f38));
      sprigStem.position.set(0.3, 0.93, -0.25); sprigStem.rotation.z = -0.2;
      const sprigLeaf = outlined(new THREE.IcosahedronGeometry(0.17, 1), 0x5fb347, 0.012);
      sprigLeaf.position.set(0.38, 1.15, -0.25);
      g.add(trunk, top, root, mushTop, sprigStem, sprigLeaf);
      return { obj: g };
    }
    case 'chair': {
      // striped folding lawn chair
      const g = new THREE.Group();
      const seat = outlined(new THREE.BoxGeometry(1.3, 0.16, 1.3), 0xf2f2f2); seat.position.y = 0.5;
      const back = outlined(new THREE.BoxGeometry(1.3, 1.0, 0.16), 0xf2f2f2);
      back.position.set(0, 1.0, -0.55); back.rotation.x = -0.22;
      for (let i = 0; i < 3; i++) {
        const sSeat = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.17, 1.28), toon(i % 2 ? 0x59c8e0 : 0xff8a3d));
        sSeat.position.set(-0.4 + i * 0.4, 0.5, 0);
        const sBack = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.98, 0.17), toon(i % 2 ? 0x59c8e0 : 0xff8a3d));
        sBack.position.set(-0.4 + i * 0.4, 1.0, -0.552);
        sBack.rotation.x = -0.22;
        g.add(sSeat, sBack);
      }
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6);
      for (const [lx, lz] of [[-0.55, 0.55], [0.55, 0.55], [-0.55, -0.5], [0.55, -0.5]]) {
        const leg = new THREE.Mesh(legGeo, toon(0x8a939e));
        leg.position.set(lx, 0.25, lz);
        g.add(leg);
      }
      g.add(seat, back);
      return { obj: g };
    }
    case 'trampoline': {
      const g = new THREE.Group();
      const mat = new THREE.Mesh(new THREE.CircleGeometry(2.7, 40), toon(0x4a5568));
      mat.rotation.x = -Math.PI/2; mat.position.y = 0.62; mat.receiveShadow = true;
      // a lighter centre ring, so it reads as taut fabric and not a hole
      const centre = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 32),
        new THREE.MeshToonMaterial({ color: 0x6b7a92 }));
      centre.rotation.x = -Math.PI/2; centre.position.y = 0.625;
      g.add(centre);
      const pad = new THREE.Mesh(new THREE.TorusGeometry(2.95, 0.34, 12, 40), toon(0x2f5fb3));
      pad.rotation.x = Math.PI/2; pad.position.y = 0.6;
      for (let i = 0; i < 16; i++) {
        const a2 = i / 16 * Math.PI * 2;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.62, 8), toon(0xb9b2a4));
        leg.position.set(Math.cos(a2) * 2.9, 0.31, Math.sin(a2) * 2.9);
        g.add(leg);
        const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.3, 6), toon(0xd9d9d9));
        spring.position.set(Math.cos(a2) * 2.78, 0.62, Math.sin(a2) * 2.78);
        spring.rotation.z = Math.PI/2; spring.lookAt(0, 0.62, 0);
        g.add(spring);
      }
      g.add(mat, pad);
      return { obj: g };
    }
    case 'shed': {
      const g = new THREE.Group();
      const body = outlined(rbox(5.2, 2.8, 4.0, 0.08), 0xb07a42, 0.02);
      body.position.y = 1.4;
      const roof = outlined(rbox(5.8, 0.3, 4.6, 0.06), 0x8a5a35, 0.016);
      roof.position.y = 2.9;
      const roofB = outlined(rbox(5.4, 0.3, 4.2, 0.06), 0x7a4e2e, 0.016);
      roofB.position.y = 3.16;
      const door = new THREE.Mesh(rbox(1.5, 2.1, 0.12, 0.04), toon(0x6f4a28));
      door.position.set(0, 1.05, 2.02);
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), toon(0xffd94a));
      knob.position.set(0.55, 1.1, 2.12);
      g.add(body, roof, roofB, door, knob);
      return { obj: g };
    }
    case 'divider': {
      // the neighbours' fence between yards
      const g = new THREE.Group();
      const n = Math.max(3, Math.round(hh * 4));
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1) - 0.5) * hh * 2;
        const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.0 + Math.sin(i * 3.1) * 0.06, 0.34), toon(i % 5 === 2 ? 0xbd9257 : 0xc9a066));
        p.position.set(0, 1.0, t); p.castShadow = true;
        g.add(p);
      }
      for (const y of [0.55, 1.45]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.16, hh * 2), toon(0xa87f4b));
        rail.position.set(0.09, y, 0);
        g.add(rail);
      }
      return { obj: g };
    }
    case 'cone': {
      const g = new THREE.Group();
      const cone = outlined(new THREE.ConeGeometry(0.32, 0.75, 10), 0xff8a3d, 0.014); cone.position.y = 0.38;
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.25, 0.1, 10), toon(0xfffdf5)); band.position.y = 0.45;
      const foot = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.6), toon(0xe07a30)); foot.position.y = 0.025;
      g.add(cone, band, foot);
      return { obj: g };
    }
    case 'sled': {
      // blocking sled: frame + two big pads
      const g = new THREE.Group();
      const frame = outlined(new THREE.BoxGeometry(2.6, 0.18, 1.0), 0x6f6a62, 0.014); frame.position.y = 0.12;
      for (const dx of [-0.7, 0.7]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), toon(0x6f6a62)); post.position.set(dx, 0.55, 0.2);
        const pad = outlined(new THREE.BoxGeometry(0.9, 1.0, 0.45), 0x2f5fb3, 0.016); pad.position.set(dx, 0.85, 0.35);
        g.add(post, pad);
      }
      g.add(frame);
      return { obj: g };
    }
    case 'dummy': {
      const g = new THREE.Group();
      const body = outlined(new THREE.CapsuleGeometry(0.42, 0.9, 5, 12), 0xe04848, 0.018); body.position.y = 0.95;
      const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.18, 12), toon(0xfffdf5)); stripe.position.y = 1.0;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.14, 12), toon(0x3a3a3a)); base.position.y = 0.07;
      g.add(body, stripe, base);
      return { obj: g };
    }
    case 'cooler': {
      const g = new THREE.Group();
      const table = outlined(new THREE.BoxGeometry(1.8, 0.1, 1.1), 0xb07a42, 0.014); table.position.y = 0.72;
      for (const [dx, dz] of [[-0.8, -0.45], [0.8, -0.45], [-0.8, 0.45], [0.8, 0.45]]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.7, 6), toon(0x6f6a62)); leg.position.set(dx, 0.35, dz); g.add(leg);
      }
      const cooler = outlined(new THREE.CylinderGeometry(0.36, 0.33, 0.7, 12), 0xff8a3d, 0.014); cooler.position.set(-0.35, 1.12, 0);
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 12), toon(0xfffdf5)); lid.position.set(-0.35, 1.5, 0);
      const tap = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 0.16), toon(0xfffdf5)); tap.position.set(-0.35, 0.85, 0.4);
      for (let i = 0; i < 3; i++) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.16, 8), toon(0xfffdf5)); cup.position.set(0.3 + i * 0.22, 0.85, (i % 2) * 0.3 - 0.15); g.add(cup);
      }
      g.add(table, cooler, lid, tap);
      return { obj: g };
    }
    // ── The Cul-de-Sac ────────────────────────────────────────────
    // A car is the first cover in the game you cannot go over. It is built
    // from the collider it was authored with, so the box you bump into and
    // the box you see are the same object by construction: the long axis is
    // whichever extent is bigger.
    case 'car':
    case 'van': {
      const g = new THREE.Group();
      const big = kind === 'van';
      const L = Math.max(hw, hh) * 2, W = Math.min(hw, hh) * 2;
      const alongZ = hh > hw;                      // nosed in rather than kerbed
      const paint = big ? 0xe8e3d6 : [0x4f8fd8, 0xd8604f, 0xf0c04a][((L * 10) | 0) % 3];
      const bodyH = big ? 1.9 : 1.05;
      // rbox offsets its contour outward, so it ends up 2*bevel bigger in x and
      // z than the numbers suggest. Subtract it, or the paint overhangs the wall
      // you actually collide with by ~90mm at each end.
      const body = outlined(rbox(L * 0.98 - 0.28, bodyH, W * 0.94 - 0.28, 0.14), paint, 0.014);
      body.position.y = big ? 1.12 : 0.72;
      g.add(body);
      if (big) {
        // a box van: one slab, a shallow nose, and a dark screen up front
        const nose = outlined(rbox(L * 0.3 - 0.24, 1.15, W * 0.9 - 0.24, 0.12), paint, 0.014);
        nose.position.set(L * 0.36, 0.72, 0);
        // out past the nose face, or it is sealed inside the bodywork
        const glass = new THREE.Mesh(rbox(0.1, 0.62, W * 0.74 - 0.1, 0.05), toon(0x2f3a44));
        glass.position.set(L * 0.36 + (L * 0.3 - 0.24) / 2 + 0.14, 1.02, 0);
        g.add(nose, glass);
      } else {
        // a hatchback: a cabin that sits back off the bonnet
        const cabin = outlined(rbox(L * 0.5 - 0.32, 0.66, W * 0.86 - 0.32, 0.16), paint, 0.014);
        cabin.position.set(-L * 0.06, 1.42, 0);
        const glass = new THREE.Mesh(rbox(L * 0.46 - 0.2, 0.44, W * 0.9 - 0.2, 0.1), toon(0x33414d));
        glass.position.set(-L * 0.06, 1.46, 0);
        g.add(cabin, glass);
      }
      // wheels tucked just inside the silhouette
      const wr = big ? 0.42 : 0.36;
      const wheel = new THREE.CylinderGeometry(wr, wr, 0.24, 12);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const t = new THREE.Mesh(wheel, toon(0x24211d));
        t.rotation.x = Math.PI / 2;
        t.position.set(sx * L * 0.33, wr, sz * (W * 0.94 / 2 - 0.13));
        t.castShadow = true;
        g.add(t);
      }
      if (alongZ) g.rotation.y = Math.PI / 2;
      return { obj: g };
    }
    case 'bin': {
      const g = new THREE.Group();
      const body = outlined(rbox(0.86, 1.14, 0.72, 0.09), 0x3f7f4a, 0.013);
      body.position.y = 0.60; body.rotation.x = -0.08;      // bins lean back on their wheels
      const lid = outlined(rbox(0.9, 0.12, 0.78, 0.05), 0x2f6339, 0.012);
      lid.position.set(0, 1.2, -0.04); lid.rotation.x = -0.08;
      for (const sx of [-1, 1]) {
        const wl = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.1, 10), toon(0x24211d));
        wl.rotation.z = Math.PI / 2; wl.position.set(sx * 0.4, 0.13, -0.26);
        g.add(wl);
      }
      g.add(body, lid);
      return { obj: g };
    }
    case 'hydrant': {
      const g = new THREE.Group();
      const barrel = outlined(new THREE.CylinderGeometry(0.24, 0.28, 0.72, 10), 0xe0452f, 0.012);
      barrel.position.y = 0.36;
      const dome = outlined(new THREE.SphereGeometry(0.24, 12, 8), 0xe0452f, 0.012);
      dome.position.y = 0.74; dome.scale.y = 0.7;
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 8), toon(0xf0e6d2));
      cap.position.y = 0.86;
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.08, 10), toon(0xc23a26));
      collar.position.y = 0.6;
      for (const s of [-1, 1]) {
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.16, 8), toon(0xf0e6d2));
        nozzle.rotation.z = Math.PI / 2; nozzle.position.set(s * 0.28, 0.44, 0);
        g.add(nozzle);
      }
      g.add(barrel, dome, cap, collar);
      return { obj: g };
    }
    case 'ramp': {
      // plywood on cinder blocks — deliberately the crappy thing it is
      const g = new THREE.Group();
      // Solve the deck height so its underside meets the block tops (0.45)
      // at the support, instead of hanging in the air above them.
      const TILT = 0.30, BLK_TOP = 0.45, SUP_X = -0.72;
      const deck = outlined(new THREE.BoxGeometry(2.6, 0.1, 2.2), 0xc9a066, 0.012);
      deck.position.set(0, BLK_TOP + 0.05 / Math.cos(TILT) + Math.abs(SUP_X) * Math.sin(TILT), 0);
      deck.rotation.z = -TILT;
      const lip = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.06, 2.2), toon(0xb08b52));
      lip.position.set(1.24, 0.03, 0);              // resting on the ground
      for (const sz of [-0.72, 0.72]) {
        const blk = outlined(rbox(0.5, 0.42, 0.42, 0.03), 0x9d9a92, 0.01);
        blk.position.set(-0.72, 0.21, sz);
        g.add(blk);
      }
      g.add(deck, lip);
      return { obj: g };
    }
    case 'drain': {
      // the storm drain at the low point of the bulb; self-symmetric on purpose
      const g = new THREE.Group();
      const collar = outlined(new THREE.CylinderGeometry(0.9, 0.98, 0.34, 16), 0xa8a49b, 0.012);
      collar.position.y = 0.17;
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.74, 0.74, 0.06, 16), toon(0x4a4740));
      dish.position.y = 0.35;
      for (let i = -2; i <= 2; i++) {
        const slot = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.12), toon(0x1e1c19));
        slot.position.set(0, 0.38, i * 0.26);
        g.add(slot);
      }
      g.add(collar, dish);
      return { obj: g };
    }
    // ── Playground climbers ───────────────────────────────────────
    case 'dome': {
      // The landmark at midfield, so it has to survive being read at 40px: six
      // rainbow half-hoops crossing at a hub with three latitude rings threaded
      // through them. Nothing is skinned, deliberately — from above you get
      // concentric rings over radial spokes and you can see the kid on the far
      // side straight through the bars. A solid hemisphere here is just a rock.
      const g = new THREE.Group();
      // A circle collider's radius never reaches makeProp — world.js forwards
      // col.hw, which a circle hasn't got — so the landmark size lives here. Put
      // hw on the layout entry if the collider ever moves off 2.5. ('big' fails
      // the > 1 test as a string, so a big-flagged entry lands on 2.5 too.)
      const R  = hw > 1 ? hw : 2.5;
      const FT = 0.19;                                          // foot plate: the widest part of the prop
      const BR = R - FT;                                        // ...so the bars hang off a slightly smaller sphere
      const BOW = [0xe04848, 0xff8a3d, 0xffd94a, 0x5fb347, 0x59c8e0, 0x2f5fb3];

      // wood-chip fall zone, so the dome sits IN the playground and not on it
      const chips = new THREE.Mesh(new THREE.CircleGeometry(R + 1.05, 44),
        new THREE.MeshBasicMaterial({ color: 0xe8d29a, transparent: true, opacity: 0.72, depthWrite: false }));
      chips.rotation.x = -Math.PI / 2; chips.position.y = 0.015; chips.layers.set(1);
      const kerb = new THREE.Mesh(new THREE.RingGeometry(R + 0.94, R + 1.12, 44),
        new THREE.MeshBasicMaterial({ color: 0xb07a42, transparent: true, opacity: 0.7, depthWrite: false }));
      kerb.rotation.x = -Math.PI / 2; kerb.position.y = 0.023; kerb.layers.set(1);
      g.add(chips, kerb);

      // Meridians. A half torus already stands on the ground with its apex at R,
      // so ONE hoop is a whole diameter of the dome and six of them give twelve
      // evenly spaced spokes when you are looking straight down the middle.
      for (let i = 0; i < BOW.length; i++) {
        const a = (i / BOW.length) * Math.PI;
        const rib = outlined(new THREE.TorusGeometry(BR, 0.085, 8, 30, Math.PI), BOW[i], 0.014);
        rib.rotation.y = a;
        g.add(rib);
        for (const s of [1, -1]) {                              // a bolted foot at each end
          const foot = outlined(new THREE.CylinderGeometry(FT * 0.74, FT, 0.32, 8), 0x8a939e, 0.012);
          foot.position.set(Math.cos(a) * BR * s, 0.16, -Math.sin(a) * BR * s);
          g.add(foot);
        }
      }

      // Latitude rings, threaded through the ribs at cos/sin of the same angle so
      // they land exactly on the sphere. Fatter bar than the ribs, because from
      // overhead the concentric read is the one that has to win.
      for (const [phi, col] of [[0.40, 0xff6bb5], [0.80, 0xffd94a], [1.15, 0x59c8e0]]) {
        const ring = outlined(new THREE.TorusGeometry(Math.cos(phi) * BR, 0.1, 8, 34), col, 0.016);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = Math.sin(phi) * BR;
        g.add(ring);
      }

      // The hub caps the point where all six hoops pile up — without it the apex
      // is a knot of z-fighting tubes. From directly overhead it is also the dot
      // at the exact centre of the map, which is the whole job of this prop.
      const hub = outlined(new THREE.SphereGeometry(0.32, 14, 10), 0xfffdf5, 0.016);
      hub.position.y = BR;
      g.add(hub);
      return { obj: g };
    }
    case 'junglegym': {
      // Boxy steel cage sized straight off the collider. The top grid is the
      // entire silhouette from up there, so the monkey bars get the bright
      // dipped colours and the sides stay galvanised grey.
      const g = new THREE.Group();
      const W = hw * 2, D = hh * 2;
      const H = Math.min(2.6, 1.5 + Math.min(hw, hh) * 0.55);   // just over a kid's head
      const RUNG = [0xe04848, 0xffd94a];                        // two colours; five read as a swatch card
      // post feet land flush with the box: the shoe's 0.18 radius exactly eats
      // the 0.18 inset. Clamped so a daft little collider cannot invert the cage.
      const ix = Math.max(0.35, hw - 0.18), iz = Math.max(0.35, hh - 0.18);

      const bar = (len, x, y, z, axis, col, r = 0.075) => {
        const m = outlined(new THREE.CylinderGeometry(r, r, len, 8), col, 0.012);
        m.position.set(x, y, z);
        if (axis === 'x') m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2;
        g.add(m);
      };

      // uprights: four corners, plus a mid post on any side long enough to sag
      const posts = [[-ix, -iz], [ix, -iz], [-ix, iz], [ix, iz]];
      if (D > 3.6) posts.push([-ix, 0], [ix, 0]);
      if (W > 3.6) posts.push([0, -iz], [0, iz]);
      for (const [px, pz] of posts) {
        const post = outlined(new THREE.CylinderGeometry(0.11, 0.11, H, 8), 0x8a939e, 0.014);
        post.position.set(px, H / 2, pz);
        const shoe = outlined(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 8), 0x4a4740, 0.012);
        shoe.position.set(px, 0.11, pz);
        g.add(post, shoe);
      }

      // perimeter rails: two climbing heights in dipped blue, then the grey top
      // frame the monkey bars land on. Rails run post centre to post centre.
      for (const [y, col] of [[H * 0.33, 0x2f5fb3], [H * 0.66, 0x2f5fb3], [H, 0x8a939e]]) {
        bar(ix * 2,  0,   y,  iz, 'x', col);
        bar(ix * 2,  0,   y, -iz, 'x', col);
        bar(iz * 2,  ix,  y,  0,  'z', col);
        bar(iz * 2, -ix,  y,  0,  'z', col);
      }

      // monkey bars, always crossing the short way and spaced a hand-span apart
      const alongZ = D >= W;                                    // spaced down the long axis
      const span = (alongZ ? ix : iz) * 2;
      const run  = Math.max(0.6, (alongZ ? iz : ix) * 2 - 0.9);
      const n = Math.max(2, Math.round(run / 0.6));
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1) - 0.5) * run;
        bar(span, alongZ ? 0 : t, H, alongZ ? t : 0, alongZ ? 'x' : 'z', RUNG[i % RUNG.length], 0.065);
      }

      // The back face doubles as the way up: extra rungs interleaving with the
      // perimeter rails to a steady 0.17H pitch. They sit IN the plane of that
      // face — set even slightly inboard they stop reading as a ladder and start
      // reading as loose bars floating around inside the cage.
      for (const y of [H * 0.17, H * 0.5, H * 0.83]) bar(ix * 2, 0, y, -iz, 'x', 0xffd94a, 0.06);
      return { obj: g };
    }
    case 'slide': {
      // Ladder at the back, chute running out over the front. Everything is
      // derived off the collider so no plastic overhangs a box you cannot walk
      // through — the run-out mat is the only thing allowed past it.
      const g = new THREE.Group();
      const W = hw * 2, D = hh * 2;
      const deckD = Math.min(0.95, D * 0.28);              // how much of the box the platform eats
      const z0 = -hh + deckD;                              // head of the chute
      const z1 =  hh - 0.6;                                // where it stops falling
      const yEnd = 0.24;                                   // == the run-out slab's own thickness
      // Deck height is SOLVED off the run, not hardcoded at hip height: on a
      // short collider a fixed 1.4 deck put the chute at 60 degrees and the
      // slide read as a ladder with a fin. 0.62 rise-over-run caps it near 32.
      const DECK = Math.min(1.4, yEnd + (z1 - z0) * 0.62);
      const run = z1 - z0, rise = DECK - yEnd;
      const tilt = Math.atan2(rise, run), len = Math.hypot(rise, run);
      const lx = hw - 0.16;
      const STR = DECK + 0.7;                              // ladder stringer, up past the deck

      // run-out mat, so the exit end reads as the exit end from overhead
      const mat = new THREE.Mesh(new THREE.CircleGeometry(1, 28),
        new THREE.MeshBasicMaterial({ color: 0xe8d29a, transparent: true, opacity: 0.68, depthWrite: false }));
      mat.rotation.x = -Math.PI / 2; mat.scale.set(hw + 0.35, 1.05, 1);
      mat.position.set(0, 0.016, z1 + 0.5); mat.layers.set(1);
      g.add(mat);

      // platform, and the legs under it. The back pair carry on up past the deck
      // to become the ladder stringers.
      const deck = outlined(rbox(W - 0.22, 0.16, deckD, 0.05), 0xe04848, 0.016);
      deck.position.set(0, DECK - 0.13, -hh + deckD / 2);   // rbox is 0.26 tall — top face on DECK
      g.add(deck);
      for (const px of [-lx, lx]) {
        for (const [pz, ph] of [[-hh + 0.16, STR], [z0 - 0.16, DECK]]) {
          const leg = outlined(new THREE.CylinderGeometry(0.085, 0.085, ph, 8), 0x2f5fb3, 0.014);
          leg.position.set(px, ph / 2, pz);
          g.add(leg);
        }
      }

      // Ladder rungs between the stringers. The top one stops 0.36 below the
      // deck: pitched evenly to DECK it landed INSIDE the 0.26-thick slab and
      // simply disappeared. Grab bar over the top of the stringers.
      const RTOP = DECK - 0.36;
      for (let i = 0; i < 3; i++) {
        const m = outlined(new THREE.CylinderGeometry(0.06, 0.06, lx * 2, 8), 0xffd94a, 0.012);
        m.position.set(0, 0.38 + (RTOP - 0.38) * (i / 2), -hh + 0.16);
        m.rotation.z = Math.PI / 2;
        g.add(m);
      }
      const grab = outlined(new THREE.CylinderGeometry(0.075, 0.075, lx * 2, 8), 0xff8a3d, 0.012);
      grab.position.set(0, STR - 0.08, -hh + 0.16); grab.rotation.z = Math.PI / 2;
      g.add(grab);

      // The chute is built flat in its own group and tipped once, so the bed and
      // both kerbs stay glued together instead of each carrying its own angle.
      const chute = new THREE.Group();
      chute.position.set(0, (DECK + yEnd) / 2, (z0 + z1) / 2);
      chute.rotation.x = tilt;                             // +z end swings down
      const bed = outlined(rbox(W * 0.8, 0.12, len, 0.05), 0x59c8e0, 0.016);
      bed.position.y = -0.11;                              // rbox is 0.22 thick — top face on local 0
      chute.add(bed);
      for (const s of [-1, 1]) {
        const kerb = outlined(rbox(0.12, 0.3, len, 0.045), 0xffd94a, 0.014);
        kerb.position.set(s * (W * 0.4 + 0.05), 0.06, 0);  // centred on the bed's own edge
        chute.add(kerb);
      }
      g.add(chute);

      // flat run-out: a slide you can stand up off, and it plants the bottom of
      // the chute on the ground instead of leaving it hovering
      const lip = outlined(rbox(W * 0.8, 0.12, 0.6, 0.05), 0x59c8e0, 0.016);
      lip.position.set(0, yEnd - 0.11, z1 + 0.3);
      g.add(lip);
      for (const s of [-1, 1]) {
        const k = outlined(rbox(0.12, 0.3, 0.6, 0.045), 0xffd94a, 0.014);
        // rbox is 0.39 tall here: sit it ON the ground. Matching the chute
        // kerb's proud height instead left it floating 0.13 in the air.
        k.position.set(s * (W * 0.4 + 0.05), 0.195, z1 + 0.3);
        g.add(k);
      }

      // Grab arch over the head of the chute: the bright band that says "sit
      // here", and it keeps the deck from reading as a hole in the platform.
      // Squashed rather than narrowed, so its feet stay out on the deck edge
      // while the crown stays under the ladder's own grab bar (DECK + 0.7).
      const arch = outlined(new THREE.TorusGeometry(lx, 0.08, 8, 22, Math.PI), 0xff8a3d, 0.014);
      arch.position.set(0, DECK, z0);
      arch.scale.y = Math.min(1, 0.6 / lx);
      g.add(arch);
      return { obj: g };
    }

    // ── Playground ────────────────────────────────────────────────
    case 'swings': {
      // A-frame set. The top bar runs along z because that is the long axis of
      // the box it was authored with (0.45 x 3.4), and the legs only splay as
      // far in x as that box allows. A realistic stance would draw pipe well
      // outside the wall you actually bump into — the same trap the car case
      // documents, and it is the collider that wins.
      const g = new THREE.Group();
      const H = 2.5;                                 // top bar height
      const L = hh * 2;                              // frame length on z
      const SPX = hw * 0.66;                         // foot offset in x; pads included this keeps
                                                     // every part of the frame inside hw at any height
      const zf = hh - 0.35;                          // where the two A-frames stand
      const PIPE = 0x2f5fb3;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, L * 0.96, 8), toon(PIPE));
      bar.position.y = H; bar.rotation.x = Math.PI / 2;
      bar.castShadow = true; bar.receiveShadow = true;
      g.add(bar);
      const legLen = Math.hypot(SPX, H), tilt = Math.asin(SPX / legLen);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, legLen, 8), toon(PIPE));
        leg.position.set(sx * SPX / 2, H / 2, sz * zf);
        leg.rotation.z = sx * tilt;                  // foot outboard, head at the bar
        leg.castShadow = true; leg.receiveShadow = true;
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.14, 8), toon(0x3a3a3a));
        foot.position.set(sx * SPX, 0.07, sz * zf);
        foot.castShadow = true; foot.receiveShadow = true;
        g.add(leg, foot);
      }
      // Two swings hung off the bar, one dead still and one caught mid-arc.
      // From above the frame is a single line — the offset seat is the only
      // thing that says swing set and not fence rail. The angle is SOLVED, not
      // picked: at the authored 0.45 half-width anything past 0.16 rad swings
      // the seat out through the wall players bump into.
      const drop = H - 0.45;                          // seats sit at 0.45
      const CAP = Math.asin(Math.min(0.9, Math.max(0.02, hw - 0.12) / drop));
      for (const [sz, ang, col] of [[hh * 0.5, CAP * 0.9, 0xffd94a], [-hh * 0.5, -CAP * 0.35, 0xe04848]]) {
        const s = new THREE.Group();
        s.position.set(0, H, sz); s.rotation.z = ang;   // pivots at the bar, as it should
        for (const cz of [-0.26, 0.26]) {
          // 0.11 across, not the 0.076 a real chain would be: under ~0.1 units
          // is under two pixels at this camera and the seat hangs off nothing.
          const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, drop, 6), toon(0x8a939e));
          ch.position.set(0, -drop / 2, cz);
          ch.castShadow = true;
          s.add(ch);
        }
        // rbox grows by 2r on w and h, so this lands at 0.24 x 0.11 x 0.62 —
        // a slab you can see, not the plank a real seat is
        const seat = outlined(rbox(0.18, 0.05, 0.62, 0.03), col, 0.012);
        seat.position.y = -drop;
        s.add(seat);
        g.add(s);
      }
      // The bald patches kicked out under each seat. Flat paint, and at this
      // camera the only cue that the seats hang above the grass at all.
      for (const sz of [hh * 0.5, -hh * 0.5]) {
        const dirt = new THREE.Mesh(new THREE.CircleGeometry(0.46, 16),
          new THREE.MeshBasicMaterial({ color: 0x9c7b4e, transparent: true, opacity: 0.42, depthWrite: false }));
        dirt.rotation.x = -Math.PI / 2; dirt.position.set(0, 0.016, sz);
        dirt.scale.set(1.6, 0.8, 1);                 // local y is world z after the flip
        dirt.layers.set(1);
        g.add(dirt);
      }
      return { obj: g };
    }
    case 'tunnel': {
      // A bore you crawl through. The arch radius IS the collider half-depth,
      // so the whole thing stands 0.55 tall and reads hurdleable — the height
      // is not a number picked to look right, it is the hitbox.
      const g = new THREE.Group();
      const R = hh, L = hw * 2;
      // Everything is built off a shell 0.09 UNDER the collider, because the
      // mouth rims are the widest part: rim centre SR+0.02 plus a 0.07 tube
      // lands the outermost pipe exactly on R. Built at R the rims stood 90mm
      // proud of the box, the same overhang the car case calls out.
      const SR = R - 0.09;
      // Half-shell, open at both ends: thetaLength PI drops the underside, and
      // rotating the geometry onto x lands the arc with both feet on the grass.
      // An open shell needs DoubleSide or the bore is missing when you look in.
      const shell = (r, len, seg) => {
        const geo = new THREE.CylinderGeometry(r, r, len, seg, 1, true, 0, Math.PI);
        geo.rotateZ(Math.PI / 2);
        return geo;
      };
      // toonMap() would be the natural call for the side flag, but world.js's
      // import line pulls in toon/outlined/rbox/scatterRng only — reaching for
      // toonMap here is a ReferenceError at prop-build time. Same ramp either
      // way: toon() IS toonMap() with the gradient already attached.
      const skin = toon(0xff8a3d); skin.side = THREE.DoubleSide;
      const ribMat = toon(0x59c8e0); ribMat.side = THREE.DoubleSide;
      const body = new THREE.Mesh(shell(SR, L - 0.14, 20), skin);
      body.castShadow = true; body.receiveShadow = true;
      g.add(body);
      // Fat cyan bands rather than moulded ribs: at this camera a raised ridge
      // is two pixels and vanishes, where a colour band IS the silhouette.
      const ribGeo = shell(SR + 0.05, 0.22, 20);
      for (let i = 0; i < 4; i++) {
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.x = -L / 2 + (i + 0.5) * (L / 4);
        rib.castShadow = true; rib.receiveShadow = true;
        g.add(rib);
      }
      for (const sx of [-1, 1]) {
        const rim = new THREE.Mesh(new THREE.TorusGeometry(SR + 0.02, 0.07, 6, 18, Math.PI), toon(0xffd94a));
        rim.rotation.y = Math.PI / 2; rim.position.x = sx * (hw - 0.07);
        rim.castShadow = true; rim.receiveShadow = true;
        g.add(rim);
      }
      // The shaded floor of the bore, painted on the ground: from up here that
      // dark strip under the arch is what makes it a hole and not a mound.
      const bore = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.2, SR * 1.7),
        new THREE.MeshBasicMaterial({ color: 0x6b3a18, transparent: true, opacity: 0.5, depthWrite: false }));
      bore.rotation.x = -Math.PI / 2; bore.position.y = 0.017; bore.layers.set(1);
      g.add(bore);
      for (const sx of [-1, 1]) {
        const scuff = new THREE.Mesh(new THREE.CircleGeometry(R * 0.8, 14),
          new THREE.MeshBasicMaterial({ color: 0x9c7b4e, transparent: true, opacity: 0.38, depthWrite: false }));
        scuff.rotation.x = -Math.PI / 2;
        // 0.015, not 0.013: the mulchpad bed owns 0.013 and two decals sharing
        // a plane z-fight wherever the tunnel stands on the soft-fall.
        scuff.position.set(sx * (L / 2 + R * 0.4), 0.015, 0);
        scuff.scale.set(1, 1.3, 1); scuff.layers.set(1);
        g.add(scuff);
      }
      return { obj: g };
    }
    case 'tetherball': {
      // Circle collider (r 0.34), so hw/hh arrive as the default 1 and there is
      // nothing worth deriving from them — the base is built to the radius the
      // layout declares instead.
      const g = new THREE.Group();
      const H = 2.6, R = 0.34;
      const base = outlined(new THREE.CylinderGeometry(R - 0.06, R, 0.2, 14), 0x3a3a3a, 0.014);
      base.position.y = 0.1;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.11, H, 8), toon(0x8a939e));
      pole.position.y = H / 2; pole.castShadow = true; pole.receiveShadow = true;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.85, 10), toon(0x2f5fb3));
      pad.position.y = 0.62; pad.castShadow = true; pad.receiveShadow = true;
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), toon(0x2f5fb3));
      cap.position.y = H; cap.castShadow = true;
      // Caught at the top of its arc. A plumb rope reads as a second, thinner
      // pole and the prop goes dead; kicking the ball out on a diagonal is the
      // whole silhouette from above. The angle is PAST horizontal on purpose:
      // the ball hangs 1.1 out from a pole with a 0.34 collider, so nothing
      // stops a player walking through it — at 0.95 rad it sat at 1.5-2.1 high,
      // which is exactly chest-to-head on a 2.2 kid, and bodies passed through
      // the ball. Above 2.4 it clears everyone. The rope axis is the
      // anchor-to-ball line, so it meets both ends without a gap.
      const A = 1.78, ROPE = 0.85, TOP = H - 0.1;
      const dx = Math.sin(A), dy = -Math.cos(A);
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, ROPE, 6), toon(0xfffdf5));
      rope.position.set(dx * ROPE / 2, TOP + dy * ROPE / 2, 0);
      rope.rotation.z = A; rope.castShadow = true;
      const ball = outlined(new THREE.SphereGeometry(0.3, 14, 10), 0xffd94a, 0.014);
      ball.position.set(dx * (ROPE + 0.28), TOP + dy * (ROPE + 0.28), 0);
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.055, 6, 20), toon(0xe07a30));
      band.position.copy(ball.position); band.rotation.x = 1.1; band.castShadow = true;
      // the trodden ring the game wears into the grass
      const worn = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.35, 26),
        new THREE.MeshBasicMaterial({ color: 0xa8894f, transparent: true, opacity: 0.3, depthWrite: false }));
      worn.rotation.x = -Math.PI / 2; worn.position.y = 0.018; worn.layers.set(1);
      g.add(base, pole, pad, cap, rope, ball, band, worn);
      return { obj: g };
    }
    case 'spinner': {
      // No collider — players run straight over it, so every part of this stays
      // low and the paint does the talking. hw/hh come through as the defaults,
      // so there is nothing to derive from.
      const g = new THREE.Group();
      const R = 1.6, DECK = 0.18;                    // deck top, about ankle on a kid
      const cols = [0xe04848, 0xffd94a, 0x2f5fb3];
      for (let i = 0; i < 6; i++) {
        // Pie wedges as real geometry, not a decal: the disc has to take the
        // toon ramp like everything else or it floats free of the ground. Six
        // over three colours never repeats across a seam, including 5 -> 0.
        const seg = outlined(new THREE.CylinderGeometry(R, R, 0.16, 8, 1, false, i * Math.PI / 3, Math.PI / 3), cols[i % 3], 0.012);
        seg.position.y = 0.1;
        g.add(seg);
      }
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.09, 8, 40), toon(0xfffdf5));
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.13;
      rim.castShadow = true; rim.receiveShadow = true;
      const hub = outlined(new THREE.CylinderGeometry(0.3, 0.36, 0.26, 12), 0x8a939e, 0.012);
      hub.position.y = 0.19;
      // Grab bars, squashed to half height. Full half-arches stood up around
      // shin height and from straight above the ring of them started reading as
      // a low wall to run around; flattened, they read as handles on a deck.
      // 0.14 across, because 0.11 squashed to 0.055 in y was one pixel of bar.
      for (let i = 0; i < 4; i++) {
        const a = i * Math.PI / 2 + Math.PI / 4;
        const hbar = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.07, 6, 16, Math.PI), toon(0xfffdf5));
        hbar.position.set(Math.cos(a) * 0.92, DECK, Math.sin(a) * 0.92);
        hbar.rotation.y = -a;                        // arch spans hub to rim, feet on the deck
        hbar.scale.y = 0.5;
        hbar.castShadow = true;
        g.add(hbar);
      }
      // the worn ring where feet drag it round
      const worn = new THREE.Mesh(new THREE.RingGeometry(R + 0.04, R + 0.5, 30),
        new THREE.MeshBasicMaterial({ color: 0xa8894f, transparent: true, opacity: 0.32, depthWrite: false }));
      worn.rotation.x = -Math.PI / 2; worn.position.y = 0.02; worn.layers.set(1);
      g.add(rim, hub, worn);
      return { obj: g };
    }

    // ── Blacktop fixtures ─────────────────────────────────────────
    // The handball wall is the only cover out here you cannot see over, so it
    // is built straight off its collider — thin on x, long on z — and the
    // silhouette from above is deliberately one fat grey bar.
    case 'wallball': {
      const g = new THREE.Group();
      const T = hw * 2, L = hh * 2, H = 2.6, r = 0.06;
      // rbox pushes its contour OUTWARD: the mesh lands (w+2r) wide and
      // (h+2r) tall, depth exact. So the slab is authored 40mm UNDER the
      // collider and the cap and kick band, which are exactly ON it, stand
      // proud of the slab by 20mm a side. Everything you can see is inside the
      // wall you bump into, and no two faces are coplanar — a flush kick band
      // z-fought its way up the whole face at this camera angle.
      const slab = outlined(rbox(T - 0.04 - r * 2, H - r * 2, L - 0.04, r), 0xc2bcae, 0.02);
      slab.position.y = H / 2;
      // Coping cap. At the camera's tilt this is most of what is seen of the
      // wall, so the tone break lives up here rather than on the face. It is
      // flush, not oversailing: an overhanging cap IS the top-down silhouette,
      // and on a wall this thin a 80mm oversail read as a wall 20% too wide.
      const cap = outlined(rbox(T - 0.06, 0.12, L, 0.03), 0x9d9a92, 0.014);
      cap.position.y = H + 0.09;
      // Grubby kick band. A plinth standing proud of hw would let a player
      // press into cover and stand inside their own wall.
      const foot = outlined(rbox(T - 0.06, 0.28, L, 0.03), 0xa39d90, 0.012);
      foot.position.y = 0.17;
      // The painted line, as a band that girdles the whole slab. Two reasons it
      // is not a stripe on one face: the halves mirror, so either side of this
      // wall is the live side — and the camera looks down the wall's LENGTH,
      // which means the end is the face most often square-on to it. A line that
      // stopped short of the ends showed up in play as two red specks.
      const line = new THREE.Mesh(new THREE.BoxGeometry(T - 0.01, 0.30, L - 0.01), toon(0xe04848));
      line.position.y = 1.42; line.castShadow = true; line.receiveShadow = true;
      g.add(slab, cap, foot, line);
      return { obj: g };   // the court paint is its own prop, the way courtkey is
    }
    case 'bikerack': {
      // A ladder of powder-coated loops on two galvanised rails. The rails are
      // what tie the loops into one object from above; without them it reads
      // as five lost pipes.
      //
      // No bikes in it, and that is a finding rather than an omission. A bike
      // is only legible in side view and this camera never gets one: parked
      // nose-in, the dark seat and rear wheel stack into a head and the
      // handlebar throws an arm out, so each bike read as a small figure
      // standing in the rack. Two passes at it (black bar, then painted bar)
      // both landed there. The powder coat carries the colour instead.
      const g = new THREE.Group();
      const coat = toon(0x2f5fb3), steel = toon(0x8a939e);
      const R = Math.min(hh * 0.84, 0.4);           // loop half-depth, kept inside the box
      const legH = 0.42, tube = 0.065;
      const n = Math.max(2, Math.round(hw * 3.2));
      const span = Math.max(0.4, hw * 2 - 0.34);
      const legGeo = new THREE.CylinderGeometry(tube, tube, legH, 8);
      // Half a torus is the hoop: arc PI runs +x to -x over the top, so a
      // quarter turn on y stands it up across z with a foot at each ±R.
      const capGeo = new THREE.TorusGeometry(R, tube, 6, 14, Math.PI);
      for (let i = 0; i < n; i++) {
        const t = (i / (n - 1) - 0.5) * span;
        // legs and arch share the coat: they are one bent tube, and a colour
        // break at the springing line reads as a join that is not there
        for (const sz of [-R, R]) {
          const leg = new THREE.Mesh(legGeo, coat);
          leg.position.set(t, legH / 2, sz);
          leg.castShadow = true; leg.receiveShadow = true;
          g.add(leg);
        }
        const cap = new THREE.Mesh(capGeo, coat);
        cap.position.set(t, legH, 0); cap.rotation.y = Math.PI / 2;
        cap.castShadow = true; cap.receiveShadow = true;
        g.add(cap);
      }
      for (const sz of [-R, R]) {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(hw * 2, 0.09, 0.09), steel);
        rail.position.set(0, 0.055, sz);
        rail.castShadow = true; rail.receiveShadow = true;
        g.add(rail);
      }
      return { obj: g };
    }

    // ── Ground decals ─────────────────────────────────────────────
    // Both of these are ONE canvas on ONE plane, for the same reason the court
    // markings are: a surface has to carry its own edge and its own grain, and
    // a pile of PlaneGeometry chips only ever reads as a UI overlay. Neither
    // has a collider, so both arrive with the defaults and size themselves.
    case 'mulchpad': {
      // Soft-fall under the play equipment. No border, no kerb, no object of
      // any kind — the whole job is that the GROUND CHANGES here, so the edge
      // crumbles into the tarmac rather than being drawn onto it.
      const g = new THREE.Group();
      const RX = 4.6, RZ = 3.3, PX = 72;
      const wob = a => 1 + 0.10 * Math.sin(a * 3 + 0.7) + 0.07 * Math.sin(a * 5 - 1.3) + 0.05 * Math.cos(a * 2 + 2.1);
      const K = 1.05 * 1.22;                        // outermost the wobble can reach
      const SPANX = RX * 2 * K + 0.4, SPANZ = RZ * 2 * K + 0.4;
      const c = document.createElement('canvas');
      c.width = Math.round(SPANX * PX); c.height = Math.round(SPANZ * PX);
      const x = c.getContext('2d');
      const rnd = scatterRng(7474);
      const X = u => (u + SPANX / 2) * PX;
      const Z = v => (v + SPANZ / 2) * PX;          // canvas y runs to +z
      // integer harmonics only, so the last point lands back on the first
      const edge = k => {
        x.beginPath();
        for (let i = 0; i <= 96; i++) {
          const a = i / 96 * Math.PI * 2, w = wob(a) * k;
          const px = X(Math.cos(a) * RX * w), pz = Z(Math.sin(a) * RZ * w);
          i ? x.lineTo(px, pz) : x.moveTo(px, pz);
        }
        x.closePath();
      };
      edge(1.05); x.fillStyle = 'rgba(126,90,54,.6)'; x.fill();    // damp spill
      // The bed sits between 0xb07a42 and the 0xe8d29a the climbers use for
      // their own fall-zone mats: saturated bark reads as MUD out here, and it
      // has to be the same substance as whatever is standing on it.
      edge(1.0);  x.fillStyle = 'rgba(172,133,85,.93)'; x.fill();
      x.save(); edge(1.0); x.clip();                               // nothing spills onto tarmac
      // Broad flat drifts — bleached chips one end, rained-on the other. Flat
      // fields, not gradients: the ramp in art.js is banded and so is this.
      const DRIFT = ['rgba(232,210,154,.34)', 'rgba(122,86,50,.3)', 'rgba(201,160,102,.32)'];
      for (let i = 0; i < 9; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * 0.72;
        x.fillStyle = DRIFT[i % 3];
        x.beginPath();
        x.ellipse(X(Math.cos(a) * RX * rr), Z(Math.sin(a) * RZ * rr),
                  (0.7 + rnd() * 1.5) * PX, (0.5 + rnd() * 1.1) * PX, rnd() * 3, 0, 7);
        x.fill();
      }
      // Chip grain. Each dash is ~0.4 units, six pixels at play distance —
      // which is the floor for anything meant to be seen at all.
      const BARK = ['rgba(138,90,53,.5)', 'rgba(111,74,40,.46)', 'rgba(214,178,124,.6)', 'rgba(240,222,176,.5)'];
      for (let i = 0; i < 260; i++) {
        const a = rnd() * Math.PI * 2, rr = Math.sqrt(rnd()) * wob(a) * 0.99;
        const cw = (0.3 + rnd() * 0.22) * PX, ch = (0.11 + rnd() * 0.06) * PX;
        x.save();
        x.translate(X(Math.cos(a) * RX * rr), Z(Math.sin(a) * RZ * rr));
        x.rotate(rnd() * Math.PI);
        x.fillStyle = BARK[i % 4];
        x.fillRect(-cw / 2, -ch / 2, cw, ch);
        x.restore();
      }
      x.restore();
      // bite the rim back out, so the boundary is scuffed rather than cut
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 44; i++) {
        const a = rnd() * Math.PI * 2, w = wob(a) * (0.95 + rnd() * 0.18);
        const px = X(Math.cos(a) * RX * w), pz = Z(Math.sin(a) * RZ * w);
        const r = (0.28 + rnd() * 0.6) * PX;
        const wash = x.createRadialGradient(px, pz, 0, px, pz, r);
        wash.addColorStop(0, `rgba(0,0,0,${0.45 + rnd() * 0.5})`);
        wash.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = wash; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
      }
      x.globalCompositeOperation = 'source-over';
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const bed = new THREE.Mesh(new THREE.PlaneGeometry(SPANX, SPANZ),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      bed.rotation.x = -Math.PI / 2;
      // lowest decal on the map on purpose: the climbers' own fall-zone mats
      // and the court paint both have to land ON the bed, not under it. Nothing
      // else in the set is allowed to sit at 0.013.
      bed.position.y = 0.013;
      g.add(bed);
      g.traverse(o => o.layers.set(1));               // a surface must not be inked
      return { obj: g };
    }
    case 'puddle': {
      // Standing water on blacktop, and the same substance as the Hose's wet
      // patches in view.js — so it borrows that stack whole: dark body, pale
      // sheen, hot rim, in those exact colours. Only the body is dropped a
      // couple of stops, because view.js already establishes that wet ground
      // goes DARKER than what it lands on, and its 0x2b7d74 over tarmac comes
      // out lighter than the tarmac did.
      const g = new THREE.Group();
      const RX = 1.5, RZ = 1.05, PX = 140;
      const wob = a => 1 + 0.085 * Math.sin(a * 3 + 1.1) + 0.055 * Math.sin(a * 5 - 0.4) + 0.07 * Math.cos(a * 2 - 0.7);
      const K = 1.18 * 1.21;
      const SPANX = RX * 2 * K + 0.3, SPANZ = RZ * 2 * K + 0.3;
      const c = document.createElement('canvas');
      c.width = Math.round(SPANX * PX); c.height = Math.round(SPANZ * PX);
      const x = c.getContext('2d');
      const rnd = scatterRng(8585);
      const X = u => (u + SPANX / 2) * PX;
      const Z = v => (v + SPANZ / 2) * PX;
      const edge = k => {
        x.beginPath();
        for (let i = 0; i <= 84; i++) {
          const a = i / 84 * Math.PI * 2, w = wob(a) * k;
          const px = X(Math.cos(a) * RX * w), pz = Z(Math.sin(a) * RZ * w);
          i ? x.lineTo(px, pz) : x.moveTo(px, pz);
        }
        x.closePath();
      };
      // damp halo: 0x2a2724, the tone view.js paints under a hydrant
      edge(1.18); x.fillStyle = 'rgba(42,39,36,.5)'; x.fill();
      edge(1.0);  x.fillStyle = 'rgba(29,88,82,.9)'; x.fill();
      // The hot rim is what says "water" instead of "stain" at fifty pixels,
      // so it gets 0.11 units of stroke — 0.085 came out at a pixel and a half
      // on screen and the puddle went back to being a stain.
      x.strokeStyle = 'rgba(239,251,255,.8)'; x.lineWidth = 0.11 * PX;
      edge(1.0); x.stroke();
      // Sky glare: two flat streaks in view.js's sheen colour, broken and off
      // centre. One blob in the middle would read as a hole in the road.
      x.save(); edge(0.99); x.clip();
      x.fillStyle = 'rgba(189,238,255,.34)';
      x.beginPath(); x.ellipse(X(-RX * 0.22), Z(-RZ * 0.22), RX * 0.5 * PX, RZ * 0.16 * PX, -0.3, 0, 7); x.fill();
      x.beginPath(); x.ellipse(X(RX * 0.3), Z(RZ * 0.26), RX * 0.19 * PX, RZ * 0.1 * PX, 0.42, 0, 7); x.fill();
      x.restore();
      // break the rim where the water has run thin
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 22; i++) {
        const a = rnd() * Math.PI * 2, w = wob(a) * (0.98 + rnd() * 0.22);
        const px = X(Math.cos(a) * RX * w), pz = Z(Math.sin(a) * RZ * w);
        const r = (0.1 + rnd() * 0.3) * PX;
        const wash = x.createRadialGradient(px, pz, 0, px, pz, r);
        wash.addColorStop(0, `rgba(0,0,0,${0.4 + rnd() * 0.5})`);
        wash.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = wash; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
      }
      x.globalCompositeOperation = 'source-over';
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const water = new THREE.Mesh(new THREE.PlaneGeometry(SPANX, SPANZ),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      water.rotation.x = -Math.PI / 2; water.position.y = 0.026;  // water lies OVER the paint
      g.add(water);
      g.traverse(o => o.layers.set(1));
      return { obj: g };
    }

    // ── Painted asphalt ──────────────────────────────────────────────
    // Three markings, no collider, no ink. Each is ONE canvas on ONE plane
    // rather than a pile of strips: paint has to carry its own wear, and a
    // stroked line with blotches punched back out of it reads as worn paint
    // where forty PlaneGeometry strips only ever read as a UI overlay.
    // Sizes are the markings' own sizes rather than hw/hh — none of the three
    // has a collider to match, so they arrive with the defaults.
    case 'foursquare': {
      const g = new THREE.Group();
      const S = 3.6, PAD = 0.3, SPAN = S + PAD * 2;   // PAD keeps the fat outer
      const PX = 512 / SPAN;                          // stroke off the texture edge
      const c = document.createElement('canvas');
      c.width = c.height = 512;
      const x = c.getContext('2d');
      const rnd = scatterRng(4141);
      const U = u => (u + S / 2 + PAD) * PX;          // court units -> canvas px
      // somebody painted this by hand, so the whole court sits off square
      x.translate(256, 256); x.rotate(0.02); x.translate(-256, -256);
      // Four faded washes. The camera is far enough that the whole court is
      // ~60px across, and at that size the dividing lines alone do not read —
      // four flat colour fields do. The washes are PASTEL rather than the
      // house primaries: a saturated colour laid over blacktop at low alpha
      // comes out darker than the blacktop and the quadrant reads as a hole,
      // so each one is the primary already mixed most of the way to white.
      const QUAD = [
        ['rgba(255,230,140,.38)', '1', -1, -1],
        ['rgba(245,150,135,.36)', '2',  1, -1],
        ['rgba(150,196,238,.40)', '3',  1,  1],
        ['rgba(155,226,232,.38)', '4', -1,  1],
      ];
      for (const [col, , sx, sz] of QUAD) {
        x.fillStyle = col;
        x.fillRect(U(sx < 0 ? -S / 2 : 0), U(sz < 0 ? -S / 2 : 0), S / 2 * PX, S / 2 * PX);
      }
      x.strokeStyle = 'rgba(246,241,224,.82)';
      x.lineWidth = 0.13 * PX;                        // chunky: a scale 0.05 line
      x.strokeRect(U(-S / 2), U(-S / 2), S * PX, S * PX);   // would be sub-pixel
      x.beginPath();
      x.moveTo(U(-S / 2), U(0)); x.lineTo(U(S / 2), U(0));
      x.moveTo(U(0), U(-S / 2)); x.lineTo(U(0), U(S / 2));
      x.stroke();
      x.font = `900 ${Math.round(0.62 * PX)}px "Fredoka", "Arial Black", sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillStyle = 'rgba(246,241,224,.7)';
      for (const [, n, sx, sz] of QUAD) x.fillText(n, U(sx * 1.24), U(sz * 1.24));
      // Wear: punch the paint back OUT where the ball and forty pairs of
      // sneakers have been over it. Small scuffs plus a fine speckle — a few
      // big soft blobs came out looking like mould rather than worn paint.
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 64; i++) {
        const px = rnd() * 512, pz = rnd() * 512, r = 9 + rnd() * 30;
        const w = x.createRadialGradient(px, pz, 0, px, pz, r);
        w.addColorStop(0, `rgba(0,0,0,${0.25 + rnd() * 0.4})`);
        w.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = w; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
      }
      for (let i = 0; i < 900; i++) {
        x.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.4})`;
        x.fillRect(rnd() * 512, rnd() * 512, 1 + rnd() * 2.4, 1 + rnd() * 2.4);
      }
      x.globalCompositeOperation = 'source-over';
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const paint = new THREE.Mesh(new THREE.PlaneGeometry(SPAN, SPAN),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      paint.rotation.x = -Math.PI / 2; paint.position.y = 0.018;
      g.add(paint);
      g.traverse(o => o.layers.set(1));               // paint shouldn't be inked
      return { obj: g };
    }
    case 'hopscotch': {
      const g = new THREE.Group();
      const W = 1.6, L = 5.0, ROWS = 7, PAD = 0.24;
      const CELL = L / ROWS;                          // 0.71 — so a half-width
      const SPANX = W + PAD * 2, SPANZ = L + PAD * 2; // double cell is square
      const PX = 132;
      const c = document.createElement('canvas');
      c.width = Math.round(SPANX * PX); c.height = Math.round(SPANZ * PX);
      const x = c.getContext('2d');
      const rnd = scatterRng(5252);
      const X = u => (u + W / 2 + PAD) * PX;
      const Z = v => (v + L / 2 + PAD) * PX;          // canvas y runs to +z
      x.translate(c.width / 2, c.height / 2); x.rotate(-0.025); x.translate(-c.width / 2, -c.height / 2);
      // 1 nearest +z, counting away. Singles and doubles alternate the way
      // every playground one does; three cells got the coloured chalk.
      const ROW = [[1], [2], [3, 4], [5], [6, 7], [8], [9, 10]];
      const TINT = { 4: 'rgba(255,192,140,.34)', 7: 'rgba(160,226,236,.34)', 10: 'rgba(255,172,210,.36)' };
      // 0.12, matching the foursquare: 0.1 units is under two pixels on screen
      // and the grid stopped reading as chalk lines at all.
      x.lineWidth = 0.12 * PX; x.lineJoin = 'round';
      x.font = `900 ${Math.round(0.34 * PX)}px "Fredoka", "Arial Black", sans-serif`;
      x.textAlign = 'center'; x.textBaseline = 'middle';
      for (let r = 0; r < ROWS; r++) {
        const z0 = L / 2 - r * CELL;                  // near edge of this row
        for (let i = 0; i < ROW[r].length; i++) {
          const n = ROW[r][i], cw = W / ROW[r].length, u0 = -W / 2 + i * cw;
          if (TINT[n]) { x.fillStyle = TINT[n]; x.fillRect(X(u0), Z(z0 - CELL), cw * PX, CELL * PX); }
          x.strokeStyle = 'rgba(248,243,226,.78)';
          x.strokeRect(X(u0), Z(z0 - CELL), cw * PX, CELL * PX);
          x.fillStyle = 'rgba(248,243,226,.5)';
          x.fillText(String(n), X(u0 + cw / 2), Z(z0 - CELL / 2));
        }
      }
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 46; i++) {
        const px = rnd() * c.width, pz = rnd() * c.height, r = 8 + rnd() * 26;
        const w = x.createRadialGradient(px, pz, 0, px, pz, r);
        w.addColorStop(0, `rgba(0,0,0,${0.3 + rnd() * 0.45})`);
        w.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = w; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
      }
      for (let i = 0; i < 700; i++) {
        x.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.4})`;
        x.fillRect(rnd() * c.width, rnd() * c.height, 1 + rnd() * 2.2, 1 + rnd() * 2.2);
      }
      x.globalCompositeOperation = 'source-over';
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const paint = new THREE.Mesh(new THREE.PlaneGeometry(SPANX, SPANZ),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      paint.rotation.x = -Math.PI / 2; paint.position.y = 0.02;
      g.add(paint);
      g.traverse(o => o.layers.set(1));
      return { obj: g };
    }
    case 'courtkey': {
      // Sits at the HOOP's own x/z with the same rot: the key runs out along
      // +x, which is the way the 'hoop' case points its backboard and rim.
      const g = new THREE.Group();
      const KW = 4.9, KD = 5.8, PAD = 0.7, RUN = 0.42;
      const R = KW / 2;                               // free-throw circle
      const SPANX = KD + R + PAD * 2, SPANZ = KW + PAD * 2;
      const PX = 112;
      const c = document.createElement('canvas');
      c.width = Math.round(SPANX * PX); c.height = Math.round(SPANZ * PX);
      const x = c.getContext('2d');
      const rnd = scatterRng(6363);
      const X = u => (u + PAD) * PX;                  // u = 0 at the baseline
      const Z = v => (v + KW / 2 + PAD) * PX;
      x.translate(c.width / 2, c.height / 2); x.rotate(0.012); x.translate(-c.width / 2, -c.height / 2);
      // The lane, filled — one big flat colour is what makes a key read as a
      // key from above, before any of the lines are legible. Pale blue, not
      // the house 0x2f5fb3: over blacktop that lands DARKER than the asphalt
      // and the whole key reads as a pit rather than as paint.
      x.fillStyle = 'rgba(150,195,232,.4)';
      x.fillRect(X(0), Z(-KW / 2), KD * PX, KW * PX);
      // Four separate lines rather than a strokeRect plus a baseline over the
      // top of it: the baseline runs out past the lane (so the key reads as
      // the END OF A COURT and not a rectangle floating on the blacktop), and
      // stroking it twice made it visibly heavier than the other three.
      // Square caps so the corners close without a join.
      x.strokeStyle = 'rgba(246,241,224,.8)';
      x.lineWidth = 0.15 * PX; x.lineCap = 'square';
      x.beginPath();
      x.moveTo(X(0), Z(-KW / 2 - RUN)); x.lineTo(X(0), Z(KW / 2 + RUN));   // baseline
      x.moveTo(X(0), Z(-KW / 2));  x.lineTo(X(KD), Z(-KW / 2));            // lane sides
      x.moveTo(X(0), Z(KW / 2));   x.lineTo(X(KD), Z(KW / 2));
      x.moveTo(X(KD), Z(-KW / 2)); x.lineTo(X(KD), Z(KW / 2));             // free-throw line
      x.stroke();
      // Free-throw circle: solid out front, dashed back across the lane.
      // Butt caps here — square ones grow every dash by a line width and the
      // gaps close up into a near-solid ring.
      x.lineCap = 'butt';
      x.beginPath(); x.arc(X(KD), Z(0), R * PX, -Math.PI / 2, Math.PI / 2); x.stroke();
      x.setLineDash([0.42 * PX, 0.34 * PX]);
      x.beginPath(); x.arc(X(KD), Z(0), R * PX, Math.PI / 2, Math.PI * 1.5); x.stroke();
      x.setLineDash([]);
      // lane blocks — the marks you line up on, just outside the lane line
      x.fillStyle = 'rgba(246,241,224,.6)';
      for (const s of [-1, 1]) for (const u of [1.5, 2.6, 3.7]) {
        x.fillRect(X(u), Z(s < 0 ? -KW / 2 - 0.45 : KW / 2), 0.26 * PX, 0.45 * PX);
      }
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 110; i++) {
        const px = rnd() * c.width, pz = rnd() * c.height, r = 10 + rnd() * 34;
        const w = x.createRadialGradient(px, pz, 0, px, pz, r);
        w.addColorStop(0, `rgba(0,0,0,${0.22 + rnd() * 0.38})`);
        w.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = w; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
      }
      for (let i = 0; i < 2400; i++) {
        x.fillStyle = `rgba(0,0,0,${0.2 + rnd() * 0.4})`;
        x.fillRect(rnd() * c.width, rnd() * c.height, 1 + rnd() * 2.4, 1 + rnd() * 2.4);
      }
      x.globalCompositeOperation = 'source-over';
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const paint = new THREE.Mesh(new THREE.PlaneGeometry(SPANX, SPANZ),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      paint.rotation.x = -Math.PI / 2;
      paint.position.set((KD + R) / 2, 0.016, 0);     // origin sits on the baseline
      g.add(paint);
      g.traverse(o => o.layers.set(1));
      return { obj: g };
    }
    // ── The Splash Pad ────────────────────────────────────────────
    case 'aboveground': {
      // The map's centrepiece, and the one prop here you cannot cross: a circle
      // collider at r 3.6 makes it a round WALL you orbit. So it is built from
      // the outside in — what has to read at forty pixels is the ring, not the
      // water. Concentric bands, biggest to smallest: trodden apron, white bead,
      // cream coping, blue water.
      //
      // A circle collider's radius never reaches makeProp — world.js forwards
      // col.hw and a circle hasn't got one — so 3.6 lives here. Move the
      // collider and this number moves with it, or the coping stops being the
      // thing you bump into.
      const g = new THREE.Group();
      const R = 3.6;                     // == the collider; NOTHING may reach past it
      const H = 1.3;                     // wall height: over a kid's waist, under their chin
      const RIM = 0.62;                  // coping width — wide enough to read as a seat
      const WR = R - 0.15;               // wall, tucked just under the coping's outer bead
      const RI = R - RIM;                // where the coping stops and the water starts

      // Ground, in two passes like the dome's fall zone. The tones are NOT
      // free: view.js establishes that wet ground goes DARKER than what it
      // lands on, and the splashpad's ground is lawn — so the soaked ring is
      // the same 0x2f6e3a the sprinklers paint, and the broad apron is the
      // bleached tan poolsideTexture already uses for its worn foot-paths. A
      // first pass had both in a pale grey-blue, which came out LIGHTER than
      // the grass and read as a concrete pad, not as a wet one.
      const worn = new THREE.Mesh(new THREE.CircleGeometry(R + 1.45, 46),
        new THREE.MeshBasicMaterial({ color: 0xb9ac74, transparent: true, opacity: 0.34, depthWrite: false }));
      worn.rotation.x = -Math.PI / 2; worn.position.y = 0.014; worn.layers.set(1);
      const soak = new THREE.Mesh(new THREE.RingGeometry(R + 0.02, R + 0.9, 46),
        new THREE.MeshBasicMaterial({ color: 0x2f6e3a, transparent: true, opacity: 0.42, depthWrite: false }));
      soak.rotation.x = -Math.PI / 2; soak.position.y = 0.024; soak.layers.set(1);
      g.add(worn, soak);
      // splash-out, thrown further than the soak ring gets
      const rnd = scatterRng(5151);
      const dropGeo = new THREE.CircleGeometry(1, 12);
      const dropMat = new THREE.MeshBasicMaterial({ color: 0x2f6e3a, transparent: true, opacity: 0.34, depthWrite: false });
      for (let i = 0; i < 15; i++) {
        const a = rnd() * Math.PI * 2, d = R + 0.5 + rnd() * 1.5;
        const drop = new THREE.Mesh(dropGeo, dropMat);
        drop.rotation.x = -Math.PI / 2;
        drop.scale.setScalar(0.14 + rnd() * 0.19);
        drop.position.set(Math.cos(a) * d, 0.028, Math.sin(a) * d);
        drop.layers.set(1);
        g.add(drop);
      }

      // The wall. Open cylinder, so it needs DoubleSide or the far inner face
      // vanishes and you look straight through the pool from the near side.
      const wall = new THREE.Mesh(new THREE.CylinderGeometry(WR, WR, H, 30, 1, true),
        toonMap({ color: 0xdfe8ee, side: THREE.DoubleSide }));
      wall.position.y = H / 2; wall.castShadow = true; wall.receiveShadow = true;
      g.add(wall);
      // Corrugation: vertical ribs standing proud of the skin. Eighteen is the
      // count where the fluting still reads as fluting from overhead instead of
      // dissolving into one grey band — but the gauge had to come up with it.
      // At 0.075 each rib was 0.15 across, under three pixels at this camera,
      // and the wall went back to being a smooth drum.
      const RIB = 0.10;
      const ribGeo = new THREE.CylinderGeometry(RIB, RIB, H, 6);
      const ribMat = toon(0xc4d7e2);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const rib = new THREE.Mesh(ribGeo, ribMat);
        rib.position.set(Math.cos(a) * WR, H / 2, Math.sin(a) * WR);
        rib.castShadow = true;
        g.add(rib);
      }
      // Printed band, wrapping OVER the ribs so it reads as decal on
      // corrugation and not as a groove cut into it. WR + 0.13 clears the ribs'
      // own outer face at WR + RIB and still lands inside R.
      const band = new THREE.Mesh(new THREE.CylinderGeometry(WR + 0.13, WR + 0.13, 0.32, 30, 1, true),
        toonMap({ color: 0x2f5fb3, side: THREE.DoubleSide }));
      band.position.y = H - 0.38;
      g.add(band);

      // Liner and water. The water runs all the way out to the wall rather than
      // stopping at the coping's inner edge — pulled in, it left a dark crescent
      // of bare inner wall on the far side that read as a crack in the pool.
      const liner = new THREE.Mesh(new THREE.CircleGeometry(WR - 0.02, 40), toon(0x8fd8ef));
      liner.rotation.x = -Math.PI / 2; liner.position.y = 0.32; liner.receiveShadow = true;
      const WY = H - 0.28;                        // water sits a clear step below the rim
      // depthWrite:false, deliberately. Everything under and through the water
      // — liner, ring float, beach ball — is opaque and therefore already drawn
      // when this lands, so the surface only has to blend. Left writing depth
      // it fights the half-submerged float for the same pixels.
      const water = new THREE.Mesh(new THREE.CircleGeometry(WR - 0.03, 48),
        toonMap({ color: 0x39a9e0, transparent: true, opacity: 0.9, depthWrite: false }));
      water.rotation.x = -Math.PI / 2; water.position.y = WY; water.receiveShadow = true;
      g.add(liner, water);
      // Sun on the water: two broken streaks, off centre. One blob in the
      // middle reads as a hole, the way the puddle's does — and they are
      // squashed circles rather than planes, because a rectangle of glare has
      // two hard ends and comes out as a white board lying in the pool.
      for (const [sx, sz, w, d, rot] of [[-0.7, -0.8, 3.2, 0.6, -0.34], [1.1, 1.0, 1.7, 0.36, 0.5]]) {
        const sheen = new THREE.Mesh(new THREE.CircleGeometry(1, 24),
          new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.32, depthWrite: false }));
        sheen.scale.set(w / 2, d / 2, 1);              // scale runs before the tip, so it is still in-plane
        sheen.rotation.set(-Math.PI / 2, 0, rot);
        sheen.position.set(sx, WY + 0.012, sz);
        sheen.layers.set(1);
        g.add(sheen);
      }

      // The coping: a flat band you could sit on, a fat bullnose on the outside
      // edge and a bead on the inside. The beads are what give the ring its
      // weight from above — the flat annulus alone reads as paper. The inner
      // bead's tube came up from 0.055 to 0.07: at 0.11 across it was two
      // pixels and the water met the coping with no edge at all.
      const top = new THREE.Mesh(new THREE.RingGeometry(RI, R - 0.08, 44),
        toonMap({ color: 0xf0e6d2, side: THREE.DoubleSide }));
      top.rotation.x = -Math.PI / 2; top.position.y = H + 0.03;
      top.castShadow = true; top.receiveShadow = true;
      const bead = new THREE.Mesh(new THREE.TorusGeometry(R - 0.11, 0.11, 8, 44), toon(0xfffdf5));
      bead.rotation.x = Math.PI / 2; bead.position.y = H + 0.03; bead.castShadow = true;
      const lip = new THREE.Mesh(new THREE.TorusGeometry(RI + 0.07, 0.07, 6, 40), toon(0xfffdf5));
      lip.rotation.x = Math.PI / 2; lip.position.y = H + 0.05;
      g.add(top, bead, lip);

      // Two towels over the rim, laid RADIALLY — and they have to be visibly
      // longer than they are wide or the rotation below is a no-op you cannot
      // see. A first pass at 0.54 x 0.62 finished as a 0.60 square: turning it
      // changed nothing and it read as a folded flannel. 0.40 x 0.70 is a
      // towel. It rests ON the coping (top face 1.33) and buries the inner
      // bead under itself, which is what draped over a bullnose looks like,
      // and its outer end stops at the outer bead rather than past R.
      const TL = 0.70, tr = 3.10;
      // angles chosen against the floaty (-0.64) and the ball (2.47): the pink
      // towel first sat at -0.6, a hand's width off the pink ring, and the two
      // fused into one shape
      for (const [a, col] of [[1.15, 0xff6bb5], [-2.35, 0xffd94a]]) {
        const towel = outlined(rbox(0.34, 0.10, TL, 0.03), col, 0.012);
        towel.position.set(Math.cos(a) * tr, H + 0.11, Math.sin(a) * tr);
        towel.rotation.y = Math.PI / 2 - a;       // long axis radial, not tangential
        g.add(towel);
      }

      // Two big floating shapes, and no more: from up here the water is a disc
      // and it only wants one or two things breaking it up.
      const floaty = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.21, 10, 24), toon(0xff6bb5));
      floaty.rotation.x = Math.PI / 2; floaty.position.set(1.35, WY + 0.04, -1.0);
      floaty.castShadow = true;
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 10), toon(0xe04848));
      ball.position.set(-1.5, WY + 0.08, 1.2); ball.castShadow = true;
      g.add(floaty, ball);
      return { obj: g };
    }
    case 'kiddiepool': {
      // Hard-moulded paddling pool. Its collider is a circle at r 1.6 flagged
      // low, so this is a hurdle, not a wall — everything stays under 0.4 so
      // the silhouette never argues with a kid vaulting it.
      //
      // As with the big pool, a circle's radius does not reach makeProp, so the
      // 1.6 is hardcoded here and has to be kept in step with the layout entry.
      const g = new THREE.Group();
      const R = 1.6;
      const RT = R - 0.08, RB = RT * 0.80, HT = 0.34;   // the shell flares out as it rises
      const rAt = y => RB + (RT - RB) * (y / HT);       // radius at any height up the flare
      const SPLIT = 0.19;                               // the two-tone seam

      // Wet ring, so it sits IN the ground rather than on it — and in the
      // sprinklers' own dark green, not a pale blue. Wet lawn goes DARKER;
      // view.js documents this and the slip-n-slide props on this same map
      // follow it, so the two paddling surfaces cannot disagree about it.
      const damp = new THREE.Mesh(new THREE.CircleGeometry(R + 0.75, 34),
        new THREE.MeshBasicMaterial({ color: 0x2f6e3a, transparent: true, opacity: 0.38, depthWrite: false }));
      damp.rotation.x = -Math.PI / 2; damp.position.y = 0.016; damp.layers.set(1);
      g.add(damp);

      // Shell in two stacked cones rather than one cone with a stripe painted
      // round it: a straight band cannot follow a flare without either biting
      // into it or standing off it, and the colour seam is free this way.
      const lo = new THREE.Mesh(new THREE.CylinderGeometry(rAt(SPLIT), RB, SPLIT, 26, 1, true),
        toonMap({ color: 0x59c8e0, side: THREE.DoubleSide }));
      lo.position.y = SPLIT / 2; lo.castShadow = true;
      const hi = new THREE.Mesh(new THREE.CylinderGeometry(RT, rAt(SPLIT), HT - SPLIT, 26, 1, true),
        toonMap({ color: 0xffd94a, side: THREE.DoubleSide }));
      hi.position.y = (SPLIT + HT) / 2; hi.castShadow = true;
      // Rolled rim: the torus reaches exactly RT, inside the collider. Its
      // centre is dropped 0.02 under the shell's top edge so the whole prop
      // tops out at 0.39 — sat ON the edge it stood at 0.41 and a collider
      // flagged `low` had a lip you could see poking over a hurdling kid.
      const bead = new THREE.Mesh(new THREE.TorusGeometry(RT - 0.07, 0.07, 8, 34), toon(0xff8a3d));
      bead.rotation.x = Math.PI / 2; bead.position.y = HT - 0.02; bead.castShadow = true;
      const floor = new THREE.Mesh(new THREE.CircleGeometry(RB + 0.02, 30), toon(0x7fd6ef));
      floor.rotation.x = -Math.PI / 2; floor.position.y = 0.04;
      g.add(lo, hi, bead, floor);

      // Moulded fish. Their backs break the surface rather than sitting under
      // it: submerged, the water plane tinted both of them the same grey-teal
      // and the only two shapes in the pool went to smudges. The bellies run on
      // down into the floor, which is what moulded means.
      //
      // Body plus a tail and nothing else — an eye at this scale is a third of
      // a pixel. The tail is kept short and buried in the body: at 0.3 long and
      // set back it separated into a floating triangle and the whole thing read
      // as a dart.
      for (const [fx, fz, fa, col] of [[-0.30, 0.42, 0.5, 0xff6bb5], [0.40, -0.42, -2.3, 0xff8a3d]]) {
        const fish = new THREE.Group();
        const skin = toon(col);
        const body = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), skin);
        body.scale.set(1.5, 0.5, 0.85); body.castShadow = true;
        const tail = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.22, 6), skin);
        // scale runs BEFORE rotation, so the squash that flattens the fin in
        // world y has to go on local x — scale.y just makes a shorter cone
        tail.scale.set(0.55, 1, 1);
        tail.rotation.z = Math.PI / 2; tail.position.x = -0.36;
        fish.add(body, tail);
        fish.position.set(fx, 0.12, fz); fish.rotation.y = fa;
        g.add(fish);
      }

      // A few centimetres of water — the level is what makes it read as a
      // paddling pool rather than a bowl — and the shell's own radius at that
      // height is solved off the flare rather than guessed. It sits just under
      // the fish so their backs break the surface: sunk under 0.2 of water they
      // greyed out into two smudges, and at this range the whole pool is forty
      // pixels and the water cannot be allowed to eat the only shapes in it.
      // depthWrite off for the same reason the big pool's is: shell, floor and
      // fish are all opaque and already drawn, so this only has to tint them.
      const WY = 0.18;
      const water = new THREE.Mesh(new THREE.CircleGeometry(rAt(WY) - 0.02, 34),
        toonMap({ color: 0x4fb8e8, transparent: true, opacity: 0.55, depthWrite: false }));
      water.rotation.x = -Math.PI / 2; water.position.y = WY;
      const sheen = new THREE.Mesh(new THREE.CircleGeometry(1, 20),
        new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.35, depthWrite: false }));
      sheen.scale.set(0.7, 0.16, 1);
      sheen.rotation.set(-Math.PI / 2, 0, -0.4); sheen.position.set(-0.2, WY + 0.01, -0.25);
      sheen.layers.set(1);
      g.add(water, sheen);
      return { obj: g };
    }
    case 'springboard': {
      // No collider at all — you run straight over it and the water hazard does
      // the work — so nothing here is sized off hw/hh, which arrive as the
      // defaults. It is built along +x with the nose dipping toward the pool;
      // the layout entry's position aims it, and the 180° mirror turns the far
      // copy back in.
      const g = new THREE.Group();
      const L = 2.5, W = 0.66, TILT = -0.12, DECK = 0.46;
      const SIN = Math.sin(TILT), COS = Math.cos(TILT);
      // Underside of the board, in world y, at a point u along its own length —
      // the anchor and the fulcrum are both solved off this rather than being
      // eyeballed, which is what left the ramp's deck hanging in the air. The
      // parameter is NOT called x: the canvas context below is, and one of them
      // shadowing the other inside this case is a bug waiting to be written.
      const under = u => DECK + u * SIN - 0.14 * COS;

      // Wet mat under the run-up, the same job the slide's run-out mat does: it
      // says which end you approach from. Dark green, not blue-grey — wet lawn
      // goes darker, and this prop stands on grass a good four units clear of
      // the pool wall, so nothing here may pretend to be water.
      const mat = new THREE.Mesh(new THREE.CircleGeometry(1, 26),
        new THREE.MeshBasicMaterial({ color: 0x2f6e3a, transparent: true, opacity: 0.36, depthWrite: false }));
      mat.rotation.x = -Math.PI / 2; mat.scale.set((L + 0.5) / 2, (W + 0.9) / 2, 1);
      mat.position.set(-0.1, 0.016, 0); mat.layers.set(1);
      g.add(mat);

      // The board is built flat in its own group and tipped once, so the plank,
      // its tread and the nose band stay glued together instead of each
      // carrying its own angle — the same reason the slide's chute is a group.
      const board = new THREE.Group();
      board.position.set(0, DECK, 0);
      board.rotation.z = TILT;
      // rbox pushes its contour out by 2r in x and y: 2.5 x 0.14 finished, so
      // the plank's top face lands on local 0
      const plank = outlined(rbox(L - 0.1, 0.04, W, 0.05), 0xfffdf5, 0.016);
      plank.position.y = -0.07;
      board.add(plank);

      // Non-slip tread. Drawn as geometry it would be a rounding error — the
      // real grooves are ~2cm and this camera gives the whole board 40 pixels —
      // so it goes on as a map, which survives being one pixel deep.
      //
      // The grain runs ALONG the board, not across it. A first pass used bold
      // cross-cleats, which is what the real tread does, and the board came out
      // as a white ladder lying on the ground — the slide already owns rungs
      // across two stringers and the eye read it that way instantly. Lengthwise
      // lines say plank; the grit does the non-slip on its own.
      const c = document.createElement('canvas');
      c.width = 256; c.height = 72;
      const x = c.getContext('2d');
      const rnd = scatterRng(9292);
      x.fillStyle = '#c2d5e0'; x.fillRect(0, 0, 256, 72);
      // fewer, fatter specks than the first pass: 2200 two-pixel dots turned to
      // static in the mips and the board came out as polished granite
      for (let i = 0; i < 900; i++) {
        x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.55)' : 'rgba(66,92,110,.5)';
        x.fillRect(rnd() * 256, rnd() * 72, 3, 3);
      }
      for (const [gy, gh, ga] of [[10, 3, 0.5], [26, 2, 0.3], [45, 2, 0.3], [59, 3, 0.5]]) {
        x.fillStyle = `rgba(52,78,96,${ga})`;
        x.fillRect(0, gy, 256, gh);
      }
      const t = new THREE.CanvasTexture(c);
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      // stops short of the nose band rather than running the full plank: laid
      // over it, the band sat 0.012 UNDER the tread and disappeared
      const tread = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.52, W - 0.14), toonMap({ map: t }));
      tread.rotation.x = -Math.PI / 2; tread.position.set(-0.14, 0.012, 0);
      tread.receiveShadow = true;
      board.add(tread);
      // Hot nose band: the "jump from here" mark, and it keeps the tip from
      // disappearing against the grass it points at. It has to sit PROUD of the
      // plank — flush at local y 0 its top face was coplanar with the plank's
      // and the two z-fought across the whole band.
      const nose = outlined(rbox(0.24, 0.05, W - 0.02, 0.03), 0xe04848, 0.012);
      nose.position.set(L / 2 - 0.15, -0.035, 0);
      board.add(nose);
      g.add(board);

      // Fixed anchor at the heel, sitting up to meet the plank. Overlapping it
      // by a few mm on purpose: a gap here reads as a broken board.
      const AX = -1.1, ah = under(AX) + 0.02;
      const anchor = outlined(rbox(0.34, ah - 0.08, W - 0.06, 0.04), 0x8a939e, 0.014);
      anchor.position.set(AX, ah / 2, 0);
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, W + 0.22, 8), toon(0x4a4740));
      bolt.rotation.x = Math.PI / 2; bolt.position.set(AX, ah - 0.09, 0);
      g.add(anchor, bolt);

      // Fulcrum: a pedestal with a bright roller on top, the roller's own
      // radius subtracted off the underside so the plank rests ON it rather
      // than through it.
      const FX = -0.15, RR = 0.11, fy = under(FX) - RR;
      const ped = outlined(rbox(0.3, fy - 0.08, W - 0.1, 0.04), 0x8a939e, 0.014);
      ped.position.set(FX, fy / 2, 0);              // rbox is fy tall — stands ON the ground
      // Deliberately wider than the plank. Trimmed to the board's own width the
      // orange ends vanished under it from overhead and the whole thing read as
      // a plank lying flat on the ground rather than something sprung.
      const roller = new THREE.Mesh(new THREE.CylinderGeometry(RR, RR, W + 0.34, 12), toon(0xff8a3d));
      roller.rotation.x = Math.PI / 2; roller.position.set(FX, fy, 0);
      roller.castShadow = true;
      g.add(ped, roller);
      return { obj: g };
    }
    case 'slidetower': {
      // The head of the slip-n-slide run: the thing the lanes point away from,
      // so it has to be tall and loud enough to find from the far end.
      //
      // A CIRCLE collider's radius never reaches makeProp — world.js forwards
      // col.hw and a circle hasn't got one — so the authored r 1.15 lives here,
      // and every solid below is derived off it rather than eyeballed against
      // it. Put hw on the layout entry if the collider ever moves off 1.15.
      //
      // A column, not the arch this wanted to be. A circle collider is SOLID
      // all the way through, so an archway would draw a doorway nobody can walk
      // under — the same trap the car and the swing set both document, and it
      // is the collider that wins.
      const g = new THREE.Group();
      const R = 1.15;
      const WATER = 0xbfe9ff;

      // Soaked lawn, and the foam ring where the spill lands. Wet ground goes
      // DARKER, in view.js's own sprinkler green. This sits at 0.028 — ABOVE
      // the lane's 0.018 — so where the tower meets the head of the sheeting
      // the wet apron lands ON the plastic instead of under it.
      const wet = new THREE.Mesh(new THREE.CircleGeometry(R + 0.8, 28),
        new THREE.MeshBasicMaterial({ color: 0x2f6e3a, transparent: true, opacity: 0.34, depthWrite: false }));
      wet.rotation.x = -Math.PI / 2; wet.position.y = 0.028; wet.layers.set(1);
      const splash = new THREE.Mesh(new THREE.RingGeometry(R - 0.17, R + 0.21, 30),
        new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.55, depthWrite: false }));
      splash.rotation.x = -Math.PI / 2; splash.position.y = 0.034; splash.layers.set(1);
      g.add(wet, splash);

      // Foam piled at the foot, and it is the WIDEST solid on the prop (R-0.01)
      // rather than the plinth — so the silhouette you see still lands on the
      // collider wall, but the plinth stays narrow enough that the foam reads
      // as sitting beside it instead of being swallowed by it.
      const bead = outlined(new THREE.TorusGeometry(R - 0.13, 0.12, 8, 24), 0xf4fbff, 0.012);
      bead.rotation.x = Math.PI / 2; bead.position.y = 0.12;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + 0.6;
        const puff = outlined(new THREE.SphereGeometry(0.17, 10, 8), 0xffffff, 0.011);
        puff.position.set(Math.cos(a) * (R - 0.19), 0.16, Math.sin(a) * (R - 0.19));
        puff.scale.y = 0.72;
        g.add(puff);
      }
      const plinth = outlined(new THREE.CylinderGeometry(R - 0.21, R - 0.15, 0.34, 16), 0x2f5fb3, 0.016);
      plinth.position.y = 0.17;
      g.add(bead, plinth);

      // The inflated body. ONE tapered core so the column is not a hollow ring
      // from directly overhead, with fat welded doughnuts bulging over it in
      // alternating colours: the stripes are the entire read at this camera,
      // the shape underneath is just a post. Ring radii are SOLVED off the
      // taper rather than picked, so the top of the stack cannot end up wider
      // than the bottom and every bulge stays inside R.
      const Y0 = 0.30, Y1 = 2.34, TUBE = 0.24;
      const coreR = y => 0.88 - 0.26 * Math.min(1, Math.max(0, (y - Y0) / (Y1 - Y0)));
      const core = outlined(new THREE.CylinderGeometry(coreR(Y1), coreR(Y0), Y1 - Y0, 16), 0xfffdf5, 0.016);
      core.position.y = (Y0 + Y1) / 2;
      g.add(core);
      const STRIPE = [0xe04848, 0x59c8e0, 0xffd94a, 0xe04848, 0x59c8e0];
      for (let i = 0; i < 5; i++) {
        const y = 0.50 + i * 0.44;                  // 0.50 0.94 1.38 1.82 2.26
        const ring = outlined(new THREE.TorusGeometry(coreR(y) - 0.02, TUBE, 8, 22), STRIPE[i], 0.016);
        ring.rotation.x = Math.PI / 2; ring.position.y = y;
        g.add(ring);
      }

      // A wide brim on top, and the water goes over ITS rim rather than
      // dribbling down the stripes. From a camera 33 up and 30 back the brim
      // and the cap are most of what you see of this prop, so they are what
      // has to say "the water starts here" — a nozzle poking out of a post
      // says nothing at all from up there.
      const brim = outlined(new THREE.CylinderGeometry(1.00, 0.88, 0.18, 18), 0xffd94a, 0.016);
      brim.position.y = 2.43;
      const cap = outlined(new THREE.SphereGeometry(0.60, 16, 12), 0xe04848, 0.016);
      cap.position.y = 2.54; cap.scale.y = 0.62;    // 2.17 -> 2.91, so it clears the brim
      const spout = outlined(new THREE.CylinderGeometry(0.10, 0.14, 0.24, 10), 0x8a939e, 0.012);
      spout.position.y = 2.98;                      // 2.86 -> 3.10; its base is inside the cap
      g.add(brim, cap, spout);

      // Water. MeshBasicMaterial on layer 1 so the ink pass leaves it alone —
      // the same treatment the firepit's flame gets; outlined water reads as
      // jelly.
      const curtain = new THREE.Mesh(new THREE.CylinderGeometry(1.00, 0.94, 0.42, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false }));
      curtain.position.y = 2.16; curtain.layers.set(1);   // hangs off the brim rim, 1.95 -> 2.37
      g.add(curtain);

      // Dribbles off the rim at 1.06 — just PROUD of the 1.00 brim, or the
      // brim hides every one of them from anything near a top-down view. Three
      // lengths cycling: even ones read as the fringe on a lampshade. They also
      // stop by 1.56, well above the bottom doughnut, whose bulge is the only
      // one on the stack that reaches back out past 1.06.
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 + 0.35;
        const len = [0.36, 0.58, 0.80][i % 3];
        const px = Math.cos(a) * 1.06, pz = Math.sin(a) * 1.06;
        // 0.14 across, not the 0.05 a real dribble would be: under ~0.1 units
        // is under two pixels at this camera and the water is simply not there.
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.045, len, 6),
          new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: 0.75, depthWrite: false }));
        str.position.set(px, 2.36 - len / 2, pz); str.layers.set(1);
        g.add(str);
      }
      // The drops that have already let go. They hang in the GAPS between the
      // rings (0.50 / 0.94 / 1.38 / 1.82 / 2.26) — anywhere else a drop out at
      // 1.06 clips straight through the doughnut bulging beside it.
      for (const [a, y] of [[0.9, 2.04], [3.1, 2.04], [4.9, 1.60]]) {
        const drop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6),
          new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: 0.85, depthWrite: false }));
        drop.position.set(Math.cos(a) * 1.06, y, Math.sin(a) * 1.06);
        drop.scale.y = 1.35; drop.layers.set(1);
        g.add(drop);
      }
      return { obj: g };
    }
    case 'slidelane': {
      // One tile of slip-n-slide sheeting, running along x. No collider — you
      // sprint straight over it — so nothing useful arrives in hw/hh and the
      // size is authored here, the same as the painted-asphalt markings: a
      // 2.2-wide sheet on a 2.5-wide plane, the extra leaving room for the
      // water soaking out into the grass either side.
      //
      // TILING, and L IS NOT FREE. Three of these butt end to end on the
      // splashpad layout at x -21 / -15 / -9, so the tile is 6.0 long and the
      // number has to be read off that spacing. Authored at 5.0 it left a
      // metre of bare lawn between every pair and the "continuous slick
      // ribbon" the map is built around came out as three separate mats.
      //
      // Nothing may change across the x boundary. The sheet's wavy edge is
      // built from whole harmonics of L, so its last point lands back on its
      // first; every scattered mark is stamped at -L, 0 and +L and clipped, so
      // a mark that walks off one end walks back on at the other. Miss either
      // and the two joins read as hard lines straight across the run.
      const g = new THREE.Group();
      const L = 6.0, SPANZ = 2.5, PX = 120;
      const c = document.createElement('canvas');
      c.width = L * PX; c.height = SPANZ * PX;        // 720 x 300, both exact
      const x = c.getContext('2d');
      const rnd = scatterRng(2828);
      const K = Math.PI * 2 / L;
      const X = u => (u + L / 2) * PX;
      const Z = v => (v + SPANZ / 2) * PX;            // canvas y runs to +z
      const wrapX = fn => { for (const o of [-c.width, 0, c.width]) { x.save(); x.translate(o, 0); fn(); x.restore(); } };
      // Half-widths, as functions of x. s picks which side, so the two edges of
      // the sheet are not mirror images of each other — plastic dragged out of
      // a box does not lie symmetrical. Harmonics are integers ONLY: 2 and 3
      // here, 1 and 3 below. Anything else and the tile stops being periodic.
      const EDGE = (u, s) => 1.06 + 0.05 * Math.sin(K * 2 * u + s) + 0.028 * Math.cos(K * 3 * u + s * 2);
      const MID  = (u, s) => 0.52 + 0.055 * Math.sin(K * u + 0.9 + s) + 0.03 * Math.sin(K * 3 * u - 1.4 + s);
      const band = (f, k) => {                        // closed ribbon from -f to +f
        x.beginPath();
        for (let i = 0; i <= 120; i++) {
          const u = -L / 2 + L * i / 120, px = X(u), pz = Z(f(u, 0) * k);
          i ? x.lineTo(px, pz) : x.moveTo(px, pz);
        }
        for (let i = 120; i >= 0; i--) { const u = -L / 2 + L * i / 120; x.lineTo(X(u), Z(-f(u, 2.1) * k)); }
        x.closePath();
      };
      const ribbon = (off, s) => {                    // open path parallel to one edge
        const sg = s ? -1 : 1;
        x.beginPath();
        for (let i = -8; i <= 128; i++) {             // run past both ends so the
          const u = -L / 2 + L * i / 120;             // joins are drawn, not capped
          const pz = Z(sg * (EDGE(u, s) - off));
          i === -8 ? x.moveTo(X(u), pz) : x.lineTo(X(u), pz);
        }
      };
      x.lineJoin = 'round'; x.lineCap = 'butt';

      // Water soaking into the lawn around the sheet. Wet ground goes DARKER,
      // the rule view.js follows for its sprinkler patches, in the same green.
      band(EDGE, 1.07); x.fillStyle = 'rgba(47,110,58,.45)'; x.fill();
      // The sheet. Near opaque: this is plastic lying on the grass, not paint
      // on it, and at 0.6 alpha the mower stripes read straight through it.
      band(EDGE, 1.0);  x.fillStyle = 'rgba(255,214,74,.95)'; x.fill();
      x.save(); band(EDGE, 1.0); x.clip();            // nothing below spills onto the lawn

      // TWO forms across the width, not four. The lane is ~25px wide on screen
      // at this camera, so a yellow field with one fat blue channel down the
      // middle reads and a striped cross-section of rails and piping does not.
      band(MID, 1.0);  x.fillStyle = 'rgba(52,132,198,.94)'; x.fill();
      // ...and the soaked core inside the channel, which is where the water
      // actually runs. Darker than the blue it sits on, or it is a highlight.
      band(MID, 0.55); x.fillStyle = 'rgba(20,74,124,.6)'; x.fill();

      // Fold creases and the rolled hem, stroked ALONG the ripple rather than
      // as straight bars — a dead-straight line here contradicts the wavy edge
      // 0.2 units away from it and the whole sheet stops looking laid down.
      // The hem is the fatter of the two on purpose; at a matched 0.1 the pair
      // read as one wide smear rather than as a crease beside a rolled edge.
      x.strokeStyle = 'rgba(206,155,38,.32)'; x.lineWidth = 0.07 * PX;
      for (const s of [0, 2.1]) { ribbon(0.26, s); x.stroke(); }
      x.strokeStyle = 'rgba(214,150,30,.5)'; x.lineWidth = 0.12 * PX;
      for (const s of [0, 2.1]) { ribbon(0.04, s); x.stroke(); }

      // Soapy sheen: long flat streaks down the run in the pale blue the ice
      // and the sprinkler splashes already use. One bar down the centre would
      // read as a third painted stripe, so they are broken and off-axis, with
      // a single long one sluicing down the wet core.
      const streak = (u, v, lw, lh, a, fill) => {
        x.fillStyle = fill;
        wrapX(() => {
          x.save(); x.translate(X(u), Z(v)); x.rotate(a);
          x.beginPath(); x.ellipse(0, 0, lw * PX, lh * PX, 0, 0, 7); x.fill();
          x.restore();
        });
      };
      streak(-0.4, -0.06, 1.5, 0.1, 0.015, 'rgba(223,246,255,.36)');
      for (let i = 0; i < 9; i++) {
        streak(-L / 2 + rnd() * L, (rnd() - 0.5) * 1.7,
               0.35 + rnd() * 0.8, 0.05 + rnd() * 0.06, (rnd() - 0.5) * 0.16,
               i % 3 ? 'rgba(223,246,255,.32)' : 'rgba(255,255,255,.24)');
      }
      // Suds, gathered along the channel lip where the water piles up before it
      // spills out onto the dry yellow. An even sprinkle reads as dirt.
      for (let i = 0; i < 28; i++) {
        const u = -L / 2 + rnd() * L;
        const v = (rnd() < 0.5 ? -1 : 1) * (0.46 + rnd() * 0.34);
        const r = (0.055 + rnd() * 0.085) * PX;
        x.fillStyle = `rgba(255,255,255,${0.3 + rnd() * 0.34})`;
        wrapX(() => { x.beginPath(); x.arc(X(u), Z(v), r, 0, 7); x.fill(); });
      }
      x.restore();

      // Bite the rim back out, so the sheet's edge is scuffed down into the
      // grass rather than cut out of it — the mulch bed's trick, and the only
      // thing that stops a 2.5-unit rectangle of alpha looking like a sticker.
      // The gradient is built INSIDE wrapX: a canvas gradient is resolved in
      // whatever transform is current when it paints, so one hoisted out of
      // the loop would erase the untranslated spot three times over.
      x.globalCompositeOperation = 'destination-out';
      for (let i = 0; i < 34; i++) {
        const u = -L / 2 + rnd() * L, sd = rnd() < 0.5;
        const px = X(u), pz = Z((sd ? 1 : -1) * EDGE(u, sd ? 0 : 2.1) * (0.99 + rnd() * 0.14));
        const r = (0.1 + rnd() * 0.26) * PX, a = 0.35 + rnd() * 0.5;
        wrapX(() => {
          const w = x.createRadialGradient(px, pz, 0, px, pz, r);
          w.addColorStop(0, `rgba(0,0,0,${a})`); w.addColorStop(1, 'rgba(0,0,0,0)');
          x.fillStyle = w; x.beginPath(); x.arc(px, pz, r, 0, 7); x.fill();
        });
      }
      x.globalCompositeOperation = 'source-over';

      const t = new THREE.CanvasTexture(c);
      // RepeatWrapping on S so the linear filter at u=0 and u=1 samples across
      // the join instead of smearing the edge texel. T stays clamped — the
      // pattern is periodic along the run only, and wrapping it would fold the
      // grass at one edge onto the grass at the other. The tiles MEET; they
      // must not be overlapped to hide the seam, since two coplanar decals at
      // depthWrite:false just double their alpha and draw it back as a bar.
      t.wrapS = THREE.RepeatWrapping;
      t.anisotropy = 8; t.colorSpace = THREE.SRGBColorSpace;
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(L, SPANZ),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      sheet.rotation.x = -Math.PI / 2;
      // 0.018: clear of the mulch bed's reserved 0.013 and under the tower's
      // own wet apron at 0.028, so the two overlap in the right order.
      sheet.position.y = 0.018;
      g.add(sheet);
      g.traverse(o => o.layers.set(1));               // a surface must not be inked
      return { obj: g };
    }

    // ── Poolside ──────────────────────────────────────────────────
    case 'umbrella': {
      // Circle collider (r 0.9), so hw/hh arrive as the default 1 and there is
      // nothing to derive from them — the sizes live here, the way tetherball
      // and dome do it. If the collider ever moves off 0.9, the paver below is
      // the number to chase.
      //
      // From straight up the canopy IS the prop: pole, base and crank are all
      // hidden under it. So the canopy is built as eight separate flat facets
      // in two alternating colours rather than one smooth cone. Three things
      // fall out of that and all of them are the point: the silhouette becomes
      // an octagon that scallops in between the ribs instead of a clean disc,
      // the colour alternation reads as panels, and the flat normals give the
      // ink pass a normal break to draw, so every seam gets a line for free.
      const g = new THREE.Group();
      const COL_R = 0.9;                                  // == the collider it was authored with
      const CR = 1.3, RIM_Y = 2.30, RISE = 0.44;          // 2.6 across, rim over a 2.2 kid's head
      const APEX = RIM_Y + RISE;
      const PANEL = [0xff8a3d, 0xfffdf5];                 // warm parasol; cyan pool sits under it
      const N = 8;

      // A paving round under the base. It is decoration, but it is honest
      // decoration: it draws the footprint you actually bump into, so the wide
      // canopy overhead never reads as the thing blocking you.
      const paver = new THREE.Mesh(new THREE.CircleGeometry(COL_R, 24),
        new THREE.MeshBasicMaterial({ color: 0xb9b2a4, transparent: true, opacity: 0.78, depthWrite: false }));
      paver.rotation.x = -Math.PI / 2; paver.position.y = 0.014; paver.layers.set(1);
      const pkerb = new THREE.Mesh(new THREE.RingGeometry(COL_R - 0.1, COL_R, 24),
        new THREE.MeshBasicMaterial({ color: 0x9d9a92, transparent: true, opacity: 0.7, depthWrite: false }));
      pkerb.rotation.x = -Math.PI / 2; pkerb.position.y = 0.022; pkerb.layers.set(1);
      g.add(paver, pkerb);

      // weighted base, stepped so it does not read as a hockey puck
      const base = outlined(new THREE.CylinderGeometry(0.58, 0.66, 0.22, 16), 0x4a4740, 0.014);
      base.position.y = 0.11;
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.30, 0.34, 0.12, 12), toon(0x8a939e));
      collar.position.y = 0.28; collar.castShadow = true;
      const pole = outlined(new THREE.CylinderGeometry(0.075, 0.075, 2.86, 10), 0x8a939e, 0.012);
      pole.position.y = 1.45;                             // 0.02 up to 2.88, tip swallowed by the hub
      const crank = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 8), toon(0xffd94a));
      crank.rotation.x = Math.PI / 2; crank.position.set(0, 1.06, 0.09);
      g.add(base, collar, pole, crank);

      // One material per colour, not one per facet: eight cloths and eight rib
      // tips is sixteen MeshToonMaterials and sixteen gradient-map binds for
      // two colours and one grey.
      const CLOTH = PANEL.map(col => {
        const m = toon(col);
        m.side = THREE.DoubleSide;                        // the near rim shows its underside
        return m;
      });
      const TIPM = toon(0x8a939e);

      // Canopy in its own group so the seams can be kicked off the world axes
      // with one number — an octagon squared up to x/z reads as a stop sign.
      const can = new THREE.Group();
      can.rotation.y = 0.19;
      for (let i = 0; i < N; i++) {
        // ConeGeometry with ONE radial segment is a single triangle: apex plus
        // the two rim corners of this panel. computeVertexNormals() is what
        // makes it flat — left on the cone's own smooth normals, the toon ramp
        // steps mid-panel and every facet grows a band across it.
        const geo = new THREE.ConeGeometry(CR, RISE, 1, 1, true, (i / N) * Math.PI * 2, (1 / N) * Math.PI * 2);
        geo.computeVertexNormals();
        const p = new THREE.Mesh(geo, CLOTH[i % 2]);
        p.position.y = (RIM_Y + APEX) / 2;
        p.castShadow = true; p.receiveShadow = true;
        can.add(p);
        // Rib tip at the corner the two panels share — the bead that makes the
        // scallop between them read as an edge and not as a modelling mistake.
        // sin for x and cos for z is not a slip: three lays a cylinder's theta
        // out as x = r sinT, z = r cosT, so this is the panel's own corner.
        const a = (i / N) * Math.PI * 2;
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), TIPM);
        tip.position.set(Math.sin(a) * CR, RIM_Y, Math.cos(a) * CR);
        can.add(tip);
      }
      g.add(can);

      // Eight cone apexes land on the same point, so cap them or the crown is a
      // knot of z-fighting triangles — the same job the dome's hub does.
      const hub = outlined(new THREE.SphereGeometry(0.17, 12, 10), 0x8a939e, 0.012);
      hub.position.y = APEX;
      const finial = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), toon(0xffd94a));
      finial.position.y = APEX + 0.19; finial.castShadow = true;
      g.add(hub, finial);
      return { obj: g };
    }
    case 'towelrack': {
      // Low box collider (1.4 x 0.45, hurdleable), so the rail sits at 1.0 and
      // the hems stop well short of the grass: from any angle this has to look
      // like something you clear, not something you go round.
      //
      // Gauges are all one step fatter than the ironmongery would really be. A
      // 2.2-unit kid is ~45px here, so a unit is ~20px and the 0.045 pipe this
      // was drawn with came out under a pixel — the towels hung off nothing.
      const g = new THREE.Group();
      const RAIL = 1.0, FOLD = 0.13;                      // rail height, and the cloth's radius over it
      const DROP = 0.64, BOW = 0.20;                      // fall of a towel, and how far its hem swings out
      const px = hw - 0.14;                               // post centres, inside the box
      const STEEL = 0x8a939e;

      // A hanging cloth. An open cylinder shell whose axis is laid along x, so
      // it is dead straight across the rail and curves only as it falls — the
      // tunnel's shell trick, solved for the drop and bow you ask for rather
      // than a radius you guess. Hung as a tilted slab instead, a towel reads
      // as painted plywood, and hung dead vertical it reads as a flag.
      //   R and the arc come from putting the top edge and the hem on one
      //   circle: R sin a = DROP, R (1 - cos a) = BOW.
      const drape = (w, drop, mat) => {
        const R = (drop * drop + BOW * BOW) / (2 * BOW);
        const a = Math.atan2(drop, R - BOW);
        const geo = new THREE.CylinderGeometry(R, R, w, 6, 1, true, 0, a);
        geo.rotateZ(Math.PI / 2);
        geo.translate(0, -R * Math.sin(a), -R * Math.cos(a));   // hang the TOP edge off the origin
        const m = new THREE.Mesh(geo, mat);
        m.castShadow = true; m.receiveShadow = true;
        return m;
      };

      // frame: two posts on foot bars, the rail, and a stretcher low enough to
      // stay visible under the hems
      for (const sx of [-1, 1]) {
        const post = outlined(new THREE.CylinderGeometry(0.07, 0.07, RAIL, 8), STEEL, 0.012);
        post.position.set(sx * px, RAIL / 2, 0);
        // rbox grows by 2r in w and h but NOT in d — the extrude already spends
        // its bevel inside the depth you asked for. Subtract on the first two
        // arguments only, or the feet stick out of the collider on z.
        const foot = outlined(rbox(0.14 - 0.04, 0.09 - 0.04, hh * 2 - 0.14, 0.02), 0x4a4740, 0.01);
        foot.position.set(sx * px, 0.045, 0);
        g.add(post, foot);
      }
      const rail = outlined(new THREE.CylinderGeometry(0.07, 0.07, hw * 2 - 0.12, 8), STEEL, 0.012);
      rail.position.y = RAIL; rail.rotation.z = Math.PI / 2;
      const stretch = outlined(new THREE.CylinderGeometry(0.055, 0.055, px * 2, 6), STEEL, 0.01);
      stretch.position.y = 0.30; stretch.rotation.z = Math.PI / 2;
      g.add(rail, stretch);

      // towels, spaced so the rail shows through between them
      const CLOTH = [[0x59c8e0, 0x3fa4c4], [0xff6bb5, 0xd94e91], [0xffd94a, 0xe0b02e]];
      const n = Math.max(2, Math.round(hw * 2));
      const span = px * 2 - 0.1, pitch = span / n, tw = pitch * 0.86;
      for (let i = 0; i < n; i++) {
        const [col, hemCol] = CLOTH[i % CLOTH.length];
        // A rack folded to the millimetre reads as a shop display, so no two
        // towels share a drop, a height or a heading.
        const dr = DROP + Math.sin(i * 1.9) * 0.06;
        const t = new THREE.Group();
        t.position.set(-span / 2 + (i + 0.5) * pitch, Math.sin(i * 1.7) * 0.02, 0);
        t.rotation.y = Math.sin(i * 2.3) * 0.06;
        const cloth = toon(col);
        cloth.side = THREE.DoubleSide;                    // you see the inside face of the far panel
        const hemMat = toon(hemCol);
        // the fold: a half shell arcing +z, over the top, to -z, sitting clear
        // of the 0.07 rail so it reads as thick terry and not shrink wrap
        const foldGeo = new THREE.CylinderGeometry(FOLD, FOLD, tw, 10, 1, true, 0, Math.PI);
        foldGeo.rotateZ(Math.PI / 2);
        const fold = new THREE.Mesh(foldGeo, cloth);
        fold.position.y = RAIL; fold.castShadow = true; fold.receiveShadow = true;
        t.add(fold);
        for (const sz of [1, -1]) {
          // the drape hangs from exactly where the fold ends, so the two meet
          // on one line instead of overlapping into a lump
          const panel = drape(tw, dr, cloth);
          panel.position.set(0, RAIL, sz * FOLD);
          if (sz < 0) panel.rotation.y = Math.PI;
          // 0.12 across. The hem is the only saturated accent on the bottom
          // half of this prop and at 0.09 it was a pixel and a half — the
          // towels ended in a soft fade instead of a band.
          const hem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, tw, 6), hemMat);
          hem.rotation.z = Math.PI / 2;
          hem.position.set(0, RAIL - dr, sz * (FOLD + BOW));
          hem.castShadow = true;
          t.add(panel, hem);
        }
        g.add(t);
      }
      return { obj: g };
    }
    case 'deckrail': {
      // A solid wall you go round, and the whole difficulty is that a bare
      // post-and-rail is a 0.3-wide line from this camera — it reads as a crack
      // in the grass, not as cover. So the section brings its own decking: the
      // planks widen the top-down silhouette to something you can see and steer
      // around, and they say "deck" before any of the joinery is legible.
      // No balusters. They are invisible from up here and they turn the one
      // clean band into fifty pixels of moire.
      const g = new THREE.Group();
      const W = hw * 2, D = hh * 2;
      const DECK_D = Math.min(0.72, D - 0.28);            // grass margin either side
      const NEW_X = hw - 0.24;                            // newels; their 0.46 cap lands on hw
      const inner = NEW_X - 0.19;                         // newel inner faces
      const CAP_Y = 1.04;                                 // cap board 0.98..1.10

      // deck: a dark rim slab with brighter planks laid inside it, so the seam
      // and the edge are the same object. rbox is 2r bigger than its numbers,
      // which is why the slab asks for W - 0.06 to land on the collider.
      const rim = outlined(rbox(W - 0.06, 0.20 - 0.06, DECK_D, 0.03), 0x7a4e2e, 0.014);
      rim.position.y = 0.10;
      g.add(rim);
      // Strict alternation, and only half a shade apart. Scattering a few darks
      // over a light field instead — the fence's own trick — reads as four
      // stains rather than as boards, and any wider colour gap turns the deck
      // into a chessboard that pulls the eye off the rail. Two materials, not
      // one per plank: a 6.8-wide section lays twelve of them.
      const BOARD = [toon(0x9c7b4e), toon(0xa8894f)];
      const nPl = Math.max(4, Math.round(W / 0.58));
      const pw = (W - 0.08) / nPl;
      const plGeo = new THREE.BoxGeometry(pw, 0.06, DECK_D - 0.1);
      for (let i = 0; i < nPl; i++) {
        const pl = new THREE.Mesh(plGeo, BOARD[i % 2]);
        pl.position.set(-(W - 0.08) / 2 + (i + 0.5) * pw, 0.22, 0);
        pl.castShadow = true; pl.receiveShadow = true;
        g.add(pl);
      }

      // posts, seated 0.07 into the decking so none of them floats
      for (const sx of [-1, 1]) {
        const newel = outlined(rbox(0.38 - 0.06, 1.00 - 0.06, 0.38, 0.03), 0xb07a42, 0.014);
        newel.position.set(sx * NEW_X, 0.68, 0);          // 0.18 .. 1.18, proud of the cap
        const cap = outlined(rbox(0.46 - 0.06, 0.10 - 0.06, 0.46, 0.03), 0x9c7b4e, 0.012);
        cap.position.set(sx * NEW_X, 1.23, 0);
        g.add(newel, cap);
      }
      const bays = Math.max(2, Math.round(inner * 2 / 1.6));
      for (let i = 1; i < bays; i++) {
        // 0.18 .. 1.04, so the head runs UP INTO the cap board rather than
        // stopping dead on its underside. Topped out at exactly 0.98 the post
        // cap and the rail soffit were coplanar, which is a z-fight waiting
        // for the first camera angle that can see under the rail.
        const post = outlined(rbox(0.26 - 0.06, 0.86 - 0.06, 0.26, 0.03), 0xb07a42, 0.014);
        post.position.set((i / bays - 0.5) * inner * 2, 0.61, 0);
        g.add(post);
      }

      // Cap board is the only part of this that survives the far camera, so it
      // gets the lightest wood in the set and the most depth — it is the line
      // that has to say "barrier" on its own.
      const capr = outlined(rbox(inner * 2 + 0.12 - 0.06, 0.12 - 0.06, 0.34, 0.03), 0xc9a066, 0.014);
      capr.position.y = CAP_Y;
      g.add(capr);
      for (const y of [0.44, 0.72]) {
        const r2 = outlined(rbox(inner * 2 + 0.12 - 0.05, 0.14 - 0.05, 0.16, 0.025), 0xb07a42, 0.012);
        r2.position.y = y;
        g.add(r2);
      }
      return { obj: g };
    }
    case 'hosereel': {
      // No collider at all, so hw/hh arrive as the default 1 and mean nothing —
      // everything here is hardcoded, and it is all kept low and small on
      // purpose: you run straight through this and it must never look like
      // something that should have stopped you.
      // Built as a ground caddy rather than a wall reel. Nothing on any map
      // guarantees a wall behind the prop, and a bracket plate hanging off
      // nothing is worse than no bracket at all.
      const g = new THREE.Group();
      const AXLE = 0.50;                                  // drum centre height
      const HOSE = 0x3f7f4a, HOSE2 = 0x4f8f38;
      const LIE = 0.09;                                   // how high the loose hose lies

      const foot = outlined(rbox(0.74 - 0.06, 0.10 - 0.06, 0.48, 0.03), 0x4a4740, 0.012);
      foot.position.y = 0.05;
      g.add(foot);
      for (const sx of [-1, 1]) {
        const leg = outlined(rbox(0.10 - 0.04, 0.48 - 0.04, 0.30, 0.02), 0x2f5fb3, 0.012);
        leg.position.set(sx * 0.32, 0.29, 0);             // 0.05 up to the axle
        g.add(leg);
      }
      const axle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.90, 8), toon(0x8a939e));
      axle.rotation.z = Math.PI / 2; axle.position.y = AXLE; axle.castShadow = true;
      g.add(axle);
      for (const sx of [-1, 1]) {
        const cheek = outlined(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 16), 0x2f5fb3, 0.012);
        cheek.rotation.z = Math.PI / 2; cheek.position.set(sx * 0.20, AXLE, 0);
        g.add(cheek);
      }
      // The coil is five separate wraps, not one green cylinder: the ridges
      // between them are the only thing that says "wound hose", and they are
      // still there when the drum is six pixels wide. rotation.y turns a torus
      // that is born in the XY plane onto the axle's own x axis.
      for (let i = 0; i < 5; i++) {
        // 0.065: the same gauge as the loose end below. Wound thinner than it
        // unspools, the drum reads as string and the hose as a different object.
        const wrap = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.065, 6, 16), toon(i % 2 ? HOSE2 : HOSE));
        wrap.rotation.y = Math.PI / 2; wrap.position.set((i - 2) * 0.068, AXLE, 0);
        wrap.castShadow = true;
        g.add(wrap);
      }
      // crank, outboard of the frame so it does not grow through a leg
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.24, 0.08), toon(0x8a939e));
      arm.position.set(0.41, AXLE + 0.11, 0); arm.castShadow = true;
      const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), toon(0xffd94a));
      grip.rotation.z = Math.PI / 2; grip.position.set(0.47, AXLE + 0.22, 0);
      g.add(arm, grip);

      // The loose end is what actually carries this prop from above — the reel
      // is a 0.6 blob, the hose is a two-metre green line lying on the grass.
      // One swept tube rather than a chain of cylinders: the joints in a chain
      // pop as facets at every bend and a hose has no elbows. It lies at 0.09
      // rather than 0.07 so the 0.065 tube keeps its belly off the ground even
      // where the spline undershoots between control points.
      const path = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.00, AXLE - 0.20, 0.26),
        new THREE.Vector3(0.14, 0.17, 0.50),
        new THREE.Vector3(0.46, LIE, 0.76),
        new THREE.Vector3(0.98, LIE, 0.82),
        new THREE.Vector3(1.40, LIE, 0.52),
        new THREE.Vector3(1.66, LIE, 0.24),
        new THREE.Vector3(1.90, LIE, 0.02),
      ]);
      const loose = new THREE.Mesh(new THREE.TubeGeometry(path, 40, 0.065, 8, false), toon(HOSE));
      loose.castShadow = true; loose.receiveShadow = true;
      g.add(loose);
      // Nozzle laid ON the line the hose arrives on, not near it — and the yaw
      // is READ OFF THE CURVE rather than typed in. Hand-picked, it was 0.46
      // against the spline's actual 0.74 and the gun sat sixteen degrees out:
      // a bright yellow stub floating beside its own hose. Ask the curve and
      // moving a control point can never break it again.
      const tip = path.getPoint(1), dir = path.getTangent(1);
      const YAW = Math.atan2(-dir.z, dir.x);
      const dx = Math.cos(YAW), dz = -Math.sin(YAW);
      // rotation.set(0, YAW, -PI/2) in XYZ order lays the cylinder's y axis
      // onto +x first, then swings it to (dx, 0, dz) — the same unit vector
      // both parts step along, so the collar butts the tube's end cap and the
      // gun runs straight out of it.
      const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.1, 8), toon(0xe0452f));
      collar.rotation.set(0, YAW, -Math.PI / 2);
      collar.position.set(tip.x + dx * 0.05, LIE, tip.z + dz * 0.05);
      const nozzle = outlined(new THREE.CylinderGeometry(0.055, 0.08, 0.26, 8), 0xffd94a, 0.012);
      nozzle.rotation.set(0, YAW, -Math.PI / 2);
      nozzle.position.set(tip.x + dx * 0.23, LIE, tip.z + dz * 0.23);
      g.add(collar, nozzle);
      // it has been dripping: wet lawn, darker, in the sprinklers' own green
      const damp = new THREE.Mesh(new THREE.CircleGeometry(0.52, 18),
        new THREE.MeshBasicMaterial({ color: 0x2f6e3a, transparent: true, opacity: 0.32, depthWrite: false }));
      damp.rotation.x = -Math.PI / 2;
      damp.position.set(tip.x + dx * 0.52, 0.014, tip.z + dz * 0.52);
      damp.scale.set(1, 0.8, 1); damp.layers.set(1);
      g.add(damp);
      return { obj: g };
    }
    // ── The Winter Yard ───────────────────────────────────────────
    case 'icepond': {
      // The pond is a bet, not a wall: wide, flat and readable from across the
      // yard so you can see the committed line you are about to take.
      const g = new THREE.Group();
      const ice = new THREE.Mesh(new THREE.CircleGeometry(4.6, 40), toon(0xbfe4f2));
      ice.rotation.x = -Math.PI / 2; ice.position.y = 0.022; ice.receiveShadow = true;
      const sheen = new THREE.Mesh(new THREE.CircleGeometry(3.4, 32),
        new THREE.MeshBasicMaterial({ color: 0xeafaff, transparent: true, opacity: 0.4, depthWrite: false }));
      sheen.rotation.x = -Math.PI / 2; sheen.position.y = 0.03; sheen.layers.set(1);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(4.6, 0.16, 8, 44), toon(0xf2fbff));
      rim.rotation.x = Math.PI / 2; rim.position.y = 0.06;
      g.add(ice, sheen, rim);
      // cracks, drawn as thin dark slivers rather than textured in
      for (let i = 0; i < 7; i++) {
        const a0 = (i / 7) * Math.PI * 2 + 0.4;
        const len = 1.6 + (i % 3) * 0.9;
        const cr = new THREE.Mesh(new THREE.BoxGeometry(len, 0.01, 0.05),
          new THREE.MeshBasicMaterial({ color: 0x8fc2d6, transparent: true, opacity: 0.55, depthWrite: false }));
        cr.position.set(Math.cos(a0) * 1.7, 0.034, Math.sin(a0) * 1.7);
        cr.rotation.y = -a0 + 0.6; cr.layers.set(1);
        g.add(cr);
      }
      return { obj: g };
    }
    case 'snowfort': {
      // packed blocks with a crenellated top — cover you shoot over, not through
      const g = new THREE.Group();
      const W = hw * 2, D = hh * 2;
      const wall = outlined(rbox(W, 0.92, D, 0.14), 0xf4fbff, 0.014);
      wall.position.y = 0.46;
      g.add(wall);
      const n = Math.max(2, Math.round(D / 0.9));
      for (let i = 0; i < n; i++) {
        if (i % 2) continue;
        const b = outlined(rbox(W * 0.92, 0.3, D / n * 0.8, 0.08), 0xffffff, 0.012);
        b.position.set(0, 1.06, -D / 2 + (i + 0.5) * (D / n));
        g.add(b);
      }
      return { obj: g };
    }
    case 'snowbank': {
      // the plough ridge: a long rounded mound, dirty at the base like real snow
      const g = new THREE.Group();
      const W = hw * 2, D = hh * 2;
      const body = outlined(rbox(W, 0.86, D, 0.42), 0xf2f9ff, 0.014);
      body.position.y = 0.4; body.scale.y = 0.95;
      const grit = new THREE.Mesh(rbox(W * 0.98, 0.2, D * 0.98, 0.24), toon(0xd9dee2));
      grit.position.y = 0.1;
      g.add(grit, body);
      return { obj: g };
    }
    case 'snowman': {
      const g = new THREE.Group();
      const base = outlined(new THREE.SphereGeometry(0.62, 14, 12), 0xffffff, 0.014); base.position.y = 0.58;
      const mid  = outlined(new THREE.SphereGeometry(0.46, 14, 12), 0xfdfeff, 0.013); mid.position.y = 1.36;
      const head = outlined(new THREE.SphereGeometry(0.34, 14, 12), 0xffffff, 0.012); head.position.y = 1.96;
      // same face language as the kids: black dots, one catchlight, nothing more
      for (const sx of [-0.13, 0.13]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), toon(0x1a1714));
        eye.position.set(sx, 2.03, 0.29); g.add(eye);
      }
      const nose = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.34, 8), toon(0xf08a2e));
      nose.position.set(0, 1.94, 0.36); nose.rotation.x = Math.PI / 2;
      const hat = outlined(new THREE.CylinderGeometry(0.26, 0.28, 0.34, 12), 0x2a2622, 0.012); hat.position.y = 2.36;
      const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.05, 14), toon(0x2a2622)); brim.position.y = 2.2;
      for (const s of [-1, 1]) {
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.9, 6), toon(0x6b4a2c));
        arm.position.set(s * 0.5, 1.42, 0); arm.rotation.z = s * 0.9; g.add(arm);
      }
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), toon(0x2a2622));
        b.position.set(0, 1.5 - i * 0.24, 0.44); g.add(b);
      }
      g.add(base, mid, head, nose, hat, brim);
      return { obj: g };
    }
    case 'sledramp': {
      // packed snow kicker — a wedge, so it reads as directional from above
      const g = new THREE.Group();
      const wedge = outlined(rbox(3.0, 1.0, 2.6, 0.22), 0xf6fbff, 0.014);
      wedge.position.set(0, 0.42, 0); wedge.rotation.z = -0.26;
      const lip = new THREE.Mesh(rbox(0.7, 0.16, 2.6, 0.08), toon(0xe6f1f8));
      lip.position.set(1.5, 0.86, 0);
      const track = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.1),
        new THREE.MeshBasicMaterial({ color: 0xd4e6f0, transparent: true, opacity: 0.5, depthWrite: false }));
      track.rotation.x = -Math.PI / 2; track.position.set(-2.4, 0.03, 0); track.layers.set(1);
      g.add(wedge, lip, track);
      return { obj: g };
    }
    case 'baretree': {
      const g = new THREE.Group();
      const trunk = outlined(new THREE.CylinderGeometry(0.34, 0.5, 2.8, 9), 0x6d5237, 0.016);
      trunk.position.y = 1.4;
      g.add(trunk);
      const rnd = scatterRng(77);
      for (let i = 0; i < 7; i++) {
        const a0 = (i / 7) * Math.PI * 2 + rnd();
        const len = 1.1 + rnd() * 1.0;
        const br = outlined(new THREE.CylinderGeometry(0.07, 0.12, len, 6), 0x6d5237, 0.012);
        br.position.set(Math.cos(a0) * 0.45, 2.5 + i * 0.16, Math.sin(a0) * 0.45);
        br.rotation.set(Math.sin(a0) * 0.85, 0, -Math.cos(a0) * 0.85);
        // Snow on the limb, placed at the branch's ACTUAL end. The old guess
        // used a fixed height for every branch, so half the caps hovered in
        // the air beside the wood — very visible in first person.
        const tip = new THREE.Vector3(0, len * 0.42, 0).applyEuler(br.rotation).add(br.position);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), toon(0xffffff));
        cap.position.set(tip.x, tip.y + 0.07, tip.z);
        cap.scale.set(1.5, 0.55, 1.5);
        g.add(br, cap);
      }
      return { obj: g };
    }
    case 'firepit': {
      const g = new THREE.Group();
      for (let i = 0; i < 9; i++) {
        const a0 = (i / 9) * Math.PI * 2;
        const st = outlined(new THREE.SphereGeometry(0.24, 8, 7), i % 2 ? 0x8d8880 : 0x736e67, 0.012);
        st.position.set(Math.cos(a0) * 1.0, 0.16, Math.sin(a0) * 1.0);
        st.scale.set(1.2, 0.8, 1.1);
        g.add(st);
      }
      const ash = new THREE.Mesh(new THREE.CircleGeometry(0.86, 18), toon(0x4a453f));
      ash.rotation.x = -Math.PI / 2; ash.position.y = 0.03;
      for (const [lx, lz, ry] of [[0, 0, 0.4], [0.1, 0.1, -0.9], [-0.1, 0.05, 1.9]]) {
        const log = outlined(new THREE.CylinderGeometry(0.13, 0.15, 1.3, 7), 0x5c4530, 0.012);
        log.position.set(lx, 0.2, lz); log.rotation.set(0, ry, Math.PI / 2 - 0.14);
        g.add(log);
      }
      // a small warm flame — the only hot colour on the map, so it reads as a landmark
      const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 8),
        new THREE.MeshBasicMaterial({ color: 0xffb03a, transparent: true, opacity: 0.85, depthWrite: false }));
      flame.position.y = 0.66; flame.layers.set(1);
      g.add(ash, flame);
      return { obj: g };
    }
    case 'sledpile': {
      const g = new THREE.Group();
      const W = hw * 2, D = hh * 2;
      for (let i = 0; i < 3; i++) {
        const sled = outlined(rbox(W * 0.86, 0.14, D * 0.72, 0.06),
          [0xe0452f, 0x3d7dff, 0xffd94a][i], 0.012);
        sled.position.set((i - 1) * 0.14, 0.14 + i * 0.19, (i - 1) * 0.1);
        sled.rotation.set(0.1 * (i - 1), i * 0.28, -0.06);
        g.add(sled);
      }
      return { obj: g };
    }
    case 'snowballs': {
      const g = new THREE.Group();
      const at = [[0,0],[0.34,0],[0.17,0.3],[0.17,0.1]];
      at.forEach(([px, pz], i) => {
        const b = outlined(new THREE.SphereGeometry(0.19, 10, 8), 0xffffff, 0.011);
        b.position.set(px - 0.17, i === 3 ? 0.5 : 0.19, pz - 0.13);
        g.add(b);
      });
      return { obj: g };
    }
    case 'bench': {
      const g = new THREE.Group();
      const seat = outlined(new THREE.BoxGeometry(3.2, 0.12, 0.5), 0xb07a42, 0.014); seat.position.y = 0.5;
      const back = outlined(new THREE.BoxGeometry(3.2, 0.12, 0.5), 0xb07a42, 0.014); back.position.set(0, 0.95, -0.35); back.rotation.x = 1.2;
      for (const dx of [-1.3, 1.3]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.5, 0.5), toon(0x6f6a62)); leg.position.set(dx, 0.25, 0); g.add(leg);
      }
      g.add(seat, back);
      return { obj: g };
    }
    case 'goalpost': {
      const g = new THREE.Group();
      const mat = toon(0xffd94a);
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.6, 8), mat); post.position.y = 1.3;
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 5.2, 8), mat); bar.position.y = 2.6; bar.rotation.x = Math.PI / 2;
      for (const dz of [-2.6, 2.6]) { const up = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), mat); up.position.set(0, 4.2, dz); g.add(up); }
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.4, 8), toon(0x2f5fb3)); pad.position.y = 0.7;
      g.add(post, bar, pad);
      return { obj: g };
    }
    case 'tee': {
      const g = new THREE.Group();
      const tee = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 0.2, 8), toon(0x3a3a3a)); tee.position.y = 0.1;
      const ball = outlined(new THREE.SphereGeometry(0.3, 12, 10), 0x8a5a35, 0.014); ball.position.y = 0.5; ball.scale.set(1, 1, 1.5); ball.rotation.y = 0.4;
      const lace = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 0.3), toon(0xfffdf5)); lace.position.y = 0.8;
      g.add(tee, ball, lace);
      return { obj: g };
    }
    case 'hoop': {
      const g = new THREE.Group();
      const base = outlined(new THREE.BoxGeometry(1.3, 0.5, 1.0), 0x3a3a3a, 0.016); base.position.y = 0.25;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.4, 8), toon(0x6f6a62)); pole.position.y = 1.9;
      const board = outlined(new THREE.BoxGeometry(0.12, 1.3, 2.0), 0xfffdf5, 0.014); board.position.set(0.5, 3.5, 0);
      const boardBox = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.55, 0.8), toon(0xe04848)); boardBox.position.set(0.5, 3.3, 0);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.04, 8, 20), toon(0xff8a3d)); rim.position.set(0.95, 3.05, 0); rim.rotation.x = Math.PI / 2;
      const net = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.22, 0.5, 10, 1, true), new THREE.MeshToonMaterial({ color: 0xfffdf5, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
      net.position.set(0.95, 2.8, 0);
      g.add(base, pole, board, boardBox, rim, net);
      return { obj: g };
    }
    case 'rack': {
      const g = new THREE.Group();
      const frame = outlined(new THREE.BoxGeometry(2.6, 0.12, 1.0), 0x6f6a62, 0.014); frame.position.y = 0.3;
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 1.0), toon(0x6f6a62)); top.position.y = 1.1;
      for (const [dx, dz] of [[-1.1, -0.25], [-1.1, 0.25], [1.1, -0.25], [1.1, 0.25]]) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.1, 6), toon(0x6f6a62)); leg.position.set(dx, 0.55, dz); g.add(leg); }
      for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), toon(i % 2 ? 0xff8a3d : 0xe07a30)); b.position.set(-0.95 + i * 0.63, 0.66, 0); g.add(b); }
      g.add(frame, top);
      return { obj: g };
    }
    case 'matstack': {
      const g = new THREE.Group();
      const cols = [0x2f5fb3, 0xe04848, 0x2f5fb3];
      for (let i = 0; i < 3; i++) {
        const m = outlined(new THREE.BoxGeometry(hw * 2 || 3.0, 0.3, hh * 2 || 2.0), cols[i], 0.014);
        m.position.set((i % 2) * 0.1, 0.15 + i * 0.32, 0); m.rotation.y = (i - 1) * 0.04; g.add(m);
      }
      return { obj: g };
    }
    case 'scooter': {
      const g = new THREE.Group();
      const deck = outlined(new THREE.BoxGeometry(0.6, 0.08, 0.6), 0x59c8e0, 0.012); deck.position.y = 0.12;
      for (const [dx, dz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8), toon(0x3a3a3a)); wh.position.set(dx, 0.05, dz); wh.rotation.x = Math.PI / 2; g.add(wh); }
      g.add(deck); g.rotation.y = 0.6;
      return { obj: g };
    }
    case 'centerlogo': {
      const g = new THREE.Group();
      const star = new THREE.Mesh(new THREE.CircleGeometry(1.1, 5), new THREE.MeshBasicMaterial({ color: 0xffd94a, transparent: true, opacity: 0.75 }));
      star.rotation.x = -Math.PI / 2; star.position.y = 0.018;
      g.add(star);
      return { obj: g };
    }
    case 'ball': {
      const g = new THREE.Group();
      const b = outlined(new THREE.SphereGeometry(0.5, 16, 12), 0xff9c3d);
      b.position.y = 0.5;
      // kickball seams
      for (const rot of [0, Math.PI/2]) {
        const seam = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.018, 6, 24), toon(0xd97a20));
        seam.position.y = 0.5; seam.rotation.y = rot; seam.rotation.x = 0.4;
        g.add(seam);
      }
      g.add(b);
      return { obj: g };   // pure decoration - run right through it
    }
  }
}

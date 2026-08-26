import * as THREE from 'three';
import { CFG, TEAMS } from './config.js';
import { toon, outlined, rbox, grassTexture, scatterRng } from './art.js';
import { makeChar, animChar } from './chars.js';
import { diamond, moundPos, posts, isFair } from './kickball.js';

// ─────────────────────────────────────────────────────────────
// Kickball presentation. Same rule as the CTF view: the sim never learns
// this file exists. Builds the sandlot diamond, and syncs actors + the one
// entity in this game that has a height axis — the ball.
// ─────────────────────────────────────────────────────────────
let sandlotGrass = null;
export function buildSandlot(scene) {
  const root = new THREE.Group();
  scene.add(root);
  const F = CFG.field;
  const B = diamond(), M = moundPos();

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(F.w + 110, F.h + 110),
    new THREE.MeshToonMaterial({ map: sandlotGrass ??= grassTexture() }));   // one texture, not one per rematch
  ground.rotation.x = -Math.PI/2; ground.receiveShadow = true;
  root.add(ground);

  // A plane laid flat with geometry.rotateX(-90) has its height axis along
  // world -Z, so pointing it down a direction (dx,dz) means rotation.y =
  // atan2(-dx, -dz). Getting this wrong is what turns a diamond into an X.
  const flatStrip = (w, len) => { const g = new THREE.PlaneGeometry(w, len); g.rotateX(-Math.PI/2); return g; };
  const aimY = (dx, dz) => Math.atan2(-dx, -dz);

  const dirtMat = new THREE.MeshToonMaterial({ color: 0xc99a64 });
  const home = B[0];

  // Sandlot infield: worn dirt at each bag and along the paths, grass
  // everywhere else. No manicured diamond — kids made this.
  for (const b of B) {
    const patch = new THREE.Mesh(new THREE.CircleGeometry(2.3, 24), dirtMat);
    patch.rotation.x = -Math.PI/2; patch.position.set(b.x, 0.014, b.z);
    root.add(patch);
  }

  // base paths
  for (let i = 0; i < 4; i++) {
    const a = B[i], b = B[(i + 1) % 4];
    const dx = b.x - a.x, dz = b.z - a.z;
    const len = Math.hypot(dx, dz);
    const path = new THREE.Mesh(flatStrip(1.4, len), dirtMat);
    path.position.set((a.x + b.x)/2, 0.024, (a.z + b.z)/2);
    path.rotation.y = aimY(dx, dz);
    root.add(path);
  }

  // mound
  const mound = new THREE.Mesh(new THREE.CircleGeometry(2.0, 32), dirtMat);
  mound.rotation.x = -Math.PI/2; mound.position.set(M.x, 0.03, M.z);
  const rubber = new THREE.Mesh(rbox(1.0, 0.06, 0.26, 0.02), toon(0xfffdf5));
  rubber.position.set(M.x, 0.06, M.z);
  root.add(mound, rubber);

  // bases
  const plate = new THREE.Mesh(new THREE.CircleGeometry(0.8, 5), toon(0xfffdf5));
  plate.rotation.x = -Math.PI/2; plate.position.set(home.x, 0.04, home.z);
  root.add(plate);
  const bags = [];
  for (let i = 1; i < 4; i++) {
    const bag = outlined(rbox(1.15, 0.16, 1.15, 0.05), 0xfffdf5, 0.012);
    bag.position.set(B[i].x, 0.09, B[i].z); bag.rotation.y = Math.PI/4;
    root.add(bag); bags.push(bag);
  }

  // foul lines run home -> 1st and home -> 3rd, extended to the fence
  const lineMat = new THREE.MeshBasicMaterial({ color: 0xfffdf5 });
  const FOUL = 34;
  for (const s of [1, -1]) {
    const dx = s * Math.SQRT1_2, dz = -Math.SQRT1_2;
    const line = new THREE.Mesh(flatStrip(0.22, FOUL), lineMat);
    line.position.set(home.x + dx * FOUL/2, 0.03, home.z + dz * FOUL/2);
    line.rotation.y = aimY(dx, dz);
    root.add(line);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 6, 12), toon(0xffd94a));
    pole.position.set(home.x + dx * FOUL, 3, home.z + dz * FOUL);
    root.add(pole);
  }

  // outfield fence: an arc centred on home, sweeping behind second base
  const R = 33;
  for (let i = 0; i <= 44; i++) {
    const ang = Math.PI * 0.75 + (i / 44) * Math.PI * 0.5;      // 135° .. 225°
    const x = home.x + Math.sin(ang) * R, z = home.z + Math.cos(ang) * R;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.7, 0.16), toon(i % 2 ? 0x3f8c34 : 0x479a3b));
    panel.position.set(x, 0.85, z);
    panel.rotation.y = ang;
    panel.castShadow = true;
    root.add(panel);
  }

  // backstop: BEHIND the plate, on the camera side
  for (let i = 0; i <= 14; i++) {
    const ang = -Math.PI * 0.42 + (i / 14) * Math.PI * 0.84;    // hugs +z
    const x = home.x + Math.sin(ang) * 6.5, z = home.z + Math.cos(ang) * 6.5;
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.2, 0.14), toon(0x8a939e));
    p.position.set(x, 1.6, z);
    root.add(p);
  }

  // fielding stations, faint
  for (const p of posts()) {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.7, 0.85, 20),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 }));
    m.rotation.x = -Math.PI/2; m.position.set(p.x, 0.02, p.z);
    root.add(m);
  }

  return { root, bags, colliders: [], fx: null, map: 'sandlot', ground,
           dispose() {
             scene.remove(root);
             root.traverse(o => {
               if (o.geometry) o.geometry.dispose?.();
               for (const m of (Array.isArray(o.material) ? o.material : [o.material])) {
                 if (!m) continue;
                 if (m.map && m.map !== sandlotGrass) m.map.dispose?.();
                 m.dispose?.();
               }
             });
           } };
}

let kickRoot = null, kickScene = null;
export function detachKickView() {
  if (!kickRoot) return;
  kickScene.remove(kickRoot);
  kickRoot.traverse(o => {
    if (o.geometry) o.geometry.dispose?.();
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m?.dispose?.();
  });
  kickRoot = null; kickScene = null;
}

export function attachKickView(G, scene) {
  detachKickView();
  kickScene = scene;
  const vroot = kickRoot = new THREE.Group();
  scene.add(vroot);
  
  for (const a of G.actors) {
    a.mesh = makeChar(a.team, a.variant ?? 0, a.kit || 'runner');
    vroot.add(a.mesh);
  }
  // the ball: a real height axis, plus a shadow that tracks it
  const ball = new THREE.Group();
  const skin = outlined(new THREE.SphereGeometry(0.34, 20, 16), 0xff9c3d, 0.014);
  for (const rot of [0, Math.PI/2]) {
    const seam = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 6, 26), toon(0xd97a20));
    seam.rotation.y = rot; seam.rotation.x = 0.4;
    ball.add(seam);
  }
  ball.add(skin);
  vroot.add(ball);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.34, 20),
    new THREE.MeshBasicMaterial({ color: 0x2a1a12, transparent: true, opacity: 0.32 }));
  shadow.rotation.x = -Math.PI/2; shadow.position.y = 0.02;
  vroot.add(shadow);

  // ghost runners: outline-only figures on the bags
  const ghosts = [];
  for (let i = 0; i < 3; i++) {
    const g = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 0.9, 6, 14),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, wireframe: true }));
    g.visible = false; vroot.add(g); ghosts.push(g);
  }
  // "you are here" — control hands off constantly in this mode, so it has
  // to be unmissable
  const mark = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.78, 1.0, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd94a, transparent: true, opacity: 0.95, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI/2; ring.position.y = 0.05;
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.46, 4),
    new THREE.MeshBasicMaterial({ color: 0xffd94a }));
  cone.rotation.x = Math.PI; cone.position.y = 2.7;
  mark.add(ring, cone);
  mark.visible = false;
  vroot.add(mark);
  // Runner intent: a lane from the runner to the bag they're committed to,
  // gold when they're forced (they have to go) and pale when it's their call.
  const lanes = [];
  for (let i = 0; i < 5; i++) {
    const lg = new THREE.PlaneGeometry(0.5, 1); lg.rotateX(-Math.PI/2);
    const g = new THREE.Mesh(lg,
      new THREE.MeshBasicMaterial({ color: 0xffd94a, transparent: true, opacity: 0.5, depthWrite: false }));
    g.position.y = 0.035; g.visible = false;
    g.layers.set(1); vroot.add(g); lanes.push(g);
  }
  // which bag each fielder is covering
  const covers = [];
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.35, 26),
      new THREE.MeshBasicMaterial({ color: 0x59c8e0, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false }));
    c.rotation.x = -Math.PI/2; c.position.y = 0.03; c.visible = false;
    c.layers.set(1); vroot.add(c); covers.push(c);
  }
  G._kv = { ball, shadow, ghosts, mark, ring, cone, t: 0, lanes, covers };
}

export function setControlMarker(G, actor) {
  const V = G._kv; if (!V) return;
  V.mark.visible = !!actor;
  if (actor) V.mark.userData.a = actor;
}

export function syncKickView(G, dt, alpha) {
  // `now` was used by the runner-lane pulse and bag-cover throb below but never
  // defined in this module — a ReferenceError on every frame with a live play,
  // swallowed by the frame guard, freezing the camera and HUD mid-play.
  const now = performance.now();
  const V = G._kv;
  for (const a of G.actors) {
    a.mesh.position.set(a.px + (a.x - a.px) * alpha, 0, a.pz + (a.z - a.pz) * alpha);
    animChar(a.mesh, a, dt);
  }
  const b = G.ball;
  if (b.held) {
    const h = b.held.mesh.position;
    V.ball.position.set(h.x + Math.sin(b.held.aim) * 0.45, 1.15, h.z + Math.cos(b.held.aim) * 0.45);
  } else {
    V.ball.position.set(b.x, Math.max(0.34, b.y), b.z);
  }
  V.ball.rotation.x += (b.vz || 0) * dt * 0.5;
  V.ball.rotation.z -= (b.vx || 0) * dt * 0.5;
  V.shadow.position.set(V.ball.position.x, 0.02, V.ball.position.z);
  const h = Math.max(0, V.ball.position.y - 0.34);
  V.shadow.scale.setScalar(Math.max(0.35, 1 - h * 0.06));
  V.shadow.material.opacity = 0.32 * Math.max(0.25, 1 - h * 0.05);

  // control marker rides whoever you're steering
  const ma = V.mark.userData.a;
  if (V.mark.visible && ma?.mesh) {
    V.t += dt;
    V.mark.position.set(ma.mesh.position.x, 0, ma.mesh.position.z);
    V.ring.scale.setScalar(1 + Math.sin(V.t * 5) * 0.07);
    V.cone.position.y = 2.7 + Math.sin(V.t * 4) * 0.1;
  }

  // runner intent lanes
  const liveAll = G.live ? G.live() : [];
  let li = 0;
  for (const r of liveAll) {
    if (li >= V.lanes.length) break;
    const from = r.a ? r.a.mesh.position : G.basePos(r.base);
    const to = G.basePos(r.to ?? r.base);
    const dx = to.x - from.x, dz = to.z - from.z;
    const len = Math.hypot(dx, dz);
    const lane = V.lanes[li++];
    if (len < 0.6) { lane.visible = false; continue; }
    lane.visible = true;
    lane.position.set((from.x + to.x)/2, 0.035, (from.z + to.z)/2);
    lane.scale.set(1, 1, len);                 // length runs along Z after the bake
    lane.rotation.set(0, Math.atan2(-dx, -dz), 0);
    lane.material.color.setHex(r.forced ? 0xffd94a : 0xfff8ea);
    lane.material.opacity = (r.forced ? 0.55 : 0.28) + Math.sin(now / 180) * 0.08;
  }
  for (; li < V.lanes.length; li++) V.lanes[li].visible = false;

  // who's covering which bag
  let ci = 0;
  for (const b in (G.duty?.cover || {})) {
    if (ci >= V.covers.length) break;
    const p = G.basePos(+b);
    const c = V.covers[ci++];
    c.visible = true; c.position.set(p.x, 0.03, p.z);
    c.scale.setScalar(1 + Math.sin(now / 200) * 0.06);
  }
  for (; ci < V.covers.length; ci++) V.covers[ci].visible = false;

  const live = liveAll;
  V.ghosts.forEach((g, i) => {
    const r = live.filter(x => x.ghost)[i];
    g.visible = !!r;
    if (r) { const p = G.basePos(r.base); g.position.set(p.x, 0.7, p.z); }
  });
}

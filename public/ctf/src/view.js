import * as THREE from 'three';
import { makeChar, makeFlag, markPlayer, makeKite } from './chars.js';
import { toon, toonMap } from './art.js';
import { streamAngle } from './layout.js';

// Presentation only. rules.js never learns this file exists — which is what
// lets a headless server run the exact same match.
// Everything a match adds to the scene lives under one group, so detaching is
// one removal instead of a treasure hunt. Before this existed, NOTHING removed
// the previous match's meshes — every chained story stop leaked a full roster
// of kids, two flags and all the entity pools into the scene, standing frozen
// where they were when the whistle went.
let viewRoot = null, viewScene = null;
export function detachView() {
  if (!viewRoot) return;
  viewScene.remove(viewRoot);
  viewRoot.traverse(o => {
    if (o.geometry) o.geometry.dispose?.();
    for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m?.dispose?.();
  });
  viewRoot = null; viewScene = null;
}

export function attachView(G, scene) {
  detachView();
  viewScene = scene;
  const vroot = viewRoot = new THREE.Group();
  scene.add(vroot);
  
  for (const a of G.actors) {
    a.mesh = makeChar(a.team, a.variant, a.kit);
    if (a.isPlayer) markPlayer(a.mesh);
    vroot.add(a.mesh);
  }
  for (const key of ['blue', 'red']) {
    const f = G.flags[key];
    f.mesh = makeFlag(key);
    f.mesh.position.set(f.x, 0, f.z);
    vroot.add(f.mesh);
  }

  // ── entity pools ──
  const V = { balloons: [], portals: new Map(), ropes: [], patches: new Map(), horns: new Map() };

  const balloonGeo = new THREE.SphereGeometry(0.34, 12, 10);
  const balloonMat = toonMap({ color: 0x59b8f0 });
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(balloonGeo, balloonMat);
    m.scale.set(1, 0.85, 1.15);              // wobbly water blob
    m.visible = false; m.castShadow = true;
    vroot.add(m); V.balloons.push(m);
  }

  const ropeMat = new THREE.MeshBasicMaterial({ color: 0xf0e6d2 });
  const ropeGeo = new THREE.CylinderGeometry(0.045, 0.045, 1, 6);
  for (let i = 0; i < 8; i++) {
    const m = new THREE.Mesh(ropeGeo, ropeMat.clone());
    m.visible = false;
    vroot.add(m); V.ropes.push(m);
  }

  // carrier beacons: whoever holds a flag is visible from anywhere
  V.beacons = new Map();
  for (const a of G.actors) {
    const g = new THREE.Group();
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.55, 7, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }));
    col.position.y = 3.5;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.15, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI/2; ring.position.y = 0.06;
    g.add(col, ring);
    g.traverse(o => o.layers.set(1));
    g.visible = false;
    vroot.add(g);
    V.beacons.set(a, { g, col, ring });
  }

  // one sky-kite per Nahele on the field
  V.kites = new Map();
  for (const a of G.actors) {
    if (a.kit !== 'nahele') continue;
    const k = makeKite();
    k.scale.setScalar(1.6);
    k.visible = false;
    vroot.add(k);
    V.kites.set(a, k);
  }

  // sprinklers: head + spinning arm, a curved stream of droplets in flight,
  // splashes where they land, and a wet patch on the lawn
  V.sprinklers = [];
  for (const h of (G.hazards || [])) {
    if (h.kind !== 'sprinkler') continue;
    const g = new THREE.Group();
    // A hydrant already has its own fixture modelled as a prop at the same
    // coordinates, so building the green plastic lawn-sprinkler rig here as
    // well put a green cylinder and a grey stem inside the red hydrant barrel.
    const isHydrant = h.head === 'hydrant';
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.3, 10), toon(0x3f8c34));
    base.position.y = 0.15; base.visible = !isHydrant;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8), toon(0xd9d9d9));
    stem.position.y = 0.45; stem.visible = !isHydrant;
    const arm = new THREE.Group();
    const armBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.07, 0.1), toon(0xd9d9d9));
    armBar.position.x = 0.3;
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 6), toon(0x8a939e));
    nozzle.position.set(0.66, 0.04, 0); nozzle.rotation.z = Math.PI / 2;
    armBar.visible = !isHydrant;                 // the jet comes off the side cap
    arm.add(armBar, nozzle); arm.position.y = isHydrant ? 0.44 : 0.62;
    const ND = 90;
    const drops = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5),
      new THREE.MeshBasicMaterial({ color: 0xbfe9ff, transparent: true, opacity: 0.9 }), ND);
    drops.frustumCulled = false; drops.layers.set(1);
    const NS = 18;
    const splashes = new THREE.InstancedMesh(new THREE.RingGeometry(0.12, 0.3, 10),
      new THREE.MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false }), NS);
    splashes.frustumCulled = false; splashes.layers.set(1);
    // Wet ground goes darker, not greener — this used to paint a 15m disc of
    // wet LAWN onto the cul-de-sac's blacktop.
    const wetCol = h.head === 'hydrant' ? 0x2a2724 : 0x2f6e3a;
    const wet = new THREE.Mesh(new THREE.RingGeometry(0.9, h.len, 40),
      new THREE.MeshBasicMaterial({ color: wetCol, transparent: true, opacity: 0.22, depthWrite: false }));
    wet.rotation.x = -Math.PI / 2; wet.position.y = 0.025; wet.layers.set(1);
    g.add(base, stem, arm, drops, splashes, wet);
    g.position.set(h.x, 0, h.z);
    vroot.add(g);
    V.sprinklers.push({ h, g, arm, drops, ND, splashes, NS, seed: Math.random() * 100 });
  }
  const _M = new THREE.Matrix4(), _Q = new THREE.Quaternion(), _V = new THREE.Vector3(), _S = new THREE.Vector3();
  V._tmp = { _M, _Q, _V, _S };

  G._view = V;
  G._scene = viewRoot;   // dynamic entities (portals, patches, horns) clean up with the match
}

function ropeBetween(m, x1, y1, z1, x2, y2, z2) {
  const dx = x2-x1, dy = y2-y1, dz = z2-z1;
  const len = Math.hypot(dx, dy, dz) || 1e-4;
  m.visible = true;
  m.position.set((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
  m.scale.set(1, len, 1);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), new THREE.Vector3(dx/len, dy/len, dz/len));
}

export function syncVisuals(G, dt, alpha) {
  const V = G._view, now = performance.now();

  for (const a of G.actors) {
    a.mesh.position.set(a.px + (a.x - a.px) * alpha, 0, a.pz + (a.z - a.pz) * alpha);
  }

  for (const key of ['blue', 'red']) {
    const f = G.flags[key];
    const carried = !!f.carrier;
    f.mesh.position.set(f.x, carried ? 0.55 : 0, f.z);
    if (f.air) {
      // a tossed flag arcs — a fake but convincing parabola
      const t = f.air.target ?? f.air.zipTo;
      const d = t ? Math.hypot(t.x - f.x, t.z - f.z) : 0;
      f.mesh.position.y = 0.6 + Math.min(2.2, d * 0.22);
      f.mesh.rotation.y += dt * 9;
    } else {
      f.mesh.rotation.y += dt * (carried ? 5 : 1.2);
    }
    f.mesh.userData.cloth.position.y = 1.42 + Math.sin(now / 240) * 0.05;
    if (f.dropped) f.mesh.position.y = Math.sin(now / 200) * 0.12 + 0.15;
  }

  // beacons follow carriers
  for (const a of G.actors) {
    const b = V.beacons.get(a);
    if (!b) continue;
    const on = !!a.hasFlag && !a.tagged;
    b.g.visible = on;
    if (!on) continue;
    const colour = a.hasFlag.team === 'blue' ? 0x3d7dff : 0xff4d4d;   // flag colour, not carrier colour
    b.col.material.color.setHex(colour); b.ring.material.color.setHex(colour);
    b.g.position.set(a.mesh.position.x, 0, a.mesh.position.z);
    const pulse = 1 + Math.sin(now / 140) * 0.12;
    b.ring.scale.setScalar(pulse);
    b.col.material.opacity = 0.2 + Math.sin(now / 200) * 0.06;
  }

  // balloons
  for (let i = 0; i < V.balloons.length; i++) {
    const m = V.balloons[i], b = G.balloons[i];
    if (!b) { m.visible = false; continue; }
    m.visible = true;
    // lob arc: high in the middle of its flight
    const p = 1 - b.life / 0.72;
    m.position.set(b.x, 0.6 + Math.sin(Math.min(1, p) * Math.PI) * 1.6, b.z);
    m.rotation.y += dt * 6;
  }

  // portal pads
  const seen = new Set();
  for (const p of G.portals) {
    seen.add(p);
    let m = V.portals.get(p);
    if (!m) {
      m = new THREE.Group();
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.13, 10, 28),
        toonMap({ color: 0xc46bff }));
      ring.rotation.x = Math.PI/2; ring.position.y = 0.1;
      const disc = new THREE.Mesh(new THREE.CircleGeometry(0.92, 24),
        new THREE.MeshBasicMaterial({ color: 0x7d3dff, transparent: true, opacity: 0.4 }));
      disc.rotation.x = -Math.PI/2; disc.position.y = 0.06;
      m.add(ring, disc);
      m.position.set(p.x, 0, p.z);
      G._scene.add(m);
      V.portals.set(p, m);
      m.userData = { ring, disc };
    }
    m.userData.ring.rotation.z += dt * 2.2;
    m.userData.disc.material.opacity = 0.25 + 0.2 * Math.sin(now / 180);
    m.scale.setScalar(p.life < 1.5 ? Math.max(0.05, p.life / 1.5) : Math.min(1, (14 - p.life) * 6 + 0.05));
  }
  for (const [p, m] of V.portals) {
    if (!seen.has(p)) { G._scene.remove(m); V.portals.delete(p); }
  }

  // The Hose's wet grass. It was simulated and never drawn — you cannot aim or
  // dodge a puddle you cannot see. Ground decal, so layer 1 keeps the ink pass
  // off it; a real outline round a puddle reads as a hole in the lawn.
  const wetSeen = new Set();
  for (const p of G.patches || []) {
    wetSeen.add(p);
    let m = V.patches.get(p);
    if (!m) {
      m = new THREE.Group();
      const pool = new THREE.Mesh(new THREE.CircleGeometry(1, 26),
        new THREE.MeshBasicMaterial({ color: 0x2b7d74, transparent: true, opacity: 0.46, depthWrite: false }));
      pool.rotation.x = -Math.PI / 2; pool.position.y = 0.022; pool.layers.set(1);
      const sheen = new THREE.Mesh(new THREE.CircleGeometry(0.72, 22),
        new THREE.MeshBasicMaterial({ color: 0xbdeeff, transparent: true, opacity: 0.3, depthWrite: false }));
      sheen.rotation.x = -Math.PI / 2; sheen.position.y = 0.028; sheen.layers.set(1);
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 26),
        new THREE.MeshBasicMaterial({ color: 0xeffbff, transparent: true, opacity: 0.8, depthWrite: false }));
      rim.rotation.x = -Math.PI / 2; rim.position.y = 0.03; rim.layers.set(1);
      m.add(pool, sheen, rim);
      m.position.set(p.x, 0, p.z);
      G._scene.add(m);
      V.patches.set(p, m);
      m.userData = { pool, sheen, rim, born: now };
    }
    const life = p.life / 5.0;                       // CFG.kits.hose.patchLife
    const grow = Math.min(1, (now - m.userData.born) / 260);
    m.scale.setScalar(p.r * grow * (0.82 + 0.18 * Math.min(1, life * 2)));
    m.userData.sheen.rotation.z += dt * 0.35;        // slow shimmer
    m.userData.sheen.material.opacity = 0.2 + 0.12 * Math.sin(now / 320 + p.id);
    const fade = Math.min(1, life * 2.2);
    m.userData.pool.material.opacity = 0.46 * fade;
    m.userData.rim.material.opacity  = 0.8 * fade;
  }
  for (const [p, m] of V.patches) {
    if (!wetSeen.has(p)) { G._scene.remove(m); V.patches.delete(p); }
  }

  // Karen's air horn: a cone of noise, 0.35s. Also simulated and never drawn,
  // so her whole move was invisible — people just fell over.
  const hornSeen = new Set();
  for (const h of G.horns || []) {
    hornSeen.add(h);
    let m = V.horns.get(h);
    if (!m) {
      const R = 6.2, ARC = 0.30 * 2;                 // CFG.kits.karen hornRange/hornArc
      const wedge = new THREE.Mesh(
        new THREE.CircleGeometry(R, 22, -Math.PI / 2 - ARC, ARC * 2),
        new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.5,
                                      depthWrite: false, side: THREE.DoubleSide }));
      wedge.rotation.x = -Math.PI / 2; wedge.position.y = 0.05; wedge.layers.set(1);
      m = new THREE.Group();
      m.add(wedge);
      m.position.set(h.x, 0, h.z);
      m.rotation.y = h.aim;                          // aim is the sim's heading
      G._scene.add(m);
      V.horns.set(h, m);
      m.userData = { wedge };
    }
    const t = 1 - h.life / 0.35;                     // 0 at the blast, 1 as it dies
    m.scale.setScalar(0.25 + t * 0.85);
    m.userData.wedge.material.opacity = 0.55 * (1 - t) ** 0.7;
  }
  for (const [h, m] of V.horns) {
    if (!hornSeen.has(h)) { G._scene.remove(m); V.horns.delete(h); }
  }

  // sprinklers: droplets are particles in flight along the curved stream
  for (const s of V.sprinklers) {
    const h = s.h, armAng = h.phase + (G.hazT || 0) * h.speed;
    s.arm.rotation.y = -armAng;
    const { _M, _Q, _V, _S } = V._tmp;
    const T = (G.hazT || 0);
    for (let i = 0; i < s.ND; i++) {
      // each droplet has a fixed phase along the flight; it streams outward over time
      const u = ((i / s.ND) + T / h.flight * 0.5) % 1;            // 0 at nozzle, 1 at landing
      const along = 0.7 + u * (h.len - 0.7);
      const ang = streamAngle(h, armAng, along);
      const spread = u * 0.35;
      const j1 = Math.sin(i * 7.3 + s.seed) * spread, j2 = Math.cos(i * 3.1 + s.seed) * spread * 0.4;
      const y = 0.62 + Math.sin(u * Math.PI) * 1.9 - u * 0.2 + j2;
      _V.set(Math.cos(ang) * along - Math.sin(ang) * j1, Math.max(0.06, y), Math.sin(ang) * along + Math.cos(ang) * j1);
      const sc = 0.55 + (1 - u) * 0.9;
      _S.set(sc, sc * (0.8 + u * 0.6), sc); _M.compose(_V, _Q, _S); s.drops.setMatrixAt(i, _M);
    }
    s.drops.instanceMatrix.needsUpdate = true;
    // splashes ride the landing arc, each one a short-lived expanding ring
    for (let i = 0; i < s.NS; i++) {
      const life = ((T * 1.6 + i / s.NS) % 1);                    // 0..1 age
      const lagAng = streamAngle(h, armAng, h.len) - life * 0.9 * h.speed * 0.6;
      const rr = h.len - 0.3 + Math.sin(i * 5.1) * 0.4;
      _V.set(Math.cos(lagAng) * rr, 0.04, Math.sin(lagAng) * rr);
      const sc = 0.5 + life * 2.2;
      _S.set(sc, sc, sc);
      _Q.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
      _M.compose(_V, _Q, _S); s.splashes.setMatrixAt(i, _M);
    }
    _Q.identity();
    s.splashes.instanceMatrix.needsUpdate = true;
  }

  // ropes + sky kites
  let ri = 0;
  for (const a of G.actors) {
    const kite = V.kites.get(a);
    if (a.grapple && ri < V.ropes.length) {
      ropeBetween(V.ropes[ri++], a.mesh.position.x, 1.1, a.mesh.position.z, a.grapple.x, 0.9, a.grapple.z);
    }
    if (!kite) continue;
    if (a.swing) {
      // the kite rides the wind above the anchor; he swings beneath it
      kite.visible = true;
      kite.position.set(a.swing.ax + Math.sin(now/400)*0.3, 3.6, a.swing.az + Math.cos(now/500)*0.3);
    } else if (a.glide && !a.tagged) {
      const vx = a.vx, vz = a.vz, sp = Math.hypot(vx, vz) || 1;
      kite.visible = true;
      kite.position.set(a.mesh.position.x - vx/sp*1.2, 3.1, a.mesh.position.z - vz/sp*1.2);
    } else kite.visible = false;
    if (kite.visible) {
      // billboard to the camera with a lazy figure-eight wobble — a kite
      // should always read as a diamond, never as a stick
      if (G._camera) kite.quaternion.copy(G._camera.quaternion);
      kite.rotateZ(Math.sin(now/340) * 0.3);
      kite.rotateX(Math.sin(now/470) * 0.15);
      if (ri < V.ropes.length)
        ropeBetween(V.ropes[ri++], a.mesh.position.x, 1.6, a.mesh.position.z,
                    kite.position.x, kite.position.y - 0.4, kite.position.z);
    }
  }
  for (; ri < V.ropes.length; ri++) V.ropes[ri].visible = false;
}

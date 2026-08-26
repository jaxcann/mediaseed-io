import * as THREE from 'three';
import { CFG, TEAMS } from './config.js';
import { toon } from './art.js';

// ─────────────────────────────────────────────────────────────
// Juice. Everything here is presentation: ghosts behind a dash, streaks at
// overspeed, confetti on a capture, a camera that flinches on a tag, and a
// flag that actually waves. None of it touches the sim.
// ─────────────────────────────────────────────────────────────
export function makeJuice(scene, camera) {
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);

  // ── ghosts: team-coloured afterimages ──
  const NG = 24;
  const ghostGeo = new THREE.CapsuleGeometry(0.42, 0.9, 4, 10);
  ghostGeo.translate(0, 1.05, 0);
  const ghosts = [];
  for (let i = 0; i < NG; i++) {
    const m = new THREE.Mesh(ghostGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    m.visible = false; m.layers.set(1); scene.add(m);
    ghosts.push({ m, life: 0 });
  }
  let gi = 0;
  const ghostAcc = new WeakMap();   // actor-keyed; must not outlive the roster
  const prevVel = new WeakMap();

  // ── streaks: thin bright quads trailing fast movers ──
  const NS = 64;
  const streakGeo = new THREE.PlaneGeometry(0.08, 1);
  streakGeo.rotateX(-Math.PI / 2);
  const streaks = new THREE.InstancedMesh(streakGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }), NS);
  streaks.frustumCulled = false; streaks.layers.set(1); scene.add(streaks);
  const SP = Array.from({ length: NS }, () => ({ life: 0, x: 0, z: 0, vx: 0, vz: 0, len: 0 }));
  let si = 0;

  // ── confetti: instanced boxes with per-instance colour ──
  const NC = 160;
  const confetti = new THREE.InstancedMesh(new THREE.BoxGeometry(0.16, 0.04, 0.22),
    new THREE.MeshToonMaterial({ color: 0xffffff }), NC);
  confetti.frustumCulled = false; confetti.castShadow = false; scene.add(confetti);
  const CP = Array.from({ length: NC }, () => ({ life: 0, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, rx: 0, rz: 0, sr: 0 }));
  let ci = 0;
  const PALETTE = [0xffd94a, 0xff6bb5, 0x59c8e0, 0xff8a3d, 0xc46bff, 0xffffff];

  // ── impact rings: a fat expanding ring + spikes at the contact point ──
  const rings = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.7, 1.0, 24),
      new THREE.MeshBasicMaterial({ color: 0xfff8ea, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI/2;
    g.add(ring);
    for (let k = 0; k < 8; k++) {
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.8), ring.material);
      sp.rotation.x = -Math.PI/2; sp.rotation.z = k / 8 * Math.PI * 2;
      sp.position.set(Math.sin(k / 8 * Math.PI * 2) * 1.25, 0, Math.cos(k / 8 * Math.PI * 2) * 1.25);
      sp.rotation.z = -(k / 8 * Math.PI * 2);
      g.add(sp);
    }
    g.position.y = 0.5; g.visible = false; g.traverse(o => o.layers.set(1));
    scene.add(g); rings.push({ g, life: 0, mat: ring.material });
  }
  let ri = 0;
  function impact(x, z, colour = 0xfff8ea) {
    const r = rings[ri++ % rings.length];
    r.life = 0.32; r.g.visible = true; r.g.position.set(x, 0.5, z);
    r.mat.color.setHex(colour); r.mat.opacity = 0.9; r.g.scale.setScalar(0.4);
  }

  // ── camera shake ──
  const shake = { t: 0, amp: 0, x: 0, z: 0 };
  let hitstop = 0;

  function ghost(a) {
    const g = ghosts[gi++ % NG];
    g.life = 0.28;
    g.m.visible = true;
    g.m.position.set(a.mesh.position.x, 0, a.mesh.position.z);
    g.m.rotation.y = a.mesh.rotation.y;
    g.m.material.color.setHex(TEAMS[a.team].color);
    g.m.material.opacity = 0.38;
    g.m.scale.set(1, 1, 1);
  }
  function streak(x, z, vx, vz) {
    const s = SP[si++ % NS];
    s.life = 0.16;
    const sp = Math.hypot(vx, vz) || 1;
    s.x = x + (Math.random() - 0.5) * 0.9; s.z = z + (Math.random() - 0.5) * 0.9;
    s.vx = vx / sp; s.vz = vz / sp; s.len = 0.6 + sp * 0.07;
  }
  function burstConfetti(x, z, team) {
    const teamCol = team ? TEAMS[team].color : null;
    for (let i = 0; i < 70; i++) {
      const idx = ci++ % NC;
      const c = CP[idx];
      c.life = 1.6 + Math.random() * 0.8;
      c.x = x + (Math.random() - 0.5) * 1.2; c.y = 1.2; c.z = z + (Math.random() - 0.5) * 1.2;
      const a = Math.random() * Math.PI * 2, r = 2 + Math.random() * 5;
      c.vx = Math.cos(a) * r; c.vz = Math.sin(a) * r; c.vy = 6 + Math.random() * 6;
      c.rx = Math.random() * 6; c.rz = Math.random() * 6; c.sr = (Math.random() - 0.5) * 14;
      confetti.setColorAt(idx, new THREE.Color(Math.random() < 0.4 && teamCol ? teamCol : PALETTE[(Math.random() * PALETTE.length) | 0]));
    }
    confetti.instanceColor.needsUpdate = true;
  }
  function kick(amp, dur) { shake.amp = Math.max(shake.amp, amp); shake.t = Math.max(shake.t, dur); }

  function update(G, dt) {
    // react to sim events once each
    for (const e of G.events) {
      if (e._juiced) continue; e._juiced = true;
      if (e.kind === 'tag')   { kick(0.32, 0.22); hitstop = Math.max(hitstop, 0.05); }
      if (e.kind === 'hurt')  { kick(0.55, 0.3); }
      if (e.kind === 'score') { kick(0.2, 0.35); }
      if (e.kind === 'catch') { kick(0.12, 0.15); }
    }
    if (!G.actors) return;
    if (G.lastScore) { burstConfetti(G.lastScore.x, G.lastScore.z, G.lastScore.team); G.lastScore = null; }
    if (G.lastTag)   { impact(G.lastTag.x, G.lastTag.z, TEAMS[G.lastTag.team].color); burstConfetti(G.lastTag.x, G.lastTag.z, null); G.lastTag = null; }
    for (const r of rings) {
      if (r.life <= 0) { r.g.visible = false; continue; }
      r.life -= dt;
      const k = 1 - Math.max(0, r.life) / 0.32;
      r.g.scale.setScalar(0.4 + k * 2.2);
      r.mat.opacity = 0.9 * (1 - k) * (1 - k);
    }

    // motion spawns
    for (const a of G.actors) {
      if (!a.mesh || a.tagged) continue;
      const sp = Math.hypot(a.vx, a.vz);
      // skid: a sharp change of heading at speed kicks up dirt
      const pv = prevVel.get(a);
      if (pv && sp > 4) {
        const dot = (a.vx * pv.vx + a.vz * pv.vz) / ((sp * pv.sp) || 1);
        if (pv.sp > 5 && dot < 0.3 && G.world?.fx) G.world.fx.burst(a.mesh.position.x, a.mesh.position.z, -a.vx / sp, -a.vz / sp, 7);
      }
      prevVel.set(a, { vx: a.vx, vz: a.vz, sp });
      const fast = sp > CFG.move.maxSpeed * 1.15;
      const dashing = a.lunge?.phase === 'active' || a.roll || (a.dashCd > CFG.dash.cooldown - 0.18);
      if (fast || dashing) {
        const acc = (ghostAcc.get(a) || 0) + dt;
        if (acc > 0.045) { ghost(a); ghostAcc.set(a, 0); } else ghostAcc.set(a, acc);
        if (Math.random() < Math.min(1, (sp - 8) * 0.12)) streak(a.mesh.position.x, a.mesh.position.z, a.vx, a.vz);
      }
    }

    // ghosts fade + shrink
    for (const g of ghosts) {
      if (g.life <= 0) { g.m.visible = false; continue; }
      g.life -= dt;
      const k = Math.max(0, g.life / 0.28);
      g.m.material.opacity = 0.38 * k;
      g.m.scale.set(0.8 + 0.2 * k, 0.85 + 0.15 * k, 0.8 + 0.2 * k);
    }
    // streaks
    for (let i = 0; i < NS; i++) {
      const s = SP[i];
      if (s.life <= 0) { S.set(0, 0, 0); } else {
        s.life -= dt;
        const k = Math.max(0, s.life / 0.16);
        S.set(1, 1, s.len * (0.5 + 0.5 * k));
        s.x -= s.vx * dt * 2; s.z -= s.vz * dt * 2;
      }
      V.set(s.x, 0.5 + (i % 3) * 0.35, s.z);
      Q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(s.vx, 0, s.vz).normalize());
      M.compose(V, Q, S); streaks.setMatrixAt(i, M);
    }
    streaks.instanceMatrix.needsUpdate = true;
    // confetti
    for (let i = 0; i < NC; i++) {
      const c = CP[i];
      if (c.life <= 0) { S.set(0, 0, 0); } else {
        c.life -= dt;
        c.x += c.vx * dt; c.z += c.vz * dt; c.y += c.vy * dt;
        c.vy -= 14 * dt; c.vx *= 0.97; c.vz *= 0.97;
        if (c.vy < -2.2) c.vy = -2.2;                 // flutter, don't plummet
        if (c.y < 0.04) { c.y = 0.04; c.vy = 0; c.vx *= 0.8; c.vz *= 0.8; }
        c.rx += c.sr * dt; c.rz += c.sr * 0.7 * dt;
        const k = Math.min(1, c.life / 0.4);
        S.set(k, k, k);
      }
      V.set(c.x, c.y, c.z);
      Q.setFromEuler(new THREE.Euler(c.rx, 0, c.rz));
      M.compose(V, Q, S); confetti.setMatrixAt(i, M);
    }
    confetti.instanceMatrix.needsUpdate = true;

    // camera shake
    if (shake.t > 0) {
      shake.t -= dt;
      const k = Math.max(0, shake.t) / (shake.dur || 0.3);
      shake.x = (Math.random() - 0.5) * 2 * shake.amp * k;
      shake.z = (Math.random() - 0.5) * 2 * shake.amp * k;
      if (shake.t <= 0) shake.amp = 0;
    } else { shake.x = shake.z = 0; }

    // flags wave
    const now = performance.now() / 1000;
    for (const key of (G.flags ? ['blue', 'red'] : [])) {
      const f = G.flags[key];
      const cloth = f.mesh?.userData.cloth;
      if (!cloth?.userData.wave) continue;
      const pos = cloth.geometry.attributes.position;
      const base = cloth.userData.wave;
      const carried = !!f.carrier;
      const amp = carried ? 0.12 : 0.06, freq = carried ? 9 : 4;
      for (let i = 0; i < pos.count; i++) {
        const bx = base[i * 3], by = base[i * 3 + 1];
        const t = (bx + 0.45) / 0.9;                  // 0 at pole, 1 at tip
        pos.setZ(i, Math.sin(now * freq + bx * 6 + by * 2) * amp * t * t);
      }
      pos.needsUpdate = true;
      cloth.geometry.computeVertexNormals();
    }
  }

  function consumeHitstop() { const h = hitstop; hitstop = 0; return h; }
  // Kickball never calls update() — it is CTF-shaped — so its shake was set and
  // then never turned into an offset, and every home run landed on a static
  // picture. This is the shake half on its own.
  function updateShake(dt) {
    if (shake.t > 0) {
      shake.t -= dt;
      const k = Math.max(0, shake.t) / (shake.dur || 0.3);
      shake.x = (Math.random() - 0.5) * 2 * shake.amp * k;
      shake.z = (Math.random() - 0.5) * 2 * shake.amp * k;
      if (shake.t <= 0) shake.amp = 0;
    } else { shake.x = shake.z = 0; }
  }
  function shakeFor(amp, dur) {
    shake.amp = Math.max(shake.amp, amp); shake.t = dur; shake.dur = dur;
  }
  return { update, shake, consumeHitstop, updateShake, shakeFor };
}

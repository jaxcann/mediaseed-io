import * as THREE from 'three';
import { CFG } from './config.js';
import { scatterRng } from './art.js';

// ─────────────────────────────────────────────────────────────
// The yard should feel lived-in even when nobody moves. Pollen drifting in
// the light, a couple of butterflies working the flowerbeds, grass that
// answers the breeze. All instanced, all deterministic, none of it inked.
// ─────────────────────────────────────────────────────────────
export function makeAmbience(scene) {
  const F = CFG.field;
  const group = new THREE.Group();
  scene.add(group);

  // ── pollen: slow motes that catch the sun ──
  const NP = 90;
  const pollen = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.10, 6, 5),
    new THREE.MeshBasicMaterial({ color: 0xfff6d0, transparent: true, opacity: 0.75, depthWrite: false }), NP);
  pollen.frustumCulled = false; pollen.layers.set(1);
  group.add(pollen);
  const rnd = scatterRng(20260822);
  const P = Array.from({ length: NP }, () => ({
    x: (rnd() - 0.5) * (F.w + 20), z: (rnd() - 0.5) * (F.h + 14),
    y: 0.4 + rnd() * 3.4, ph: rnd() * 9, sp: 0.25 + rnd() * 0.5, r: 0.7 + rnd() * 1.1,
  }));

  // ── butterflies: two, wandering, wings ticking ──
  const NB = 3;
  const flies = [];
  for (let i = 0; i < NB; i++) {
    const b = new THREE.Group();
    const col = [0xffd94a, 0xff8fd0, 0xfff0b0][i % 3];
    const wingGeo = new THREE.CircleGeometry(0.26, 8);
    const mat = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, transparent: true, opacity: 0.95 });
    const L = new THREE.Mesh(wingGeo, mat), R = new THREE.Mesh(wingGeo, mat);
    L.position.x = -0.18; R.position.x = 0.18;
    b.add(L, R);
    b.userData = { L, R, ph: rnd() * 9, sp: 0.5 + rnd() * 0.4,
                   cx: (rnd() - 0.5) * F.w * 0.7, cz: (rnd() - 0.5) * F.h * 0.7, rad: 4 + rnd() * 7 };
    b.layers.set(1); b.traverse(o => o.layers.set(1));
    group.add(b); flies.push(b);
  }

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  let t = 0;
  let swayTargets = [];

  // Season: the same particle pool is pollen in summer and snow in winter.
  // Pollen drifting UP through a snow map (and butterflies working flowerbeds
  // that are under a foot of snow) was one of those things nobody wrote and
  // nobody deleted — it was visible as yellow motes against the winter sky.
  let season = 'summer';

  return {
    group,
    // grass tufts and flowers answer the breeze
    bindSway(meshes) { swayTargets = meshes.filter(Boolean); },
    setIndoor(indoor) { group.visible = !indoor; },
    setSeason(s) {
      season = s;
      pollen.material.color.setHex(s === 'winter' ? 0xffffff : 0xfff6d0);
      pollen.material.opacity = s === 'winter' ? 0.9 : 0.75;
      for (const b of flies) b.visible = s !== 'winter';
    },
    update(dt) {
      if (!group.visible) return;
      t += dt;
      const winter = season === 'winter';
      for (let i = 0; i < NP; i++) {
        const p = P[i];
        // snow falls; pollen rises
        const cyc = (p.y + t * p.sp * (winter ? 1.6 : 1)) % 4.6;
        const y = 0.35 + (winter ? 4.6 - cyc : cyc);
        const drift = Math.sin(t * 0.35 + p.ph) * (winter ? 2.2 : 1.4);
        V.set(p.x + drift, y, p.z + Math.cos(t * 0.28 + p.ph) * 1.1);
        const fade = winter
          ? Math.min(1, cyc * 2)                                    // flakes fade in at the top
          : Math.min(1, (4.6 - (y - 0.35)) * 0.8) * (0.5 + 0.5 * Math.sin(t + p.ph));
        S.setScalar(Math.max(0.001, p.r * fade * (winter ? 0.8 : 1)));
        M.compose(V, Q, S); pollen.setMatrixAt(i, M);
      }
      pollen.instanceMatrix.needsUpdate = true;

      for (const b of flies) {
        if (!b.visible) continue;
        const u = b.userData;
        const a = t * u.sp + u.ph;
        b.position.set(u.cx + Math.cos(a) * u.rad, 1.5 + Math.sin(a * 2.3) * 0.6 + Math.sin(t * 3 + u.ph) * 0.14,
                       u.cz + Math.sin(a * 0.8) * u.rad * 0.7);
        b.rotation.y = -a;
        const flap = Math.sin(t * 17 + u.ph) * 0.9;
        u.L.rotation.y = flap; u.R.rotation.y = -flap;
      }

      // breeze on the ground cover
      const bend = Math.sin(t * 0.9) * 0.05 + Math.sin(t * 2.3) * 0.018;
      for (const m of swayTargets) { m.rotation.z = bend; m.rotation.x = bend * 0.4; }
    },
  };
}

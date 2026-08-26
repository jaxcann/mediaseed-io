import * as THREE from 'three';
import { toon } from './art.js';
import { CFG } from './config.js';

// Two times of day on the same yard. Night is the evening session: porch
// lights on the fence, fireflies over the lawn, and the sprinklers are on.
export const YARDS = {
  day: {
    sky: ['#59b0ff', '#a9dcff', '#f2f7ea'], fog: 0xdcefff, fogNear: 70, fogFar: 120,
    sun: { color: 0xfff0c8, i: 2.25, pos: [-16, 30, 14] },
    hemi: { sky: 0xbfe0ff, ground: 0x6a9a3c, i: 1.0 },
    // rim: a low, cool kicker from behind the play. On banded toon shading it
    // paints a bright edge that lifts every figure off the grass.
    rim: { color: 0xfff6d8, i: 1.5, pos: [14, 9, -22] },
    grass: 0xffffff, grade: { warmth: 0.35, saturation: 1.2, vignette: 0.32, ink: 0x2a1a12, exposure: 0.78 },
    clouds: 1.0,
  },
  night: {
    cloudTint: '#3d5175',
    sky: ['#08122c', '#1a2f5e', '#41577f'], fog: 0x24365c, fogNear: 34, fogFar: 88,
    sun: { color: 0x9fb8ff, i: 0.8, pos: [14, 30, -10] },
    hemi: { sky: 0x2f4f8f, ground: 0x1a2e1a, i: 0.72 },
    rim: { color: 0x9fc4ff, i: 1.15, pos: [-14, 8, -20] },
    grass: 0x8fa4cb, grade: { warmth: -0.22, saturation: 0.98, vignette: 0.56, ink: 0x0d1428, exposure: 1.0 },
    clouds: 0.3,
  },
};

YARDS.gym = {
  sky: ['#2f3644', '#3d4657', '#525b6c'], fog: 0x434c5e, fogNear: 90, fogFar: 160,
  sun: { color: 0xfff6e0, i: 1.85, pos: [-6, 34, 8] },
  hemi: { sky: 0xffffff, ground: 0xa08060, i: 1.05 },
  rim: { color: 0xdbe6ff, i: 1.25, pos: [10, 12, -18] },
  grass: 0xffffff, grade: { warmth: 0.14, saturation: 1.06, vignette: 0.46, ink: 0x241a14, exposure: 0.86 },
  clouds: 0,
};

// A stadium reads cooler and crisper than somebody's lawn.
YARDS.field = {
  sky: ['#4aa6ff', '#9ed4ff', '#eef6ff'], fog: 0xd6ebff, fogNear: 76, fogFar: 130,
  sun: { color: 0xfffaf0, i: 2.3, pos: [-14, 32, 12] },
  hemi: { sky: 0xcfe6ff, ground: 0x5f8f3a, i: 1.0 },
  rim: { color: 0xffffff, i: 1.65, pos: [16, 10, -22] },
  grass: 0xffffff, grade: { warmth: 0.16, saturation: 1.24, vignette: 0.3, ink: 0x1e2a18, exposure: 0.74 },
  clouds: 1.4,
};

// Late golden afternoon on hot blacktop — the hour kids are actually out there.
// Warmer and lower-contrast than the field, because grey asphalt needs the light
// to do the colour work that grass does for free.
YARDS.street = {
  sky: ['#4f9fe8', '#a8d3f0', '#ffe7bd'], cloudTint: '#ffeccf',
  fog: 0xf0dcb4, fogNear: 62, fogFar: 118,
  sun: { color: 0xffdfa0, i: 2.35, pos: [-22, 20, 10] },
  hemi: { sky: 0xcfe4ff, ground: 0x6b6660, i: 0.92 },
  rim: { color: 0xffe8b0, i: 1.90, pos: [18, 6, -20] },
  grass: 0xffffff, grade: { warmth: 0.46, saturation: 1.16, vignette: 0.38, ink: 0x2b1c16, exposure: 0.74 },
  clouds: 0.7,
};

// February, mid-afternoon, overcast-bright. Snow bounces enormous amounts of
// light back up, so the ground term is nearly white and the whole grade is
// pulled cool — the fire pit is deliberately the only warm thing on the map.
YARDS.winter = {
  sky: ['#8fb6d8', '#c3d9ea', '#eef4f8'], cloudTint: '#ffffff',
  fog: 0xdce9f4, fogNear: 52, fogFar: 104,
  sun: { color: 0xf4f8ff, i: 1.7, pos: [-10, 26, 16] },
  hemi: { sky: 0xdcecff, ground: 0xe8f1f8, i: 1.5 },
  rim: { color: 0xdfeeff, i: 1.35, pos: [14, 8, -20] },
  grass: 0xffffff, grade: { warmth: -0.14, saturation: 0.86, vignette: 0.42, ink: 0x2a3a48, exposure: 0.80 },
  clouds: 1.9,
};

// Bright, hard, exposed mid-morning. The one that matters is hemi.ground: every
// other outdoor yard bounces green up into the characters' undersides, and on a
// school lot it has to bounce grey, or the kids look like they are standing on
// a lawn that is not there.
YARDS.recess = {
  sky: ['#5aa8f0', '#a2d4f6', '#f4f2e6'], fog: 0xdfeaf0, fogNear: 78, fogFar: 135,
  sun: { color: 0xfff8e4, i: 2.45, pos: [-20, 27, 13] },
  hemi: { sky: 0xcfe4f2, ground: 0x5c5e60, i: 0.95 },
  rim: { color: 0xffffff, i: 1.70, pos: [15, 8, -21] },
  grass: 0xffffff,
  grade: { warmth: 0.12, saturation: 1.16, vignette: 0.22, ink: 0x1f2733, exposure: 0.72 },
  clouds: 0.55,
};

// Two in the afternoon in August: sun almost overhead, shadows short and hard,
// everything a little bleached. The highest sun of any grade and the lowest
// vignette, because there is nowhere shady to stand.
YARDS.noon = {
  sky: ['#3f9ae8', '#8fc9f2', '#eaf6ff'], cloudTint: '#ffffff',
  fog: 0xe8f4ff, fogNear: 80, fogFar: 140,
  sun: { color: 0xfffdf2, i: 2.5, pos: [-4, 40, 6] },
  hemi: { sky: 0xd6ecff, ground: 0x6f9a52, i: 1.05 },
  rim: { color: 0xeaf6ff, i: 1.4, pos: [12, 7, -18] },
  grass: 0xffffff,
  grade: { warmth: 0.2, saturation: 1.22, vignette: 0.2, ink: 0x1c2a1e, exposure: 0.7 },
  clouds: 0.35,
};

export function makeYardFX(scene) {
  const night = new THREE.Group();
  night.visible = false;
  scene.add(night);

  // porch lights: warm bulbs on posts at the fence midpoints and corners
  const F = CFG.field;
  const spots = [[0, -(F.h/2 + 0.9)], [0, F.h/2 + 0.9], [-(F.w/2 + 0.9), -6], [-(F.w/2 + 0.9), 6], [F.w/2 + 0.9, -6], [F.w/2 + 0.9, 6]];
  const lights = [];
  for (const [x, z] of spots) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 3.2, 8), toon(0x3a2a1a));
    post.position.set(x, 1.6, z);
    const shade = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.3, 10, 1, true), toon(0x2e6b4a));
    shade.position.set(x, 3.25, z);
    // An unlit basic material is mathematically capped at its own albedo, so no
    // sRGB hex can ever exceed 1.0 linear — 0xffe6a0 tops out at 0.80 luma and
    // could never clear the 0.93 bloom threshold. The lamps were the one thing
    // bloom was written for and the one thing that could not reach it. Push the
    // colour past 1.0 explicitly; nothing clamps between here and the bright pass.
    const bulbMat = new THREE.MeshBasicMaterial({ color: 0xffe6a0 });
    bulbMat.color.multiplyScalar(2.0);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), bulbMat);
    bulb.position.set(x, 3.05, z); bulb.layers.set(1);
    const glow = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0.14, depthWrite: false }));
    glow.position.copy(bulb.position); glow.layers.set(1);
    const pl = new THREE.PointLight(0xffc978, 0, 22, 1.6);
    pl.position.set(x, 3.0, z);
    night.add(post, shade, bulb, glow, pl);
    lights.push(pl);
  }

  // fireflies: blinking yellow points that wander — no ink, no shadow
  const NF = 48;
  const flyMat = new THREE.MeshBasicMaterial({ color: 0xe8ff7a });
  flyMat.color.multiplyScalar(1.8);
  const flies = new THREE.InstancedMesh(new THREE.SphereGeometry(0.07, 6, 5), flyMat, NF);
  flies.frustumCulled = false; flies.layers.set(1);
  const FP = Array.from({ length: NF }, (_, i) => ({
    x: (Math.random() - 0.5) * (F.w - 4), z: (Math.random() - 0.5) * (F.h - 4),
    y: 0.6 + Math.random() * 1.8, ph: Math.random() * 10, sp: 0.4 + Math.random() * 0.6 }));
  night.add(flies);

  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  let t = 0;
  function update(dt) {
    if (!night.visible) return;
    t += dt;
    for (let i = 0; i < NF; i++) {
      const f = FP[i];
      f.x += Math.sin(t * f.sp + f.ph) * dt * 0.8;
      f.z += Math.cos(t * f.sp * 0.7 + f.ph) * dt * 0.8;
      const blink = Math.max(0, Math.sin(t * 2.2 + f.ph * 3));
      const s = blink > 0.55 ? 1 + blink * 0.8 : 0.001;
      V.set(f.x, f.y + Math.sin(t + f.ph) * 0.2, f.z); S.set(s, s, s);
      M.compose(V, Q, S); flies.setMatrixAt(i, M);
    }
    flies.instanceMatrix.needsUpdate = true;
    for (const l of lights) l.intensity = 14 + Math.sin(t * 9 + l.position.x) * 0.6;   // mains hum flicker
  }
  return { night, update };
}

export function applyYard(ctx, key) {
  const Y = YARDS[key] || YARDS.day;
  const { scene, sun, hemi, ground, yardFX, LOOK, skyTexture, rim, clouds } = ctx;
  if (scene.background?.isTexture) scene.background.dispose();   // or every yard change leaks a canvas
  scene.background = skyTexture(Y.sky, Y.clouds ?? 1, Y.cloudTint ?? '#ffffff');
  scene.fog = new THREE.Fog(Y.fog, Y.fogNear, Y.fogFar);
  sun.color.setHex(Y.sun.color); sun.intensity = Y.sun.i; sun.position.set(...Y.sun.pos);
  hemi.color.setHex(Y.hemi.sky); hemi.groundColor.setHex(Y.hemi.ground); hemi.intensity = Y.hemi.i;
  ground.material.color.setHex(Y.grass);
  LOOK.warmth = Y.grade.warmth; LOOK.saturation = Y.grade.saturation; LOOK.vignette = Y.grade.vignette;
  LOOK.exposure = Y.grade.exposure ?? 0.78;   // daylight rigs are hot; night is not
  if (Y.grade.ink !== undefined) LOOK.ink.setHex(Y.grade.ink);
  if (rim && Y.rim) { rim.color.setHex(Y.rim.color); rim.intensity = Y.rim.i; rim.position.set(...Y.rim.pos); }

  yardFX.night.visible = key === 'night';
}

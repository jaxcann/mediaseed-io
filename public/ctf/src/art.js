import * as THREE from 'three';

// Crisp banded toon shading. One extra band over the classic three adds a
// touch of roundness without softening the look.
let grad = null;
export function gradientMap() {
  if (grad) return grad;
  const d = new Uint8Array([125, 170, 212, 242, 255]);
  grad = new THREE.DataTexture(d, d.length, 1, THREE.RedFormat);
  grad.minFilter = grad.magFilter = THREE.NearestFilter;
  grad.needsUpdate = true;
  return grad;
}

export function toon(color) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() });
}

// Same ramp, but for the cases that need extra material options (a map, a side,
// transparency). Without the gradientMap three falls back to a TWO-tone ramp
// that switches at dotNL 0.4, so a curved object shows one hard light/dark
// split where everything beside it shows a four-step wrap — it reads flat, and
// across most of the visible terminator it also sits darker than its neighbours.
export function toonMap(opts) {
  return new THREE.MeshToonMaterial({ ...opts, gradientMap: gradientMap() });
}

// Inverted-hull outline. Cheap, and it's what sells "cartoon" more than
// anything else in the frame.
const OUTLINE = new THREE.MeshBasicMaterial({ color: 0x231a14, side: THREE.BackSide });
// Outlines used to be inverted hulls per mesh; they are now a single
// screen-space pass (post.js). This keeps the call sites unchanged.
export function outlined(geo, color, _thickness) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, toon(color));
  m.castShadow = true; m.receiveShadow = true;
  g.add(m);
  g.userData.mesh = m;
  return g;
}

// A box with bevelled edges. Vinyl toys have no sharp corners — every slab
// (bib, sole, gadget) goes through this.
export function rbox(w, h, d, r = 0.04) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.01, d - r * 2), bevelEnabled: true, bevelThickness: r, bevelSize: r, bevelSegments: 3, curveSegments: 4 });
  g.translate(0, 0, -(d - r * 2) / 2);
  g.computeBoundingSphere();
  return g;
}

// Deterministic scatter RNG — the yard must look identical every load.
export function scatterRng(seed) {
  let s = seed | 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

export function grassTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 1024;
  const x = c.getContext('2d');
  const rnd = scatterRng(1337);
  x.fillStyle = '#79c44a'; x.fillRect(0, 0, 1024, 1024);
  // bold mower stripes — a deliberate graphic, not a texture
  for (let i = 0; i < 1024; i += 128) {
    x.fillStyle = (i / 128) % 2 ? 'rgba(255,255,255,.10)' : 'rgba(20,80,10,.10)';
    x.fillRect(0, i, 1024, 128);
  }
  // sparse blade flecks, low contrast
  for (let i = 0; i < 2600; i++) {
    x.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,.10)' : 'rgba(30,90,20,.14)';
    x.fillRect(rnd() * 1024, rnd() * 1024, 3, 5);
  }
  // a few soft clover patches
  for (let i = 0; i < 14; i++) {
    const cx = rnd() * 1024, cy = rnd() * 1024, r = 40 + rnd() * 70;
    const g = x.createRadialGradient(cx, cy, 2, cx, cy, r);
    g.addColorStop(0, 'rgba(60,150,50,.40)');
    g.addColorStop(1, 'rgba(60,150,50,0)');
    x.fillStyle = g;
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
  }
  // daisies
  for (let i = 0; i < 40; i++) {
    const cx = rnd() * 1024, cy = rnd() * 1024;
    x.fillStyle = 'rgba(255,255,255,.9)';
    for (let p = 0; p < 5; p++) {
      const a = p / 5 * Math.PI * 2;
      x.fillRect(cx + Math.cos(a) * 3, cy + Math.sin(a) * 3, 2.6, 2.6);
    }
    x.fillStyle = '#ffd84a';
    x.fillRect(cx, cy, 2.8, 2.8);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 3.5);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// Jersey number for the pinnie — drawn once per character.
export function numberTexture(n) {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const x = c.getContext('2d');
  x.clearRect(0, 0, 128, 128);
  x.font = '900 96px "Fredoka", "Arial Black", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineWidth = 14; x.strokeStyle = 'rgba(20,14,8,.9)';
  x.strokeText(n, 64, 70);
  x.fillStyle = '#fff';
  x.fillText(n, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  return t;
}

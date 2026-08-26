// ─────────────────────────────────────────────────────────────
// Maple Court, painted. The overworld was a green rectangle with pins on it,
// which reads as a wireframe rather than a street you could walk down. This
// draws the actual neighbourhood — roads, driveways, houses, hedges, the
// school, the field, the lot — with the stop locations built into the art.
//
// Coordinates are the same 0–100 space the story data uses, so a stop pin
// always lands on the place it names.
// ─────────────────────────────────────────────────────────────
const INK = '#2a1a12';

// deterministic scatter, so the street never redraws differently
function rng(seed) {
  let s = seed | 0;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296); };
}

export function drawNeighborhood(ctx, W, H) {
  const X = v => (v / 100) * W, Y = v => (v / 100) * H;
  const S = Math.min(W, H) / 100;                 // one "unit" for stroke widths
  const r = rng(20260823);

  // ── ground: mown grass with a little tonal variation ──
  ctx.fillStyle = '#86c65a';
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < H; i += 14 * S) {
    ctx.fillStyle = (Math.floor(i / (14 * S)) % 2) ? 'rgba(255,255,255,.045)' : 'rgba(20,80,10,.05)';
    ctx.fillRect(0, i, W, 14 * S);
  }
  // soft darker patches so it isn't a flat field
  for (let i = 0; i < 22; i++) {
    const cx = r() * W, cy = r() * H, rad = (5 + r() * 12) * S;
    const g = ctx.createRadialGradient(cx, cy, 1, cx, cy, rad);
    g.addColorStop(0, 'rgba(64,140,52,.30)'); g.addColorStop(1, 'rgba(64,140,52,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rad, 0, 7); ctx.fill();
  }

  // ── the road: one bend running past every stop ──
  const road = [[2, 88], [16, 84], [30, 62], [44, 70], [56, 52], [62, 30], [58, 14]];
  const spur = [[62, 30], [80, 44], [88, 62]];
  const drawRoad = (pts, w) => {
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#8d8579'; ctx.lineWidth = w * S + 2.5 * S;
    stroke(ctx, pts, X, Y);
    ctx.strokeStyle = '#b9b2a4'; ctx.lineWidth = w * S;
    stroke(ctx, pts, X, Y);
    // centre dashes
    ctx.setLineDash([3.5 * S, 4.5 * S]);
    ctx.strokeStyle = 'rgba(255,250,230,.75)'; ctx.lineWidth = 0.9 * S;
    stroke(ctx, pts, X, Y);
    ctx.setLineDash([]);
  };
  drawRoad(road, 7);
  drawRoad(spur, 5.5);

  // the cul-de-sac bulb at the top of the street
  ctx.fillStyle = '#8d8579';
  circle(ctx, X(58), Y(12), 9.4 * S);
  ctx.fillStyle = '#b9b2a4';
  circle(ctx, X(58), Y(12), 8.2 * S);
  ctx.fillStyle = '#86c65a';
  circle(ctx, X(58), Y(12), 3.4 * S);

  // ── plots along the street ──
  // 1. The Back Fence — a fenced backyard with a pool
  yard(ctx, X, Y, S, 4, 68, 17, 20, '#7ec24d');
  fenceRect(ctx, X, Y, S, 4, 68, 17, 20);
  pool(ctx, X(9), Y(74), 3.1 * S);
  tree(ctx, X(15.5), Y(70.5), 3.0 * S, r);
  house(ctx, X, Y, S, 3, 88, 12, 9, '#e8c07a', '#b3543f');

  // 2. Sprinkler Season — lawn with sprinkler arcs
  yard(ctx, X, Y, S, 21, 44, 16, 17, '#79bd47');
  fenceRect(ctx, X, Y, S, 21, 44, 16, 17);
  sprinkler(ctx, X(28), Y(52), 5.6 * S);
  tree(ctx, X(23.5), Y(46.5), 2.6 * S, r);
  house(ctx, X, Y, S, 20, 33, 12, 9, '#cfd8e6', '#4a6c8c');

  // 3. Third Period Gym — the school block
  building(ctx, X, Y, S, 41, 66, 19, 15, '#f0e6d2', '#8d8579', 'SCHOOL');
  for (let i = 0; i < 4; i++) window_(ctx, X(43.5 + i * 4), Y(70), 2.4 * S, 2.8 * S);
  // little car park
  ctx.fillStyle = '#a49c8f'; roundRect(ctx, X(41), Y(82), X(60) - X(41), Y(86) - Y(82), 1.5 * S, true, false);
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = 'rgba(255,250,230,.6)'; ctx.lineWidth = 0.7 * S;
    ctx.beginPath(); ctx.moveTo(X(43 + i * 4.4), Y(82)); ctx.lineTo(X(43 + i * 4.4), Y(86)); ctx.stroke();
  }

  // 4. The Whole Field — marked turf with goalposts
  yard(ctx, X, Y, S, 53, 32, 20, 16, '#6fb840');
  ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 0.8 * S;
  ctx.strokeRect(X(54), Y(33), X(72) - X(54), Y(47) - Y(33));
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(X(54 + i * 4.5), Y(33)); ctx.lineTo(X(54 + i * 4.5), Y(47)); ctx.stroke();
  }
  goal(ctx, X(63), Y(33), 3.4 * S, S);
  goal(ctx, X(63), Y(47), 3.4 * S, S, true);

  // 5. The Empty Lot — bare dirt, weeds, a shopping trolley of a fence
  ctx.fillStyle = '#c2a877';
  roundRect(ctx, X(79), Y(53), X(97) - X(79), Y(72) - Y(53), 2 * S, true, false);
  ctx.strokeStyle = 'rgba(140,110,60,.5)'; ctx.lineWidth = 0.8 * S;
  for (let i = 0; i < 16; i++) {
    const wx = X(80 + r() * 16), wy = Y(54 + r() * 17);
    ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx + (r() - .5) * 2 * S, wy - (1.4 + r()) * S); ctx.stroke();
  }
  brokenFence(ctx, X, Y, S, 79, 53, 18, 19, r);
  house(ctx, X, Y, S, 90, 40, 11, 9, '#d9b8a0', '#7a4b3a');

  // 6. The Cul-de-Sac — houses ringing the bulb
  for (const [hx, hy, wall, roof] of [
    [46, 4, '#f2d9a8', '#b3543f'], [63, 2, '#cfe0d8', '#4a7c59'],
    [72, 12, '#e6cbe0', '#6d4a7c'], [47, 20, '#dfe6f2', '#4a6c8c']]) {
    house(ctx, X, Y, S, hx, hy, 11, 8.5, wall, roof);
  }

  // ── street furniture: trees, hedges, mailboxes ──
  const trees = [[10, 58], [19, 62], [36, 50], [38, 78], [50, 58], [66, 60], [70, 24], [40, 30],
                 [26, 74], [76, 34], [88, 78], [8, 40], [50, 22], [30, 88]];
  for (const [tx, ty] of trees) tree(ctx, X(tx), Y(ty), (2.2 + r() * 1.4) * S, r);
  const hedges = [[13, 63, 8], [33, 58, 6], [45, 60, 5], [67, 46, 6], [76, 52, 5]];
  for (const [hx, hy, hw] of hedges) hedge(ctx, X(hx), Y(hy), hw * S, r);
  for (const [mx, my] of [[18, 80], [33, 63], [46, 63], [55, 44], [64, 22]]) mailbox(ctx, X(mx), Y(my), S);

  // ── a soft warm vignette so the eye lands in the middle ──
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.28, W / 2, H / 2, Math.max(W, H) * 0.72);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(30,50,18,.34)');
  ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
}

// ── primitives, all in the same ink-outlined language as the game ──
function stroke(ctx, pts, X, Y) {
  ctx.beginPath();
  ctx.moveTo(X(pts[0][0]), Y(pts[0][1]));
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i];
    ctx.quadraticCurveTo(X(px), Y(py), X((px + cx) / 2), Y((py + cy) / 2));
  }
  ctx.lineTo(X(pts.at(-1)[0]), Y(pts.at(-1)[1]));
  ctx.stroke();
}
function circle(ctx, cx, cy, r) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); }
function roundRect(ctx, x, y, w, h, r, fill, strokeIt) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  if (fill) ctx.fill(); if (strokeIt) ctx.stroke();
}
function yard(ctx, X, Y, S, x, y, w, h, col) {
  ctx.fillStyle = col;
  roundRect(ctx, X(x), Y(y), X(x + w) - X(x), Y(y + h) - Y(y), 1.6 * S, true, false);
}
function fenceRect(ctx, X, Y, S, x, y, w, h) {
  ctx.strokeStyle = '#c9a066'; ctx.lineWidth = 1.5 * S;
  ctx.setLineDash([1.6 * S, 1.1 * S]);
  ctx.strokeRect(X(x), Y(y), X(x + w) - X(x), Y(y + h) - Y(y));
  ctx.setLineDash([]);
}
function brokenFence(ctx, X, Y, S, x, y, w, h, r) {
  ctx.strokeStyle = '#a08b6a'; ctx.lineWidth = 1.3 * S;
  ctx.setLineDash([2.2 * S, 2.6 * S, 1.1 * S, 3.4 * S]);
  ctx.strokeRect(X(x), Y(y), X(x + w) - X(x), Y(y + h) - Y(y));
  ctx.setLineDash([]);
}
function house(ctx, X, Y, S, x, y, w, h, wall, roof) {
  const px = X(x), py = Y(y), pw = X(x + w) - X(x), ph = Y(y + h) - Y(y);
  ctx.fillStyle = 'rgba(26,40,14,.22)';
  roundRect(ctx, px + 1.2 * S, py + 1.6 * S, pw, ph, 1 * S, true, false);   // drop shadow
  ctx.fillStyle = wall;
  roundRect(ctx, px, py, pw, ph, 1 * S, true, false);
  ctx.fillStyle = roof;                                                     // roof slab on top
  roundRect(ctx, px - 0.8 * S, py - 1.2 * S, pw + 1.6 * S, ph * 0.44, 1 * S, true, false);
  ctx.strokeStyle = INK; ctx.lineWidth = 0.85 * S;
  roundRect(ctx, px, py, pw, ph, 1 * S, false, true);
  ctx.fillStyle = '#6b4a2f';                                                // door
  roundRect(ctx, px + pw * 0.42, py + ph * 0.6, pw * 0.16, ph * 0.4, 0.4 * S, true, false);
}
function building(ctx, X, Y, S, x, y, w, h, wall, roof, label) {
  const px = X(x), py = Y(y), pw = X(x + w) - X(x), ph = Y(y + h) - Y(y);
  ctx.fillStyle = 'rgba(26,40,14,.22)';
  roundRect(ctx, px + 1.4 * S, py + 1.8 * S, pw, ph, 1.2 * S, true, false);
  ctx.fillStyle = wall; roundRect(ctx, px, py, pw, ph, 1.2 * S, true, false);
  ctx.fillStyle = roof; roundRect(ctx, px - 0.8 * S, py - 1.4 * S, pw + 1.6 * S, ph * 0.3, 1 * S, true, false);
  ctx.strokeStyle = INK; ctx.lineWidth = 1 * S;
  roundRect(ctx, px, py, pw, ph, 1.2 * S, false, true);
  if (label) {
    ctx.fillStyle = 'rgba(42,26,18,.5)';
    ctx.font = `700 ${2.6 * S}px Fredoka, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, px + pw / 2, py + ph * 0.9);
  }
}
function window_(ctx, cx, cy, w, h) {
  ctx.fillStyle = '#9fc9e8';
  ctx.fillRect(cx - w / 2, cy - h / 2, w, h);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, w * 0.12);
  ctx.strokeRect(cx - w / 2, cy - h / 2, w, h);
}
function tree(ctx, cx, cy, r, rnd) {
  ctx.fillStyle = 'rgba(26,40,14,.25)';
  circle(ctx, cx + r * 0.22, cy + r * 0.3, r);
  ctx.fillStyle = '#8a5a35';
  ctx.fillRect(cx - r * 0.12, cy, r * 0.24, r * 0.8);
  const greens = ['#4f9e3a', '#5fb347', '#469033'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = greens[i];
    circle(ctx, cx + (i - 1) * r * 0.42, cy - r * 0.12 + (rnd() - 0.5) * r * 0.2, r * (0.72 - i * 0.05));
  }
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.beginPath(); ctx.arc(cx, cy - r * 0.12, r * 0.78, 0, 7); ctx.stroke();
}
function hedge(ctx, cx, cy, w, rnd) {
  ctx.fillStyle = '#3f8c34';
  for (let i = 0; i < 4; i++) circle(ctx, cx + (i - 1.5) * w * 0.3, cy + (rnd() - 0.5) * w * 0.1, w * 0.3);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, w * 0.06);
  ctx.beginPath(); ctx.arc(cx, cy, w * 0.42, 0, 7); ctx.stroke();
}
function pool(ctx, cx, cy, r) {
  ctx.fillStyle = '#fffdf5'; circle(ctx, cx, cy, r * 1.12);
  ctx.fillStyle = '#4fb8e8'; circle(ctx, cx, cy, r);
  ctx.strokeStyle = INK; ctx.lineWidth = Math.max(1, r * 0.12);
  ctx.beginPath(); ctx.arc(cx, cy, r * 1.12, 0, 7); ctx.stroke();
}
function sprinkler(ctx, cx, cy, r) {
  ctx.strokeStyle = 'rgba(120,200,240,.75)';
  ctx.lineWidth = Math.max(1, r * 0.13);
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, r * (0.45 + i * 0.26), -2.5, -0.7);
    ctx.stroke();
  }
  ctx.fillStyle = '#8d8579'; circle(ctx, cx, cy, r * 0.14);
}
function goal(ctx, cx, cy, w, S, flip) {
  ctx.strokeStyle = '#ffd94a'; ctx.lineWidth = 1.1 * S;
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy); ctx.lineTo(cx - w / 2, cy + (flip ? 1.8 : -1.8) * S);
  ctx.lineTo(cx + w / 2, cy + (flip ? 1.8 : -1.8) * S); ctx.lineTo(cx + w / 2, cy);
  ctx.stroke();
}
function mailbox(ctx, cx, cy, S) {
  ctx.fillStyle = '#6b4a2f'; ctx.fillRect(cx - 0.28 * S, cy, 0.56 * S, 2.4 * S);
  ctx.fillStyle = '#c94f4f';
  roundRect(ctx, cx - 1.3 * S, cy - 1.6 * S, 2.6 * S, 1.7 * S, 0.6 * S, true, false);
  ctx.strokeStyle = INK; ctx.lineWidth = 0.4 * S;
  roundRect(ctx, cx - 1.3 * S, cy - 1.6 * S, 2.6 * S, 1.7 * S, 0.6 * S, false, true);
}

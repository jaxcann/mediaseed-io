// ─────────────────────────────────────────────────────────────
// Replay. Every render frame we snapshot the visual state of the yard into a
// 15-second ring. Playback writes those frames back into the same game object
// the view already draws, so the replay IS the game — same pen, same juice.
// Clips export straight from the canvas via MediaRecorder.
// ─────────────────────────────────────────────────────────────
const SECS = 15, FPS = 60, MAX = SECS * FPS;

function snap(G) {
  return {
    A: G.actors.map(a => ({
      x: a.x, z: a.z, vx: a.vx, vz: a.vz, aim: a.aim, facing: a.facing,
      tagged: a.tagged, invuln: a.invuln, squash: a.squash, whiff: a.whiff, wet: a.wet || 0,
      lunge: a.lunge ? { ...a.lunge } : null, roll: a.roll ? { ...a.roll } : null,
      swing: a.swing ? { ...a.swing } : null, grapple: a.grapple ? { ...a.grapple } : null,
      glide: a.glide, hasFlag: a.hasFlag ? a.hasFlag.team : null,
      dashCd: a.dashCd, lungeCd: a.lungeCd,
      // The newer kits animate off these. Without them a clipped kickflip
      // replays with the skater stuck to the ground and no board, a trampoline
      // bounce has no hop, Karen never raises the horn and the hose arm never
      // comes up — which is exactly the frame anyone would want to clip.
      air: a.air, airT: a.airT, airKind: a.airKind, board: a.board,
      duck: a.duck, hornCd: a.hornCd, sprayCd: a.sprayCd, stun: a.stun,
    })),
    F: Object.fromEntries(['blue', 'red'].map(k => {
      const f = G.flags[k];
      return [k, { x: f.x, z: f.z, home: f.home, dropped: f.dropped, carrier: f.carrier ? G.actors.indexOf(f.carrier) : -1, air: !!f.air }];
    })),
    B: G.balloons.map(b => ({ ...b })), P: G.portals.map(p => ({ ...p })),
    score: { ...G.score }, time: G.time, hazT: G.hazT || 0,
  };
}
function apply(G, s) {
  s.A.forEach((sa, i) => {
    const a = G.actors[i];
    a.x = a.px = sa.x; a.z = a.pz = sa.z; a.vx = sa.vx; a.vz = sa.vz; a.aim = sa.aim; a.facing = sa.facing;
    a.tagged = sa.tagged; a.invuln = sa.invuln; a.squash = sa.squash; a.whiff = sa.whiff; a.wet = sa.wet;
    a.lunge = sa.lunge ? { ...sa.lunge } : null; a.roll = sa.roll ? { ...sa.roll } : null;
    a.swing = sa.swing ? { ...sa.swing } : null; a.grapple = sa.grapple ? { ...sa.grapple } : null;
    a.glide = sa.glide; a.hasFlag = sa.hasFlag ? G.flags[sa.hasFlag] : null;
    a.dashCd = sa.dashCd; a.lungeCd = sa.lungeCd;
    a.air = sa.air; a.airT = sa.airT; a.airKind = sa.airKind; a.board = sa.board;
    a.duck = sa.duck; a.hornCd = sa.hornCd; a.sprayCd = sa.sprayCd; a.stun = sa.stun;
  });
  for (const k of ['blue', 'red']) {
    const f = G.flags[k], sf = s.F[k];
    f.x = sf.x; f.z = sf.z; f.home = sf.home; f.dropped = sf.dropped;
    f.carrier = sf.carrier >= 0 ? G.actors[sf.carrier] : null; f.air = sf.air ? { target: null } : null;
  }
  G.balloons.length = 0; G.balloons.push(...s.B.map(b => ({ ...b })));
  // portals: keep object identity where ids match so the view's meshes persist
  const keep = new Map(G.portals.map(p => [p.id, p]));
  G.portals.length = 0;
  for (const sp of s.P) { const o = keep.get(sp.id) || { ...sp }; Object.assign(o, sp); G.portals.push(o); }
  G.score.blue = s.score.blue; G.score.red = s.score.red; G.time = s.time; G.hazT = s.hazT;
}

export function makeReplay(canvas) {
  const ring = [];
  let live = null, playing = false, idx = 0, speed = 1, acc = 0, recorder = null, chunks = [];
  // The ring is bound to the game object it was recorded from. It used to
  // persist across matches for the page lifetime — harmless when every match
  // ended in a reload, but rematch no longer reloads, so WATCH in a fresh
  // match applied the PREVIOUS match's snapshots onto the new roster (crashing
  // outright when the team sizes differed), and kickball's end card offered a
  // replay of a game it never recorded.
  let bound = null;
  const R = {
    get playing() { return playing; },
    get progress() { return ring.length ? idx / ring.length : 0; },
    speed: 1,
    canPlay(G) { return !!G && G === bound && ring.length >= 30; },
    record(G) {
      if (G !== bound) { ring.length = 0; bound = G; }
      ring.push(snap(G)); if (ring.length > MAX) ring.shift();
    },
    start(G, { save = false } = {}) {
      if (playing || !R.canPlay(G)) return false;
      live = snap(G); playing = true; idx = 0; acc = 0;
      if (save && 'MediaRecorder' in window) {
        chunks = [];
        const stream = canvas.captureStream(60);
        const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m));
        recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
        recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob); a.download = `backyard-clip-${Date.now()}.webm`;
          setTimeout(() => URL.revokeObjectURL(a.href), 10_000);   // the blob outlived the page otherwise
          document.body.appendChild(a); a.click(); a.remove();
        };
        recorder.start();
      }
      return true;
    },
    // advance by real dt; returns true while still playing
    step(G, dt) {
      if (!playing) return false;
      acc += dt * R.speed * FPS;
      while (acc >= 1 && idx < ring.length) { apply(G, ring[idx++]); acc -= 1; }
      if (idx >= ring.length) { R.stop(G); return false; }
      return true;
    },
    stop(G) {
      if (!playing) return;
      playing = false;
      if (live) apply(G, live);
      live = null;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      recorder = null;
    },
  };
  return R;
}

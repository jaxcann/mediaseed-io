// ─────────────────────────────────────────────────────────────
// Sound. Everything synthesized — no files, no loading, no licensing.
// Cartoon foley: whooshes are filtered noise, hits are pitch-dropped sines
// with a noise crack, pickups are two-note bleeps. The ambient bed is wind
// noise with random bird chirps.
// ─────────────────────────────────────────────────────────────
export function makeSound() {
  let ctx = null, master = null, muted = false, vol = 0.5;
  const ensure = () => {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = muted ? 0 : vol;
      // A soft limiter between the mix and the speaker: a tag plus a hurt plus
      // a splash can sum well past 1.0 and hard-clip near max volume.
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -9; lim.knee.value = 24; lim.ratio.value = 12;
      lim.attack.value = 0.003; lim.release.value = 0.24;
      master.connect(lim); lim.connect(ctx.destination);
      ambient();
    } catch { return false; }
    return true;
  };
  const now = () => ctx.currentTime;

  function noiseBuf(sec) {
    const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  }
  let NB = null;
  const noise = () => { const s = ctx.createBufferSource(); s.buffer = NB ??= noiseBuf(2); s.loop = true; return s; };

  function env(node, t0, a, d, peak = 1, sus = 0, r = 0.05) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(peak, t0 + a);
    g.gain.exponentialRampToValueAtTime(Math.max(0.001, sus), t0 + a + d);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + a + d + r);
    node.connect(g); g.connect(master);
    return g;
  }
  function tone(freq, type, t0, a, d, vol, slideTo) {
    const o = ctx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + a + d);
    env(o, t0, a, d, vol);
    o.start(t0); o.stop(t0 + a + d + 0.1);
  }
  function whoosh(t0, dur, vol, hz0, hz1, q = 1) {
    const n = noise();
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(hz0, t0); f.frequency.exponentialRampToValueAtTime(hz1, t0 + dur);
    n.connect(f); env(f, t0, dur * 0.25, dur * 0.75, vol);
    n.start(t0); n.stop(t0 + dur + 0.1);
  }

  const S = {
    dash(v = 1)   { if (!ensure()) return; whoosh(now(), 0.22, 0.35 * v, 400, 2400, 0.8); },
    lunge(v = 1)  { if (!ensure()) return; whoosh(now(), 0.18, 0.45 * v, 1800, 500, 1.2); tone(220, 'triangle', now(), 0.01, 0.12, 0.15 * v, 120); },
    whiff(v = 1)  { if (!ensure()) return; whoosh(now(), 0.25, 0.18 * v, 900, 300, 2); },
    tag(v = 1)    { if (!ensure()) return;
      const t = now();
      tone(160, 'sine', t, 0.005, 0.18, 0.9 * v, 55);
      tone(520, 'square', t, 0.002, 0.05, 0.25 * v, 200);
      whoosh(t, 0.12, 0.5 * v, 3000, 800, 0.6);
    },
    hurt(v = 1)   { if (!ensure()) return; const t = now(); tone(300, 'sawtooth', t, 0.005, 0.3, 0.5 * v, 80); tone(200, 'sine', t + 0.08, 0.01, 0.25, 0.4 * v, 70); },
    shove(v = 1)  { if (!ensure()) return; tone(120, 'sine', now(), 0.005, 0.22, 0.7 * v, 60); whoosh(now(), 0.15, 0.3 * v, 800, 200, 1); },
    pickup(v = 1) { if (!ensure()) return; const t = now(); tone(660, 'square', t, 0.005, 0.08, 0.22 * v); tone(990, 'square', t + 0.09, 0.005, 0.14, 0.22 * v); },
    drop(v = 1)   { if (!ensure()) return; const t = now(); tone(500, 'square', t, 0.005, 0.08, 0.2 * v); tone(330, 'square', t + 0.09, 0.005, 0.14, 0.2 * v); },
    catch_(v = 1) { if (!ensure()) return; const t = now(); [880, 1100, 1320].forEach((f, i) => tone(f, 'triangle', t + i * 0.06, 0.005, 0.16, 0.25 * v)); },
    toss(v = 1)   { if (!ensure()) return; whoosh(now(), 0.3, 0.3 * v, 600, 1800, 1.5); },
    score(team)   { if (!ensure()) return;
      const t = now();
      const seq = [523, 659, 784, 1046, 784, 1046, 1318];
      seq.forEach((f, i) => tone(f, 'square', t + i * 0.09, 0.005, 0.18, 0.22));
      tone(130, 'sine', t, 0.01, 0.6, 0.6, 100);
      setTimeout(() => { for (let i = 0; i < 12; i++) tone(2000 + Math.random() * 3000, 'sine', now() + Math.random() * 0.5, 0.005, 0.08, 0.05); }, 100);
    },
    count(n)      { if (!ensure()) return; tone(n === 0 ? 880 : 440, 'square', now(), 0.005, n === 0 ? 0.4 : 0.12, 0.3); },
    overtime()    { if (!ensure()) return; const t = now(); [330, 330, 330, 262].forEach((f, i) => tone(f, 'sawtooth', t + i * 0.18, 0.01, 0.16, 0.3)); },
    portal(v = 1) { if (!ensure()) return; const t = now(); tone(300, 'sine', t, 0.01, 0.3, 0.3 * v, 1200); whoosh(t, 0.35, 0.25 * v, 300, 3000, 3); },
    grapple(v = 1){ if (!ensure()) return; const t = now(); tone(900, 'square', t, 0.002, 0.05, 0.2 * v, 1400); whoosh(t + 0.03, 0.3, 0.25 * v, 2000, 600, 4); },
    kite(v = 1)   { if (!ensure()) return; whoosh(now(), 0.6, 0.3 * v, 500, 1500, 0.5); },
    balloon(v = 1){ if (!ensure()) return; tone(700, 'triangle', now(), 0.01, 0.15, 0.25 * v, 300); whoosh(now(), 0.15, 0.2 * v, 1500, 4000, 1); },
    splash(v = 1) { if (!ensure()) return; whoosh(now(), 0.3, 0.5 * v, 4000, 1200, 0.4); tone(200, 'sine', now(), 0.005, 0.12, 0.3 * v, 90); },
    click()       { if (!ensure()) return; tone(1200, 'square', now(), 0.002, 0.04, 0.15, 900); },
    // Four of eleven kits had no sound for their special at all.
    horn(v = 1)   { if (!ensure()) return; const t = now();
                    tone(233, 'sawtooth', t, 0.004, 0.34, 0.55 * v);
                    tone(311, 'sawtooth', t, 0.004, 0.34, 0.45 * v);
                    tone(466, 'square',   t, 0.01,  0.30, 0.18 * v);
                    whoosh(t, 0.3, 0.3 * v, 900, 300, 1.2); },
    kickflip(v = 1){ if (!ensure()) return; const t = now();
                    whoosh(t, 0.1, 0.4 * v, 300, 1800, 1.4);          // the pop
                    tone(160, 'square', t, 0.002, 0.05, 0.3 * v, 90);
                    tone(900, 'triangle', t + 0.16, 0.004, 0.06, 0.16 * v, 1500); // board flip
                    tone(120, 'sine', t + 0.42, 0.002, 0.1, 0.4 * v, 60); },      // landing
    duck(v = 1)   { if (!ensure()) return; whoosh(now(), 0.26, 0.28 * v, 1200, 380, 2.2); },
    hose(v = 1)   { if (!ensure()) return; const t = now();
                    whoosh(t, 0.55, 0.42 * v, 2600, 900, 0.7);
                    tone(180, 'sine', t, 0.02, 0.4, 0.14 * v, 120); },
    // ── football ──
    whistle(v = 1) { if (!ensure()) return; const t = now();
      // pea whistle: two beats of a shrill warble
      for (const [dt2, dur] of [[0, 0.28]]) {
        const o = ctx.createOscillator(); o.type = 'square'; o.frequency.value = 2350;
        const lfo = ctx.createOscillator(); lfo.frequency.value = 38;
        const lg = ctx.createGain(); lg.gain.value = 260;
        lfo.connect(lg); lg.connect(o.frequency);
        env(o, t + dt2, 0.008, dur, 0.34 * v, 0, 0.05);   // env wires o -> gain -> master
        o.start(t + dt2); o.stop(t + dt2 + dur + 0.1);
        lfo.start(t + dt2); lfo.stop(t + dt2 + dur + 0.1);
      } },
    hut(v = 1)     { if (!ensure()) return; const t = now();
      tone(190, 'square', t, 0.004, 0.09, 0.5 * v, 120);
      whoosh(t, 0.07, 0.2 * v, 700, 350, 1.5); },
    snagBall(v = 1){ if (!ensure()) return; const t = now();
      tone(120, 'sine', t, 0.003, 0.12, 0.7 * v, 70);
      whoosh(t, 0.08, 0.35 * v, 1100, 400, 0.8); },
    spiral(v = 1)  { if (!ensure()) return; whoosh(now(), 0.5, 0.22 * v, 500, 2100, 1.3); },
    tdHorn(v = 1)  { if (!ensure()) return; const t = now();
      // an air-horn triad and a crowd-ish rush of noise
      [262, 330, 392].forEach(f => tone(f, 'sawtooth', t, 0.02, 0.7, 0.22 * v));
      tone(523, 'sawtooth', t + 0.18, 0.02, 0.6, 0.2 * v);
      whoosh(t + 0.05, 1.0, 0.28 * v, 900, 2600, 0.35); },

    // Match end: a real full-stop, distinct from the mid-match score jingle.
    gameover(win = true) { if (!ensure()) return; const t = now();
      const seq = win ? [523, 659, 784, 1046] : [392, 370, 349, 330];
      seq.forEach((f, i) => tone(f, 'triangle', t + i * 0.16, 0.01, 0.34, 0.3));
      tone(win ? 131 : 110, 'sine', t, 0.02, 1.0, 0.5, win ? 98 : 82);
      if (win) setTimeout(() => { for (let i = 0; i < 8; i++)
        tone(1800 + Math.random() * 2400, 'sine', now() + Math.random() * 0.4, 0.004, 0.1, 0.06); }, 350); },
    // ── kickball ──
    pitchRoll(v = 1) { if (!ensure()) return; whoosh(now(), 0.4, 0.12 * v, 200, 90, 1.6); },
    kickBall(v = 1)  { if (!ensure()) return; const t = now();
      tone(90, 'sine', t, 0.002, 0.16, 1.0 * v, 45);            // the thump
      tone(340, 'triangle', t, 0.002, 0.07, 0.4 * v, 160);
      whoosh(t, 0.16, 0.4 * v, 2200, 500, 0.7); },
    glove(v = 1)     { if (!ensure()) return; const t = now();
      whoosh(t, 0.09, 0.5 * v, 1400, 300, 0.5);
      tone(150, 'sine', t, 0.002, 0.09, 0.5 * v, 80); },
    umpOut(v = 1)    { if (!ensure()) return; const t = now();
      [520, 392].forEach((f, i) => tone(f, 'square', t + i * 0.13, 0.006, 0.2, 0.3 * v)); },
    umpSafe(v = 1)   { if (!ensure()) return; const t = now();
      [392, 523].forEach((f, i) => tone(f, 'triangle', t + i * 0.1, 0.006, 0.18, 0.28 * v)); },
    runIn(v = 1)     { if (!ensure()) return; const t = now();
      [523, 659, 784].forEach((f, i) => tone(f, 'square', t + i * 0.07, 0.005, 0.16, 0.26 * v));
      tone(131, 'sine', t, 0.01, 0.4, 0.45 * v, 105); },
    dinger()         { if (!ensure()) return; const t = now();
      [523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 'square', t + i * 0.08, 0.005, 0.2, 0.28));
      tone(98, 'sawtooth', t, 0.01, 0.7, 0.5, 78);
      for (let i = 0; i < 14; i++) tone(1800 + Math.random() * 2600, 'sine', t + 0.25 + Math.random() * 0.6, 0.004, 0.09, 0.05); },
    inningBell()     { if (!ensure()) return; const t = now();
      [784, 587].forEach((f, i) => tone(f, 'triangle', t + i * 0.16, 0.008, 0.3, 0.24)); },
    unlock()      { ensure(); if (ctx?.state === 'suspended') ctx.resume(); },
    mute(m)       { muted = m; if (master) master.gain.value = m ? 0 : vol; },
    setVolume(v)  { vol = v; if (master && !muted) master.gain.value = v; },
    get muted()   { return muted; },
  };

  // ambient: a soft wind bed + birds that chirp when they feel like it
  function ambient() {
    const n = noise();
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 420;
    const g = ctx.createGain(); g.gain.value = 0.035;
    n.connect(f); f.connect(g); g.connect(master); n.start();
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.13;
    const lg = ctx.createGain(); lg.gain.value = 0.02;
    lfo.connect(lg); lg.connect(g.gain); lfo.start();
    const bird = () => {
      const t = now();
      const base = 2200 + Math.random() * 1800, n = 2 + (Math.random() * 3 | 0);
      for (let i = 0; i < n; i++) tone(base * (1 + (Math.random() - 0.5) * 0.2), 'sine', t + i * 0.11, 0.01, 0.06, 0.06, base * 1.3);
      setTimeout(bird, 2500 + Math.random() * 7000);
    };
    setTimeout(bird, 1500);
  }
  return S;
}

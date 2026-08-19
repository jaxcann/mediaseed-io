// ─────────────────────────────────────────────────────────────────────────────
//  Fairway — the score
// ─────────────────────────────────────────────────────────────────────────────
// Furniture music for a quiet club, and the air around it. Nothing in here is
// a melody asking to be listened to: it is the sound the property makes while
// you are looking at something else — a warm tone now and then from somewhere
// past the pro shop, birds a long way off, wind in the canopy, crickets once
// the light has gone. Erik Satie named the genre and this is written to his
// spec: it should be possible to hear it for an hour and never once notice it
// repeating, because it never does — every event draws its spacing, register,
// voicing and colour fresh, from pools small enough to stay consonant.
//
// The module owns the club's whole MIX GRAPH (game.js hands it a context and
// gets the foley bus back), a real-time lookahead scheduler in the Chris
// Wilson two-clocks pattern, and an offline bench so every level printed in a
// review of this file is a measured one. It deliberately knows nothing about
// the game: game.js gives it a probe() that answers "what part of the day is
// it, how dark, how busy, how quiet do you want me" and that is the entire
// interface between the club and its music.
//
// THE CLOCK DISCIPLINE. The scheduler runs on the AUDIO clock at real-time
// rate — a timer wakes every 400ms, looks 1.2s ahead, and places at most the
// one or two events that belong there. The game clock is only ever read to
// choose a MOOD. So a test that drives a whole simulated day through
// __fairway.step() in four seconds gets four seconds of music, not a day of
// it compressed into a screech; fastForward is a cut, not a fast-forward.

// ── The mix ──────────────────────────────────────────────────────────────────
// One place for levels. Everything below is a bus gain, settable live through
// __fairway.setMix and read back through __fairway.mix().
//
//   foley · the club's objects (game.js's voices) — never ducked, never quiet
//   music · the generative score
//   amb   · the property breathing: wind, birds, crickets
//   world · far-off golf being played
//   verb  · the shared air — a generated convolution tail everything distant
//           sends into, which is what keeps "distant" from meaning "quiet"
//
// music/amb/world/verb meet at one DUCK node that dips briefly under the
// louder foley voices, then the whole graph passes through the same 6kHz room
// shelf and one master gain that carries the mute — ramped, so it cannot pop.

export const MIX = { foley: 1, music: 0.9, amb: 0.75, world: 0.7, verb: 0.85 };

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// A room's tail, synthesized once: stereo noise dying exponentially over 2.4s,
// low-passed progressively harder along its own length because air eats the
// treble off a reverb tail before it eats the tail. ~200k samples, generated
// in a few ms on first gesture, never touched again.
function makeImpulse(ctx, seconds) {
  const n = Math.floor(ctx.sampleRate * (seconds || 2.4));
  const buf = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < n; i++) {
      const k = i / n;
      const a = 0.55 - 0.42 * k;               // the pole tightens down the tail
      lp += ((Math.random() * 2 - 1) - lp) * a;
      d[i] = lp * Math.pow(1 - k, 2.2);
    }
  }
  return buf;
}

// four seconds of noise for the wind — its own buffer, because looping the
// foley module's 0.6s burst under a 400Hz filter would put an audible thrum
// at the loop period right where the wind lives
function makeWindBuf(ctx) {
  const n = Math.floor(ctx.sampleRate * 4);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}

export function makeGraph(ctx) {
  const g = { ctx };
  g.master = ctx.createGain(); g.master.gain.value = 1;
  g.master.connect(ctx.destination);
  g.room = ctx.createBiquadFilter();
  g.room.type = 'highshelf'; g.room.frequency.value = 6000; g.room.gain.value = -5;
  g.room.connect(g.master);
  g.foley = ctx.createGain(); g.foley.gain.value = MIX.foley;
  g.foley.connect(g.room);
  g.duck = ctx.createGain(); g.duck.gain.value = 1;
  g.duck.connect(g.room);
  for (const b of ['music', 'amb', 'world']) {
    g[b] = ctx.createGain(); g[b].gain.value = MIX[b];
    g[b].connect(g.duck);
  }
  g.verb = ctx.createConvolver();
  g.verb.buffer = makeImpulse(ctx);
  g.verbG = ctx.createGain(); g.verbG.gain.value = MIX.verb;
  g.verb.connect(g.verbG).connect(g.duck);
  return g;
}

// a voice's output stage: filter → pan → envelope → bus, with a tap into the
// shared air. Returns the envelope's gain param and the pre-env node chain end.
function stage(g, t0, bus, cutoff, pan, send) {
  const lp = g.ctx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = cutoff; lp.Q.value = 0.4;
  const p = g.ctx.createStereoPanner ? g.ctx.createStereoPanner() : g.ctx.createGain();
  if (p.pan) p.pan.value = pan || 0;
  const env = g.ctx.createGain();
  env.gain.setValueAtTime(0, t0);
  lp.connect(p).connect(env);
  env.connect(g[bus]);
  if (send) {
    const s = g.ctx.createGain(); s.gain.value = send;
    env.connect(s).connect(g.verb);
  }
  return { in: lp, env };
}

// ── The instrument ───────────────────────────────────────────────────────────
// One voice, warm and unhurried: a sine carrier with a 2:1 FM partner whose
// index opens for a breath at the onset and closes as the note settles — the
// difference between a tone that BLOOMS and a tone that beeps — under a
// lowpass, with a soft attack and a release measured in seconds. Detuned a
// few cents each time, because two identical notes an hour apart is the one
// coincidence a generative score cannot afford.
function mtone(g, t0, spec) {
  const ctx = g.ctx;
  const f = spec.freq * (1 + rnd(-0.003, 0.003));
  const o = ctx.createOscillator();
  o.type = 'sine'; o.frequency.value = f;
  const mod = ctx.createOscillator();
  mod.type = 'sine'; mod.frequency.value = f * 2;
  const mg = ctx.createGain();
  mg.gain.setValueAtTime(f * (spec.index || 0.7), t0);
  mg.gain.exponentialRampToValueAtTime(f * 0.06, t0 + spec.dur * 0.6);
  mod.connect(mg).connect(o.frequency);
  const st = stage(g, t0, 'music', spec.cut || 1900, spec.pan || 0, spec.send != null ? spec.send : 0.5);
  o.connect(st.in);
  const a = spec.att || 0.2, rel = spec.rel || spec.dur * 0.7;
  st.env.gain.linearRampToValueAtTime(spec.gain, t0 + a);
  st.env.gain.setTargetAtTime(0, t0 + spec.dur - rel, rel / 3);
  o.start(t0); mod.start(t0);
  o.stop(t0 + spec.dur + 0.1); mod.stop(t0 + spec.dur + 0.1);
}

// birdsong at two hundred yards: two to five short chirps, each one a fast
// rise-and-fall glide (the "chew" shape real song settles into after the
// bandwidth of distance has taken the consonants off it), almost all of it
// handed to the reverb. The gain is tiny on purpose. If a bird ever steps
// forward out of the air, it has failed — this is the property being alive,
// not a feeder outside the window.
function bird(g, t0, spec) {
  const ctx = g.ctx;
  const st = stage(g, t0, 'amb', 5200, spec.pan, 0.85);
  const n = spec.n, f0 = spec.f0;
  let t = t0;
  for (let i = 0; i < n; i++) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    const dur = rnd(0.04, 0.09);
    const fa = f0 * rnd(0.82, 0.95), fb = f0 * rnd(1.04, 1.22);
    o.frequency.setValueAtTime(spec.down ? fb : fa, t);
    o.frequency.exponentialRampToValueAtTime(spec.down ? fa : fb, t + dur * 0.6);
    o.frequency.exponentialRampToValueAtTime(f0 * rnd(0.9, 1.0), t + dur);
    const e = ctx.createGain();
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(spec.gain * rnd(0.7, 1), t + 0.008);
    e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(e).connect(st.in);
    o.start(t); o.stop(t + dur + 0.02);
    t += dur + rnd(0.05, 0.2);
  }
  // the stage envelope just gates the whole gesture open
  st.env.gain.setValueAtTime(1, t0);
  st.env.gain.setValueAtTime(1, t + 0.1);
  return t - t0;
}

// one cricket phrase: a pure tone up near 4.5kHz pulsed at ~28Hz — which is
// simply what a cricket IS, a scraper driven at wing rate — kept short, kept
// quiet, and kept off to one side of the stereo field where the grass is
function cricket(g, t0, spec) {
  const ctx = g.ctx;
  const o = ctx.createOscillator();
  o.type = 'sine'; o.frequency.value = spec.freq;
  const st = stage(g, t0, 'amb', 6500, spec.pan, 0.25);
  o.connect(st.in);
  const pulses = spec.pulses, rate = rnd(26, 31);
  let t = t0;
  for (let i = 0; i < pulses; i++) {
    st.env.gain.setValueAtTime(0.0001, t);
    st.env.gain.linearRampToValueAtTime(spec.gain, t + 0.006);
    st.env.gain.linearRampToValueAtTime(0.0001, t + 0.017);
    t += 1 / rate;
  }
  o.start(t0); o.stop(t + 0.05);
  return t - t0;
}

// a drive struck three fairways away: the click has been absorbed by the
// distance, what arrives is a soft knock and its air — 40ms of low-passed
// noise over a small thump, sent hard into the reverb
function thump(g, t0, spec) {
  const ctx = g.ctx;
  const st = stage(g, t0, 'world', 700, spec.pan, 0.8);
  const s = ctx.createBufferSource();
  s.buffer = spec.noise;
  s.playbackRate.value = rnd(0.8, 1.1);
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = 1.1;
  s.connect(bp).connect(st.in);
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(150, t0);
  o.frequency.exponentialRampToValueAtTime(85, t0 + 0.1);
  o.connect(st.in);
  st.env.gain.setValueAtTime(0, t0);
  st.env.gain.linearRampToValueAtTime(spec.gain, t0 + 0.006);
  st.env.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.14);
  s.start(t0); s.stop(t0 + 0.08);
  o.start(t0); o.stop(t0 + 0.16);
}

// ── The pitch pool ───────────────────────────────────────────────────────────
// F major pentatonic over four octaves from F2 — five notes that cannot land
// wrong against each other, which is what lets the spacing and voicing be
// genuinely random without a single sour interval in an afternoon. The major
// seventh (E) is kept OUTSIDE the pool and substituted in by a per-part
// `color` chance: it is the twilight note, the one with an ache in it, and
// rationing it is what keeps it meaning something.
const F2 = 87.307;
const DEGREES = [0, 2, 4, 7, 9];
const POOL = [];
for (let oct = 0; oct < 4; oct++)
  for (const d of DEGREES) POOL.push(F2 * Math.pow(2, oct + d / 12));

// ── The day, in music ────────────────────────────────────────────────────────
// One row per part of the day. gap is the draw for seconds-until-the-next-
// event; lo/hi index the pool (register); dyad/pedal are voicing chances;
// color is the maj7 substitution chance; rest is the chance an event is
// SILENCE — a beat where the club simply doesn't play, which is half of what
// makes the thing feel unhurried. Dawn is nearly still (First Light belongs
// to the birds), the morning rush is the warm heart of it, the quiet hours
// thin out, twilight glows low with the colour note almost unrationed, and
// night is a distant tone every half minute or two, mostly reverb by the
// time it reaches you.
const PARTS = {
  night:     { gap: [26, 70],  vol: 0.30, lo: 13, hi: 19, dyad: 0,    pedal: 0,    color: 0.06, cut: 1400, att: [0.5, 1.1],  rest: 0.25 },
  dawn:      { gap: [9, 22],   vol: 0.55, lo: 11, hi: 18, dyad: 0.08, pedal: 0,    color: 0.10, cut: 1800, att: [0.3, 0.7],  rest: 0.2 },
  morning:   { gap: [4.5, 10], vol: 1.0,  lo: 6,  hi: 15, dyad: 0.30, pedal: 0.12, color: 0.16, cut: 2100, att: [0.12, 0.4], rest: 0.08 },
  lull:      { gap: [8, 18],   vol: 0.68, lo: 8,  hi: 16, dyad: 0.15, pedal: 0.05, color: 0.12, cut: 1900, att: [0.2, 0.6],  rest: 0.16 },
  afternoon: { gap: [5, 11],   vol: 0.92, lo: 6,  hi: 15, dyad: 0.28, pedal: 0.10, color: 0.16, cut: 2000, att: [0.14, 0.45],rest: 0.1 },
  twilight:  { gap: [6, 13],   vol: 0.82, lo: 4,  hi: 12, dyad: 0.35, pedal: 0.10, color: 0.32, cut: 1500, att: [0.2, 0.6],  rest: 0.1 },
};
// the ambience draws, per part: seconds between bird gestures (null = no
// birds), and the same for far-off play. Dawn chorus is the one place the
// birds lead — it is the truest thing about a golf course at that hour.
const BIRD_GAP = { night: null, dawn: [4, 10], morning: [8, 20], lull: [10, 26], afternoon: [9, 22], twilight: [16, 36] };
const PLAY_GAP = [11, 26];

// One music note at vol 1, before the bus. TUNED BY MEASUREMENT, not by ear:
// at 0.055 a morning dyad peaked at -22.6dB through the finished graph —
// louder than the celebrate fanfare (-26.3) and a full 10dB over the page
// turn, which is a score sitting in front of the club it is furniture for.
// 0.034 puts a single tone at about -32 peak: just under the loudest paper,
// well under every celebration, exactly where a thing you only notice
// stopping belongs.
const BASE_GAIN = 0.034;

// ── The scheduler ────────────────────────────────────────────────────────────
export function startScore(g, probe, opts) {
  const ctx = g.ctx;
  const o = opts || {};
  const log = [];
  const note = (kind, at, detail) => {
    nEvents++;
    log.push(Object.assign({ kind, at: +at.toFixed(2) }, detail || {}));
    if (log.length > 64) log.shift();
  };
  const noiseBuf = makeWindBuf(ctx);   // shared by the wind and the thumps

  // the melodic memory: a random WALK over the pool, not a uniform draw — a
  // step of one or two degrees most of the time, a leap now and then, never
  // the same note twice running. It is the difference between wind chimes
  // and someone at the back of the room half-playing a piano.
  let walkIdx = 9;
  function drawNote(p) {
    const step = Math.random() < 0.18 ? pick([-4, -3, 3, 4]) : pick([-2, -1, 1, 2]);
    walkIdx = Math.max(p.lo, Math.min(p.hi, walkIdx + step));
    if (walkIdx <= p.lo || walkIdx >= p.hi) walkIdx += walkIdx <= p.lo ? 1 : -1;
    return walkIdx;
  }

  // next-event cursors, on the audio clock
  let musicAt = ctx.currentTime + rnd(1.5, 4);
  let birdAt = ctx.currentTime + rnd(2, 6);
  let cricketAt = ctx.currentTime + rnd(1, 3);
  let playAt = ctx.currentTime + rnd(6, 14);
  let liftUntil = 0, liftLock = 0;
  let forced = null;
  let paused = false, quietNow = null;
  // the test override on the hidden-tab pause: a headless pane (and the
  // browser this game is judged in drives one) reports visibilityState
  // 'hidden' while very much watching, so wake(true) lets the scheduler run
  // for it. Play never sets this; __fairway.scoreWake does.
  let ignoreHidden = false;

  // the wind is the one permanent voice: a 4s noise loop under a bandpass,
  // its gain swollen by two slow LFOs at 0.215Hz and 0.167Hz — the literal
  // frequencies of the canopy-sway shader's two sine terms (1.35 and 1.05
  // rad/s), so the air audibly moves at the rate the trees visibly do. All
  // of it runs on the audio thread; it costs the main thread nothing.
  const wind = {};
  {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf; src.loop = true; src.playbackRate.value = 0.4;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 430; bp.Q.value = 0.55;
    const gust = ctx.createGain(); gust.gain.value = 1;
    const level = ctx.createGain(); level.gain.value = 0;   // faded up on first tick
    src.connect(bp).connect(gust).connect(level).connect(g.amb);
    for (const [hz, depth, target] of [
      [0.2149, 0.34, gust.gain], [0.167, 0.2, gust.gain], [0.19, 130, bp.frequency]]) {
      const lfo = ctx.createOscillator(); lfo.frequency.value = hz;
      const lg = ctx.createGain(); lg.gain.value = depth;
      lfo.connect(lg).connect(target); lfo.start();
    }
    src.start();
    wind.level = level; wind.base = 0.036;   // ≈ -34dB peak measured — air, not weather
  }

  // FOLEY DUCK: the club's objects sit in front of its music. A page turn or
  // a paid green fee pulls the whole soft layer down 5dB for a quarter of a
  // second and lets it back up over most of another — enough that the object
  // reads clearly, not enough that the room audibly pumps.
  let duckedAt = -9;
  function duck() {
    const now = ctx.currentTime;
    if (now - duckedAt < 0.08) return;      // a burst extends, it doesn't restack
    duckedAt = now;
    g.duck.gain.cancelScheduledValues(now);
    g.duck.gain.setTargetAtTime(0.55, now, 0.02);
    g.duck.gain.setTargetAtTime(1, now + 0.22, 0.3);
  }

  function partParams(id) {
    const p = Object.assign({}, PARTS[id] || PARTS.lull);
    const lifting = ctx.currentTime < liftUntil;
    if (lifting) {
      p.gap = [p.gap[0] * 0.75, p.gap[1] * 0.75];
      p.dyad = Math.min(0.5, p.dyad + 0.15);
      p.color = Math.min(0.4, p.color + 0.1);
      p.vol = Math.min(1.1, p.vol * 1.1);
    }
    if (o.reduceMotion && o.reduceMotion()) {
      // reduced motion's audio equivalent is reduced insistence: half again
      // the space between events, and a touch less of everything
      p.gap = [p.gap[0] * 1.6, p.gap[1] * 1.6];
      p.vol *= 0.85;
    }
    return p;
  }

  function freqOf(idx, p) {
    // the colour note: swap this pool note for the maj7 just below its octave
    if (Math.random() < p.color) {
      const oct = Math.floor(idx / 5);
      return F2 * Math.pow(2, oct + 11 / 12);
    }
    return POOL[idx];
  }

  function scheduleMusic(t0, part, p) {
    if (Math.random() < p.rest) { note('rest', t0, { part }); return; }
    const idx = drawNote(p);
    const att = rnd(p.att[0], p.att[1]);
    const dur = rnd(2.2, 4.2);
    const gain = BASE_GAIN * p.vol * rnd(0.75, 1.05);
    const pan = rnd(-0.25, 0.25);
    const f = freqOf(idx, p);
    mtone(g, t0, { freq: f, dur, att, gain, cut: p.cut * rnd(0.85, 1.15), pan, index: rnd(0.4, 0.9) });
    let voiced = 'tone';
    if (Math.random() < p.dyad && idx + 3 <= p.hi) {
      // a consonant partner (two or three pool steps is always a 3rd/4th/5th/6th
      // in pentatonic), landing a hand's-width late, a shade softer
      const j = idx + pick([2, 3]);
      mtone(g, t0 + rnd(0.06, 0.35), { freq: POOL[j], dur: dur * rnd(0.8, 1), att: att * 1.2,
        gain: gain * 0.6, cut: p.cut, pan: -pan, index: rnd(0.3, 0.7) });
      voiced = 'dyad';
    } else if (Math.random() < p.pedal) {
      // the ground under the room: a very soft, very long root or fifth
      mtone(g, t0 + rnd(0, 0.4), { freq: pick([POOL[0], POOL[3]]), dur: rnd(6, 9), att: 1.4,
        gain: gain * 0.5, cut: 900, pan: 0, index: 0.25 });
      voiced = 'pedal';
    }
    note(voiced, t0, { part, hz: +f.toFixed(1), gain: +gain.toFixed(4) });
  }

  function scheduleBird(t0, part) {
    const f0 = rnd(2300, 4100);
    const gesture = { n: 2 + Math.floor(Math.random() * 4), f0,
      gain: rnd(0.010, 0.02), pan: rnd(-0.7, 0.7), down: Math.random() < 0.4, };
    bird(g, t0, gesture);
    note('bird', t0, { part, hz: Math.round(f0) });
    // sometimes another answers from across the property, further off
    if (Math.random() < 0.28) {
      bird(g, t0 + rnd(0.9, 2.2), { n: 1 + Math.floor(Math.random() * 3),
        f0: f0 * rnd(0.9, 1.1), gain: gesture.gain * 0.6, pan: -gesture.pan, down: !gesture.down });
    }
  }

  const CRICKETS = [{ freq: 4250, pan: -0.55 }, { freq: 4650, pan: 0.6 }];
  function scheduleCricket(t0) {
    const c = pick(CRICKETS);
    cricket(g, t0, { freq: c.freq * rnd(0.98, 1.02), pan: c.pan,
      pulses: 6 + Math.floor(Math.random() * 9), gain: rnd(0.006, 0.010) });
    note('cricket', t0, {});
  }

  // ── the timer ──
  // 400ms of wake, 1.2s of lookahead: enough that a busy main thread never
  // starves the schedule, sparse enough that the whole tick is a handful of
  // comparisons almost every time it runs. Hidden tabs don't schedule at all —
  // the sim has stopped, and a club nobody is looking at doesn't play to the
  // empty room; the cursors clamp forward on return so nothing bursts.
  const HORIZON = 1.2;
  let tickLast = 0, tickMax = 0, nEvents = 0;   // measured, for status().perf
  function tick() {
    if (!probe) return;
    const w0 = performance.now();
    if (ctx.state !== 'running' || (document.hidden && !ignoreHidden)) { paused = true; return; }
    const now = ctx.currentTime;
    if (paused) {   // returning from a hidden tab: drop the missed events
      musicAt = Math.max(musicAt, now + rnd(0.5, 2));
      birdAt = Math.max(birdAt, now + rnd(1, 3));
      cricketAt = Math.max(cricketAt, now + rnd(0.5, 2));
      playAt = Math.max(playAt, now + rnd(2, 5));
      paused = false;
    }
    const pr = probe();
    const off = pr.muted || pr.quiet;
    if (off !== quietNow) {
      quietNow = off;
      const t = ctx.currentTime;
      for (const b of ['music', 'amb', 'world']) g[b].gain.setTargetAtTime(off ? 0 : MIX[b], t, 0.06);
      g.verbG.gain.setTargetAtTime(off ? 0 : MIX.verb, t, 0.06);
    }
    if (off) return;                      // scheduling stops; tails ring out
    const part = forced || pr.part;
    const p = partParams(part);

    if (musicAt < now + HORIZON) {
      scheduleMusic(Math.max(musicAt, now + 0.05), part, p);
      musicAt = Math.max(musicAt, now) + rnd(p.gap[0], p.gap[1]);
    }
    const bg = BIRD_GAP[part];
    if (bg && birdAt < now + HORIZON) {
      scheduleBird(Math.max(birdAt, now + 0.05), part);
      birdAt = Math.max(birdAt, now) + rnd(bg[0], bg[1]) * (o.reduceMotion && o.reduceMotion() ? 1.5 : 1);
    }
    if (pr.night > 0.6 && cricketAt < now + HORIZON) {
      if (Math.random() > 0.35) scheduleCricket(Math.max(cricketAt, now + 0.05));
      cricketAt = Math.max(cricketAt, now) + rnd(1.8, 4.5);
    }
    // far-off play: only when the course is genuinely busy, and more often
    // the busier it is — the sound of a full tee sheet from the terrace
    if (pr.golfers >= 2 && pr.night < 0.5 && playAt < now + HORIZON) {
      if (Math.random() < Math.min(0.85, 0.2 + pr.golfers / 12)) {
        thump(g, Math.max(playAt, now + 0.05), { noise: noiseBuf, gain: rnd(0.02, 0.032), pan: rnd(-0.5, 0.5) });
        note('play', playAt, { golfers: pr.golfers });
      }
      playAt = Math.max(playAt, now) + rnd(PLAY_GAP[0], PLAY_GAP[1]);
    }
    // the wind follows the light: fuller through the day, settling at night
    wind.level.gain.setTargetAtTime(wind.base * (1 - pr.night * 0.45), now, 2);
    tickLast = performance.now() - w0;
    if (tickLast > tickMax) tickMax = tickLast;
  }
  const timer = setInterval(tick, 400);
  tick();

  return {
    duck,
    // the lift: a moment worth celebrating warms the score for a quarter
    // minute — closer spacing, more voicing, more colour — and answers at
    // once with one gentle rising sixth. It is a change of temperature, not
    // a sting; rate-limited so a record inside a celebrated moment doesn't
    // ask twice.
    lift(force) {
      const now = ctx.currentTime;
      if (!force && now < liftLock) return false;
      liftLock = now + 20; liftUntil = now + 16;
      const pr = probe ? probe() : { muted: true };
      if (!pr.muted && !pr.quiet) {
        const p = partParams(forced || pr.part);
        const idx = Math.min(p.hi - 3, Math.max(p.lo, walkIdx));
        mtone(g, now + 0.05, { freq: POOL[idx], dur: 2.6, att: 0.1, gain: BASE_GAIN * p.vol * 0.9, cut: 2300, pan: -0.1 });
        mtone(g, now + 0.4, { freq: POOL[idx + 3], dur: 3.4, att: 0.14, gain: BASE_GAIN * p.vol * 0.75, cut: 2300, pan: 0.15 });
        note('lift', now, {});
      }
      return true;
    },
    forcePart(id) { forced = id && PARTS[id] ? id : null; return forced; },
    wake(on) { ignoreHidden = !!on; return ignoreHidden; },
    setLevel(bus, v) {
      if (!(bus in MIX)) return null;
      MIX[bus] = Math.max(0, Math.min(1.5, +v || 0));
      const n = bus === 'verb' ? g.verbG : g[bus];
      if (n && !quietNow) n.gain.setTargetAtTime(MIX[bus], ctx.currentTime, 0.03);
      return MIX[bus];
    },
    levels() {
      return { mix: Object.assign({}, MIX),
        node: { foley: +g.foley.gain.value.toFixed(3), music: +g.music.gain.value.toFixed(3),
          amb: +g.amb.gain.value.toFixed(3), world: +g.world.gain.value.toFixed(3),
          verb: +g.verbG.gain.value.toFixed(3), duck: +g.duck.gain.value.toFixed(3),
          master: +g.master.gain.value.toFixed(3), wind: +wind.level.gain.value.toFixed(4) } };
    },
    status() {
      const now = ctx.currentTime;
      const pr = probe ? probe() : null;
      return {
        running: true, ctx: ctx.state, paused, now: +now.toFixed(2),
        hidden: document.hidden, wake: ignoreHidden,
        part: pr ? pr.part : null, forced, quiet: !!quietNow,
        night: pr ? +(+pr.night).toFixed(2) : null,
        lift: +Math.max(0, liftUntil - now).toFixed(1),
        next: { music: +(musicAt - now).toFixed(1), bird: +(birdAt - now).toFixed(1),
          cricket: +(cricketAt - now).toFixed(1), play: +(playAt - now).toFixed(1) },
        params: partParams(forced || (pr ? pr.part : 'lull')),
        // the whole main-thread cost of the score, measured: the last
        // scheduler pass and the worst one, in ms, and every event it has
        // ever placed (rests included) — the number a step()-driven day is
        // checked against
        perf: { lastMs: +tickLast.toFixed(3), maxMs: +tickMax.toFixed(3), events: nEvents },
        levels: this.levels(), log: log.slice(),
      };
    },
    stop() { clearInterval(timer); },
  };
}

// ── The bench ────────────────────────────────────────────────────────────────
// Every voice above, rendered offline through the same graph it plays through
// live and read back as numbers — the score's equivalent of foleyMeasure, so
// "the birds are far away" is a measured fact (about -34dB peak against the
// foley page turn's -22) and not an adjective. Costs nothing at play time;
// touches nothing live.
export async function measure(kind, seconds) {
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OC) return null;
  const dur = seconds || (kind === 'wind' ? 2 : 4);
  const off = new OC(2, Math.ceil(44100 * dur), 44100);
  const g = makeGraph(off);
  const noise = makeWindBuf(off);
  switch (kind) {
    case 'tone': mtone(g, 0.05, { freq: POOL[9], dur: 3, att: 0.2, gain: BASE_GAIN, cut: 2000 }); break;
    case 'dyad':
      mtone(g, 0.05, { freq: POOL[9], dur: 3, att: 0.2, gain: BASE_GAIN, cut: 2000 });
      mtone(g, 0.25, { freq: POOL[12], dur: 3, att: 0.25, gain: BASE_GAIN * 0.6, cut: 2000 });
      break;
    case 'pedal': mtone(g, 0.05, { freq: POOL[0], dur: 3.5, att: 1.4, gain: BASE_GAIN * 0.5, cut: 900, index: 0.25 }); break;
    case 'night': mtone(g, 0.05, { freq: POOL[16], dur: 3.5, att: 0.8, gain: BASE_GAIN * 0.3, cut: 1400 }); break;
    case 'bird': bird(g, 0.05, { n: 4, f0: 3200, gain: 0.016, pan: 0.4, down: false }); break;
    case 'cricket': cricket(g, 0.05, { freq: 4400, pan: 0.5, pulses: 10, gain: 0.008 }); break;
    case 'play': thump(g, 0.05, { noise, gain: 0.026, pan: 0 }); break;
    case 'wind': {
      const src = off.createBufferSource();
      src.buffer = noise; src.loop = true; src.playbackRate.value = 0.4;
      const bp = off.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 430; bp.Q.value = 0.55;
      const lv = off.createGain(); lv.gain.value = 0.036;
      src.connect(bp).connect(lv).connect(g.amb);
      src.start(0);
      break;
    }
    default: return null;
  }
  const buf = await off.startRendering();
  let peak = 0, sum = 0, on = 0, len = buf.length;
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) {
      const a = Math.abs(d[i]);
      if (a > peak) peak = a;
      if (a > 0.0006) on = Math.max(on, i);
      sum += d[i] * d[i];
    }
  }
  const db = x => +(20 * Math.log10(x || 1e-9)).toFixed(1);
  return { kind, peak: db(peak), rms: db(Math.sqrt(sum / Math.max(1, 2 * (on + 1)))), ms: Math.round(on / 44.1) };
}

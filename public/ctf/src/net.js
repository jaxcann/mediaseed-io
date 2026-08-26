// ─────────────────────────────────────────────────────────────
// Client networking.
// Your own kid is PREDICTED: every input steps the shared kernel locally the
// same tick you press it, so movement feel is identical to offline. When a
// snapshot arrives we rewind to the server's authoritative state and replay
// the inputs it hasn't seen yet. Everyone else INTERPOLATES ~120ms behind.
// ─────────────────────────────────────────────────────────────
import { CFG, TEAMS } from './config.js';
import { makeActor, stepActor, updateAim, separateBodies } from './actor.js';
import { applyKit } from './kits.js';
import { colliders, hazards } from './layout.js';

const lerp = (a, b, t) => a + (b - a) * t;
const alerp = (a, b, t) => { let d = ((b - a + Math.PI) % (Math.PI*2)) - Math.PI; return a + d * t; };

export function makeNet(handlers) {
  const wsUrl = window.WS_URL ||
    ((location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + location.pathname.replace(/\/[^/]*$/, '/'));
  const ws = new WebSocket(wsUrl);
  const N = {
    ws, status: 'connecting', me: null, shadow: null, slot: -1, ranked: false,
    world: { colliders: colliders(), fx: null },
    pending: [], seq: 0, snaps: [], sendBuf: [],
    end: null,
  };

  ws.onopen = () => {
    N.status = 'lobby';
    ws.send(JSON.stringify({ t: 'hello', token: localStorage.byToken || undefined, name: localStorage.byName || undefined }));
  };
  ws.onclose = () => {
    const was = N.status;
    N.status = 'offline';
    handlers.onStatus?.(N);
    // A drop mid-queue or mid-match used to only rewrite a label inside the
    // HIDDEN lobby panel — the match froze mid-frame with zero on-screen signal
    // while the server quietly handed your kid to a bot.
    if (was === 'playing' || was === 'queue') handlers.onDrop?.(was);
  };
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.t === 'welcome') {
      localStorage.byToken = m.token;
      N.me = m; N.status = 'lobby';
      handlers.onStatus?.(N);
    } else if (m.t === 'queued') {
      N.status = 'queue'; N.queueN = m.n;
      handlers.onStatus?.(N);
    } else if (m.t === 'start') {
      N.slot = m.slot; N.ranked = m.ranked; N.roster = m.roster; N.yard = m.yard || 'day'; N.map = m.map || 'backyard';
      N.shadow = buildShadow(m.roster, m.slot, N);
      N.shadow.yard = N.yard; N.shadow.map = N.map; N.shadow.hazards = hazards(N.yard, N.map);
      N.snaps.length = 0; N.pending.length = 0; N.seq = 0; N.end = null;
      N.status = 'playing';
      handlers.onStart?.(N);
    } else if (m.t === 'snap' && N.shadow) {
      m.tRecv = performance.now();
      N.snaps.push(m);
      if (N.snaps.length > 20) N.snaps.shift();
      applyAuthoritative(N, m);
    } else if (m.t === 'end') {
      N.end = m; N.status = 'ended';
      if (N.shadow) N.shadow.over = m.winner;
      handlers.onEnd?.(N);
    }
  };

  // send() on a CONNECTING socket throws; on a CLOSED one it silently drops.
  // Queue clicks arriving before onopen are buffered and flushed; clicks after
  // the socket died surface as 'offline' instead of an infinite spinner.
  const outbox = [];
  const send = msg => {
    if (ws.readyState === WebSocket.OPEN) { ws.send(JSON.stringify(msg)); return true; }
    if (ws.readyState === WebSocket.CONNECTING) { outbox.push(msg); return true; }
    N.status = 'offline'; handlers.onStatus?.(N);
    return false;
  };
  const openFlush = ws.onopen;
  ws.onopen = () => { openFlush(); while (outbox.length) ws.send(JSON.stringify(outbox.shift())); };

  N.queue = (kit, name, arena) => send({ t: 'queue', kit, name, arena });
  N.cancel = () => { send({ t: 'cancel' }); if (N.status !== 'offline') N.status = 'lobby'; };
  N.setName = name => { localStorage.byName = name; };
  // called when the tab hides: rAF (and therefore N.tick) is about to stop, so
  // push one neutral input now rather than leave the last stick held server-side
  N.idle = () => {
    if (N.status !== 'playing') return;
    N.seq++;
    const rec = { s: N.seq, dx: 0, dz: 0, da: false, pr: false, sp: false, ax: 0, az: 0 };
    N.pending.push(rec);
    send({ t: 'in', b: [rec] });
  };

  // called every fixed sim tick with the local input
  N.tick = inp => {
    if (N.status !== 'playing' || !N.shadow) return;
    const me = N.shadow.actors[N.slot];
    N.seq++;
    const rec = { s: N.seq, dx: inp.dx, dz: inp.dz, da: inp.dash, pr: inp.primary,
                  sp: inp.special, ax: inp.aimX, az: inp.aimZ };
    N.pending.push(rec);
    if (N.pending.length > 240) N.pending.shift();
    N.sendBuf.push(rec);
    if (N.sendBuf.length >= 2) {
      ws.send(JSON.stringify({ t: 'in', b: N.sendBuf }));
      N.sendBuf = [];
    }
    // predict own movement with the shared kernel, this very tick.
    // The aim step is the caller's now, and must run exactly once — the server
    // runs one too, so any second call here is a divergence.
    const pin = { dx: inp.dx, dz: inp.dz, dash: inp.dash, primary: inp.primary,
                  special: false,             // world-entity specials resolve server-side
                  aimX: inp.aimX, aimZ: inp.aimZ };
    updateAim(me, pin, 1 / CFG.sim.hz);
    stepActor(me, pin, 1 / CFG.sim.hz, N.world);
    // The server separates bodies every tick; predicting without it drifts the
    // local kid over half a metre in half a second of contact, then snaps.
    separateBodies(N.shadow.actors, N.world);
    // countdown toasts
    for (const e of N.shadow.events) e.t -= 1 / CFG.sim.hz;
    N.shadow.events = N.shadow.events.filter(e => e.t > 0);
  };

  // called every render frame: pull remote entities toward interpolated state
  N.render = () => {
    if (!N.shadow || N.snaps.length === 0) return;
    const now = performance.now();
    const target = now - 120;
    let a = N.snaps[0], b = N.snaps[N.snaps.length - 1];
    for (let i = N.snaps.length - 1; i > 0; i--) {
      if (N.snaps[i - 1].tRecv <= target) { a = N.snaps[i - 1]; b = N.snaps[i]; break; }
    }
    const span = Math.max(1, b.tRecv - a.tRecv);
    const t = Math.max(0, Math.min(1, (target - a.tRecv) / span));
    const G = N.shadow;

    G.actors.forEach((act, i) => {
      const A0 = a.A[i], A1 = b.A[i];
      if (i !== N.slot) {
        act.x = act.px = lerp(A0.x, A1.x, t);
        act.z = act.pz = lerp(A0.z, A1.z, t);
        act.vx = lerp(A0.vx, A1.vx, t);
        act.vz = lerp(A0.vz, A1.vz, t);
        act.aim = alerp(A0.aim, A1.aim, t);
        act.facing = alerp(A0.fc, A1.fc, t);
      }
      // discrete/anim state from the fresher snap (own actor too — tags,
      // flags, and world-specials are server truth)
      const S = b.A[i];
      act.tagged = !!S.tg; act.respawnT = S.rt; act.invuln = S.iv;
      act.glide = !!S.gl;
      act.lunge = S.lu ? { phase: ['','wind','active','recover'][S.lu[0]], t: S.lu[1], power: S.lu[2], dx:0, dz:0, hit:false } : (i === N.slot ? act.lunge : null);
      if (i !== N.slot || S.rl) act.roll = S.rl ? { t: S.rl[0], dx: S.rl[1], dz: S.rl[2], spin: act.roll?.spin ?? 0 } : null;
      act.swing = S.sw ? { ax: S.sw[0], az: S.sw[1], len: S.sw[2], t: S.sw[3] } : null;
      act.grapple = S.gr ? { x: S.gr[0], z: S.gr[1], phase: 'pull', t: 0 } : null;
      act.hasFlag = S.hf ? G.flags[S.hf === 1 ? 'blue' : 'red'] : null;
      act.dashCd = S.dc; act.lungeCd = S.lc; act.rollCd = S.rc;
      act.grappleCd = S.gc; act.swingCd = S.sc;
      act.tossCd = S.tc; act.balloonCd = S.bc; act.portalCd = S.pc;
    });

    for (const k of ['blue', 'red']) {
      const F0 = a.F[k], F1 = b.F[k], f = G.flags[k];
      f.x = lerp(F0.x, F1.x, t); f.z = lerp(F0.z, F1.z, t);
      f.home = !!F1.home; f.dropped = !!F1.dropped;
      f.carrier = F1.carrier >= 0 ? G.actors[F1.carrier] : null;
      f.air = F1.air ? (f.air || { target: null }) : null;
    }

    // balloons / portals reconciled by id, objects kept stable for the view
    syncById(G.balloons, b.B, s => ({ id: s.id, x: s.x, z: s.z, life: s.life }),
             (o, s0, s1) => { o.x = lerp(s0.x, s1.x, t); o.z = lerp(s0.z, s1.z, t); o.life = s1.life; }, a.B);
    syncById(G.portals, b.P, s => ({ id: s.id, x: s.x, z: s.z, life: s.life, owner: G.actors[s.o] }),
             (o, s0, s1) => { o.life = s1.life; }, a.P);

    G.score.blue = b.score.blue; G.score.red = b.score.red;
    G.time = b.time; G.hazT = b.hz || 0;
    for (const e of b.ev) {
      if (!e._seen) { e._seen = true; G.events.push({ text: e.x, color: e.c, t: 2.4, kind: e.k || 'info' }); }
    }
    if (b.fxp && !b._fxSeen) { b._fxSeen = true; if (b.fxp.tag) G.lastTag = b.fxp.tag; if (b.fxp.score) G.lastScore = b.fxp.score; }
  };

  return N;
}

function syncById(list, snapList, create, update, prevList) {
  const prev = new Map((prevList || []).map(s => [s.id, s]));
  const want = new Map(snapList.map(s => [s.id, s]));
  for (let i = list.length - 1; i >= 0; i--) if (!want.has(list[i].id)) list.splice(i, 1);
  for (const [id, s1] of want) {
    let o = list.find(x => x.id === id);
    if (!o) { o = create(s1); list.push(o); }
    update(o, prev.get(id) ?? s1, s1);
  }
}

// authoritative correction: adopt server state for our actor, then replay
// every input the server hasn't consumed yet
function applyAuthoritative(N, snap) {
  const me = N.shadow.actors[N.slot];
  const S = snap.A[N.slot];
  me.x = me.px = S.x; me.z = me.pz = S.z;
  me.vx = S.vx; me.vz = S.vz;
  me.aim = S.aim; me.facing = S.fc;
  me.tagged = !!S.tg; me.invuln = S.iv;
  me.dashCd = S.dc; me.lungeCd = S.lc;
  me.lunge = S.lu ? { phase: ['','wind','active','recover'][S.lu[0]], t: S.lu[1], power: S.lu[2],
                      dx: Math.sin(S.aim), dz: Math.cos(S.aim), hit: false } : null;
  me.roll = S.rl ? { t: S.rl[0], dx: S.rl[1], dz: S.rl[2], spin: me.roll?.spin ?? 0 } : null;
  me.swing = S.sw ? { ax: S.sw[0], az: S.sw[1], len: S.sw[2], t: S.sw[3] } : null;
  me.grapple = S.gr ? { x: S.gr[0], z: S.gr[1], phase: 'pull', t: 0 } : null;
  me.hasFlag = S.hf ? N.shadow.flags[S.hf === 1 ? 'blue' : 'red'] : null;
  me.wet = S.wt || 0;
  me.stun = S.st || 0;      // so prediction and rollback both respect the horn

  N.pending = N.pending.filter(p => p.s > snap.ack);
  for (const p of N.pending) {
    const rin = { dx: p.dx, dz: p.dz, dash: p.da, primary: p.pr, special: false,
                  aimX: p.ax, aimZ: p.az };
    updateAim(me, rin, 1 / CFG.sim.hz);          // one aim step per replayed tick
    stepActor(me, rin, 1 / CFG.sim.hz, N.world);
    separateBodies(N.shadow.actors, N.world);
  }
}

function buildShadow(roster, mySlot, N) {
  const actors = roster.map(r => {
    const T = TEAMS[r.team];
    const a = makeActor(r.team, T.base.x, T.base.z, r.slot === mySlot);
    applyKit(a, r.kit);
    a.variant = r.variant;
    return a;
  });
  return {
    actors, player: actors[mySlot],
    flags: {
      blue: { team:'blue', x: TEAMS.blue.base.x, z: 0, home: true, carrier: null, dropped: false, air: null },
      red:  { team:'red',  x: TEAMS.red.base.x,  z: 0, home: true, carrier: null, dropped: false, air: null },
    },
    balloons: [], portals: [], score: { blue: 0, red: 0 }, hazards: [], hazT: 0,
    time: CFG.match.duration, over: null, events: [], phase: 'play',
    world: N.world,
  };
}

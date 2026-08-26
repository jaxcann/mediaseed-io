import { CFG } from './config.js';
import { KITS, KIT_KEYS } from './kits.js';
import { ARENAS } from './layout.js';
import { TIERS, applyDifficulty } from './config.js';

const KNOBS = [
  ['move.maxSpeed', 3, 18], ['move.accel', 10, 120], ['move.grip', 0.5, 30],
  ['dash.impulse', 4, 30], ['dash.cooldown', 0.1, 2.5],
  ['lunge.windup', 0.01, 0.35], ['lunge.recover', 0.05, 0.7], ['lunge.cooldown', 0.15, 1.6],
  ['lunge.impulse', 3, 26], ['lunge.stack', 0, 1.2], ['lunge.reach', 0.2, 2.2],
  ['cam.lag', 1, 20], ['cam.height', 12, 46], ['cam.tilt', 0.2, 1.55],
];
const get = p => p.split('.').reduce((o, k) => o[k], CFG);
const set = (p, v) => { const k = p.split('.'); k.slice(0, -1).reduce((o, x) => o[x], CFG)[k.at(-1)] = v; };
const SPECIAL_LABEL = { toss:'TOSS', roll:'ROLL', portal:'PORTAL', grapple:'HOOK', kite:'KITE',
                        hurdle:'KICKFLIP', horn:'AIR HORN', spray:'HOSE', duck:'DUCK', none:'—' };

const DEFAULTS = { vol: 0.5, ink: 1.0, cam: 23.5, arena: 'backyard-day', rumble: true, mute: false, camera: 'broadcast', kit: 'runner', diff: 'varsity' };
export function loadSettings() { try { return { ...DEFAULTS, ...JSON.parse(localStorage.bySettings || '{}') }; } catch { return { ...DEFAULTS }; } }

export function makeUI(handlers) {
  const el = id => document.getElementById(id);
  document.body.classList.add('title');
  let G = null, chosenKit = null, mode = null;

  // ── settings ──
  const settings = loadSettings();
  const sp = el('settings');
  const save = () => { localStorage.bySettings = JSON.stringify(settings); handlers.onSettings?.(settings); };
  el('sVol').value = settings.vol; el('sInk').value = settings.ink; el('sCam').value = settings.cam;
  el('sRumble').checked = settings.rumble; el('sMute').checked = settings.mute;
  el('sVol').oninput = e => { settings.vol = +e.target.value; save(); };
  el('sInk').oninput = e => { settings.ink = +e.target.value; save(); };
  el('sCam').oninput = e => { settings.cam = +e.target.value; save(); };
  el('sRumble').onchange = e => { settings.rumble = e.target.checked; save(); };
  const dsel = el('sDiff');
  dsel.innerHTML = Object.entries(TIERS).map(([k, t]) =>
    `<option value="${k}">${t.label} — ${t.blurb}</option>`).join('');
  dsel.value = TIERS[settings.diff] ? settings.diff : 'varsity';
  applyDifficulty(dsel.value);
  dsel.onchange = e => { settings.diff = e.target.value; applyDifficulty(settings.diff); save(); };
  el('sCamera').value = settings.camera;
  el('sCamera').onchange = e => { settings.camera = e.target.value; save(); };
  let setCamMode = null;
  el('sMute').onchange = e => { settings.mute = e.target.checked; save(); };
  el('gear').onclick = () => sp.classList.toggle('open');
  addEventListener('keydown', e => {
    // typing your name into the online box should not fire game hotkeys
    if (e.target?.matches?.('input,select,textarea')) return;
    if (e.code === 'Escape') {
      if (handlers.isReplaying?.()) handlers.onSkipReplay?.();
      else if (handlers.onEscape?.()) { /* consumed: pause toggled */ }
      else sp.classList.toggle('open');
    }
    if (e.code === 'KeyM') { settings.mute = !settings.mute; el('sMute').checked = settings.mute; save(); }
  });
  handlers.onSettings?.(settings);

  el('btnWatch').onclick = () => handlers.onReplay?.(false);
  el('btnClip').onclick = () => handlers.onReplay?.(true);

  // tuning panel (practice only)
  const panel = el('tune');
  for (const [path, lo, hi] of KNOBS) {
    const row = document.createElement('label');
    row.innerHTML = `<span>${path}</span><b>${get(path)}</b>`;
    const s = document.createElement('input');
    s.type = 'range'; s.min = lo; s.max = hi; s.step = (hi - lo) / 200; s.value = get(path);
    s.oninput = () => { set(path, +s.value); row.querySelector('b').textContent = (+s.value).toFixed(2); };
    row.appendChild(s);
    panel.appendChild(row);
  }
  addEventListener('keydown', e => {
    if (e.code === 'Tab' && mode === 'practice') panel.classList.toggle('open');
    if (e.code === 'KeyR' && G?.over) handlers.onAgain?.();   // same path as RUN IT BACK, no reload
  });

  // ── gate: name + mode ──
  const gate = el('gate');
  const nameInput = el('pname');
  nameInput.value = localStorage.byName || '';
  el('btnOnline').onclick = () => { mode = 'online'; document.body.classList.remove('title'); gate.style.display = 'none'; openLobby(); el('yardnote').style.display = ''; };
  el('btnPractice').onclick = () => { mode = 'practice'; document.body.classList.remove('title'); gate.style.display = 'none'; openLobby(); el('yardnote').style.display = 'none'; };
  el('btnKickball').onclick = () => {
    mode = 'kickball'; document.body.classList.remove('title'); gate.style.display = 'none';
    el('kbhud').classList.add('on');
    const h = el('hint');
    h.dataset.kb = '1';
    h.innerHTML = '<b>WASD</b> — steer whoever has the yellow ring<br>' +
                  '<b>CLICK</b> — kick / throw &nbsp;·&nbsp; <b>1 2 3 4</b> — throw to a bag<br>' +
                  '<b>SPACE</b> — send all runners &nbsp;·&nbsp; <b>SHIFT</b> — hold them';
    handlers.onKickball();
  };
  el('btnStory').onclick = () => { mode = 'story'; document.body.classList.remove('title'); gate.style.display = 'none'; handlers.onStory(); };

  // leaderboard
  fetch('top').then(r => r.json()).then(rows => {
    const real = rows.filter(r => (r.games ?? 0) > 0);
    el('board').innerHTML = real.length >= 3
      ? '<h3>TOP OF THE YARD</h3>' + real.slice(0, 8).map((r, i) =>
          `<div class="brow"><span>${i + 1}. ${esc(r.name)}</span><b>${r.elo}</b></div>`).join('')
      : '';
  }).catch(() => {});

  // ── character select: showcase left, roster strip, arena panel right ──
  const draftBox = el('draft');
  const SPECIAL_NAME = { toss: 'FLAG TOSS', roll: 'BARREL ROLL', portal: 'PORTAL PAIR', grapple: 'GRAPPLE HOOK',
                         kite: 'KITE LINE', hurdle: 'KICKFLIP', horn: 'AIR HORN', spray: 'THE HOSE',
                         duck: 'DUCK UNDER', balloon: 'WATER BALLOON', none: 'GOOD DOG' };
  const SPECIAL_DESC = {
    toss: 'Right-click to throw the flag to an open teammate. Aim with the mouse.',
    roll: 'Right-click to roll sideways like a keg — bowls people over, can\'t be tagged mid-roll.',
    portal: 'Drop two linked rings. Anyone who steps in one comes out the other, speed intact.',
    grapple: 'Hook the fence or a prop to fly there. Hook the flag to yank it into your hands.',
    kite: 'Throw a kite line at a spot and swing round it. Release to launch, then glide.',
    none: 'No special. Doesn\'t need one: small, quick, and catches any toss from miles off.',
    hurdle: 'Pop the board and kickflip clean over hedges, benches and people. Clears obstacles — not tags.',
    horn: 'One blast. Everyone in the cone in front of you gets shoved and stunned. It is not a tag, it is a wall.',
    spray: 'Soak a stretch of lawn. Wet grass has almost no grip — lay it across a lane and watch the chase pile up.',
    duck: 'Tuck down on the trike and duck straight under the low stuff everyone else has to go around.',
    balloon: 'Left-click lobs a water balloon instead of a lunge. It tags on the splash, and it arcs clean over hedges.',
  };
  const tiles = {};
  const strip = el('roster');
  KIT_KEYS.forEach((key, i) => {
    const tile = document.createElement('button');
    tile.className = 'tile';
    tile.innerHTML = `<img alt=""><span>${i + 1}</span>`;
    tile.onclick = () => selectKit(key);
    strip.appendChild(tile);
    tiles[key] = tile;
  });
  const bars = (v, n = 5) => '<i></i>'.repeat(v) + '<b></b>'.repeat(n - v);
  function selectKit(key, silent) {
    chosenKit = key; settings.kit = key; save();
    for (const k in tiles) tiles[k].classList.toggle('on', k === key);
    const K = KITS[key];
    const splash = el('splash');
    splash.classList.remove('in'); void splash.offsetWidth; splash.classList.add('in');
    el('bigName').textContent = K.name.replace(/^The /, '');
    el('bigThe').textContent = K.name.startsWith('The') ? 'THE' : '';
    el('blurb').textContent = K.blurb;
    // A kit with no special is described by what it actually does instead —
    // the Slingshot was being sold to you as "GOOD DOG" because it shares the
    // empty special slot with the dog.
    const ability = K.special === 'none' && K.primary !== 'lunge' ? K.primary : K.special;
    el('spName').textContent = SPECIAL_NAME[ability] ?? SPECIAL_NAME.none;
    el('spDesc').textContent = SPECIAL_DESC[ability] ?? SPECIAL_DESC.none;
    el('stSpeed').innerHTML = bars(Math.round(1 + (K.speed - 0.95) / 0.05));
    el('stSize').innerHTML  = bars(K.radius > 0.7 ? 5 : K.radius < 0.6 ? 1 : 3);
    el('stReach').innerHTML = bars(K.primary === 'balloon' ? 5 : K.special === 'grapple' ? 4 : 3);
    el('readyName').textContent = K.name;
    if (!silent) handlers.onKit?.(key);
  }

  const arenaBox = el('arenas');
  const ybtns = ARENAS.map(A => {
    const b = document.createElement('button');
    b.className = 'ybtn'; b.dataset.arena = A.key;
    b.innerHTML = `<img alt=""><span>${A.label.replace(/^\S+\s/, '')}</span>`;
    arenaBox.appendChild(b); return b;
  });
  const setArena = k => {
    settings.arena = k;
    ybtns.forEach(b => {
      const on = b.dataset.arena === k;
      b.classList.toggle('on', on);
      if (on) b.scrollIntoView({ block: 'nearest' });   // the grid scrolls now
    });
    save();
  };
  ybtns.forEach(b => b.onclick = () => setArena(b.dataset.arena));
  setArena(ARENAS.some(A => A.key === settings.arena) ? settings.arena : ARENAS[0].key);

  function openLobby() {
    draftBox.style.display = 'flex'; document.body.classList.add('lobby');
    selectKit(KITS[settings.kit] ? settings.kit : 'runner');
  }
  function go() {
    if (draftBox.style.display === 'none') return;
    draftBox.style.display = 'none'; document.body.classList.remove('lobby');
    if (mode === 'practice') handlers.onPractice(chosenKit, settings.arena);
    else {
      const name = (nameInput.value || '').trim() || 'Kid' + ((Math.random() * 900 + 100) | 0);
      el('queue').style.display = 'flex';
      handlers.onQueue(chosenKit, name, settings.arena);
    }
  }
  el('btnReady').onclick = go;
  el('btnBackGate').onclick = () => { draftBox.style.display = 'none'; document.body.classList.remove('lobby'); document.body.classList.add('title'); gate.style.display = 'flex'; };
  addEventListener('keydown', e => {
    if (draftBox.style.display === 'none' || gate.style.display !== 'none') return;
    const n = parseInt(e.key);
    if (n >= 1 && n <= KIT_KEYS.length) selectKit(KIT_KEYS[n - 1]);
    const i = KIT_KEYS.indexOf(chosenKit);
    if (e.code === 'ArrowRight') selectKit(KIT_KEYS[(i + 1) % KIT_KEYS.length]);
    if (e.code === 'ArrowLeft')  selectKit(KIT_KEYS[(i + KIT_KEYS.length - 1) % KIT_KEYS.length]);
    if (e.code === 'Enter') go();
    // the hint has always advertised number keys; they were never wired
    const d = e.code.match(/^Digit(\d)$/);
    if (d) {
      const idx = d[1] === '0' ? 9 : +d[1] - 1;
      if (KIT_KEYS[idx]) selectKit(KIT_KEYS[idx]);
    }
  });
  el('btnCancelQ').onclick = () => { el('queue').style.display = 'none'; gate.style.display = 'flex'; handlers.onCancel(); };

  const toastBox = el('toasts');
  let shown = new Map();

  let api;
  api = {
    bind(game) { G = game; },
    bindCamera(fn) { setCamMode = fn; },
    setCamera(mode) { settings.camera = mode; el('sCamera').value = mode; save(); },
    portraits: {}, thumbs: {},
    buildArt() {
      const art = handlers.makeArt?.();
      if (!art) return false;
      api.portraits = art.portraits; api.thumbs = art.thumbs;
      handlers.onArt?.(art);
      for (const k in tiles) tiles[k].querySelector('img').src = art.portraits[k];
      ybtns.forEach(b => b.querySelector('img').src = art.thumbs[b.dataset.arena]);
      return true;
    },
    lobbyOpen: () => draftBox.style.display !== 'none',
    refreshLobby(net) {
      el('me').textContent = net.me ? `${net.me.name} · ${net.me.elo} · ${net.me.rank}` :
        net.status === 'offline' ? 'offline — practice only' : '';
      if (net.status === 'queue') el('qstat').textContent =
        `looking for players… (${net.queueN ?? 1} in line — solo starts vs bots)`;
      // an unreachable server used to leave the spinner up forever
      if (net.status === 'offline') {
        el('qstat').textContent = 'server unreachable — try CAPTURE THE FLAG vs bots';
        const b = el('btnOnline');
        b.disabled = true; b.style.opacity = 0.45;
        b.querySelector('i') && (b.querySelector('i').textContent = 'offline — server not running');
      }
    },
    showGame(net) {
      el('queue').style.display = 'none';
      const r = net.ranked ? 'RANKED' : 'UNRANKED';
      G?.events?.push({ text: `${r} — GO!`, color: 0xffd94a, t: 2.4 });
    },
    showEnd(net) {
      const m = net.end;
      const o = el('over');
      o.style.display = 'flex';
      const canR = handlers.canReplay?.() !== false;
      el('btnWatch').style.display = el('btnClip').style.display = canR ? '' : 'none';
      const h = o.querySelector('h1');
      h.textContent = m.winner === 'draw' ? 'DRAW' : m.winner.toUpperCase() + ' WINS';
      h.style.color = m.winner === 'blue' ? '#3d7dff' : m.winner === 'red' ? '#ff4d4d' : '#fff';
      el('elo-table').innerHTML = (m.ranked ? '' : '<div class="unranked">unranked match — bots on a team</div>') +
        m.table.map(r =>
          `<div class="erow ${r.team}"><span>${esc(r.name)}</span>` +
          `<b class="${r.delta >= 0 ? 'up' : 'down'}">${r.delta >= 0 ? '+' : ''}${m.ranked ? r.delta : '—'}</b>` +
          `<i>${r.elo} · ${r.rank}</i></div>`).join('');
    },
    settings,
    replayBanner(on, progress, speed) {
      el('replay').classList.toggle('on', on);
      if (on) { el('rpbar').firstElementChild.style.width = (progress * 100) + '%'; el('rpspeed').textContent = speed === 1 ? '1×' : '½×'; }
    },
    // back to the title screen without a reload — the same recipe btnBackGate uses
    toTitle() {
      // kickball rewrote the hint and lit its own HUD; leaving it in place put a
      // frozen line score and baseball help text over the next CTF match
      el('kbhud').classList.remove('on');
      const h = el('hint');
      h.dataset.kb = '1';
      h.innerHTML = '<b>WASD</b> — move · <b>MOUSE</b> — aim<br><b>CLICK</b> — tag · reach grows with your speed<br><b>RIGHT-CLICK / E</b> — your special<br><b>SPACE</b> — dash · <b>CTRL</b> — walk<br><b>C</b> — camera · <b>P</b> — replay';
      draftBox.style.display = 'none';
      el('queue').style.display = 'none';
      el('over').style.display = 'none';
      document.body.classList.remove('lobby');
      document.body.classList.add('title');
      gate.style.display = 'flex';
    },
    setObjective(text) {
      document.body.classList.toggle('story-match', !!text);
      if (text) el('objText').textContent = text;
    },
    padHints(pad) {
      const h = el('hint');
      // This used to bail out whenever kb === '1', which is the hardcoded
      // starting state — so the very next line could never run and a pad player
      // read "WASD - move" forever.
      if (pad && h.dataset.kb === '1') { h.dataset.kb = '0'; h.innerHTML = '<b>L-STICK</b> — move · <b>R-STICK</b> — aim<br><b>RT / X</b> — tag · <b>LT / Y</b> — special<br><b>A / RB</b> — dash'; }
      else if (!pad && h.dataset.kb === '0') { h.dataset.kb = '1'; h.innerHTML = '<b>WASD</b> — move · <b>MOUSE</b> — aim<br><b>CLICK</b> — tag · reach grows with your speed<br><b>RIGHT-CLICK / E</b> — your special<br><b>SPACE</b> — dash · <b>CTRL</b> — walk<br><b>C</b> — camera · <b>P</b> — replay'; }
    },
    update(dt) {
      if (!G) return;
      if (mode === 'kickball') return updateKickHud(el, G);
      const p = G.player;
      const sp = Math.hypot(p.vx, p.vz);
      el('sBlue').textContent = G.score.blue;
      el('sRed').textContent  = G.score.red;
      const t = Math.max(0, G.time);
      el('clock').textContent = `${Math.floor(t/60)}:${String(Math.floor(t%60)).padStart(2,'0')}`;

      for (const k of ['blue','red']) {
        const f = G.flags[k];
        const n = el('f' + k);
        n.className = 'flagdot ' + k + (f.home ? ' home' : f.carrier ? ' taken' : ' loose');
        n.textContent = f.home ? '●' : f.carrier ? '▲' : '◌';
      }

      const pct = Math.min(1, sp / CFG.dash.maxSpeed);
      const bar = el('spd');
      bar.style.width = (pct * 100) + '%';
      bar.style.background = sp > CFG.move.maxSpeed + 0.2
        ? 'linear-gradient(90deg,#ffd94a,#ff7a3d)' : 'linear-gradient(90deg,#9fe870,#4fd1c5)';
      el('spdnum').textContent = sp.toFixed(1);

      const cd = el('dashcd');
      cd.style.setProperty('--p', (1 - p.dashCd / CFG.dash.cooldown));
      cd.classList.toggle('ready', p.dashCd <= 0);

      const ph = p.lunge?.phase;
      const lp = el('lungepip');
      if (p.primary === 'balloon') {
        lp.textContent = 'BALLOON';
        lp.className = 'pip' + ((p.balloonCd ?? 0) <= 0 ? ' on' : '');
      } else {
        // recover shows WHIFF only if the lunge actually missed — it used to
        // say WHIFF for 0.26s after a tag that had just landed
        lp.textContent = ph === 'wind' ? 'WIND' : ph === 'active' ? 'TAG!'
                       : ph === 'recover' ? (p.lunge?.hit ? 'GOT HIM' : 'WHIFF') : 'LUNGE';
        lp.className = 'pip' + (ph === 'active' ? ' on' : ph === 'recover' ? ' bad' : ph ? ' warn' : (p.lungeCd <= 0 ? ' on' : ''));
      }
      const spip = el('specialpip');
      spip.textContent = SPECIAL_LABEL[p.special] || '—';
      const specialReady =
        p.special === 'toss'    ? (p.tossCd ?? 0) <= 0 && !!p.hasFlag :
        p.special === 'roll'    ? p.rollCd <= 0 :
        p.special === 'portal'  ? (p.portalCd ?? 0) <= 0 :
        p.special === 'grapple' ? p.grappleCd <= 0 :
        p.special === 'kite'    ? p.swingCd <= 0 || !!p.swing :
        p.special === 'hurdle'  ? (p.hurdleCd ?? 0) <= 0 :
        p.special === 'horn'    ? (p.hornCd ?? 0) <= 0 :
        p.special === 'spray'   ? (p.sprayCd ?? 0) <= 0 :
        p.special === 'duck'    ? (p.duckCd ?? 0) <= 0 : false;
      spip.className = 'pip' + (p.swing || p.roll || p.grapple || p.air > 0 ? ' warn' : specialReady ? ' on' : '');
      el('carry').classList.toggle('on', !!p.hasFlag);
      // Tagged out froze you, hid your body and teleported you home with nothing
      // on screen to say why or for how long.
      const rsp = el('respawn');
      if (p.tagged) {
        rsp.style.display = 'flex';
        el('rspNum').textContent = Math.max(0, p.respawnT).toFixed(1);
      } else if (rsp.style.display !== 'none') rsp.style.display = 'none';

      for (const e of G.events) {
        if (!e.text) { shown.set(e, null); continue; }
        if (!shown.has(e)) {
          const d = document.createElement('div');
          d.className = 'toast';
          d.style.color = '#' + e.color.toString(16).padStart(6, '0');
          d.textContent = e.text;
          toastBox.appendChild(d);
          shown.set(e, d);
          setTimeout(() => d.remove(), 2400);
        }
      }
      if (shown.size > 40) shown = new Map();

      if (G.over && !document.getElementById('over').style.display.includes('flex') && mode === 'practice') {
        const o = el('over');
        o.style.display = 'flex';
        const canR = handlers.canReplay?.() !== false;
        el('btnWatch').style.display = el('btnClip').style.display = canR ? '' : 'none';
        o.querySelector('h1').textContent =
          G.over === 'draw' ? 'DRAW' : (G.over === 'blue' ? 'BLUE WINS' : 'RED WINS');
        o.querySelector('h1').style.color = G.over === 'blue' ? '#3d7dff' : G.over === 'red' ? '#ff4d4d' : '#fff';
      }
    },
  };
  return api;
}
const ordinal = n => n + (['th','st','nd','rd'][(n % 100 - 20) % 10] || ['th','st','nd','rd'][n % 100] || 'th');
const OUT_DOTS = n => '●'.repeat(n) + '○'.repeat(Math.max(0, 2 - n));
let kbLastHalf = '';
function updateKickHud(el, G) {
  // between innings: a card, so the change of sides actually registers
  const half = `${G.inning}${G.half}`;
  if (half !== kbLastHalf) {
    if (kbLastHalf) {
      const card = el('kbinning');
      card.querySelector('b').textContent = (G.half === 'top' ? 'TOP ' : 'BOTTOM ') + ordinal(G.inning);
      card.querySelector('i').textContent = `${G.kicking.toUpperCase()} UP · ${G.score.blue}–${G.score.red}`;
      card.classList.remove('on'); void card.offsetWidth; card.classList.add('on');
    }
    kbLastHalf = half;
  }
  el('kbBlue').textContent = G.score.blue;
  el('kbRed').textContent = G.score.red;
  el('kbInn').textContent = (G.half === 'top' ? '▲ ' : '▼ ') + G.inning;
  el('kbCount').textContent = `${G.balls ?? 0}–${G.strikes ?? 0}`;
  el('kbOuts').textContent = OUT_DOTS(G.outs ?? 0);
  for (const n of el('kbhud').querySelectorAll('.kbbases i'))
    n.classList.toggle('on', !!G.runnerOn?.(+n.dataset.b));

  const d = el('kbduty');
  const label = G._hint || '';
  d.textContent = label; d.classList.toggle('on', !!label);

  // The timing meter is the whole feel of kicking. Show the window, the
  // sweep, AND what your timing is worth right now — a bar you can't read
  // isn't skill, it's a coin flip.
  const meter = el('kbmeter');
  const K = CFGK().kick;
  const kicking = G.phase === 'pitch' && G.kicking === G.player.team && G.arriveT > 0;
  meter.classList.toggle('on', kicking);
  if (kicking) {
    const span = G.arriveT + K.maxOff;                       // full sweep incl. late window
    const centre = (G.arriveT / span) * 100;
    const half = (K.window / span) * 100;
    const band = meter.querySelector('.band');
    band.style.left = (centre - half) + '%';
    band.style.width = (half * 2) + '%';
    const at = Math.min(100, (G.pitchT / span) * 100);
    meter.querySelector('.sweep').style.left = at + '%';
    // live power read: exactly the sim's own timing curve
    const off = Math.abs(G.pitchT - G.arriveT);
    const t = off <= K.window ? 1 : Math.max(0, 1 - (off - K.window) / (K.maxOff - K.window));
    const pw = Math.round(t * 100);
    meter.dataset.power = pw;
    const pf = el('kbpower');
    pf.style.width = pw + '%';
    pf.style.background = pw > 85 ? '#9fe870' : pw > 45 ? '#ffd94a' : '#ff8f8f';
    el('kbtiming').textContent = G.pitchT < G.arriveT - K.window ? 'EARLY'
                               : G.pitchT > G.arriveT + K.window ? 'LATE' : 'NOW';
    el('kbtiming').className = (off <= K.window) ? 'perfect' : '';
  }
  const call = el('kbcall');
  const ev = G.events?.[G.events.length - 1];
  call.textContent = ev ? ev.text : '';
  call.style.color = ev ? '#' + (ev.color ?? 0xfff8ea).toString(16).padStart(6, '0') : '#fff8ea';

  if (G.over) {
    const o = el('over');
    if (o.style.display !== 'flex') {
      o.style.display = 'flex';
      // kickball is never recorded — dead replay buttons are worse than none
      el('btnWatch').style.display = el('btnClip').style.display = 'none';
      o.querySelector('h1').textContent = G.over === 'draw' ? 'TIE GAME' : G.over.toUpperCase() + ' WINS';
      o.querySelector('h1').style.color = G.over === 'blue' ? '#3d7dff' : G.over === 'red' ? '#ff4d4d' : '#fff';
      el('elo-table').innerHTML = boxScore(G);
    }
  }
}
// A real line score: runs per inning, then the totals.
function boxScore(G) {
  const line = G.line || [];
  const innings = Math.max(3, line.length);
  const cell = (v) => `<td>${v ?? '·'}</td>`;
  const row = (team, label, colour) => {
    const cells = [];
    for (let i = 0; i < innings; i++) cells.push(cell(line[i]?.[team]));
    return `<tr><th style="color:${colour}">${label}</th>${cells.join('')}` +
           `<td class="tot">${G.score[team]}</td></tr>`;
  };
  const heads = Array.from({ length: innings }, (_, i) => `<td>${i + 1}</td>`).join('');
  return `<table class="box"><tr><th></th>${heads}<td class="tot">R</td></tr>` +
         row('blue', 'BLUE', '#7dabff') + row('red', 'RED', '#ff8f8f') + `</table>`;
}

let _cfgk = null;
const CFGK = () => (_cfgk ??= CFG.kickball);

const esc = s => String(s).replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));

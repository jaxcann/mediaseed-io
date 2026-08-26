import { makeStory, speakerName, CAST } from './story.js';
import { KITS } from './kits.js';
import { drawNeighborhood } from './mapart.js';

// ─────────────────────────────────────────────────────────────
// Story mode screens: overworld map, cutscene player, mission brief,
// roster select. All DOM — story.js stays pure and owns every decision;
// this file only draws it and reports back.
// ─────────────────────────────────────────────────────────────
const el = id => document.getElementById(id);
const esc = s => String(s).replace(/[<>&]/g, c => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;' }[c]));

export function makeStoryUI(handlers) {
  const story = makeStory(safeLoad());
  const save = () => { try { localStorage.byStory = JSON.stringify(story.serialize()); } catch {} };
  let portraits = {}, thumbs = {}, current = null, loadout = [];

  function safeLoad() { try { return JSON.parse(localStorage.byStory || 'null'); } catch { return null; } }

  // ── overworld ────────────────────────────────────────────
  function drawMap() {
    // Show the screen BEFORE measuring: the box was sized while its parent was
    // still display:none, so getBoundingClientRect returned 0 and the canvas
    // always fell back to its 640x420 floor no matter how big the map really was.
    show('story-world');
    const ov = story.overworld();
    const p = story.progress();
    el('swTitle').textContent = ov.title;
    el('swProg').textContent = `${p.cleared}/${p.stops} cleared · ${p.characters} kids`;
    const box = el('swMap');
    box.innerHTML = '';
    // the street itself, painted once at the box's real size
    const cv = document.createElement('canvas');
    const rect = box.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = Math.max(640, rect.width * dpr); cv.height = Math.max(420, rect.height * dpr);
    cv.className = 'swcanvas';
    drawNeighborhood(cv.getContext('2d'), cv.width, cv.height);
    box.appendChild(cv);

    // paths on top of the art, pins on top of those
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${ov.w} ${ov.h}`);
    // The pins are positioned in % and the canvas maps v/100 across the full
    // width and height — both non-uniform. An SVG defaults to xMidYMid meet,
    // which is uniform and letterboxed, so the roads drifted off the pins by
    // however far the box was from square. Stretch it the same way they do.
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('class', 'swpaths');
    for (const e of ov.edges) {
      const l = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      l.setAttribute('x1', e.x1); l.setAttribute('y1', e.y1);
      l.setAttribute('x2', e.x2); l.setAttribute('y2', e.y2);
      l.setAttribute('class', e.open ? 'open' : 'shut');
      svg.appendChild(l);
    }
    box.appendChild(svg);

    for (const n of ov.nodes) {
      const pin = document.createElement('button');
      pin.className = `swpin ${n.status}` + (n.current ? ' current' : '');
      pin.style.left = n.x + '%'; pin.style.top = n.y + '%';
      const face = n.status === 'cleared' ? '<em class="stamp">✓</em>'
                 : n.status === 'locked' ? '<em class="lock">🔒</em>'
                 : `<em class="num">${n.n}</em>`;
      pin.innerHTML =
        `<i class="swflag ${n.finale ? 'finale' : ''}">${face}</i>` +
        `<span>${esc(n.name)}</span>` +
        (n.status === 'open' ? `<u>${esc(n.unlocks.map(k => KITS[k]?.icon ?? '').join(''))}</u>` : '');
      pin.title = n.where;
      if (n.status !== 'locked') pin.onclick = () => openStop(n.id);
      box.appendChild(pin);
    }
    // the kid marker sits on whichever stop is next
    const cur = ov.nodes.find(n => n.current);
    if (cur) {
      const you = document.createElement('div');
      you.className = 'swyou';
      you.style.left = cur.x + '%'; you.style.top = cur.y + '%';
      you.innerHTML = '<b>YOU ARE HERE</b>';
      box.appendChild(you);
    }
  }

  // ── cutscene ─────────────────────────────────────────────
  let beats = [], bi = 0, afterScene = null, typeTimer = null, typing = false, fullLine = '';
  function playScene(list, done, where) {
    beats = list || []; bi = 0; afterScene = done;
    if (!beats.length) return done();
    el('scWhere').textContent = where || '';
    el('scWhere').style.display = where ? '' : 'none';
    show('story-scene');
    renderBeat();
  }
  function renderBeat() {
    clearInterval(typeTimer);
    const b = beats[bi];
    if (!b) { show(null); return afterScene?.(); }
    const who = b.who && b.who !== 'narrator' ? b.who : null;
    const face = el('scFace');
    face.innerHTML = who && portraits[who]
      ? `<img src="${portraits[who]}" alt="">`
      : `<div class="noface">${who ? (KITS[who]?.icon ?? '👤') : '📖'}</div>`;
    // a speaker change should feel like somebody stepping forward
    face.classList.remove('in'); void face.offsetWidth; face.classList.add('in');
    const box = el('scbox');
    box.classList.toggle('narration', !who);
    el('scName').textContent = b.name || (who ? speakerName(who) : '');
    el('scTag').textContent = who && CAST[who]?.tag ? CAST[who].tag : '';
    el('scDir').textContent = b.dir ? b.dir : '';
    el('scDir').style.display = b.dir ? '' : 'none';
    el('scDots').innerHTML = beats.map((_, i) =>
      `<i class="${i === bi ? 'on' : i < bi ? 'done' : ''}"></i>`).join('');
    // type it out — reading at the character's pace is most of the immersion
    fullLine = b.line || '';
    const target = el('scLine');
    target.textContent = '';
    typing = true;
    let i = 0;
    typeTimer = setInterval(() => {
      i += 2;
      target.textContent = fullLine.slice(0, i);
      if (i >= fullLine.length) { clearInterval(typeTimer); typing = false; el('scNext').classList.add('ready'); }
    }, 16);
    el('scNext').classList.remove('ready');
  }
  function advance() {
    if (typing) {                      // first click finishes the line, second advances
      clearInterval(typeTimer); typing = false;
      el('scLine').textContent = fullLine;
      el('scNext').classList.add('ready');
      return;
    }
    bi++; renderBeat();
  }

  // ── mission brief + roster ───────────────────────────────
  function openStop(id) {
    current = id;
    const s = story.stop(id);
    if (!story.hasSeen(id)) {
      playScene(story.cutscene(id), () => { story.markSeen(id); save(); openBrief(); }, s.where);
    } else openBrief();
  }
  function openBrief() {
    const s = story.stop(current);
    el('mbName').textContent = s.name;
    el('mbWhere').textContent = s.where;
    el('mbBrief').textContent = s.brief;
    el('mbStars').textContent = '★'.repeat(s.stars) + '☆'.repeat(5 - s.stars);
    el('mbWin').textContent = s.win.text;
    const A = story.arena(s.arena);
    el('mbArena').textContent = A?.label ?? s.arena;
    el('mbShot').innerHTML = (thumbs[s.arena] ? `<img src="${thumbs[s.arena]}" alt="">` : '')
      + `<b>${esc(A?.label ?? s.arena)}</b>`;
    el('mbTeam').textContent = `${s.teamSize} v ${s.teamSize}`;
    el('mbOpp').textContent = s.opponents?.name ?? 'the other lot';
    el('mbOppKits').innerHTML = (s.opponents?.kits ?? []).map(k =>
      `<span class="oppk">${KITS[k]?.icon ?? '?'} ${esc(KITS[k]?.name ?? k)}</span>`).join('');
    el('mbRewatch').onclick = () => playScene(story.cutscene(current), openBrief, s.where);
    loadout = story.loadoutFor(current) || story.defaultLoadout(current);
    drawRoster();
    show('story-brief');
  }
  function drawRoster() {
    const s = story.stop(current);
    const box = el('mbRoster');
    box.innerHTML = '';
    for (const k of story.availableRoster()) {
      const on = loadout.includes(k);
      const slot = loadout.indexOf(k);
      const b = document.createElement('button');
      b.className = 'rtile' + (on ? ' on' : '');
      b.innerHTML = (portraits[k] ? `<img src="${portraits[k]}" alt="">` : `<div class="noface">${KITS[k]?.icon ?? '?'}</div>`)
        + `<span>${esc(KITS[k]?.name?.replace(/^The /, '') ?? k)}</span>`
        + (on ? `<em>${slot === 0 ? 'YOU' : slot + 1}</em>` : '');
      b.onclick = () => {
        if (on) loadout = loadout.filter(x => x !== k);
        else if (loadout.length < s.pick) loadout.push(k);
        else { loadout.shift(); loadout.push(k); }
        drawRoster();
      };
      box.appendChild(b);
    }
    // A locked kid says where they turn up. Nine identical padlocks is dead
    // space; nine "stop 4" tags is a reason to keep walking down the street.
    const source = {};
    for (const st of story.stops()) for (const k of (st.unlocks || [])) source[k] = st;
    for (const k of story.lockedRoster()) {
      const from = source[k];
      const b = document.createElement('button');
      b.className = 'rtile locked'; b.disabled = true;
      const known = from && from.status !== 'locked';       // don't spoil what you can't see yet
      b.innerHTML = (known && portraits[k]
          ? `<img src="${portraits[k]}" alt="">`
          : `<div class="noface">${known ? (KITS[k]?.icon ?? '?') : '🔒'}</div>`)
        + `<span>${known ? esc(KITS[k]?.name?.replace(/^The /, '') ?? k) : '?????'}</span>`
        + (from ? `<em class="from">STOP ${from.n}</em>` : '');
      b.title = from ? `Unlocks at stop ${from.n} — ${from.name}` : 'Locked';
      box.appendChild(b);
    }
    const v = story.validateLoadout(current, loadout);
    el('mbValid').textContent = v.ok ? `slot 1 is you — ${KITS[loadout[0]]?.name ?? ''}` : v.reason;
    el('mbValid').className = v.ok ? 'ok' : 'bad';
    el('mbGo').disabled = !v.ok;
    el('mbGo').textContent = v.ok ? `PLAY — ${story.stop(current).name}` : `PICK ${story.stop(current).pick}`;
  }

  // ── result ───────────────────────────────────────────────
  function report(result) {
    const r = story.complete(current, result);
    save();
    const st = story.stop(current);
    const us = result?.score?.us | 0, them = result?.score?.them | 0;

    el('srStop').textContent = `STOP ${st.n} — ${st.name.toUpperCase()}`;
    el('srUs').textContent = us; el('srThem').textContent = them;
    el('srUs').className = (r.ok && us >= them) ? 'win' : 'lose';
    el('srThem').className = them > us ? 'win' : 'lose';

    // stars: cleared it, kept them off the board, and had time to spare
    const t = result?.tally || { blue: {}, red: {} };
    const earned = r.ok ? 1 + (them === 0 ? 1 : 0) + ((result?.secondsLeft ?? 0) > 30 ? 1 : 0) : 0;
    el('srStars').innerHTML = [0, 1, 2].map(i =>
      `<span class="${i < earned ? 'on' : ''}" style="animation-delay:${0.25 + i * 0.14}s">★</span>`).join('');

    el('srStats').innerHTML = [
      ['TAGS', t.blue?.tags | 0], ['FLAG GRABS', t.blue?.grabs | 0],
      ['TIME LEFT', fmt(result?.secondsLeft ?? 0)],
    ].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join('');

    const done = story.progress();
    el('srProgTxt').textContent = `${done.cleared} OF ${done.stops} STOPS CLEARED`;
    setTimeout(() => { el('srProgBar').firstElementChild.style.width = (done.cleared / done.stops * 100) + '%'; }, 120);

    el('srAgain').onclick = () => openBrief();
    if (!r.ok) {
      el('srRibbon').classList.add('lost');
      el('srTitle').textContent = 'NOT QUITE';
      el('srWhy').textContent = r.reason;
      el('srUnlock').innerHTML = '';
      el('srNext').textContent = 'BACK TO THE MAP';
      el('srNext').onclick = () => drawMap();
      show('story-result');
      return;
    }
    const finish = () => {
      el('srRibbon').classList.remove('lost');
      el('srTitle').textContent = r.complete ? 'THE STREET IS YOURS' : 'STOP CLEARED';
      el('srWhy').textContent = r.replay ? 'Played again — already cleared.' : (st.win?.text ?? '');
      el('srUnlock').innerHTML = (r.unlocked || []).map(k =>
        `<div class="newkid">${portraits[k] ? `<img src="${portraits[k]}">` : `<div class="noface">${KITS[k]?.icon ?? '?'}</div>`}
           <b>NEW KID ON THE STREET</b><span>${esc(KITS[k]?.name ?? k)}</span></div>`).join('');
      el('srNext').textContent = 'BACK TO THE MAP';
      el('srNext').onclick = () => drawMap();
      show('story-result');
    };
    if (r.victory?.length) playScene(r.victory, finish, st.where); else finish();
  }

  const fmt = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

  // ── plumbing ─────────────────────────────────────────────
  // Screens used to hard-cut. They now fade-and-rise, and the incoming screen
  // is marked so its own children can stagger in behind it.
  let shownId = null;
  function show(id) {
    for (const s of ['story-world', 'story-scene', 'story-brief', 'story-result']) {
      const node = el(s);
      node.style.display = s === id ? 'flex' : 'none';
      node.classList.remove('entering');
    }
    if (id && id !== shownId) {
      const node = el(id);
      void node.offsetWidth;                 // restart the animation on re-entry
      node.classList.add('entering');
    }
    shownId = id;
    document.body.classList.toggle('story', !!id);
  }
  el('scNext').onclick = e => { e.stopPropagation(); advance(); };
  addEventListener('keydown', e => {
    if (shownId !== 'story-scene') return;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); advance(); }
  });
  el('story-scene').onclick = e => { if (e.target.id !== 'scSkip') advance(); };
  el('scSkip').onclick = e => { e.stopPropagation(); clearInterval(typeTimer); typing = false; bi = beats.length; renderBeat(); };
  el('mbBack').onclick = () => drawMap();
  el('mbGo').onclick = () => {
    story.setLoadout(current, loadout); save();
    const cfg = story.matchConfig(current, loadout);
    show(null);
    handlers.onLaunch(cfg, story.stop(current));
  };
  el('swQuit').onclick = () => { show(null); handlers.onQuit(); };
  el('swReset').onclick = () => { if (confirm('Wipe story progress and start Maple Court over?')) { story.reset(); save(); drawMap(); } };

  return {
    story,
    open() { drawMap(); },
    setPortraits(p) { portraits = p || {}; },
    setThumbs(t) { thumbs = t || {}; },
    report,
    get currentStop() { return current; },
  };
}

import * as THREE from 'three';
import { CFG, TEAMS } from './config.js';
import { buildWorld } from './world.js';
import { makeFX } from './fx.js';
import { makeGame } from './rules.js';
import { attachView, detachView, syncVisuals } from './view.js';
import { makeInput } from './input.js';
import { makeUI } from './ui.js';
import { makeNet } from './net.js';
import { makePost, skyTexture, LOOK } from './post.js';
import { makeJuice } from './juice.js';
import { makeSound } from './sound.js';
import { makeReplay } from './replay.js';
import { makeYardFX, applyYard } from './yards.js';
import { arenaByKey, ARENAS, applyMapConfig } from './layout.js';
import { makeKickball } from './kickball.js';
import { buildSandlot, attachKickView, detachKickView, syncKickView, setControlMarker } from './kickview.js';
import { makeKickControl } from './kickcontrol.js';
import { makeStoryUI } from './storyui.js';
import { makeAmbience } from './ambience.js';

import { applyKit, assignRoles, KIT_KEYS } from './kits.js';
import { makeChar, animChar } from './chars.js';
import { makeActor } from './actor.js';

const canvas = document.getElementById('c');
const xhair = document.getElementById('xhair');
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

// GPU context loss (driver reset, OS sleep, too many tabs): preventDefault lets
// the browser restore it and three rebuilds its own state; if restore has not
// arrived in a few seconds, reload rather than leave a black screen forever.
renderer.domElement.addEventListener('webglcontextlost', e => {
  e.preventDefault();
  const t = setTimeout(() => location.reload(), 4000);
  renderer.domElement.addEventListener('webglcontextrestored', () => clearTimeout(t), { once: true });
});

const scene = new THREE.Scene();
scene.background = skyTexture();
scene.fog = new THREE.Fog(0xdcefff, 70, 120);
const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 220);

// late-afternoon: warm key, cool sky fill, green bounce off the lawn
const sun = new THREE.DirectionalLight(0xfff0c8, 2.1);
const hemi = new THREE.HemisphereLight(0xbfe0ff, 0x6a9a3c, 1.0);
// fill from the far side so round things wrap instead of ending at a cliff
const fillLight = new THREE.DirectionalLight(0xcfe3ff, 0.55);
fillLight.position.set(18, 14, -12);
// rim/kicker from low and behind — on banded toon shading this paints a bright
// edge that lifts every figure off the ground. Per-arena colour and strength.
const rimLight = new THREE.DirectionalLight(0xfff6d8, 1.5);
rimLight.position.set(14, 9, -22);
sun.position.set(-16, 30, 14);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left:-34, right:34, top:26, bottom:-26, near:1, far:80 });
sun.shadow.camera.updateProjectionMatrix();   // bounds are inert until this runs
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.02;
// NB: shadow.radius does nothing here. Under PCFSoftShadowMap three's getShadow()
// — the directional/spot path — ignores it; only point lights and VSM read it.
// The knob that actually softens a directional shadow is the map resolution:
// at 4096 over a 68-unit frustum a texel is 0.017 units and the edge is razor
// sharp, which is the opposite of what we want. 1024 gives a ~0.078-unit
// penumbra, and costs a sixteenth of the depth pass.
scene.add(sun, hemi, fillLight, rimLight);

// The slider value and the map scaling are two different things, and onSettings
// fires on EVERY setting — so a flat assignment here threw away the bigger-yard
// camera lift the moment you touched the volume on The Block.
let userCamHeight = 23.5;
function applyCamHeight(v) {
  if (v !== undefined) userCamHeight = v;
  const scale = Math.max(1, CFG.field.w / 48);
  CFG.cam.height = userCamHeight * (0.72 + 0.28 * scale);
}

function fitShadowToField() {
  const F = CFG.field;
  const halfW = F.w / 2 + 4, halfH = F.h / 2 + 6;   // margin for props and the fence
  const c = sun.shadow.camera;
  c.left = -halfW; c.right = halfW; c.top = halfH; c.bottom = -halfH;
  c.updateProjectionMatrix();
}

const fx = makeFX(scene);
let world = buildWorld(scene, 'backyard');
world.fx = fx;
function useMap(key, force = false, fieldOverride = null) {
  // a world built with a field override must never be reused for the plain map
  if (!force && world.map === key && !world.fieldOverridden) return world;
  world.dispose();
  world = buildWorld(scene, key, fieldOverride);
  world.fieldOverridden = !!fieldOverride;
  world.fx = fx;
  ambience.bindSway(world.swayers);
  ambience.setIndoor(world.indoor);
  // The shadow frustum is orthographic and fixed-size, so on a pitch wider than
  // it, everything past the edge silently stops casting. Fit it to the map.
  fitShadowToField();
  // a bigger yard needs a higher camera, or you play blind
  const scale = Math.max(1, CFG.field.w / 48);
  applyCamHeight(ui?.settings?.cam);
  CFG.cam2k.back = 17 * (0.8 + 0.2 * scale);
  return world;
}
const yardFX = makeYardFX(scene);
const ambience = makeAmbience(scene);

ambience.bindSway(world.swayers);
const input = makeInput(canvas);
const replay = makeReplay(canvas);
const setYard = key => {
  applyYard({ scene, sun, hemi, ground: world.ground, yardFX, LOOK, skyTexture, rim: rimLight }, key);
  ambience.setSeason(key === 'winter' ? 'winter' : 'summer');
};

const post = makePost(renderer, scene, camera);
const sfx = makeSound();

// CFG is global and quick-match reads the same object, so a story mission has
// to hand back exactly what it borrowed.
const CFG_BACKUP = { teamSize: CFG.match.teamSize, scoreToWin: CFG.match.scoreToWin,
                     duration: CFG.match.duration, respawn: CFG.tag.respawn,
                     fw: CFG.field.w, fh: CFG.field.h };
function restoreCfg() {
  CFG.match.teamSize = CFG_BACKUP.teamSize;
  CFG.match.scoreToWin = CFG_BACKUP.scoreToWin;
  CFG.match.duration = CFG_BACKUP.duration;
  CFG.tag.respawn = CFG_BACKUP.respawn;
  CFG.field.w = CFG_BACKUP.fw; CFG.field.h = CFG_BACKUP.fh;
}

const CAM = { mode: 'broadcast', yaw: 0, pitch: 0, bobT: 0 };

// ── the showcase: a lit stage for the character select ─────
const showcase = (() => {
  const sc = new THREE.Scene();
  sc.background = new THREE.Color(0xfff1cf);
  const key = new THREE.DirectionalLight(0xfff0c8, 2.0); key.position.set(-4, 8, 6);
  const fill = new THREE.HemisphereLight(0xbfe0ff, 0x7a6a4c, 1.05);
  const rim = new THREE.DirectionalLight(0xcfe3ff, 0.7); rim.position.set(5, 5, -6);
  sc.add(key, fill, rim);
  // backdrop: a tall gradient card behind the kid
  const bgC = document.createElement('canvas'); bgC.width = 4; bgC.height = 256;
  const bx = bgC.getContext('2d'); const g = bx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, '#ffd94a'); g.addColorStop(0.55, '#ffe9a0'); g.addColorStop(1, '#fff1cf');
  bx.fillStyle = g; bx.fillRect(0, 0, 4, 256);
  const bgT = new THREE.CanvasTexture(bgC); bgT.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshBasicMaterial({ map: bgT }));
  back.position.set(0, 4, -9); back.layers.set(1);
  sc.add(back);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 48), new THREE.MeshToonMaterial({ color: 0xffd94a }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01;
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.85, 48), new THREE.MeshBasicMaterial({ color: 0x2a1a12, transparent: true, opacity: 0.35 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.012; ring.layers.set(1);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 48), new THREE.MeshToonMaterial({ color: 0xfff1cf }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  sc.add(floor, disc, ring);
  // drifting sparkles, no ink
  const NS = 40;
  const sparks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffffff }), NS);
  sparks.layers.set(1); sc.add(sparks);
  const SP = Array.from({ length: NS }, () => ({ x: (Math.random() - 0.5) * 10, y: Math.random() * 5, z: (Math.random() - 0.5) * 6 - 1, ph: Math.random() * 9 }));
  const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 80);
  let root = null, actor = null, pop = 0, t = 0;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3();
  return {
    scene: sc, cam,
    set(kit) {
      if (root) sc.remove(root);
      actor = makeActor('blue', 0, 0, false); applyKit(actor, kit);
      root = makeChar('blue', KIT_KEYS.indexOf(kit), kit);
      root.userData.ring.visible = false; root.userData.blob.visible = false;
      sc.add(root); pop = 1; t = 0;
    },
    frame(dt) {
      t += dt; pop = Math.max(0, pop - dt * 3.2);
      cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
      // the kid stands left of centre; the panels live on the right
      // kid sits just left of centre, clear of the splash on the left and the panel on the right
      const sh = innerWidth > 900 ? -0.35 : 0;
      const dog = actor?.kit === 'dog';
      cam.position.set(sh + 0.5, dog ? 1.6 : 2.2, dog ? 5.2 : 7.2); cam.lookAt(sh, dog ? 0.55 : 1.0, 0);
      if (root && actor) {
        actor.aim = 0.35 + Math.sin(t * 0.6) * 0.55; actor.facing = actor.aim;
        animChar(root, actor, dt);
        const k = 1 + Math.sin(pop * Math.PI) * 0.18 * pop;   // pop in with an overshoot
        root.scale.set(k, 1 / k + (k - 1 / k) * 0.4, k);
        root.position.y = pop * 0.25;
      }
      for (let i = 0; i < NS; i++) {
        const p = SP[i];
        const y = (p.y + t * 0.35 + Math.sin(t + p.ph) * 0.1) % 5.5;
        const s = 0.6 + Math.sin(t * 3 + p.ph) * 0.5;
        V.set(p.x + Math.sin(t * 0.5 + p.ph) * 0.3, y, p.z); S.set(s, s, s);
        M.compose(V, Q, S); sparks.setMatrixAt(i, M);
      }
      sparks.instanceMatrix.needsUpdate = true;
    },
  };
})();

// ── session state: one of practice | online ───────────────
const S = { mode: null, G: null, net: null, viewAttached: false };

const net = makeNet({
  onStatus: () => ui.refreshLobby(net),
  onStart: N => {
    S.mode = 'online';
    S.rematch = null;          // an online rematch is a new queue, not a replay
    detachKickView();
    document.body.classList.remove('kb');
    useMap(N.map);
    N.world.colliders = world.colliders;          // prediction collides with the right map
    S.G = N.shadow;
    setYard(N.yard);
    S.G._camera = camera;
    attachView(S.G, scene);
    S.viewAttached = true;
    ui.bind(S.G);
    ui.showGame(N);
    camTgt.set(S.G.player.x, 0, S.G.player.z);
  },
  onEnd: N => ui.showEnd(N),
  // socket dropped mid-queue or mid-match: say so, loudly, instead of a
  // silently frozen frame while the server hands your kid to a bot
  onDrop(phase) {
    const card = document.getElementById('pausecard');
    card.querySelector('h1').textContent = 'CONNECTION LOST';
    document.getElementById('pauseNote').textContent =
      phase === 'playing' ? 'the match went on without you' : 'could not reach the server';
    document.getElementById('btnResume').style.display = 'none';
    document.getElementById('btnRematch').style.display = 'none';
    document.getElementById('pause').style.display = 'flex';
    document.getElementById('queue').style.display = 'none';
  },
});
S.net = net;

let storyUI = null;
function launchStory(cfg, stop) {
  S.mode = 'story'; S.storyReported = false;
  S.rematch = () => launchStory(cfg, stop);
  detachKickView();
  document.body.classList.remove('kb');
  // A field override forces a rebuild: the finale plays this backyard at 60x41,
  // and reusing the standing 48x33 world let players run six metres past the
  // drawn fence while the shadow frustum stopped at the pickets.
  useMap(cfg.makeGameOpts.map, !!cfg.field, cfg.field || null);
  setYard(cfg.makeGameOpts.yard);
  // teamSize is read once at construction — it must be set before makeGame
  CFG.match.teamSize = cfg.teamSize;
  CFG.match.scoreToWin = cfg.scoreToWin;
  if (cfg.field) { CFG.field.w = cfg.field.w; CFG.field.h = cfg.field.h; }
  const G = makeGame(world, { ...cfg.makeGameOpts, applyMap: false });
  G.draft(cfg.playerKit);
  const blue = G.actors.filter(a => a.team === 'blue');
  const red  = G.actors.filter(a => a.team === 'red');
  blue.forEach((a, i) => { if (cfg.blue[i]) applyKit(a, cfg.blue[i]); });
  red.forEach((a, i) => { if (cfg.red[i]) applyKit(a, cfg.red[i]); });
  assignRoles(G.actors);
  G._camera = camera;
  attachView(G, scene);
  S.G = G; S.viewAttached = true; S.storyStop = stop;
  // The win condition was shown once on the brief card and then never again —
  // matchConfig has always returned cfg.win and launchStory never read it, so on
  // a shutout stop you found out you had failed from the result screen.
  ui.setObjective(cfg.win?.text || null);
  ui.bind(G);
  camTgt.set(G.player.x, 0, G.player.z);
  document.body.classList.remove('story');
}

const handlers = {
  onPractice(kit, arenaKey) {
    S.mode = 'practice';
    S.rematch = () => handlers.onPractice(kit, arenaKey);
    detachKickView();
    document.body.classList.remove('kb');
    const A = arenaByKey(arenaKey);
    useMap(A.map);
    setYard(A.yard);
    const G = makeGame(world, { seed: (Date.now() % 100000) | 0, yard: A.yard, map: A.map });
    G.draft(kit);
    G._camera = camera;
    attachView(G, scene);
    S.G = G; S.viewAttached = true;
    ui.bind(G);
    camTgt.set(G.player.x, 0, G.player.z);
  },
  onQueue(kit, name, arenaKey) {
    net.setName(name);
    net.queue(kit, name, arenaKey);
  },
  onCancel() { net.cancel(); },
  onStory() {
    if (!storyUI) {
      storyUI = makeStoryUI({
        onLaunch: launchStory,
        onQuit() { S.G = null; S.viewAttached = false; restoreCfg(); document.body.classList.add('title'); document.getElementById('gate').style.display = 'flex'; },
      });
      storyUI.setPortraits(ui.portraits || {});
      storyUI.setThumbs(ui.thumbs || {});
    }
    storyUI.open();
  },
  onKickball() {
    S.mode = 'kickball';
    S.rematch = () => handlers.onKickball();
    detachView();
    // TEAMS matters here too: the benches are placed off the team base posts,
    // so without it a 5v5 match beforehand parks both dugouts at x=±9.6.
    applyMapConfig(CFG, 'backyard', TEAMS);   // the sandlot is a fixed 48x33 park
    world.dispose(); world = buildSandlot(scene); world.fx = fx;
    setYard('day');
    const G = makeKickball(world, { seed: (Date.now() % 100000) | 0 });
    G._camera = camera;
    attachKickView(G, scene);
    S.G = G; S.viewAttached = true;
    ui.bind(G);
    document.body.classList.add('kb');
    setCamMode('kickball');
    camTgt.set(0, 0, 4);
  },
  onSettings(st) {
    sfx.setVolume(st.vol); sfx.mute(st.mute);
    LOOK.thickness = st.ink; post.resize(innerWidth, innerHeight);
    applyCamHeight(st.cam);
    if (st.camera !== CAM.mode) setCamMode(st.camera);
  },
  // Escape: pause the match if there is one; otherwise let ui open settings.
  onEscape() {
    if (!S.G || S.G.over) return false;
    setPaused(!S.paused);
    return true;
  },
  // pre-game art: rendered through the real pipeline so it always matches the game
  makeArt() {
    const grab = (sx, sy, sw, sh, w, h) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(renderer.domElement, sx, sy, sw, sh, 0, 0, w, h);
      return c.toDataURL('image/jpeg', 0.86);
    };
    const W = renderer.domElement.width, H = renderer.domElement.height;
    if (W < 8 || H < 8) return null;                  // not laid out yet — try again on a sized frame
    // map thumbnails: overview of each arena
    const thumbs = {};
    const savedFov = camera.fov; camera.fov = 40; camera.updateProjectionMatrix();
    for (const A of ARENAS) {
      useMap(A.map); setYard(A.yard); yardFX.update(0.016);
      camera.position.set(0, 33, 30); camera.lookAt(0, 0, -1);
      post.render();
      const cw = W * 0.78, ch = cw * 9 / 16;
      thumbs[A.key] = grab((W - cw) / 2, (H - ch) / 2 - H * 0.02, cw, ch, 480, 270);
    }
    useMap('backyard'); setYard('day');
    // character portraits: each kit alone on a card-coloured stage
    const stage = new THREE.Scene();
    stage.background = new THREE.Color(0xfff1cf);
    stage.add(new THREE.DirectionalLight(0xfff0c8, 2.0).translateX(-4).translateY(8).translateZ(6),
              new THREE.DirectionalLight(0xcfe3ff, 0.7).translateX(5).translateY(5).translateZ(-6),
              new THREE.HemisphereLight(0xbfe0ff, 0x7a6a4c, 1.05));
    const disc = new THREE.Mesh(new THREE.CircleGeometry(1.1, 40), new THREE.MeshToonMaterial({ color: 0xffd94a }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = 0.01; stage.add(disc);
    const pcam = new THREE.PerspectiveCamera(26, W / H, 0.1, 50);
    const portraits = {};
    KIT_KEYS.forEach((kit, i) => {
      const ch = makeChar('blue', i, kit);
      ch.rotation.y = -0.5;                              // three-quarter, like a trading card
      ch.userData.ring.visible = false; ch.userData.blob.visible = false;
      stage.add(ch);
      const mid = kit === 'dog' ? 0.62 : kit === 'guard' ? 1.28 : 1.32;   // aim above the middle so the hair has headroom
      const dist = kit === 'dog' ? 5.8 : 8.4;
      pcam.position.set(0.4, mid + 1.6, dist); pcam.lookAt(0, mid, 0);
      post.render(stage, pcam);
      const side = Math.min(W, H) * 0.58;
      portraits[kit] = grab((W - side) / 2, (H - side) / 2, side, side, 256, 256);
      stage.remove(ch);
    });
    camera.fov = savedFov; camera.updateProjectionMatrix();
    return { thumbs, portraits };
  },
  onReplay(save) { if (S.G) replay.start(S.G, { save }); },
  onArt(art) { storyUI?.setPortraits(art.portraits); storyUI?.setThumbs(art.thumbs); },
  onKit(kit) { showcase.set(kit); sfx.click(); },
  canReplay: () => replay.canPlay(S.G),
  onAgain() { document.getElementById('over').style.display = 'none'; if (S.rematch) S.rematch(); else location.reload(); },
  isReplaying: () => replay.playing,
  onSkipReplay() { if (S.G) replay.stop(S.G); },
};
const ui = makeUI(handlers);

// ── pause / rematch / quit ────────────────────────────────
// A match used to be a one-way door: no pause, no way out, and the RUN IT BACK
// button was literally location.reload() — a full page reload and a re-bake of
// all the pre-game art just to reach the title screen. Escape now pauses (the
// sim genuinely freezes in local modes; online it can't, and the card says so),
// rematch relaunches the same mode with the same setup in place, and quit
// returns to the menu — or the street map, mid-story — without a reload.
function setPaused(on) {
  S.paused = !!on;
  const p = document.getElementById('pause');
  p.style.display = on ? 'flex' : 'none';
  if (on) {
    document.getElementById('pausecard').querySelector('h1').textContent = 'PAUSED';
    document.getElementById('btnResume').style.display = '';
    const online = S.mode === 'online';
    document.getElementById('pauseNote').textContent =
      online ? 'the match keeps running!' : 'take a breather';
    document.getElementById('btnRematch').style.display = (!online && S.rematch) ? '' : 'none';
  }
}
function quitToMenu() {
  setPaused(false);
  if (S.mode === 'online') { location.reload(); return; }
  const wasStory = S.mode === 'story';
  const wasKb = S.mode === 'kickball';
  detachView(); detachKickView();
  S.G = null; S.viewAttached = false; S.rematch = null; S.mode = null;
  restoreCfg(); ui.setObjective(null);
  document.getElementById('over').style.display = 'none';
  document.body.classList.remove('kb');
  if (wasKb) { useMap('backyard', true); setYard('day'); }
  setCamMode(ui.settings?.camera || 'broadcast');
  if (wasStory) storyUI.open(); else ui.toTitle();
}
document.getElementById('btnResume').onclick = () => { sfx.click(); setPaused(false); };
document.getElementById('btnQuitMenu').onclick = () => { sfx.click(); quitToMenu(); };
document.getElementById('btnRematch').onclick = () => {
  sfx.click(); setPaused(false);
  document.getElementById('over').style.display = 'none';
  S.rematch?.();
};
document.getElementById('btnAgain').onclick = () => {
  sfx.click();
  document.getElementById('over').style.display = 'none';
  if (S.rematch) S.rematch(); else location.reload();
};
document.getElementById('btnOverMenu').onclick = () => { sfx.click(); quitToMenu(); };

// tabbing away freezes rAF, which freezes input sends — tell the server the
// stick is neutral before that happens
addEventListener('visibilitychange', () => { if (document.hidden) net.idle?.(); });

const CAM_MODES = ['broadcast', 'baseline', 'fp'];
addEventListener('keydown', e => {
  if (e.code === 'KeyC' && S.G && S.mode !== 'kickball') { ui.setCamera(CAM_MODES[(CAM_MODES.indexOf(CAM.mode) + 1) % CAM_MODES.length]); }
  if (!S.G) return;
  if (e.code === 'KeyP' && S.mode === 'practice' && !replay.playing) replay.start(S.G);
  if (e.code === 'Space' && replay.playing) replay.speed = replay.speed === 1 ? 0.5 : 1;
});

// ── aim readout ───────────────────────────────────────────
const aimMat  = new THREE.MeshBasicMaterial({ color: 0xffd94a, transparent: true, opacity: 0.30, depthWrite: false });
const aimLine = new THREE.Mesh(new THREE.PlaneGeometry(0.20, 1), aimMat);
aimLine.rotation.x = -Math.PI/2; aimLine.position.y = 0.04;
const aimDisc = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 32), aimMat.clone());
aimDisc.rotation.x = -Math.PI/2; aimDisc.position.y = 0.045;
const cursor  = new THREE.Mesh(new THREE.RingGeometry(0.20, 0.30, 20),
  new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65, depthWrite: false }));
cursor.rotation.x = -Math.PI/2; cursor.position.y = 0.05;
aimLine.visible = aimDisc.visible = cursor.visible = false;
scene.add(aimLine, aimDisc, cursor);

const ray = new THREE.Raycaster();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const hit = new THREE.Vector3(), ndc = new THREE.Vector2();

function worldCursor(inp) {
  const p = S.G.player;
  if (CAM.mode === 'fp') {
    if (inp.padAim) CAM.yaw = Math.atan2(inp.padAim.x, inp.padAim.z);
    return { x: p.x + Math.sin(CAM.yaw) * 8, z: p.z + Math.cos(CAM.yaw) * 8 };
  }
  if (inp.padAim) return { x: p.x + inp.padAim.x * 9, z: p.z + inp.padAim.z * 9 };
  ndc.set((input.mouse.x / innerWidth) * 2 - 1, -(input.mouse.y / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(groundPlane, hit)) return { x: p.x, z: p.z + 5 };
  return { x: hit.x, z: hit.z };
}

function drawAim() {
  const p = S.G.player;
  const show = p.primary === 'lunge' && !p.tagged && CAM.mode !== 'fp';
  aimLine.visible = aimDisc.visible = show;
  cursor.visible = !p.tagged && CAM.mode !== 'fp';
  if (!show) return;
  const ax = Math.sin(p.aim), az = Math.cos(p.aim);
  const L = CFG.lunge;
  const along = Math.max(0, p.vx*ax + p.vz*az);
  const power = Math.min(L.maxSpeed, L.impulse + along * L.stack);
  const travel = power * L.active;
  const reach  = L.reach + power * L.reachPerSpeed;
  const ready = p.lungeCd <= 0 && !p.lunge;
  const col = p.lunge?.phase === 'recover' ? 0xff4d4d : ready ? 0xffd94a : 0x9aa4b2;
  aimMat.color.setHex(col); aimDisc.material.color.setHex(col);
  aimMat.opacity = ready ? 0.34 : 0.14;
  aimDisc.material.opacity = ready ? 0.5 : 0.2;
  aimLine.position.set(p.x + ax*travel/2, 0.04, p.z + az*travel/2);
  aimLine.rotation.z = -p.aim;
  aimLine.scale.set(1, travel, 1);
  aimDisc.position.set(p.x + ax*travel, 0.045, p.z + az*travel);
  aimDisc.scale.setScalar(reach);
}

// ── camera modes ──────────────────────────────────────────
// broadcast: the classic side view.  baseline: NBA 2K — behind your own base,
// the field runs away from you.  fp: first person, pointer-locked.
const camTgt = new THREE.Vector3(0, 0, 0);
const UPV = new THREE.Vector3(0, 1, 0);

// screen-forward / screen-right in world space for the current camera
function camBasis() {
  const p = S.G?.player;
  if (CAM.mode === 'baseline' && p) {
    const f = p.team === 'blue' ? 1 : -1;
    return { F: [f, 0], R: [0, f] };
  }
  if (CAM.mode === 'fp') {
    const s = Math.sin(CAM.yaw), c = Math.cos(CAM.yaw);
    return { F: [s, c], R: [-c, s] };
  }
  return { F: [0, -1], R: [1, 0] };
}
// WASD / stick are screen-relative: W is always "up the screen"
function toWorldInput(inp) {
  const { F, R } = camBasis();
  const fwd = -inp.dz, right = inp.dx;
  inp.dx = R[0] * right + F[0] * fwd;
  inp.dz = R[1] * right + F[1] * fwd;
  if (inp.padAim) {
    const ax = inp.padAim.x, az = inp.padAim.z;
    inp.padAim = { x: R[0] * ax + F[0] * -az, z: R[1] * ax + F[1] * -az };
  }
}
function setCamMode(mode) {
  CAM.mode = mode;
  const p = S.G?.player;
  if (mode === 'fp') { CAM.yaw = p ? p.aim : 0; CAM.pitch = 0.05; }
  camera.fov = mode === 'fp' ? CFG.camFP.fov : mode === 'baseline' ? CFG.cam2k.fov : mode === 'kickball' ? 38 : 42;
  camera.updateProjectionMatrix();
  if (mode !== 'fp' && document.pointerLockElement === canvas) document.exitPointerLock();
}
// Lock only while a match is genuinely live. The old guard was `S.G` alone, so
// clicking anywhere on the end card's backdrop re-captured the mouse.
const wantLock = () => CAM.mode === 'fp' && S.G && !S.G.over && !S.paused && !replay.playing;
canvas.addEventListener('click', () => { if (wantLock() && document.pointerLockElement !== canvas) canvas.requestPointerLock(); });
// And release it the moment any of those stop being true — match end, pause,
// replay, quit. Before this, finishing a match in first person left the mouse
// captured: you were still steering a dead kid and could not click a single
// button until you happened to press Escape.
function lockWatchdog() {
  if (document.pointerLockElement === canvas && !wantLock()) document.exitPointerLock();
  // and pop out of first person the moment the match ends — the fp rig parked
  // inside your own idle kid, staring at the back of his head through the end
  // card. C brings it back any time.
  if (CAM.mode === 'fp' && S.G?.over) setCamMode('broadcast');
}
addEventListener('mousemove', e => {
  if (document.pointerLockElement !== canvas) return;
  CAM.yaw -= e.movementX * CFG.camFP.sens;
  CAM.pitch = Math.max(-0.9, Math.min(0.7, CAM.pitch - e.movementY * CFG.camFP.sens));
});

let titleT = 0;
function placeTitleCamera(dt) {
  titleT += dt * 0.055;
  const R = 34 + Math.sin(titleT * 0.7) * 4;
  camera.position.set(Math.sin(titleT) * R, 19 + Math.sin(titleT * 0.5) * 3, Math.cos(titleT) * R);
  camera.lookAt(0, 1.5, 0);
}

function placeCamera(dt) {
  const p = S.G?.player;
  const sp = p ? Math.hypot(p.vx, p.vz) : 0;
  const sx = juice.shake.x, sz = juice.shake.z;

  if (CAM.mode === 'fp' && p) {
    CAM.bobT += dt * (4 + sp * 1.2);
    const bob = Math.min(1, sp / 6) * Math.sin(CAM.bobT * 2) * CFG.camFP.bob;
    const fx = Math.sin(CAM.yaw), fz = Math.cos(CAM.yaw);
    camera.position.set(p.x + fx * 0.25 + sx * 0.3, CFG.camFP.eye + bob + (p.roll ? -0.7 : 0), p.z + fz * 0.25 + sz * 0.3);
    camera.lookAt(camera.position.x + fx * Math.cos(CAM.pitch), camera.position.y + Math.sin(CAM.pitch), camera.position.z + fz * Math.cos(CAM.pitch));
    return;
  }
  if (CAM.mode === 'kickball') {
    // Broadcast rig behind the plate. On a live ball it leans out to follow the
    // play and pushes in; when the ball is dead it drifts back to the wide shot.
    const G2 = S.G, b = G2?.ball;
    const chasing = b && !b.held && (G2.phase === 'live') && b.kicked;
    const wantX = chasing ? Math.max(-14, Math.min(14, b.x * 0.75)) : 0;
    const wantZ = chasing ? Math.max(-16, Math.min(6, (b.z - 4) * 0.5)) : 0;
    const wantH = chasing ? 29 : 34;
    const k2 = 1 - Math.exp((chasing ? -4.2 : -1.8) * dt);
    camTgt.x += (wantX - camTgt.x) * k2;
    camTgt.z += (wantZ - camTgt.z) * k2;
    CAM.kbH = (CAM.kbH ?? 34) + (wantH - (CAM.kbH ?? 34)) * k2;
    juice.updateShake(dt);
    camera.position.set(camTgt.x + juice.shake.x, CAM.kbH, 38 + camTgt.z * 0.5 + juice.shake.z);
    camera.lookAt(camTgt.x * 0.6, 0, camTgt.z);   // target is NOT shaken, so the view actually rocks
    return;
  }
  if (CAM.mode === 'baseline' && p) {
    const C = CFG.cam2k, f = p.team === 'blue' ? 1 : -1;
    const k = 1 - Math.exp(-C.lag * dt);
    camTgt.x += (p.x + p.vx * C.lookAhead - camTgt.x) * k;
    camTgt.z += (p.z * 0.55 + p.vz * C.lookAhead * 0.5 - camTgt.z) * k;    // lateral follow is damped, like 2K
    // Shake the camera, NOT the target: adding the same offset to both moved the
    // whole rig sideways without changing the view direction at all, which at
    // 23.5 units up is about 1% of frame and reads as nothing.
    camera.position.set(camTgt.x - f * C.back + sx, C.height + sz * 0.35, camTgt.z + sz);
    camera.lookAt(camTgt.x + f * 6, 0.6, camTgt.z);
    return;
  }
  const k = 1 - Math.exp(-CFG.cam.lag * dt);
  if (p) {
    let lx = p.vx * CFG.cam.lookAhead, lz = p.vz * CFG.cam.lookAhead;
    const lm = Math.hypot(lx, lz);
    if (lm > 4.2) { lx = lx/lm*4.2; lz = lz/lm*4.2; }
    camTgt.x += (p.x + lx - camTgt.x) * k;
    camTgt.z += (p.z + lz - camTgt.z) * k;
  }
  const h = CFG.cam.height * (1 + sp * CFG.cam.zoomSpeed * 0.06);
  camera.position.set(camTgt.x + sx, h*Math.cos(CFG.cam.tilt), camTgt.z + h*Math.sin(CFG.cam.tilt) + sz);
  camera.lookAt(camTgt.x + sx, 0.9, camTgt.z + sz);
}

const juice = makeJuice(scene, camera);
const kickCtl = makeKickControl();
let stopT = 0;
addEventListener('pointerdown', () => sfx.unlock(), { once: true });
// M is handled once, in ui.js, where it also updates the checkbox and persists.
// A second handler here toggled sfx directly on the same event and undid it,
// so the key did nothing audible while the saved setting flipped underneath.

// Sounds come from two places: sim events (tags, scores, pickups) and per-actor
// state transitions (dashes, lunges), attenuated by distance to the player.
// WeakMap: keyed by actor, and rematch no longer reloads the page — a Map here
// pinned every retired roster (and its full mesh graph) for the session.
const prevState = new WeakMap();
let prevBalloons = 0;
function soundPass(G) {
  const p = G.player;
  const vol = a => { const d = Math.hypot(a.x - p.x, a.z - p.z); return Math.max(0.12, 1 - d / 26); };
  for (const e of G.events) {
    if (e._heard) continue; e._heard = true;
    switch (e.kind) {
      case 'tag':      sfx.tag(1); rumble(0.4, 0.6, 90); break;
      case 'hurt':     sfx.hurt(1); rumble(1.0, 0.8, 220); break;
      case 'score':    sfx.score(); rumble(0.5, 0.5, 300); break;
      case 'catch':    sfx.catch_(1); break;
      case 'pickup':   sfx.pickup(1); break;
      case 'return':   sfx.drop(1); break;
      case 'count':    sfx.count(+e.text); break;
      case 'go':       sfx.count(0); break;
      case 'overtime': sfx.overtime(); break;
      case 'gameover': sfx.gameover(S.G?.over === 'draw' ? false : S.G?.over === S.G?.player?.team); break;
    }
  }
  for (const a of G.actors) {
    const ps = prevState.get(a) || {};
    const v = vol(a);
    if (a.dashCd > (ps.dashCd ?? 0) + 0.3) { sfx.dash(v); if (a === p) rumble(0.15, 0.4, 60); }
    const ph = a.lunge?.phase;
    if (ph === 'active' && ps.ph !== 'active') sfx.lunge(v);
    if (a.whiff > 0 && !(ps.whiff > 0)) sfx.whiff(v);
    if (a.roll && !ps.roll) sfx.shove(v);
    if (a.swing && !ps.swing) sfx.kite(v);
    if (a.grapple && !ps.grapple) sfx.grapple(v);
    if ((a.balloonCd ?? 0) > (ps.balloonCd ?? 0) + 0.3) sfx.balloon(v);
    if ((a.tossCd ?? 0) > (ps.tossCd ?? 0) + 0.5) sfx.toss(v);
    if ((a.portalCd ?? 0) > (ps.portalCd ?? 0) + 0.5) sfx.portal(v);
    if (a.tpCd > (ps.tpCd ?? 0) + 0.3) sfx.portal(v);
    if ((a.hornCd ?? 0) > (ps.hornCd ?? 0) + 0.5) { sfx.horn(v); if (a === p) rumble(0.6, 0.7, 160); }
    if ((a.sprayCd ?? 0) > (ps.sprayCd ?? 0) + 0.3) sfx.hose(v);
    if ((a.hurdleCd ?? 0) > (ps.hurdleCd ?? 0) + 0.3) sfx.kickflip(v);
    if ((a.duckCd ?? 0) > (ps.duckCd ?? 0) + 0.3) sfx.duck(v);
    prevState.set(a, { dashCd: a.dashCd, ph, whiff: a.whiff, roll: !!a.roll, swing: !!a.swing,
                       grapple: !!a.grapple, balloonCd: a.balloonCd, tossCd: a.tossCd, portalCd: a.portalCd, tpCd: a.tpCd,
                       hornCd: a.hornCd, sprayCd: a.sprayCd, hurdleCd: a.hurdleCd, duckCd: a.duckCd });
  }
  if (G.balloons.length < prevBalloons) sfx.splash(0.8);
  prevBalloons = G.balloons.length;
}
function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  post.resize(innerWidth, innerHeight);
}
addEventListener('resize', resize); resize();

const STEP = 1 / CFG.sim.hz;
let acc = 0, last = performance.now() / 1000;

let frameErr = false;
function frame() {
  requestAnimationFrame(frame);
  try { frameBody(); }
  catch (e) {
    if (!frameErr) { frameErr = true; console.error('[frame]', e); }
    try { post.render(); } catch {}          // never leave a stale picture
  }
}

function frameBody() {
  lockWatchdog();
  const now = performance.now() / 1000;
  const dt = Math.min(0.25, now - last); last = now;

  if (!artBuilt && !S.G && renderer.domElement.width >= 8) artBuilt = ui.buildArt();
  if (!S.G) {
    xhair.style.display = 'none';
    if (ui.lobbyOpen()) { showcase.frame(dt); post.render(showcase.scene, showcase.cam); return; }
    placeTitleCamera(dt); yardFX.update(dt); ambience.update(dt); world.fx.update(dt); post.render(); return;
  }

  // replay takes over: no sim, no net — just the recorded frames through the same view
  if (replay.playing) {
    // the end card is a near-opaque overlay — hide it while the replay runs,
    // bring it back when the replay ends with the match still over
    const ov = document.getElementById('over');
    if (ov.style.display === 'flex') { ov.style.display = 'none'; S.overHidden = true; }
    // A first-person replay was a broken camera: mouse-look is dead (pointer
    // lock released), your own body is hidden, and the shot sits inside a kid
    // being puppeted by recorded frames. Replays are broadcast; the mode you
    // were playing in comes back when it ends.
    if (!S.replayCam) { S.replayCam = CAM.mode; if (CAM.mode === 'fp') setCamMode('broadcast'); }
    // Drain input edges: without this, every click and key pressed during the
    // replay sat in the buffers and fired the instant live play resumed.
    input.read();
    replay.step(S.G, dt);
    ui.replayBanner(replay.playing, replay.progress, replay.speed);
    if (S.viewAttached) {
      syncVisuals(S.G, dt, 1);
      for (const a of S.G.actors) animChar(a.mesh, a, dt);
      if (CAM.mode === 'fp') S.G.player.mesh.visible = false;
      juice.update(S.G, dt);
    }
    world.fx.update(dt); yardFX.update(dt); ambience.update(dt); placeCamera(dt); post.render();
    return;
  }
  ui.replayBanner(false);
  if (S.replayCam) { setCamMode(S.replayCam); S.replayCam = null; }
  if (S.overHidden) { S.overHidden = false; if (S.G?.over) document.getElementById('over').style.display = 'flex'; }

  // hit-stop: after a tag the sim holds its breath for a few frames (local only)
  if (stopT > 0) stopT -= dt; else acc += dt;
  while (acc >= STEP) {
    const inp = input.read();
    if (window.DBG?.force) Object.assign(inp, window.DBG.force);
    if (window.DBG?.paused || (S.paused && S.mode !== 'online')) { acc = 0; break; }
    toWorldInput(inp);
    const c = worldCursor(inp);
    inp.aimX = c.x; inp.aimZ = c.z;
    cursor.position.set(c.x, 0.05, c.z);
    if (S.mode === 'online') net.tick(inp);
    else if (S.mode === 'kickball') {
      kickCtl.setTaps(inp.taps || new Set());
      S.G.step(STEP, kickCtl.driver(S.G, inp, input.keys, S.G.player.team));
    }
    else S.G.step(STEP, inp);
    acc -= STEP;
  }
  if (S.mode === 'online') net.render();

  const alpha = S.mode === 'online' ? 1 : acc / STEP;
  if (S.mode === 'kickball' && S.viewAttached) {
    kickSounds(S.G);
    kickCtl.tick(dt);
    setControlMarker(S.G, kickCtl.steering);
    S.G._hint = kickCtl.hint;
    syncKickView(S.G, dt, alpha);
    world.fx.update(dt); ambience.update(dt); placeCamera(dt); ui.update(dt); post.render();
    return;
  }
  if (S.viewAttached) {
    syncVisuals(S.G, dt, alpha);
    for (const a of S.G.actors) animChar(a.mesh, a, dt);
    if (CAM.mode === 'fp') S.G.player.mesh.visible = false;
    drawAim();
    juice.update(S.G, dt);
    soundPass(S.G);
    replay.record(S.G);
    stopT = Math.max(stopT, juice.consumeHitstop());   // every mode, not just practice
  }
  if (S.mode === 'story' && S.G?.over && !S.storyReported) {
    S.storyReported = true;
    restoreCfg();
    ui.setObjective(null);
    storyUI.report({ won: S.G.over === 'blue',
                     score: { us: S.G.score.blue, them: S.G.score.red },
                     tally: S.G.tally,
                     secondsLeft: S.G.time });
    S.G = null; S.viewAttached = false;
    document.getElementById('over').style.display = 'none';
  }
  world.fx.update(dt);
  yardFX.update(dt);
  ambience.update(dt);
  placeCamera(dt);
  ui.update(dt);
  xhair.style.display = (CAM.mode === 'fp' && S.G && !S.G.over && !replay.playing) ? 'block' : 'none';
  post.render();
}
// Kickball audio + celebration, driven off the sim's event kinds.
// NOTE: never call juice.update() here — juice is built around the CTF game
// object (flags/balloons/portals) and kickball has none of them.
const kbHeard = new WeakSet();
function kickSounds(G) {
  for (const e of G.events || []) {
    if (kbHeard.has(e)) continue; kbHeard.add(e);
    switch (e.kind) {
      case 'pitch':  sfx.pitchRoll(0.8); break;
      case 'kick':   sfx.kickBall(1); juice.shakeFor(0.22, 0.18); break;
      case 'field':  sfx.glove(0.7); break;
      case 'throw':  sfx.glove(0.4); break;
      case 'out':    sfx.umpOut(1); juice.shakeFor(0.16, 0.15); break;
      case 'run':    sfx.runIn(1); juice.shakeFor(0.28, 0.32); break;
      case 'homer':  sfx.dinger(); break;
      case 'inning': sfx.inningBell(); break;
      case 'strike': case 'ball': sfx.count(1); break;
      case 'walk':   sfx.umpSafe(1); break;
      case 'ghost':  sfx.pickup(0.6); break;
      case 'over':   sfx.gameover(G.over === G.player?.team); break;
      case 'count':  sfx.count(+e.text || 1); break;
      case 'go':     sfx.count(0); break;
      case 'foul':   sfx.whiff(1); break;
      case 'knock':  sfx.glove(0.9); break;
    }
  }
}

// gamepad: prompts + rumble
let padSeen = false;
setInterval(() => { const gp = navigator.getGamepads?.()[0]; const on = !!gp; if (on !== padSeen) { padSeen = on; ui.padHints(on); } }, 1000);
function rumble(strong, weak, ms) {
  if (!ui.settings.rumble) return;
  const gp = navigator.getGamepads?.()[0];
  gp?.vibrationActuator?.playEffect?.('dual-rumble', { duration: ms, strongMagnitude: strong, weakMagnitude: weak }).catch?.(() => {});
}

ui.bindCamera(setCamMode);
let artBuilt = false;
// try once now; the frame loop retries until the canvas has a real size,
// and stops trying the moment a match exists
requestAnimationFrame(() => { if (!artBuilt && !S.G) artBuilt = ui.buildArt(); });
window.DBG = { get storyUI() { return storyUI; }, get G() { return S.G; }, get world() { return world; }, scene, force: null, paused: false, net, LOOK, replay, CAM, showcase };
frame();

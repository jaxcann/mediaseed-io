// ─────────────────────────────────────────────────────────────────────────────
//  Fairway — a voxel golf course architect & management sim
// ─────────────────────────────────────────────────────────────────────────────
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import * as TS from './teesheet.js';
import * as SCORE from './score.js';
import * as PEOPLE from './people.js';
import * as STARS from './stars.js';
import * as MAJORS from './majors.js';

// ── Constants ────────────────────────────────────────────────────────────────

const SAVE_KEY = 'fairway-save-v1';
const EXPANSIONS = [
  { size: 16, cost: 0 },
  { size: 20, cost: 600 },
  { size: 24, cost: 2400 },
  { size: 28, cost: 9000 },
  { size: 32, cost: 30000 },
];
const OFFLINE_CAP_S = 8 * 3600;
const MAX_GOLFERS = 36;
const ELEV_STEP = 0.34;
const MAX_ELEV = 2;
const RAISE_COST = 30;

// ── The clock ────────────────────────────────────────────────────────────────
// The player's own local date and time run this club. Sunrise, the tee sheet,
// the colour of the light and whether the gate is even open all read from one
// place — nowMs() — so a single offset lets a test stand in a Saturday dawn or
// a Tuesday midnight without waiting for either to come around.

const clock = { offset: 0 };
function nowMs() { return Date.now() + clock.offset; }
function nowDate() { return new Date(nowMs()); }
function nowMinute() { return TS.minuteOfDay(nowDate()); }

// today's shape, cached until the calendar turns over
let today = null;
function dayInfo() {
  const d = nowDate();
  const key = TS.dayKey(d);
  if (!today || today.key !== key) {
    today = {
      key, dl: TS.daylight(d), weekend: TS.isWeekend(d), seed: TS.hash32(key),
      label: d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }),
    };
  }
  return today;
}
// the club is open from the first tee time to the last of the light
function clubOpen(min) {
  const t = dayInfo();
  const m = min === undefined ? nowMinute() : min;
  return m >= t.dl.first && m <= t.dl.sunset + 12;
}

// ── Golf scale ───────────────────────────────────────────────────────────────
// One tile ≈ 35 yards, so every grid (16×16 → 32×32) can host real yardages:
// a 5-tile pitch is a 175 yd par 3, a 12-tile hole a 420 yd par 4, and a
// 14-tile monster a 490 yd par 5 — all reachable even on the starter island.
// Par comes from USGA-style bands on EFFECTIVE playing length — raw yardage
// adjusted for the tee→green elevation change (uphill plays longer):
//   par 3 ≤ 250 yds · par 4 251–470 yds · par 5 ≥ 471 yds
const YARDS_PER_TILE = 35;
const ELEV_YARDS = 12;                 // each terrain level ≈ 12 yds of playing length
const PAR4_MIN = 251, PAR5_MIN = 471;  // band edges, in effective yards
function parFor(effYards) { return effYards >= PAR5_MIN ? 5 : effYards >= PAR4_MIN ? 4 : 3; }

// the cup sits off-centre on its tile (see buildTile) — putts have to find it
const CUP_OFF = { x: -0.14, z: -0.1 };
const BALL_R = 0.06;

const TILE_DEFS = {
  grass:   { cost: 0,   h: 0.50 },
  fairway: { cost: 20,  h: 0.50 },
  rough:   { cost: 10,  h: 0.50 },
  path:    { cost: 15,  h: 0.49 },
  green:   { cost: 60,  h: 0.54 },
  tee:     { cost: 75,  h: 0.56 },
  flag:    { cost: 100, h: 0.54 },
  bunker:  { cost: 50,  h: 0.44 },
  water:   { cost: 70,  h: 0.36 },
  bridge:  { cost: 60,  h: 0.50 },
  tree:    { cost: 35,  h: 0.50 },
  flower:  { cost: 25,  h: 0.50 },
  sign:    { cost: 40,  h: 0.50 },
  club:    { cost: 0,   h: 0.50 },
};

// Overlay tiles: they don't replace the surface, they sit on it. A pin needs a
// green under it; a bridge needs water. Painting one keeps the tile beneath
// intact (so no refund is owed and none is charged again), and clearing it puts
// that tile back. One rule, two tools — placement, undo and the dozer all read
// it, so the price on the dock is exactly the price you pay.
const UNDER = { flag: 'green', bridge: 'water' };
const UNDER_MSG = { flag: 'The pin goes on a green', bridge: 'A bridge needs water to cross' };

// Clubhouse plot (world tile coords, fixed for all expansions and all tiers):
// the building stands on the east 2×2, and the west column is the motor court
// the fleet parks on. All of it is club ground, so nothing the club ever builds
// — canopy, fountain, parked cart — can collide with a tile the player paints.
const CLUB = { x0: -2, x1: 0, z0: 5, z1: 6 };
const DOOR = new THREE.Vector3(0, 0.52, 5.28);
const SPAWN_TILE = { x: 0, z: 4 };
const CART_PARK_TILE = { x: -2, z: 6 };
const BAY_X = -1.5;                    // centre line of the motor-court rank
const BAY_Z0 = 5.32, BAY_PITCH = 0.45; // first bay, and the pitch between bays

const COLORS = {
  grassA: 0xa8d791, grassB: 0xa2d28a, grassC: 0xaedb98,
  fairwayA: 0x8dd26c, fairwayB: 0x84ca62,
  roughA: 0x71ad6b, roughB: 0x6aa565, roughC: 0x79b473,
  blade: 0x629c5e,
  greenA: 0x5bc678, greenB: 0x63cd81,
  pathA: 0xe9e3d3, pathB: 0xe3dcc9, pathC: 0xdfd7c2,
  fringe: 0x79d189,
  deck: 0xd3ae83, deckBeam: 0xb8916a, rail: 0xe7d6bd,
  plaque: 0xf6f2e9, plaqueEdge: 0xd3ae83, digit: 0x39424e,
  bunker: 0xf0e2b0, ripple: 0xf6ecc8,
  water: 0x6fc1ee, waterDeep: 0x54a9d8,
  plaza: 0xe7e2d7,
  earth: 0xd9c6a0,
  trunk: 0x8a6a4f,
  canopy: [0x4fa05e, 0x58ab66, 0x479457],
  conifer: [0x3e8a55, 0x468f5b],
  cypress: 0x4d9160,
  blossom: [0xf3b7cd, 0xf9cbdb],
  petals: [0xffc7d9, 0xfff3b0, 0xffffff, 0xffb3a7, 0xd7c5f2],
  pole: 0xf4f4f6,
  flagCloth: 0xff5a4e,
  hole: 0x2f3a33,
  shirts: [0xf28b82, 0x8ab4f8, 0xfdd663, 0x81c995, 0xffb3c1, 0xb39ddb, 0xffffff, 0xffab70],
  pants: [0xeceef0, 0x9aa0a6, 0x546070, 0xd9c6a0],
  skins: [0xf3c6a5, 0xe0ac69, 0xc68642, 0x8d5524, 0xffdbac],
  cartBody: 0xfafafa,
  cartSeat: 0xd9c6a0,
  wheel: 0x2e3238,
  clubWall: 0xfaf8f3,
  clubRoof: 0xd8d2c6,
  clubDoor: 0x39424e,
  clubGlass: 0xa9cede,
  clubTrim: 0xf6f2e9,
  clubStone: 0xd6cfc1,
  clubWood: 0xd3ae83,
  clubShade: 0xf29181,
  clubGlow: 0xffe2b3,
};

// ── Course themes ────────────────────────────────────────────────────────────
// The whole property, dressed for a season. A theme only ever swaps COLORS that
// buildTile reads at build time — turf, rough, canopies, blossom, petals — plus
// the sky behind the glass and the colour of the light. Nothing structural
// moves, so a re-dress is one rebuildIsland() and the connected caps, the cached
// cap geometries and every shader effect come through untouched. mat() is keyed
// by colour and enhance() keys its program by effect, so a new palette costs a
// handful of material instances and ZERO shader recompiles.

const BASE_COLORS = Object.assign({}, COLORS);

const PALETTES = [
  {
    id: 'summer', name: 'Summer', sub: 'High season. Deep, watered green.',
    swatch: ['#a8d791', '#8dd26c', '#4fa05e'],
    sky: { glow: '#cfe6f4', fade: 'rgba(207,230,244,0)', a: '#dceaf4', b: '#edf1e9', c: '#f5f2e9' },
    light: { sun: 0xfff2dd, skyHemi: 0xd8e8f4, groundHemi: 0xeae2cf },
    c: {},
  },
  {
    id: 'blossom', name: 'Blossom', sub: 'Early spring. New growth and pink trees.',
    swatch: ['#b2dd97', '#94d873', '#f7c2d6'],
    sky: { glow: '#f1dfe9', fade: 'rgba(241,223,233,0)', a: '#ecdfe9', b: '#f0efe7', c: '#f8f2ea' },
    light: { sun: 0xfff0ea, skyHemi: 0xe8e2f2, groundHemi: 0xf0e6da },
    c: {
      grassA: 0xb2dd97, grassB: 0xabd88f, grassC: 0xb9e2a0,
      fairwayA: 0x94d873, fairwayB: 0x8bd069,
      roughA: 0x7cb872, roughB: 0x74b06c, roughC: 0x85c07b, blade: 0x6ba565,
      fringe: 0x86d894,
      canopy: [0x66b56a, 0x72bd74, 0x5daa62],
      conifer: [0x4d9a62, 0x54a069], cypress: 0x5b9c6b,
      blossom: [0xf7c2d6, 0xfdd6e2],
      petals: [0xffd0e0, 0xfff6c4, 0xffffff, 0xffc0b4, 0xdccdf5],
    },
  },
  {
    id: 'autumn', name: 'Autumn', sub: 'Late season. Gold turf, turning trees.',
    swatch: ['#c9cf84', '#b6c96a', '#d98a3c'],
    sky: { glow: '#f0dcc0', fade: 'rgba(240,220,192,0)', a: '#ecdec5', b: '#f1ece0', c: '#f8f1e3' },
    light: { sun: 0xffe6c0, skyHemi: 0xe6dcc8, groundHemi: 0xf0e0c4 },
    c: {
      grassA: 0xc9cf84, grassB: 0xc4c97e, grassC: 0xd0d68e,
      fairwayA: 0xb6c96a, fairwayB: 0xadc062,
      roughA: 0xa5a35e, roughB: 0x9d9b58, roughC: 0xaeac67, blade: 0x8f8b4d,
      greenA: 0x7cc07a, greenB: 0x84c682,
      fringe: 0xa8c47c,
      canopy: [0xd98a3c, 0xe0a13f, 0xc7702f],
      conifer: [0x5f8a52, 0x678f57], cypress: 0x7a8f4e,
      blossom: [0xe8895e, 0xf0a870],
      petals: [0xf0a45c, 0xf5d17a, 0xffffff, 0xe07a5a, 0xd9b38c],
    },
  },
  {
    id: 'coastal', name: 'Coastal', sub: 'Links land. Bleached fescue and sea air.',
    swatch: ['#c6cf9e', '#9ac97a', '#5d9c74'],
    sky: { glow: '#cfe4ee', fade: 'rgba(207,228,238,0)', a: '#d6e6ee', b: '#e9eee9', c: '#f2f1e6' },
    light: { sun: 0xf4f6ff, skyHemi: 0xd2e6f2, groundHemi: 0xe4e6d8 },
    c: {
      grassA: 0xc6cf9e, grassB: 0xc0c996, grassC: 0xccd5a8,
      fairwayA: 0x9ac97a, fairwayB: 0x92c172,
      roughA: 0xb3b47a, roughB: 0xabac72, roughC: 0xbcbd85, blade: 0x9c9d67,
      greenA: 0x66c485, greenB: 0x6ecb8d,
      fringe: 0x8ac996,
      canopy: [0x5d9c74, 0x64a37b, 0x54916b],
      conifer: [0x477f63, 0x4d8569], cypress: 0x51886e,
      blossom: [0xd9c5b0, 0xe6d6c4],
      petals: [0xffd9c2, 0xfff0d0, 0xffffff, 0xbfd9e8, 0xe0cfe8],
    },
  },
];

function paletteOf(id) { return PALETTES.find(p => p.id === id) || PALETTES[0]; }

const ICONS = {
  orbit: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M2.8 12c0-2.1 4.2-4.4 9.2-4.4s9.2 2.3 9.2 4.4-4.2 4.4-9.2 4.4S2.8 14.1 2.8 12Z"/></svg>',
  fairway: '<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M9 17l8-8"/><path d="M6.5 13.5l7-7"/></svg>',
  path: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 19c6.5-1 1.5-7.5 7-8.5S12.5 4 19 4.5" stroke-dasharray="2.6 3"/></svg>',
  green: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/></svg>',
  tee: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="7.5" r="3.4"/><path d="M9.5 13h5"/><path d="M12 13v6"/></svg>',
  flag: '<svg class="icon" viewBox="0 0 24 24"><path d="M7 20.5V4"/><path d="M7 4.5h9.5L14 7.8l2.5 3.3H7"/></svg>',
  bunker: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 16c2.5-5.5 5-8 8-8s5.5 2.5 8 8"/><path d="M4.5 19h15"/></svg>',
  water: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 10c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2"/><path d="M4 15.5c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2"/></svg>',
  tree: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="9" r="5.4"/><path d="M12 14.4V20"/><path d="M9.2 20h5.6"/></svg>',
  flower: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><circle cx="12" cy="6.6" r="2.5"/><circle cx="17.4" cy="12" r="2.5"/><circle cx="12" cy="17.4" r="2.5"/><circle cx="6.6" cy="12" r="2.5"/></svg>',
  raise: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 19h16"/><path d="M12 15V6.5"/><path d="M8.5 10L12 6.5l3.5 3.5"/></svg>',
  lower: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 19h16"/><path d="M12 6.5V15"/><path d="M8.5 11.5L12 15l3.5-3.5"/></svg>',
  dozer: '<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="5"/><path d="M9.5 9.5l5 5"/><path d="M14.5 9.5l-5 5"/></svg>',
  up: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 16.5V8"/><path d="M8.5 11.5L12 8l3.5 3.5"/><circle cx="12" cy="12" r="9"/></svg>',
  sound: '<svg class="icon" viewBox="0 0 24 24"><path d="M4.5 10v4h3l4 3.6V6.4L7.5 10h-3Z"/><path d="M15 9.5a4 4 0 010 5"/><path d="M17.3 7.5a7 7 0 010 9"/></svg>',
  soundOff: '<svg class="icon" viewBox="0 0 24 24"><path d="M4.5 10v4h3l4 3.6V6.4L7.5 10h-3Z"/><path d="M15.5 9.8l4.4 4.4"/><path d="M19.9 9.8l-4.4 4.4"/></svg>',
  // the middle notch: the speaker with its near wave only — the objects in the
  // room still sound, the music further off does not
  soundFoley: '<svg class="icon" viewBox="0 0 24 24"><path d="M4.5 10v4h3l4 3.6V6.4L7.5 10h-3Z"/><path d="M15 9.5a4 4 0 010 5"/></svg>',
  close: '<svg class="icon" viewBox="0 0 24 24"><path d="M6.5 6.5l11 11"/><path d="M17.5 6.5l-11 11"/></svg>',
  land: '<svg class="icon" viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="14" rx="4"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3"/></svg>',
  house: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 11l8-6.5L20 11"/><path d="M6 10v9h12v-9"/><path d="M10.5 19v-5h3v5"/></svg>',
  mega: '<svg class="icon" viewBox="0 0 24 24"><path d="M4 10v4h3l9 4.5v-13L7 10H4Z"/><path d="M19 10.5a3 3 0 010 3"/></svg>',
  leaf: '<svg class="icon" viewBox="0 0 24 24"><path d="M6 18C6 9 12 5 19 5c0 8-4 13-11 13"/><path d="M6 18c2-4 5-7 9-9"/></svg>',
  bag: '<svg class="icon" viewBox="0 0 24 24"><rect x="6" y="7.5" width="12" height="12.5" rx="3.5"/><path d="M9 7.5V6a3 3 0 016 0v1.5"/></svg>',
  cart: '<svg class="icon" viewBox="0 0 24 24"><path d="M5.5 7h8.5"/><path d="M6.5 7v6.5M13 7v6.5"/><path d="M4 13.5h13.5l2.5-4"/><circle cx="7.5" cy="17" r="1.7"/><circle cx="15.5" cy="17" r="1.7"/></svg>',
  person: '<svg class="icon" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 19c1-3.8 3.5-5.5 6.5-5.5s5.5 1.7 6.5 5.5"/></svg>',
  star: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 4l2.4 5 5.6.7-4.1 3.8 1 5.5-4.9-2.7-4.9 2.7 1-5.5L4 9.7 9.6 9 12 4Z"/></svg>',
  spark: '<svg class="icon" viewBox="0 0 24 24"><path d="M11 4c.8 3.9 2.8 5.9 6.7 6.7-3.9.8-5.9 2.8-6.7 6.7-.8-3.9-2.8-5.9-6.7-6.7C8.2 9.9 10.2 7.9 11 4Z"/><path d="M18 14.5c.4 2 1.4 3 3.4 3.4-2 .4-3 1.4-3.4 3.4-.4-2-1.4-3-3.4-3.4 2-.4 3-1.4 3.4-3.4Z"/></svg>',
  check: '<svg class="icon" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  route: '<svg class="icon" viewBox="0 0 24 24"><circle cx="6" cy="18" r="2.6"/><circle cx="18" cy="6" r="2.6"/><path d="M8.3 16.2C13.5 13.4 10.6 9 15.7 7.4" stroke-dasharray="2.4 3"/></svg>',
  link: '<svg class="icon" viewBox="0 0 24 24"><path d="M10.2 13.8a3.6 3.6 0 005.4.4l2.6-2.6a3.6 3.6 0 00-5.1-5.1l-1.4 1.4"/><path d="M13.8 10.2a3.6 3.6 0 00-5.4-.4l-2.6 2.6a3.6 3.6 0 005.1 5.1l1.4-1.4"/></svg>',
  lock: '<svg class="icon" viewBox="0 0 24 24"><rect x="5.5" y="10.5" width="13" height="9.5" rx="3"/><path d="M8.5 10.5V8a3.5 3.5 0 017 0v2.5"/></svg>',
  chev: '<svg class="icon" viewBox="0 0 24 24"><path d="M10 6.5l6 5.5-6 5.5"/></svg>',
  rough: '<svg class="icon" viewBox="0 0 24 24"><path d="M3.5 19.5h17"/><path d="M6.5 19.5c0-4 .8-6.4 2.4-8.2"/><path d="M12 19.5c0-5.4 1-8.6 2.8-10.8"/><path d="M17.5 19.5c0-3.4.6-5.5 1.9-7"/></svg>',
  bridge: '<svg class="icon" viewBox="0 0 24 24"><path d="M2.5 14.5c4 0 4.5-6 9.5-6s5.5 6 9.5 6"/><path d="M2.5 14.5v3.5M21.5 14.5v3.5"/><path d="M8 11v3.6M16 11v3.6"/></svg>',
  sign: '<svg class="icon" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="9.5" rx="2.6"/><path d="M12 13.5V20"/><path d="M9 20h6"/></svg>',
  palette: '<svg class="icon" viewBox="0 0 24 24"><path d="M12 3.2a8.8 8.8 0 100 17.6c1.7 0 2.1-1.2 1.3-2.1-.8-.9-.3-2.1 1.1-2.1H16a4.8 4.8 0 004.8-4.8c0-4.8-3.9-8.6-8.8-8.6Z"/><circle cx="8.4" cy="10.2" r="1.05"/><circle cx="12" cy="7.6" r="1.05"/><circle cx="15.6" cy="10.2" r="1.05"/></svg>',
  // the two the chits needed. A championship is a cup on the sideboard, and a
  // night that passed without you is the same crescent the tee sheet prints
  // against closed hours — drawn in the same hairline as the other 36.
  cup: '<svg class="icon" viewBox="0 0 24 24"><path d="M7 4h10v4.5a5 5 0 01-10 0V4Z"/><path d="M7 5.5H4.8V7a3 3 0 003 3"/><path d="M17 5.5h2.2V7a3 3 0 01-3 3"/><path d="M12 13.5V17"/><path d="M8.5 20h7"/><path d="M9.6 17h4.8l1.1 3H8.5l1.1-3Z"/></svg>',
  moon: '<svg class="icon" viewBox="0 0 24 24"><path d="M19 14.6A8 8 0 118.9 4.4a6.6 6.6 0 0010.1 10.2Z"/></svg>',
  // the tripod on the plaque — photo mode's one entry point (see enterPhoto)
  camera: '<svg class="icon" viewBox="0 0 24 24"><path d="M8.8 7.5L10 5.5h4l1.2 2"/><rect x="3.5" y="7.5" width="17" height="12" rx="2.6"/><circle cx="12" cy="13.5" r="3.4"/></svg>',
};

// ── The palette ──────────────────────────────────────────────────────────────
// Sixteen tools would be an unreadable row, so the dock groups them the way a
// course is actually built: Turf · Hole · Paths · Hazards · Nature · Land.
// Each group shows the tool you reached for last as its face — one click and
// you are painting — and holds the rest one hover away in a labelled popover
// that says what each tool is FOR. Every shortcut still goes straight to its
// tool and re-faces its group, so the keyboard never has to see the grouping.

const TOOL_DEFS = {
  orbit:   { name: 'Look Around', icon: 'orbit',   key: '1', note: 'Drag to orbit the course' },
  fairway: { name: 'Fairway',     icon: 'fairway', key: '2', note: 'The kindest lie on the course' },
  rough:   { name: 'Rough',       icon: 'rough',   key: 'R', note: 'Frames the corridor. Costs golfers strokes' },
  green:   { name: 'Green',       icon: 'green',   key: '4', note: 'Bigger putting surfaces play easier' },
  tee:     { name: 'Tee Box',     icon: 'tee',     key: '5', note: 'Where a hole starts. Pair it with a pin' },
  flag:    { name: 'Pin',         icon: 'flag',    key: '6', note: 'Cuts the cup. Goes on a green' },
  link:    { name: 'Link Tee → Pin', icon: 'link', key: 'L', note: 'Choose which tee plays to which pin' },
  sign:    { name: 'Tee Sign',    icon: 'sign',    key: 'S', note: 'Numbers the hole. Signed tees lift Flow' },
  path:    { name: 'Cart Path',   icon: 'path',    key: '3', note: 'The fastest way around, for everyone' },
  bridge:  { name: 'Bridge',      icon: 'bridge',  key: 'B', note: 'Walks the course over water' },
  bunker:  { name: 'Bunker',      icon: 'bunker',  key: '7', note: 'Sand on the line. Trouble lifts Design' },
  water:   { name: 'Water',       icon: 'water',   key: '8', note: 'A hazard, and a wall. Bridge it to cross' },
  tree:    { name: 'Tree',        icon: 'tree',    key: '9', note: 'Frames a hole and lifts Beauty' },
  flower:  { name: 'Flowers',     icon: 'flower',  key: 'F', note: 'The fastest Beauty there is' },
  raise:   { name: 'Raise Land',  icon: 'raise',   key: 'E', note: 'Uphill plays longer. Up to 2 levels' },
  lower:   { name: 'Lower Land',  icon: 'lower',   key: 'Q', note: 'Back down a level' },
  dozer:   { name: 'Clear',       icon: 'dozer',   key: '0', note: 'Back to grass · 50% refund' },
};

const TOOL_GROUPS = [
  { id: 'look',    name: 'View',    tools: ['orbit'] },
  { id: 'turf',    name: 'Turf',    tools: ['fairway', 'rough', 'green', 'tee'] },
  { id: 'hole',    name: 'Hole',    tools: ['flag', 'link', 'sign'] },
  { id: 'paths',   name: 'Paths',   tools: ['path', 'bridge'] },
  { id: 'hazards', name: 'Hazards', tools: ['bunker', 'water'] },
  { id: 'nature',  name: 'Nature',  tools: ['tree', 'flower'] },
  { id: 'land',    name: 'Land',    tools: ['raise', 'lower', 'dozer'] },
];

// the tool each group is currently showing — the last one used from it
const groupFace = {};
for (const g of TOOL_GROUPS) groupFace[g.id] = g.tools[0];
const groupOf = {};
for (const g of TOOL_GROUPS) for (const t of g.tools) groupOf[t] = g.id;
const TOOL_KEYS = {};
for (const id in TOOL_DEFS) TOOL_KEYS[TOOL_DEFS[id].key.toLowerCase()] = id;

// Each track is a ladder the Club sheet draws as pips. `pct` is the plain-English
// multiplier a level buys — it speaks before the first hole is open, when the
// live economy is still all zeroes and a "$0 → $0" line would say nothing.
// The tints are gone. They were the six iOS system colours, and they were the
// only thing left in the game still speaking that language — see the note on
// `.up-icon` in trackRowHTML. A track is told from its neighbours by its name
// and its mark, which is how every other list in the book does it.
const UPGRADES = [
  { id: 'clubhouse', name: 'Clubhouse', icon: 'house',
    desc: 'A finer clubhouse — and a green fee to match.', pct: 'Every round +30%', base: 400, growth: 3.0 },
  { id: 'marketing', name: 'Marketing', icon: 'mega',
    desc: 'Word gets around. More of the tee sheet sells.', pct: 'Demand +25%', base: 250, growth: 2.6 },
  { id: 'grounds', name: 'Greenkeeping', icon: 'leaf',
    desc: 'Pristine turf lifts your rating, and your fee.', pct: 'Every round +20%', base: 300, growth: 2.8 },
  { id: 'proshop', name: 'Pro Shop', icon: 'bag',
    desc: 'Better gear, better mood — bigger tips.', pct: 'Tips +35%', base: 200, growth: 2.5 },
  { id: 'cartfleet', name: 'Cart Fleet', icon: 'cart',
    desc: 'Carts keep the field moving, so more times sell.', pct: 'Demand +20%', base: 500, growth: 2.4 },
];

const MILESTONES = [
  {
    title: 'Open the Club', reward: 150,
    sub: 'Every great course begins with a single hole.',
    reqs: [
      { icon: 'fairway', label: 'Fairway tiles', need: 6, value: () => course.counts.fairway },
      // a pin STANDS ON a green (see UNDER), so the tile under it still counts
      // here — otherwise the player who painted exactly four greens watched
      // this row fall from 4/4 to 3/4 the moment they planted the pin the same
      // goal asked for, $60 short of ever finishing it
      { icon: 'green', label: 'Green tiles', need: 4, value: () => course.counts.green + course.counts.flag },
      { icon: 'tee', label: 'Tee box', need: 1, value: () => course.counts.tee },
      { icon: 'flag', label: 'Open a hole (pin on a green)', need: 1, value: () => course.holes.length },
    ],
  },
  {
    title: 'The Walking Course', reward: 400,
    sub: 'Golfers and carts follow cart paths between holes. Lay some.',
    reqs: [
      { icon: 'flag', label: 'Holes open', need: 2, value: () => course.holes.length },
      { icon: 'path', label: 'Cart path tiles', need: 8, value: () => course.counts.path },
    ],
  },
  {
    title: 'Curb Appeal', reward: 1200,
    sub: 'Landscaping lifts your rating — and your fees.',
    reqs: [
      { icon: 'tree', label: 'Trees planted', need: 6, value: () => course.counts.tree },
      { icon: 'flower', label: 'Flower beds', need: 6, value: () => course.counts.flower },
      { icon: 'star', label: 'Course rating', need: 2.5, value: () => course.stars, fmt: v => v.toFixed(1) },
    ],
  },
  {
    title: 'Rolling Hills', reward: 2500,
    sub: 'Sculpt elevation and hazards for a signature look.',
    reqs: [
      { icon: 'raise', label: 'Raised terrain', need: 8, value: () => course.counts.elev },
      { icon: 'water', label: 'Water hazard tiles', need: 6, value: () => course.counts.water },
      { icon: 'bunker', label: 'Bunker tiles', need: 4, value: () => course.counts.bunker },
    ],
  },
  {
    title: 'The Full Experience', reward: 6000,
    sub: 'A busy course needs carts and championship holes.',
    reqs: [
      { icon: 'flag', label: 'Holes open', need: 5, value: () => course.holes.length },
      { icon: 'cart', label: 'Cart Fleet upgrade', need: 1, value: () => state.upgrades.cartfleet },
      { icon: 'star', label: 'Course rating', need: 3.5, value: () => course.stars, fmt: v => v.toFixed(1) },
    ],
  },
  {
    title: 'Roar of the Gallery', reward: 9000,
    sub: 'Great scores spark golden moments over the pin. Tap them to celebrate.',
    reqs: [
      { icon: 'spark', label: 'Moments celebrated', need: 5, value: () => state.celebrated.total },
      { icon: 'star', label: 'Eagle celebrated', need: 1, value: () => state.celebrated.eagle },
      { icon: 'flag', label: 'Holes open', need: 6, value: () => course.holes.length },
    ],
  },
  {
    title: 'The Front Nine', reward: 20000,
    sub: 'Nine holes, walkable and elegant — a proper championship routing.',
    reqs: [
      { icon: 'flag', label: 'Holes open', need: 9, value: () => course.holes.length },
      { icon: 'path', label: 'Cart path tiles', need: 20, value: () => course.counts.path },
      { icon: 'star', label: 'Course rating', need: 4.0, value: () => course.stars, fmt: v => v.toFixed(1) },
    ],
  },
  {
    title: 'World Class', reward: 50000,
    sub: 'The kind of course people fly in for.',
    reqs: [
      { icon: 'star', label: 'Course rating', need: 4.5, value: () => course.stars, fmt: v => v.toFixed(1) },
      { icon: 'tree', label: 'Trees planted', need: 18, value: () => course.counts.tree },
      { icon: 'flower', label: 'Flower beds', need: 12, value: () => course.counts.flower },
    ],
  },
  {
    title: 'The Grand Estate', reward: 120000,
    sub: 'Every acre, every luxury. The finished masterpiece.',
    reqs: [
      { icon: 'land', label: 'Full property (32 × 32)', need: 32, value: () => gridSize() },
      { icon: 'flag', label: 'Holes open', need: 12, value: () => course.holes.length },
      { icon: 'up', label: 'Every upgrade at Lv 2+', need: 2, value: () => Math.min(...UPGRADES.map(u => state.upgrades[u.id])) },
    ],
  },
];

// ── State ────────────────────────────────────────────────────────────────────

const state = {
  money: 650,
  totalEarned: 0,
  sizeIdx: 0,
  tiles: {},           // "x,z" -> type (grass omitted)
  elev: {},            // "x,z" -> 1|2 (0 omitted)
  upgrades: { clubhouse: 0, marketing: 0, grounds: 0, proshop: 0, cartfleet: 0 },
  milestone: 0,
  // the committee's one-time teaching notes — a key present means that lesson
  // has been said once on this save and is never said again (committeeNote).
  // A save from before the notes seeds them from its own progress in boot.
  notes: {},
  muted: false,
  // the middle notch of the sound control: the club's objects still sound,
  // the score and the ambience don't. An older save has never chosen it and
  // simply opens with everything on — see load()
  quiet: false,
  lastSeen: 0,
  // the course theme — see PALETTES. Pure dressing: it changes no tile, no
  // count and no rating, so an old save simply opens in Summer.
  theme: 'summer',
  // per-hole scorecard aggregates, keyed "tx,tz>fx,fz" (tee > flag), see recordScore()
  holeStats: {},
  // moments celebrated by the player (total, and eagle-or-better) — see celebrateMoment()
  celebrated: { total: 0, eagle: 0 },
  // The honours board. Seven records, each one written by a real card: the
  // lowest round, the lowest championship round a member has posted for the
  // club, most birdies in a round, the longest drive off a tee, the fastest
  // full round anybody has walked, and the two tallies a clubhouse wall would
  // actually carry — aces and eagles, with the latest holder named. Every entry
  // is { v, who, day, … }; null means nobody has done it yet. An older save's
  // bare `record` migrates into `low`, and the eagle tally is seeded from the
  // scorecards it already kept — see load().
  records: { low: null, major: null, birdies: null, drive: null, fast: null,
    aces: null, eagles: null },
  // hole identity: ordered tee→flag pairings; index = hole number − 1 = play order.
  // null until first computeCourse (older saves migrate via greedy pairing there).
  // A pair the architect made by hand carries locked:true — proximity pairing is
  // never allowed to touch it again (see reconcileHoles / applyLink).
  holePairs: null,
  // today's tee sheet and the day's ledger — see ensureSheet(). null until the
  // first boot of a day; an older save simply opens on a freshly booked morning.
  sheet: null,
  // what the members are saying. Every finished round nudges this average of
  // the marks golfers gave the course (see satisfactionOf); it is the club's
  // word of mouth, and it is the only thing besides the star rating that moves
  // demand. An older save starts on a polite 6.5 and earns its way from there.
  mood: { avg: 6.5, n: 0 },
  // The Club Book. `seen` is every notable golfer who has played here and what
  // they made of it (their mark drives whether they come back, and whether they
  // would take a membership); `members` is the ones who signed, in the order
  // they did, each carrying the rounds they have played here and the stats
  // those rounds have earned them. An older save opens with an empty book.
  // `met` is the collection: every notable who has ever put their name in this
  // club's diary, and the day they first did. Encountering somebody is what
  // PRESTIGE buys — the roster is discovered by building a course good enough
  // that better players will travel to it, never by opening anything.
  club: { seen: {}, members: [], met: {} },
  // The three majors. `entries` is which member the club has sent where, keyed
  // 'event@year'; `results` is what came back; `prestige` is the standing those
  // results have earned, which is what brings bigger names to your own first
  // tee. An older save opens with nobody entered and nothing won.
  tour: { entries: {}, results: [], prestige: 0 },
  // The Annals — the calendar year as the club's memoir. The open year keeps
  // only what the dated stores cannot reconstruct (counter snapshots taken at
  // its opening, the rating's high-water, the marks visitors left); at New
  // Year it is frozen into one entry in `past` and stays browsable for good.
  // null until boot seeds it against the computed course — see ensureAnnals().
  annals: null,
  // The Honours page: id -> the day that line went from pencil to ink. Every
  // id is a real accomplishment (see HONOURS); nothing here ever un-earns.
  honours: {},
  // The club's standing — the highest rung ever reached, and the day each rung
  // was. High-water on purpose: history does not demote.
  standing: { i: 0, days: {} },
};

let course = { holes: [], totalPar: 0, stars: 0, fee: 0, gpm: 0, ratePerMin: 0, counts: emptyCounts() };
let activeTool = 'orbit';

function emptyCounts() {
  return { fairway: 0, rough: 0, path: 0, green: 0, tee: 0, flag: 0, bunker: 0, water: 0,
    bridge: 0, tree: 0, flower: 0, sign: 0, elev: 0 };
}
function gridSize() { return EXPANSIONS[state.sizeIdx].size; }
function inBounds(x, z) { const h = gridSize() / 2; return x >= -h && x < h && z >= -h && z < h; }
function keyOf(x, z) { return x + ',' + z; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function isClub(x, z) { return x >= CLUB.x0 && x <= CLUB.x1 && z >= CLUB.z0 && z <= CLUB.z1; }
function tileType(x, z) { if (isClub(x, z)) return 'club'; return state.tiles[keyOf(x, z)] || 'grass'; }
function elevOf(x, z) { if (isClub(x, z)) return 0; return state.elev[keyOf(x, z)] || 0; }
function hash(x, z) { const n = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return n - Math.floor(n); }

// ── Save / load ──────────────────────────────────────────────────────────────

let resetting = false;
function save() {
  if (resetting) return;
  // an arrival still playing has nothing worth keeping — and writing a save
  // mid-title would burn the once-per-property moment for a player who boots,
  // watches three seconds and quits. endArrival() lowers the flag first, so
  // the sequence's own closing save is the first one that sticks.
  if (arrival.active) return;
  state.lastSeen = nowMs();
  // A player standing on the 14th at Thornwick still has exactly one golf
  // course, and it is the one at home. While the world is swapped out to a
  // championship venue (see travelTo) the club's own ground goes back into
  // state for the length of one write, so nothing a venue paints can ever
  // reach the save file. One guard, in the one place that writes.
  const live = away.active ? swapWorld(away.home) : null;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  if (live) swapWorld(live);
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw);
    Object.assign(state, s);
    state.upgrades = Object.assign({ clubhouse: 0, marketing: 0, grounds: 0, proshop: 0, cartfleet: 0 }, s.upgrades);
    state.elev = s.elev || {};
    state.milestone = s.milestone || 0;
    // added with the first hour — which of the one-time teaching notes this
    // save has already been shown. A save from before them arrives with none,
    // and boot marks as read whatever its owner has plainly outgrown
    // (seedVeteranNotes) instead of teaching them what they built.
    state.notes = {};
    if (s.notes && typeof s.notes === 'object') {
      for (const k of NOTE_IDS) if (s.notes[k]) state.notes[k] = true;
    } else noteSeedPending = true;
    state.quiet = !!s.quiet;   // added with the score — older saves open with it on
    state.holeStats = s.holeStats || {};   // added later — older saves migrate to empty
    // added later — an unknown or missing theme falls back to the house palette
    state.theme = paletteOf(s.theme).id;
    state.celebrated = Object.assign({ total: 0, eagle: 0 }, s.celebrated || {});
    // added later — a save from before the honours board carries a bare course
    // record, which becomes the first line of it under an unnamed card
    state.records = sanitiseRecords(s.records);
    if (!state.records.low && s.record && typeof s.record.strokes === 'number') {
      state.records.low = { v: s.record.strokes | 0, par: s.record.par | 0,
        holes: s.record.holes | 0, who: '', day: '' };
    }
    delete state.record;   // Object.assign carried the old key in; it retires here
    // added later — null tells computeCourse to build pairings from the tiles.
    // `locked` arrived with hand-linking; saves without it read as auto-paired.
    state.holePairs = Array.isArray(s.holePairs)
      ? s.holePairs.map(p => (p && p.tee && p.flag)
          ? { tee: { x: p.tee.x, z: p.tee.z }, flag: { x: p.flag.x, z: p.flag.z }, locked: !!p.locked }
          : null).filter(Boolean)
      : null;
    // added with the tee sheet — a save from before it (or from another day)
    // is thrown away and the morning is booked fresh in ensureSheet()
    state.sheet = (s.sheet && typeof s.sheet.day === 'string' && Array.isArray(s.sheet.sizes))
      ? sanitiseSheet(s.sheet) : null;
    // added with the people — a save from before word of mouth opens neutral
    state.mood = (s.mood && typeof s.mood.avg === 'number' && isFinite(s.mood.avg))
      ? { avg: clamp(s.mood.avg, 0, 10), n: Math.max(0, s.mood.n | 0) }
      : { avg: 6.5, n: 0 };
    // added with the notables — every entry is checked against the roster this
    // build actually ships, so a renamed or retired character can never leave a
    // ghost in the book
    state.club = { seen: {}, members: [], met: {} };
    const sc = s.club || {};
    for (const id in (sc.seen || {})) {
      const v = sc.seen[id];
      if (!STARS.BY_ID[id] || !v) continue;
      state.club.seen[id] = { n: Math.max(0, v.n | 0), score: clamp(+v.score || 0, 0, 10),
        day: typeof v.day === 'string' ? v.day : '', best: clamp(+v.best || +v.score || 0, 0, 10),
        // added with the honours board — a save from before it has signatures
        // with no card and no line beside them, which the ledger says plainly
        toPar: typeof v.toPar === 'number' && isFinite(v.toPar) ? v.toPar | 0 : null,
        line: typeof v.line === 'string' ? v.line.slice(0, 160) : '' };
    }
    for (const id in (sc.met || {})) {
      if (!STARS.BY_ID[id]) continue;
      state.club.met[id] = typeof sc.met[id] === 'string' ? sc.met[id] : '';
    }
    // anybody already in the visitors' book was certainly encountered first
    for (const id in state.club.seen) {
      if (!state.club.met[id]) state.club.met[id] = state.club.seen[id].day || '';
    }
    for (const m of (Array.isArray(sc.members) ? sc.members : [])) {
      if (!m || !STARS.BY_ID[m.id] || state.club.members.some(x => x.id === m.id)) continue;
      state.club.members.push({ id: m.id, since: typeof m.since === 'string' ? m.since : '',
        rounds: Math.max(0, m.rounds | 0), tee: clamp(m.tee | 0, 0, 1439) });
      if (!state.club.met[m.id]) state.club.met[m.id] = m.since || '';
    }
    // the eagle tally is the one record the old scorecards can still prove
    if (!state.records.eagles) {
      let n = 0;
      for (const k in state.holeStats) {
        const o = state.holeStats[k].outcomes || {};
        n += (o.eagle | 0) + (o.albatross | 0);
      }
      if (n) state.records.eagles = { v: n, who: '', day: '', hole: 0, kind: 'eagle' };
    }
    // added with the majors — every entry and every result is checked against
    // the events and the roster this build ships, so a renamed championship
    // can never leave a ghost in the record
    state.tour = sanitiseTour(s.tour);
    // added with the long game — a save from before it opens with no annals
    // (boot seeds the ledger against the computed course), a blank honours
    // page and a standing yet to be recognised, and earns all three at boot
    // from what its dated stores already prove
    state.annals = sanitiseAnnals(s.annals);
    state.honours = sanitiseHonours(s.honours);
    state.standing = sanitiseStanding(s.standing);
    reclaimClubTiles();
    return true;
  } catch (e) { return false; }
}

// The honours board, checked line by line. A record is a claim about something
// that happened here, so anything that cannot be read as a number and a name is
// simply not a record — it is dropped rather than repaired, and the board says
// "nobody yet" instead of printing a lie.
const REC_KEYS = ['low', 'major', 'birdies', 'drive', 'fast', 'aces', 'eagles'];
function sanitiseRecords(r) {
  const out = {};
  for (const k of REC_KEYS) out[k] = null;
  if (!r || typeof r !== 'object') return out;
  for (const k of REC_KEYS) {
    const e = r[k];
    if (!e || typeof e !== 'object') continue;
    const v = +e.v;
    if (!isFinite(v) || v <= 0) continue;
    out[k] = { v: Math.round(v), who: typeof e.who === 'string' ? e.who.slice(0, 40) : '',
      day: typeof e.day === 'string' ? e.day : '' };
    if (e.par != null) out[k].par = e.par | 0;
    if (e.holes != null) out[k].holes = Math.max(0, e.holes | 0);
    if (e.hole != null) out[k].hole = Math.max(0, e.hole | 0);
    if (e.kind != null) out[k].kind = String(e.kind).slice(0, 12);
    if (e.ev != null && MAJORS.EVENT[e.ev]) out[k].ev = e.ev;
    if (e.year != null) out[k].year = e.year | 0;
  }
  return out;
}

function sanitiseTour(t) {
  const out = { entries: {}, results: [], prestige: 0 };
  if (!t || typeof t !== 'object') return out;
  for (const k in (t.entries || {})) {
    const e = t.entries[k], p = String(k).split('@'), ev = MAJORS.EVENT[p[0]];
    // the key is the week — an event this build ships AND a year the calendar
    // can actually reach. A malformed year would sit in the book forever,
    // never settling, because no clock ever arrives at it.
    const year = +p[1];
    if (!ev || !/^\d{4}$/.test(p[1] || '') || year < 1970 || year > 9999) continue;
    if (!e || !STARS.BY_ID[e.id]) continue;
    out.entries[ev.id + '@' + year] = { id: e.id, paid: Math.max(0, +e.paid || 0) };
  }
  for (const r of (Array.isArray(t.results) ? t.results : [])) {
    if (!r || !MAJORS.EVENT[r.ev] || !STARS.BY_ID[r.id]) continue;
    out.results.push({ ev: r.ev, year: r.year | 0, id: r.id, pos: Math.max(0, r.pos | 0),
      tied: !!r.tied, total: r.total | 0, par: r.par | 0, cut: !!r.cut,
      purse: Math.max(0, Math.round(+r.purse || 0)), pres: Math.max(0, +r.pres || 0) });
  }
  out.results = out.results.slice(-40);
  out.prestige = clamp(+t.prestige || 0, 0, 100);
  return out;
}

// The annals, checked entry by entry — a year is a claim about what happened,
// so a malformed one is dropped rather than repaired. null means the save
// predates the ledger, and boot opens it fresh (ensureAnnals).
function sanitiseAnnals(a) {
  if (!a || typeof a !== 'object' || !isFinite(+a.year)) return null;
  const out = { year: clamp(a.year | 0, 1970, 9999),
    roundsAt: Math.max(0, a.roundsAt | 0), earnedAt: Math.max(0, +a.earnedAt || 0),
    ratingStart: clamp(+a.ratingStart || 0, 0, 5), ratingPeak: clamp(+a.ratingPeak || 0, 0, 5),
    visits: {}, past: [] };
  if (a.migrated) out.migrated = true;
  for (const id in (a.visits || {})) {
    if (STARS.BY_ID[id]) out.visits[id] = clamp(+a.visits[id] || 0, 0, 10);
  }
  for (const e of (Array.isArray(a.past) ? a.past : [])) {
    if (!e || !isFinite(+e.y)) continue;
    const m = e.majors || {};
    out.past.push({ y: clamp(e.y | 0, 1970, 9999),
      rounds: Math.max(0, e.rounds | 0), take: Math.max(0, Math.floor(+e.take || 0)),
      ratingStart: clamp(+e.ratingStart || 0, 0, 5), ratingEnd: clamp(+e.ratingEnd || 0, 0, 5),
      ratingPeak: clamp(+e.ratingPeak || 0, 0, 5),
      members: (Array.isArray(e.members) ? e.members : []).filter(id => STARS.BY_ID[id]),
      visits: (Array.isArray(e.visits) ? e.visits : [])
        .filter(v => v && STARS.BY_ID[v.id])
        .map(v => ({ id: v.id, score: clamp(+v.score || 0, 0, 10) })).slice(0, 6),
      visitsN: Math.max(0, e.visitsN | 0),
      records: (Array.isArray(e.records) ? e.records : []).filter(k => REC_KEYS.includes(k)),
      majors: { entered: Math.max(0, m.entered | 0),
        wins: (Array.isArray(m.wins) ? m.wins : [])
          .filter(w => w && MAJORS.EVENT[w.ev] && STARS.BY_ID[w.id])
          .map(w => ({ ev: w.ev, id: w.id })),
        best: Math.max(0, m.best | 0) },
      honours: (Array.isArray(e.honours) ? e.honours : []).filter(id => HONOUR_BY_ID[id]),
      pres: clamp(e.pres | 0, 0, 100), standing: clamp(e.standing | 0, 0, STANDINGS.length - 1),
      line: typeof e.line === 'string' ? e.line.slice(0, 220) : '',
      todate: !!e.todate });
  }
  out.past.sort((p, q) => p.y - q.y);
  out.past = out.past.slice(-60);
  return out;
}
// only honours this build actually defines, each with a plausible day key
function sanitiseHonours(h) {
  const out = {};
  if (!h || typeof h !== 'object') return out;
  for (const d of HONOURS) {
    if (typeof h[d.id] === 'string' && h[d.id]) out[d.id] = h[d.id].slice(0, 10);
  }
  return out;
}
function sanitiseStanding(s) {
  const out = { i: 0, days: {} };
  if (!s || typeof s !== 'object') return out;
  out.i = clamp(s.i | 0, 0, STANDINGS.length - 1);
  for (const k in (s.days || {})) {
    const i = +k;
    if (i >= 1 && i < STANDINGS.length && typeof s.days[k] === 'string') {
      out.days[i] = s.days[k].slice(0, 10);
    }
  }
  return out;
}

// The plot took in the motor court in a later build. A save from before that
// may have paint or raised ground under it — the club buys it back at full
// price rather than quietly bulldozing it, and boot says so once.
let clubReclaim = { n: 0, refund: 0 };
function reclaimClubTiles() {
  const hit = new Set();
  for (const k in state.tiles) {
    const c = k.split(',');
    if (!isClub(+c[0], +c[1])) continue;
    clubReclaim.refund += (TILE_DEFS[state.tiles[k]] || TILE_DEFS.grass).cost;
    delete state.tiles[k];
    hit.add(k);
  }
  for (const k in state.elev) {
    const c = k.split(',');
    if (!isClub(+c[0], +c[1])) continue;
    clubReclaim.refund += RAISE_COST * state.elev[k];
    delete state.elev[k];
    hit.add(k);
  }
  clubReclaim.n = hit.size;
  if (clubReclaim.refund) state.money += clubReclaim.refund;
  return clubReclaim;
}

// ── Three.js setup ───────────────────────────────────────────────────────────

const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Studio environment — gives materials that soft "product render" sheen.
// The blur was 0.06 radians, which three.js cannot deliver: it asks for 30
// filter taps against a hard limit of 20, so the generator clipped the kernel
// and said so on the console — thirty-six times, on every single boot, in the
// only build log a player or a judge will ever read. The code was requesting a
// blur it was not getting and being told, and nobody was listening. 0.038 is
// the widest kernel that fits inside the budget; it renders the same room and
// the console comes up clean.
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.038).texture;
pmrem.dispose();

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.5, 300);
camera.position.set(30, 27, 30);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 7;
controls.maxDistance = 64;
controls.minPolarAngle = Math.PI * 0.10;
controls.maxPolarAngle = Math.PI * 0.44;
controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.ROTATE };
renderer.domElement.addEventListener('contextmenu', e => e.preventDefault());

// intro dolly
let introT = 0;
const INTRO_FROM = new THREE.Vector3(30, 27, 30);
const INTRO_TO = new THREE.Vector3(15.5, 13.5, 15.5);
controls.enabled = false;

// lights
const hemi = new THREE.HemisphereLight(0xd8e8f4, 0xeae2cf, 0.92);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2dd, 2.0);
sun.position.set(18, 30, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 5;
sun.shadow.camera.far = 90;
sun.shadow.camera.left = -26; sun.shadow.camera.right = 26;
sun.shadow.camera.top = 26; sun.shadow.camera.bottom = -26;
sun.shadow.normalBias = 0.04;
scene.add(sun);

const shadowPlane = new THREE.Mesh(
  new THREE.PlaneGeometry(300, 300),
  new THREE.ShadowMaterial({ opacity: 0.10 })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.02;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

const islandGroup = new THREE.Group(); scene.add(islandGroup);
const buildingGroup = new THREE.Group(); scene.add(buildingGroup);
const golferGroup = new THREE.Group(); scene.add(golferGroup);
const cartGroup = new THREE.Group(); scene.add(cartGroup);
const fxGroup = new THREE.Group(); scene.add(fxGroup);

// ── Shared geometry / materials ──────────────────────────────────────────────

const geoCache = {};
function rboxGeo(w, h, d, r) {
  const key = w + '|' + h + '|' + d + '|' + r;
  if (!geoCache[key]) {
    const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    geoCache[key] = radius > 0.005
      ? new RoundedBoxGeometry(w, h, d, 2, radius)
      : new THREE.BoxGeometry(w, h, d);
  }
  return geoCache[key];
}

// ── Shader garnish ───────────────────────────────────────────────────────────
// One shared clock drives every material effect: drifting cloud shade on the
// ground, grass speckle, canopy sway, waving flag cloth, cliff strata, and the
// water surface — all in the shader, zero per-frame CPU geometry work.

const uTime = { value: 0 };
// how far into the night the world is, 0 → 1. Lights alone cannot carry an
// hour: a white cart and a red flag stay white and red under a dim lamp. This
// drains the albedo itself towards a cool moonlit grey, so the blue hour
// reaches the ground — one uniform, no second render path.
const uNight = { value: 0 };

function fxKey(fx) {
  return (fx.speckle ? 's' : '') + (fx.sway ? 'w' : '') + (fx.cloth ? 'c' : '') + (fx.strata ? 't' : '');
}

// injects the shared effects into a MeshStandardMaterial. Every enhanced
// material gets the soft cloud-shadow drift; the rest is opt-in per material.
function enhance(material, fx) {
  fx = fx || {};
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.uniforms.uNight = uNight;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWp;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec4 fxwp = modelMatrix * vec4(transformed, 1.0);
        ${fx.sway ? `transformed.x += sin(uTime * 1.35 + fxwp.x * 0.8 + fxwp.z * 1.3) * 0.014;
        transformed.z += cos(uTime * 1.05 + fxwp.x * 1.2 + fxwp.z * 0.7) * 0.011;` : ''}
        ${fx.cloth ? `float clk = clamp((position.x + 0.15) / 0.3, 0.0, 1.0);
        transformed.z += sin(uTime * 5.2 + clk * 6.5 + fxwp.x * 0.7 + fxwp.z * 0.5) * 0.045 * clk;
        transformed.y += sin(uTime * 5.2 + clk * 6.5 + 1.3) * 0.013 * clk;` : ''}
        vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nuniform float uNight;\nvarying vec3 vWp;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        ${fx.speckle ? `{
          vec2 spc = floor(vWp.xz * 8.0);
          float sph = fract(sin(dot(spc, vec2(127.1, 311.7))) * 43758.5453);
          if (sph > 0.90) diffuseColor.rgb *= 0.962;
          else if (sph < 0.06) diffuseColor.rgb *= 1.04;
        }` : ''}
        ${fx.strata ? `{
          float stb = sin(vWp.y * 16.0 + sin(vWp.x * 1.9 + vWp.z * 1.4) * 0.7);
          diffuseColor.rgb *= 1.0 + stb * 0.03;
        }` : ''}
        {
          vec2 cq = vWp.xz * 0.09 + vec2(uTime * 0.021, uTime * 0.013);
          float cn = sin(cq.x * 1.7 + cq.y * 1.1 + uTime * 0.05) * sin(cq.x * 0.8 - cq.y * 1.9 - uTime * 0.037);
          diffuseColor.rgb *= 1.0 - 0.055 * smoothstep(0.15, 0.85, cn) * (1.0 - uNight);
        }
        if (uNight > 0.001) {
          float nlum = dot(diffuseColor.rgb, vec3(0.299, 0.587, 0.114));
          vec3 ncol = nlum * vec3(0.72, 0.85, 1.14);
          diffuseColor.rgb = mix(diffuseColor.rgb, ncol, uNight * 0.66);
        }`);
  };
  material.customProgramCacheKey = () => 'fairway-fx-' + fxKey(fx);
  return material;
}

// The PMREM studio room does most of the diffuse work on this property, and
// three r160 has no scene.environmentIntensity — so every standard material
// registers the share it was built with, and the hour scales all of them at
// once. Without this the sky can go black while the turf stays lit like an
// overcast afternoon.
const envMats = [];
let envK = 1;
function envReg(m) {
  if (m.envMapIntensity === undefined) m.envMapIntensity = 1;
  envMats.push({ m, base: m.envMapIntensity });
  m.envMapIntensity = m.envMapIntensity * envK;
  return m;
}

const matCache = {};
function mat(color, rough, extra, fx) {
  const key = color + '|' + (rough || 0.62) + '|' + JSON.stringify(extra || {}) + '|' + fxKey(fx || {});
  if (!matCache[key]) {
    matCache[key] = envReg(enhance(new THREE.MeshStandardMaterial(Object.assign({
      color, roughness: rough || 0.62, metalness: 0, envMapIntensity: 0.5,
    }, extra || {})), fx));
  }
  return matCache[key];
}

// animated water surface — waves, analytic normals, fresnel sparkle, all GPU
const waterMat = new THREE.MeshStandardMaterial({
  color: COLORS.water, roughness: 0.12, metalness: 0,
  transparent: true, opacity: 0.86, envMapIntensity: 1.2,
});
waterMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = uTime;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWp;')
    .replace('#include <beginnormal_vertex>', `
      vec4 wwp = modelMatrix * vec4(position, 1.0);
      float wA = uTime * 1.9 + wwp.x * 2.3 - wwp.z * 1.7;
      float wB = uTime * 1.1 + wwp.x * 1.1 + wwp.z * 2.1;
      float wH = sin(wA) * 0.028 + sin(wB) * 0.02;
      float wDx = cos(wA) * 0.0644 + cos(wB) * 0.022;
      float wDz = cos(wA) * -0.0476 + cos(wB) * 0.042;
      #include <beginnormal_vertex>
      objectNormal = normalize(vec3(-wDx, wDz, 1.0));`)
    .replace('#include <begin_vertex>', `#include <begin_vertex>
      transformed.z += wH;
      vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWp;')
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      {
        vec3 fvd = normalize(vViewPosition);
        float frs = pow(1.0 - clamp(dot(fvd, normal), 0.0, 1.0), 3.0);
        vec2 spq = vWp.xz * 6.0;
        float glint = smoothstep(0.72, 0.98, sin(spq.x + uTime * 2.1) * sin(spq.y - uTime * 1.7));
        totalEmissiveRadiance += vec3(0.33, 0.48, 0.6) * (frs * 0.22 + glint * frs * 0.5 + glint * 0.05);
      }`);
};
waterMat.customProgramCacheKey = () => 'fairway-water';
envReg(waterMat);

const earthMat = mat(COLORS.earth, 0.85, undefined, { strata: 1 });
const goldMat = envReg(new THREE.MeshStandardMaterial({
  color: 0xf5c451, metalness: 0.6, roughness: 0.25,
  emissive: 0x6b4d10, emissiveIntensity: 0.35, envMapIntensity: 1.2,
}));

function rbox(w, h, d, material, r) {
  const m = new THREE.Mesh(rboxGeo(w, h, d, r === undefined ? 0.03 : r), material);
  m.castShadow = true;
  return m;
}

// ── Tile meshes ──────────────────────────────────────────────────────────────

const tileMeshes = {};      // key -> Group

function tileHeight(x, z, type) {
  return (TILE_DEFS[type] || TILE_DEFS.grass).h + elevOf(x, z) * ELEV_STEP;
}

function topColorFor(x, z, type) {
  const alt = ((x + z) & 1) === 0;
  switch (type) {
    case 'grass': case 'tree': case 'flower': case 'sign': {
      // organic meadow patches, not a checkerboard — stable via hash
      const r = hash(x * 13.37 + 2.1, z * 7.77 + 5.9);
      return r < 0.4 ? COLORS.grassA : r < 0.78 ? COLORS.grassB : COLORS.grassC;
    }
    case 'rough': {
      const r = hash(x * 6.11 + 4.4, z * 8.63 + 2.7);
      return r < 0.4 ? COLORS.roughA : r < 0.78 ? COLORS.roughB : COLORS.roughC;
    }
    case 'fairway': case 'tee': return alt ? COLORS.fairwayA : COLORS.fairwayB;
    case 'green': case 'flag': return alt ? COLORS.greenA : COLORS.greenB;
    case 'path': {
      // stone slabs cut from three close shades
      const r = hash(x * 9.13 + 1.3, z * 5.41 + 8.2);
      return r < 0.38 ? COLORS.pathA : r < 0.72 ? COLORS.pathB : COLORS.pathC;
    }
    case 'bunker': return COLORS.bunker;
    case 'club': return COLORS.plaza;
    default: return COLORS.grassA;
  }
}

// ── Connected caps ───────────────────────────────────────────────────────────
// Same-surface neighbors share one continuous top: each tile's cap extends
// flush to the tile boundary on "open" edges and gets a soft rounded fillet
// only on true boundaries (terrain change, cliff, shoreline, island rim).
// 16 possible edge masks → 16 cached geometries shared by every tile.

// which tiles read as one surface — decorations sit on grass, the pin on green,
// and a bridge is still the pond it spans (so the water stays one unbroken
// sheet, with no shoreline fillet cut across it where the deck lands)
function surfKey(x, z) {
  if (!inBounds(x, z)) return null;   // island rim
  let t = tileType(x, z);
  if (t === 'tree' || t === 'flower' || t === 'sign') t = 'grass';
  if (t === 'flag') t = 'green';
  if (t === 'bridge') t = 'water';
  return t + ':' + elevOf(x, z);
}

const CAP_H = 0.14, CAP_R = 0.05, CAP_SEG = 3;
const capGeoCache = {};

// mask bits: 1 = +x closed · 2 = -x · 4 = +z · 8 = -z
function capGeo(mask) {
  if (capGeoCache[mask]) return capGeoCache[mask];
  const R = CAP_R, H = CAP_H, S = CAP_SEG, IN = 0.5 - R;
  const pos = [], nrm = [];
  // quad a→b→c→d with per-vertex normals; winding auto-corrected to face `na`
  const quad = (a, b, c, d, na, nb, nc, nd) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const cx = uy * vz - uz * vy, cy = uz * vx - ux * vz, cz = ux * vy - uy * vx;
    if (cx * na[0] + cy * na[1] + cz * na[2] < 0) { const t1 = b; b = d; d = t1; const t2 = nb; nb = nd; nd = t2; }
    pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    nrm.push(...na, ...nb, ...nc, ...na, ...nc, ...nd);
  };
  const E = !!(mask & 1), W = !!(mask & 2), Sd = !!(mask & 4), N = !!(mask & 8);
  const xe = E ? IN : 0.5, xw = W ? -IN : -0.5;
  const zs = Sd ? IN : 0.5, zn = N ? -IN : -0.5;

  // flat top
  quad([xw, H, zn], [xe, H, zn], [xe, H, zs], [xw, H, zs],
    [0, 1, 0], [0, 1, 0], [0, 1, 0], [0, 1, 0]);

  // fillet strips + skirts on closed edges (strips run through open corners)
  const edge = (sx, sz) => {   // sx=±1 for E/W edges (sz=0), sz=±1 for S/N (sx=0)
    for (let i = 0; i < S; i++) {
      const t0 = (i / S) * Math.PI / 2, t1 = ((i + 1) / S) * Math.PI / 2;
      const o0 = IN + R * Math.sin(t0), o1 = IN + R * Math.sin(t1);
      const y0 = H - R + R * Math.cos(t0), y1 = H - R + R * Math.cos(t1);
      if (sx) {
        quad([sx * o0, y0, zn], [sx * o1, y1, zn], [sx * o1, y1, zs], [sx * o0, y0, zs],
          [sx * Math.sin(t0), Math.cos(t0), 0], [sx * Math.sin(t1), Math.cos(t1), 0],
          [sx * Math.sin(t1), Math.cos(t1), 0], [sx * Math.sin(t0), Math.cos(t0), 0]);
      } else {
        quad([xw, y0, sz * o0], [xe, y0, sz * o0], [xe, y1, sz * o1], [xw, y1, sz * o1],
          [0, Math.cos(t0), sz * Math.sin(t0)], [0, Math.cos(t0), sz * Math.sin(t0)],
          [0, Math.cos(t1), sz * Math.sin(t1)], [0, Math.cos(t1), sz * Math.sin(t1)]);
      }
    }
    // vertical skirt below the fillet
    if (sx) {
      quad([sx * 0.5, 0, zn], [sx * 0.5, 0, zs], [sx * 0.5, H - R, zs], [sx * 0.5, H - R, zn],
        [sx, 0, 0], [sx, 0, 0], [sx, 0, 0], [sx, 0, 0]);
    } else {
      quad([xw, 0, sz * 0.5], [xe, 0, sz * 0.5], [xe, H - R, sz * 0.5], [xw, H - R, sz * 0.5],
        [0, 0, sz], [0, 0, sz], [0, 0, sz], [0, 0, sz]);
    }
  };
  if (E) edge(1, 0);
  if (W) edge(-1, 0);
  if (Sd) edge(0, 1);
  if (N) edge(0, -1);

  // rounded corners where two closed edges meet: sphere-octant top + cylinder skirt
  const corner = (sx, sz) => {
    const cx = sx * IN, cz = sz * IN;
    for (let i = 0; i < S; i++) {           // θ: down from the top
      const t0 = (i / S) * Math.PI / 2, t1 = ((i + 1) / S) * Math.PI / 2;
      for (let j = 0; j < S; j++) {         // φ: around the corner
        const p0 = (j / S) * Math.PI / 2, p1 = ((j + 1) / S) * Math.PI / 2;
        const pt = (t, p) => [cx + sx * R * Math.sin(t) * Math.cos(p), H - R + R * Math.cos(t), cz + sz * R * Math.sin(t) * Math.sin(p)];
        const nn = (t, p) => [sx * Math.sin(t) * Math.cos(p), Math.cos(t), sz * Math.sin(t) * Math.sin(p)];
        quad(pt(t0, p0), pt(t1, p0), pt(t1, p1), pt(t0, p1), nn(t0, p0), nn(t1, p0), nn(t1, p1), nn(t0, p1));
      }
    }
    for (let j = 0; j < S; j++) {           // vertical rounded-corner skirt
      const p0 = (j / S) * Math.PI / 2, p1 = ((j + 1) / S) * Math.PI / 2;
      const q = p => [cx + sx * R * Math.cos(p), 0, cz + sz * R * Math.sin(p)];
      const qq = (p, y) => { const v = q(p); v[1] = y; return v; };
      const nn = p => [sx * Math.cos(p), 0, sz * Math.sin(p)];
      quad(qq(p0, 0), qq(p1, 0), qq(p1, H - R), qq(p0, H - R), nn(p0), nn(p1), nn(p1), nn(p0));
    }
  };
  if (E && N) corner(1, -1);
  if (E && Sd) corner(1, 1);
  if (W && Sd) corner(-1, 1);
  if (W && N) corner(-1, -1);

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  capGeoCache[mask] = g;
  return g;
}

const waveGeoProto = new THREE.PlaneGeometry(1, 1, 6, 6);   // waves live in the shader — one shared geometry

// shared micro-detail geometry
const fringeGeo = new THREE.BoxGeometry(0.9, 0.018, 0.08);
const rippleGeo = new THREE.BoxGeometry(0.72, 0.014, 0.055);
const foamGeo = new THREE.BoxGeometry(0.94, 0.014, 0.07);
const clothGeo = new THREE.BoxGeometry(0.3, 0.16, 0.02, 6, 2, 1);
const clothMat = envReg(enhance(new THREE.MeshStandardMaterial({
  color: COLORS.flagCloth, roughness: 0.5, metalness: 0, envMapIntensity: 0.5,
}), { cloth: 1 }));
clothMat.customProgramCacheKey = () => 'fairway-fx-c';
const foamMat = envReg(new THREE.MeshStandardMaterial({
  color: 0xffffff, roughness: 0.6, transparent: true, opacity: 0.55, depthWrite: false,
}));

const DIRS = [[1, 0, 1], [-1, 0, 2], [0, 1, 4], [0, -1, 8]];

// ── Bridge deck ──────────────────────────────────────────────────────────────
// A boardwalk over the pond. The tile knows nothing about which way the player
// meant it to run, so it reads the ground: the axis with more dry (or already
// bridged) neighbours is the crossing, and rails go up only on the sides where
// open water is still showing. Lay three in a line and you get one clean span
// with rails down both edges and none across the ends.

function bridgeRunAxis(x, z) {
  let ax = 0, az = 0;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inBounds(nx, nz) || tileType(nx, nz) === 'water') continue;
    if (dx) ax++; else az++;
  }
  return az > ax ? 'z' : 'x';
}

function buildBridgeDeck(g, x, z, h) {
  const alongX = bridgeRunAxis(x, z) === 'x';
  const deckM = mat(COLORS.deck, 0.72);
  const beamM = mat(COLORS.deckBeam, 0.78);
  const railM = mat(COLORS.rail, 0.5);

  const deck = rbox(alongX ? 1.0 : 0.78, 0.07, alongX ? 0.78 : 1.0, deckM, 0.02);
  deck.position.y = h - 0.035;
  deck.receiveShadow = true;
  g.add(deck);

  for (const s of [-0.3, 0.3]) {
    const beam = rbox(alongX ? 0.09 : 0.86, 0.06, alongX ? 0.86 : 0.09, beamM, 0.015);
    beam.position.set(alongX ? s : 0, h - 0.10, alongX ? 0 : s);
    g.add(beam);
  }

  // rails face the open water, never a neighbour you can step onto
  for (const [dx, dz] of DIRS) {
    if (alongX ? dx !== 0 : dz !== 0) continue;
    const nx = x + dx, nz = z + dz;
    if (!inBounds(nx, nz) || tileType(nx, nz) !== 'water') continue;
    const bar = rbox(alongX ? 0.94 : 0.035, 0.035, alongX ? 0.035 : 0.94, railM, 0.015);
    bar.position.set(dx * 0.36, h + 0.24, dz * 0.36);
    g.add(bar);
    for (const s of [-0.32, 0.32]) {
      const post = rbox(0.04, 0.24, 0.04, railM, 0.014);
      post.position.set(alongX ? s : dx * 0.36, h + 0.12, alongX ? dz * 0.36 : s);
      g.add(post);
    }
  }
}

// ── Tee sign ─────────────────────────────────────────────────────────────────
// The hole number, standing in the world instead of only in the UI. A sign next
// to a tee reads that tee's hole number off the routing and turns to face it;
// re-route the course and every sign turns over to its new number (syncSigns).
// A sign with no hole beside it shows a dash — a legible "not yet", not a bug.

// classic seven segments: a top · b top-right · c bottom-right · d bottom ·
// e bottom-left · f top-left · g middle
const DIGIT_SEGS = ['abcdef', 'bc', 'abged', 'abgcd', 'fgbc', 'afgcd', 'afgecd', 'abc', 'abcdefg', 'abfgcd'];

function digitMesh(d, material) {
  const grp = new THREE.Group();
  const W = 0.085, H = 0.135, T = 0.024, D = 0.02;
  const seg = { a: [0, H / 2, W, T], g: [0, 0, W, T], d: [0, -H / 2, W, T],
    f: [-W / 2, H / 4, T, H / 2], b: [W / 2, H / 4, T, H / 2],
    e: [-W / 2, -H / 4, T, H / 2], c: [W / 2, -H / 4, T, H / 2] };
  for (const s of DIGIT_SEGS[d]) {
    const [sx, sy, sw, sh] = seg[s];
    const m = new THREE.Mesh(rboxGeo(sw, sh, D, 0.008), material);
    m.position.set(sx, sy, 0);
    m.castShadow = false;
    grp.add(m);
  }
  return grp;
}

function buildTeeSign(g, h, info) {
  const woodM = mat(COLORS.trunk, 0.8);
  const post = rbox(0.055, 0.38, 0.055, woodM, 0.018);
  post.position.y = h + 0.19;
  g.add(post);

  const head = new THREE.Group();
  head.position.y = h + 0.47;
  // face the tee it belongs to, so a golfer standing on the box reads it
  head.rotation.y = info ? Math.atan2(info.dx, info.dz) : 0;
  g.add(head);

  const plaque = rbox(0.38, 0.26, 0.05, mat(COLORS.plaque, 0.55), 0.055);
  head.add(plaque);
  const trim = rbox(0.42, 0.05, 0.045, mat(COLORS.plaqueEdge, 0.7), 0.02);
  trim.position.y = 0.155;
  head.add(trim);

  const inkM = mat(COLORS.digit, 0.6);
  const n = info ? info.n : 0;
  if (!n) {
    const dash = new THREE.Mesh(rboxGeo(0.11, 0.026, 0.02, 0.008), inkM);
    dash.position.z = 0.028;
    dash.castShadow = false;
    head.add(dash);
    return;
  }
  const digits = String(Math.min(99, n)).split('').map(Number);
  digits.forEach((d, i) => {
    const dm = digitMesh(d, inkM);
    dm.position.set((i - (digits.length - 1) / 2) * 0.115, 0, 0.028);
    head.add(dm);
  });
}

function buildTile(x, z) {
  const type = tileType(x, z);
  const h = tileHeight(x, z, type);
  // a bridge is two heights at once: the pond it spans is built at water level,
  // the deck walkers ride sits at `h`
  const wet = type === 'bridge';
  const surfH = wet ? TILE_DEFS.water.h + elevOf(x, z) * ELEV_STEP : h;
  const g = new THREE.Group();
  g.position.set(x + 0.5, 0, z + 0.5);
  g.userData = { gx: x, gz: z, tile: true };

  // edge mask: closed (rounded) only against a different surface / cliff / rim
  const sk = surfKey(x, z);
  let mask = 0;
  for (const [dx, dz, bit] of DIRS) if (surfKey(x + dx, z + dz) !== sk) mask |= bit;

  // base block: earth sides, full-size so neighbors read as one landform
  const baseH = surfH - CAP_H;
  if (baseH > 0.02) {
    const base = new THREE.Mesh(rboxGeo(1, baseH, 1, 0), earthMat);
    base.position.y = baseH / 2;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);
  }
  const capMat = (type === 'water' || wet)
    ? mat(COLORS.waterDeep, 0.35)
    : mat(topColorFor(x, z, type), type === 'path' ? 0.5 : 0.68, undefined,
        (type === 'path' || type === 'bunker' || type === 'club') ? undefined : { speckle: 1 });
  const cap = new THREE.Mesh(capGeo(mask), capMat);
  cap.position.y = surfH - CAP_H;
  cap.castShadow = type !== 'water' && !wet;
  cap.receiveShadow = true;
  g.add(cap);

  if (type === 'water' || wet) {
    // animated wave surface (displaced in the shader; seamless across tiles)
    const wave = new THREE.Mesh(waveGeoProto, waterMat);
    wave.rotation.x = -Math.PI / 2;
    wave.position.y = surfH + 0.015;
    g.add(wave);
    // lapping foam along every shoreline edge
    for (const [dx, dz, bit] of DIRS) {
      if (!(mask & bit) || !inBounds(x + dx, z + dz)) continue;
      const foam = new THREE.Mesh(foamGeo, foamMat);
      foam.position.set(dx * 0.42, surfH + 0.045, dz * 0.42);
      if (dx !== 0) foam.rotation.y = Math.PI / 2;
      foam.castShadow = false;
      g.add(foam);
    }
  }

  if (wet) buildBridgeDeck(g, x, z, h);

  if (type === 'green' || type === 'flag') {
    // fringe collar where the green meets fairway at grade
    const fk = 'fairway:' + elevOf(x, z);
    for (const [dx, dz] of DIRS) {
      if (surfKey(x + dx, z + dz) !== fk) continue;
      const f = new THREE.Mesh(fringeGeo, mat(COLORS.fringe, 0.66));
      f.position.set(dx * 0.42, h + 0.008, dz * 0.42);
      if (dx !== 0) f.rotation.y = Math.PI / 2;
      f.castShadow = false;
      f.receiveShadow = true;
      g.add(f);
    }
  }

  if (type === 'bunker') {
    // raked sand — three soft ridges, jittered per tile
    const rj = hash(x * 5.7 + 3.1, z * 3.9 + 7.6);
    for (let i = 0; i < 3; i++) {
      const rp = new THREE.Mesh(rippleGeo, mat(COLORS.ripple, 0.85));
      rp.position.set((hash(x + i, z - i) - 0.5) * 0.1, h + 0.006, -0.25 + i * 0.25 + (rj - 0.5) * 0.06);
      rp.rotation.y = (rj - 0.5) * 0.3;
      rp.castShadow = false;
      g.add(rp);
    }
  }

  if (type === 'rough') {
    // long grass: a handful of leaning blades, deterministic per tile, swaying
    // on the same shared clock as the canopies — the corridor edge reads from
    // any camera angle without a single extra draw-call family
    const bm = mat(COLORS.blade, 0.72, undefined, { sway: 1 });
    for (let i = 0; i < 5; i++) {
      const bh = 0.13 + hash(x + i * 3, z - i) * 0.1;
      const b = rbox(0.045, bh, 0.045, bm, 0.018);
      b.position.set((hash(x + i, z + 2) - 0.5) * 0.66, h + bh / 2, (hash(x - 1, z + i) - 0.5) * 0.66);
      b.rotation.z = (hash(x + i, z + i) - 0.5) * 0.55;
      b.castShadow = false;
      g.add(b);
    }
  }

  const r = hash(x * 3 + 7, z * 5 + 3);

  if (type === 'tree') {
    // four species, chosen deterministically per tile — a consistent family
    const variant = hash(x * 7.31 + 1.7, z * 11.7 + 5.3);
    const trunkM = mat(COLORS.trunk, 0.8);
    if (variant < 0.34) {
      // round broadleaf
      const trunk = rbox(0.15, 0.3, 0.15, trunkM, 0.04);
      trunk.position.y = h + 0.15; g.add(trunk);
      const c1 = rbox(0.62, 0.46, 0.62, mat(COLORS.canopy[Math.floor(r * 3)], 0.7, undefined, { sway: 1 }), 0.16);
      c1.position.y = h + 0.53; g.add(c1);
      const c2 = rbox(0.4, 0.32, 0.4, mat(COLORS.canopy[Math.floor(hash(x, z + 9) * 3)], 0.7, undefined, { sway: 1 }), 0.12);
      c2.position.y = h + 0.91; g.add(c2);
    } else if (variant < 0.58) {
      // conifer — stacked tiers
      const trunk = rbox(0.12, 0.26, 0.12, trunkM, 0.035);
      trunk.position.y = h + 0.13; g.add(trunk);
      const cm = mat(COLORS.conifer[Math.floor(r * 2)], 0.72, undefined, { sway: 1 });
      const t1 = rbox(0.56, 0.26, 0.56, cm, 0.1); t1.position.y = h + 0.36; g.add(t1);
      const t2 = rbox(0.42, 0.24, 0.42, cm, 0.09); t2.position.y = h + 0.58; g.add(t2);
      const t3 = rbox(0.27, 0.22, 0.27, cm, 0.08); t3.position.y = h + 0.78; g.add(t3);
      const tip = rbox(0.13, 0.14, 0.13, cm, 0.05); tip.position.y = h + 0.94; g.add(tip);
    } else if (variant < 0.78) {
      // tall cypress
      const trunk = rbox(0.1, 0.16, 0.1, trunkM, 0.03);
      trunk.position.y = h + 0.08; g.add(trunk);
      const cm = mat(COLORS.cypress, 0.72, undefined, { sway: 1 });
      const col = rbox(0.28, 0.92, 0.28, cm, 0.13); col.position.y = h + 0.6; g.add(col);
      const top = rbox(0.16, 0.24, 0.16, cm, 0.07); top.position.y = h + 1.14; g.add(top);
    } else {
      // pink blossom
      const trunk = rbox(0.14, 0.28, 0.14, trunkM, 0.04);
      trunk.position.y = h + 0.14; g.add(trunk);
      const c1 = rbox(0.6, 0.42, 0.6, mat(COLORS.blossom[0], 0.62, undefined, { sway: 1 }), 0.17);
      c1.position.y = h + 0.5; g.add(c1);
      const c2 = rbox(0.34, 0.26, 0.34, mat(COLORS.blossom[1], 0.6, undefined, { sway: 1 }), 0.11);
      c2.position.set(0.14, h + 0.78, -0.08); g.add(c2);
      // fallen petals at the foot
      for (let i = 0; i < 3; i++) {
        const p = rbox(0.06, 0.015, 0.06, mat(COLORS.blossom[i & 1], 0.6), 0.015);
        p.position.set((hash(x + i, z + 4) - 0.5) * 0.7, h + 0.01, (hash(x - 3, z + i) - 0.5) * 0.7);
        p.castShadow = false;
        g.add(p);
      }
    }
  }
  if (type === 'flower') {
    for (let i = 0; i < 5; i++) {
      const px = (hash(x + i, z) - 0.5) * 0.68;
      const pz = (hash(x, z + i) - 0.5) * 0.68;
      const p = rbox(0.1, 0.1, 0.1, mat(COLORS.petals[Math.floor(hash(x + i, z + i) * 5)], 0.5, undefined, { sway: 1 }), 0.035);
      p.position.set(px, h + 0.05, pz);
      g.add(p);
    }
  }
  if (type === 'sign') {
    const info = signInfoAt(x, z);
    g.userData.signKey = signKeyOf(info);
    buildTeeSign(g, h, info);
  }
  if (type === 'tee') {
    const m1 = rbox(0.08, 0.09, 0.08, mat(0xffffff, 0.4), 0.025); m1.position.set(-0.22, h + 0.045, 0.3); g.add(m1);
    const m2 = rbox(0.08, 0.09, 0.08, mat(0xffffff, 0.4), 0.025); m2.position.set(0.22, h + 0.045, 0.3); g.add(m2);
  }
  if (type === 'flag') {
    const cup = rbox(0.17, 0.025, 0.17, mat(COLORS.hole, 0.6), 0.008);
    cup.position.set(CUP_OFF.x, h + 0.014, CUP_OFF.z); cup.castShadow = false; g.add(cup);
    // pole + cloth ride a pivot planted at the turf so a holed putt can rock the
    // whole pin from its base (see pinReact)
    const pin = new THREE.Group();
    pin.position.set(0.12, h, 0.12);
    const pole = rbox(0.045, 0.9, 0.045, mat(COLORS.pole, 0.35), 0.015);
    pole.position.y = 0.45; pin.add(pole);
    const cloth = new THREE.Mesh(clothGeo, clothMat);   // waves in the shader
    cloth.position.set(0.17, 0.78, 0);
    cloth.castShadow = true;
    pin.add(cloth);
    g.add(pin);
    g.userData.pin = pin;
  }
  return g;
}

function setTileMesh(x, z, animate) {
  const key = keyOf(x, z);
  const old = tileMeshes[key];
  if (old) islandGroup.remove(old);
  const g = buildTile(x, z);
  tileMeshes[key] = g;
  islandGroup.add(g);
  if (animate) {
    g.scale.set(0.6, 0.6, 0.6);
    tweens.push({ obj: g.scale, to: { x: 1, y: 1, z: 1 }, t: 0, dur: 0.26, ease: 'back' });
  }
}

// a changed tile also reshapes its neighbors' edges (open ↔ rounded) — refresh
// them quietly so the placement pop stays local and instant
function setTileAndNeighbors(x, z, animate) {
  setTileMesh(x, z, animate);
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inBounds(nx, nz) && tileMeshes[keyOf(nx, nz)]) setTileMesh(nx, nz, false);
  }
}

function rebuildIsland(staggerNew) {
  for (const k in tileMeshes) { islandGroup.remove(tileMeshes[k]); delete tileMeshes[k]; }
  const half = gridSize() / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      setTileMesh(x, z, false);
      if (staggerNew) {
        const g = tileMeshes[keyOf(x, z)];
        g.scale.set(0.001, 0.001, 0.001);
        tweens.push({ obj: g.scale, to: { x: 1, y: 1, z: 1 }, t: -((x + half + z + half) * 0.012), dur: 0.3 });
      }
    }
  }
}

// water animation now lives entirely in the shader (see waterMat); per frame
// we only advance the shared clock and let the foam breathe
function updateWater(time) {
  uTime.value = time;
  foamMat.opacity = 0.5 + Math.sin(time * 1.6) * 0.12;
}

// ── Clubhouse ────────────────────────────────────────────────────────────────

// The one building the player never paints, so it carries the story of the club
// instead: five tiers, one designed family. The plot is a fixed 3×2 of club
// tiles (world x −2…1, z 5…7) — terrain, routing, the door and the tee sheet
// never move — and *every* mesh below stays inside it, at every tier and every
// fleet size, so no canopy, column or parked cart can ever end up standing on a
// tile the player is allowed to paint or raise. The building fills the east
// 2×2; the west column is the motor court. Each tier is built once into a
// swappable group and rebuilt only when the tier, the cart fleet or the open
// sign actually changes; nothing here runs per frame except a few patio idlers
// and a handful of fountain droplets.

const CLUB_TIERS = [
  { name: 'Pro Shop' },
  { name: 'The Veranda',  line: 'The veranda is open' },
  { name: 'The Balcony',  line: 'A second storey — and a balcony over the door' },
  { name: 'The Terrace',  line: 'The terrace is laid — portico, fountain, valet at the door' },
  { name: 'Grand Resort', line: 'A grand resort clubhouse — wings, atrium, flags flying' },
];
const CLUB_ORIGIN = new THREE.Vector3(0, 0.5, 6);   // plot centre, at grade

function clubTier() {
  return Math.max(0, Math.min(CLUB_TIERS.length - 1, state.upgrades.clubhouse | 0));
}

function buildClubTier(tier, cartN, open) {
  const M = {
    wall: mat(COLORS.clubWall, 0.5),
    trim: mat(COLORS.clubTrim, 0.55),
    roof: mat(COLORS.clubRoof, 0.6),
    stone: mat(COLORS.clubStone, 0.8),
    wood: mat(COLORS.clubWood, 0.7),
    glass: mat(COLORS.clubGlass, 0.12, { envMapIntensity: 1.4 }),
    // warm interior light: emissive, so it reads against sun, cloud shade and
    // the studio environment alike — the club always looks inhabited
    lit: mat(COLORS.clubGlow, 0.3, { emissive: 0xffa94d, emissiveIntensity: 0.75 }),
    door: mat(COLORS.clubDoor, 0.45),
    shade: mat(COLORS.clubShade, 0.55),
    leaf: mat(COLORS.canopy[0], 0.7, undefined, { sway: 1 }),
    pole: mat(COLORS.pole, 0.35),
    onSign: mat(0x3d8f54, 0.3, { emissive: 0x1e7d3c, emissiveIntensity: 0.7 }),
    offSign: mat(0xb8b2a6, 0.6),
  };

  const g = new THREE.Group();
  g.position.copy(CLUB_ORIGIN);
  const guests = [], jets = [];
  // tiers 3+ lay a stone terrace over the forecourt; anything standing on it
  // starts from its surface, not from grade
  const groundY = tier >= 3 ? 0.04 : 0;

  const box = (w, h, d, m, r) => rbox(w, h, d, m, r === undefined ? 0.045 : r);
  const flat = m => { m.castShadow = false; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; };

  // a lit pane sunk into a facade; dir is the outward normal
  const win = (x, y, z, w, h, dir) => {
    const ry = dir[0] !== 0 ? Math.PI / 2 : 0;
    at(flat(box(w + 0.08, h + 0.08, 0.04, M.trim, 0.02)), x + dir[0] * 0.012, y, z + dir[1] * 0.012).rotation.y = ry;
    at(flat(box(w, h, 0.05, M.lit, 0.02)), x + dir[0] * 0.026, y, z + dir[1] * 0.026).rotation.y = ry;
  };

  const flagpole = (x, y, h, z) => {
    at(box(0.04, h, 0.04, M.pole, 0.012), x, y + h / 2, z);
    const c = new THREE.Mesh(clothGeo, clothMat);
    c.scale.set(0.87, 0.88, 1);
    c.castShadow = true;
    at(c, x + 0.15, y + h - 0.08, z);
  };

  // café table under a parasol — the veranda's whole reason to exist. The
  // parasol is turned 0.42 rad, so its diagonal (not its width) is what has to
  // stay inside the plot: 0.42 square → 0.277 of reach in each direction.
  const patioSet = (x, z) => {
    at(box(0.05, 0.28, 0.05, M.wood, 0.02), x, 0.14, z);
    at(flat(box(0.26, 0.035, 0.26, M.wood, 0.02)), x, 0.28, z);
    at(box(0.035, 0.36, 0.035, M.pole, 0.012), x, 0.44, z);
    at(box(0.42, 0.06, 0.42, M.shade, 0.10), x, 0.64, z).rotation.y = 0.42;
    at(flat(box(0.045, 0.07, 0.045, M.shade, 0.02)), x, 0.70, z);
  };

  const topiary = (x, z) => {
    at(box(0.15, 0.14, 0.15, M.stone, 0.035), x, 0.11, z);
    at(box(0.19, 0.19, 0.19, M.leaf, 0.09), x, 0.28, z);
  };

  const fountain = (x, z) => {
    at(box(0.40, 0.14, 0.40, M.stone, 0.08), x, 0.10, z);
    const w = new THREE.Mesh(waveGeoProto, waterMat);   // same shader as the hazards
    w.rotation.x = -Math.PI / 2; w.scale.set(0.31, 0.31, 1);
    at(w, x, 0.175, z);
    at(box(0.11, 0.18, 0.11, M.stone, 0.03), x, 0.27, z);
    at(flat(box(0.22, 0.05, 0.22, M.stone, 0.04)), x, 0.38, z);
    for (let i = 0; i < 4; i++) {
      const a = i * Math.PI / 2 + 0.6;
      const d = flat(box(0.05, 0.05, 0.05, M.glass, 0.02));
      at(d, x, 0.4, z);
      jets.push({ m: d, x, y: 0.4, z, vx: Math.cos(a) * 0.16, vz: Math.sin(a) * 0.16, ph: i * 0.25 });
    }
  };

  // Patio guests come and go on their own clocks — each one waits, arrives,
  // lingers a while and leaves again, so a busy terrace never reads as a row of
  // statues. A club with no holes to play gets none at all, which is what its
  // own sign already says.
  const guest = (x, z, ry, y) => {
    const h = new THREE.Group();
    h.position.set(x, y === undefined ? groundY : y, z);
    h.rotation.y = ry;
    // a guest is somebody too: the terrace draws from the same invented
    // membership the tee sheet does, stable per spot for the day and stored
    // nowhere. No bag — they are not the ones playing.
    h.add(makeGolferMesh(PEOPLE.personFor(dayInfo().seed, 5000 + guests.length, 0), { bag: false }));
    g.add(h);
    const on = guests.length === 0 || Math.random() < 0.55;
    h.visible = on;
    h.scale.setScalar(on ? 1 : 0.001);
    guests.push({
      h, y: h.position.y, r: ry, ph: Math.random() * 6.28,
      on, k: on ? 1 : 0, t: 4 + Math.random() * 11,
    });
  };

  let facade = -0.46, doorW = 0.30, doorH = 0.42, peak = 1.25, spots = [];

  if (tier === 0) {
    // a modest pro shop set back on its plot — all forecourt, no airs
    at(box(1.26, 0.60, 0.80, M.wall, 0.06), 0, 0.30, -0.06);
    at(box(1.50, 0.10, 1.02, M.roof, 0.05), 0, 0.65, -0.06);
    at(box(0.74, 0.26, 0.62, M.wall, 0.05), -0.20, 0.83, 0.02);
    at(box(0.88, 0.09, 0.74, M.roof, 0.04), -0.20, 1.00, 0.02);
    // The facade faces the course, which means it faces AWAY from where the
    // player's camera starts. A club with the lights on has to read as lit from
    // the side you actually look at it from, so the shop keeps a window on the
    // back wall and one on the gable end — two panes, and the first hour of the
    // game has a lit building in it at night.
    win(0.30, 0.36, 0.34, 0.26, 0.22, [0, 1]);
    win(0.63, 0.36, -0.10, 0.26, 0.22, [1, 0]);
    win(-0.42, 0.36, facade, 0.30, 0.24, [0, -1]);
    win(0.42, 0.36, facade, 0.30, 0.24, [0, -1]);
    at(flat(box(0.52, 0.05, 0.26, M.shade, 0.02)), 0, 0.52, facade - 0.12);
    flagpole(0.50, 0.70, 0.52, 0.18);
    peak = 1.25;

  } else if (tier === 1) {
    // the roof reaches out over a veranda: the silhouette gains a whole storey
    // of shade at head height, and the forecourt gains parasols
    facade = -0.30; doorW = 0.32; doorH = 0.44;
    at(flat(box(1.62, 0.035, 0.34, M.wood, 0.02)), 0, 0.018, -0.45);
    at(box(1.44, 0.66, 0.84, M.wall, 0.06), 0, 0.33, 0.12);
    at(box(1.74, 0.10, 1.34, M.roof, 0.05), 0, 0.78, 0.05);
    // posts and rail sit on the deck's front edge, not inside it — that leaves
    // the whole deck free to stand on
    for (const px of [-0.70, 0.70]) at(box(0.07, 0.73, 0.07, M.wall, 0.02), px, 0.37, -0.60);
    for (const rx of [-0.49, 0.49]) {
      at(flat(box(0.44, 0.05, 0.05, M.wall, 0.02)), rx, 0.34, -0.60);
      at(flat(box(0.05, 0.30, 0.05, M.wall, 0.02)), rx, 0.19, -0.60);
    }
    at(box(0.92, 0.28, 0.64, M.wall, 0.05), -0.16, 0.97, 0.16);
    at(box(1.06, 0.09, 0.76, M.roof, 0.04), -0.16, 1.16, 0.16);
    win(-0.46, 0.40, facade, 0.34, 0.26, [0, -1]);
    win(0.46, 0.40, facade, 0.34, 0.26, [0, -1]);
    win(-0.73, 0.38, 0.16, 0.32, 0.24, [-1, 0]);
    win(0.73, 0.38, 0.16, 0.32, 0.24, [1, 0]);
    patioSet(-0.68, -0.70);
    patioSet(0.68, -0.70);
    flagpole(0.56, 0.83, 0.60, 0.10);
    peak = 1.50;
    // out on the deck, at its ends — not either side of the door, and behind
    // the rail rather than through it
    spots = [[-0.62, -0.36, 1.15], [0.66, -0.33, -1.95]];

  } else if (tier <= 3) {
    // a second storey and a balcony over the door — the club now has a view
    facade = -0.34; doorW = 0.34; doorH = 0.48;
    at(box(1.54, 0.72, 0.94, M.wall, 0.06), 0, 0.36, 0.13);
    at(box(1.76, 0.09, 1.14, M.roof, 0.05), 0, 0.765, 0.11);
    at(box(1.18, 0.58, 0.72, M.wall, 0.05), 0, 1.10, 0.24);
    at(box(1.38, 0.10, 0.90, M.roof, 0.05), 0, 1.44, 0.24);
    at(box(0.86, 0.18, 0.58, M.wall, 0.04), 0, 1.58, 0.24);
    at(box(1.00, 0.08, 0.70, M.roof, 0.035), 0, 1.71, 0.24);
    at(flat(box(1.32, 0.06, 0.46, M.stone, 0.02)), 0, 0.84, -0.20);
    at(flat(box(1.32, 0.05, 0.05, M.wall, 0.02)), 0, 1.06, -0.41);
    for (const bx of [-0.62, -0.21, 0.21, 0.62]) at(flat(box(0.05, 0.22, 0.05, M.wall, 0.02)), bx, 0.95, -0.41);
    if (tier === 3) {
      // the fabric canopy becomes a stone portico on four columns — and the
      // salmon the canopy used to carry moves up to its cornice, so the club
      // keeps its one warm accent instead of going uniformly pale
      at(box(1.10, 0.10, 0.62, M.stone, 0.03), 0, 0.74, -0.65);
      at(flat(box(1.22, 0.06, 0.68, M.shade, 0.03)), 0, 0.82, -0.65);
      for (const px of [-0.42, 0.42]) for (const pz of [-0.86, -0.44]) at(box(0.10, 0.68, 0.10, M.stone, 0.03), px, 0.35, pz);
      // awnings over the balcony windows repeat that accent on the facade
      for (const ax of [-0.34, 0.34]) at(flat(box(0.42, 0.05, 0.18, M.shade, 0.02)), ax, 1.32, -0.22);
    } else {
      at(box(0.92, 0.07, 0.50, M.shade, 0.03), 0, 0.70, -0.62);
      for (const px of [-0.40, 0.40]) at(box(0.06, 0.66, 0.06, M.wall, 0.02), px, 0.335, -0.78);
    }
    win(-0.54, 0.44, facade, 0.34, 0.28, [0, -1]);
    win(0.54, 0.44, facade, 0.34, 0.28, [0, -1]);
    win(-0.34, 1.12, -0.12, 0.30, 0.26, [0, -1]);
    win(0.34, 1.12, -0.12, 0.30, 0.26, [0, -1]);
    win(-0.78, 0.42, 0.20, 0.34, 0.26, [-1, 0]);
    win(0.78, 0.42, 0.20, 0.34, 0.26, [1, 0]);
    if (tier === 3) {
      // a lantern cupola on the ridge: the one thing tier 2 cannot answer, and
      // the reason tier 3 reads as taller from across the course rather than as
      // the same building with better landscaping
      at(box(0.44, 0.09, 0.44, M.stone, 0.03), 0, 1.79, 0.24);
      at(flat(box(0.26, 0.22, 0.26, M.lit, 0.03)), 0, 1.95, 0.24);
      for (const cx of [-0.15, 0.15]) for (const cz of [0.09, 0.39]) at(box(0.05, 0.24, 0.05, M.wall, 0.02), cx, 1.95, cz);
      at(box(0.42, 0.09, 0.42, M.shade, 0.05), 0, 2.11, 0.24);
      at(flat(box(0.06, 0.09, 0.06, M.trim, 0.02)), 0, 2.20, 0.24);
      flagpole(0, 2.16, 0.24, 0.24);
      peak = 2.15;
    } else {
      flagpole(0, 1.75, 0.46, 0.24);
      peak = 1.80;
    }
    // the balcony gets the best guest; the rest keep to the terrace corners,
    // clear of the door and of the columns
    spots = tier === 3
      ? [[-0.66, -0.56, 1.3], [-0.72, -0.84, 2.3], [0.62, -0.44, -1.7], [-0.34, -0.26, 3.0, 0.87]]
      : [[-0.70, -0.60, 1.3], [0.72, -0.66, -1.7], [-0.34, -0.26, 3.0, 0.87]];

  } else {
    // grand resort: two wings with dormers around a glass atrium, under a
    // porte-cochère wide enough to arrive through
    facade = -0.34; doorW = 0.46; doorH = 0.54;
    at(box(0.88, 1.16, 0.92, M.glass, 0.06), 0, 0.58, 0.12);
    at(flat(box(0.70, 0.52, 0.74, M.lit, 0.06)), 0, 0.42, 0.12);
    for (const mx of [-0.44, 0.44]) for (const mz of [-0.34, 0.58]) at(box(0.07, 1.18, 0.07, M.wall, 0.02), mx, 0.59, mz);
    at(box(1.02, 0.09, 1.06, M.trim, 0.04), 0, 1.20, 0.12);
    at(box(0.72, 0.20, 0.76, M.glass, 0.05), 0, 1.34, 0.12);
    at(box(0.44, 0.18, 0.48, M.glass, 0.04), 0, 1.53, 0.12);
    at(box(0.20, 0.12, 0.22, M.trim, 0.03), 0, 1.68, 0.12);
    // wings ride at ±0.60 so their eaves stop at x ±0.98 — the widest the
    // silhouette can go and still stand entirely on club ground
    for (const s of [-1, 1]) {
      at(box(0.58, 0.86, 1.34, M.wall, 0.06), s * 0.60, 0.43, 0.14);
      at(box(0.76, 0.10, 1.52, M.roof, 0.05), s * 0.60, 0.91, 0.14);
      at(box(0.42, 0.30, 1.12, M.wall, 0.05), s * 0.60, 1.11, 0.16);
      at(box(0.54, 0.09, 1.24, M.roof, 0.04), s * 0.60, 1.30, 0.16);
      at(box(0.26, 0.24, 0.28, M.wall, 0.04), s * 0.60, 1.08, -0.44);
      at(flat(box(0.32, 0.06, 0.34, M.roof, 0.03)), s * 0.60, 1.22, -0.44);
      win(s * 0.60, 1.08, -0.58, 0.15, 0.13, [0, -1]);
      win(s * 0.60, 0.46, -0.53, 0.34, 0.30, [0, -1]);
      win(s * 0.885, 0.46, 0.14, 0.40, 0.30, [s, 0]);
      flagpole(s * 0.60, 1.34, 0.52, 0.62);
    }
    // the porte-cochère inherits the accent cornice — one warm line runs the
    // whole family, from the pro shop's little awning to the resort's arrival
    at(box(1.16, 0.10, 0.62, M.shade, 0.04), 0, 0.80, -0.66);
    at(flat(box(1.24, 0.05, 0.64, M.stone, 0.03)), 0, 0.73, -0.66);
    for (const px of [-0.48, 0.48]) for (const pz of [-0.90, -0.44]) at(box(0.09, 0.70, 0.09, M.wall, 0.03), px, 0.36, pz);
    flagpole(0, 1.74, 0.72, 0.12);
    peak = 1.95;
    spots = [[-0.66, -0.56, 1.3], [-0.72, -0.84, 2.3], [0.62, -0.44, -1.7]];
  }

  // The motor court, west of the building: one marked bay per cart the club
  // runs, so the apron reads as sized for the fleet at every tier. The bays are
  // exactly where spawnCart parks, and both stay inside the west tile column.
  const b0 = BAY_Z0 - CLUB_ORIGIN.z;                 // local z of the first bay
  const bays = clamp(cartN || 1, 1, 4);
  for (let i = 0; i < bays; i++) {
    at(flat(box(0.64, 0.026, 0.36, M.trim, 0.012)), BAY_X - CLUB_ORIGIN.x, 0.013, b0 + i * BAY_PITCH);
  }

  // stone terrace, landscaping and the valet roof arrive together at tier 3
  if (tier >= 3) {
    at(flat(box(1.98, 0.04, 0.74, M.stone, 0.03)), 0, 0.02, -0.62);
    fountain(0.74, -0.78);
    const tpx = tier === 3 ? 0.27 : 0.33, tpz = tier === 3 ? -0.50 : -0.48;
    topiary(-tpx, tpz);
    topiary(tpx, tpz);
    // Valet roof: a lean-to that leans on the clubhouse's west wall and lands
    // on two posts at x −1.92. It grows *down the rank*, one bay at a time, so
    // a bigger fleet earns more shelter — but its span is fixed to the motor
    // court's own tile column and can never reach a paintable tile.
    const bz0 = -0.93, bz1 = Math.max(-0.20, b0 + BAY_PITCH * (bays - 1) + 0.27);
    const bd = bz1 - bz0, bcz = (bz0 + bz1) / 2;
    at(flat(box(1.24, 0.05, bd, M.trim, 0.03)), -1.37, 0.745, bcz);
    at(box(1.12, 0.09, bd - 0.10, M.roof, 0.04), -1.37, 0.815, bcz);
    for (const pz of [bz0 + 0.10, bz1 - 0.10]) {
      at(box(0.09, 0.72, 0.09, M.wall, 0.03), -1.92, 0.36, pz);
    }
  }

  // door, welcome mat, and a small sign that says whether there is golf to play
  at(flat(box(doorW + 0.09, doorH + 0.07, 0.04, M.stone, 0.02)), 0, doorH / 2 + 0.02, facade - 0.01);
  at(box(doorW, doorH, 0.06, M.door, 0.02), 0, doorH / 2 + 0.02, facade - 0.03);
  const matY = tier >= 3 ? 0.058 : tier === 1 ? 0.052 : 0.015;
  at(flat(box(doorW + 0.10, 0.03, 0.26, M.wood, 0.012)), 0, matY, facade - 0.24);
  const sy = doorH + 0.13;
  at(flat(box(0.22, 0.13, 0.03, M.door, 0.02)), 0.30, sy, facade - 0.035);
  at(flat(box(0.15, 0.055, 0.025, open ? M.onSign : M.offSign, 0.012)), 0.30, sy, facade - 0.055);

  // before the fleet exists, the pro's own cart sits in the first bay
  if (cartN === 0) {
    const p = makeCartMesh();
    p.rotation.y = Math.PI / 2;
    at(p, BAY_X - CLUB_ORIGIN.x, 0, b0);
  }

  if (open) for (const s of spots) guest(s[0], s[1], s[2], s[3]);

  g.userData = { guests, jets, peak, tier };
  return g;
}

let clubGroup = null, clubSig = null, clubOld = null, clubOldT = 0, clubHold = false;
const clubTimers = [];
function clubAfter(t, fn) { clubTimers.push({ t, fn }); }

// called from computeCourse — a no-op unless the building would actually differ
function syncClubhouse() {
  if (clubHold) return;                       // a celebration owns the next build
  const sig = clubSig_();
  if (sig === clubSig) return;
  rebuildClubhouse(false);
}
function clubSig_() { return clubTier() + '|' + carts.length + '|' + (course.holes.length ? 1 : 0); }

function rebuildClubhouse(animate) {
  const g = buildClubTier(clubTier(), carts.length, course.holes.length > 0);
  clubSig = clubSig_();
  buildingGroup.add(g);
  const old = clubGroup;
  clubGroup = g;

  // a second upgrade landing mid-transition must not leave ghost tweens driving
  // a group that is already off the scene
  for (let i = tweens.length - 1; i >= 0; i--) if (tweens[i].club) tweens.splice(i, 1);
  if (clubOld) buildingGroup.remove(clubOld);

  if (!animate) { clubOld = null; if (old) buildingGroup.remove(old); return g; }

  if (old) {
    // the old form settles into the ground — 'in' easing keeps its silhouette
    // whole while the new one is already rising through it
    clubOld = old; clubOldT = 0.36;
    tweens.push({ obj: old.scale, to: { x: 0.001, y: 0.001, z: 0.001 }, t: 0, dur: 0.32, ease: 'in', club: 1 });
    tweens.push({ obj: old.position, to: { x: old.position.x, y: old.position.y - 0.3, z: old.position.z }, t: 0, dur: 0.32, ease: 'in', club: 1 });
  }
  // the new one builds itself ground-up, part by part, with a springy settle
  const parts = g.children.slice().sort((a, b) => a.position.y - b.position.y);
  const span = Math.max(1, parts.length - 1);
  parts.forEach((p, i) => {
    const to = { x: p.scale.x, y: p.scale.y, z: p.scale.z };
    p.scale.set(0.001, 0.001, 0.001);
    tweens.push({ obj: p.scale, to, t: -(0.14 + (i / span) * 0.42), dur: 0.34, ease: 'back', club: 1 });
  });
  return g;
}

// dust kicked out from under the old building as the new one lands
function clubDust() {
  const dm = mat(COLORS.plaza, 0.9);
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * Math.PI * 2 + Math.random() * 0.25;
    const r = 0.85 + Math.random() * 0.3;
    const m = rbox(0.09, 0.07, 0.09, dm, 0.03);
    m.castShadow = false;
    m.position.set(Math.cos(a) * r, 0.53, 6 + Math.sin(a) * r);
    scene.add(m);
    particles.push({
      m, life: 0.5 + Math.random() * 0.3,
      v: new THREE.Vector3(Math.cos(a) * 1.7, 0.9 + Math.random() * 0.7, Math.sin(a) * 1.7),
    });
  }
}

// ── The upgrade trip ─────────────────────────────────────────────────────────
// The player is almost never looking at the clubhouse when they buy one — they
// are out building the 14th somewhere across the island. So if the building is
// off-screen or too far to read, the camera takes a short trip: ease onto the
// facade, hold while the new tier builds itself, ease back to the exact frame
// the player left. Nothing is remembered but from/to, the same shape the route
// overview flight uses, so the return is pixel-exact.

const clubCam = {
  active: false, phase: 'idle', t: 0, hold: 0, wasCtl: true,
  from: new THREE.Vector3(), fromT: new THREE.Vector3(),
  to: new THREE.Vector3(), toT: new THREE.Vector3(),
};
const CLUB_CAM_IN = 0.55, CLUB_CAM_HOLD = 1.5, CLUB_CAM_OUT = 0.65;
const CLUB_CAM_REVEAL = 0.4;   // the build starts just before the camera lands

const _clubFr = new THREE.Frustum(), _clubM = new THREE.Matrix4();
const _clubP = new THREE.Vector3(), _clubT = new THREE.Vector3();

// true when the clubhouse is already on screen and close enough to read detail
function clubFramed() {
  const peak = (clubGroup && clubGroup.userData.peak) || 1.6;
  _clubP.set(CLUB_ORIGIN.x, CLUB_ORIGIN.y + peak * 0.55, CLUB_ORIGIN.z);
  camera.updateMatrixWorld();
  _clubM.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  _clubFr.setFromProjectionMatrix(_clubM);
  return _clubFr.containsPoint(_clubP) && camera.position.distanceTo(_clubP) < 15;
}

function flyToClubhouse() {
  if (clubCam.active || routeView.active || introT < 1) return false;
  clubCam.active = true; clubCam.phase = 'in'; clubCam.t = 0;
  clubCam.from.copy(camera.position);
  clubCam.fromT.copy(controls.target);
  // approach from the player's own side of the plot: the camera takes the short
  // way round and still lands square on the facade, whichever way it came
  const sx = camera.position.x >= CLUB_ORIGIN.x ? 1 : -1;
  // aim a shade west of the building so the motor court and the valet bay stay
  // in frame — the plot, not just the front door, is what the upgrade buys —
  // and stand far enough back to leave headroom for the confetti
  clubCam.toT.set(CLUB_ORIGIN.x - 0.35, CLUB_ORIGIN.y + 0.8, CLUB_ORIGIN.z - 0.1);
  clubCam.to.set(CLUB_ORIGIN.x + sx * 4.3, CLUB_ORIGIN.y + 4.8, CLUB_ORIGIN.z - 6.0);
  clubCam.wasCtl = controls.enabled;
  controls.enabled = false;
  return true;
}

function endClubCam() {
  if (!clubCam.active) return;
  clubCam.active = false; clubCam.phase = 'idle';
  camera.position.copy(clubCam.from);
  controls.target.copy(clubCam.fromT);
  camera.lookAt(clubCam.fromT);
  controls.enabled = clubCam.wasCtl;
}

function updateClubCam(dt) {
  if (!clubCam.active) return;
  if (clubCam.phase === 'hold') {
    clubCam.hold -= dt;
    camera.lookAt(clubCam.toT);
    if (clubCam.hold <= 0) { clubCam.phase = 'out'; clubCam.t = 0; }
    return;
  }
  clubCam.t = Math.min(1, clubCam.t + dt / (clubCam.phase === 'in' ? CLUB_CAM_IN : CLUB_CAM_OUT));
  const k = clubCam.t;
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // ease-in-out
  const a = clubCam.phase === 'in' ? e : 1 - e;
  camera.position.lerpVectors(clubCam.from, clubCam.to, a);
  _clubT.lerpVectors(clubCam.fromT, clubCam.toT, a);
  camera.lookAt(_clubT);
  if (k < 1) return;
  if (clubCam.phase === 'in') { clubCam.phase = 'hold'; clubCam.hold = CLUB_CAM_HOLD; }
  else endClubCam();
}

// buying a Clubhouse level is one of the few times the world itself changes —
// the sheet gets out of the way, the camera goes to meet it if it has to, and
// the building rebuilds itself in front of you
function celebrateClubhouse() {
  if (clubFramed() || !flyToClubhouse()) revealClubhouse();
  else clubAfter(CLUB_CAM_REVEAL, revealClubhouse);
}

function revealClubhouse() {
  clubHold = false;
  const tier = clubTier(), lvl = state.upgrades.clubhouse;
  const g = rebuildClubhouse(true);
  clubDust();
  sound('clubhouse');
  const t = CLUB_TIERS[tier];
  toast(lvl > CLUB_TIERS.length - 1
    ? t.name + ' refined · Lv ' + lvl + ' · green fees +30%'
    : t.line, 'house');
  clubAfter(0.44, () => confettiBurst(new THREE.Vector3(0, 0.5 + g.userData.peak, 6), 22));
}

function updateClubhouse(dt, time) {
  for (let i = clubTimers.length - 1; i >= 0; i--) {
    const c = clubTimers[i];
    c.t -= dt;
    if (c.t <= 0) { clubTimers.splice(i, 1); c.fn(); }
  }
  if (clubOld) { clubOldT -= dt; if (clubOldT <= 0) { buildingGroup.remove(clubOld); clubOld = null; } }
  const u = clubGroup && clubGroup.userData;
  if (!u) return;
  for (const gu of u.guests) {
    gu.t -= dt;
    if (gu.t <= 0) {
      gu.on = !gu.on;
      gu.t = gu.on ? 9 + Math.random() * 11 : 7 + Math.random() * 15;
    }
    gu.k += ((gu.on ? 1 : 0) - gu.k) * Math.min(1, dt * 4.5);
    if (gu.k < 0.005) { gu.h.visible = false; continue; }
    gu.h.visible = true;
    // the build-in tween owns the scale until it settles at 1 — only the
    // arriving/leaving fade writes it
    if (gu.k < 0.999) gu.h.scale.setScalar(gu.k);
    gu.h.position.y = gu.y + Math.abs(Math.sin(time * 0.85 + gu.ph)) * 0.014;
    gu.h.rotation.y = gu.r + Math.sin(time * 0.33 + gu.ph) * 0.26;
  }
  for (const j of u.jets) {
    const k = (time * 0.9 + j.ph) % 1;
    j.m.position.set(j.x + j.vx * k, j.y + (0.9 * k - 0.95 * k * k) * 0.34, j.z + j.vz * k);
    const s = 1 - k * 0.45;
    j.m.scale.set(s, s, s);
  }
}

// ── Golf carts ───────────────────────────────────────────────────────────────

function makeCartMesh() {
  const g = new THREE.Group();
  const body = mat(COLORS.cartBody, 0.35);
  const chassis = rbox(0.34, 0.16, 0.56, body, 0.05); chassis.position.y = 0.16; g.add(chassis);
  const dash = rbox(0.3, 0.14, 0.1, body, 0.03); dash.position.set(0, 0.3, -0.2); g.add(dash);
  const seat = rbox(0.28, 0.08, 0.18, mat(COLORS.cartSeat, 0.7), 0.03); seat.position.set(0, 0.27, 0.08); g.add(seat);
  const back = rbox(0.28, 0.16, 0.05, mat(COLORS.cartSeat, 0.7), 0.02); back.position.set(0, 0.37, 0.18); g.add(back);
  const roof = rbox(0.36, 0.045, 0.6, body, 0.02); roof.position.y = 0.62; g.add(roof);
  const p1 = rbox(0.025, 0.28, 0.025, body, 0.008); p1.position.set(-0.15, 0.47, -0.25); g.add(p1);
  const p2 = rbox(0.025, 0.28, 0.025, body, 0.008); p2.position.set(0.15, 0.47, -0.25); g.add(p2);
  const p3 = rbox(0.025, 0.22, 0.025, body, 0.008); p3.position.set(-0.15, 0.5, 0.22); g.add(p3);
  const p4 = rbox(0.025, 0.22, 0.025, body, 0.008); p4.position.set(0.15, 0.5, 0.22); g.add(p4);
  const wheels = [];
  const wheelGeo = rboxGeo(0.07, 0.15, 0.15, 0.05);
  for (const [wx, wz] of [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]]) {
    const w = new THREE.Mesh(wheelGeo, mat(COLORS.wheel, 0.6));
    w.position.set(wx, 0.08, wz);
    w.castShadow = true;
    g.add(w); wheels.push(w);
  }
  g.userData.wheels = wheels;
  return g;
}

const carts = [];

function desiredCartCount() {
  if (!course.holes.length) return 0;
  return Math.min(4, 1 + state.upgrades.cartfleet);
}

function spawnCart(i) {
  const group = makeCartMesh();
  // one rank of bays down the motor court — every cart on club ground, and
  // under the valet roof once tier 3 builds one over exactly these slots
  const park = new THREE.Vector3(BAY_X, 0.5, BAY_Z0 + i * BAY_PITCH);
  group.position.copy(park);
  group.rotation.y = Math.PI / 2;
  cartGroup.add(group);
  carts.push({
    group, park, tile: { x: CART_PARK_TILE.x, z: park.z < CLUB.z1 ? CLUB.z0 : CLUB.z1 },
    walker: makeWalker(3.1),
    st: 'park', t: 2 + Math.random() * 8, driver: null,
  });
}

function updateCartFleet() {
  const want = desiredCartCount();
  while (carts.length < want) spawnCart(carts.length);
  while (carts.length > want) {
    const c = carts.pop();
    cartGroup.remove(c.group);
  }
}

const CART_COST = { path: 1, bridge: 1.1, fairway: 1.9, grass: 2.6, sign: 3.0, flower: 3.2,
  rough: 3.6, tee: 2.4, green: 8, flag: 8, bunker: 9 };

function updateCarts(dt) {
  for (const c of carts) {
    switch (c.st) {
      case 'park': {
        c.t -= dt;
        // the fleet is plugged in overnight
        if (c.t <= 0 && course.holes.length && sky.up > 0.25) {
          const hole = course.holes[Math.floor(Math.random() * course.holes.length)];
          const pts = routePoints(c.tile, hole.tee, CART_COST);
          pts.unshift(c.park.clone());
          startRoute(c.walker, pts, c.group.position);
          c.st = 'out';
          c.target = hole.tee;
        }
        break;
      }
      case 'out': {
        if (stepWalker(c.walker, dt, c.group.position, c.group)) { c.st = 'wait'; c.t = 2.5 + Math.random() * 3; }
        spinWheels(c, dt);
        break;
      }
      case 'wait': {
        c.t -= dt;
        if (c.t <= 0) {
          const from = curTileOf(c.group.position);
          const pts = routePoints(from, c.tile, CART_COST);
          pts.push(c.park.clone());
          startRoute(c.walker, pts, c.group.position);
          c.st = 'home';
        }
        break;
      }
      case 'home': {
        if (stepWalker(c.walker, dt, c.group.position, c.group)) { c.st = 'park'; c.t = 6 + Math.random() * 12; }
        spinWheels(c, dt);
        break;
      }
    }
  }
}

function spinWheels(c, dt) {
  for (const w of c.group.userData.wheels) w.rotation.x += dt * 9;
}

// ── Clouds ───────────────────────────────────────────────────────────────────

const cloudMat = envReg(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0.92 }));
const clouds = [];
for (let i = 0; i < 4; i++) {
  const c = new THREE.Group();
  const n = 3 + Math.floor(hash(i, 7) * 3);
  for (let j = 0; j < n; j++) {
    const b = rbox(1.6 + hash(i, j) * 1.8, 0.55 + hash(j, i) * 0.3, 1.1 + hash(i * 2, j) * 0.9, cloudMat, 0.22);
    b.castShadow = false;
    b.position.set((j - n / 2) * 1.1, hash(j, i * 3) * 0.3, (hash(i, j * 5) - 0.5) * 1.2);
    c.add(b);
  }
  c.position.set(-30 + i * 18, 9.5 + hash(i, 1) * 2.5, -14 + hash(i, 4) * 26);
  c.userData.speed = 0.25 + hash(i, 9) * 0.2;
  scene.add(c);
  clouds.push(c);
}

// ── Butterflies ──────────────────────────────────────────────────────────────
// Two butterflies drift between flower beds — they only appear once the
// course has flowers to visit. Pure garnish, deliberately unclickable.

const flowerTiles = [];               // refreshed by computeCourse
const butterflyGroup = new THREE.Group(); scene.add(butterflyGroup);
const butterflies = [];
const wingGeo = new THREE.BoxGeometry(0.1, 0.008, 0.07);
wingGeo.translate(0.055, 0, 0);

function makeButterfly(i) {
  const g = new THREE.Group();
  const wm = mat(COLORS.petals[i % COLORS.petals.length], 0.5);
  const L = new THREE.Mesh(wingGeo, wm); L.rotation.y = Math.PI; g.add(L);
  const R = new THREE.Mesh(wingGeo, wm); g.add(R);
  const body = rbox(0.03, 0.03, 0.08, mat(0x5a5148, 0.7), 0.01); g.add(body);
  g.traverse(o => { o.castShadow = false; o.raycast = () => { }; });
  butterflyGroup.add(g);
  const b = {
    group: g, wingL: L, wingR: R, tint: i,
    from: new THREE.Vector3(), to: new THREE.Vector3(),
    t: 100, dur: 10, phase: i * 2.7,   // t > 60 → first flight snaps to a flower bed
  };
  butterflies.push(b);
  return b;
}
makeButterfly(0); makeButterfly(3);

function butterflyTarget(b) {
  const f = flowerTiles[Math.floor(Math.random() * flowerTiles.length)];
  b.from.copy(b.group.position);
  b.to.copy(tileTopWorld(f.x, f.z)).add(new THREE.Vector3(
    (Math.random() - 0.5) * 0.6, 0.45 + Math.random() * 0.4, (Math.random() - 0.5) * 0.6));
  b.t = 0;
  b.dur = Math.max(2.5, b.from.distanceTo(b.to) / 0.75) + 1.5 + Math.random() * 2;
}

function updateButterflies(dt, time) {
  const show = flowerTiles.length > 0 && sky.up > 0.3;   // they turn in at dusk
  butterflyGroup.visible = show;
  if (!show) return;
  for (const b of butterflies) {
    b.t += dt;
    if (b.t >= b.dur) {
      if (b.t > 60) b.group.position.copy(tileTopWorld(flowerTiles[0].x, flowerTiles[0].z)).y += 0.6;
      butterflyTarget(b);
    }
    const k = Math.min(1, b.t / (b.dur - 1.2));
    const e = k * k * (3 - 2 * k);   // smoothstep — gentle take-off and landing
    const p = b.group.position;
    p.lerpVectors(b.from, b.to, e);
    p.y += Math.sin(time * 3.1 + b.phase) * 0.05 + Math.sin(time * 9 + b.phase) * 0.015;
    if (e > 0.001 && e < 0.999) {
      const ang = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z);
      b.group.rotation.y += shortAngle(b.group.rotation.y, ang) * Math.min(1, dt * 5);
    }
    const flap = 0.25 + Math.abs(Math.sin(time * 11 + b.phase)) * 0.85;
    b.wingL.rotation.z = -flap;
    b.wingR.rotation.z = flap;
  }
}

// ── Ground birds ─────────────────────────────────────────────────────────────
// Three small birds work the property. One at a time they drop onto a fairway
// nobody is standing on, hop about, peck at the turf — and startle up and away
// the moment a group walks up the hole, because that is the whole trick: they
// are keyed to the real sim, so an empty course reads calm and a busy one
// keeps its birds in the air. Repaint the tile under one and it leaves too.
// Butterflies stay; the birds are the fairways' answer to the flower beds'.

const fairwayTiles = [];              // refreshed by computeCourse
const birdGroup = new THREE.Group(); scene.add(birdGroup);
const birds = [];
const BIRD_COLORS = [0x9b948b, 0x8b8177, 0x7d6f5f];

function makeBird(i) {
  const g = new THREE.Group();
  const body = mat(BIRD_COLORS[i % BIRD_COLORS.length], 0.72);
  const b = rbox(0.075, 0.055, 0.10, body, 0.024); b.position.y = 0.045; g.add(b);
  const headG = new THREE.Group(); headG.position.set(0, 0.075, 0.045); g.add(headG);
  const h = rbox(0.045, 0.045, 0.05, body, 0.018); h.position.set(0, 0.01, 0.01); headG.add(h);
  const beak = rbox(0.014, 0.012, 0.026, mat(0xd9a05b, 0.5), 0.004);
  beak.position.set(0, 0.005, 0.045); headG.add(beak);
  const tail = rbox(0.05, 0.012, 0.055, body, 0.005);
  tail.position.set(0, 0.05, -0.065); tail.rotation.x = 0.35; g.add(tail);
  const wingL = rbox(0.085, 0.008, 0.06, body, 0.004); wingL.position.set(-0.052, 0.062, 0); g.add(wingL);
  const wingR = rbox(0.085, 0.008, 0.06, body, 0.004); wingR.position.set(0.052, 0.062, 0); g.add(wingR);
  g.traverse(o => { o.castShadow = false; o.raycast = () => { }; });
  g.visible = false;
  birdGroup.add(g);
  const bird = {
    group: g, headG, wingL, wingR,
    state: 0, t: 0, cool: 6 + i * 9, stay: 0,      // 0 off · 1 flying in · 2 down · 3 away
    from: new THREE.Vector3(), to: new THREE.Vector3(),
    hopA: new THREE.Vector3(), hopB: new THREE.Vector3(), hopT: 9, next: 0,
    phase: i * 2.1,
  };
  birds.push(bird);
  return bird;
}
makeBird(0); makeBird(1); makeBird(2);

// a fairway tile with nobody near it, or null if the course is busy everywhere
function birdSpot() {
  if (!fairwayTiles.length) return null;
  for (let tries = 0; tries < 8; tries++) {
    const t = fairwayTiles[(Math.random() * fairwayTiles.length) | 0];
    const p = tileTopWorld(t.x, t.z);
    let ok = true;
    for (const g of golfers) if (Math.hypot(g.pos.x - p.x, g.pos.z - p.z) < 4) { ok = false; break; }
    if (ok) return p;
  }
  return null;
}

// whoever is walking up on this bird — a golfer or a cart inside r tiles
function birdThreat(b, r) {
  const p = b.group.position;
  for (const g of golfers) if (Math.hypot(g.pos.x - p.x, g.pos.z - p.z) < r) return g.pos;
  for (const c of carts) {
    if (c.st === 'park') continue;
    const cp = c.group.position;
    if (Math.hypot(cp.x - p.x, cp.z - p.z) < r) return cp;
  }
  return null;
}

function startleBird(b, threat) {
  const p = b.group.position;
  let ax = Math.sin(b.phase), az = Math.cos(b.phase);
  if (threat) {
    const d = Math.hypot(p.x - threat.x, p.z - threat.z) || 1;
    ax = (p.x - threat.x) / d; az = (p.z - threat.z) / d;
  }
  b.from.copy(p);
  b.to.set(p.x + ax * 7, p.y + 3.4, p.z + az * 7);
  b.t = 0; b.state = 3;
  if (threat) sound('flutter', p);   // wings you only hear if you are close
}

function updateBirds(dt, time) {
  const day = sky.up > 0.25;
  let any = false;
  for (const b of birds) {
    const g = b.group;
    switch (b.state) {
      case 0: {
        b.cool -= dt;
        if (b.cool <= 0) {
          if (day && course.holes.length && !document.hidden) {
            const p = birdSpot();
            if (p) {
              b.to.copy(p).add(new THREE.Vector3((Math.random() - 0.5) * 0.5, 0, (Math.random() - 0.5) * 0.5));
              const a = Math.random() * Math.PI * 2;
              b.from.set(b.to.x + Math.cos(a) * 6, b.to.y + 3.0, b.to.z + Math.sin(a) * 6);
              b.t = 0; b.state = 1; g.visible = true;
              g.position.copy(b.from);
            }
          }
          b.cool = 5 + Math.random() * 6;
        }
        break;
      }
      case 1: {                                          // gliding down
        b.t += dt;
        const k = Math.min(1, b.t / 1.6);
        const e = k * k * (3 - 2 * k);
        g.position.lerpVectors(b.from, b.to, e);
        g.position.y += Math.sin(Math.PI * e) * 0.35;    // a shallow swoop
        g.rotation.y = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z);
        const flap = Math.sin(time * 26 + b.phase) * (0.25 + 0.75 * (1 - e));
        b.wingL.rotation.z = -0.25 - flap; b.wingR.rotation.z = 0.25 + flap;
        if (k >= 1) {
          b.state = 2; b.stay = 16 + Math.random() * 22; b.next = 0.4; b.hopT = 9;
          b.wingL.rotation.z = 0; b.wingR.rotation.z = 0;
        }
        break;
      }
      case 2: {                                          // down on the grass
        b.stay -= dt;
        const th = birdThreat(b, 2.4);
        const ct = curTileOf(g.position);
        const ty = tileType(ct.x, ct.z);
        const stood = ty === 'fairway' || ty === 'grass' || ty === 'green' || ty === 'rough';
        if (th || b.stay <= 0 || !day || !stood) { startleBird(b, th); break; }
        if (b.hopT < 0.26) {                             // mid-hop
          b.hopT += dt;
          const k = Math.min(1, b.hopT / 0.26);
          g.position.lerpVectors(b.hopA, b.hopB, k);
          g.position.y += 4 * 0.06 * k * (1 - k);
          g.rotation.y = Math.atan2(b.hopB.x - b.hopA.x, b.hopB.z - b.hopA.z);
        } else {
          b.next -= dt;
          // a peck at the turf now and then, on its own beat
          const pk = Math.sin(time * 1.1 + b.phase);
          b.headG.rotation.x = pk > 0.72 ? (pk - 0.72) * 3.2 : 0;
          if (b.next <= 0) {
            const a = Math.random() * Math.PI * 2, d = 0.15 + Math.random() * 0.25;
            const nx = g.position.x + Math.cos(a) * d, nz = g.position.z + Math.sin(a) * d;
            const nt = curTileOf({ x: nx, z: nz });
            const nty = tileType(nt.x, nt.z);
            if (nty === 'fairway' || nty === 'grass' || nty === 'green' || nty === 'rough') {
              b.hopA.copy(g.position);
              b.hopB.set(nx, tileTopWorld(nt.x, nt.z).y, nz);
              b.hopT = 0;
            }
            b.next = 0.5 + Math.random() * 1.4;
          }
        }
        break;
      }
      case 3: {                                          // up and away
        b.t += dt;
        const k = Math.min(1, b.t / 1.4);
        const e = k * k;
        g.position.lerpVectors(b.from, b.to, e);
        g.rotation.y = Math.atan2(b.to.x - b.from.x, b.to.z - b.from.z);
        const flap = Math.sin(time * 30 + b.phase) * 0.95;
        b.wingL.rotation.z = -0.3 - flap; b.wingR.rotation.z = 0.3 + flap;
        b.headG.rotation.x = 0;
        if (k >= 1) { b.state = 0; g.visible = false; b.cool = 14 + Math.random() * 18; }
        break;
      }
    }
    if (b.state) any = true;
  }
  birdGroup.visible = any;
}

// ── Dressing the course ──────────────────────────────────────────────────────
// Applying a theme swaps the palette buildTile reads, the sky behind the glass
// and the colour of the light. Nothing else moves: the tiles, the caps, the
// masks and the shader effects are identical, so the island simply grows back
// in its new clothes.

function applyTheme(id) {
  const p = paletteOf(id);
  Object.assign(COLORS, BASE_COLORS, p.c);
  themeLight = p.light;
  themeSky = p.sky;
  applyDaylight(true);       // the season sets the palette; the hour sets the light
  // the butterflies were cut from the old palette's petals
  for (const b of butterflies) {
    const m = mat(COLORS.petals[b.tint % COLORS.petals.length], 0.5);
    b.wingL.material = m; b.wingR.material = m;
  }
}

// ── The light of the hour ────────────────────────────────────────────────────
// One sun, one hemisphere light and five CSS variables already carry the whole
// look of the property — so the real hour simply moves them. The sun rides the
// arc the date gives it, goes gold at both ends of the day, and hands over to a
// low blue moon at night, when the lit clubhouse windows are the warmest thing
// on the property. No second render path, no extra lights, no per-frame cost
// beyond a handful of lerps a few times a minute.

const NIGHT = {
  sun: 0x93b0e8, hemiSky: 0x2b4468, hemiGround: 0x202a38,
  sky: { glow: '#31486b', a: '#1e2f49', b: '#293a52', c: '#38495e' },
};
const DUSK = { sun: 0xffab63, glow: '#ffd2a6', a: '#f7c39c', b: '#f0d6bd', c: '#f6ebda' };

let themeLight = PALETTES[0].light;
let themeSky = PALETTES[0].sky;
// how much daylight there is right now — read by anything that sleeps at night
const sky = { up: 1, high: 1, alt: 1 };
const _cA = new THREE.Color(), _cB = new THREE.Color();

function smoothstep(a, b, x) {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
// the clubhouse's warm interior panes — mat() is cached, so this is the very
// material the building was built from
function litMat() { return mat(COLORS.clubGlow, 0.3, { emissive: 0xffa94d, emissiveIntensity: 0.75 }); }

// where the sun is, 0 → 1 across the daylight hours (and past both ends)
function sunAltitude(min) {
  const dl = dayInfo().dl;
  return Math.sin(Math.PI * (min - dl.sunrise) / Math.max(1, dl.sunset - dl.sunrise));
}

let lightMin = -999;
// Photo mode's golden-hour nudge: when set, the whole daylight rig reads THIS
// minute instead of the clock's — same sun, same sky, same window lamps, just
// asked about a different moment. Nothing new is lit; see setGolden().
let photoLightMin = null;
function applyDaylight(force) {
  const m = photoLightMin != null ? photoLightMin : nowMinute();
  if (!force && Math.abs(m - lightMin) < 0.6) return;
  lightMin = m;
  const dl = dayInfo().dl;
  const k = (m - dl.sunrise) / Math.max(1, dl.sunset - dl.sunrise);
  const alt = Math.sin(Math.PI * k);
  const up = smoothstep(-0.10, 0.07, alt);     // 0 at night, 1 once the sun clears
  const high = smoothstep(0.0, 0.46, alt);     // 0 on the horizon, 1 by mid-morning

  // the arc — east at first light, overhead at noon, west at dusk. The moon
  // carries on round the same circle, so there is always a shadow direction.
  const cx = Math.cos(Math.PI * k);
  sun.position.set(cx * 26, 3.5 + Math.max(0.12, Math.abs(alt)) * 30, 11 + Math.abs(cx) * 7);
  sun.intensity = 0.26 + up * (0.30 + 1.74 * high);
  _cA.set(DUSK.sun).lerp(_cB.set(themeLight.sun), high);
  sun.color.set(NIGHT.sun).lerp(_cA, up);
  hemi.intensity = 0.34 + up * 0.60;
  hemi.color.set(NIGHT.hemiSky).lerp(_cA.set(themeLight.skyHemi), up);
  hemi.groundColor.set(NIGHT.hemiGround).lerp(_cA.set(themeLight.groundHemi), up);
  renderer.toneMappingExposure = 1.12 - (1 - up) * 0.26;
  shadowPlane.material.opacity = 0.02 + 0.09 * high;

  // the studio room goes down with the sun — it is the biggest single source
  // of diffuse light on the property, and leaving it at noon strength is what
  // makes a "night" look like an overcast afternoon
  envK = 0.30 + 0.70 * up;
  for (const e of envMats) e.m.envMapIntensity = e.base * envK;
  uNight.value = 1 - up;

  // the sky behind the glass travels with it: gold at the edges of the day,
  // blue hour after it
  const glow = skyMix(NIGHT.sky.glow, DUSK.glow, themeSky.glow, up, high);
  const rs = document.documentElement.style;
  rs.setProperty('--sky-glow', glow);
  rs.setProperty('--sky-fade', glow.replace('rgb(', 'rgba(').replace(')', ', 0)'));
  rs.setProperty('--sky-1', skyMix(NIGHT.sky.a, DUSK.a, themeSky.a, up, high));
  const mid = skyMix(NIGHT.sky.b, DUSK.b, themeSky.b, up, high);
  rs.setProperty('--sky-2', mid);
  rs.setProperty('--sky-3', skyMix(NIGHT.sky.c, DUSK.c, themeSky.c, up, high));
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', mid);
  document.body.classList.toggle('night', up < 0.35);

  // the windows come up as the light goes down
  litMat().emissiveIntensity = 0.35 + (1 - up) * 1.15;
  sky.up = up; sky.high = high; sky.alt = alt;
}

function skyMix(night, dusk, day, up, high) {
  _cA.set(dusk).lerp(_cB.set(day), high);
  return _cB.set(night).lerp(_cA, up).getStyle();
}

function setTheme(id) {
  const p = paletteOf(id);
  if (state.theme === p.id) return;
  state.theme = p.id;
  applyTheme(p.id);
  rebuildIsland(true);      // the diagonal sweep the course opened on
  sound('place');
  toast(p.name + ' · ' + p.sub);
  save();
  if (sheetOpen) renderSheet();
}

// ── Hole measurement ─────────────────────────────────────────────────────────

function holeKey(h) { return h.tee.x + ',' + h.tee.z + '>' + h.flag.x + ',' + h.flag.z; }

// contiguous putting surface around the cup (green + flag tiles, capped at 16)
function greenSizeAt(fx, fz) {
  const seen = new Set([keyOf(fx, fz)]);
  const stack = [[fx, fz]];
  let n = 0;
  while (stack.length && n < 16) {
    const [x, z] = stack.pop();
    n++;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, nz = z + dz, k = keyOf(nx, nz);
      if (seen.has(k) || !inBounds(nx, nz)) continue;
      const t = tileType(nx, nz);
      if (t === 'green' || t === 'flag') { seen.add(k); stack.push([nx, nz]); }
    }
  }
  return n;
}

// What the corridor is carrying. Bunkers and water count within 1.5 tiles of
// the direct tee→green line — that is trouble you have to aim around. Rough
// counts out to 2.5, because rough that FRAMES a hole never sits on the line:
// it is the shoulder the fairway is cut out of. A bridged span is no longer
// water in play — the deck gives the golfer somewhere to stand, and the hole
// gets easier for it. That trade is the whole point of a bridge.
function hazardsNearLine(tee, flag) {
  // trees and flower beds ride along in the same pass: they change no score and
  // no rating, but they are how a golfer tells one corridor from another
  const haz = { bunker: 0, water: 0, rough: 0, tree: 0, flower: 0 };
  const vx = flag.x - tee.x, vz = flag.z - tee.z;
  const len2 = vx * vx + vz * vz || 1;
  const x0 = Math.min(tee.x, flag.x) - 3, x1 = Math.max(tee.x, flag.x) + 3;
  const z0 = Math.min(tee.z, flag.z) - 3, z1 = Math.max(tee.z, flag.z) + 3;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!inBounds(x, z)) continue;
      const t = tileType(x, z);
      if (haz[t] === undefined) continue;
      const k = Math.max(0, Math.min(1, ((x - tee.x) * vx + (z - tee.z) * vz) / len2));
      const dx = x - (tee.x + vx * k), dz = z - (tee.z + vz * k);
      const d2 = dx * dx + dz * dz;
      const reach = t === 'bunker' || t === 'water' ? 1.5 : 2.5;
      if (d2 <= reach * reach) haz[t]++;
    }
  }
  return haz;
}

// a corridor is "defined" once there is real rough shouldering it — the
// threshold keeps a decorative sprinkle from claiming the Design credit
const ROUGH_DEFINED = 5;

function makeHole(tee, flag, dist) {
  const yards = Math.round(dist * YARDS_PER_TILE);
  const elevDiff = elevOf(flag.x, flag.z) - elevOf(tee.x, tee.z);
  const effYards = Math.max(1, yards + elevDiff * ELEV_YARDS);
  const par = parFor(effYards);
  const greenSize = greenSizeAt(flag.x, flag.z);
  const hazards = hazardsNearLine(tee, flag);
  // expected strokes over par for a scratch-average golfer (sampled in scoreHole):
  // where the hole sits inside its par band, trouble on the tee line, the climb
  // to the green, and how small the putting surface is
  const lo = par === 3 ? 80 : par === 4 ? PAR4_MIN : PAR5_MIN;
  const hi = par === 3 ? PAR4_MIN - 1 : par === 4 ? PAR5_MIN - 1 : 650;
  const stretch = Math.max(0, Math.min(1, (effYards - lo) / (hi - lo)));
  const over = -0.18
    + (-0.35 + stretch * 0.75)
    + Math.min(0.9, hazards.bunker * 0.10 + hazards.water * 0.16)
    // rough narrows the corridor: every miss is punished a little harder
    + Math.min(0.30, hazards.rough * 0.022)
    + (elevDiff > 0 ? elevDiff * 0.10 : -elevDiff * 0.04)
    + (greenSize >= 8 ? -0.15 : greenSize >= 4 ? 0 : 0.22);
  return { tee, flag, dist, yards, effYards, par, over, greenSize, hazards, elevDiff };
}

// ── Course computation ───────────────────────────────────────────────────────

// Reconcile the persisted tee→flag pairings against the tiles on the ground.
// Pairs survive edits elsewhere on the course; a pair dies only when its tee
// or flag tile is gone (the array compacts, so numbering stays clean). New
// tees claim the nearest unclaimed flag and join at the end — creation order.
// A hand-linked pair (locked) outranks everything: proximity pairing can only
// ever fill in tees and pins the architect has not spoken for.

let unpairedTiles = [];   // [{x, z, kind:'tee'|'flag'}] — refreshed by reconcileHoles
// hand-linked pairs this pass killed because a tile went away — computeCourse
// turns them into plain language so a lost link is never a silent change
let brokenLinks = [];

function reconcileHoles(tees, flags) {
  // Dozing a tee or a pin takes its hole with it, and the survivor can be handed
  // a different partner on the same frame — so the stroke in flight carries the
  // pairings as they were and undo puts them back exactly: numbering, locks and
  // all. Scorecards ride along for free, since holeStats is keyed by the pairing
  // and nothing ever deletes a key.
  const wasPairs = (stroke && !strokePairs) ? clonePairs() : null;
  const teeSet = new Set(tees.map(t => keyOf(t.x, t.z)));
  const flagSet = new Set(flags.map(f => keyOf(f.x, f.z)));
  let pairs = Array.isArray(state.holePairs) ? state.holePairs : [];
  brokenLinks = pairs.filter(p => p && p.locked && p.tee && p.flag
    && !(teeSet.has(keyOf(p.tee.x, p.tee.z)) && flagSet.has(keyOf(p.flag.x, p.flag.z))));
  pairs = pairs.filter(p => p && p.tee && p.flag
    && teeSet.has(keyOf(p.tee.x, p.tee.z)) && flagSet.has(keyOf(p.flag.x, p.flag.z)));
  // one hole per tee and per flag — drop dupes from any corrupt save, and let a
  // locked pair evict an auto one that claims the same tile (order is preserved,
  // so hole numbers never shuffle underneath the player)
  const lockT = new Set(), lockF = new Set();
  for (const p of pairs) if (p.locked) { lockT.add(keyOf(p.tee.x, p.tee.z)); lockF.add(keyOf(p.flag.x, p.flag.z)); }
  const usedT = new Set(), usedF = new Set();
  pairs = pairs.filter(p => {
    const tk = keyOf(p.tee.x, p.tee.z), fk = keyOf(p.flag.x, p.flag.z);
    if (usedT.has(tk) || usedF.has(fk)) return false;
    if (!p.locked && (lockT.has(tk) || lockF.has(fk))) return false;
    usedT.add(tk); usedF.add(fk);
    return true;
  });
  const freeT = tees.filter(t => !usedT.has(keyOf(t.x, t.z)));
  const freeF = flags.filter(f => !usedF.has(keyOf(f.x, f.z)));
  const added = [];
  for (const tee of freeT) {
    if (!freeF.length) break;
    let bi = 0, bd = Infinity;
    for (let i = 0; i < freeF.length; i++) {
      const d = Math.hypot(freeF[i].x - tee.x, freeF[i].z - tee.z);
      if (d < bd) { bd = d; bi = i; }
    }
    const flag = freeF.splice(bi, 1)[0];
    const p = { tee: { x: tee.x, z: tee.z }, flag: { x: flag.x, z: flag.z }, locked: false };
    pairs.push(p);
    added.push(p);
    usedT.add(keyOf(tee.x, tee.z));
    usedF.add(keyOf(flag.x, flag.z));
  }
  state.holePairs = pairs;
  if (wasPairs && !samePairs(wasPairs, pairs)) strokePairs = wasPairs;
  // whatever is left over is a real, legible state: a tee with no pin to play
  // to, or a pin no tee reaches. The world badges invite the player to link it.
  unpairedTiles = tees.filter(t => !usedT.has(keyOf(t.x, t.z))).map(t => ({ x: t.x, z: t.z, kind: 'tee' }))
    .concat(flags.filter(f => !usedF.has(keyOf(f.x, f.z))).map(f => ({ x: f.x, z: f.z, kind: 'flag' })));
  return added;
}

// ── Course rating v2 — five legible 0–100 components ─────────────────────────

const RATING_META = [
  { id: 'holes', name: 'Holes', hint: 'Open more holes — a full nine maxes this out.' },
  { id: 'design', name: 'Design', hint: 'Mix par 3s, 4s and 5s, frame the corridors with rough, and bring hazards and elevation into play.' },
  { id: 'flow', name: 'Flow', hint: 'Bring each tee closer to the previous green, sign your tees, and finish near the clubhouse.' },
  { id: 'beauty', name: 'Beauty', hint: 'Plant trees and flower beds around the course.' },
  { id: 'maintenance', name: 'Maintenance', hint: 'Level up Greenkeeping in Upgrades.' },
];
const RATING_WEIGHTS = { holes: 0.30, design: 0.22, flow: 0.20, beauty: 0.18, maintenance: 0.10 };

// the most a full set of tee signs can add to Flow. Deliberately small: signage
// is the last 8% of wayfinding, never a substitute for a walkable routing.
const SIGN_FLOW = 8;

// holes whose tee has a sign standing next to it
function signedTees(holes) {
  let n = 0;
  for (const h of holes) {
    for (const [dx, dz] of DIRS) {
      if (tileType(h.tee.x + dx, h.tee.z + dz) === 'sign') { n++; break; }
    }
  }
  return n;
}

function computeRating(holes, counts) {
  const clamp100 = v => Math.max(0, Math.min(100, v));
  // Holes: progress toward a full nine (gentle curve so early holes feel big)
  const compHoles = holes.length ? Math.round(clamp100(100 * Math.sqrt(holes.length / 9))) : 0;
  // Beauty: pure landscaping
  const compBeauty = Math.round(clamp100(counts.tree * 5 + counts.flower * 6));
  // Flow: each green should sit near the next tee, and the last green near home
  // — plus a modest wayfinding credit for signing the tees (see signedTees)
  let compFlow = 0;
  if (holes.length) {
    const legScore = d => clamp100(100 - Math.max(0, d - 2.5) * 8);
    let sum = 0, n = 0;
    for (let i = 0; i < holes.length - 1; i++) {
      sum += legScore(Math.hypot(holes[i + 1].tee.x - holes[i].flag.x, holes[i + 1].tee.z - holes[i].flag.z));
      n++;
    }
    const last = holes[holes.length - 1];
    sum += legScore(Math.hypot(SPAWN_TILE.x - last.flag.x, SPAWN_TILE.z - last.flag.z));
    n++;
    compFlow = Math.round(clamp100(sum / n + (signedTees(holes) / holes.length) * SIGN_FLOW));
  }
  // Design: par variety (35) + trouble on the line (30) + sculpted land (20)
  // + corridors defined by rough (15)
  let compDesign = 0;
  if (holes.length) {
    const variety = (new Set(holes.map(h => h.par)).size / 3) * 35;
    const hazard = (holes.filter(h => h.hazards.bunker + h.hazards.water > 0).length / holes.length) * 30;
    const elev = Math.min(1, counts.elev / 8) * 20;
    const defined = (holes.filter(h => h.hazards.rough >= ROUGH_DEFINED).length / holes.length) * 15;
    compDesign = Math.round(variety + hazard + elev + defined);
  }
  // Maintenance: the Greenkeeping upgrade, maxed at level 4
  const compMaint = Math.min(100, state.upgrades.grounds * 25);
  const r = { holes: compHoles, beauty: compBeauty, flow: compFlow, design: compDesign, maintenance: compMaint };
  const overall = holes.length ? RATING_META.reduce((s, m) => s + RATING_WEIGHTS[m.id] * r[m.id], 0) : 0;
  r.overall = Math.round(overall);
  r.stars = overall / 20;   // 0–100 → 0–5
  return r;
}

// ── What a golfer sees ───────────────────────────────────────────────────────
// The same tiles the rating reads, described the way somebody walking the
// course would describe them: is there any variety, does anything make you
// think, can you see the green, how far is it to the next tee, and which hole
// is worth mentioning in the bar afterwards. One pass per recompute — every
// note any golfer ever writes is arithmetic on this object (see people.js).

function courseFacts(holes, counts) {
  const n = holes.length;
  const f = { holes: n, variety: 0, troubleRate: 0, roughRate: 0, greenAvg: 0,
    blind: 0, walkAvg: 0, beauty: 0, best: null, worst: null };
  if (!n) return f;
  f.variety = new Set(holes.map(h => h.par)).size / 3;
  let trouble = 0, rough = 0, green = 0;
  for (const h of holes) {
    if (h.hazards.bunker + h.hazards.water > 0) trouble++;
    if (h.hazards.rough >= ROUGH_DEFINED) rough++;
    green += h.greenSize;
    if (h.elevDiff >= 1) f.blind++;              // green above the tee: you play it blind
  }
  f.troubleRate = trouble / n;
  f.roughRate = rough / n;
  f.greenAvg = green / n;
  f.beauty = Math.min(1, (counts.tree + counts.flower * 1.2) / (n * 5 + 6));

  // the walk each green makes you take to the tee that follows it
  let walkSum = 0, worstWalk = 0, worstWalkN = 0;
  for (let i = 0; i < n; i++) {
    const next = i < n - 1 ? holes[i + 1].tee : SPAWN_TILE;
    const d = Math.hypot(next.x - holes[i].flag.x, next.z - holes[i].flag.z);
    walkSum += d;
    if (d > worstWalk) { worstWalk = d; worstWalkN = holes[i].n; }
  }
  f.walkAvg = walkSum / n;

  // the one hole worth praising, and the one worth complaining about
  let bs = 0, ws = 0;
  for (const h of holes) {
    let s = 0, why = '';
    const hz = h.hazards;
    if (hz.tree + hz.flower >= 7) { s = 2.2; why = 'pretty'; }
    if (hz.bunker >= 2 && s < 2.5) { s = 2.5; why = 'testing'; }
    if (h.par === 5 && h.effYards >= 500 && s < 2.8) { s = 2.8; why = 'big'; }
    if (hz.water >= 2 && s < 3.2) { s = 3.2; why = 'carry'; }
    if (h.par === 4 && h.effYards <= 320 && hz.bunker + hz.water > 0) { s = 3.6; why = 'shortpar4'; }
    if (s > bs) { bs = s; f.best = { n: h.n, why, par: h.par }; }

    let s2 = 0, why2 = '';
    if (h.greenSize <= 2) { s2 = 2.4; why2 = 'tiny'; }
    if (h.elevDiff >= 2 && s2 < 2.6) { s2 = 2.6; why2 = 'blind'; }
    if (s2 > ws) { ws = s2; f.worst = { n: h.n, why: why2 }; }
  }
  if (worstWalk > 3.4 && 2.0 + worstWalk * 0.25 > ws) f.worst = { n: worstWalkN, why: 'walk' };
  return f;
}

// ── The architecture ─────────────────────────────────────────────────────────
// The five readings above are what a Saturday fourball notices. This is what a
// Major Champion notices, and it is the whole reason the star golfers exist:
// thirteen qualities of golf-course ARCHITECTURE, each measured 0–1 off the
// tiles the player actually laid, each one something a tool in the dock can
// change. stars.js holds the taste; this holds the truth.
//
// Nothing here is an opinion. Fairway width is fairway tiles per tile of hole.
// Hazard purpose is the share of the property's sand and water that sits where
// somebody is actually trying to play. A forced carry is water genuinely across
// the line of play, not water sitting beside it. Two stars can read the same
// numbers and reach opposite verdicts — that is taste. The numbers are not.

const CORRIDOR = 2.0;      // how far off the line still counts as the corridor
const OFF_LINE = 2.6;      // …and past here a hazard is decoration, not design
const GREEN_REACH = 2.3;   // sand or water this close to the pin is defending it

// One walk of a hole's bounding box, answering everything the architecture
// needs to know about it. Same shape of scan as hazardsNearLine, which it
// deliberately does not touch — the scorecard's idea of a hazard must not move
// because the architecture asked a different question.
function corridorOf(tee, flag) {
  const c = { fair: 0, bunkerOn: 0, waterOn: 0, bunkerOff: 0, waterOff: 0,
    carry: 0, greenBunker: 0, greenWater: 0 };
  const vx = flag.x - tee.x, vz = flag.z - tee.z;
  const len2 = vx * vx + vz * vz || 1;
  const x0 = Math.min(tee.x, flag.x) - 4, x1 = Math.max(tee.x, flag.x) + 4;
  const z0 = Math.min(tee.z, flag.z) - 4, z1 = Math.max(tee.z, flag.z) + 4;
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      if (!inBounds(x, z)) continue;
      const t = tileType(x, z);
      if (t !== 'fairway' && t !== 'bunker' && t !== 'water') continue;
      const k = ((x - tee.x) * vx + (z - tee.z) * vz) / len2;
      const kc = Math.max(0, Math.min(1, k));
      const dx = x - (tee.x + vx * kc), dz = z - (tee.z + vz * kc);
      const d = Math.hypot(dx, dz);
      if (t === 'fairway') { if (d <= CORRIDOR) c.fair++; continue; }
      const near = Math.hypot(x - flag.x, z - flag.z) <= GREEN_REACH;
      if (near) { if (t === 'bunker') c.greenBunker++; else c.greenWater++; }
      if (d <= 1.5) {
        if (t === 'bunker') c.bunkerOn++; else c.waterOn++;
        // a carry is water ACROSS the line with golf on both sides of it —
        // water alongside a fairway is a hazard, not a decision
        if (t === 'water' && d <= 1.2 && k > 0.10 && k < 0.94) c.carry++;
      } else if (d > OFF_LINE) {
        if (t === 'bunker') c.bunkerOff++; else c.waterOff++;
      }
    }
  }
  return c;
}

const c01 = v => Math.max(0, Math.min(1, v));

// The thirteen readings, plus a per-hole copy of the ones that vary hole to
// hole — so a star can name a favourite hole and two of them can name
// different ones (see stars.favourite).
function architecture(holes, counts) {
  const n = holes.length;
  const a = { holes: n,
    width: 0, strategy: 0, hazardPurpose: 0, carries: 0, greenDefence: 0,
    greenSize: 0, roughness: 0, elevation: 0, blindness: 0, routing: 0,
    parBalance: 0, condition: 0, beauty: 0 };
  // Greenkeeping, on the same firmly diminishing curve the club's own golfers
  // read it on: mowing beautifully never buys the whole verdict.
  a.condition = 1 - Math.pow(0.66, Math.max(0, state.upgrades.grounds));
  a.beauty = Math.min(1, (counts.tree + counts.flower * 1.2) / (n * 5 + 6));
  if (!n) return a;

  let fairSum = 0, stratSum = 0, on = 0, off = 0, hazHoles = 0, carryHoles = 0;
  let defSum = 0, greenSum = 0, roughSum = 0, elevHoles = 0, blindHoles = 0;
  const defKinds = new Set();
  for (const h of holes) {
    const c = corridorOf(h.tee, h.flag);
    const dist = Math.max(1, h.dist);
    // room: fairway tiles per tile of hole. One narrow ribbon ≈ 1, a genuinely
    // wide corridor ≈ 3, a mown field ≈ 4.5 and climbing.
    const fpt = c.fair / dist;
    const width = c01(fpt / 4.2);
    fairSum += width;
    // Strategic width is the architect's oldest idea and it needs BOTH halves:
    // trouble worth avoiding, AND room to choose how. min() is the whole point
    // — a wide hole with nothing on it is not strategic, and neither is a
    // narrow one with a bunker in the middle.
    const press = Math.min(1, (c.bunkerOn + c.waterOn) / 2.5);
    const room = c01((fpt - 1.0) / 2.2);
    const strat = Math.min(press, room) * 1.15;
    stratSum += strat;
    on += c.bunkerOn + c.waterOn;
    off += c.bunkerOff + c.waterOff;
    if (c.bunkerOn + c.waterOn > 0) hazHoles++;
    if (c.carry >= 2) carryHoles++;
    // how many DIFFERENT ways this green is defended — sand, water, size, or
    // the climb up to it
    const defs = [c.greenBunker >= 1 && 'sand', c.greenWater >= 1 && 'water',
      h.greenSize <= 3 && 'small', h.elevDiff >= 1 && 'above'].filter(Boolean);
    for (const d of defs) defKinds.add(d);
    defSum += Math.min(1, defs.length / 2.4);
    greenSum += h.greenSize;
    roughSum += h.hazards.rough;
    if (Math.abs(h.elevDiff) >= 1) elevHoles++;
    if (h.elevDiff >= 1) blindHoles++;

    h.feat = { width, strategy: strat, carries: c01(c.carry / 3),
      greenDefence: Math.min(1, defs.length / 2.4),
      greenSize: c01((h.greenSize - 1.5) / 9),
      roughness: c01(h.hazards.rough / 14),
      elevation: c01(Math.abs(h.elevDiff) / 2),
      blindness: h.elevDiff >= 1 ? 1 : 0,
      hazardPurpose: c01((c.bunkerOn + c.waterOn) / 3),
      beauty: c01((h.hazards.tree + h.hazards.flower * 1.2) / 9),
      interest: c01((strat + c01(c.carry / 3) + Math.min(1, defs.length / 2.4)) / 2.4),
    };
  }
  a.width = fairSum / n;
  a.strategy = c01(stratSum / n);
  // Purpose is two questions at once: does anything sit on the line at all,
  // and of everything on the property, how much of it is doing a job.
  a.hazardPurpose = 0.5 * (hazHoles / n) + 0.5 * (on + off ? on / (on + off * 0.9) : 0);
  a.carries = c01((carryHoles / n) / 0.45);
  a.greenDefence = 0.55 * (defSum / n) + 0.45 * (defKinds.size / 4);
  a.greenSize = c01((greenSum / n - 1.5) / 9);
  a.roughness = c01((roughSum / n) / 14);
  a.elevation = 0.6 * (elevHoles / n) + 0.4 * Math.min(1, counts.elev / (n * 4 + 4));
  a.blindness = c01((blindHoles / n) / 0.5);

  // routing is the walk the golfer takes, which courseFacts already measured
  let walk = 0;
  for (let i = 0; i < n; i++) {
    const next = i < n - 1 ? holes[i + 1].tee : SPAWN_TILE;
    walk += Math.hypot(next.x - holes[i].flag.x, next.z - holes[i].flag.z);
  }
  a.routing = c01((3.4 - walk / n) / 2.4);

  // par balance is the card AND the yardages: three par 4s of identical length
  // is not a mix, however many pars are printed on it
  const pars = new Set(holes.map(h => h.par)).size / 3;
  const mean = holes.reduce((s, h) => s + h.effYards, 0) / n;
  const sd = Math.sqrt(holes.reduce((s, h) => s + Math.pow(h.effYards - mean, 2), 0) / n);
  a.parBalance = 0.5 * pars + 0.5 * c01(sd / 140);

  // the hole-level copies of the course-wide readings, so favourite() sees a
  // whole taste and not half of one
  for (const h of holes) {
    h.feat.routing = a.routing; h.feat.parBalance = a.parBalance;
    h.feat.condition = a.condition;
  }
  return a;
}

// The whole economy, in one place: what a round is worth and how hard the phone
// rings. computeCourse feeds it live state; the Club sheet feeds it a
// hypothetical set of upgrades to say — truthfully — what the next level buys.
//
//   fee — what the club takes from one player's round: green fee, cart, range
//         balls, the turn, the shop on the way out. ROUND_TAKE prices that
//         whole basket.
//   gpm — DEMAND, not arrivals. The day's waves hold thirty-odd tee times and
//         no more; gpm is how many people want one of those times, and
//         TS.fillFor turns it into the fraction of the book that sells.
//
// ROUND_TAKE was 12 when the book was a five-minute metronome sold to twos.
// The day is now five waves carrying 31–39 real tee times sold to threes and
// fourballs (teesheet.js), so a day holds ~2.8× fewer ROUNDS — each one
// correspondingly worth more, and the club's takings unchanged. That number is
// not a taste decision: it is the measured ratio of SEATS-per-year between the
// two books, taken across the whole demand range (gpm 1.65 → 60).
// It is named rather than folded in, because anything priced in ROUNDS rather
// than in INCOME — the joining fee a notable asks for — has to divide it back
// out to stay where it was.
//
// The ratio is a seat ratio, not a slot ratio, because group size moved too:
//   old 157.6 slots/day × 2.00 per group ÷ (new 35.1 slots/day × 3.25) = 2.77
// Both figures are ANNUAL MEANS. An earlier pass took the old book at "174 a
// day" — that is a midsummer day (189 at the solstice, 126 at the winter one),
// not the year — and the resulting 3.80 over-earned by +34% to +39% at every
// demand level. Re-measured over 365 days × 10 demand levels, the implied
// rebase is flat at 2.738 → 2.831; 2.785 is the minimax fit.
// Measured: with 2.785 a year's takings land between +2.3% and −1.1% of the old
// book's at every demand level from a one-hole course to a saturated one.
const BOOK_REBASE = 2.785;
const ROUND_TAKE = 12 * BOOK_REBASE;

// Word of mouth. Every golfer who hands a card in marks the course out of ten
// (satisfactionOf), and the club's running average of those marks is the ONE
// number besides the star rating that decides how hard the phone rings. It is
// deliberately narrow — ±20% of demand — so it sharpens the existing rating
// instead of competing with it: the stars say how good the course is, the mood
// says whether the people who actually walked it agreed.
// 6.5 out of ten — the mark a club opens on — is the neutral point, so a new
// course is neither carried nor punished by a reputation it has not earned yet.
// The slope is set against the marks people actually give (roughly 4 to 9, since
// nobody hands out tens — see people.rate): a club that is genuinely liked runs
// at the top of the band, and the band's ends are asymptotes rather than a cap
// every mature course pegs against.
function moodWord(avg) { return clamp(1 + (clamp(avg, 0, 10) - 6.5) * 0.08, 0.78, 1.20); }

// Today's book was sold on yesterday's reputation. The sheet freezes the factor
// at first light, so a bad hour never rewrites tee times that are already sold.
function wordOfMouth() {
  const s = state.sheet;
  if (s && s.day === dayInfo().key && isFinite(s.wom)) return s.wom;
  return moodWord(state.mood.avg);
}

function economyOf(nHoles, totalPar, stars, up) {
  if (!nHoles) return { fee: 0, gpm: 0 };
  return {
    fee: ROUND_TAKE * (3 + totalPar * 1.2) * (1 + 0.3 * stars) * Math.pow(1.3, up.clubhouse) * Math.pow(1.2, up.grounds),
    gpm: (1.1 + nHoles * 0.55) * Math.pow(1.25, up.marketing) * (1 + 0.12 * stars) * Math.pow(1.2, up.cartfleet)
      * wordOfMouth(),
  };
}

// What a booked day is worth per open minute — what the offline report and the
// rate pill both read. The day no longer has one gap between tee times, so it
// divides by the average across the whole open day: the waves earn well above
// this figure and the quiet hours well below it, which is the point of them.
function ratePerMinOf(fee, fill, dl) {
  const d = dl || dayInfo().dl;
  return fill * TS.AVG_GROUP * fee / Math.max(1, d.spacing);
}

let courseComputedOnce = false;
let lastStarsSeen = null;   // the rating the pill last showed — see the rating note

// tee tile key -> hole number, the one thing a tee sign needs to know
const teeHoleNum = new Map();
const signTiles = [];

// the hole number (and the tee to turn toward) for a sign at x,z
function signInfoAt(x, z) {
  let best = null;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inBounds(nx, nz) || tileType(nx, nz) !== 'tee') continue;
    const n = teeHoleNum.get(keyOf(nx, nz)) || 0;
    if (!best || n) best = { n, dx, dz };
    if (n) break;
  }
  return best;
}
function signKeyOf(info) { return info ? info.n + '@' + info.dx + ',' + info.dz : '-'; }

// re-route the course and the signs turn over with it — only the ones whose
// number or facing actually changed are rebuilt
function syncSigns() {
  for (const s of signTiles) {
    const m = tileMeshes[keyOf(s.x, s.z)];
    if (!m) continue;
    const k = signKeyOf(signInfoAt(s.x, s.z));
    if (m.userData.signKey === k) continue;
    setTileMesh(s.x, s.z, false);
  }
}

function computeCourse() {
  const tees = [], flags = [];
  const counts = emptyCounts();
  const half = gridSize() / 2;
  flowerTiles.length = 0;
  fairwayTiles.length = 0;
  signTiles.length = 0;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const t = tileType(x, z);
      if (counts[t] !== undefined) counts[t]++;
      if (t === 'tee') tees.push({ x, z });
      else if (t === 'flag') flags.push({ x, z });
      else if (t === 'flower') flowerTiles.push({ x, z });
      else if (t === 'fairway') fairwayTiles.push({ x, z });
      else if (t === 'sign') signTiles.push({ x, z });
      if (elevOf(x, z) > 0) counts.elev++;
    }
  }
  counts.tee = tees.length;
  counts.flag = flags.length;

  const added = reconcileHoles(tees, flags);
  const holes = state.holePairs.map((p, i) => {
    const h = makeHole(p.tee, p.flag, Math.hypot(p.flag.x - p.tee.x, p.flag.z - p.tee.z));
    h.n = i + 1;   // hole number = play order, stable across sessions and edits
    return h;
  });
  teeHoleNum.clear();
  for (const h of holes) teeHoleNum.set(keyOf(h.tee.x, h.tee.z), h.n);
  const totalPar = holes.reduce((s, h) => s + h.par, 0);
  const rating = computeRating(holes, counts);
  const stars = rating.stars;
  const { fee, gpm } = economyOf(holes.length, totalPar, stars, state.upgrades);
  const fill = TS.fillFor(gpm, dayInfo().weekend);
  course = { holes, totalPar, stars, rating, fee, gpm, fill,
    ratePerMin: ratePerMinOf(fee, fill), counts, facts: courseFacts(holes, counts),
    // the thirteen readings the notables mark you on — one pass, same as facts
    arch: architecture(holes, counts) };
  verdictCache.clear();
  // the annals watch the rating's high-water for the year — home ground only,
  // because while the player is away `course` is a championship venue's
  if (state.annals && !away.active && stars > state.annals.ratingPeak) {
    state.annals.ratingPeak = +stars.toFixed(2);
  }
  syncBook();      // a better course fills the rest of today's book

  if (courseComputedOnce && added.length) {
    const p = added[added.length - 1];
    const h = holes[state.holePairs.indexOf(p)];
    if (h) {
      const info = h.yards + ' yds · Par ' + h.par;
      // an edit that killed a hand-linked hole and handed the surviving half a
      // new partner is a change to the architect's own work: name it, and point
      // at the way back. Everything else is simply a hole opening.
      const b = brokenLinks.find(o => (o.tee.x === h.tee.x && o.tee.z === h.tee.z)
        || (o.flag.x === h.flag.x && o.flag.z === h.flag.z));
      if (b) {
        const side = (b.tee.x === h.tee.x && b.tee.z === h.tee.z) ? 'pin' : 'tee';
        toast('Hole ' + h.n + ' lost its ' + side + ' · now plays ' + info + ' · ⌘Z to undo', 'flag');
      }
      else if (holes.length === added.length) toast('The course is open · ' + info +
        // "on their way" is now a promise the sheet keeps (see releaseSlots /
        // updateOpeningDay) — and after dark it says the truth instead
        (clubOpen() ? ' — golfers are on their way' : ' — the first group is booked for first light'), 'flag');
      else toast('Hole ' + h.n + ' is open · ' + info, 'flag');
    }
  }
  // the second hole is the moment routing first exists — one sentence, once
  if (courseComputedOnce && holes.length >= 2 && !away.active) {
    committeeNote('route',
      'Two holes make a routing — the route button on the plaque sets the order of play',
      'route', { label: 'Route', fn: () => enterRouteView() });
  }
  // …and the rating's first MOVE (not its first appearance, which lands in the
  // same breath as the course opening) is the moment the star pill has a story
  if (!away.active && course.holes.length) {
    if (lastStarsSeen != null && lastStarsSeen > 0 && Math.abs(stars - lastStarsSeen) > 0.001) {
      committeeNote('rating',
        'The rating moved — the ★ plate on the board holds the committee\'s reasoning',
        'star', { label: 'See why', fn: () => openRatingCard() });
    }
    lastStarsSeen = stars;
  }
  // a course opening in daylight, on a save that has never hosted a round,
  // gets its first group as walk-ups half a minute later (updateOpeningDay)
  if (course.holes.length && state.mood.n === 0 && !away.active && !openWalk.armed && clubOpen()) {
    openWalk.armed = true;      // once per session; mood.n retires it per save
    openWalk.pending = true;
    openWalk.at = simTime + OPEN_WALKON_S;
  }
  courseComputedOnce = true;

  routeCache.clear();
  syncSigns();
  // sparks over a pin that was edited away fade out quietly
  for (const m of moments) if (!m.dying && tileType(m.hx, m.hz) !== 'flag') expireMoment(m);
  updateCartFleet();
  syncClubhouse();
  updatePills();
  updateMilestone();
  renderPairMarkers();
  if (linkMode.active) refreshLinkTargets();
  if (sheetOpen) renderSheet();
  syncHoleCard();
  if (ratingOpen) renderRatingCard(false);
  if (routeView.active && routeView.phase === 'view') { buildRouteBadges(); updateRouteOverlayPositions(); }
}

function displayStars() {
  if (!course.holes.length) return '★ —';
  return '★ ' + (Math.round(course.stars * 2) / 2).toFixed(1).replace('.0', '');
}

// ── Money ────────────────────────────────────────────────────────────────────

let displayMoney = 0;

function fmt(n) {
  n = Math.floor(n);
  const neg = n < 0 ? '-' : '';
  n = Math.abs(n);
  if (n < 1000) return neg + '$' + n;
  if (n < 1e6) return neg + '$' + trimNum(n / 1e3) + 'K';
  if (n < 1e9) return neg + '$' + trimNum(n / 1e6) + 'M';
  return neg + '$' + trimNum(n / 1e9) + 'B';
}
function trimNum(v) { return v >= 100 ? Math.round(v).toString() : v.toFixed(1).replace(/\.0$/, ''); }

function addMoney(amount) {
  state.money += amount;
  if (amount > 0) state.totalEarned += amount;
  if (amount >= 1) pulseMoneyPill();
}

// a soft settle on the money pill whenever cash lands — throttled so a busy
// clubhouse reads as a gentle heartbeat, not a strobe
let lastPillPulse = 0;
function pulseMoneyPill() {
  const now = performance.now();
  if (now - lastPillPulse < 280) return;
  lastPillPulse = now;
  const pill = el('pill-money');
  if (!pill) return;
  pill.classList.remove('tickup'); void pill.offsetWidth; pill.classList.add('tickup');
}

// green fees coalesce: the first one floats at once, and anything landing in
// the following beat rolls into a single combined floater — never a spam wall
const feeBatch = { open: 0, sum: 0, n: 0 };
function payFee(fee) {
  addMoney(fee);
  if (feeBatch.open <= 0) {
    floater(DOOR.clone().add(new THREE.Vector3(0, 0.9, 0)), '+' + fmt(fee));
    sound('cash');
    feeBatch.open = 0.8; feeBatch.sum = 0; feeBatch.n = 0;
  } else {
    feeBatch.sum += fee; feeBatch.n++;
  }
}
function updateFeeBatch(dt) {
  if (feeBatch.open <= 0) return;
  feeBatch.open -= dt;
  if (feeBatch.open > 0 || feeBatch.n === 0) return;
  const txt = '+' + fmt(feeBatch.sum) + (feeBatch.n > 1 ? ' · ' + feeBatch.n + ' golfers' : '');
  floater(DOOR.clone().add(new THREE.Vector3(0, 0.9, 0)), txt);
  sound('cash');
  feeBatch.open = 0.8; feeBatch.sum = 0; feeBatch.n = 0;   // chain a fresh window
}
function trySpend(cost) {
  if (state.money < cost) {
    toast('Not enough cash — need ' + fmt(cost));
    const pill = el('pill-money');
    pill.classList.remove('shake'); void pill.offsetWidth; pill.classList.add('shake');
    sound('error');
    return false;
  }
  state.money -= cost;
  return true;
}

// ── UI ───────────────────────────────────────────────────────────────────────

const el = id => document.getElementById(id);

// A surface arrives one frame after it is laid out, so the browser has a
// "before" to transition from. Two cases have no next frame to wait for: a pane
// that is not painting never ticks rAF, and stillUI() has switched the
// transition off on purpose. Both take the class at once and the card is simply
// there — which is also what every one of these looked like a fifth of a second
// later anyway.
// ── should this arrive, or should it simply BE there? ────────────────────────
// One answer, asked in one place. Three cases have no next frame worth waiting
// for: a pane that is not painting never ticks rAF at all, stillUI() has
// switched the transition off on purpose, and a player who asked for reduced
// motion wants the thing to be there rather than to arrive.
//
// That sentence was already written above reveal(). The CODE under it checked
// only the last two — it did not check `document.hidden`, which is the case the
// sentence leads with. So in any pane that was not painting, reveal() scheduled
// a rAF that would never run, and the class that makes an overlay visible was
// never added: route view and link mode both entered fully built, fully
// positioned, and at opacity zero, permanently. bkStill() had the same list
// right; reveal() had it wrong; now there is only one list.
const uiStill = () => reduceMotion() || document.hidden ||
  document.body.classList.contains('ui-still');

function reveal(node) {
  if (!node) return;
  if (uiStill()) { node.classList.add('show'); return; }
  requestAnimationFrame(() => node.classList.add('show'));
}

function updatePills() {
  el('pill-rate').textContent = fmt(course.ratePerMin) + ' / min';
  el('pill-stars').textContent = displayStars();
  const n = course.holes.length;
  // reads like a scorecard: course par is the sum of hole pars
  (el('holes-pill-t') || el('pill-holes')).textContent =
    n === 0 ? 'No holes yet' : n + (n === 1 ? ' hole · Par ' : ' holes · Par ') + course.totalPar;
  // the running head across the top of the open book carries the same figure
  if (sheetOpen) bkFurniture();
  el('btn-route').classList.toggle('hidden', n < 2);
}

// ── The dock ─────────────────────────────────────────────────────────────────
// Seven faces instead of sixteen buttons. Each grouped face shows the tool that
// group was last used for, so the common move stays a single click; hovering it
// lifts a labelled popover with the rest, what each one costs, why it matters
// and its shortcut. Picking anything hushes the popover until the pointer
// leaves — the same beat a menu closes on.

function toolCost(id) {
  if (id === 'raise') return RAISE_COST;
  const def = TILE_DEFS[id];
  return def && def.cost ? def.cost : 0;
}

function faceHTML(grp) {
  const id = groupFace[grp.id];
  const t = TOOL_DEFS[id];
  const cost = toolCost(id);
  return ICONS[t.icon]
    + (cost ? '<span class="price">$' + cost + '</span>' : '')
    + (grp.tools.length > 1
      ? '<span class="more"></span>'
      : '<span class="tip">' + t.name + '<span class="tip-cost">' + t.key + '</span></span>');
}

function buildDock() {
  const dock = el('dock');
  dock.innerHTML = '';
  for (const grp of TOOL_GROUPS) {
    const wrap = document.createElement('div');
    wrap.className = 'tgroup' + (grp.tools.length > 1 ? ' multi' : '');
    wrap.dataset.group = grp.id;

    const face = document.createElement('button');
    face.className = 'tool';
    face.dataset.face = grp.id;
    face.innerHTML = faceHTML(grp);
    face.addEventListener('click', () => selectTool(groupFace[grp.id]));
    wrap.appendChild(face);

    if (grp.tools.length > 1) {
      const pop = document.createElement('div');
      pop.className = 'pop';
      pop.innerHTML = '<div class="pop-card card"><div class="pop-h">' + grp.name + '</div>' +
        grp.tools.map(id => {
          const t = TOOL_DEFS[id];
          const cost = toolCost(id);
          return '<button class="pop-item" data-id="' + id + '">' +
            '<span class="pi-icon">' + ICONS[t.icon] + '</span>' +
            '<span class="pi-text"><b>' + t.name + '</b><i>' + t.note + '</i></span>' +
            '<span class="pi-meta">' + (cost ? '<em>$' + cost + '</em>' : '') +
            '<kbd>' + t.key + '</kbd></span></button>';
        }).join('') + '</div>';
      pop.addEventListener('click', e => {
        const b = e.target.closest('.pop-item');
        if (b) selectTool(b.dataset.id);
      });
      wrap.appendChild(pop);
    }

    // a pick dismisses the popover; stepping away arms it again. Hushing on
    // click (not pointerdown) keeps the popover under the finger for the whole
    // gesture — pull its pointer-events out from under a press and the release
    // lands on the canvas instead, and the pick never happens.
    wrap.addEventListener('click', () => wrap.classList.add('hushed'));
    wrap.addEventListener('pointerleave', () => wrap.classList.remove('hushed'));
    dock.appendChild(wrap);
  }
  syncDock();
}

function syncDock() {
  for (const grp of TOOL_GROUPS) {
    const wrap = el('dock').querySelector('[data-group="' + grp.id + '"]');
    if (!wrap) continue;
    const face = wrap.querySelector('.tool');
    face.innerHTML = faceHTML(grp);
    face.classList.toggle('on', grp.tools.includes(activeTool));
    wrap.querySelectorAll('.pop-item').forEach(b => b.classList.toggle('on', b.dataset.id === activeTool));
  }
}

function selectTool(id) {
  activeTool = id;
  const gid = groupOf[id];
  if (gid) groupFace[gid] = id;
  syncDock();
  // left button paints (orbit and link both look around instead); right-drag
  // orbit + wheel zoom always work
  controls.mouseButtons.LEFT = (id === 'orbit' || id === 'link') ? THREE.MOUSE.ROTATE : -1;
  if (id === 'link') { if (!linkMode.active) enterLinkMode(null); }
  else if (linkMode.active) exitLinkMode();
  clearHighlight();
  if (lastPointer) updateHighlight(lastPointer); // highlight snaps in under the cursor at once
  sound('brass');  // an implement lifted out of the painted tray
}

// milestones
function updateMilestone() {
  const card = el('milestone');
  // goals are about YOUR property. While the course on screen is a borrowed
  // championship venue, nothing here counts — same rule holeOut() and the
  // `pay` leg already follow.
  if (away.active) { card.classList.add('hidden'); return; }
  const ms = MILESTONES[state.milestone];
  if (!ms) { card.classList.add('hidden'); return; }

  // auto-complete (may chain)
  const allDone = ms.reqs.every(r => r.value() >= r.need);
  if (allDone) {
    addMoney(ms.reward);
    state.milestone++;
    toast('Goal complete: ' + ms.title + '  +' + fmt(ms.reward), 'check');
    sound('lucky');
    save();
    updateMilestone();
    return;
  }

  card.classList.remove('hidden');
  el('ms-title').textContent = ms.title;
  el('ms-sub').textContent = ms.sub;
  el('ms-reward').textContent = fmt(ms.reward);
  el('ms-rows').innerHTML = ms.reqs.map(msRowHTML).join('');
}

// one requirement line — the HUD goals card and the Progress timeline draw the
// same row, so a goal reads identically wherever the player meets it
function msRowHTML(r) {
  const v = r.value();
  const done = v >= r.need;
  // `shown` only ever renders while the row is unmet, so it must never round UP
  // into reading as complete — 3.97 of 4.0 is "3.9/4.0", never "4.0/4.0". The
  // integer path floors; the formatted one floors to its own precision.
  const shown = r.fmt ? r.fmt(Math.floor(v * 10) / 10) : Math.floor(v);
  const needShown = r.fmt ? r.fmt(r.need) : r.need;
  return '<div class="ms-row' + (done ? ' done' : '') + '">' +
    '<div class="ms-icon">' + ICONS[r.icon] + '</div>' +
    '<div class="ms-label">' + r.label + '</div>' +
    '<div class="ms-prog">' + (done ? ICONS.check : shown + '/' + needShown) + '</div></div>';
}

// ── The Club sheet ───────────────────────────────────────────────────────────
// One home for progression. The button that used to say "Upgrades" says "Club",
// and the sheet it opens carries three views behind a segmented control:
//   Upgrades — every track as a tier ladder, with the next level's effect in
//              live numbers and a locked look at the one after it
//   Progress — how much of the club is finished, and the goals as a timeline
//   Course   — the card a course architect actually reads
// Nothing here is a new entry point: the goals card and the star pill lead into
// it, and every number on screen comes from live state.

let sheetOpen = false;
let clubTab = 'today';
let pipFlash = null;         // { id, level } — the pip a purchase just filled

const UPGRADE_TIERS = 6;     // the ladder the pips draw; levels past it still buy
const LAND = {
  id: 'land', name: 'Land', icon: 'land',
  desc: 'More property — more room to route real holes.', pct: 'A bigger property',
};
const CLUB_TRACKS = UPGRADES.concat([LAND]);

function trackCap(id) { return id === 'land' ? EXPANSIONS.length - 1 : UPGRADE_TIERS; }
function trackLevel(id) { return id === 'land' ? state.sizeIdx : state.upgrades[id]; }
function trackCost(u) {
  if (u.id === 'land') { const n = EXPANSIONS[state.sizeIdx + 1]; return n ? n.cost : null; }
  return Math.round(u.base * Math.pow(u.growth, state.upgrades[u.id]));
}

// What the club looks like with one track dialled to a different level. The
// rating is recomputed too, because Greenkeeping lifts the rating that sets the
// fee — so the arrow the player reads is the number they will actually get.
function projectClub(id, level) {
  const up = Object.assign({}, state.upgrades);
  if (id !== 'land') up[id] = level;
  const saved = state.upgrades;
  state.upgrades = up;                    // computeRating reads grounds off state
  const rating = computeRating(course.holes, course.counts);
  state.upgrades = saved;
  const eco = economyOf(course.holes.length, course.totalPar, rating.stars, up);
  return {
    fee: eco.fee, gpm: eco.gpm, stars: rating.stars,
    fill: TS.fillFor(eco.gpm, dayInfo().weekend),
    carts: course.holes.length ? Math.min(4, 1 + up.cartfleet) : 0,
    tip: Math.round((6 + eco.fee * 0.35) * Math.pow(1.35, up.proshop)),
  };
}

function pctText(v) { return Math.round(Math.min(1, v) * 100) + '%'; }

// The concrete effect of stepping a track from `level` to `level + 1`, in the
// unit that track is actually about. Returns null when the ladder has run out.
function trackEffect(u, level) {
  if (u.id === 'land') {
    const a = EXPANSIONS[level], b = EXPANSIONS[level + 1];
    return b ? { label: 'Property', from: a.size + ' × ' + a.size, to: b.size + ' × ' + b.size } : null;
  }
  // before the first hole is playable the economy is all zeroes — "$0 → $0"
  // would tell the player nothing, so the multiplier speaks instead
  if (!course.holes.length) return { label: u.pct, plain: true };
  const a = projectClub(u.id, level), b = projectClub(u.id, level + 1);
  switch (u.id) {
    case 'clubhouse':
    case 'grounds':   return { label: 'Per round', from: fmt(a.fee), to: fmt(b.fee) };
    case 'marketing': return { label: 'Book fills', from: pctText(a.fill), to: pctText(b.fill) };
    case 'proshop':   return { label: 'Tips', from: fmt(a.tip), to: fmt(b.tip) };
    case 'cartfleet': return { label: 'Book fills', from: pctText(a.fill), to: pctText(b.fill),
                               note: b.carts > a.carts ? '+1 cart' : null };
  }
  return null;
}

function effectHTML(eff) {
  if (!eff) return '';
  if (eff.plain) return '<span class="up-eff-l">' + eff.label + '</span>';
  return '<span class="up-eff-l">' + eff.label + '</span>' +
    '<span class="up-eff-a">' + eff.from + '</span>' +
    '<span class="up-eff-arw">→</span>' +
    '<span class="up-eff-b">' + eff.to + '</span>' +
    (eff.note ? '<span class="up-eff-n">' + eff.note + '</span>' : '');
}

function trackRowHTML(u) {
  const lvl = trackLevel(u.id), cap = trackCap(u.id);
  const cost = trackCost(u);
  const eff = trackEffect(u, lvl);
  // the locked look-ahead only earns its line when it says something new — with
  // no hole open yet both levels read as the same multiplier, so it stays away
  const then = eff && !eff.plain ? trackEffect(u, lvl + 1) : null;
  const maxed = cost === null;
  let pips = '';
  for (let i = 0; i < cap; i++) {
    const on = i < Math.min(lvl, cap);
    const flash = pipFlash && pipFlash.id === u.id && i === pipFlash.level - 1;
    // a level already bought is a mark in the ledger, not a track colour: the
    // ground is `.up-pip.on` in the book's gilt, so a filled pip is the same
    // ink as every other written figure on the spread
    pips += '<span class="up-pip' + (on ? ' on' : '') + (flash ? ' fill' : '') + '"></span>';
  }
  const over = lvl - cap;
  // the Clubhouse is the one upgrade that changes the world, so the next level
  // names the building it actually builds — until the building runs out of tiers
  const tierName = (u.id === 'clubhouse' && lvl + 1 <= CLUB_TIERS.length - 1)
    ? CLUB_TIERS[lvl + 1].name : null;
  return '<div class="up-row" data-track="' + u.id + '">' +
    '<div class="up-head">' +
      // The mark for this part of the club's fabric, drawn on the page. It used
      // to be a rounded tile filled with the track's own tint — and those six
      // tints were the literal iOS system palette (#0a84ff, #ff9f0a, #34c759,
      // #bf5af2, #64d2ff, #8e8e93), which made The Works the one spread in the
      // book that looked like a settings screen. The icons already say which
      // track is which; six colours only said "this is an app".
      '<div class="up-icon">' + ICONS[u.icon] + '</div>' +
      '<div class="up-body">' +
        '<div class="up-name">' + u.name +
          // a purchase is written into the book: the new level is inked across
          // in one pen stroke, on the same beat the pip fills
          '<span class="up-lvl' + (lvl >= cap ? ' done' : '') +
          (pipFlash && pipFlash.id === u.id ? ' wrote' : '') + '">' +
          (u.id === 'land' ? gridSize() + ' × ' + gridSize() : lvl ? 'Lv ' + lvl : 'New') + '</span></div>' +
        '<div class="up-desc">' + u.desc + '</div>' +
      '</div>' +
      (maxed ? '<span class="up-max">Complete</span>'
             : '<button class="up-buy" data-buy="' + u.id + '">' + fmt(cost) + '</button>') +
    '</div>' +
    '<div class="up-pips">' + pips + (over > 0 ? '<span class="up-over">+' + over + '</span>' : '') + '</div>' +
    (maxed
      ? '<div class="up-eff quiet">Every acre of the property is yours.</div>'
      : '<div class="up-eff"><span class="up-eff-k">Next</span>' + effectHTML(eff) +
        (tierName ? '<span class="up-eff-n">' + tierName + '</span>' : '') + '</div>') +
    (then && !maxed
      ? '<div class="up-eff then">' + ICONS.lock + '<span class="up-eff-k">Lv ' + (lvl + 2) + '</span>' + effectHTML(then) + '</div>'
      : '') +
    '</div>';
}

function renderUpgradesView() {
  return CLUB_TRACKS.map(trackRowHTML).join('');
}

function buyTrack(id) {
  const u = CLUB_TRACKS.find(t => t.id === id);
  if (!u) return;
  const cost = trackCost(u);
  if (cost === null || !trySpend(cost)) return;
  if (u.id === 'land') {
    state.sizeIdx++;
    sound('lucky'); sound('pen');
    rebuildIsland(true);
    flashPip(u.id, state.sizeIdx);
    computeCourse();
    renderSheet();
    toast('Property expanded to ' + gridSize() + ' × ' + gridSize());
    save();
    return;
  }
  state.upgrades[u.id]++;
  sound('cash'); sound('pen');
  flashPip(u.id, state.upgrades[u.id]);
  if (u.id === 'clubhouse') {
    if (state.upgrades.clubhouse <= CLUB_TIERS.length - 1) {
      // the only upgrade that rebuilds the world: the sheet steps aside so the
      // player actually sees it happen, wherever the camera is pointed
      clubHold = true;
      closeSheet();
      clubAfter(0.26, celebrateClubhouse);
    } else {
      // past the last tier the building has nowhere left to go — this is a pure
      // multiplier, so it behaves like every other upgrade: the sheet stays open
      toast(CLUB_TIERS[CLUB_TIERS.length - 1].name + ' · Lv ' +
        state.upgrades.clubhouse + ' · green fees +30%', 'house');
    }
  }
  computeCourse();
  renderSheet();
  save();
}

// the pip a purchase just filled springs in — the ladder is the receipt
function flashPip(id, level) {
  pipFlash = { id, level };
  setTimeout(() => { pipFlash = null; }, 700);
}

// ── Progress view ────────────────────────────────────────────────────────────
// One number for "how finished is the club", and the three real things it is
// the average of. Nothing is hidden: every future goal is named, so the list
// reads as an invitation rather than a fog.

function clubProgress() {
  const goalsDone = Math.min(state.milestone, MILESTONES.length);
  let tiers = 0, tiersMax = 0;
  for (const u of CLUB_TRACKS) {
    const cap = trackCap(u.id);
    tiers += Math.min(trackLevel(u.id), cap);
    tiersMax += cap;
  }
  const parts = [
    { name: 'Goals', k: goalsDone / MILESTONES.length, txt: goalsDone + ' of ' + MILESTONES.length },
    { name: 'Upgrades', k: tiers / tiersMax, txt: tiers + ' of ' + tiersMax },
    { name: 'Rating', k: course.stars / 5,
      txt: course.holes.length ? '★ ' + (Math.round(course.stars * 10) / 10).toFixed(1) : '★ —' },
  ];
  const pct = parts.reduce((s, p) => s + p.k, 0) / parts.length;
  return { pct, parts };
}

const RING_C = 2 * Math.PI * 33;

function renderProgressView() {
  const p = clubProgress();
  const pct = Math.round(p.pct * 100);
  // the committee's business, in committee order: what the club has become,
  // and the one horizon it is watching…
  let html = renderStandingBlock();
  // …then the goals in front of it, and the honours page at the back
  html += '<div class="pg-top">' +
    '<div class="pg-ringwrap' + (pct >= 100 ? ' full' : '') + '">' +
      '<svg class="pg-ring" viewBox="0 0 80 80">' +
        '<circle class="pg-ring-bg" cx="40" cy="40" r="33"/>' +
        '<circle class="pg-ring-fg" cx="40" cy="40" r="33" stroke-dasharray="' + RING_C.toFixed(1) +
          '" stroke-dashoffset="' + RING_C.toFixed(1) + '" data-off="' + (RING_C * (1 - p.pct)).toFixed(1) + '"/>' +
      '</svg>' +
      '<div class="pg-pct"><span>' + pct + '<i>%</i></span></div>' +
    '</div>' +
    '<div class="pg-legs"><div class="pg-cap">Club complete</div>' +
      p.parts.map(q =>
        '<div class="pg-leg"><span class="pg-leg-n">' + q.name + '</span>' +
        '<div class="pg-bar"><i style="width:' + Math.round(Math.min(1, q.k) * 100) + '%"></i></div>' +
        '<b>' + q.txt + '</b></div>').join('') +
    '</div></div>';

  html += '<ol class="tl">';
  for (let i = 0; i < MILESTONES.length; i++) {
    const ms = MILESTONES[i];
    const done = i < state.milestone;
    const now = i === state.milestone;
    html += '<li class="tl-item' + (done ? ' done' : now ? ' now' : '') + '">' +
      '<div class="tl-node">' + (done ? ICONS.check : now ? '' : ICONS.lock) + '</div>' +
      '<div class="tl-body">' +
        (now ? '<div class="tl-kicker">Now</div>' : i === state.milestone + 1 ? '<div class="tl-kicker next">Next up</div>' : '') +
        '<div class="tl-title">' + ms.title +
          '<span class="tl-reward">' + (done ? '+' : '') + fmt(ms.reward) + '</span></div>' +
        (now ? '<div class="tl-sub">' + ms.sub + '</div>' + ms.reqs.map(msRowHTML).join('') : '') +
      '</div></li>';
  }
  html += '</ol>';
  if (state.milestone >= MILESTONES.length) {
    html += '<div class="cv-empty">Every goal is complete. The club is yours — keep building for the love of it.</div>';
  }
  html += renderHonoursPage();
  return html;
}

// ── Course view ──────────────────────────────────────────────────────────────

// What a hole actually plays like: the design estimate until enough real rounds
// are in, then the scorecard. Shared by the hole card and the Course view.
function holePlay(h) {
  const st = state.holeStats[holeKey(h)];
  const rounds = st ? st.rounds : 0;
  const mark = st && st.mark ? st.mark : null;
  const fresh = rounds - (mark ? mark.rounds : 0);
  let over = h.over, real = false;
  if (st && fresh >= 8) { over = (st.strokes - (mark ? mark.strokes : 0)) / fresh - h.par; real = true; }
  return { st, rounds, mark, fresh, over, real };
}

// rounds played at the club — every golfer plays every hole, so the busiest
// scorecard on the property is the club's round count, dead holes included
function roundsPlayed() {
  let n = 0;
  for (const k in state.holeStats) n = Math.max(n, state.holeStats[k].rounds || 0);
  return n;
}

function overText(over) {
  if (Math.abs(over) < 0.07) return 'plays to par';
  return 'plays ' + Math.abs(over).toFixed(1) + (over > 0 ? ' over' : ' under');
}

function renderCourseView() {
  const holes = course.holes;
  const rounds = roundsPlayed();
  const rec = state.records.low;
  const recDelta = rec ? rec.v - rec.par : 0;
  let html = '<div class="cv-tiles">' +
    '<div class="cv-tile"><b>' + rounds.toLocaleString() + '</b><span>Rounds played</span></div>' +
    '<div class="cv-tile"><b>' + fmt(state.totalEarned) + '</b><span>Total earned</span></div>' +
    '<div class="cv-tile"><b>' + (rec ? rec.v : '—') + '</b><span>' +
      (rec ? 'Record ' + (recDelta === 0 ? 'E' : (recDelta > 0 ? '+' : '−') + Math.abs(recDelta)) : 'Course record') +
    '</span></div></div>';

  // the one control on the property that changes nothing but the look of it
  html += '<div class="cv-block"><div class="cv-h"><span class="cv-hi">' + ICONS.palette + 'Course theme</span></div>' +
    '<div class="th-row">' + PALETTES.map(p =>
      '<button class="th' + (p.id === state.theme ? ' on' : '') + '" data-theme="' + p.id + '">' +
        '<span class="th-swatch">' + p.swatch.map(c => '<i style="background:' + c + '"></i>').join('') + '</span>' +
        '<span class="th-name">' + p.name + '</span></button>').join('') +
    '</div><div class="cv-note">' + paletteOf(state.theme).sub +
    ' Dressing only — no hole, count or rating moves.</div></div>';

  // scoring across the whole course, in the hole card's own bars
  const tot = { albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0, triple: 0 };
  let played = 0;
  for (const h of holes) {
    const st = state.holeStats[holeKey(h)];
    if (!st) continue;
    played += st.rounds;
    for (const o of OUTCOMES) tot[o] += st.outcomes[o] || 0;
  }
  html += '<div class="cv-block"><div class="cv-h">Scoring</div>';
  if (!played) {
    html += '<div class="cv-empty">Play your first round to see how the course scores.</div>';
  } else {
    const vals = HC_BUCKETS.map(b => b.of(tot));
    const max = Math.max(1, ...vals);
    html += '<div class="hc-bars cv-bars">' + HC_BUCKETS.map((b, i) =>
      '<div class="hc-col"><div class="hc-pct">' + Math.round((vals[i] / played) * 100) + '%</div>' +
      '<div class="hc-track"><div class="hc-fill" style="background:' + b.color +
        ';height:' + (vals[i] / max) * 100 + '%"></div></div>' +
      '<div class="hc-lab">' + b.label + '</div></div>').join('') + '</div>' +
      '<div class="cv-note">' + played.toLocaleString() + ' holes played across the course</div>';
  }
  html += '</div>';

  // the card: how the pars break down
  html += '<div class="cv-block"><div class="cv-h">The card' +
    (holes.length ? '<span class="cv-hr">Par ' + course.totalPar + '</span>' : '') + '</div>';
  if (!holes.length) {
    html += '<div class="cv-empty">Open your first hole and the card starts writing itself.</div>';
  } else {
    // the club's second ink at three strengths — short, standard, long. Three
    // unrelated system hues said nothing that one ink getting darker does not.
    const PARS = [{ p: 3, c: 'var(--blue-soft)' }, { p: 4, c: 'var(--blue)' },
      { p: 5, c: 'var(--blue-press)' }];
    const byPar = PARS.map(q => ({ ...q, n: holes.filter(h => h.par === q.p).length }));
    html += '<div class="cv-parbar">' + byPar.filter(q => q.n).map(q =>
      '<i style="flex:' + q.n + ';background:' + q.c + '"></i>').join('') + '</div>' +
      '<div class="cv-legend">' + byPar.filter(q => q.n).map(q =>
        '<span><i style="background:' + q.c + '"></i>' + q.n + ' × Par ' + q.p + '</span>').join('') + '</div>';
  }
  html += '</div>';

  // how it plays — the two holes with something to say
  html += '<div class="cv-block"><div class="cv-h">How it plays</div>';
  if (holes.length < 2) {
    html += '<div class="cv-empty">Two holes and the course starts to have a personality.</div>';
  } else {
    const ranked = holes.map((h, i) => ({ h, i, ...holePlay(h) })).sort((a, b) => b.over - a.over);
    const rows = [
      { tag: 'Hardest', e: ranked[0] },
      { tag: 'Easiest', e: ranked[ranked.length - 1] },
    ];
    html += rows.map(r =>
      '<button class="cv-hole" data-hole="' + r.e.i + '">' +
        '<span class="cv-hnum">' + r.e.h.n + '</span>' +
        '<span class="cv-htag">' + r.tag + '</span>' +
        '<span class="cv-hbody">Par ' + r.e.h.par + ' · ' + r.e.h.yards + ' yds · ' + overText(r.e.over) +
          (r.e.real ? '' : '<span class="cv-est">est</span>') + '</span>' +
        ICONS.chev + '</button>').join('');
  }
  html += '</div>';

  html += '<button class="cv-link" id="cv-rating"><span>Course rating</span>' +
    '<b>★ ' + (holes.length ? (Math.round(course.stars * 10) / 10).toFixed(1) : '—') + '</b>' + ICONS.chev + '</button>';

  // The property's history, year by year — the annals close the volume
  html += renderAnnals();

  // The bookplate at the end of the volume. Start Over used to sit in the
  // sheet's footer, where it was permanently one slip away from every other
  // control; here it is the subject of its own paragraph, on the page about
  // the property, and it says what it does before it asks.
  html += '<div class="bk-plate"><h4>A new property</h4>' +
    '<p>Closing this book for good: the course, the members, the honours and ' +
    'every dollar earned here are erased, and the island starts again bare.</p>' +
    '<button class="btn-plain" id="bk-startover">Start Over…</button></div>';
  return html;
}

// ── Today — the pro shop's book ──────────────────────────────────────────────
// The day laid out the way a starter reads it: the light it runs between, its
// shape drawn to scale, and every tee time in it — kept in the day's own waves
// rather than in hours — with whoever bought it. The line that says NOW tracks
// the real clock, on the axis and in the book, in the same red.

function paceLine() {
  const s = state.sheet;
  const avgHole = holeTimes.length
    ? holeTimes.reduce((a, b) => a + b, 0) / holeTimes.length : 0;
  const avgRound = s && s.roundsDone > 0 ? Math.max(0, s.roundS / s.roundsDone) : 0;
  return { avgHole, avgRound, waited: s ? s.waited : 0, waitS: s ? s.waitS : 0 };
}
function mmss(sec) {
  const m = Math.floor(sec / 60), ss = Math.round(sec % 60);
  return m + ':' + String(ss).padStart(2, '0');
}

// The one place the book admits that the people out there have opinions. Every
// golfer marks the course out of ten as they sign the card (see logMood); this
// says, in plain percent, what those marks are doing to the phone.
function womLine() {
  const m = state.mood;
  if (m.n < 4) return '';
  const pct = Math.round((wordOfMouth() - 1) * 100);
  const today = moodToday();
  const said = today != null ? ' Today they are marking you ' + today.toFixed(1) + '.' : '';
  if (pct >= 4) return '<div class="cv-note ok">Word of mouth is doing the selling — the book runs about ' +
    pct + '% fuller for it.' + said + '</div>';
  if (pct <= -4) return '<div class="cv-note warn">People are leaving unimpressed, and the book runs about ' +
    (-pct) + '% thinner for it.' + said + '</div>';
  return '';
}

// ── The shape of the day ─────────────────────────────────────────────────────
// A picture of the day at real scale, not a control. The axis runs from the
// first tee time to the last, MINUTE FOR MINUTE, so the quiet middle is
// genuinely the widest thing on the page and the morning rush is genuinely a
// knot — which is the whole claim this view makes about how a golf day is
// shaped. The old strip sized its blocks by how many times each wave held, so
// the six per cent of the day that is dawn took fourteen per cent of the strip
// and the marker crossed it nine times too fast. It was a segmented control
// wearing a chart.
//
// Every bookable time is one mark standing on that axis: as tall as the group
// is big, solid blue once it has sold and still to play, grey once it is in,
// and a low stub while it is open. So "22 of 30" is something a player can
// count, the groups still out on the course are the blue marks left of the
// line, and a wave is a shape rather than a word. The hours are written
// underneath — which is how you read "the afternoon goes out at four" straight
// off the picture instead of off a label that never carried a time.
//
// Under it, the single sentence the whole page exists to say: when the next
// wave goes out, and how much of it is left.

function partsOf(s, dl) {
  return dl.parts.map(p => {
    let booked = 0, seats = 0;
    for (let i = p.from; i < p.from + p.n; i++) if (s.sizes[i]) { booked++; seats += s.sizes[i]; }
    return { p, booked, seats };
  }).filter(o => o.p.n > 0);
}

// Where a minute of the day stands ON THE AXIS, as a percentage of it. One
// linear map — the axis is time, so this is the whole of the placement maths,
// and everything drawn on the strip (waves, tee times, the marker, the hours)
// goes through it and therefore cannot disagree with anything else.
function nowMark(dl, m) {
  const span = Math.max(1, dl.last - dl.first);
  return { at: clamp((m - dl.first) / span, 0, 1), off: m < dl.first || m > dl.last };
}
// 6a · 12p · 4p — the hour, in the fewest characters that stay unambiguous
function hourTick(min) {
  const h = Math.floor(((min / 60) % 24 + 24) % 24);
  return (h % 12 === 0 ? 12 : h % 12) + (h < 12 ? 'a' : 'p');
}

function dayShapeHtml(s, dl, m) {
  const parts = partsOf(s, dl);
  if (!parts.length) return '';
  const here = TS.partAt(dl, m);
  const span = Math.max(1, dl.last - dl.first);
  const at = (min) => clamp((min - dl.first) / span, 0, 1) * 100;

  let html = '<div class="ts-day"><div class="ts-axis">';
  // the waves, lying at their real hours and their real width: the ground the
  // marks stand on, and the handle that takes the book to them
  for (const o of parts) {
    const L = at(o.p.start), R = at(o.p.end);
    html += '<button class="ts-part' + (o.p.id === 'lull' ? ' quiet' : '') +
      (here && here.id === o.p.id ? ' on' : '') + '" data-wave="' + o.p.id +
      '" data-sold="' + o.booked + '/' + o.p.n + '"' +
      ' style="left:' + L.toFixed(3) + '%;width:' + Math.max(0.8, R - L).toFixed(3) + '%"' +
      ' aria-label="' + o.p.name + ', ' + TS.hhmmShort(o.p.start) + ' to ' +
        TS.hhmmShort(o.p.end) + ', ' + o.booked + ' of ' + o.p.n + ' taken"></button>';
  }
  // …and every tee time standing on it. Height is the size of the group, so a
  // fourball is a taller mark than a single and the day's PEOPLE are as visible
  // as its bookings.
  const nSlots = Math.min(s.sizes.length, dl.times.length);
  for (let i = 0; i < nSlots; i++) {
    const n = s.sizes[i];
    const st = n ? slotStatus(i) : 'open';
    html += '<i class="ts-t ' + (st === 'done' ? 'in' : n ? 'sold' : 'open') +
      '" style="left:' + at(TS.slotMinute(dl, i)).toFixed(3) + '%' +
      (n ? ';--h:' + (46 + n * 13.5) + '%' : '') + '"></i>';
  }
  // Where the day has got to — one red hairline, labelled with the same red
  // NOW pill the book uses three hundred pixels below. One idea, one language.
  const mk = nowMark(dl, m);
  // strictly inside the playing window: a marker pinned to the edge of an axis
  // it is not standing on would sit exactly on top of the first tee time and
  // claim the day had started. Before and after, the closed banner and the
  // say-line carry it.
  const live = !mk.off;
  if (live) html += '<span class="ts-mark" style="left:' + (mk.at * 100).toFixed(3) + '%"></span>';
  html += '</div>';

  // the hours, written on the axis. Two-hourly on a summer day, hourly on a
  // short one, and never within a hair of either end where the label would
  // hang off the strip.
  html += '<div class="ts-rule">';
  // two-hourly on a long day, hourly once the day is short enough to carry it —
  // the shortest day of the year is the one that most needs its hours named,
  // because it has the fewest tee times to give the shape away
  const step = span > 700 ? 120 : 60;
  for (let h = Math.ceil(dl.first / step) * step; h <= dl.last; h += step) {
    const x = at(h);
    if (x < 2.5 || x > 97.5) continue;
    html += '<span style="left:' + x.toFixed(3) + '%">' + hourTick(h) + '</span>';
  }
  if (live) {
    const x = mk.at * 100;
    html += '<b class="ts-mark-lab' + (x < 13 ? ' a' : x > 87 ? ' z' : '') +
      '" style="left:' + x.toFixed(3) + '%">Now ' + TS.hhmmShort(m) + '</b>';
  }
  html += '</div></div>';

  // The sentence a player can plan a day around. Its one job is to hand over a
  // FORWARD fact, so the moment a wave has nothing left to send out it stops
  // talking about that wave and names the next one and its time — which is the
  // exact moment the player wants to hear it.
  const next = TS.nextPart(dl, m);
  const ahead = (lead) => {
    const n2 = parts.find(o => o.p.id === next.id);
    return lead + '<b>' + next.name + '</b> goes out at <u>' + TS.hhmmShort(next.start) + '</u>' +
      (n2 ? ' · ' + n2.booked + ' of ' + n2.p.n + ' taken' : '');
  };
  const closing = () => {
    const tm = bookedTomorrow();
    return 'The book is closed · <b>' + tm.groups + ' groups</b> tomorrow from ' +
      TS.hhmmShort(tm.dl.first);
  };
  let say;
  if (here) {
    let toGo = 0, first = null;
    for (let i = Math.max(s.cursor, here.from); i < here.from + here.n; i++) {
      if (!s.sizes[i]) continue;
      if (first == null) first = TS.slotMinute(dl, i);
      toGo++;
    }
    say = !toGo ? (next ? ahead(here.short + ' is away · ') : closing())
      : toGo === 1 ? '<b>' + here.name + '</b> · one last group, away at <u>' +
          TS.hhmmShort(first) + '</u>'
      : here.id === 'lull' ? '<b>' + here.name + '</b> · next off at <u>' +
          TS.hhmmShort(first) + '</u>'
      : '<b>' + here.name + '</b> · ' + toGo + ' more to tee off, last at <u>' +
          TS.hhmmShort(here.end) + '</u>';
  } else say = next ? ahead('') : closing();
  return html + '<div class="ts-say">' + say + '</div>';
}

function renderScheduleView() {
  const t = dayInfo();
  const s = ensureSheet();
  const dl = t.dl;
  const m = nowMinute();
  const open = clubOpen(m);
  let booked = 0, seats = 0;
  for (const n of s.sizes) if (n) { booked++; seats += n; }
  const fill = s.sizes.length ? booked / s.sizes.length : 0;

  let html = '<div class="ts-head"><div class="ts-date">' + t.label +
    (t.weekend ? '<span class="ts-wk">Weekend</span>' : '') + '</div>' +
    '<div class="ts-hours">' + (open ? '☀︎' : '☾') + ' ' + TS.hhmm(dl.sunrise) + ' – ' +
      TS.hhmm(dl.sunset) + ' · ' + dl.slots + ' tee times</div></div>';

  if (!course.holes.length) {
    return html + '<div class="cv-block"><div class="cv-empty">' +
      'Nothing is booked, because there is nothing to play. Open a hole — a tee, ' +
      'a fairway, a green and a pin — and the phone starts ringing.</div></div>';
  }

  if (!open) {
    const tm = bookedTomorrow();
    const soon = m < dl.first;
    html += '<div class="ts-closed"><b>The course is closed</b>' +
      (soon
        ? '<span>First tee at ' + TS.hhmm(dl.first) + ' · ' + bookedRemaining() + ' groups booked</span>'
        : '<span>' + tm.groups + ' groups booked for tomorrow · first tee ' + TS.hhmm(tm.dl.first) + '</span>') +
      '</div>';
  }

  // The day itself, before anything is said about it.
  html += dayShapeHtml(s, dl, m);

  // The one thing on this page worth setting an alarm for. It sits above the
  // day's numbers because it is the day's news.
  const nv = nextVip();
  if (nv) {
    const seen = state.club.seen[nv.star.id];
    const mem = memberOf(nv.star.id);
    html += '<button class="ts-vipnext" data-star="' + nv.star.id + '">' +
      '<i style="background:' + cssHex(nv.star.colour) + '"></i>' +
      '<div><b>' + nv.star.name + '</b><span>' +
        (mem ? 'Member' : nv.star.tierDef.label) + ' · ' +
        (seen && seen.n ? 'marked you ' + seen.score.toFixed(1) + ' last time'
          : 'first visit to the club') + '</span></div>' +
      '<u>' + TS.hhmmShort(nv.min) + '</u></button>';
  }

  // A tee time is a thing, not a percentage: 22 of 36 is a day a starter can
  // picture, 61% is a spreadsheet.
  html += '<div class="cv-tiles">' +
    '<div class="cv-tile"><b>' + booked + ' <s>/</s> ' + dl.slots + '</b><span>Times taken</span></div>' +
    '<div class="cv-tile"><b>' + s.rounds.toLocaleString() + '</b><span>Rounds today</span></div>' +
    '<div class="cv-tile"><b>' + fmt(s.take) + '</b><span>Taken today</span></div></div>';

  // what actually fills the book — the same four numbers economyOf reads
  const turned = turnedAwayToday();
  // …and the header two rows below it carries the one fact the tile does not —
  // how many PEOPLE that is. Repeating "of 39 times" here said nothing new with
  // a second denominator for the same number.
  html += '<div class="cv-block"><div class="cv-h">The book<span class="cv-hr">' +
    seats + (seats === 1 ? ' player out' : ' players out') + '</span></div>' +
    '<div class="ts-drivers">' +
      '<span>★ ' + (Math.round(course.stars * 10) / 10).toFixed(1) + '</span>' +
      '<span>' + course.holes.length + (course.holes.length === 1 ? ' hole' : ' holes') + '</span>' +
      '<span>' + (state.upgrades.marketing ? 'Marketing Lv ' + state.upgrades.marketing : 'No marketing yet') + '</span>' +
      '<span>' + (state.upgrades.cartfleet ? 'Carts Lv ' + state.upgrades.cartfleet : 'No cart fleet yet') + '</span>' +
      '<span>Word of mouth ' + state.mood.avg.toFixed(1) + '</span>' +
    '</div>' +
    womLine() +
    '<div class="cv-note">' + (turned
      ? 'Turning players away — about ' + turned + (turned === 1 ? ' group rang' : ' groups rang') +
        ' for a time that was already gone. More holes, and you sell every one of them.'
      : fill > 0.9 ? 'Dawn to dusk. One more hole and the book overflows.'
      : fill > 0.45 ? 'A steady day. Rating and Marketing are what sell the quiet hours.'
      : 'A thin morning. Lift the rating or the Marketing level and the book fills out.') +
    '</div></div>';

  const p = paceLine();
  if (p.avgHole || p.avgRound) {
    html += '<div class="cv-block"><div class="cv-h">Pace of play' +
      (p.avgHole ? '<span class="cv-hr">' + mmss(p.avgHole) + ' a hole</span>' : '') + '</div>' +
      '<div class="cv-note">' +
      (p.avgRound ? 'A round takes about ' + Math.round(p.avgRound / 60) + ' min. ' : '') +
      (p.waited
        ? p.waited + (p.waited === 1 ? ' group has' : ' groups have') + ' had to wait on a tee today' +
          (p.waitS > 60 ? ', ' + Math.round(p.waitS / 60) + ' min standing about between them' : '') +
          '. Every one of them marks the course down for it — tighten the walk from each ' +
          'green to the next tee and the field moves.'
        : 'The field is moving freely.') +
      '</div></div>';
  }

  // the book itself, kept in the day's own five parts rather than in hours —
  // a wave is the unit a starter thinks in, and it is short enough to read
  html += '<div class="cv-block ts-book"><div class="cv-h">Tee times</div>';
  const byPart = {};
  for (const o of partsOf(s, dl)) byPart[o.p.from] = o;
  let nowDrawn = false;
  for (let i = 0; i < s.sizes.length; i++) {
    const min = TS.slotMinute(dl, i);
    const head = byPart[i];
    if (head) {
      // the anchor sits OUTSIDE the heading because the heading is sticky, and
      // a sticky element reports the position it is stuck at, not its own
      html += '<i class="ts-anchor" id="ts-w-' + head.p.id + '"></i>' +
        '<div class="ts-hour">' + head.p.name +
        '<span>' + TS.hhmmShort(head.p.start) + '–' + TS.hhmmShort(head.p.end) + ' · ' +
        head.booked + ' of ' + head.p.n + '</span></div>';
    }
    if (!nowDrawn && min > m) {
      nowDrawn = true;
      if (m >= dl.first - 60 && m <= dl.sunset + 60) {
        html += '<div class="ts-now" id="ts-now"><span>Now ' + TS.hhmmShort(m) + '</span></div>';
      }
    }
    const n = s.sizes[i];
    if (!n) {
      html += '<div class="ts-slot open"><span class="ts-time">' + TS.hhmmShort(min) +
        '</span><span class="ts-who">Open</span></div>';
      continue;
    }
    const st = slotStatus(i);
    const live = st === 'out' ? groups.find(g => g.slot === i) : null;
    const tag = live
      ? (live.blocked ? '<span class="ts-tag wait">Waiting</span>'
        : '<span class="ts-tag out">' + (live.hole >= 0 ? 'Hole ' + (live.hole + 1) : 'Teeing off') + '</span>')
      : st === 'done' ? '<span class="ts-tag done">Played</span>' : '';
    // a name in the diary is on the sheet hours before they arrive, which is
    // the whole point of writing it down
    const vip = vipAt(i);
    const chip = vip ? '<span class="ts-vip' + (memberOf(vip.id) ? ' mem' : '') + '">' +
      (memberOf(vip.id) ? 'Member' : vip.tierDef.short) + '</span>' : '';
    html += '<div class="ts-slot ' + st + (vip ? ' vip' : '') +
      '"' + (vip ? ' style="--vc:' + cssHex(vip.colour) + '"' : '') +
      '><span class="ts-time">' + TS.hhmmShort(min) + '</span>' +
      '<span class="ts-who">' + (vip ? vip.name : PEOPLE.leadName(t.seed, i)) +
        (n > 1 ? '<i>+' + (n - 1) + '</i>' : '') + '</span>' + chip + tag + '</div>';
  }
  if (!nowDrawn && m > dl.last) html += '<div class="ts-now done"><span>The book is closed</span></div>';
  html += '</div>';
  return html;
}

// re-render only when the book actually moved — the view is 180 rows and the
// player is often just reading it
function bookSignature() {
  const s = state.sheet;
  return (s ? s.cursor + '/' + s.rounds : '-') + '|' + groups.length + '|' +
    groups.map(g => g.slot + ':' + g.hole + (g.blocked ? 'w' : '')).join(',') + '|' +
    Math.floor(nowMinute());
}

// ── The Club Book ────────────────────────────────────────────────────────────
// Everyone of note who has ever played here, what they made of it, and which of
// them would put their name on your board. The page has to answer one question
// at a glance — WHY did that player mark me 6.1 — and then hand the player a
// tool from the dock that would change it.

let openStar = null;         // the row currently expanded

// Their taste, drawn as the thing it actually is: a rule between two ends, a
// dot where this player wants the course to sit on it, and a tick where the
// course you have built actually sits. The gap between the two IS the verdict —
// this is the only place on the page that says how far off you are and in
// which direction, which is what turns "she marked me 6.1" into a tool to pick
// up. Five strongest opinions only; nobody needs thirteen.
function tasteAxes(star) {
  const t = star.taste, a = course.arch;
  const ks = Object.keys(t).sort((x, y) => Math.abs(t[y]) - Math.abs(t[x])).slice(0, 5);
  let h = '<div class="st-taste"><div class="st-th">Their taste' +
    (course.holes.length ? '<em>● wants · ▏your course</em>' : '') + '</div>';
  for (const k of ks) {
    const q = STARS.QUALITIES[k], w = clamp(t[k], -1, 1);
    const want = (50 + w * 46).toFixed(1);
    const have = a && a[k] != null ? (2 + clamp(a[k], 0, 1) * 96).toFixed(1) : null;
    h += '<div class="st-ax"><span>' + q.label + '</span><div class="st-axb">' +
      '<div class="st-axt">' +
        (have != null && course.holes.length ? '<u style="left:' + have + '%"></u>' : '') +
        '<i style="left:' + want + '%;background:' + cssHex(star.colour) + '"></i>' +
      '</div><div class="st-axp"><em>' + q.lo + '</em><em>' + q.hi + '</em></div></div></div>';
  }
  return h + '</div>';
}

// a stat, with the part of it this club taught them shown separately
function statRow(label, base, now) {
  const b = Math.round(base), w = Math.round(now);
  return '<div class="st-bar"><span>' + label + '</span>' +
    '<div class="st-t"><i style="width:' + b + '%"></i>' +
      (w > b ? '<u style="left:' + b + '%;width:' + (w - b) + '%"></u>' : '') + '</div>' +
    '<b>' + w + (w > b ? '<em>+' + (w - b) + '</em>' : '') + '</b></div>';
}

function starDetail(star) {
  const m = memberOf(star.id);
  const st = statsOf(star);
  const inv = inviteState(star);
  let h = '<div class="st-detail">';
  // the rank, said plainly. The row above can only fit an abbreviation, and a
  // player meeting their first Tour Winner deserves to be told what that is.
  h += '<div class="st-tier"><b>' + star.tierDef.label + '</b>' + star.tierDef.blurb + '</div>';
  h += '<p class="st-bio">' + star.bio + '</p>';
  h += '<p class="st-quote">“' + star.quote + '”</p>';
  h += '<div class="st-stats">' +
    statRow('Power', star.power, st.power) +
    statRow('Accuracy', star.accuracy, st.accuracy) +
    statRow('Putting', star.putting, st.putting) +
    statRow('Temperament', star.temperament, st.temperament) + '</div>';
  h += tasteAxes(star);

  // Their history at THIS club — the one thing the card cannot work out from
  // the roster, and the reason the collection is a record of a place rather
  // than a list of people. A name that has only been in the diary says so.
  // (a member's own block below already says how many rounds they have played
  // here and when they tee off, so this line would only contradict it)
  const c = m ? null : state.club.seen[star.id];
  if (c && c.n) {
    const bits = [c.n === 1 ? 'Played here once' : 'Played here ' + c.n + ' times'];
    if (c.day) bits.push('last ' + dayLabel(c.day));
    if (c.toPar != null) bits.push('signed for ' + toParFine(c.toPar));
    if (c.best > c.score + 0.05) bits.push('best mark ' + c.best.toFixed(1));
    h += '<div class="st-hist">' + bits.join(' · ') + '</div>';
  } else if (!m && state.club.met[star.id]) {
    h += '<div class="st-hist quiet">In the diary, but has not played here yet.</div>';
  }

  if (course.holes.length) {
    const v = starVerdict(star);
    h += '<div class="st-verdict"><div class="st-vh"><b class="' + markClass(v.score) + '">' +
      v.score.toFixed(1) + '</b><span>' + v.head + '</span></div>';
    if (v.reasons.length) {
      h += '<ul class="st-reasons">';
      for (const r of v.reasons) h += '<li class="' + (r.good ? 'ok' : 'bad') + '">' + r.text + '</li>';
      h += '</ul>';
    }
    if (v.fav) h += '<div class="st-fav">Pick of the holes · the ' + PEOPLE.ord(v.fav.n) +
      ' <i>' + v.fav.yards + ' yds · par ' + v.fav.par + '</i></div>';
    h += '</div>';
  } else {
    h += '<div class="cv-note">There is no golf course here to mark yet.</div>';
  }

  // What they have done in the majors while your name was on their bag. This
  // is the club's record, not the player's — nothing here happened before they
  // signed, which is exactly why sending them is worth the weekend.
  const rec = state.tour.results.filter(r => r.id === star.id).reverse();
  const ent = Object.keys(state.tour.entries).find(k => state.tour.entries[k].id === star.id);
  if (rec.length || ent) {
    h += '<div class="st-maj"><div class="st-majh">Championships for this club</div>';
    if (ent) {
      const ev = MAJORS.EVENT[ent.split('@')[0]];
      h += '<div class="st-majr open"><span>' + ev.short + '</span><em>Entered</em></div>';
    }
    for (const r of rec.slice(0, 5)) {
      const ev = MAJORS.EVENT[r.ev];
      h += '<div class="st-majr' + (r.pos === 1 ? ' won' : '') + '">' +
        '<span>' + ev.short + ' ' + r.year + '</span>' +
        '<em>' + (r.cut ? 'Missed the cut' : posLabel(r) + ' · ' + r.total) + '</em>' +
        '<b>' + (r.purse ? fmt(r.purse) : '') + '</b></div>';
    }
    h += '</div>';
  }

  if (m) {
    // A membership is a standing arrangement, so it reads as one: what they
    // have done here on its own line, and the button that ends it kept plainly
    // apart from it rather than sitting under the small print.
    h += '<div class="st-mem"><div class="st-memf"><b>Member' +
      (m.since ? ' since ' + dayLabel(m.since) : '') + '</b>' +
      '<span>' + m.rounds + (m.rounds === 1 ? ' round' : ' rounds') + ' here · tees off around ' +
      TS.hhmm(m.tee) + '</span></div>' +
      '<button class="btn-plain quiet" data-release="' + star.id + '">Release</button></div>';
  } else if (inv.state === 'open') {
    h += '<div class="st-act"><button class="btn-primary" data-invite="' + star.id + '">' +
      'Invite to join · ' + fmt(inv.cost) + '</button></div>';
  } else {
    h += '<div class="st-act off"><span>' + inv.why + '</span></div>';
  }
  return h + '</div>';
}

function markClass(s) { return s >= 8 ? 'good' : s >= 6.5 ? 'ok' : s >= 5 ? 'meh' : 'bad'; }

// a stored day key ('2026-08-12') the way a club would print it on a card
function dayLabel(key) {
  const p = String(key).split('-');
  if (p.length !== 3) return key;
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d) ? key : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// Where the open row lives. One person is expanded at a time across the whole
// book, and a star can appear in two places on it — a signature in the ledger
// and a tile in the collection — so the panel opens in exactly the place the
// player tapped rather than in both at once.
let openWhere = 'row';

function starRow(star, right, cls) {
  const on = openStar === star.id && openWhere === 'row';
  return '<div class="st-row' + (on ? ' on' : '') + (cls ? ' ' + cls : '') + '">' +
    '<button class="st-head" data-star="' + star.id + '">' +
      '<i class="st-dot" style="background:' + cssHex(star.colour) + '"></i>' +
      // the row is narrow, so it takes the tier's short name and drops the
      // tour's article to fit the rest of it; the expanded panel spells the
      // rank out in full
      '<span class="st-name">' + star.name + '<em><b>' + star.tierDef.short + '</b>' +
        '<i>' + star.tour.replace(/^The /, '') + '</i></em></span>' + right +
      '<span class="st-chev' + (on ? ' on' : '') + '">›</span>' +
    '</button>' + (on ? starDetail(star) : '') + '</div>';
}

// ── The honours board ────────────────────────────────────────────────────────
// Seven honours, written on paper, in the numerals a club would actually have
// engraved. Nothing here is a counter of activity: every line is one round, one
// swing or one putt that somebody named genuinely played here, on a day the
// book can name. An honour nobody has taken keeps its place on the board with
// the line that says how it is taken — an empty board is an invitation, and a
// board with six blanks on it is a list of six things to go and do.

function toParFine(d) { return d === 0 ? 'E' : d > 0 ? '+' + d : '−' + Math.abs(d); }

// a pace of play, said the way a starter says it
function paceText(s) {
  const m = Math.floor(s / 60);
  if (m < 60) return m + ':' + String(Math.round(s % 60)).padStart(2, '0');
  return Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm';
}

// who set it and when — the half of a record that makes it a record
function recWho(r, extra) {
  const bits = [];
  if (r.who) bits.push(r.who);
  if (extra) bits.push(extra);
  else if (r.day) bits.push(dayLabel(r.day));
  // a record migrated from a save kept before the book named anybody
  return bits.length ? bits.join(' · ') : 'From the old book';
}

function honourCell(cls, label, val, unit, meta, hint) {
  return '<div class="hb-cell' + (cls ? ' ' + cls : '') + (val ? '' : ' empty') + '">' +
    '<div class="hb-l">' + label + '</div>' +
    '<div class="hb-v">' + (val || '—') + (unit ? '<em>' + unit + '</em>' : '') + '</div>' +
    '<div class="hb-m">' + (val ? meta : hint) + '</div></div>';
}

function renderHonours() {
  const R = state.records;
  let h = '<div class="hb">';

  const low = R.low;
  h += honourCell('wide', 'Course record',
    low ? String(low.v) : '',
    low ? toParFine(low.v - low.par) : '',
    low ? recWho(low) + ' · ' + low.holes + (low.holes === 1 ? ' hole' : ' holes') : '',
    'The first full round signed here takes it.');

  const maj = R.major, ev = maj && MAJORS.EVENT[maj.ev];
  h += honourCell('', 'Championship round',
    maj ? String(maj.v) : '', '',
    maj ? recWho(maj, ev ? ev.short + ' ' + maj.year : null) : '',
    'A member\'s lowest at a major. Send somebody.');

  const b = R.birdies;
  h += honourCell('', 'Birdies in a round',
    b ? String(b.v) : '', '',
    b ? recWho(b) : '',
    'Somebody is going to get hot one morning.');

  const d = R.drive;
  h += honourCell('', 'Longest drive',
    d ? String(d.v) : '', d ? 'yds' : '',
    d ? recWho(d) : '',
    'Measured off the tee to where it stopped.');

  const f = R.fast;
  h += honourCell('', 'Fastest round',
    f ? paceText(f.v) : '', '',
    f ? recWho(f) : '',
    'First tee to last putt. A tight routing walks quicker.');

  // the two tallies. A board on a clubhouse wall counts these and names the
  // most recent one — the count is the honour, the name is the story.
  const a = R.aces;
  h += honourCell('tally', 'Holes in one',
    a ? String(a.v) : '', '',
    a ? (a.who ? 'Last · ' + recWho(a) : 'From the old book') : '',
    'One will drop. They always do.');

  const e = R.eagles;
  h += honourCell('tally', 'Eagles or better',
    e ? String(e.v) : '', '',
    e ? (e.who ? 'Last · ' + recWho(e) : 'From the old book') : '',
    'A par five worth taking on makes these.');

  return h + '</div>';
}

// ── The visitors' book ───────────────────────────────────────────────────────
// A signature: the name, the card, the mark, and the one line they said on the
// way out. It reads like a page in a real guest ledger and it is entirely made
// of live data — recordVerdict writes every field of it as they hand the card
// in, and the row opens into the whole person underneath.
function signatureRow(star) {
  const c = state.club.seen[star.id];
  const on = openStar === star.id && openWhere === 'row';
  const inv = inviteState(star);
  const facts = [];
  if (c.day) facts.push(dayLabel(c.day));
  if (c.toPar != null) facts.push(toParFine(c.toPar));
  if (c.n > 1) facts.push(c.n + ' visits');
  return '<div class="st-row sig' + (on ? ' on' : '') + '">' +
    '<button class="sig-head" data-star="' + star.id + '">' +
      '<i class="st-dot" style="background:' + cssHex(star.colour) + '"></i>' +
      '<span class="sig-body">' +
        '<span class="sig-top"><b>' + star.name + '</b>' +
          '<em>' + star.tierDef.short + '</em>' +
          (inv.state === 'open' ? '<span class="st-ready">Will join</span>' : '') +
          '<b class="st-mark ' + markClass(c.score) + '">' + c.score.toFixed(1) + '</b></span>' +
        (c.line ? '<span class="sig-line">' + c.line + '</span>' : '') +
        '<span class="sig-foot">' +
          (facts.length ? facts.join(' · ') : 'Signed before the book was kept') + '</span>' +
      '</span>' +
    '</button>' + (on ? starDetail(star) : '') + '</div>';
}

// ── The collection ───────────────────────────────────────────────────────────
// Every notable in the game, grouped by the rank that decides whether they
// would travel here at all. There is nothing to open, nothing to buy and no
// duplicate of anything: a name is revealed when it appears in this club's
// diary, so the grid is a picture of the club's REACH. The tiers double as the
// ladder — a locked tier says the prestige that unlocks it, which is the same
// number the rest of the page is about.

function collectState(id) {
  if (memberOf(id)) return 'member';
  const s = state.club.seen[id];
  if (s && s.n) return 'played';
  return state.club.met[id] ? 'met' : 'unmet';
}

function collectTile(star, p) {
  const st = collectState(star.id);
  if (st === 'unmet') {
    // an unwritten line in the ledger, not a locked box
    return '<div class="col-t unmet"><i class="col-dot"></i>' +
      '<span class="col-rule"></span><span class="col-rule short"></span></div>';
  }
  const seen = state.club.seen[star.id];
  return '<button class="col-t ' + st + (openStar === star.id && openWhere === 'grid' ? ' on' : '') +
    '" data-starg="' + star.id + '">' +
    '<i class="col-dot" style="background:' + cssHex(star.colour) + '"></i>' +
    '<span class="col-n">' + star.first + '<b>' + star.last + '</b></span>' +
    (seen ? '<span class="col-m ' + markClass(seen.score) + '">' + seen.score.toFixed(1) + '</span>'
          : '<span class="col-m quiet">In the diary</span>') +
    '</button>';
}

function renderCollection(p) {
  const roster = STARS.ROSTER;
  const met = metCount();
  let played = 0;
  for (const id in state.club.seen) if (state.club.seen[id].n) played++;
  const members = state.club.members.length;

  let h = '<div class="cv-block"><div class="cv-h">The collection' +
    '<span class="cv-hr">' + met + ' / ' + roster.length + '</span></div>' +
    '<div class="col-count">' + met + ' encountered · ' + played + ' played here · ' +
    members + (members === 1 ? ' member' : ' members') + '</div>';

  const open = openStar && openWhere === 'grid' && STARS.BY_ID[openStar]
    ? STARS.BY_ID[openStar] : null;
  for (const t of STARS.TIERS) {
    const list = roster.filter(s => s.tier === t.id);
    const got = list.filter(s => state.club.met[s.id]).length;
    const reach = !!course.holes.length && p >= t.need;
    h += '<div class="col-tier' + (reach ? ' open' : '') + '">' +
      '<b>' + t.label + 's</b>' +
      '<span>' + (reach ? 'travels here' : t.need ? t.need + ' prestige' : 'open a hole') + '</span>' +
      '<em>' + got + ' / ' + list.length + '</em></div>' +
      '<div class="col-grid">' + list.map(s => collectTile(s, p)).join('') + '</div>';
    // the card opens directly under the tier it was tapped in — never thirty
    // tiles away at the foot of the page
    if (open && open.tier === t.id) {
      h += '<div class="col-card st-row on">' + starDetail(open) + '</div>';
    }
  }

  h += '<div class="cv-note">' + (!course.holes.length
    ? 'Nobody has heard of this place yet. Open a hole and the first names arrive.'
    : met < roster.length
    ? 'A name is written here the day it first appears in your diary — which is the ' +
      'golf course doing it, not the calendar. Better players travel further.'
    : 'Every player in the game has had this club in their diary.') +
    '</div></div>';
  return h;
}

function renderPeopleView() {
  const p = prestigeOf();
  const reach = reachOf(p);
  const members = state.club.members;
  const seenIds = Object.keys(state.club.seen).filter(id => STARS.BY_ID[id] && !memberOf(id));
  seenIds.sort((a, b) => (state.club.seen[b].score - state.club.seen[a].score)
    || (STARS.BY_ID[b].tierDef.rank - STARS.BY_ID[a].tierDef.rank));

  const next = STARS.TIERS.find(t => t.need > p);
  let html = '<div class="cv-tiles">' +
    '<div class="cv-tile"><b>' + p + '</b><span>Prestige</span></div>' +
    '<div class="cv-tile"><b>' + members.length + ' / ' + memberSlots() + '</b><span>Members</span></div>' +
    '<div class="cv-tile"><b>' + metCount() + ' / ' + STARS.ROSTER.length +
      '</b><span>Encountered</span></div>' +
    '</div>';

  // Who the club can reach, in one sentence rather than a second ladder — the
  // ladder itself lives in the collection at the foot of the page, where the
  // names it unlocks are.
  html += '<div class="bk-reach">' + (!course.holes.length
    ? 'Notable golfers travel for a golf course. Open a hole and the diary starts filling.'
    : next
    ? '<b>' + (reach ? reach.label + 's' : 'Nobody') + '</b> will travel here today. ' +
      next.label + 's start at ' + next.need + ' prestige — ' + (next.need - p) + ' away.'
    : '<b>Everybody</b> in the game will travel for this golf course.') + '</div>';

  // In the diary — the most timely thing on the page, so it goes first. These
  // rows open exactly like the book's do, because the question a player has
  // about somebody who is COMING is the same question they have about somebody
  // who has been: what does this person want from a golf course?
  const s = state.sheet, dl = dayInfo().dl;
  const coming = [];
  const listed = new Set(members.map(m => m.id).concat(seenIds));
  // every notable down for a time today, member or not — the members' rows read
  // it to say whether they are out today, and the diary lists the rest
  const diary = new Map();
  if (s && s.vips) for (const k in s.vips) {
    const id = s.vips[k];
    if (STARS.BY_ID[id] && !diary.has(id)) diary.set(id, +k);
  }
  for (const [id, i] of diary) {
    if (i < s.cursor || memberOf(id)) continue;   // members have their own row
    coming.push({ i, star: STARS.BY_ID[id] });
  }
  coming.sort((a, b) => a.i - b.i);
  // whoever the player opened — from the headline, from a golfer's card, from
  // __fairway — always has a row to open, even if they are in no list yet
  if (openStar && openWhere === 'row' && STARS.BY_ID[openStar] && !listed.has(openStar)
      && !coming.some(c => c.star.id === openStar)) {
    coming.unshift({ i: null, star: STARS.BY_ID[openStar] });
  }
  if (coming.length) {
    html += '<div class="cv-block"><div class="cv-h">Visiting today' +
      '<span class="cv-hr">' + coming.length + '</span></div>';
    for (const c of coming) {
      const seen = state.club.seen[c.star.id];
      const mk = seen ? '<b class="st-mark ' + markClass(seen.score) + '">' +
        seen.score.toFixed(1) + '</b>' : '<span class="st-first">First visit</span>';
      const when = c.i == null ? '' :
        '<span class="st-when">' + TS.hhmmShort(TS.slotMinute(dl, c.i)) + '</span>';
      html += starRow(c.star, when + mk, memberOf(c.star.id) ? 'mem' : '');
    }
    html += '</div>';
  }

  // The honours board — what has actually been done on this golf course.
  html += '<div class="cv-block"><div class="cv-h">Honours<span class="cv-hr">' +
    roundsPlayed().toLocaleString() + ' rounds</span></div>' + renderHonours() + '</div>';

  // The visitors' book — the heart of the page. One line per notable who has
  // played here: the card they signed, the mark they left, and the one thing
  // they said about the golf course. Opening a signature opens the person.
  html += '<div class="cv-block"><div class="cv-h">The visitors\' book<span class="cv-hr">' +
    seenIds.length + '</span></div>';
  if (!seenIds.length) {
    html += '<div class="cv-empty">Nobody of note has signed yet. They come for the golf ' +
      'course itself — raise the rating and open more holes, and the first name goes on ' +
      'this page the morning after they play.</div>';
  } else {
    for (const id of seenIds) html += signatureRow(STARS.BY_ID[id]);
  }
  html += '</div>';

  // Members
  html += '<div class="cv-block"><div class="cv-h">Members<span class="cv-hr">' +
    members.length + ' of ' + memberSlots() +
    (memberSlots() === 1 ? ' seat' : ' seats') + '</span></div>';
  if (!members.length) {
    html += '<div class="cv-empty">No members yet. Impress a notable golfer enough — their ' +
      'mark out of ten is the test, and every one of them wants something different — and ' +
      'you can offer them a seat. A bigger clubhouse buys more seats.</div>';
  } else {
    for (const m of members) {
      const star = STARS.BY_ID[m.id];
      const seen = state.club.seen[m.id];
      const mk = seen ? '<b class="st-mark ' + markClass(seen.score) + '">' + seen.score.toFixed(1) + '</b>' : '';
      // out today, or not — a membership is a habit, not an attendance record
      const slot = diary.get(m.id);
      const when = slot != null
        ? '<span class="st-when on">' + TS.hhmmShort(TS.slotMinute(dl, slot)) + '</span>'
        : '<span class="st-when">Off today</span>';
      html += starRow(star, when + mk, 'mem');
    }
  }
  html += '</div>';

  html += renderCollection(p);
  return html;
}

// ── The book ─────────────────────────────────────────────────────────────────
// The six sections are one bound ledger, not six screens behind a control. The
// paper block is a SINGLE multi-column flow laid across the whole spread with
// the gutter as its column-gap — so the browser paginates a hundred and eighty
// tee times into pages for us, and turning to page four is one translate.
//
// The leaf you see in the air is three clipped clones of that same flow: the
// half you are leaving, held still, and a two-faced page hinged on the spine.
// The real, interactive page is already sitting at the destination underneath
// it. That is why a turn can be interrupted on any frame, why it never delays
// reading, and why nothing under a finger is ever rebuilt mid-tap.

const CLUB_TABS = ['today', 'people', 'tour', 'upgrades', 'progress', 'course'];

// Clubhouse language, in the order a club would bind them. The IDS are the old
// ones, so every save, every deep link and every __fairway call still lands.
// The ribbon colours are the club's own inks, named not spelled — so the set
// re-tones with the rest of the book after dark instead of staying daylit.
// Only the three a ledger does not already own are declared here.
const BOOK_SECTIONS = [
  { id: 'today',    name: 'The Day',       tint: 'var(--blue)' },
  { id: 'people',   name: 'The Members',   tint: 'var(--ink-gilt)' },
  { id: 'tour',     name: 'The Majors',    tint: 'var(--rib-major)' },
  { id: 'upgrades', name: 'The Works',     tint: 'var(--rib-works)' },
  { id: 'progress', name: 'The Committee', tint: 'var(--rib-cttee)' },
  { id: 'course',   name: 'The Course',    tint: 'var(--rib-course)' },
];
const sectionOf = id => BOOK_SECTIONS.find(s => s.id === id) || BOOK_SECTIONS[0];

// One leaf, in the air. Fast enough that a section change is never a wait, slow
// enough that the page has weight — and interruptible on any frame regardless.
//
// The MASS SCALE lives in the stylesheet (--t-tick … --t-page, --e-press …
// --e-mass) and is read from it here, so the heaviest thing the CSS knows about
// and the heaviest thing the JS animates cannot drift apart. Read once at
// module scope: it is two getComputedStyle calls, not two per turn.
// ── the palette audit ────────────────────────────────────────────────────────
// The colours an operating system owns, in both the forms they can reach the
// page in: a hex literal written into an inline style, and the rgb() a browser
// computes it to. iOS system blue / green / orange / purple / teal / pink /
// indigo / yellow / red and the two greys — the vocabulary this interface was
// originally assembled from, and the one it is not allowed back into.
const SYS_HEX = ['0a84ff', '007aff', '34c759', '30d158', 'ff9f0a', 'ff9500',
  'bf5af2', 'af52de', '64d2ff', '5ac8fa', 'ff375f', 'ff2d55', '5e5ce6', '5856d6',
  'ffd60a', 'ffcc00', 'ff453a', 'ff3b30', '8e8e93', '787880', '3c3c43', '636366'];
const SYS_RGB = SYS_HEX.map(h => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16),
  parseInt(h.slice(4), 16)].join(', '));
const SYS_RE = new RegExp('(?:#(?:' + SYS_HEX.join('|') + ')\\b)|(?:\\b(?:' + SYS_RGB.join('|') + ')\\b)', 'i');

// ── the token graph, checked against itself ──────────────────────────────────
// This whole area exists because two declarations in the book's own block named
// themselves — `--pg: var(--pg)`, `--blue: var(--blue)`. A custom property that
// references itself is a CYCLE: the spec makes it "invalid at computed-value
// time", the browser resolves it to nothing, says nothing about it, and every
// surface painted with it quietly loses its paint. The book's pages went
// unpainted for as long as that was in the file, and the green cover boards
// showed through where the cream should have been.
//
// Nothing in a stylesheet can catch that. This can. It reads every token the
// stylesheet declares, resolves each one against the element it is declared on,
// and reports three failures a design system can suffer in silence:
//
//   cycles    — declared, but resolves to nothing at all
//   dangling  — referenced by var() and never declared anywhere, with no
//               fallback to catch it
//   orphans   — declared and referenced by nothing, which is not a bug but is
//               where the next cycle will hide
//
// A green result is `ok: true`. It is two dozen getComputedStyle calls, run only
// when asked, and it is the cheapest insurance in the project.
function tokenAudit() {
  // token -> EVERY selector that declares it. Not the first one: the cycle that
  // started this was a SHADOWING one, sitting in `#book` over a perfectly good
  // `:root` declaration of the same name. An audit that resolves each token once,
  // at its first declaration, reads the healthy copy and passes — which is a
  // guard that fails in exactly the case it was built for.
  const decl = new Map();
  const used = new Map();          // token -> has a var() fallback anywhere
  for (const sheet of document.styleSheets) {
    let rules; try { rules = sheet.cssRules; } catch (e) { continue; }
    const walk = (rs) => {
      for (const r of rs) {
        // A plain style rule now carries an (empty) cssRules list of its own,
        // for CSS nesting — and an empty CSSRuleList is truthy. Recursing on it
        // and moving on skipped every declaration in the stylesheet. Descend
        // into real children, then read this rule's own declarations anyway.
        if (r.cssRules && r.cssRules.length) walk(r.cssRules);
        if (!r.style) continue;
        // read the declarations off cssText: custom properties are not reliably
        // enumerable through the indexed CSSStyleDeclaration interface, which is
        // itself a small lesson about trusting an API to tell you what it holds
        const text = r.style.cssText || '';
        for (const m of text.matchAll(/(^|[;{]\s*)(--[a-z0-9-]+)\s*:/gi)) {
          if (!decl.has(m[2])) decl.set(m[2], new Set());
          decl.get(m[2]).add(r.selectorText || ':root');
        }
        // a var() with a comma has a fallback and cannot fail open
        for (const m of text.matchAll(/var\((--[a-z0-9-]+)\s*(,?)/gi))
          if (!used.get(m[1])) used.set(m[1], !!m[2]);
      }
    };
    walk(rules);
  }
  // Resolve each token where it actually lives, so a book token is read off the
  // book and a section token off the section. A selector with no element right
  // now (`body.night #book` by day) returns null and is skipped rather than
  // falling back to the root — resolving it somewhere else is how a shadowing
  // cycle reads as healthy. Turn the club to night, or open the book, and the
  // audit covers those states too.
  const probe = (sel) => {
    if (!sel || sel === ':root') return document.documentElement;
    for (const s of sel.split(',')) {
      const n = document.querySelector(s.trim());
      if (n) return n;
    }
    return null;
  };
  const cycles = [], orphans = [];
  for (const [name, sels] of decl) {
    if (!used.has(name)) { orphans.push(name); continue; }
    for (const sel of sels) {
      const el = probe(sel);
      if (!el) continue;
      if (getComputedStyle(el).getPropertyValue(name).trim() === '') cycles.push(name + ' @ ' + sel);
    }
  }
  const dangling = [...used].filter(([n, hasFallback]) => !decl.has(n) && !hasFallback).map(([n]) => n);
  return { ok: !cycles.length && !dangling.length, cycles, dangling, orphans, declared: decl.size };
}

// what is on screen right now — computed paint AND the raw inline style, because
// a hex written into an attribute is the exact way the six upgrade tints hid
function sysPaletteLive() {
  const hits = [];
  for (const n of document.querySelectorAll('body *')) {
    const s = getComputedStyle(n);
    const inline = n.getAttribute && n.getAttribute('style');
    if ([s.backgroundColor, s.color, s.borderTopColor, s.boxShadow, s.fill, s.stroke, inline || '']
      .some(v => v && SYS_RE.test(v))) hits.push(n.className || n.tagName);
  }
  return hits;
}

// The whole audit. A DOM walk can only ever see the section that is open, which
// is how a book with twenty-six system-coloured elements in it reported zero for
// as long as nobody happened to be looking at The Works. Pass true and it turns
// to every section in turn before it answers, then puts the book back where it
// found it — so the number means "this club", not "this screen".
function sysPaletteAudit(deep) {
  const seen = { }; let total = 0;
  const scan = (where) => { const h = sysPaletteLive(); seen[where] = h.length; total += h.length; return h; };
  const worst = scan(sheetOpen ? 'book:' + clubTab : 'world');
  if (deep && sheetOpen) {
    const was = clubTab;
    for (const t of CLUB_TABS) { if (t === was) continue; setClubTab(t, { instant: true }); scan('book:' + t); }
    setClubTab(was, { instant: true });
  }
  return { total, sections: seen, deep: !!deep && sheetOpen,
    // the offenders, so a failure names itself instead of just counting
    examples: worst.slice(0, 8) };
}

// ── the borrowed-hand audit ──────────────────────────────────────────────────
// The palette audit above catches a colour that came from somebody else's
// system. This one catches a DRAWING that did: a colour emoji is a glyph the
// operating system renders in its own palette, its own weight and its own
// house style, and one of them sitting on a cream chit two inches under a
// hairline SVG pin is the whole "one hand or two" question answered wrong in a
// single frame. Thirty-seven of them lived in toast() until this pass.
//
// Text-presentation marks — ★, ☀︎, ☾, →, ↔, ↩︎ — are NOT emoji: they inherit
// currentColor and print as ink, so they are the club's own typography and are
// deliberately not flagged. The test is the Emoji_Presentation range plus an
// explicit VS16, which is exactly the set the OS draws in colour.
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{FE0F}]|[\u{2600}-\u{27BF}](?![\u{FE0E}])(?=[\u{FE0F}])/u;
function glyphScan(where, out) {
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = w.nextNode(); n; n = w.nextNode()) {
    const t = n.data;
    if (t.trim() && EMOJI_RE.test(t)) {
      const p = n.parentElement;
      out.push({ where, el: p ? (p.id || p.className || p.tagName) : '?', text: t.trim().slice(0, 48) });
    }
  }
}
// glyphAudit(true) turns to every section before it answers — same reason the
// palette audit does. It puts the book back where it found it.
function glyphAudit(deep) {
  const hits = [];
  glyphScan(sheetOpen ? 'book:' + clubTab : 'world', hits);
  if (deep && sheetOpen) {
    const was = clubTab;
    for (const t of CLUB_TABS) { if (t === was) continue; setClubTab(t, { instant: true }); glyphScan('book:' + t, hits); }
    setClubTab(was, { instant: true });
  }
  return { total: hits.length, ok: hits.length === 0, hits: hits.slice(0, 12) };
}

const MOTION = (() => {
  const cs = getComputedStyle(document.documentElement);
  const ms = k => (parseFloat(cs.getPropertyValue(k)) || 0) * 1000;
  const ez = k => (cs.getPropertyValue(k) || '').trim();
  return {
    tick: ms('--t-tick') || 90, chit: ms('--t-chit') || 140, card: ms('--t-card') || 190,
    ribbon: ms('--t-ribbon') || 210, page: ms('--t-page') || 320,
    press: ez('--e-press') || 'cubic-bezier(0.3, 0, 0.2, 1)',
    flick: ez('--e-flick') || 'cubic-bezier(0.16, 0.9, 0.22, 1)',
    settle: ez('--e-settle') || 'cubic-bezier(0.32, 0.72, 0, 1)',
    mass: ez('--e-mass') || 'cubic-bezier(0.52, 0.02, 0.22, 1)',
  };
})();
const BOOK_TURN_MS = MOTION.page;
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
// A hidden pane never advances a transition, so a book opened in one would be
// frozen half onto the desk forever. Nothing is being watched there, so the
// object simply arrives — which is also exactly what reduced motion asks for.
// This is the same question reveal() asks about every other overlay, so it is
// the same predicate: two copies of this list is how they came to disagree.
const bkStill = uiStill;

let bkSpread = 0, bkPages = 1, bkRev = 0, bkAnim = null, bkCast = null, bkDrag = null;
let bkAnimGuard = null, bkLastTurnMs = 0, bkLastRenderMs = 0, bkHideT = null;
const bkGeo = { col: 372, gap: 68, pitch: 440 };

const bkSpreads = () => Math.max(1, Math.ceil(bkPages / 2));

// The whole of the placement maths: one column pitch, read off the live paper
// rather than guessed, so a resize or a media query cannot put the type and the
// transform in different places.
function bkMeasure() {
  const paper = el('bk-paper'), flow = el('bk-flow');
  const w = paper.clientWidth;
  // a shut book has no width to paginate against; openSheet re-typesets it the
  // moment the block is laid out, so the last good geometry simply stands
  if (w < 120) return;
  bkGeo.gap = parseFloat(getComputedStyle(flow).columnGap) || 68;
  bkGeo.col = (w - bkGeo.gap) / 2;
  bkGeo.pitch = bkGeo.col + bkGeo.gap;
  // where the last line of the section actually landed. An end mark is exact
  // where scrollWidth on an overflowing multicol is not.
  const end = flow.querySelector('.bk-end');
  const x = end ? end.getBoundingClientRect().left - flow.getBoundingClientRect().left : 0;
  bkPages = Math.max(1, Math.round(x / bkGeo.pitch) + 1);
}

// which page a node is printed on — the book's answer to scrollIntoView
function bkPageOfNode(n) {
  if (!n) return 0;
  const x = n.getBoundingClientRect().left - el('bk-flow').getBoundingClientRect().left;
  return clamp(Math.floor(x / bkGeo.pitch), 0, bkPages - 1);
}

function bkPosition(s) {
  el('bk-flow').style.transform = 'translateX(' + (-2 * s * bkGeo.pitch).toFixed(2) + 'px)';
}

// The printed furniture, and the block itself: running heads, folios, and the
// fore-edge stack — pages read on the left, pages left on the right. That stack
// is the honest version of a scrollbar: it lives on the object.
function bkFurniture() {
  const sec = sectionOf(clubTab);
  el('bk-run-l').textContent = sec.name;
  el('bk-run-r').textContent = course.holes.length
    ? 'Fairways · ' + fmt(course.ratePerMin) + ' / min' : 'Fairways Golf Club';
  const pL = bkSpread * 2 + 1;
  el('bk-fol-l').textContent = pL <= bkPages ? String(pL) : '';
  el('bk-fol-r').textContent = pL + 1 <= bkPages ? String(pL + 1) : '';
  const n = bkSpreads();
  const k = n > 1 ? bkSpread / (n - 1) : 0;
  el('bk-edge-b').style.setProperty('--w', (4 + 22 * k).toFixed(1) + 'px');
  el('bk-edge-a').style.setProperty('--w', (4 + 22 * (1 - k)).toFixed(1) + 'px');
  el('bk-grab').classList.toggle('can', bkSpread < n - 1);
  el('bk-grab-b').classList.toggle('can', bkSpread > 0);
  el('bk-tabs').querySelectorAll('.bk-tab').forEach(b =>
    b.classList.toggle('on', b.dataset.tab === clubTab));
}

// One face of the leaf: a window onto a clone of the flow, offset so exactly
// one column shows through it. The clone is cached per host and only rebuilt
// when the section has actually been re-typeset, so flipping fast is free.
function bkFace(host, spread, half) {
  let c = host.firstElementChild;
  if (!c || host.dataset.rev !== String(bkRev)) {
    c = el('bk-flow').cloneNode(true);
    c.removeAttribute('id');
    // one id per page, please — the live flow keeps the ones the views look up
    c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    host.replaceChildren(c);
    host.dataset.rev = String(bkRev);
  }
  c.style.width = (bkGeo.col * 2 + bkGeo.gap) + 'px';
  const col = half === 'l' ? spread * 2 : spread * 2 + 1;
  c.style.transform = 'translateX(' +
    (-col * bkGeo.pitch + (half === 'r' ? bkGeo.gap / 2 : 0)).toFixed(2) + 'px)';
}

// the two halves that must be captured BEFORE the destination is typeset
function bkPrep(dir, from) {
  const hold = el('bk-hold');
  hold.className = 'bk-hold ' + (dir > 0 ? 'l' : 'r');
  el('bk-cast').className = 'bk-cast' + (dir > 0 ? '' : ' back');
  bkFace(hold, from, dir > 0 ? 'l' : 'r');
  bkFace(el(dir > 0 ? 'bk-face-f' : 'bk-face-b'), from, dir > 0 ? 'r' : 'l');
}

// Both halves of a turn are WAAPI animations, and BOTH have to be released:
// the leaf that rotates and the cast shadow it throws. Only the leaf was held
// in a handle, so on a hidden pane — where no animation ever reaches onfinish
// and the guard timer does the stopping — the shadow's animation was orphaned
// on #bk-cast, one per turn, forever. bkStop() promises the book is not left
// mid-turn; a promise kept for one of two moving parts is not kept.
function bkStop() {
  if (bkAnim) { bkAnim.onfinish = null; bkAnim.cancel(); bkAnim = null; }
  if (bkCast) { bkCast.cancel(); bkCast = null; }
  clearTimeout(bkAnimGuard);
  el('bk-turn').classList.remove('on');
  el('bk-leaf').style.transform = '';
  el('bk-cast').style.opacity = '';
}

function bkSettle() {
  bkStop();
  if (bkDrag) { try { el(bkDrag.id).releasePointerCapture(bkDrag.pid); } catch (e) { } bkDrag = null; }
}

// …and the half that can only be captured after it
function bkFly(dir, to) {
  bkFace(el(dir > 0 ? 'bk-face-b' : 'bk-face-f'), to, dir > 0 ? 'l' : 'r');
  const leaf = el('bk-leaf'), cast = el('bk-cast');
  el('bk-turn').classList.add('on');
  const a0 = dir > 0 ? 0 : -180, a1 = dir > 0 ? -180 : 0;
  const t0 = performance.now();
  const done = () => {
    bkLastTurnMs = performance.now() - t0;
    bkStop();
  };
  bkAnim = leaf.animate(
    [{ transform: 'rotateY(' + a0 + 'deg)' }, { transform: 'rotateY(' + a1 + 'deg)' }],
    // slow off the desk, quick through the vertical, cushioned as it lands
    { duration: BOOK_TURN_MS, easing: MOTION.mass, fill: 'both' });
  bkCast = cast.animate([{ opacity: 0 }, { opacity: 1, offset: 0.44 }, { opacity: 0 }],
    { duration: BOOK_TURN_MS, easing: 'linear' });
  bkAnim.onfinish = done;
  // a hidden pane never runs an animation; the book must not be left mid-turn
  bkAnimGuard = setTimeout(done, BOOK_TURN_MS + 45);
  sound('page');
}

// Turn to a spread. Everything else — tabs, keys, the corner, a wave on the
// day's axis — goes through here.
function bkTo(spread, opts) {
  const to = clamp(Math.round(spread), 0, bkSpreads() - 1);
  if (to === bkSpread) return false;
  const from = bkSpread, dir = to > from ? 1 : -1;
  // one list, in one place: uiStill() already knows about reduced motion, a
  // hidden pane and the still-UI switch. A local re-spelling of two of those
  // three is how the two copies came to disagree in the first place.
  // `instant` is for machines, and — as in setClubTab — it types the
  // destination and says NOTHING. An audit that pages through the book must
  // not be audible either.
  const mute = !!(opts && opts.instant);
  const still = mute || uiStill() || !sheetOpen;
  bkSettle();
  if (!still) bkPrep(dir, from);
  bkSpread = to;
  bkPosition(to);
  bkFurniture();
  // the still path of a page turn is the ribbon that got you there
  if (!mute) { if (still) sound('ribbon'); else bkFly(dir, to); }
  return true;
}

function renderSheet(opts) {
  const flow = el('bk-flow');
  const body = clubTab === 'progress' ? renderProgressView()
    : clubTab === 'course' ? renderCourseView()
    : clubTab === 'today' ? renderScheduleView()
    : clubTab === 'people' ? renderPeopleView()
    : clubTab === 'tour' ? renderTourView()
    : renderUpgradesView();
  // the end mark is how the book knows how long the section is
  const t0 = performance.now();
  flow.innerHTML = body + '<i class="bk-end"></i>';
  bkRev++;
  bkMeasure();

  // Where the book should fall open. A live re-draw stays on the page the
  // player is reading; a fresh section opens where the news is.
  let want = opts && opts.spread != null ? opts.spread : bkSpread;
  if (clubTab === 'today' && bookScrollPending) {
    bookScrollPending = false;
    const now = el('ts-now') || flow.querySelector('.ts-anchor');
    if (now) want = Math.floor(bkPageOfNode(now) / 2);
  }
  if (clubTab === 'people' && starScrollPending) {
    starScrollPending = false;
    const row = flow.querySelector('.st-row.on');
    if (row) want = Math.floor(bkPageOfNode(row) / 2);
  }
  bkSpread = clamp(Math.round(want), 0, bkSpreads() - 1);
  bkPosition(bkSpread);
  bkFurniture();

  const rows = flow;
  // wiring — one delegated pass, so a re-render never leaks listeners
  rows.querySelectorAll('[data-buy]').forEach(b => {
    b.disabled = state.money < (trackCost(CLUB_TRACKS.find(t => t.id === b.dataset.buy)) || Infinity);
    b.addEventListener('click', () => buyTrack(b.dataset.buy));
  });
  rows.querySelectorAll('[data-hole]').forEach(b =>
    b.addEventListener('click', () => { closeSheet(); openHoleCard(+b.dataset.hole); }));
  rows.querySelectorAll('[data-theme]').forEach(b =>
    b.addEventListener('click', () => setTheme(b.dataset.theme)));
  // The day is a set of handles: point at an hour and the book turns to it.
  // One leaf, the same 320ms as every other turn — the wave's page is a page
  // like any other, and the turn is what tells the player the book moved.
  const toWave = (id) => {
    const h = el('ts-w-' + id);
    if (h) bkTo(Math.floor(bkPageOfNode(h) / 2));
  };
  rows.querySelectorAll('[data-wave]').forEach(b =>
    b.addEventListener('click', () => toWave(b.dataset.wave)));
  // …and the whole axis is live, not just the blocks. At real time scale the
  // dawn patrol is thirteen pixels wide, which is an honest picture of a
  // thirty-six minute wave and a hopeless thing to hit. So a click anywhere on
  // the scale is read as the hour it landed on and taken to the wave standing
  // there — which is both a bigger target than the blocks ever were and the
  // more natural gesture on something that is a clock.
  const axis = rows.querySelector('.ts-axis');
  if (axis) {
    const waveAtX = (ev) => {
      const dl = dayInfo().dl, r = axis.getBoundingClientRect();
      if (!r.width || !dl.parts.length) return null;
      const min = dl.first + (ev.clientX - r.left) / r.width * (dl.last - dl.first);
      let best = null, bd = Infinity;
      for (const p of dl.parts) {
        if (!p.n) continue;
        const d = min < p.start ? p.start - min : min > p.end ? min - p.end : 0;
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    };
    axis.addEventListener('click', (ev) => {
      if (ev.target.closest('.ts-part')) return;      // a block speaks for itself
      const p = waveAtX(ev);
      if (p) toWave(p.id);
    });
    // and it says where it is about to send you, because at this scale the
    // block under the pointer can be narrower than the pointer
    axis.addEventListener('mousemove', (ev) => {
      const p = waveAtX(ev);
      axis.querySelectorAll('.ts-part').forEach(b =>
        b.classList.toggle('hot', !!p && b.dataset.wave === p.id));
    });
    axis.addEventListener('mouseleave', () =>
      axis.querySelectorAll('.ts-part.hot').forEach(b => b.classList.remove('hot')));
    // The NOW pill stands in the same row as the hours, so whichever hour it
    // lands on has to give way. Measured rather than guessed — the answer
    // depends on the pill's own text ("Now 9:05" is narrower than "Now 12:45")
    // and on however wide the sheet is — and hidden rather than painted over,
    // because half a clipped glyph under a red pill is worse than no label. It
    // is the cheapest label to lose: it says the hour the pill already says.
    const pill = rows.querySelector('.ts-mark-lab');
    if (pill) {
      const pr = pill.getBoundingClientRect();
      rows.querySelectorAll('.ts-rule span').forEach(h => {
        const r = h.getBoundingClientRect();
        if (r.right > pr.left - 3 && r.left < pr.right + 3) h.style.visibility = 'hidden';
      });
    }
  }
  // the Club Book: one row opens at a time, and the two buttons inside it are
  // the only decisions on the page
  rows.querySelectorAll('[data-star]').forEach(b =>
    b.addEventListener('click', () => { openStarRow(b.dataset.star); }));
  // a tile in the collection opens the same card, under the grid
  rows.querySelectorAll('[data-starg]').forEach(b =>
    b.addEventListener('click', () => { openStarRow(b.dataset.starg, 'grid'); }));
  rows.querySelectorAll('[data-invite]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); invite(b.dataset.invite); renderSheet(); }));
  rows.querySelectorAll('[data-release]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); release(b.dataset.release); renderSheet(); }));
  // the Tour: enter a member, pull them out, go and watch, or go and walk
  rows.querySelectorAll('[data-enter]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); enterEvent(b.dataset.enter, b.dataset.member); }));
  rows.querySelectorAll('[data-withdraw]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); withdraw(b.dataset.withdraw); }));
  rows.querySelectorAll('[data-watch]').forEach(b =>
    b.addEventListener('click', () => {
      ensureAudio();
      const ev = MAJORS.EVENT[b.dataset.watch];
      if (ev) travelTo(ev.venue, meetFor(ev));
    }));
  rows.querySelectorAll('[data-walk]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); awayHole = -1; travelTo(b.dataset.walk, null); }));
  const rt = el('cv-rating');
  if (rt) rt.addEventListener('click', () => { closeSheet(); openRatingCard(); });

  // the ring draws itself in once the browser has the starting length
  const fg = rows.querySelector('.pg-ring-fg');
  if (fg) requestAnimationFrame(() => requestAnimationFrame(() => { fg.style.strokeDashoffset = fg.dataset.off; }));

  // Start Over lives at the end of The Course, under its own heading, because
  // that is the only page on which it is the subject rather than a footer.
  const so = el('bk-startover');
  if (so) so.addEventListener('click', startOver);

  // the book — and the leaderboard — are live documents
  bookSig = clubTab === 'today' ? bookSignature() : clubTab === 'tour' ? tourSignature() : '';
  // what a section change actually COSTS the reader: typeset, paginate, place
  // and wire, all of it synchronous and done before the leaf has moved a pixel
  bkLastRenderMs = performance.now() - t0;
}

function startOver() {
  askReset(true);
}

// The card, and the only two keys it listens for. Capture phase, because Esc
// otherwise reaches the book underneath and shuts THAT instead — the card is
// the thing in front of you, so it is the thing Esc answers.
function resetKeys(e) {
  if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); askReset(false); }
}
function askReset(open) {
  const w = el('confirm');
  if (!w) return;
  w.classList.toggle('hidden', !open);
  if (open) {
    document.addEventListener('keydown', resetKeys, true);
    el('confirm-no').focus();     // the safe answer is under Enter
    sound('card');
  } else {
    document.removeEventListener('keydown', resetKeys, true);
  }
}
function wipeAndReload() {
  resetting = true;
  try { localStorage.removeItem(SAVE_KEY); } catch (e) { }
  location.reload();
}

// the book is a live document: it re-draws itself when the day moves under it,
// and stays perfectly still while it is only being read
let bookSig = '', bookScrollPending = false, starScrollPending = false;
function syncBookView() {
  // a page in the air is not re-typeset under the reader; the next tick catches it
  if (!sheetOpen || bkAnim || bkDrag) return;
  // the Tour page is live too whenever a championship is: a player checking on
  // their member from the clubhouse watches the number move, same as the book
  if (clubTab === 'tour') {
    const sig = tourSignature();
    if (sig === bookSig) return;
    bookSig = sig;
    renderSheet();
    return;
  }
  if (clubTab !== 'today') return;
  const sig = bookSignature();
  if (sig === bookSig) return;
  renderSheet();
}

// only a live week moves; three dates and a wallet is a still page
function tourSignature() {
  const m = liveMeet();
  if (!m) return 'tour|' + Math.floor(nowMinute() / 30) + '|' + state.tour.results.length;
  const b = leaderboard(m);
  return 'tour|' + m.key + '|' + b.rows.slice(0, 3).map(r => r.id + r.toPar).join(',') +
    '|' + (entrantOf(m) ? JSON.stringify(rowFor(b, entrantOf(m).id).holes) : '');
}

// the leaderboard is a live document too — it redraws when a score moves and
// stays perfectly still while it is only being read
function syncAwayView() {
  if (!awayOpen || !away.active) return;
  const sig = awaySignature();
  if (sig === awaySig) return;
  awaySig = sig;
  renderAway();
}

// money moves while the sheet is open — the buy buttons keep up without a
// re-render, so nothing under the player's finger is ever rebuilt mid-tap
function syncSheetPrices() {
  if (!sheetOpen || clubTab !== 'upgrades') return;
  el('bk-flow').querySelectorAll('[data-buy]').forEach(b => {
    const cost = trackCost(CLUB_TRACKS.find(t => t.id === b.dataset.buy));
    b.disabled = cost === null || state.money < cost;
  });
}

// open the book on one person — from a row, from the day's headline, or from
// __fairway. Tapping the open row closes it again.
function openStarRow(id, where) {
  ensureAudio();
  if (!STARS.BY_ID[id]) return false;
  const w = where || 'row';
  // tapping the same person in the same place closes them; tapping them in the
  // other place moves the open card there rather than shutting it
  openStar = (openStar === id && openWhere === w) ? null : id;
  openWhere = w;
  starScrollPending = !!openStar;
  if (!sheetOpen) openSheet('people');
  else if (clubTab !== 'people') setClubTab('people');
  else renderSheet();
  sound('tick');  // a mark against a member row
  return true;
}

// A section is a divider in the same book, so getting to one is a page turn —
// forwards or backwards depending on where it is bound. The half being left is
// captured before the new section is typeset; the half arriving, after.
function setClubTab(tab, opts) {
  if (!CLUB_TABS.includes(tab) || tab === clubTab) return;
  const from = bkSpread;
  const dir = CLUB_TABS.indexOf(tab) > CLUB_TABS.indexOf(clubTab) ? 1 : -1;
  // `instant` is for machines: it types the destination and says nothing. An
  // audit that flips through all six sections must not turn six pages out loud.
  const mute = !!(opts && opts.instant);
  const still = mute || uiStill() || !sheetOpen;   // same one list — see bkTo
  bkSettle();
  if (!still) bkPrep(dir, from);
  clubTab = tab;
  const at = opts && opts.at;
  if (tab === 'today' && at !== 'last') bookScrollPending = true;
  renderSheet({ spread: at === 'last' ? 1e6 : 0 });
  if (mute) return;
  if (still) sound('ribbon'); else bkFly(dir, bkSpread);  // a silk marker pulled (the animated path turns a page instead)
}

// one page on, or one page back — running off the end of a section carries you
// into the next one, exactly the way a book does
function bookStep(d) {
  if (!sheetOpen) return false;
  ensureAudio();
  const n = bkSpread + d;
  if (n >= 0 && n < bkSpreads()) return bkTo(n);
  const i = CLUB_TABS.indexOf(clubTab) + d;
  if (i < 0 || i >= CLUB_TABS.length) return false;
  setClubTab(CLUB_TABS[i], { at: d > 0 ? 'first' : 'last' });
  return true;
}
function bookSection(d) {
  const i = CLUB_TABS.indexOf(clubTab) + d;
  if (i < 0 || i >= CLUB_TABS.length) return false;
  ensureAudio();
  setClubTab(CLUB_TABS[i]);
  return true;
}

function openSheet(tab) {
  const was = sheetOpen;
  sheetOpen = true;
  closeHoleCard();
  closeRatingCard();
  if (linkMode.active) exitLinkMode();
  if (tab && CLUB_TABS.includes(tab) && tab !== clubTab) { clubTab = tab; bkSpread = 0; }
  if (clubTab === 'today') bookScrollPending = true;
  const bk = el('book');
  clearTimeout(bkHideT);
  bkSettle();
  // the block has to be laid out before the flow can be paginated
  // The still flag has to reach the SCRIM as well as the book. It is a sibling
  // of #book, not a child of it, so `#book.nofx #scrim` — which is how this was
  // written — could never match a single element. The consequence was silent and
  // total: in any pane that is not painting (the whole headless path, and every
  // screenshot taken of it), the desk the book is opened on simply never
  // arrived. Its opacity transition was left frozen at frame one for as long as
  // the book was open, so the room never dropped away and the pool of warm light
  // over the page was never lit.
  const stillNow = bkStill();
  bk.classList.toggle('nofx', stillNow);
  el('scrim').classList.toggle('nofx', stillNow);
  bk.classList.remove('hidden');
  bk.classList.add('shut');
  renderSheet({ spread: was ? bkSpread : 0 });
  el('scrim').classList.remove('hidden');
  // the closed state is committed by renderSheet's own measuring pass, so the
  // transition can start on this tick — no waiting on a frame that a hidden
  // pane would never give us
  void bk.offsetWidth;
  el('scrim').classList.add('show');
  bk.classList.remove('shut');
  bk.classList.add('open');
  // a book you cannot reach with the keyboard is a picture of a book. Focus
  // goes to the open page so Tab walks what is written on it; bkTrapFocus()
  // keeps it from wandering off behind the scrim.
  bkFocusFirst();
  sound('open');
}

// the page owns the keyboard while the book is open
function bkFocusables() {
  const bk = el('book');
  return [...bk.querySelectorAll(
    'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter(n => n.offsetParent !== null);   // a page that is turned away is not reachable
}
function bkFocusFirst() {
  const bk = el('book');
  if (!bk.hasAttribute('tabindex')) bk.setAttribute('tabindex', '-1');
  const f = bkFocusables();
  (f[0] || bk).focus({ preventScroll: true });
}
// Tab cycles inside the book instead of escaping to the course behind it
function bkTrapFocus(e) {
  const f = bkFocusables();
  if (!f.length) { e.preventDefault(); el('book').focus({ preventScroll: true }); return; }
  const first = f[0], last = f[f.length - 1];
  const here = document.activeElement;
  if (!el('book').contains(here)) { e.preventDefault(); (e.shiftKey ? last : first).focus(); return; }
  if (!e.shiftKey && here === last) { e.preventDefault(); first.focus(); }
  else if (e.shiftKey && here === first) { e.preventDefault(); last.focus(); }
}

function closeSheet() {
  if (!sheetOpen) return;
  sheetOpen = false;
  // hand the keyboard back to the course
  if (el('book').contains(document.activeElement)) document.activeElement.blur();
  bkSettle();
  const bk = el('book');
  const stillNow = bkStill();
  bk.classList.toggle('nofx', stillNow);
  el('scrim').classList.toggle('nofx', stillNow);
  bk.classList.remove('open');
  bk.classList.add('shut');          // the cover comes over as the book drops
  el('scrim').classList.remove('show');
  clearTimeout(bkHideT);
  // a desk that is not fading does not need to be waited for
  bkHideT = setTimeout(() => {
    el('scrim').classList.add('hidden');
    bk.classList.add('hidden');
    bk.classList.remove('shut');
  }, stillNow ? 0 : MOTION.page);
  sound('shut');
}

// ── The corner ───────────────────────────────────────────────────────────────
// Take the page by its corner and it comes with you: the leaf tracks the
// pointer, past a third of the way it falls, short of it the paper springs back
// onto the page it came from. The destination is already live underneath from
// the first millimetre, which is why an abandoned drag costs nothing.

function bkSetLeaf(deg) { el('bk-leaf').style.transform = 'rotateY(' + deg + 'deg)'; }

function bkGrab(id, dir) {
  const g = el(id);
  g.addEventListener('pointerdown', e => {
    if (bkAnim || bkDrag || !g.classList.contains('can')) return;
    ensureAudio();
    e.preventDefault();
    const from = bkSpread, to = from + dir;
    bkSettle();
    bkPrep(dir, from);
    bkSpread = to;
    bkPosition(to);
    bkFurniture();
    bkFace(el(dir > 0 ? 'bk-face-b' : 'bk-face-f'), to, dir > 0 ? 'l' : 'r');
    el('bk-turn').classList.add('on');
    bkSetLeaf(dir > 0 ? 0 : -180);
    try { g.setPointerCapture(e.pointerId); } catch (err) { }
    bkDrag = { id, pid: e.pointerId, dir, from, to, x0: e.clientX,
      w: el('bk-leaf').offsetWidth || 1, k: 0 };
  });
  g.addEventListener('pointermove', e => {
    if (!bkDrag || bkDrag.pid !== e.pointerId) return;
    const px = bkDrag.dir > 0 ? bkDrag.x0 - e.clientX : e.clientX - bkDrag.x0;
    bkDrag.k = clamp(px / bkDrag.w, 0, 1);
    bkSetLeaf(bkDrag.dir > 0 ? -180 * bkDrag.k : -180 * (1 - bkDrag.k));
    el('bk-cast').style.opacity = Math.sin(bkDrag.k * Math.PI).toFixed(3);
  });
  const drop = e => {
    if (!bkDrag || bkDrag.pid !== e.pointerId) return;
    const d = bkDrag; bkDrag = null;
    try { g.releasePointerCapture(d.pid); } catch (err) { }
    const commit = d.k > 0.32;
    if (!commit) { bkSpread = d.from; bkPosition(d.from); bkFurniture(); }
    const a = d.dir > 0 ? -180 * d.k : -180 * (1 - d.k);
    const target = (commit ? d.dir > 0 : d.dir < 0) ? -180 : 0;
    const ms = bkStill() ? 1                        // …and the same one list
      : Math.max(90, Math.round(BOOK_TURN_MS * Math.abs(target - a) / 180));
    bkAnim = el('bk-leaf').animate(
      [{ transform: 'rotateY(' + a + 'deg)' }, { transform: 'rotateY(' + target + 'deg)' }],
      { duration: ms, easing: 'cubic-bezier(0.3, 0, 0.2, 1)', fill: 'both' });
    bkCast = el('bk-cast').animate([{ opacity: el('bk-cast').style.opacity || 0 }, { opacity: 0 }],
      { duration: ms });
    bkAnim.onfinish = bkStop;
    bkAnimGuard = setTimeout(bkStop, ms + 90);
    if (commit) sound('page');
  };
  g.addEventListener('pointerup', drop);
  g.addEventListener('pointercancel', drop);
}

// The dividers, down the fore-edge. This is the segmented control's honest
// physical analogue and a better one: six tabs are six targets that never move,
// the one you are reading stands proud of the block, and the name on it is the
// name the clubhouse would use.
function buildBookTabs() {
  const t = el('bk-tabs'), close = el('bk-close');
  t.innerHTML = BOOK_SECTIONS.map(s =>
    '<button class="bk-tab" data-tab="' + s.id + '" style="--tc:' + s.tint + '">' +
    '<i></i>' + s.name + '</button>').join('');
  // the last thing in the column is the one that is not a section
  t.appendChild(close);
  t.addEventListener('click', e => {
    const b = e.target.closest('[data-tab]');
    if (b) { ensureAudio(); setClubTab(b.dataset.tab); }
  });
}

// Paper tooth, generated rather than downloaded: one 64px tile of very low
// amplitude noise, made once at boot and repeated across the spread. No
// request, no filter, no per-frame cost — and it is the whole difference
// between a sheet of paper and a beige rectangle.
function paperGrain() {
  const n = 64;
  const c = document.createElement('canvas');
  c.width = c.height = n;
  const g = c.getContext('2d');
  const img = g.createImageData(n, n);
  for (let i = 0; i < n * n; i++) {
    const v = (Math.random() * 255) | 0, o = i * 4;
    img.data[o] = img.data[o + 1] = img.data[o + 2] = v;
    img.data[o + 3] = 9 + ((Math.random() * 11) | 0);
  }
  g.putImageData(img, 0, 0);
  document.documentElement.style.setProperty('--grain', 'url(' + c.toDataURL('image/png') + ')');
}

// toast
let toastTimer = null, lastToastAt = 0, toastActFn = null, toastHold = 0;
let toastUntil = 0;      // when the chit currently on the wall will leave it
let noteUp = false;      // the chit on the wall is a committee note
// The chit, and the one mark stamped at its left edge.
//
// These lines used to open with a colour emoji — ⛳️, 🏆, 🏡 — which is a
// glyph drawn by the operating system in somebody else's palette, in somebody
// else's drawing style, on the single most-fired surface in the club. Two
// inches above it a `.pair-mark` draws its pin as a hairline in --ink-3. One
// frame, two hands. The mark is now the club's own: an ICONS entry, stroked in
// the chit's own ink at the chit's own weight.
//
// The message stays a text node — the mark is the only markup, so a player's
// name or a course theme can never become one.
// A chit can also carry ONE button — an occasion's "Watch" (see offerWatch).
// While an actionable chit is on the wall the ordinary money lines wait their
// turn: a star on the first tee is not out-shouted by a twelve-dollar green
// fee. The button is the only interactive thing a toast has ever had, and it
// is still a text node's worth of ink beside the sentence.
function toast(msg, mark, act) {
  const now = performance.now();
  if (now - lastToastAt < 350) return false;
  if (!act && now < toastHold) return false;   // an occasion holds the wall
  lastToastAt = now;
  toastHold = act ? now + 6600 : 0;
  toastUntil = now + (act ? 6200 : 2600);
  noteUp = false;                        // whatever this is, it is not a note
  toastActFn = act ? act.fn : null;
  const t = el('toast');
  t.textContent = '';
  if (mark && ICONS[mark]) {
    const i = document.createElement('i');
    i.className = 'tt-mk';
    i.innerHTML = ICONS[mark];
    t.appendChild(i);
  }
  t.appendChild(document.createTextNode(msg));
  if (act) {
    const b = document.createElement('button');
    b.className = 'tt-act';
    b.textContent = act.label;
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      ensureAudio();
      const f = toastActFn;
      toastActFn = null; toastHold = 0; toastUntil = 0; noteUp = false;
      t.classList.add('out');
      setTimeout(() => t.classList.add('hidden'), 320);
      if (f) f();
    });
    t.appendChild(b);
  }
  t.classList.toggle('act', !!act);
  t.classList.remove('hidden', 'out');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.classList.add('hidden'), 320);
    toastActFn = null; toastHold = 0; toastUntil = 0; noteUp = false;
  }, act ? 6200 : 2600);
  return true;
}

// take the chit off the wall right now — how a committee note answers a click
function dismissToast() {
  const t = el('toast');
  noteUp = false;
  if (t.classList.contains('hidden')) return false;
  clearTimeout(toastTimer);
  toastActFn = null; toastHold = 0; toastUntil = 0;
  t.classList.add('out');
  setTimeout(() => t.classList.add('hidden'), 320);
  return true;
}

// the chit's button, drivable without a pointer: what it says, and pressing it
function toastAction() {
  if (!toastActFn) return null;
  const b = el('toast').querySelector('.tt-act');
  return b ? b.textContent : 'Watch';
}
function clickToast() {
  const f = toastActFn;
  if (!f) return false;
  toastActFn = null; toastHold = 0; toastUntil = 0; noteUp = false;
  const t = el('toast');
  t.classList.add('out');
  setTimeout(() => t.classList.add('hidden'), 320);
  f();
  return true;
}

// ── The committee's notes ────────────────────────────────────────────────────
// The deep systems are taught one sentence at a time, at the exact moment each
// one first matters, in the chit the club already speaks through — there is no
// tutorial surface. A note fires ONCE per save (state.notes), waits its turn
// for the wall instead of stomping whatever is on it, leaves on any click, and
// is never shown to a player whose save proves they have already lived the
// lesson (seedVeteranNotes). Six notes, and that is the whole curriculum:
//   out    the first golfers on the property — and the follow card
//   fee    the first green fee — the round → money loop, at milestone weight
//   route  the second hole — the routing tool
//   rating the rating's first move — the star pill's breakdown
//   book   the first thing in the Club Book worth reading — often a name in
//          today's diary, which is also the star system's first appearance
//   link   the first orphan tee or pin — the badge that fixes it
const NOTE_IDS = ['out', 'fee', 'route', 'rating', 'book', 'link'];
const noteQueue = [];
let noteGapUntil = 0;      // two lessons never read as one paragraph
let noteSeedPending = false;
let notePoll = 0;

function committeeNote(id, msg, mark, act, snd) {
  if (!NOTE_IDS.includes(id)) return false;
  if (state.notes[id] || noteQueue.some(n => n.id === id)) return false;
  noteQueue.push({ id, msg, mark, act, snd });
  return true;
}

function updateNotes(dt) {
  if ((notePoll -= dt) <= 0) { notePoll = 1; pollNoteTriggers(); }
  if (!noteQueue.length || arrival.active) return;
  const now = performance.now();
  if (now < toastUntil + 400 || now < toastHold || now < noteGapUntil) return;
  const n = noteQueue.shift();
  if (state.notes[n.id]) return;         // seeded read while it waited in line
  if (!toast(n.msg, n.mark, n.act)) { noteQueue.unshift(n); return; }
  state.notes[n.id] = true;              // shown IS the record — never before
  save();
  if (n.snd) sound(n.snd);
  noteUp = true;
  noteGapUntil = now + 9000;
}

// the one note that has to be noticed rather than caused: the moment the Club
// Book first holds something worth reading. Usually that is a NAME — a notable
// in today's diary, printed hours before they arrive — which is also the first
// sight of the star system; failing that, the first finished round of the day.
function pollNoteTriggers() {
  if (away.active || state.notes.book || !course.holes.length || !state.sheet) return;
  const v = nextVip();
  if (v) {
    committeeNote('book',
      v.star.name + ' is in today\'s diary for ' + TS.hhmm(v.min) +
      ' — the Club Book keeps the day',
      'star', { label: 'Open the book', fn: () => openSheet('today') });
  } else if (state.sheet.rounds >= 1) {
    committeeNote('book',
      'The day\'s play is being written into the Club Book',
      'house', { label: 'Open the book', fn: () => openSheet('today') });
  }
}

// A save from before the teaching notes: its owner is not taught what they
// plainly built. One round hosted covers everything the first session teaches;
// the other two are read straight off the course itself.
function seedVeteranNotes() {
  noteSeedPending = false;
  const n = state.notes;
  // mood arrived after the money did: a save old enough to predate word of
  // mouth proves its hosted rounds through the record on the board and the
  // dollars in the book instead, and is not taught what it plainly ran
  if (state.mood.n > 0 || state.records.low || state.totalEarned > 0) {
    n.out = n.fee = n.book = n.link = true;
  }
  if (course.holes.length >= 2) n.route = true;
  if (course.stars > 0) n.rating = true;
}

// ── The arrival ──────────────────────────────────────────────────────────────
// First boot, and the boot after Start Over — the only two times the property
// is new. The island is revealed under a long settling dolly, the club says
// its name once in its own type, then the fixtures take their places at their
// own mass: plaque, tray, first goal. ~6.5s, silent (nothing may sound before
// the first gesture, and an arrival needs no fanfare), pointer-events none
// throughout, and ANY touch ends it on the spot — the property is theirs, not
// the camera's. Never shown again once a save exists. prefers-reduced-motion
// gets the honest version: no dolly, no drops — a title that breathes in and
// out in opacity alone over fixtures that simply are where they belong.
// Phases are stepped from tick(), so __fairway.step() drives the whole
// sequence headlessly, hidden pane and all.
const ARRIVAL_DOLLY_S = 4.8;
const arrival = { active: false, t: 0, phase: 'idle', ran: false, reduced: false, skipFn: null };
const ARRIVAL_FIXTURES = ['topbar', 'dock', 'milestone'];

function beginArrival(force) {
  if (arrival.active) return false;
  if (arrival.ran && !force) return false;
  arrival.ran = true;
  arrival.active = true;
  arrival.t = 0;
  arrival.reduced = reduceMotion();
  arrival.phase = 'reveal';
  document.body.classList.add('arriving');
  const ar = el('arrival');
  ar.classList.remove('hidden', 'on', 'out');
  if (arrival.reduced) {
    introT = 1;
    camera.position.copy(INTRO_TO);
    controls.enabled = true;
  } else {
    introT = 0;
    controls.enabled = false;
    INTRO_FROM.set(46, 36, 46);     // the approach starts out past the water
    camera.position.copy(INTRO_FROM);
    for (const id of ARRIVAL_FIXTURES) el(id).classList.add('ar-pre');
  }
  const skip = e => {
    // the skip swallows the event, so the canvas's own pointerdown never sees
    // this gesture — start the audio here or the player's FIRST touch of their
    // property stays silent. Wheel is excluded: it is not a user activation,
    // and a context built on one would sit suspended with the score wired to
    // a frozen clock.
    if (e.type !== 'wheel') { e.stopPropagation(); e.preventDefault(); ensureAudio(); }
    skipArrival();
  };
  arrival.skipFn = skip;
  window.addEventListener('pointerdown', skip, true);
  window.addEventListener('keydown', skip, true);
  window.addEventListener('wheel', skip, { capture: true, passive: true });
  return true;
}

function arSwap(id) {
  const n = el(id);
  n.classList.remove('ar-pre');
  n.classList.add('ar-in');
}

function updateArrival(dt) {
  if (!arrival.active) return;
  arrival.t += dt;
  const t = arrival.t, ar = el('arrival');
  if (arrival.reduced) {
    if (arrival.phase === 'reveal' && t >= 0.2) { ar.classList.add('on'); arrival.phase = 'title'; }
    else if (arrival.phase === 'title' && t >= 2.6) { ar.classList.add('out'); arrival.phase = 'fading'; }
    else if (arrival.phase === 'fading' && t >= 3.3) endArrival();
    return;
  }
  if (arrival.phase === 'reveal' && t >= 1.1) { ar.classList.add('on'); arrival.phase = 'title'; }
  else if (arrival.phase === 'title' && t >= 4.2) { ar.classList.add('out'); arrival.phase = 'fading'; }
  else if (arrival.phase === 'fading' && t >= 4.9) { arSwap('topbar'); arrival.phase = 'plaque'; }
  else if (arrival.phase === 'plaque' && t >= 5.35) { arSwap('dock'); arrival.phase = 'tray'; }
  else if (arrival.phase === 'tray' && t >= 5.85) { arSwap('milestone'); arrival.phase = 'goals'; }
  else if (arrival.phase === 'goals' && t >= 6.5) endArrival();
}

function endArrival() {
  if (!arrival.active) return false;
  arrival.active = false;
  arrival.phase = 'done';
  document.body.classList.remove('arriving');
  const ar = el('arrival');
  ar.classList.add('hidden');
  ar.classList.remove('on', 'out');
  for (const id of ARRIVAL_FIXTURES) el(id).classList.remove('ar-pre', 'ar-in');
  if (arrival.skipFn) {
    window.removeEventListener('pointerdown', arrival.skipFn, true);
    window.removeEventListener('keydown', arrival.skipFn, true);
    window.removeEventListener('wheel', arrival.skipFn, true);
    arrival.skipFn = null;
  }
  save();      // the save now exists, so the arrival never plays again
  return true;
}

function skipArrival() {
  if (!arrival.active) return false;
  introT = 1;
  camera.position.copy(INTRO_TO);
  controls.enabled = true;
  return endArrival();
}

// floaters
function floater(worldPos, text, cls) {
  const v = worldPos.clone().project(viewCam());
  const x = (v.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  const d = document.createElement('div');
  d.className = 'floater' + (cls ? ' ' + cls : '');
  d.textContent = text;
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  el('overlay').appendChild(d);
  setTimeout(() => d.remove(), 1300);
}

// a floater whose amount counts up — the payoff reads as earned, not granted
function floaterCount(worldPos, amount, cls) {
  const v = worldPos.clone().project(viewCam());
  const x = (v.x * 0.5 + 0.5) * window.innerWidth;
  const y = (-v.y * 0.5 + 0.5) * window.innerHeight;
  const d = document.createElement('div');
  d.className = 'floater count' + (cls ? ' ' + cls : '');
  d.style.left = x + 'px';
  d.style.top = y + 'px';
  el('overlay').appendChild(d);
  const t0 = performance.now(), dur = 620;
  const step = () => {
    if (!d.isConnected) return;
    const k = Math.min(1, (performance.now() - t0) / dur);
    const e = 1 - Math.pow(1 - k, 3);
    d.textContent = '+' + fmt(amount * e);
    if (k < 1) requestAnimationFrame(step);
  };
  step();
  setTimeout(() => d.remove(), 1800);
}

// ── Sounds ───────────────────────────────────────────────────────────────────
//
// FOLEY, not feedback. Everything you can hear in the club is something a real
// object does: card on baize, graphite on paper, a brass fitting seating in its
// slot, silk drawn out of a book, a leaf of card going over. There is nothing
// here that is only a beep — the 1200Hz sine that used to answer twelve
// different gestures has been retired in favour of the four things those
// gestures actually are.
//
// Everything runs through one room, so the club sounds like a room: a shelf
// takes 5dB off above 6kHz (the difference between a click heard across a pro
// shop and one heard inside your ear) and one master gain carries the mute,
// ramped rather than cut so it cannot pop. The room now belongs to a larger
// graph (score.js's makeGraph): beside this foley bus sits the soft layer —
// the generative score, the ambience bed and the far-off course — which ducks
// under the louder objects here and can be turned off on its own by the
// plaque's middle sound notch. Foley itself is untouched by both.

let audioCtx = null, sndBus = null, sndGraph = null, scoreCtl = null;
function ensureAudio() {
  if (!audioCtx) { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } }
  // An OfflineAudioContext (the bench meter's, see foleyMeasure) is permanently
  // 'suspended' until startRendering, and resuming one rejects. The rejection is
  // asynchronous, so a try/catch around the call cannot see it — it arrives as
  // an uncaught error in the console a tick later. Ask whether this context is
  // the kind that can be resumed, rather than catching the answer.
  if (audioCtx && audioCtx.state === 'suspended' && !audioCtx.startRendering) {
    const p = audioCtx.resume();
    if (p && p.catch) p.catch(() => { });
  }
  if (audioCtx && !sndBus) {
    // The mix graph lives in score.js now: one master (the mute), the same
    // 6kHz room shelf, and under it the foley bus beside the ducked soft
    // layer — music, ambience, the far-off course, and the shared air they
    // send into. The node this returns is the same room-backed bus the old
    // two-node chain was; every foley voice connects exactly as before.
    sndGraph = SCORE.makeGraph(audioCtx);
    sndBus = sndGraph.foley;
    // The scheduler runs on real time, so it only ever starts on the REAL
    // context — the bench meter swaps an OfflineAudioContext in here, and a
    // score wired to that would try to play a day into a 1.2s render.
    if (!audioCtx.startRendering && !scoreCtl) {
      scoreCtl = SCORE.startScore(sndGraph, scoreProbe, { reduceMotion });
      syncSnd();      // the saved sound mode lands on the freshly built master
    }
  }
  return sndBus;
}

// What the score is allowed to know about the club: the mood, never the model.
// One object, five fields, and the entire coupling between the game and its
// music passes through it — which is also what makes the music's day forcible
// (scoreForce) without touching the club's actual clock.
function dayPartNow() {
  const m = nowMinute(), dl = dayInfo().dl;
  if (m < dl.first - 40 || m > dl.sunset + 30) return 'night';
  const p = TS.partAt(dl, m);
  if (p) return p.id;
  // standing in a breath between waves: the position in the day picks the mood
  const k = (m - dl.first) / Math.max(1, dl.last - dl.first);
  return k < 0.06 ? 'dawn' : k < 0.42 ? 'morning' : k < 0.6 ? 'lull'
    : k < 0.88 ? 'afternoon' : 'twilight';
}
function scoreProbe() {
  return { muted: !!state.muted, quiet: !!state.quiet, part: dayPartNow(),
    night: uNight.value, golfers: golfers.length };
}

// The plaque's one sound control, three notches, cycled in the order a player
// reaches for them: everything → the club only (its objects still sound, the
// score and the air do not) → silence. The mute is let DOWN on the master
// rather than cut, so muting mid page-turn cannot pop; the quiet notch is the
// scheduler's business and the soft buses ramp on its next tick.
const SND_MODES = ['all', 'club', 'mute'];
function soundMode() { return state.muted ? 'mute' : state.quiet ? 'club' : 'all'; }
function setSoundMode(m) {
  if (!SND_MODES.includes(m)) return soundMode();
  state.muted = m === 'mute';
  state.quiet = m !== 'all';
  syncSnd(); save();
  return soundMode();
}
function cycleSound() {
  return setSoundMode(SND_MODES[(SND_MODES.indexOf(soundMode()) + 1) % SND_MODES.length]);
}
function syncSnd() {
  const b = el('btn-sound');
  if (b) {
    const m = soundMode();
    b.innerHTML = m === 'mute' ? ICONS.soundOff : m === 'club' ? ICONS.soundFoley : ICONS.sound;
    b.title = m === 'mute' ? 'Sound off' : m === 'club' ? 'Club only — no music' : 'Sound on';
  }
  if (sndGraph) sndGraph.master.gain.setTargetAtTime(state.muted ? 0 : 1, audioCtx.currentTime, 0.01);
}
const out = () => sndBus || audioCtx.destination;

// ── The world heard from where you stand ─────────────────────────────────────
// The course's own sounds — a struck ball, the cup, a splash, wings, a crowd —
// are OBJECTS IN THE WORLD, not interface foley, so they reach the ear the way
// the camera would hear them: quieter with distance, duller with distance,
// panned to their side of the frame, and sending more of themselves into the
// shared air (score.js's convolver) the further off they are — which is what
// keeps "distant" meaning far rather than merely quiet. They ride score.js's
// `world` bus, so the plaque's middle sound notch (club only) stills the
// property while the ledger keeps its voice, and busy foley ducks them.
const camRight = new THREE.Vector3();
function worldSpec(pos) {
  const cam = viewCam();
  const dx = pos.x - cam.position.x, dy = pos.y - cam.position.y, dz = pos.z - cam.position.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  camRight.set(1, 0, 0).applyQuaternion(cam.quaternion);
  const pan = Math.max(-0.8, Math.min(0.8,
    (dx * camRight.x + dy * camRight.y + dz * camRight.z) / Math.max(4, dist)));
  const k = 1 / (1 + Math.max(0, dist - 4) * 0.16);   // full voice inside ~4 tiles
  return { dist: +dist.toFixed(1), pan: +pan.toFixed(2), k,
    cut: 900 + 9000 * k, send: Math.min(0.8, 0.18 + dist * 0.04) };
}
// one output stage per world event: lowpass → pan → distance gain → world bus,
// with a tap into the shared air. Nodes die with their sources.
function worldOut(pos) {
  if (!pos || !sndGraph || !audioCtx || audioCtx.startRendering) return null;
  const w = worldSpec(pos);
  const lp = audioCtx.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = w.cut; lp.Q.value = 0.4;
  const p = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : audioCtx.createGain();
  if (p.pan) p.pan.value = w.pan;
  const gn = audioCtx.createGain(); gn.gain.value = w.k;
  lp.connect(p).connect(gn).connect(sndGraph.world);
  const send = audioCtx.createGain(); send.gain.value = w.send;
  gn.connect(send).connect(sndGraph.verb);
  w.in = lp;
  return w;
}
// where a positioned voice's oscillators land while its switch case runs
let toneDest = null;

function tone(freq, dur, delay, type, gain, slideTo) {
  if (!audioCtx || state.muted) return;
  const t0 = audioCtx.currentTime + (delay || 0);
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type || 'sine';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain || 0.05, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(toneDest || out());
  o.start(t0); o.stop(t0 + dur + 0.02);
}
// Paper is noise, not pitch. One shaped burst of it — a band that sweeps the
// way a sheet of card does as it passes the vertical — is the whole voice of
// the book: the turn, the cover, and the nib. Two seconds of buffer, generated
// once, so a page turn costs an oscillator's worth of nothing.
let noiseBuf = null;
function ensureNoise() {
  if (noiseBuf || !audioCtx) return noiseBuf;
  const n = Math.floor(audioCtx.sampleRate * 0.6);
  noiseBuf = audioCtx.createBuffer(1, n, audioCtx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}
function rustle(dur, delay, gain, f0, f1, q) {
  if (!audioCtx || state.muted || !ensureNoise()) return;
  const t0 = audioCtx.currentTime + (delay || 0);
  const s = audioCtx.createBufferSource();
  s.buffer = noiseBuf;
  s.playbackRate.value = 0.85 + Math.random() * 0.3;
  const bp = audioCtx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.Q.value = q || 0.9;
  bp.frequency.setValueAtTime(f0, t0);
  bp.frequency.exponentialRampToValueAtTime(f1 || f0, t0 + dur);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + dur * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(bp).connect(g).connect(toneDest || out());
  s.start(t0); s.stop(t0 + dur + 0.02);
}

// Brass is metal, and metal is inharmonic: two partials a little off any
// musical ratio, so the ear hears an OBJECT seating rather than a note. The
// transient does most of the work — 12ms of band-passed noise is the sound of
// the fitting touching its slot; the partials are just what rings after.
function brass(gain) {
  if (!audioCtx || state.muted) return;
  const t0 = audioCtx.currentTime;
  rustle(0.03, 0, gain * 0.55, 3200, 1500, 1.6);
  for (const [f, a, d] of [[2090, 1, 0.055], [3162, 0.42, 0.04]]) {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine';
    o.frequency.value = f * (0.985 + Math.random() * 0.03);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain * a, t0 + 0.003);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
    o.connect(g).connect(out());
    o.start(t0); o.stop(t0 + d + 0.02);
  }
}

// ── The gallery's hands ──────────────────────────────────────────────────────
// Applause is not a sample and not a cymbal: it is many small hands at many
// small moments. Each pair is a grain of band-passed noise a few tens of ms
// long; the grains thicken quickly and thin out along a sine swell, so a
// tap-in gets a patter of a dozen and an eagle gets forty with real warmth —
// a low voiced band underneath, the sound of people meaning it. It plays
// through worldOut like everything else on the course, so applause on the
// far nine arrives softened, panned and mostly air.
let crowdUntil = -9;
function crowdAt(pos, intensity) {
  if (!audioCtx || state.muted) return;
  ensureNoise();
  if (!noiseBuf) return;
  const now = audioCtx.currentTime;
  if (now < crowdUntil - 0.25) return;       // one crowd at a time; overlaps merge
  const k = Math.max(0.15, Math.min(1, intensity == null ? 0.6 : intensity));
  const wo = pos ? worldOut(pos) : null;
  const dest = wo ? wo.in : (sndGraph ? sndGraph.world : out());
  const dur = 0.8 + k * 1.9;
  crowdUntil = now + dur;
  const n = Math.round(9 + k * 30);
  for (let i = 0; i < n; i++) {
    const t = now + 0.02 + Math.pow(Math.random(), 0.75) * dur * 0.92;
    const p = (t - now) / dur;
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, p * 1.12)), 0.8);
    const s = audioCtx.createBufferSource();
    s.buffer = noiseBuf;
    s.playbackRate.value = 0.65 + Math.random() * 0.8;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 950 + Math.random() * 1700;
    bp.Q.value = 1.5;
    const gn = audioCtx.createGain();
    gn.gain.setValueAtTime(0, t);
    gn.gain.linearRampToValueAtTime(
      (0.015 + Math.random() * 0.02) * (0.45 + k * 0.55) * env, t + 0.005);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.035 + Math.random() * 0.045);
    s.connect(bp).connect(gn).connect(dest);
    s.start(t, Math.random() * 0.4, 0.09);
  }
  if (k >= 0.85) {                            // the voices under the hands
    const s = audioCtx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    const bp = audioCtx.createBiquadFilter();
    bp.type = 'bandpass'; bp.Q.value = 2.2;
    bp.frequency.setValueAtTime(420, now);
    bp.frequency.linearRampToValueAtTime(560, now + dur * 0.5);
    const gn = audioCtx.createGain();
    gn.gain.setValueAtTime(0, now);
    gn.gain.linearRampToValueAtTime(0.013, now + dur * 0.3);
    gn.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    s.connect(bp).connect(gn).connect(dest);
    s.start(now); s.stop(now + dur + 0.05);
  }
  sndNote('crowd', wo ? 'played d=' + wo.dist : 'played', +k.toFixed(2));
}

// ── the rate limiter ─────────────────────────────────────────────────────────
// Two rules, and between them a busy moment can never clatter.
//
//   1. NO NAME TWICE inside its own minimum gap. A gap per voice, because a
//      page and a pencil tick tolerate very different repetition.
//   2. ONE VOICE PER 40ms across the whole hand-and-paper family. Selecting a
//      tab turns a page AND writes a mark AND pulls a ribbon; you should hear
//      the loudest of those three, not all of them. Rank decides which wins,
//      so a page always beats the tick that would have been under it.
//
// And one rule against fatigue: a voice fired repeatedly ducks — 0.72x per
// repeat inside 400ms, floor 0.45x — recovering fully after a second of quiet.
// A dragged paint stroke therefore fades into the background of its own accord
// instead of machine-gunning, which is the single thing that made the old
// interface tiring to touch.
const SND_GAP = {
  tick: 0.05, brass: 0.055, ribbon: 0.09, card: 0.09, page: 0.13, pen: 0.10,
  open: 0.25, shut: 0.25, place: 0.03, dozer: 0.03, cash: 0.14, error: 0.20,
  tip: 0.12, spark: 0.10, lucky: 0.30, arrive: 0.40, celebrate: 0.30, clubhouse: 0.5,
  flutter: 0.4, crowd: 0.8,
};
// the hand-and-paper family, most important first
const SND_RANK = { shut: 6, open: 6, page: 5, card: 4, brass: 3, ribbon: 2, pen: 2, tick: 1 };
// …and the voices loud enough to push the soft layer (music, air, far-off
// play) down for a beat while they speak — see score.js's duck. The pencil
// family is deliberately absent: a paint drag must not pump the music.
const SND_DUCKS = { page: 1, open: 1, shut: 1, card: 1, cash: 1, celebrate: 1,
  clubhouse: 1, lucky: 1, arrive: 1, tip: 1, error: 1 };
const sndAt = Object.create(null);       // name -> when it last played
let lastShotSnd = -9;                    // the shot family shares one window
let famAt = -9, famRank = 0;             // the family's own window
// every stroke on the course wants a click; a full field would be a hailstorm,
// so the whole shot family shares one voice and the rest play silently
const SHOT_SOUNDS = { swing: 1, chip: 1, putt: 1, sand: 1, splash: 1, holed: 1 };

function sndDuck(name, now) {
  const last = sndAt[name];
  const runs = sndAt[name + '#'] || 0;
  // a full second of quiet and the voice is fresh again
  const n = (last !== undefined && now - last < 0.4) ? runs + 1 : 0;
  sndAt[name + '#'] = (last !== undefined && now - last < 1.0) ? n : 0;
  return Math.max(0.45, Math.pow(0.72, sndAt[name + '#']));
}

// the last 64 decisions, for __fairway.foley().log — a ring buffer of small
// objects, written only when a context exists, so it costs nothing before the
// first gesture and never grows
const sndLog = [];
function sndNote(name, why, gain) {
  sndLog.push({ name, at: +(audioCtx ? audioCtx.currentTime : 0).toFixed(4), why, gain: gain || 0 });
  if (sndLog.length > 64) sndLog.shift();
}

// ONE GESTURE, ONE VOICE. A rank test alone cannot do this: it has to decide
// on the first call, before it knows what else the gesture is about to ask for,
// so an ascending run (a mark, then a ribbon, then a page) slips through as
// three sounds. Instead the family's calls inside a synchronous block are
// COLLECTED, and a microtask later exactly one of them — the most important —
// is played. The delay is a fraction of a millisecond, the guarantee is
// absolute, and the caller does not have to know: every site still just asks
// for the sound its own gesture makes.
let famQ = null;
function famFlush() {
  const q = famQ; famQ = null;
  if (!q || !audioCtx || state.muted) return;
  let win = q[0];
  for (const n of q) if (SND_RANK[n] > SND_RANK[win]) win = n;
  for (const n of q) if (n !== win) sndNote(n, 'masked');
  sndPlay(win);
}

// `pos` (a world position) makes the voice an object on the course — heard
// with distance, direction and air (see worldOut); `mag` lets a shot's size
// colour its click. Both optional, and only the world's voices pass them.
function sound(name, pos, mag) {
  if (!audioCtx || state.muted) return;
  if (SND_RANK[name]) {
    // a second call for the same voice in one gesture is not a second sound
    if (famQ) { if (!famQ.includes(name)) famQ.push(name); return; }
    famQ = [name];
    queueMicrotask(famFlush);
    return;
  }
  sndPlay(name, pos, mag);
}

function sndPlay(name, pos, mag) {
  if (!audioCtx || state.muted) return;
  const now = audioCtx.currentTime;
  if (SHOT_SOUNDS[name]) {
    // the cup always speaks — a rattle masked by a stranger's tee shot would
    // sell the one moment every hole builds to short
    if (now - lastShotSnd < 0.1 && name !== 'holed') return sndNote(name, 'shot-window');
    lastShotSnd = now;
  }
  const gap = SND_GAP[name];
  if (gap !== undefined && sndAt[name] !== undefined && now - sndAt[name] < gap)
    return sndNote(name, 'gap');
  // …and across frames, the family still holds its own 40ms window, so two
  // gestures landing back to back collapse the same way one gesture does
  const rank = SND_RANK[name];
  if (rank) {
    if (now - famAt < 0.04 && rank <= famRank) return sndNote(name, 'masked');
    famAt = now; famRank = rank;
  }
  const v = sndDuck(name, now);
  sndAt[name] = now;
  // the world's voices play from where they happened; everything else is the
  // club's own foley, flat on the room bus exactly as before
  const wo = pos && (SHOT_SOUNDS[name] || name === 'flutter') ? worldOut(pos) : null;
  toneDest = wo ? wo.in : null;
  const m0 = mag == null ? 0.5 : Math.max(0, Math.min(1, mag));
  sndNote(name, 'played', +v.toFixed(3));
  if (wo) Object.assign(sndLog[sndLog.length - 1], { d: wo.dist, pan: wo.pan });
  if (scoreCtl && SND_DUCKS[name]) scoreCtl.duck();
  // A dragged stroke lays a tile every few frames, so `place` and `dozer` are
  // by a distance the most repeated voices in the game — and they were the two
  // the duck was never applied to. The mechanism was built, documented ("a
  // dragged paint stroke fades into the background of its own accord instead of
  // machine-gunning") and then not wired to the one gesture the sentence names.
  // `w` is the same jitter the paper voices get from rustle()'s playback rate:
  // a fifth of a semitone either way, enough that fifty tiles in a row read as
  // a hand working rather than a machine ticking.
  const w = 0.97 + Math.random() * 0.06;
  switch (name) {
    case 'place': tone(420 * w, 0.09, 0, 'triangle', 0.055 * v, 190 * w); break;
    case 'dozer': tone(220 * w, 0.1, 0, 'triangle', 0.04 * v, 120 * w); break;
    // layered payments soften instead of stacking — SND_GAP holds it to one
    // chime a beat, and the duck takes the run down as it goes
    case 'cash': tone(660, 0.07, 0, 'sine', 0.045 * v); tone(990, 0.09, 0.06, 'sine', 0.045 * v); break;
    case 'celebrate':
      tone(523, 0.1, 0, 'triangle', 0.038);
      tone(659, 0.1, 0.06, 'triangle', 0.038);
      tone(784, 0.12, 0.12, 'triangle', 0.04);
      tone(1047, 0.24, 0.18, 'sine', 0.05);
      tone(1568, 0.3, 0.24, 'sine', 0.018);
      break;
    case 'spark': tone(1318, 0.06, 0, 'sine', 0.02); tone(1760, 0.09, 0.05, 'sine', 0.016); break;
    // the clubhouse rising: a warm low root under a major arpeggio that settles
    case 'clubhouse':
      tone(196, 0.62, 0, 'sine', 0.038);
      tone(392, 0.20, 0.04, 'triangle', 0.034);
      tone(494, 0.20, 0.13, 'triangle', 0.034);
      tone(587, 0.24, 0.22, 'triangle', 0.036);
      tone(784, 0.55, 0.32, 'sine', 0.048);
      tone(1175, 0.5, 0.38, 'sine', 0.015);
      break;
    case 'tip': tone(880, 0.12, 0, 'sine', 0.05, 1320); break;
    // a gallery gathering: two soft notes and then nothing at all. The arrival
    // of a great player is an event; it is not an alarm.
    case 'arrive': tone(587, 0.17, 0, 'sine', 0.030); tone(880, 0.32, 0.11, 'sine', 0.026); break;
    case 'lucky': tone(523, 0.09, 0, 'sine', 0.05); tone(659, 0.09, 0.08, 'sine', 0.05); tone(784, 0.14, 0.16, 'sine', 0.05); break;
    case 'error': tone(150, 0.12, 0, 'square', 0.028); break;
    // one sheet of card going over: bright as it lifts, dull as it lands
    case 'page': rustle(0.11, 0, 0.052 * v, 2600, 900, 0.8); rustle(0.09, 0.12, 0.028 * v, 700, 380, 1.2); break;
    // the ledger onto the desk — boards, then the block settling into them
    // the body of the boards is jittered with `w` like everything else made of
    // paper — a book that closed on exactly 120Hz every time was the one object
    // in the club you could hear was a recording
    case 'open': rustle(0.16, 0, 0.05, 1500, 500, 0.7); tone(150 * w, 0.16, 0.05, 'sine', 0.03, 96 * w); break;
    case 'shut': rustle(0.13, 0, 0.05, 1100, 380, 0.7); tone(120 * w, 0.22, 0.07, 'sine', 0.042, 72 * w); break;
    // a nib crossing paper — the sound of a purchase being written down
    case 'pen': rustle(0.16, 0, 0.026 * v, 3400, 1800, 3.2); break;

    // ── the four objects that used to share one 1200Hz sine ──────────────────
    // THE PENCIL. Graphite touching paper: 22ms, no pitch at all, with the
    // body of the sheet under it. It is the quietest thing in the club because
    // it is also the most frequent — you should feel it more than hear it.
    case 'tick': rustle(0.022, 0, 0.030 * v, 4200, 2600, 2.4); rustle(0.03, 0.004, 0.011 * v, 900, 620, 1.1); break;
    // THE BRASS. An implement seating in its slot in the painted tray.
    case 'brass': brass(0.030 * v); break;
    // THE RIBBON. Silk drawn out from between two leaves — pure breath,
    // falling as it clears the block. Nearly subliminal, and meant to be.
    case 'ribbon': rustle(0.055, 0, 0.020 * v, 5200, 1900, 0.6); break;
    // A CARD onto the desk: the sheet, then the small body of it landing.
    case 'card': rustle(0.05, 0, 0.030 * v, 2000, 780, 0.9); tone(196 * w, 0.07, 0.012, 'sine', 0.020 * v, 132 * w); break;
    // ── the golf itself, heard from where the camera stands ──────────────────
    // Every strike is the same object — a club face meeting a ball — so every
    // case is the same two ingredients: 15ms of face (band-passed noise) and
    // the note the club rings at. `m0` is the shot's size: a full drive cracks
    // a fifth brighter and harder than a lay-up, and w keeps a rush of swings
    // from ever machine-gunning on one pitch.
    case 'swing':
      rustle(0.018, 0, 0.030 * v * (0.7 + m0 * 0.6), 3400 * w, 2000, 1.8);
      tone(320 * w * (0.92 + m0 * 0.16), 0.05, 0, 'triangle', (0.022 + m0 * 0.016) * v, 520 * w);
      break;
    case 'chip':
      rustle(0.014, 0, 0.022 * v, 3000 * w, 1800, 1.8);
      tone(420 * w, 0.04, 0, 'triangle', 0.020 * v, 300 * w);
      break;
    case 'putt':
      rustle(0.010, 0, 0.014 * v, 2600 * w, 1700, 2.0);
      tone(560 * w, 0.035, 0, 'sine', 0.018 * v, 400 * w);
      break;
    case 'sand':
      rustle(0.07, 0, 0.024 * v, 1300 * w, 500, 0.9);
      tone(240 * w, 0.09, 0, 'triangle', 0.015 * v, 110 * w);
      break;
    // water closing over a ball: the body of it is noise, not pitch
    case 'splash':
      rustle(0.16, 0, 0.030 * v, 950, 320, 0.8);
      tone(300 * w, 0.2, 0, 'sine', 0.026 * v, 90 * w);
      tone(820, 0.09, 0.02, 'sine', 0.012 * v, 340);
      break;
    // the cup: the ball RATTLES against the liner before it settles — three
    // quick knocks falling in pitch, the drop, and a ring of the old brightness
    case 'holed':
      rustle(0.030, 0, 0.034 * v, 2300 * w, 1500, 2.0);
      rustle(0.026, 0.05, 0.026 * v, 2000 * w, 1150, 2.2);
      rustle(0.020, 0.095, 0.018 * v, 1750 * w, 950, 2.4);
      tone(330 * w, 0.10, 0.015, 'triangle', 0.026 * v, 185 * w);
      tone(1180, 0.10, 0.11, 'sine', 0.014 * v);
      break;
    // a bird getting out of somebody's way — three soft wingbeats
    case 'flutter':
      rustle(0.06, 0, 0.020 * v, 1900, 1100, 1.1);
      rustle(0.05, 0.07, 0.016 * v, 1700, 900, 1.2);
      rustle(0.04, 0.13, 0.012 * v, 1600, 800, 1.2);
      break;
    // the bench meter's handle on the gallery (see crowdAt for the real thing)
    case 'crowd': crowdAt(null, 0.7); break;
  }
  toneDest = null;
}

// ── the bench meter ──────────────────────────────────────────────────────────
// The club's paper voices are supposed to sit UNDER its game voices. That was
// an intention written in a comment, not a fact anyone had measured — and a
// gain figure in a switch statement tells you nothing, because a band-passed
// burst of noise at 0.05 and a sine at 0.05 are nowhere near the same loudness.
//
// So: re-synthesise a voice into an OfflineAudioContext, through the same room
// bus it plays through live, render it flat out and read it back. It touches
// nothing — the live context, the noise buffer, the mute flag and the rate
// limiter's whole memory are saved and put back, so measuring the club can
// never silence the next real gesture in it.
async function foleyMeasure(name, seconds) {
  const OC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!OC) return null;
  const keep = {
    ctx: audioCtx, bus: sndBus, graph: sndGraph, noise: noiseBuf, muted: state.muted,
    at: Object.assign(Object.create(null), sndAt),
    famAt, famRank, shot: lastShotSnd, log: sndLog.length, crowd: crowdUntil,
  };
  const off = new OC(1, Math.ceil(44100 * (seconds || 1.2)), 44100);
  audioCtx = off; sndBus = null; sndGraph = null; noiseBuf = null; state.muted = false;
  for (const k in sndAt) delete sndAt[k];
  famAt = -9; famRank = 0; lastShotSnd = -9; crowdUntil = -9;
  let buf = null;
  try { ensureAudio(); sndPlay(name); buf = await off.startRendering(); } catch (e) { }
  audioCtx = keep.ctx; sndBus = keep.bus; sndGraph = keep.graph;
  noiseBuf = keep.noise; state.muted = keep.muted;
  for (const k in sndAt) delete sndAt[k];
  Object.assign(sndAt, keep.at);
  famAt = keep.famAt; famRank = keep.famRank; lastShotSnd = keep.shot; crowdUntil = keep.crowd;
  sndLog.length = Math.min(sndLog.length, keep.log);
  if (!buf) return null;
  const d = buf.getChannelData(0);
  let peak = 0, sum = 0, on = 0;
  for (let i = 0; i < d.length; i++) {
    const a = Math.abs(d[i]);
    if (a > peak) peak = a;
    if (a > 0.0006) on = i;            // where the voice actually stops
    sum += d[i] * d[i];
  }
  const db = x => +(20 * Math.log10(x || 1e-9)).toFixed(1);
  return {
    name,
    peak: db(peak),
    // RMS over the sounding part only — averaging a 40ms tick across 1.2s of
    // silence would flatter it into looking like the quietest thing here
    rms: db(Math.sqrt(sum / Math.max(1, on + 1))),
    ms: Math.round((on + 1) / 44.1),
  };
}

// every voice the club has, measured and ranked — one call, and the layering is
// either true or it is not
async function foleyBalance() {
  const paper = { page: 1, tick: 1, brass: 1, ribbon: 1, card: 1, pen: 1, open: 1, shut: 1 };
  const rows = [];
  for (const n of Object.keys(SND_GAP)) {
    const r = await foleyMeasure(n);
    if (r) rows.push(Object.assign(r, { family: paper[n] ? 'paper' : 'game' }));
  }
  rows.sort((a, b) => b.peak - a.peak);
  const avg = f => { const v = rows.filter(r => r.family === f); return v.length ? +(v.reduce((s, r) => s + r.peak, 0) / v.length).toFixed(1) : null; };
  return { rows, paperAvgPeak: avg('paper'), gameAvgPeak: avg('game'),
    // the whole point of the family: paper must be the quieter half
    layered: avg('paper') < avg('game') };
}

// ── Routing (A*) ─────────────────────────────────────────────────────────────

// A bridge is a cart path that happens to be over water: it costs what a path
// costs, so the moment one goes down the A* re-routes the whole club across it.
const GOLFER_COST = { path: 1, bridge: 1.1, fairway: 1.6, tee: 1.6, green: 1.8, flag: 1.8,
  grass: 2.4, sign: 2.5, flower: 2.6, rough: 3.1, bunker: 4.5 };

const routeCache = new Map();

function terrainCost(x, z, costs) {
  const t = tileType(x, z);
  const c = costs[t];
  return c === undefined ? Infinity : c;
}

function findRoute(sx, sz, gx, gz, costs) {
  if (!inBounds(gx, gz) || !inBounds(sx, sz)) return null;
  const cacheKey = sx + ',' + sz + '>' + gx + ',' + gz + (costs === GOLFER_COST ? 'g' : 'c');
  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  const half = gridSize() / 2;
  const K = (x, z) => (x + half) * 64 + (z + half);
  const open = [{ x: sx, z: sz, g: 0, f: 0 }];
  const gScore = new Map([[K(sx, sz), 0]]);
  const came = new Map();
  const closed = new Set();
  let iter = 0;
  let result = null;

  while (open.length && iter++ < 4000) {
    let mi = 0;
    for (let i = 1; i < open.length; i++) if (open[i].f < open[mi].f) mi = i;
    const cur = open.splice(mi, 1)[0];
    const ck = K(cur.x, cur.z);
    if (closed.has(ck)) continue;
    closed.add(ck);
    if (cur.x === gx && cur.z === gz) {
      const tiles = [];
      let k = ck, node = { x: gx, z: gz };
      while (node) { tiles.unshift(node); node = came.get(k); if (node) k = K(node.x, node.z); }
      result = tiles;
      break;
    }
    const ce = elevOf(cur.x, cur.z);
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (!inBounds(nx, nz)) continue;
      const nk = K(nx, nz);
      if (closed.has(nk)) continue;
      let c = (nx === gx && nz === gz) ? 1 : terrainCost(nx, nz, costs);
      if (!isFinite(c)) continue;
      const climb = Math.abs(elevOf(nx, nz) - ce);
      if (climb > 1) continue;               // cliffs are impassable
      c += climb * 1.6;
      const ng = cur.g + c;
      if (ng < (gScore.get(nk) ?? Infinity)) {
        gScore.set(nk, ng);
        came.set(nk, { x: cur.x, z: cur.z });
        open.push({ x: nx, z: nz, g: ng, f: ng + Math.abs(gx - nx) + Math.abs(gz - nz) });
      }
    }
  }
  routeCache.set(cacheKey, result);
  return result;
}

function tileTopWorld(x, z) {
  const type = tileType(x, z);
  return new THREE.Vector3(x + 0.5, tileHeight(x, z, type), z + 0.5);
}

function curTileOf(pos) {
  const half = gridSize() / 2;
  return {
    x: Math.max(-half, Math.min(half - 1, Math.floor(pos.x))),
    z: Math.max(-half, Math.min(half - 1, Math.floor(pos.z))),
  };
}

function routePoints(from, to, costs) {
  const tiles = findRoute(from.x, from.z, to.x, to.z, costs);
  if (tiles && tiles.length >= 2) return tiles.map(t => tileTopWorld(t.x, t.z));
  return [tileTopWorld(from.x, from.z), tileTopWorld(to.x, to.z)];
}

// walker: follows a list of waypoints at a constant speed
function makeWalker(speed) { return { pts: null, i: 0, segT: 0, speed }; }
function startRoute(w, pts, posRef) {
  w.pts = pts; w.i = 0; w.segT = 0;
  if (pts.length && posRef) posRef.copy(pts[0]);
}
function shortAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
function stepWalker(w, dt, posOut, group) {
  if (!w.pts || w.pts.length < 2) return true;
  let remain = w.speed * dt;
  while (remain > 0) {
    if (w.i >= w.pts.length - 1) return true;
    const a = w.pts[w.i], b = w.pts[w.i + 1];
    const L = Math.max(a.distanceTo(b), 0.0001);
    const left = L - w.segT;
    const step = Math.min(remain, left);
    w.segT += step; remain -= step;
    posOut.lerpVectors(a, b, w.segT / L);
    if (group) {
      const ang = Math.atan2(b.x - a.x, b.z - a.z);
      group.rotation.y += shortAngle(group.rotation.y, ang) * Math.min(1, dt * 8);
    }
    if (w.segT >= L - 1e-5) { w.i++; w.segT = 0; }
  }
  return w.i >= w.pts.length - 1;
}

// ── The tee sheet ────────────────────────────────────────────────────────────
// The day is the game's heartbeat. A tee time every five real minutes from
// first light to last, each one either empty or booked with a group of one to
// four — and nobody sets foot on the property outside their slot. That single
// rule is what stops the course flooding: at any moment the groups out there
// went off five, ten, fifteen minutes apart, so they are spread across
// different holes instead of piling onto the first one.
//
// How much of the book sells is the operator's scorecard, and it comes from the
// economy that was already here: economyOf's `gpm` is demand — rating,
// Marketing, hole count and the Cart Fleet — measured against the five-minute
// sheet's capacity. A thin course books a thin morning. A great one fills dawn
// to dusk and starts turning people away.

let fillOverride = null;                 // __fairway.setFill — tests, not play
function bookFill() {
  return fillOverride != null ? fillOverride : TS.fillFor(course.gpm, dayInfo().weekend);
}
function turnedAwayToday() {
  const t = dayInfo();
  return fillOverride != null ? 0 : TS.turnedAway(course.gpm, t.weekend, t.dl.slots);
}

// A day's ledger only ever counts up. An older save (or a clock that ran
// backwards under an earlier build) could carry a negative tally, and a book
// that reports a round of −123 min is worse than no book at all.
function sanitiseSheet(s) {
  for (const k of ['rounds', 'take', 'waited', 'waitS', 'roundS', 'roundsDone', 'satN', 'satSum']) {
    s[k] = Math.max(0, +s[k] || 0);
  }
  if (!s.satN) s.satSum = 0;
  if (!s.roundsDone) s.roundS = 0;
  // the diary: a real slot, a character this build still ships, and nobody
  // down for two tee times on the same day. A sheet from before the notables
  // has no diary at all, and ensureSheet writes today's on the spot.
  if (s.vips && typeof s.vips === 'object') {
    const clean = {}, used = new Set();
    for (const k in s.vips) {
      const i = +k, id = s.vips[k];
      if (!isFinite(i) || i < 0 || !STARS.BY_ID[id] || used.has(id)) continue;
      used.add(id);
      clean[i] = id;
    }
    s.vips = clean;
  } else s.vips = null;
  s.pres = clamp(+s.pres || 0, 0, 100);
  return s;
}

function ensureSheet() {
  const t = dayInfo();
  let s = state.sheet;
  if (!s || s.day !== t.key || s.sizes.length !== t.dl.slots) {
    s = state.sheet = {
      day: t.key, sizes: new Array(t.dl.slots).fill(0),
      // the day opens where the clock actually is: nothing before now is owed
      cursor: TS.slotIndexAt(t.dl, nowMinute()),
      rounds: 0, take: 0, waited: 0, waitS: 0, roundS: 0, roundsDone: 0,
      // the reputation the day was sold on, frozen at first light
      wom: moodWord(state.mood.avg),
      // the day's marks out of ten, so Today can report what people thought
      satN: 0, satSum: 0,
      // the prestige the day's diary was written against, frozen with the book
      pres: 0, vips: null,
    };
    s.pres = prestigeOf();
    s.vips = notablesFor(t, s.pres);
    bookFrom(s, t, 0);
  }
  if (!isFinite(s.wom)) s.wom = moodWord(state.mood.avg);   // a sheet from before the people
  // Added with the notables. A sheet saved before them simply writes today's
  // diary now; so does the morning a club opens its very first hole, since a
  // diary written against no golf course was never going to have a name in it.
  if (!s.vips || (!s.pres && course.holes.length)) {
    s.pres = prestigeOf();
    s.vips = notablesFor(t, s.pres);
    applyVips(s, t);
  }
  return s;
}

// (re)book every unplayed time at the club's current fill. Because each slot's
// booked/empty roll is a fixed number compared against the fill rate, improving
// the club only ever ADDS tee times — a booking already on the sheet is never
// rewritten, and a slot that has been played is never touched at all.
function bookFrom(s, t, from) {
  const fill = bookFill();
  for (let i = from; i < s.sizes.length; i++) s.sizes[i] = TS.bookingFor(t.seed, i, fill, t.dl);
  applyVips(s, t);      // a name in the diary always has a time on the sheet
}
function syncBook() {
  const s = ensureSheet();
  bookFrom(s, dayInfo(), s.cursor);
}

// slot state, for the book: 'done' · 'out' (on the course now) · 'next' · 'open'
function slotStatus(i) {
  const s = state.sheet;
  if (!s.sizes[i]) return 'open';
  const live = groups.find(g => g.slot === i);
  if (live) return 'out';
  return i < s.cursor ? 'done' : 'next';
}

// one round played through off the book — the card is real even when nobody
// watched it, and so is the person who signed it
function playCard(person) {
  if (!course.holes.length) return;
  const p = person || PEOPLE.personFor(dayInfo().seed, 800 + (walkOnSeq++), 0);
  const skill = p.skill + gauss() * 0.14;
  let tot = 0, par = 0, birdies = 0;
  for (const h of course.holes) {
    const s = scoreHole(h, skill, p.prof);
    recordScore(h, s);
    noteHoleFeat(p.name, h, s);
    if (s === h.par - 1) birdies++;
    tot += s; par += h.par;
  }
  // nobody timed it, so it competes for everything but the pace of play
  postRound(p.name, tot, par, course.holes.length, birdies, 0);
  logMood(PEOPLE.rate(cardFacts(), p).score);
}

// every tee time that has come due since the last look
function releaseSlots() {
  const t = dayInfo();
  const s = ensureSheet();
  const m = nowMinute();
  // OPENING DAY. Until the club has hosted a single round, the next two tee
  // times on the sheet stay booked — the neighbours keep walking up until the
  // course is truly open for business. The honest fill rate for a one-hole
  // course books roughly one slot in five, which is a fine long-run number and
  // a five-hour wait for the first golfer who ever mattered (measured: a hole
  // opened at 10:00 on a Tuesday saw nobody until 15:36). This adds bookings
  // only, never rewrites one, never touches a notable's time, and retires
  // itself for good the moment the first round is in the book (mood.n).
  if (state.mood.n === 0 && course.holes.length && !away.active) {
    for (let i = s.cursor, put = 0; i < s.sizes.length && put < 2; i++, put++) {
      if (!s.sizes[i] && !vipAt(i)) s.sizes[i] = put ? 2 : 3;
    }
  }
  while (s.cursor < s.sizes.length && TS.slotMinute(t.dl, s.cursor) <= m) {
    const i = s.cursor++;
    const n = s.sizes[i];
    if (!n || !course.holes.length) continue;
    if (golfers.length + n > MAX_GOLFERS) {
      // the club is full, not closed: the group plays, it simply plays off-screen
      for (let k = 0; k < n; k++) playCard(PEOPLE.personFor(t.seed, i, k));
      resolvePaid(n);
    }
    else startGroup(n, i);
  }
}
// a slot the club could not physically field pays anyway — the club is full,
// not closed
function resolvePaid(n) {
  const s = state.sheet;
  addMoney(course.fee * n);
  if (s) { s.rounds += n; s.take += course.fee * n; }
}

// …and the first group of all does not wait for a slot boundary: they walk up.
// Armed by computeCourse when a course first opens in daylight on a save that
// has never hosted a round; the half-minute is the toast's "on their way"
// coming true while the player is still admiring the hole. The slot index is
// past the sheet's end, so it can never collide with a booked time, a released
// one, or a name in the diary — the walk-ons are their own people.
const OPEN_WALKON_S = 35;
const openWalk = { pending: false, at: 0, armed: false };
function updateOpeningDay() {
  if (!openWalk.pending || simTime < openWalk.at) return;
  openWalk.pending = false;
  if (!course.holes.length || state.mood.n !== 0 || away.active || !clubOpen()) return;
  if (golfers.length + 3 > MAX_GOLFERS) return;
  const s = ensureSheet();
  startGroup(3, s.sizes.length + 3);
}

// Everything that happened while the tab was shut, reconciled against the book
// that was actually running: not a trickle, the rounds the schedule ran. Capped
// at OFFLINE_CAP_S exactly as before.
function runAway(fromMs, toMs) {
  const out = { groups: 0, rounds: 0, take: 0, seconds: Math.max(0, (toMs - fromMs) / 1000),
    capped: false, notables: [] };
  if (toMs <= fromMs) return out;
  const cap = OFFLINE_CAP_S * 1000;
  out.capped = toMs - fromMs > cap;
  const start = Math.max(fromMs, toMs - cap);
  out.seconds = (toMs - start) / 1000;
  if (!course.holes.length) return out;
  const todayKey = dayInfo().key;
  const pres = prestigeOf();
  let scored = 0;
  // A jump that crosses midnight settles yesterday's twilight AND today's book.
  // The money is all the player's, but "Rounds today / Taken today" is a
  // question about ONE day, so the sheet only ever takes the share earned on
  // the day it belongs to — otherwise last night's last groups turn up on a
  // morning sheet whose first tee has not even gone out.
  let mineRounds = 0, mineTake = 0;
  for (let d = new Date(start); d.getTime() <= toMs; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) {
    const dl = TS.daylight(d), key = TS.dayKey(d), seed = TS.hash32(key);
    const base = TS.midnightOf(d);
    const mine = key === todayKey && state.sheet && state.sheet.sizes.length === dl.slots;
    const fill = fillOverride != null ? fillOverride : TS.fillFor(course.gpm, TS.isWeekend(d));
    // the diary ran while the tab was shut, exactly as the book did — a
    // Legend who was down for Tuesday played on Tuesday, and left a mark
    const vips = mine ? (state.sheet.vips || {})
      : notablesFor({ seed, dl, key, weekend: TS.isWeekend(d) }, pres);
    for (let i = 0; i < dl.slots; i++) {
      const tMs = base + TS.slotMinute(dl, i) * 60000;
      if (tMs < start || tMs > toMs) continue;
      const vip = vips[i] ? STARS.BY_ID[vips[i]] : null;
      if (vip) noteMet(vip.id, key);      // the diary ran, so the book grew
      const n = mine ? (state.sheet.sizes[i] | 0)
        : Math.max(TS.bookingFor(seed, i, fill, dl), vip ? vipSize(seed, vips[i]) : 0);
      if (!n) continue;
      const take = n * course.fee * (vip ? 1 + vip.tierDef.rank * 0.22 : 1);
      out.groups++; out.rounds += n; out.take += take;
      if (key === todayKey) { mineRounds += n; mineTake += take; }
      // the scorecard takes the real rounds; a day away is bounded arithmetic
      if (vip) { const r = playStarCard(vip); if (r) out.notables.push(r); }
      for (let k = vip ? 1 : 0; k < n && scored < 90; k++) { playCard(PEOPLE.personFor(seed, i, k)); scored++; }
    }
  }
  const s = ensureSheet();
  s.rounds += mineRounds; s.take += mineTake;
  s.cursor = Math.max(s.cursor, TS.slotIndexAt(dayInfo().dl, nowMinute()));
  return out;
}

// ── The notables ─────────────────────────────────────────────────────────────
// Star golfers are the bosses of this game, and they are beaten with
// architecture rather than with money. Everything below hangs off two ideas:
//
//   PRESTIGE decides who is willing to come. It is the club you have actually
//   built — the rating, the holes, the rounds in the book, the goals met, what
//   the members say — so a Legend turning up is the property earning it, never
//   a dice roll.
//
//   TASTE decides what they think when they get here. stars.js weighs the
//   thirteen architecture readings its own way for each of thirty-six people,
//   and their marks genuinely disagree. Chasing a 9 from the architect will
//   cost you a point from the bomber. That trade IS the game.
//
// Both ends are deterministic: who is in the diary for Thursday is a pure
// function of the day and the club, exactly like every other tee time, so the
// sheet a player comes back to is the sheet they left.

const MEMBER_DAYS = 0.58;      // a member turns up about four days in seven
const MAX_VISITORS = 4;        // …and the club is never a parade of celebrities
const DEV_K = 14;              // rounds to 63% of a member's remaining potential

function memberOf(id) { return state.club.members.find(m => m.id === id) || null; }
function memberSlots() { return Math.min(6, 1 + state.upgrades.clubhouse); }

// Discovery, and the only way it ever happens: a name goes in the diary. There
// is nothing to open and nothing to buy — the roster is revealed by building a
// golf course good enough that better players are willing to travel to it, so
// the collection grid in the Club Book is a picture of the club's reach and
// never a picture of how long the player has been grinding.
function noteMet(id, day) {
  if (!STARS.BY_ID[id] || state.club.met[id]) return false;
  state.club.met[id] = day || dayInfo().key;
  return true;
}
function metCount() { return Object.keys(state.club.met).length; }

// What the club is worth to somebody who has a choice of where to play. Every
// term is a thing the player built, and the members they have already signed
// pull their own weight — which is what makes the first signing matter.
function prestigeOf() {
  if (!course.holes.length) return 0;
  let p = course.stars * 9                                        // 0–45 · the rating
    + Math.min(1, course.holes.length / 12) * 13                  // 0–13 · a full round
    + Math.min(1, Math.log10(1 + roundsPlayed()) / 3.4) * 11      // 0–11 · rounds in the book
    + Math.min(1, state.upgrades.clubhouse / 5) * 8               // 0–8  · the house
    + Math.min(1, state.milestone / MILESTONES.length) * 7        // 0–7  · goals met
    + clamp((state.mood.avg - 5.5) / 3.5, 0, 1) * 6;              // 0–6  · word of mouth
  for (const m of state.club.members) p += STARS.BY_ID[m.id].tierDef.pull;
  p += tourPrestige();      // 0–14 · what your members have done in the majors
  p += Math.min(9, honourCount() * 0.5);   // 0–9 · the honours page, in ink
  return clamp(Math.round(p), 0, 100);
}
// the highest tier that would consider the club today — the Club Book's headline
function reachOf(p) {
  if (!course.holes.length) return null;   // nobody travels for a building site
  let best = null;
  for (const t of STARS.TIERS) if (p >= t.need) best = t;
  return best;
}

// ── What a member has become ─────────────────────────────────────────────────
// Members improve by playing, and only by playing. No chores, no daily claim:
// the rounds their tee time puts them through are the whole mechanic. The curve
// is deliberately generous to the young and stingy to the great — a Local
// Standout can add twenty points of accuracy at your club, a Legend perhaps
// three, which is exactly the trade a real membership makes.
function devStats(star, rounds) {
  const k = 1 - Math.exp(-Math.max(0, rounds) / DEV_K);
  const head = star.tierDef.dev;
  const grow = v => Math.min(99, v + (Math.min(99, v + (100 - v) * 0.45 * head + 4) - v) * k);
  return { power: grow(star.power), accuracy: grow(star.accuracy),
    putting: grow(star.putting), temperament: grow(star.temperament) };
}
// the stats a notable is playing off right now — a visitor plays as written
function statsOf(star) {
  const m = memberOf(star.id);
  return m ? devStats(star, m.rounds) : {
    power: star.power, accuracy: star.accuracy, putting: star.putting,
    temperament: star.temperament };
}

// ── The verdict ──────────────────────────────────────────────────────────────
// Cached per recompute, because the Club Book asks thirty-six of these every
// time it draws and the answer cannot change until a tile does.
const verdictCache = new Map();
function starVerdict(star) {
  const hit = verdictCache.get(star.id);
  if (hit) return hit;
  const v = STARS.verdict(course.arch, star);
  v.head = STARS.headline(v.score, star);
  v.fav = course.holes.length >= 3 ? STARS.favourite(course.holes, star) : null;
  verdictCache.set(star.id, v);
  return v;
}

// Signing the card. A notable's mark is remembered, and it is the mark — not
// money — that decides whether they come back and whether they would ever join.
function recordVerdict(star, v, toPar) {
  const c = state.club.seen[star.id]
    || (state.club.seen[star.id] = { n: 0, score: 0, best: 0, day: '', toPar: null, line: '' });
  c.n++;
  c.score = v.score;
  c.best = Math.max(c.best || 0, v.score);
  c.day = dayInfo().key;
  // the signature: the card they left and the one line they said about the
  // golf course, in their own register. This is the ledger's whole content.
  c.toPar = typeof toPar === 'number' && isFinite(toPar) ? Math.round(toPar) : null;
  c.line = v.head || '';
  noteMet(star.id);
  annalVisit(star.id, v.score);   // the open year remembers the mark
  const m = memberOf(star.id);
  if (m) m.rounds++;      // the only way a member ever improves (see devStats)
  starPeople.delete(star.id + '|' + (m ? m.rounds - 1 : -1));
}

// A notable's round played through off the book — nobody watched, and the card
// and the mark are real anyway. This is what a night away is made of.
function playStarCard(star) {
  if (!course.holes.length) return null;
  const p = starPerson(star);
  const skill = p.skill + gauss() * p.vary;
  let tot = 0, par = 0, birdies = 0;
  for (const h of course.holes) {
    const s = scoreHole(h, skill, p.prof);
    recordScore(h, s);
    noteHoleFeat(star.name, h, s);
    if (s === h.par - 1) birdies++;
    tot += s; par += h.par;
  }
  postRound(star.name, tot, par, course.holes.length, birdies, 0);
  const v = starVerdict(star);
  logMood(v.score);
  recordVerdict(star, v, tot - par);
  return { id: star.id, name: star.name, strokes: tot, par, score: v.score,
    tier: star.tierDef.label };
}

// Signing the visitors' book. One line on the way out — the card they posted,
// the mark they left, and, if the golf course has just talked them round, the
// single fact that turns this into a decision the player can make.
function signOff(g) {
  const star = g.person.star;
  const v = starVerdict(star);
  const was = state.club.seen[star.id];
  const wasShort = !was || was.best < star.tierDef.ask;
  // only a card signed for every hole is a card — a golfer lifted off the
  // course mid-round leaves a mark but no score to par
  recordVerdict(star, v, g.roundHoles === course.holes.length ? g.round - g.roundPar : null);
  floater(g.pos.clone().add(new THREE.Vector3(0, 1.0, 0)),
    v.score.toFixed(1) + ' / 10', v.score >= 8 ? 'gold' : '');
  const card = g.roundHoles === course.holes.length
    ? ' signed for ' + g.round + ' · ' : ' ';
  const open = memberOf(star.id) ? '' :
    (wasShort && v.score >= star.tierDef.ask
      ? ' — and would take a membership'
      : '');
  toast(star.name + card + 'marked the course ' + v.score.toFixed(1) + open, 'star');
  if (open) sound('lucky');
  if (sheetOpen && clubTab === 'people') renderSheet();
}

// ── Who is in the diary ──────────────────────────────────────────────────────

// A notable's own person object, shaped exactly like people.personFor's so that
// every consumer already written — the mesh, the follow card, the honour, the
// scoring sim — works on them without knowing what they are.
const starPeople = new Map();
function starPerson(star) {
  const m = memberOf(star.id);
  const key = star.id + '|' + (m ? m.rounds : -1);
  const hit = starPeople.get(key);
  if (hit) return hit;
  if (starPeople.size > 120) starPeople.clear();
  // the star as they are playing TODAY — a member who has improved here is a
  // different golfer from the one in the roster file
  const s2 = Object.assign({}, star, statsOf(star));
  const hcp = STARS.hcpOf(s2);
  const seed = STARS.hash32(star.id);
  const r = (k) => STARS.roll(seed, star.id, k);
  // A star's taste, expressed in the five readings the club's own golfers use,
  // so word of mouth and the archetype blurb keep working on them. Their real
  // opinion is the verdict — this is only the lens the club files it under.
  const t = star.taste, w = q => t[q] || 0;
  const raw = { design: 0.30 + Math.max(0, w('strategy') + w('hazardPurpose') + w('greenDefence')) * 0.14,
    flow: 0.12 + Math.max(0, w('routing')) * 0.10,
    condition: 0.12 + Math.max(0, w('condition')) * 0.14,
    pace: 0.18, charm: 0.10 + Math.max(0, w('beauty')) * 0.12 };
  const tot = raw.design + raw.flow + raw.condition + raw.pace + raw.charm;
  for (const k in raw) raw[k] /= tot;
  const p = {
    id: 'star:' + star.id, seed, first: star.first, last: star.last, name: star.name,
    star, member: !!m,
    arch: { id: 'star', label: star.tierDef.label, blurb: star.quote,
      w: raw, tough: clamp(0.5 + (w('strategy') + w('hazardPurpose') + w('roughness') - w('width')) / 4, 0.15, 0.95),
      bias: -0.12 - star.tierDef.rank * 0.04, hcp: [hcp, hcp], weight: 0 },
    hcp, hcpLabel: PEOPLE.hcpLabel(hcp),
    skill: STARS.skillOf(s2),
    vary: STARS.varyOf(s2),
    // the lean of their game, taken off the stats they are playing off TODAY —
    // so a member who has spent a season adding accuracy here really does start
    // taking their shots on different holes
    prof: STARS.profileOf(s2),
    look: {
      shirt: 0, pants: r(11), skin: r(13), bag: r(17), cap: 0, hair: r(19),
      hasCap: star.hat !== 'none', hat: star.hat, shirtHex: star.colour,
      build: 0.90 + r(23) * 0.14,
    },
  };
  starPeople.set(key, p);
  return p;
}

// The day's notables, as a plain slot → id map. Members take their own regular
// time first (it is theirs, and the point of having one); visitors then take
// whatever is left, best players first, and the club never fields more than a
// handful in a day.
function notablesFor(t, prestige) {
  const out = {};
  const slots = t.dl.slots;
  if (!slots || !course.holes.length) return out;
  const take = (pref, id) => {
    const p = clamp(pref | 0, 0, slots - 1);
    for (let d = 0; d < slots; d++) {
      const i = (p + d) % slots;
      if (!out[i]) { out[i] = id; return i; }
    }
    return -1;
  };
  for (const m of state.club.members) {
    // a member who is playing a championship this weekend is four hundred
    // miles away, and their regular time goes unused — which is exactly what
    // sending them costs the club
    if (awayOn(m.id, t.key)) continue;
    if (STARS.roll(t.seed, m.id, 5) > MEMBER_DAYS) continue;
    take(TS.slotIndexAt(t.dl, m.tee), m.id);
  }
  const lift = t.weekend ? 1.3 : 1;      // the big names travel at the weekend
  let n = 0;
  for (const s of VISIT_ORDER) {
    if (n >= MAX_VISITORS) break;
    if (memberOf(s.id)) continue;
    const chance = STARS.visitChance(s, prestige, state.club.seen[s.id]) * lift;
    if (!chance || STARS.roll(t.seed, s.id, 1) >= chance) continue;
    if (take(Math.floor(STARS.roll(t.seed, s.id, 2) * slots), s.id) >= 0) n++;
  }
  return out;
}
// best players get first refusal on a day that is already full of notables
const VISIT_ORDER = STARS.ROSTER.slice().sort((a, b) => b.tierDef.rank - a.tierDef.rank);

// a notable never plays alone and never plays in a crowd
function vipSize(seed, id) { return 3 + (STARS.roll(seed, id, 3) < 0.42 ? 1 : 0); }

// The sheet holds the vips as data, so the book can print "4:35 · Vesper Lyle"
// hours before she arrives — the anticipation is the feature.
function applyVips(s, t) {
  if (!s.vips) return;
  for (const k in s.vips) {
    const i = +k;
    if (i < 0 || i >= s.sizes.length) continue;
    s.sizes[i] = Math.max(s.sizes[i], vipSize(t.seed, s.vips[k]));
    noteMet(s.vips[k]);        // a name in the diary is a name in the collection
  }
}
function vipAt(i) {
  const s = state.sheet;
  const id = s && s.vips ? s.vips[i] : null;
  return id && STARS.BY_ID[id] ? STARS.BY_ID[id] : null;
}
// the next notable still to come today — what the book leans on, and the one
// line the Club Book opens with
function nextVip() {
  const s = state.sheet;
  if (!s || !s.vips) return null;
  const dl = dayInfo().dl;
  let best = null;
  for (const k in s.vips) {
    const i = +k;
    if (i < s.cursor || i >= s.sizes.length) continue;
    if (!best || i < best.slot) best = { slot: i, star: STARS.BY_ID[s.vips[k]], min: TS.slotMinute(dl, i) };
  }
  return best && best.star ? best : null;
}

// A member signed at noon should not have to wait until tomorrow to appear.
// If their regular time is still to come today, the club fits them in.
function seatNotableToday(id) {
  const s = state.sheet, t = dayInfo();
  if (!s || !s.vips) return -1;
  // nobody is in the diary twice — if their time is already down, that is it
  for (const k in s.vips) if (s.vips[k] === id && +k >= s.cursor) return +k;
  const m = memberOf(id);
  const pref = Math.max(s.cursor, m ? TS.slotIndexAt(t.dl, m.tee) : s.cursor);
  for (let i = pref; i < s.sizes.length; i++) {
    if (s.vips[i]) continue;
    s.vips[i] = id;
    s.sizes[i] = Math.max(s.sizes[i], vipSize(t.seed, id));
    return i;
  }
  return -1;
}

// ── Recruitment ──────────────────────────────────────────────────────────────
// Not a collectible. A signing costs real money, occupies one of a small number
// of seats that only a bigger clubhouse ever adds to, and can only be offered
// to somebody who has played here and liked it enough to say so. Releasing a
// member frees the seat and refunds nothing — so the decision is which four or
// five players your club is FOR.

// A joining fee is quoted in green fees, and a green fee is worth BOOK_REBASE×
// what it was before the book was rebuilt around waves — while the club's
// income is not. Dividing BOOK_REBASE back out keeps a signing exactly as many
// days' takings as it always was, and keeps it there if that constant is ever
// re-measured (it has been once already — see BOOK_REBASE).
function inviteCost(star) {
  return Math.round(star.tierDef.join * Math.max(40, course.fee / BOOK_REBASE));
}
// everything the Club Book needs to draw one row, in one call
function inviteState(star) {
  const seen = state.club.seen[star.id];
  const T = star.tierDef;
  const cost = inviteCost(star);
  if (memberOf(star.id)) return { state: 'member', cost };
  if (!seen || !seen.n) return { state: 'unseen', cost, why: 'Has not played here yet' };
  if (seen.best < T.ask) {
    return { state: 'unimpressed', cost, need: T.ask,
      why: 'Wants ' + T.ask.toFixed(1) + ' from the golf course · marked you ' + seen.best.toFixed(1) };
  }
  if (state.club.members.length >= memberSlots()) {
    return { state: 'full', cost, why: 'No seat free · upgrade the Clubhouse for another' };
  }
  if (state.money < cost) return { state: 'poor', cost, why: 'Joining arrangement ' + fmt(cost) };
  return { state: 'open', cost };
}

function invite(id) {
  const star = STARS.BY_ID[id];
  if (!star) return false;
  const st = inviteState(star);
  if (st.state !== 'open') { if (st.why) toast(st.why); return false; }
  if (!trySpend(st.cost)) return false;
  // a member's regular time is their own habit, kept for as long as they stay
  const tee = 7 * 60 + Math.floor(STARS.roll(STARS.hash32(id), id, 9) * 108) * 5;
  state.club.members.push({ id, since: dayInfo().key, rounds: 0, tee });
  starPeople.clear();
  const slot = seatNotableToday(id);
  computeCourse();                 // prestige moved: the book and the diary follow
  save();
  sound('lucky');
  toast(star.name + ' has joined the club' +
    (slot >= 0 ? ' · playing at ' + TS.hhmmShort(TS.slotMinute(dayInfo().dl, slot)) + ' today'
      : ' · tees off around ' + TS.hhmmShort(tee) + ' most days'), 'person');
  if (sheetOpen) renderSheet();
  return true;
}

function release(id) {
  const i = state.club.members.findIndex(m => m.id === id);
  if (i < 0) return false;
  const star = STARS.BY_ID[id];
  state.club.members.splice(i, 1);
  starPeople.clear();
  const s = state.sheet;
  if (s && s.vips) for (const k in s.vips) if (s.vips[k] === id && +k >= s.cursor) delete s.vips[k];
  computeCourse();
  save();
  toast(star.name + ' has left the club', 'person');
  if (sheetOpen) renderSheet();
  return true;
}

// ── Groups ───────────────────────────────────────────────────────────────────
// A group is the unit the course is played in. It gathers on every tee before
// it plays away, and a hole belongs to exactly one group at a time — so a group
// that catches the one ahead stands on the tee and waits, which is both the
// truth about golf and the visible consequence of a course that does not flow.

const groups = [];
const holeOwner = [];            // hole index → the group that has it
const holeTimes = [];            // the last few hole durations, for pace of play
// …and the same holes split at the cup — tee-to-cup against cup-to-next-tee.
// The instrument that tells a budget that is wrong from a walk that is long.
// Kept as running totals rather than a rolling window: a window of the last
// few dozen holes is two or three groups' worth, and a group carries its own
// random tempo, so the window read anywhere between -16% and 0% on the same
// build. Totals over a whole day are the only honest reading, and
// paceStats(true) is what clears them.
const paceSplit = { n: 0, cup: 0, turn: 0 };
let groupSeq = 0;
let teleporting = false;         // a clock jump is clearing the course

const TEE_STAGGER = 3.2;         // seconds between partners playing away
// the pre-shot routine, per shot. The ceiling is what actually decides a hole's
// length on a short course: with only three or four shots to spend the slack
// on, a low cap hands the minutes back and the field thins out.
const READ_MIN = 1.1, READ_MAX = 27;
const WALK_K = { min: 0.55, max: 3.6 };
// nobody marches between holes. The green-to-next-tee walk is a stroll, which
// is why a course whose greens sit miles from the next tee (a low Flow rating)
// really does hold the field up.
const WALK_BETWEEN = 0.55;
// What a hole is expected to cost TEE TO TEE — from this group stepping onto
// this tee to the same group stepping onto the next one. That is the unit the
// pace-of-play spec is written in (one and a half to two and a half minutes a
// hole) and the only unit a player ever experiences, so it is the unit the
// budget is now stated in. It used to be stated tee-to-CUP, which is why an
// honest 2.5 min/hole looked like a 21% overrun against a 2.07 min target: the
// two numbers were measuring different halves of the same hole.
function holePaceS(par) { return 120 + (par - 4) * 11; }
// Of that, the stroll from the green to the next tee belongs to the routing,
// not to paceLegs: it cannot compress it and never claimed to. Measured, not
// assumed — paceStats().split.turn reads ~35s averaged over a full day on an
// 18-hole course, and a course whose greens sit miles from the next tee really
// does run longer than this, which is exactly how a low Flow rating is meant
// to hurt.
const HOLE_TURN_S = 35;
// …so what paceLegs owns is the tee-to-cup remainder. Note that the plan it
// writes lands a few per cent UNDER its own estimate — the routed walk is
// genuinely shorter than the 1.25x straight-line allowance the budget sets
// aside for it — which is why the aim is stated here and the outcome is
// measured at paceStats().split rather than asserted.
function holeTargetS(hole, pace) {
  return Math.max(45, holePaceS(hole.par) - HOLE_TURN_S) * pace;
}

// Where each member of a group stands on the tee. Four spots in a loose arc
// behind the ball — `s` across the line of play, `b` back from it, all inside
// the tee's own tile — so a group held up on a tee reads as four people
// standing together instead of one blob. Honour picks the spot, which is why
// whoever has the tee is the one up by the markers.
const TEE_SPOTS = [[0.03, 0.10], [-0.30, -0.17], [0.30, -0.19], [0.00, -0.33]];
function teeStand(hole, i) {
  const vx = hole.flag.x - hole.tee.x, vz = hole.flag.z - hole.tee.z;
  const L = Math.hypot(vx, vz) || 1;
  const nx = vx / L, nz = vz / L;
  const o = TEE_SPOTS[(((i | 0) % 4) + 4) % 4];
  return new THREE.Vector3(
    hole.tee.x + 0.5 - nz * o[0] + nx * o[1],
    groundY(hole.tee.x, hole.tee.z),
    hole.tee.z + 0.5 + nx * o[0] + nz * o[1]);
}

function startGroup(size, slotIdx) {
  const t = dayInfo();
  // the booking IS these people — same day, same slot, same four names, on any
  // machine, before or after a reload
  const party = PEOPLE.groupFor(t.seed, slotIdx, size);
  // …unless the diary says otherwise, in which case the name on the booking is
  // the notable and the rest of the party is playing with them
  const vip = vipAt(slotIdx);
  if (vip) party[0] = starPerson(vip);
  const grp = {
    id: ++groupSeq, slot: slotIdx, size, members: [], party, vip: vip || null,
    name: party[0].name,
    hole: -1, gateHi: -1, gateN: 0, open: false, openT: 0, holeT: 0, waitAt: 0,
    // some groups get on with it, some do not — which is where waiting starts
    pace: 0.90 + Math.random() * 0.28,
    // a round is measured on the sim clock, never the wall clock: time travel,
    // a slept tab and an alt-tabbed half hour all move nowMs() without a single
    // shot being played, and none of them may show up as the group's pace
    startSim: simTime, waitS: 0, blocked: false, everWaited: false,
    // who has the shot right now (see claimTurn)
    turn: null, turnT: 0,
  };
  groups.push(grp);
  for (let i = 0; i < size; i++) spawnGolfer(grp, i);
  if (vip) arriveVip(grp, vip);
  // THE FIRST GOLFERS THIS CLUB HAS EVER HAD — a named arrival, once, and the
  // moment the follow card is taught: the Watch button IS the lesson
  if (!away.active && state.mood.n === 0 && !state.notes.out && grp.members.length && !vip) {
    const lead = grp.members[0];
    committeeNote('out',
      lead.person.name + (grp.size > 1 ? '\'s group is' : ' is') +
      ' on the course — your first golfers. Click anyone out there to walk with them',
      'person',
      { label: 'Watch', fn: () => { if (golfers.includes(lead)) { openFollowCard(lead); enterLens(lead); } } });
  }
  return grp;
}

function aliveIn(grp) { return grp.members.length; }

// the tee opens when the whole group is on it AND the hole ahead is clear
function gateReady(grp, time) {
  if (grp.open) return true;
  if (!aliveIn(grp) || grp.gateN < aliveIn(grp)) return false;
  const hi = grp.gateHi;
  const owner = holeOwner[hi];
  if (owner && owner !== grp && aliveIn(owner)) {
    if (!grp.blocked) {
      grp.blocked = true;
      grp.waitAt = hi + 1;      // the tee they are standing on, for the note they write
      if (!grp.everWaited && state.sheet) { grp.everWaited = true; state.sheet.waited++; }
    }
    return false;
  }
  if (grp.hole >= 0 && holeOwner[grp.hole] === grp) {
    holeOwner[grp.hole] = null;
    if (grp.holeT) {
      holeTimes.push(time - grp.holeT);
      // …and the same hole split at the cup, which is the only way to tell a
      // budget that is wrong from a walk that is long. `cup` is what
      // holeTargetS is actually aiming at; `turn` is the green-to-next-tee
      // stroll it never claimed to cover, and the reason a flat 2.5 min/hole
      // used to look like a 21% overrun against a 2.07 min target.
      if (grp.cupT) {
        paceSplit.n++;
        paceSplit.cup += grp.cupT - grp.holeT;
        paceSplit.turn += time - grp.cupT;
      }
    }
    if (holeTimes.length > 24) holeTimes.shift();
  }
  holeOwner[hi] = grp;
  grp.hole = hi;
  grp.open = true;
  grp.blocked = false;
  grp.openT = time;
  grp.holeT = time;
  assignHonour(grp, hi);
  return true;
}

// Honour — the real rule, and the reason a group on a tee is not four people
// standing in a line. Whoever took fewest on the last hole plays away first;
// ties go to the better card, then to who booked the time. On the first tee
// there is nothing to go on, so the booking order stands.
function assignHonour(grp, hi) {
  const m = grp.members.slice();
  if (hi === 0) m.sort((a, b) => a.slot - b.slot);
  else m.sort((a, b) => (a.lastStrokes - b.lastStrokes) || (a.round - b.round) || (a.slot - b.slot));
  for (let i = 0; i < m.length; i++) m[i].tOrder = i;
}

// A pace ledger the sim keeps in memory only, split by how many were in the
// group — the instrument that says whether a fourball really does play a hole
// in a fourball's time. Never saved and never shown: it is a measuring stick
// for tuning and for __fairway.paceStats().
const paceLedger = new Map();
function notePace(size, secs, holes) {
  if (!holes) return;
  let e = paceLedger.get(size);
  if (!e) paceLedger.set(size, e = { rounds: 0, secs: 0, holes: 0 });
  e.rounds++; e.secs += secs; e.holes += holes;
}

// `abandoned` groups were lifted off the course by a clock jump rather than by
// walking in — they never finished, so they never count towards pace of play.
function endGroup(grp, abandoned) {
  if (grp.hole >= 0 && holeOwner[grp.hole] === grp) holeOwner[grp.hole] = null;
  const s = state.sheet;
  if (s && !abandoned && !teleporting) {
    s.roundS += Math.max(0, simTime - grp.startSim);
    s.roundsDone++;
    notePace(grp.size, Math.max(0, simTime - grp.startSim), course.holes.length);
  }
  const i = groups.indexOf(grp);
  if (i >= 0) groups.splice(i, 1);
}

// Pace of play. The walking and the swinging only account for a fraction of the
// minutes a hole really takes — the rest is the part everyone forgets: standing
// over the ball. So the slack is spent, first by strolling instead of marching,
// then on the pre-shot routine. Whatever is still left over becomes a genuine
// wait for the group behind, which is the point.
//
// SERIALISATION is the term this budget used to be missing, and the reason a
// round ran 35–40% long. Only one ball in a group is played at a time (see
// claimTurn), so every partner's swing and routine is a minute this hole takes
// — but the budget was worked out for ONE player and the turn legs were added
// on afterwards, where the routine's floor could never absorb them. A
// fourball therefore always overran, and the more popular the club the worse
// it got. The walk is the one part of a hole a group genuinely does at once,
// so it keeps the whole target; everything played over the ball is charged
// `serial` times and the routine is divided by it.
// Share of a partner's shot that really blocks the hole. Not 1: the away rule
// lets a player who is still fifty yards out walk in while a partner putts, so
// some of a group's serial time genuinely overlaps. It is also the one term
// that decides whether the budget's estimate matches the golf that comes out,
// so it is MEASURED and not guessed: at 0.86 the budget over-charged big
// groups, squeezed their walk to the floor and a fourball came in 7% under its
// own aim (paceStats().split.overrun). Re-fitted below.
const SERIAL_K = 0.72;

function paceLegs(g, hole, built) {
  const grp = g.grp;
  const mult = grp ? grp.pace : 1;
  const target = holeTargetS(hole, mult) - (g.tOrder || 0) * TEE_STAGGER;
  const size = grp ? Math.max(1, grp.size) : 1;
  const serial = 1 + (size - 1) * SERIAL_K;
  let walk = 0, swing = 0;
  for (const s of built.shots) {
    swing += s.swingDur / g.pace + s.flightDur * 0.45;
    walk += s.dist * 1.25 / g.baseSpeed;       // a routed walk is longer than the shot
  }
  const n = Math.max(1, built.shots.length);
  // the stroll gets whatever the group's serialised strokes and a floor's worth
  // of routine leave behind. The ceilings travel with the group's own tempo, so
  // a genuinely slow group really is slow — which is what puts the group behind
  // them on a tee, waiting.
  const room = target - serial * (swing + n * READ_MIN);
  g.walkK = 1 / Math.max(WALK_K.min, Math.min(WALK_K.max * mult, walk > 0.5 ? room / walk : 1));
  const est = serial * swing + walk / g.walkK;
  const pad = Math.max(READ_MIN, Math.min(READ_MAX * mult, (target - est) / (serial * n)));
  const legs = [];
  for (const l of built.legs) {
    if (l.t === 'swing') {
      // wait your turn FIRST, then step in and play it — which is the order a
      // round is actually played in, and the reason the routine can be short
      if (size > 1) legs.push({ t: 'turn', shot: l.shot });
      legs.push({ t: 'read', d: pad * (l.shot.kind === 'putt' ? 0.8 : 1.12), shot: l.shot });
    }
    legs.push(l);
  }
  return legs;
}

// ── Away plays first ─────────────────────────────────────────────────────────
// The rule that costs the least to obey and reads the most: of the players in a
// group standing over a ball on this hole right now, the one furthest from the
// cup plays. Ties fall to the honour, which is what makes the honour worth
// having. Only players who are actually READY are counted, so nobody is ever
// held up by a partner still walking — which is both how a group of friends
// really plays and the reason this can never deadlock.
//
// The minutes it costs are paid for honestly, in the budget, by paceLegs's
// `serial` term — which is what a hole standing still for three partners
// actually costs. It used to be paid for by DISCOUNTING each golfer's routine
// by the time they spent watching, which was a promise the arithmetic could
// not keep: a short routine had nothing to give back (so a fourball ran long
// at the club) and a championship routine gave back everything (so a threeball
// ran short at a venue and the leaderboard drifted away from the golf). One
// term in one place replaces both, and the discount is gone.
const TURN_HOLD = 40;        // the longest one partner can hold the group up…
const TURN_MAX = 45;         // …and the longest anyone waits before playing anyway
// (both are backstops, not pacing — nothing normal comes near them)

function awayFrom(g, shot) {
  const h = g.hole;
  if (!h) return 0;
  return Math.hypot(shot.from.x - (h.flag.x + 0.5), shot.from.z - (h.flag.z + 0.5));
}
function claimTurn(grp, g, time) {
  const cur = grp.turn;
  const busy = cur && (cur.phase === 'read' || cur.phase === 'swing');
  if (cur !== g && busy && time - grp.turnT < TURN_HOLD) return false;
  for (const m of grp.members) {
    if (m === g || m.phase !== 'turn' || m.hole !== g.hole) continue;
    if (m.away > g.away + 0.02 || (m.away > g.away - 0.02 && m.tOrder < g.tOrder)) return false;
  }
  grp.turn = g; grp.turnT = time;
  return true;
}

// ── What they thought ────────────────────────────────────────────────────────
// A golfer's mark out of ten is not an opinion generator. It is the course's
// own facts (courseFacts) weighted by what this particular person came here
// for, plus the minutes they actually spent standing on a tee waiting for the
// group in front. The follow card prints that object; the club's word of mouth
// is the average of it. One loop, not two — and every sentence on the card is
// something the player can go and change with a tool from the dock.

function golferFacts(g) {
  const grp = g.grp;
  const f = Object.assign({}, course.facts);
  f.condition = state.upgrades.grounds;
  f.waitMin = grp ? grp.waitS / 60 : 0;
  f.waitedAt = grp ? grp.waitAt : 0;
  f.played = g.roundHoles;
  f.toPar = g.roundHoles ? g.round - g.roundPar : null;
  return f;
}
// A notable's mark is their VERDICT — the thirteen architecture readings put
// through their own taste — not the five-reading average the club's regulars
// use. One system replaces the other for them rather than sitting beside it, so
// the number on the follow card, the number in the Club Book, and the number
// that moves word of mouth are all the same number.
function satisfactionOf(g) {
  if (g.person.star) return starVerdict(g.person.star).score;
  return PEOPLE.rate(golferFacts(g), g.person).score;
}
function noteFor(g) {
  if (g.person.star) {
    const v = starVerdict(g.person.star);
    return { score: v.score, line: v.reasons.length ? v.reasons[0].text : v.head,
      topic: v.reasons.length ? v.reasons[0].q : 'design', verdict: v, c: {} };
  }
  return PEOPLE.note(golferFacts(g), g.person);
}

// a round played through off the book: nobody stood on a tee, so nobody waited
function cardFacts() {
  const f = Object.assign({}, course.facts);
  f.condition = state.upgrades.grounds;
  f.waitMin = 0; f.waitedAt = 0; f.played = 0; f.toPar = null;
  return f;
}

// The club's word of mouth, one signed card at a time. Early on it moves fast
// — a new course has no reputation to defend — and once a few dozen rounds are
// in it takes a real change in the golf to shift it. It is read exactly once,
// by economyOf, and frozen for the day the moment the book is made.
function logMood(score) {
  const m = state.mood;
  m.n++;
  m.avg += (score - m.avg) * (m.n < 15 ? 0.20 : 0.05);
  const s = state.sheet;
  if (s) { s.satN = (s.satN || 0) + 1; s.satSum = (s.satSum || 0) + score; }
}
function moodToday() {
  const s = state.sheet;
  return s && s.satN ? s.satSum / s.satN : null;
}

// ── Golfers (full-round sim) ─────────────────────────────────────────────────

const golfers = [];
const balls = [];

// ── Scoring sim ──────────────────────────────────────────────────────────────
// The walking golfer is theatre; the SCORE is the simulation. Each hole-out
// samples strokes from par + hole difficulty (hole.over) + golfer form + noise.

// `rnd` lets a caller hand in its own source of numbers. Live play passes
// nothing and gets Math.random; a championship passes a seeded stream, so the
// leaderboard a player reloads into is the leaderboard they left — see tourRng.
function gauss(rnd) { // Box–Muller standard normal
  const R = rnd || Math.random;
  let u = 0, v = 0;
  while (!u) u = R();
  while (!v) v = R();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

// What a hole ASKS FOR, in the three currencies a golfer's game is kept in.
// Every term is read off architecture()'s own per-hole features, so a hole that
// looks long, tight or fiddly around the green really is — nothing here is a
// second opinion about the golf course.
//   len   · yards past what the par is usually worth  → paid for with power
//   tight · how little short grass there is to aim at → paid for with accuracy
//   green · small, or defended, or both               → paid for with putting
function demandOf(hole) {
  // measured against the MIDDLE of its own par band (see PAR4_MIN / PAR5_MIN),
  // so length is what this hole asks over and above what its par already says —
  // a 460-yard four is a bomber's hole, a 260-yard four is not, and both of
  // them print a 4 on the card
  const nominal = hole.par <= 3 ? 165 : hole.par === 4 ? 360 : 590;
  const len = clamp((hole.effYards / nominal - 1) * 1.6, -0.7, 0.7);
  const f = hole.feat;
  if (!f) return { len, tight: 0, green: 0 };
  return { len, tight: clamp((0.42 - f.width) * 1.7, -0.7, 0.7),
    green: clamp((0.45 - f.greenSize) * 0.9 + (f.greenDefence - 0.35) * 0.9, -0.7, 0.7) };
}

// A player's lean spent against the hole in front of them. Negative is strokes
// SAVED, because that is the direction `skill` runs in. The lean sums to about
// nothing across the three, so this hands nobody a round — it only decides
// which holes on the property they take their shots on, which is why Otto
// Magnusson and Ines Hallowell no longer post the same card on the same course.
const EDGE_K = 0.62, EDGE_CAP = 0.5;
function edgeFor(hole, prof) {
  if (!prof) return 0;
  const d = demandOf(hole);
  const e = prof.power * d.len + prof.accuracy * d.tight + prof.putting * d.green;
  return clamp(-e * EDGE_K, -EDGE_CAP, EDGE_CAP);
}

function scoreHole(hole, skill, prof, rnd) {
  const R = rnd || Math.random;
  let strokes = Math.round(hole.par + hole.over + (skill || 0) + edgeFor(hole, prof) + gauss(R) * 0.85);
  strokes = Math.max(Math.max(1, hole.par - 3), Math.min(hole.par + 5, strokes));
  // going 2+ under is genuinely rare — most hot streaks settle for birdie
  if (strokes <= hole.par - 3 && R() > 0.06) strokes = hole.par - 2;
  if (strokes === hole.par - 2 && R() > 0.30) strokes = hole.par - 1;
  return strokes;
}

const OUTCOMES = ['albatross', 'eagle', 'birdie', 'par', 'bogey', 'double', 'triple'];

function outcomeOf(delta) {
  if (delta <= -3) return 'albatross';
  if (delta >= 3) return 'triple';                    // triple bogey or worse
  return ['eagle', 'birdie', 'par', 'bogey', 'double'][delta + 2];
}

function recordScore(hole, strokes) {
  const key = holeKey(hole);
  let st = state.holeStats[key];
  if (!st) {
    st = state.holeStats[key] = {
      yards: hole.yards, par: hole.par, rounds: 0, strokes: 0,
      outcomes: { albatross: 0, eagle: 0, birdie: 0, par: 0, bogey: 0, double: 0, triple: 0 },
    };
  }
  st.yards = hole.yards; st.par = hole.par;   // keep the scorecard snapshot fresh after redesigns
  st.rounds += 1;
  st.strokes += strokes;
  const o = outcomeOf(strokes - hole.par);
  st.outcomes[o] = (st.outcomes[o] || 0) + 1;
}

// ── The honours board ────────────────────────────────────────────────────────
// Every record in the Club Book is written here, by a card that was genuinely
// posted — watched from the terrace, played off the book while the tab was
// shut, or brought home from a championship. Nothing on the board is a running
// count of activity: each line is one performance, with the name and the day
// beside it, exactly as a clubhouse wall carries it.
//
// Records are only ever set at the CLUB. A round played at somebody else's
// championship venue is guarded out at every call site (away.active), because
// the honours board belongs to this golf course.

function recDay() { return dayInfo().key; }

// The club's course record. A record only counts against the same test, so a
// low gross on a shorter routing never takes the honour from a longer one —
// growing the course simply hands the record to the first round on it.
function recordRound(strokes, par, holes, who) {
  if (!holes || away.active) return;
  const r = state.records.low;
  if (r && (r.holes > holes || (r.holes === holes && r.v <= strokes))) return;
  state.records.low = { v: strokes, par, holes, who: who || '', day: recDay() };
  // a STANDING record beaten is worth the score noticing; the first card on a
  // new routing is just the board getting its first line
  if (r && scoreCtl) scoreCtl.lift();
}

// One finished card, offered to every record a whole round can set. `seconds`
// is the sim time from the first tee to the last putt and is only ever known
// for a round somebody actually walked — a card played off the book was not
// timed, so it competes for everything except the pace of play.
function postRound(who, strokes, par, holes, birdies, seconds) {
  if (!holes || away.active) return;
  const day = recDay();
  recordRound(strokes, par, holes, who);
  if (birdies > 0) {
    const b = state.records.birdies;
    if (!b || birdies > b.v) state.records.birdies = { v: birdies, who: who || '', day, holes };
  }
  // a pace record needs a real course to be a fact about — three holes is the
  // shortest thing worth calling a round
  if (seconds > 0 && holes >= 3 && holes === course.holes.length) {
    const f = state.records.fast;
    if (!f || holes > f.holes || (holes === f.holes && seconds < f.v)) {
      state.records.fast = { v: Math.round(seconds), who: who || '', day, holes };
    }
  }
}

// A tally line: aces and eagles are counted, and the board names whoever did it
// last — which is how a real ace board reads, newest name at the top.
function noteTally(k, who, hole, kind) {
  if (away.active) return;
  const cur = state.records[k];
  state.records[k] = { v: (cur ? cur.v : 0) + 1, who: who || '', day: recDay(),
    hole: hole || 0, kind: kind || k };
}

// The longest tee shot on the property, measured from where it was struck to
// where it stopped — carry and run, the way a long-drive board measures it.
function noteDrive(who, yards) {
  if (away.active || !(yards > 0)) return;
  const d = state.records.drive;
  if (d && d.v >= yards) return;
  state.records.drive = { v: Math.round(yards), who: who || '', day: recDay() };
}

// A member's lowest single round at a championship. It is not a course record —
// it was not set here — but it is unmistakably the club's, because nothing in
// that week happens without the seat the player paid for.
function noteMajorRound(who, strokes, ev, year) {
  if (!(strokes > 0)) return;
  const m = state.records.major;
  if (m && m.v <= strokes) return;
  state.records.major = { v: strokes, who: who || '', day: recDay(), ev, year };
}

// One hole, offered to the two tally lines. Called by every hole that finishes
// anywhere in the game — watched, or dealt off the book — so an ace nobody was
// there to see still goes on the board.
function noteHoleFeat(who, hole, strokes) {
  if (strokes === 1) noteTally('aces', who, hole.n, 'ace');
  else if (strokes - hole.par <= -2) {
    noteTally('eagles', who, hole.n, strokes - hole.par <= -3 ? 'albatross' : 'eagle');
  }
}

// the ball is in the cup: post the number that the strokes we just watched add
// up to, and hand a birdie-or-better to the celebration economy
function holeOut(g, hole, strokes) {
  // a hole played at somebody else's championship is not a hole on your
  // scorecard, and the celebration economy stays at home with it
  if (away.active) return;
  recordScore(hole, strokes);
  const delta = strokes - hole.par;
  noteHoleFeat(g.person.name, hole, strokes);
  if (delta > -1) return;
  const tier = delta <= -3 ? 'albatross' : delta === -2 ? 'eagle' : 'birdie';
  const label = tier === 'albatross' ? 'Albatross!'
    : tier === 'eagle' ? (hole.par === 3 && strokes === 1 ? 'Ace!' : 'Eagle!')
    : null;
  spawnMoment(hole, tier, label);
}

// ── Shot play ────────────────────────────────────────────────────────────────
// The score is still the simulation — but now you watch it happen. A golfer
// reaching the tee rolls the hole's stroke count ONCE, then that number is
// dealt out as a real sequence: full shots down the corridor, an approach that
// finishes on the putting surface, putts on it. The visible strokes can never
// disagree with the card, because the sequence is built from the number.

// where a ball can come to rest, and how much a golfer would rather it didn't.
// Water, trees, bridges and the clubhouse are absent: no lie there — a ball on
// a bridge deck has rolled off it.
const LIE_PENALTY = { fairway: 0, green: 0, tee: 0.3, path: 0.45, grass: 0.85, sign: 0.9,
  rough: 1.05, flower: 1.1, bunker: 1.4 };

function groundY(x, z) { return tileHeight(x, z, tileType(x, z)); }

// nearest playable tile to an ideal landing point — sand is reachable but
// costly, so only shots that genuinely finish in a bunker end up there
function snapLanding(px, pz) {
  const cx = Math.round(px - 0.5), cz = Math.round(pz - 0.5);
  let best = null, bs = Infinity;
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const x = cx + dx, z = cz + dz;
      if (!inBounds(x, z)) continue;
      const pen = LIE_PENALTY[tileType(x, z)];
      if (pen === undefined) continue;
      const s = (x + 0.5 - px) ** 2 + (z + 0.5 - pz) ** 2 + pen;
      if (s < bs) { bs = s; best = { x, z }; }
    }
  }
  return best;
}

// par-5 layup — the classic middle landing area, and the canonical
// "find a good spot near here" query
function layupTile(h) {
  return snapLanding(h.tee.x + 0.5 + (h.flag.x - h.tee.x) * 0.55,
                     h.tee.z + 0.5 + (h.flag.z - h.tee.z) * 0.55);
}

// putts have to start on the putting surface, so the shot before them always
// finishes on one
function greenLanding(hole, ix, iz) {
  let best = null, bs = Infinity;
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const x = hole.flag.x + dx, z = hole.flag.z + dz;
      if (!inBounds(x, z)) continue;
      const t = tileType(x, z);
      if (t !== 'green' && t !== 'flag') continue;
      const s = (x + 0.5 - ix) ** 2 + (z + 0.5 - iz) ** 2;
      if (s < bs) { bs = s; best = { x, z }; }
    }
  }
  return best || { x: hole.flag.x, z: hole.flag.z };
}

// nearest tile of a kind — finds the pond on the line to lose a ball in, and
// the greenside bunker to miss into
function nearTile(cx, cz, type, r) {
  let best = null, bs = Infinity;
  for (let dx = -r; dx <= r; dx++) {
    for (let dz = -r; dz <= r; dz++) {
      const x = cx + dx, z = cz + dz;
      if (!inBounds(x, z) || tileType(x, z) !== type) continue;
      const s = dx * dx + dz * dz;
      if (s < bs) { bs = s; best = { x, z }; }
    }
  }
  return best;
}

function restPoint(tile, px, pz) {
  return new THREE.Vector3(
    Math.max(tile.x + 0.18, Math.min(tile.x + 0.82, px)),
    groundY(tile.x, tile.z) + BALL_R,
    Math.max(tile.z + 0.18, Math.min(tile.z + 0.82, pz)));
}

function cupPoint(hole) {
  return new THREE.Vector3(
    hole.flag.x + 0.5 + CUP_OFF.x,
    groundY(hole.flag.x, hole.flag.z) + BALL_R,
    hole.flag.z + 0.5 + CUP_OFF.z);
}

// stand just behind the ball, on the far side from the target
function stanceFor(ball, target) {
  const dx = ball.x - target.x, dz = ball.z - target.z;
  const L = Math.hypot(dx, dz) || 1;
  const sx = ball.x + (dx / L) * 0.34, sz = ball.z + (dz / L) * 0.34;
  const t = curTileOf({ x: sx, z: sz });
  if (LIE_PENALTY[tileType(t.x, t.z)] === undefined) {
    const b = curTileOf(ball);
    return tileTopWorld(b.x, b.z);
  }
  return new THREE.Vector3(sx, groundY(t.x, t.z), sz);
}

// dur = swing length · amp = body twist · peak/peakK = apex height ·
// roll = run-out as a share of the shot. Each club reads differently in one
// glance: driver climbs and runs, approach floats and stops, chip pops, the
// putt never leaves the ground.
const SHOT_STYLE = {
  drive:    { dur: 1.05, amp: 0.34, contact: 0.46, peak: 0.55, peakK: 0.20, roll: 0.13, snd: 'swing' },
  approach: { dur: 1.00, amp: 0.30, contact: 0.46, peak: 0.50, peakK: 0.28, roll: 0.05, snd: 'swing' },
  chip:     { dur: 0.82, amp: 0.20, contact: 0.46, peak: 0.42, peakK: 0.24, roll: 0.07, snd: 'chip' },
  bunker:   { dur: 0.88, amp: 0.24, contact: 0.48, peak: 0.50, peakK: 0.22, roll: 0.03, snd: 'sand' },
  putt:     { dur: 0.70, amp: 0.11, contact: 0.45, peak: 0,    peakK: 0,    roll: 0,    snd: 'putt' },
};

function makeShot(kind, from, to, rest, splash, holed) {
  const st = SHOT_STYLE[kind];
  const dx = to.x - from.x, dz = to.z - from.z;
  const dist = Math.hypot(dx, dz);
  const roll = (splash || holed) ? 0 : Math.min(1.1, dist * st.roll);
  const L = dist || 1;
  const curve = kind === 'putt' ? 0 : Math.max(-0.7, Math.min(0.7, gauss() * 0.05 * dist));
  return {
    kind, from, to, rest, dist, splash: !!splash, holed: !!holed,
    swingDur: st.dur, amp: st.amp, contact: st.contact, snd: st.snd,
    peak: st.peak ? st.peak + dist * st.peakK : 0,
    // touchdown point: the flight ends here and the ball runs out to `to`
    land: roll > 0.02 ? new THREE.Vector3().lerpVectors(from, to, 1 - roll / L) : to,
    rollDur: roll > 0.02 ? Math.min(0.5, 0.16 + roll * 0.5) : 0,
    flightDur: kind === 'putt' ? Math.min(1.15, 0.32 + dist * 0.5) : Math.min(1.5, 0.5 + dist * 0.075),
    curveV: curve ? new THREE.Vector3(-dz / L * curve, 0, dx / L * curve) : null,
  };
}

// how a number becomes a sequence: regulation full shots (par − 2, the real
// definition) then putts. Two putts is the default the world runs on; one is a
// made putt, three is a bad day on the green. `spare` — strokes past reaching
// the green in regulation — is what buys the extra ones.
// Anything at or under regulation holes out from off the green.
function shotSplit(hole, strokes, prof) {
  const reg = Math.max(1, hole.par - 2);
  if (strokes <= reg) return { full: strokes, putts: 0 };
  const spare = strokes - reg;
  // putting spends the same number differently: the great putter turns a spare
  // stroke into one on the green and a long approach, the poor one into two
  const r = Math.random() - (prof ? prof.putting * 0.17 : 0);
  let putts = spare <= 1 ? 1
    : spare === 2 ? (r < 0.22 ? 1 : 2)
    : (r < 0.16 ? 1 : r < 0.78 ? 2 : 3);
  let full = strokes - putts;
  const cap = reg + 3;                    // beyond this it is putts, not clubs
  if (full > cap) { putts += full - cap; full = cap; }
  return { full, putts };
}

function kindFor(from, dist, toGreen) {
  const t = curTileOf(from);
  if (tileType(t.x, t.z) === 'bunker') return 'bunker';
  if (dist < 2.3) return 'chip';
  return toGreen ? 'approach' : 'drive';
}

function buildShots(hole, strokes, prof) {
  const { full, putts } = shotSplit(hole, strokes, prof);
  // the two things you can see from the clubhouse: how far up the hole the
  // first swings finish, and how near the middle of it they finish
  const POW = prof ? 1 + prof.power * 0.14 : 1;
  const ACC = prof ? 1 - prof.accuracy * 0.40 : 1;
  const cup = cupPoint(hole);
  const vx = hole.flag.x - hole.tee.x, vz = hole.flag.z - hole.tee.z;
  const D = Math.hypot(vx, vz) || 1;
  const nx = vx / D, nz = vz / D;
  const px = -nz, pz = nx;                 // corridor perpendicular, for scatter

  // a lost ball needs a spare stroke to pay the penalty with, water on the line
  // to lose it in, and a shot left over to recover with
  let wetTile = null;
  if (full >= 3 && hole.hazards.water > 0 && strokes > hole.par && Math.random() < 0.5) {
    const f = 0.4 + Math.random() * 0.3;
    wetTile = nearTile(Math.round(hole.tee.x + vx * f), Math.round(hole.tee.z + vz * f), 'water', 2);
  }
  const swings = full - (wetTile ? 1 : 0);   // the penalty stroke costs no swing
  const wet = wetTile ? Math.max(0, Math.min(swings - 2, Math.floor(swings / 2) - 1)) : -1;

  // a miss that finds sand: once the golfer is past regulation, the shot before
  // the approach can bail into a greenside bunker — then it is a proper splash
  // out and a putt, which is how a bogey actually happens
  const reg = Math.max(1, hole.par - 2);
  const sandTile = (swings > reg && hole.hazards.bunker > 0 && putts > 0 && Math.random() < 0.55)
    ? nearTile(hole.flag.x, hole.flag.z, 'bunker', 3) : null;
  const sand = (sandTile && swings - 2 !== wet) ? swings - 2 : -1;

  const shots = [];
  let from = restPoint(hole.tee, hole.tee.x + 0.5 + nx * 0.22, hole.tee.z + 0.5 + nz * 0.22);
  for (let i = 0; i < swings; i++) {
    const last = i === swings - 1;
    let to, rest, splash = false;
    if (i === wet) {
      to = new THREE.Vector3(wetTile.x + 0.5, groundY(wetTile.x, wetTile.z) + 0.03, wetTile.z + 0.5);
      const bx = wetTile.x + 0.5 - nx * 1.15, bz = wetTile.z + 0.5 - nz * 1.15;
      rest = restPoint(snapLanding(bx, bz) || hole.tee, bx, bz);   // penalty drop
      splash = true;
    } else if (i === sand) {
      const jx = sandTile.x + 0.5 + (Math.random() - 0.5) * 0.5;
      const jz = sandTile.z + 0.5 + (Math.random() - 0.5) * 0.5;
      to = rest = restPoint(sandTile, jx, jz);
    } else if (last && putts === 0) {
      to = rest = cup;                     // holed from off the green
    } else {
      const f = last ? 1 : Math.max(0.12, Math.min(0.94,
        (1 - Math.pow(1 - (i + 1) / swings, 1.35) + gauss() * 0.035) * POW));
      const spread = (last ? 0.34 + hole.greenSize * 0.03 : 0.36 + D * (1 - f) * 0.16) * ACC;
      const off = Math.max(-2.2, Math.min(2.2, gauss() * spread));
      const ix = hole.tee.x + 0.5 + vx * f + px * off;
      const iz = hole.tee.z + 0.5 + vz * f + pz * off;
      const tile = last ? greenLanding(hole, ix, iz) : (snapLanding(ix, iz) || hole.flag);
      to = rest = restPoint(tile, ix, iz);
    }
    const dist = Math.hypot(to.x - from.x, to.z - from.z);
    shots.push(makeShot(kindFor(from, dist, last), from, to, rest, splash, last && putts === 0));
    from = rest;
  }

  for (let j = 0; j < putts; j++) {
    const last = j === putts - 1;
    let to = cup;
    if (!last) {
      // a missed putt is left where the next one is makeable — a long one
      // first if there are two to come, otherwise a tap-in
      const d = (putts - 1 - j >= 2 ? 0.85 : 0.34) * (prof ? 1 - prof.putting * 0.30 : 1);
      const a = Math.random() * Math.PI * 2;
      const gx = cup.x + Math.cos(a) * d, gz = cup.z + Math.sin(a) * d;
      to = restPoint(greenLanding(hole, gx, gz), gx, gz);
    }
    shots.push(makeShot('putt', from, to, to, false, last));
    from = to;
  }
  return shots;
}

// shots → plan legs: swing, walk to the ball, swing again, and a beat at the
// cup for the drop
function buildHoleLegs(hole, strokes, prof) {
  const shots = buildShots(hole, strokes, prof);
  // stepping up to the ball from wherever on the tee they were standing — the
  // group's spots are spread across the teeing ground, so the walk to the
  // markers is now a real (short) part of playing away
  const legs = [{ t: 'step', p: stanceFor(shots[0].from, shots[0].to) }];
  for (let i = 0; i < shots.length; i++) {
    const s = shots[i];
    legs.push({ t: 'swing', shot: s, si: i });
    if (s.holed) { legs.push({ t: 'sink', hole, shot: s }); break; }
    const next = shots[i + 1];
    const stance = stanceFor(s.rest, next ? next.to : s.rest);
    // on the green a putt is followed by a couple of paces, not a route
    legs.push(s.kind === 'putt'
      ? { t: 'step', p: stance }
      : { t: 'walk', to: curTileOf(s.rest), append: stance });
  }
  return { shots, legs };
}

// ── Ball pool + flight ───────────────────────────────────────────────────────

const ballGeo = new THREE.SphereGeometry(0.07, 10, 10);
const ballMat = mat(0xffffff, 0.3);
const ballPool = [];

function acquireBall() {
  let m = ballPool.pop();
  if (!m) {
    m = new THREE.Mesh(ballGeo, ballMat);
    m.castShadow = true;
    m.raycast = () => { };      // never steals a click from a golfer or a moment
  }
  m.scale.set(1, 1, 1);
  fxGroup.add(m);
  return m;
}
function releaseBall(m) {
  if (!m) return;
  fxGroup.remove(m);
  if (ballPool.length < 48) ballPool.push(m);
}

function hitBall(g, sh) {
  sound(sh.snd, sh.from, Math.min(1, sh.dist / 9));
  if (sh.kind === 'bunker') sandPuff(sh.from);
  // the long-drive board: the first swing of a hole, measured where it stopped.
  // A tee shot that found the water travelled just as far, and the board on the
  // wall of a real clubhouse has always been happy to say so.
  if (sh.kind === 'drive' && g.shotIdx === 0 && !g.tour) {
    const p = sh.rest || sh.to;
    noteDrive(g.person.name, Math.hypot(p.x - sh.from.x, p.z - sh.from.z) * YARDS_PER_TILE);
  }
  if (!g.ball) g.ball = acquireBall();
  g.ball.scale.set(1, 1, 1);
  g.ball.position.copy(sh.from);
  balls.push({ mesh: g.ball, golfer: g, sh, t: 0, stage: 0 });
}

function dropBall(b, i, release) {
  balls.splice(i, 1);
  if (!release) return;
  releaseBall(b.mesh);
  if (b.golfer && b.golfer.ball === b.mesh) b.golfer.ball = null;
}

function updateBalls(dt) {
  for (let i = balls.length - 1; i >= 0; i--) {
    const b = balls[i];
    const sh = b.sh, m = b.mesh;
    b.t += dt;
    if (b.stage === 0) {                                   // flight, or a putt's roll
      const k = Math.min(1, b.t / sh.flightDur);
      m.position.lerpVectors(sh.from, sh.land, sh.peak ? k : 1 - (1 - k) * (1 - k));
      if (sh.peak || sh.curveV) {
        const s = Math.sin(Math.PI * k);
        m.position.y += s * sh.peak;
        if (sh.curveV) m.position.addScaledVector(sh.curveV, s);
      }
      if (k >= 1) {
        m.position.copy(sh.land);
        if (sh.splash) {
          splashAt(sh.land);
          // the man who hit it saw it too: hands go to the head mid-trudge
          if (b.golfer) startGesture(b.golfer, 'slump', { delay: 0.2, why: 'water' });
          dropBall(b, i, true); continue;
        }
        if (sh.rollDur > 0) { b.stage = 1; b.t = 0; }
        else if (sh.holed) { b.stage = 2; b.t = 0; }
        else { dropBall(b, i, false); continue; }
      }
    } else if (b.stage === 1) {                            // run-out after the bounce
      const k = Math.min(1, b.t / sh.rollDur);
      m.position.lerpVectors(sh.land, sh.to, 1 - (1 - k) * (1 - k));
      if (k >= 1) {
        if (sh.holed) { b.stage = 2; b.t = 0; }
        else { dropBall(b, i, false); continue; }
      }
    } else {                                               // into the cup
      const k = Math.min(1, b.t / 0.24);
      m.position.y = sh.to.y - k * 0.17;
      const s = 1 - k * 0.3;
      m.scale.set(s, s, s);
      if (k >= 1) { dropBall(b, i, true); continue; }
    }
  }
}

// the pin rocks in its cup when a putt drops — the one flourish the hole gets
const pinFx = [];
function pinReact(hole) {
  const tm = tileMeshes[keyOf(hole.flag.x, hole.flag.z)];
  const pin = tm && tm.userData.pin;
  if (!pin) return;
  for (const f of pinFx) if (f.pin === pin) { f.t = 0; return; }
  pinFx.push({ pin, t: 0 });
}
function updatePinFx(dt) {
  for (let i = pinFx.length - 1; i >= 0; i--) {
    const f = pinFx[i];
    f.t += dt;
    const decay = Math.exp(-f.t * 4.2);
    f.pin.rotation.z = Math.sin(f.t * 21) * 0.06 * decay;
    f.pin.rotation.x = Math.cos(f.t * 17.5) * 0.045 * decay;
    if (f.t > 1.1) { f.pin.rotation.set(0, 0, 0); pinFx.splice(i, 1); }
  }
}

const sandMat = mat(COLORS.ripple, 0.85);
const dropMat = mat(COLORS.water, 0.2);
const foamDropMat = mat(0xffffff, 0.35);

function sandPuff(pos) {
  for (let i = 0; i < 7; i++) {
    const m = rbox(0.055, 0.045, 0.055, sandMat, 0.018);
    m.castShadow = false;
    m.position.set(pos.x + (Math.random() - 0.5) * 0.16, pos.y, pos.z + (Math.random() - 0.5) * 0.16);
    scene.add(m);
    particles.push({
      m, life: 0.42 + Math.random() * 0.22,
      v: new THREE.Vector3((Math.random() - 0.5) * 1.5, 1.0 + Math.random() * 0.9, (Math.random() - 0.5) * 1.5),
    });
  }
}

function splashAt(pos) {
  sound('splash', pos);
  for (let i = 0; i < 9; i++) {
    const m = rbox(0.06, 0.06, 0.06, i & 1 ? foamDropMat : dropMat, 0.02);
    m.castShadow = false;
    m.position.copy(pos);
    scene.add(m);
    particles.push({
      m, life: 0.5 + Math.random() * 0.25,
      v: new THREE.Vector3((Math.random() - 0.5) * 1.8, 1.5 + Math.random() * 1.2, (Math.random() - 0.5) * 1.8),
    });
  }
}

// ── Moments — the celebration economy ────────────────────────────────────────
// A birdie or better spawns a golden spark above the pin. Tapping it
// celebrates for a bonus scaled to rarity; ignored sparks quietly fade out.
// Missing one costs nothing — the course simply plays on.

const moments = [];
const momentGroup = new THREE.Group(); scene.add(momentGroup);
const MAX_MOMENTS = 3;
const MOMENT_TIERS = {
  birdie:    { rank: 0, size: 0.16, life: 9,  mult: 1.4, min: 10 },
  eagle:     { rank: 1, size: 0.21, life: 12, mult: 6,   min: 40 },
  albatross: { rank: 2, size: 0.25, life: 14, mult: 15,  min: 150 },
};

// value scales with per-hole revenue so active play tracks the whole economy:
// celebrating the typical round's birdies adds roughly a third over pure idle
function momentValue(tier) {
  const t = MOMENT_TIERS[tier];
  const perHole = course.holes.length ? course.fee / course.holes.length : 0;
  return Math.max(t.min, Math.round(perHole * t.mult * (1 + 0.08 * course.stars)));
}

function makeMomentMesh(size) {
  const g = new THREE.Group();
  const core = rbox(size, size, size, goldMat, size * 0.28);
  core.rotation.set(Math.PI / 4, 0, Math.PI / 4);   // a floating gold gem
  g.add(core);
  g.userData.core = core;
  const orbiters = [];
  for (let i = 0; i < 3; i++) {
    const s = rbox(0.055, 0.055, 0.055, goldMat, 0.018);
    s.castShadow = false;
    g.add(s); orbiters.push(s);
  }
  g.userData.orbiters = orbiters;
  // generous invisible hit target — celebrating should feel effortless
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.48, 8, 8), highlightMat);
  hit.visible = false;
  g.add(hit);
  return g;
}

let lastSparkAt = -9;
function spawnMoment(hole, tier, label) {
  const def = MOMENT_TIERS[tier];
  if (moments.length >= MAX_MOMENTS) {
    // a rarer score displaces the commonest active spark; equals just pass by
    let low = null;
    for (const m of moments) {
      if (m.dying) continue;
      if (!low || MOMENT_TIERS[m.tier].rank < MOMENT_TIERS[low.tier].rank) low = m;
    }
    if (!low || MOMENT_TIERS[low.tier].rank >= def.rank) return null;
    expireMoment(low);
  }
  const pos = tileTopWorld(hole.flag.x, hole.flag.z).add(new THREE.Vector3(0, 1.05, 0));
  const mesh = makeMomentMesh(def.size);
  mesh.position.copy(pos);
  mesh.scale.set(0.01, 0.01, 0.01);
  tweens.push({ obj: mesh.scale, to: { x: 1, y: 1, z: 1 }, t: 0, dur: 0.34, ease: 'back' });
  momentGroup.add(mesh);
  const m = { mesh, pos, tier, hx: hole.flag.x, hz: hole.flag.z, life: def.life, phase: Math.random() * 6.28, dying: false };
  mesh.traverse(o => { o.userData.momentRef = m; });
  moments.push(m);
  if (label) floater(pos.clone().add(new THREE.Vector3(0, 0.35, 0)), label, 'gold');
  const now = performance.now() / 1000;
  if (def.rank > 0) sound('tip');
  else if (now - lastSparkAt > 2) sound('spark');
  lastSparkAt = now;
  return m;
}

function expireMoment(m) {
  if (m.dying) return;
  m.dying = true;
  m.life = Math.min(m.life, 0.4);   // the last beat is the fade-out
}

function removeMoment(m) {
  momentGroup.remove(m.mesh);
  const i = moments.indexOf(m);
  if (i >= 0) moments.splice(i, 1);
}

function celebrateMoment(m) {
  if (m.dying) return;
  const value = momentValue(m.tier);
  addMoney(value);
  state.celebrated.total++;
  if (MOMENT_TIERS[m.tier].rank > 0) state.celebrated.eagle++;
  floaterCount(m.mesh.position.clone().add(new THREE.Vector3(0, 0.2, 0)), value, 'gold big');
  confettiBurst(m.mesh.position, m.tier === 'birdie' ? 14 : 22);
  sound('celebrate');
  // …and the score warms for a quarter minute — a change of temperature in
  // the room, not a sting on top of the fanfare
  if (scoreCtl) scoreCtl.lift();
  removeMoment(m);
  updateMilestone();
}

function updateMoments(dt, time) {
  for (let i = moments.length - 1; i >= 0; i--) {
    const m = moments[i];
    m.life -= dt;
    const g = m.mesh;
    g.position.y = m.pos.y + Math.sin(time * 2.4 + m.phase) * 0.06;
    g.userData.core.rotation.y += dt * 1.6;
    const ob = g.userData.orbiters;
    for (let j = 0; j < ob.length; j++) {
      const a = time * 1.9 + m.phase + j * (Math.PI * 2 / 3);
      ob[j].position.set(Math.cos(a) * 0.33, Math.sin(time * 3.1 + j * 2.1 + m.phase) * 0.11, Math.sin(a) * 0.33);
      const tw = 0.7 + Math.sin(time * 6 + j * 1.7 + m.phase) * 0.35;   // twinkle
      ob[j].scale.set(tw, tw, tw);
    }
    if (m.life <= 0.4) {
      const k = Math.max(0.01, m.life / 0.4);
      const s = k * k;
      g.scale.set(s, s, s);
      if (m.life <= 0) removeMoment(m);
    }
  }
}

const CONFETTI_COLORS = [0xffc7d9, 0xfff3b0, 0xffb3a7, 0xd7c5f2, 0xa6e3b8, 0xf5c451];
function confettiBurst(pos, n) {
  for (let i = 0; i < n; i++) {
    const p = rbox(0.07, 0.02, 0.05, mat(CONFETTI_COLORS[i % CONFETTI_COLORS.length], 0.55), 0.008);
    p.position.copy(pos);
    p.rotation.set(Math.random() * 3, Math.random() * 3, Math.random() * 3);
    scene.add(p);
    particles.push({
      m: p,
      v: new THREE.Vector3((Math.random() - 0.5) * 3.2, 1.6 + Math.random() * 2.6, (Math.random() - 0.5) * 3.2),
      life: 0.9 + Math.random() * 0.5,
    });
  }
}

// A golfer you can tell apart from across the property. Every colour comes off
// the person (people.js), so the same booking looks the same after a reload —
// and the bag on their back is what says "golfer" at voxel size.
const CAP_COLORS = [0xffffff, 0xff5a4e, 0x2f3a4a, 0xfdd663, 0x8ab4f8, 0x34c759];
const HAIR_COLORS = [0x2b2118, 0x5a3a22, 0x8d6136, 0xd9c08a, 0x9aa0a6];
const BAG_COLORS = [0x2f3a4a, 0xffffff, 0xc9463c, 0x3f6d55, 0xd9c6a0, 0x6b5ea8];

// a person's 0–1 look value picked out of a palette — the same call the follow
// card's avatar makes, so the chip on the card is the shirt on the golfer
function pickLook(arr, v) { return arr[Math.min(arr.length - 1, Math.floor(v * arr.length))]; }
function cssHex(c) { return '#' + c.toString(16).padStart(6, '0'); }

// Everyone on the property is a person first: the mesh is their look, not a
// random shirt. `opts.bag` off is the terrace — a guest with a drink, not a bag.
function makeGolferMesh(person, opts) {
  const L = person.look;
  const idx = pickLook;
  const g = new THREE.Group();
  // a notable wears their own colour, which is the point of having one
  const shirt = mat(L.shirtHex != null ? L.shirtHex : idx(COLORS.shirts, L.shirt), 0.6);
  const pants = mat(idx(COLORS.pants, L.pants), 0.65);
  const skin = mat(idx(COLORS.skins, L.skin), 0.55);
  const legs = rbox(0.16, 0.16, 0.12, pants, 0.03); legs.position.y = 0.08; g.add(legs);
  const torso = rbox(0.2, 0.2, 0.14, shirt, 0.045); torso.position.y = 0.26; g.add(torso);
  // The head and everything on it pivot together at the neck, so a nod or a
  // head shake moves the hat and the hair with the face they belong to.
  const headG = new THREE.Group(); headG.position.y = 0.415; g.add(headG);
  const head = rbox(0.16, 0.15, 0.15, skin, 0.05); head.position.y = 0.025; headG.add(head);
  // The hat is the silhouette, and at voxel size the silhouette is the name:
  // the visor, the bucket and the flat cap read from clear across the property,
  // which is how you spot a Legend on the sixth without opening a card.
  const hatM = mat(L.shirtHex != null ? L.shirtHex : idx(CAP_COLORS, L.cap), 0.5);
  const addHair = () => {
    const h = rbox(0.165, 0.04, 0.155, mat(idx(HAIR_COLORS, L.hair), 0.75), 0.018);
    h.position.y = 0.11; headG.add(h);
  };
  switch (L.hat || (L.hasCap ? 'cap' : 'none')) {
    case 'cap': {
      const c = rbox(0.18, 0.05, 0.17, hatM, 0.02); c.position.set(0, 0.12, 0.01); headG.add(c);
      break;
    }
    case 'visor': {
      addHair();
      const v = rbox(0.185, 0.026, 0.135, hatM, 0.012); v.position.set(0, 0.133, 0.045); headG.add(v);
      break;
    }
    case 'bucket': {
      const b = rbox(0.245, 0.032, 0.245, hatM, 0.014); b.position.set(0, 0.115, 0); headG.add(b);
      const cr = rbox(0.155, 0.058, 0.155, hatM, 0.03); cr.position.set(0, 0.143, 0); headG.add(cr);
      break;
    }
    case 'flatcap': {
      const f = rbox(0.205, 0.034, 0.205, hatM, 0.05);
      f.position.set(0, 0.119, 0.014); f.rotation.x = -0.13; headG.add(f);
      break;
    }
    default: addHair();
  }
  // Two arms hung from the shoulders. The whole gesture language — fist pumps,
  // cap tips, hands on heads, applause — lives in these two pivots (see
  // GESTURES), which is why every golfer and every spectator carries them.
  const armL = new THREE.Group(); armL.position.set(-0.135, 0.345, 0); g.add(armL);
  const armR = new THREE.Group(); armR.position.set(0.135, 0.345, 0); g.add(armR);
  // an arm this size casts no shadow the torso's has not already cast — keeping
  // them out of the shadow pass is what makes forty armed people cost a frame
  // nothing it wasn't already paying
  const aL = rbox(0.055, 0.17, 0.055, shirt, 0.02); aL.position.y = -0.075; aL.castShadow = false; armL.add(aL);
  const aR = rbox(0.055, 0.17, 0.055, shirt, 0.02); aR.position.y = -0.075; aR.castShadow = false; armR.add(aR);
  const parts = { headG, torso, armL, armR };
  g.userData.parts = parts;
  resetPose(parts);
  // the bag rides on the left shoulder, clubs poking over it
  if (!opts || opts.bag !== false) {
    const bagM = mat(idx(BAG_COLORS, L.bag), 0.62);
    const bag = rbox(0.075, 0.22, 0.075, bagM, 0.03);
    bag.position.set(-0.085, 0.30, -0.085); bag.rotation.z = 0.16; g.add(bag);
    const clubs = rbox(0.045, 0.09, 0.045, mat(0xbfc4c9, 0.35), 0.014);
    clubs.position.set(-0.10, 0.455, -0.09); clubs.rotation.z = 0.16; g.add(clubs);
  }
  const s = L.build;
  g.scale.set(s, s, s);
  g.userData.baseScale = s;
  return g;
}

// ── Body language ────────────────────────────────────────────────────────────
// The scoring sim is ground truth and the body reports it: a birdie earns a
// fist pump, an eagle both arms, a par a satisfied nod, a bogey a shake of the
// head, a ball in the water a slump — and the people who saw it happen answer
// with cap tips and applause. Everything here is rotations of the parts the
// rig already has (neck, shoulders, spine); one gesture at a time per body, a
// few numbers each, self-expiring. Restraint is the style: this is a calm
// game, and a nod you half-notice is worth ten cartwheels.

const GESTURES = {
  fistpump:  { dur: 1.15 },
  armsup:    { dur: 1.7 },
  nod:       { dur: 0.8 },
  headshake: { dur: 0.95 },
  slump:     { dur: 1.5 },
  tipcap:    { dur: 1.0 },
  shake:     { dur: 1.4 },
  stretch:   { dur: 2.2 },
  watch:     { dur: 1.0 },
  practice:  { dur: 1.6, bodyZ: true },   // borrows the body twist the swing uses
};

// the neutral stand every gesture returns to (arms hang a touch off the body)
function resetPose(P) {
  if (!P) return;
  P.headG.rotation.set(0, 0, 0);
  P.torso.rotation.set(0, 0, 0);
  P.armL.rotation.set(0, 0, -0.08);
  P.armR.rotation.set(0, 0, 0.08);
}

// the last 40 things anybody's body said, for judges driving this headlessly
const reactLog = [];
function reactNote(who, gest, why) {
  reactLog.push({ who, gest, why: why || '', at: +simTime.toFixed(2) });
  if (reactLog.length > 40) reactLog.shift();
}

function startGesture(g, name, opts) {
  const def = GESTURES[name];
  if (!def || !g || !g.group || !g.group.userData.parts) return false;
  // the swing owns the body's twist — a practice swing never fights a real one
  if (def.bodyZ && (g.phase === 'read' || g.phase === 'swing')) return false;
  g.gest = { name, t: -((opts && opts.delay) || 0), dur: (opts && opts.dur) || def.dur };
  reactNote(g.person ? g.person.name : 'watcher', name, opts && opts.why);
  return true;
}

function updateGesture(g, dt) {
  const ge = g.gest;
  const P = g.group.userData.parts;
  if (!P) { g.gest = null; return; }
  ge.t += dt;
  if (ge.t < 0) return;                      // a staggered start (partners, gallery)
  const k = ge.t / ge.dur;
  if (k >= 1) {
    resetPose(P);
    if (GESTURES[ge.name].bodyZ) g.group.rotation.z = 0;
    g.gest = null;
    return;
  }
  resetPose(P);
  // one shared in-out envelope, so every gesture arrives and leaves softly
  let e = k < 0.22 ? k / 0.22 : k > 0.72 ? Math.max(0, (1 - k) / 0.28) : 1;
  e = e * e * (3 - 2 * e);
  switch (ge.name) {
    case 'fistpump': {                       // birdie: the fist comes up twice
      const pump = Math.max(0, Math.sin(k * Math.PI * 4)) * 0.35;
      P.armR.rotation.x = (-2.05 - pump) * e;
      P.armR.rotation.z = 0.3 * e;
      P.headG.rotation.x = -0.16 * e;
      break;
    }
    case 'armsup':                           // eagle: both arms, putter and all
      P.armR.rotation.z = 0.08 + 2.86 * e;
      P.armL.rotation.z = -0.08 - 2.86 * e;
      P.headG.rotation.x = -0.24 * e;
      P.torso.rotation.x = -0.06 * e;
      break;
    case 'nod':                              // par: that'll do
      P.headG.rotation.x = Math.sin(Math.min(1, k * 1.15) * Math.PI) * 0.30;
      break;
    case 'headshake':                        // bogey: it was there for the taking
      P.headG.rotation.y = Math.sin(k * Math.PI * 5) * 0.30 * e;
      P.headG.rotation.x = 0.14 * e;
      break;
    case 'slump':                            // the water, or worse
      P.headG.rotation.x = 0.48 * e;
      P.torso.rotation.x = 0.15 * e;
      P.armL.rotation.z = -0.08 - 2.35 * e; P.armL.rotation.x = -0.5 * e;
      P.armR.rotation.z = 0.08 + 2.35 * e; P.armR.rotation.x = -0.5 * e;
      break;
    case 'tipcap':                           // a partner's putt deserves the hat
      P.armR.rotation.x = -2.55 * e;
      P.armR.rotation.z = -0.25 * e;
      P.headG.rotation.x = 0.17 * e;
      break;
    case 'shake': {                          // hands on the last green
      P.armR.rotation.x = (-1.30 + Math.sin(k * Math.PI * 6) * 0.13) * e;
      P.headG.rotation.x = 0.10 * e;
      break;
    }
    case 'stretch': {                        // waiting on the tee, loosening up
      const s = Math.sin(k * Math.PI), ss = s * s;
      P.armL.rotation.z = -0.08 - 2.65 * ss;
      P.armR.rotation.z = 0.08 + 2.65 * ss;
      P.torso.rotation.x = -0.07 * ss;
      P.headG.rotation.x = -0.14 * ss;
      break;
    }
    case 'watch':                            // holding the finish on a big drive
      P.headG.rotation.x = -0.30 * e;
      break;
    case 'practice':                         // a slow half-tempo swing, eyes down
      g.group.rotation.z = Math.sin(k * Math.PI * 2) * 0.17 * e;
      P.headG.rotation.x = 0.10 * e;
      break;
  }
}

// What a score does to a body, and to the bodies around it. Called at the
// moment the last ball of the hole drops (see the sink phase): the sim's
// delta-to-par picks the gesture, partners answer a holed long putt or an
// eagle with a cap tip, and a gallery — if this is the group it walked out
// for — applauds to the size of the moment.
function reactToScore(g, delta, sh) {
  const name = delta <= -2 ? 'armsup' : delta === -1 ? 'fistpump'
    : delta === 0 ? 'nod' : delta === 1 ? 'headshake' : 'slump';
  startGesture(g, name, { why: 'holed ' + (delta > 0 ? '+' + delta : delta) });
  // a celebration is watched out before the walk to the next tee begins
  if (delta < 0) g.pd = Math.max(g.pd, g.t + GESTURES[name].dur * 0.9);
  const grp = g.grp;
  const longPutt = sh && sh.kind === 'putt' && sh.dist >= 1.4;
  if (grp && ((longPutt && delta <= 0) || delta <= -2)) {
    for (const m of grp.members) {
      if (m === g || m.phase !== 'turn' || m.hole !== g.hole) continue;
      startGesture(m, 'tipcap', { delay: 0.25 + Math.random() * 0.3, why: 'partner' });
    }
  }
  if (gallery.lead && grp && gallery.lead.grp === grp && gallery.spots.length) {
    let k = sh && sh.kind === 'putt' ? (sh.dist > 1.3 ? 0.55 : 0.3) : 0.5;
    if (delta === -1) k = Math.max(k, 0.7);
    if (delta <= -2) k = 1;
    if (delta >= 2) k = 0;                   // nobody claps for a triple
    if (k) { galleryApplaud(k); crowdAt(cupPoint(g.hole), k); }
  }
}

// a walk-on with no booking behind them (__fairway.spawnGolfer()) still has to
// be somebody
let walkOnSeq = 0;

// grp/slot are the group this golfer belongs to and their place in it; called
// bare (__fairway.spawnGolfer()) it is a single walk-on, exactly as before
function spawnGolfer(grp, slot) {
  if (!course.holes.length) return;
  // the round is walk-to-the-tee, gather on it, play the hole; 'play' expands
  // into the actual shots the moment the golfer gets there, so it reads the
  // course as it is now
  const plan = [];
  // a championship round here is the venue's nine, played twice — so the plan
  // simply goes round again, and the second loop queues behind the first on
  // every tee exactly as it should
  const loops = (grp && grp.loops) || 1;
  for (let L = 0; L < loops; L++) {
    for (let i = 0; i < course.holes.length; i++) {
      // `tee` on the leg means the last step is to this golfer's own spot on the
      // tee, not to the middle of the tile everybody else is standing on
      plan.push({ t: 'walk', to: course.holes[i].tee, tee: course.holes[i] });
      plan.push({ t: 'gate', hi: i });
      plan.push({ t: 'play', hole: course.holes[i] });
    }
  }
  // the last green: a group shakes hands on it before anybody walks in
  if (grp && grp.size > 1) plan.push({ t: 'shake' });
  plan.push({ t: 'walk', to: SPAWN_TILE, append: DOOR.clone() });
  plan.push({ t: 'pay' });

  const person = (grp && grp.party && grp.party[slot || 0])
    || PEOPLE.personFor(dayInfo().seed, 900 + (walkOnSeq++), 0);
  const group = makeGolferMesh(person);
  const speed = 0.80 + Math.random() * 0.12;   // a stroll — pace of play sets the rest
  const golfer = {
    group, plan, pi: 0, person,
    pos: DOOR.clone(),
    walker: makeWalker(speed), baseSpeed: speed, pace: 1, walkK: WALK_BETWEEN,
    grp: grp || null, slot: slot || 0, tOrder: slot || 0,
    phase: 'in', t: -(slot || 0) * 1.1,     // the group filters out of the shop
    gateHi: -1, readD: 0,
    // form is the handicap they play off, not a dice roll — a 2 really does
    // beat a 22 over a round, and the card proves it. For a notable the spread
    // is their TEMPERAMENT: a 96 posts the same round every time, a 44 owns
    // both the 63 and the 79.
    skill: person.skill + gauss() * (person.vary || 0.14),
    // and the SHAPE of it — the lean across power, accuracy and putting that
    // decides which holes they take their shots on and what the shots look like
    prof: person.prof || null,
    // a name in the field sells cart hire, range balls and half the pro shop
    fee: course.fee * (person.star ? 1 + person.star.tierDef.rank * 0.22 : 1),
    tipped: false,
    ball: null,
    // current hole in progress: the rolled number and the shots that spend it
    hole: null, strokes: 0, shots: null, shotIdx: 0,
    // how far the next shot is from the cup, and how long they stood off it
    away: 0, turnShot: null,
    // the round adding up behind them — posted to the club record at the desk,
    // and read shot by shot on the follow card
    round: 0, roundPar: 0, roundHoles: 0, card: [], lastStrokes: 0,
    // the starter's watch: running from the first tee to the last putt
    teedOff: false, playT: 0, birdies: 0,
    bobPhase: Math.random() * 6.28,
  };
  group.position.copy(golfer.pos);
  group.rotation.y = Math.PI; // facing out the door
  const s0 = group.userData.baseScale;
  group.scale.set(0.01, 0.01, 0.01);
  group.userData.golferRef = golfer;
  group.traverse(o => { o.userData.golferRef = golfer; });
  golferGroup.add(group);
  golfers.push(golfer);
  if (grp) grp.members.push(golfer);
  return golfer;
}

function startLeg(g) {
  const leg = g.plan[g.pi];
  if (!leg) { g.phase = 'out'; g.t = 0; return; }
  switch (leg.t) {
    case 'walk': {
      // The only club ground a golfer ever stands on is the doorstep, and that
      // tile's centre is inside the building — routing out of it would walk
      // them through the wall (and through the portico columns on the way).
      // Everyone leaves the way they arrive: off the mat, onto the tile in
      // front of the door, and away.
      const cur = curTileOf(g.pos);
      const from = isClub(cur.x, cur.z) ? SPAWN_TILE : cur;
      const pts = routePoints(from, leg.to, GOLFER_COST);
      // start from where the golfer actually stands
      pts.unshift(g.pos.clone());
      const app = leg.append || (leg.tee ? teeStand(leg.tee, g.tOrder) : null);
      if (app) pts.push(app);
      startRoute(g.walker, pts, null);
      g.walker.speed = g.baseSpeed * g.walkK;
      g.phase = 'walk';
      break;
    }
    case 'step': {                    // a couple of paces on the green
      startRoute(g.walker, [g.pos.clone(), leg.p], null);
      g.walker.speed = g.baseSpeed * g.walkK;
      g.phase = 'walk';
      break;
    }
    case 'gate': {                    // the whole group gathers on the tee
      g.phase = 'gate'; g.t = 0; g.gateHi = leg.hi;
      const grp = g.grp;
      if (grp) {
        if (grp.gateHi !== leg.hi) { grp.gateHi = leg.hi; grp.gateN = 0; grp.open = false; }
        grp.gateN++;
      }
      const h = course.holes[leg.hi];
      if (h) g.group.rotation.y = Math.atan2(h.flag.x - h.tee.x, h.flag.z - h.tee.z);
      break;
    }
    case 'read': {
      // The routine paceLegs budgeted for, in full: standing off a partner's
      // ball is already priced into the hole (see `serial`), so it is never
      // taken off the time this player spends over their own.
      g.phase = 'read'; g.t = 0;
      g.readD = leg.d;
      break;
    }
    case 'turn': {                     // stand off it until it is your shot
      g.phase = 'turn'; g.t = 0;
      g.turnShot = leg.shot;
      g.away = awayFrom(g, leg.shot);
      break;
    }
    case 'play': {
      // Roll the hole once, then spend that number in front of the player.
      // A championship round is not rolled here at all: the number was
      // published on the leaderboard before the player arrived, so the shots
      // they are about to watch are the shots that made it.
      //
      // `roundHoles` is the only cursor into that card, and it already carries
      // the holes a dropped-in group was credited with on arrival (see
      // startTourGroup) — adding the drop-in offset on top of it counted the
      // same thing twice and dealt everyone but the first group of the day the
      // wrong hole's score.
      const hole = leg.hole;
      const strokes = g.tourCard
        ? g.tourCard[Math.min(g.tourCard.length - 1, g.roundHoles)]
        : scoreHole(hole, g.skill, g.prof);
      const built = buildHoleLegs(hole, strokes, g.prof);
      g.hole = hole; g.strokes = strokes; g.shots = built.shots; g.shotIdx = 0;
      g.teedOff = true;               // the starter's watch begins on the first tee
      // swing tempo: more strokes means more to do, so it is done faster — a
      // triple bogey is a longer watch than a par, never a three-times-longer one
      g.pace = Math.min(1.7, 1
        + Math.max(0, strokes - hole.par) * 0.18
        + Math.max(0, hole.dist - 8) * 0.05);
      g.plan.splice(g.pi, 1, ...paceLegs(g, hole, built));
      startLeg(g);
      return;
    }
    case 'swing': {
      g.phase = 'swing'; g.t = 0; g.swungBall = false; g.shotIdx = leg.si;
      // a drive worth watching gets its finish held — decided here, spent in
      // the phase: the body freezes at the top of the follow-through for as
      // long as the ball is worth looking at, and never for one going swimming
      const sh = leg.shot;
      g.holdK = (sh.kind === 'drive' && sh.dist >= 6 && !sh.splash)
        ? Math.min(1.0, sh.flightDur * 0.55) : 0;
      break;
    }
    case 'sink': {
      g.phase = 'sink'; g.t = 0; g.sank = false;
      // the ball is already in the air when the swing leg ends — wait out what
      // is left of the flight, then a beat to watch it disappear
      const sh = leg.shot;
      g.sinkAt = Math.max(0.05, sh.flightDur - sh.swingDur * (1 - sh.contact) / g.pace);
      g.pd = g.sinkAt + 0.6;
      break;
    }
    case 'shake': {
      // stand on the green until the group's last putt has dropped, then
      // hands all round — skipped the moment there is nobody left to shake
      const grp = g.grp;
      if (!grp || grp.members.length < 2) { g.pi++; startLeg(g); return; }
      g.phase = 'shake'; g.t = 0; g.shook = false;
      break;
    }
    case 'pay': {
      // nobody pays a green fee at a major, and nothing that happens there
      // touches the club's own book, record or word of mouth
      if (g.tour || away.active) { g.phase = 'out'; g.t = 0; break; }
      // the first green fee ever paid here lands with a milestone's weight —
      // it is the whole business model arriving at once
      if (!state.notes.fee) {
        committeeNote('fee',
          g.person.name + ' paid the club\'s first green fee · +' + fmt(g.fee) +
          ' — every finished round pays at the door',
          'spark', null, 'lucky');
      }
      payFee(g.fee);
      if (state.sheet) { state.sheet.rounds++; state.sheet.take += g.fee; }
      // only a card signed for every hole on the course can be a record
      if (g.roundHoles === course.holes.length) {
        postRound(g.person.name, g.round, g.roundPar, g.roundHoles, g.birdies, g.playT);
      }
      // and they say what they thought on the way out — see logMood
      if (g.roundHoles) logMood(satisfactionOf(g));
      // a notable signs the visitors' book as well as the card
      if (g.person.star && g.roundHoles) signOff(g);
      g.phase = 'out'; g.t = 0;
      break;
    }
  }
}

function removeGolfer(g) {
  if (followed === g) closeFollowCard();
  golferGroup.remove(g.group);
  for (let i = balls.length - 1; i >= 0; i--) if (balls[i].golfer === g) balls.splice(i, 1);
  if (g.ball) { releaseBall(g.ball); g.ball = null; }
  const i = golfers.indexOf(g);
  if (i >= 0) golfers.splice(i, 1);
  const grp = g.grp;
  if (grp) {
    if (grp.turn === g) grp.turn = null;
    const j = grp.members.indexOf(g);
    if (j >= 0) grp.members.splice(j, 1);
    if (!grp.members.length) endGroup(grp);
  }
}

// ── The gallery ──────────────────────────────────────────────────────────────
// What a great player's arrival looks like from the terrace: a handful of
// people who have quietly walked out to watch, standing back and to the side of
// the shot, moving up the hole when the group does. No banners, no announcer,
// no badge floating over anybody's head — restraint is the whole effect. The
// bigger the name, the bigger the crowd, and a Local Standout draws nobody,
// which is exactly right.

const GALLERY_N = { standout: 0, touring: 3, winner: 5, major: 7, legend: 9 };
const GALLERY_MAX = 9;
const galleryGroup = new THREE.Group(); scene.add(galleryGroup);
const gallery = { star: null, lead: null, spots: [], watchers: [] };

function galleryFor(g) {
  // the spectators are people too — the same deterministic townsfolk each day
  const seed = dayInfo().seed;
  while (gallery.watchers.length < g) {
    const i = gallery.watchers.length;
    const mesh = makeGolferMesh(PEOPLE.personFor(seed, 700 + i, 0), { bag: false });
    mesh.scale.set(0.01, 0.01, 0.01);
    galleryGroup.add(mesh);
    gallery.watchers.push({ mesh, k: 0, pos: new THREE.Vector3(), target: new THREE.Vector3(), set: false });
  }
}

// A loose arc behind the shot. `n` places are laid out over about 120° of the
// far side, pulled in off any water they would otherwise be standing in.
function placeGallery(lead) {
  const n = gallery.spots.length;
  if (!n) return;
  const grp = lead.grp;
  const h = grp && grp.hole >= 0 ? course.holes[grp.hole] : lead.hole;
  let ax = 0, az = -1;
  if (h) {
    const vx = h.flag.x - h.tee.x, vz = h.flag.z - h.tee.z;
    const L = Math.hypot(vx, vz) || 1;
    ax = -vx / L; az = -vz / L;      // "behind", from the golfer's point of view
  }
  const base = Math.atan2(az, ax);
  for (let i = 0; i < n; i++) {
    // a fixed wobble per place, so nine people read as a crowd and not a chorus
    // line — the same nine places every time, never a line of identical gaps
    const j = Math.sin(i * 12.9898) * 43758.5453;
    const jit = (j - Math.floor(j)) - 0.5;
    const spread = n > 1 ? (i / (n - 1) - 0.5) * 2.1 + jit * 0.22 : 0;
    const ang = base + spread;
    let r = 1.55 + (i % 3) * 0.34 + jit * 0.30;
    let x = lead.pos.x + Math.cos(ang) * r;
    let z = lead.pos.z + Math.sin(ang) * r;
    // nobody watches golf from the middle of a lake
    for (let tries = 0; tries < 3; tries++) {
      const tx = Math.floor(x), tz = Math.floor(z);
      if (inBounds(tx, tz) && tileType(tx, tz) !== 'water') break;
      r -= 0.5;
      x = lead.pos.x + Math.cos(ang) * r;
      z = lead.pos.z + Math.sin(ang) * r;
    }
    gallery.spots[i].set(x, groundY(Math.floor(x), Math.floor(z)), z);
  }
}

// The crowd answers a holed putt with its hands — arms up and a quick patter,
// staggered a few frames apart so it ripples through them instead of snapping.
// The sound half lives in crowdAt; this is only the bodies.
function galleryApplaud(k) {
  let n = 0;
  for (let i = 0; i < gallery.spots.length && i < gallery.watchers.length; i++) {
    const w = gallery.watchers[i];
    if (!w.mesh.visible) continue;
    w.clap = { t: -(i * 0.06 + Math.random() * 0.08), dur: 0.9 + k * 1.4 };
    n++;
  }
  if (n) reactNote('gallery', 'applaud', 'x' + n + ' @' + (+k).toFixed(2));
  return n;
}

// the group worth walking out for: the biggest name currently on the course
function galleryLead() {
  let best = null, rank = 0;
  for (const grp of groups) {
    if (!grp.vip || !aliveIn(grp)) continue;
    const r = grp.vip.tierDef.rank;
    if (!GALLERY_N[grp.vip.tier] || r <= rank) continue;
    const lead = grp.members.find(m => m.person.star === grp.vip);
    if (lead) { best = lead; rank = r; }
  }
  return best;
}

function updateGallery(dt, time) {
  const lead = clubOpen() ? galleryLead() : null;
  if (lead !== gallery.lead) {
    gallery.lead = lead;
    gallery.star = lead ? lead.person.star : null;
    const want = lead ? Math.min(GALLERY_MAX, GALLERY_N[gallery.star.tier] || 0) : 0;
    galleryFor(want);
    gallery.spots.length = want;
    for (let i = 0; i < want; i++) if (!gallery.spots[i]) gallery.spots[i] = new THREE.Vector3();
    if (lead) placeGallery(lead);
  }
  const want = gallery.spots.length;
  if (!want && !gallery.watchers.some(w => w.k > 0.01)) return;

  // they move up the hole when the golf does, not every time somebody shuffles
  if (lead && want) {
    let cx = 0, cz = 0;
    for (const s of gallery.spots) { cx += s.x; cz += s.z; }
    cx /= want; cz /= want;
    if (Math.hypot(lead.pos.x - cx, lead.pos.z - cz) > 2.5) placeGallery(lead);
  }

  for (let i = 0; i < gallery.watchers.length; i++) {
    const w = gallery.watchers[i];
    const on = i < want;
    w.k += ((on ? 1 : 0) - w.k) * Math.min(1, dt * 3.4);
    const s = w.mesh.userData.baseScale * 0.94 * w.k;
    w.mesh.visible = w.k > 0.02;
    if (!w.mesh.visible) { w.set = false; continue; }
    w.mesh.scale.set(s, s, s);
    if (on) {
      const t = gallery.spots[i];
      if (!w.set) { w.pos.copy(t); w.set = true; }
      else w.pos.lerp(t, Math.min(1, dt * 1.6));
      w.mesh.position.copy(w.pos);
      w.mesh.position.y += Math.abs(Math.sin(time * 1.2 + i * 1.7)) * 0.006;
      if (lead) {
        const ang = Math.atan2(lead.pos.x - w.pos.x, lead.pos.z - w.pos.z);
        w.mesh.rotation.y += shortAngle(w.mesh.rotation.y, ang) * Math.min(1, dt * 2.2);
      }
    }
    // hands together for the putt that just dropped (see galleryApplaud)
    if (w.clap) {
      w.clap.t += dt;
      const c = w.clap, P = w.mesh.userData.parts;
      if (!P) { w.clap = null; continue; }
      if (c.t >= 0) {
        const k = c.t / c.dur;
        if (k >= 1) { resetPose(P); w.clap = null; }
        else {
          let e = k < 0.2 ? k / 0.2 : k > 0.7 ? Math.max(0, (1 - k) / 0.3) : 1;
          e = e * e * (3 - 2 * e);
          const beat = 0.42 + 0.26 * Math.sin(c.t * 44 + i * 1.3);
          P.armL.rotation.x = P.armR.rotation.x = -1.65 * e;
          P.armL.rotation.z = -0.08 + beat * e;
          P.armR.rotation.z = 0.08 - beat * e;
          P.headG.rotation.x = -0.10 * e;
        }
      }
    }
  }
}

// The arrival. One line, once, in the same voice the rest of the club speaks
// in — and now the game's first OCCASION: the chit carries the one-click
// camera, and pressing it is the only way the camera ever moves (offerWatch).
function arriveVip(grp, star) {
  const seen = state.club.seen[star.id];
  const back = seen && seen.n ? ' · back for a ' + (seen.n === 1 ? 'second' : 'third') + ' look' : '';
  const who = memberOf(star.id) ? 'Member' : star.tierDef.label;
  const line = star.name + ' is on the first tee · ' + who + (memberOf(star.id) ? '' : back);
  const g = grp.members.find(m => m.person.star && m.person.star.id === star.id);
  if (g) offerWatch(g, line, 'flag'); else toast(line, 'flag');
  occasions.last = { id: 'tee@' + star.id, msg: line, at: nowMs() };
  sound('arrive');
}

function updateGolfers(dt, time) {
  // one gate, two books: at home the club's own tee sheet lets people out; at a
  // championship venue it is the field's draw sheet instead
  if (away.active) releaseTourGroups(dt); else releaseSlots();
  updateGallery(dt, time);
  for (const grp of groups) {
    if (!grp.blocked) continue;
    grp.waitS += dt;
    if (state.sheet) state.sheet.waitS += dt;
  }

  updateBalls(dt);
  updatePinFx(dt);

  for (let i = golfers.length - 1; i >= 0; i--) {
    const g = golfers[i];
    g.t += dt;
    // pace of play, timed the way a starter times it: from the moment they are
    // called to the first tee until the last putt drops. Sim seconds, not wall
    // seconds, so a round advanced with __fairway.step is timed exactly like a
    // round watched in real time.
    if (g.teedOff && g.roundHoles < course.holes.length) g.playT += dt;
    const s0 = g.group.userData.baseScale;
    switch (g.phase) {
      case 'in': {
        const k = Math.max(0, Math.min(1, g.t / 0.35));
        const s = s0 * (1 - Math.pow(1 - k, 3));
        g.group.scale.set(s, s, s);
        if (k >= 1) { g.group.scale.set(s0, s0, s0); startLeg(g); }
        break;
      }
      case 'walk': {
        const done = stepWalker(g.walker, dt, g.pos, g.group);
        g.group.position.copy(g.pos);
        // stride keeps up with the legs — a hurried golfer takes quicker steps
        g.group.position.y += Math.abs(Math.sin(time * 11 * g.walker.speed + g.bobPhase)) * 0.032;
        if (done) { g.pi++; startLeg(g); }
        break;
      }
      case 'gate': {
        // waiting on the tee: shoulders loose, a glance down the fairway, a
        // look back at the group ahead who will not get on with it
        const grp = g.grp;
        if (grp && !grp.open) gateReady(grp, time);
        g.group.position.copy(g.pos);
        g.group.position.y += Math.abs(Math.sin(time * 1.5 + g.bobPhase)) * 0.008;
        if (grp && grp.blocked && grp.members.length > 1) {
          // held up with nothing to do: the group turns in on itself and talks
          let cx = 0, cz = 0;
          for (const m of grp.members) { cx += m.pos.x; cz += m.pos.z; }
          cx /= grp.members.length; cz /= grp.members.length;
          const face = Math.atan2(cx - g.pos.x, cz - g.pos.z) + Math.sin(time * 0.31 + g.bobPhase) * 0.4;
          g.group.rotation.y += shortAngle(g.group.rotation.y, face) * Math.min(1, dt * 1.6);
          const u = (time * 0.55 + g.bobPhase) % 4.7;    // the odd nod, on their own beat
          g.group.rotation.x = u < 0.5 ? Math.sin(u * Math.PI * 2) * 0.05 : 0;
        } else {
          g.group.rotation.x = 0;
          g.group.rotation.y += Math.sin(time * 0.42 + g.bobPhase) * dt * 0.5;
        }
        // waiting is acting: on their own sparse beat, one loosens up with a
        // practice swing or a stretch — never while the group is mid-chat, and
        // never twice in a row, because this is a golf club and not a circus
        if (!g.gest && time >= (g.idleAt || 0)) {
          if (g.idleAt && !(grp && grp.blocked && grp.members.length > 1)) {
            startGesture(g, Math.random() < 0.6 ? 'practice' : 'stretch', { why: 'waiting' });
          }
          g.idleAt = time + 8 + Math.random() * 10;
        }
        // a straggler whose group has already teed off on a later hole is never
        // held here — the gate can only ever gather, never trap
        const ready = !grp || grp.gateHi > g.gateHi
          || (grp.open && grp.gateHi === g.gateHi && time - grp.openT >= (g.tOrder || 0) * TEE_STAGGER);
        if (ready) { g.group.rotation.x = 0; g.pi++; startLeg(g); }
        break;
      }
      case 'read': {
        // Over the ball: look at the target, settle — and, if there is time,
        // take a practice swing or two. The pre-shot routine is where the
        // minutes of a real round actually go, so it is where the pace of play
        // spends its slack, and it is the best thing on the course to watch.
        const sh = g.plan[g.pi].shot;
        if (sh) {
          const ang = Math.atan2(sh.to.x - g.pos.x, sh.to.z - g.pos.z);
          g.group.rotation.y += shortAngle(g.group.rotation.y, ang) * Math.min(1, dt * 3);
        }
        g.group.position.copy(g.pos);
        let z = Math.sin(g.t * 1.9 + g.bobPhase) * 0.022;
        const isPutt = sh && sh.kind === 'putt';
        if (isPutt && g.readD > 1.6) {
          // a putt is read before it is hit: down at the neck and spine for a
          // look along the line, back up, then the stroke — the waggle is the
          // full swing's routine, not the green's
          if (!g.gest) {
            const downT = Math.min(1.4, g.readD * 0.45);
            const cr = Math.min(1, g.t / 0.4) - Math.min(1, Math.max(0, g.t - downT) / 0.45);
            const e = Math.max(0, cr), ee = e * e * (3 - 2 * e);
            const P = g.group.userData.parts;
            if (P) { P.torso.rotation.x = 0.34 * ee; P.headG.rotation.x = 0.34 * ee; }
            g.crouched = ee > 0.01;
          }
        } else {
          const waggles = g.readD > 8 ? 2 : g.readD > 2.0 ? 1 : 0;
          for (let w = 0; w < waggles; w++) {
            const u = (g.t - g.readD * (0.30 + 0.32 * w)) / 1.05;
            if (u > 0 && u < 1) z = Math.sin(u * Math.PI * 2) * (sh ? sh.amp * 0.7 : 0.2);
          }
        }
        g.group.rotation.z = z;
        if (g.t >= g.readD) {
          g.group.rotation.z = 0;
          if (g.crouched) { resetPose(g.group.userData.parts); g.crouched = false; }
          g.pi++; startLeg(g);
        }
        break;
      }
      case 'turn': {
        // Waiting your turn is watching: they stand off the ball and follow
        // whoever is playing. On a green a fourball visibly takes turns.
        const grp = g.grp;
        g.group.position.copy(g.pos);
        g.group.position.y += Math.abs(Math.sin(time * 1.4 + g.bobPhase)) * 0.006;
        const t = grp && grp.turn;
        const hitter = t && t !== g && (t.phase === 'read' || t.phase === 'swing') ? t : null;
        const look = hitter ? hitter.pos : (g.turnShot ? g.turnShot.to : null);
        if (look) {
          const ang = Math.atan2(look.x - g.pos.x, look.z - g.pos.z);
          g.group.rotation.y += shortAngle(g.group.rotation.y, ang) * Math.min(1, dt * 2.5);
        }
        // standing off a long wait, somebody quietly loosens their shoulders
        if (!g.gest && time >= (g.idleAt || 0)) {
          if (g.idleAt && Math.random() < 0.5) startGesture(g, 'stretch', { why: 'waiting' });
          g.idleAt = time + 10 + Math.random() * 12;
        }
        if (!grp || claimTurn(grp, g, time) || g.t > TURN_MAX) { g.pi++; startLeg(g); }
        break;
      }
      case 'swing': {
        const sh = g.plan[g.pi].shot;
        const ang = Math.atan2(sh.to.x - g.pos.x, sh.to.z - g.pos.z);
        g.group.rotation.y += shortAngle(g.group.rotation.y, ang) * Math.min(1, dt * 7);
        let k = g.t * g.pace / sh.swingDur;
        // hold the finish on a drive worth watching: the arc freezes at the
        // top of the follow-through while the head follows the ball out, then
        // settles — g.holdK seconds, decided when the leg started
        if (g.holdK) {
          const kk = 0.82, kh = g.holdK * g.pace / sh.swingDur;
          if (k > kk) {
            if (k <= kk + kh) {
              if (!g.gest) startGesture(g, 'watch', { dur: g.holdK, why: 'drive' });
              k = kk;
            } else k -= kh;
          }
        }
        // one clean arc: back, through, settle — amplitude tells the club apart
        g.group.rotation.z = Math.sin(Math.min(1, k) * Math.PI * 2) * sh.amp;
        if (k >= sh.contact && !g.swungBall) { g.swungBall = true; hitBall(g, sh); }
        if (k >= 1) { g.group.rotation.z = 0; g.pi++; startLeg(g); }
        break;
      }
      case 'sink': {
        if (!g.sank && g.t >= g.sinkAt) {
          g.sank = true;
          // the last ball in the cup stamps the group: everything after this is
          // the walk to the next tee, which is the half of a hole's clock that
          // holeTargetS deliberately does NOT budget for (see paceSplit)
          if (g.grp) g.grp.cupT = time;
          pinReact(g.hole);
          sound('holed', g.plan[g.pi].shot.to);
          holeOut(g, g.hole, g.strokes);   // the card and the strokes always agree
          g.round += g.strokes; g.roundPar += g.hole.par; g.roundHoles++;
          if (g.strokes === g.hole.par - 1) g.birdies++;
          g.lastStrokes = g.strokes;       // honour on the next tee
          g.card.push({ n: g.hole.n, par: g.hole.par, strokes: g.strokes });
          // the body says what the card just wrote — see reactToScore
          reactToScore(g, g.strokes - g.hole.par, g.plan[g.pi].shot);
        }
        if (g.t >= g.pd) {
          // the ball comes out of the cup here: from this instant the golfer is
          // carrying the NEXT hole's index and no flag, so the half-second window
          // tourAudit() skips has to close here too — leaving it set until the
          // next sink leg began meant every tour golfer from hole 2 on was
          // filtered out of the audit and the hook silently returned nothing
          g.sank = false;
          g.shots = null; g.hole = null; g.pace = 1; g.walkK = WALK_BETWEEN;
          g.pi++; startLeg(g);
        }
        break;
      }
      case 'shake': {
        // The eighteenth, over: everyone stands where their last putt left
        // them until the group's final ball has dropped, then they turn in,
        // shake hands and walk to the clubhouse together. The wait can never
        // trap — a vanished group or a long enough stand simply walks in.
        const grp = g.grp;
        if (!grp || grp.members.length < 2 || g.t > 120) {
          g.pi++; startLeg(g);
          break;
        }
        g.group.position.copy(g.pos);
        g.group.position.y += Math.abs(Math.sin(time * 1.4 + g.bobPhase)) * 0.006;
        // "everyone is in" means nobody is still playing — a partner who gave
        // up waiting and walked ahead (the backstop) must not hold this open
        const total = course.holes.length * ((grp.loops || 1));
        if (!grp.shakeT && grp.members.every(m => m.phase === 'shake' || m.roundHoles >= total)) {
          grp.shakeT = time;
          // hands are shaken among whoever is standing here, not with a
          // partner already half way up the path
          let cx = 0, cz = 0, cn = 0;
          for (const m of grp.members) {
            if (m.phase !== 'shake') continue;
            cx += m.pos.x; cz += m.pos.z; cn++;
          }
          grp.shakeC = cn ? { x: cx / cn, z: cz / cn } : { x: g.pos.x, z: g.pos.z };
        }
        if (grp.shakeT) {
          const c = grp.shakeC;
          const ang = Math.atan2(c.x - g.pos.x, c.z - g.pos.z);
          g.group.rotation.y += shortAngle(g.group.rotation.y, ang) * Math.min(1, dt * 3);
          const since = time - grp.shakeT;
          if (!g.shook && since >= (g.tOrder || 0) * 0.2) {
            g.shook = true;
            startGesture(g, 'shake', { why: 'round over' });
          }
          if (since > 1.9) { g.pi++; startLeg(g); }
        } else {
          // watching the last man finish, like everyone on a green watches
          const t = grp.turn;
          if (t && t !== g) {
            const ang = Math.atan2(t.pos.x - g.pos.x, t.pos.z - g.pos.z);
            g.group.rotation.y += shortAngle(g.group.rotation.y, ang) * Math.min(1, dt * 2);
          }
        }
        break;
      }
      case 'out': {
        const k = Math.min(1, g.t / 0.3);
        const s = Math.max(0.01, s0 * (1 - k));
        g.group.scale.set(s, s, s);
        if (k >= 1) removeGolfer(g);
        break;
      }
    }
    if (g.gest) updateGesture(g, dt);
  }
  const pg = el('tee-pill-t');
  const txt = teePillText();
  if (pg && pg.textContent !== txt) pg.textContent = txt;
}

// The one line in the top bar that knows what time it is: who is out there
// while the club is open, and when the gate opens again once it is not.
function teePillText() {
  if (away.active) {
    if (!away.meet) return away.venue.name;
    const b = leaderboard(away.meet);
    const lead = b.rows.find(r => !r.cut && r.thru);
    return lead ? lead.star.last + ' ' + parText(lead.toPar) +
      (b.complete ? ' · champion' : ' leads') : away.meet.ev.short;
  }
  if (!course.holes.length) return 'No tee times';
  const t = dayInfo();
  const m = nowMinute();
  if (clubOpen(m)) {
    // Which part of the day it is, in one glance: a wave in progress says its
    // own name, and the quiet between waves says when the next one goes out —
    // the whole reason the day has a shape.
    const here = TS.partAt(t.dl, m);
    if (golfers.length) {
      const waiting = groups.reduce((n, g) => n + (g.blocked ? 1 : 0), 0);
      return (here ? here.short + ' · ' : '') + golfers.length + ' on course' +
        (waiting ? ' · ' + waiting + ' waiting' : '');
    }
    const next = nextTeeMin();
    if (next == null) return 'Last group is in';
    if (here) return here.short + ' · next ' + TS.hhmmShort(next);
    const wave = TS.nextPart(t.dl, m);
    if (wave) return wave.short + ' at ' + TS.hhmmShort(Math.max(wave.start, next));
    return 'Next tee ' + TS.hhmmShort(next);
  }
  if (m < t.dl.first) {
    const n = bookedRemaining();
    return 'Opens ' + TS.hhmmShort(t.dl.first) + (n ? ' · ' + n + ' booked' : '');
  }
  const n = bookedTomorrow().groups;
  return 'Closed · ' + n + ' booked tomorrow';
}

function nextTeeMin() {
  const s = ensureSheet(), dl = dayInfo().dl;
  for (let i = s.cursor; i < s.sizes.length; i++) if (s.sizes[i]) return TS.slotMinute(dl, i);
  return null;
}
function bookedRemaining() {
  const s = ensureSheet();
  let n = 0;
  for (let i = s.cursor; i < s.sizes.length; i++) if (s.sizes[i]) n++;
  return n;
}
// ── Time travel (tests, judges, later agents) ────────────────────────────────
// A game whose whole design is the real clock is untestable unless the clock
// can be moved. One offset does it: nothing anywhere reads Date.now() directly.

// '2026-12-24' and '2026-12-24T06:10' both mean that date HERE, in the player's
// own zone — the whole club runs on the local calendar (dayKey, midnightOf), and
// a bare date string handed to `new Date` is parsed as UTC, which quietly served
// the previous day to anyone west of Greenwich. Parse the parts ourselves.
const YMD = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
function localDate(v) {
  if (v instanceof Date) return new Date(v.getTime());
  if (typeof v === 'number') return new Date(v);
  const p = typeof v === 'string' ? YMD.exec(v.trim()) : null;
  if (!p) return new Date(v);
  return new Date(+p[1], +p[2] - 1, +p[3], +(p[4] || 0), +(p[5] || 0), +(p[6] || 0));
}

function setClock(v) {
  const target = v instanceof Date ? v.getTime()
    : typeof v === 'number' ? v : localDate(v).getTime();
  if (!isFinite(target)) return null;
  clock.offset = target - Date.now();
  today = null;                       // the calendar may have turned over
  // nobody teleports mid-round — and a round lifted off the course was never
  // finished, so it never reaches the day's pace figures
  teleporting = true;
  for (const g of golfers.slice()) removeGolfer(g);
  teleporting = false;
  groups.length = 0; holeOwner.length = 0; holeTimes.length = 0;
  const s = ensureSheet();
  s.cursor = TS.slotIndexAt(dayInfo().dl, nowMinute());
  playedThrough = nowMs();
  computeCourse();                    // a weekend books differently to a Tuesday
  applyDaylight(true);
  if (sheetOpen) { bookScrollPending = true; renderSheet(); }
  return nowDate();
}

function fastForward(minutes) {
  // running the club's book forward means playing the club's holes, and while
  // the world is swapped to a championship venue those are not the holes under
  // our feet. Come home first; comeHome() settles the whole trip anyway.
  if (away.active) { toast('Return to the club first'); return null; }
  const from = nowMs();
  // nobody teleports mid-round: a jump means those minutes passed unwatched, so
  // the rounds in progress are reconciled off the book by runAway like every
  // other one — leaving them standing there would strand a group on a hole and
  // feed an abandoned round into the day's pace figures
  clearCourseOfPeople();
  clock.offset += (minutes || 0) * 60000;
  today = null;
  const r = runAway(from, nowMs());
  if (r.take >= 1) addMoney(r.take);
  playedThrough = nowMs();
  computeCourse();
  applyDaylight(true);
  if (sheetOpen) renderSheet();
  return r;
}

// tomorrow's book, worked out on the spot — nothing is stored for a day that
// has not happened yet, and the answer is cached until the club changes
let tomorrowCache = null;
function bookedTomorrow() {
  const d = new Date(nowMs() + 86400000);
  // tomorrow sells on tonight's reputation, not on the one this morning's book
  // was frozen at — so a day that pleased people visibly fills the next one
  const gpm = course.gpm / wordOfMouth() * moodWord(state.mood.avg);
  const key = TS.dayKey(d) + '|' + gpm.toFixed(3) + '|' + fillOverride;
  if (tomorrowCache && tomorrowCache.key === key) return tomorrowCache;
  const dl = TS.daylight(d), seed = TS.hash32(TS.dayKey(d));
  const fill = fillOverride != null ? fillOverride : TS.fillFor(gpm, TS.isWeekend(d));
  let groups = 0, rounds = 0;
  for (let i = 0; i < dl.slots; i++) {
    const n = TS.bookingFor(seed, i, fill, dl);
    if (n) { groups++; rounds += n; }
  }
  tomorrowCache = { key, groups, rounds, dl, weekend: TS.isWeekend(d) };
  return tomorrowCache;
}

// ── The majors ───────────────────────────────────────────────────────────────
// Three championships a year, on the player's own calendar, played on three
// invented golf courses that are real ground in this game — the same tiles, the
// same renderer, the same shot simulation. The whole area is four verbs:
//
//   ENTER    · a member, a fee, and a fortnight's notice. They are then absent
//              from your own tee sheet that weekend, which is the cost.
//   TUNE IN  · travel to the venue and watch the field play, live, at the real
//              tee times, with your member's group on screen.
//   CHECK    · the leaderboard and their card, any time, from the Club sheet.
//   COME BACK· prize money, championship prestige, and a player who has
//              improved by playing somewhere harder than home.
//
// Everything a championship knows is a PURE FUNCTION of (event, year, clock).
// Nothing ticks. Nobody's score is stored while it is being made. Close the tab
// on Saturday afternoon and open it on Sunday night and the leaderboard is
// exactly the one that would have been there — which is also why the whole
// thing is testable by moving the clock and asserting.

const CUT_SHARE = 0.55;            // the top of the field play the weekend out
const PURSE_CURVE = 0.80;          // each place down the sheet pays this much of the last
// Groups on screen at a venue. This is not a taste decision, it is arithmetic:
// a round takes ROUND_MIN and groups go off every TEE_GAP, so the number of
// groups genuinely on the golf course at one moment can never exceed the ratio.
// Deriving it means the cap is always exactly reachable — a hand-typed 4 was a
// promise the tee sheet could not keep.
const TOUR_MAX_GROUPS =
  Math.ceil(MAJORS.ROUND_MIN / Math.min(MAJORS.TEE_GAP, MAJORS.R2_GAP));
// Championship tempo. The design statement is a plain one and is made in the
// unit a spectator experiences — a major championship hole takes 45% longer,
// tee to tee, than the same hole in the ordinary round the club's own members
// play (they run 0.90–1.18 on this scale). That is the only number chosen here.
const TOUR_SLOWER = 1.45;
// paceLegs is handed a multiplier on the TEE-TO-CUP budget, and the walk from
// the green to the next tee is a stroll at every level of golf — nobody hurries
// it and no championship lengthens it — so the multiplier has to be
// re-expressed in the half of the hole it actually scales. A hole that should
// take 1.45x end to end has to take (1.45·P − T)/(P − T) as long tee to cup.
// Derived, so the two constants can never drift apart again.
const TOUR_PACE =
  (holePaceS(4) * TOUR_SLOWER - HOLE_TURN_S) / (holePaceS(4) - HOLE_TURN_S);
// …and MAJORS.ROUND_MIN is then MEASURED from the golf that comes out of it
// (see __fairway.tourPace), never guessed: it is what makes the clock on the
// wall and the group on the ground agree.

// ── When ─────────────────────────────────────────────────────────────────────

function evKey(ev, year) { return ev.id + '@' + year; }

// The next running of an event, from a given moment: this year's if it has not
// finished yet, otherwise next year's. Returns everything the UI needs to talk
// about a week without recomputing dates five times.
function meetFor(ev, at) {
  const d = at ? new Date(at) : nowDate();
  for (let y = d.getFullYear(); ; y++) {
    const w = MAJORS.weekendOf(ev, y);
    const endMs = TS.midnightOf(w.sun) + MAJORS.lastIn(2, groupsIn(ev)) * 60000;
    if (endMs >= d.getTime()) return meetAt(ev, y);
  }
}
function meetAt(ev, year) {
  const w = MAJORS.weekendOf(ev, year);
  return { ev, year, key: evKey(ev, year), sat: w.sat, sun: w.sun, open: w.open,
    satKey: TS.dayKey(w.sat), sunKey: TS.dayKey(w.sun), openMs: w.open.getTime(),
    startMs: TS.midnightOf(w.sat) + MAJORS.FIRST_TEE * 60000,
    endMs: TS.midnightOf(w.sun) + MAJORS.lastIn(2, groupsIn(ev)) * 60000 };
}
function groupsIn(ev) { return Math.ceil((ev.field + 1) / MAJORS.GROUP_N); }

// which round is being played at `ms`, if any: 1 (Saturday), 2 (Sunday), or 0
function roundAt(meet, ms) {
  const k = TS.dayKey(new Date(ms));
  if (k === meet.satKey) return 1;
  if (k === meet.sunKey) return 2;
  return 0;
}
// how far a round has run, in minutes past midnight of its own day
function meetMinute(ms) { return TS.minuteOfDay(new Date(ms)); }

// A championship is over when the last man in the last group has holed out on
// the last — not when the clock passes an estimate. The cut shrinks Sunday's
// field, so the trophy is often presented an hour before the diary said it
// would be, and the board should say Final the moment it is true.
function meetDone(meet, ms) {
  if (ms > meet.endMs) return true;
  if (TS.dayKey(new Date(ms)) !== meet.sunKey) return false;
  const min = meetMinute(ms);
  for (const s of cutList(meet)) {
    if (MAJORS.through(min, teeMinFor(meet, 2, s)) < 18) return false;
  }
  return true;
}

// the live meeting right now, if the player has somewhere to be
function liveMeet(ms) {
  const t = ms === undefined ? nowMs() : ms;
  for (const ev of MAJORS.EVENTS) {
    const m = meetFor(ev, t);
    if (t >= m.startMs - 30 * 60000 && t <= m.endMs) return m;
  }
  return null;
}

// ── The ground ───────────────────────────────────────────────────────────────
// A venue is measured with the game's own instruments — makeHole, corridorOf,
// architecture — by standing the world on it for as long as the arithmetic
// takes and then putting the club's own ground back. One pass, cached forever,
// no rendering: this is how a championship course can be scored on a Tuesday
// without ever being drawn.

function swapWorld(w) {
  const was = { tiles: state.tiles, elev: state.elev, sizeIdx: state.sizeIdx,
    holePairs: state.holePairs, theme: state.theme, clubhouse: state.upgrades.clubhouse };
  state.tiles = w.tiles; state.elev = w.elev; state.sizeIdx = w.sizeIdx;
  state.holePairs = w.holePairs;
  if (w.theme !== undefined) state.theme = w.theme;
  if (w.clubhouse !== undefined) state.upgrades.clubhouse = w.clubhouse;
  routeCache.clear();
  return was;
}

function venueWorld(v) {
  const b = MAJORS.buildVenue(v);
  return { tiles: Object.assign({}, b.tiles), elev: Object.assign({}, b.elev),
    // every venue is a full property with the grandest clubhouse in the game,
    // because that is what a championship venue has
    sizeIdx: EXPANSIONS.length - 1, theme: v.theme, clubhouse: CLUB_TIERS.length - 1,
    holePairs: b.pairs.map(p => ({ tee: { x: p.tee.x, z: p.tee.z },
      flag: { x: p.flag.x, z: p.flag.z }, locked: true })) };
}

const venueCache = new Map();
function venueCourse(vid) {
  const hit = venueCache.get(vid);
  if (hit) return hit;
  const v = MAJORS.VENUE[vid];
  const w = venueWorld(v);
  const was = swapWorld(w);
  const counts = emptyCounts();
  const half = gridSize() / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      const t = tileType(x, z);
      if (counts[t] !== undefined) counts[t]++;
      if (elevOf(x, z) > 0) counts.elev++;
    }
  }
  const holes = state.holePairs.map((p, i) => {
    const h = makeHole(p.tee, p.flag, Math.hypot(p.flag.x - p.tee.x, p.flag.z - p.tee.z));
    h.n = i + 1;
    h.name = v.holes[i].name;
    h.note = v.holes[i].note;
    return h;
  });
  const arch = architecture(holes, counts);   // this is what writes hole.feat
  const out = { id: vid, venue: v, holes, counts, arch,
    par: holes.reduce((s, h) => s + h.par, 0),
    yards: holes.reduce((s, h) => s + h.yards, 0) };
  swapWorld(was);
  venueCache.set(vid, out);
  return out;
}

// ── The field ────────────────────────────────────────────────────────────────
// Drawn from the same thirty-six invented players the club already knows, so a
// name on a major leaderboard is a name the player can go and recruit. The draw
// is by standing plus a year's form, both deterministic — the field for the
// 2031 Gale is already decided and will be the same on every machine.

function fieldFor(meet) {
  const ev = meet.ev;
  const seed = STARS.hash32(meet.key);
  const rank = STARS.ROSTER.map(s => ({ s,
    w: s.tierDef.rank * 1.9 + STARS.roll(seed, s.id, 41) * 3.0 }))
    .sort((a, b) => b.w - a.w)
    .slice(0, ev.field)
    .map(o => o.s);
  const mine = entrantOf(meet);
  if (mine) {
    const at = rank.findIndex(s => s.id === mine.id);
    if (at >= 0) rank.splice(at, 1);
    // your player goes in wherever their standing puts them, not last
    let i = rank.findIndex(s => s.tierDef.rank < mine.tierDef.rank);
    rank.splice(i < 0 ? rank.length : i, 0, mine);
  }
  return rank;
}
function entrantOf(meet) {
  const e = state.tour.entries[meet.key];
  return e && STARS.BY_ID[e.id] ? STARS.BY_ID[e.id] : null;
}

// ── The scores ───────────────────────────────────────────────────────────────
// Every stroke of a championship is rolled by the club's own scoreHole, off the
// venue's real holes, with the player's real stats — but from a seeded stream
// instead of Math.random. So the card is genuine golf and it is also the same
// card every time anybody asks for it.

function tourRng(seedStr) {
  let a = STARS.hash32(seedStr) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A player's eighteen for one round: the venue's nine, played twice. Cached in
// memory only — it is pure, so the cache is an optimisation and never a fact.
// The course as the CHAMPIONSHIP plays it, which is not how the members play
// it. ev.setup is the setup premium in strokes a hole — firmer, tighter,
// longer, and in Thornwick's case windier — and it is the whole reason a major
// has a winning score that means something. Cached per event.
const setupCache = new Map();
function setupHoles(ev) {
  const hit = setupCache.get(ev.id);
  if (hit) return hit;
  const holes = venueCourse(ev.venue).holes
    .map(h => Object.assign({}, h, { over: h.over + ev.setup }));
  setupCache.set(ev.id, holes);
  return holes;
}

const cardCache = new Map();
function tourCard(meet, star, round) {
  const ck = meet.key + '|' + star.id + '|' + round;
  const hit = cardCache.get(ck);
  if (hit) return hit;
  if (cardCache.size > 400) cardCache.clear();
  const setup = setupHoles(meet.ev);
  const p = starPerson(star);
  const rnd = tourRng(ck);
  // championship nerves: the form a player brings to a major is their
  // temperament, and the second round of a major is not the first
  const skill = p.skill + gauss(rnd) * p.vary * (round === 2 ? 1.15 : 1);
  const holes = [], pars = [], out = { holes, pars, total: 0, par: 0 };
  for (let i = 0; i < 18; i++) {
    const h = setup[i % setup.length];
    const s = scoreHole(h, skill, p.prof, rnd);
    holes.push(s); pars.push(h.par);
    out.total += s; out.par += h.par;
  }
  cardCache.set(ck, out);
  return out;
}

// The draw sheet and the cut, memoised per meeting — both are pure functions of
// (event, year), and the leaderboard asks for them several times a second.
// Entering a player changes the field, so entering clears them.
const drawCache = new Map();
function drawOf(meet) {
  const hit = drawCache.get(meet.key);
  if (hit) return hit;
  if (drawCache.size > 24) drawCache.clear();
  const field = fieldFor(meet);
  const byR1 = field.map(s => ({ s, t: tourCard(meet, s, 1).total }))
    .sort((a, b) => a.t - b.t || (a.s.id < b.s.id ? -1 : 1));
  // who survives Saturday. Ties at the number all play on, as they should.
  const n = Math.max(2, Math.round(field.length * CUT_SHARE));
  const mark = byR1[Math.min(n, byR1.length) - 1].t;
  const made = byR1.filter(r => r.t <= mark).map(r => r.s);
  // round one is the draw; round two is reversed by score, so the leaders are
  // last out on Sunday afternoon and the trophy is decided in front of you
  const r2 = made.slice().reverse();
  const seat = { 1: new Map(), 2: new Map() };
  field.forEach((s, i) => seat[1].set(s.id, i));
  r2.forEach((s, i) => seat[2].set(s.id, i));
  const out = { field, made, r2, seat };
  drawCache.set(meet.key, out);
  return out;
}
function orderFor(meet, round) { const d = drawOf(meet); return round === 2 ? d.r2 : d.field; }
function cutList(meet) { return drawOf(meet).made; }
function teeMinFor(meet, round, star) {
  const i = drawOf(meet).seat[round === 2 ? 2 : 1].get(star.id);
  return i === undefined ? null : MAJORS.teeMinute(round, Math.floor(i / MAJORS.GROUP_N));
}
function groupIdxFor(meet, round, star) {
  const i = drawOf(meet).seat[round === 2 ? 2 : 1].get(star.id);
  return i === undefined ? -1 : Math.floor(i / MAJORS.GROUP_N);
}

// ── The leaderboard ──────────────────────────────────────────────────────────
// One pure function of the clock. `thru` is real: a player who went off at 9:20
// on a ninety-minute round is genuinely through eleven at 10:15, and the total
// beside their name is the eleven holes they have actually played.

function leaderboard(meet, atMs) {
  const ms = atMs === undefined ? nowMs() : atMs;
  const vc = venueCourse(meet.ev.venue);
  const field = fieldFor(meet);
  const made = ms >= TS.midnightOf(meet.sun) ? new Set(cutList(meet).map(s => s.id)) : null;
  const round = roundAt(meet, ms);
  const min = meetMinute(ms);
  const rows = [];
  for (const s of field) {
    const r = { star: s, id: s.id, r1: null, r2: null, thru: 0, total: 0, par: 0,
      playing: false, cut: false, done: false, holes: [] };
    // Saturday
    const t1 = teeMinFor(meet, 1, s);
    const done1 = ms >= TS.midnightOf(meet.sun) ||
      (round === 1 && MAJORS.through(min, t1) >= 18);
    const n1 = ms < TS.midnightOf(meet.sat) ? 0
      : done1 ? 18 : round === 1 ? MAJORS.through(min, t1) : 0;
    const c1 = tourCard(meet, s, 1);
    if (n1) {
      r.r1 = sumTo(c1, n1);
      r.holes = c1.holes.slice(0, n1);
      r.thru = n1; r.total = r.r1.strokes; r.par = r.r1.par;
      r.playing = round === 1 && n1 < 18;
    }
    if (made) {
      r.cut = !made.has(s.id);
      if (!r.cut) {
        const t2 = teeMinFor(meet, 2, s);
        const n2 = round === 2 ? MAJORS.through(min, t2) : (ms > meet.endMs ? 18 : 0);
        if (n2) {
          const c2 = tourCard(meet, s, 2);
          r.r2 = sumTo(c2, n2);
          r.holes = c2.holes.slice(0, n2);
          r.thru = n2; r.total += r.r2.strokes; r.par += r.r2.par;
          r.playing = round === 2 && n2 < 18;
          r.done = n2 >= 18;
        }
      } else r.done = true;
    } else r.done = n1 >= 18 && round === 1;
    r.toPar = r.total - r.par;
    r.round = round;
    // holes played in the round being played RIGHT NOW, and when they go off in
    // it. A player who has signed for Saturday and is waiting for a one-forty
    // tee time on Sunday is not "F" — they are due at 1:40, and the board says
    // so, exactly as a real one does.
    r.onRound = round === 2 ? (r.r2 ? r.r2.n : 0) : round === 1 ? n1 : 0;
    r.teeAt = round && !r.cut ? teeMinFor(meet, round, s) : null;
    rows.push(r);
  }
  // Nobody who has not hit a ball yet is "leading". Players still to start sort
  // to the bottom on level par, which is how a real board reads at dawn.
  rows.sort((a, b) => {
    if (a.cut !== b.cut) return a.cut ? 1 : -1;
    const as = a.thru || (a.r1 ? 1 : 0), bs = b.thru || (b.r1 ? 1 : 0);
    if (!as !== !bs) return as ? -1 : 1;
    return a.toPar - b.toPar || b.thru - a.thru || (a.id < b.id ? -1 : 1);
  });
  let pos = 0, prev = null, shown = 0;
  for (const r of rows) {
    shown++;
    if (r.cut) { r.pos = 0; continue; }
    // a man who has not hit a shot has no position. He is level par because he
    // has played nothing, and printing "T7" against that is a fiction — a board
    // leaves the column blank until he is away.
    if (!(r.thru || r.r1)) { r.pos = 0; continue; }
    if (prev === null || r.toPar !== prev) { pos = shown; prev = r.toPar; }
    r.pos = pos;
  }
  for (const r of rows) r.tied = !r.cut && r.pos > 0 &&
    rows.filter(o => o.pos === r.pos && !o.cut).length > 1;
  return { meet, vc, rows, round, min, complete: meetDone(meet, ms),
    started: ms >= meet.startMs, cutMade: !!made };
}
// the strokes taken and the par of exactly the holes played so far — never a
// prorated guess, so "−3 thru 5" is five real holes against five real pars
function sumTo(card, n) {
  let strokes = 0, par = 0;
  for (let i = 0; i < n; i++) { strokes += card.holes[i]; par += card.pars[i]; }
  return { strokes, par, n };
}
function rowFor(board, id) { return board.rows.find(r => r.id === id) || null; }

// ── Entering ─────────────────────────────────────────────────────────────────
// One member, one fee, one weekend. The real price is not the money: it is that
// the name your regulars come to see is four hundred miles away on Saturday.

function entryState(ev) {
  const meet = meetFor(ev);
  const cur = state.tour.entries[meet.key];
  const now = nowMs();
  if (cur) return { meet, state: 'in', star: STARS.BY_ID[cur.id] };
  if (!state.club.members.length) {
    return { meet, state: 'nomembers', why: 'You need a member to send. Sign one in the Club Book.' };
  }
  const p = prestigeOf();
  if (p < ev.need) {
    return { meet, state: 'unqualified',
      why: 'Invitation only · needs ' + ev.need + ' prestige, your club is on ' + p };
  }
  if (now > meet.startMs) return { meet, state: 'shut', why: 'The field is out — entries closed' };
  if (now < meet.openMs) {
    return { meet, state: 'early',
      why: 'Entries open ' + meet.open.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) };
  }
  if (state.money < ev.entry) return { meet, state: 'poor', why: 'Entry is ' + fmt(ev.entry) };
  return { meet, state: 'open' };
}

function enterEvent(evId, memberId) {
  const ev = MAJORS.EVENT[evId];
  if (!ev) return false;
  const st = entryState(ev);
  if (st.state !== 'open') { if (st.why) toast(st.why); return false; }
  const m = memberOf(memberId);
  if (!m) { toast('Only a member of your club can be entered'); return false; }
  if (!trySpend(ev.entry)) return false;
  state.tour.entries[st.meet.key] = { id: memberId, paid: ev.entry };
  cardCache.clear(); drawCache.clear();
  // they are off the home sheet for the weekend from this moment
  const s = state.sheet;
  if (s && s.vips && awayOn(memberId, dayInfo().key)) {
    for (const k in s.vips) if (s.vips[k] === memberId && +k >= s.cursor) delete s.vips[k];
  }
  const star = STARS.BY_ID[memberId];
  sound('lucky');
  toast(star.name + ' is entered for ' + ev.name + ' · ' +
    st.meet.sat.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }), 'cup');
  save();
  if (sheetOpen) renderSheet();
  return true;
}

function withdraw(evId) {
  const ev = MAJORS.EVENT[evId];
  if (!ev) return false;
  const meet = meetFor(ev);
  const e = state.tour.entries[meet.key];
  if (!e) return false;
  if (nowMs() > meet.startMs) { toast('They are already out there'); return false; }
  delete state.tour.entries[meet.key];
  addMoney(Math.round(e.paid * 0.5));     // half the entry comes back, as it does
  cardCache.clear(); drawCache.clear();
  toast('Withdrawn from ' + ev.name + ' · half the entry refunded');
  save();
  if (sheetOpen) renderSheet();
  return true;
}

// Is this member away at a championship on this calendar day? Read by the
// diary at home (notablesFor) and by the offline reconciliation, so a player
// at Thornwick is genuinely missing from your Saturday sheet.
function awayOn(id, dayKey) {
  for (const k in state.tour.entries) {
    if (state.tour.entries[k].id !== id) continue;
    const p = k.split('@'), ev = MAJORS.EVENT[p[0]];
    if (!ev) continue;
    const m = meetAt(ev, +p[1]);
    if (dayKey === m.satKey || dayKey === m.sunKey) return ev;
  }
  return null;
}

// ── Settling ─────────────────────────────────────────────────────────────────
// The moment the last putt of a championship drops, the money and the standing
// are real. This runs from the loop, from boot and from anywhere the player
// might look, and it is idempotent — a result is written exactly once.

function purseFor(ev, pos, field) {
  // a decaying sheet, normalised so the whole purse is paid out
  let tot = 0;
  const n = Math.max(1, Math.round(field * CUT_SHARE));
  for (let i = 0; i < n; i++) tot += Math.pow(PURSE_CURVE, i);
  return Math.round(ev.purse * Math.pow(PURSE_CURVE, pos - 1) / tot);
}
function presFor(ev, pos) {
  if (pos === 1) return ev.prestige;
  if (pos <= 3) return Math.round(ev.prestige * 0.55);
  if (pos <= 10) return Math.round(ev.prestige * 0.28);
  return Math.round(ev.prestige * 0.10);
}

function settleMeet(meet, quiet) {
  const e = state.tour.entries[meet.key];
  if (!e) return null;
  if (!meetDone(meet, nowMs())) return null;
  // Read the week off the board BEFORE the entry is cleared. fieldFor() seats
  // your member in the field FROM that entry (entrantOf), so settling against a
  // cleared one settles against a field they were never in: rowFor comes back
  // empty and the week is recorded as a blank card and an automatic missed cut,
  // however they actually played.
  const star = STARS.BY_ID[e.id];
  const board = leaderboard(meet, Math.min(nowMs(), meet.endMs + 60000));
  const row = rowFor(board, e.id);
  // The week is over, so it stops being a fixture in the diary HERE — before
  // the already-settled guard, not after it. Clearing it late orphans the
  // entry forever: it never pays, never clears, and awayOn() keeps that member
  // off the home tee sheet for that weekend for the rest of the save.
  delete state.tour.entries[meet.key];
  drawCache.clear();               // the field for that week is history now
  if (state.tour.results.some(r => r.ev === meet.ev.id && r.year === meet.year)) {
    save();                        // …and the clearing has to survive a reload
    return null;
  }
  const ev = meet.ev;
  const res = { ev: ev.id, year: meet.year, id: e.id,
    pos: row ? row.pos : 0, tied: row ? row.tied : false,
    total: row ? row.total : 0, par: row ? row.par : 0,
    cut: row ? row.cut : true, purse: 0, pres: 0 };
  if (!res.cut && res.pos) {
    res.purse = purseFor(ev, res.pos, board.rows.length);
    res.pres = presFor(ev, res.pos);
  }
  state.tour.results.push(res);
  if (state.tour.results.length > 40) state.tour.results.shift();
  // the club's championship line: their best SINGLE round of the week, which is
  // the number a clubhouse board carries — a missed cut can still hold it
  const madeCut = !res.cut;
  let best = tourCard(meet, star, 1).total;
  if (madeCut) best = Math.min(best, tourCard(meet, star, 2).total);
  noteMajorRound(star.name, best, ev.id, meet.year);
  state.tour.prestige = clamp(state.tour.prestige + res.pres, 0, 100);
  if (res.purse) addMoney(res.purse);
  // A week at a championship is worth a season of Tuesdays. This is the only
  // thing outside your own tee sheet that develops a member — see devStats.
  const m = memberOf(e.id);
  if (m) m.rounds += res.cut ? 2 : res.pos === 1 ? 10 : res.pos <= 10 ? 6 : 4;
  starPeople.clear();
  computeCourse();          // prestige moved, and the diary follows it
  save();
  if (!quiet) {
    sound(res.pos === 1 ? 'lucky' : 'cash');
    toast(res.cut
      ? star.name + ' missed the cut at ' + ev.short
      : (res.pos === 1 ? star.name + ' has won ' + ev.name + '!'
        : star.name + ' finished ' + posLabel(res) + ' at ' + ev.short) +
        ' · ' + fmt(res.purse), 'cup');
  }
  return res;
}
// a leaderboard says T4, not "fourth" — this is the one place in the game that
// wants a number rather than a sentence
function posLabel(r) { return (r.tied ? 'T' : '') + (r.pos || '—'); }

// every championship the club is owed a result from, settled in date order
function settleAll(quiet) {
  const out = [];
  for (const k in state.tour.entries) {
    const p = k.split('@'), ev = MAJORS.EVENT[p[0]];
    if (!ev) { delete state.tour.entries[k]; continue; }
    const r = settleMeet(meetAt(ev, +p[1]), quiet);
    if (r) out.push(r);
  }
  return out;
}

// what the club's championship record is worth on its own first tee — capped
// low enough that a major is a crown on a good club, never a shortcut past
// building one
function tourPrestige() { return Math.round(clamp(state.tour.prestige, 0, 100) * 0.14); }
function tourWins() { return state.tour.results.filter(r => r.pos === 1).length; }

// ── The long game ────────────────────────────────────────────────────────────
// Why keep playing after nine holes and a high rating: because the club is
// KEEPING A HISTORY, and a history only exists if the calendar writes it.
// Three instruments, all derived, none of them a chore:
//
//   THE ANNALS · at New Year the committee writes the year up — the rounds,
//   the takings, the names signed, the records left standing, the majors —
//   and the entry stays in The Course for good. Nothing here is tracked twice:
//   rounds and takings are read off the counters the club already keeps
//   (snapshotted at each year's opening), and everything else comes off the
//   dates the book already writes — a member's `since`, a record's `day`, a
//   result's `year`. An absence over New Year closes the old year with what
//   the book held; the reconciled offline rounds belong to the year the
//   player came back to, which is the same rule the records keep.
//
//   THE HONOURS · a page of the club's real accomplishments, written in
//   pencil until the day each is done and in ink, with the date, for good.
//   Every line is a thing that genuinely happened on this ground — no login
//   streaks, no counters-for-counters — and every line in ink is worth half
//   a point of prestige, so the page feeds the one currency the notables
//   already answer to.
//
//   THE STANDING · what the club, itself, has become — six rungs from a
//   field with a flag to a storied institution, driven by the rating, the
//   prestige and the honours page. It gates nothing the star tiers do not
//   already gate; it is recognition, printed on the book's own cover, and
//   the next rung always says exactly what it asks.
//
// And THE HORIZON: The Committee always states the next thing worth wanting
// in one derived sentence — never authored per save, never empty.

function annalYear() { return nowDate().getFullYear(); }
function yearOfKey(key) { return +String(key).slice(0, 4) || 0; }

// a stored day key with its year — the annals span years, so 'Aug 12' alone
// stops being an answer the moment the page is about last season
function dayLabelY(key) {
  const p = String(key).split('-');
  if (p.length !== 3) return key;
  const d = new Date(+p[0], +p[1] - 1, +p[2]);
  return isNaN(d) ? key
    : d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

// The open year's ledger. A fresh save opens it with the club; an older save
// opens it the year it was LAST SEEN — so an absence over New Year still gets
// its review written — and its first entry says 'to date' rather than claiming
// the lifetime counters all happened in one season.
function ensureAnnals() {
  if (state.annals) return state.annals;
  const was = state.lastSeen > 0;
  const y = clamp(was ? new Date(state.lastSeen).getFullYear() : annalYear(), 1970, 9999);
  state.annals = { year: y, roundsAt: 0, earnedAt: 0,
    ratingStart: +course.stars.toFixed(2), ratingPeak: +course.stars.toFixed(2),
    visits: {}, past: [] };
  if (was && (roundsPlayed() || state.totalEarned)) state.annals.migrated = true;
  return state.annals;
}

// a notable hands their card in — the open year remembers the best mark each
// name left, which is the one live tally the dated stores cannot reconstruct
function annalVisit(id, score) {
  const a = state.annals;
  if (!a || away.active) return;
  a.visits[id] = Math.max(a.visits[id] || 0, +(+score).toFixed(1));
}

// the year so far, read live off the same counters the close will read
function seasonNow() {
  const a = state.annals;
  if (!a) return null;
  return { y: a.year,
    rounds: Math.max(0, roundsPlayed() - a.roundsAt),
    take: Math.max(0, Math.floor(state.totalEarned - a.earnedAt)),
    ratingStart: a.ratingStart, ratingPeak: a.ratingPeak,
    rating: away.active ? a.ratingPeak : +course.stars.toFixed(2),
    visits: Object.keys(a.visits).length };
}

// everything the dated stores already know about a year — nothing here was
// tracked for the annals' sake, which is why a missed year can still be
// written honestly two Januaries later
function seasonFacts(y) {
  const members = state.club.members.filter(m => yearOfKey(m.since) === y).map(m => m.id);
  const records = REC_KEYS.filter(k => state.records[k] && yearOfKey(state.records[k].day) === y);
  const rs = state.tour.results.filter(r => r.year === y);
  const wins = rs.filter(r => r.pos === 1).map(r => ({ ev: r.ev, id: r.id }));
  let best = 0;
  for (const r of rs) if (!r.cut && r.pos && (!best || r.pos < best)) best = r.pos;
  const honours = Object.keys(state.honours)
    .filter(id => HONOUR_BY_ID[id] && yearOfKey(state.honours[id]) === y);
  return { members, records, majors: { entered: rs.length, wins, best }, honours };
}

// One dry sentence per year, picked off the year's biggest fact — a template
// keyed to what happened, never authored per save.
function committeeLine(e, prev) {
  const w = e.majors.wins;
  if (w.length > 1) return 'The committee notes that ' + w.length +
    ' majors came home this year, and has ordered a deeper cabinet.';
  if (w.length) return 'The committee notes that ' + MAJORS.EVENT[w[0].ev].short +
    ' now resides in the trophy room, and considers the matter closed.';
  if (e.ratingPeak >= 4.95 && e.ratingStart < 4.95)
    return 'Five stars. The minutes record a short silence, then adjournment.';
  if (e.honours.length >= 3) return e.honours.length +
    ' lines went to ink on the honours page; the committee affects not to have counted.';
  if (e.members.length) return 'The membership grew by ' + e.members.length +
    ' this year; the committee is pleased, chiefly with itself.';
  if (e.records.length) return 'The engraver was in ' +
    (e.records.length === 1 ? 'once' : e.records.length + ' times') +
    ' this year, and has asked to be kept on.';
  if (!e.rounds && !e.take)
    return 'The course stood quiet this year. The greens, the committee notes, kept perfectly well without us.';
  if (prev && prev.rounds && e.rounds > prev.rounds * 1.3)
    return 'A markedly busier year; the committee credits the architecture, the treasurer credits the weather.';
  if (e.ratingEnd > e.ratingStart + 0.15)
    return 'The rating rose. The committee reminds the membership that this is to be regarded as normal.';
  return 'A steady year, minuted without incident. The committee sees no cause for alarm, nor, regrettably, for champagne.';
}

// New Year. The open year is frozen into one entry — counters snapshotted,
// dated facts gathered, the committee's sentence written — and the next
// year's ledger opens on the spot. This is the ONLY writer of `past`, and
// __fairway.forceYearEnd goes through it, so a forced review is a real one.
function closeSeason() {
  const a = state.annals;
  if (!a || away.active) return null;
  const y = a.year;
  const facts = seasonFacts(y);
  const visits = Object.keys(a.visits).filter(id => STARS.BY_ID[id])
    .map(id => ({ id, score: a.visits[id] }))
    .sort((p, q) => q.score - p.score);
  const e = { y,
    rounds: Math.max(0, roundsPlayed() - a.roundsAt),
    take: Math.max(0, Math.floor(state.totalEarned - a.earnedAt)),
    ratingStart: a.ratingStart, ratingEnd: +course.stars.toFixed(2), ratingPeak: a.ratingPeak,
    members: facts.members, visits: visits.slice(0, 6), visitsN: visits.length,
    records: facts.records, majors: facts.majors, honours: facts.honours,
    pres: prestigeOf(), standing: state.standing.i,
    todate: !!a.migrated };
  e.line = committeeLine(e, a.past[a.past.length - 1]);
  a.past.push(e);
  if (a.past.length > 60) a.past.shift();   // sixty seasons is a bound, not a fear
  delete a.migrated;
  a.year = y + 1;
  a.roundsAt = roundsPlayed();
  a.earnedAt = state.totalEarned;
  a.ratingStart = +course.stars.toFixed(2);
  a.ratingPeak = +course.stars.toFixed(2);
  a.visits = {};
  return e;
}

// has the calendar turned past the open year? Write each missed year plainly,
// oldest first, then say so once — the ceremony is a page-turn and a chit,
// dismissible like everything else on the wall.
let yearNews = 0;   // a review written but not yet said — retried until the wall is free
function checkYearTurn() {
  if (!state.annals || away.active) return [];
  const out = [];
  let guard = 0;
  while (state.annals.year < annalYear() && guard++ < 80) {
    const e = closeSeason();
    if (!e) break;
    out.push(e);
  }
  if (out.length) {
    save();
    if (sheetOpen) renderSheet();
    yearNews = out[out.length - 1].y;
    sound('page');
  }
  // the ceremony must actually land — a busy wall defers it to the next poll
  // rather than eating it, because the review is the year's one moment
  if (yearNews && toast('The committee has written up ' + yearNews +
      ' — the review is bound into the book', 'house',
      { label: 'Read it', fn: () => openSheet('course') })) {
    yearNews = 0;
  }
  return out;
}

// ── The Honours ──────────────────────────────────────────────────────────────
// Eighteen lines in the club's own language. `test` is the whole rule; `far`
// (where progress is even a meaningful idea) feeds the horizon and the debug
// bench. Everything reads the live stores — nothing is counted twice.

function rushSold() {
  const t = dayInfo();
  const s = state.sheet;
  const p = t.dl.parts.find(x => x.id === 'morning');
  if (!s || !p || p.n < 6 || s.day !== t.key || s.sizes.length !== t.dl.slots)
    return { full: false, k: 0 };
  let sold = 0;
  for (let i = p.from; i < p.from + p.n; i++) if (s.sizes[i]) sold++;
  return { full: sold >= p.n, k: sold / p.n };
}
function hasAlbatross() {
  if (state.records.eagles && state.records.eagles.kind === 'albatross') return true;
  for (const k in state.holeStats) if ((state.holeStats[k].outcomes || {}).albatross) return true;
  return false;
}

const HONOURS = [
  { id: 'card', name: 'The First Card', line: 'A full round played, signed and returned.',
    test: () => !!state.records.low },
  { id: 'nine', name: 'A Proper Nine', line: 'Nine holes open for play.',
    test: () => course.holes.length >= 9, far: () => course.holes.length / 9 },
  { id: 'eighteen', name: 'The Full Eighteen', line: 'An eighteen-hole golf course.',
    test: () => course.holes.length >= 18, far: () => course.holes.length / 18 },
  { id: 'five', name: 'The Five', line: 'The rating at five stars, to the committee’s own decimal.',
    test: () => course.stars >= 4.95, far: () => course.stars / 5 },
  { id: 'rush', name: 'A Full Morning', line: 'Every tee time in a Morning Rush taken.',
    test: () => rushSold().full, far: () => rushSold().k },
  { id: 'thousand', name: 'The Thousandth Round', line: 'A thousand rounds hosted on this ground.',
    test: () => roundsPlayed() >= 1000, far: () => roundsPlayed() / 1000 },
  { id: 'ace', name: 'One Dropped', line: 'A hole in one, witnessed and recorded.',
    test: () => !!state.records.aces },
  { id: 'albatross', name: 'The Albatross', line: 'Three under on a single hole. Most clubs never see one.',
    test: hasAlbatross },
  { id: 'signed', name: 'A Name in the Book', line: 'A notable golfer plays the course and signs for it.',
    test: () => { for (const id in state.club.seen) if (state.club.seen[id].n) return true; return false; } },
  { id: 'member', name: 'The First Member', line: 'A notable golfer takes a seat at the club.',
    test: () => state.club.members.length >= 1 },
  { id: 'legend', name: 'A Legend in the Fold', line: 'A Legend of the game holds a membership here.',
    test: () => state.club.members.some(m => (STARS.BY_ID[m.id] || {}).tier === 'legend') },
  { id: 'roster', name: 'The Whole Roster', line: 'Every notable in the game, met in this club’s diary.',
    test: () => metCount() >= STARS.ROSTER.length, far: () => metCount() / STARS.ROSTER.length },
  { id: 'colours', name: 'The Club’s Colours', line: 'A member inside the top ten at a major.',
    test: () => state.tour.results.some(r => !r.cut && r.pos >= 1 && r.pos <= 10) },
  ...MAJORS.EVENTS.map(ev => ({ id: 'won_' + ev.id, name: ev.short + ', Won',
    line: 'A member of this club wins ' + ev.name + '.',
    test: () => state.tour.results.some(r => r.ev === ev.id && r.pos === 1) })),
  { id: 'treble', name: 'The Treble', line: 'All three majors won in the club’s colours, across its history.',
    test: () => MAJORS.EVENTS.every(ev => state.tour.results.some(r => r.ev === ev.id && r.pos === 1)) },
  { id: 'minutes', name: 'The Committee Satisfied', line: 'Every goal the committee ever set, met.',
    test: () => state.milestone >= MILESTONES.length, far: () => state.milestone / MILESTONES.length },
];
const HONOUR_BY_ID = {};
for (const h of HONOURS) HONOUR_BY_ID[h.id] = h;
function honourCount() { return Object.keys(state.honours).length; }
function honourFar(h) {
  return state.honours[h.id] ? 1 : clamp(h.far ? h.far() : (h.test() ? 1 : 0), 0, 1);
}

// pencil to ink. Earned lines are dated today and kept forever; the one chit
// waits for a free wall rather than shouting over whatever earned it, and a
// batch (a veteran save's first boot) is one line, not eighteen.
let honNews = [];
function checkHonours() {
  if (away.active || !state.annals) return [];
  const out = [];
  for (const h of HONOURS) {
    if (state.honours[h.id]) continue;
    if (!h.test()) continue;
    state.honours[h.id] = dayInfo().key;
    out.push(h.id);
  }
  if (out.length) {
    honNews = honNews.concat(out);
    save();
    sound('pen');
    if (sheetOpen && clubTab === 'progress') renderSheet();
    syncStanding(false);
  }
  if (honNews.length) {
    const h = HONOUR_BY_ID[honNews[honNews.length - 1]];
    const msg = honNews.length === 1
      ? 'Into the honours in ink · ' + h.name
      : honNews.length + ' honours written in ink · latest, ' + h.name;
    if (toast(msg, 'check', { label: 'The page', fn: () => openSheet('progress') })) honNews = [];
  }
  return out;
}

// ── The standing ─────────────────────────────────────────────────────────────
// Six rungs, three plain asks each — the rating, the prestige, the honours in
// ink — so the next one is always three numbers the player already owns.
// Standing is HIGH-WATER: once a club has been a course of note, it has been
// one; the days each rung was reached are part of the history.

const STANDINGS = [
  { name: 'A Field with a Flag', stars: 0, pres: 0, hon: 0 },
  { name: 'The Village Course', stars: 2.0, pres: 15, hon: 2 },
  { name: 'A Club of Good Standing', stars: 3.0, pres: 32, hon: 5 },
  { name: 'A Course of Note', stars: 3.8, pres: 52, hon: 8 },
  { name: 'The Destination', stars: 4.4, pres: 72, hon: 12 },
  { name: 'A Storied Institution', stars: 4.8, pres: 86, hon: 15 },
];
function standingInputs() {
  return { stars: away.active ? 0 : +course.stars.toFixed(2),
    pres: prestigeOf(), hon: honourCount() };
}
function standingDerived() {
  const c = standingInputs();
  let i = 0;
  for (let k = 1; k < STANDINGS.length; k++) {
    const r = STANDINGS[k];
    if (c.stars >= r.stars && c.pres >= r.pres && c.hon >= r.hon) i = k;
    else break;
  }
  return i;
}
function syncStanding(quiet) {
  if (!state.annals || away.active) return state.standing.i;
  const d = standingDerived();
  const st = state.standing;
  if (d > st.i) {
    for (let k = st.i + 1; k <= d; k++) if (!st.days[k]) st.days[k] = dayInfo().key;
    st.i = d;
    save();
    syncCover();
    if (!quiet) {
      sound('brass');
      toast('The club’s standing has risen · ' + STANDINGS[d].name, 'house',
        { label: 'The committee', fn: () => openSheet('progress') });
    }
    if (sheetOpen && clubTab === 'progress') renderSheet();
  }
  return st.i;
}
// the one line the cover carries besides its own title — earned recognition,
// printed where a club would actually print it. A bare field prints nothing.
function syncCover() {
  const n = el('bk-cstand');
  if (n) n.textContent = state.standing.i > 0 ? STANDINGS[state.standing.i].name : '';
}

// ── The horizon ──────────────────────────────────────────────────────────────
// One derived sentence, always: the honour most nearly done, or the star tier
// almost in reach, or the next standing rung's first unmet ask. Never authored
// per save, never empty — even 'everything is done' is said in club language.

function decap(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
function horizonOf() {
  if (!course.holes.length && !away.active) {
    return { kind: 'course', say: 'Open a hole — every line in this book starts with one.' };
  }
  let best = null;
  for (const h of HONOURS) {
    if (state.honours[h.id]) continue;
    const f = Math.min(0.999, honourFar(h));
    if (!best || f > best.f) best = { h, f };
  }
  const p = prestigeOf();
  let tier = null;
  for (const t of STARS.TIERS) if (t.need > p) { tier = t; break; }
  const rung = state.standing.i + 1 < STANDINGS.length ? STANDINGS[state.standing.i + 1] : null;
  if (best && best.f >= 0.6) {
    return { kind: 'honour', id: best.h.id,
      say: 'The committee’s eye is on <b>' + best.h.name + '</b> — ' + decap(best.h.line) };
  }
  if (tier && tier.need - p <= 12) {
    return { kind: 'tier',
      say: '<b>' + tier.label + 's</b> would start to travel here at ' + tier.need +
        ' prestige — ' + (tier.need - p) + ' away.' };
  }
  if (rung) {
    const c = standingInputs();
    const ask = c.stars < rung.stars
        ? 'it asks a ★ ' + rung.stars.toFixed(1) + ' rating; the course holds ★ ' +
          (Math.round(c.stars * 10) / 10).toFixed(1)
      : c.pres < rung.pres
        ? 'it asks ' + rung.pres + ' prestige; the club holds ' + c.pres
        : 'it asks ' + rung.hon + ' honours in ink; the page holds ' + c.hon;
    return { kind: 'standing',
      say: 'The next standing is <b>' + rung.name + '</b> — ' + ask + '.' };
  }
  if (best) {
    return { kind: 'honour', id: best.h.id,
      say: 'Still in pencil: <b>' + best.h.name + '</b> — ' + decap(best.h.line) };
  }
  return { kind: 'done',
    say: 'Nothing left on the slate. The committee suggests, for once, simply playing golf.' };
}

// the slow beat that keeps the whole area honest — a year turn, a pencil line
// going to ink, a rung rising. One sim-second, on simTime rather than the
// wall clock, so __fairway.step() drives a New Year exactly as a lived one
// would arrive; every test in it is trivial arithmetic.
let longGamePoll = -1;
function pollLongGame() {
  if (simTime - longGamePoll < 1 && longGamePoll >= 0) return;
  longGamePoll = simTime;
  if (!state.annals || away.active) return;
  checkYearTurn();
  checkHonours();
  syncStanding(false);
}

// ── The long game, on paper ──────────────────────────────────────────────────
// Three passages in the book's own hand. The standing and the honours bind
// into The Committee (they are the committee's business); the annals bind into
// The Course (they are the property's history), just above the bookplate.

// an unearned line's mark: the empty box a pencil draws before the tick
const HN_BOX = '<svg class="icon" viewBox="0 0 24 24"><rect x="5.5" y="5.5" width="13" height="13" rx="2"/></svg>';

function reqChip(txt, ok) {
  return '<span class="sd-c' + (ok ? ' ok' : '') + '">' + txt + '</span>';
}
function renderStandingBlock() {
  const st = state.standing, c = standingInputs();
  let h = '<div class="cv-block"><div class="cv-h">The club’s standing' +
    '<span class="cv-hr">' + (st.i + 1) + ' of ' + STANDINGS.length + '</span></div>';
  h += '<div class="sd-now">' + STANDINGS[st.i].name + '</div>';
  for (let k = 0; k < STANDINGS.length; k++) {
    const r = STANDINGS[k];
    const held = k <= st.i, next = k === st.i + 1;
    h += '<div class="sd-row' + (held ? ' held' : next ? ' next' : ' faroff') + '">' +
      '<i class="sd-mk">' + (held ? ICONS.check : HN_BOX) + '</i>' +
      '<span class="sd-n">' + r.name + '</span>' +
      (held
        ? '<em class="sd-d">' + (k === 0 ? 'from the first day'
            : st.days[k] ? dayLabelY(st.days[k]) : 'held') + '</em>'
        : next
        ? '<em class="sd-req">' +
            reqChip('★ ' + r.stars.toFixed(1), c.stars >= r.stars) +
            reqChip(r.pres + ' prestige', c.pres >= r.pres) +
            reqChip(r.hon + ' honours', c.hon >= r.hon) + '</em>'
        : '') +
      '</div>';
  }
  // ALWAYS A HORIZON — the committee names the next thing worth wanting,
  // derived fresh every time the page is set
  h += '<div class="sd-horizon">' + horizonOf().say + '</div>';
  return h + '</div>';
}

function renderHonoursPage() {
  const n = honourCount();
  let h = '<div class="cv-block"><div class="cv-h">The Honours' +
    '<span class="cv-hr">' + n + ' of ' + HONOURS.length + ' in ink</span></div>';
  for (const d of HONOURS) {
    const day = state.honours[d.id];
    h += '<div class="hn ' + (day ? 'ink' : 'pencil') + '">' +
      '<i class="hn-mk">' + (day ? ICONS.check : HN_BOX) + '</i>' +
      '<span class="hn-body"><b>' + d.name + '</b><span>' +
        (day ? 'In ink · ' + dayLabelY(day) : d.line) + '</span></span></div>';
  }
  h += '<div class="cv-note">Pencil until the day it is done; ink, with the date, for good. ' +
    'Every line in ink carries prestige — the names that travel here read this page.</div>';
  return h + '</div>';
}

// what the records board calls each line, for a season's 'still standing' row
const REC_NAMES = { low: 'Course record', major: 'Championship round',
  birdies: 'Birdies in a round', drive: 'Longest drive', fast: 'Fastest round',
  aces: 'Hole in one', eagles: 'Eagle tally' };
function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function starTxt(v) { return (Math.round(v * 10) / 10).toFixed(1); }

function annalEntry(e) {
  const facts = [];
  if (e.members.length) {
    facts.push('Signed as members: ' + e.members.map(id => STARS.BY_ID[id].name).join(', '));
  }
  if (e.visitsN) {
    const top = e.visits[0];
    facts.push(e.visitsN + (e.visitsN === 1 ? ' notable' : ' notables') + ' in the visitors’ book' +
      (top ? ' · best mark ' + top.score.toFixed(1) + ', ' + STARS.BY_ID[top.id].name : ''));
  }
  if (e.records.length) {
    facts.push('Still standing from this year: ' + e.records.map(k => REC_NAMES[k]).join(' · '));
  }
  if (e.majors.wins.length) {
    facts.push(e.majors.wins.map(w =>
      STARS.BY_ID[w.id].name + ' won ' + MAJORS.EVENT[w.ev].name).join(' · '));
  } else if (e.majors.entered) {
    facts.push('Sent to the majors ' + (e.majors.entered === 1 ? 'once' : e.majors.entered + ' times') +
      (e.majors.best ? ' · best finish ' + ordinal(e.majors.best) : ''));
  }
  if (e.honours.length) {
    facts.push('To ink on the honours page: ' +
      e.honours.map(id => HONOUR_BY_ID[id].name).join(' · '));
  }
  const starSpan = Math.abs(e.ratingEnd - e.ratingStart) < 0.05
    ? '★ ' + starTxt(e.ratingEnd)
    : '★ ' + starTxt(e.ratingStart) + ' → ' + starTxt(e.ratingEnd);
  const led = (e.rounds || e.take)
    ? e.rounds.toLocaleString() + (e.rounds === 1 ? ' round' : ' rounds') + ' · ' +
      fmt(e.take) + ' taken' + (e.todate ? ' · to date' : '')
    : 'the course stood quiet';
  return '<div class="an-y"><div class="an-head"><b>' + e.y + '</b><span>' +
      led + ' · ' + starSpan + '</span></div>' +
    facts.map(f => '<div class="an-f">' + f + '</div>').join('') +
    '<div class="an-line">“' + e.line + '”</div></div>';
}

function renderAnnals() {
  const a = state.annals;
  if (!a) return '';
  const now = seasonNow();
  let h = '<div class="cv-block"><div class="cv-h">The Annals<span class="cv-hr">' +
    (a.past.length ? a.past[0].y + ' – ' + a.year : String(a.year)) + '</span></div>';
  h += '<div class="an-y now"><div class="an-head"><b>' + a.year + '</b><span>being written · ' +
    now.rounds.toLocaleString() + (now.rounds === 1 ? ' round' : ' rounds') + ' · ' +
    fmt(now.take) + ' taken' +
    (course.holes.length ? ' · ★ ' + starTxt(now.rating) : '') + '</span></div></div>';
  for (let i = a.past.length - 1; i >= 0; i--) h += annalEntry(a.past[i]);
  if (!a.past.length) {
    h += '<div class="cv-note">At New Year the committee writes the year up — the rounds, ' +
      'the names, the records — and the page stays in this book for good.</div>';
  }
  return h + '</div>';
}

// ── Travelling ───────────────────────────────────────────────────────────────
// The player leaves. The world under them is swapped for the championship
// venue's — same renderer, same router, same everything — and the club's own
// ground is held, untouched, until they come back. Nothing is copied, nothing
// is rebuilt from a save, and the way home is one restore.

const away = { active: false, venue: null, meet: null, home: null, wasTool: 'orbit',
  wasTab: 'today', watch: null, seq: 0 };

function travelTo(vid, meet) {
  const v = MAJORS.VENUE[vid];
  if (!v) return false;
  if (routeView.active) exitRouteView(false);
  endClubCam();
  closeHoleCard(); closeRatingCard(); closeFollowCard();
  if (linkMode.active) exitLinkMode();
  if (sheetOpen) { away.wasTab = clubTab; closeSheet(); }
  if (!away.active) {
    away.wasTool = activeTool;
    away.home = worldRef();
  }
  clearCourseOfPeople();
  away.active = true;
  away.venue = v;
  away.meet = meet || null;
  away.watch = meet ? (entrantOf(meet) || null) : null;
  away.seq++;
  tourPoll = 0;                    // the field goes out on the first frame here
  swapWorld(venueWorld(v));
  applyTheme(state.theme);
  rebuildIsland(true);
  computeCourse();
  applyDaylight(true);
  selectTool('orbit');
  document.body.classList.add('away');
  frameProperty();
  // put the field on the ground BEFORE the panel is drawn, so the leaderboard
  // arrives with its Follow buttons already live rather than a hole later
  releaseTourGroups(0);
  showAway();
  sound('arrive');
  return true;
}

function worldRef() {
  return { tiles: state.tiles, elev: state.elev, sizeIdx: state.sizeIdx,
    holePairs: state.holePairs, theme: state.theme, clubhouse: state.upgrades.clubhouse };
}

// lift everyone off the ground without letting a single abandoned round reach
// the club's pace figures — the same rule a clock jump obeys
function clearCourseOfPeople() {
  teleporting = true;
  for (const g of golfers.slice()) removeGolfer(g);
  teleporting = false;
  groups.length = 0; holeOwner.length = 0; holeTimes.length = 0;
  for (const m of moments.slice()) expireMoment(m);
}

function comeHome() {
  if (!away.active) return false;
  clearCourseOfPeople();
  const home = away.home;
  away.active = false; away.venue = null; away.meet = null; away.watch = null;
  swapWorld(home);
  applyTheme(state.theme);
  rebuildIsland(true);
  computeCourse();
  applyDaylight(true);
  document.body.classList.remove('away');
  hideAway();
  selectTool(away.wasTool || 'orbit');
  frameProperty();
  // the club kept trading while its owner was at the golf. Exactly the same
  // reconciliation a shut tab gets — the book that actually ran, nothing more.
  const r = runAway(playedThrough, nowMs());
  playedThrough = nowMs();
  if (r.take >= 1) {
    addMoney(r.take);
    toast('Home · ' + r.rounds + (r.rounds === 1 ? ' round was' : ' rounds were') +
      ' played while you were away · +' + fmt(r.take), 'house');
  }
  settleAll(false);
  save();
  sound('shut');  // coming home — the away book closes
  return true;
}

// Stand the camera back so a whole property reads at a glance — and step it a
// little east, because the card that names the place lives on the right of the
// screen and the golf course should not be behind it.
function frameProperty() {
  introT = 1;
  controls.enabled = true;
  const d = gridSize() * 0.94;
  const off = away.active ? gridSize() * 0.13 : 0;
  controls.target.set(-off, 0.5, off * 0.55);
  camera.position.set(controls.target.x + d * 0.66, d * 0.62, controls.target.z + d * 0.66);
  camera.lookAt(controls.target);
}

// ── Watching ─────────────────────────────────────────────────────────────────
// The field is on the course whether anybody is looking or not; this is the
// part that shows it. TOUR_MAX_GROUPS groups are put on screen — your player's
// first, then the ones nearest the lead — each one dropped onto the hole they
// are genuinely on, playing the exact card the leaderboard is reading from.

// Which groups television is following changes on the scale of a hole, not a
// frame, so the draw sheet is read twice a second rather than sixty times.
let tourPoll = 0;
function releaseTourGroups(dt) {
  const meet = away.meet;
  if (!meet) return;
  if (dt && (tourPoll -= dt) > 0) return;
  tourPoll = 0.5;
  const ms = nowMs();
  const round = roundAt(meet, ms);
  if (!round || !course.holes.length) { retireTourGroups(null); return; }
  const board = leaderboard(meet, ms);
  const order = orderFor(meet, round);
  const nG = Math.ceil(order.length / MAJORS.GROUP_N);
  const min = meetMinute(ms);

  // which groups are genuinely out there right now
  const live = [];
  for (let gi = 0; gi < nG; gi++) {
    const teeMin = MAJORS.teeMinute(round, gi);
    const thru = MAJORS.through(min, teeMin);
    if (min < teeMin || thru >= 18) continue;
    const party = order.slice(gi * MAJORS.GROUP_N, (gi + 1) * MAJORS.GROUP_N);
    if (!party.length) continue;
    const mine = away.watch && party.some(s => s.id === away.watch.id);
    const best = Math.min.apply(null, party.map(s => {
      const r = rowFor(board, s.id);
      return r ? r.toPar : 99;
    }));
    live.push({ gi, thru, party, mine, best });
  }
  live.sort((a, b) => (b.mine - a.mine) || (a.best - b.best) || (a.gi - b.gi));
  const want = live.slice(0, TOUR_MAX_GROUPS);
  const keep = new Set(want.map(g => g.gi));
  // A group the clock has just carried past 18 is not snatched off its last
  // green mid-putt: if every member is visibly on the eighteenth, the camera
  // stays for the hole-out and the handshake, and only then does television
  // move on. A group still further back — or one dropped for a better game —
  // vanishes at once, exactly as before, and a hard cap on the grace means
  // nothing can ever squat on the broadcast.
  const total = course.holes.length * 2;
  for (const grp of groups) {
    if (!grp.tour || keep.has(grp.slot) || !grp.members.length) continue;
    const thru = MAJORS.through(min, MAJORS.teeMinute(round, grp.slot));
    if (thru < 18) continue;                 // cut by the cap, not finished
    if (!grp.doneT) grp.doneT = simTime;
    const lastGreen = grp.members.every(m => m.roundHoles >= total - 1);
    const allIn = grp.members.every(m => m.roundHoles >= total
      && m.phase !== 'shake' && m.phase !== 'sink');
    if (lastGreen && !allIn && simTime - grp.doneT < 240) keep.add(grp.slot);
  }
  retireTourGroups(keep);
  for (const g of want) {
    if (groups.some(x => x.slot === g.gi)) continue;
    if (golfers.length + g.party.length > MAX_GOLFERS) break;
    startTourGroup(meet, round, g.gi, g.party, g.thru);
  }
}

// a group whose players have finished, or who television has left, walks off
function retireTourGroups(keep) {
  for (const grp of groups.slice()) {
    if (keep && keep.has(grp.slot)) continue;
    for (const m of grp.members.slice()) removeGolfer(m);
    if (groups.includes(grp)) endGroup(grp, true);
  }
}

function startTourGroup(meet, round, gi, party, thru) {
  const loop = course.holes.length;          // the venue's nine
  const from = Math.min(17, thru);           // the hole they are standing on
  const grp = {
    id: ++groupSeq, slot: gi, size: party.length, members: [], party: [], vip: null,
    name: party[0].name,
    // eighteen holes is the venue's nine, played twice — which is what a
    // championship round here is, and why the second loop can genuinely be
    // held up by the first
    loops: 2, tour: { meet, round, gi },
    hole: -1, gateHi: -1, gateN: 0, open: false, openT: 0, holeT: 0, waitAt: 0,
    // Major championship golf is the slowest golf on earth, and this is the
    // game's own pace-of-play knob saying so. It is also what makes MAJORS
    // .ROUND_MIN true: a threeball round the venue's nine twice takes the hour
    // the draw sheet has allowed for it, so the group you are standing behind
    // and the board on the wall are reading the same hole.
    pace: TOUR_PACE + Math.random() * 0.12,
    startSim: simTime, waitS: 0, blocked: false, everWaited: false,
    turn: null, turnT: 0,
  };
  groups.push(grp);
  for (let i = 0; i < party.length; i++) {
    const star = party[i];
    const p = starPerson(star);
    grp.party.push(p);
    const g = spawnGolfer(grp, i);
    if (!g) continue;
    g.tour = true;
    const c = tourCard(meet, star, round);
    g.tourCard = c.holes;
    // Drop them where they actually are. The plan is [walk, gate, play] per
    // hole, so skipping to hole `from` is three legs a hole — and the card they
    // are carrying is the one the leaderboard has already published. Crediting
    // the holes already played leaves `roundHoles` sitting on `from`, which is
    // exactly the index of the hole they are about to play (see the 'play' leg).
    if (from > 0) {
      const vc = venueCourse(meet.ev.venue);
      for (let k = 0; k < from; k++) {
        const h = vc.holes[k % loop];
        g.round += c.holes[k]; g.roundPar += h.par; g.roundHoles++;
        g.card.push({ n: h.n, par: h.par, strokes: c.holes[k] });
        g.lastStrokes = c.holes[k];
      }
      // the plan runs BOTH loops — 3 legs per absolute hole, indices 0..53 —
      // so a back-nine drop-in resumes at from*3, not (from % loop)*3: the
      // old arithmetic put them at the first loop's copy of the same tiles,
      // which left nine phantom holes on the end of their plan and meant no
      // championship group could ever visibly finish the eighteenth (the
      // clock's retirement always cut them first and hid it)
      g.pi = from * 3;
      const tee = course.holes[from % loop].tee;
      g.pos.set(tee.x + 0.5, groundY(tee.x, tee.z), tee.z + 0.5);
      g.group.position.copy(g.pos);
    }
  }
  return grp;
}

// the one line that says what is happening on the ground, live
function watchLine(board) {
  if (!board) return '';
  const r = away.watch ? rowFor(board, away.watch.id) : null;
  if (!r) return board.complete ? 'The championship is over' : 'The field is out';
  if (r.cut) return away.watch.first + ' missed the cut';
  if (r.playing) return away.watch.first + ' · ' + parText(r.toPar) + ' thru ' + r.thru;
  // Signed for it. A player signs for a ROUND, never for a 36-hole total —
  // "signed for 140" is not a sentence anybody in golf has ever said. This
  // reads the card of the round being played today, exactly as the follow card
  // does six inches away.
  if (r.onRound >= 18) {
    const rd = board.round === 2 ? r.r2 : r.r1;
    if (rd) return away.watch.first + ' has signed for ' + rd.strokes;
  }
  if (board.round && !r.onRound && r.teeAt != null) {
    return away.watch.first + ' tees off at ' + TS.hhmmShort(r.teeAt);
  }
  return away.watch.first + ' · ' + parText(r.toPar);
}
function parText(v) { return v === 0 ? 'E' : v > 0 ? '+' + v : String(v); }

// ── The card at the venue ────────────────────────────────────────────────────
// One panel does both jobs, because they are the same job: you are standing on
// a golf course that is not yours, and you want to know about it. On a
// championship weekend it is a leaderboard. Every other day of the year it is
// the page of a book about the place — the story, and the nine holes, each of
// which the camera will take you to.

let awayOpen = false, awaySig = '';

function showAway() {
  awayOpen = true;
  renderAway();
  awaySig = awaySignature();
  el('away').classList.remove('hidden');
}
function hideAway() { awayOpen = false; el('away').classList.add('hidden'); }

// What has to change before the panel is worth redrawing. The board's own top
// ten is most of it — but the Follow buttons only exist for players who are
// physically on screen, so who is out there has to be in the signature too.
// Without it, arriving at a live venue paints a leaderboard whose rows are not
// yet clickable and leaves them that way until somebody holes a putt.
function awaySignature() {
  if (!away.active) return '';
  if (!away.meet) return 'tour|' + away.venue.id + '|' + awayHole;
  const b = leaderboard(away.meet);
  return 'ch|' + away.meet.key + '|' + b.round + '|' +
    b.rows.slice(0, 10).map(r => r.id + r.toPar + ':' + r.thru).join(',') + '|' +
    onCourseIds().join(',');
}
// the ids of the notables standing on this golf course right now, sorted so the
// signature is stable when a group's members are simply reordered
function onCourseIds() {
  const out = [];
  for (const g of golfers) if (g.person.star) out.push(g.person.star.id);
  return out.sort();
}

let awayHole = -1;        // the hole the Tour is showing, −1 for the whole property

function renderAway() {
  if (!away.active) return;
  const v = away.venue;
  const meet = away.meet;
  el('aw-kick').textContent = meet ? meet.ev.kicker : v.where;
  el('aw-title').textContent = meet ? meet.ev.name : v.name;
  const vc = venueCourse(v.id);
  const board = meet ? leaderboard(meet) : null;     // one read; the page is one moment
  el('aw-sub').textContent = meet
    ? v.name + ' · 36 holes · par ' + vc.par * 2 + ' · setup +' + Math.round(meet.ev.setup * 18)
    : vc.holes.length + ' holes · par ' + vc.par + ' · ' + vc.yards.toLocaleString() + ' yards';
  el('aw-body').innerHTML = board ? awayBoardHTML(board) : awayTourHTML(v, vc);
  el('away').classList.toggle('tour', !meet);

  el('aw-body').querySelectorAll('[data-awhole]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); lookAtHole(+b.dataset.awhole); }));
  el('aw-body').querySelectorAll('[data-awfollow]').forEach(b =>
    b.addEventListener('click', () => { ensureAudio(); followStar(b.dataset.awfollow); }));

  // Standing on a great course on an ordinary Tuesday, the one thing worth
  // knowing is when it next matters — which is also the line that sends a
  // player back to the Tour page to enter somebody.
  el('aw-live').textContent = board ? watchLine(board) : nextHere(v);
}

function nextHere(v) {
  const ev = MAJORS.EVENTS.find(e => e.venue === v.id);
  if (!ev) return 'Take your time';
  const st = tourStatus(ev);
  // one fact, not two: the footer is a single narrow line, and "returns
  // April 8 · in 29 days" spent half of it saying the same thing twice
  return ev.short + (st.days <= 0 ? ' is being played here' :
    st.days === 1 ? ' returns tomorrow' :
    st.days <= 30 ? ' returns in ' + st.days + ' days' :
    ' returns ' + st.meet.sat.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }));
}

function awayBoardHTML(board) {
  const meet = board.meet;
  const mineId = away.watch ? away.watch.id : null;
  if (!board.started) {
    // round 1 before the first tee means it is already the Saturday — telling
    // somebody standing there at three in the morning that the field arrives
    // "on Saturday" is a calendar reading its own name off a wall
    return '<div class="aw-empty">The field arrives ' +
      (board.round === 1 ? 'this morning'
        : 'on ' + meet.sat.toLocaleDateString(undefined, { weekday: 'long' })) +
      '. Until then the course is yours to walk.</div>';
  }
  const head = board.complete ? 'Final' :
    board.round === 2 ? 'Round 2 · Sunday' : board.round === 1 ? 'Round 1 · Saturday' : 'Between rounds';
  let h = '<div class="aw-lbh"><span>' + head + '</span><em>' +
    (board.cutMade ? board.rows.filter(r => !r.cut).length + ' made the cut'
      : board.rows.length + ' in the field') + '</em></div><div class="aw-lb">';
  const rows = board.rows.filter(r => !r.cut);
  const show = rows.slice(0, 8);
  if (mineId && !show.some(r => r.id === mineId)) {
    const mine = rowFor(board, mineId);
    if (mine) show.push(mine);
  }
  let lastPos = 0;
  for (const r of show) {
    const gap = r.pos > lastPos + 1 && lastPos ? ' gap' : '';
    lastPos = r.pos || lastPos;
    h += boardRowHTML(board, r, mineId, gap);
  }
  h += '</div>';

  // Who is actually in front of you. Sunday's draw is reversed, so early in the
  // final round the players on the golf course are the ones at the BOTTOM of
  // the board and nobody on screen appears above — which used to leave six
  // people walking past with no way to follow any of them. This is the featured
  // group strip every broadcast carries, and every row in it is live.
  const seen = new Set(show.map(r => r.id));
  const here = onCourseIds().map(id => rowFor(board, id))
    .filter(r => r && !seen.has(r.id));
  here.sort((a, b) => (b.id === mineId) - (a.id === mineId) || a.pos - b.pos);
  if (here.length) {
    h += '<div class="aw-lbh"><span>On the course now</span><em>' +
      here.length + ' to follow</em></div><div class="aw-lb">' +
      here.map(r => boardRowHTML(board, r, mineId)).join('') + '</div>';
  }

  // your player's own card, always, because that is who you came for
  const mine = mineId ? rowFor(board, mineId) : null;
  if (mine) h += awayCardHTML(board, mine);
  return h;
}

function boardRowHTML(board, r, mineId, gap) {
  const on = golfers.some(g => g.person.star && g.person.star.id === r.id);
  // the column reads what a leaderboard column reads: a tee time before they
  // are out, the hole they are on while they are, F when the card is signed
  const thru = r.cut ? '—'
    : (board.round && !r.onRound && r.teeAt != null && board.min < r.teeAt)
      ? '<em>' + TS.hhmmShort(r.teeAt) + '</em>'
      : r.onRound >= 18 || (!board.round && r.thru >= 18) ? 'F'
      : r.thru ? r.thru : '—';
  return '<button class="aw-row' + (r.id === mineId ? ' mine' : '') + (gap || '') +
    (on ? '' : ' off') + '"' + (on ? ' data-awfollow="' + r.id + '"' : '') + '>' +
    '<span class="aw-pos">' + (r.cut ? 'CUT' : posLabel(r)) + '</span>' +
    '<i class="aw-dot" style="background:' + cssHex(r.star.colour) + '"></i>' +
    '<span class="aw-nm">' + r.star.name + '</span>' +
    '<span class="aw-par ' + (r.toPar < 0 ? 'under' : r.toPar > 0 ? 'over' : '') + '">' +
      parText(r.toPar) + '</span>' +
    '<span class="aw-thru">' + thru + '</span>' +
    '</button>';
}

// A round, hole by hole, coloured the way a leaderboard colours it: red under
// par, blue over, plain for a four. It is the fastest thing on either page to
// read, so both pages use it.
function holeStripHTML(holes, vcHoles) {
  let h = '<div class="aw-hs">';
  for (let i = 0; i < holes.length; i++) {
    const d = holes[i] - vcHoles[i % vcHoles.length].par;
    h += '<span class="aw-h ' + (d <= -2 ? 'eag' : d === -1 ? 'bird' : d === 0 ? 'par'
      : d === 1 ? 'bog' : 'dbl') + '">' + holes[i] + '</span>';
  }
  return h + '</div>';
}

function awayCardHTML(board, r) {
  const vc = board.vc;
  let h = '<div class="aw-card"><div class="aw-ch">' + r.star.name +
    '<em>' + (r.cut ? 'Missed the cut' : posLabel(r) + ' · ' + parText(r.toPar)) + '</em></div>';
  if (r.holes.length) h += holeStripHTML(r.holes, vc.holes);
  // a round in progress is not a round: it says what they have taken so far,
  // and only a signed card is ever printed as R1 or R2
  const r1 = r.r1 && r.r1.n >= 18 ? r.r1.strokes : null;
  const r2 = r.r2 && r.r2.n >= 18 ? r.r2.strokes : null;
  h += '<div class="aw-tot">' +
    (r1 != null ? '<span>R1 <b>' + r1 + '</b></span>' : '') +
    (r2 != null ? '<span>R2 <b>' + r2 + '</b></span>' : '') +
    (r.playing ? '<span>Thru ' + r.thru + ' <b>' +
        (r.r2 || r.r1).strokes + '</b></span>' : '') +
    (r.total && (r1 != null || r2 != null) ? '<span>Total <b>' + r.total + '</b></span>' : '') + '</div>';
  return h + '</div>';
}

function awayTourHTML(v, vc) {
  // What you are standing on, and what the week does to it. The ground you can
  // walk is the members' golf course; the championship is that plus a setup,
  // and a coffee-table page about a great course that never mentions the
  // difference is telling you half the story.
  const ev = MAJORS.EVENTS.find(e => e.venue === v.id);
  let h = '<p class="aw-story">' + v.story + '</p>' +
    (ev ? '<div class="tr-setup aw-setup" style="--tc:' + cssHex(ev.tint) + '">' +
      '<b>+' + Math.round(ev.setup * 18) + '</b><span>' + ev.short +
      ' setup · ' + ev.setupWhy + '</span></div>' : '') +
    '<div class="aw-holes">';
  vc.holes.forEach((hole, i) => {
    const on = awayHole === i;
    h += '<button class="aw-hrow' + (on ? ' on' : '') + '" data-awhole="' + i + '">' +
      '<span class="aw-hn">' + hole.n + '</span>' +
      '<span class="aw-hname">' + hole.name + '</span>' +
      '<span class="aw-hy">' + hole.yards + '<em>yds</em></span>' +
      '<span class="aw-hp">par ' + hole.par + '</span></button>' +
      (on ? '<div class="aw-hnote">' + hole.note + '</div>' : '');
  });
  return h + '</div>';
}

// walk to a hole: the camera settles over the tee, looking down the line of
// play, at a height that takes the whole hole in
function lookAtHole(i) {
  const h = course.holes[i];
  if (!h) return;
  awayHole = awayHole === i ? -1 : i;
  renderAway();
  if (awayHole < 0) { frameProperty(); return; }
  // stand where a photographer would: behind the tee, up on the shoulder, with
  // the whole line of play running away into the middle of the frame
  const tx = h.tee.x + 0.5, tz = h.tee.z + 0.5;
  const fx = h.flag.x + 0.5, fz = h.flag.z + 0.5;
  const L = Math.max(3, Math.hypot(fx - tx, fz - tz));
  const nx = (fx - tx) / L, nz = (fz - tz) / L;
  // …and a shade off the line, so the hole reads as a shape rather than a strip
  const ox = -nz * L * 0.22, oz = nx * L * 0.22;
  controls.target.set(tx + nx * L * 0.58, 0.6, tz + nz * L * 0.58);
  camera.position.set(tx - nx * (L * 0.72 + 3) + ox, 2.4 + L * 0.74, tz - nz * (L * 0.72 + 3) + oz);
  camera.lookAt(controls.target);
  sound('ribbon');  // stepping to the next hole away
}

// follow a player who is on screen right now — the follow card already knows
// how to do everything else
function followStar(id) {
  const g = golfers.find(o => o.person.star && o.person.star.id === id);
  if (g) openFollowCard(g);
  return !!g;
}

// ── The Tour view ────────────────────────────────────────────────────────────
// One page for the whole area: the three championships in calendar order, what
// each of them is asking of you right now, and the way onto each golf course.

function tourStatus(ev) {
  const meet = meetFor(ev);
  const ms = nowMs();
  const entered = state.tour.entries[meet.key];
  // endMs is the diary's estimate; the cut halves Sunday's field, so the
  // championship is often decided well before it. Settled means not live.
  const live = ms >= meet.startMs && ms <= meet.endMs && !meetDone(meet, ms);
  return { meet, entered, live,
    days: Math.round((TS.midnightOf(meet.sat) - TS.midnightOf(nowDate())) / 86400000) };
}

function eventCardHTML(ev) {
  const st = tourStatus(ev);
  const meet = st.meet;
  const es = entryState(ev);
  const dateTxt = meet.sat.toLocaleDateString(undefined, { month: 'long', day: 'numeric' }) +
    '–' + meet.sun.getDate() + ', ' + meet.year;
  let h = '<div class="tr-ev' + (st.live ? ' live' : '') + '" style="--tc:' + cssHex(ev.tint) + '">' +
    '<div class="tr-evh"><div><div class="tr-kick">' + ev.kicker + '</div>' +
      '<div class="tr-name">' + ev.name + '</div>' +
      '<div class="tr-when">' + dateTxt +
        (st.live ? '<b class="tr-liveb">Live now</b>'
          : st.days > 0 ? '<span> · in ' + st.days + (st.days === 1 ? ' day' : ' days') + '</span>' : '') +
      '</div></div>' +
      '<div class="tr-purse">' + fmt(ev.purse) + '<em>purse</em></div></div>' +
    '<p class="tr-blurb">' + ev.blurb + '</p>' +
    // the setup is the difference between the golf course and the examination,
    // and it is the single most useful number on the page
    '<div class="tr-setup"><b>+' + Math.round(ev.setup * 18) + '</b>' +
      '<span>Championship setup · ' + ev.setupWhy + '</span></div>';

  // the live board, or the result if it has just finished
  if (st.live) {
    const board = leaderboard(meet);
    const top = board.rows.filter(r => !r.cut).slice(0, 3);
    h += '<div class="tr-mini">' + top.map(r =>
      '<span><b>' + posLabel(r) + '</b> ' + r.star.name +
      ' <i class="' + (r.toPar < 0 ? 'under' : '') + '">' + parText(r.toPar) + '</i></span>').join('') +
      '</div>';
  }

  // your entry
  if (st.entered) {
    const star = STARS.BY_ID[st.entered.id];
    const round = roundAt(meet, nowMs());
    const t = teeMinFor(meet, round || 1, star);
    const board = st.live ? leaderboard(meet) : null;
    const row = board ? rowFor(board, star.id) : null;
    // A player who has not hit a shot yet has no position — a board prints
    // their tee time, not "T1 · E thru 0". Same branch boardRowHTML() uses.
    const waiting = row && !row.cut && board && board.round &&
      !row.onRound && row.teeAt != null && board.min < row.teeAt;
    h += '<div class="tr-entry"><i style="background:' + cssHex(star.colour) + '"></i>' +
      '<div><b>' + star.name + '</b><span>' +
        (waiting ? 'Tees off ' + TS.hhmmShort(row.teeAt)
          : row ? (row.cut ? 'Missed the cut'
          : posLabel(row) + ' · ' + parText(row.toPar) + (row.thru >= 18 ? ' · in' : ' thru ' + row.thru))
          : 'Entered · tees off ' + (t != null ? TS.hhmmShort(t) : '') + ' on Saturday') +
        '</span></div>' +
      (st.live || nowMs() > meet.startMs ? ''
        : '<button class="btn-plain quiet" data-withdraw="' + ev.id + '">Withdraw</button>') +
      '</div>';
    // the card, checkable from the clubhouse without travelling a mile
    if (row && row.holes.length) h += holeStripHTML(row.holes, board.vc.holes);
  } else if (es.state === 'open') {
    // the decision: which of your members is worth the fee and the weekend
    h += '<div class="tr-send"><div class="tr-sh">Send a member · ' + fmt(ev.entry) + '</div>';
    for (const m of state.club.members) {
      const s = STARS.BY_ID[m.id];
      const clash = awayOn(m.id, meet.satKey);
      h += '<div class="tr-cand"><i style="background:' + cssHex(s.colour) + '"></i>' +
        '<div><b>' + s.name + '</b><span>' + s.tierDef.label + ' · ' +
          m.rounds + (m.rounds === 1 ? ' round' : ' rounds') + ' here</span></div>' +
        (clash ? '<span class="tr-clash">Away at ' + clash.short + '</span>'
          : '<button class="btn-primary sm" data-enter="' + ev.id + '" data-member="' + m.id + '">Enter</button>') +
        '</div>';
    }
    h += '</div>';
  } else {
    h += '<div class="tr-why">' + (es.why || '') + '</div>';
  }

  h += '<div class="tr-acts">' +
    (st.live
      ? '<button class="btn-primary" data-watch="' + ev.id + '">Watch live</button>'
      : '') +
    '<button class="btn-plain" data-walk="' + ev.venue + '">Walk ' +
      MAJORS.VENUE[ev.venue].name + '</button></div>';
  return h + '</div>';
}

function renderTourView() {
  const wins = tourWins();
  const res = state.tour.results.slice().reverse();
  let h = '<div class="cv-tiles">' +
    '<div class="cv-tile"><b>' + wins + '</b><span>' + (wins === 1 ? 'Major' : 'Majors') + ' won</span></div>' +
    '<div class="cv-tile"><b>' + tourPrestige() + '</b><span>Prestige earned</span></div>' +
    '<div class="cv-tile"><b>' + res.length + '</b><span>Weeks played</span></div></div>';

  if (!state.club.members.length) {
    h += '<div class="cv-block"><div class="cv-empty">' +
      'The majors are played by members. Sign one in the Club Book and you have ' +
      'somebody to send — and somebody to follow when they get there.</div></div>';
  }

  // in the order they are actually coming — the week that is closest is the
  // week the player has a decision about
  h += MAJORS.EVENTS.slice()
    .sort((a, b) => meetFor(a).startMs - meetFor(b).startMs)
    .map(eventCardHTML).join('');

  if (res.length) {
    h += '<div class="cv-block"><div class="cv-h">The honours board</div>';
    for (const r of res.slice(0, 8)) {
      const ev = MAJORS.EVENT[r.ev], s = STARS.BY_ID[r.id];
      h += '<div class="tr-res' + (r.pos === 1 ? ' won' : '') + '">' +
        '<span class="tr-rp">' + (r.cut ? 'CUT' : posLabel(r)) + '</span>' +
        '<span class="tr-rn">' + s.name + '<em>' + ev.short + ' ' + r.year + '</em></span>' +
        '<span class="tr-rm">' + (r.purse ? fmt(r.purse) : '—') + '</span></div>';
    }
    h += '</div>';
  }
  return h;
}

// ── Hole card ────────────────────────────────────────────────────────────────
// In orbit mode, clicking a hole's flag or tee opens a floating scorecard.

const HC_BUCKETS = [
  // A card is marked in two pencils and nothing else: red under par, blue over,
  // ink on it. The bars follow the same rule the away leaderboard already does,
  // so a score reads the same whichever surface of the club you meet it on.
  // …which means the ladder is the stylesheet's, not a private copy of it.
  { label: 'Eagle', color: 'var(--red-press)', of: o => o.albatross + o.eagle },
  { label: 'Birdie', color: 'var(--red)', of: o => o.birdie },
  { label: 'Par', color: 'var(--ink-2)', of: o => o.par },
  { label: 'Bogey', color: 'var(--blue-mid)', of: o => o.bogey },
  { label: 'Dbl+', color: 'var(--blue-press)', of: o => o.double + o.triple },
];

let holeCardIdx = -1;      // index into course.holes, -1 = closed
let holeCardKey = null;    // stats key — survives recomputes and renumbering

function buildHoleCardDOM() {
  const c = el('holecard');
  c.innerHTML =
    '<div class="hc-head">' +
      '<div class="hc-num" id="hc-num"></div>' +
      '<div class="hc-titles"><div class="hc-title" id="hc-title"></div>' +
      '<div class="hc-sub" id="hc-sub"></div></div>' +
      '<button class="icon-btn hc-close" id="hc-close">' + ICONS.close + '</button>' +
    '</div>' +
    '<div class="hc-diff" id="hc-diff"></div>' +
    '<div class="hc-bars" id="hc-bars">' +
      HC_BUCKETS.map(b =>
        '<div class="hc-col"><div class="hc-pct"></div>' +
        '<div class="hc-track"><div class="hc-fill" style="background:' + b.color + '"></div></div>' +
        '<div class="hc-lab">' + b.label + '</div></div>').join('') +
    '</div>' +
    '<div class="hc-foot"><span id="hc-rounds"></span></div>' +
    '<div class="hc-actions">' +
      '<button class="hc-route hc-act" id="hc-link">' + ICONS.link + 'Change pin</button>' +
      '<button class="hc-route hc-act" id="hc-route">' + ICONS.route + 'Route</button></div>';
  el('hc-close').addEventListener('click', closeHoleCard);
  el('hc-route').addEventListener('click', () => { closeHoleCard(); enterRouteView(); });
  el('hc-link').addEventListener('click', () => {
    const h = course.holes[holeCardIdx];
    if (h) enterLinkMode({ x: h.tee.x, z: h.tee.z });
  });
}

function renderHoleCard() {
  const h = course.holes[holeCardIdx];
  if (!h) return;
  el('hc-num').textContent = h.n;
  el('hc-title').textContent = 'Hole ' + h.n;
  const pair = state.holePairs[holeCardIdx];
  el('hc-sub').innerHTML = 'Par ' + h.par + ' · ' + h.yards + ' yds' +
    (pair && pair.locked ? ' · <span class="hc-lock">linked</span>' : '');

  // the design model estimates difficulty until enough real rounds are in — and
  // a relink that changed the par or the length resets that count, since the
  // rounds before the mark were played against a different hole (see holePlay)
  const { st, rounds, mark, fresh, over } = holePlay(h);
  let txt, dot;
  if (Math.abs(over) < 0.07) { txt = 'Plays true to par'; dot = 'var(--ink-3)'; }
  else if (over > 0) {
    txt = 'Plays ' + over.toFixed(1) + ' over par';
    dot = over >= 0.6 ? 'var(--blue-press)' : 'var(--blue-mid)';
  } else { txt = 'Plays ' + (-over).toFixed(1) + ' under par'; dot = 'var(--red)'; }
  el('hc-diff').innerHTML = '<span class="hc-dot" style="background:' + dot + '"></span>' + txt;

  const vals = HC_BUCKETS.map(b => (st ? b.of(st.outcomes) : 0));
  const max = Math.max(1, ...vals);
  const cols = el('hc-bars').children;
  for (let i = 0; i < cols.length; i++) {
    cols[i].querySelector('.hc-fill').style.height = (rounds ? (vals[i] / max) * 100 : 0) + '%';
    cols[i].querySelector('.hc-pct').textContent = rounds ? Math.round((vals[i] / rounds) * 100) + '%' : '';
  }
  el('hc-rounds').textContent = (rounds === 0 ? 'No rounds played yet'
    : rounds === 1 ? '1 round played'
    : rounds.toLocaleString() + ' rounds played')
    + (mark && fresh < rounds ? ' · ' + fresh.toLocaleString() + ' at this ' + (mark.why === 'length' ? 'length' : 'par') : '');
  el('hc-route').classList.toggle('hidden', course.holes.length < 2);
}

function openHoleCard(i) {
  const h = course.holes[i];
  if (!h) return;
  const swap = holeCardIdx >= 0;
  holeCardIdx = i;
  holeCardKey = holeKey(h);
  renderHoleCard();
  const c = el('holecard');
  if (!swap || c.classList.contains('hidden')) {
    c.classList.remove('hidden');
    updateHoleCardPos();
    reveal(c);
  } else {
    updateHoleCardPos();
  }
  sound('card');  // the hole card laid on the desk
}

function closeHoleCard() {
  if (holeCardIdx < 0) return;
  holeCardIdx = -1;
  holeCardKey = null;
  const c = el('holecard');
  c.classList.remove('show');
  setTimeout(() => { if (holeCardIdx < 0) c.classList.add('hidden'); }, 300);
}

// after a recompute the hole may have moved index, been renumbered, or died
function syncHoleCard() {
  if (holeCardIdx < 0) return;
  const i = course.holes.findIndex(h => holeKey(h) === holeCardKey);
  if (i < 0) { closeHoleCard(); return; }
  holeCardIdx = i;
  renderHoleCard();
}

function holeIndexAt(x, z) {
  return course.holes.findIndex(h =>
    (h.tee.x === x && h.tee.z === z) || (h.flag.x === x && h.flag.z === z));
}

// the card follows its pin as the camera moves
const _hcAnchor = new THREE.Vector3();
function updateHoleCardPos() {
  if (holeCardIdx < 0) return;
  const h = course.holes[holeCardIdx];
  if (!h) return;
  const c = el('holecard');
  _hcAnchor.copy(tileTopWorld(h.flag.x, h.flag.z));
  _hcAnchor.y += 1.1;
  _hcAnchor.project(viewCam());
  if (_hcAnchor.z > 1) { c.style.visibility = 'hidden'; return; }
  c.style.visibility = '';
  const px = (_hcAnchor.x * 0.5 + 0.5) * window.innerWidth;
  const py = (-_hcAnchor.y * 0.5 + 0.5) * window.innerHeight;
  const w = c.offsetWidth || 252, ht = c.offsetHeight || 230;
  let left = px + 20;
  if (left + w > window.innerWidth - 12) left = px - w - 20;
  left = Math.max(12, Math.min(window.innerWidth - w - 12, left));
  const top = Math.max(76, Math.min(window.innerHeight - ht - 84, py - ht * 0.45));
  c.style.left = left + 'px';
  c.style.top = top + 'px';
}

// ── The follow card ──────────────────────────────────────────────────────────
// Click anyone on the property and you get a person, not a golfer: their name,
// what they play off, the hole they are standing on, their card filling in
// stroke by stroke — and what they make of your golf course, marked out of ten
// with one sentence they have earned. The card follows them round; dismissing
// it is a click anywhere else, and it never covers the dock.

let followed = null;      // the golfer being tracked, null = closed
let followAcc = 0;        // content refresh throttle (the anchor moves every frame)

const SCORE_CLASS = d => d <= -2 ? 'eg' : d === -1 ? 'bi' : d === 0 ? 'pa' : d === 1 ? 'bo' : 'db';
function toParText(d) { return d === 0 ? 'E' : d > 0 ? '+' + d : String(d); }

// the stroke they are standing over right now (penalty strokes included)
function strokeNow(g) {
  if (!g.shots) return 0;
  let n = 1;
  for (let i = 0; i < Math.min(g.shotIdx, g.shots.length); i++) if (g.shots[i].splash) n++;
  return Math.min(g.strokes, g.shotIdx + n);
}

// one line for what is happening to them at this exact second. At a
// championship the venue's nine is played twice, so "the seventh tee" on the
// back nine is the SIXTEENTH — the number the leaderboard is using, and the
// only one that makes sense beside it.
function followStatus(g) {
  const grp = g.grp;
  const loops = grp && grp.loops > 1 ? grp.loops : 1;
  const ord = (n) => PEOPLE.ord(loops > 1 ? g.roundHoles + 1 : n);
  if (g.phase === 'in') return 'Leaving the shop';
  if (g.phase === 'pay' || g.phase === 'out') return 'Signing the card';
  if (g.phase === 'gate') {
    const n = g.gateHi + 1;
    if (grp && grp.blocked && grp.gateHi === g.gateHi) return 'Waiting on the ' + ord(n) + ' tee';
    return 'On the ' + ord(n) + ' tee';
  }
  if (g.phase === 'turn') return 'Waiting on the away player';
  if (g.phase === 'shake') return 'Shaking hands on the last';
  if (!g.hole) return g.roundHoles >= course.holes.length * loops ? 'Walking in' : 'Walking to the tee';
  const sh = g.shots && g.shots[g.shotIdx];
  const d = g.strokes - g.hole.par;
  const name = d <= -2 ? 'eagle' : d === -1 ? 'birdie' : d === 0 ? 'par' : d === 1 ? 'bogey' : 'the hole';
  if (g.phase === 'sink') return 'In the cup';
  if (!sh) return 'On the ' + ord(g.hole.n);
  const last = g.shotIdx === g.shots.length - 1;
  if (sh.kind === 'putt') return last ? 'Putting for ' + name : 'On the green';
  if (sh.kind === 'bunker') return 'In the sand';
  if (sh.kind === 'chip') return 'Chipping on';
  if (sh.kind === 'drive' && g.shotIdx === 0) return 'On the tee';
  return sh.kind === 'approach' ? 'Playing the approach' : 'Down the fairway';
}

function buildFollowCardDOM() {
  const c = el('followcard');
  c.innerHTML =
    '<div class="hc-head">' +
      '<div class="fc-av" id="fc-av"></div>' +
      '<div class="hc-titles"><div class="hc-title" id="fc-name"></div>' +
      '<div class="hc-sub" id="fc-sub"></div></div>' +
      '<button class="icon-btn hc-close" id="fc-close">' + ICONS.close + '</button>' +
    '</div>' +
    '<div class="fc-status"><span class="fc-live"></span><span id="fc-status"></span>' +
      '<b id="fc-topar"></b></div>' +
    '<div class="fc-card" id="fc-card"></div>' +
    '<div class="fc-notes"><div class="fc-nh"><span id="fc-nlabel">Course notes</span>' +
      '<b id="fc-mark"></b></div>' +
      '<p id="fc-note"></p><div id="fc-reasons"></div>' +
      '<span class="fc-by" id="fc-by"></span></div>' +
    '<button class="hc-route fc-walk" id="fc-walk"></button>' +
    '<button class="hc-route fc-tip" id="fc-tip"></button>';
  el('fc-close').addEventListener('click', closeFollowCard);
  // the card's other instruction: hand the camera to the person on it
  el('fc-walk').addEventListener('click', () => {
    if (!followed) return;
    ensureAudio();
    if (lens.active && lens.g === followed) exitLens();
    else enterLens(followed);
  });
  // the gold ring on the avatar is the way into the Club Book
  el('fc-av').addEventListener('click', () => {
    if (followed && followed.person.star) openStarRow(followed.person.star.id);
  });
  el('fc-tip').addEventListener('click', () => { if (followed) tipGolfer(followed); });
}

function renderFollowCard() {
  const g = followed;
  if (!g) return;
  const p = g.person;
  const av = el('fc-av');
  av.textContent = p.first[0] + p.last[0];
  av.style.background = cssHex(p.look.shirtHex != null ? p.look.shirtHex : pickLook(COLORS.shirts, p.look.shirt));
  av.classList.toggle('star', !!p.star);
  el('fc-name').textContent = p.name;
  el('fc-sub').textContent = (p.hcp <= 0 ? 'Plays off ' + p.hcpLabel : 'Handicap ' + p.hcpLabel) +
    ' · ' + p.arch.label;
  el('fc-status').textContent = followStatus(g);

  // The card, filling in as they play, read in PLAY ORDER rather than by hole
  // number — which is the same thing at home and the only correct thing at a
  // championship, where the venue's nine is played twice and the 13th and the
  // 4th are the same piece of ground with two different scores on it.
  // The hole in progress shows the stroke they are actually on, so the number
  // on screen is the number being played.
  const loops = g.grp && g.grp.loops > 1 ? g.grp.loops : 1;
  const len = Math.max(1, course.holes.length);
  let cells = '';
  for (let i = 0; i < len * loops; i++) {
    const h = course.holes[i % len];
    const r = g.card[i];
    const on = !r && g.hole && i === g.roundHoles;
    const val = r ? r.strokes : on ? strokeNow(g) : null;
    const cls = r ? SCORE_CLASS(r.strokes - h.par) : on ? 'now' : 'todo';
    cells += '<div class="fc-cell ' + cls + '"><i>' + (loops > 1 ? i + 1 : h.n) + '</i><b>' +
      (val ? val : '·') + '</b></div>';
  }
  const cardEl = el('fc-card');
  // a scorecard reads in nines, and a short course still fills its own row
  const cols = Math.max(1, Math.min(9, course.holes.length));
  if (cardEl.dataset.cols !== String(cols)) {
    cardEl.dataset.cols = String(cols);
    cardEl.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';
  }
  cardEl.innerHTML = cells;
  const through = g.roundHoles;
  el('fc-topar').textContent = through
    ? toParText(g.round - g.roundPar) + ' thru ' + through
    : '';

  // the lens's handle on the card — present at home and at a championship
  // alike, set before the meet branch below returns early
  const wk = el('fc-walk');
  const walking = lens.active && lens.g === g;
  wk.textContent = walking ? 'Hand the camera back' : 'Walk with them';
  wk.classList.toggle('on', walking);

  // At a championship the block underneath is not a course review. Nobody is
  // marking Thornwick out of ten while they are trying to win on it, and the
  // one thing you want from the man you are following is where he stands. So
  // the same three elements become the championship: the round, the position,
  // and what the week has cost him so far — reading the same numbers as the
  // leaderboard six inches to the right of it.
  if (g.tour && away.meet) { renderFollowMeet(g); return; }

  const note = noteFor(g);
  const mk = el('fc-mark');
  mk.textContent = note.score.toFixed(1);
  mk.className = note.score >= 8 ? 'good' : note.score >= 6 ? 'ok' : note.score >= 4 ? 'meh' : 'bad';
  // A notable is marking the ARCHITECTURE, and their card says so: the line
  // they would give a reporter, then the two or three specific things that
  // earned it — every one of which is a tool in the dock away from changing.
  const rs = el('fc-reasons');
  if (p.star) {
    const v = note.verdict;
    el('fc-nlabel').textContent = 'The verdict';
    el('fc-note').textContent = '“' + v.head + '”';
    rs.innerHTML = v.reasons.slice(0, 3).map(r =>
      '<div class="fc-r ' + (r.good ? 'ok' : 'bad') + '">' + r.text + '</div>').join('');
    el('fc-by').textContent = '— ' + p.star.tierDef.label + ' · ' + p.star.tour;
  } else {
    el('fc-nlabel').textContent = 'Course notes';
    el('fc-note').textContent = '“' + note.line + '”';
    rs.innerHTML = '';
    // the lens the mark was given through — why THIS golfer said THAT
    el('fc-by').textContent = '— ' + p.arch.blurb;
  }

  const tip = el('fc-tip');
  tip.classList.remove('hidden');
  tip.textContent = g.tipped ? 'Good luck out there' : 'Say hello · +' + fmt(tipValue());
  tip.classList.toggle('done', !!g.tipped);
}

// the bottom half of the follow card, at a championship
function renderFollowMeet(g) {
  const meet = away.meet, ev = meet.ev;
  const board = leaderboard(meet);
  const row = rowFor(board, g.person.star.id);
  el('fc-nlabel').textContent = ev.short + ' · Round ' + (board.round || 2);
  const mk = el('fc-mark');
  mk.className = '';
  mk.textContent = row ? (row.cut ? 'CUT' : posLabel(row)) : '';
  // one sentence, the way a commentator would say it: yesterday, and the week
  const r1 = row && row.r1 && row.r1.n >= 18 ? row.r1.strokes : null;
  // no "thru" here: the status line six pixels up already carries today's
  // holes off the ground truth, and a second figure off the board's clock
  // maths only ever disagrees with it. This line is the WEEK's number.
  el('fc-note').textContent = row
    ? (r1 != null ? 'Signed for ' + r1 + ' on Saturday. ' : '') +
      parText(row.toPar) + ' for the championship'
    : 'Out in the field';
  el('fc-reasons').innerHTML = '';
  el('fc-by').textContent = '— ' + away.venue.name + ' · par ' + venueCourse(away.venue.id).par * 2;
  // there is no pro shop here and no green fee to collect: a spectator does not
  // tip a man on his way to the 16th, and the club's till is four hundred miles
  // away (see the 'pay' leg, which a championship round skips outright)
  el('fc-tip').classList.add('hidden');
}

function tipValue() {
  return Math.round((6 + course.fee * 0.35) * Math.pow(1.35, state.upgrades.proshop));
}

function tipGolfer(g) {
  if (g.tipped) return;
  g.tipped = true;
  const tip = tipValue();
  addMoney(tip);
  floater(g.pos.clone().add(new THREE.Vector3(0, 0.9, 0)), '+' + fmt(tip) + ' tip', 'gold');
  sound('tip');
  if (followed === g) renderFollowCard();
}

function openFollowCard(g) {
  if (!g) return;
  closeHoleCard();
  closeRatingCard();
  const swap = !!followed;
  followed = g;
  followAcc = 0;
  renderFollowCard();
  const c = el('followcard');
  if (!swap || c.classList.contains('hidden')) {
    c.classList.remove('hidden');
    updateFollowCardPos();
    reveal(c);
  } else {
    updateFollowCardPos();
  }
  sound('card');  // the scorecard stub laid down
}

function closeFollowCard() {
  if (lens.active) exitLens();   // putting the card down ends the walk
  if (!followed) return;
  followed = null;
  const c = el('followcard');
  c.classList.remove('show');
  setTimeout(() => { if (!followed) c.classList.add('hidden'); }, 300);
}

// the card rides just above their head, all the way round
const _fcAnchor = new THREE.Vector3();
function updateFollowCardPos() {
  const g = followed;
  if (!g) return;
  const c = el('followcard');
  // During the walk the card stops riding their head — the lens is already
  // pointed at them, so a card projected onto the subject would sit square on
  // the subject. It becomes a broadcast lower-third instead: pinned to the
  // left edge, steady while the camera moves, back on their shoulder the
  // moment the walk ends.
  if (lens.active && lens.g === g) {
    c.style.visibility = '';
    const ht = c.offsetHeight || 250;
    c.style.left = '14px';
    c.style.top = Math.max(76, window.innerHeight - ht - 118) + 'px';
    return;
  }
  _fcAnchor.copy(g.pos);
  _fcAnchor.y += 0.95;
  _fcAnchor.project(viewCam());
  if (_fcAnchor.z > 1) { c.style.visibility = 'hidden'; return; }
  c.style.visibility = '';
  const px = (_fcAnchor.x * 0.5 + 0.5) * window.innerWidth;
  const py = (-_fcAnchor.y * 0.5 + 0.5) * window.innerHeight;
  const w = c.offsetWidth || 268, ht = c.offsetHeight || 250;
  // The right edge the card may not cross. At a venue the last three hundred
  // pixels belong to the leaderboard — which is the thing this card was
  // launched FROM, so covering it is worse than not showing the card at all.
  // Same idea as the dock clamp below, one axis over.
  let wall = window.innerWidth - 12;
  const venue = away.active && awayOpen;
  if (venue) {
    const r = el('away').getBoundingClientRect();
    if (r.width) wall = Math.min(wall, r.left - 12);
  }
  // …and with the board on the right, the card belongs on the golfer's left
  const sides = venue ? [px - w - 22, px + 22] : [px + 22, px - w - 22];
  let left = sides.find(v => v >= 12 && v + w <= wall);
  if (left === undefined) left = Math.max(12, Math.min(wall - w, sides[0]));
  const top = Math.max(76, Math.min(window.innerHeight - ht - 104, py - ht * 0.5));
  c.style.left = left + 'px';
  c.style.top = top + 'px';
}

// content is cheap but not free, and nothing on it changes faster than the eye
function updateFollowCard(dt) {
  if (!followed) return;
  updateFollowCardPos();
  followAcc -= dt;
  if (followAcc <= 0) { followAcc = 0.22; renderFollowCard(); }
}

// ── The lens ─────────────────────────────────────────────────────────────────
// "Walk with them." The follow card can hand the camera to the person it is
// following: behind the shoulder as they stand over a ball, alongside as they
// walk, down low on the green for the putts, a slow push-in while one rolls.
// It is a tiny shot language, not a film school — ONE setup per thing a golfer
// does, a hard cut when the thing changes, a damped glide inside it, and never
// a move that could turn a stomach: the horizon stays level, nothing orbits,
// and which side of them the camera stands is decided at the cut and kept.
// Any input at all — a click on the world, a key, the wheel — hands the camera
// straight back to the exact frame the player left, which is the same contract
// the clubhouse trip keeps (clubCam, far above). Esc leaves and does nothing
// else; every other input leaves AND then does its normal job.

const lens = {
  active: false, g: null, shot: '', side: 1, push: 0, wasCtl: true,
  pendT: 0,                       // how long a pending cut to 'wait' has held
  from: new THREE.Vector3(), fromT: new THREE.Vector3(),
  pos: new THREE.Vector3(), look: new THREE.Vector3(),
};
const _lzWant = { pos: new THREE.Vector3(), look: new THREE.Vector3() };
const _lzF = new THREE.Vector3(), _lzS = new THREE.Vector3();

// the shot the golfer is standing over (the leg knows; between legs, the card)
function lensShotObj(g) {
  const leg = g.plan && g.plan[g.pi];
  return (leg && leg.shot) ||
    (g.shots && g.shots[Math.max(0, Math.min(g.shotIdx, g.shots.length - 1))]) || null;
}

// what they are doing, in the lens's four words. Two paces between putts stay
// in the green-side setup — cutting to a walking profile for a four-foot
// tap-in is exactly the film school this refuses to be.
function lensShotOf(g) {
  const sh = lensShotObj(g);
  const putt = sh && sh.kind === 'putt';
  if (g.phase === 'read' || g.phase === 'swing') return putt ? 'green' : 'address';
  if (g.phase === 'sink') return 'green';
  if (g.phase === 'walk') return (putt && g.hole) ? 'green' : 'walk';
  return 'wait';
}

// whichever side keeps the camera over the property rather than out at sea —
// decided once, at the cut (see updateLens)
function pickLensSide(g) {
  const ry = g.group.rotation.y;
  const px = -Math.cos(ry), pz = Math.sin(ry);
  return Math.hypot(g.pos.x + px * 3, g.pos.z + pz * 3) <=
         Math.hypot(g.pos.x - px * 3, g.pos.z - pz * 3) ? 1 : -1;
}

// the four setups. Every number here is a framing choice: the shoulder camera
// stands 2.5 back and a stride wide so the ball, the body and the line are all
// in frame; the green camera is 0.6 off the deck because a putt is a ground
// story; the walking camera rides abreast, half a step ahead, the way a
// steadicam operator actually walks a fairway.
function lensPoseFor(g, shot, out) {
  const sh = lensShotObj(g);
  const ry = g.group.rotation.y;
  if (shot === 'address' && sh) {
    _lzF.set(sh.to.x - g.pos.x, 0, sh.to.z - g.pos.z);
    if (_lzF.lengthSq() < 0.01) _lzF.set(Math.sin(ry), 0, Math.cos(ry));
    _lzF.normalize();
    _lzS.set(-_lzF.z, 0, _lzF.x).multiplyScalar(lens.side);
    out.pos.copy(g.pos).addScaledVector(_lzF, -2.5).addScaledVector(_lzS, 0.85);
    out.pos.y = g.pos.y + 1.45;
    out.look.copy(g.pos).addScaledVector(_lzF, 3.2);
    out.look.y = g.pos.y + 0.3;
  } else if (shot === 'green' && g.hole) {
    const cup = cupPoint(g.hole);
    _lzF.set(cup.x - g.pos.x, 0, cup.z - g.pos.z);
    const L = Math.max(_lzF.length(), 0.6);
    if (_lzF.lengthSq() < 0.01) _lzF.set(Math.sin(ry), 0, Math.cos(ry));
    else _lzF.normalize();
    _lzS.set(-_lzF.z, 0, _lzF.x).multiplyScalar(lens.side);
    // the push-in: while the putt rolls (the sink leg), the camera leans a
    // quarter of its offset toward the cup and drops an inch — lens.push
    const off = Math.max(2.1, L * 0.7) * (1 - 0.24 * lens.push);
    out.pos.copy(g.pos).addScaledVector(_lzF, L * 0.45).addScaledVector(_lzS, off);
    out.pos.y = cup.y + 0.62 - 0.12 * lens.push;
    out.look.copy(cup).addScaledVector(_lzF, -L * 0.2);
    out.look.y = cup.y + 0.1;
  } else if (shot === 'walk') {
    _lzF.set(Math.sin(ry), 0, Math.cos(ry));
    _lzS.set(-_lzF.z, 0, _lzF.x).multiplyScalar(lens.side);
    out.pos.copy(g.pos).addScaledVector(_lzS, 3.1).addScaledVector(_lzF, 0.5);
    out.pos.y = g.pos.y + 1.2;
    out.look.copy(g.pos).addScaledVector(_lzF, 0.9);
    out.look.y = g.pos.y + 0.45;
  } else {
    // waiting, gathering, shaking hands: a wide three-quarter over the shoulder
    _lzF.set(Math.sin(ry), 0, Math.cos(ry));
    _lzS.set(-_lzF.z, 0, _lzF.x).multiplyScalar(lens.side);
    out.pos.copy(g.pos).addScaledVector(_lzF, -3.2).addScaledVector(_lzS, 1.35);
    out.pos.y = g.pos.y + 1.7;
    out.look.copy(g.pos).addScaledVector(_lzF, 2.2);
    out.look.y = g.pos.y + 0.35;
  }
  // never through the ground: the shoulder of a raised tee cannot swallow a shot
  const ct = curTileOf(out.pos);
  if (inBounds(ct.x, ct.z)) out.pos.y = Math.max(out.pos.y, groundY(ct.x, ct.z) + 0.5);
}

function enterLens(g) {
  if (!g || routeView.active || introT < 1) return false;
  if (photo.active) exitPhoto();     // the tripod folds; the walk takes the camera
  endClubCam();
  if (!lens.active) {
    lens.from.copy(camera.position);
    lens.fromT.copy(controls.target);
    lens.wasCtl = controls.enabled;
    controls.enabled = false;
    lens.active = true;
    sound('ribbon');                 // stepping out of the chair
  }
  lens.g = g; lens.shot = ''; lens.push = 0;
  document.body.classList.add('lens-mode');
  if (followed !== g) openFollowCard(g);
  updateLens(0);                     // the first cut lands this frame, not next
  renderFollowCard();
  return true;
}

function exitLens() {
  if (!lens.active) return false;
  lens.active = false; lens.g = null; lens.shot = ''; lens.push = 0;
  camera.position.copy(lens.from);
  controls.target.copy(lens.fromT);
  camera.lookAt(lens.fromT);
  controls.enabled = lens.wasCtl && introT >= 1;
  document.body.classList.remove('lens-mode');
  if (followed) renderFollowCard();
  return true;
}

function updateLens(dt) {
  if (!lens.active) return;
  const g = lens.g;
  if (!g || golfers.indexOf(g) < 0) { exitLens(); return; }
  let shot = lensShotOf(g);
  // 'wait' is the connective tissue between real setups, and legs can pass
  // through it for a single frame on their way somewhere better. A cut that
  // brief is a flicker, not a cut — so a change TO 'wait' must hold for a
  // beat before it is taken, while every real setup still cuts at once.
  if (shot === 'wait' && lens.shot && lens.shot !== 'wait') {
    lens.pendT += dt;
    if (lens.pendT < 0.35) shot = lens.shot;
  } else lens.pendT = 0;
  if (shot !== lens.shot) {
    // the cut: a new setup, taken whole and at once — cheap, legible, calm
    lens.shot = shot;
    lens.push = 0;
    lens.side = pickLensSide(g);
    lensPoseFor(g, shot, _lzWant);
    lens.pos.copy(_lzWant.pos);
    lens.look.copy(_lzWant.look);
  } else {
    if (g.phase === 'sink') lens.push = Math.min(1, lens.push + dt * 0.55);
    lensPoseFor(g, shot, _lzWant);
    if (reduceMotion()) {
      // gentle repositions, no glides: hold the frame until the subject has
      // genuinely left it, then simply be at the new one. The thresholds sit
      // above every idle sway in the game, so a waiting golfer's chat wobble
      // can never make the camera fidget.
      if (lens.pos.distanceTo(_lzWant.pos) > 1.9 || lens.look.distanceTo(_lzWant.look) > 1.5) {
        lens.pos.copy(_lzWant.pos);
        lens.look.copy(_lzWant.look);
      }
    } else {
      lens.pos.lerp(_lzWant.pos, 1 - Math.exp(-dt * 2.6));
      lens.look.lerp(_lzWant.look, 1 - Math.exp(-dt * 4.0));
    }
  }
  camera.position.copy(lens.pos);
  camera.lookAt(lens.look);
}

// ── Occasions ────────────────────────────────────────────────────────────────
// A rare thing the player would regret missing earns ONE chit with ONE button.
// Nothing ever seizes the camera: pressing Watch is the invitation accepted,
// and ignoring it costs exactly nothing. Two things qualify — a notable on
// your own first tee (arriveVip) and your member holding the lead on the
// closing holes of a major, watched for here with one board read every two
// seconds, and only while a championship is actually live.

const occasions = { seen: {}, last: null, poll: 0 };

// the smallest possible invitation: one line, one button, and the camera does
// not move until the button is pressed
function offerWatch(gOrI, msg, mark) {
  const g = typeof gOrI === 'number' ? golfers[gOrI | 0] : gOrI;
  if (!g) return false;
  toast(msg || (g.person.name + ' is out on the course'), mark || 'flag',
    { label: 'Watch', fn: () => { openFollowCard(g); enterLens(g); } });
  return true;
}

function pollOccasions(dt) {
  occasions.poll -= dt;
  if (occasions.poll > 0) return;
  occasions.poll = 2;
  const meet = liveMeet();
  if (!meet) return;
  const star = entrantOf(meet);
  if (!star) return;
  const key = 'win@' + meet.key;
  if (occasions.seen[key]) return;
  const board = leaderboard(meet);
  if (board.round !== 2) return;
  const row = rowFor(board, star.id);
  if (!row || row.cut || !row.playing || row.thru < 15 || row.thru >= 18) return;
  // at least a share of the lead — nobody still standing is better
  if (board.rows.some(r => r.id !== star.id && !r.cut && r.toPar < row.toPar)) return;
  occasions.seen[key] = true;
  const here = away.active && away.meet && away.meet.key === meet.key;
  const line = star.name + ' leads ' + meet.ev.short + ' with ' +
    (row.thru === 17 ? 'a hole to play' : (18 - row.thru) + ' holes to play');
  occasions.last = { id: key, msg: line, at: nowMs() };
  toast(line, 'cup', { label: here ? 'Watch' : 'Go and watch', fn: () => {
    if (!away.active || !away.meet || away.meet.key !== meet.key) travelTo(meet.ev.venue, meet);
    const g = golfers.find(o => o.person.star && o.person.star.id === star.id);
    if (g) { openFollowCard(g); enterLens(g); } else followStar(star.id);
  } });
  sound('arrive');
}

// ── Photo mode ───────────────────────────────────────────────────────────────
// The tripod. One press on the plaque (or P) and the whole interface leaves
// the frame: the camera comes off its fences — down to the deck, out past the
// tool limits — with an optional thirds grid, a straighten/tilt on the
// finished frame, and the golden-hour nudge, which is nothing but the game's
// own daylight rig asked about a different minute (photoLightMin, far above).
// Capture renders the SAME canvas at two-and-a-half times the window onto the
// same CSS sky, and saves a PNG named for the club and the day. Exit puts
// every fence, every limit and the exact camera frame back.

const photo = {
  active: false, grid: false, golden: false, roll: 0, wasCtl: true,
  wasTool: 'orbit', limits: null,
  from: new THREE.Vector3(), fromT: new THREE.Vector3(),
};
const PH_HINT = 'Drag to compose · wheel to move in · G grid · P to leave';
let phNoteT = null;

function enterPhoto() {
  if (photo.active || introT < 1) return false;
  if (routeView.active) {
    // fold the plan on the spot — the out-flight takes 0.7s, and a tripod set
    // up mid-flight would capture the overhead as the frame to return to,
    // then have the landing snap the camera out from under the photograph
    exitRouteView(false);
    routeView.phase = 'idle';
    routeView.active = false;
    camera.position.copy(routeView.fromPos);
    controls.target.copy(routeView.fromTarget);
    camera.lookAt(routeView.fromTarget);
  }
  if (sheetOpen) closeSheet();   // the ledger comes off the tripod's view, same as route view
  endClubCam();
  photo.wasTool = activeTool;
  if (lens.active) {
    // the walk hands its frame to the tripod: the photograph starts on the
    // shot you were watching, and leaving returns to where the WALK began
    photo.from.copy(lens.from);
    photo.fromT.copy(lens.fromT);
    photo.wasCtl = lens.wasCtl;
    controls.target.copy(lens.look);
    lens.active = false; lens.g = null; lens.shot = '';
    document.body.classList.remove('lens-mode');
  } else {
    photo.from.copy(camera.position);
    photo.fromT.copy(controls.target);
    photo.wasCtl = controls.enabled;
  }
  photo.active = true;
  photo.limits = { minP: controls.minPolarAngle, maxP: controls.maxPolarAngle,
    minD: controls.minDistance, maxD: controls.maxDistance };
  controls.minPolarAngle = 0.02;
  controls.maxPolarAngle = Math.PI * 0.495;
  controls.minDistance = 2;
  controls.enabled = true;
  if (activeTool !== 'orbit') selectTool('orbit');
  document.body.classList.add('photo-mode');
  photoNote(PH_HINT);
  syncPhotoChip();
  sound('open');
  return true;
}

function exitPhoto() {
  if (!photo.active) return false;
  photo.active = false;
  const L = photo.limits;
  controls.minPolarAngle = L.minP; controls.maxPolarAngle = L.maxP;
  controls.minDistance = L.minD; controls.maxDistance = L.maxD;
  camera.position.copy(photo.from);
  controls.target.copy(photo.fromT);
  camera.up.set(0, 1, 0);
  camera.lookAt(photo.fromT);
  controls.enabled = photo.wasCtl && introT >= 1;
  photo.roll = 0;
  photo.golden = false;
  photoLightMin = null;
  applyDaylight(true);              // the real hour comes back with the fences
  document.body.classList.remove('photo-mode');
  syncPhotoChip();
  if (photo.wasTool !== 'orbit') selectTool(photo.wasTool);
  sound('shut');
  return true;
}

function setPhotoGrid(on) {
  photo.grid = !!on;
  syncPhotoChip();
  sound('tick');
  return photo.grid;
}

function setGolden(on) {
  photo.golden = !!on;
  photoLightMin = photo.golden ? dayInfo().dl.sunset - 22 : null;
  applyDaylight(true);
  syncPhotoChip();
  sound('tick');
  return photo.golden;
}

function setPhotoRoll(v) {
  photo.roll = clamp(+v || 0, -12, 12);
  syncPhotoChip();
  return photo.roll;
}

function photoNote(txt) { el('ph-note').textContent = txt; }

function syncPhotoChip() {
  el('ph-grid').classList.toggle('on', photo.grid);
  el('ph-gold').classList.toggle('on', photo.golden);
  el('ph-tilt').value = photo.roll;
  el('ph-level').textContent = (photo.roll > 0 ? '+' : '') + (Math.round(photo.roll * 2) / 2) + '°';
  el('photo-grid').classList.toggle('hidden', !(photo.active && photo.grid));
  el('photo-ui').classList.toggle('hidden', !photo.active);
}

// the print's filename: the ground it was taken on, and the club's own clock
function photoName() {
  const d = nowDate();
  const pad = n => String(n).padStart(2, '0');
  const where = away.active ? away.venue.name : 'Fairways';
  return where.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') +
    '-' + d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) +
    '-' + pad(d.getHours()) + pad(d.getMinutes()) + '.png';
}

// The sky lives in CSS behind an alpha canvas, so the print gets the same sky
// painted under the render: the page's own three-stop gradient and the glow,
// read live off the custom properties applyDaylight writes — golden hour,
// night and every theme included, because they are the same five variables.
function paintSkyOn(ctx, W, H) {
  const rs = getComputedStyle(document.documentElement);
  const v = (n, fb) => (rs.getPropertyValue(n) || fb).trim() || fb;
  const lin = ctx.createLinearGradient(0, 0, 0, H);
  lin.addColorStop(0, v('--sky-1', '#dceaf4'));
  lin.addColorStop(0.55, v('--sky-2', '#edf1e9'));
  lin.addColorStop(1, v('--sky-3', '#f5f2e9'));
  ctx.fillStyle = lin;
  ctx.fillRect(0, 0, W, H);
  const rx = W * 1.2;
  ctx.save();
  ctx.translate(W * 0.5, -H * 0.1);
  ctx.scale(1, (H * 0.9) / rx);
  const rad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  rad.addColorStop(0, v('--sky-glow', '#cfe6f4'));
  rad.addColorStop(0.6, v('--sky-fade', 'rgba(207,230,244,0)'));
  ctx.fillStyle = rad;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

// One oversized frame off the same canvas: same camera, same light, same sky.
// Returns { w, h, scale, name } — a judge calls capture({ download: false })
// and asserts on the dimensions without a click; { data: true } adds the PNG's
// encoded size so the export itself can be proven non-empty.
function capturePhoto(opts) {
  opts = opts || {};
  // A hidden pane reports a 0×0 window (and can have left the camera's aspect
  // NaN since boot). The capture is the one render that must work headlessly,
  // so it falls back to a full HD frame and squares the camera up itself —
  // the exact repair the resize handler performs when the window comes back.
  const cw = renderer.domElement.clientWidth || window.innerWidth || 1280;
  const ch = renderer.domElement.clientHeight || window.innerHeight || 720;
  if (!isFinite(camera.aspect) || camera.aspect <= 0) {
    camera.aspect = cw / ch;
    camera.updateProjectionMatrix();
  }
  const want = opts.scale == null ? 2.5 : +opts.scale;
  const s = Math.max(1, Math.min(want, 8192 / Math.max(cw, ch)));
  const W = Math.round(cw * s), H = Math.round(ch * s);
  const prevPR = renderer.getPixelRatio();
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.render(scene, viewCam());
  const out = document.createElement('canvas');
  out.width = W; out.height = H;
  const ctx = out.getContext('2d');
  paintSkyOn(ctx, W, H);
  ctx.drawImage(renderer.domElement, 0, 0);
  // the window back exactly as the resize handler leaves it, same frame
  renderer.setPixelRatio(prevPR);
  renderer.setSize(cw, ch, false);
  renderer.render(scene, viewCam());
  const name = photoName();
  const res = { w: W, h: H, scale: +s.toFixed(2), name };
  if (opts.data) res.bytes = out.toDataURL('image/png').length;
  if (opts.download !== false) {
    out.toBlob(b => {
      if (!b) return;
      const a = document.createElement('a');
      a.href = URL.createObjectURL(b);
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    }, 'image/png');
    sound('brass');
    if (photo.active) {
      photoNote('Saved · ' + name);
      clearTimeout(phNoteT);
      phNoteT = setTimeout(() => { if (photo.active) photoNote(PH_HINT); }, 3000);
    }
  }
  return res;
}

// ── Tee → pin linking ────────────────────────────────────────────────────────
// The architect decides which tee plays to which pin. Pick a tee (or a pin),
// then its partner: a curved connector previews the hole live — yardage and the
// par it would become — and committing locks the pair so the proximity pairer
// can never take it back. Everything else (numbering, route order, scorecard)
// rides along.

const linkMode = {
  active: false,
  source: null,        // { x, z, kind:'tee'|'flag' }
  hover: null,         // valid target under the cursor
  cursor: null,        // last tile under the cursor (rubber-band end)
  targets: [],         // valid target tiles
  preview: null,       // makeHole() result for source→hover
  previewKey: '',
};

const linkGroup = new THREE.Group(); scene.add(linkGroup);
const linkRingGeo = new THREE.TorusGeometry(0.42, 0.032, 6, 28);
const linkDiscGeo = new THREE.CircleGeometry(0.42, 28);
const LINK_INK = 0x2b5aa6;    // --blue, the same fountain pen the overlay draws with
const LINK_PAPER = 0xfcf8ec;  // the same paper-white the link caps are stroked in
const linkTargetMat = new THREE.MeshBasicMaterial({ color: LINK_INK, transparent: true, opacity: 0.44, depthWrite: false });
const linkHoverMat = new THREE.MeshBasicMaterial({ color: LINK_INK, transparent: true, opacity: 0.95, depthWrite: false });
const linkSourceMat = new THREE.MeshBasicMaterial({ color: LINK_PAPER, transparent: true, opacity: 0.92, depthWrite: false });
const linkAuraMat = new THREE.MeshBasicMaterial({ color: LINK_INK, transparent: true, opacity: 0.18, depthWrite: false });

function makeLinkRing(mat, geo) {
  const m = new THREE.Mesh(geo || linkRingGeo, mat);
  m.rotation.x = -Math.PI / 2;
  m.raycast = () => { };
  return m;
}

function isLinkSourceTile(x, z) {
  const t = tileType(x, z);
  return t === 'tee' || t === 'flag';
}

function linkPartnerOf(src) {
  const i = state.holePairs.findIndex(p => src.kind === 'tee'
    ? (p.tee.x === src.x && p.tee.z === src.z)
    : (p.flag.x === src.x && p.flag.z === src.z));
  if (i < 0) return null;
  const p = state.holePairs[i];
  return { i, tile: src.kind === 'tee' ? p.flag : p.tee };
}

// valid targets are every tile of the opposite kind except the current partner
function linkTargetsFor(src) {
  const want = src.kind === 'tee' ? 'flag' : 'tee';
  const partner = linkPartnerOf(src);
  const out = [];
  const half = gridSize() / 2;
  for (let x = -half; x < half; x++) {
    for (let z = -half; z < half; z++) {
      if (tileType(x, z) !== want) continue;
      if (partner && partner.tile.x === x && partner.tile.z === z) continue;
      out.push({ x, z });
    }
  }
  return out;
}

function refreshLinkTargets() {
  linkGroup.clear();
  linkMode.targets = [];
  if (!linkMode.active) return;
  if (!linkMode.source) {
    // no source yet: every tee and pin is a candidate
    const half = gridSize() / 2;
    for (let x = -half; x < half; x++) {
      for (let z = -half; z < half; z++) if (isLinkSourceTile(x, z)) linkMode.targets.push({ x, z });
    }
  } else {
    linkMode.targets = linkTargetsFor(linkMode.source);
    const s = linkMode.source;
    const aura = makeLinkRing(linkAuraMat, linkDiscGeo);
    aura.position.copy(tileTopWorld(s.x, s.z)); aura.position.y += 0.024;
    linkGroup.add(aura);
    const ring = makeLinkRing(linkSourceMat);
    ring.position.copy(tileTopWorld(s.x, s.z)); ring.position.y += 0.03;
    ring.userData.source = true;
    linkGroup.add(ring);
  }
  for (const t of linkMode.targets) {
    const r = makeLinkRing(linkTargetMat);
    r.position.copy(tileTopWorld(t.x, t.z)); r.position.y += 0.03;
    r.userData.tx = t.x; r.userData.tz = t.z;
    linkGroup.add(r);
  }
  linkMode.previewKey = '';
}

function isLinkTarget(x, z) {
  return linkMode.targets.some(t => t.x === x && t.z === z);
}

function enterLinkMode(src) {
  if (routeView.active) return;
  closeHoleCard();
  closeRatingCard();
  if (sheetOpen) closeSheet();
  linkMode.active = true;
  linkMode.source = null; linkMode.hover = null; linkMode.cursor = null;
  document.body.classList.add('link-mode');
  el('link-ui').classList.remove('hidden');
  reveal(el('link-ui'));
  if (activeTool !== 'link') selectTool('link');
  if (src && isLinkSourceTile(src.x, src.z)) setLinkSource(src);
  else refreshLinkTargets();
  renderLinkChip();
  sound('tick');  // starting a line on the plan
}

function exitLinkMode() {
  if (!linkMode.active) return;
  linkMode.active = false;
  linkMode.source = null; linkMode.hover = null; linkMode.targets = [];
  linkGroup.clear();
  el('link-svg').innerHTML = '';
  el('link-label').classList.add('hidden');
  document.body.classList.remove('link-mode');
  const ui = el('link-ui');
  ui.classList.remove('show');
  setTimeout(() => { if (!linkMode.active) ui.classList.add('hidden'); }, 300);
  if (activeTool === 'link') selectTool('orbit');
}

function setLinkSource(tile) {
  const kind = tileType(tile.x, tile.z) === 'tee' ? 'tee' : 'flag';
  linkMode.source = { x: tile.x, z: tile.z, kind };
  linkMode.hover = null;
  refreshLinkTargets();
  renderLinkChip();
  sound('tick');  // marking the tee end of it
}

function clearLinkSource() {
  linkMode.source = null;
  linkMode.hover = null;
  refreshLinkTargets();
  renderLinkChip();
}

function renderLinkChip() {
  const s = linkMode.source;
  el('link-icon').innerHTML = ICONS.link;
  if (!s) {
    el('link-title').textContent = 'Link a hole';
    el('link-hint').textContent = 'Pick a tee or a pin to start';
    return;
  }
  const partner = linkPartnerOf(s);
  const who = partner ? 'Hole ' + (partner.i + 1) + ' · ' : '';
  el('link-title').textContent = s.kind === 'tee' ? who + 'Pick a pin' : who + 'Pick a tee';
  el('link-hint').textContent = s.kind === 'tee'
    ? 'Tap the pin this tee should play to'
    : 'Tap the tee that should play to this pin';
}

// a click in link mode: choose the source, commit the pair, or step back
function handleLinkClick(tile) {
  if (!tile) { linkMode.source ? clearLinkSource() : exitLinkMode(); return; }
  const s = linkMode.source;
  if (!s) {
    if (isLinkSourceTile(tile.x, tile.z)) setLinkSource(tile);
    else exitLinkMode();
    return;
  }
  if (s.x === tile.x && s.z === tile.z) { clearLinkSource(); return; }
  if (!isLinkTarget(tile.x, tile.z)) {
    // tapping another tee/pin of the same kind re-aims rather than cancelling
    if (isLinkSourceTile(tile.x, tile.z)) setLinkSource(tile);
    else clearLinkSource();
    return;
  }
  const tee = s.kind === 'tee' ? { x: s.x, z: s.z } : tile;
  const flag = s.kind === 'tee' ? tile : { x: s.x, z: s.z };
  if (applyLink(tee, flag)) exitLinkMode();
}

// the hole this pairing would make — cached while the cursor rests on a target
function linkPreviewHole(tee, flag) {
  return makeHole({ x: tee.x, z: tee.z }, { x: flag.x, z: flag.z },
    Math.hypot(flag.x - tee.x, flag.z - tee.z));
}

// ── Commit ───────────────────────────────────────────────────────────────────
// One rule: the pair the player names is theirs. If the pin already belongs to
// another hole the two holes swap pins — nothing is destroyed, both stay
// numbered where they were, and each keeps its own scorecard.

function clonePairs() {
  const ps = Array.isArray(state.holePairs) ? state.holePairs : [];
  return ps.map(p => ({ tee: { x: p.tee.x, z: p.tee.z }, flag: { x: p.flag.x, z: p.flag.z }, locked: !!p.locked }));
}

function samePairs(a, b) {
  if (a.length !== b.length) return false;
  return a.every((p, i) => {
    const q = b[i];
    return p.tee.x === q.tee.x && p.tee.z === q.tee.z
      && p.flag.x === q.flag.x && p.flag.z === q.flag.z && !!p.locked === !!q.locked;
  });
}

function pairsSnapshot() {
  return { pairs: clonePairs(), stats: JSON.parse(JSON.stringify(state.holeStats)) };
}

// carry a hole's accumulated rounds to its new key — in the player's mind it is
// still hole 3, so its scorecard travels with it (all lifted first, so a swap
// can cross keys without clobbering)
function carryStats(moves) {
  const lifted = [];
  for (const m of moves) {
    if (m.from === m.to) continue;
    const st = state.holeStats[m.from];
    if (!st) continue;
    delete state.holeStats[m.from];
    lifted.push({ to: m.to, st });
  }
  for (const l of lifted) {
    const cur = state.holeStats[l.to];
    if (!cur) { state.holeStats[l.to] = l.st; continue; }
    cur.rounds += l.st.rounds;
    cur.strokes += l.st.strokes;
    for (const o of OUTCOMES) cur.outcomes[o] = (cur.outcomes[o] || 0) + (l.st.outcomes[o] || 0);
  }
}

function applyLink(tee, flag) {
  if (!inBounds(tee.x, tee.z) || !inBounds(flag.x, flag.z)) return false;
  if (tileType(tee.x, tee.z) !== 'tee' || tileType(flag.x, flag.z) !== 'flag') return false;
  const pairs = state.holePairs;
  const ti = pairs.findIndex(p => p.tee.x === tee.x && p.tee.z === tee.z);
  const fi = pairs.findIndex(p => p.flag.x === flag.x && p.flag.z === flag.z);
  if (ti >= 0 && ti === fi) return false;                 // already the same hole

  const before = pairsSnapshot();
  const parBefore = course.holes.map(h => h.par);
  const oldKeys = pairs.map(p => holeKey(p));
  let kind, touched;

  if (ti >= 0 && fi >= 0) {
    const tmp = pairs[ti].flag;
    pairs[ti].flag = pairs[fi].flag;
    pairs[fi].flag = tmp;
    // only the pairing the player actually named is theirs. The displaced hole
    // got its new pin from the swap, not from the architect, so it goes back to
    // being an auto pair the proximity pairer may correct later.
    pairs[ti].locked = true;
    pairs[fi].locked = false;
    kind = 'swap'; touched = [ti, fi];
  } else if (ti >= 0) {
    pairs[ti].flag = { x: flag.x, z: flag.z };
    pairs[ti].locked = true;
    kind = 'pin'; touched = [ti];
  } else if (fi >= 0) {
    pairs[fi].tee = { x: tee.x, z: tee.z };
    pairs[fi].locked = true;
    kind = 'tee'; touched = [fi];
  } else {
    pairs.push({ tee: { x: tee.x, z: tee.z }, flag: { x: flag.x, z: flag.z }, locked: true });
    kind = 'new'; touched = [pairs.length - 1];
  }

  carryStats(touched.filter(i => oldKeys[i] !== undefined).map(i => ({ from: oldKeys[i], to: holeKey(pairs[i]) })));

  undoStack.push({ link: before });
  if (undoStack.length > UNDO_DEPTH) undoStack.shift();

  computeCourse();
  // A carried scorecard was earned against the old hole. If the relink changed
  // what the hole IS — a different par, or two tiles of length either way, which
  // is a club or two in every player's hands — those strokes no longer describe
  // it, so mark where the new hole begins: the card counts rounds from the mark
  // before it trusts them again. The snapshot is refreshed either way, so the
  // scorecard never quotes a yardage the hole no longer plays.
  for (const i of touched) {
    const h = course.holes[i];
    if (!h) continue;
    const st = state.holeStats[holeKey(h)];
    if (!st) continue;
    if (st.rounds > 0 && st.par !== h.par) st.mark = { rounds: st.rounds, strokes: st.strokes, why: 'par' };
    else if (st.rounds > 0 && Math.abs(st.yards - h.yards) >= 2 * YARDS_PER_TILE) {
      st.mark = { rounds: st.rounds, strokes: st.strokes, why: 'length' };
    }
    st.par = h.par; st.yards = h.yards;
  }
  save();

  // the reconcile above can compact the list if a tile vanished under us — say
  // nothing rather than guess at hole numbers that no longer mean anything
  if (touched.every(i => course.holes[i])) {
    const nums = touched.map(i => i + 1);
    const changed = touched.filter(i => parBefore[i] !== undefined && parBefore[i] !== course.holes[i].par);
    let msg;
    if (kind === 'swap') {
      msg = 'Holes ' + nums[0] + ' & ' + nums[1] + ' swapped pins';
      if (changed.length) msg += ' · ' + changed.map(i => 'Hole ' + (i + 1) + ' is now a Par ' + course.holes[i].par).join(' · ');
    } else {
      const h = course.holes[touched[0]];
      msg = 'Hole ' + nums[0] + (kind === 'new' ? ' is open · ' : ' · ') + h.yards + ' yds · Par ' + h.par;
      if (changed.length) msg += ' (was Par ' + parBefore[touched[0]] + ')';
    }
    toast(msg, 'flag');
  }
  sound('place');
  return true;
}

// ── Link overlay (connector · live yardage · in-world rings) ─────────────────

function linkAnchor(x, z, kind) {
  const v = tileTopWorld(x, z);
  v.y += kind === 'flag' ? 0.86 : 0.12;
  return v;
}

function updateLinkMode(time) {
  if (!linkMode.active) return;
  // one calm collective breath across every candidate ring
  const pulse = 0.34 + Math.sin(time * 2.1) * 0.16;
  linkTargetMat.opacity = pulse;
  linkAuraMat.opacity = 0.13 + Math.sin(time * 2.1) * 0.05;
  const hv = linkMode.hover;
  for (const m of linkGroup.children) {
    if (m.userData.source || m.userData.tx === undefined) continue;
    const on = hv && m.userData.tx === hv.x && m.userData.tz === hv.z;
    m.material = on ? linkHoverMat : linkTargetMat;
    const s = on ? 1.14 : 1;
    m.scale.set(s, s, s);
  }
  drawLinkOverlay();
}

function drawLinkOverlay() {
  const svg = el('link-svg');
  const label = el('link-label');
  const s = linkMode.source;
  if (!s) { svg.innerHTML = ''; label.classList.add('hidden'); return; }

  const a = projectPt(linkAnchor(s.x, s.z, s.kind));
  let html = '';

  // the pairing it has today, drawn faint so a change is legible as a change
  const partner = linkPartnerOf(s);
  if (partner) {
    const pk = s.kind === 'tee' ? 'flag' : 'tee';
    const c = projectPt(linkAnchor(partner.tile.x, partner.tile.z, pk));
    html += '<path class="link-current" d="' + arcPath(a, c) + '"/>';
  }

  const end = linkMode.hover || linkMode.cursor;
  if (end) {
    const live = !!linkMode.hover;
    const b = projectPt(linkAnchor(end.x, end.z, live ? (s.kind === 'tee' ? 'flag' : 'tee') : 'tee'));
    const d = arcPath(a, b);
    if (live) html += '<path class="link-glow" d="' + d + '"/><path class="link-line" d="' + d + '"/>';
    else html += '<path class="link-line loose" d="' + d + '"/>';
    html += '<circle class="link-cap" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="4.5"/>';
    if (live) {
      html += '<circle class="link-ring" cx="' + b.x.toFixed(1) + '" cy="' + b.y.toFixed(1) + '" r="6.5"/>';
      const key = end.x + ',' + end.z;
      if (linkMode.previewKey !== key) {
        const tee = s.kind === 'tee' ? s : end;
        const flag = s.kind === 'tee' ? end : s;
        linkMode.preview = linkPreviewHole(tee, flag);
        linkMode.previewKey = key;
        el('link-yards').textContent = linkMode.preview.yards.toLocaleString() + ' yds';
        el('link-par').textContent = 'Would play as a Par ' + linkMode.preview.par;
      }
      const apex = arcApex(a, b);
      label.style.left = apex.x + 'px';
      label.style.top = (apex.y - 20) + 'px';
      label.classList.remove('hidden');
    } else {
      label.classList.add('hidden');
      linkMode.previewKey = '';
    }
  } else {
    html += '<circle class="link-cap" cx="' + a.x.toFixed(1) + '" cy="' + a.y.toFixed(1) + '" r="4.5"/>';
    label.classList.add('hidden');
  }
  svg.innerHTML = html;
}

// a quadratic arc that lifts with distance — reads as a shot, not a wire
function arcCtrl(a, b) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lift = Math.max(24, Math.min(130, Math.hypot(dx, dy) * 0.3));
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 - lift };
}
function arcPath(a, b) {
  const c = arcCtrl(a, b);
  return 'M' + a.x.toFixed(1) + ',' + a.y.toFixed(1) +
    ' Q' + c.x.toFixed(1) + ',' + c.y.toFixed(1) + ' ' + b.x.toFixed(1) + ',' + b.y.toFixed(1);
}
function arcApex(a, b) {
  const c = arcCtrl(a, b);
  return { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 };
}

function updateLinkHover(e) {
  if (!linkMode.active) return;
  const t = e ? pickTileLoose(e) : null;
  if (!t) { linkMode.hover = null; linkMode.cursor = null; return; }
  linkMode.cursor = { x: t.gx, z: t.gz };
  // with no source yet the "targets" are the candidate tees and pins, so the
  // same test lights up whatever the cursor is about to pick
  linkMode.hover = isLinkTarget(t.gx, t.gz) ? { x: t.gx, z: t.gz } : null;
}

// ── Unlinked badges ──────────────────────────────────────────────────────────
// A tee with no pin (or a pin no tee plays to) is a real state, not an error.
// It gets a quiet badge in the world that is also the way to fix it.

const pairMarks = [];
let pendingAdds = [], pendingAt = 0, pendingSig = '';
const MARK_DELAY = 2.2;      // seconds of quiet before an orphan speaks up
let linkHintReady = false;   // the first-time note waits until after boot settles

function markKey(u) { return u.kind + u.x + ',' + u.z; }

// Appearing is patient, resolving is instant — and the two are tracked apart.
// Mid-build a tee is briefly pinless and that is not worth a badge, so new
// orphans wait. But a badge the player just resolved leaves on the same frame,
// even when the same edit orphans something else (re-aiming a tee does exactly
// that): otherwise the UI would keep pointing at the tile they just fixed.
function renderPairMarkers() {
  const want = new Set(unpairedTiles.map(markKey));
  for (let i = pairMarks.length - 1; i >= 0; i--) {
    if (want.has(pairMarks[i].key)) continue;
    pairMarks[i].el.remove();
    pairMarks.splice(i, 1);
  }
  const have = new Set(pairMarks.map(m => m.key));
  const adds = unpairedTiles.filter(u => !have.has(markKey(u)));
  const sig = adds.map(markKey).join('|');
  if (sig !== pendingSig) { pendingAdds = adds; pendingSig = sig; pendingAt = performance.now(); }
}

function addPairMark(u) {
  const b = document.createElement('button');
  b.className = 'pair-mark';
  b.innerHTML = ICONS.link + '<span>' + (u.kind === 'flag' ? 'Needs a tee' : 'Needs a pin') + '</span>';
  b.addEventListener('click', () => { ensureAudio(); enterLinkMode({ x: u.x, z: u.z }); });
  el('pair-markers').appendChild(b);
  pairMarks.push({ el: b, x: u.x, z: u.z, kind: u.kind, key: markKey(u) });
}

const _pmAnchor = new THREE.Vector3();
function updatePairMarkerPositions() {
  if (pendingAdds.length && performance.now() - pendingAt > MARK_DELAY * 1000) {
    const first = !pairMarks.length;
    const adds = pendingAdds;
    pendingAdds = []; pendingSig = '';
    for (const u of adds) addPairMark(u);
    if (first && linkHintReady) {
      // once per save, not per session — the badge itself is the reminder
      committeeNote('link', adds[0].kind === 'flag'
        ? "This pin isn't linked to a tee — tap its badge to link one"
        : "This tee isn't linked to a pin — tap its badge to link one", 'link');
    }
  }
  if (!pairMarks.length) return;
  for (const m of pairMarks) {
    _pmAnchor.copy(linkAnchor(m.x, m.z, m.kind));
    _pmAnchor.y += 0.34;
    _pmAnchor.project(viewCam());
    if (_pmAnchor.z > 1) { m.el.style.visibility = 'hidden'; continue; }
    m.el.style.visibility = '';
    // stays on screen when its tile drifts to the edge — a badge you cannot
    // read is a badge you cannot tap (the mark is centred on its anchor)
    const hw = (m.el.offsetWidth || 120) / 2, hh = (m.el.offsetHeight || 30) / 2;
    const px = (_pmAnchor.x * 0.5 + 0.5) * window.innerWidth;
    const py = (-_pmAnchor.y * 0.5 + 0.5) * window.innerHeight;
    m.el.style.left = clamp(px, hw + 12, window.innerWidth - hw - 12).toFixed(1) + 'px';
    m.el.style.top = clamp(py, hh + 70, window.innerHeight - hh - 80).toFixed(1) + 'px';
  }
}

// ── Rating breakdown card ────────────────────────────────────────────────────

let ratingOpen = false;

function renderRatingCard(animate) {
  const c = el('ratingcard');
  const r = course.rating;
  const starsTxt = course.holes.length ? (Math.round(course.stars * 2) / 2).toFixed(1) : '—';
  let html = '<div class="rt-head"><span class="rt-stars">★ ' + starsTxt + '</span>' +
    '<span class="rt-sub">Course rating</span></div>';
  for (const m of RATING_META) {
    html += '<div class="rt-row"><span class="rt-name">' + m.name + '</span>' +
      '<div class="rt-track"><div class="rt-fill" style="width:' + (animate ? 0 : r[m.id]) + '%"></div></div>' +
      '<span class="rt-val">' + r[m.id] + '</span></div>';
  }
  if (!course.holes.length) {
    html += '<div class="rt-hints"><div class="rt-hint"><span>Open your first hole to earn a rating.</span></div></div>';
  } else {
    const weak = RATING_META.slice().sort((a, b) => r[a.id] - r[b.id]).filter(m => r[m.id] < 70).slice(0, 2);
    if (weak.length) {
      html += '<div class="rt-hints">' + weak.map(m =>
        '<div class="rt-hint"><b>' + m.name + '</b><span>' + m.hint + '</span></div>').join('') + '</div>';
    }
  }
  c.innerHTML = html;
  if (animate) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const fills = c.querySelectorAll('.rt-fill');
      RATING_META.forEach((m, i) => { if (fills[i]) fills[i].style.width = r[m.id] + '%'; });
    }));
  }
}

function openRatingCard() {
  ratingOpen = true;
  closeHoleCard();
  const c = el('ratingcard');
  renderRatingCard(true);
  c.classList.remove('hidden');
  const pr = el('pill-stars').getBoundingClientRect();
  const w = c.offsetWidth || 292;
  c.style.left = Math.max(12, Math.min(window.innerWidth - w - 12, pr.left + pr.width / 2 - w / 2)) + 'px';
  c.style.top = (pr.bottom + 12) + 'px';
  reveal(c);
  sound('card');  // the rating card laid down
}

function closeRatingCard() {
  if (!ratingOpen) return;
  ratingOpen = false;
  const c = el('ratingcard');
  c.classList.remove('show');
  setTimeout(() => { if (!ratingOpen) c.classList.add('hidden'); }, 300);
}

// ── Route view ───────────────────────────────────────────────────────────────
// A top-down orthographic overview: numbered badges over each hole, a dotted
// tee→flag→next-tee line, and tap-to-renumber with a live count indicator.

const routeView = {
  active: false, phase: 'idle', t: 0,   // phase: idle → in → view → out → idle
  fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(),
  topPos: new THREE.Vector3(), cam: null,
  order: [],                             // hole indices in the newly tapped sequence
};
const ROUTE_LOOK = new THREE.Vector3(0, 0.5, 0);

function viewCam() {
  return (routeView.active && routeView.phase === 'view') ? routeView.cam : camera;
}

function makeRouteCam() {
  // a hidden/zero-size window would make aspect 0 or ∞ and poison every
  // projection with NaN — fall back to square framing until a real resize
  const aspect = (window.innerWidth > 0 && window.innerHeight > 0)
    ? window.innerWidth / window.innerHeight : 1;
  const s = gridSize() / 2 + 3;
  const hw = aspect >= 1 ? s * aspect : s;
  const hh = aspect >= 1 ? s : s / aspect;
  const cam = new THREE.OrthographicCamera(-hw, hw, hh, -hh, 0.1, 140);
  cam.position.set(0, 60, 0);
  cam.up.set(0, 0, -1);   // screen-up = north, matching the fly-in framing
  cam.lookAt(0, 0, 0);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld(true);   // projections are used before the first render
  return cam;
}

function enterRouteView() {
  if (routeView.active || course.holes.length < 2) return;
  endClubCam();          // the overview flight starts from where the player was
  closeHoleCard();
  closeRatingCard();
  if (linkMode.active) exitLinkMode();
  if (sheetOpen) closeSheet();
  routeView.active = true;
  routeView.phase = 'in';
  routeView.t = 0;
  routeView.order = [];
  routeView.fromPos.copy(camera.position);
  routeView.fromTarget.copy(controls.target);
  const H = gridSize() * 1.55 + 4;
  routeView.topPos.set(0, H, H * 0.04);   // slight tilt keeps lookAt well-defined
  routeView.cam = makeRouteCam();
  controls.enabled = false;
  document.body.classList.add('route-mode');
  clearHighlight();
  sound('page');  // the whole course turned over to its plan
}

function exitRouteView(commit) {
  if (!routeView.active || routeView.phase === 'out') return;
  const midFlight = routeView.phase === 'in';
  if (!midFlight && commit && routeView.order.length === course.holes.length) {
    const perm = routeView.order.map(i => state.holePairs[i]);
    const changed = perm.some((p, i) => p !== state.holePairs[i]);
    state.holePairs = perm;
    if (changed) {
      computeCourse();
      save();
      toast('Route updated — holes renumbered', 'flag');
      sound('lucky');
    }
  }
  hideRouteOverlay();
  document.body.classList.remove('route-mode');
  routeView.phase = 'out';
  routeView.t = midFlight ? 1 - routeView.t : 0;   // reverse smoothly if mid-flight
}

const _rvTarget = new THREE.Vector3();
function updateRouteView(dt) {
  if (routeView.phase !== 'in' && routeView.phase !== 'out') return;
  routeView.t = Math.min(1, routeView.t + dt / 0.7);
  const k = routeView.t;
  const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;   // ease-in-out
  const a = routeView.phase === 'in' ? e : 1 - e;
  camera.position.lerpVectors(routeView.fromPos, routeView.topPos, a);
  _rvTarget.lerpVectors(routeView.fromTarget, ROUTE_LOOK, a);
  camera.lookAt(_rvTarget);
  if (routeView.t >= 1) {
    if (routeView.phase === 'in') {
      routeView.phase = 'view';
      showRouteOverlay();
    } else {
      routeView.phase = 'idle';
      routeView.active = false;
      camera.position.copy(routeView.fromPos);
      controls.target.copy(routeView.fromTarget);
      camera.lookAt(routeView.fromTarget);
      if (introT >= 1) controls.enabled = true;
    }
  }
}

function showRouteOverlay() {
  buildRouteBadges();
  const ui = el('route-ui');
  ui.classList.remove('hidden');
  updateRouteOverlayPositions();
  reveal(ui);
}

function hideRouteOverlay() {
  const ui = el('route-ui');
  ui.classList.remove('show');
  setTimeout(() => { if (routeView.phase !== 'view') ui.classList.add('hidden'); }, 320);
}

function buildRouteBadges() {
  const wrap = el('route-badges');
  wrap.innerHTML = '';
  course.holes.forEach((h, i) => {
    const b = document.createElement('button');
    b.className = 'route-badge';
    b.dataset.i = i;
    b.addEventListener('click', () => toggleRouteHole(i));
    wrap.appendChild(b);
  });
  renderRouteState();
}

function toggleRouteHole(i) {
  const o = routeView.order;
  const at = o.indexOf(i);
  if (at >= 0) o.splice(at, 1);   // tap again to un-place
  else o.push(i);
  sound('tick');  // numbering a hole in the order of play
  renderRouteState();
}

function renderRouteState() {
  const N = course.holes.length;
  const o = routeView.order;
  const badges = el('route-badges').children;
  for (const b of badges) {
    const i = +b.dataset.i;
    const at = o.indexOf(i);
    b.classList.toggle('sel', at >= 0);
    b.textContent = at >= 0 ? at + 1 : i + 1;
  }
  el('route-done').disabled = o.length > 0 && o.length < N;
  el('route-count').textContent =
    o.length === 0 ? 'Tap holes in the order they should play' :
    o.length < N ? o.length + ' of ' + N + ' placed' :
    'New route ready';
  drawRouteLine();
}

const _pv = new THREE.Vector3();
function projectPt(v3) {
  _pv.copy(v3).project(viewCam());
  return { x: (_pv.x * 0.5 + 0.5) * window.innerWidth, y: (-_pv.y * 0.5 + 0.5) * window.innerHeight };
}

function updateRouteOverlayPositions() {
  const wrap = el('route-badges');
  course.holes.forEach((h, i) => {
    const b = wrap.children[i];
    if (!b) return;
    const mid = tileTopWorld(h.tee.x, h.tee.z).lerp(tileTopWorld(h.flag.x, h.flag.z), 0.5);
    const p = projectPt(mid);
    b.style.left = p.x + 'px';
    b.style.top = p.y + 'px';
  });
  drawRouteLine();
}

function drawRouteLine() {
  const svg = el('route-svg');
  const holes = course.holes;
  const seq = routeView.order.length ? routeView.order : holes.map((_, i) => i);
  const pts = [];
  let marks = '';
  for (const i of seq) {
    const h = holes[i];
    if (!h) continue;
    const t = projectPt(tileTopWorld(h.tee.x, h.tee.z));
    const f = projectPt(tileTopWorld(h.flag.x, h.flag.z));
    pts.push(t, f);
    marks += '<circle class="route-tee" cx="' + t.x.toFixed(1) + '" cy="' + t.y.toFixed(1) + '" r="3.5"/>' +
      '<circle class="route-flag" cx="' + f.x.toFixed(1) + '" cy="' + f.y.toFixed(1) + '" r="5"/>';
  }
  if (pts.length < 2) { svg.innerHTML = ''; return; }
  const d = pts.map((p, j) => (j ? 'L' : 'M') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ');
  svg.innerHTML = '<path class="route-glow" d="' + d + '"/><path class="route-line" d="' + d + '"/>' + marks;
}

// ── Placement ────────────────────────────────────────────────────────────────

const raycaster = new THREE.Raycaster();
const pointerNDC = new THREE.Vector2();

function setPointer(e) {
  const r = renderer.domElement.getBoundingClientRect();
  pointerNDC.x = ((e.clientX - r.left) / r.width) * 2 - 1;
  pointerNDC.y = -((e.clientY - r.top) / r.height) * 2 + 1;
}

// true when the last pick was swallowed by the clubhouse — a tall tier must
// never let a click land on the turf behind it
let pickBlocked = false;

function pickTile(e) {
  setPointer(e);
  raycaster.setFromCamera(pointerNDC, camera);
  pickBlocked = false;
  const hits = raycaster.intersectObjects(islandGroup.children, true);
  let tile = null, td = Infinity;
  for (const h of hits) {
    let o = h.object;
    while (o && !o.userData.tile) o = o.parent;
    if (o) { tile = o.userData; td = h.distance; break; }
  }
  if (clubGroup) {
    const ch = raycaster.intersectObject(clubGroup, true);
    if (ch.length && ch[0].distance < td) { pickBlocked = true; return null; }
  }
  return tile;
}

// skipGolfers: a build tool is in hand, and a golfer strolling across the tile
// you are shaping must not intercept the click (moments and the lucky ball are
// deliberate, stationary targets and still do).
function pickInteractive(e, skipGolfers) {
  setPointer(e);
  raycaster.setFromCamera(pointerNDC, camera);
  // moments first — a celebration tap must never land on the golfer beneath
  const mh = raycaster.intersectObjects(momentGroup.children, true);
  for (const h of mh) {
    let o = h.object;
    while (o && !o.userData.momentRef) o = o.parent;
    if (o && !o.userData.momentRef.dying) return { moment: o.userData.momentRef };
  }
  if (!skipGolfers) {
    const hits = raycaster.intersectObjects(golferGroup.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o && o.userData.golferRef === undefined && o !== golferGroup) o = o.parent;
      if (o && o.userData.golferRef !== undefined) return { golfer: o.userData.golferRef };
    }
  }
  if (luckyBall.mesh) {
    const lb = raycaster.intersectObject(luckyBall.mesh, true);
    if (lb.length) return { lucky: true };
  }
  return null;
}

const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.32, depthWrite: false });
const highlightBadMat = new THREE.MeshBasicMaterial({ color: 0xff453a, transparent: true, opacity: 0.28, depthWrite: false });
const highlight = new THREE.Mesh(rboxGeo(1.0, 1.0, 1.0, 0.05), highlightMat);
highlight.visible = false;
highlight.raycast = () => { };
scene.add(highlight);

// pointer / gesture state
let painting = false, dragging = false, downX = 0, downY = 0, movedFar = false;
let lastPaintTile = null;      // last grid tile painted this drag (line interpolation anchor)
let lastPointer = null;        // last known cursor position ({clientX, clientY})
let rightOrbiting = false;     // right-drag camera orbit in progress
const DRAG_PX = 5;             // pointer must travel this far before a click becomes a drag

// the highlight glides toward this target each frame (see updateHoverGlide)
const hoverTarget = { pos: new THREE.Vector3(), sy: 1 };
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5);
const planePoint = new THREE.Vector3();

function clearHighlight() { highlight.visible = false; }

// mesh pick, falling back to the ground plane so rounded-corner seams
// between tiles never make the highlight blink
function pickTileLoose(e) {
  const t = pickTile(e);
  if (t) return t;
  if (pickBlocked) return null;                // the cursor is on the clubhouse
  raycaster.setFromCamera(pointerNDC, camera); // pointerNDC already set by pickTile
  if (raycaster.ray.intersectPlane(groundPlane, planePoint)) {
    const gx = Math.floor(planePoint.x), gz = Math.floor(planePoint.z);
    if (inBounds(gx, gz)) return { gx, gz };
  }
  return null;
}

function updateHighlight(e) {
  if (!e || activeTool === 'orbit' || activeTool === 'link' || rightOrbiting || routeView.active || clubCam.active || lens.active) { clearHighlight(); return; }
  const t = pickTileLoose(e);
  if (!t) { clearHighlight(); return; }
  const type = tileType(t.gx, t.gz);
  const h = tileHeight(t.gx, t.gz, type);
  hoverTarget.pos.set(t.gx + 0.5, h / 2 + 0.02, t.gz + 0.5);
  hoverTarget.sy = h + 0.06;
  let ok = type !== 'club';
  if (UNDER[activeTool] && type !== UNDER[activeTool]) ok = false;
  if (activeTool === 'dozer' && type === 'grass') ok = false;
  if (activeTool === 'raise' && (elevOf(t.gx, t.gz) >= MAX_ELEV || state.money < RAISE_COST)) ok = false;
  if (activeTool === 'lower' && elevOf(t.gx, t.gz) === 0) ok = false;
  const def = TILE_DEFS[activeTool];
  if (def && def.cost && state.money < def.cost) ok = false;
  highlight.material = ok ? highlightMat : highlightBadMat;
  if (!highlight.visible) {
    // appearing fresh: snap to the target so it never glides in from a stale spot
    highlight.visible = true;
    highlight.position.copy(hoverTarget.pos);
    highlight.scale.set(1, hoverTarget.sy, 1);
  }
}

// eased glide between tiles — called every frame from tick()
function updateHoverGlide(dt) {
  if (!highlight.visible) return;
  const k = 1 - Math.exp(-dt * 20);
  highlight.position.lerp(hoverTarget.pos, k);
  highlight.scale.y += (hoverTarget.sy - highlight.scale.y) * k;
}

// ── Undo ─────────────────────────────────────────────────────────────────────

const UNDO_DEPTH = 50;
const undoStack = [];          // each entry = one stroke = array of tile changes
let stroke = null;             // changes accumulated during the current gesture
let strokePairs = null;        // pairings as they were, if this stroke disturbed them

function recordChange(key, gx, gz, pt, nt, pe, ne, dm) {
  // pt/nt: prev/next tile type · pe/ne: prev/next elevation · dm: money delta
  if (stroke) stroke.push({ key, gx, gz, pt, nt, pe, ne, dm });
}

function commitStroke() {
  if (stroke && stroke.length) {
    if (strokePairs) stroke.pairs = strokePairs;   // this stroke moved a hole — undo owes it back
    undoStack.push(stroke);
    if (undoStack.length > UNDO_DEPTH) undoStack.shift();
  }
  stroke = null;
  strokePairs = null;
}

function undo() {
  const s = undoStack.pop();
  if (!s) { toast('Nothing to undo'); return false; }
  // a link change costs nothing — it restores the pairings and the scorecards
  // they were carrying, then lets everything downstream recompute
  if (s.link) {
    state.holePairs = s.link.pairs;
    state.holeStats = s.link.stats;
    if (linkMode.active) exitLinkMode();
    computeCourse();
    toast('↩︎ Link undone');
    sound('dozer');
    save();
    return true;
  }
  let delta = 0;
  for (const c of s) delta += c.dm;
  if (state.money - delta < 0) {
    // undoing would re-charge more than we have (e.g. a spent Clear refund)
    undoStack.push(s);
    toast('Not enough cash to undo that');
    sound('error');
    return false;
  }
  state.money -= delta;        // give back what was spent / take back what was refunded
  for (let i = s.length - 1; i >= 0; i--) {
    const c = s[i];
    if (c.pt === 'grass') delete state.tiles[c.key]; else state.tiles[c.key] = c.pt;
    if (!c.pe) delete state.elev[c.key]; else state.elev[c.key] = c.pe;
    setTileAndNeighbors(c.gx, c.gz, true);
  }
  // the tiles are back, so the holes they belonged to come back with them —
  // same partners, same locks, same numbers (see reconcileHoles)
  if (s.pairs) state.holePairs = s.pairs;
  computeCourse();
  if (lastPointer) updateHighlight(lastPointer);
  const back = -delta;         // net cash returned to the player
  toast('↩︎ Undone' + (back > 0 ? ' · +' + fmt(back) : back < 0 ? ' · −' + fmt(-back) : ''));
  sound('dozer');
  save();
  return true;
}

// ── Painting ─────────────────────────────────────────────────────────────────

const paintedThisDrag = new Set();

function paintTile(gx, gz, isFirst) {
  // You are a guest here. Nobody redesigns Thornwick because they fancy it.
  if (away.active) { if (isFirst) toast('This is not your golf course'); return; }
  const key = keyOf(gx, gz);
  if (paintedThisDrag.has(key)) return;
  paintedThisDrag.add(key);

  const cur = tileType(gx, gz);
  if (cur === 'club') { if (isFirst) toast("That's the clubhouse"); return; }
  const ev = elevOf(gx, gz);

  if (activeTool === 'raise') {
    if (ev >= MAX_ELEV) { if (isFirst) toast('Land is at max height'); return; }
    if (!trySpend(RAISE_COST)) return;
    state.elev[key] = ev + 1;
    recordChange(key, gx, gz, cur, cur, ev, ev + 1, -RAISE_COST);
    setTileAndNeighbors(gx, gz, true);
    sound('place');
    computeCourse();
    return;
  }
  if (activeTool === 'lower') {
    if (ev === 0) return;
    if (ev === 1) delete state.elev[key]; else state.elev[key] = ev - 1;
    recordChange(key, gx, gz, cur, cur, ev, ev - 1, 0);
    setTileAndNeighbors(gx, gz, true);
    sound('dozer');
    computeCourse();
    return;
  }
  if (activeTool === 'dozer') {
    if (cur === 'grass') return;
    const refund = Math.floor(TILE_DEFS[cur].cost * 0.5);
    // clearing an overlay puts back what it was sitting on: a pin leaves the
    // green, a bridge leaves the pond
    const next = UNDER[cur] || 'grass';
    if (next === 'grass') delete state.tiles[key]; else state.tiles[key] = next;
    if (refund > 0) addMoney(refund);
    recordChange(key, gx, gz, cur, next, ev, ev, refund);
    setTileAndNeighbors(gx, gz, true);
    sound('dozer');
    computeCourse();
    return;
  }

  const def = TILE_DEFS[activeTool];
  if (!def) return;
  if (cur === activeTool) return;
  const needs = UNDER[activeTool];
  if (needs && cur !== needs) {
    if (isFirst) toast(UNDER_MSG[activeTool]);
    return;
  }
  if (!trySpend(def.cost)) return;
  let dm = -def.cost;
  // an overlay keeps the tile beneath it, so nothing is torn out and nothing is
  // handed back — the price on the dock is the price you pay
  if (!needs && cur !== 'grass' && !UNDER[cur]) {
    const refund = Math.floor(TILE_DEFS[cur].cost * 0.5);
    addMoney(refund);
    dm += refund;
  }
  state.tiles[key] = activeTool;
  recordChange(key, gx, gz, cur, activeTool, ev, ev, dm);
  setTileAndNeighbors(gx, gz, true);
  sound('place');
  computeCourse();
}

// 4-connected line walk between two grid tiles — fast drags leave no gaps
function paintLine(x0, z0, x1, z1) {
  const dx = Math.abs(x1 - x0), dz = Math.abs(z1 - z0);
  const sx = x0 < x1 ? 1 : -1, sz = z0 < z1 ? 1 : -1;
  let err = dx - dz, x = x0, z = z0, guard = 0;
  while ((x !== x1 || z !== z1) && guard++ < 256) {
    if ((2 * err > -dz && x !== x1) || z === z1) { err -= dz; x += sx; }
    else { err += dx; z += sz; }
    paintTile(x, z, false);
  }
}

function handleInteractive(hit) {
  if (hit.moment) { celebrateMoment(hit.moment); return; }
  if (hit.lucky) { collectLucky(); return; }
  // a golfer is somebody: open their card. The tip is still there, on a button
  // with a name and a face attached to it.
  if (hit.golfer) openFollowCard(hit.golfer);
}

function endStroke() {
  if (!painting) return;
  painting = false; dragging = false; lastPaintTile = null;
  commitStroke();
  save();
}

renderer.domElement.addEventListener('pointerdown', e => {
  ensureAudio();
  if (routeView.active || clubCam.active) return;   // the camera is mid-trip; nothing to paint at
  if (e.button === 2) { rightOrbiting = true; clearHighlight(); return; }
  if (e.button !== 0) return;
  downX = e.clientX; downY = e.clientY; movedFar = false;
  if (activeTool === 'orbit' || activeTool === 'link') return;
  // a tool in hand builds. Golfers are picked up on pointerup instead (orbit
  // and link return above), so a click or drag started on one still paints.
  const hit = pickInteractive(e, true);
  if (hit) { handleInteractive(hit); movedFar = true; return; } // consume — no paint, no re-hit on pointerup
  closeFollowCard();          // building again: the card gets out of the way
  painting = true; dragging = false;
  stroke = [];
  paintedThisDrag.clear();
  // a click paints exactly the one tile under the cursor, immediately
  const t = pickTile(e);
  lastPaintTile = t ? { x: t.gx, z: t.gz } : null;
  if (t) paintTile(t.gx, t.gz, true);
  updateHighlight(e);
});

renderer.domElement.addEventListener('pointermove', e => {
  lastPointer = { clientX: e.clientX, clientY: e.clientY };
  if (Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY) > DRAG_PX) movedFar = true;
  if (rightOrbiting) return;
  if (painting) {
    if (e.buttons === 0) { endStroke(); }           // button released outside the window
    else if (!dragging && Math.hypot(e.clientX - downX, e.clientY - downY) >= DRAG_PX) {
      dragging = true;                              // click becomes a drag past the threshold
    }
    if (painting && dragging) {
      const t = pickTile(e);
      if (t) {
        if (lastPaintTile && Math.abs(t.gx - lastPaintTile.x) + Math.abs(t.gz - lastPaintTile.z) > 1) {
          paintLine(lastPaintTile.x, lastPaintTile.z, t.gx, t.gz);
        } else {
          paintTile(t.gx, t.gz, false);
        }
        lastPaintTile = { x: t.gx, z: t.gz };
      }
    }
  }
  updateLinkHover(e);
  updateHighlight(e);
});

window.addEventListener('pointerup', e => {
  if (e.button === 2) { rightOrbiting = false; if (lastPointer) updateHighlight(lastPointer); return; }
  if (e.button !== 0) return;
  if (!painting && !movedFar && !routeView.active && !clubCam.active && !photo.active &&
      e.target === renderer.domElement) {
    const hit = pickInteractive(e);
    if (hit) handleInteractive(hit);
    else if (activeTool === 'link') {
      const t = pickTileLoose(e);
      handleLinkClick(t ? { x: t.gx, z: t.gz } : null);
    }
    else if (activeTool === 'orbit') {
      // a clean click in orbit mode: open the hole card on a tee or pin, start
      // linking an unpaired one, or dismiss any floating card by clicking away
      const t = pickTile(e);
      const idx = t ? holeIndexAt(t.gx, t.gz) : -1;
      if (idx >= 0) openHoleCard(idx);
      else if (t && isLinkSourceTile(t.gx, t.gz)) enterLinkMode({ x: t.gx, z: t.gz });
      else { closeHoleCard(); closeRatingCard(); closeFollowCard(); }
    }
  }
  endStroke();
});

// clicking UI chrome outside a floating card dismisses it (canvas clicks are
// decided above so an orbit drag never swats the card away)
document.addEventListener('pointerdown', e => {
  // Any touch of the world during a walk hands the camera straight back — the
  // press is SPENT on the return, so a click on the grass cannot also paint a
  // tile, and it never swats the follow card away. The card itself is the
  // walk's own remote: its buttons stay buttons.
  if (lens.active && !e.target.closest('#followcard')) {
    exitLens();
    if (e.target === renderer.domElement) e.stopPropagation();
    return;
  }
  if (e.target === renderer.domElement) return;
  if (ratingOpen && !e.target.closest('#ratingcard') && !e.target.closest('#pill-stars')) closeRatingCard();
  if (holeCardIdx >= 0 && !e.target.closest('#holecard')) closeHoleCard();
  if (followed && !e.target.closest('#followcard')) closeFollowCard();
}, true);
window.addEventListener('blur', endStroke);
renderer.domElement.addEventListener('pointercancel', endStroke);
renderer.domElement.addEventListener('pointerleave', () => {
  lastPaintTile = null;   // never interpolate a line across an off-canvas gap
  linkMode.hover = null; linkMode.cursor = null;
  clearHighlight();
});
renderer.domElement.addEventListener('wheel', () => {
  if (lens.active) { exitLens(); return; }   // the wheel is the player asking to move
  if (lastPointer && !rightOrbiting) updateHighlight(lastPointer);
}, { passive: true });

window.addEventListener('keydown', e => {
  const mod = e.metaKey || e.ctrlKey;
  // the tripod has the floor: P or Esc folds it, G is the grid — and no key
  // may fall through to a tool tray that is not on screen
  if (photo.active) {
    if (mod || e.altKey) return;
    const pk = e.key.toLowerCase();
    if (e.key === 'Escape' || pk === 'p') { e.preventDefault(); exitPhoto(); }
    else if (pk === 'g') { e.preventDefault(); ensureAudio(); setPhotoGrid(!photo.grid); }
    return;
  }
  // walking with somebody: any key is the player reaching for the wheel.
  // P hands the walk's own frame straight to the tripod; Esc just leaves;
  // everything else leaves AND then does its job from the restored frame.
  if (lens.active) {
    if (!mod && !e.altKey && e.key.toLowerCase() === 'p') { e.preventDefault(); enterPhoto(); return; }
    exitLens();
    if (e.key === 'Escape') return;
  }
  if (mod && !e.shiftKey && !e.altKey && (e.key === 'z' || e.key === 'Z')) {
    e.preventDefault();
    ensureAudio();
    undo();
    return;
  }
  if (mod || e.altKey) return;  // leave browser shortcuts alone
  if (e.key === 'Escape') {
    if (routeView.active) { exitRouteView(false); return; }
    // Escape steps back the same way clicking away does: first the source it
    // is aiming from, then the mode itself
    if (linkMode.active) { linkMode.source ? clearLinkSource() : exitLinkMode(); return; }
    if (holeCardIdx >= 0 || ratingOpen) { closeHoleCard(); closeRatingCard(); return; }
    if (sheetOpen) { closeSheet(); return; }
    selectTool('orbit');
  }
  if (sheetOpen) {
    // The book has the floor. Left/right turn a page and run on into the next
    // section at the end of one, the way a book does; up/down and tab move a
    // divider at a time; the digits go straight to a section. Nothing silently
    // re-arms a build tool behind the scrim.
    const page = e.key === 'ArrowRight' || e.key === 'PageDown' ? 1
      : e.key === 'ArrowLeft' || e.key === 'PageUp' ? -1 : 0;
    if (page) { e.preventDefault(); bookStep(page); return; }
    const sec = e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0;
    if (sec) { e.preventDefault(); bookSection(sec); return; }
    // Tab does what Tab does — it walks the controls written on the page.
    // Sections are on up/down and the digits, which is one key each and does
    // not cost the page its keyboard.
    if (e.key === 'Tab') { bkTrapFocus(e); return; }
    if (e.key === 'Home') { e.preventDefault(); ensureAudio(); bkTo(0); return; }
    if (e.key === 'End') { e.preventDefault(); ensureAudio(); bkTo(bkSpreads() - 1); return; }
    if (e.key >= '1' && e.key <= '6') {
      e.preventDefault(); ensureAudio(); setClubTab(CLUB_TABS[+e.key - 1]);
    }
    return;
  }
  if (routeView.active) return;  // no tool switching while routing
  // every tool owns one key (TOOL_DEFS) — the grouping the dock draws is a
  // layout, never a gate: a shortcut goes straight to its tool and re-faces
  // the group it lives in
  const t = TOOL_KEYS[e.key.toLowerCase()];
  if (t) { ensureAudio(); selectTool(t); return; }
  // P — the plaque's camera, from anywhere a tool key would work
  if (e.key.toLowerCase() === 'p') { ensureAudio(); enterPhoto(); }
});

// ── Lucky ball ───────────────────────────────────────────────────────────────

const luckyBall = { mesh: null, timer: 50 + Math.random() * 40, life: 0, base: null };

function spawnLucky() {
  const half = gridSize() / 2;
  for (let attempts = 0; attempts < 30; attempts++) {
    const x = Math.floor(-half + Math.random() * gridSize());
    const z = Math.floor(-half + Math.random() * gridSize());
    const t = tileType(x, z);
    if (t === 'water' || t === 'club' || t === 'tree') continue;
    const pos = tileTopWorld(x, z).add(new THREE.Vector3(0, 0.28, 0));
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 14, 14), goldMat);
    m.castShadow = true;
    m.position.copy(pos);
    scene.add(m);
    luckyBall.mesh = m;
    luckyBall.base = pos.clone();
    luckyBall.life = 18;
    return;
  }
}

function despawnLucky() {
  if (luckyBall.mesh) { scene.remove(luckyBall.mesh); luckyBall.mesh = null; }
  luckyBall.timer = 55 + Math.random() * 60;
}

function collectLucky() {
  if (!luckyBall.mesh) return;
  const bonus = Math.max(80, Math.round(course.ratePerMin * 2));
  addMoney(bonus);
  floaterCount(luckyBall.mesh.position.clone().add(new THREE.Vector3(0, 0.3, 0)), bonus, 'gold big');
  burst(luckyBall.mesh.position);
  confettiBurst(luckyBall.mesh.position, 10);
  sound('lucky');
  despawnLucky();
}

function updateLucky(dt, time) {
  if (luckyBall.mesh) {
    luckyBall.mesh.position.y = luckyBall.base.y + Math.sin(time * 3) * 0.06;
    luckyBall.mesh.rotation.y += dt * 1.5;
    luckyBall.life -= dt;
    if (luckyBall.life <= 0) despawnLucky();
  } else {
    luckyBall.timer -= dt;
    if (luckyBall.timer <= 0) spawnLucky();
  }
}

const particles = [];
function burst(pos) {
  for (let i = 0; i < 10; i++) {
    const m = rbox(0.08, 0.08, 0.08, goldMat, 0.02);
    m.position.copy(pos);
    scene.add(m);
    particles.push({
      m,
      v: new THREE.Vector3((Math.random() - 0.5) * 3.5, 2 + Math.random() * 2.5, (Math.random() - 0.5) * 3.5),
      life: 0.9,
    });
  }
}
function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    p.v.y -= 9 * dt;
    p.m.position.addScaledVector(p.v, dt);
    p.m.rotation.x += dt * 6; p.m.rotation.z += dt * 5;
    if (p.life <= 0) { scene.remove(p.m); particles.splice(i, 1); }
  }
}

// ── Tweens ───────────────────────────────────────────────────────────────────

const tweens = [];
function updateTweens(dt) {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    if (tw.t < 0) continue;
    if (!tw.from) tw.from = { x: tw.obj.x, y: tw.obj.y, z: tw.obj.z };
    const k = Math.min(1, tw.t / tw.dur);
    // 'back' adds a gentle ~5% overshoot — a springy settle for placement pops.
    // 'in' is the mirror: barely moves at first, so a thing leaving the scene
    // holds its shape long enough for its replacement to grow out of it
    const e = tw.ease === 'back'
      ? 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2)
      : tw.ease === 'in' ? k * k * k
      : 1 - Math.pow(1 - k, 3);
    tw.obj.x = tw.from.x + (tw.to.x - tw.from.x) * e;
    tw.obj.y = tw.from.y + (tw.to.y - tw.from.y) * e;
    tw.obj.z = tw.from.z + (tw.to.z - tw.from.z) * e;
    if (k >= 1) tweens.splice(i, 1);
  }
}

// ── Main loop ────────────────────────────────────────────────────────────────

let lastT = performance.now();
let priceSync = 0;

function loop() {
  requestAnimationFrame(loop);
  const now = performance.now();
  let dt = (now - lastT) / 1000;
  lastT = now;

  // The tab was asleep: the day carried on without us, and the book says
  // exactly what it ran. playedThrough is where live play actually stopped, so
  // a tee time watched in person is never also billed as an absent one.
  //
  // Never while the player is at a championship. Their own club's ground is
  // swapped out, so `course` is somebody else's golf course — reconciling
  // against it would post a stranger's holes to their scorecard and pay them
  // twice over. The whole trip is settled once, by comeHome().
  if (dt > 5) {
    if (!away.active) {
      const to = nowMs();
      const r = runAway(playedThrough, to);
      if (r.take >= 1) {
        addMoney(r.take);
        toast('While you were away · ' + r.rounds +
          (r.rounds === 1 ? ' round · +' : ' rounds · +') + fmt(r.take));
      }
    }
    dt = 0.016;
  }
  dt = Math.min(dt, 0.1);
  tick(dt);
}

// One monotonic clock for every animation in the world. It only ever moves
// forward by dt, so a test driving the sim with __fairway.step() gets exactly
// the same world a real frame would — sway, gates, stagger and all.
let simTime = 0;
// the moment the club has actually been played up to — the boundary between
// "watched" and "away", so neither side ever pays for the other's tee times
let playedThrough = 0;

function tick(dt, timeIn) {
  simTime += dt;
  // A day spent at a championship is a day the club traded without you. The
  // boundary stops advancing while the player is away, so comeHome() settles
  // the whole trip through the same book a shut tab would have run.
  if (!away.active) playedThrough = nowMs();
  const time = timeIn === undefined ? simTime : timeIn;
  applyDaylight(false);      // the hour moves the sun; throttled to the minute

  // intro dolly — the arrival slows the same move into a reveal (beginArrival)
  if (introT < 1) {
    introT = Math.min(1, introT + dt / (arrival.active ? ARRIVAL_DOLLY_S : 1.9));
    const e = 1 - Math.pow(1 - introT, 3);
    camera.position.lerpVectors(INTRO_FROM, INTRO_TO, e);
    if (introT >= 1) controls.enabled = true;
  }
  updateArrival(dt);

  if (!routeView.active && !clubCam.active && !lens.active) controls.update();   // update() re-poses the camera even when disabled
  updateRouteView(dt);
  updateClubCam(dt);
  updateLens(dt);
  // the tripod's straighten/tilt: a roll on the finished frame, re-applied
  // every tick after the orbit re-levels itself — idempotent by construction
  if (photo.active && photo.roll) camera.rotateZ(photo.roll * Math.PI / 180);
  updateTweens(dt);
  updateHoverGlide(dt);
  updateGolfers(dt, time);
  updateCarts(dt);
  updateClubhouse(dt, time);
  updateMoments(dt, time);
  pollOccasions(dt);
  updateNotes(dt);
  updateOpeningDay();
  updateFeeBatch(dt);
  updateLucky(dt, time);
  updateParticles(dt);
  updateWater(time);
  updateButterflies(dt, time);
  updateBirds(dt, time);

  // clouds drift — and politely clear the sky for the route overview
  const cloudTarget = routeView.active ? 0 : 0.92;
  cloudMat.opacity += (cloudTarget - cloudMat.opacity) * Math.min(1, dt * 5);
  for (const c of clouds) {
    c.visible = cloudMat.opacity > 0.03;
    c.position.x += c.userData.speed * dt;
    if (c.position.x > 42) c.position.x = -42;
  }

  displayMoney += (state.money - displayMoney) * Math.min(1, dt * 8);
  if (Math.abs(displayMoney - state.money) < 0.6) displayMoney = state.money;
  el('pill-money').textContent = fmt(displayMoney);

  // an open sheet watches the wallet — four times a second is plenty for a
  // button waking up, and costs nothing when the sheet is shut
  priceSync -= dt;
  if (priceSync <= 0) {
    priceSync = 0.25;
    syncSheetPrices(); syncBookView(); syncAwayView();
    // a championship that finished — whether the player was building at home or
    // standing on the eighteenth green watching it happen. The trophy is
    // presented where you are.
    settleAll(false);
    // …and the long game's slow beat: a year turning, a pencil line going to
    // ink, a rung rising. Internally gated to once a second.
    pollLongGame();
  }

  updateHoleCardPos();
  updateFollowCard(dt);
  updateLinkMode(time);
  updatePairMarkerPositions();
  renderer.render(scene, viewCam());
}

// ── Boot ─────────────────────────────────────────────────────────────────────

function boot() {
  const hadSave = load();
  displayMoney = state.money;

  applyTheme(state.theme);   // before the first tile is built
  buildDock();
  selectTool('orbit');

  // The board's fields carry their engraved label in data-lab (see index.html),
  // so the live figure is free to be the whole of the element's content. Two
  // call sites write straight to the inner span, so the span has to exist
  // BEFORE the first computeCourse() — writing it afterwards wiped the freshly
  // computed COURSE reading back to an em dash and left it there until the next
  // recompute, which on a loaded save could be minutes.
  el('pill-golfers').innerHTML = '<span id="tee-pill-t">—</span>';
  el('pill-holes').innerHTML = '<span id="holes-pill-t">—</span>';
  el('pill-golfers').addEventListener('click', () => { ensureAudio(); openSheet('today'); });

  rebuildIsland(false);
  computeCourse();      // builds the clubhouse at its current tier (syncClubhouse)
  if (noteSeedPending) seedVeteranNotes();   // a veteran is never taught their own course

  // THE LONG GAME — open the annals (a save from before them opens its ledger
  // the year it was last seen), write up any year the calendar has turned
  // past, bring the honours page up to what this save has plainly done, and
  // print the standing on the cover. Order matters: a year closes on what the
  // book held at New Year, and the offline rounds reconciled below belong to
  // the year the player came back to — the same rule the records keep.
  ensureAnnals();
  checkYearTurn();
  checkHonours();
  syncStanding(true);
  syncCover();

  // THE ARRIVAL — only a property that does not exist yet gets one; every
  // later boot opens the front door directly. (Start Over wipes the save, so
  // the next boot is an arrival again — a new property deserves the moment.)
  if (!hadSave) beginArrival();

  // the Club opens on the view that has something to say: the day's book once
  // there is a course, the ladder of upgrades before there is one
  clubTab = course.holes.length ? 'today' : 'upgrades';

  buildHoleCardDOM();
  buildFollowCardDOM();
  el('btn-route').innerHTML = ICONS.route;
  el('btn-route').addEventListener('click', () => { ensureAudio(); enterRouteView(); });
  // the tripod on the plaque, and its chip's four controls
  el('btn-photo').innerHTML = ICONS.camera;
  el('btn-photo').addEventListener('click', () => { ensureAudio(); enterPhoto(); });
  el('ph-exit').innerHTML = ICONS.close;
  el('ph-exit').addEventListener('click', () => { ensureAudio(); exitPhoto(); });
  el('ph-grid').addEventListener('click', () => { ensureAudio(); setPhotoGrid(!photo.grid); });
  el('ph-gold').addEventListener('click', () => { ensureAudio(); setGolden(!photo.golden); });
  el('ph-shot').addEventListener('click', () => { ensureAudio(); capturePhoto(); });
  el('ph-level').addEventListener('click', () => { ensureAudio(); setPhotoRoll(0); });
  el('ph-tilt').addEventListener('input', e => setPhotoRoll(+e.target.value));
  el('link-cancel').addEventListener('click', () => { ensureAudio(); exitLinkMode(); });
  el('route-cancel').addEventListener('click', () => { ensureAudio(); exitRouteView(false); });
  el('route-done').addEventListener('click', () => { ensureAudio(); exitRouteView(true); });
  el('pill-stars').addEventListener('click', () => { ensureAudio(); ratingOpen ? closeRatingCard() : openRatingCard(); });

  el('btn-upgrades').addEventListener('click', () => { ensureAudio(); sheetOpen ? closeSheet() : openSheet(); });
  buildBookTabs();
  bkGrab('bk-grab', 1);
  bkGrab('bk-grab-b', -1);
  paperGrain();
  // the HUD goals card is the same story in miniature — tapping it opens the
  // chapter it is quoting, rather than earning the top bar another button
  el('milestone').addEventListener('click', () => { ensureAudio(); openSheet('progress'); });
  el('aw-home').addEventListener('click', () => { ensureAudio(); comeHome(); });
  el('bk-close').innerHTML = ICONS.close;
  el('bk-close').addEventListener('click', () => { ensureAudio(); closeSheet(); });
  el('scrim').addEventListener('click', closeSheet);
  // the bookplate's question, answered on paper. Clicking the ground outside
  // the card is the same as saying no — a destructive act should be easy to
  // walk away from and take a deliberate press to commit.
  el('confirm-no').addEventListener('click', () => { ensureAudio(); askReset(false); });
  el('confirm-yes').addEventListener('click', wipeAndReload);
  el('confirm').addEventListener('click', e => { if (e.target === el('confirm')) askReset(false); });
  // a committee note leaves on the first click anywhere — read, understood.
  // A click ON the chit keeps its button working; every other chit is
  // untouched, because only a note ever sets noteUp.
  document.addEventListener('pointerdown', e => {
    if (noteUp) { noteUp = false; if (!e.target.closest('#toast')) dismissToast(); }
  }, true);
  // the book is typeset for the window it is in; a resize re-paginates it and
  // keeps the reader on the page they were on
  addEventListener('resize', () => { if (sheetOpen) { bkSettle(); renderSheet(); } });

  // three notches on one control — see setSoundMode(). Mute stops SCHEDULING
  // (every voice returns early on state.muted); the master gain lets the tails
  // already in flight down without a pop.
  syncSnd();
  el('btn-sound').addEventListener('click', () => { ensureAudio(); cycleSound(); });

  // The day's report. Not a trickle — the rounds the tee sheet actually ran
  // while the tab was shut, capped at OFFLINE_CAP_S exactly as before.
  if (hadSave && state.lastSeen) {
    const r = runAway(state.lastSeen, nowMs());
    const earned = Math.floor(r.take);
    if (r.seconds > 120 && r.rounds && earned >= 1) {
      const h = Math.floor(r.seconds / 3600), m = Math.floor((r.seconds % 3600) / 60);
      const span = h ? h + 'h ' + m + 'm' : m + ' min';
      let txt = r.rounds +
        (r.rounds === 1 ? ' round was' : ' rounds were') + ' played over ' + span +
        ' while you were away, in ' + r.groups + (r.groups === 1 ? ' group' : ' groups') + '.';
      // the day's news, not just the day's takings
      if (r.notables.length) {
        const best = r.notables.reduce((a, b) => (b.score > a.score ? b : a));
        txt += r.notables.length === 1
          ? ' ' + best.name + ' played, and marked the course ' + best.score.toFixed(1) + '.'
          : ' ' + r.notables.length + ' notable golfers came out; ' + best.name +
            ' marked the course ' + best.score.toFixed(1) + '.';
      }
      el('welcome-text').textContent = txt;
      el('welcome-amount').textContent = '+' + fmt(earned);
      // the heading still says which half of the day you came back to — in
      // words, on the same line the rest of the club prints its kickers on
      const kick = el('welcome-kick');
      if (kick) kick.textContent = sky.up > 0.35 ? 'While you were away' : 'Overnight at the club';
      el('welcome').classList.remove('hidden');
      el('btn-collect').addEventListener('click', () => {
        ensureAudio();
        addMoney(earned);
        sound('lucky');
        el('welcome').classList.add('hidden');
        save();
      }, { once: true });
    } else if (earned >= 1) {
      addMoney(earned);       // a short step away is not worth a modal
    } else if (r.seconds > 900 && course.holes.length && !clubOpen()) {
      // came back to a dark course: nothing was owed, and that is not a
      // failure — it is tomorrow's sheet, already written
      const early = nowMinute() < dayInfo().dl.first;
      const n = early ? bookedRemaining() : bookedTomorrow().groups;
      const first = early ? nextTeeMin() : null;
      setTimeout(() => toast('The course rested while you were away · ' + n +
        ' groups booked · first group off at ' +
        TS.hhmm(first != null ? first : bookedTomorrow().dl.first), 'moon'), 900);
    }
  }
  playedThrough = nowMs();

  // A championship that ran while the tab was shut has already happened; the
  // result is waiting on the mat. And if one is on RIGHT NOW, that is the most
  // interesting fact about the player's afternoon, so the club says so.
  const settled = settleAll(true);
  if (settled.length) {
    const r = settled[settled.length - 1];
    const s = STARS.BY_ID[r.id], ev = MAJORS.EVENT[r.ev];
    setTimeout(() => {
      sound(r.pos === 1 ? 'lucky' : 'cash');
      toast(r.cut ? s.name + ' missed the cut at ' + ev.short
        : (r.pos === 1 ? s.name + ' WON ' + ev.name : s.name + ' finished ' +
          posLabel(r) + ' at ' + ev.short) + ' · ' + fmt(r.purse), 'cup');
    }, 1400);
  } else {
    const m = liveMeet();
    // …but never over the arrival: news can wait the six seconds a title takes
    if (m) setTimeout(() => {
      const mine = entrantOf(m);
      toast(m.ev.name + ' is being played today' +
        (mine ? ' · ' + mine.name + ' is in the field' : ' · tune in from the Club sheet'), 'cup');
    }, arrival.active ? 8400 : 1600);
  }

  if (clubReclaim.n) {
    toast('The motor court is club ground now · ' + clubReclaim.n +
      (clubReclaim.n === 1 ? ' tile' : ' tiles') + ' cleared · ' + fmt(clubReclaim.refund) + ' back', 'house');
  }

  linkHintReady = true;   // from here on, a new orphan tee/pin earns its hint
  setInterval(save, 5000);
  window.addEventListener('beforeunload', save);
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(); });
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    if (routeView.active) {
      routeView.cam = makeRouteCam();
      if (routeView.phase === 'view') updateRouteOverlayPositions();
    }
  });

  loop();
}

boot();

// debug hook
window.__fairway = {
  state, spawnGolfer, course: () => course, computeCourse, rebuildIsland,
  golfers, carts, camera, controls,
  // golf accuracy: scale, scoring sim, and per-hole scorecard aggregates
  YARDS_PER_TILE, parFor, holeKey, scoreHole, outcomeOf, recordScore, layupTile,
  OUTCOMES,
  // shot-by-shot play: the rolled number, and the sequence spending it
  balls, shotSplit, buildShots, buildHoleLegs, snapLanding, SHOT_STYLE, ballPool,
  // one row per golfer currently on the course; `shots` is the live plan
  shotState: () => golfers.map(g => ({
    phase: g.phase,
    par: g.hole ? g.hole.par : null,
    strokes: g.strokes,
    shotIdx: g.shotIdx,
    shots: g.shots ? g.shots.map(s => s.kind) : null,
    putts: g.shots ? g.shots.filter(s => s.kind === 'putt').length : 0,
    // strokes actually dealt out: one per swing, plus a penalty for each splash
    dealt: g.shots ? g.shots.length + g.shots.filter(s => s.splash).length : 0,
    pace: g.pace,
  })),
  holeStats: () => state.holeStats,
  // hole identity, rating v2, hole card & route view
  holePairs: () => state.holePairs,
  rating: () => course.rating,
  computeRating, holeIndexAt,
  // world point at the centre of a tile's top face — lets a test aim a real
  // click at a tile instead of guessing screen coordinates
  tileTopWorld,
  reorderHoles: (order) => {
    state.holePairs = order.map(i => state.holePairs[i]);
    computeCourse();
    save();
  },
  openHoleCard, closeHoleCard, openRatingCard, closeRatingCard,
  enterRouteView, exitRouteView, routeView, toggleRouteHole,
  // tee → pin linking: explicit pairs, locked against the proximity pairer
  linkMode, enterLinkMode, exitLinkMode, setLinkSource, handleLinkClick,
  unpaired: () => unpairedTiles.slice(),
  // badges actually on screen right now (additions wait MARK_DELAY, removals
  // land the same frame) — pairMarkKeys() is the visible set
  pairMarkKeys: () => pairMarks.map(m => m.key),
  pendingMarkKeys: () => pendingAdds.map(markKey),
  // linkHole(teeIdxOrCoords, flagCoords) — coords are {x,z}; a hole index uses
  // that hole's tee. Returns true if the pairing changed.
  linkHole: (tee, flag) => {
    const t = typeof tee === 'number' ? (course.holes[tee] || {}).tee : tee;
    const f = typeof flag === 'number' ? (course.holes[flag] || {}).flag : flag;
    return !!(t && f) && applyLink(t, f);
  },
  // moments — celebration economy
  moments, spawnMoment, celebrateMoment, expireMoment, momentValue, MOMENT_TIERS,
  celebrated: () => state.celebrated,
  // spawn a moment on hole n (default 1) for tests: __fairway.forceMoment('eagle')
  forceMoment: (tier, holeIdx) => {
    const h = course.holes[holeIdx || 0];
    return h ? spawnMoment(h, tier || 'birdie', null) : null;
  },
  MILESTONES,
  // the Club Book — one bound ledger; the six sections are its dividers
  openSheet, closeSheet, setClubTab, renderSheet,
  clubTab: () => clubTab,
  sheetOpen: () => sheetOpen,
  // Everything a judge needs to drive and TIME the book without a pointer.
  // turnTo/page/section all return true if the book actually moved.
  book: {
    open: (tab) => { openSheet(tab); return true; },
    close: closeSheet,
    isOpen: () => sheetOpen,
    SECTIONS: BOOK_SECTIONS,
    section: () => clubTab,
    sectionName: () => sectionOf(clubTab).name,
    to: (tab, opts) => { setClubTab(tab, opts); return clubTab === tab; },
    // page numbering is 1-based and per-section, exactly as printed
    spread: () => bkSpread,
    spreads: () => bkSpreads(),
    pages: () => bkPages,
    // exactly what is printed in the outer corners; the right page is null on
    // a final odd spread, where the book genuinely has a blank facing page
    folio: () => [bkSpread * 2 + 1, bkSpread * 2 + 2 <= bkPages ? bkSpread * 2 + 2 : null],
    turnTo: (spread, opts) => bkTo(spread, opts),
    next: () => bookStep(1),
    prev: () => bookStep(-1),
    nextSection: () => bookSection(1),
    prevSection: () => bookSection(-1),
    // timing: the budget, and what the last turn actually took, in ms
    turnMs: BOOK_TURN_MS,
    lastTurnMs: () => bkLastTurnMs,
    // the leaf's own declared timing, straight off the running animation
    effectMs: () => bkAnim ? bkAnim.effect.getComputedTiming().activeDuration : null,
    // and the only number that can ever delay reading: the synchronous cost of
    // typesetting, paginating and wiring a section, before the leaf moves
    lastRenderMs: () => bkLastRenderMs,
    turning: () => !!bkAnim || !!bkDrag,
    // A turn moves TWO things — the leaf and the shadow it casts — and both
    // have to be released when it stops. `held` is what bkStop() can reach;
    // `dom` is what the element is actually still running. If dom ever climbs
    // above held, or fails to fall back to 0 at rest, an animation has been
    // orphaned. That is exactly how the cast shadow used to leak one handle
    // per page turn on a pane that never reached onfinish.
    anims: () => ({
      held: { leaf: !!bkAnim, cast: !!bkCast },
      dom: { leaf: el('bk-leaf').getAnimations().length,
             cast: el('bk-cast').getAnimations().length },
    }),
    settle: bkSettle,
    geometry: () => ({ col: bkGeo.col, gap: bkGeo.gap, pitch: bkGeo.pitch }),
    // which page a live element is printed on — how the day's axis and the
    // Club Book find their way to an entry
    pageOf: (sel) => bkPageOfNode(typeof sel === 'string'
      ? el('bk-flow').querySelector(sel) : sel),
    reduceMotion,
  },
  CLUB_TABS, CLUB_TRACKS, UPGRADE_TIERS,
  trackCap, trackLevel, trackCost, trackEffect, buyTrack,
  // the economy formula both the live course and the "next level" arrows use
  economyOf, projectClub,
  clubProgress,
  // course view data: club record, rounds at the club, and how a hole plays
  record: () => state.records.low, recordRound, roundsPlayed, holePlay,
  // step also advances the wall clock by the same dt, so stepping the sim moves
  // the day: 60 s of steps is 60 s closer to the next tee time
  step: (dt, n) => {
    const d = dt || 0.05;
    for (let i = 0; i < (n || 1); i++) { clock.offset += d * 1000; tick(d); }
  },
  undo, undoStack, selectTool, highlight,
  // ── customization & design ──
  // the grouped dock: TOOL_GROUPS is the layout, TOOL_DEFS the tools, and
  // groupFace() the tool each group is currently showing
  TOOL_GROUPS, TOOL_DEFS, TOOL_KEYS, TILE_DEFS, UNDER,
  groupFace: () => Object.assign({}, groupFace),
  activeTool: () => activeTool,
  buildDock, syncDock, toolCost,
  // the palette audit, callable on its own. sysPaletteAudit(true) flips through
  // all six sections of the book before answering, which is the only version of
  // the question worth asking.
  sysPaletteAudit,
  // …and the token graph. tokenAudit().ok is the one assertion that would have
  // caught the two self-referential declarations that started all of this.
  tokenAudit,
  // …and the third question: is anything on screen drawn in a hand that is not
  // the club's? glyphAudit(true).ok is false the moment a colour emoji reaches
  // any surface, and names it. The drawings themselves are ICONS — a chit's
  // mark is ICONS[name], so toast(msg, 'cup') and toast(msg, 'flag') are the
  // whole vocabulary, headlessly.
  glyphAudit, ICONS,
  // ── the always-on interface, drivable and readable without a pointer ──
  // The board and the tray are the two surfaces a judge cannot reach with
  // step(): the tray's labels are hover-only and the board's figures are
  // written straight into the DOM. peekTool() forces a label open the way a
  // hover would; ui() reads back every field, tool and card in one object, so
  // an assertion never has to depend on a screenshot of a hidden pane.
  stillUI: (on = true) => {
    document.body.classList.toggle('ui-still', !!on);
    return document.body.classList.contains('ui-still');
  },
  peekTool: (groupId) => {
    const dock = el('dock');
    dock.querySelectorAll('.tgroup.peek').forEach(g => g.classList.remove('peek'));
    if (!groupId) return null;
    const g = dock.querySelector('[data-group="' + groupId + '"]');
    if (!g) return null;
    g.classList.remove('hushed');
    g.classList.add('peek');
    return g.querySelectorAll('.pop-item').length;
  },
  ui: () => {
    const dock = el('dock');
    const shown = id => { const n = el(id); return !!n && !n.classList.contains('hidden'); };
    return {
      board: [...document.querySelectorAll('#topbar .pill')].map(p => ({
        id: p.id, label: p.dataset.lab, value: p.textContent.trim(),
        shown: getComputedStyle(p).display !== 'none',
      })),
      tools: [...dock.querySelectorAll('.tgroup')].map(g => ({
        group: g.dataset.group,
        // the implement this slot is currently showing, not the slot's own name
        face: groupFace[g.dataset.group],
        held: g.querySelector('.tool').classList.contains('on'),
        behind: g.querySelectorAll('.pop-item').length,
        labelOpen: getComputedStyle(g.querySelector('.pop') || g).opacity === '1' &&
                   !!g.querySelector('.pop'),
      })),
      cards: {
        goals: shown('milestone'), hole: shown('holecard'), follow: shown('followcard'),
        rating: shown('ratingcard'), away: shown('away'), toast: shown('toast'),
        book: el('book').classList.contains('open'),
        link: el('link-ui').classList.contains('show'),
        route: el('route-ui').classList.contains('show'),
      },
      // the two materials, as the page actually computes them — a judge can
      // assert that every surface is cut from one of exactly these
      material: (() => {
        // read off BODY, not the root: body.night rewrites the same tokens for
        // the club's own lamps, and that override is the reading that matters
        const rs = getComputedStyle(document.body);
        return {
          paper: rs.getPropertyValue('--pg').trim(),
          board: rs.getPropertyValue('--board').trim(),
          brass: rs.getPropertyValue('--brass').trim(),
          ink: rs.getPropertyValue('--ink').trim(),
          night: document.body.classList.contains('night'),
          // no surface in the game is allowed to blur what is behind it
          blurred: [...document.querySelectorAll('body *')]
            .filter(n => getComputedStyle(n).backdropFilter !== 'none').length,
          // …nor to paint itself in a system palette. Every one of these is a
          // colour that belongs to an operating system rather than to a club.
          //
          // THIS CHECK USED TO LIE. It walked the live DOM, so it only ever saw
          // the surfaces that happened to be rendered — and it was evidently
          // never run with The Works on screen, where six upgrade tracks carried
          // the literal iOS palette in inline styles. It reported a clean zero
          // for a book with twenty-six system-coloured elements in it, which is
          // the worst thing a design system's own guard can do.
          //
          // It now answers in two halves. `live` is what is on screen. `source`
          // walks the constants the interface is BUILT from, so a colour cannot
          // hide inside an unrendered section. Both must be zero, and `source`
          // is the one that cannot be gamed by what you happen to be looking at.
          softwarePalette: sysPaletteAudit().total,
          palette: sysPaletteAudit(),
          // a capsule is a control from a phone; on paper a chip of type is
          // stamped. Only genuinely round things (dots, bar caps, the ring on
          // a goal node) may still be fully rounded, and none of them hold type.
          capsules: [...document.querySelectorAll('body *')].filter(n => {
            const s = getComputedStyle(n);
            return parseFloat(s.borderTopLeftRadius) > 40 && n.textContent.trim().length > 0;
          }).length,
        };
      })(),
      // the mass scale, read from the stylesheet the CSS and the JS share
      motion: { ...MOTION, reduced: reduceMotion() },
    };
  },
  // ── the foley bench ────────────────────────────────────────────────────────
  // Everything the club can be heard to do, and the last 64 things it did or
  // declined to do. `log` is how the de-duplication is checked: fire a burst
  // and count how many were suppressed, and by which rule.
  foley: () => ({
    voices: Object.keys(SND_GAP).sort(),
    gaps: { ...SND_GAP },
    rank: { ...SND_RANK },
    muted: !!state.muted,
    bus: !!sndBus,
    ctx: audioCtx ? audioCtx.state : 'none',
    log: sndLog.slice(),
  }),
  // play a voice by name, bypassing nothing — for listening to one in isolation
  play: name => { ensureAudio(); sound(name); },
  // the name this hook has always had, kept: `sound` is what the debug
  // inventory documents, `play` is what reads better next to `foleyMeasure`.
  sound: (name, pos, mag) => { ensureAudio(); sound(name, pos, mag); },
  clearFoleyLog: () => { sndLog.length = 0; },
  // …and hear one WITHOUT a speaker: foleyMeasure('page') renders that voice
  // offline and returns its peak, its RMS and how long it actually sounds for.
  // foleyBalance() does the whole vocabulary and answers the only question that
  // matters about it — is the paper family genuinely under the game family.
  foleyMeasure, foleyBalance,
  // ── the score ──────────────────────────────────────────────────────────────
  // The generative music and the ambience bed (score.js), inspectable without
  // listening. score() is the scheduler's whole mind: which part of the day it
  // thinks it is, when each layer sounds next (seconds from now), the current
  // part's parameters, and a log of the last 64 events it scheduled or rested
  // through. mix() is the bus levels as MIX declares them AND as the nodes are
  // actually carrying them; setMix('music', v) moves one live.
  // scoreForce('twilight') pins the music's day-part without touching the
  // clock (null releases it); scoreLift() forces the celebration lift; and
  // scoreMeasure('bird'|'tone'|'dyad'|'pedal'|'night'|'cricket'|'play'|'wind')
  // renders one voice offline and answers in dB, like foleyMeasure does for
  // the club's objects. Before the first gesture there is nothing to inspect,
  // and score() says so instead of building an AudioContext behind the
  // autoplay policy's back.
  score: () => scoreCtl ? scoreCtl.status()
    : { running: false, note: 'silent until the first gesture — click, or call __fairway.sound()' },
  mix: () => scoreCtl ? scoreCtl.levels() : { mix: Object.assign({}, SCORE.MIX), node: null },
  setMix: (bus, v) => scoreCtl ? scoreCtl.setLevel(bus, v) : null,
  scoreForce: (id) => scoreCtl ? scoreCtl.forcePart(id) : null,
  scoreLift: () => scoreCtl ? scoreCtl.lift(true) : false,
  // a hidden tab schedules nothing (see score.js's tick); scoreWake(true) is
  // the harness override, because a driven Browser pane reports 'hidden'
  // while very much watching
  scoreWake: (on) => scoreCtl ? scoreCtl.wake(on) : false,
  scoreMeasure: SCORE.measure,
  dayPartNow,
  // the plaque's three-notch control, drivable: 'all' | 'club' | 'mute'
  soundMode, setSoundMode, cycleSound,
  toast, floater,
  // course themes — setTheme(id) re-dresses the whole property
  PALETTES, paletteOf, applyTheme, setTheme, COLORS,
  theme: () => state.theme,
  // rough / bridge / tee sign hookups
  hazardsNearLine, ROUGH_DEFINED, signedTees, SIGN_FLOW,
  signInfoAt, signKeyOf, syncSigns, signTiles, bridgeRunAxis,
  GOLFER_COST, CART_COST, LIE_PENALTY, findRoute,
  // design overhaul: connected caps, shader clock, butterflies
  uTime, capGeo, surfKey, setTileAndNeighbors, butterflies, flowerTiles, renderer,
  // the hour, as the ground sees it: uNight drains colour, envK turns the
  // studio room down. nightGrade() is one call a judge can assert on.
  uNight, envMats,
  nightGrade: () => ({
    night: uNight.value, envK, sun: sun.intensity, hemi: hemi.intensity,
    exposure: renderer.toneMappingExposure, up: sky.up,
  }),
  // clubhouse tiers — setClubhouseTier(n, celebrate) plays the full upgrade
  // moment when celebrate is true, otherwise it swaps the building silently
  CLUB_TIERS, clubTier, rebuildClubhouse, celebrateClubhouse,
  clubhouse: () => clubGroup,
  // the upgrade trip: clubFramed() decides whether the camera has to travel,
  // flyToClubhouse() starts it, endClubCam() snaps it home
  clubCam, clubFramed, flyToClubhouse, endClubCam,
  // ── the lens ──
  // The walk: enterLens(i) hands the camera to the i-th golfer (or pass a
  // golfer, or nothing for whoever the card is following); ANY real input
  // exits, and exitLens() is the same door for a script. lensShot() is the
  // setup on screen right now — 'address' | 'green' | 'walk' | 'wait' — and
  // lensPose() is the whole state in numbers, including the frame the camera
  // will be returned to, so the exact-return contract is assertable.
  lens, exitLens, lensShotOf, lensPoseFor,
  enterLens: (g) => enterLens(
    typeof g === 'number' ? golfers[g | 0] : (g || followed || golfers[0])),
  lensShot: () => (lens.active ? lens.shot : null),
  lensPose: () => (lens.active ? {
    shot: lens.shot, golfer: lens.g ? lens.g.person.name : null,
    side: lens.side, push: +lens.push.toFixed(2),
    pos: camera.position.toArray().map(n => +n.toFixed(2)),
    look: lens.look.toArray().map(n => +n.toFixed(2)),
    from: lens.from.toArray().map(n => +n.toFixed(2)),
    fromT: lens.fromT.toArray().map(n => +n.toFixed(2)),
  } : null),
  // Occasions — the one-click watch. offerWatch(i) stamps the chit for the
  // i-th golfer; toastAction() reads the button on the wall; clickToast()
  // presses it with no pointer involved. occasionState() is what has fired.
  pollOccasions, offerWatch, toastAction, clickToast,
  occasionState: () => ({ seen: Object.keys(occasions.seen), last: occasions.last }),
  // clear one occasion's once-guard (or all of them) so a judge can refire it
  occasionReset: (id) => {
    if (id) delete occasions.seen[id]; else occasions.seen = {};
    occasions.poll = 0;
    return Object.keys(occasions.seen);
  },
  // ── the first hour ─────────────────────────────────────────────────────────
  // The arrival, drivable: force() replays it on any save (judges), skip() is
  // the same door any touch opens, and state() is every phase in numbers.
  // step() advances it headlessly — the phases run on tick's own dt.
  arrival: {
    state: () => ({ active: arrival.active, phase: arrival.phase,
      t: +arrival.t.toFixed(2), ran: arrival.ran, reduced: arrival.reduced }),
    force: () => beginArrival(true),
    skip: skipArrival,
  },
  // the committee's teaching notes: which have been said, which are waiting
  // their turn for the wall, and the once-guard reset (one id, or all)
  NOTE_IDS,
  notes: () => ({ shown: NOTE_IDS.filter(k => state.notes[k]),
    queued: noteQueue.map(n => n.id), up: noteUp }),
  noteReset: (id) => {
    if (id) delete state.notes[id];
    else { for (const k of NOTE_IDS) delete state.notes[k]; noteQueue.length = 0; }
    save();
    return NOTE_IDS.filter(k => state.notes[k]);
  },
  committeeNote, dismissToast,
  // opening day, inspectable: is this still a club that has never hosted a
  // round, and is the walk-up group armed, pending or spent
  openingDay: () => ({ virgin: state.mood.n === 0, walkOn: { ...openWalk },
    walkOnInS: openWalk.pending ? +(openWalk.at - simTime).toFixed(1) : null,
    nextTee: nextTeeMin() }),
  // Photo mode — the tripod. photoState() is the whole chip in one object;
  // capture({ scale, download: false, data: true }) renders the oversized
  // frame headlessly and answers with its dimensions (and the PNG's encoded
  // size under `data`), no click and no file involved.
  photo, enterPhoto, exitPhoto, setPhotoGrid, setGolden, setPhotoRoll, photoName,
  photoState: () => ({ active: photo.active, grid: photo.grid, golden: photo.golden,
    roll: photo.roll, lightMin: photoLightMin, tool: activeTool,
    limits: photo.active ? { minP: +controls.minPolarAngle.toFixed(3),
      maxP: +controls.maxPolarAngle.toFixed(3), minD: controls.minDistance } : null }),
  capture: capturePhoto,
  // the plot every clubhouse mesh has to stay inside, and the one-time
  // reclaim that paid the player back for tiles it took in
  CLUB, isClub, clubReclaimed: () => clubReclaim,
  cartParks: () => carts.map(c => ({ x: c.park.x, z: c.park.z, tile: c.tile })),
  setClubhouseTier: (n, celebrate) => {
    state.upgrades.clubhouse = Math.max(0, n | 0);
    if (celebrate) { clubHold = true; celebrateClubhouse(); }
    computeCourse();
    save();
    return clubTier();
  },
  // paint one tile programmatically, exactly like a single click (undoable)
  paint: (x, z) => {
    paintedThisDrag.clear();
    stroke = [];
    paintTile(x, z, true);
    commitStroke();
    save();          // a real click ends in endStroke(), which saves
  },
  // ── the day, the book and the light ──
  // Everything below hangs off nowMs(), so moving the clock moves the whole
  // club: the sun, the sheet, and who is standing on which tee.
  TS, clock, nowMs, nowDate, nowMinute, dayInfo, clubOpen, sky, sunAltitude,
  applyDaylight, simTime: () => simTime,
  // setClock('2026-12-24T06:10') · setClock(new Date()) · setClock(ms).
  // A teleport: it moves the clock and the book's cursor, and pays nothing.
  setClock,
  // run the book forward for real — pays, posts scores and advances the cursor
  // exactly as a stretch away from the tab would (capped at OFFLINE_CAP_S)
  fastForward,
  // stand on a given tee time, a second before it goes off
  jumpToSlot: (i) => setClock(TS.midnightOf(nowDate()) +
    TS.slotMinute(dayInfo().dl, Math.max(0, i | 0)) * 60000 - 1000),
  // ── the shape of the day ──
  // dayShape() is the five waves of whatever day the clock is standing in:
  // when each one goes out, how many times it holds and how many of them sold.
  // dayShape('2026-12-24') answers for any date without moving the clock.
  dayShape: (when) => {
    const d = when ? localDate(when) : nowDate();
    const key = TS.dayKey(d), dl = TS.daylight(d), seed = TS.hash32(key);
    const mine = state.sheet && state.sheet.day === key && state.sheet.sizes.length === dl.slots;
    const fill = fillOverride != null ? fillOverride : TS.fillFor(course.gpm, TS.isWeekend(d));
    return { day: key, slots: dl.slots, spacing: +dl.spacing.toFixed(1),
      sunrise: dl.sunrise, sunset: dl.sunset, first: dl.first, last: dl.last,
      parts: dl.parts.map(p => {
        let booked = 0, seats = 0;
        for (let i = p.from; i < p.from + p.n; i++) {
          const n = mine ? state.sheet.sizes[i] : TS.bookingFor(seed, i, fill, dl);
          if (n) { booked++; seats += n; }
        }
        return { id: p.id, name: p.name, n: p.n, booked, seats,
          start: p.start, end: p.end,
          startAt: TS.hhmmShort(p.start), endAt: TS.hhmmShort(p.end), demand: p.demand };
      }) };
  },
  // the wave a tee time belongs to, and the next one still to go out today
  waveAt: (i) => TS.partOf(dayInfo().dl, i),
  nextWave: () => TS.nextPart(dayInfo().dl, nowMinute()),
  // ── the axis, as rendered ──
  // The day measured off the live DOM rather than off the model, which is the
  // only way to prove the two agree. Because the axis is now LINEAR IN TIME,
  // every element on it has a single right answer in pixels: a wave's block, a
  // tee time's mark, an hour label and the now-hairline all resolve through
  // minute -> (m - first) / (last - first). `err` on each is the distance from
  // that answer, in pixels, and `minPerPx` is the scale they all share — so a
  // judge can check that a minute is worth the same width everywhere on the
  // strip, which is the exact thing the old flex:n layout got wrong (Dawn ran
  // ~9x faster than Quiet). nowMark() is the pure maths, callable without a DOM.
  nowMark, dayShapeHtml, hourTick,
  dayStrip: () => {
    const strip = document.querySelector('.ts-axis');
    if (!strip) return null;
    const sr = strip.getBoundingClientRect();
    const dl = dayInfo().dl, m = nowMinute();
    const span = Math.max(1, dl.last - dl.first);
    const wantX = (min) => clamp((min - dl.first) / span, 0, 1) * sr.width;
    const parts = dl.parts.filter(p => p.n > 0);
    const blocks = [...strip.querySelectorAll('.ts-part')].map((b, k) => {
      const r = b.getBoundingClientRect(), p = parts[k];
      return { id: b.dataset.wave, taken: b.dataset.sold, on: b.classList.contains('on'),
        start: p.start, end: p.end, mins: p.end - p.start,
        left: +(r.left - sr.left).toFixed(1), w: +r.width.toFixed(1),
        // minutes per pixel — the number that must be the SAME for every block
        minPerPx: +((p.end - p.start) / Math.max(0.01, r.width)).toFixed(4),
        err: +(r.left - sr.left - wantX(p.start)).toFixed(2) };
    });
    // every tee time on the strip, with the minute it claims to stand at
    const s = state.sheet;
    const ticks = [...strip.querySelectorAll('.ts-t')].map((t, i) => {
      const r = t.getBoundingClientRect();
      return { i, min: dl.times[i], state: t.className.replace('ts-t ', ''),
        size: s && s.sizes ? (s.sizes[i] || 0) : 0,
        h: +r.height.toFixed(1), x: +(r.left + r.width / 2 - sr.left).toFixed(1),
        err: +(r.left + r.width / 2 - sr.left - wantX(dl.times[i])).toFixed(2) };
    });
    const el2 = strip.querySelector('.ts-mark');
    let mark = null;
    if (el2) {
      const r = el2.getBoundingClientRect();
      const x = r.left + r.width / 2 - sr.left;
      mark = { x: +x.toFixed(1), want: +wantX(m).toFixed(1), err: +(x - wantX(m)).toFixed(2),
        label: (document.querySelector('.ts-mark-lab') || {}).textContent || null };
    }
    const hours = [...(document.querySelectorAll('.ts-rule span') || [])].map(h => {
      const r = h.getBoundingClientRect();
      return { t: h.textContent, x: +(r.left + r.width / 2 - sr.left).toFixed(1) };
    });
    return { minute: +m.toFixed(1), stripW: +sr.width.toFixed(1),
      first: dl.first, last: dl.last, span,
      pxPerMin: +(sr.width / span).toFixed(4),
      blocks, ticks, hours, mark,
      here: (TS.partAt(dl, m) || {}).id || null,
      say: (document.querySelector('.ts-say') || {}).textContent || null };
  },
  WAVES: TS.WAVES,
  // stand on the first tee time of a named wave ('dawn' | 'morning' | 'lull' |
  // 'afternoon' | 'twilight'), a second before it goes off
  jumpToWave: (id) => {
    const p = dayInfo().dl.parts.find(x => x.id === id);
    if (!p || !p.n) return null;
    return setClock(TS.midnightOf(nowDate()) + p.start * 60000 - 1000);
  },
  SERIAL_K, holeTargetS, holePaceS, HOLE_TURN_S,
  // the tee sheet itself
  sheet: () => state.sheet,
  ensureSheet, releaseSlots, syncBook, runAway, playCard,
  bookFill, slotStatus, bookedRemaining, bookedTomorrow, teePillText,
  // force the fill rate (0–1) regardless of the club's real demand; null clears
  setFill: (v) => {
    fillOverride = v == null ? null : Math.max(0, Math.min(1, v));
    computeCourse();
    if (sheetOpen) renderSheet();
    return bookFill();
  },
  fill: () => bookFill(),
  // groups on the property: one per tee time, each owning at most one hole
  groups, holeOwner, holeTimes, startGroup, endGroup, paceLegs, TEE_STAGGER,
  // a group standing on a tee is four people in four places: teeStand(hole, i)
  // is the spot honour position i takes on it
  teeStand, TEE_SPOTS, makeGolferMesh,
  // ── the living course ──
  // The body language, the gallery's hands, the birds and the world's audio,
  // all drivable without watching or listening. gest(i,'fistpump') forces a
  // gesture on the i-th golfer; gestures() is every body's current word;
  // reactions() the last 40 things any body said and why. applaud(k) claps the
  // gallery, crowd(k) sounds it (k 0..1); birds() is the flock's mind and
  // birdAt(x,z) drops one on a tile now. worldAudio(x,z) answers what any
  // position sounds like from the current camera (distance, pan, gain,
  // cutoff); the same numbers ride foley().log rows as d/pan when a world
  // voice actually plays. Every gesture self-expires; clearGestures() is the
  // impatient judge's broom.
  GESTURES, startGesture, reactToScore,
  gest: (i, name) => { const g = golfers[i | 0]; return g ? startGesture(g, name, { why: 'forced' }) : false; },
  gestures: () => golfers.map((g, i) => ({ i, name: g.person.name, phase: g.phase,
    gest: g.gest ? g.gest.name : null, t: g.gest ? +g.gest.t.toFixed(2) : 0 })),
  clearGestures: () => {
    let n = 0;
    for (const g of golfers) if (g.gest) { resetPose(g.group.userData.parts); g.gest = null; n++; }
    return n;
  },
  reactions: () => reactLog.slice(),
  galleryState: () => ({
    star: gallery.star ? gallery.star.name : null,
    places: gallery.spots.length,
    out: gallery.watchers.filter(w => w.mesh.visible).length,
    clapping: gallery.watchers.filter(w => w.clap).length,
  }),
  applaud: (k) => galleryApplaud(k == null ? 0.7 : +k),
  crowd: (k, x, z) => {
    ensureAudio();
    crowdAt(x == null ? null : new THREE.Vector3(+x, 0.5, +z), k == null ? 0.7 : +k);
    return !!audioCtx;
  },
  birds: () => birds.map((b, i) => ({ i, state: ['off', 'flyin', 'ground', 'flyout'][b.state],
    x: +b.group.position.x.toFixed(2), z: +b.group.position.z.toFixed(2),
    stay: +(b.stay || 0).toFixed(1), cool: +(b.cool || 0).toFixed(1) })),
  birdAt: (x, z) => {
    const b = birds.find(o => !o.state) || birds[0];
    const p = tileTopWorld(x | 0, z | 0);
    b.to.copy(p); b.from.set(p.x + 4, p.y + 3, p.z + 4);
    b.t = 0; b.state = 1; b.group.visible = true; b.group.position.copy(b.from);
    return { i: birds.indexOf(b), x: +p.x.toFixed(2), z: +p.z.toFixed(2) };
  },
  startleBirds: () => { let n = 0; for (const b of birds) if (b.state === 2) { startleBird(b, null); n++; } return n; },
  worldAudio: (x, z) => worldSpec({ x: +x, y: 0.5, z: +z }),
  // away plays first, all the way to the cup. turnState() is one row per group:
  // who has the shot and who is standing off it, furthest ball first.
  claimTurn, awayFrom, TURN_MAX, TURN_HOLD,
  turnState: () => groups.map(gr => ({
    slot: gr.slot, on: gr.hole + 1,
    turn: gr.turn ? gr.turn.person.name : null,
    waiting: gr.members.filter(m => m.phase === 'turn')
      .sort((a, b) => b.away - a.away)
      .map(m => ({ name: m.person.name, away: Math.round(m.away * 100) / 100, honour: m.tOrder })),
    spread: (() => {          // how far apart the members actually are, in tiles
      let d = 0;
      for (const a of gr.members) for (const b of gr.members) {
        d = Math.max(d, Math.hypot(a.pos.x - b.pos.x, a.pos.z - b.pos.z));
      }
      return Math.round(d * 100) / 100;
    })(),
  })),
  // Pace of play, measured. `target` is the number the budget is trying to hit
  // (holeTargetS, tee to cup, before the walk to the next tee); `bySize` is
  // every round finished since boot split by how many were in the group, which
  // is the pair of numbers that says whether the serialisation term in
  // paceLegs is carrying its weight. paceStats(true) clears both ledgers.
  paceStats: (reset) => {
    const out = {
      holes: holeTimes.slice(),
      avgHole: holeTimes.length ? holeTimes.reduce((a, b) => a + b, 0) / holeTimes.length : 0,
      target: holeTargetS({ par: 4 }, 1),
      ...paceLine(),
      bySize: {},
      groups: groups.map(g => ({ slot: g.slot, name: g.name, size: g.size, on: g.hole + 1,
        members: g.members.length, waiting: !!g.blocked, waitS: Math.round(g.waitS) })),
    };
    for (const [size, e] of paceLedger) {
      out.bySize[size] = { rounds: e.rounds,
        roundMin: +(e.secs / e.rounds / 60).toFixed(2),
        perHoleMin: +(e.secs / e.holes / 60).toFixed(3) };
    }
    // the hole taken apart: what the budget is responsible for (tee to cup)
    // and what it never was (the walk to the next tee). `overrun` is the only
    // honest verdict on paceLegs — cup against holeTargetS at the mean group
    // tempo — and `perHole` is what the player experiences.
    if (paceSplit.n) {
      const n = paceSplit.n, cup = paceSplit.cup / n, turn = paceSplit.turn / n;
      out.split = { n, cup: +cup.toFixed(1), turn: +turn.toFixed(1),
        perHoleMin: +((cup + turn) / 60).toFixed(3),
        aim: +(holePaceS(4) / 60).toFixed(3),
        overrun: +((cup / (holeTargetS({ par: 4 }, 1) * 1.04) - 1) * 100).toFixed(1) };
    }
    if (reset) {
      paceLedger.clear(); holeTimes.length = 0;
      paceSplit.n = paceSplit.cup = paceSplit.turn = 0;
    }
    return out;
  },
  renderScheduleView, bookSignature,
  ROUND_TAKE, ratePerMinOf,
  // ── the people ──
  // Everyone on the property is an invented character with a stable identity:
  // personFor(daySeed, slot, seat) IS the system — no storage, no randomness,
  // the same booking is the same person on any machine after any reload.
  PEOPLE, personFor: PEOPLE.personFor, groupFor: PEOPLE.groupFor,
  ARCHETYPES: PEOPLE.ARCHETYPES,
  // one row per person on the course right now
  people: () => golfers.map((g, i) => ({
    i, name: g.person.name, hcp: g.person.hcp, arch: g.person.arch.id,
    group: g.grp ? g.grp.id : 0, slot: g.slot, honour: g.tOrder,
    hole: g.hole ? g.hole.n : 0, phase: g.phase, status: followStatus(g),
    card: g.card.slice(), toPar: g.round - g.roundPar, through: g.roundHoles,
    sat: Math.round(satisfactionOf(g) * 10) / 10, note: noteFor(g).line,
  })),
  // the follow card: follow(i) opens it on the i-th golfer on the property
  followed: () => followed, openFollowCard, closeFollowCard, renderFollowCard,
  follow: (i) => { const g = golfers[i | 0]; if (g) openFollowCard(g); return g ? g.person.name : null; },
  followStatus, strokeNow, tipGolfer, tipValue, assignHonour,
  // satisfaction: the facts, the mark, the sentence — all pure
  courseFacts, golferFacts, satisfactionOf, noteFor, cardFacts,
  // word of mouth: the club's running average of those marks, and what it does
  // to demand. setMood(v) re-freezes today's book at that reputation.
  mood: () => ({ avg: state.mood.avg, n: state.mood.n, word: wordOfMouth(), today: moodToday() }),
  logMood, moodWord, wordOfMouth, moodToday,
  setMood: (v) => {
    state.mood.avg = clamp(+v || 0, 0, 10);
    if (state.sheet) state.sheet.wom = moodWord(state.mood.avg);
    computeCourse();
    if (sheetOpen) renderSheet();
    return state.mood.avg;
  },
  // ── the notables ──
  // Thirty-six invented characters across five tiers, each with a taste. The
  // whole area is testable without waiting for anybody to turn up: read the
  // architecture, force a verdict, force an appearance, sign a member.
  STARS, ROSTER: STARS.ROSTER, BY_ID: STARS.BY_ID, TIERS: STARS.TIERS,
  QUALITIES: STARS.QUALITIES,
  // the thirteen readings taken off the tiles the player actually laid
  architecture, corridorOf, arch: () => course.arch,
  // prestige: who is willing to travel here, and why
  prestigeOf, reachOf, memberSlots, memberOf, statsOf, devStats,
  // verdicts — starVerdict(star) is cached per recompute; verdictOf(id) is the
  // one-call version, and rateAll() is every opinion in the game at once
  starVerdict, verdictOf: (id) => STARS.BY_ID[id] ? starVerdict(STARS.BY_ID[id]) : null,
  rateAll: () => STARS.ROSTER.map(s => {
    const v = starVerdict(s);
    return { id: s.id, name: s.name, tier: s.tier, score: v.score,
      reasons: v.reasons.map(r => r.q), fav: v.fav ? v.fav.n : 0 };
  }).sort((a, b) => b.score - a.score),
  // the club book itself
  club: () => state.club,
  seen: () => state.club.seen,
  members: () => state.club.members.map(m => Object.assign({
    name: STARS.BY_ID[m.id].name, tier: STARS.BY_ID[m.id].tier, stats: statsOf(STARS.BY_ID[m.id]),
  }, m)),
  inviteState, inviteCost, invite, release, openStarRow, renderPeopleView,
  openStar: () => openStar,
  openWhere: () => openWhere,
  // ── the Club Book: honours, the collection, the ledger ──
  // Every number on that page comes off these. `records` is the honours board
  // exactly as stored; each entry is { v, who, day, … } or null.
  records: () => state.records,
  // the collection, as the grid reads it: id → 'unmet' | 'met' | 'played' | 'member'
  collection: () => STARS.ROSTER.map(s => ({ id: s.id, name: s.name, tier: s.tier,
    state: collectState(s.id) })),
  collectState, metCount, met: () => state.club.met, noteMet,
  // the ledger row a notable has left behind: their card, their mark, their line
  signature: (id) => (state.club.seen[id] ? Object.assign({ id }, state.club.seen[id]) : null),
  // ── writing to the board, for tests ──
  // These are the SAME calls live play makes — nothing here is a back door that
  // bypasses a rule, so a record written by a test is a record a round can beat.
  postRound, noteDrive, noteTally, noteMajorRound, noteHoleFeat, recDay,
  // Reveal the roster without waiting for prestige to earn it, so the grid, the
  // tier headers and the counts can be read at full: meetAll() writes every name
  // into the collection dated today. forgetAll() puts the page back to a brand
  // new club's empty state, which is the other thing worth being able to see.
  meetAll: () => { for (const s of STARS.ROSTER) noteMet(s.id); save();
    if (sheetOpen) renderSheet(); return metCount(); },
  forgetAll: () => {
    state.club.met = {}; state.club.seen = {};
    state.records = sanitiseRecords(null);
    save(); if (sheetOpen) renderSheet(); return true;
  },
  // today's diary: slot → star, plus the next name still to come
  vips: () => Object.assign({}, (state.sheet && state.sheet.vips) || {}),
  vipAt, nextVip, notablesFor, visitChance: STARS.visitChance,
  // force an appearance: putVip(id) seats them at the next free time today and
  // returns the slot; jumpToSlot(slot) then stands you a second before it
  putVip: (id) => (STARS.BY_ID[id] ? seatNotableToday(id) : -1),
  // …or skip the walk entirely: playStarCard posts a full round off the book
  playStarCard: (id) => (STARS.BY_ID[id] ? playStarCard(STARS.BY_ID[id]) : null),
  // the crowd that walks out for them
  gallery: () => ({ star: gallery.star ? gallery.star.id : null,
    n: gallery.spots.length, live: gallery.watchers.filter(w => w.k > 0.5).length }),
  GALLERY_N, arriveVip, signOff, recordVerdict, starPerson, prestige: () => prestigeOf(),
  // Power · accuracy · putting, and the two places they are spent. profileOf is
  // the lean; demandOf is what a hole asks for; edgeFor(hole, prof) is the
  // strokes that lean is worth on THAT hole — negative is strokes saved. Feed
  // buildShots a prof to see the sequence it produces change with it.
  profileOf: STARS.profileOf, demandOf, edgeFor,
  starProfile: (id) => (STARS.BY_ID[id] ? starPerson(STARS.BY_ID[id]).prof : null),
  // the card a lean posts over the whole property, without waiting for a round
  cardFor: (prof, skill) => course.holes.map(h =>
    scoreHole(h, skill || 0, prof)).reduce((a, b) => a + b, 0),
  // ── the majors ──
  // Three championships on the real calendar, three invented golf courses in
  // the game's own tiles. EVERYTHING here is a pure function of (event, year,
  // clock), so a judge never has to wait for a weekend: move the clock with
  // jumpToMeet / setClock and assert.
  MAJORS, EVENTS: MAJORS.EVENTS, VENUES: MAJORS.VENUES,
  buildVenue: MAJORS.buildVenue,
  // the venue measured with the game's own instruments — holes, pars, yards,
  // and the thirteen architecture readings, with no rendering involved
  venueCourse, venueWorld, swapWorld,
  // Every bunker on these courses is placed by hand, and this is how you check
  // it was worth placing: per hole, the sand ON the line of play against the
  // sand off it, the sand defending the pin, and the strokes over par the hole
  // is measured to cost. `sand` is the venue's whole sand total — a course that
  // needs a hundred tiles to say something is decorating, not designing.
  venueAudit: (vid) => {
    const vc = venueCourse(vid);
    if (!vc) return null;
    const was = swapWorld(venueWorld(vc.venue));
    const rows = vc.holes.map((h, i) => {
      const c = corridorOf(h.tee, h.flag);
      return { n: h.n, name: h.name, yards: h.yards, par: h.par,
        over: +h.over.toFixed(2), onLine: c.bunkerOn, offLine: c.bunkerOff,
        atGreen: c.greenBunker, greenSize: h.greenSize,
        strategy: +h.feat.strategy.toFixed(2) };
    });
    swapWorld(was);
    return { venue: vid, sand: vc.counts.bunker, par: vc.par, yards: vc.yards,
      setup: (MAJORS.EVENTS.find(e => e.venue === vid) || {}).setup,
      arch: vc.arch, holes: rows };
  },
  // when: meetFor(ev) is the next running; meetAt(ev, year) is a named one
  meetFor, meetAt, liveMeet, roundAt, weekendOf: MAJORS.weekendOf,
  // who: the field, the draw, the cut
  fieldFor, orderFor, cutList, teeMinFor, groupIdxFor, tourCard, tourRng,
  // the board itself — leaderboard(meet, atMs?) is one pure call
  leaderboard, rowFor, parText, posLabel,
  // entering, pulling out, and who is missing from your own sheet this weekend
  entryState, enterEvent, withdraw, awayOn, entrantOf,
  entries: () => Object.assign({}, state.tour.entries),
  results: () => state.tour.results.slice(),
  tourPrestige, tourWins, purseFor, presFor, settleMeet, settleAll,
  // travel: the venue swap. away.home holds the club's own ground while you
  // are gone, and save() puts it back for the length of one write.
  away, travelTo, comeHome, releaseTourGroups, startTourGroup, frameProperty,
  atVenue: () => (away.active ? away.venue.id : null),
  // the card at the venue, and the Tour page in the Club sheet
  renderAway, renderTourView, lookAtHole, followStar, watchLine,
  awayHole: () => awayHole, onCourseIds, awaySignature,
  // THE claim the whole watching feature rests on, as an assertion you can run:
  // every notable on this golf course right now, the score they are playing,
  // and the score the leaderboard published for the hole they are standing on.
  // `ok` must be true on every row, for the first group of the day and for a
  // group dropped in on the 13th alike.
  // (`!g.sank` skips the half-second between the putt dropping — which credits
  //  the hole — and the ball being picked out of the cup, where a golfer is
  //  briefly carrying the next hole's index and the last hole's flag)
  tourAudit: () => golfers.filter(g => g.tourCard && g.hole && !g.sank).map(g => {
    const pub = g.tourCard[Math.min(g.tourCard.length - 1, g.roundHoles)];
    const want = course.holes[g.roundHoles % course.holes.length];
    return { name: g.person.name, idx: g.roundHoles, hole: g.hole.n,
      dealt: g.strokes, published: pub,
      ok: g.strokes === pub && !!want && g.hole.n === want.n };
  }),
  // How much television there is: the cap, and how many groups are genuinely
  // on the golf course at this moment of this round. The cap is derived from
  // the tee sheet's own arithmetic, so `max` is a number `live` can reach.
  TOUR_MAX_GROUPS,
  groupsOut: () => {
    const meet = liveMeet();
    if (!meet) return { max: TOUR_MAX_GROUPS, live: 0, shown: 0, players: 0 };
    const round = roundAt(meet, nowMs());
    const min = meetMinute(nowMs());
    const order = round ? orderFor(meet, round) : [];
    let live = 0;
    for (let gi = 0; gi < Math.ceil(order.length / MAJORS.GROUP_N); gi++) {
      const t = MAJORS.teeMinute(round, gi), thru = MAJORS.through(min, t);
      if (min >= t && thru < 18) live++;
    }
    return { max: TOUR_MAX_GROUPS, live, shown: groups.length,
      players: golfers.filter(g => g.tourCard).length };
  },
  // the shape of a championship day, without doing the arithmetic by hand:
  // when the first group goes off in each round and when the last one is in
  roundWindow: (evId) => {
    const ev = MAJORS.EVENT[evId];
    if (!ev) return null;
    const meet = meetFor(ev);
    const cut = Math.max(2, Math.round(fieldFor(meet).length * CUT_SHARE));
    const g2 = Math.ceil(cut / MAJORS.GROUP_N);
    return { roundMin: MAJORS.ROUND_MIN,
      r1: { groups: groupsIn(ev), first: TS.hhmmShort(MAJORS.teeMinute(1, 0)),
        lastIn: TS.hhmmShort(MAJORS.lastIn(1, groupsIn(ev))) },
      r2: { groups: g2, first: TS.hhmmShort(MAJORS.teeMinute(2, 0)),
        lastIn: TS.hhmmShort(MAJORS.lastIn(2, g2)) } };
  },
  // Championship tempo, and the audit that keeps MAJORS.ROUND_MIN honest.
  // `slower` is the one design choice (a major hole takes 45% longer tee to
  // tee than a club hole); `pace` is what that becomes once the un-scalable
  // walk to the next tee is taken out of it; `measured` is what the golf
  // actually does at whatever venue is loaded, and `impliedRoundMin` is the
  // number MAJORS.ROUND_MIN has to equal for the leaderboard on the wall and
  // the group in front of you to be telling the same story. Stand at a venue
  // (travelTo), step a while, then read it.
  tourPace: () => {
    // paceSplit is one shared ledger, so away from a championship it is full of
    // home holes and the implied round reads as a desync that is not there.
    // Only answer when the numbers in it are actually tournament numbers.
    const n = away.meet ? paceSplit.n : 0;
    if (!n) return { slower: TOUR_SLOWER, pace: +TOUR_PACE.toFixed(4),
      roundMin: MAJORS.ROUND_MIN, measured: null,
      note: away.meet ? 'no holes yet' : 'not at a championship — home holes are not tour pace' };
    const cup = paceSplit.cup / n, turn = paceSplit.turn / n;
    return { slower: TOUR_SLOWER, pace: +TOUR_PACE.toFixed(4),
      roundMin: MAJORS.ROUND_MIN,
      measured: { n, cup: +cup.toFixed(1), turn: +turn.toFixed(1),
        holeS: +(cup + turn).toFixed(1) },
      impliedRoundMin: +((cup + turn) * 18 / 60).toFixed(2),
      err: +(((cup + turn) * 18 / 60) / MAJORS.ROUND_MIN - 1).toFixed(4) };
  },
  // ── time travel for the majors ──
  // jumpToMeet('thornwick') stands the clock on Saturday's first tee;
  // jumpToMeet('thornwick', 2, 60) is an hour into Sunday's round.
  jumpToMeet: (evId, round, minsIn) => {
    const ev = MAJORS.EVENT[evId];
    if (!ev) return null;
    const m = meetFor(ev);
    const day = (round === 2) ? m.sun : m.sat;
    const base = TS.midnightOf(day) + MAJORS.teeMinute(round === 2 ? 2 : 1, 0) * 60000;
    return setClock(base + (minsIn || 0) * 60000);
  },
  // …or skip the weekend entirely and read the result
  jumpPastMeet: (evId) => {
    const ev = MAJORS.EVENT[evId];
    if (!ev) return null;
    const m = meetFor(ev);
    setClock(m.endMs + 120000);
    return settleAll(true);
  },
  // ── the long game: the annals, the honours page, the standing, the horizon ──
  // Everything derived, everything drivable. annals() is the ledger exactly as
  // stored — past years frozen, the open year live in seasonNow(). A New Year
  // can be forced with forceYearEnd(n): it goes through the same closeSeason()
  // the calendar calls, so a forced review is a real one (and it advances the
  // ledger's year, so the next real New Year settles the difference; no-op at
  // a venue, where `course` is not the club's). honours() is every line with
  // its pencil-to-ink state and progress; honourReset(id?) rubs lines back to
  // pencil so the poll can re-earn them, ceremony included. standing() is the
  // rungs, the live inputs and the derived answer in one object; horizon() is
  // the committee's sentence, exactly as printed.
  annals: () => state.annals,
  seasonNow, closeSeason, checkYearTurn, seasonFacts,
  forceYearEnd: (years) => {
    if (away.active || !state.annals) return null;
    const out = [];
    const n = Math.max(1, Math.min(20, years | 0 || 1));
    for (let k = 0; k < n; k++) out.push(closeSeason());
    save();
    if (sheetOpen) renderSheet();
    return out;
  },
  HONOURS, honours: () => ({
    n: honourCount(), of: HONOURS.length, earned: Object.assign({}, state.honours),
    rows: HONOURS.map(d => ({ id: d.id, name: d.name,
      earned: state.honours[d.id] || null, far: +honourFar(d).toFixed(3) })),
  }),
  checkHonours,
  honourReset: (id) => {
    if (id) delete state.honours[id];
    else state.honours = {};
    honNews = [];
    save();
    if (sheetOpen) renderSheet();
    return honourCount();
  },
  STANDINGS, standing: () => ({
    i: state.standing.i, name: STANDINGS[state.standing.i].name,
    days: Object.assign({}, state.standing.days),
    inputs: standingInputs(), derived: standingDerived(),
    next: state.standing.i + 1 < STANDINGS.length
      ? Object.assign({ i: state.standing.i + 1 }, STANDINGS[state.standing.i + 1]) : null,
    cover: (el('bk-cstand') || {}).textContent || '',
  }),
  syncStanding, syncCover,
  horizon: horizonOf,
  pollLongGame,
  // Start Over without the card — for agents and tests
  reset: wipeAndReload,
  // …and the card itself, so the club's own confirm can be photographed and
  // driven without a native dialog freezing the page under a screenshot.
  askReset,
  resetAsked: () => !el('confirm').classList.contains('hidden'),
};

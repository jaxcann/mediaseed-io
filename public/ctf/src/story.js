// ─────────────────────────────────────────────────────────────
// Story mode as pure data. A neighbourhood of six stops, a cast of kids, and
// a little state machine that remembers which ones you beat and who joined.
//
// No THREE, no DOM, no localStorage, no clock, no dice — every seed is baked
// in so a story match plays the same on any machine. The UI reads the data,
// draws the map, and calls back in. rules.js never hears about any of this:
// matchConfig() hands the caller plain makeGame() options.
// ─────────────────────────────────────────────────────────────
import { ARENAS } from './layout.js';

// ── the cast ─────────────────────────────────────────────────
// Kit keys are the identity; these are just what the kids call each other.
export const CAST = {
  runner:    { name: 'Dez',       tag: 'fastest on the street' },
  dog:       { name: 'Biscuit',   tag: 'a dog' },
  guard:     { name: 'Big Tony',  tag: 'holds the fence' },
  slingshot: { name: 'Priya',     tag: 'balloons, from range' },
  portal:    { name: 'Wendell',   tag: 'two linked hoops' },
  grappler:  { name: 'June',      tag: 'lives up a rope' },
  nahele:    { name: 'Nahele',    tag: 'reads the wind' },
  skater:    { name: 'Rook',      tag: 'does not stop' },
  lilt:      { name: 'Lil T',     tag: 'never gets off the trike' },
  hose:      { name: 'Gus',       tag: 'brought the hose' },
  karen:     { name: 'Ms. Karen', tag: 'somebody’s mom, one air horn' },
};

// Canonical roster order: the three you start with, then the order they join.
export const ALL_CHARACTERS = ['runner', 'dog', 'guard', 'slingshot', 'portal',
                               'grappler', 'nahele', 'skater', 'lilt', 'hose', 'karen'];
export const STARTERS = ['runner', 'dog', 'guard'];

export const speakerName = who => (who === 'narrator' ? '' : (CAST[who]?.name || who));

// ── arenas ───────────────────────────────────────────────────
// Four stops reuse arenas that already exist in layout.js. Two are story-only:
// same authored footprints, different time of day and a different sign on them.
// `field` widens CFG.field for the 5v5 — optional, the UI may ignore it.
export const STORY_ARENAS = {
  'lot-dusk': {
    key: 'lot-dusk', map: 'field', yard: 'night', label: '🌇 The Empty Lot', story: true,
    note: 'The PE field footprint after supper. Nobody mows the lot, nobody owns it.',
  },
  'cul-de-sac': {
    key: 'cul-de-sac', map: 'backyard', yard: 'night', label: '🏁 The Cul-de-Sac', story: true,
    field: { w: 60, h: 41 },
    note: 'Blacktop widened for ten players. Her sprinklers are on a timer and she knows the timer.',
  },
};

export const arena = key => ARENAS.find(a => a.key === key) || STORY_ARENAS[key] || null;

// ── the overworld ────────────────────────────────────────────
// Positions live in an abstract 0..100 square so the UI can scale it to any
// viewport. Edges are what gets drawn between the pins; `requires` is what
// actually gates progress. They agree, plus one scenic alley shortcut.
export const OVERWORLD = { w: 100, h: 100, title: 'MAPLE COURT' };

export const PATHS = [
  ['back-fence', 'sprinklers'],
  ['sprinklers', 'gym-period-3'],
  ['gym-period-3', 'pe-field'],
  ['sprinklers', 'pe-field'],      // the alley behind the Nguyens'
  ['pe-field', 'empty-lot'],
  ['empty-lot', 'cul-de-sac'],
];

// ── the six stops ────────────────────────────────────────────
export const STOPS = [
  {
    id: 'back-fence', n: 1, name: 'The Back Fence',
    where: 'Dez’s backyard, four minutes after the last bell',
    x: 12, y: 78, arena: 'backyard-day', requires: [], seed: 90210,
    pick: 3, teamSize: 3, stars: 1,
    unlocks: ['slingshot'],
    opponents: { name: 'The Fence Kids', lead: 'slingshot', kits: ['slingshot', 'runner', 'dog'] },
    win: { type: 'captures', target: 2, text: 'First to 2 flags.' },
    brief: 'Home turf. Two flags, no throwing the dog, and somebody is lobbing water balloons over the hedge.',
    cutscene: [
      { who: 'guard', line: 'Rules are rules. Two flags, and nobody throws the dog.', dir: 'Tony sets the cooler down as a goalpost' },
      { who: 'runner', line: 'Nobody has ever thrown the dog.' },
      { who: 'guard', line: 'Nobody has ever thrown the dog YET.' },
      { who: 'dog', line: '(tail going like a windshield wiper)', dir: 'Biscuit sits down directly in the goal' },
      { who: 'narrator', line: '', dir: 'a water balloon arcs over the hedge and detonates on the stump' },
      { who: 'slingshot', line: 'SORRY! Wind. That was the wind.', dir: 'from somewhere on the other side of the fence' },
      { who: 'runner', line: 'Who is that.' },
      { who: 'guard', line: 'New kid. She’s been up on that fence since June and she is not on anybody’s team.' },
    ],
    victory: [
      { who: 'slingshot', line: 'Okay. The fence is officially no longer neutral.', dir: 'Priya drops down on your side of it' },
      { who: 'dog', line: '(returns the popped balloon, unbelievably proud of himself)' },
      { who: 'slingshot', line: 'Keep it. There are forty more in my garage.' },
    ],
  },
  {
    id: 'sprinklers', n: 2, name: 'Sprinkler Season',
    where: 'the same yard, after dinner, lights on',
    x: 28, y: 52, arena: 'backyard-night', requires: ['back-fence'], seed: 41818,
    pick: 3, teamSize: 3, stars: 2,
    unlocks: ['portal'],
    opponents: { name: 'The Storm Drain Crew', lead: 'portal', kits: ['portal', 'runner', 'guard'] },
    win: { type: 'captures', target: 3, text: 'First to 3 flags — sprinklers and all.' },
    brief: 'Night game. The sprinklers are on a timer nobody trusts, and a kid has come up out of the storm drain with hula hoops.',
    cutscene: [
      { who: 'runner', line: 'Sprinklers come on at eight.' },
      { who: 'guard', line: 'Then we finish at seven fifty-nine.' },
      { who: 'narrator', line: '', dir: 'the sprinklers come on at 7:41' },
      { who: 'dog', line: '(loses his entire mind, declares war on the water)' },
      { who: 'portal', line: 'You are all doing this so INEFFICIENTLY.', dir: 'Wendell climbs out of the storm drain holding two hula hoops' },
      { who: 'runner', line: 'Are those your mom’s hoops?' },
      { who: 'portal', line: 'They’re rings. They’re linked. Watch —', dir: 'he steps into one and comes out the other, soaked' },
      { who: 'portal', line: '…I have not solved the wet part.' },
    ],
    victory: [
      { who: 'portal', line: 'Statistically I should have won that.' },
      { who: 'guard', line: 'You went through your own hoop four times.' },
      { who: 'portal', line: 'Yes. Statistically.', dir: 'he hands you a hoop anyway' },
    ],
  },
  {
    id: 'gym-period-3', n: 3, name: 'Third Period Gym',
    where: 'the gymnasium, during a period none of you have gym',
    x: 50, y: 74, arena: 'gym', requires: ['sprinklers'], seed: 33115,
    pick: 3, teamSize: 3, stars: 3,
    unlocks: ['grappler'],
    opponents: { name: 'The Rafter Kids', lead: 'grappler', kits: ['grappler', 'guard', 'dog'] },
    win: { type: 'shutout', target: 2, text: 'Win 2–0. Let one in and Coach hears about it.' },
    brief: 'Indoors, hardwood, echo. Somebody has been living in the climbing ropes and nobody noticed because nobody looks up.',
    cutscene: [
      { who: 'guard', line: 'Coach said the gym is ours till the bell.' },
      { who: 'runner', line: 'Coach said that?' },
      { who: 'guard', line: 'Coach said “don’t.” Same number of words.' },
      { who: 'narrator', line: '', dir: 'a climbing rope swings past overhead. it is occupied.' },
      { who: 'grappler', line: 'HEADS.' },
      { who: 'grappler', line: 'I’ve been up here since second period. Nobody in this school looks up.' },
      { who: 'dog', line: '(looks up)' },
      { who: 'grappler', line: 'One good kid in the whole building. The rest of you — heads.' },
    ],
    victory: [
      { who: 'grappler', line: 'Two–nothing. In MY rafters.', dir: 'June lands, finally, on the floor' },
      { who: 'grappler', line: 'Fine. I’m coming down. Somebody hold the rope, it’s attached to nothing.' },
      { who: 'guard', line: 'It’s WHAT?' },
    ],
  },
  {
    id: 'pe-field', n: 4, name: 'The Whole Field',
    where: 'the PE field, wide open, no shade anywhere',
    x: 62, y: 40, arena: 'field', requires: ['gym-period-3'], seed: 70707,
    pick: 3, teamSize: 3, stars: 3,
    unlocks: ['nahele', 'skater'],
    opponents: { name: 'The Long Grass', lead: 'nahele', kits: ['nahele', 'skater', 'runner'] },
    win: { type: 'clock', target: 3, secondsLeft: 40, text: 'Take 3 with 40 seconds still on the clock. The 4:10 bus does not wait.' },
    brief: 'No fence, no hedge, nothing to hide behind. Two kids out here already know how to use that.',
    cutscene: [
      { who: 'runner', line: 'Whole field. No fences, no walls, nothing to duck behind.' },
      { who: 'guard', line: 'I hate it here.', dir: 'Tony is winded and they have not started' },
      { who: 'nahele', line: 'You’re supposed to feel small. That’s what a field is for.', dir: 'a kite line goes tight and tows Nahele three feet sideways' },
      { who: 'skater', line: 'Is this a whole THING? Are we doing a whole thing right now?', dir: 'Rook ollies off the bleachers and lands, mostly' },
      { who: 'runner', line: 'Six kids. Two flags. First to three.' },
      { who: 'skater', line: 'Cool. Cool cool cool. I don’t stop though. Like — physically. Board doesn’t have that.' },
      { who: 'nahele', line: 'He’s been rolling since Tuesday.' },
      { who: 'skater', line: 'Wednesday.' },
    ],
    victory: [
      { who: 'nahele', line: 'The wind was on your side. I would like that noted somewhere.' },
      { who: 'skater', line: 'Noted. Also I’m on their team now.', dir: 'rolls in behind Dez, still moving, has not stopped once' },
      { who: 'guard', line: 'Does he ever —' },
      { who: 'nahele', line: 'No.' },
    ],
  },
  {
    id: 'empty-lot', n: 5, name: 'The Empty Lot',
    where: 'the lot at the end of the street, dusk, NO TRESPASSING',
    x: 86, y: 62, arena: 'lot-dusk', requires: ['pe-field'], seed: 12321,
    pick: 3, teamSize: 3, stars: 4,
    unlocks: ['lilt', 'hose'],
    opponents: { name: 'The Lot Two', lead: 'lilt', kits: ['lilt', 'hose', 'grappler'] },
    win: { type: 'captures', target: 3, text: 'First to 3, before somebody’s mom notices the hose.' },
    brief: 'Overgrown, unowned, and already occupied by a very small child who says she called it.',
    cutscene: [
      { who: 'guard', line: 'This lot has a NO TRESPASSING sign on it.' },
      { who: 'runner', line: 'That sign is older than we are.' },
      { who: 'lilt', line: 'I been here forty minutes. I called it. Out loud. To nobody.', dir: 'a preschooler on a trike, dead centre of the lot, has not moved once' },
      { who: 'skater', line: 'You’re like four years old.' },
      { who: 'lilt', line: 'Four and THREE QUARTERS.', dir: 'Lil T does not blink again for the rest of the scene' },
      { who: 'hose', line: 'Ignore her, she’s terrifying. I brought the hose.', dir: 'Gus drags a garden hose in from his house, two doors down' },
      { who: 'runner', line: 'How long IS that hose?' },
      { who: 'hose', line: 'Long enough that my mom hasn’t noticed yet, so let’s hurry.' },
    ],
    victory: [
      { who: 'lilt', line: 'I still called it.' },
      { who: 'runner', line: 'You did call it.' },
      { who: 'lilt', line: 'Good. Then it’s our lot.', dir: 'she shakes on it, formally, with everyone including the dog, without getting off the trike' },
      { who: 'hose', line: 'Cool. Somebody help me carry three hundred feet of hose home.' },
    ],
  },
  {
    id: 'cul-de-sac', n: 6, name: 'The Cul-de-Sac', finale: true,
    where: 'the top of Maple Court, every kid on the street, one folding table',
    x: 58, y: 12, arena: 'cul-de-sac', requires: ['empty-lot'], seed: 55555,
    pick: 5, teamSize: 5, stars: 5,
    unlocks: ['karen'],
    opponents: { name: 'Neighborhood Watch', lead: 'karen', kits: ['karen', 'hose', 'skater', 'grappler', 'guard'] },
    win: { type: 'boss', target: 3, text: '5 v 5. First to 3. Her cul-de-sac, her sprinklers, her list.' },
    brief: 'Everybody plays. Five a side on the blacktop, and the woman with the laminated list is playing too.',
    cutscene: [
      { who: 'karen', line: 'Hello! I’m not mad. I’ve made a list.', dir: 'a folding table. she unfolds a laminated list. it reaches the ground.' },
      { who: 'karen', line: 'Item one, the hose. Item two, the hoops. Item three, whatever that kite did to my gutter.' },
      { who: 'guard', line: 'That’s three items.' },
      { who: 'karen', line: 'It’s forty-one items, sweetheart. I’m summarising.' },
      { who: 'runner', line: 'So what do you actually want?' },
      { who: 'karen', line: 'One game. Five on five, my cul-de-sac, my rules. I win, this street is quiet by six. Permanently.' },
      { who: 'dog', line: '(growls at the folding table)' },
      { who: 'karen', line: 'Oh, I like the dog. The dog stays either way.', dir: 'she sets an air horn down on the table where everybody can see it' },
    ],
    victory: [
      { who: 'karen', line: 'Well.', dir: 'she folds the list once. then again. then pockets it.' },
      { who: 'karen', line: 'Six-thirty. Not one minute past six-thirty.' },
      { who: 'runner', line: 'Deal.' },
      { who: 'karen', line: 'And I’m playing next week. I want the big one’s spot.' },
      { who: 'guard', line: '…', dir: 'Tony is delighted and is pretending extremely hard that he is not' },
    ],
  },
];

export const STOP_IDS = STOPS.map(s => s.id);
export const stopById = id => STOPS.find(s => s.id === id) || null;

// ── win conditions ───────────────────────────────────────────
// A result is whatever the caller pulls off a finished game:
//   { score: { us, them }, secondsLeft, won }
// which for a story match is { us: G.score.blue, them: G.score.red }, G.time.
export function evaluateWin(stop, result) {
  const S = typeof stop === 'string' ? stopById(stop) : stop;
  if (!S) return { cleared: false, reason: 'no such stop' };
  const us = result?.score?.us | 0, them = result?.score?.them | 0;
  const left = Number(result?.secondsLeft ?? 0);
  const W = S.win;
  if (result?.won === false) return { cleared: false, reason: 'you lost' };
  // A 'captures' stop is "win the match": the rules end a timed match with the
  // leader as the winner, so a 1-0 clock win on a first-to-2 stop IS a win —
  // the screen already said BLUE WINS, and this used to answer NOT QUITE.
  // Shutout/clock/boss stops keep their literal conditions.
  if (us < W.target && !(W.type === 'captures' && result?.won === true))
    return { cleared: false, reason: `needed ${W.target}, got ${us}` };
  if (W.type === 'shutout' && them > 0) return { cleared: false, reason: `they scored ${them} — it had to be ${W.target}–0` };
  if (W.type === 'clock' && left < W.secondsLeft) {
    return { cleared: false, reason: `${Math.round(left)}s left, needed ${W.secondsLeft}s` };
  }
  return { cleared: true, reason: 'cleared' };
}

// ── save shape ───────────────────────────────────────────────
// Plain JSON in, plain JSON out. The caller owns storage.
const SAVE_VERSION = 1;
const clone = o => JSON.parse(JSON.stringify(o));
const uniq = a => Array.from(new Set(a));
const order = (list, canon) => canon.filter(k => list.includes(k));

export const blankSave = () => ({ v: SAVE_VERSION, cleared: [], unlocked: [...STARTERS], seen: [], loadouts: {} });

// Tolerant on purpose: a save from an older build, a half-written blob, or
// null all normalise to something playable. Unlocks are re-derived from the
// stops you cleared, so a save can never end up owing you a character.
export function normalizeSave(raw) {
  const s = (raw && typeof raw === 'object') ? raw : {};
  const cleared = order(uniq((Array.isArray(s.cleared) ? s.cleared : []).filter(id => STOP_IDS.includes(id))), STOP_IDS);
  const earned = [...STARTERS];
  for (const id of cleared) earned.push(...stopById(id).unlocks);
  const saved = (Array.isArray(s.unlocked) ? s.unlocked : []).filter(k => ALL_CHARACTERS.includes(k));
  const unlocked = order(uniq([...earned, ...saved]), ALL_CHARACTERS);
  const seen = order(uniq((Array.isArray(s.seen) ? s.seen : []).filter(id => STOP_IDS.includes(id))), STOP_IDS);
  const loadouts = {};
  const src = (s.loadouts && typeof s.loadouts === 'object') ? s.loadouts : {};
  for (const id of STOP_IDS) {
    const L = Array.isArray(src[id]) ? uniq(src[id].filter(k => unlocked.includes(k))) : null;
    if (L && L.length) loadouts[id] = L.slice(0, stopById(id).pick);
  }
  return { v: SAVE_VERSION, cleared, unlocked, seen, loadouts };
}

// ── the machine ──────────────────────────────────────────────
export function makeStory(saveData) {
  let S = normalizeSave(saveData);

  const isCleared  = id => S.cleared.includes(id);
  const isUnlocked = kit => S.unlocked.includes(kit);
  const isAvailable = id => {
    const st = stopById(id);
    return !!st && st.requires.every(r => S.cleared.includes(r));
  };
  const statusOf = id => isCleared(id) ? 'cleared' : isAvailable(id) ? 'open' : 'locked';

  const availableRoster = () => order(S.unlocked, ALL_CHARACTERS);
  const lockedRoster    = () => ALL_CHARACTERS.filter(k => !S.unlocked.includes(k));

  // The stop the player is pointed at: first unbeaten one whose gate is open.
  const currentStop = () => STOPS.find(s => !isCleared(s.id) && isAvailable(s.id)) || null;
  const isComplete  = () => STOPS.every(s => isCleared(s.id));

  function unlock(kit) {
    if (!ALL_CHARACTERS.includes(kit)) return false;
    if (S.unlocked.includes(kit)) return false;
    S.unlocked = order([...S.unlocked, kit], ALL_CHARACTERS);
    return true;
  }

  // Clearing a stop is the only thing that moves the campaign. Pass a result
  // to have the win condition judged; omit it if the caller already judged.
  function complete(id, result) {
    const st = stopById(id);
    if (!st) return { ok: false, reason: 'no such stop', unlocked: [] };
    if (!isAvailable(id)) return { ok: false, reason: 'locked — clear ' + st.requires.join(', ') + ' first', unlocked: [] };
    if (result !== undefined) {
      const v = evaluateWin(st, result);
      if (!v.cleared) return { ok: false, reason: v.reason, unlocked: [] };
    }
    const first = !isCleared(id);
    if (first) S.cleared = order(uniq([...S.cleared, id]), STOP_IDS);
    const gained = st.unlocks.filter(k => unlock(k));
    return {
      ok: true, reason: 'cleared', replay: !first,
      stop: id, unlocked: gained, victory: st.victory,
      next: currentStop()?.id ?? null, complete: isComplete(),
    };
  }

  // ── cutscenes ──
  const cutscene = id => {
    const st = stopById(id);
    if (!st) return [];
    return st.cutscene.map(b => ({ ...b, name: speakerName(b.who), cast: CAST[b.who] || null }));
  };
  const victory = id => {
    const st = stopById(id);
    if (!st) return [];
    return st.victory.map(b => ({ ...b, name: speakerName(b.who), cast: CAST[b.who] || null }));
  };
  const hasSeen = id => S.seen.includes(id);
  const markSeen = id => { if (STOP_IDS.includes(id) && !S.seen.includes(id)) S.seen = order([...S.seen, id], STOP_IDS); return true; };

  // ── roster select ──
  const defaultLoadout = id => {
    const st = stopById(id);
    if (!st) return [];
    const saved = S.loadouts[id];
    if (saved && validateLoadout(id, saved).ok) return [...saved];
    return availableRoster().slice(0, st.pick);
  };
  function validateLoadout(id, kits) {
    const st = stopById(id);
    if (!st) return { ok: false, reason: 'no such stop' };
    if (!Array.isArray(kits)) return { ok: false, reason: 'loadout must be a list' };
    if (kits.length !== st.pick) return { ok: false, reason: `pick exactly ${st.pick}` };
    if (uniq(kits).length !== kits.length) return { ok: false, reason: 'no duplicates — one of each' };
    const locked = kits.filter(k => !isUnlocked(k));
    if (locked.length) return { ok: false, reason: `not unlocked yet: ${locked.join(', ')}` };
    return { ok: true, reason: 'ok' };
  }
  function setLoadout(id, kits) {
    const v = validateLoadout(id, kits);
    if (v.ok) S.loadouts[id] = [...kits];
    return v;
  }
  const loadoutFor = id => (S.loadouts[id] ? [...S.loadouts[id]] : defaultLoadout(id));

  // ── the handoff to rules.js ──
  // Everything makeGame() and the draft need, as plain JSON. blue[0] is the
  // slot rules.js marks isPlayer, so it is the kit the player actually drives.
  function matchConfig(id, kits) {
    const st = stopById(id);
    if (!st) return null;
    const A = arena(st.arena);
    const line = kits && validateLoadout(id, kits).ok ? [...kits] : loadoutFor(id);
    return {
      stop: st.id, name: st.name, where: st.where, brief: st.brief, stars: st.stars,
      finale: !!st.finale,
      arena: { key: A.key, map: A.map, yard: A.yard, label: A.label },
      makeGameOpts: { seed: st.seed, map: A.map, yard: A.yard },
      teamSize: st.teamSize, scoreToWin: st.win.target,
      field: A.field || null,
      blue: line, playerKit: line[0],
      red: [...st.opponents.kits], opponentName: st.opponents.name, opponentLead: st.opponents.lead,
      win: { ...st.win },
    };
  }

  // ── the map screen ──
  const overworld = () => ({
    w: OVERWORLD.w, h: OVERWORLD.h, title: OVERWORLD.title,
    nodes: STOPS.map(s => ({
      id: s.id, n: s.n, name: s.name, where: s.where, x: s.x, y: s.y,
      arena: s.arena, label: arena(s.arena)?.label ?? '', stars: s.stars,
      finale: !!s.finale, status: statusOf(s.id), current: currentStop()?.id === s.id,
      unlocks: [...s.unlocks], seen: hasSeen(s.id),
    })),
    edges: PATHS.map(([a, b]) => {
      const A = stopById(a), B = stopById(b);
      return { a, b, x1: A.x, y1: A.y, x2: B.x, y2: B.y, open: isCleared(a) || isCleared(b) };
    }),
  });

  const progress = () => ({
    cleared: S.cleared.length, stops: STOPS.length,
    unlocked: S.unlocked.length, characters: ALL_CHARACTERS.length,
    complete: isComplete(), current: currentStop()?.id ?? null,
  });

  return {
    // data passthrough
    stops: () => STOPS.map(s => ({ ...s, status: statusOf(s.id) })),
    stop: stopById, arena, cast: CAST,
    // queries
    isCleared, isUnlocked, isAvailable, statusOf, isComplete,
    availableRoster, lockedRoster, currentStop, progress, overworld,
    // cutscenes
    cutscene, victory, hasSeen, markSeen,
    // roster select
    defaultLoadout, validateLoadout, setLoadout, loadoutFor,
    // match
    matchConfig, evaluate: (id, r) => evaluateWin(stopById(id), r),
    // progression
    unlock, complete,
    // persistence — plain JSON both ways, never touches storage itself
    serialize: () => clone(S),
    deserialize: save => { S = normalizeSave(save); return true; },
    reset: () => { S = normalizeSave(null); return true; },
  };
}

export const deserialize = save => makeStory(save);

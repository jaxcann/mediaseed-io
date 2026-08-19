// ─────────────────────────────────────────────────────────────────────────────
//  Fairway — the people
// ─────────────────────────────────────────────────────────────────────────────
// Who is actually out there. Pure functions, no three.js and no game state: a
// booking (day seed, slot, seat) resolves to the same person on any machine,
// before or after a reload, without a byte being saved — the same trick the
// tee sheet plays with the day itself.
//
// Everyone here is invented. The archetypes are the ones golf really has — the
// architecture nerd, the long bomber, the grinder, the fourball out for a
// laugh — but no name, no biography and no quote belongs to a real player.
//
// The module also writes the notes. It is handed a plain bag of facts about
// the course (variety, trouble, walks, condition, how long this golfer stood
// on a tee) and returns a mark out of ten and ONE earned sentence. Keeping
// that here means the sentence can never quietly become filler: there is no
// game state in scope to fudge it with.

// stars.js is the only import, and only for one thing: the roster's full names,
// so that a Saturday fourball can never be dealt a Major Champion's exact name.
import { BY_ID as STAR_BY_ID } from './stars.js';

// ── Names ────────────────────────────────────────────────────────────────────
// Curated, not generated. Short enough to sit on a card, varied enough that a
// full tee sheet reads like a real membership.

const FIRSTS = [
  'Marisol', 'Dov', 'Ines', 'Kito', 'Rhoda', 'Emeka', 'Pilar', 'Anselm',
  'Noor', 'Tavish', 'Greta', 'Osric', 'Lumi', 'Bram', 'Sena', 'Idris',
  'Calla', 'Renzo', 'Yara', 'Halden', 'Mireille', 'Otto', 'Zuri', 'Perrin',
  'Solveig', 'Amadou', 'Beatrix', 'Cosmo', 'Delphine', 'Eero', 'Fenella',
  'Gustavo', 'Hana', 'Ismay', 'Kesi', 'Milo', 'Nadia', 'Ptolemy', 'Wren',
  'Xiomara', 'Yusuf', 'Zenobia', 'Clement', 'Esme', 'Rufus', 'Ottilie',
  'Bo', 'Thandiwe', 'Ivo', 'Saoirse', 'Ravi', 'Elke', 'Tomas', 'Nia',
  'Ingrid', 'Casimir', 'Aoife', 'Malik', 'Sunniva', 'Piet', 'Rania', 'Lucian',
];
const LASTS = [
  'Quintal', 'Brannock', 'Fenwold', 'Delacour', 'Okonjo', 'Ashgrove',
  'Petrossian', 'Draycott', 'Halloway', 'Ferrow', 'Silvane', 'Oyelaran',
  'Castellane', 'Prynne', 'Vasari', 'Marlowe', 'Ekdahl', 'Bellweather',
  'Nakadai', 'Ruiz-Kant', 'Sowerby', 'Almirante', 'Voss', 'Whitcombe',
  'Larkspur', 'Corbeau', 'Sandholm', 'Dunmore', 'Ferngrove', 'Alderbeck',
  'Mossbrook', 'Tessaro', 'Halloran', 'Okpara', 'Ravenna', 'Ashkani',
  'Beaumont', 'Nyholm', 'Adeyemi', 'Solberg', 'Marchetti', 'Vega-Lund',
  'Thorne', 'Ashby', 'Cadogan-Rees', 'Ingersoll', 'Bexley', 'Ostrander',
  'Vantour', 'Kessler', 'Amrani', 'Bordelon', 'Fitzhugh', 'Lindqvist',
  'Pennington', 'Sarkis', 'Trevallion', 'Ubeda', 'Winterlow', 'Zamora',
  'Achterberg', 'Braemar', 'Cortesi', 'Havelock',
];

// ── Archetypes ───────────────────────────────────────────────────────────────
// Personality is not decoration: it is what a golfer NOTICES. `w` is the taste
// that turns five honest readings of your course into one mark out of ten,
// `tough` is whether they want a test or a friendly morning, `hcp` is the band
// they play off, and `bias` is how generous a marker they are.
//
// `prof` is what they NOTICE ABOUT THEMSELVES — the lean of their game across
// power, accuracy and putting, on the same −1…+1 scale stars.profileOf uses, so
// one code path in game.js serves a Legend and a Saturday fourball alike. It is
// a shape and not a level: the numbers sum to about nothing, so a Bomber is not
// a better golfer than a Grinder off the same handicap, only a different one to
// watch. This is the line that finally makes the blurb above true.

export const ARCHETYPES = [
  { id: 'purist', label: 'Purist', blurb: 'Plays for the architecture',
    w: { design: 0.40, flow: 0.22, condition: 0.16, pace: 0.12, charm: 0.10 },
    tough: 0.90, bias: -0.20, hcp: [-2, 14], weight: 0.16,
    prof: { power: -0.35, accuracy: 0.40, putting: 0.05 } },
  { id: 'bomber', label: 'Bomber', blurb: 'Hits it a long way, finds it later',
    w: { design: 0.34, flow: 0.14, condition: 0.18, pace: 0.22, charm: 0.12 },
    tough: 0.75, bias: 0.10, hcp: [0, 16], weight: 0.14,
    prof: { power: 0.75, accuracy: -0.55, putting: -0.15 } },
  { id: 'grinder', label: 'Grinder', blurb: 'Counts every single shot',
    w: { design: 0.22, flow: 0.18, condition: 0.32, pace: 0.18, charm: 0.10 },
    tough: 0.60, bias: -0.10, hcp: [4, 18], weight: 0.16,
    prof: { power: -0.30, accuracy: 0.20, putting: 0.30 } },
  { id: 'stroller', label: 'Stroller', blurb: 'Out for the walk, really',
    w: { design: 0.16, flow: 0.20, condition: 0.12, pace: 0.10, charm: 0.42 },
    tough: 0.35, bias: 0.45, hcp: [12, 28], weight: 0.15,
    prof: { power: -0.10, accuracy: -0.20, putting: 0.15 } },
  { id: 'society', label: 'Society', blurb: 'Here with the whole gang',
    w: { design: 0.12, flow: 0.26, condition: 0.14, pace: 0.28, charm: 0.20 },
    tough: 0.30, bias: 0.30, hcp: [10, 26], weight: 0.16,
    prof: { power: 0.20, accuracy: -0.25, putting: 0.00 } },
  { id: 'stickler', label: 'Stickler', blurb: 'Notices everything. Everything',
    w: { design: 0.18, flow: 0.16, condition: 0.34, pace: 0.26, charm: 0.06 },
    tough: 0.70, bias: -0.60, hcp: [2, 16], weight: 0.13,
    prof: { power: -0.35, accuracy: 0.30, putting: 0.20 } },
  { id: 'rookie', label: 'Rookie', blurb: 'Six months in and hooked',
    w: { design: 0.20, flow: 0.24, condition: 0.16, pace: 0.16, charm: 0.24 },
    tough: 0.15, bias: 0.25, hcp: [18, 30], weight: 0.10,
    prof: { power: 0.30, accuracy: -0.40, putting: -0.10 } },
];

// ── Deterministic identity ───────────────────────────────────────────────────

function mix(a, b) {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2545f491) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}
function rnd(seed, salt) { return mix(seed, salt * 2654435761 + 12345) / 4294967296; }
function idx(list, seed, salt) { return Math.floor(rnd(seed, salt) * list.length) % list.length; }
function pick(list, seed, salt) { return list[idx(list, seed, salt)]; }

// A notable's name belongs to the notable. Both name pools were drawn from the
// same well as the roster's, so roughly one booking in a thousand would deal a
// Major Champion's exact name to an anonymous eighteen-handicapper sitting two
// rows below her own gold row in the book. On that draw we step to the next
// surname instead — deterministic, so today's sheet still reloads byte for byte.
const STAR_NAMES = new Set();
for (const id in STAR_BY_ID) STAR_NAMES.add(STAR_BY_ID[id].name);

// an archetype's lean, wobbled a quarter either way for this one golfer
function lean(base, seed, salt) {
  return Math.max(-1, Math.min(1, base + (rnd(seed, salt) - 0.5) * 0.5));
}

// A person is asked for by every render of the book — 180 rows, four times a
// second while the sheet is open — so the answer is remembered.
const cache = new Map();

export function personFor(daySeed, slot, seat) {
  const key = daySeed + '|' + slot + '|' + seat;
  const hit = cache.get(key);
  if (hit) return hit;
  if (cache.size > 600) cache.clear();

  const seed = mix(daySeed ^ 0x5f356495, (slot + 1) * 131 + seat * 7919);
  const first = pick(FIRSTS, seed, 3);
  let li = idx(LASTS, seed, 11);
  for (let k = 0; k < LASTS.length && STAR_NAMES.has(first + ' ' + LASTS[li]); k++) {
    li = (li + 1) % LASTS.length;
  }
  const last = LASTS[li];

  // archetype by weight, so the fourballs and the purists arrive in believable
  // proportion rather than one-in-seven each
  let r = rnd(seed, 17), arch = ARCHETYPES[0];
  for (const a of ARCHETYPES) { r -= a.weight; if (r <= 0) { arch = a; break; } }

  const [lo, hi] = arch.hcp;
  const hcp = Math.round(lo + (hi - lo) * Math.pow(rnd(seed, 23), 1.25));
  const p = {
    id: key, seed, first, last, name: first + ' ' + last,
    arch, hcp, hcpLabel: hcpLabel(hcp),
    // what scoreHole() reads: a scratch player is half a shot a hole better
    // than the field, a 28 is a shot and a bit worse
    skill: Math.max(-0.95, Math.min(1.1, hcp / 22 - 0.40)),
    // …and WHICH shots those are. The archetype's lean, plus enough of their
    // own to keep two Bombers from swinging identically.
    prof: {
      power: lean(arch.prof.power, seed, 67),
      accuracy: lean(arch.prof.accuracy, seed, 71),
      putting: lean(arch.prof.putting, seed, 73),
    },
    look: {
      shirt: rnd(seed, 31), pants: rnd(seed, 37), skin: rnd(seed, 41),
      bag: rnd(seed, 43), cap: rnd(seed, 47), hair: rnd(seed, 53),
      hasCap: rnd(seed, 59) < 0.72,
      build: 0.86 + rnd(seed, 61) * 0.20,
    },
  };
  cache.set(key, p);
  return p;
}

export function groupFor(daySeed, slot, size) {
  const out = [];
  for (let i = 0; i < size; i++) out.push(personFor(daySeed, slot, i));
  return out;
}
// what the book prints on the row: the person who made the booking
export function leadName(daySeed, slot) { return personFor(daySeed, slot, 0).name; }

export function hcpLabel(h) {
  if (h < 0) return '+' + (-h);
  if (h === 0) return 'Scratch';
  return String(h);
}

// ── Golf's own way of saying a hole number ───────────────────────────────────

const WORDS = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth',
  'seventh', 'eighth', 'ninth'];
export function ord(n) {
  if (n >= 1 && n <= 9) return WORDS[n];
  const s = ['th', 'st', 'nd', 'rd'][(n % 100 - n % 10 !== 10) && n % 10 < 4 ? n % 10 : 0];
  return n + s;
}

// ── The five readings ────────────────────────────────────────────────────────
// Every number below comes from something on the ground or something that
// happened to this golfer. Nothing is a mood dial.

const clamp01 = v => Math.max(0, Math.min(1, v));

export function components(f, p) {
  const tough = p ? p.arch.tough : 0.5;
  const troubleK = clamp01(f.troubleRate / 0.65);
  const roughK = clamp01(f.roughRate / 0.6);
  const generousK = clamp01((f.greenAvg - 3) / 6);
  const gentleK = clamp01(1 - f.troubleRate / 0.7);
  const varietyK = f.holes >= 3 ? f.variety : f.variety * 0.6;

  let design = 3 + 7 * (0.45 * varietyK
    + tough * (0.35 * troubleK + 0.20 * roughK)
    + (1 - tough) * (0.35 * generousK + 0.20 * gentleK));
  // a green you cannot see from the tee is the one thing everybody minds
  design -= Math.min(2.2, (f.blind / Math.max(1, f.holes)) * 3.2 * (0.5 + tough * 0.5));

  const flow = 10 - Math.max(0, Math.min(7, (f.walkAvg - 1.5) * 2.0));
  // Greenkeeping has real but firmly diminishing returns, and it is the one
  // reading that must never buy the whole mark: mowing a course beautifully
  // does not make a golf hole interesting. 0 → 3.0, 3 → 8.0, 6 → 9.4, and the
  // levels past that are worth a tenth each.
  const condition = Math.min(10, 3 + 7 * (1 - Math.pow(0.66, Math.max(0, f.condition))));
  const pace = 10 - Math.min(8.5, f.waitMin * 1.6);
  const charm = 2.5 + 7.5 * clamp01(f.beauty);
  return {
    design: Math.max(0, Math.min(10, design)),
    flow, condition, pace, charm,
  };
}

// the mark out of ten, and why
export function rate(f, p) {
  const c = components(f, p);
  const w = p.arch.w;
  let s = 0;
  for (const k in w) s += w[k] * c[k];
  // a round going well is a course going well. Barely — a third of a point.
  if (f.toPar != null && f.played) s += Math.max(-0.35, Math.min(0.35, -f.toPar * 0.05));
  // Nobody hands out tens. Past eight a marker gets stingy, so the top of the
  // scale costs roughly twice what the rest of it did — which is what keeps a
  // mature club still worth improving instead of pegging the day it buys mowers.
  if (s > 8) s = 8 + (s - 8) * 0.55;
  // Generosity is the marker, not the course, so it is applied AFTER the
  // stingy top end — otherwise the ceiling squeezes the Stickler and the
  // Stroller into the same half point exactly where a great course should be
  // making them disagree. A good course pleases everyone; it does not please
  // everyone equally.
  s += p.arch.bias;
  return { score: Math.max(1, Math.min(10, s)), c };
}

// ── The sentence ─────────────────────────────────────────────────────────────
// Candidates are only offered when the fact behind them is true, and the one
// that wins is the one this particular golfer cares about most. Two phrasings
// each, chosen by their own seed, so two people never say it the same way.

function phrase(list, p) { return list[(p.seed >>> 9) % list.length]; }

// A wait is a real complaint, so it has to be said the way a person says it.
// Rounded minutes, and the commonest wait of all — about one — reads as words.
function mins(n) { const m = Math.round(n); return m <= 1 ? 'a minute' : m + ' minutes'; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

export function note(f, p) {
  const { score, c } = rate(f, p);
  const w = p.arch.w;
  const cands = [];
  // pri = how far the reading is from unremarkable, scaled by how much this
  // golfer's taste weights it. Specific lines get a nudge over general ones.
  const add = (k, dev, spec, lines) => cands.push({ k, pri: dev * (w[k] || 0.2) * spec, lines });

  if (f.waitMin >= 0.8 && f.waitedAt) {
    add('pace', 6 - c.pace + 3, 1.35, [
      'Stood on the ' + ord(f.waitedAt) + ' tee for ' + mins(f.waitMin) + '. That is the round, really.',
      cap(mins(f.waitMin)) + ' waiting on the ' + ord(f.waitedAt) + '. Somebody up front needs a nudge.',
    ]);
  }
  if (f.worst && f.worst.why === 'walk') {
    // the walk is already the worst thing about the routing when this fires —
    // courseFacts only names it when one green is a genuine trek from the tee
    add('flow', 6 - c.flow + 1.8, 1.3, [
      'The walk from the ' + ord(f.worst.n) + ' green to the next tee is a proper hike.',
      'Whoever put the ' + ord(f.worst.n) + ' green that far from the next tee owes me a lift.',
      'Everything is fine until you walk off the ' + ord(f.worst.n) + '. Then it is a route march.',
    ]);
  } else if (c.flow >= 8.6 && f.holes >= 3) {
    add('flow', c.flow - 6, 1.0, [
      'It routes beautifully — every green hands you the next tee.',
      'You never once wonder where you are going. That is harder than it looks.',
      'You walk off a green and the next tee is right there. Lovely routing.',
    ]);
  }
  if (f.best) {
    const b = f.best;
    const LINE = {
      shortpar4: ['The ' + ord(b.n) + ' is a genuinely good short par 4.',
        'I thought about the ' + ord(b.n) + ' all the way up the next fairway. Proper short par 4.',
        'Driver or not on the ' + ord(b.n) + '? I still do not know. That is the compliment.'],
      carry: ['The ' + ord(b.n) + ' makes you commit over the water. Best hole out here.',
        'That carry on the ' + ord(b.n) + ' is the shot I came for.',
        'Standing on the ' + ord(b.n) + ' tee with water in front of you is worth the green fee.'],
      testing: ['The ' + ord(b.n) + ' asks a real question off the tee.',
        'Bunkers on the ' + ord(b.n) + ' are in exactly the right place. Annoyingly.',
        'You have to pick a side on the ' + ord(b.n) + '. More holes should do that.'],
      big: ['The ' + ord(b.n) + ' is a proper three-shotter. I enjoyed that.',
        'Finally somewhere to let the driver out — the ' + ord(b.n) + '.',
        'Three good ones to get home on the ' + ord(b.n) + '. That is how a five should feel.'],
      pretty: ['The ' + ord(b.n) + ' is the prettiest hole on the property.',
        'I would frame the view from the ' + ord(b.n) + ' tee.',
        'I stopped on the ' + ord(b.n) + ' just to look at it. Do not change that hole.'],
    };
    add('design', c.design - 5.4, 1.4, LINE[b.why] || LINE.testing);
  }
  // a full set of pars is the architect's own work, and the people who came for
  // the golf are the ones who say so
  if (f.holes >= 4 && f.variety >= 0.99) {
    add('design', c.design - 5.2, 1.15, [
      'Threes, fours and fives, and not one of them the same shape. That is a golf course.',
      'You use every club in the bag out here. Rarer than it should be.',
      'A proper mix of pars. I never once knew what was coming next.',
    ]);
  }
  if (f.holes >= 3 && f.troubleRate >= 0.6 && p.arch.tough > 0.5) {
    add('design', c.design - 5.5, 1.05, [
      'There is something to think about on nearly every tee. I like being made to choose.',
      'You cannot switch off out here — the trouble is always in play somewhere.',
      'Miss it in the wrong place and you pay. Exactly as it should be.',
    ]);
  }
  if (f.holes >= 3 && f.variety < 0.5) {
    add('design', 6 - c.design + 1.6, 1.25, [
      'Every hole is the same hole. Give me one short one to think about.',
      'The pars barely change out here. A short par 3 would wake it up.',
    ]);
  }
  if (f.blind >= 1) {
    // a real complaint, priced like every other one: it grows with the number
    // of blind greens instead of shouting over the whole card
    const which = f.worst && f.worst.why === 'blind' ? 'the ' + ord(f.worst.n) : 'the green up the hill';
    add('design', 2.1 + f.blind * 0.6, 1.2, f.blind === 1 ? [
      'One blind approach is one too many, and ' + which + ' is it.',
      'You play ' + which + ' on faith. I would rather see where it finishes.',
    ] : [
      'Too many blind approaches for my taste — ' + f.blind + ' of them.',
      f.blind + ' greens you cannot see until you get there. Hard to love.',
    ]);
  }
  if (f.holes >= 2 && f.troubleRate < 0.2 && p.arch.tough > 0.5) {
    add('design', 6 - c.design + 1.2, 1.1, [
      'Nothing out here makes you choose. A bunker or two would fix it.',
      'It is a pleasant walk, but no hole ever asked me a question.',
    ]);
  }
  if (f.condition >= 3) {
    // good greens are worth saying once; they are not worth saying INSTEAD of
    // everything else, so the praise stops getting louder after the third mower
    add('condition', Math.min(2.4, c.condition - 6.5), 0.85, [
      'The greens roll true. You can see where the money went.',
      'Beautifully kept. I would put my name down here.',
      'Not a pitchmark or a bad lie all day. Somebody here cares.',
    ]);
  } else if (f.condition === 0) {
    add('condition', 6 - c.condition, 1.15, [
      'The greens are shaggy. Fix that before you build anything else.',
      'Nothing wrong with the golf that a greenkeeper would not solve.',
    ]);
  }
  if (f.beauty >= 0.65) {
    add('charm', c.charm - 6, 1.0, [
      'Lovely walk. Whoever planted those trees knew what they were doing.',
      'I would come back just for the walk, if I am honest.',
      'Even the bits between the holes are pretty. That is not an accident.',
    ]);
  } else if (f.beauty <= 0.12 && f.holes >= 2) {
    add('charm', 6 - c.charm, 0.95, [
      'It is a bit bare out there. A few trees would give it a shape.',
      'Nothing to look at between shots. Plant something.',
    ]);
  }
  if (f.worst && f.worst.why === 'tiny') {
    add('design', 6 - c.design + 1.4, 1.2, [
      'The ' + ord(f.worst.n) + ' green is a postage stamp. Brutal.',
      'You could not hold the ' + ord(f.worst.n) + ' green with a wedge and a prayer.',
    ]);
  }
  if (f.holes === 1) {
    cands.length = 0;
    cands.push({ k: 'design', pri: 99, lines: [
      'One hole is a start. I will come back when there are nine.',
      'Played the one hole twice. It is good — I want the other eight.',
    ] });
  }
  if (!cands.length) {
    cands.push({ k: 'design', pri: 0, lines: [
      'A fair test, fairly presented. No complaints.',
      'Good honest golf. I enjoyed the morning.',
    ] });
  }

  let best = cands[0];
  for (const c2 of cands) if (c2.pri > best.pri) best = c2;
  return { score, line: phrase(best.lines, p), topic: best.k, c };
}

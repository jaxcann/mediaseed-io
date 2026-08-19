// ─────────────────────────────────────────────────────────────────────────────
//  Fairway — the majors
// ─────────────────────────────────────────────────────────────────────────────
// Three championships, three golf courses, and not one borrowed thing. The
// events echo the SHAPE of golf's great weeks — a spring invitational at a
// beautiful parkland estate, a national open set up to hurt, a seaside
// championship played in the wind — because that shape is the fantasy. The
// names, the holes, the story and every yard of ground are invented here.
//
// A venue is authored the way an architect actually works: a routing (tee →
// dogleg → green), a corridor width, greens with a size, every bunker placed by
// hand where the good line runs, water where it asks a question, and the lie of
// the land. The
// builder at the bottom turns that into the game's own tiles, so these courses
// go through the exact same renderer, router, rating and shot simulation the
// player's course does. No second engine, no special case.
//
// Everything here is pure data and pure arithmetic — no three.js, no game
// state, no DOM.

// ── The championships ────────────────────────────────────────────────────────
// `week` is the nth Saturday of `month` (0-based month, 1-based week), so every
// event lands on a real weekend of the player's own calendar, every year,
// forever. Saturday is the first round; Sunday is the second and the trophy.

export const EVENTS = [
  {
    id: 'larkspur', venue: 'larkspur',
    name: 'The Larkspur Invitational', short: 'Larkspur',
    month: 3, week: 2,                       // second Saturday of April
    tint: 0xf3b7cd,
    kicker: 'By invitation · April',
    blurb: 'The prettiest week of the year, played on ground that has been ' +
      'gardened for a century. Every green is small, every miss is downhill, ' +
      'and the ones who win here have been here before.',
    // what it takes to be invited, what it pays, and what winning is worth
    need: 34, entry: 4200, purse: 180000, prestige: 22, field: 22,
    // The championship setup, in strokes per hole on top of how the course
    // plays for members: firmer greens, tucked pins, grown rough, back tees.
    // This is the difference between the golf course on the Tour page and the
    // examination the field actually sits — and it is why the National Open
    // has a winning score nobody at home would recognise.
    setup: 0.24, setupWhy: 'Greens at eleven and a half, pins on the shelves',
  },
  {
    id: 'ironmark', venue: 'ironmark',
    name: 'The Ironmark National Open', short: 'National Open',
    month: 5, week: 3,                       // third Saturday of June
    tint: 0x8ab4f8,
    kicker: 'Open to all · June',
    blurb: 'The hardest week in golf, and proud of it. Fairways the width of a ' +
      'cart path, rough to the knee, and a par that nobody is expected to beat. ' +
      'Anyone may enter. Almost nobody enjoys it.',
    need: 0, entry: 2600, purse: 220000, prestige: 26, field: 28,
    setup: 0.58, setupWhy: 'Rough at four inches and fairways mown to twenty paces',
  },
  {
    id: 'thornwick', venue: 'thornwick',
    name: 'The Thornwick Gale Championship', short: 'The Gale',
    month: 7, week: 3,                       // third Saturday of August
    tint: 0x6fc1ee,
    kicker: 'Championship links · August',
    blurb: 'Old ground beside a cold sea. The turf is fast, the greens are ' +
      'enormous, the bunkers are small and deep and unfair, and the wind decides ' +
      'everything. Play it along the ground or do not play it at all.',
    need: 18, entry: 3400, purse: 200000, prestige: 24, field: 26,
    setup: 0.72, setupWhy: 'A four-club wind off the bay, and ground running like a road',
  },
];
export const EVENT = {};
for (const e of EVENTS) EVENT[e.id] = e;

// ── The three golf courses ───────────────────────────────────────────────────
// Read a hole like a drawing: `tee` and `green` are the two ends, `line` the
// points the corridor bends through, `gr` the radius of the putting surface,
// `w` the half-width of the short grass.
//
// `bunkers` is [x, z, r] and every hole has its own — there is no formula and
// no fallback, because a bunker a formula placed is decoration and the game's
// own instruments can tell (a hazard more than 2.6 tiles off the line of play
// scores as clutter, one within 1.5 scores as design). Whole coordinates put a
// single deep pot on one tile; a .5 puts a two- or four-tile trap astride the
// tile edge. Sand within 2.3 of a pin is defending the green, which on a links
// whose greens run to 2.2 tiles of radius means the knight's-move tiles either
// side of the cup — pinching the only entrance a running ball has.

const LARKSPUR = {
  id: 'larkspur',
  name: 'Larkspur Vale',
  where: 'The Vale · founded 1897',
  theme: 'blossom',
  par: 36,
  // A parkland corridor: generous off the tee, framed hard by timber — and then
  // the smallest putting surfaces in championship golf at the end of it. `gr` is
  // the radius of the green in tiles, and 1.05 is the smallest a green can be
  // cut here and still hold a cup: five tiles of short grass. Seven of the nine
  // are cut that small; only the two three-shot holes get a target worth the
  // walk. Larkspur measures 5.9 tiles of putting surface a hole against
  // Ironmark's 8.6 and Thornwick's 13.7 — the story on the Tour page says these
  // greens are the smallest in the game, and the arithmetic has to agree.
  w: 2.1, roughW: 1.0, gr: 1.05,
  story: 'An old estate garden that somebody laid nine holes through and then ' +
    'spent a hundred years pruning. It is not long. It is not even especially ' +
    'hard until you miss, and then the ground takes the ball somewhere you did ' +
    'not want it. The greens are the smallest in championship golf, and they ' +
    'sit on the tops of things.',
  // a creek through the low ground on the outward half, and the pond that
  // fronts the home green — the only two drops of water on the property, and
  // both of them decide a shot
  water: [[-4, -13, 2, -12], [2, -12, 3, -9], [3, -9, 7, -8], [2, -2, 4, 0]],
  // The plank bridge over the creek on the 3rd. The hole is a carry and stays
  // one — you play OVER the water, you do not play off the deck — but a course
  // that makes its field walk four hundred yards west to get to a green forty
  // yards away is not a course, it is an oversight. Laid where the walk goes.
  bridges: [[0, -13], [0, -12]],
  // the land: a valley floor with three high shelves cut into it
  elev: [[11, -2, 2.4, 1], [-9, 3, 2.2, 2], [-11, -1, 3.6, 1], [-13, 10, 3.0, 1],
         [4, 14, 3.2, 1], [12, 7, 2.0, 1]],
  trees: { p: 0.34, near: 4.6, clear: 1.6 },
  flowers: 0.16,
  holes: [
    { tee: [3, 4], line: [[7, 2]], green: [11, -2],
      name: 'Dogwood',
      // the corner bunker is the hole: carry it and you have a flick in, lay
      // off it and the shelf green is side-on and unholdable
      bunkers: [[7.5, 0.5, 0.9], [12.5, -1, 0.9], [9.5, -3, 0.9]],
      note: 'Bends right around a stand of blossom and climbs to a shelf green. ' +
        'Carry the corner bunker and there is nothing left to do. Miss it by a ' +
        'yard and the green turns side-on and will not hold anything.' },
    { tee: [13, -1], line: [[12, -7]], green: [6, -13], gr: 1.45,
      name: 'The Long Meadow',
      bunkers: [[11.5, -4.5, 0.9], [7.5, -14, 0.9], [4, -12, 0.8]],
      note: 'The one hole here you can overpower — until the creek in front of ' +
        'the green makes you decide whether you meant it.' },
    { tee: [4, -14], green: [-1, -11], gr: 1.05,
      name: 'Over the Cut',
      // no fairway sand: there is no fairway. Two traps behind, because the
      // only miss anybody makes here is the brave one.
      bunkers: [[-2.5, -12, 0.9], [1, -10, 0.8]],
      note: 'A short iron across the water to a green the size of a tablecloth. ' +
        'Two hundred yards of nothing to think about, and one shot to get wrong.' },
    { tee: [-3, -10], line: [[-8, -11]], green: [-12, -8],
      name: 'Sexton',
      bunkers: [[-7, -10, 0.8], [-13.5, -9, 0.9], [-10, -7, 0.8]],
      note: 'Straight, flat, quiet. It gives up birdies to people who have ' +
        'stopped expecting them.' },
    { tee: [-13, -6], line: [[-12, -1]], green: [-9, 3], gr: 1.15,
      name: 'The Climb',
      // the short bunker is the whole examination: you cannot see the surface,
      // so you take the club you WANT to take, and it is one too few
      bunkers: [[-10.5, 2, 0.9], [-7, 4, 0.8], [-10.5, -2, 0.9]],
      note: 'Uphill all the way, into a green benched two levels above you. ' +
        'The bunker short of it has swallowed more good iron shots than the ' +
        'water on the property. Take one more club than you believe.' },
    { tee: [-11, 5], green: [-14, 10], gr: 1.15,
      name: 'Bell Tower',
      // six pots in a ring, which is a thing the note has always claimed and
      // now a thing the ground actually is
      bunkers: [[-13, 9, 0.8], [-15, 9, 0.8], [-12, 10, 0.8],
                [-16, 10, 0.8], [-13, 11, 0.8], [-15, 11, 0.8]],
      note: 'The short hole in the corner of the property, played to a green ' +
        'ringed by six pots. The card says three. The ground disagrees.' },
    { tee: [-12, 12], line: [[-4, 14]], green: [3, 14], gr: 1.5,
      name: 'The Avenue',
      // two staggered cross bunkers in the second-shot zone — go at it and you
      // must clear both, lay up and you must decide which side to lay up on
      bunkers: [[-7.5, 13.5, 0.9], [-3, 13, 0.8], [4.5, 15, 0.9], [1, 13, 0.8]],
      note: 'Five hundred and thirty yards down an avenue of old timber. Reachable ' +
        'on a still afternoon by exactly the sort of player who should not try.' },
    { tee: [5, 13], line: [[9, 11]], green: [12, 7],
      name: 'Wren',
      bunkers: [[9, 10, 0.8], [13.5, 7.5, 0.9], [10, 6, 0.8]],
      note: 'A downhill three-quarter par four to a green that falls away on ' +
        'every side. Everybody hits it. Half of them putt from off it.' },
    { tee: [11, 5], line: [[7, 4]], green: [3, 2], gr: 1.15,
      name: 'Home',
      // sand short and left, water long — so the safe shot and the safe shot
      // are on opposite sides, and one of them is wrong
      bunkers: [[1, 1, 0.8], [1, 3, 0.8], [7.5, 3, 0.9]],
      note: 'Not long, not fair, and played in front of everybody. The green ' +
        'sits on the last shelf, and the water is where the safe shot goes.' },
  ],
};

const IRONMARK = {
  id: 'ironmark',
  name: 'Ironmark',
  where: 'The Ironmark Club · founded 1921',
  theme: 'summer',
  par: 35,
  // The setup IS the architecture: corridors half a normal width, rough deep
  // enough that finding it costs you a shot before you have swung. The greens
  // are ordinary — nine tiles, a club green — because the examination here is
  // getting the ball onto the short grass, not what happens once you are there.
  w: 1.25, roughW: 2.6, gr: 1.5,
  story: 'Ironmark is a perfectly ordinary members\' course for fifty-one weeks ' +
    'of the year. Then the National Open comes, the fairways are mown to twenty ' +
    'paces, the rough is grown to the knee, and the same holes become the hardest ' +
    'examination in the game. Par is not a target here. Par is a score.',
  water: [[-11, 8, -9, 10]],
  elev: [[2, -5, 2.0, 1], [-14, -2, 2.6, 1], [6, 12, 3.0, 1], [-1, 2, 2.2, 1]],
  // timber right down to the edge of the rough — the corridor IS the hole
  trees: { p: 0.42, near: 5.4, clear: 2.4, onRough: true },
  flowers: 0.04,
  holes: [
    { tee: [2, 4], green: [2, -5],
      name: 'Toll Gate',
      bunkers: [[1, 0, 0.8], [3, -1, 0.8], [0.5, -6, 0.9], [3.5, -4, 0.9]],
      note: 'A straight par four with nowhere to go. Twenty-two paces of fairway, ' +
        'trees both sides, and a first tee shot that has ended more weeks than it ' +
        'has started.' },
    { tee: [4, -7], line: [[9, -8]], green: [13, -11],
      name: 'The Foundry',
      bunkers: [[9, -9, 0.8], [14, -12.5, 0.9], [11.5, -10, 0.9]],
      note: 'Bends right, tilts left. The tee shot that holds the fairway is the ' +
        'one nobody wants to hit.' },
    { tee: [12, -13], green: [7, -15], gr: 1.25,
      name: 'Anvil',
      bunkers: [[9, -14, 0.8], [5, -16, 0.8], [6, -13, 0.8]],
      note: 'A hundred and ninety yards to the smallest green on the property, ' +
        'with sand short and long and rough everywhere else. A three here is worth ' +
        'two birdies.' },
    { tee: [4, -14], line: [[-2, -15]], green: [-8, -14],
      name: 'The Long Walk',
      bunkers: [[0, -15, 0.8], [-9.5, -15, 0.9], [-6, -13, 0.8]],
      note: 'Four hundred and twenty, dead flat, dead straight, dead quiet. It ' +
        'simply asks for fourteen good shots in a row over two days.' },
    { tee: [-11, -13], line: [[-13, -8]], green: [-14, -2],
      name: 'Quarry',
      bunkers: [[-12, -10, 0.8], [-13, -4, 0.8], [-15.5, -1, 0.9]],
      note: 'Uphill into the corner of the estate. The green is above you and ' +
        'the miss is below you, and the pitch back up is unplayable.' },
    { tee: [-13, 0], green: [-8, 4], gr: 1.55,
      name: 'The Pulpit',
      bunkers: [[-10, 2, 0.8], [-9, 6, 0.8], [-6, 3, 0.8]],
      note: 'The one hole here with a view. Take a moment. You are about to lose ' +
        'a shot to the field.' },
    { tee: [-10, 6], green: [-12, 13], gr: 1.55,
      name: 'Short Iron',
      bunkers: [[-12, 10, 0.8], [-13, 11, 0.8], [-10, 14, 0.8]],
      note: 'Two hundred and fifty-five yards. Drivable, if you fancy carrying ' +
        'the water and holding a green built to reject everything.' },
    { tee: [-9, 14], line: [[-2, 15]], green: [6, 12], gr: 1.7,
      name: 'The Reach',
      bunkers: [[-1, 13, 0.8], [3, 12, 0.8], [7, 10, 0.8], [4, 13, 0.8]],
      note: 'The only genuine chance on the card, and it is still five hundred ' +
        'and thirty yards to a raised green with sand on the shoulders.' },
    { tee: [8, 10], line: [[4, 7]], green: [-1, 2],
      name: 'Ironmark',
      bunkers: [[4, 6, 0.8], [2, 4, 0.8], [-2, 0, 0.8], [1, 3, 0.8]],
      note: 'The hole the championship is named after. Four hundred and twenty ' +
        'downhill into the narrowest fairway in golf, with the clubhouse watching. ' +
        'Leaders have made six here on Sunday.' },
  ],
};

const THORNWICK = {
  id: 'thornwick',
  name: 'Thornwick Links',
  where: 'Thornwick Bay · golf played here since 1764',
  theme: 'coastal',
  par: 36,
  // links width and links greens: enormous short grass, enormous putting
  // surfaces, and pot bunkers small enough to be genuinely unlucky
  w: 2.5, roughW: 1.6, gr: 2.2,
  story: 'Nobody built Thornwick. Somebody found it, cut nine cups into the ' +
    'dunes and let the sheep do the rest. The turf runs so fast that a good drive ' +
    'takes ninety yards of bounce, the greens are the size of tennis courts, and ' +
    'the bunkers are small, round and deep and will cost you a shot every time. ' +
    'The wind off the bay is the ninth architect.',
  water: [[13, -16, 15, 15], [8, -16, 12, -15]],
  // dunes: long low ridges rather than plateaus
  elev: [[4, -2, 3.4, 1], [-3, -9, 3.0, 1], [-8, 3, 3.4, 1], [-6, -3, 2.6, 1],
         [2, 9, 3.0, 1], [-13, -12, 3.0, 1], [10, 3, 2.4, 1],
         // the three green sites that sit up on the ridge — 5 is blind over it,
         // 6 falls off the far side into its bowl, and 9 climbs the last of it
         [-11, -1, 2.6, 1], [-2, 13, 2.4, 1], [-4, 1, 2.6, 1]],
  // not one tree. There never were any, and the wind would not allow it.
  trees: null,
  flowers: 0,
  holes: [
    { tee: [2, 4], green: [7, -3],
      name: 'The Bay',
      bunkers: [[5, 0, 0.8], [6, -1, 0.8], [9, -4, 0.8], [6, -5, 0.8]],
      note: 'Out towards the water with the whole bay in front of you. A wide ' +
        'fairway, a huge green, and absolutely no excuse.' },
    { tee: [9, -5], green: [10, -14],
      name: 'Gullet',
      bunkers: [[9, -8, 0.8], [9, -10, 0.8], [12, -15, 0.8], [8, -13, 0.8]],
      note: 'Runs along the shore with the beach on the right the entire way, ' +
        'and two pots dug into the left exactly where the sensible line goes. ' +
        'There is no third option.' },
    { tee: [7, -15], green: [2, -13], gr: 2.0,
      name: 'Cormorant',
      bunkers: [[4, -14, 0.8], [1, -11, 0.8], [0, -14, 0.8]],
      note: 'A hundred and ninety across the corner of the bay. Downwind it is a ' +
        'flick. Into the wind it is a driver, and people have taken five.' },
    { tee: [-1, -14], line: [[-8, -12]], green: [-15, -12], gr: 2.2,
      name: 'The Turn',
      bunkers: [[-6, -13, 0.8], [-10, -13, 0.8], [-13, -13, 0.8], [-14, -10, 0.8]],
      note: 'Four hundred and ninety along the dunes, and the point where the ' +
        'wind stops helping. Play it as a three-shot hole and take your four.' },
    { tee: [-15, -8], green: [-11, -1],
      name: 'Whin',
      bunkers: [[-13, -5, 0.8], [-14, -6, 0.8], [-9, -2, 0.8], [-12, 1, 0.8]],
      note: 'Blind from the tee over the ridge. There is more room out there ' +
        'than you think, and there always has been.' },
    { tee: [-12, 1], green: [-14, 7], gr: 2.0,
      name: 'The Kettle',
      bunkers: [[-12, 6, 0.8], [-12, 8, 0.8], [-13, 5, 0.8],
                [-13, 9, 0.8], [-15, 5, 0.8], [-15, 9, 0.8]],
      note: 'A short hole to a green in a bowl, ringed by six pot bunkers. ' +
        'Miss the green and you can putt it. Miss the bowl and you cannot.' },
    { tee: [-12, 10], line: [[-7, 12]], green: [-2, 13],
      name: 'Sheep Gate',
      bunkers: [[-10, 11, 0.8], [-7, 12, 0.8], [0, 12, 0.8], [-3, 15, 0.8]],
      note: 'Turns for home. Downwind, in front of the dunes, and the only hole ' +
        'on the back half that has ever felt friendly.' },
    { tee: [1, 14], line: [[6, 13]], green: [11, 10],
      name: 'The Gale',
      bunkers: [[4, 13, 0.8], [7, 12, 0.8], [9, 9, 0.8], [12, 12, 0.8], [10, 8, 0.8]],
      note: 'The hole the championship is named after, played straight into ' +
        'whatever is coming off the water. Three hundred and seventy-seven yards ' +
        'that have needed a driver and a three wood.' },
    { tee: [10, 8], line: [[4, 5]], green: [-3, 1], gr: 2.4,
      name: 'Thornwick',
      bunkers: [[8, 7, 0.8], [5, 5, 0.8], [1, 3, 0.8]],
      note: 'Five hundred and seventeen home, turning away from the water and ' +
        'climbing the last of the ridge to the widest green in golf. Nothing ' +
        'guards it. Nothing has to — men have taken four putts from the far corner.' },
  ],
};

export const VENUES = [LARKSPUR, IRONMARK, THORNWICK];
export const VENUE = {};
for (const v of VENUES) VENUE[v.id] = v;

// ── When ─────────────────────────────────────────────────────────────────────

// the nth Saturday of a month, as a local Date at midnight
export function nthSaturday(year, month, nth) {
  let n = 0;
  for (let day = 1; day <= 31; day++) {
    const d = new Date(year, month, day);
    if (d.getMonth() !== month) break;
    if (d.getDay() === 6 && ++n === nth) return d;
  }
  return new Date(year, month, 1);
}

// Saturday and Sunday of an event's weekend, plus the Monday entries open on.
// Entries open a fortnight out and close when the first ball is struck.
export function weekendOf(ev, year) {
  const sat = nthSaturday(year, ev.month, ev.week);
  const sun = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() + 1);
  const open = new Date(sat.getFullYear(), sat.getMonth(), sat.getDate() - 12);
  return { sat, sun, open };
}

// ── The week's shape ─────────────────────────────────────────────────────────
// A championship weekend has to be FINDABLE. The player does not schedule their
// life around it, so the two rounds are laid out to cover the hours somebody
// actually opens a game: round one goes off from half past eight and the last
// group is in between two and three, round two runs from one o'clock until the
// trophy somewhere around half five. Whenever you wander in on a championship
// weekend — Saturday breakfast, Saturday afternoon, Sunday tea — there is golf
// being played rather than a finished scoreboard.
//
// Two numbers set that shape and they pull against each other: the gap between
// tee times decides how LONG a round takes to get through the field, and the
// length of a round decides how MANY groups are out there at once (round ÷ gap).
// Thirty-six minutes between threeballs holds a couple of groups on the course
// while spreading a full draw over six and a half hours. The final round goes
// off every forty from a field the cut has already halved, leaders last, which
// is how a Sunday is supposed to end.

export const FIRST_TEE = 8 * 60 + 30; // Saturday 08:30, first group away
export const TEE_GAP = 36;            // …and every thirty-six minutes after it
export const R2_FIRST = 13 * 60;      // Sunday 13:00
export const R2_GAP = 40;             // fewer groups, wider intervals, leaders last
export const GROUP_N = 3;             // threeballs
// Real minutes for one player's 18 holes, and the one number in this file that
// is a MEASUREMENT rather than a decision. It is what the game's own
// shot-by-shot simulation actually takes for a championship threeball to play
// the venue's nine holes twice — measured on all three courses, which agree to
// within a minute because they are all a full property walked at the same
// championship tempo (see TOUR_PACE in game.js: major championship golf is the
// slowest golf there is, and the game's existing pace-of-play knob is what
// makes it so).
//
// The published leaderboard and the group you are standing behind therefore
// agree: nobody is ever seen holing out on the last while the board still has
// them on the sixteenth.
// Re-measured after the pace-of-play budget was restated in the unit a player
// experiences — TEE TO TEE rather than tee to cup (game.js holePaceS) — and
// after SERIAL_K was re-fitted so the plan the budget writes is the golf that
// actually comes out of it: 48.8 · 49.7 · 49.3 minutes at Thornwick, Larkspur
// and Ironmark, with TOUR_SLOWER still 1.45 (see __fairway.tourPace, which
// prints the implied number against this one).
export const ROUND_MIN = 49;

export function teeMinute(round, groupIdx) {
  return round === 2 ? R2_FIRST + groupIdx * R2_GAP : FIRST_TEE + groupIdx * TEE_GAP;
}
// holes completed by `minute` for a player who went off at `teeMin`
export function through(minute, teeMin) {
  if (minute <= teeMin) return 0;
  return Math.max(0, Math.min(18, Math.floor((minute - teeMin) / (ROUND_MIN / 18))));
}
// the last group of a round is in the clubhouse by here
export function lastIn(round, groups) {
  return teeMinute(round, Math.max(0, groups - 1)) + ROUND_MIN + 6;
}

// ── Building the ground ──────────────────────────────────────────────────────
// Everything above becomes tiles here, once, and is cached. The output is
// exactly the shape the game's own save carries — { tiles, elev, pairs } — so
// the renderer, the router, the rating and the shot simulation cannot tell a
// championship venue from a course the player painted.

const SIZE = 32;                      // every venue is a full 32 × 32 property
const HALF = SIZE / 2;
// the clubhouse plot is club ground on every property in the game; nothing is
// ever written into it (see game.js CLUB / isClub)
const CLUB = { x0: -2, x1: 0, z0: 5, z1: 6 };

function inB(x, z) { return x >= -HALF && x < HALF && z >= -HALF && z < HALF; }
function isClub(x, z) { return x >= CLUB.x0 && x <= CLUB.x1 && z >= CLUB.z0 && z <= CLUB.z1; }
function key(x, z) { return x + ',' + z; }

// deterministic value noise — the scatter has to be the same course every time
// anyone opens it, on any machine
function h2(x, z, salt) {
  let n = Math.sin((x + 1013) * 127.1 + (z + 371) * 311.7 + salt * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

// paint a disc, respecting a rank order so a fairway never eats a green
const RANK = { grass: 0, rough: 1, fairway: 2, path: 2, bunker: 3, water: 4,
  green: 5, tee: 6, flag: 7, tree: 3, flower: 2, sign: 3, bridge: 8 };

function put(T, x, z, type, force) {
  if (!inB(x, z) || isClub(x, z)) return;
  const k = key(x, z);
  const cur = T[k] || 'grass';
  if (!force && RANK[cur] >= RANK[type]) return;
  T[k] = type;
}

function disc(T, cx, cz, r, type, force) {
  const r2 = r * r;
  for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
    for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
      const dx = x - cx, dz = z - cz;
      if (dx * dx + dz * dz <= r2) put(T, x, z, type, force);
    }
  }
}

// stroke a polyline with a round brush — this is the corridor
function stroke(T, pts, r, type) {
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d * 3));
    for (let s = 0; s <= n; s++) {
      const t = s / n;
      disc(T, a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, r, type);
    }
  }
}

function rect(T, x0, z0, x1, z1, type) {
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) put(T, x, z, type, true);
  }
}

// The walk from a green to the next tee, laid as a path. A championship venue
// is a place with made-up walks — the ground between a green and the next tee
// has had ten thousand pairs of shoes over it and it shows — and the path is
// also the cheapest tile in the game to walk on (see GOLFER_COST), so this is
// what the field genuinely routes along between holes.
//
// It writes over SHORT GRASS as well as rough, which is the whole reason it
// exists: greens sit inside their own fairway corridor, so a walk that refused
// to cross a fairway would never leave the green. Greens, tees, pins and sand
// are left alone — you walk round a bunker, not through it — and water under a
// walk becomes a bridge rather than a swim.
const WALK_KEEP = { green: 1, flag: 1, tee: 1, bunker: 1, sign: 1, path: 1, bridge: 1 };
function walkway(T, from, to) {
  const pts = [[from[0], from[1]], [to[0], from[1]], [to[0], to[1]]];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
    for (let s = 0; s <= n; s++) {
      const t = n ? s / n : 0;
      const x = Math.round(a[0] + (b[0] - a[0]) * t);
      const z = Math.round(a[1] + (b[1] - a[1]) * t);
      if (!inB(x, z) || isClub(x, z)) continue;
      const cur = T[key(x, z)] || 'grass';
      if (WALK_KEEP[cur]) continue;
      T[key(x, z)] = cur === 'water' ? 'bridge' : 'path';
    }
  }
}

// A sign stands BEHIND the markers, on the tee's own tile neighbour — which on
// a course this well mown means writing over the fairway, because that is what
// is there. It has to be orthogonally adjacent or the game does not see it:
// signedTees() reads the four neighbours of a tee and nothing else, and a full
// set is worth real points of the Flow rating. Sand, water and putting surfaces
// are never built on, so the search falls back through the other three sides.
function teeSign(T, h) {
  const nxt = (h.line && h.line[0]) || h.green;
  const ax = nxt[0] - h.tee[0], az = nxt[1] - h.tee[1];
  const L = Math.hypot(ax, az) || 1;
  const ux = ax / L, uz = az / L;
  // behind first, then either shoulder, then — last resort — down the line
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]]
    .map(d => ({ d, dot: d[0] * ux + d[1] * uz }))
    .sort((a, b) => a.dot - b.dot);
  for (const { d } of dirs) {
    const x = h.tee[0] + d[0], z = h.tee[1] + d[1];
    if (!inB(x, z) || isClub(x, z)) continue;
    const cur = T[key(x, z)] || 'grass';
    if (cur === 'water' || cur === 'bunker' || cur === 'green' ||
        cur === 'flag' || cur === 'tee' || cur === 'bridge') continue;
    T[key(x, z)] = 'sign';
    return true;
  }
  return false;
}

function elevAt(E, x, z) { return E[key(x, z)] || 0; }

export function buildVenue(v) {
  if (v._built) return v._built;
  const T = {}, E = {};

  // 1 · the land, before anybody mowed anything
  for (const [cx, cz, r, lvl] of (v.elev || [])) {
    const r2 = r * r;
    for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++) {
      for (let z = Math.floor(cz - r); z <= Math.ceil(cz + r); z++) {
        if (!inB(x, z) || isClub(x, z)) continue;
        const dx = x - cx, dz = z - cz;
        const d2 = dx * dx + dz * dz;
        if (d2 > r2) continue;
        // shoulders fall away one level, so a plateau reads as a plateau
        const step = d2 > r2 * 0.42 ? Math.max(1, lvl - 1) : lvl;
        E[key(x, z)] = Math.max(elevAt(E, x, z), step);
      }
    }
  }

  // …and no cliffs. The game's router refuses a step of more than one level,
  // so two shelves that happen to touch would fence a hole off from its green.
  // Three passes settle every ridge this data can produce.
  for (let pass = 0; pass < 3; pass++) {
    for (let x = -HALF; x < HALF; x++) {
      for (let z = -HALF; z < HALF; z++) {
        const e = elevAt(E, x, z);
        if (e < 2) continue;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const n = elevAt(E, x + dx, z + dz);
          if (n < e - 1 && inB(x + dx, z + dz) && !isClub(x + dx, z + dz)) {
            E[key(x + dx, z + dz)] = e - 1;
          }
        }
      }
    }
  }

  // 2 · water, which nothing else may overwrite — and the decks laid across it
  for (const [x0, z0, x1, z1] of (v.water || [])) rect(T, x0, z0, x1, z1, 'water');
  for (const [x, z] of (v.bridges || [])) put(T, x, z, 'bridge', true);

  // 3 · the holes: rough shoulder first, then short grass inside it
  const pairs = [];
  for (const h of v.holes) {
    const w = h.w || v.w;
    const pts = [h.tee].concat(h.line || []).concat([h.green]);
    stroke(T, pts, w + (h.roughW == null ? v.roughW : h.roughW), 'rough');
  }
  for (const h of v.holes) {
    const w = h.w || v.w;
    const pts = [h.tee].concat(h.line || []).concat([h.green]);
    stroke(T, pts, w, 'fairway');
  }

  // 4 · greens, pins and tees
  for (const h of v.holes) {
    disc(T, h.green[0], h.green[1], h.gr || v.gr, 'green');
    put(T, h.green[0], h.green[1], 'flag', true);
    put(T, h.tee[0], h.tee[1], 'tee', true);
    pairs.push({ tee: { x: h.tee[0], z: h.tee[1] },
      flag: { x: h.green[0], z: h.green[1] }, locked: true });
  }

  // 5 · sand, every trap of it placed by hand up in the hole data.
  // (rank order does the work: sand fills fairway and rough, and can never
  // swallow a green, a tee, a pin or a lake)
  for (const h of v.holes) {
    for (const [x, z, r] of h.bunkers) disc(T, x, z, r, 'bunker');
  }

  // 6 · the walk: door → 1st tee, green → next tee, last green → door
  walkway(T, [1, 4], v.holes[0].tee);
  for (let i = 0; i < v.holes.length - 1; i++) walkway(T, v.holes[i].green, v.holes[i + 1].tee);
  walkway(T, v.holes[v.holes.length - 1].green, [1, 4]);

  // 7 · a sign on every tee — championship venues are signed, and the game's
  //     Flow rating knows it
  for (const h of v.holes) teeSign(T, h);

  // 8 · the timber. Trees frame corridors — they are never scattered into the
  //     middle of a property that is meant to be open. Deterministic, so this
  //     is the same forest for everybody, forever.
  const tr = v.trees || { p: 0, near: 0 };
  if (tr.p > 0) {
    const near = tr.near, clear = tr.clear || 1.4;
    for (let x = -HALF; x < HALF; x++) {
      for (let z = -HALF; z < HALF; z++) {
        if (isClub(x, z)) continue;
        const here = T[key(x, z)] || 'grass';
        if (here !== 'grass' && !(tr.onRough && here === 'rough')) continue;
        // how close is the nearest mown ground? Trees live on the edge of it.
        let d = 99;
        for (let ox = -Math.ceil(near); ox <= Math.ceil(near) && d > 1; ox++) {
          for (let oz = -Math.ceil(near); oz <= Math.ceil(near); oz++) {
            const t = T[key(x + ox, z + oz)];
            if (t === 'fairway' || t === 'green' || t === 'tee') {
              d = Math.min(d, Math.hypot(ox, oz));
            }
          }
        }
        if (d > near || d < clear) continue;
        // denser as you go further from the short grass — a treeline, not confetti
        const p = tr.p * Math.min(1, (d - clear + 0.2) / 1.8);
        if (h2(x, z, 3) < p) T[key(x, z)] = 'tree';
      }
    }
  }

  // 9 · flowers, around the tees and the clubhouse, where a club actually
  //     plants. A tee sits in the middle of its own mown corridor, so the beds
  //     go OUTSIDE it — the band is wide enough to clear the fairway and its
  //     rough shoulder and land on the unmown ground where a gardener works.
  if (v.flowers) {
    const beds = v.holes.map(h => h.tee).concat([[1, 4]]);
    for (const c of beds) {
      for (let ox = -4; ox <= 4; ox++) {
        for (let oz = -4; oz <= 4; oz++) {
          const x = c[0] + ox, z = c[1] + oz;
          if (!inB(x, z) || isClub(x, z)) continue;
          const cur = T[key(x, z)] || 'grass';
          if (cur !== 'rough' && cur !== 'grass') continue;
          if (h2(x, z, 9) < v.flowers) T[key(x, z)] = 'flower';
        }
      }
    }
  }

  v._built = { tiles: T, elev: E, size: SIZE, pairs };
  return v._built;
}

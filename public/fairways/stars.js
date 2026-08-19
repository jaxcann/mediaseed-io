// ─────────────────────────────────────────────────────────────────────────────
//  Fairway — the notables
// ─────────────────────────────────────────────────────────────────────────────
// The golfers whose opinion of your course is worth something, and the taste
// they hold it with. Pure data and pure arithmetic: no three.js, no game state.
// game.js hands this module ONE object — thirteen readings taken off the tiles
// the player actually laid — and gets back a mark out of ten and the two or
// three sentences that earned it.
//
// The design rule, and the whole point of the area: a star is not a bigger
// number. A star is a POINT OF VIEW. Every one of them weights the same
// thirteen readings differently, with signs, so the identical golf course can
// be an 8.9 to the architecture nerd and a 5.4 to the long bomber standing
// beside her. Disagreement is the feature. Chasing one star's ten will cost
// you another star's seven, and that is the decision the player is here to make.
//
// Everybody in this file is invented — the names, the tours, the biographies,
// the quotes and the opinions. The archetypes are golf's own (the precision
// machine, the bomber, the elder statesman, the fearless amateur); no person,
// nickname or event belongs to anybody real.

// ── The five tiers ───────────────────────────────────────────────────────────
// `need` is the club prestige (0–100, see game.js prestigeOf) a tier will not
// travel below. `ask` is the mark they must have given your course before they
// would take a membership seriously — a Legend has to be genuinely impressed,
// a local standout just has to enjoy the morning. `join` prices the joining
// arrangement in ROUNDS of green fee, so recruitment stays expensive in the
// same currency the club actually earns. `pull` is what having them on the
// books does for prestige.

export const TIERS = [
  { id: 'standout', rank: 1, label: 'Local Standout', short: 'Standout',
    need: 0, ask: 6.2, join: 24, pull: 2.5, rate: 0.45, dev: 1.00,
    blurb: 'The best player at some other club' },
  { id: 'touring', rank: 2, label: 'Touring Pro', short: 'Tour Pro',
    need: 16, ask: 6.8, join: 60, pull: 5, rate: 0.30, dev: 0.80,
    blurb: 'Keeps a card, chases a season' },
  { id: 'winner', rank: 3, label: 'Tour Winner', short: 'Winner',
    need: 36, ask: 7.4, join: 150, pull: 9, rate: 0.20, dev: 0.62,
    blurb: 'Has held a trophy on a Sunday' },
  { id: 'major', rank: 4, label: 'Major Champion', short: 'Major',
    need: 58, ask: 8.0, join: 380, pull: 15, rate: 0.13, dev: 0.46,
    blurb: 'Won one of the four that count' },
  { id: 'legend', rank: 5, label: 'Legend', short: 'Legend',
    need: 80, ask: 8.6, join: 900, pull: 24, rate: 0.08, dev: 0.32,
    blurb: 'The game keeps their name' },
];
export const TIER = {};
for (const t of TIERS) TIER[t.id] = t;

// ── The vocabulary ───────────────────────────────────────────────────────────
// Thirteen readings, each 0–1, each measured off the ground in game.js. A star's
// taste is a signed weight per reading: positive means "more of this pleases
// me", negative means "and this is what I cannot stand".
//
// Every quality carries four sentences, because a reading only becomes a REASON
// once you know who is looking at it:
//   hiOk  — it runs high, and they wanted it high     (praise)
//   hiBad — it runs high, and they wanted it low      (complaint)
//   loOk  — it runs low, and they wanted it low       (praise)
//   loBad — it runs low, and they wanted it high      (complaint)
// Nothing here is a mood dial: each line names a thing on the property and,
// where it is a complaint, the tool that fixes it.
//
// `axis` names the two ends of the reading. The Club Book draws it as a rule
// with the star's preference on it and a tick where the course actually reads,
// which is the one thing on the page that says HOW FAR you are from pleasing
// somebody rather than merely that you are not.

export const QUALITIES = {
  width: { label: 'Fairway width', axis: 'Tight ↔ Wide',
    hiOk: 'Room to swing at it. You can chase a driver out here and still find short grass.',
    hiBad: 'The fairways are so wide the tee shot stops being a question.',
    loOk: 'Tight corridors, and rightly so — you have to drive it straight to score.',
    loBad: 'There is nowhere to put a tee shot. Widen a corridor or two.' },
  strategy: { label: 'Strategic width', axis: 'One route ↔ Several',
    hiOk: 'Every tee gives you two ways to play it, and both of them cost something.',
    hiBad: 'Too clever by half. Now and then a hole should just be a hole.',
    loOk: 'Straightforward golf, honestly presented. No tricks in it.',
    loBad: 'Nothing out here asks me to choose. Angles, not obstacles.' },
  hazardPurpose: { label: 'Hazard purpose', axis: 'Scattered ↔ On the line',
    hiOk: 'The bunkers sit exactly where a good player wants to go. That is the craft.',
    hiBad: 'The trouble is right in the firing line. Punishing, not interesting.',
    loOk: 'Nothing lurking where it has no business being.',
    loBad: 'Nothing sits where anybody is actually trying to play. Put a bunker on a line somebody wants.' },
  carries: { label: 'Forced carries', axis: 'None ↔ Several',
    hiOk: 'Water in front of you and a decision to make. That is what I turn up for.',
    hiBad: 'Too much of it has to be flown. Not every good shot travels through the air.',
    loOk: 'You can always play it along the ground. A course should have a back door.',
    loBad: 'Nothing to carry. Put water in front of one green and watch the round change.' },
  greenDefence: { label: 'Green defence', axis: 'Open ↔ Guarded',
    hiOk: 'No two greens are defended the same way. You think on every approach.',
    hiBad: 'Every green is fortified. Let one of them just be a target.',
    loOk: 'The greens are gettable — a fair reward for a drive in the right place.',
    loBad: 'The greens defend themselves with nothing. Bunker one, flood another, shrink a third.' },
  greenSize: { label: 'Green size', axis: 'Small ↔ Generous',
    hiOk: 'Big surfaces and real pin positions. Generous exactly where it should be.',
    hiBad: 'The greens are enormous. Hitting one means nothing at all.',
    loOk: 'Small targets. A wedge in here is a proper golf shot.',
    loBad: 'The greens are postage stamps. Brutal is not the same as clever — grow one or two.' },
  roughness: { label: 'Rough', axis: 'Clean ↔ Thick',
    hiOk: 'The rough frames it. Miss the fairway and you pay, which is how it should be.',
    hiBad: 'Thick stuff everywhere is the cheapest difficulty there is.',
    loOk: 'Clean lies off the fairway. Recovery golf is golf too.',
    loBad: 'No rough anywhere. Cut some in — these corridors need a shoulder.' },
  elevation: { label: 'Elevation', axis: 'Flat ↔ Moving',
    hiOk: 'The ground moves and the holes move with it. Wonderful use of the land.',
    hiBad: 'Too much climbing. The golf gets lost somewhere up the hill.',
    loOk: 'Flat and honest. Everything is right in front of you.',
    loBad: 'Table flat. Raise a green — give me one shot uphill to look at.' },
  blindness: { label: 'Blind shots', axis: 'All visible ↔ Blind',
    hiOk: 'A blind approach or two is part of the charm. You play it on faith.',
    hiBad: 'Approaches played blind, and I never once knew what I was hitting to.',
    loOk: 'You can see every single thing you are being asked to do. That is design.',
    loBad: 'Everything is laid out in front of you. A little mystery would not hurt.' },
  routing: { label: 'Routing', axis: 'Long walks ↔ Green to tee',
    hiOk: 'You walk off a green and the next tee is right there. Beautifully routed.',
    hiBad: 'It routes so tightly you never get a moment between holes.',
    loOk: 'A walk between holes, but the ground is worth walking.',
    loBad: 'Half the round is spent hiking from a green to the next tee.' },
  parBalance: { label: 'Par balance', axis: 'Samey ↔ Varied',
    hiOk: 'Threes, fours and fives, and a real spread of lengths. A proper card.',
    hiBad: 'A bit of everything and no identity of its own.',
    loOk: 'It knows exactly what it is, and it does that one thing well.',
    loBad: 'Every hole is the same hole. Give me a short one to think about.' },
  condition: { label: 'Condition', axis: 'Shaggy ↔ Immaculate',
    hiOk: 'Immaculate. The greens roll true and there is not a bad lie on the property.',
    hiBad: 'Manicured within an inch of its life. Golf is not a lawn.',
    loOk: 'Rough and ready, and honestly the better for it.',
    loBad: 'The greens are shaggy. Fix that before you build another hole.' },
  beauty: { label: 'Planting', axis: 'Bare ↔ Dressed',
    hiOk: 'The planting makes it. I would walk this even if I were not playing.',
    hiBad: 'A great deal of decoration for what is meant to be a golf course.',
    loOk: 'Nothing to distract you out there. Just the golf.',
    loBad: 'It is bare. Plant something and give the place a shape.' },
};
// the two ends, split once here rather than on every draw of the book
for (const q in QUALITIES) {
  const p = QUALITIES[q].axis.split('↔');
  QUALITIES[q].lo = p[0].trim();
  QUALITIES[q].hi = p[1].trim();
}

// ── The roster ───────────────────────────────────────────────────────────────
// Thirty-six invented players. Each is a look you can pick out from across the
// property (a signature shirt colour and a hat silhouette), a home tour, one
// sentence of biography, one line they are known for, four stats that really do
// drive how they play, and — the part that matters — a taste.
//
// stats are [power, accuracy, putting, temperament], 0–100.
//   power       · how far it goes (drives carry further, par 5s shrink)
//   accuracy    · how often it finds the short grass
//   putting     · what happens once it is on the surface
//   temperament · how tightly the card holds together. Low temperament is not
//                 a worse player, it is a wider one: the 63 and the 79 both
//                 belong to them.

const ROSTER = [];
function S(id, first, last, tier, tour, colour, hat, stats, bio, quote, taste) {
  ROSTER.push({ id, first, last, name: first + ' ' + last, tier, tour, colour, hat,
    power: stats[0], accuracy: stats[1], putting: stats[2], temperament: stats[3],
    bio, quote, taste });
}

// ── Local Standouts ──────────────────────────────────────────────────────────
S('bexley-orr', 'Bexley', 'Orr', 'standout', 'The Amateur Rota', 0xff6f5e, 'cap',
  [72, 64, 61, 55],
  'Club champion four years running at a nine-hole course nobody outside the county has heard of.',
  'The trick is knowing which trouble is actually yours.',
  { width: 0.5, carries: 0.4, condition: 0.5, greenSize: 0.3, blindness: -0.5, roughness: -0.4 });
S('nell-crayford', 'Nell', 'Crayford', 'standout', 'The Amateur Rota', 0x6fb7d8, 'visor',
  [58, 74, 70, 68],
  'Works Tuesday to Saturday and still has the lowest handicap in the district.',
  'I have never once out-driven anybody. I have beaten most of them.',
  { strategy: 0.7, hazardPurpose: 0.5, greenDefence: 0.4, width: -0.5, condition: 0.3 });
S('ozzy-brandt', 'Ozzy', 'Brandt', 'standout', 'The Sunbelt Circuit', 0xf5c451, 'bucket',
  [80, 52, 55, 40],
  'Two hundred yards past everyone in his group and two shots behind them by the ninth.',
  'You can always chip out. You cannot always take it on.',
  { width: 0.9, greenSize: 0.5, carries: 0.4, roughness: -0.8, greenDefence: -0.3 });
S('marta-vellum', 'Marta', 'Vellum', 'standout', 'The Coastal Series', 0x8fd4a8, 'cap',
  [61, 71, 66, 74],
  'Learned on a windswept nine by the water and has never enjoyed a calm day since.',
  'Keep it under the wind and let the ground do the rest.',
  { carries: -0.5, elevation: 0.4, roughness: 0.4, greenSize: -0.3, beauty: 0.5 });
S('rufus-kolt', 'Rufus', 'Kolt', 'standout', 'The Amateur Rota', 0xb08fd8, 'flatcap',
  [64, 66, 72, 62],
  'Reads greens like a man who has read the same three books forty times each.',
  'Everything I know I learned four feet from a hole.',
  { greenDefence: 0.6, condition: 0.9, greenSize: -0.4, strategy: 0.3, roughness: -0.3 });
S('ivy-quennell', 'Ivy', 'Quennell', 'standout', 'The Amateur Rota', 0xff9ec4, 'visor',
  [55, 70, 74, 71],
  'Nineteen, unbothered, and putts like the hole owes her money.',
  'Nobody has ever been scared of a putt they meant to hit.',
  { condition: 0.8, greenSize: 0.4, routing: 0.4, blindness: -0.5, beauty: 0.3 });
S('sander-poole', 'Sander', 'Poole', 'standout', 'The Northern Order', 0x4b8f6b, 'bucket',
  [68, 62, 58, 48],
  'Greenkeeper by trade, which is why he notices what nobody else does.',
  'Show me the mowing lines and I will tell you who runs the place.',
  { condition: 1.0, roughness: 0.4, hazardPurpose: 0.4, beauty: 0.4, blindness: -0.3 });
S('tilda-groh', 'Tilda', 'Groh', 'standout', 'The Continental Tour', 0xe8663f, 'cap',
  [66, 69, 63, 66],
  'Turned professional twice and came back both times because she liked the amateur game better.',
  'A card is a card. Some of them just have more money attached.',
  { parBalance: 0.7, strategy: 0.5, routing: 0.4, width: -0.3 });
S('emrys-vane', 'Emrys', 'Vane', 'standout', 'The Islands Swing', 0x3f6d95, 'flatcap',
  [70, 60, 64, 52],
  'Plays every round with the same seven clubs and refuses to explain why.',
  'You do not need fourteen ways to miss a green.',
  { strategy: 0.6, elevation: 0.5, blindness: 0.4, condition: -0.3, greenSize: -0.3 });
S('juno-alderfield', 'Juno', 'Alderfield', 'standout', 'The Coastal Series', 0xd9c6a0, 'none',
  [63, 67, 68, 78],
  'Never rushed a shot in her life and has never once been asked to play through.',
  'The round is long. There is no hurry in it anywhere.',
  { beauty: 0.9, routing: 0.6, condition: 0.4, roughness: -0.4, carries: -0.3 });

// ── Touring Pros ─────────────────────────────────────────────────────────────
S('casimir-rho', 'Casimir', 'Rho', 'touring', 'The Continental Tour', 0x2f3a4a, 'cap',
  [76, 79, 74, 80],
  'Third season with a card, has never missed a cut by more than a shot.',
  'I am not trying to win. I am trying to be there on Sunday when someone loses one.',
  { strategy: 0.8, hazardPurpose: 0.7, greenDefence: 0.5, condition: 0.4, width: -0.5, roughness: -0.4 });
S('anouk-persall', 'Anouk', 'Persall', 'touring', 'The Meridian Tour', 0xff5a4e, 'visor',
  [84, 68, 71, 54],
  'Hits it further than most of the men on her tour and does not consider that interesting.',
  'Wide fairways were invented for people like me. Do not narrow them on my account.',
  { width: 0.9, carries: 0.6, greenSize: 0.4, roughness: -0.7, blindness: -0.4 });
S('dmitri-savolt', 'Dmitri', 'Savolt', 'touring', 'The Northern Order', 0x6b5ea8, 'flatcap',
  [70, 82, 69, 76],
  'Hits fairways for a living. Has led the driving-accuracy list three years without winning a thing.',
  'Somebody has to hold the middle of the golf course.',
  { hazardPurpose: 0.8, strategy: 0.6, roughness: 0.5, width: -0.7, greenSize: -0.3 });
S('perrin-okoye', 'Perrin', 'Okoye', 'touring', 'The Sunbelt Circuit', 0xffc94d, 'cap',
  [81, 71, 76, 62],
  'Came off a public course with a self-taught swing and an appetite for the flag.',
  'You cannot get close to a pin you were never aiming at.',
  { carries: 0.8, greenDefence: 0.5, elevation: 0.4, condition: 0.3, blindness: -0.4 });
S('hana-brightwater', 'Hana', 'Brightwater', 'touring', 'The Islands Swing', 0x4dc4b0, 'bucket',
  [69, 78, 80, 72],
  'Grew up on links turf and has spent her career quietly bewildering people on soft courses.',
  'The ground is a club. Most people leave it in the bag.',
  { carries: -0.7, elevation: 0.6, roughness: 0.5, greenSize: -0.4, condition: -0.3, strategy: 0.5 });
S('lucian-fray', 'Lucian', 'Fray', 'touring', 'The Continental Tour', 0xf07a9c, 'none',
  [77, 73, 68, 44],
  'Capable of a 63 and a 78 in the same week, sometimes in the same tournament.',
  'I have two games and I never find out which one turned up until the third.',
  { width: 0.6, greenSize: 0.6, condition: 0.5, greenDefence: -0.4, roughness: -0.5 });
S('sable-morrow', 'Sable', 'Morrow', 'touring', 'The Meridian Tour', 0x2f7d5a, 'visor',
  [72, 80, 73, 82],
  'Plots her way round like a surveyor and has never once looked hurried doing it.',
  'Show me where the trouble is and I will show you where the hole is.',
  { hazardPurpose: 0.9, strategy: 0.7, routing: 0.5, blindness: -0.6, width: -0.3 });
S('tobias-renn', 'Tobias', 'Renn', 'touring', 'The Coastal Series', 0xd86a3a, 'flatcap',
  [74, 70, 77, 68],
  'Missed a card by one shot four years in a row before finally keeping one.',
  'I have holed more putts under pressure than most people have stood over.',
  { condition: 0.9, greenSize: 0.4, greenDefence: 0.4, routing: 0.4, beauty: 0.3 });
S('wren-castellane', 'Wren', 'Castellane', 'touring', 'The Amateur Rota', 0xa8c8ff, 'cap',
  [67, 76, 75, 79],
  'The best amateur nobody can persuade to turn professional. Enjoys her job.',
  'The moment it becomes work, it stops being golf.',
  { beauty: 0.8, routing: 0.6, parBalance: 0.5, strategy: 0.4, roughness: -0.3 });

// ── Tour Winners ─────────────────────────────────────────────────────────────
S('ines-hallowell', 'Ines', 'Hallowell', 'winner', 'The Continental Tour', 0x1f4f8f, 'visor',
  [78, 88, 84, 86],
  'Four wins, all of them by grinding somebody else into the ground over eighteen holes.',
  'Give me a golf course with an opinion and I will out-think the field on it.',
  { strategy: 1.0, hazardPurpose: 0.8, greenDefence: 0.7, condition: 0.6, width: -0.8, roughness: -0.5, blindness: -0.6 });
S('otto-magnusson', 'Otto', 'Magnusson', 'winner', 'The Northern Order', 0xffd166, 'bucket',
  [93, 66, 74, 58],
  'Three wins, all of them on courses long enough to let him take the corner off something.',
  'Every architect leaves one hole they never expected anyone to reach. I look for it.',
  { width: 0.9, carries: 0.7, greenSize: 0.5, elevation: 0.4, roughness: -0.8, hazardPurpose: -0.3 });
S('delphine-arras', 'Delphine', 'Arras', 'winner', 'The Meridian Tour', 0xe75480, 'cap',
  [76, 84, 88, 80],
  'The finest putter of her generation and completely uninterested in being told so.',
  'Everyone talks about the second shot. The round is decided on the surface.',
  { condition: 1.0, greenDefence: 0.6, greenSize: -0.4, strategy: 0.4, roughness: -0.3 });
S('kito-alvane', 'Kito', 'Alvane', 'winner', 'The Sunbelt Circuit', 0xff8c42, 'cap',
  [86, 74, 79, 50],
  'Two wins, both from six behind, both watched by people who had already gone home.',
  'Nobody remembers a careful Sunday.',
  { carries: 1.0, elevation: 0.6, greenDefence: 0.5, blindness: 0.3, condition: -0.3, width: 0.3 });
S('solveig-nyholm', 'Solveig', 'Nyholm', 'winner', 'The Northern Order', 0x8fa8b8, 'flatcap',
  [71, 86, 78, 88],
  'Wins in bad weather on hard ground and politely declines invitations to anywhere warm.',
  'A course that only works in perfect conditions is a garden.',
  { roughness: 0.8, carries: -0.6, elevation: 0.6, greenSize: -0.5, condition: -0.4, strategy: 0.6 });
S('ravi-thornecroft', 'Ravi', 'Thornecroft', 'winner', 'The Islands Swing', 0x35b37e, 'visor',
  [80, 79, 81, 74],
  'One win, twenty-eight top tens, and a reputation as the most exacting man in golf.',
  'I do not mind losing. I mind losing to a hole that made no sense.',
  { hazardPurpose: 0.9, strategy: 0.8, parBalance: 0.6, blindness: -0.9, width: -0.4 });
S('greta-ashbourne', 'Greta', 'Ashbourne', 'winner', 'The Coastal Series', 0xc44a6a, 'none',
  [79, 77, 83, 66],
  'Two wins and a second career designing the practice grounds nobody else thinks about.',
  'Show me where you put the short holes and I will tell you if you can route.',
  { parBalance: 1.0, routing: 0.8, strategy: 0.6, beauty: 0.5, width: -0.3 });

// ── Major Champions ──────────────────────────────────────────────────────────
S('vesper-lyle', 'Vesper', 'Lyle', 'major', 'The Continental Tour', 0x203a52, 'flatcap',
  [82, 93, 89, 91],
  'Won the game\'s hardest week by driving it in play forty-two times out of fifty-six.',
  'A golf hole should ask a question you can answer three different ways.',
  { strategy: 1.0, hazardPurpose: 0.9, greenDefence: 0.8, routing: 0.6, condition: 0.6,
    width: -0.9, roughness: -0.7, blindness: -0.8 });
S('amadou-serrant', 'Amadou', 'Serrant', 'major', 'The Sunbelt Circuit', 0xff4d6d, 'cap',
  [96, 72, 82, 60],
  'Won a major by hitting a shot from a place nobody had ever bothered to mow.',
  'Length is not an advantage. It is a different golf course.',
  { width: 1.0, carries: 0.8, greenSize: 0.5, elevation: 0.5, roughness: -0.9, greenDefence: -0.4 });
S('marisol-quintal', 'Marisol', 'Quintal', 'major', 'The Meridian Tour', 0xf4a340, 'visor',
  [83, 85, 92, 84],
  'Won two majors in a single season and describes both of them as putting contests.',
  'The green is the golf hole. Everything before it is transport.',
  { condition: 1.0, greenDefence: 0.9, greenSize: -0.5, strategy: 0.5, roughness: -0.4, beauty: 0.3 });
S('halden-voss', 'Halden', 'Voss', 'major', 'The Northern Order', 0x5a6f7d, 'bucket',
  [84, 88, 80, 92],
  'Won on a course so exposed that half the field withdrew, and never mentioned it again.',
  'Weather is not difficulty. Weather is just weather.',
  { roughness: 0.8, elevation: 0.7, strategy: 0.7, carries: -0.6, condition: -0.4, greenSize: -0.5 });
S('zenobia-fenn', 'Zenobia', 'Fenn', 'major', 'The Islands Swing', 0x00a3a3, 'cap',
  [87, 82, 86, 70],
  'Won her major with a two-iron over water on the last, which she still calls the easy option.',
  'If you take the risk out of a golf hole you are left with a walk.',
  { carries: 1.0, greenDefence: 0.7, elevation: 0.5, hazardPurpose: 0.6, greenSize: -0.4, width: -0.3 });
S('idris-mallow', 'Idris', 'Mallow', 'major', 'The Coastal Series', 0x7a5cc4, 'flatcap',
  [80, 84, 88, 88],
  'Won the oldest event on the calendar at forty-one and turned down every design offer since.',
  'The best holes were found, not built. Somebody just had the sense to leave them alone.',
  { routing: 0.9, parBalance: 0.8, beauty: 0.7, strategy: 0.6, blindness: 0.4, condition: -0.3 });

// ── Legends ──────────────────────────────────────────────────────────────────
S('cordelia-strand', 'Cordelia', 'Strand', 'legend', 'The Old Guard', 0xbf9b30, 'flatcap',
  [84, 96, 94, 96],
  'Eleven majors across two decades, and not one of them won by more than she had to.',
  'I have played four thousand golf holes. Three hundred of them asked me anything.',
  { strategy: 1.0, hazardPurpose: 1.0, greenDefence: 0.8, routing: 0.7, parBalance: 0.7,
    width: -0.9, roughness: -0.8, blindness: -0.7, condition: 0.5 });
S('emeka-baldassare', 'Emeka', 'Baldassare', 'legend', 'The Old Guard', 0xd94f30, 'cap',
  [98, 80, 88, 72],
  'Rewrote what a golf course had to be long enough that architects still complain about him.',
  'They kept building it further away. I kept getting there.',
  { width: 0.9, carries: 0.9, elevation: 0.7, greenSize: 0.5, roughness: -0.9, hazardPurpose: -0.4 });
S('mireille-daventry', 'Mireille', 'Daventry', 'legend', 'The Old Guard', 0x1f6f5c, 'visor',
  [82, 92, 97, 90],
  'Holed everything for nineteen years and has spent retirement insisting she was lucky.',
  'A green is a conversation. Most courses only ever say one thing.',
  { condition: 0.9, greenDefence: 1.0, strategy: 0.7, greenSize: -0.6, routing: 0.5, roughness: -0.4 });
S('osric-tenning', 'Osric', 'Tenning', 'legend', 'The Old Guard', 0x8c7ab8, 'bucket',
  [86, 90, 86, 94],
  'Played eight decades of golf on four continents and has an opinion about every one of them.',
  'Show me a course that walks well and I will forgive it almost anything.',
  { routing: 1.0, parBalance: 0.9, beauty: 0.8, elevation: 0.6, strategy: 0.5,
    blindness: -0.5, carries: -0.4 });

export { ROSTER };
export const BY_ID = {};
for (const s of ROSTER) {
  s.tierDef = TIER[s.tier];
  BY_ID[s.id] = s;
}

// ── What the stats mean ──────────────────────────────────────────────────────
// The four numbers are not a card on a screen. They split into two things the
// sim reads separately:
//
//   LEVEL  — how good they are. `skill` is the shots-per-hole edge scoreHole()
//            takes, `vary` is how wide their card runs (temperament and nothing
//            else: a 96 posts the same round every time, a 44 does not).
//   SHAPE  — what KIND of good they are, and this is the half that makes two
//            players of the same level different to watch. `profileOf` measures
//            each of power, accuracy and putting against the player's OWN
//            overall, so it is a lean and never a level: +1 means "this is far
//            and away their best club", −1 "this is the hole in their game".
//            Sum is roughly zero by construction, so shape never quietly
//            hands anybody strokes — it only decides where they get them.
//
// game.js spends the shape twice. In the score: a hole's length pays power, a
// tight corridor pays accuracy, a small guarded green pays putting, so Otto
// Magnusson [93 · 66 · 74] and Ines Hallowell [78 · 88 · 84] take their shots
// on opposite halves of the same golf course. And in the shot sequence you
// actually watch: the bomber's drive finishes further up the hole, the straight
// hitter's ball ends up nearer the middle of it, and the great putter holes the
// first one more often than the poor one does.

export function overallOf(s) {
  return 0.22 * s.power + 0.34 * s.accuracy + 0.34 * s.putting + 0.10 * s.temperament;
}
export function profileOf(s) {
  const o = overallOf(s);
  const k = v => Math.max(-1, Math.min(1, (v - o) / 34));
  return { power: k(s.power), accuracy: k(s.accuracy), putting: k(s.putting) };
}
// overall 55 → a scratch amateur; 98 → the best there has ever been
export function skillOf(s) {
  return Math.max(-0.98, Math.min(0.2, -0.26 - (overallOf(s) - 55) * 0.0163));
}
export function varyOf(s) { return 0.30 - s.temperament * 0.0022; }
// the handicap the club prints beside their name
export function hcpOf(s) {
  return Math.round((55 - overallOf(s)) * 0.2);
}

// ── The verdict ──────────────────────────────────────────────────────────────
// One dot product, and then the honest business of saying why.
//
// The mark is the star's taste against the readings, normalised by how strong
// that taste is — so a player with four opinions and a player with nine are
// marking on the same scale. 5.8 is the mark a blank, competent, characterless
// golf course gets: pleasant, forgettable, and the exact middle of everybody's
// range. From there taste does all the work in both directions.

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NEUTRAL = 5.8, SWING = 4.9;

export function verdict(r, star) {
  const t = star.taste;
  let sum = 0, mass = 0;
  const parts = [];
  for (const q in t) {
    const w = t[q];
    const v = r[q] == null ? 0.5 : clamp(r[q], 0, 1);
    const c = w * (v - 0.5);
    sum += c; mass += Math.abs(w) * 0.5;
    parts.push({ q, w, v, c });
  }
  let score = NEUTRAL + (mass ? sum / mass : 0) * SWING;

  // A course that is barely a course cannot be marked as one. Under three holes
  // there is nothing to have an opinion about, and saying so is more honest
  // than averaging thirteen readings taken off two tees.
  const thin = (r.holes || 0) < 3;
  if (thin) score = Math.min(score, 4.6 + (r.holes || 0) * 0.5);

  // Nobody hands out tens — the same stingy top end the club's own golfers
  // mark to (people.rate), so a Legend's 9 means what a Saturday fourball's 9
  // means, and the last point always costs the most.
  if (score > 8) score = 8 + (score - 8) * 0.55;
  score = clamp(score, 1, 10);

  // the reasons: strongest feelings first, praise and complaint interleaved so
  // a verdict always tells the player one thing to keep and one thing to fix
  parts.sort((a, b) => Math.abs(b.c) - Math.abs(a.c));
  const reasons = [];
  for (const p of parts) {
    if (reasons.length >= 3) break;
    if (Math.abs(p.c) < 0.06) continue;
    const hi = p.v >= 0.5;
    const good = p.c > 0;
    const key = hi ? (good ? 'hiOk' : 'hiBad') : (good ? 'loOk' : 'loBad');
    reasons.push({ q: p.q, good, label: QUALITIES[p.q].label,
      text: QUALITIES[p.q][key], weight: Math.round(Math.abs(p.c) * 100) / 100 });
  }
  if (thin && !reasons.length) {
    reasons.push({ q: 'parBalance', good: false, label: 'The course',
      text: 'There is not enough golf here to have an opinion about yet.', weight: 1 });
  }
  return { score: Math.round(score * 10) / 10, reasons, thin };
}

// A one-line summary in their own register. The headline of a verdict card, and
// the line the Club Book prints under their name.
const HEAD = [
  [8.8, ['This is a golf course. I would come back for it.',
    'Genuinely good. There are not many of these.']],
  [8.0, ['Very good indeed. I enjoyed working it out.',
    'A proper test, and a fair one. Well done.']],
  [7.0, ['Good golf. A couple of things away from being very good.',
    'I liked it more than I expected to.']],
  [6.0, ['Perfectly decent. Nothing here offended me.',
    'A pleasant enough morning. Not much more than that.']],
  [4.6, ['It is not for me, and I suspect it knows that.',
    'There is a golf course in here somewhere.']],
  [0, ['I would not travel for this.', 'Not yet. Come and find me when it is.']],
];
export function headline(score, star) {
  for (const [lo, lines] of HEAD) {
    if (score >= lo) return lines[(hash32(star.id) >>> 3) % lines.length];
  }
  return HEAD[HEAD.length - 1][1][0];
}

// ── Which hole they liked ────────────────────────────────────────────────────
// Stars disagree about holes, not just about courses. The same taste vector is
// run over each hole's own features, so the bomber's favourite and the
// architect's favourite are genuinely different holes on the same property.

export function favourite(holes, star) {
  const t = star.taste;
  let best = null, bs = -1e9;
  for (const h of holes) {
    const f = h.feat;
    if (!f) continue;
    let s = 0;
    for (const q in t) s += t[q] * ((f[q] == null ? 0.5 : f[q]) - 0.5);
    // a hole with nothing going on cannot be anybody's favourite
    s += (f.interest || 0) * 0.35;
    if (s > bs) { bs = s; best = h; }
  }
  return bs > 0.12 ? best : null;
}

// ── Deterministic identity ───────────────────────────────────────────────────
// Who turns up on a given day is a pure function of the day and the club, in
// exactly the way the rest of the tee sheet is: nothing is stored to know that
// a Major Champion is playing at 4:35pm, so the sheet a player reloads into is
// byte-for-byte the one they left.

export function hash32(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function mix(a, b) {
  let h = (a ^ Math.imul(b + 0x9e3779b9, 0x85ebca6b)) >>> 0;
  h ^= h >>> 15; h = Math.imul(h, 0x2545f491) >>> 0; h ^= h >>> 13;
  return h >>> 0;
}
export function roll(daySeed, id, salt) {
  return mix(daySeed ^ hash32(id), (salt || 1) * 2654435761) / 4294967296;
}

// How likely this star is to put your club in their diary today.
//   · the tier will not travel below its prestige floor at all
//   · above it, interest climbs with the prestige you have earned
//   · a course they have already marked pulls harder if they liked it, and
//     visibly less if they did not — which is the reason to fix what they said
export function visitChance(star, prestige, seen) {
  const T = star.tierDef;
  if (prestige < T.need) return 0;
  const head = clamp((prestige - T.need) / 34, 0, 1);
  let p = T.rate * (0.25 + 0.75 * head);
  if (seen && seen.n) {
    const liked = clamp((seen.score - T.ask + 1.2) / 2.4, 0, 1);
    p *= 0.45 + 1.25 * liked;
  }
  return clamp(p, 0, 0.55);
}

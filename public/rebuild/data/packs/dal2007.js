export default {
  id: "dal2007",
  title: "The Long Two",
  team: { id: "DAL", city: "Dallas", name: "Mavericks", colors: ["#00538C", "#B8C4CA"], conf: "W" },
  startYear: 2007,
  par: 4,
  difficulty: "Hard",
  realOutcome:
    "Dallas really did swap Devin Harris for a 34-year-old Jason Kidd and got laughed at for years, then quietly took Tyson Chandler off Charlotte's hands in the summer of 2010. In June 2011 Dirk torched the brand-new Heat superteam in six games — the title arrived in year four, exactly on schedule.",
  baselineWins: 67,
  intro:
    "July 2007. Dirk Nowitzki just won MVP, and it took the eighth-seeded Warriors eight days to make it feel like an insult. Sixty-seven wins, dead in round one. Mark Cuban wants answers, the roster is expensive, and the West is only getting meaner. You have four seasons to turn the league's best regular-season team into a June team.",
  tips: "Sixty-seven wins wasn't the problem. Pay attention to what New Jersey — and, much later, Charlotte — are trying to get rid of.",

  cap: { 2007: 55.6, 2008: 58.7, 2009: 57.7, 2010: 58.0 },

  roster: [
    { name: "Dirk Nowitzki", pos: "PF", age: 29, sal: 17.2, ovr: { 2007: 92, 2008: 91, 2009: 91, 2010: 90 } },
    { name: "Josh Howard", pos: "SF", age: 27, sal: 9.4, ovr: { 2007: 83, 2008: 81, 2009: 78, 2010: 76 } },
    { name: "Jason Terry", pos: "SG", age: 29, sal: 9.7, ovr: { 2007: 81, 2008: 81, 2009: 82, 2010: 80 } },
    { name: "Devin Harris", pos: "PG", age: 24, sal: 2.9, ovr: { 2007: 79, 2008: 84, 2009: 82, 2010: 78 } },
    { name: "Erick Dampier", pos: "C", age: 32, sal: 9.4, ovr: { 2007: 74, 2008: 73, 2009: 72, 2010: 68 } },
    { name: "Brandon Bass", pos: "PF", age: 22, sal: 0.8, ovr: { 2007: 72, 2008: 75, 2009: 76, 2010: 77 } },
    { name: "DeSagana Diop", pos: "C", age: 25, sal: 2.1, ovr: { 2007: 70, 2008: 68, 2009: 66, 2010: 64 } },
    { name: "Jerry Stackhouse", pos: "SG", age: 32, sal: 6.5, ovr: { 2007: 74, 2008: 70, 2009: 60, 2010: 62 } },
    { name: "Trenton Hassell", pos: "SF", age: 28, sal: 4.4, ovr: { 2007: 68, 2008: 67, 2009: 65, 2010: 63 } },
    { name: "Eddie Jones", pos: "SG", age: 35, sal: 2.0, ovr: { 2007: 70, 2008: 62, 2009: 55, 2010: 55 } }
  ],

  picks: [],

  offers: [
    {
      id: "njn-kidd", team: "NJN", year: 2007, until: 2007,
      label: "New Jersey wants young legs for its franchise point guard",
      give: ["Devin Harris", "DeSagana Diop", "Trenton Hassell"],
      get: {
        players: [
          { name: "Jason Kidd", pos: "PG", age: 34, sal: 19.7, ovr: { 2007: 84, 2008: 83, 2009: 82, 2010: 80 } },
          { name: "Antoine Wright", pos: "SG", age: 23, sal: 2.0, ovr: { 2007: 65, 2008: 66, 2009: 67, 2010: 64 } }
        ],
        picks: []
      }
    },
    {
      id: "tor-marion", team: "TOR", year: 2009, until: 2009,
      label: "A four-team tangle lands on your desk: Shawn Marion for expiring money",
      give: ["Jerry Stackhouse"],
      get: {
        players: [
          { name: "Shawn Marion", pos: "SF", age: 31, sal: 7.3, ovr: { 2009: 80, 2010: 78 } }
        ],
        picks: []
      }
    },
    {
      id: "cha-chandler", team: "CHA", year: 2010, until: 2010,
      label: "Charlotte needs off Tyson Chandler's money",
      give: ["Erick Dampier"],
      get: {
        players: [
          { name: "Tyson Chandler", pos: "C", age: 27, sal: 12.6, ovr: { 2010: 82 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Pau Gasol", team: "MEM", pos: "C", age: 27, sal: 13.7,
      ovr: { 2007: 88, 2008: 88, 2009: 88, 2010: 88 },
      cost: 300, from: 2007, until: 2007,
      note: "Memphis wants cap relief and warm bodies. Somebody is going to regret setting this price." },
    { name: "Shaquille O'Neal", team: "MIA", pos: "C", age: 35, sal: 20.0,
      ovr: { 2007: 80, 2008: 79, 2009: 77, 2010: 73 },
      cost: 220, from: 2007, until: 2008,
      note: "Pat Riley is ready to move on from the Diesel. The name is bigger than the knees." },
    { name: "Mike Bibby", team: "SAC", pos: "PG", age: 29, sal: 13.5,
      ovr: { 2007: 79, 2008: 78, 2009: 76, 2010: 73 },
      cost: 120, from: 2007, until: 2007,
      note: "Sacramento's rebuild has started. A steady hand, if the Kidd talks fall through." },
    { name: "Ron Artest", team: "SAC", pos: "SF", age: 27, sal: 7.4,
      ovr: { 2007: 82, 2008: 81, 2009: 79, 2010: 77 },
      cost: 160, from: 2007, until: 2008,
      note: "Elite defense, discount price, and a fuse of unknown length." },
    { name: "Zach Randolph", team: "NYK", pos: "PF", age: 26, sal: 13.3,
      ovr: { 2007: 81, 2008: 80, 2009: 83, 2010: 82 },
      cost: 130, from: 2007, until: 2008,
      note: "20 and 10 every night, drama every other night. New York is already tired of it." },
    { name: "Marcus Camby", team: "DEN", pos: "C", age: 34, sal: 9.1,
      ovr: { 2008: 78, 2009: 76, 2010: 72 },
      cost: 60, from: 2008, until: 2008,
      note: "Denver is dumping a Defensive Player of the Year for luxury-tax reasons. For almost nothing." },
    { name: "Vince Carter", team: "NJN", pos: "SG", age: 31, sal: 13.7,
      ovr: { 2008: 83, 2009: 81, 2010: 78 },
      cost: 240, from: 2008, until: 2009,
      note: "New Jersey is stripping down for Brooklyn. Half-man, half-available." },
    { name: "Richard Jefferson", team: "MIL", pos: "SF", age: 28, sal: 13.2,
      ovr: { 2008: 80, 2009: 77, 2010: 74 },
      cost: 150, from: 2008, until: 2008,
      note: "Milwaukee wants out of the contract more than out of the player." },
    { name: "Jason Richardson", team: "CHA", pos: "SG", age: 27, sal: 12.9,
      ovr: { 2008: 80, 2009: 79, 2010: 78 },
      cost: 140, from: 2008, until: 2009,
      note: "Bobcats accounting strikes again. Forty-point nights sold separately." },
    { name: "Caron Butler", team: "WAS", pos: "SF", age: 29, sal: 9.8,
      ovr: { 2009: 82, 2010: 79 },
      cost: 160, from: 2009, until: 2010,
      note: "Washington's fire sale is on. Tough Juice comes cheap for a two-time All-Star." },
    { name: "Stephen Jackson", team: "GSW", pos: "SF", age: 31, sal: 7.7,
      ovr: { 2009: 79, 2010: 77 },
      cost: 100, from: 2009, until: 2010,
      note: "Demanded a trade in training camp. Makes love to pressure; also to chaos." },
    { name: "Antawn Jamison", team: "WAS", pos: "PF", age: 33, sal: 11.6,
      ovr: { 2009: 81, 2010: 78 },
      cost: 150, from: 2009, until: 2010,
      note: "Twenty a night with a face-up game nobody has ever guarded correctly." }
  ],

  freeAgents: {
    2007: [
      { name: "Chauncey Billups", pos: "PG", age: 30, ask: 11.0, pull: 82,
        ovr: { 2007: 85, 2008: 85, 2009: 84, 2010: 81 }, note: "Mr. Big Shot. Detroit is moving heaven and earth to keep him." },
      { name: "Rashard Lewis", pos: "SF", age: 27, ask: 16.0, pull: 60,
        ovr: { 2007: 82, 2008: 81, 2009: 78, 2010: 74 }, note: "Somebody is about to pay him like a franchise player. It doesn't have to be you." },
      { name: "Gerald Wallace", pos: "SF", age: 24, ask: 9.5, pull: 62,
        ovr: { 2007: 80, 2008: 80, 2009: 82, 2010: 81 }, note: "Crash. Plays every possession like it owes him money." },
      { name: "Grant Hill", pos: "SF", age: 34, ask: 1.8, pull: 50,
        ovr: { 2007: 76, 2008: 76, 2009: 74, 2010: 72 }, note: "The ankles finally cooperate. Veteran class for the minimum." },
      { name: "Matt Barnes", pos: "SF", age: 27, ask: 3.0, pull: 30,
        ovr: { 2007: 73, 2008: 72, 2009: 74, 2010: 73 }, note: "Fresh off the We Believe run. You may hold a grudge." },
      { name: "Steve Blake", pos: "PG", age: 27, ask: 4.0, pull: 32,
        ovr: { 2007: 73, 2008: 73, 2009: 72, 2010: 71 }, note: "Steady backup ballhandling, no surprises." },
      { name: "Darko Miličić", pos: "C", age: 22, ask: 7.0, pull: 35,
        ovr: { 2007: 70, 2008: 68, 2009: 66, 2010: 64 }, note: "The pick between LeBron and Carmelo is still looking for a home." }
    ],
    2008: [
      { name: "J.J. Barea", pos: "PG", age: 24, ask: 1.8, pull: 30,
        ovr: { 2008: 70, 2009: 73, 2010: 76 }, note: "5'10\" in shoes, undrafted, fearless off the bounce. Nobody's calling." },
      { name: "James Posey", pos: "SF", age: 31, ask: 6.0, pull: 66,
        ovr: { 2008: 76, 2009: 74, 2010: 71 }, note: "Champion glue guy — rings in his last two stops. Only leaves for a winner." },
      { name: "Baron Davis", pos: "PG", age: 29, ask: 13.0, pull: 58,
        ovr: { 2008: 80, 2009: 76, 2010: 74 }, note: "Opted out after the We Believe run. Brilliance and back trouble in one package." },
      { name: "Elton Brand", pos: "PF", age: 29, ask: 16.0, pull: 62,
        ovr: { 2008: 76, 2009: 70, 2010: 76 }, note: "Coming off the Achilles. The old 20-and-10 is priced in; caveat emptor." },
      { name: "Corey Maggette", pos: "SF", age: 28, ask: 10.0, pull: 45,
        ovr: { 2008: 78, 2009: 75, 2010: 73 }, note: "Lives at the free-throw line. Defense not included." },
      { name: "Mickaël Pietrus", pos: "SG", age: 26, ask: 5.3, pull: 40,
        ovr: { 2008: 73, 2009: 72, 2010: 71 }, note: "3-and-D wing with playoff nerve." }
    ],
    2009: [
      { name: "Marcin Gortat", pos: "C", age: 25, ask: 6.9, pull: 40,
        ovr: { 2009: 74, 2010: 77 }, note: "The Polish Hammer. Best backup center alive, wants a starter's life." },
      { name: "Anderson Varejão", pos: "C", age: 26, ask: 8.5, pull: 50,
        ovr: { 2009: 77, 2010: 78 }, note: "All hair and hustle. Cleveland will fight to keep him." },
      { name: "Hedo Türkoğlu", pos: "SF", age: 30, ask: 10.6, pull: 55,
        ovr: { 2009: 77, 2010: 73 }, note: "Point-forward off a Finals run. The market is about to get generous." },
      { name: "Ben Gordon", pos: "SG", age: 26, ask: 11.6, pull: 48,
        ovr: { 2009: 78, 2010: 73 }, note: "Just scored 40 twice on Boston in the playoffs. Detroit is smitten." },
      { name: "Trevor Ariza", pos: "SF", age: 24, ask: 6.5, pull: 52,
        ovr: { 2009: 77, 2010: 76 }, note: "3-and-D fresh off a ring in Los Angeles." },
      { name: "Ron Artest", pos: "SF", age: 29, ask: 6.5, pull: 68,
        ovr: { 2009: 78, 2010: 77 }, note: "Wants to guard the other team's best player for a contender. Yours, if you dare." },
      { name: "André Miller", pos: "PG", age: 33, ask: 7.0, pull: 45,
        ovr: { 2009: 78, 2010: 76 }, note: "The Professor. Old before his time, effective long after it." }
    ],
    2010: [
      { name: "LeBron James", pos: "SF", age: 25, ask: 16.6, pull: 88,
        ovr: { 2010: 96 }, note: "Taking his talents somewhere. A decision is coming." },
      { name: "Dwyane Wade", pos: "SG", age: 28, ask: 16.6, pull: 90,
        ovr: { 2010: 92 }, note: "Recruiting harder than he's being recruited. Miami is home." },
      { name: "Chris Bosh", pos: "PF", age: 26, ask: 16.0, pull: 78,
        ovr: { 2010: 86 }, note: "The most movable of the big three names. Follow the yacht." },
      { name: "Amar'e Stoudemire", pos: "PF", age: 27, ask: 19.9, pull: 70,
        ovr: { 2010: 87 }, note: "Uninsurable knees, unguardable rolls. Somebody will pay full max." },
      { name: "Carlos Boozer", pos: "PF", age: 28, ask: 15.0, pull: 55,
        ovr: { 2010: 82 }, note: "Twenty and ten, handshake agreements notwithstanding." },
      { name: "David Lee", pos: "PF", age: 27, ask: 13.0, pull: 50,
        ovr: { 2010: 80 }, note: "All-Star numbers on a bad team. The eternal debate." },
      { name: "Raymond Felton", pos: "PG", age: 26, ask: 7.5, pull: 42,
        ovr: { 2010: 76 }, note: "Solid starter searching for a system." },
      { name: "Peja Stojaković", pos: "SF", age: 33, ask: 2.0, pull: 40,
        ovr: { 2010: 70 }, note: "The stroke never ages, even when everything else has." }
    ]
  },

  draft: {
    2008: [
      { name: "Derrick Rose", pos: "PG", realPick: 1, age: 19, ovr: { 2008: 78, 2009: 82, 2010: 88 }, note: "Memphis — hometown kid going first, everyone agrees" },
      { name: "Michael Beasley", pos: "PF", realPick: 2, age: 19, ovr: { 2008: 73, 2009: 73, 2010: 75 }, note: "Kansas State — buckets, and questions" },
      { name: "O.J. Mayo", pos: "SG", realPick: 3, age: 20, ovr: { 2008: 76, 2009: 75, 2010: 73 }, note: "USC — anointed since eighth grade" },
      { name: "Russell Westbrook", pos: "PG", realPick: 4, age: 19, ovr: { 2008: 75, 2009: 80, 2010: 86 }, note: "UCLA — played off the ball in college; scouts are guessing" },
      { name: "Kevin Love", pos: "PF", realPick: 5, age: 19, ovr: { 2008: 74, 2009: 78, 2010: 85 }, note: "UCLA — outlet passes and rebounding genes" },
      { name: "Danilo Gallinari", pos: "SF", realPick: 6, age: 19, ovr: { 2008: 62, 2009: 75, 2010: 77 }, note: "Italy — shooting runs in the family, so do back problems" },
      { name: "Eric Gordon", pos: "SG", realPick: 7, age: 19, ovr: { 2008: 74, 2009: 76, 2010: 79 }, note: "Indiana — built like a safe, shoots like a guard" },
      { name: "Brook Lopez", pos: "C", realPick: 10, age: 20, ovr: { 2008: 76, 2009: 80, 2010: 80 }, note: "Stanford — twenty a night in the post, eventually" },
      { name: "Roy Hibbert", pos: "C", realPick: 17, age: 21, ovr: { 2008: 68, 2009: 73, 2010: 76 }, note: "Georgetown — 7'2\" of verticality" },
      { name: "Serge Ibaka", pos: "PF", realPick: 24, age: 18, ovr: { 2008: 55, 2009: 72, 2010: 77 }, note: "Congo via Spain — blocks first, questions later" },
      { name: "Nicolas Batum", pos: "SF", realPick: 25, age: 19, ovr: { 2008: 70, 2009: 73, 2010: 75 }, note: "France — does a little of everything" },
      { name: "George Hill", pos: "PG", realPick: 26, age: 22, ovr: { 2008: 68, 2009: 74, 2010: 76 }, note: "IUPUI — Popovich keeps flying to Indianapolis" },
      { name: "Mario Chalmers", pos: "PG", realPick: 34, age: 22, ovr: { 2008: 71, 2009: 70, 2010: 70 }, note: "Kansas — hit the shot, will remind you" },
      { name: "DeAndre Jordan", pos: "C", realPick: 35, age: 19, ovr: { 2008: 64, 2009: 68, 2010: 72 }, note: "Texas A&M — lob catcher with a lottery body" },
      { name: "Goran Dragić", pos: "PG", realPick: 45, age: 22, ovr: { 2008: 64, 2009: 70, 2010: 72 }, note: "Slovenia — left-handed and unbothered" }
    ],
    2009: [
      { name: "Blake Griffin", pos: "PF", realPick: 1, age: 20, ovr: { 2009: 55, 2010: 88 }, note: "Oklahoma — consensus No. 1; the kneecap disagrees for a year" },
      { name: "Hasheem Thabeet", pos: "C", realPick: 2, age: 22, ovr: { 2009: 62, 2010: 60 }, note: "UConn — 7'3\" and everyone's sure it translates" },
      { name: "James Harden", pos: "SG", realPick: 3, age: 19, ovr: { 2009: 73, 2010: 77 }, note: "Arizona State — bearded, patient, sneaky-crafty" },
      { name: "Tyreke Evans", pos: "SG", realPick: 4, age: 19, ovr: { 2009: 79, 2010: 75 }, note: "Memphis — 20-5-5 written all over him, once" },
      { name: "Ricky Rubio", pos: "PG", realPick: 5, age: 18, ovr: { 2009: 55, 2010: 55 }, note: "Spain — dazzling, and staying in Barcelona for now" },
      { name: "Stephen Curry", pos: "PG", realPick: 7, age: 21, ovr: { 2009: 78, 2010: 82 }, note: "Davidson — too small, they keep saying" },
      { name: "DeMar DeRozan", pos: "SG", realPick: 9, age: 19, ovr: { 2009: 70, 2010: 75 }, note: "USC — dunk-contest hops, mid-range heart" },
      { name: "Brandon Jennings", pos: "PG", realPick: 10, age: 20, ovr: { 2009: 76, 2010: 75 }, note: "Italy — skipped college, will score 55 to prove a point" },
      { name: "Jrue Holiday", pos: "PG", realPick: 17, age: 19, ovr: { 2009: 69, 2010: 76 }, note: "UCLA — youngest player in the class, oldest soul" },
      { name: "Ty Lawson", pos: "PG", realPick: 18, age: 21, ovr: { 2009: 73, 2010: 76 }, note: "North Carolina — fastest man in the gym, any gym" },
      { name: "Jeff Teague", pos: "PG", realPick: 19, age: 21, ovr: { 2009: 65, 2010: 70 }, note: "Wake Forest — twitchy athleticism, patient timeline" },
      { name: "Taj Gibson", pos: "PF", realPick: 26, age: 24, ovr: { 2009: 72, 2010: 73 }, note: "USC — old for the class, ready for the league" },
      { name: "Patrick Beverley", pos: "PG", realPick: 42, age: 21, ovr: { 2009: 55, 2010: 55 }, note: "Arkansas — playing in Greece, guarding everyone there too" },
      { name: "Danny Green", pos: "SG", realPick: 46, age: 22, ovr: { 2009: 62, 2010: 64 }, note: "North Carolina — four-year winner, patience required" }
    ],
    2010: [
      { name: "John Wall", pos: "PG", realPick: 1, age: 19, ovr: { 2010: 78 }, note: "Kentucky — the dance has its own name" },
      { name: "Evan Turner", pos: "SG", realPick: 2, age: 21, ovr: { 2010: 68 }, note: "Ohio State — national player of the year, fit TBD" },
      { name: "Derrick Favors", pos: "PF", realPick: 3, age: 18, ovr: { 2010: 70 }, note: "Georgia Tech — tools for days" },
      { name: "DeMarcus Cousins", pos: "C", realPick: 5, age: 19, ovr: { 2010: 76 }, note: "Kentucky — most talented big in the class, ask anyone nervous" },
      { name: "Greg Monroe", pos: "C", realPick: 7, age: 20, ovr: { 2010: 73 }, note: "Georgetown — passing big, old-money game" },
      { name: "Gordon Hayward", pos: "SF", realPick: 9, age: 20, ovr: { 2010: 69 }, note: "Butler — half an inch from a national title" },
      { name: "Paul George", pos: "SF", realPick: 10, age: 20, ovr: { 2010: 71 }, note: "Fresno State — long, smooth, and nobody's sure yet" },
      { name: "Eric Bledsoe", pos: "PG", realPick: 18, age: 20, ovr: { 2010: 70 }, note: "Kentucky — mini-LeBron build, backup role" },
      { name: "Hassan Whiteside", pos: "C", realPick: 33, age: 21, ovr: { 2010: 55 }, note: "Marshall — blocks everything, including his own path" },
      { name: "Lance Stephenson", pos: "SG", realPick: 40, age: 19, ovr: { 2010: 60 }, note: "Cincinnati — Born Ready, arrival date unknown" }
    ]
  },

  gauntlet: {
    2008: [
      { team: "LAL", ovr: 95, conf: "W" }, { team: "NOP", ovr: 92, conf: "W" },
      { team: "BOS", ovr: 96, conf: "E" }, { team: "DET", ovr: 92, conf: "E" }
    ],
    2009: [
      { team: "LAL", ovr: 96, conf: "W" }, { team: "DEN", ovr: 92, conf: "W" },
      { team: "CLE", ovr: 96, conf: "E" }, { team: "ORL", ovr: 93, conf: "E" }
    ],
    2010: [
      { team: "LAL", ovr: 96, conf: "W" }, { team: "PHX", ovr: 92, conf: "W" },
      { team: "BOS", ovr: 93, conf: "E" }, { team: "ORL", ovr: 93, conf: "E" }
    ],
    2011: [
      { team: "LAL", ovr: 94, conf: "W" }, { team: "OKC", ovr: 92, conf: "W" },
      { team: "MIA", ovr: 95, conf: "E", unless: { name: "LeBron James", then: 88 } }, { team: "CHI", ovr: 93, conf: "E" }
    ]
  },

  events: [
    { year: 2007, text: "Golden State just showed the league how to kill a 67-win team. Everyone took notes." },
    { year: 2007, text: "New Jersey is quietly gauging the market for its franchise point guard." },
    { year: 2008, text: "Chicago wins the lottery. Derrick Rose is staying home." },
    { year: 2008, text: "An undrafted 5'10\" guard from Puerto Rico keeps embarrassing people in summer league." },
    { year: 2009, text: "Washington's rebuild is on. Their veterans can be had for expiring money." },
    { year: 2009, text: "The skinny shooter who fell to seventh keeps making the top six look silly." },
    { year: 2010, text: "Three stars have been taking meetings together. South Beach keeps coming up." },
    { year: 2010, text: "Charlotte wants off Tyson Chandler's contract before opening night." }
  ]
};

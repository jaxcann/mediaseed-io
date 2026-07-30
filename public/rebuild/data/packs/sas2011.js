export default {
  id: "sas2011",
  title: "The Beautiful Game",
  team: { id: "SAS", city: "San Antonio", name: "Spurs", colors: ["#000000", "#C4CED4"], conf: "W" },
  startYear: 2011,
  par: 3,
  difficulty: "Medium",
  realOutcome:
    "Ray Allen's corner three broke their hearts in 2013 — and one year later the Spurs answered with the most beautiful basketball ever seen, dismantling Miami in five. The ball moved, Kawhi Leonard was Finals MVP at 22, and banner five hung in year three of this window.",
  baselineWins: 61,
  intro:
    "July 2011. Sixty-one wins, then an eight-seed from Memphis sent you home in six. Tim Duncan is 35, the obituaries are already typed, and on draft night you swapped George Hill for a poker-faced kid from San Diego State named Kawhi Leonard. The dynasty looks finished. Look closer.",
  tips: "Beware the twenty-point scorer priced like a savior. The real answers cost less than the mid-level — other teams keep leaving them on the curb.",

  cap: { 2011: 58.0, 2012: 58.0, 2013: 58.7, 2014: 63.1 },

  roster: [
    { name: "Tim Duncan", pos: "C", age: 35, sal: 21.2, ovr: { 2011: 84, 2012: 85, 2013: 85, 2014: 84 },
      note: "The graceful decline. Bank open until further notice." },
    { name: "Tony Parker", pos: "PG", age: 29, sal: 12.5, ovr: { 2011: 87, 2012: 88, 2013: 87, 2014: 84 } },
    { name: "Manu Ginóbili", pos: "SG", age: 33, sal: 12.9, ovr: { 2011: 84, 2012: 82, 2013: 81, 2014: 80 } },
    { name: "Kawhi Leonard", pos: "SF", age: 20, sal: 1.9, ovr: { 2011: 74, 2012: 78, 2013: 84, 2014: 89 },
      note: "Doesn't smile. Doesn't miss defensive rotations either." },
    { name: "Danny Green", pos: "SG", age: 24, sal: 0.9, ovr: { 2011: 75, 2012: 78, 2013: 79, 2014: 78 } },
    { name: "Tiago Splitter", pos: "C", age: 26, sal: 3.9, ovr: { 2011: 75, 2012: 76, 2013: 77, 2014: 78 } },
    { name: "DeJuan Blair", pos: "PF", age: 22, sal: 1.0, ovr: { 2011: 74, 2012: 72, 2013: 70, 2014: 67 } },
    { name: "Matt Bonner", pos: "PF", age: 31, sal: 3.3, ovr: { 2011: 72, 2012: 72, 2013: 70, 2014: 68 } },
    { name: "Gary Neal", pos: "SG", age: 26, sal: 0.8, ovr: { 2011: 73, 2012: 73, 2013: 71, 2014: 67 } },
    { name: "Patty Mills", pos: "PG", age: 22, sal: 0.9, ovr: { 2011: 68, 2012: 70, 2013: 73, 2014: 76 },
      note: "Technically arrives in March. Time is a flat circle in San Antonio." },
    { name: "Cory Joseph", pos: "PG", age: 19, sal: 1.1, ovr: { 2011: 60, 2012: 63, 2013: 68, 2014: 71 } }
  ],

  picks: [],

  offers: [
    {
      id: "dal-blair", team: "DAL", year: 2012, until: 2013,
      label: "Dallas likes DeJuan Blair's motor",
      give: ["DeJuan Blair"],
      get: {
        players: [],
        picks: [{ year: 2013, slot: 44, via: "DAL" }]
      }
    },
    {
      id: "phx-bonner", team: "PHX", year: 2012, until: 2012,
      label: "Phoenix wants shooting off the pine",
      give: ["Matt Bonner"],
      get: {
        players: [],
        picks: [{ year: 2013, slot: 57, via: "PHX" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Rudy Gay", team: "MEM", pos: "SF", age: 26, sal: 16.5,
      ovr: { 2011: 82, 2012: 80, 2013: 78, 2014: 76 },
      cost: 220, from: 2012, until: 2013,
      note: "Twenty a game on twenty shots. The kind of star the old scouts love and the spreadsheets hate." },
    { name: "Josh Smith", team: "ATL", pos: "PF", age: 27, sal: 13.2,
      ovr: { 2011: 80, 2012: 80, 2013: 76, 2014: 72 },
      cost: 200, from: 2012, until: 2012,
      note: "Atlanta is finally listening. Athletic marvel, in love with the long two." },
    { name: "Eric Bledsoe", team: "LAC", pos: "PG", age: 22, sal: 1.7,
      ovr: { 2011: 70, 2012: 74, 2013: 80, 2014: 81 },
      cost: 80, from: 2012, until: 2012,
      note: "Mini-LeBron is stuck behind Chris Paul. The Clippers know what they have. Mostly." },
    { name: "Marcin Gortat", team: "PHX", pos: "C", age: 28, sal: 7.2,
      ovr: { 2011: 79, 2012: 78, 2013: 76, 2014: 75 },
      cost: 90, from: 2012, until: 2013,
      note: "The Polish Hammer. Phoenix is quietly rebuilding around nothing." },
    { name: "J.J. Redick", team: "ORL", pos: "SG", age: 28, sal: 6.2,
      ovr: { 2011: 76, 2012: 77, 2013: 76, 2014: 76 },
      cost: 60, from: 2012, until: 2012,
      note: "Orlando is tearing it down after the Dwight saga. Movement shooting for sale." },
    { name: "Kyle Korver", team: "CHI", pos: "SG", age: 30, sal: 5.0,
      ovr: { 2011: 75, 2012: 76, 2013: 76, 2014: 75 },
      cost: 40, from: 2011, until: 2012,
      note: "Chicago keeps almost trading him for pennies. Somebody should notice." },
    { name: "Luis Scola", team: "HOU", pos: "PF", age: 31, sal: 9.2,
      ovr: { 2011: 78, 2012: 75, 2013: 73, 2014: 70 },
      cost: 70, from: 2011, until: 2011,
      note: "Houston is clearing the books for a bigger fish. Crafty hands, old legs." },
    { name: "Kosta Koufos", team: "DEN", pos: "C", age: 23, sal: 3.0,
      ovr: { 2011: 72, 2012: 75, 2013: 74, 2014: 73 },
      cost: 45, from: 2012, until: 2013,
      note: "Honest backup center work, priced honestly." },
    { name: "Patrick Patterson", team: "SAC", pos: "PF", age: 24, sal: 3.1,
      ovr: { 2011: 71, 2012: 73, 2013: 73, 2014: 72 },
      cost: 40, from: 2013, until: 2013,
      note: "A four who spaces the floor and keeps quiet. Sacramento hoards guards instead." },
    { name: "Andre Miller", team: "DEN", pos: "PG", age: 36, sal: 4.7,
      ovr: { 2011: 76, 2012: 74, 2013: 72, 2014: 70 },
      cost: 45, from: 2012, until: 2013,
      note: "Professor of the post-up. Has never once jumped." }
  ],

  freeAgents: {
    2011: [
      { name: "Tyson Chandler", pos: "C", age: 29, ask: 13.6, pull: 72,
        ovr: { 2011: 83, 2012: 80, 2013: 78, 2014: 76 }, note: "Fresh off anchoring a title defense in Dallas." },
      { name: "David West", pos: "PF", age: 31, ask: 10.0, pull: 62,
        ovr: { 2011: 80, 2012: 80, 2013: 78, 2014: 76 }, note: "Coming off the knee, still a tone-setter." },
      { name: "Shane Battier", pos: "SF", age: 33, ask: 3.3, pull: 60,
        ovr: { 2011: 75, 2012: 74, 2013: 72, 2014: 68 }, note: "No-stats all-star. Contenders only." },
      { name: "Caron Butler", pos: "SF", age: 31, ask: 8.0, pull: 45,
        ovr: { 2011: 76, 2012: 74, 2013: 72, 2014: 70 }, note: "Tough Juice, coming off the knee." },
      { name: "Jamal Crawford", pos: "SG", age: 31, ask: 5.0, pull: 48,
        ovr: { 2011: 77, 2012: 76, 2013: 76, 2014: 75 }, note: "Instant offense, some assembly required on defense." },
      { name: "Grant Hill", pos: "SF", age: 39, ask: 6.5, pull: 40,
        ovr: { 2011: 74, 2012: 72, 2013: 68, 2014: 60 }, note: "Still dignified, still useful, still 39." }
    ],
    2012: [
      { name: "Deron Williams", pos: "PG", age: 28, ask: 17.2, pull: 85,
        ovr: { 2011: 87, 2012: 84, 2013: 80, 2014: 77 }, note: "Brooklyn is throwing a max and a borough at him." },
      { name: "Steve Nash", pos: "PG", age: 38, ask: 9.3, pull: 78,
        ovr: { 2011: 86, 2012: 84, 2013: 65, 2014: 55 }, note: "Two MVPs, one last chase. The Lakers are circling." },
      { name: "Ray Allen", pos: "SG", age: 37, ask: 3.1, pull: 80,
        ovr: { 2011: 79, 2012: 77, 2013: 74, 2014: 72 }, note: "Feuding with Rondo, ring-shopping at a discount. The corner is calling." },
      { name: "Boris Diaw", pos: "PF", age: 30, ask: 4.7, pull: 40,
        ovr: { 2012: 76, 2013: 77, 2014: 78 }, note: "Charlotte just waived him. The league sees the wine cellar; the tape sees a point-center." },
      { name: "O.J. Mayo", pos: "SG", age: 24, ask: 4.2, pull: 42,
        ovr: { 2011: 74, 2012: 76, 2013: 75, 2014: 73 }, note: "Former third pick, current bargain bin." },
      { name: "Carl Landry", pos: "PF", age: 28, ask: 4.0, pull: 35,
        ovr: { 2011: 74, 2012: 75, 2013: 72, 2014: 70 }, note: "Buckets off the bench, no questions asked." }
    ],
    2013: [
      { name: "Dwight Howard", pos: "C", age: 27, ask: 20.5, pull: 80,
        ovr: { 2011: 90, 2012: 85, 2013: 86, 2014: 85 }, note: "The biggest name on the market, with a full set of baggage." },
      { name: "Andre Iguodala", pos: "SF", age: 29, ask: 12.0, pull: 72,
        ovr: { 2011: 83, 2012: 82, 2013: 82, 2014: 82 }, note: "Wants a ready-made contender out west." },
      { name: "Al Jefferson", pos: "C", age: 28, ask: 13.5, pull: 52,
        ovr: { 2011: 84, 2012: 83, 2013: 83, 2014: 79 }, note: "Old-school low-post scoring, minus the defense." },
      { name: "Marco Belinelli", pos: "SG", age: 27, ask: 2.8, pull: 42,
        ovr: { 2011: 73, 2012: 74, 2013: 75, 2014: 74 }, note: "Movement shooter, playoff nerve, pocket change." },
      { name: "Monta Ellis", pos: "SG", age: 27, ask: 10.0, pull: 44,
        ovr: { 2011: 80, 2012: 79, 2013: 80, 2014: 77 }, note: "Monta Ellis have it all. Efficiency not included." },
      { name: "Nate Robinson", pos: "PG", age: 29, ask: 2.0, pull: 34,
        ovr: { 2011: 71, 2012: 74, 2013: 73, 2014: 70 }, note: "Three-time dunk champ, full-time chaos." }
    ],
    2014: [
      { name: "LeBron James", pos: "SF", age: 29, ask: 20.7, pull: 96,
        ovr: { 2011: 96, 2012: 97, 2013: 97, 2014: 97 }, note: "He's going home. Everyone knows he's going home." },
      { name: "Chris Bosh", pos: "C", age: 30, ask: 20.6, pull: 86,
        ovr: { 2011: 86, 2012: 86, 2013: 87, 2014: 87 }, note: "Miami is moving heaven and earth to keep him." },
      { name: "Kyle Lowry", pos: "PG", age: 28, ask: 12.0, pull: 70,
        ovr: { 2011: 79, 2012: 81, 2013: 84, 2014: 85 }, note: "Toronto's engine, finally getting respect." },
      { name: "Pau Gasol", pos: "C", age: 34, ask: 7.1, pull: 62,
        ovr: { 2011: 85, 2012: 83, 2013: 82, 2014: 82 }, note: "Still elegant, wants meaningful basketball." },
      { name: "Trevor Ariza", pos: "SF", age: 29, ask: 8.0, pull: 58,
        ovr: { 2011: 76, 2012: 76, 2013: 78, 2014: 79 }, note: "3-and-D as it was meant to be." },
      { name: "Vince Carter", pos: "SG", age: 37, ask: 3.5, pull: 46,
        ovr: { 2011: 76, 2012: 75, 2013: 75, 2014: 74 }, note: "Half-man, half-a-career-ago, fully professional now." }
    ]
  },

  draft: {
    2012: [
      { name: "Anthony Davis", pos: "PF", realPick: 1, age: 19, ovr: { 2012: 80, 2013: 85, 2014: 89 }, note: "Kentucky — the unibrow changes everything" },
      { name: "Michael Kidd-Gilchrist", pos: "SF", realPick: 2, age: 18, ovr: { 2012: 70, 2013: 69, 2014: 68 }, note: "Kentucky — the jumper is a rumor" },
      { name: "Bradley Beal", pos: "SG", realPick: 3, age: 19, ovr: { 2012: 72, 2013: 76, 2014: 80 }, note: "Florida — Ray Allen starter kit" },
      { name: "Dion Waiters", pos: "SG", realPick: 4, age: 20, ovr: { 2012: 70, 2013: 71, 2014: 72 }, note: "Syracuse — irrational confidence, patent pending" },
      { name: "Damian Lillard", pos: "PG", realPick: 6, age: 22, ovr: { 2012: 79, 2013: 82, 2014: 85 }, note: "Weber State — four years, zero doubts" },
      { name: "Harrison Barnes", pos: "SF", realPick: 7, age: 20, ovr: { 2012: 71, 2013: 72, 2014: 74 }, note: "UNC — looks like a star in warmups" },
      { name: "Andre Drummond", pos: "C", realPick: 9, age: 18, ovr: { 2012: 73, 2013: 78, 2014: 81 }, note: "UConn — the tools; motor sold separately" },
      { name: "Jared Sullinger", pos: "PF", realPick: 21, age: 20, ovr: { 2012: 73, 2013: 75, 2014: 77 }, note: "Ohio State — red-flagged back" },
      { name: "Jae Crowder", pos: "SF", realPick: 34, age: 22, ovr: { 2012: 68, 2013: 70, 2014: 74 }, note: "Marquette — plays like rent is due" },
      { name: "Draymond Green", pos: "PF", realPick: 35, age: 22, ovr: { 2012: 64, 2013: 69, 2014: 82 }, note: "Michigan State — too small, too slow, too smart" },
      { name: "Khris Middleton", pos: "SF", realPick: 39, age: 20, ovr: { 2012: 63, 2013: 70, 2014: 76 }, note: "Texas A&M — smooth, hurt, forgotten" }
    ],
    2013: [
      { name: "Anthony Bennett", pos: "PF", realPick: 1, age: 20, ovr: { 2013: 58, 2014: 56 }, note: "UNLV — someone has to go first" },
      { name: "Victor Oladipo", pos: "SG", realPick: 2, age: 21, ovr: { 2013: 72, 2014: 74 }, note: "Indiana — relentless two-way guard" },
      { name: "Otto Porter", pos: "SF", realPick: 3, age: 20, ovr: { 2013: 62, 2014: 68 }, note: "Georgetown — the safe one, they say" },
      { name: "Ben McLemore", pos: "SG", realPick: 7, age: 20, ovr: { 2013: 65, 2014: 66 }, note: "Kansas — gorgeous stroke, quiet pulse" },
      { name: "CJ McCollum", pos: "PG", realPick: 10, age: 21, ovr: { 2013: 63, 2014: 69 }, note: "Lehigh — mid-major bucket scientist" },
      { name: "Steven Adams", pos: "C", realPick: 12, age: 19, ovr: { 2013: 68, 2014: 73 }, note: "Pitt — made of concrete" },
      { name: "Giannis Antetokounmpo", pos: "SF", realPick: 15, age: 18, ovr: { 2013: 66, 2014: 71 }, note: "Greece — 18, 6'9\", sold sunglasses on the street last year" },
      { name: "Dennis Schröder", pos: "PG", realPick: 17, age: 19, ovr: { 2013: 62, 2014: 71 }, note: "Germany — Rondo starter kit" },
      { name: "Rudy Gobert", pos: "C", realPick: 27, age: 21, ovr: { 2013: 64, 2014: 77 }, note: "France — 7'9\" wingspan, some assembly required" },
      { name: "Livio Jean-Charles", pos: "PF", realPick: 28, age: 19, ovr: { 2013: 50, 2014: 50 }, note: "France — a stash pick that may stay stashed" },
      { name: "Allen Crabbe", pos: "SG", realPick: 31, age: 21, ovr: { 2013: 60, 2014: 65 }, note: "Cal — shooting specialist" }
    ],
    2014: [
      { name: "Andrew Wiggins", pos: "SF", realPick: 1, age: 19, ovr: { 2014: 75 }, note: "Kansas — the anointed one" },
      { name: "Jabari Parker", pos: "PF", realPick: 2, age: 19, ovr: { 2014: 74 }, note: "Duke — polished scorer" },
      { name: "Joel Embiid", pos: "C", realPick: 3, age: 20, ovr: { 2014: 55 }, note: "Kansas — navicular fracture concerns" },
      { name: "Aaron Gordon", pos: "PF", realPick: 4, age: 18, ovr: { 2014: 70 }, note: "Arizona — pogo-stick athlete" },
      { name: "Dante Exum", pos: "PG", realPick: 5, age: 18, ovr: { 2014: 68 }, note: "Australia — mystery box" },
      { name: "Marcus Smart", pos: "PG", realPick: 6, age: 20, ovr: { 2014: 73 }, note: "Oklahoma State — competitive maniac" },
      { name: "Zach LaVine", pos: "SG", realPick: 13, age: 19, ovr: { 2014: 69 }, note: "UCLA — trampolines for legs" },
      { name: "Jusuf Nurkić", pos: "C", realPick: 16, age: 19, ovr: { 2014: 72 }, note: "Bosnia — bruising big" },
      { name: "Clint Capela", pos: "C", realPick: 25, age: 20, ovr: { 2014: 62 }, note: "Switzerland — raw vertical spacer" },
      { name: "Kyle Anderson", pos: "SF", realPick: 30, age: 20, ovr: { 2014: 64 }, note: "UCLA — Slow Mo; the film says he's always open" },
      { name: "Nikola Jokić", pos: "C", realPick: 41, age: 19, ovr: { 2014: 70 }, note: "Serbia — announced during a Taco Bell ad" }
    ]
  },

  gauntlet: {
    2012: [
      { team: "OKC", ovr: 94, conf: "W" }, { team: "LAC", ovr: 91, conf: "W" },
      { team: "MIA", ovr: 95, conf: "E" }, { team: "BOS", ovr: 90, conf: "E" }
    ],
    2013: [
      { team: "OKC", ovr: 93, conf: "W" }, { team: "MEM", ovr: 92, conf: "W" },
      { team: "MIA", ovr: 96, conf: "E" }, { team: "IND", ovr: 92, conf: "E" }
    ],
    2014: [
      { team: "OKC", ovr: 94, conf: "W" }, { team: "LAC", ovr: 92, conf: "W" },
      { team: "MIA", ovr: 95, conf: "E" }, { team: "IND", ovr: 92, conf: "E" }
    ],
    2015: [
      { team: "GSW", ovr: 96, conf: "W" }, { team: "MEM", ovr: 91, conf: "W" },
      { team: "CLE", ovr: 94, conf: "E" }, { team: "ATL", ovr: 91, conf: "E" }
    ]
  },

  events: [
    { year: 2011, text: "The lockout ends just in time for a 66-game sprint. Depth and old legs will decide everything." },
    { year: 2011, text: "Memphis is still celebrating the upset. Zach Randolph says the Spurs' window is 'closed.'" },
    { year: 2012, text: "Charlotte waives Boris Diaw. The league jokes about the waistline; a few coaches mention the passing." },
    { year: 2012, text: "Ray Allen leaves Boston for Miami. Champions shop in the bargain aisle." },
    { year: 2013, text: "Twenty-eight seconds from a fifth banner, the ball found Miami's corner. Some teams break. Some rebuild the machine." },
    { year: 2013, text: "Memphis finally moved Rudy Gay's contract and got better. The analytics people are insufferable about it." },
    { year: 2014, text: "The whole league is trying to copy the ball movement. Copying is not the same as believing." }
  ]
};

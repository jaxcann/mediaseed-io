export default {
  id: "mia2010",
  title: "The Decision",
  team: { id: "MIA", city: "Miami", name: "Heat", colors: ["#98002E", "#F9A01B"], conf: "E" },
  startYear: 2010,
  par: 3,
  difficulty: "Easy",
  realOutcome: "Pat Riley cleared the decks and landed the entire 2010 class. Four straight Finals, rings in 2012 and 2013, and one very famous televised Decision.",
  baselineWins: 47,
  intro:
    "July 1, 2010. Pat Riley has spent two years stripping this roster to the studs for one reason: tonight, the phones open. Dwyane Wade is a free agent in your own lobby, LeBron James is booking an hour of prime time, and Chris Bosh's agent keeps mentioning South Beach. You have three max slots and one summer to change basketball history.",
  tips: "The stars decide in a week. The banners are decided in the bargain bin every July after.",

  cap: { 2010: 58.0, 2011: 58.0, 2012: 58.0, 2013: 58.7 },

  roster: [
    { name: "Michael Beasley", pos: "PF", age: 21, sal: 4.96, ovr: { 2010: 76, 2011: 74, 2012: 70, 2013: 70 } },
    { name: "Mario Chalmers", pos: "PG", age: 24, sal: 0.85, ovr: { 2010: 74, 2011: 75, 2012: 76, 2013: 76 } },
    { name: "Joel Anthony", pos: "C", age: 27, sal: 0.8, ovr: { 2010: 70, 2011: 72, 2012: 72, 2013: 70 } },
    { name: "James Jones", pos: "SF", age: 29, sal: 1.0, ovr: { 2010: 70, 2011: 70, 2012: 69, 2013: 68 } },
    { name: "Dexter Pittman", pos: "C", age: 22, sal: 0.75, ovr: { 2010: 58, 2011: 60, 2012: 58, 2013: 55 } },
    { name: "Jarvis Varnado", pos: "PF", age: 22, sal: 0.5, ovr: { 2010: 55, 2011: 55, 2012: 58, 2013: 56 } },
    { name: "Da'Sean Butler", pos: "SF", age: 22, sal: 0.5, ovr: { 2010: 55, 2011: 55, 2012: 55, 2013: 55 } },
    { name: "Patrick Beverley", pos: "PG", age: 22, sal: 0.5, ovr: { 2010: 55, 2011: 55, 2012: 66, 2013: 70 } }
  ],

  picks: [],

  offers: [
    {
      id: "min-beasley", team: "MIN", year: 2010, until: 2010,
      label: "Minnesota takes Beasley off the books",
      give: ["Michael Beasley"],
      get: {
        players: [],
        picks: [
          { year: 2011, slot: 35, via: "MIN" },
          { year: 2013, slot: 44, via: "MIN" }
        ]
      }
    },
    {
      id: "bos-anthony", team: "BOS", year: 2012, until: 2012,
      label: "Boston will absorb a center's contract",
      give: ["Joel Anthony"],
      get: {
        players: [
          { name: "Fab Melo", pos: "C", age: 22, sal: 1.3, ovr: { 2012: 55, 2013: 55 } }
        ],
        picks: [{ year: 2013, slot: 51, via: "BOS" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Carmelo Anthony", team: "DEN", pos: "SF", age: 26, sal: 17.1,
      ovr: { 2010: 90, 2011: 89, 2012: 91, 2013: 89 },
      cost: 480, from: 2010, until: 2011,
      note: "Won't extend in Denver. The Melodrama has a New York accent." },
    { name: "Chris Paul", team: "NOH", pos: "PG", age: 26, sal: 16.4,
      ovr: { 2010: 93, 2011: 94, 2012: 93, 2013: 93 },
      cost: 520, from: 2011, until: 2011,
      note: "The league literally owns his team. Every contender is circling." },
    { name: "Dwight Howard", team: "ORL", pos: "C", age: 26, sal: 17.9,
      ovr: { 2010: 91, 2011: 92, 2012: 88, 2013: 86 },
      cost: 500, from: 2011, until: 2012,
      note: "The Dwightmare. Opts in, opts out, wants out, stays. Bring aspirin." },
    { name: "James Harden", team: "OKC", pos: "SG", age: 23, sal: 5.8,
      ovr: { 2012: 87, 2013: 89 },
      cost: 320, from: 2012, until: 2012,
      note: "Presti won't pay the tax for his Sixth Man of the Year. Somebody will." },
    { name: "Rajon Rondo", team: "BOS", pos: "PG", age: 24, sal: 10.0,
      ovr: { 2010: 84, 2011: 84, 2012: 82, 2013: 76 },
      cost: 350, from: 2010, until: 2012,
      note: "Ainge listens on everyone. Even the ones he loves." },
    { name: "Pau Gasol", team: "LAL", pos: "C", age: 31, sal: 18.7,
      ovr: { 2011: 86, 2012: 83, 2013: 81 },
      cost: 300, from: 2011, until: 2013,
      note: "The Lakers already traded him once. The league office un-traded him." },
    { name: "Andre Iguodala", team: "PHI", pos: "SF", age: 26, sal: 12.3,
      ovr: { 2010: 83, 2011: 83, 2012: 83, 2013: 83 },
      cost: 260, from: 2010, until: 2011,
      note: "Philadelphia is ready to hand the keys to the kids." },
    { name: "Zach Randolph", team: "MEM", pos: "PF", age: 29, sal: 16.9,
      ovr: { 2010: 85, 2011: 86, 2012: 80, 2013: 82 },
      cost: 200, from: 2010, until: 2011,
      note: "20-and-10 every night. Memphis keeps almost paying him." },
    { name: "Rudy Gay", team: "MEM", pos: "SF", age: 24, sal: 13.6,
      ovr: { 2010: 81, 2011: 82, 2012: 80, 2013: 78 },
      cost: 220, from: 2010, until: 2012,
      note: "Max-contract shoulders, mid-range heart. Memphis counts every dollar." },
    { name: "Monta Ellis", team: "GSW", pos: "SG", age: 24, sal: 11.0,
      ovr: { 2010: 80, 2011: 80, 2012: 79, 2013: 77 },
      cost: 160, from: 2010, until: 2011,
      note: "Golden State can't decide between its two small guards." },
    { name: "Marcin Gortat", team: "ORL", pos: "C", age: 26, sal: 6.3,
      ovr: { 2010: 75, 2011: 79, 2012: 77, 2013: 76 },
      cost: 90, from: 2010, until: 2011,
      note: "The best backup center alive, stuck behind Superman." }
  ],

  freeAgents: {
    2010: [
      { name: "LeBron James", pos: "SF", age: 25, ask: 14.9, pull: 84,
        ovr: { 2010: 96, 2011: 97, 2012: 97, 2013: 96 },
        note: "An hour of prime time is booked. He wants to win now — with friends." },
      { name: "Dwyane Wade", pos: "SG", age: 28, ask: 14.9, pull: 55,
        ovr: { 2010: 93, 2011: 92, 2012: 90, 2013: 87 },
        note: "Your franchise. He wants to stay — if you show him a plan." },
      { name: "Chris Bosh", pos: "C", age: 26, ask: 14.5, pull: 72,
        ovr: { 2010: 87, 2011: 86, 2012: 85, 2013: 84 },
        note: "Done losing in Toronto. Keeps mentioning warm weather." },
      { name: "Amar'e Stoudemire", pos: "PF", age: 27, ask: 16.5, pull: 60,
        ovr: { 2010: 88, 2011: 84, 2012: 78, 2013: 72 },
        note: "Uninsurable knees, unguardable rolls. Wants the full max." },
      { name: "Carlos Boozer", pos: "PF", age: 28, ask: 14.4, pull: 55,
        ovr: { 2010: 84, 2011: 82, 2012: 80, 2013: 77 },
        note: "Reliable 20-and-10, allergic to defense in May." },
      { name: "Joe Johnson", pos: "SG", age: 29, ask: 16.3, pull: 65,
        ovr: { 2010: 85, 2011: 84, 2012: 83, 2013: 81 },
        note: "Atlanta is about to make him the highest-paid player alive. Really." },
      { name: "David Lee", pos: "PF", age: 27, ask: 11.6, pull: 50,
        ovr: { 2010: 82, 2011: 81, 2012: 82, 2013: 81 },
        note: "Double-doubles by the crate. Someone will pay retail." },
      { name: "Udonis Haslem", pos: "PF", age: 30, ask: 3.5, pull: 40,
        ovr: { 2010: 76, 2011: 75, 2012: 73, 2013: 70 },
        note: "Heart of the franchise. Turning down bigger money elsewhere." },
      { name: "Mike Miller", pos: "SF", age: 30, ask: 5.8, pull: 45,
        ovr: { 2010: 77, 2011: 74, 2012: 72, 2013: 72 },
        note: "Shooting cures a lot of ills. His thumbs are another story." }
    ],
    2011: [
      { name: "Tyson Chandler", pos: "C", age: 28, ask: 13.9, pull: 62,
        ovr: { 2011: 84, 2012: 82, 2013: 80 },
        note: "Just anchored a champion. The market noticed." },
      { name: "Shane Battier", pos: "SF", age: 32, ask: 3.4, pull: 58,
        ovr: { 2011: 76, 2012: 74, 2013: 72 },
        note: "No box-score numbers, all winning. Choosing his last team carefully." },
      { name: "David West", pos: "PF", age: 31, ask: 10.0, pull: 60,
        ovr: { 2011: 80, 2012: 80, 2013: 78 },
        note: "Coming off the ACL, still the meanest elbow-jumper alive." },
      { name: "Nenê", pos: "C", age: 28, ask: 13.0, pull: 50,
        ovr: { 2011: 80, 2012: 77, 2013: 74 },
        note: "Denver's strongman, priced like it." },
      { name: "Jamal Crawford", pos: "SG", age: 31, ask: 5.0, pull: 45,
        ovr: { 2011: 76, 2012: 75, 2013: 74 },
        note: "Instant offense, sold by the quart." },
      { name: "Caron Butler", pos: "SF", age: 31, ask: 8.0, pull: 42,
        ovr: { 2011: 75, 2012: 74, 2013: 71 },
        note: "Tough Juice, fresh off a ring run he watched in a suit." }
    ],
    2012: [
      { name: "Ray Allen", pos: "SG", age: 37, ask: 3.1, pull: 72,
        ovr: { 2012: 80, 2013: 78 },
        note: "Boston offered double. He is tired of Boston." },
      { name: "Steve Nash", pos: "PG", age: 38, ask: 9.0, pull: 80,
        ovr: { 2012: 82, 2013: 76 },
        note: "Two MVPs, zero rings, one last decision." },
      { name: "Chris Andersen", pos: "C", age: 34, ask: 1.4, pull: 40,
        ovr: { 2012: 74, 2013: 73 },
        note: "Suspended, forgotten, and springy as ever." },
      { name: "Jason Terry", pos: "SG", age: 34, ask: 5.0, pull: 55,
        ovr: { 2012: 75, 2013: 72 },
        note: "The Jet still boards for big games." },
      { name: "O.J. Mayo", pos: "SG", age: 24, ask: 4.0, pull: 45,
        ovr: { 2012: 76, 2013: 73 },
        note: "Former No. 3 pick looking for a reset." },
      { name: "Rashard Lewis", pos: "PF", age: 32, ask: 1.4, pull: 35,
        ovr: { 2012: 68, 2013: 66 },
        note: "Once the second-biggest contract in basketball. Now a minimum flyer." }
    ],
    2013: [
      { name: "Dwight Howard", pos: "C", age: 27, ask: 20.5, pull: 82,
        ovr: { 2013: 86 },
        note: "The biggest name on the market, with baggage fees." },
      { name: "Andre Iguodala", pos: "SF", age: 29, ask: 12.0, pull: 74,
        ovr: { 2013: 83 },
        note: "Wants a ready-made contender." },
      { name: "Al Jefferson", pos: "C", age: 28, ask: 13.5, pull: 55,
        ovr: { 2013: 82 },
        note: "Old-school low-post scoring, minus defense." },
      { name: "Josh Smith", pos: "PF", age: 27, ask: 13.5, pull: 52,
        ovr: { 2013: 80 },
        note: "Athletic marvel who loves the long two." },
      { name: "Monta Ellis", pos: "SG", age: 27, ask: 10.0, pull: 45,
        ovr: { 2013: 80 },
        note: "Buckets, on his terms." },
      { name: "Greg Oden", pos: "C", age: 25, ask: 1.0, pull: 35,
        ovr: { 2013: 62 },
        note: "Hasn't played since 2009. The knees get the final vote." }
    ]
  },

  draft: {
    2011: [
      { name: "Kyrie Irving", pos: "PG", realPick: 1, age: 19, ovr: { 2011: 82, 2012: 86, 2013: 88 }, note: "Duke — eleven college games, zero doubts" },
      { name: "Derrick Williams", pos: "PF", realPick: 2, age: 20, ovr: { 2011: 68, 2012: 68, 2013: 66 }, note: "Arizona — tweener with a March highlight reel" },
      { name: "Enes Kanter", pos: "C", realPick: 3, age: 19, ovr: { 2011: 66, 2012: 71, 2013: 73 }, note: "Turkey — never played a college minute" },
      { name: "Tristan Thompson", pos: "PF", realPick: 4, age: 20, ovr: { 2011: 70, 2012: 73, 2013: 74 }, note: "Texas — motor and offensive boards" },
      { name: "Jonas Valančiūnas", pos: "C", realPick: 5, age: 19, ovr: { 2011: 60, 2012: 73, 2013: 75 }, note: "Lithuania — a year away, worth the wait?" },
      { name: "Brandon Knight", pos: "PG", realPick: 8, age: 19, ovr: { 2011: 71, 2012: 72, 2013: 74 }, note: "Kentucky — honor student with a quick trigger" },
      { name: "Kemba Walker", pos: "PG", realPick: 9, age: 21, ovr: { 2011: 74, 2012: 78, 2013: 81 }, note: "UConn — just carried a team to a title" },
      { name: "Klay Thompson", pos: "SG", realPick: 11, age: 21, ovr: { 2011: 74, 2012: 79, 2013: 83 }, note: "Washington State — shooter's bloodlines" },
      { name: "Kawhi Leonard", pos: "SF", realPick: 15, age: 20, ovr: { 2011: 76, 2012: 80, 2013: 84 }, note: "San Diego State — giant hands, can't shoot, they say" },
      { name: "Nikola Vučević", pos: "C", realPick: 16, age: 20, ovr: { 2011: 68, 2012: 77, 2013: 79 }, note: "USC — skilled Montenegrin big" },
      { name: "Tobias Harris", pos: "PF", realPick: 19, age: 18, ovr: { 2011: 65, 2012: 72, 2013: 74 }, note: "Tennessee — young, smooth forward" },
      { name: "Kenneth Faried", pos: "PF", realPick: 22, age: 21, ovr: { 2011: 74, 2012: 77, 2013: 76 }, note: "Morehead State — the Manimal rebounds everything" },
      { name: "Reggie Jackson", pos: "PG", realPick: 24, age: 21, ovr: { 2011: 62, 2012: 68, 2013: 74 }, note: "Boston College — long arms, big self-belief" },
      { name: "Jimmy Butler", pos: "SF", realPick: 30, age: 21, ovr: { 2011: 62, 2012: 70, 2013: 78 }, note: "Marquette — the last pick of round one, hardest story in the draft" },
      { name: "Chandler Parsons", pos: "SF", realPick: 38, age: 22, ovr: { 2011: 74, 2012: 76, 2013: 78 }, note: "Florida — ready-made wing hiding in round two" },
      { name: "Isaiah Thomas", pos: "PG", realPick: 60, age: 22, ovr: { 2011: 72, 2012: 74, 2013: 78 }, note: "Washington — Mr. Irrelevant, allegedly" }
    ],
    2012: [
      { name: "Anthony Davis", pos: "PF", realPick: 1, age: 19, ovr: { 2012: 80, 2013: 85 }, note: "Kentucky — the unibrow changes franchises" },
      { name: "Michael Kidd-Gilchrist", pos: "SF", realPick: 2, age: 18, ovr: { 2012: 70, 2013: 69 }, note: "Kentucky — relentless, jumper pending" },
      { name: "Bradley Beal", pos: "SG", realPick: 3, age: 19, ovr: { 2012: 74, 2013: 77 }, note: "Florida — the next great two-guard" },
      { name: "Dion Waiters", pos: "SG", realPick: 4, age: 20, ovr: { 2012: 71, 2013: 72 }, note: "Syracuse — sixth man drafted like a star" },
      { name: "Damian Lillard", pos: "PG", realPick: 6, age: 22, ovr: { 2012: 80, 2013: 84 }, note: "Weber State — small school, zero fear" },
      { name: "Harrison Barnes", pos: "SF", realPick: 7, age: 20, ovr: { 2012: 72, 2013: 73 }, note: "North Carolina — the Black Falcon" },
      { name: "Terrence Ross", pos: "SG", realPick: 8, age: 21, ovr: { 2012: 66, 2013: 69 }, note: "Washington — bounce and threes" },
      { name: "Andre Drummond", pos: "C", realPick: 9, age: 18, ovr: { 2012: 74, 2013: 80 }, note: "UConn — the body of a 1998 franchise center" },
      { name: "Jared Sullinger", pos: "PF", realPick: 21, age: 20, ovr: { 2012: 70, 2013: 73 }, note: "Ohio State — red-flagged back, lottery talent" },
      { name: "Jae Crowder", pos: "SF", realPick: 34, age: 22, ovr: { 2012: 68, 2013: 69 }, note: "Marquette — plays like rent is due" },
      { name: "Draymond Green", pos: "PF", realPick: 35, age: 22, ovr: { 2012: 66, 2013: 70 }, note: "Michigan State — no position, or every position" },
      { name: "Khris Middleton", pos: "SF", realPick: 39, age: 20, ovr: { 2012: 63, 2013: 71 }, note: "Texas A&M — knee dropped him a round" }
    ],
    2013: [
      { name: "Anthony Bennett", pos: "PF", realPick: 1, age: 20, ovr: { 2013: 55 }, note: "UNLV — nobody saw this pick coming, including him" },
      { name: "Victor Oladipo", pos: "SG", realPick: 2, age: 21, ovr: { 2013: 74 }, note: "Indiana — two-way tornado" },
      { name: "Otto Porter", pos: "SF", realPick: 3, age: 20, ovr: { 2013: 60 }, note: "Georgetown — safe, they insist" },
      { name: "Cody Zeller", pos: "C", realPick: 4, age: 20, ovr: { 2013: 69 }, note: "Indiana — the third Zeller brother" },
      { name: "Nerlens Noel", pos: "C", realPick: 6, age: 19, ovr: { 2013: 55 }, note: "Kentucky — torn ACL, flat-top intact" },
      { name: "Ben McLemore", pos: "SG", realPick: 7, age: 20, ovr: { 2013: 65 }, note: "Kansas — textbook jumper" },
      { name: "C.J. McCollum", pos: "SG", realPick: 10, age: 21, ovr: { 2013: 68 }, note: "Lehigh — bucket-getter from the Patriot League" },
      { name: "Steven Adams", pos: "C", realPick: 12, age: 19, ovr: { 2013: 70 }, note: "New Zealand — raw, enormous, cheerful" },
      { name: "Giannis Antetokounmpo", pos: "SF", realPick: 15, age: 18, ovr: { 2013: 66 }, note: "Greece — sold sunglasses on the street a year ago; 6'9\" and growing" },
      { name: "Dennis Schröder", pos: "PG", realPick: 17, age: 19, ovr: { 2013: 62 }, note: "Germany — blur with a blond patch" },
      { name: "Gorgui Dieng", pos: "C", realPick: 21, age: 23, ovr: { 2013: 71 }, note: "Louisville — championship rim protector" },
      { name: "Rudy Gobert", pos: "C", realPick: 27, age: 21, ovr: { 2013: 64 }, note: "France — the longest wingspan ever measured at the combine" },
      { name: "Allen Crabbe", pos: "SG", realPick: 31, age: 21, ovr: { 2013: 58 }, note: "Cal — shooting specialist, round two" }
    ]
  },

  gauntlet: {
    2011: [
      { team: "CHI", ovr: 93, conf: "E" }, { team: "BOS", ovr: 92, conf: "E" },
      { team: "DAL", ovr: 95, conf: "W" }, { team: "LAL", ovr: 93, conf: "W" },
      { team: "OKC", ovr: 92, conf: "W" }
    ],
    2012: [
      { team: "CHI", ovr: 93, conf: "E" }, { team: "BOS", ovr: 90, conf: "E" },
      { team: "OKC", ovr: 95, conf: "W" }, { team: "SAS", ovr: 94, conf: "W" }
    ],
    2013: [
      { team: "IND", ovr: 92, conf: "E" }, { team: "NYK", ovr: 90, conf: "E" },
      { team: "SAS", ovr: 96, conf: "W" }, { team: "OKC", ovr: 93, conf: "W" }
    ],
    2014: [
      { team: "IND", ovr: 92, conf: "E" }, { team: "SAS", ovr: 97, conf: "W" },
      { team: "OKC", ovr: 94, conf: "W" }
    ]
  },

  events: [
    { year: 2010, text: "A Boys & Girls Club in Greenwich has been booked for an hour of prime-time television." },
    { year: 2010, text: "Riley cleared the books to almost nothing. Whoever signs first recruits the rest." },
    { year: 2011, text: "The lockout ends with a 66-game sprint. Cheap veteran legs will matter." },
    { year: 2011, text: "Dallas just proved a superteam can be beaten by one star and a zone." },
    { year: 2012, text: "Oklahoma City is haggling with its Sixth Man of the Year over a few million dollars." },
    { year: 2012, text: "Boston's Big Three era is wobbling. Proud veterans are shopping for rings." },
    { year: 2013, text: "San Antonio came within 28 seconds of a title. They are not going anywhere." },
    { year: 2013, text: "Greg Oden is working out for teams again." }
  ]
};

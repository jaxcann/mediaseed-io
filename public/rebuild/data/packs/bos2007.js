export default {
  id: "bos2007",
  title: "The Big Three",
  team: { id: "BOS", city: "Boston", name: "Celtics", colors: ["#007A33", "#BA9653"], conf: "E" },
  startYear: 2007,
  par: 3,
  difficulty: "Easy",
  realOutcome: "Ainge flipped the #5 pick for Ray Allen on draft night, then emptied the cupboard for Garnett. 66 wins, Banner 17, year one. Sometimes it really is that easy.",
  baselineWins: 24,
  intro:
    "July 2007. Boston just lost 58 games, the lottery balls landed fifth, and Paul Pierce wants help or wants out — pick one. But Kevin McHale still answers when Danny calls, and Seattle just drafted a franchise-changing teenager who makes their All-Star shooting guard expendable. You have a rookie forward, a vault of young players, and one summer to turn 24 wins into banner 17.",
  tips: "Both phone calls are worth taking. The hard part is knowing which 21-year-old NOT to trade — he plays point guard.",

  cap: { 2007: 55.6, 2008: 58.7, 2009: 57.7, 2010: 58.0 },

  roster: [
    { name: "Paul Pierce", pos: "SF", age: 29, sal: 16.4, ovr: { 2007: 90, 2008: 88, 2009: 87, 2010: 85 } },
    { name: "Al Jefferson", pos: "PF", age: 22, sal: 2.6, ovr: { 2007: 85, 2008: 84, 2009: 82, 2010: 80 } },
    { name: "Wally Szczerbiak", pos: "SF", age: 30, sal: 12.2, ovr: { 2007: 74, 2008: 72, 2009: 60, 2010: 55 } },
    { name: "Jeff Green", pos: "SF", age: 20, sal: 3.1, ovr: { 2007: 72, 2008: 74, 2009: 76, 2010: 77 } },
    { name: "Rajon Rondo", pos: "PG", age: 21, sal: 1.3, ovr: { 2007: 76, 2008: 80, 2009: 83, 2010: 85 } },
    { name: "Kendrick Perkins", pos: "C", age: 22, sal: 4.1, ovr: { 2007: 74, 2008: 77, 2009: 78, 2010: 76 } },
    { name: "Tony Allen", pos: "SG", age: 25, sal: 1.8, ovr: { 2007: 73, 2008: 72, 2009: 74, 2010: 75 } },
    { name: "Delonte West", pos: "PG", age: 23, sal: 1.8, ovr: { 2007: 74, 2008: 76, 2009: 75, 2010: 72 } },
    { name: "Gerald Green", pos: "SG", age: 21, sal: 2.1, ovr: { 2007: 68, 2008: 64, 2009: 62, 2010: 60 } },
    { name: "Ryan Gomes", pos: "PF", age: 24, sal: 0.8, ovr: { 2007: 74, 2008: 73, 2009: 72, 2010: 70 } },
    { name: "Glen Davis", pos: "PF", age: 21, sal: 0.4, ovr: { 2007: 70, 2008: 72, 2009: 74, 2010: 73 } }
  ],

  picks: [],

  offers: [
    {
      id: "sea-ray", team: "SEA", year: 2007, until: 2007,
      label: "Seattle rebuilds around the rookie — Ray Allen is available",
      give: ["Jeff Green", "Delonte West", "Wally Szczerbiak"],
      get: {
        players: [
          { name: "Ray Allen", pos: "SG", age: 31, sal: 16.0, ovr: { 2007: 87, 2008: 85, 2009: 84, 2010: 84 } }
        ],
        picks: []
      }
    },
    {
      id: "min-kg", team: "MIN", year: 2007, until: 2007,
      label: "McHale will move Garnett — for the entire young core, plus a pick",
      give: ["Al Jefferson", "Gerald Green", "Ryan Gomes"],
      get: {
        players: [
          { name: "Kevin Garnett", pos: "PF", age: 31, sal: 23.8, ovr: { 2007: 92, 2008: 90, 2009: 86, 2010: 85 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Shawn Marion", team: "PHX", pos: "SF", age: 29, sal: 16.9,
      ovr: { 2007: 85, 2008: 82, 2009: 80, 2010: 78 },
      cost: 280, from: 2007, until: 2007, direction: "retooling",
      note: "Tired of being the third banana in Phoenix. The Matrix wants top billing." },
    { name: "Jermaine O'Neal", team: "IND", pos: "C", age: 28, sal: 19.7,
      ovr: { 2007: 82, 2008: 74, 2009: 74, 2010: 73 },
      cost: 250, from: 2007, until: 2007, direction: "rebuilding",
      note: "Indiana is rebuilding. Six All-Star games, and the knees have mileage." },
    { name: "Mike Bibby", team: "SAC", pos: "PG", age: 29, sal: 13.5,
      ovr: { 2007: 78, 2008: 77, 2009: 75, 2010: 72 },
      cost: 130, from: 2007, until: 2007, direction: "rebuilding",
      note: "The Kings' glory years are over. Everyone is available." },
    { name: "Zach Randolph", team: "NYK", pos: "PF", age: 26, sal: 13.3,
      ovr: { 2007: 82, 2008: 80, 2009: 83, 2010: 82 },
      cost: 150, from: 2007, until: 2008, direction: "retooling",
      note: "20 and 10, with fine print. Isiah collects these." },
    { name: "Marcus Camby", team: "DEN", pos: "C", age: 34, sal: 10.0,
      ovr: { 2008: 78, 2009: 76, 2010: 74 },
      cost: 50, from: 2008, until: 2008, direction: "retooling",
      note: "Denver is dumping the reigning DPOY for cap relief. Yes, really." },
    { name: "Vince Carter", team: "NJN", pos: "SG", age: 31, sal: 15.7,
      ovr: { 2008: 83, 2009: 81, 2010: 79 },
      cost: 200, from: 2008, until: 2009, direction: "retooling",
      note: "New Jersey is packing for Brooklyn and shedding stars." },
    { name: "Tyson Chandler", team: "NOH", pos: "C", age: 26, sal: 11.3,
      ovr: { 2008: 77, 2009: 73, 2010: 76 },
      cost: 110, from: 2008, until: 2009, direction: "retooling",
      note: "Lob target and rim protector; a toe injury has New Orleans nervous." },
    { name: "Antawn Jamison", team: "WAS", pos: "PF", age: 33, sal: 11.6,
      ovr: { 2009: 80, 2010: 76 },
      cost: 160, from: 2009, until: 2009, direction: "rebuilding",
      note: "Washington's rebuild is on. Ready-made scoring for a contender." },
    { name: "Kevin Martin", team: "SAC", pos: "SG", age: 26, sal: 10.6,
      ovr: { 2008: 80, 2009: 79, 2010: 77 },
      cost: 150, from: 2008, until: 2009, direction: "rebuilding",
      note: "Twenty-plus a night with a slingshot release. Sacramento always listens." },
    { name: "Stephon Marbury", team: "NYK", pos: "PG", age: 30, sal: 20.8,
      ovr: { 2007: 74, 2008: 62, 2009: 60, 2010: 55 },
      cost: 60, from: 2007, until: 2008, direction: "retooling",
      note: "Starbury, the contract, the circus. Practically a buyout candidate." }
  ],

  freeAgents: {
    2007: [
      { name: "Rashard Lewis", pos: "SF", age: 27, ask: 20.0, pull: 60,
        ovr: { 2007: 82, 2008: 81, 2009: 78, 2010: 75 }, note: "Orlando is about to make him the highest-paid player you've barely thought about." },
      { name: "Chauncey Billups", pos: "PG", age: 30, ask: 11.0, pull: 75,
        ovr: { 2007: 86, 2008: 85, 2009: 84, 2010: 82 }, note: "Mr. Big Shot is testing the market. Detroit will probably blink." },
      { name: "James Posey", pos: "SF", age: 30, ask: 3.5, pull: 55,
        ovr: { 2007: 76, 2008: 75, 2009: 73, 2010: 70 }, note: "Championship corner threes and hard fouls, sold separately from ego." },
      { name: "Mo Williams", pos: "PG", age: 24, ask: 8.5, pull: 55,
        ovr: { 2007: 78, 2008: 79, 2009: 78, 2010: 76 }, note: "Milwaukee's scoring guard wants starter money." },
      { name: "Grant Hill", pos: "SF", age: 34, ask: 1.8, pull: 65,
        ovr: { 2007: 76, 2008: 75, 2009: 74, 2010: 73 }, note: "Finally healthy, chasing a ring for the veteran minimum." },
      { name: "P.J. Brown", pos: "PF", age: 37, ask: 1.0, pull: 60,
        ovr: { 2007: 68, 2008: 66, 2009: 60, 2010: 55 }, note: "Semi-retired in Louisiana, waiting for a contender to call in the spring." }
    ],
    2008: [
      { name: "Baron Davis", pos: "PG", age: 29, ask: 13.0, pull: 60,
        ovr: { 2008: 83, 2009: 79, 2010: 76 }, note: "Opted out in Oakland after the We Believe run. Hollywood beckons." },
      { name: "Elton Brand", pos: "PF", age: 29, ask: 16.0, pull: 60,
        ovr: { 2008: 78, 2009: 74, 2010: 76 }, note: "Coming off a ruptured Achilles, still commanding near-max money." },
      { name: "Corey Maggette", pos: "SF", age: 28, ask: 10.0, pull: 45,
        ovr: { 2008: 79, 2009: 77, 2010: 75 }, note: "Lives at the free-throw line, wherever he plays." },
      { name: "James Jones", pos: "SF", age: 27, ask: 3.0, pull: 40,
        ovr: { 2008: 70, 2009: 70, 2010: 71 }, note: "Corner-three specialist. Stars love playing with him." },
      { name: "Mickael Pietrus", pos: "SG", age: 26, ask: 5.0, pull: 40,
        ovr: { 2008: 73, 2009: 74, 2010: 72 }, note: "3-and-D wing with Finals-sized confidence." },
      { name: "Chris Duhon", pos: "PG", age: 25, ask: 4.5, pull: 35,
        ovr: { 2008: 72, 2009: 71, 2010: 69 }, note: "Steady backup hands." }
    ],
    2009: [
      { name: "Ron Artest", pos: "SF", age: 29, ask: 5.8, pull: 70,
        ovr: { 2009: 80, 2010: 78 }, note: "Wants a ring badly enough to take the mid-level. Chaos included at no charge." },
      { name: "Rasheed Wallace", pos: "PF", age: 34, ask: 5.7, pull: 60,
        ovr: { 2009: 74, 2010: 70 }, note: "One last dance for a ring-chasing contender. Ball don't lie." },
      { name: "Trevor Ariza", pos: "SF", age: 24, ask: 6.5, pull: 55,
        ovr: { 2009: 77, 2010: 76 }, note: "Fresh off a title run, priced accordingly." },
      { name: "Andre Miller", pos: "PG", age: 33, ask: 7.0, pull: 45,
        ovr: { 2009: 78, 2010: 77 }, note: "Never jumps, never hurries, always delivers." },
      { name: "Ben Gordon", pos: "SG", age: 26, ask: 11.0, pull: 45,
        ovr: { 2009: 77, 2010: 74 }, note: "Detroit is about to pay him like a franchise guard. He is not one." },
      { name: "Hedo Turkoglu", pos: "SF", age: 30, ask: 10.6, pull: 50,
        ovr: { 2009: 76, 2010: 73 }, note: "A Finals run made him rich. Someone will regret this contract." }
    ],
    2010: [
      { name: "LeBron James", pos: "SF", age: 25, ask: 16.5, pull: 97,
        ovr: { 2010: 96 }, note: "The Decision is coming. Everyone gets a meeting; one city gets a parade." },
      { name: "Dwyane Wade", pos: "SG", age: 28, ask: 15.5, pull: 93,
        ovr: { 2010: 90 }, note: "Taking meetings, but Miami holds his heart and his cap space." },
      { name: "Chris Bosh", pos: "PF", age: 26, ask: 16.0, pull: 85,
        ovr: { 2010: 85 }, note: "Toronto's franchise big is definitely leaving. Destination flexible." },
      { name: "Amar'e Stoudemire", pos: "PF", age: 27, ask: 19.9, pull: 70,
        ovr: { 2010: 86 }, note: "Uninsurable knees, max demands. New York is smitten anyway." },
      { name: "Joe Johnson", pos: "SG", age: 29, ask: 21.0, pull: 65,
        ovr: { 2010: 84 }, note: "Atlanta is about to hand out the summer's most regrettable max." },
      { name: "Carlos Boozer", pos: "PF", age: 28, ask: 15.0, pull: 55,
        ovr: { 2010: 83 }, note: "20 and 10 for hire. References available upon request. Mostly." },
      { name: "David Lee", pos: "PF", age: 27, ask: 13.0, pull: 50,
        ovr: { 2010: 80 }, note: "Double-double machine cashing in on the Knicks' leftovers." }
    ]
  },

  draft: {
    2008: [
      { name: "Derrick Rose", pos: "PG", realPick: 1, age: 19, ovr: { 2008: 78, 2009: 82, 2010: 87 }, note: "Memphis — hometown balls bounced Chicago's way" },
      { name: "Michael Beasley", pos: "PF", realPick: 2, age: 19, ovr: { 2008: 72, 2009: 73, 2010: 74 }, note: "Kansas State — 26 and 12 in college, questions after hours" },
      { name: "O.J. Mayo", pos: "SG", realPick: 3, age: 20, ovr: { 2008: 74, 2009: 73, 2010: 72 }, note: "USC — famous since eighth grade" },
      { name: "Russell Westbrook", pos: "PG", realPick: 4, age: 19, ovr: { 2008: 74, 2009: 79, 2010: 84 }, note: "UCLA — played off the ball in college. Seattle sees something" },
      { name: "Kevin Love", pos: "PF", realPick: 5, age: 19, ovr: { 2008: 73, 2009: 78, 2010: 86 }, note: "UCLA — outlet passes like Wes Unseld" },
      { name: "Danilo Gallinari", pos: "SF", realPick: 6, age: 19, ovr: { 2008: 62, 2009: 74, 2010: 76 }, note: "Italy — smooth scorer, cranky back" },
      { name: "Eric Gordon", pos: "SG", realPick: 7, age: 19, ovr: { 2008: 74, 2009: 76, 2010: 77 }, note: "Indiana — built like a safety, shoots like a marksman" },
      { name: "Brook Lopez", pos: "C", realPick: 10, age: 20, ovr: { 2008: 75, 2009: 78, 2010: 79 }, note: "Stanford — the skilled twin" },
      { name: "Serge Ibaka", pos: "PF", realPick: 24, age: 18, ovr: { 2008: 58, 2009: 70, 2010: 75 }, note: "Congo via Spain — stash pick with volcanic bounce" },
      { name: "Nicolas Batum", pos: "SF", realPick: 25, age: 19, ovr: { 2008: 68, 2009: 72, 2010: 74 }, note: "France — glue wing, heart scare cleared" },
      { name: "George Hill", pos: "PG", realPick: 26, age: 22, ovr: { 2008: 68, 2009: 73, 2010: 76 }, note: "IUPUI — Popovich watched him twice. That's the tell" },
      { name: "DeAndre Jordan", pos: "C", realPick: 35, age: 19, ovr: { 2008: 62, 2009: 66, 2010: 72 }, note: "Texas A&M — lottery body, second-round motor. For now" },
      { name: "Goran Dragic", pos: "PG", realPick: 45, age: 22, ovr: { 2008: 62, 2009: 68, 2010: 72 }, note: "Slovenia — awkward now, fearless later" }
    ],
    2009: [
      { name: "Blake Griffin", pos: "PF", realPick: 1, age: 20, ovr: { 2009: 55, 2010: 86 }, note: "Oklahoma — human highlight; a kneecap will test the patience" },
      { name: "Hasheem Thabeet", pos: "C", realPick: 2, age: 22, ovr: { 2009: 58, 2010: 56 }, note: "UConn — 7'3\" of pure projection" },
      { name: "James Harden", pos: "SG", realPick: 3, age: 19, ovr: { 2009: 73, 2010: 77 }, note: "Arizona State — bearded lefty, happy off the bench. For now" },
      { name: "Tyreke Evans", pos: "SG", realPick: 4, age: 19, ovr: { 2009: 78, 2010: 74 }, note: "Memphis — 20-5-5 out of the box" },
      { name: "Ricky Rubio", pos: "PG", realPick: 5, age: 18, ovr: { 2009: 55, 2010: 55 }, note: "Spain — the passing prodigy is staying in Barcelona a while" },
      { name: "Stephen Curry", pos: "PG", realPick: 7, age: 21, ovr: { 2009: 78, 2010: 82 }, note: "Davidson — too small, they say. The shooting is not of this earth" },
      { name: "DeMar DeRozan", pos: "SG", realPick: 9, age: 19, ovr: { 2009: 70, 2010: 73 }, note: "USC — dunker first, everything else later" },
      { name: "Brandon Jennings", pos: "PG", realPick: 10, age: 19, ovr: { 2009: 74, 2010: 74 }, note: "Skipped college for Rome. Will drop 55 on somebody" },
      { name: "Jrue Holiday", pos: "PG", realPick: 17, age: 19, ovr: { 2009: 68, 2010: 74 }, note: "UCLA — two-way guard hiding in a bad college fit" },
      { name: "Ty Lawson", pos: "PG", realPick: 18, age: 21, ovr: { 2009: 72, 2010: 75 }, note: "North Carolina — champion sparkplug, slid for being 5'11\"" },
      { name: "Jeff Teague", pos: "PG", realPick: 19, age: 21, ovr: { 2009: 64, 2010: 68 }, note: "Wake Forest — quicker than his draft slot" },
      { name: "Patrick Beverley", pos: "PG", realPick: 42, age: 21, ovr: { 2009: 55, 2010: 55 }, note: "Arkansas via Ukraine — overseas detour, chip on shoulder intact" },
      { name: "Danny Green", pos: "SG", realPick: 46, age: 22, ovr: { 2009: 62, 2010: 62 }, note: "North Carolina — four-year winner, roster-spot vagabond" }
    ],
    2010: [
      { name: "John Wall", pos: "PG", realPick: 1, age: 19, ovr: { 2010: 78 }, note: "Kentucky — fastest baseline-to-baseline player alive" },
      { name: "Evan Turner", pos: "SG", realPick: 2, age: 21, ovr: { 2010: 68 }, note: "Ohio State — national player of the year, fit questions" },
      { name: "Derrick Favors", pos: "PF", realPick: 3, age: 18, ovr: { 2010: 70 }, note: "Georgia Tech — 18-year-old with a grown man's frame" },
      { name: "DeMarcus Cousins", pos: "C", realPick: 5, age: 19, ovr: { 2010: 76 }, note: "Kentucky — most talented big in the class, loudest too" },
      { name: "Greg Monroe", pos: "C", realPick: 7, age: 20, ovr: { 2010: 74 }, note: "Georgetown — passing big from the Princeton lab" },
      { name: "Gordon Hayward", pos: "SF", realPick: 9, age: 20, ovr: { 2010: 68 }, note: "Butler — half an inch from a national title" },
      { name: "Paul George", pos: "SF", realPick: 10, age: 20, ovr: { 2010: 72 }, note: "Fresno State — the scouts whisper about the wingspan" },
      { name: "Eric Bledsoe", pos: "PG", realPick: 18, age: 20, ovr: { 2010: 68 }, note: "Kentucky — Wall's backcourt mate, a starter in hiding" },
      { name: "Avery Bradley", pos: "SG", realPick: 19, age: 19, ovr: { 2010: 62 }, note: "Texas — on-ball defense arrives years before the jumper" },
      { name: "Hassan Whiteside", pos: "C", realPick: 33, age: 21, ovr: { 2010: 58 }, note: "Marshall — blocks everything, including his own development" },
      { name: "Lance Stephenson", pos: "SG", realPick: 40, age: 19, ovr: { 2010: 60 }, note: "Cincinnati — Born Ready, eventually" }
    ]
  },

  gauntlet: {
    2008: [
      { team: "DET", ovr: 92, conf: "E" }, { team: "CLE", ovr: 91, conf: "E" },
      { team: "LAL", ovr: 95, conf: "W" }, { team: "SAS", ovr: 93, conf: "W" }
    ],
    2009: [
      { team: "CLE", ovr: 96, conf: "E" }, { team: "ORL", ovr: 93, conf: "E" },
      { team: "LAL", ovr: 96, conf: "W" }, { team: "DEN", ovr: 92, conf: "W" }
    ],
    2010: [
      { team: "CLE", ovr: 95, conf: "E" }, { team: "ORL", ovr: 93, conf: "E" },
      { team: "LAL", ovr: 96, conf: "W" }, { team: "PHX", ovr: 92, conf: "W" }
    ],
    2011: [
      { team: "MIA", ovr: 95, conf: "E" }, { team: "CHI", ovr: 93, conf: "E" },
      { team: "DAL", ovr: 95, conf: "W" }, { team: "LAL", ovr: 94, conf: "W" },
      { team: "OKC", ovr: 92, conf: "W" }
    ]
  },

  events: [
    { year: 2007, text: "Kevin McHale and Danny Ainge still talk every week. Minnesota is listening on everything." },
    { year: 2007, text: "Seattle's new regime drafted a scoring savant from Texas. The veterans are suddenly expendable." },
    { year: 2008, text: "The Lakers just acquired Pau Gasol for spare parts. The arms race is officially on." },
    { year: 2009, text: "Cleveland is throwing everything at a title. The King's contract has an expiration date." },
    { year: 2010, text: "ESPN has a countdown clock for July 1st. Three franchises' futures hit free agency at once." }
  ]
};

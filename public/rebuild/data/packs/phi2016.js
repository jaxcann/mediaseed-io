export default {
  id: "phi2016",
  title: "Trust It",
  team: { id: "PHI", city: "Philadelphia", name: "76ers", colors: ["#006BB6", "#ED174C"], conf: "E" },
  startYear: 2016,
  par: 6,
  difficulty: "Legendary",
  realOutcome: "The Process never cashed in. Fultz went ahead of Tatum, Simmons stopped shooting, and Kawhi's shot bounced four times on the rim in 2019. No banner.",
  baselineWins: 10,
  intro:
    "July 2016. Sam Hinkie is gone, but his ledger remains: Ben Simmons just went No. 1 overall and may not play a minute this year, Joel Embiid hasn't debuted in two seasons, and you employ three young centers who cannot share a floor. Ten wins. Oceans of cap space. A drawer full of other teams' picks. The Process is over — now somebody has to finish it.",
  tips: "Not every No. 1 pick is created equal — the picks you got from Sacramento and Los Angeles matter less than the names you call with them.",

  cap: { 2016: 94.1, 2017: 99.1, 2018: 101.9, 2019: 109.1 },

  roster: [
    { name: "Ben Simmons", pos: "PG", age: 19, sal: 5.9, ovr: { 2016: 55, 2017: 83, 2018: 85, 2019: 86 } },
    { name: "Joel Embiid", pos: "C", age: 22, sal: 4.8, ovr: { 2016: 87, 2017: 90, 2018: 92, 2019: 93 } },
    { name: "Dario Šarić", pos: "PF", age: 22, sal: 2.3, ovr: { 2016: 75, 2017: 77, 2018: 73, 2019: 71 } },
    { name: "Jahlil Okafor", pos: "C", age: 20, sal: 4.8, ovr: { 2016: 70, 2017: 66, 2018: 64, 2019: 60 } },
    { name: "Nerlens Noel", pos: "C", age: 22, sal: 4.4, ovr: { 2016: 74, 2017: 72, 2018: 68, 2019: 68 } },
    { name: "Robert Covington", pos: "SF", age: 25, sal: 1.0, ovr: { 2016: 79, 2017: 81, 2018: 78, 2019: 75 } },
    { name: "T.J. McConnell", pos: "PG", age: 24, sal: 0.9, ovr: { 2016: 72, 2017: 74, 2018: 74, 2019: 73 } },
    { name: "Gerald Henderson", pos: "SG", age: 29, sal: 9.0, ovr: { 2016: 72, 2017: 68, 2018: 64, 2019: 60 } },
    { name: "Richaun Holmes", pos: "C", age: 22, sal: 1.0, ovr: { 2016: 68, 2017: 70, 2018: 72, 2019: 74 } },
    { name: "Hollis Thompson", pos: "SG", age: 25, sal: 1.0, ovr: { 2016: 68, 2017: 64, 2018: 60, 2019: 58 } }
  ],

  picks: [
    { year: 2017, slot: 3, via: "SAC/LAL maze" },
    { year: 2018, slot: 10, via: "LAL" }
  ],

  offers: [
    {
      id: "dal-noel", team: "DAL", year: 2016, until: 2016,
      label: "Dallas will take a center off your hands",
      give: ["Nerlens Noel"],
      get: {
        players: [
          { name: "Justin Anderson", pos: "SG", age: 23, sal: 1.5, ovr: { 2016: 68, 2017: 66, 2018: 64, 2019: 62 } }
        ],
        picks: [{ year: 2017, slot: 34, via: "DAL" }]
      }
    },
    {
      id: "bkn-okafor", team: "BKN", year: 2017, until: 2017,
      label: "Brooklyn rescues the other center",
      give: ["Jahlil Okafor"],
      get: {
        players: [
          { name: "Trevor Booker", pos: "PF", age: 29, sal: 9.1, ovr: { 2017: 70, 2018: 66, 2019: 62 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Jimmy Butler", team: "MIN", pos: "SG", age: 28, sal: 19.3,
      ovr: { 2016: 90, 2017: 89, 2018: 88, 2019: 87 },
      cost: 480, from: 2017, until: 2018,
      note: "The Minnesota experiment is souring, loudly and on camera." },
    { name: "Kawhi Leonard", team: "SAS", pos: "SF", age: 27, sal: 23.1,
      ovr: { 2016: 94, 2017: 70, 2018: 94, 2019: 95 },
      cost: 520, from: 2018, until: 2018,
      note: "Wants out of San Antonio. Played nine games last year. One-year rental risk." },
    { name: "Paul George", team: "IND", pos: "SF", age: 27, sal: 18.3,
      ovr: { 2016: 88, 2017: 89, 2018: 90, 2019: 89 },
      cost: 420, from: 2017, until: 2017,
      note: "Indiana heard 'one year until L.A.' and started taking calls." },
    { name: "Kyle Lowry", team: "TOR", pos: "PG", age: 30, sal: 12.0,
      ovr: { 2016: 87, 2017: 86, 2018: 84, 2019: 83 },
      cost: 300, from: 2016, until: 2017,
      note: "Toronto hits the same wall every May and wonders about the core." },
    { name: "DeMarcus Cousins", team: "SAC", pos: "C", age: 26, sal: 16.9,
      ovr: { 2016: 89, 2017: 88, 2018: 70, 2019: 68 },
      cost: 380, from: 2016, until: 2016,
      note: "Sacramento is finally ready to blow it up. Handle with care." },
    { name: "Tobias Harris", team: "LAC", pos: "PF", age: 26, sal: 14.8,
      ovr: { 2016: 78, 2017: 80, 2018: 83, 2019: 81 },
      cost: 250, from: 2018, until: 2018,
      note: "The Clippers are quietly retooling around the deadline." },
    { name: "Marc Gasol", team: "MEM", pos: "C", age: 33, sal: 24.1,
      ovr: { 2016: 85, 2017: 84, 2018: 82, 2019: 79 },
      cost: 150, from: 2018, until: 2018,
      note: "Grit-and-grind is ending. The brains are still elite." },
    { name: "Mike Conley", team: "MEM", pos: "PG", age: 31, sal: 30.5,
      ovr: { 2016: 85, 2017: 80, 2018: 83, 2019: 81 },
      cost: 200, from: 2018, until: 2019,
      note: "Memphis is listening. The contract is enormous." },
    { name: "Eric Bledsoe", team: "PHX", pos: "PG", age: 27, sal: 14.5,
      ovr: { 2016: 82, 2017: 80, 2018: 79, 2019: 76 },
      cost: 150, from: 2017, until: 2017,
      note: "'I don't wanna be here,' he tweeted. From a hair salon, he claims." }
  ],

  freeAgents: {
    2016: [
      { name: "Al Horford", pos: "C", age: 30, ask: 26.5, pull: 76,
        ovr: { 2016: 85, 2017: 84, 2018: 83, 2019: 81 },
        note: "The connective tissue every contender wants." },
      { name: "Dwyane Wade", pos: "SG", age: 34, ask: 23.0, pull: 78,
        ovr: { 2016: 80, 2017: 77, 2018: 75, 2019: 72 },
        note: "Feuding with Miami's front office over respect." },
      { name: "Dwight Howard", pos: "C", age: 30, ask: 23.5, pull: 55,
        ovr: { 2016: 80, 2017: 78, 2018: 76, 2019: 65 },
        note: "The name still opens doors. The fit closes them." },
      { name: "Jerryd Bayless", pos: "PG", age: 27, ask: 9.0, pull: 30,
        ovr: { 2016: 74, 2017: 55, 2018: 68, 2019: 60 },
        note: "A grown-up guard for a team that has none." },
      { name: "Joakim Noah", pos: "C", age: 31, ask: 18.0, pull: 45,
        ovr: { 2016: 70, 2017: 62, 2018: 64, 2019: 62 },
        note: "New York is about to pay for the memories." },
      { name: "Sergio Rodríguez", pos: "PG", age: 30, ask: 8.0, pull: 25,
        ovr: { 2016: 70, 2017: 60, 2018: 55, 2019: 55 },
        note: "El Chacho, back from Madrid to run an offense somewhere." },
      { name: "Kent Bazemore", pos: "SF", age: 27, ask: 17.5, pull: 40,
        ovr: { 2016: 75, 2017: 74, 2018: 74, 2019: 72 },
        note: "The cap spike is making everyone rich." }
    ],
    2017: [
      { name: "JJ Redick", pos: "SG", age: 33, ask: 23.0, pull: 50,
        ovr: { 2017: 80, 2018: 78, 2019: 75 },
        note: "One year, no strings. Shooting has never been paid better." },
      { name: "Kyle Lowry", pos: "PG", age: 31, ask: 31.0, pull: 75,
        ovr: { 2017: 86, 2018: 84, 2019: 83 },
        note: "Philly kid. Loves home, loves winning more." },
      { name: "Paul Millsap", pos: "PF", age: 32, ask: 30.0, pull: 66,
        ovr: { 2017: 83, 2018: 81, 2019: 79 },
        note: "Quietly one of the ten best forwards alive." },
      { name: "Danilo Gallinari", pos: "SF", age: 29, ask: 21.5, pull: 55,
        ovr: { 2017: 79, 2018: 74, 2019: 79 },
        note: "Buckets when upright. Emphasis on when." },
      { name: "Amir Johnson", pos: "C", age: 30, ask: 11.0, pull: 35,
        ovr: { 2017: 70, 2018: 66, 2019: 62 },
        note: "Professional screener, locker-room adult." },
      { name: "Patty Mills", pos: "PG", age: 28, ask: 12.5, pull: 48,
        ovr: { 2017: 76, 2018: 75, 2019: 74 },
        note: "Sprints for 48 minutes, smiles for 82 games." }
    ],
    2018: [
      { name: "LeBron James", pos: "SF", age: 33, ask: 35.7, pull: 90,
        ovr: { 2018: 95, 2019: 93 },
        note: "He took the Philadelphia meeting. He actually took the meeting." },
      { name: "Paul George", pos: "SF", age: 28, ask: 30.5, pull: 85,
        ovr: { 2018: 90, 2019: 89 },
        note: "Everyone assumes L.A. He seems awfully comfortable in Oklahoma." },
      { name: "JJ Redick", pos: "SG", age: 34, ask: 12.3, pull: 45,
        ovr: { 2018: 78, 2019: 75 },
        note: "Took the discount to run it back." },
      { name: "DeMarcus Cousins", pos: "C", age: 27, ask: 5.3, pull: 72,
        ovr: { 2018: 76, 2019: 70 },
        note: "Torn Achilles, mid-level price, superstar memory." },
      { name: "Trevor Ariza", pos: "SF", age: 33, ask: 15.0, pull: 50,
        ovr: { 2018: 74, 2019: 70 },
        note: "Phoenix is overpaying for adult supervision." },
      { name: "Nemanja Bjelica", pos: "PF", age: 30, ask: 4.4, pull: 30,
        ovr: { 2018: 73, 2019: 72 },
        note: "Shook hands on a deal in Philadelphia once, then flew home. Ask him about it." }
    ],
    2019: [
      { name: "Kawhi Leonard", pos: "SF", age: 28, ask: 32.7, pull: 88,
        ovr: { 2019: 96 },
        note: "Just walked a one-year rental to a parade. Taking exactly two calls." },
      { name: "Kemba Walker", pos: "PG", age: 29, ask: 32.7, pull: 70,
        ovr: { 2019: 85 },
        note: "Charlotte low-balled its franchise player." },
      { name: "Al Horford", pos: "C", age: 33, ask: 28.0, pull: 65,
        ovr: { 2019: 79 },
        note: "The rare center who guards Giannis and stretches the floor." },
      { name: "Tobias Harris", pos: "PF", age: 27, ask: 32.7, pull: 55,
        ovr: { 2019: 81 },
        note: "Max-adjacent money for very-good-adjacent play." },
      { name: "Danny Green", pos: "SG", age: 32, ask: 15.0, pull: 60,
        ovr: { 2019: 77 },
        note: "Fresh ring, still elite in the corners." },
      { name: "Malcolm Brogdon", pos: "PG", age: 26, ask: 21.2, pull: 55,
        ovr: { 2019: 80 },
        note: "50-40-90 and Milwaukee still won't match." }
    ]
  },

  draft: {
    2017: [
      { name: "Markelle Fultz", pos: "PG", realPick: 1, age: 19, ovr: { 2017: 55, 2018: 60, 2019: 64 }, note: "Washington — consensus No. 1, silky pull-up" },
      { name: "Lonzo Ball", pos: "PG", realPick: 2, age: 19, ovr: { 2017: 71, 2018: 72, 2019: 74 }, note: "UCLA — the father comes with the pick" },
      { name: "Jayson Tatum", pos: "SF", realPick: 3, age: 19, ovr: { 2017: 78, 2018: 82, 2019: 88 }, note: "Duke — footwork of a 10-year vet" },
      { name: "Josh Jackson", pos: "SF", realPick: 4, age: 20, ovr: { 2017: 66, 2018: 68, 2019: 66 }, note: "Kansas — defensive havoc, shaky shot" },
      { name: "De'Aaron Fox", pos: "PG", realPick: 5, age: 19, ovr: { 2017: 71, 2018: 78, 2019: 82 }, note: "Kentucky — fastest player in the class" },
      { name: "Jonathan Isaac", pos: "PF", realPick: 6, age: 19, ovr: { 2017: 64, 2018: 70, 2019: 72 }, note: "Florida State — pterodactyl defense" },
      { name: "Lauri Markkanen", pos: "PF", realPick: 7, age: 20, ovr: { 2017: 72, 2018: 74, 2019: 72 }, note: "Arizona — seven feet of shooting" },
      { name: "Donovan Mitchell", pos: "SG", realPick: 13, age: 20, ovr: { 2017: 80, 2018: 83, 2019: 85 }, note: "Louisville — combine legend, 6'10\" wingspan" },
      { name: "Bam Adebayo", pos: "C", realPick: 14, age: 19, ovr: { 2017: 70, 2018: 74, 2019: 82 }, note: "Kentucky — switchable and mean" },
      { name: "John Collins", pos: "PF", realPick: 19, age: 19, ovr: { 2017: 72, 2018: 78, 2019: 80 }, note: "Wake Forest — pogo-stick production" },
      { name: "Jarrett Allen", pos: "C", realPick: 22, age: 19, ovr: { 2017: 68, 2018: 72, 2019: 75 }, note: "Texas — the fro blocks shots too" },
      { name: "OG Anunoby", pos: "SF", realPick: 23, age: 19, ovr: { 2017: 70, 2018: 70, 2019: 76 }, note: "Indiana — ACL rehab, All-Defense tools" },
      { name: "Kyle Kuzma", pos: "PF", realPick: 27, age: 21, ovr: { 2017: 76, 2018: 75, 2019: 73 }, note: "Utah — instant offense, older prospect" },
      { name: "Derrick White", pos: "PG", realPick: 29, age: 23, ovr: { 2017: 62, 2018: 72, 2019: 74 }, note: "Colorado — Division II to round one" },
      { name: "Dillon Brooks", pos: "SF", realPick: 45, age: 21, ovr: { 2017: 70, 2018: 66, 2019: 72 }, note: "Oregon — plays every game like a grudge" }
    ],
    2018: [
      { name: "Deandre Ayton", pos: "C", realPick: 1, age: 19, ovr: { 2018: 76, 2019: 78 }, note: "Arizona — chiseled like a No. 1 pick" },
      { name: "Marvin Bagley III", pos: "PF", realPick: 2, age: 19, ovr: { 2018: 74, 2019: 72 }, note: "Duke — production machine, fit questions" },
      { name: "Luka Dončić", pos: "PG", realPick: 3, age: 19, ovr: { 2018: 82, 2019: 90 }, note: "Slovenia — EuroLeague MVP at 19. Some scouts still doubt the athleticism" },
      { name: "Jaren Jackson Jr.", pos: "PF", realPick: 4, age: 18, ovr: { 2018: 73, 2019: 78 }, note: "Michigan State — blocks threes, shoots them too" },
      { name: "Trae Young", pos: "PG", realPick: 5, age: 19, ovr: { 2018: 76, 2019: 84 }, note: "Oklahoma — logo range, cape-sized expectations" },
      { name: "Wendell Carter Jr.", pos: "C", realPick: 7, age: 19, ovr: { 2018: 71, 2019: 72 }, note: "Duke — old soul big man" },
      { name: "Mikal Bridges", pos: "SF", realPick: 10, age: 21, ovr: { 2018: 70, 2019: 74 }, note: "Villanova — two rings, born 3-and-D, mom works for the Sixers" },
      { name: "Shai Gilgeous-Alexander", pos: "PG", realPick: 11, age: 19, ovr: { 2018: 74, 2019: 80 }, note: "Kentucky — long, smooth, keeps rising on boards" },
      { name: "Michael Porter Jr.", pos: "SF", realPick: 14, age: 19, ovr: { 2018: 55, 2019: 70 }, note: "Missouri — top-of-class talent, back surgery x2" },
      { name: "Kevin Huerter", pos: "SG", realPick: 19, age: 19, ovr: { 2018: 70, 2019: 72 }, note: "Maryland — Red Velvet shooting" },
      { name: "Jalen Brunson", pos: "PG", realPick: 33, age: 21, ovr: { 2018: 70, 2019: 72 }, note: "Villanova — two-time champion, 'no upside,' they say" },
      { name: "Mitchell Robinson", pos: "C", realPick: 36, age: 20, ovr: { 2018: 72, 2019: 75 }, note: "No college, no film, absurd bounce" },
      { name: "Bruce Brown", pos: "SG", realPick: 42, age: 21, ovr: { 2018: 66, 2019: 68 }, note: "Miami — does whatever the game needs" }
    ],
    2019: [
      { name: "Zion Williamson", pos: "PF", realPick: 1, age: 19, ovr: { 2019: 84 }, note: "Duke — a physical event, not a prospect" },
      { name: "Ja Morant", pos: "PG", realPick: 2, age: 19, ovr: { 2019: 80 }, note: "Murray State — lob-throwing, lob-finishing" },
      { name: "RJ Barrett", pos: "SG", realPick: 3, age: 19, ovr: { 2019: 72 }, note: "Duke — the other Duke guy, volume everything" },
      { name: "De'Andre Hunter", pos: "SF", realPick: 4, age: 21, ovr: { 2019: 70 }, note: "Virginia — title-game hero, grown-up defense" },
      { name: "Darius Garland", pos: "PG", realPick: 5, age: 19, ovr: { 2019: 70 }, note: "Vanderbilt — five college games, pure handle" },
      { name: "Coby White", pos: "PG", realPick: 7, age: 19, ovr: { 2019: 70 }, note: "North Carolina — sprints into threes" },
      { name: "PJ Washington", pos: "PF", realPick: 12, age: 20, ovr: { 2019: 71 }, note: "Kentucky — sturdy, modern four" },
      { name: "Tyler Herro", pos: "SG", realPick: 13, age: 19, ovr: { 2019: 74 }, note: "Kentucky — bucket confidence, boy-band face" },
      { name: "Brandon Clarke", pos: "PF", realPick: 21, age: 22, ovr: { 2019: 74 }, note: "Gonzaga — analytics darling, age discount" },
      { name: "Keldon Johnson", pos: "SF", realPick: 29, age: 19, ovr: { 2019: 66 }, note: "Kentucky — downhill and grinning" },
      { name: "Nic Claxton", pos: "C", realPick: 31, age: 20, ovr: { 2019: 66 }, note: "Georgia — switchy big hiding in round two" },
      { name: "Terance Mann", pos: "SG", realPick: 48, age: 22, ovr: { 2019: 64 }, note: "Florida State — plays bigger than the slot" }
    ]
  },

  gauntlet: {
    2017: [
      { team: "CLE", ovr: 96, conf: "E" }, { team: "BOS", ovr: 92, conf: "E" },
      { team: "GSW", ovr: 99, conf: "W" }, { team: "SAS", ovr: 94, conf: "W" }
    ],
    2018: [
      { team: "CLE", ovr: 93, conf: "E" }, { team: "BOS", ovr: 92, conf: "E" },
      { team: "TOR", ovr: 93, conf: "E" }, { team: "GSW", ovr: 98, conf: "W" },
      { team: "HOU", ovr: 96, conf: "W" }
    ],
    2019: [
      { team: "MIL", ovr: 95, conf: "E" }, { team: "TOR", ovr: 95, conf: "E" },
      { team: "GSW", ovr: 96, conf: "W" }, { team: "DEN", ovr: 92, conf: "W" }
    ],
    2020: [
      { team: "MIL", ovr: 96, conf: "E" }, { team: "TOR", ovr: 93, conf: "E" },
      { team: "LAL", ovr: 96, conf: "W" }, { team: "LAC", ovr: 95, conf: "W" }
    ]
  },

  events: [
    { year: 2016, text: "Ben Simmons fractured his foot in the final scrimmage of training camp. No timetable." },
    { year: 2016, text: "You have more cap space than anyone and fewer reasons for stars to use it. For now." },
    { year: 2017, text: "Markelle Fultz's shooting motion looks... different in workouts. The team says he's fine." },
    { year: 2017, text: "A curious cluster of anonymous Twitter accounts keeps defending the front office." },
    { year: 2018, text: "LeBron James took the Philadelphia meeting. The whole city heard about it in an hour." },
    { year: 2018, text: "Minnesota's Jimmy Butler situation is turning into a daytime drama." },
    { year: 2019, text: "Kawhi just proved a one-year rental can end in a parade. Every contender took notes." }
  ]
};

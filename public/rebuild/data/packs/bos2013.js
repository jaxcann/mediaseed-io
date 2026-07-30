export default {
  id: "bos2013",
  title: "The Banner Rebuild",
  team: { id: "BOS", city: "Boston", name: "Celtics", colors: ["#007A33", "#BA9653"], conf: "E" },
  startYear: 2013,
  par: 5,
  difficulty: "Hard",
  realOutcome: "Ainge took the Brooklyn deal. The picks became Jaylen Brown and Jayson Tatum, Isaiah Thomas arrived for pocket change and averaged 29, but the banner didn't come until 2024 — long after this window closed.",
  baselineWins: 41,
  intro:
    "July 2013. Doc Rivers just left for Los Angeles. Paul Pierce is 35, Kevin Garnett is 37, and Rajon Rondo is rehabbing a torn ACL. Danny Ainge's phone is ringing — Brooklyn wants to go all-in. You have four seasons to hang banner 18.",
  tips: "The best asset in this scenario might be a phone call from Brooklyn. And keep an eye on Phoenix's backup point guard.",

  cap: { 2013: 58.7, 2014: 63.1, 2015: 70.0, 2016: 94.1 },

  roster: [
    { name: "Rajon Rondo", pos: "PG", age: 27, sal: 12.0, ovr: { 2013: 80, 2014: 83, 2015: 79, 2016: 75 } },
    { name: "Paul Pierce", pos: "SF", age: 35, sal: 15.3, ovr: { 2013: 83, 2014: 81, 2015: 78, 2016: 75 } },
    { name: "Kevin Garnett", pos: "C", age: 37, sal: 12.4, ovr: { 2013: 81, 2014: 78, 2015: 74, 2016: 70 } },
    { name: "Jeff Green", pos: "SF", age: 26, sal: 8.7, ovr: { 2013: 79, 2014: 79, 2015: 78, 2016: 76 } },
    { name: "Avery Bradley", pos: "SG", age: 22, sal: 2.5, ovr: { 2013: 76, 2014: 78, 2015: 79, 2016: 80 } },
    { name: "Jared Sullinger", pos: "PF", age: 21, sal: 1.4, ovr: { 2013: 75, 2014: 77, 2015: 77, 2016: 75 } },
    { name: "Brandon Bass", pos: "PF", age: 28, sal: 6.5, ovr: { 2013: 76, 2014: 76, 2015: 75, 2016: 73 } },
    { name: "Courtney Lee", pos: "SG", age: 27, sal: 5.2, ovr: { 2013: 74, 2014: 74, 2015: 73, 2016: 72 } },
    { name: "Kelly Olynyk", pos: "C", age: 22, sal: 2.2, ovr: { 2013: 72, 2014: 74, 2015: 75, 2016: 76 } },
    { name: "Jordan Crawford", pos: "SG", age: 24, sal: 2.2, ovr: { 2013: 72, 2014: 70, 2015: 68, 2016: 66 } }
  ],

  picks: [],

  offers: [
    {
      id: "bkn-heist", team: "BKN", year: 2013, until: 2013,
      label: "Brooklyn goes all-in",
      give: ["Paul Pierce", "Kevin Garnett"],
      get: {
        players: [
          { name: "Kris Humphries", pos: "PF", age: 28, sal: 12.0, ovr: { 2013: 73, 2014: 71, 2015: 68, 2016: 65 } },
          { name: "MarShon Brooks", pos: "SG", age: 24, sal: 1.2, ovr: { 2013: 68, 2014: 66, 2015: 64, 2016: 62 } }
        ],
        picks: [
          { year: 2014, slot: 17, via: "BKN" },
          { year: 2016, slot: 3, via: "BKN" }
        ]
      }
    },
    {
      id: "dal-rondo", team: "DAL", year: 2014, until: 2014,
      label: "Dallas wants a floor general",
      give: ["Rajon Rondo"],
      get: {
        players: [
          { name: "Jae Crowder", pos: "SF", age: 24, sal: 0.9, ovr: { 2014: 74, 2015: 79, 2016: 80 } },
          { name: "Brandan Wright", pos: "C", age: 27, sal: 5.0, ovr: { 2014: 75, 2015: 73, 2016: 71 } }
        ],
        picks: [{ year: 2015, slot: 21, via: "DAL" }]
      }
    },
    {
      id: "mem-green", team: "MEM", year: 2014, until: 2015,
      label: "Memphis calls about Jeff Green",
      give: ["Jeff Green"],
      get: {
        players: [
          { name: "Tayshaun Prince", pos: "SF", age: 34, sal: 7.7, ovr: { 2014: 68, 2015: 66, 2016: 64 } }
        ],
        picks: [{ year: 2016, slot: 22, via: "MEM" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Kevin Love", team: "MIN", pos: "PF", age: 24, sal: 15.7,
      ovr: { 2013: 89, 2014: 87, 2015: 86, 2016: 85 },
      cost: 470, from: 2013, until: 2014, direction: "rebuilding",
      note: "Wants out of Minnesota. The Wolves want a young core back." },
    { name: "DeMarcus Cousins", team: "SAC", pos: "C", age: 22, sal: 14.7,
      ovr: { 2013: 86, 2014: 88, 2015: 89, 2016: 89 },
      cost: 420, from: 2013, until: 2016, direction: "rebuilding",
      note: "Enormous talent, combustible fit. Sacramento always listens." },
    { name: "Isaiah Thomas", team: "PHX", pos: "PG", age: 25, sal: 6.9,
      ovr: { 2014: 82, 2015: 85, 2016: 90 },
      cost: 60, from: 2014, until: 2014, direction: "retooling",
      note: "Buried in a three-guard logjam in Phoenix. Available for scraps." },
    { name: "Goran Dragić", team: "PHX", pos: "PG", age: 28, sal: 7.5,
      ovr: { 2014: 85, 2015: 82, 2016: 81 },
      cost: 180, from: 2014, until: 2015, direction: "retooling",
      note: "Third Team All-NBA, unhappy with the timeshare." },
    { name: "Jimmy Butler", team: "CHI", pos: "SG", age: 26, sal: 17.5,
      ovr: { 2015: 88, 2016: 90 },
      cost: 480, from: 2015, until: 2016, direction: "retooling",
      note: "The Bulls' front office is split on paying him." },
    { name: "Serge Ibaka", team: "OKC", pos: "PF", age: 26, sal: 12.3,
      ovr: { 2015: 81, 2016: 79 },
      cost: 200, from: 2016, until: 2016, direction: "retooling",
      note: "OKC is shaking things up after the KD decision." },
    { name: "Jeff Teague", team: "ATL", pos: "PG", age: 27, sal: 8.0,
      ovr: { 2014: 82, 2015: 81, 2016: 80 },
      cost: 160, from: 2015, until: 2016, direction: "retooling",
      note: "Atlanta likes Schröder. A starter-grade point guard for a fair price." },
    { name: "Thaddeus Young", team: "PHI", pos: "PF", age: 25, sal: 9.2,
      ovr: { 2013: 79, 2014: 78, 2015: 77, 2016: 77 },
      cost: 130, from: 2013, until: 2014, direction: "rebuilding",
      note: "Philadelphia is tearing it down to the studs." },
    { name: "Omer Aşık", team: "HOU", pos: "C", age: 27, sal: 8.4,
      ovr: { 2013: 76, 2014: 74, 2015: 72, 2016: 70 },
      cost: 70, from: 2013, until: 2013, direction: "rebuilding",
      note: "Houston needs to clear the middle for a bigger fish." },
    { name: "Markieff Morris", team: "PHX", pos: "PF", age: 26, sal: 8.0,
      ovr: { 2015: 77, 2016: 76 },
      cost: 60, from: 2015, until: 2016, direction: "retooling",
      note: "Wants out after his twin got traded." },
    { name: "George Hill", team: "IND", pos: "PG", age: 29, sal: 8.0,
      ovr: { 2015: 80, 2016: 81 },
      cost: 120, from: 2015, until: 2016, direction: "rebuilding",
      note: "Indiana is getting younger at the point." },
    { name: "Carmelo Anthony", team: "NYK", pos: "SF", age: 32, sal: 24.6,
      ovr: { 2016: 82 },
      cost: 260, from: 2016, until: 2016, direction: "rebuilding",
      note: "The Garden marriage is over. The name is bigger than the game now." }
  ],

  freeAgents: {
    2013: [
      { name: "Andre Iguodala", pos: "SF", age: 29, ask: 12.0, pull: 74,
        ovr: { 2013: 83, 2014: 82, 2015: 82, 2016: 81 }, note: "Wants a ready-made contender." },
      { name: "Dwight Howard", pos: "C", age: 27, ask: 20.5, pull: 82,
        ovr: { 2013: 87, 2014: 86, 2015: 84, 2016: 82 }, note: "The biggest name on the market, with baggage." },
      { name: "Al Jefferson", pos: "C", age: 28, ask: 13.5, pull: 55,
        ovr: { 2013: 83, 2014: 82, 2015: 79, 2016: 75 }, note: "Old-school low-post scoring, minus defense." },
      { name: "Josh Smith", pos: "PF", age: 27, ask: 13.5, pull: 52,
        ovr: { 2013: 80, 2014: 76, 2015: 73, 2016: 68 }, note: "Athletic marvel who loves the long two." },
      { name: "David West", pos: "PF", age: 32, ask: 12.0, pull: 68,
        ovr: { 2013: 81, 2014: 80, 2015: 77, 2016: 74 }, note: "Tone-setter. Only leaves for a real winner." },
      { name: "Monta Ellis", pos: "SG", age: 27, ask: 10.0, pull: 45,
        ovr: { 2013: 80, 2014: 80, 2015: 77, 2016: 73 }, note: "Buckets, on his terms." },
      { name: "Kevin Martin", pos: "SG", age: 30, ask: 7.0, pull: 42,
        ovr: { 2013: 78, 2014: 76, 2015: 73, 2016: 70 }, note: "Shooting for hire." },
      { name: "Chase Budinger", pos: "SF", age: 25, ask: 5.0, pull: 30,
        ovr: { 2013: 71, 2014: 69, 2015: 67, 2016: 65 }, note: "Bounce and corner threes." }
    ],
    2014: [
      { name: "LeBron James", pos: "SF", age: 29, ask: 20.7, pull: 96,
        ovr: { 2014: 97, 2015: 96, 2016: 97 }, note: "He's going home. Everyone knows he's going home." },
      { name: "Carmelo Anthony", pos: "SF", age: 30, ask: 22.5, pull: 84,
        ovr: { 2014: 88, 2015: 86, 2016: 82 }, note: "Taking meetings. Loves the max more than the fit." },
      { name: "Chris Bosh", pos: "C", age: 30, ask: 20.6, pull: 86,
        ovr: { 2014: 87, 2015: 86, 2016: 84 }, note: "Miami is moving heaven and earth to keep him." },
      { name: "Kyle Lowry", pos: "PG", age: 28, ask: 12.0, pull: 70,
        ovr: { 2014: 85, 2015: 86, 2016: 87 }, note: "Toronto's engine, finally getting respect." },
      { name: "Pau Gasol", pos: "C", age: 34, ask: 7.1, pull: 62,
        ovr: { 2014: 82, 2015: 81, 2016: 78 }, note: "Still elegant, wants meaningful basketball." },
      { name: "Lance Stephenson", pos: "SG", age: 23, ask: 9.0, pull: 55,
        ovr: { 2014: 79, 2015: 74, 2016: 71 }, note: "Born ready. Possibly too ready." },
      { name: "Isaiah Thomas", pos: "PG", age: 25, ask: 7.2, pull: 40,
        ovr: { 2014: 82, 2015: 85, 2016: 90 }, note: "5'9\" and scoring 20 a night, yet nobody's calling." },
      { name: "Trevor Ariza", pos: "SF", age: 29, ask: 8.0, pull: 58,
        ovr: { 2014: 79, 2015: 78, 2016: 77 }, note: "3-and-D as it was meant to be." },
      { name: "Channing Frye", pos: "C", age: 31, ask: 8.0, pull: 44,
        ovr: { 2014: 75, 2015: 73, 2016: 72 }, note: "A center who spaces the floor." }
    ],
    2015: [
      { name: "LaMarcus Aldridge", pos: "PF", age: 30, ask: 19.7, pull: 80,
        ovr: { 2015: 87, 2016: 85 }, note: "Leaving Portland. Wants a contender with structure." },
      { name: "Paul Millsap", pos: "PF", age: 30, ask: 18.6, pull: 66,
        ovr: { 2015: 85, 2016: 84 }, note: "Quietly one of the ten best forwards alive." },
      { name: "DeAndre Jordan", pos: "C", age: 26, ask: 19.7, pull: 72,
        ovr: { 2015: 83, 2016: 82 }, note: "Lob City's anchor. Famously persuadable — twice." },
      { name: "Greg Monroe", pos: "C", age: 25, ask: 16.0, pull: 55,
        ovr: { 2015: 80, 2016: 77 }, note: "Skilled hands, ground-bound defense." },
      { name: "Danny Green", pos: "SG", age: 28, ask: 10.0, pull: 64,
        ovr: { 2015: 79, 2016: 78 }, note: "Finals-record shooting, elite wing defense." },
      { name: "Wesley Matthews", pos: "SG", age: 28, ask: 14.0, pull: 58,
        ovr: { 2015: 77, 2016: 76 }, note: "Coming off an Achilles tear. Buyer beware." },
      { name: "Brandan Wright", pos: "C", age: 27, ask: 5.7, pull: 38,
        ovr: { 2015: 73, 2016: 71 }, note: "Efficient rim-running big off the bench." }
    ],
    2016: [
      { name: "Kevin Durant", pos: "SF", age: 27, ask: 26.5, pull: 92,
        ovr: { 2016: 96 }, note: "The Hamptons meetings are real. He wants to win NOW." },
      { name: "Al Horford", pos: "C", age: 30, ask: 26.5, pull: 76,
        ovr: { 2016: 85 }, note: "The connective tissue every contender wants." },
      { name: "Mike Conley", pos: "PG", age: 28, ask: 26.5, pull: 72,
        ovr: { 2016: 85 }, note: "The largest contract in NBA history is on the table." },
      { name: "Dwyane Wade", pos: "SG", age: 34, ask: 23.0, pull: 78,
        ovr: { 2016: 80 }, note: "Feuding with Miami's front office over respect." },
      { name: "Hassan Whiteside", pos: "C", age: 27, ask: 22.0, pull: 58,
        ovr: { 2016: 83 }, note: "Blocks, boards, and a max-sized ask." },
      { name: "Nicolas Batum", pos: "SF", age: 27, ask: 22.5, pull: 60,
        ovr: { 2016: 80 }, note: "Does a bit of everything, priced like he does it all." },
      { name: "Evan Fournier", pos: "SG", age: 23, ask: 17.0, pull: 48,
        ovr: { 2016: 78 }, note: "The cap spike is making everyone rich." },
      { name: "Zaza Pachulia", pos: "C", age: 32, ask: 2.9, pull: 50,
        ovr: { 2016: 74 }, note: "Screens, charges, and championship timing." }
    ]
  },

  draft: {
    2014: [
      { name: "Andrew Wiggins", pos: "SF", realPick: 1, age: 19, ovr: { 2014: 75, 2015: 78, 2016: 79 }, note: "Kansas — the anointed one" },
      { name: "Jabari Parker", pos: "PF", realPick: 2, age: 19, ovr: { 2014: 74, 2015: 71, 2016: 78 }, note: "Duke — polished scorer" },
      { name: "Joel Embiid", pos: "C", realPick: 3, age: 20, ovr: { 2014: 55, 2015: 55, 2016: 87 }, note: "Kansas — navicular fracture concerns" },
      { name: "Aaron Gordon", pos: "PF", realPick: 4, age: 18, ovr: { 2014: 70, 2015: 73, 2016: 76 }, note: "Arizona — pogo-stick athlete" },
      { name: "Dante Exum", pos: "PG", realPick: 5, age: 18, ovr: { 2014: 68, 2015: 55, 2016: 66 }, note: "Australia — mystery box" },
      { name: "Marcus Smart", pos: "PG", realPick: 6, age: 20, ovr: { 2014: 73, 2015: 75, 2016: 77 }, note: "Oklahoma State — competitive maniac" },
      { name: "Julius Randle", pos: "PF", realPick: 7, age: 19, ovr: { 2014: 58, 2015: 76, 2016: 78 }, note: "Kentucky — bully-ball forward" },
      { name: "Elfrid Payton", pos: "PG", realPick: 10, age: 20, ovr: { 2014: 72, 2015: 73, 2016: 74 }, note: "Louisiana — the hair arrives first" },
      { name: "Zach LaVine", pos: "SG", realPick: 13, age: 19, ovr: { 2014: 69, 2015: 74, 2016: 78 }, note: "UCLA — trampolines for legs" },
      { name: "Jusuf Nurkić", pos: "C", realPick: 16, age: 19, ovr: { 2014: 72, 2015: 73, 2016: 76 }, note: "Bosnia — bruising big" },
      { name: "Gary Harris", pos: "SG", realPick: 19, age: 19, ovr: { 2014: 65, 2015: 73, 2016: 77 }, note: "Michigan State — two-way guard" },
      { name: "Rodney Hood", pos: "SG", realPick: 23, age: 21, ovr: { 2014: 70, 2015: 76, 2016: 75 }, note: "Duke — smooth lefty" },
      { name: "Clint Capela", pos: "C", realPick: 25, age: 20, ovr: { 2014: 62, 2015: 72, 2016: 78 }, note: "Switzerland — raw vertical spacer" },
      { name: "Nikola Jokić", pos: "C", realPick: 41, age: 19, ovr: { 2014: 70, 2015: 79, 2016: 85 }, note: "Serbia — announced during a Taco Bell ad" },
      { name: "Spencer Dinwiddie", pos: "PG", realPick: 38, age: 21, ovr: { 2014: 62, 2015: 65, 2016: 72 }, note: "Colorado — coming off an ACL tear" }
    ],
    2015: [
      { name: "Karl-Anthony Towns", pos: "C", realPick: 1, age: 19, ovr: { 2015: 81, 2016: 85 }, note: "Kentucky — franchise big" },
      { name: "D'Angelo Russell", pos: "PG", realPick: 2, age: 19, ovr: { 2015: 73, 2016: 76 }, note: "Ohio State — ice in his veins, allegedly" },
      { name: "Jahlil Okafor", pos: "C", realPick: 3, age: 19, ovr: { 2015: 73, 2016: 70 }, note: "Duke — throwback post game" },
      { name: "Kristaps Porziņģis", pos: "C", realPick: 4, age: 19, ovr: { 2015: 77, 2016: 81 }, note: "Latvia — they're booing the pick in Brooklyn" },
      { name: "Mario Hezonja", pos: "SF", realPick: 5, age: 20, ovr: { 2015: 66, 2016: 65 }, note: "Croatia — swagger merchant" },
      { name: "Emmanuel Mudiay", pos: "PG", realPick: 7, age: 19, ovr: { 2015: 68, 2016: 68 }, note: "Congo via China — physical tools" },
      { name: "Justise Winslow", pos: "SF", realPick: 10, age: 19, ovr: { 2015: 72, 2016: 71 }, note: "Duke — playoff-ready defense" },
      { name: "Myles Turner", pos: "C", realPick: 11, age: 19, ovr: { 2015: 72, 2016: 78 }, note: "Texas — stretch-five prototype" },
      { name: "Devin Booker", pos: "SG", realPick: 13, age: 18, ovr: { 2015: 72, 2016: 79 }, note: "Kentucky — the bench guy who can really shoot" },
      { name: "Terry Rozier", pos: "PG", realPick: 16, age: 21, ovr: { 2015: 64, 2016: 68 }, note: "Louisville — pitbull guard" },
      { name: "Bobby Portis", pos: "PF", realPick: 22, age: 20, ovr: { 2015: 68, 2016: 71 }, note: "Arkansas — plays angry" },
      { name: "Larry Nance Jr.", pos: "PF", realPick: 27, age: 22, ovr: { 2015: 68, 2016: 72 }, note: "Wyoming — bloodline bounce" },
      { name: "Montrezl Harrell", pos: "C", realPick: 32, age: 21, ovr: { 2015: 66, 2016: 71 }, note: "Louisville — plays furious" },
      { name: "Josh Richardson", pos: "SG", realPick: 40, age: 21, ovr: { 2015: 68, 2016: 74 }, note: "Tennessee — sneaky two-way steal" },
      { name: "Norman Powell", pos: "SG", realPick: 46, age: 22, ovr: { 2015: 66, 2016: 71 }, note: "UCLA — downhill force" }
    ],
    2016: [
      { name: "Ben Simmons", pos: "PF", realPick: 1, age: 19, ovr: { 2016: 55 }, note: "LSU — generational passer, foot in a boot" },
      { name: "Brandon Ingram", pos: "SF", realPick: 2, age: 18, ovr: { 2016: 70 }, note: "Duke — wiry scoring wing" },
      { name: "Jaylen Brown", pos: "SF", realPick: 3, age: 19, ovr: { 2016: 71 }, note: "Cal — chess player with a 40-inch vertical" },
      { name: "Dragan Bender", pos: "PF", realPick: 4, age: 18, ovr: { 2016: 62 }, note: "Croatia — the next big thing, they say" },
      { name: "Kris Dunn", pos: "PG", realPick: 5, age: 22, ovr: { 2016: 66 }, note: "Providence — ready-now defender" },
      { name: "Buddy Hield", pos: "SG", realPick: 6, age: 23, ovr: { 2016: 70 }, note: "Oklahoma — shooting, full stop" },
      { name: "Jamal Murray", pos: "PG", realPick: 7, age: 19, ovr: { 2016: 71 }, note: "Kentucky — blue arrow" },
      { name: "Domantas Sabonis", pos: "PF", realPick: 11, age: 20, ovr: { 2016: 70 }, note: "Gonzaga — the name rings a bell" },
      { name: "Caris LeVert", pos: "SG", realPick: 20, age: 21, ovr: { 2016: 68 }, note: "Michigan — injury lottery ticket" },
      { name: "Pascal Siakam", pos: "PF", realPick: 27, age: 22, ovr: { 2016: 65 }, note: "New Mexico State — motor that never idles" },
      { name: "Dejounte Murray", pos: "PG", realPick: 29, age: 19, ovr: { 2016: 64 }, note: "Washington — long, raw, fearless" },
      { name: "Malcolm Brogdon", pos: "PG", realPick: 36, age: 23, ovr: { 2016: 74 }, note: "Virginia — the President" }
    ]
  },

  gauntlet: {
    2014: [
      { team: "MIA", ovr: 95, conf: "E" }, { team: "IND", ovr: 92, conf: "E" },
      { team: "SAS", ovr: 97, conf: "W" }, { team: "OKC", ovr: 94, conf: "W" }
    ],
    2015: [
      { team: "CLE", ovr: 94, conf: "E" }, { team: "ATL", ovr: 91, conf: "E" },
      { team: "GSW", ovr: 96, conf: "W" }, { team: "SAS", ovr: 93, conf: "W" }
    ],
    2016: [
      { team: "CLE", ovr: 96, conf: "E" }, { team: "TOR", ovr: 91, conf: "E" },
      { team: "GSW", ovr: 98, conf: "W" }, { team: "SAS", ovr: 95, conf: "W" }
    ],
    2017: [
      { team: "CLE", ovr: 96, conf: "E", unless: { name: "LeBron James", then: 88 } }, { team: "TOR", ovr: 91, conf: "E" },
      { team: "GSW", ovr: 99, conf: "W", unless: { name: "Kevin Durant", then: 94 } }, { team: "SAS", ovr: 94, conf: "W" }
    ]
  },

  events: [
    { year: 2013, text: "Brooklyn is mortgaging its future for one last ride with veterans." },
    { year: 2013, text: "League memo: TV money could spike the salary cap toward $94M by 2016." },
    { year: 2014, text: "Phoenix drafted two more guards. Somebody in that backcourt has to go." },
    { year: 2014, text: "LeBron James is coming home to Cleveland. The East just got harder." },
    { year: 2015, text: "Golden State just won 67 games playing a brand of basketball nobody can copy." },
    { year: 2016, text: "The cap explodes to $94M. Every team in the league has money to burn." },
    { year: 2016, text: "Durant's camp is scheduling meetings in the Hamptons." }
  ]
};

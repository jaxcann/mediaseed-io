export default {
  id: "gsw2014",
  title: "Light Years",
  team: { id: "GSW", city: "Golden State", name: "Warriors", colors: ["#1D428A", "#FFC72C"], conf: "W" },
  startYear: 2014,
  par: 2,
  difficulty: "Easy",
  realOutcome: "The Warriors did almost nothing — hired Kerr, refused to trade Klay for Love, won 67 and the 2015 title. Then they turned 73 wins into a Hamptons pitch and Durant said yes. Two more banners.",
  baselineWins: 51,
  intro:
    "July 2014. You just fired a coach who won 51 games and handed the clipboard to a rookie head coach named Steve Kerr. Minnesota is dangling Kevin Love and wants Klay Thompson back — half your front office says do it. Stephen Curry's contract is the best bargain in professional sports. Try not to break anything.",
  tips: "The best trade in franchise history might be the one you refuse to make — and the cleanest cap sheet is the one that's empty the summer the TV money lands.",

  cap: { 2014: 63.1, 2015: 70.0, 2016: 94.1, 2017: 99.1 },

  roster: [
    { name: "Stephen Curry", pos: "PG", age: 26, sal: 10.6, ovr: { 2014: 95, 2015: 98, 2016: 96, 2017: 95 } },
    { name: "Klay Thompson", pos: "SG", age: 24, sal: 3.1, ovr: { 2014: 86, 2015: 88, 2016: 88, 2017: 87 } },
    { name: "Draymond Green", pos: "PF", age: 24, sal: 0.9, ovr: { 2014: 84, 2015: 89, 2016: 90, 2017: 88 } },
    { name: "Andre Iguodala", pos: "SF", age: 30, sal: 12.3, ovr: { 2014: 82, 2015: 82, 2016: 81, 2017: 80 } },
    { name: "Andrew Bogut", pos: "C", age: 29, sal: 13.0, ovr: { 2014: 80, 2015: 79, 2016: 77, 2017: 74 } },
    { name: "Harrison Barnes", pos: "SF", age: 22, sal: 3.0, ovr: { 2014: 76, 2015: 78, 2016: 77, 2017: 77 } },
    { name: "David Lee", pos: "PF", age: 31, sal: 15.0, ovr: { 2014: 79, 2015: 74, 2016: 72, 2017: 70 } },
    { name: "Shaun Livingston", pos: "PG", age: 28, sal: 5.3, ovr: { 2014: 75, 2015: 75, 2016: 74, 2017: 73 } },
    { name: "Festus Ezeli", pos: "C", age: 24, sal: 1.1, ovr: { 2014: 70, 2015: 72, 2016: 55, 2017: 55 } },
    { name: "Marreese Speights", pos: "C", age: 27, sal: 3.7, ovr: { 2014: 72, 2015: 74, 2016: 73, 2017: 72 } }
  ],

  picks: [],

  offers: [
    {
      id: "bos-lee", team: "BOS", year: 2015, until: 2015,
      label: "Boston will absorb David Lee's contract",
      give: ["David Lee"],
      get: {
        players: [
          { name: "Gerald Wallace", pos: "SF", age: 32, sal: 10.1, ovr: { 2015: 64, 2016: 60, 2017: 55 } }
        ],
        picks: []
      }
    },
    {
      id: "dal-bogut", team: "DAL", year: 2016, until: 2016,
      label: "Dallas will take Bogut and clear the runway",
      give: ["Andrew Bogut"],
      get: {
        players: [],
        picks: [{ year: 2017, slot: 40, via: "DAL" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Kevin Love", team: "MIN", pos: "PF", age: 25, sal: 15.7,
      ovr: { 2014: 87, 2015: 86, 2016: 85, 2017: 84 },
      cost: 470, from: 2014, until: 2014, direction: "retooling",
      note: "Minnesota wants Klay. Everyone wants Klay." },
    { name: "DeMarcus Cousins", team: "SAC", pos: "C", age: 24, sal: 14.7,
      ovr: { 2014: 88, 2015: 89, 2016: 89, 2017: 88 },
      cost: 420, from: 2014, until: 2016, direction: "retooling",
      note: "Enormous talent, combustible fit. Sacramento always listens." },
    { name: "Jimmy Butler", team: "CHI", pos: "SG", age: 26, sal: 17.5,
      ovr: { 2014: 78, 2015: 88, 2016: 90, 2017: 89 },
      cost: 480, from: 2015, until: 2016, direction: "retooling",
      note: "The Bulls' front office is split on paying him." },
    { name: "Paul George", team: "IND", pos: "SF", age: 27, sal: 18.3,
      ovr: { 2014: 60, 2015: 88, 2016: 88, 2017: 89 },
      cost: 400, from: 2017, until: 2017, direction: "retooling",
      note: "Indiana heard 'one year until L.A.' and picked up the phone." },
    { name: "Carmelo Anthony", team: "NYK", pos: "SF", age: 32, sal: 24.6,
      ovr: { 2014: 88, 2015: 86, 2016: 82, 2017: 78 },
      cost: 260, from: 2016, until: 2017, direction: "retooling",
      note: "The Garden marriage is over. The name is bigger than the game now." },
    { name: "Serge Ibaka", team: "OKC", pos: "PF", age: 26, sal: 12.3,
      ovr: { 2014: 82, 2015: 81, 2016: 79, 2017: 77 },
      cost: 200, from: 2016, until: 2016, direction: "retooling",
      note: "OKC is shaking things up after the big decision." },
    { name: "Goran Dragić", team: "PHX", pos: "PG", age: 28, sal: 7.5,
      ovr: { 2014: 85, 2015: 82, 2016: 81, 2017: 80 },
      cost: 180, from: 2014, until: 2014, direction: "retooling",
      note: "Third Team All-NBA, unhappy with the timeshare." },
    { name: "Isaiah Thomas", team: "PHX", pos: "PG", age: 25, sal: 6.9,
      ovr: { 2014: 82, 2015: 85, 2016: 90, 2017: 68 },
      cost: 60, from: 2014, until: 2014, direction: "retooling",
      note: "Buried in a three-guard logjam in Phoenix. Available for scraps." },
    { name: "George Hill", team: "IND", pos: "PG", age: 29, sal: 8.0,
      ovr: { 2014: 79, 2015: 80, 2016: 81, 2017: 78 },
      cost: 120, from: 2015, until: 2016, direction: "rebuilding",
      note: "Indiana is getting younger at the point." }
  ],

  freeAgents: {
    2014: [
      { name: "Pau Gasol", pos: "C", age: 34, ask: 7.1, pull: 62,
        ovr: { 2014: 82, 2015: 81, 2016: 78, 2017: 76 },
        note: "Still elegant, wants meaningful basketball." },
      { name: "Trevor Ariza", pos: "SF", age: 29, ask: 8.0, pull: 58,
        ovr: { 2014: 79, 2015: 78, 2016: 77, 2017: 76 },
        note: "3-and-D as it was meant to be." },
      { name: "Vince Carter", pos: "SG", age: 37, ask: 4.0, pull: 48,
        ovr: { 2014: 75, 2015: 72, 2016: 70, 2017: 66 },
        note: "Half-man, half-a-career later, still useful." },
      { name: "Luol Deng", pos: "SF", age: 29, ask: 9.7, pull: 52,
        ovr: { 2014: 79, 2015: 77, 2016: 74, 2017: 68 },
        note: "Thibodeau minutes have a compounding interest rate." },
      { name: "Isaiah Thomas", pos: "PG", age: 25, ask: 7.2, pull: 40,
        ovr: { 2014: 82, 2015: 85, 2016: 90, 2017: 68 },
        note: "5'9\" and scoring 20 a night, yet nobody's calling." },
      { name: "Channing Frye", pos: "C", age: 31, ask: 8.0, pull: 44,
        ovr: { 2014: 75, 2015: 73, 2016: 72, 2017: 70 },
        note: "A center who spaces the floor." },
      { name: "Shawn Marion", pos: "SF", age: 36, ask: 1.5, pull: 40,
        ovr: { 2014: 72, 2015: 68, 2016: 60, 2017: 55 },
        note: "The Matrix, final chapters." }
    ],
    2015: [
      { name: "LaMarcus Aldridge", pos: "PF", age: 30, ask: 19.7, pull: 80,
        ovr: { 2015: 87, 2016: 85, 2017: 84 },
        note: "Leaving Portland. Wants a contender with structure." },
      { name: "Paul Millsap", pos: "PF", age: 30, ask: 18.6, pull: 66,
        ovr: { 2015: 85, 2016: 84, 2017: 83 },
        note: "Quietly one of the ten best forwards alive." },
      { name: "DeAndre Jordan", pos: "C", age: 26, ask: 19.7, pull: 72,
        ovr: { 2015: 83, 2016: 82, 2017: 81 },
        note: "Lob City's anchor. Famously persuadable — twice." },
      { name: "Danny Green", pos: "SG", age: 28, ask: 10.0, pull: 64,
        ovr: { 2015: 79, 2016: 78, 2017: 77 },
        note: "Finals-record shooting, elite wing defense." },
      { name: "Greg Monroe", pos: "C", age: 25, ask: 16.0, pull: 55,
        ovr: { 2015: 80, 2016: 77, 2017: 74 },
        note: "Skilled hands, ground-bound defense." },
      { name: "Wesley Matthews", pos: "SG", age: 28, ask: 14.0, pull: 58,
        ovr: { 2015: 77, 2016: 76, 2017: 75 },
        note: "Coming off an Achilles tear. Buyer beware." }
    ],
    2016: [
      { name: "Kevin Durant", pos: "SF", age: 27, ask: 26.5, pull: 90,
        ovr: { 2016: 96, 2017: 97 },
        note: "The Hamptons meetings are real. He wants to win NOW." },
      { name: "Al Horford", pos: "C", age: 30, ask: 26.5, pull: 76,
        ovr: { 2016: 85, 2017: 84 },
        note: "The connective tissue every contender wants." },
      { name: "Mike Conley", pos: "PG", age: 28, ask: 26.5, pull: 72,
        ovr: { 2016: 85, 2017: 80 },
        note: "The largest contract in NBA history is on the table." },
      { name: "Hassan Whiteside", pos: "C", age: 27, ask: 22.0, pull: 58,
        ovr: { 2016: 83, 2017: 81 },
        note: "Blocks, boards, and a max-sized ask." },
      { name: "Nicolas Batum", pos: "SF", age: 27, ask: 22.5, pull: 60,
        ovr: { 2016: 80, 2017: 78 },
        note: "Does a bit of everything, priced like he does it all." },
      { name: "David West", pos: "PF", age: 36, ask: 1.5, pull: 65,
        ovr: { 2016: 76, 2017: 74 },
        note: "Turned down $11 million to chase a ring. Serious about it." },
      { name: "Zaza Pachulia", pos: "C", age: 32, ask: 2.9, pull: 50,
        ovr: { 2016: 74, 2017: 72 },
        note: "Screens, charges, and championship timing." }
    ],
    2017: [
      { name: "Kyle Lowry", pos: "PG", age: 31, ask: 31.0, pull: 70,
        ovr: { 2017: 87 },
        note: "Toronto's engine, weighing one more max." },
      { name: "Paul Millsap", pos: "PF", age: 32, ask: 30.0, pull: 60,
        ovr: { 2017: 83 },
        note: "Atlanta blinked. Denver money is on the table." },
      { name: "JJ Redick", pos: "SG", age: 33, ask: 23.0, pull: 50,
        ovr: { 2017: 80 },
        note: "Shooting has never been paid better." },
      { name: "Nick Young", pos: "SG", age: 32, ask: 5.2, pull: 40,
        ovr: { 2017: 74 },
        note: "Swaggy P would like to be pointed toward a parade." },
      { name: "Omri Casspi", pos: "SF", age: 29, ask: 2.1, pull: 35,
        ovr: { 2017: 72 },
        note: "Smart cutter, ring-curious." },
      { name: "Rudy Gay", pos: "SF", age: 30, ask: 8.5, pull: 45,
        ovr: { 2017: 76 },
        note: "Coming off an Achilles, betting on himself." }
    ]
  },

  draft: {
    2015: [
      { name: "Karl-Anthony Towns", pos: "C", realPick: 1, age: 19, ovr: { 2015: 81, 2016: 85, 2017: 88 }, note: "Kentucky — franchise big" },
      { name: "D'Angelo Russell", pos: "PG", realPick: 2, age: 19, ovr: { 2015: 73, 2016: 76, 2017: 78 }, note: "Ohio State — ice in his veins, allegedly" },
      { name: "Jahlil Okafor", pos: "C", realPick: 3, age: 19, ovr: { 2015: 73, 2016: 70, 2017: 66 }, note: "Duke — throwback post game" },
      { name: "Kristaps Porziņģis", pos: "C", realPick: 4, age: 19, ovr: { 2015: 77, 2016: 81, 2017: 83 }, note: "Latvia — they're booing the pick in Brooklyn" },
      { name: "Justise Winslow", pos: "SF", realPick: 10, age: 19, ovr: { 2015: 72, 2016: 71, 2017: 70 }, note: "Duke — playoff-ready defense" },
      { name: "Myles Turner", pos: "C", realPick: 11, age: 19, ovr: { 2015: 72, 2016: 78, 2017: 79 }, note: "Texas — stretch-five prototype" },
      { name: "Devin Booker", pos: "SG", realPick: 13, age: 18, ovr: { 2015: 72, 2016: 79, 2017: 83 }, note: "Kentucky — the bench guy who can really shoot" },
      { name: "Terry Rozier", pos: "PG", realPick: 16, age: 21, ovr: { 2015: 64, 2016: 68, 2017: 70 }, note: "Louisville — pitbull guard" },
      { name: "Larry Nance Jr.", pos: "PF", realPick: 27, age: 22, ovr: { 2015: 68, 2016: 72, 2017: 73 }, note: "Wyoming — bloodline bounce" },
      { name: "Montrezl Harrell", pos: "C", realPick: 32, age: 21, ovr: { 2015: 66, 2016: 71, 2017: 74 }, note: "Louisville — plays furious" },
      { name: "Josh Richardson", pos: "SG", realPick: 40, age: 21, ovr: { 2015: 68, 2016: 74, 2017: 76 }, note: "Tennessee — sneaky two-way steal" },
      { name: "Norman Powell", pos: "SG", realPick: 46, age: 22, ovr: { 2015: 66, 2016: 71, 2017: 72 }, note: "UCLA — downhill force" }
    ],
    2016: [
      { name: "Ben Simmons", pos: "PF", realPick: 1, age: 19, ovr: { 2016: 55, 2017: 83 }, note: "LSU — generational passer, foot in a boot" },
      { name: "Brandon Ingram", pos: "SF", realPick: 2, age: 18, ovr: { 2016: 70, 2017: 74 }, note: "Duke — wiry scoring wing" },
      { name: "Jaylen Brown", pos: "SF", realPick: 3, age: 19, ovr: { 2016: 71, 2017: 76 }, note: "Cal — chess player with a 40-inch vertical" },
      { name: "Dragan Bender", pos: "PF", realPick: 4, age: 18, ovr: { 2016: 62, 2017: 63 }, note: "Croatia — the next big thing, they say" },
      { name: "Kris Dunn", pos: "PG", realPick: 5, age: 22, ovr: { 2016: 66, 2017: 67 }, note: "Providence — ready-now defender" },
      { name: "Buddy Hield", pos: "SG", realPick: 6, age: 23, ovr: { 2016: 70, 2017: 73 }, note: "Oklahoma — shooting, full stop" },
      { name: "Jamal Murray", pos: "PG", realPick: 7, age: 19, ovr: { 2016: 71, 2017: 75 }, note: "Kentucky — blue arrow" },
      { name: "Domantas Sabonis", pos: "PF", realPick: 11, age: 20, ovr: { 2016: 70, 2017: 74 }, note: "Gonzaga — the name rings a bell" },
      { name: "Caris LeVert", pos: "SG", realPick: 20, age: 21, ovr: { 2016: 68, 2017: 71 }, note: "Michigan — injury lottery ticket" },
      { name: "Pascal Siakam", pos: "PF", realPick: 27, age: 22, ovr: { 2016: 65, 2017: 70 }, note: "New Mexico State — motor that never idles" },
      { name: "Dejounte Murray", pos: "PG", realPick: 29, age: 19, ovr: { 2016: 64, 2017: 70 }, note: "Washington — long, raw, fearless" },
      { name: "Malcolm Brogdon", pos: "PG", realPick: 36, age: 23, ovr: { 2016: 74, 2017: 74 }, note: "Virginia — the President" }
    ],
    2017: [
      { name: "Markelle Fultz", pos: "PG", realPick: 1, age: 19, ovr: { 2017: 55 }, note: "Washington — consensus No. 1, silky pull-up" },
      { name: "Lonzo Ball", pos: "PG", realPick: 2, age: 19, ovr: { 2017: 71 }, note: "UCLA — the father comes with the pick" },
      { name: "Jayson Tatum", pos: "SF", realPick: 3, age: 19, ovr: { 2017: 78 }, note: "Duke — footwork of a 10-year vet" },
      { name: "Josh Jackson", pos: "SF", realPick: 4, age: 20, ovr: { 2017: 66 }, note: "Kansas — defensive havoc, shaky shot" },
      { name: "De'Aaron Fox", pos: "PG", realPick: 5, age: 19, ovr: { 2017: 71 }, note: "Kentucky — fastest player in the class" },
      { name: "Lauri Markkanen", pos: "PF", realPick: 7, age: 20, ovr: { 2017: 72 }, note: "Arizona — seven feet of shooting" },
      { name: "Donovan Mitchell", pos: "SG", realPick: 13, age: 20, ovr: { 2017: 80 }, note: "Louisville — combine legend, spider nickname pending" },
      { name: "Bam Adebayo", pos: "C", realPick: 14, age: 19, ovr: { 2017: 70 }, note: "Kentucky — switchable and mean" },
      { name: "John Collins", pos: "PF", realPick: 19, age: 19, ovr: { 2017: 72 }, note: "Wake Forest — pogo-stick production" },
      { name: "OG Anunoby", pos: "SF", realPick: 23, age: 19, ovr: { 2017: 70 }, note: "Indiana — ACL rehab, All-Defense tools" },
      { name: "Kyle Kuzma", pos: "PF", realPick: 27, age: 21, ovr: { 2017: 76 }, note: "Utah — instant offense, older prospect" },
      { name: "Derrick White", pos: "PG", realPick: 29, age: 23, ovr: { 2017: 62 }, note: "Colorado — Division II to round one" },
      { name: "Jordan Bell", pos: "C", realPick: 38, age: 22, ovr: { 2017: 68 }, note: "Oregon — rim-rolling energy, sold for cash on draft night" }
    ]
  },

  gauntlet: {
    2015: [
      { team: "CLE", ovr: 94, conf: "E" }, { team: "ATL", ovr: 91, conf: "E" },
      { team: "SAS", ovr: 93, conf: "W" }, { team: "MEM", ovr: 91, conf: "W" },
      { team: "LAC", ovr: 92, conf: "W" }
    ],
    2016: [
      { team: "CLE", ovr: 96, conf: "E" }, { team: "TOR", ovr: 91, conf: "E" },
      { team: "SAS", ovr: 95, conf: "W" }, { team: "OKC", ovr: 94, conf: "W" }
    ],
    2017: [
      { team: "CLE", ovr: 96, conf: "E" }, { team: "SAS", ovr: 94, conf: "W" },
      { team: "HOU", ovr: 93, conf: "W" }
    ],
    2018: [
      { team: "CLE", ovr: 93, conf: "E" }, { team: "BOS", ovr: 92, conf: "E" },
      { team: "HOU", ovr: 96, conf: "W" }
    ]
  },

  events: [
    { year: 2014, text: "Steve Kerr turned down Phil Jackson's Knicks to coach this roster. He thinks the shooting changes everything." },
    { year: 2014, text: "Minnesota keeps asking about Klay. Jerry West is threatening to quit if anyone says yes." },
    { year: 2015, text: "Boston has cap space and will rent it out for the right price." },
    { year: 2015, text: "League memo: the new TV deal will spike the cap toward $94M in one jump." },
    { year: 2016, text: "The cap explodes by $24M overnight. Suddenly everyone can afford a max — including you." },
    { year: 2016, text: "Durant's camp is scheduling meetings in the Hamptons." },
    { year: 2017, text: "Ring-chasers are calling the front office directly. The minimum exception never sleeps." }
  ]
};

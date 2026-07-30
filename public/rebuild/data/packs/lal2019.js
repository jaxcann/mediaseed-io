export default {
  id: "lal2019",
  title: "Lakeshow",
  team: { id: "LAL", city: "Los Angeles", name: "Lakers", colors: ["#552583", "#FDB927"], conf: "W" },
  startYear: 2019,
  par: 2,
  difficulty: "Easy",
  realOutcome: "Rob Pelinka traded the young core for Anthony Davis, surrounded LeBron with veterans, and won the bubble title in year one. Then, in 2021, came the Westbrook trade.",
  baselineWins: 37,
  intro:
    "June 2019. LeBron James just spent Christmas watching his groin heal and his team miss the playoffs at 37 wins. Magic Johnson quit on live television. But Rich Paul has told every reporter in America that Anthony Davis wants out of New Orleans, and Kawhi Leonard is taking meetings across the hallway. The young core is the price of everything. You're on the clock, and the whole city is watching.",
  tips: "Pay whatever New Orleans asks. When Washington calls two summers from now, let it ring — and always keep a roster spot for an undrafted guard.",

  cap: { 2019: 109.1, 2020: 109.1, 2021: 112.4, 2022: 123.7 },

  roster: [
    { name: "LeBron James", pos: "SF", age: 34, sal: 37.4, ovr: { 2019: 95, 2020: 95, 2021: 94, 2022: 92 } },
    { name: "Brandon Ingram", pos: "SF", age: 21, sal: 7.3, ovr: { 2019: 82, 2020: 83, 2021: 85, 2022: 83 } },
    { name: "Lonzo Ball", pos: "PG", age: 21, sal: 8.7, ovr: { 2019: 77, 2020: 78, 2021: 76, 2022: 55 } },
    { name: "Kyle Kuzma", pos: "PF", age: 23, sal: 2.0, ovr: { 2019: 78, 2020: 75, 2021: 76, 2022: 77 } },
    { name: "Josh Hart", pos: "SG", age: 24, sal: 1.9, ovr: { 2019: 74, 2020: 75, 2021: 76, 2022: 76 } },
    { name: "Kentavious Caldwell-Pope", pos: "SG", age: 26, sal: 8.1, ovr: { 2019: 75, 2020: 76, 2021: 75, 2022: 74 } },
    { name: "JaVale McGee", pos: "C", age: 31, sal: 4.0, ovr: { 2019: 75, 2020: 72, 2021: 70, 2022: 66 } },
    { name: "Alex Caruso", pos: "PG", age: 25, sal: 2.8, ovr: { 2019: 73, 2020: 76, 2021: 78, 2022: 80 } },
    { name: "Moritz Wagner", pos: "C", age: 22, sal: 2.1, ovr: { 2019: 68, 2020: 70, 2021: 70, 2022: 72 } },
    { name: "Talen Horton-Tucker", pos: "SG", age: 18, sal: 0.9, ovr: { 2019: 62, 2020: 71, 2021: 72, 2022: 67 } }
  ],

  picks: [],

  offers: [
    {
      id: "was-wagner", team: "WAS", year: 2019, until: 2019,
      label: "Washington rents you cap space",
      give: ["Moritz Wagner"],
      get: {
        players: [],
        picks: [{ year: 2022, slot: 35, via: "WAS" }]
      }
    },
    {
      id: "okc-schroder", team: "OKC", year: 2020, until: 2020,
      label: "OKC is recycling guards again",
      give: ["Kentavious Caldwell-Pope"],
      get: {
        players: [
          { name: "Dennis Schröder", pos: "PG", age: 27, sal: 15.5, ovr: { 2019: 76, 2020: 79, 2021: 74, 2022: 75 } }
        ],
        picks: []
      }
    },
    {
      id: "cle-javale", team: "CLE", year: 2020, until: 2020,
      label: "Cleveland needs a center, you need minutes",
      give: ["JaVale McGee"],
      get: {
        players: [
          { name: "Jordan Bell", pos: "C", age: 26, sal: 1.6, ovr: { 2020: 64, 2021: 62, 2022: 60 } }
        ],
        picks: [{ year: 2021, slot: 46, via: "CLE" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Anthony Davis", team: "NOP", pos: "PF", age: 26, sal: 27.1,
      ovr: { 2019: 94, 2020: 93, 2021: 91, 2022: 92 },
      cost: 500, from: 2019, until: 2019, direction: "retooling",
      note: "Rich Paul told everyone. He wants the Lakers." },
    { name: "Bradley Beal", team: "WAS", pos: "SG", age: 26, sal: 27.1,
      ovr: { 2019: 86, 2020: 88, 2021: 84, 2022: 82 },
      cost: 450, from: 2019, until: 2021, direction: "contending",
      note: "Every contender calls. Washington always says no." },
    { name: "Chris Paul", team: "OKC", pos: "PG", age: 34, sal: 38.5,
      ovr: { 2019: 85, 2020: 87, 2021: 87, 2022: 82 },
      cost: 250, from: 2019, until: 2020, direction: "contending",
      note: "Oklahoma City will almost pay you to take the contract. Almost." },
    { name: "Andre Iguodala", team: "MEM", pos: "SF", age: 35, sal: 17.2,
      ovr: { 2019: 72, 2020: 71, 2021: 68, 2022: 64 },
      cost: 60, from: 2019, until: 2019, direction: "contending",
      note: "Sitting at home in Memphis limbo, waiting for a contender." },
    { name: "Kyle Lowry", team: "TOR", pos: "PG", age: 34, sal: 30.5,
      ovr: { 2019: 85, 2020: 84, 2021: 81, 2022: 76 },
      cost: 180, from: 2020, until: 2020, direction: "contending",
      note: "Toronto is listening at the deadline. He already has his ring." },
    { name: "Myles Turner", team: "IND", pos: "C", age: 24, sal: 18.0,
      ovr: { 2019: 78, 2020: 79, 2021: 80, 2022: 80 },
      cost: 140, from: 2020, until: 2022, direction: "rebuilding",
      note: "Indiana shops him every winter and keeps him every spring." },
    { name: "Russell Westbrook", team: "WAS", pos: "PG", age: 32, sal: 44.2,
      ovr: { 2019: 85, 2020: 84, 2021: 76, 2022: 73 },
      cost: 300, from: 2021, until: 2021, direction: "rebuilding",
      note: "Washington will move him. Think hard." },
    { name: "DeMar DeRozan", team: "SAS", pos: "SF", age: 31, sal: 26.0,
      ovr: { 2019: 83, 2020: 82, 2021: 87, 2022: 85 },
      cost: 200, from: 2021, until: 2021, direction: "retooling",
      note: "The Compton kid keeps calling back. San Antonio will deal." },
    { name: "Buddy Hield", team: "SAC", pos: "SG", age: 28, sal: 22.5,
      ovr: { 2019: 78, 2020: 76, 2021: 77, 2022: 75 },
      cost: 150, from: 2021, until: 2021, direction: "retooling",
      note: "Sacramento already agreed once. Shooting fixes a lot of things." },
    { name: "Domantas Sabonis", team: "IND", pos: "PF", age: 25, sal: 18.5,
      ovr: { 2019: 82, 2020: 85, 2021: 86, 2022: 86 },
      cost: 260, from: 2021, until: 2022, direction: "retooling",
      note: "Two frontcourt All-Stars, one frontcourt. Indiana has to choose." }
  ],

  freeAgents: {
    2019: [
      { name: "Kawhi Leonard", pos: "SF", age: 28, ask: 32.7, pull: 90,
        ovr: { 2019: 95, 2020: 94, 2021: 55, 2022: 88 },
        note: "He took the meeting. Total silence since. The other building is waiting too." },
      { name: "Danny Green", pos: "SG", age: 32, ask: 15.0, pull: 60,
        ovr: { 2019: 77, 2020: 74, 2021: 72, 2022: 60 },
        note: "Championship corner threes, sold separately from his co-star." },
      { name: "Dwight Howard", pos: "C", age: 33, ask: 2.6, pull: 40,
        ovr: { 2019: 76, 2020: 72, 2021: 70, 2022: 60 },
        note: "One phone call, zero guarantees. He says he's changed." },
      { name: "Rajon Rondo", pos: "PG", age: 33, ask: 2.6, pull: 38,
        ovr: { 2019: 74, 2020: 70, 2021: 66, 2022: 60 },
        note: "Playoff Rondo is real. Regular-season Rondo is also real." },
      { name: "Avery Bradley", pos: "SG", age: 28, ask: 4.8, pull: 40,
        ovr: { 2019: 73, 2020: 70, 2021: 66, 2022: 60 },
        note: "Point-of-attack defense, no frills." },
      { name: "DeMarcus Cousins", pos: "C", age: 28, ask: 3.5, pull: 35,
        ovr: { 2019: 55, 2020: 68, 2021: 66, 2022: 60 },
        note: "Achilles, then quad. A flier priced like a flier." }
    ],
    2020: [
      { name: "Montrezl Harrell", pos: "C", age: 26, ask: 9.3, pull: 45,
        ovr: { 2019: 80, 2020: 77, 2021: 73, 2022: 71 },
        note: "Reigning Sixth Man of the Year, one hallway over." },
      { name: "Marc Gasol", pos: "C", age: 35, ask: 2.6, pull: 48,
        ovr: { 2019: 78, 2020: 72, 2021: 66, 2022: 55 },
        note: "The IQ never retires. The legs are negotiating." },
      { name: "Wesley Matthews", pos: "SG", age: 33, ask: 3.6, pull: 42,
        ovr: { 2019: 74, 2020: 71, 2021: 66, 2022: 62 },
        note: "Professional wing defense on a professional's discount." },
      { name: "Fred VanVleet", pos: "PG", age: 26, ask: 21.3, pull: 78,
        ovr: { 2019: 80, 2020: 82, 2021: 83, 2022: 80 },
        note: "Bet on himself once already. Toronto pays its debts." },
      { name: "Serge Ibaka", pos: "C", age: 31, ask: 9.3, pull: 55,
        ovr: { 2019: 79, 2020: 76, 2021: 68, 2022: 64 },
        note: "Ring in Toronto, back trouble incoming." },
      { name: "Goran Dragić", pos: "PG", age: 34, ask: 18.0, pull: 62,
        ovr: { 2019: 78, 2020: 79, 2021: 74, 2022: 68 },
        note: "Just dragged Miami to the Finals. Priced accordingly." }
    ],
    2021: [
      { name: "Carmelo Anthony", pos: "SF", age: 37, ask: 2.6, pull: 40,
        ovr: { 2019: 74, 2020: 74, 2021: 72, 2022: 68 },
        note: "The Portland reinvention is real. Wants one thing he doesn't have." },
      { name: "Malik Monk", pos: "SG", age: 23, ask: 1.8, pull: 35,
        ovr: { 2019: 68, 2020: 71, 2021: 76, 2022: 77 },
        note: "Kentucky shooting at the minimum. Somebody look." },
      { name: "Kendrick Nunn", pos: "PG", age: 25, ask: 5.0, pull: 45,
        ovr: { 2019: 76, 2020: 74, 2021: 55, 2022: 66 },
        note: "The bargain of the summer, they're saying." },
      { name: "Kyle Lowry", pos: "PG", age: 35, ask: 28.0, pull: 72,
        ovr: { 2019: 85, 2020: 84, 2021: 81, 2022: 76 },
        note: "Toronto's era is over. He wants sunshine and a contender." },
      { name: "Dwight Howard", pos: "C", age: 35, ask: 2.6, pull: 35,
        ovr: { 2019: 76, 2020: 72, 2021: 68, 2022: 60 },
        note: "Third tour. Knows where the parking is." },
      { name: "Trevor Ariza", pos: "SF", age: 36, ask: 2.6, pull: 30,
        ovr: { 2019: 73, 2020: 70, 2021: 62, 2022: 55 },
        note: "The 2009 nostalgia costs extra." }
    ],
    2022: [
      { name: "Jalen Brunson", pos: "PG", age: 25, ask: 26.0, pull: 70,
        ovr: { 2019: 72, 2020: 74, 2021: 80, 2022: 85 },
        note: "Dallas assumes he'll stay. New York knows otherwise." },
      { name: "Zach LaVine", pos: "SG", age: 27, ask: 37.1, pull: 88,
        ovr: { 2019: 82, 2020: 84, 2021: 84, 2022: 83 },
        note: "Max or nothing, and Chicago has the max." },
      { name: "P.J. Tucker", pos: "PF", age: 37, ask: 11.0, pull: 60,
        ovr: { 2019: 74, 2020: 72, 2021: 74, 2022: 70 },
        note: "Corner threes, elbows, and a ring from Milwaukee." },
      { name: "Lonnie Walker IV", pos: "SG", age: 23, ask: 6.5, pull: 38,
        ovr: { 2019: 70, 2020: 72, 2021: 71, 2022: 73 },
        note: "Athletic scorer San Antonio never quite unlocked." },
      { name: "Thomas Bryant", pos: "C", age: 25, ask: 2.0, pull: 32,
        ovr: { 2019: 76, 2020: 60, 2021: 66, 2022: 72 },
        note: "Pre-ACL he could really play. Minimum-salary lottery ticket." }
    ]
  },

  draft: {
    2020: [
      { name: "Anthony Edwards", pos: "SG", realPick: 1, age: 19, ovr: { 2020: 74, 2021: 80, 2022: 85 }, note: "Georgia — the swagger is not a bug" },
      { name: "James Wiseman", pos: "C", realPick: 2, age: 19, ovr: { 2020: 66, 2021: 55, 2022: 64 }, note: "Memphis — three college games, seven feet of maybe" },
      { name: "LaMelo Ball", pos: "PG", realPick: 3, age: 19, ovr: { 2020: 78, 2021: 83, 2022: 80 }, note: "Illawarra — you already know the family" },
      { name: "Patrick Williams", pos: "PF", realPick: 4, age: 19, ovr: { 2020: 70, 2021: 69, 2022: 70 }, note: "Florida State — came off the bench in college" },
      { name: "Isaac Okoro", pos: "SF", realPick: 5, age: 19, ovr: { 2020: 68, 2021: 70, 2022: 70 }, note: "Auburn — defense first, jumper someday" },
      { name: "Killian Hayes", pos: "PG", realPick: 7, age: 19, ovr: { 2020: 62, 2021: 65, 2022: 64 }, note: "Ulm — smooth lefty, scouts are split" },
      { name: "Tyrese Haliburton", pos: "PG", realPick: 12, age: 20, ovr: { 2020: 76, 2021: 80, 2022: 85 }, note: "Iowa State — the jumper looks weird. The results don't." },
      { name: "Isaiah Stewart", pos: "C", realPick: 16, age: 19, ovr: { 2020: 70, 2021: 72, 2022: 73 }, note: "Washington — plays like his hair is on fire" },
      { name: "Tyrese Maxey", pos: "PG", realPick: 21, age: 19, ovr: { 2020: 72, 2021: 78, 2022: 83 }, note: "Kentucky — smiles, then blows by you" },
      { name: "Immanuel Quickley", pos: "PG", realPick: 25, age: 21, ovr: { 2020: 71, 2021: 72, 2022: 74 }, note: "Kentucky — floater artist" },
      { name: "Desmond Bane", pos: "SG", realPick: 30, age: 22, ovr: { 2020: 72, 2021: 79, 2022: 83 }, note: "TCU — the arms are short, the release isn't" },
      { name: "Isaiah Joe", pos: "SG", realPick: 49, age: 21, ovr: { 2020: 64, 2021: 62, 2022: 71 }, note: "Arkansas — shooting travels" }
    ],
    2021: [
      { name: "Cade Cunningham", pos: "PG", realPick: 1, age: 19, ovr: { 2021: 74, 2022: 60 }, note: "Oklahoma State — six-eight, runs everything" },
      { name: "Jalen Green", pos: "SG", realPick: 2, age: 19, ovr: { 2021: 73, 2022: 77 }, note: "G League Ignite — 40 inches of hops" },
      { name: "Evan Mobley", pos: "C", realPick: 3, age: 20, ovr: { 2021: 80, 2022: 82 }, note: "USC — moves like a guard, protects like a center" },
      { name: "Scottie Barnes", pos: "PF", realPick: 4, age: 20, ovr: { 2021: 78, 2022: 76 }, note: "Florida State — plays every position, loudly" },
      { name: "Jalen Suggs", pos: "PG", realPick: 5, age: 20, ovr: { 2021: 66, 2022: 69 }, note: "Gonzaga — hit the half-court shot you remember" },
      { name: "Josh Giddey", pos: "PG", realPick: 6, age: 18, ovr: { 2021: 74, 2022: 77 }, note: "Adelaide — teenage triple-double machine" },
      { name: "Franz Wagner", pos: "SF", realPick: 8, age: 19, ovr: { 2021: 77, 2022: 81 }, note: "Michigan — more than Moe's little brother" },
      { name: "Chris Duarte", pos: "SG", realPick: 13, age: 24, ovr: { 2021: 71, 2022: 64 }, note: "Oregon — ready now, and that's the concern" },
      { name: "Alperen Şengün", pos: "C", realPick: 16, age: 19, ovr: { 2021: 72, 2022: 77 }, note: "Beşiktaş — MVP of the Turkish league at 18" },
      { name: "Trey Murphy III", pos: "SF", realPick: 17, age: 21, ovr: { 2021: 66, 2022: 76 }, note: "Virginia — 3-and-D from central casting" },
      { name: "Cam Thomas", pos: "SG", realPick: 27, age: 19, ovr: { 2021: 67, 2022: 70 }, note: "LSU — has never seen a shot he didn't like" },
      { name: "Herb Jones", pos: "SF", realPick: 35, age: 22, ovr: { 2021: 74, 2022: 76 }, note: "Alabama — guards one through five" },
      { name: "Austin Reaves", pos: "SG", realPick: 58, age: 23, ovr: { 2021: 70, 2022: 76 }, note: "Oklahoma — would rather go undrafted than land in the wrong place" }
    ],
    2022: [
      { name: "Paolo Banchero", pos: "PF", realPick: 1, age: 19, ovr: { 2022: 80 }, note: "Duke — 250 pounds of point forward" },
      { name: "Chet Holmgren", pos: "C", realPick: 2, age: 20, ovr: { 2022: 55 }, note: "Gonzaga — 195 pounds of unicorn" },
      { name: "Jabari Smith Jr.", pos: "PF", realPick: 3, age: 19, ovr: { 2022: 72 }, note: "Auburn — the jumper is already pro" },
      { name: "Keegan Murray", pos: "PF", realPick: 4, age: 21, ovr: { 2022: 75 }, note: "Iowa — quietly efficient at everything" },
      { name: "Jaden Ivey", pos: "PG", realPick: 5, age: 20, ovr: { 2022: 73 }, note: "Purdue — fastest player in the class" },
      { name: "Dyson Daniels", pos: "PG", realPick: 8, age: 19, ovr: { 2022: 68 }, note: "G League Ignite — great gloves" },
      { name: "Jalen Williams", pos: "SG", realPick: 12, age: 21, ovr: { 2022: 78 }, note: "Santa Clara — the wingspan measurement broke the combine" },
      { name: "Jalen Duren", pos: "C", realPick: 13, age: 18, ovr: { 2022: 73 }, note: "Memphis — grown-man body, teenage birthday" },
      { name: "Mark Williams", pos: "C", realPick: 15, age: 20, ovr: { 2022: 70 }, note: "Duke — the standing reach of a small building" },
      { name: "Christian Braun", pos: "SG", realPick: 21, age: 21, ovr: { 2022: 70 }, note: "Kansas — champion, sprinter, glue" },
      { name: "Walker Kessler", pos: "C", realPick: 22, age: 20, ovr: { 2022: 76 }, note: "Auburn — blocks everything in the gym" },
      { name: "Andrew Nembhard", pos: "PG", realPick: 31, age: 22, ovr: { 2022: 74 }, note: "Gonzaga — ready yesterday" }
    ]
  },

  gauntlet: {
    2020: [
      { team: "LAC", ovr: 95, conf: "W" }, { team: "DEN", ovr: 92, conf: "W" },
      { team: "MIL", ovr: 96, conf: "E" }, { team: "MIA", ovr: 92, conf: "E" }
    ],
    2021: [
      { team: "PHX", ovr: 94, conf: "W" }, { team: "UTA", ovr: 94, conf: "W" },
      { team: "BKN", ovr: 96, conf: "E" }, { team: "MIL", ovr: 95, conf: "E" }
    ],
    2022: [
      { team: "PHX", ovr: 96, conf: "W" }, { team: "GSW", ovr: 95, conf: "W" },
      { team: "BOS", ovr: 94, conf: "E" }, { team: "MIA", ovr: 92, conf: "E" }
    ],
    2023: [
      { team: "DEN", ovr: 96, conf: "W" }, { team: "PHX", ovr: 93, conf: "W" },
      { team: "BOS", ovr: 95, conf: "E" }, { team: "MIL", ovr: 94, conf: "E" }
    ]
  },

  events: [
    { year: 2019, text: "Rich Paul has made the client list public. New Orleans can't hold out forever." },
    { year: 2019, text: "Kawhi Leonard is taking meetings all over Los Angeles. Both buildings are holding their breath." },
    { year: 2019, text: "League insiders swear this season ends somewhere strange. Depth and stars travel well." },
    { year: 2020, text: "The champion was crowned in a bubble. The offseason will be the shortest ever — 72 days." },
    { year: 2020, text: "The Clippers' Sixth Man of the Year is a free agent, one hallway over." },
    { year: 2021, text: "A former MVP point guard is available out of Washington. Ask what he does without the ball." },
    { year: 2021, text: "Sacramento agreed to a shooting deal once. The phone still works." },
    { year: 2022, text: "The West runs through Denver's big man now. Size and patience win springs." }
  ]
};

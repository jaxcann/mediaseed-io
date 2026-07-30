export default {
  id: "tor2018",
  title: "The Gamble",
  team: { id: "TOR", city: "Toronto", name: "Raptors", colors: ["#CE1141", "#A1A1A4"], conf: "E" },
  startYear: 2018,
  par: 2,
  difficulty: "Medium",
  realOutcome: "Masai made the trade nobody else would — the franchise's favorite son for a one-year rental with a quad nobody trusted. Board man got paid, the ball bounced four times on the rim in Game 7, and Toronto raised the 2019 banner. Kawhi left for LA two weeks later.",
  baselineWins: 59,
  intro:
    "July 2018. You won 59 games, got swept by LeBron again, and fired Dwane Casey days after he won Coach of the Year. DeMar DeRozan says he bleeds Toronto red, and he means it. San Antonio just asked what it would take. Masai Ujiri's chair is yours — and it's warm.",
  tips: "Loyalty wins press conferences. One healthy year of the right player wins something heavier.",

  cap: { 2018: 101.9, 2019: 109.1, 2020: 109.1, 2021: 112.4 },

  roster: [
    { name: "DeMar DeRozan", pos: "SG", age: 28, sal: 27.7, ovr: { 2018: 86, 2019: 85, 2020: 84, 2021: 83 } },
    { name: "Kyle Lowry", pos: "PG", age: 32, sal: 31.2, ovr: { 2018: 86, 2019: 84, 2020: 83, 2021: 80 } },
    { name: "Pascal Siakam", pos: "PF", age: 24, sal: 1.5, ovr: { 2018: 84, 2019: 87, 2020: 86, 2021: 85 } },
    { name: "OG Anunoby", pos: "SF", age: 21, sal: 1.9, ovr: { 2018: 76, 2019: 78, 2020: 80, 2021: 82 } },
    { name: "Fred VanVleet", pos: "PG", age: 24, sal: 9.0, ovr: { 2018: 78, 2019: 80, 2020: 82, 2021: 84 } },
    { name: "Serge Ibaka", pos: "C", age: 28, sal: 21.7, ovr: { 2018: 79, 2019: 80, 2020: 79, 2021: 76 } },
    { name: "Jonas Valančiūnas", pos: "C", age: 26, sal: 16.5, ovr: { 2018: 79, 2019: 79, 2020: 80, 2021: 80 } },
    { name: "Delon Wright", pos: "PG", age: 26, sal: 2.5, ovr: { 2018: 74, 2019: 73, 2020: 72, 2021: 70 } },
    { name: "Norman Powell", pos: "SG", age: 25, sal: 9.4, ovr: { 2018: 74, 2019: 75, 2020: 78, 2021: 80 } },
    { name: "C.J. Miles", pos: "SF", age: 31, sal: 8.3, ovr: { 2018: 72, 2019: 70, 2020: 66, 2021: 62 } },
    { name: "Jakob Poeltl", pos: "C", age: 22, sal: 2.9, ovr: { 2018: 75, 2019: 76, 2020: 77, 2021: 79 } }
  ],

  picks: [],

  offers: [
    {
      id: "sas-kawhi", team: "SAS", year: 2018, until: 2018,
      label: "San Antonio will move Kawhi — for your favorite son",
      note: "One year on his deal. A quad that nobody's seen. The best two-way player alive.",
      give: ["DeMar DeRozan", "Jakob Poeltl"],
      get: {
        players: [
          { name: "Kawhi Leonard", pos: "SF", age: 27, sal: 23.1, ovr: { 2018: 94, 2019: 95, 2020: 94, 2021: 93 } },
          { name: "Danny Green", pos: "SG", age: 31, sal: 10.0, ovr: { 2018: 78, 2019: 76, 2020: 73, 2021: 70 } }
        ],
        picks: []
      }
    },
    {
      id: "mem-gasol", team: "MEM", year: 2018, until: 2018,
      label: "Memphis will move Marc Gasol at the deadline",
      note: "The smartest center of his generation, for the price of three rotation pieces.",
      give: ["Jonas Valančiūnas", "Delon Wright", "C.J. Miles"],
      get: {
        players: [
          { name: "Marc Gasol", pos: "C", age: 33, sal: 24.1, ovr: { 2018: 80, 2019: 78, 2020: 74, 2021: 70 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Thaddeus Young", team: "IND", pos: "PF", age: 30, sal: 12.9,
      ovr: { 2018: 77, 2019: 76, 2020: 75, 2021: 74 },
      cost: 90, from: 2018, until: 2019, direction: "retooling",
      note: "Does the quiet things loud teams need." },
    { name: "Mike Conley", team: "MEM", pos: "PG", age: 31, sal: 32.5,
      ovr: { 2018: 82, 2019: 79, 2020: 81, 2021: 80 },
      cost: 200, from: 2019, until: 2019, direction: "rebuilding",
      note: "Memphis is finally rebuilding around the kid they're about to draft." },
    { name: "Chris Paul", team: "OKC", pos: "PG", age: 34, sal: 38.5,
      ovr: { 2019: 84, 2020: 86, 2021: 85 },
      cost: 200, from: 2019, until: 2020, direction: "rebuilding",
      note: "The contract scares everyone. The player shouldn't." },
    { name: "Kevin Love", team: "CLE", pos: "PF", age: 29, sal: 24.1,
      ovr: { 2018: 83, 2019: 80, 2020: 79, 2021: 76 },
      cost: 220, from: 2018, until: 2020, direction: "rebuilding",
      note: "Cleveland's rebuild has begun. Everything must go." },
    { name: "Jrue Holiday", team: "NOP", pos: "PG", age: 30, sal: 25.9,
      ovr: { 2018: 84, 2019: 85, 2020: 85, 2021: 84 },
      cost: 320, from: 2020, until: 2020, direction: "rebuilding",
      note: "New Orleans wants a mountain of picks. The line of contenders starts to the left." },
    { name: "Victor Oladipo", team: "IND", pos: "SG", age: 28, sal: 21.0,
      ovr: { 2018: 87, 2019: 70, 2020: 74, 2021: 72 },
      cost: 160, from: 2020, until: 2020, direction: "contending",
      note: "Two years removed from All-NBA, one year removed from a ruptured quad tendon." },
    { name: "Nikola Vučević", team: "ORL", pos: "C", age: 29, sal: 26.0,
      ovr: { 2018: 83, 2019: 84, 2020: 85, 2021: 84 },
      cost: 280, from: 2020, until: 2021, direction: "retooling",
      note: "An All-Star center on a team going nowhere in particular." },
    { name: "Aaron Gordon", team: "ORL", pos: "PF", age: 24, sal: 18.1,
      ovr: { 2018: 78, 2019: 78, 2020: 77, 2021: 76 },
      cost: 180, from: 2020, until: 2021, direction: "retooling",
      note: "Lost two dunk contests and most of his patience." },
    { name: "Robert Covington", team: "MIN", pos: "SF", age: 28, sal: 11.3,
      ovr: { 2018: 79, 2019: 77, 2020: 76, 2021: 74 },
      cost: 140, from: 2019, until: 2020, direction: "retooling",
      note: "Every analytics department's favorite wing." },
    { name: "Bogdan Bogdanović", team: "SAC", pos: "SG", age: 26, sal: 8.5,
      ovr: { 2018: 76, 2019: 77, 2020: 78, 2021: 79 },
      cost: 110, from: 2019, until: 2019, direction: "retooling",
      note: "Sacramento can't decide if he's core or currency." },
    { name: "Buddy Hield", team: "SAC", pos: "SG", age: 27, sal: 24.9,
      ovr: { 2018: 78, 2019: 80, 2020: 78, 2021: 77 },
      cost: 150, from: 2020, until: 2021, direction: "retooling",
      note: "Sacramento benched its best shooter. Sacramento does things like that." }
  ],

  freeAgents: {
    2018: [
      { name: "LeBron James", pos: "SF", age: 33, ask: 35.7, pull: 95,
        ovr: { 2018: 95, 2019: 93, 2020: 96, 2021: 95 },
        note: "The billboards in Los Angeles are already printed." },
      { name: "DeMarcus Cousins", pos: "C", age: 27, ask: 5.3, pull: 62,
        ovr: { 2018: 74, 2019: 70, 2020: 55, 2021: 50 },
        note: "An All-NBA center for the mid-level, one Achilles later." },
      { name: "Brook Lopez", pos: "C", age: 30, ask: 3.4, pull: 55,
        ovr: { 2018: 78, 2019: 79, 2020: 78, 2021: 77 },
        note: "Seven feet tall, suddenly lives behind the arc. Priced like nobody noticed." },
      { name: "Trevor Ariza", pos: "SF", age: 33, ask: 15.0, pull: 45,
        ovr: { 2018: 74, 2019: 72, 2020: 70, 2021: 66 },
        note: "Phoenix is paying full sticker for the name." },
      { name: "Tyreke Evans", pos: "SG", age: 28, ask: 12.0, pull: 42,
        ovr: { 2018: 74, 2019: 68, 2020: 50, 2021: 50 },
        note: "One great comeback year in Memphis. Buy the encore at your own risk." },
      { name: "Jabari Parker", pos: "PF", age: 23, ask: 20.0, pull: 40,
        ovr: { 2018: 74, 2019: 72, 2020: 70, 2021: 66 },
        note: "'They don't pay you to play defense.' He said that out loud." },
      { name: "Rajon Rondo", pos: "PG", age: 32, ask: 9.0, pull: 42,
        ovr: { 2018: 73, 2019: 72, 2020: 71, 2021: 66 },
        note: "Runs a team beautifully, when he feels like it." }
    ],
    2019: [
      { name: "Kevin Durant", pos: "SF", age: 30, ask: 38.2, pull: 85,
        ovr: { 2019: 55, 2020: 93, 2021: 94 },
        note: "Ruptured his Achilles in June. The max ask hasn't budged an inch." },
      { name: "Kyrie Irving", pos: "PG", age: 27, ask: 33.5, pull: 78,
        ovr: { 2019: 88, 2020: 89, 2021: 87 },
        note: "Genius with the ball. Complicated everywhere else." },
      { name: "Kemba Walker", pos: "PG", age: 29, ask: 32.7, pull: 70,
        ovr: { 2019: 85, 2020: 81, 2021: 75 },
        note: "Charlotte's whole offense, tired of carrying it alone." },
      { name: "Jimmy Butler", pos: "SG", age: 29, ask: 32.7, pull: 75,
        ovr: { 2019: 86, 2020: 88, 2021: 87 },
        note: "Burned two locker rooms on the way out. Wins anyway." },
      { name: "Al Horford", pos: "C", age: 33, ask: 28.0, pull: 65,
        ovr: { 2019: 81, 2020: 78, 2021: 80 },
        note: "The connective tissue, now with mileage." },
      { name: "Malcolm Brogdon", pos: "PG", age: 26, ask: 21.2, pull: 55,
        ovr: { 2019: 81, 2020: 80, 2021: 79 },
        note: "Milwaukee blinked at the price. Their loss is negotiable." },
      { name: "Patrick Beverley", pos: "PG", age: 31, ask: 13.0, pull: 45,
        ovr: { 2019: 76, 2020: 75, 2021: 73 },
        note: "An irritant, in the best and worst senses." }
    ],
    2020: [
      { name: "Christian Wood", pos: "PF", age: 24, ask: 13.7, pull: 45,
        ovr: { 2020: 79, 2021: 78 },
        note: "Undrafted, waived four times, suddenly 21 and 10. The league is slow sometimes." },
      { name: "Montrezl Harrell", pos: "C", age: 26, ask: 9.3, pull: 48,
        ovr: { 2020: 77, 2021: 74 },
        note: "Sixth Man of the Year at a sixth-man price." },
      { name: "Danilo Gallinari", pos: "PF", age: 31, ask: 20.0, pull: 50,
        ovr: { 2020: 78, 2021: 76 },
        note: "Elite shooting, standard-issue availability." },
      { name: "Goran Dragić", pos: "PG", age: 34, ask: 19.4, pull: 50,
        ovr: { 2020: 77, 2021: 72 },
        note: "Just dragged Miami to the Finals. The odometer is what it is." },
      { name: "Joe Harris", pos: "SG", age: 28, ask: 16.0, pull: 48,
        ovr: { 2020: 78, 2021: 77 },
        note: "Best corner three in the sport, give or take a Curry." },
      { name: "Rajon Rondo", pos: "PG", age: 34, ask: 7.5, pull: 45,
        ovr: { 2020: 70, 2021: 62 },
        note: "Playoff Rondo is real. Regular-season Rondo also comes in the box." }
    ],
    2021: [
      { name: "Mike Conley", pos: "PG", age: 33, ask: 22.8, pull: 55,
        ovr: { 2021: 82 },
        note: "Finally an All-Star at 33. Utah wants to keep the band together." },
      { name: "Lonzo Ball", pos: "PG", age: 23, ask: 20.0, pull: 48,
        ovr: { 2021: 78 },
        note: "Rebuilt the jumper from scratch. Defense came free." },
      { name: "Evan Fournier", pos: "SG", age: 28, ask: 19.5, pull: 45,
        ovr: { 2021: 77 },
        note: "Scoring wing, do not Google him." },
      { name: "Reggie Jackson", pos: "PG", age: 31, ask: 10.8, pull: 45,
        ovr: { 2021: 76 },
        note: "Reborn in the playoffs as Mr. June." },
      { name: "Kelly Oubre", pos: "SF", age: 25, ask: 12.5, pull: 42,
        ovr: { 2021: 75 },
        note: "Tsunami Papi, energy included, shot selection extra." },
      { name: "Duncan Robinson", pos: "SG", age: 27, ask: 18.0, pull: 44,
        ovr: { 2021: 75 },
        note: "Division III to the Finals. Movement shooting pays." },
      { name: "Richaun Holmes", pos: "C", age: 27, ask: 11.0, pull: 40,
        ovr: { 2021: 76 },
        note: "Push shot, rim runs, honest work." }
    ]
  },

  draft: {
    2019: [
      { name: "Zion Williamson", pos: "PF", realPick: 1, age: 18, ovr: { 2019: 79, 2020: 88, 2021: 55 }, note: "Duke — a force of nature, knock on wood" },
      { name: "Ja Morant", pos: "PG", realPick: 2, age: 19, ovr: { 2019: 80, 2020: 85, 2021: 90 }, note: "Murray State — the whole highlight reel" },
      { name: "RJ Barrett", pos: "SG", realPick: 3, age: 19, ovr: { 2019: 72, 2020: 75, 2021: 79 }, note: "Duke — Mississauga's own, no pressure" },
      { name: "De'Andre Hunter", pos: "SF", realPick: 4, age: 21, ovr: { 2019: 72, 2020: 76, 2021: 74 }, note: "Virginia — title-game hero" },
      { name: "Darius Garland", pos: "PG", realPick: 5, age: 19, ovr: { 2019: 68, 2020: 75, 2021: 85 }, note: "Vanderbilt — five college games, silky anyway" },
      { name: "Coby White", pos: "PG", realPick: 7, age: 19, ovr: { 2019: 71, 2020: 73, 2021: 71 }, note: "North Carolina — instant offense, assembly required" },
      { name: "Rui Hachimura", pos: "PF", realPick: 9, age: 21, ovr: { 2019: 72, 2020: 73, 2021: 72 }, note: "Gonzaga — Japan's first first-rounder" },
      { name: "P.J. Washington", pos: "PF", realPick: 12, age: 20, ovr: { 2019: 72, 2020: 73, 2021: 73 }, note: "Kentucky — modern four, quietly solid" },
      { name: "Tyler Herro", pos: "SG", realPick: 13, age: 19, ovr: { 2019: 74, 2020: 75, 2021: 83 }, note: "Kentucky — the confidence arrives before he does" },
      { name: "Brandon Clarke", pos: "PF", realPick: 21, age: 22, ovr: { 2019: 74, 2020: 72, 2021: 71 }, note: "Gonzaga — analytics darling, short arms" },
      { name: "Keldon Johnson", pos: "SF", realPick: 29, age: 19, ovr: { 2019: 68, 2020: 75, 2021: 76 }, note: "Kentucky — plays like he's double-parked" },
      { name: "Nic Claxton", pos: "C", realPick: 31, age: 20, ovr: { 2019: 64, 2020: 69, 2021: 74 }, note: "Georgia — switches everything, weighs nothing" }
    ],
    2020: [
      { name: "Anthony Edwards", pos: "SG", realPick: 1, age: 19, ovr: { 2020: 76, 2021: 84 }, note: "Georgia — would rather be playing football, allegedly" },
      { name: "James Wiseman", pos: "C", realPick: 2, age: 19, ovr: { 2020: 68, 2021: 62 }, note: "Memphis — three college games, all tools" },
      { name: "LaMelo Ball", pos: "PG", realPick: 3, age: 19, ovr: { 2020: 80, 2021: 84 }, note: "Illawarra — sees passes that don't exist yet" },
      { name: "Patrick Williams", pos: "PF", realPick: 4, age: 19, ovr: { 2020: 70, 2021: 71 }, note: "Florida State — came off the bench in college" },
      { name: "Isaac Okoro", pos: "SF", realPick: 5, age: 19, ovr: { 2020: 68, 2021: 69 }, note: "Auburn — defense now, jumper someday" },
      { name: "Killian Hayes", pos: "PG", realPick: 7, age: 19, ovr: { 2020: 62, 2021: 64 }, note: "France — lefty mystery box" },
      { name: "Tyrese Haliburton", pos: "PG", realPick: 12, age: 20, ovr: { 2020: 78, 2021: 83 }, note: "Iowa State — funky jumper, flawless brain" },
      { name: "Cole Anthony", pos: "PG", realPick: 15, age: 20, ovr: { 2020: 69, 2021: 74 }, note: "North Carolina — bucket-getter bloodlines" },
      { name: "Saddiq Bey", pos: "SF", realPick: 19, age: 21, ovr: { 2020: 73, 2021: 73 }, note: "Villanova — ready-made 3-and-D" },
      { name: "Tyrese Maxey", pos: "PG", realPick: 21, age: 20, ovr: { 2020: 72, 2021: 80 }, note: "Kentucky — smiles, then blows by you" },
      { name: "Desmond Bane", pos: "SG", realPick: 30, age: 22, ovr: { 2020: 72, 2021: 81 }, note: "TCU — short arms, endless range" },
      { name: "Xavier Tillman", pos: "C", realPick: 35, age: 21, ovr: { 2020: 68, 2021: 70 }, note: "Michigan State — grown-man strength, team-first brain" }
    ],
    2021: [
      { name: "Cade Cunningham", pos: "PG", realPick: 1, age: 19, ovr: { 2021: 76 }, note: "Oklahoma State — the consensus No. 1" },
      { name: "Jalen Green", pos: "SG", realPick: 2, age: 19, ovr: { 2021: 74 }, note: "G League Ignite — liftoff scheduled nightly" },
      { name: "Evan Mobley", pos: "C", realPick: 3, age: 20, ovr: { 2021: 82 }, note: "USC — moves like a guard, blocks like a tower" },
      { name: "Scottie Barnes", pos: "PF", realPick: 4, age: 19, ovr: { 2021: 81 }, note: "Florida State — the grin, the wingspan, the everything" },
      { name: "Jalen Suggs", pos: "PG", realPick: 5, age: 20, ovr: { 2021: 68 }, note: "Gonzaga — hit the half-court shot you remember" },
      { name: "Josh Giddey", pos: "PG", realPick: 6, age: 18, ovr: { 2021: 75 }, note: "Adelaide — 18 going on triple-double" },
      { name: "Jonathan Kuminga", pos: "PF", realPick: 7, age: 18, ovr: { 2021: 69 }, note: "G League Ignite — raw power, rawer everything else" },
      { name: "Franz Wagner", pos: "SF", realPick: 8, age: 19, ovr: { 2021: 78 }, note: "Michigan — does everything a coach dreams about" },
      { name: "Alperen Şengün", pos: "C", realPick: 16, age: 19, ovr: { 2021: 74 }, note: "Turkey — league MVP at 18, footwork from 1965" },
      { name: "Trey Murphy III", pos: "SF", realPick: 17, age: 21, ovr: { 2021: 70 }, note: "Virginia — 50-40-90 frame and stroke" },
      { name: "Herbert Jones", pos: "SF", realPick: 35, age: 22, ovr: { 2021: 75 }, note: "Alabama — Not on Herb, as they say" }
    ]
  },

  gauntlet: {
    2019: [
      { team: "MIL", ovr: 95, conf: "E" }, { team: "PHI", ovr: 93, conf: "E" },
      { team: "GSW", ovr: 96, conf: "W" }, { team: "DEN", ovr: 92, conf: "W" }
    ],
    2020: [
      { team: "MIL", ovr: 96, conf: "E" }, { team: "BOS", ovr: 92, conf: "E" },
      { team: "LAL", ovr: 96, conf: "W" }, { team: "LAC", ovr: 95, conf: "W" }
    ],
    2021: [
      { team: "BKN", ovr: 96, conf: "E" }, { team: "MIL", ovr: 95, conf: "E" },
      { team: "PHX", ovr: 94, conf: "W" }, { team: "UTA", ovr: 94, conf: "W" }
    ],
    2022: [
      { team: "MIA", ovr: 92, conf: "E" }, { team: "BOS", ovr: 94, conf: "E" },
      { team: "GSW", ovr: 95, conf: "W" }, { team: "PHX", ovr: 96, conf: "W" }
    ]
  },

  events: [
    { year: 2018, text: "Kawhi Leonard played nine games last season. His camp and the Spurs' doctors tell different stories." },
    { year: 2018, text: "LeBron signs in Los Angeles. The East's doorman just quit." },
    { year: 2018, text: "Dwane Casey wins Coach of the Year, eleven days after being fired." },
    { year: 2019, text: "Durant ruptures an Achilles in the Finals. The max market shrugs and forms a line anyway." },
    { year: 2019, text: "Anthony Davis lands in Los Angeles for a fortune in picks. Stars move when they say they'll move." },
    { year: 2020, text: "The season stops in March and finishes in a bubble. Nobody's cap projections survived." },
    { year: 2021, text: "Miami keeps calling about veteran point guards with championship pedigrees." },
    { year: 2021, text: "DeMar DeRozan hits free agency this summer. The reunion fanfic writes itself." }
  ]
};

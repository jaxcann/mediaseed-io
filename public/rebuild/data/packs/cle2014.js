export default {
  id: "cle2014",
  title: "The Return",
  team: { id: "CLE", city: "Cleveland", name: "Cavaliers", colors: ["#860038", "#FDBB30"], conf: "E" },
  startYear: 2014,
  par: 3,
  difficulty: "Medium",
  realOutcome: "LeBron came home, and Andrew Wiggins became Kevin Love before he ever wore wine and gold. Two Finals trips later, Cleveland climbed out of a 3-1 hole against a 73-win Golden State — the block, the shot, the stop — and ended 52 years of waiting in June 2016.",
  baselineWins: 33,
  intro:
    "July 2014. Kyrie Irving is a 22-year-old All-Star on a 33-win team, the No. 1 pick just landed in your lap for the third time in four years, and a certain someone in Miami just opted out of his contract. Your phone is charged. Answer it.",
  tips: "The best recruiting pitch in franchise history is the area code. The second-best is the rookie you haven't fallen in love with yet.",

  cap: { 2014: 63.1, 2015: 70.0, 2016: 94.1, 2017: 99.1 },

  roster: [
    { name: "Kyrie Irving", pos: "PG", age: 22, sal: 7.1, ovr: { 2014: 88, 2015: 90, 2016: 91, 2017: 91 } },
    { name: "Dion Waiters", pos: "SG", age: 22, sal: 4.1, ovr: { 2014: 74, 2015: 73, 2016: 72, 2017: 70 } },
    { name: "Tristan Thompson", pos: "PF", age: 23, sal: 5.4, ovr: { 2014: 76, 2015: 77, 2016: 78, 2017: 79 } },
    { name: "Anderson Varejão", pos: "C", age: 31, sal: 9.7, ovr: { 2014: 78, 2015: 62, 2016: 64, 2017: 55 } },
    { name: "Matthew Dellavedova", pos: "PG", age: 23, sal: 0.8, ovr: { 2014: 70, 2015: 72, 2016: 73, 2017: 71 } },
    { name: "Joe Harris", pos: "SG", age: 22, sal: 0.9, ovr: { 2014: 64, 2015: 60, 2016: 71, 2017: 75 } },
    { name: "Anthony Bennett", pos: "PF", age: 21, sal: 5.6, ovr: { 2014: 62, 2015: 58, 2016: 52, 2017: 45 } },
    { name: "Jarrett Jack", pos: "PG", age: 30, sal: 6.3, ovr: { 2014: 74, 2015: 71, 2016: 60, 2017: 64 } },
    { name: "Brendan Haywood", pos: "C", age: 34, sal: 2.2, ovr: { 2014: 64, 2015: 52, 2016: 50, 2017: 50 } }
  ],

  picks: [{ year: 2014, slot: 1, via: "LOTTERY" }],

  offers: [
    {
      id: "bos-facilitates", team: "BOS", year: 2014, until: 2014,
      label: "Boston will absorb salary — for a price",
      give: ["Jarrett Jack", "Brendan Haywood"],
      get: { players: [], picks: [{ year: 2016, slot: 54, via: "BOS" }] }
    },
    {
      id: "nyk-smith-shump", team: "NYK", year: 2014, until: 2014,
      label: "New York wants a fresh start; you get two guards with baggage",
      give: ["Dion Waiters"],
      get: {
        players: [
          { name: "J.R. Smith", pos: "SG", age: 28, sal: 6.0, ovr: { 2014: 78, 2015: 76, 2016: 74, 2017: 70 } },
          { name: "Iman Shumpert", pos: "SG", age: 24, sal: 2.6, ovr: { 2014: 74, 2015: 73, 2016: 71, 2017: 68 } }
        ],
        picks: []
      }
    },
    {
      id: "bos-kyrie", team: "BOS", year: 2017, until: 2017,
      label: "Boston calls: your All-Star wants his own team",
      give: ["Kyrie Irving"],
      get: {
        players: [
          { name: "Isaiah Thomas", pos: "PG", age: 28, sal: 6.3, ovr: { 2017: 72 } },
          { name: "Jae Crowder", pos: "SF", age: 27, sal: 6.8, ovr: { 2017: 75 } },
          { name: "Ante Žižić", pos: "C", age: 20, sal: 1.6, ovr: { 2017: 64 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Kevin Love", team: "MIN", pos: "PF", age: 25, sal: 15.7,
      ovr: { 2014: 86, 2015: 85, 2016: 85, 2017: 84 },
      cost: 380, from: 2014, until: 2014,
      note: "Minnesota wants the #1 pick. Everyone knows which one." },
    { name: "Timofey Mozgov", team: "DEN", pos: "C", age: 28, sal: 4.7,
      ovr: { 2014: 76, 2015: 73, 2016: 68, 2017: 66 },
      cost: 80, from: 2014, until: 2014,
      note: "Denver's asking price: two first-rounders. For Mozgov. Stop laughing — rim protection is rim protection." },
    { name: "Kyle Korver", team: "ATL", pos: "SG", age: 35, sal: 5.2,
      ovr: { 2016: 76, 2017: 74 },
      cost: 60, from: 2016, until: 2016,
      note: "Atlanta is reshuffling. He's been over 40 percent from three since flip phones." },
    { name: "Channing Frye", team: "ORL", pos: "C", age: 32, sal: 8.2,
      ovr: { 2014: 73, 2015: 72, 2016: 72, 2017: 70 },
      cost: 40, from: 2015, until: 2016,
      note: "A center who spaces the floor, available for spare change. Playoff math loves him." },
    { name: "DeMarcus Cousins", team: "SAC", pos: "C", age: 23, sal: 14.7,
      ovr: { 2014: 88, 2015: 89, 2016: 89, 2017: 87 },
      cost: 420, from: 2014, until: 2016,
      note: "Sacramento always listens, then always hangs up." },
    { name: "Goran Dragić", team: "PHX", pos: "PG", age: 28, sal: 7.5,
      ovr: { 2014: 83, 2015: 82, 2016: 81, 2017: 80 },
      cost: 180, from: 2014, until: 2015,
      note: "Third Team All-NBA, unhappy with the timeshare." },
    { name: "Jimmy Butler", team: "CHI", pos: "SG", age: 25, sal: 17.5,
      ovr: { 2015: 88, 2016: 90, 2017: 90 },
      cost: 480, from: 2015, until: 2016,
      note: "The Bulls' front office is split on paying him." },
    { name: "George Hill", team: "IND", pos: "PG", age: 29, sal: 8.0,
      ovr: { 2014: 79, 2015: 80, 2016: 81, 2017: 79 },
      cost: 120, from: 2015, until: 2016,
      note: "Indiana is getting younger at the point." },
    { name: "Thaddeus Young", team: "PHI", pos: "PF", age: 26, sal: 9.4,
      ovr: { 2014: 77, 2015: 76, 2016: 77, 2017: 76 },
      cost: 110, from: 2014, until: 2014,
      note: "Philadelphia is tearing it down to the studs." },
    { name: "Paul George", team: "IND", pos: "SF", age: 27, sal: 19.5,
      ovr: { 2017: 89 },
      cost: 400, from: 2017, until: 2017,
      note: "Told Indiana he's leaving in a year. One season of a top-ten player, going once." },
    { name: "Eric Bledsoe", team: "PHX", pos: "PG", age: 27, sal: 14.5,
      ovr: { 2017: 83 },
      cost: 150, from: 2017, until: 2017,
      note: "Phoenix is rebuilding and he is not interested in waiting around for it." },
    { name: "P.J. Tucker", team: "TOR", pos: "PF", age: 32, sal: 5.3,
      ovr: { 2016: 74, 2017: 74 },
      cost: 40, from: 2017, until: 2017,
      note: "Guards ones through fives and owns more sneakers than your equipment room." }
  ],

  freeAgents: {
    2014: [
      { name: "LeBron James", pos: "SF", age: 29, ask: 20.7, pull: 60,
        ovr: { 2014: 96, 2015: 96, 2016: 97, 2017: 96 },
        note: "He grew up 40 minutes south. He's coming home. Don't overthink it." },
      { name: "Chris Bosh", pos: "C", age: 30, ask: 20.6, pull: 86,
        ovr: { 2014: 87, 2015: 84, 2016: 55, 2017: 50 },
        note: "Miami is moving heaven and earth to keep him." },
      { name: "Carmelo Anthony", pos: "SF", age: 30, ask: 22.5, pull: 84,
        ovr: { 2014: 87, 2015: 85, 2016: 83, 2017: 80 },
        note: "Taking meetings. Loves the max more than the fit." },
      { name: "Kyle Lowry", pos: "PG", age: 28, ask: 12.0, pull: 70,
        ovr: { 2014: 85, 2015: 87, 2016: 88, 2017: 85 },
        note: "Toronto's engine, finally getting respect." },
      { name: "Trevor Ariza", pos: "SF", age: 29, ask: 8.0, pull: 58,
        ovr: { 2014: 79, 2015: 78, 2016: 78, 2017: 76 },
        note: "3-and-D as it was meant to be." },
      { name: "Pau Gasol", pos: "C", age: 34, ask: 7.1, pull: 62,
        ovr: { 2014: 82, 2015: 81, 2016: 78, 2017: 76 },
        note: "Still elegant, wants meaningful basketball." },
      { name: "Mike Miller", pos: "SF", age: 34, ask: 2.7, pull: 40,
        ovr: { 2014: 68, 2015: 64, 2016: 60, 2017: 55 },
        note: "Shooters age gracefully. Knees don't." },
      { name: "Shawn Marion", pos: "SF", age: 36, ask: 1.4, pull: 45,
        ovr: { 2014: 71, 2015: 55, 2016: 50, 2017: 50 },
        note: "The Matrix, one last ride." }
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
        ovr: { 2015: 79, 2016: 78, 2017: 78 },
        note: "Finals-record shooting, elite wing defense." },
      { name: "David West", pos: "PF", age: 34, ask: 1.5, pull: 70,
        ovr: { 2015: 77, 2016: 75, 2017: 73 },
        note: "Turned down $12 million to chase a ring. Only leaves for a real winner." },
      { name: "Mo Williams", pos: "PG", age: 32, ask: 2.1, pull: 40,
        ovr: { 2015: 71, 2016: 65, 2017: 50 },
        note: "Knows the locker room. Knows where the light switches are." },
      { name: "Richard Jefferson", pos: "SF", age: 35, ask: 1.5, pull: 42,
        ovr: { 2015: 70, 2016: 69, 2017: 66 },
        note: "Everyone assumes he's finished. He has other plans." }
    ],
    2016: [
      { name: "Kevin Durant", pos: "SF", age: 27, ask: 26.5, pull: 92,
        ovr: { 2016: 96, 2017: 96 },
        note: "The Hamptons meetings are real. He wants to win NOW." },
      { name: "Al Horford", pos: "C", age: 30, ask: 26.5, pull: 76,
        ovr: { 2016: 85, 2017: 84 },
        note: "The connective tissue every contender wants." },
      { name: "Dwyane Wade", pos: "SG", age: 34, ask: 23.0, pull: 78,
        ovr: { 2016: 80, 2017: 76 },
        note: "Feuding with Miami's front office over respect. Has famous friends in Ohio." },
      { name: "Eric Gordon", pos: "SG", age: 27, ask: 13.0, pull: 45,
        ovr: { 2016: 78, 2017: 78 },
        note: "Sixth-man buckets, health permitting." },
      { name: "Marvin Williams", pos: "PF", age: 30, ask: 13.0, pull: 45,
        ovr: { 2016: 77, 2017: 74 },
        note: "Reinvented as a stretch four. The cap spike is making everyone rich." },
      { name: "Jamal Crawford", pos: "SG", age: 36, ask: 14.0, pull: 48,
        ovr: { 2016: 74, 2017: 72 },
        note: "Ageless bench scoring, allergic to defense." },
      { name: "Zaza Pachulia", pos: "C", age: 32, ask: 2.9, pull: 50,
        ovr: { 2016: 74, 2017: 72 },
        note: "Screens, charges, and championship timing." }
    ],
    2017: [
      { name: "Gordon Hayward", pos: "SF", age: 27, ask: 29.7, pull: 78,
        ovr: { 2017: 55 },
        note: "The full package: 22 a night, All-Star, only 27. What could go wrong on opening night?" },
      { name: "Paul Millsap", pos: "PF", age: 32, ask: 30.0, pull: 60,
        ovr: { 2017: 82 },
        note: "Denver is offering $30 million a year. That's the market now." },
      { name: "Derrick Rose", pos: "PG", age: 28, ask: 2.1, pull: 35,
        ovr: { 2017: 64 },
        note: "A former MVP at the minimum. There's always a catch at the minimum." },
      { name: "Jeff Green", pos: "PF", age: 30, ask: 2.3, pull: 40,
        ovr: { 2017: 74 },
        note: "The vet-minimum aisle occasionally stocks a real rotation player." },
      { name: "Dwyane Wade", pos: "SG", age: 35, ask: 2.3, pull: 55,
        ovr: { 2017: 74 },
        note: "Bought out in Chicago. The band could get back together." },
      { name: "Kentavious Caldwell-Pope", pos: "SG", age: 24, ask: 18.0, pull: 45,
        ovr: { 2017: 76 },
        note: "3-and-D wing, renting by the year." },
      { name: "José Calderón", pos: "PG", age: 35, ask: 2.3, pull: 30,
        ovr: { 2017: 64 },
        note: "Steady hands, courtesy of 2011." }
    ]
  },

  draft: {
    2014: [
      { name: "Andrew Wiggins", pos: "SF", realPick: 1, age: 19, ovr: { 2014: 75, 2015: 78, 2016: 79, 2017: 80 }, note: "Kansas — the anointed one, and Minnesota's dream trade chip" },
      { name: "Jabari Parker", pos: "PF", realPick: 2, age: 19, ovr: { 2014: 74, 2015: 71, 2016: 78, 2017: 75 }, note: "Duke — polished scorer" },
      { name: "Joel Embiid", pos: "C", realPick: 3, age: 20, ovr: { 2014: 55, 2015: 55, 2016: 87, 2017: 90 }, note: "Kansas — navicular fracture concerns" },
      { name: "Aaron Gordon", pos: "PF", realPick: 4, age: 18, ovr: { 2014: 70, 2015: 73, 2016: 76, 2017: 77 }, note: "Arizona — pogo-stick athlete" },
      { name: "Dante Exum", pos: "PG", realPick: 5, age: 18, ovr: { 2014: 68, 2015: 55, 2016: 66, 2017: 64 }, note: "Australia — mystery box" },
      { name: "Marcus Smart", pos: "PG", realPick: 6, age: 20, ovr: { 2014: 73, 2015: 75, 2016: 77, 2017: 78 }, note: "Oklahoma State — competitive maniac" },
      { name: "Julius Randle", pos: "PF", realPick: 7, age: 19, ovr: { 2014: 58, 2015: 76, 2016: 78, 2017: 79 }, note: "Kentucky — bully-ball forward" },
      { name: "Zach LaVine", pos: "SG", realPick: 13, age: 19, ovr: { 2014: 69, 2015: 74, 2016: 78, 2017: 80 }, note: "UCLA — trampolines for legs" },
      { name: "Jusuf Nurkić", pos: "C", realPick: 16, age: 19, ovr: { 2014: 72, 2015: 73, 2016: 76, 2017: 78 }, note: "Bosnia — bruising big" },
      { name: "Gary Harris", pos: "SG", realPick: 19, age: 19, ovr: { 2014: 65, 2015: 73, 2016: 77, 2017: 79 }, note: "Michigan State — two-way guard" },
      { name: "Clint Capela", pos: "C", realPick: 25, age: 20, ovr: { 2014: 62, 2015: 72, 2016: 78, 2017: 80 }, note: "Switzerland — raw vertical spacer" },
      { name: "Spencer Dinwiddie", pos: "PG", realPick: 38, age: 21, ovr: { 2014: 62, 2015: 65, 2016: 72, 2017: 74 }, note: "Colorado — coming off an ACL tear" },
      { name: "Nikola Jokić", pos: "C", realPick: 41, age: 19, ovr: { 2014: 70, 2015: 79, 2016: 85, 2017: 88 }, note: "Serbia — announced during a Taco Bell ad" }
    ],
    2015: [
      { name: "Karl-Anthony Towns", pos: "C", realPick: 1, age: 19, ovr: { 2015: 81, 2016: 85, 2017: 87 }, note: "Kentucky — franchise big" },
      { name: "D'Angelo Russell", pos: "PG", realPick: 2, age: 19, ovr: { 2015: 73, 2016: 76, 2017: 78 }, note: "Ohio State — ice in his veins, allegedly" },
      { name: "Jahlil Okafor", pos: "C", realPick: 3, age: 19, ovr: { 2015: 73, 2016: 70, 2017: 66 }, note: "Duke — throwback post game" },
      { name: "Kristaps Porziņģis", pos: "C", realPick: 4, age: 19, ovr: { 2015: 77, 2016: 81, 2017: 82 }, note: "Latvia — they're booing the pick in Brooklyn" },
      { name: "Mario Hezonja", pos: "SF", realPick: 5, age: 20, ovr: { 2015: 66, 2016: 65, 2017: 64 }, note: "Croatia — swagger merchant" },
      { name: "Emmanuel Mudiay", pos: "PG", realPick: 7, age: 19, ovr: { 2015: 68, 2016: 68, 2017: 67 }, note: "Congo via China — physical tools" },
      { name: "Justise Winslow", pos: "SF", realPick: 10, age: 19, ovr: { 2015: 72, 2016: 71, 2017: 72 }, note: "Duke — playoff-ready defense" },
      { name: "Myles Turner", pos: "C", realPick: 11, age: 19, ovr: { 2015: 72, 2016: 78, 2017: 79 }, note: "Texas — stretch-five prototype" },
      { name: "Devin Booker", pos: "SG", realPick: 13, age: 18, ovr: { 2015: 72, 2016: 79, 2017: 84 }, note: "Kentucky — the bench guy who can really shoot" },
      { name: "Terry Rozier", pos: "PG", realPick: 16, age: 21, ovr: { 2015: 64, 2016: 68, 2017: 71 }, note: "Louisville — pitbull guard" },
      { name: "Bobby Portis", pos: "PF", realPick: 22, age: 20, ovr: { 2015: 68, 2016: 71, 2017: 72 }, note: "Arkansas — plays angry" },
      { name: "Larry Nance Jr.", pos: "PF", realPick: 27, age: 22, ovr: { 2015: 68, 2016: 72, 2017: 73 }, note: "Wyoming — bloodline bounce" },
      { name: "Montrezl Harrell", pos: "C", realPick: 32, age: 21, ovr: { 2015: 66, 2016: 71, 2017: 74 }, note: "Louisville — plays furious" },
      { name: "Josh Richardson", pos: "SG", realPick: 40, age: 21, ovr: { 2015: 68, 2016: 74, 2017: 75 }, note: "Tennessee — sneaky two-way steal" },
      { name: "Norman Powell", pos: "SG", realPick: 46, age: 22, ovr: { 2015: 66, 2016: 71, 2017: 73 }, note: "UCLA — downhill force" }
    ],
    2016: [
      { name: "Ben Simmons", pos: "PF", realPick: 1, age: 19, ovr: { 2016: 55, 2017: 84 }, note: "LSU — generational passer, foot in a boot" },
      { name: "Brandon Ingram", pos: "SF", realPick: 2, age: 18, ovr: { 2016: 70, 2017: 76 }, note: "Duke — wiry scoring wing" },
      { name: "Jaylen Brown", pos: "SF", realPick: 3, age: 19, ovr: { 2016: 71, 2017: 75 }, note: "Cal — chess player with a 40-inch vertical" },
      { name: "Dragan Bender", pos: "PF", realPick: 4, age: 18, ovr: { 2016: 62, 2017: 63 }, note: "Croatia — the next big thing, they say" },
      { name: "Kris Dunn", pos: "PG", realPick: 5, age: 22, ovr: { 2016: 66, 2017: 65 }, note: "Providence — ready-now defender" },
      { name: "Buddy Hield", pos: "SG", realPick: 6, age: 23, ovr: { 2016: 70, 2017: 74 }, note: "Oklahoma — shooting, full stop" },
      { name: "Jamal Murray", pos: "PG", realPick: 7, age: 19, ovr: { 2016: 71, 2017: 76 }, note: "Kentucky — blue arrow" },
      { name: "Domantas Sabonis", pos: "PF", realPick: 11, age: 20, ovr: { 2016: 70, 2017: 74 }, note: "Gonzaga — the name rings a bell" },
      { name: "Caris LeVert", pos: "SG", realPick: 20, age: 21, ovr: { 2016: 68, 2017: 72 }, note: "Michigan — injury lottery ticket" },
      { name: "Pascal Siakam", pos: "PF", realPick: 27, age: 22, ovr: { 2016: 65, 2017: 71 }, note: "New Mexico State — motor that never idles" },
      { name: "Dejounte Murray", pos: "PG", realPick: 29, age: 19, ovr: { 2016: 64, 2017: 72 }, note: "Washington — long, raw, fearless" },
      { name: "Malcolm Brogdon", pos: "PG", realPick: 36, age: 23, ovr: { 2016: 74, 2017: 76 }, note: "Virginia — the President" }
    ],
    2017: [
      { name: "Markelle Fultz", pos: "PG", realPick: 1, age: 19, ovr: { 2017: 60 }, note: "Washington — the consensus can't-miss No. 1" },
      { name: "Lonzo Ball", pos: "PG", realPick: 2, age: 19, ovr: { 2017: 73 }, note: "UCLA — the father comes free with the son" },
      { name: "Jayson Tatum", pos: "SF", realPick: 3, age: 19, ovr: { 2017: 80 }, note: "Duke — footwork like a 10-year vet" },
      { name: "Josh Jackson", pos: "SF", realPick: 4, age: 20, ovr: { 2017: 68 }, note: "Kansas — athletic, combustible" },
      { name: "De'Aaron Fox", pos: "PG", realPick: 5, age: 19, ovr: { 2017: 73 }, note: "Kentucky — fastest man in the gym, any gym" },
      { name: "Jonathan Isaac", pos: "PF", realPick: 6, age: 19, ovr: { 2017: 66 }, note: "Florida State — pterodactyl defense" },
      { name: "Lauri Markkanen", pos: "PF", realPick: 7, age: 20, ovr: { 2017: 75 }, note: "Arizona — seven feet of jumper" },
      { name: "Donovan Mitchell", pos: "SG", realPick: 13, age: 20, ovr: { 2017: 83 }, note: "Louisville — combine wingspan, workout legend" },
      { name: "Bam Adebayo", pos: "C", realPick: 14, age: 19, ovr: { 2017: 74 }, note: "Kentucky — switchable everything" },
      { name: "John Collins", pos: "PF", realPick: 19, age: 19, ovr: { 2017: 76 }, note: "Wake Forest — lob city, population one" },
      { name: "OG Anunoby", pos: "SF", realPick: 23, age: 19, ovr: { 2017: 72 }, note: "Indiana — sliding on a torn ACL" },
      { name: "Kyle Kuzma", pos: "PF", realPick: 27, age: 21, ovr: { 2017: 78 }, note: "Utah — chip on both shoulders" },
      { name: "Derrick White", pos: "PG", realPick: 29, age: 22, ovr: { 2017: 66 }, note: "Colorado — Division II to first round" },
      { name: "Dillon Brooks", pos: "SF", realPick: 45, age: 21, ovr: { 2017: 72 }, note: "Oregon — villain arc pending" }
    ]
  },

  gauntlet: {
    2015: [
      { team: "ATL", ovr: 91, conf: "E" }, { team: "CHI", ovr: 92, conf: "E" },
      { team: "GSW", ovr: 96, conf: "W" }, { team: "SAS", ovr: 93, conf: "W" }
    ],
    2016: [
      { team: "TOR", ovr: 91, conf: "E" }, { team: "MIA", ovr: 90, conf: "E" },
      { team: "GSW", ovr: 98, conf: "W" }, { team: "SAS", ovr: 95, conf: "W" },
      { team: "OKC", ovr: 94, conf: "W" }
    ],
    2017: [
      { team: "BOS", ovr: 92, conf: "E" }, { team: "TOR", ovr: 91, conf: "E" },
      { team: "GSW", ovr: 99, conf: "W", unless: { name: "Kevin Durant", then: 94 } },
      { team: "SAS", ovr: 94, conf: "W" }
    ],
    2018: [
      { team: "BOS", ovr: 92, conf: "E" }, { team: "TOR", ovr: 93, conf: "E" },
      { team: "PHI", ovr: 90, conf: "E" },
      { team: "GSW", ovr: 98, conf: "W" }, { team: "HOU", ovr: 96, conf: "W" }
    ]
  },

  events: [
    { year: 2014, text: "A four-time MVP just opted out of his contract in Miami. His hometown is 40 minutes from your arena." },
    { year: 2014, text: "Minnesota insists the No. 1 pick isn't enough for Kevin Love. Minnesota keeps calling back anyway." },
    { year: 2015, text: "Golden State won 67 games shooting threes. Half the league still calls it a gimmick." },
    { year: 2015, text: "The vet-minimum market is full of ring-chasers this summer. Contenders shop there first." },
    { year: 2016, text: "The cap explodes to $94M. Durant's camp is booking a house in the Hamptons." },
    { year: 2017, text: "A star guard in the East has asked for a trade. Front offices are refreshing their phones." },
    { year: 2017, text: "Chris Paul forced his way to Houston. Superteams are in fashion again." }
  ]
};

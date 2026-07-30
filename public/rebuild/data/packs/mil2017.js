export default {
  id: "mil2017",
  title: "Fear the Deer",
  team: { id: "MIL", city: "Milwaukee", name: "Bucks", colors: ["#00471B", "#EEE1C6"], conf: "E" },
  startYear: 2017,
  par: 4,
  difficulty: "Hard",
  realOutcome:
    "The Bucks built it patiently — Bledsoe for Monroe, Budenholzer's five-out machine, Brook Lopez heisted for $3.4 million — then emptied the vault for Jrue Holiday. Middleton hit the shots, Giannis blocked Ayton and dropped 50 in the closeout, and the 2021 banner ended a 50-year wait. Year four, exactly.",
  baselineWins: 42,
  intro:
    "July 2017. Giannis Antetokounmpo just won Most Improved Player and told anyone who'd listen that he's coming for everything else. Around him: an expiring Greg Monroe, a twice-torn Jabari Parker, and the Thon Maker experiment. Something enormous is happening in Milwaukee — if you can build a real team around it in four years.",
  tips: "Phoenix's unhappy point guard is step one. The best center on the 2018 market will cost less than your video coordinator — and when New Orleans calls in 2020, empty the vault without blinking.",

  cap: { 2017: 99.1, 2018: 101.9, 2019: 109.1, 2020: 109.1 },

  roster: [
    { name: "Giannis Antetokounmpo", pos: "PF", age: 22, sal: 22.5, ovr: { 2017: 91, 2018: 94, 2019: 96, 2020: 96 } },
    { name: "Khris Middleton", pos: "SF", age: 25, sal: 14.1, ovr: { 2017: 82, 2018: 84, 2019: 86, 2020: 86 } },
    { name: "Malcolm Brogdon", pos: "PG", age: 24, sal: 1.3, ovr: { 2017: 76, 2018: 78, 2019: 79, 2020: 80 },
      note: "The President. Quad, plantar fascia — the body's invoices arrive every spring." },
    { name: "Jabari Parker", pos: "PF", age: 22, sal: 6.8, ovr: { 2017: 78, 2018: 75, 2019: 71, 2020: 65 },
      note: "Two ACLs. 'They don't pay players to play defense.'" },
    { name: "Greg Monroe", pos: "C", age: 27, sal: 17.9, ovr: { 2017: 79, 2018: 74, 2019: 70, 2020: 62 },
      note: "Skilled hands, expiring money. His best use might be leaving." },
    { name: "Tony Snell", pos: "SG", age: 25, sal: 10.6, ovr: { 2017: 74, 2018: 72, 2019: 70, 2020: 67 } },
    { name: "Matthew Dellavedova", pos: "PG", age: 26, sal: 9.6, ovr: { 2017: 70, 2018: 67, 2019: 64, 2020: 60 } },
    { name: "John Henson", pos: "C", age: 26, sal: 10.2, ovr: { 2017: 74, 2018: 72, 2019: 66, 2020: 60 } },
    { name: "Mirza Teletović", pos: "PF", age: 31, sal: 10.5, ovr: { 2017: 70, 2018: 55, 2019: 55, 2020: 55 } },
    { name: "Thon Maker", pos: "C", age: 20, sal: 2.6, ovr: { 2017: 62, 2018: 62, 2019: 62, 2020: 60 },
      note: "The future, allegedly." },
    { name: "D.J. Wilson", pos: "PF", age: 21, sal: 2.3, ovr: { 2017: 55, 2018: 58, 2019: 63, 2020: 61 },
      note: "The 17th pick. Michigan liked him more than the league will." }
  ],

  picks: [],

  offers: [
    {
      id: "phx-bledsoe", team: "PHX", year: 2017, until: 2017,
      label: "Phoenix's point guard doesn't wanna be here",
      give: ["Greg Monroe"],
      get: {
        players: [
          { name: "Eric Bledsoe", pos: "PG", age: 27, sal: 14.5, ovr: { 2017: 82, 2018: 82, 2019: 81, 2020: 79 } }
        ],
        picks: []
      }
    },
    {
      id: "nop-jrue", team: "NOP", year: 2020, until: 2020,
      label: "New Orleans wants your whole vault for Jrue Holiday",
      give: ["Malcolm Brogdon", "Tony Snell", "D.J. Wilson"],
      get: {
        players: [
          { name: "Jrue Holiday", pos: "PG", age: 30, sal: 25.9, ovr: { 2020: 85, 2021: 85 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Kyrie Irving", team: "CLE", pos: "PG", age: 25, sal: 18.9,
      ovr: { 2017: 92, 2018: 91, 2019: 88, 2020: 86 },
      cost: 450, from: 2017, until: 2017,
      note: "Wants out of LeBron's shadow. Cleveland wants a war chest back." },
    { name: "Paul George", team: "IND", pos: "SF", age: 27, sal: 19.5,
      ovr: { 2017: 89, 2018: 92, 2019: 88, 2020: 88 },
      cost: 380, from: 2017, until: 2017,
      note: "One year from free agency and everybody knows where he's looking." },
    { name: "Kawhi Leonard", team: "SAS", pos: "SF", age: 27, sal: 20.1,
      ovr: { 2017: 60, 2018: 94, 2019: 96, 2020: 95 },
      cost: 400, from: 2018, until: 2018,
      note: "Nine games last season and a group that wants out of San Antonio. The risk is the discount." },
    { name: "Jimmy Butler", team: "MIN", pos: "SG", age: 29, sal: 20.4,
      ovr: { 2017: 89, 2018: 89, 2019: 88, 2020: 88 },
      cost: 350, from: 2018, until: 2018,
      note: "Beat the starters with the third string, then left practice. Minnesota is exhausted." },
    { name: "Marc Gasol", team: "MEM", pos: "C", age: 33, sal: 24.1,
      ovr: { 2017: 84, 2018: 82, 2019: 77, 2020: 74 },
      cost: 170, from: 2018, until: 2018,
      note: "Memphis is finally saying the word 'rebuild' out loud." },
    { name: "Mike Conley", team: "MEM", pos: "PG", age: 31, sal: 30.5,
      ovr: { 2017: 60, 2018: 84, 2019: 80, 2020: 80 },
      cost: 200, from: 2018, until: 2019,
      note: "Missed nearly a full year with the heel. The contract scares everyone off." },
    { name: "George Hill", team: "CLE", pos: "PG", age: 32, sal: 19.0,
      ovr: { 2017: 78, 2018: 76, 2019: 77, 2020: 76 },
      cost: 90, from: 2018, until: 2018,
      note: "Cleveland is shedding salary. A grown-up guard for the second unit." },
    { name: "Nikola Mirotić", team: "NOP", pos: "PF", age: 27, sal: 12.5,
      ovr: { 2017: 78, 2018: 79, 2019: 55, 2020: 55 },
      cost: 110, from: 2018, until: 2018,
      note: "A stretch four on an expiring deal. Rentals don't always renew." },
    { name: "Malik Beasley", team: "DEN", pos: "SG", age: 23, sal: 2.7,
      ovr: { 2017: 62, 2018: 70, 2019: 76, 2020: 75 },
      cost: 45, from: 2019, until: 2019,
      note: "Buried on Denver's wing depth chart. Shooting doesn't stay cheap for long." },
    { name: "Kevin Love", team: "CLE", pos: "PF", age: 31, sal: 28.9,
      ovr: { 2017: 84, 2018: 80, 2019: 77, 2020: 76 },
      cost: 240, from: 2019, until: 2020,
      note: "The name outweighs the knees and the contract. Cleveland keeps calling." },
    { name: "Bogdan Bogdanović", team: "SAC", pos: "SG", age: 28, sal: 8.5,
      ovr: { 2017: 74, 2018: 76, 2019: 78, 2020: 78 },
      cost: 130, from: 2020, until: 2020,
      note: "Sacramento will listen. Just don't call before the moratorium lifts." },
    { name: "P.J. Tucker", team: "HOU", pos: "PF", age: 35, sal: 8.0,
      ovr: { 2019: 74, 2020: 73 },
      cost: 50, from: 2020, until: 2020,
      note: "Championship muscle at a deadline price. Guards centers, shoots corners only." }
  ],

  freeAgents: {
    2017: [
      { name: "Gordon Hayward", pos: "SF", age: 27, ask: 29.7, pull: 80,
        ovr: { 2017: 55, 2018: 80, 2019: 80, 2020: 80 }, note: "Down to Boston, Miami, and home. Fragile timing everywhere." },
      { name: "Kyle Lowry", pos: "PG", age: 31, ask: 33.3, pull: 85,
        ovr: { 2017: 86, 2018: 84, 2019: 85, 2020: 84 }, note: "Toronto is backing up the truck to keep him." },
      { name: "Paul Millsap", pos: "PF", age: 32, ask: 30.0, pull: 64,
        ovr: { 2017: 82, 2018: 80, 2019: 79, 2020: 76 }, note: "The quietest max-money forward alive." },
      { name: "JJ Redick", pos: "SG", age: 33, ask: 23.0, pull: 54,
        ovr: { 2017: 78, 2018: 78, 2019: 76, 2020: 72 }, note: "One year, shooter's rates. The market is drunk." },
      { name: "P.J. Tucker", pos: "PF", age: 32, ask: 8.0, pull: 50,
        ovr: { 2017: 74, 2018: 75, 2019: 74, 2020: 73 }, note: "Corner threes and a linebacker's shoulders." },
      { name: "Taj Gibson", pos: "PF", age: 32, ask: 14.0, pull: 44,
        ovr: { 2017: 75, 2018: 74, 2019: 72, 2020: 70 }, note: "Thibodeau minutes, honest work." },
      { name: "Dion Waiters", pos: "SG", age: 25, ask: 13.0, pull: 40,
        ovr: { 2017: 72, 2018: 60, 2019: 65, 2020: 60 }, note: "Waiters Island had one good tourist season." }
    ],
    2018: [
      { name: "LeBron James", pos: "SF", age: 33, ask: 35.7, pull: 94,
        ovr: { 2017: 96, 2018: 95, 2019: 93, 2020: 95 }, note: "The decision this time involves Hollywood." },
      { name: "Chris Paul", pos: "PG", age: 33, ask: 35.7, pull: 82,
        ovr: { 2017: 88, 2018: 86, 2019: 84, 2020: 85 }, note: "Houston will pay him to 40. Probably shouldn't." },
      { name: "Brook Lopez", pos: "C", age: 30, ask: 3.4, pull: 45,
        ovr: { 2017: 78, 2018: 79, 2019: 81, 2020: 80 }, note: "$3.4 million. Read it again. A seven-footer who shoots threes and swats everything." },
      { name: "Ersan Ilyasova", pos: "PF", age: 31, ask: 7.0, pull: 38,
        ovr: { 2017: 74, 2018: 74, 2019: 71, 2020: 60 }, note: "Charges taken, corners spaced, no drama." },
      { name: "DeAndre Jordan", pos: "C", age: 30, ask: 22.9, pull: 55,
        ovr: { 2017: 80, 2018: 76, 2019: 74, 2020: 72 }, note: "The lobs are aging faster than the contract will." },
      { name: "Trevor Ariza", pos: "SF", age: 33, ask: 15.0, pull: 48,
        ovr: { 2017: 77, 2018: 74, 2019: 72, 2020: 70 }, note: "Phoenix is about to overpay for a culture guy." },
      { name: "Tyreke Evans", pos: "SG", age: 28, ask: 12.0, pull: 40,
        ovr: { 2017: 78, 2018: 74, 2019: 55, 2020: 55 }, note: "One great comeback year in Memphis. Buyer beware." },
      { name: "Rajon Rondo", pos: "PG", age: 32, ask: 9.0, pull: 42,
        ovr: { 2017: 74, 2018: 73, 2019: 72, 2020: 72 }, note: "Playoff Rondo is real. Regular-season Rondo also is." }
    ],
    2019: [
      { name: "Kawhi Leonard", pos: "SF", age: 28, ask: 32.7, pull: 88,
        ovr: { 2019: 96, 2020: 95 }, note: "Fresh off a title parade in Toronto. Wants home, wants a co-star." },
      { name: "Kevin Durant", pos: "SF", age: 30, ask: 38.2, pull: 87,
        ovr: { 2019: 55, 2020: 94 }, note: "The Achilles means year one is a redshirt. Teams are lining up anyway." },
      { name: "Kyrie Irving", pos: "PG", age: 27, ask: 33.0, pull: 80,
        ovr: { 2019: 88, 2020: 86 }, note: "Brilliant. Complicated. Brooklyn-bound, most likely." },
      { name: "Kemba Walker", pos: "PG", age: 29, ask: 32.7, pull: 72,
        ovr: { 2019: 85, 2020: 80 }, note: "Charlotte wouldn't max him. Someone will." },
      { name: "Al Horford", pos: "C", age: 33, ask: 28.0, pull: 66,
        ovr: { 2019: 82, 2020: 79 }, note: "Connective tissue, now with mileage." },
      { name: "Bojan Bogdanović", pos: "SF", age: 30, ask: 17.0, pull: 60,
        ovr: { 2019: 80, 2020: 79 }, note: "Twenty a night in Indiana and still underrated." }
    ],
    2020: [
      { name: "Fred VanVleet", pos: "PG", age: 26, ask: 21.3, pull: 68,
        ovr: { 2020: 82 }, note: "Bet on himself and won. Now collecting." },
      { name: "Gordon Hayward", pos: "SF", age: 30, ask: 30.0, pull: 58,
        ovr: { 2020: 80 }, note: "Opting out. Charlotte money is chasing him." },
      { name: "Danilo Gallinari", pos: "PF", age: 32, ask: 19.5, pull: 52,
        ovr: { 2020: 78 }, note: "Elite shooting, load-managed knees." },
      { name: "Serge Ibaka", pos: "C", age: 31, ask: 9.3, pull: 55,
        ovr: { 2020: 77 }, note: "Champion big, scarf collection included." },
      { name: "Goran Dragić", pos: "PG", age: 34, ask: 18.0, pull: 56,
        ovr: { 2020: 77 }, note: "Just dragged Miami to the Finals. Loyal to it." },
      { name: "Jae Crowder", pos: "PF", age: 30, ask: 9.7, pull: 50,
        ovr: { 2020: 75 }, note: "Playoff-proof forward, bulk threes." },
      { name: "Wesley Matthews", pos: "SG", age: 34, ask: 2.6, pull: 35,
        ovr: { 2020: 72 }, note: "Professional wing defense at the minimum." }
    ]
  },

  draft: {
    2018: [
      { name: "Deandre Ayton", pos: "C", realPick: 1, age: 19, ovr: { 2018: 79, 2019: 81, 2020: 81 }, note: "Arizona — 7'1\" of everything but rim protection" },
      { name: "Marvin Bagley III", pos: "PF", realPick: 2, age: 19, ovr: { 2018: 74, 2019: 72, 2020: 68 }, note: "Duke — relentless around the rim, allergic to defense" },
      { name: "Luka Dončić", pos: "PG", realPick: 3, age: 19, ovr: { 2018: 83, 2019: 90, 2020: 93 }, note: "Real Madrid — EuroLeague MVP at 19. Some scouts still shrug." },
      { name: "Jaren Jackson Jr.", pos: "PF", realPick: 4, age: 18, ovr: { 2018: 76, 2019: 80, 2020: 60 }, note: "Michigan State — blocks and threes, barely 18" },
      { name: "Trae Young", pos: "PG", realPick: 5, age: 19, ovr: { 2018: 76, 2019: 85, 2020: 87 }, note: "Oklahoma — logo range, cardio-test defense" },
      { name: "Kevin Knox", pos: "SF", realPick: 9, age: 18, ovr: { 2018: 64, 2019: 62, 2020: 60 }, note: "Kentucky — looks the part" },
      { name: "Mikal Bridges", pos: "SF", realPick: 10, age: 21, ovr: { 2018: 72, 2019: 76, 2020: 79 }, note: "Villanova — champion glue wing" },
      { name: "Shai Gilgeous-Alexander", pos: "PG", realPick: 11, age: 19, ovr: { 2018: 74, 2019: 82, 2020: 86 }, note: "Kentucky — long, slippery, never hurried" },
      { name: "Michael Porter Jr.", pos: "SF", realPick: 14, age: 19, ovr: { 2018: 55, 2019: 75, 2020: 80 }, note: "Missouri — top-pick talent, surgeon's notes" },
      { name: "Donte DiVincenzo", pos: "SG", realPick: 17, age: 21, ovr: { 2018: 66, 2019: 74, 2020: 77 }, note: "Villanova — 31 in the national title game" },
      { name: "Jalen Brunson", pos: "PG", realPick: 33, age: 21, ovr: { 2018: 71, 2019: 74, 2020: 76 }, note: "Villanova — coach's son, wins everywhere he goes" },
      { name: "Bruce Brown", pos: "SG", realPick: 42, age: 21, ovr: { 2018: 67, 2019: 70, 2020: 74 }, note: "Miami — guards everyone, position TBD" }
    ],
    2019: [
      { name: "Zion Williamson", pos: "PF", realPick: 1, age: 19, ovr: { 2019: 82, 2020: 87 }, note: "Duke — a force of nature at 285" },
      { name: "Ja Morant", pos: "PG", realPick: 2, age: 19, ovr: { 2019: 80, 2020: 84 }, note: "Murray State — human highlight film" },
      { name: "RJ Barrett", pos: "SG", realPick: 3, age: 19, ovr: { 2019: 70, 2020: 74 }, note: "Duke — the other Duke guy" },
      { name: "Darius Garland", pos: "PG", realPick: 5, age: 19, ovr: { 2019: 68, 2020: 78 }, note: "Vanderbilt — five college games, pure guard" },
      { name: "Coby White", pos: "PG", realPick: 7, age: 19, ovr: { 2019: 68, 2020: 72 }, note: "UNC — plays at one speed: fast" },
      { name: "Tyler Herro", pos: "SG", realPick: 13, age: 19, ovr: { 2019: 75, 2020: 76 }, note: "Kentucky — no conscience, in the good way" },
      { name: "Brandon Clarke", pos: "PF", realPick: 21, age: 22, ovr: { 2019: 74, 2020: 73 }, note: "Gonzaga — old for the class, wins anyway" },
      { name: "Keldon Johnson", pos: "SF", realPick: 29, age: 19, ovr: { 2019: 68, 2020: 75 }, note: "Kentucky — downhill and mean" },
      { name: "Nic Claxton", pos: "C", realPick: 31, age: 20, ovr: { 2019: 62, 2020: 68 }, note: "Georgia — skinny, switchy, secretly modern" },
      { name: "Terance Mann", pos: "SG", realPick: 48, age: 22, ovr: { 2019: 63, 2020: 70 }, note: "Florida State — glue in waiting" }
    ],
    2020: [
      { name: "Anthony Edwards", pos: "SG", realPick: 1, age: 19, ovr: { 2020: 74 }, note: "Georgia — shot selection sold separately" },
      { name: "James Wiseman", pos: "C", realPick: 2, age: 19, ovr: { 2020: 67 }, note: "Memphis — three college games" },
      { name: "LaMelo Ball", pos: "PG", realPick: 3, age: 19, ovr: { 2020: 79 }, note: "Illawarra — sees passes nobody else does" },
      { name: "Isaac Okoro", pos: "SF", realPick: 5, age: 19, ovr: { 2020: 68 }, note: "Auburn — defense first, second, and third" },
      { name: "Deni Avdija", pos: "SF", realPick: 9, age: 19, ovr: { 2020: 66 }, note: "Israel — polished wing, patient game" },
      { name: "Devin Vassell", pos: "SG", realPick: 11, age: 20, ovr: { 2020: 69 }, note: "Florida State — 3-and-D prototype" },
      { name: "Tyrese Haliburton", pos: "PG", realPick: 12, age: 20, ovr: { 2020: 78 }, note: "Iowa State — funky shot, flawless brain" },
      { name: "Precious Achiuwa", pos: "PF", realPick: 20, age: 20, ovr: { 2020: 66 }, note: "Memphis — energy in bulk" },
      { name: "Tyrese Maxey", pos: "PG", realPick: 21, age: 19, ovr: { 2020: 71 }, note: "Kentucky — smiles, then blows by you" },
      { name: "Desmond Bane", pos: "SG", realPick: 30, age: 22, ovr: { 2020: 72 }, note: "TCU — short arms, pure stroke" },
      { name: "Jordan Nwora", pos: "SF", realPick: 45, age: 21, ovr: { 2020: 63 }, note: "Louisville — buckets in bulk, defense on backorder" }
    ]
  },

  gauntlet: {
    2018: [
      { team: "CLE", ovr: 93, conf: "E" }, { team: "BOS", ovr: 92, conf: "E" },
      { team: "GSW", ovr: 98, conf: "W" }, { team: "HOU", ovr: 96, conf: "W" }
    ],
    2019: [
      { team: "TOR", ovr: 95, conf: "E" }, { team: "PHI", ovr: 93, conf: "E" },
      { team: "GSW", ovr: 96, conf: "W" }, { team: "DEN", ovr: 92, conf: "W" }
    ],
    2020: [
      { team: "TOR", ovr: 93, conf: "E" }, { team: "MIA", ovr: 92, conf: "E" },
      { team: "LAL", ovr: 96, conf: "W" }, { team: "LAC", ovr: 95, conf: "W" }
    ],
    2021: [
      { team: "BKN", ovr: 96, conf: "E" }, { team: "PHI", ovr: 93, conf: "E" },
      { team: "PHX", ovr: 94, conf: "W" }, { team: "LAL", ovr: 94, conf: "W" }
    ]
  },

  events: [
    { year: 2017, text: "Eric Bledsoe tweets 'I Dont wanna be here.' He claims he meant a hair salon. Phoenix is taking calls." },
    { year: 2017, text: "Jason Kidd wants Giannis running point. Giannis wants to be MVP. One of these plans will survive." },
    { year: 2018, text: "Mike Budenholzer arrives preaching five-out spacing. Now he needs a center who can shoot." },
    { year: 2018, text: "It's late July and the best rim protector on the market still hasn't gotten a phone call." },
    { year: 2019, text: "Kawhi Leonard goes west. The East is suddenly wide open." },
    { year: 2019, text: "Indiana is circling Malcolm Brogdon's restricted free agency with $85 million." },
    { year: 2020, text: "New Orleans will move Jrue Holiday — for a price that empties a drawer of picks." },
    { year: 2020, text: "Giannis is supermax-eligible. He's watching what you do next before he signs anything." }
  ]
};

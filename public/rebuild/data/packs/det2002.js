export default {
  id: "det2002",
  title: "Goin' to Work",
  team: { id: "DET", city: "Detroit", name: "Pistons", colors: ["#C8102E", "#1D42BA"], conf: "E" },
  startYear: 2002,
  par: 4,
  difficulty: "Medium",
  realOutcome: "Joe Dumars signed the point guard nobody wanted, stole Rasheed at the 2004 deadline, and shocked the Shaq-Kobe Lakers in five. He also took Darko second. Both things are true.",
  baselineWins: 50,
  intro:
    "July 2002. Joe Dumars just flipped Jerry Stackhouse for Rip Hamilton and half the league thinks he lost the trade. Ben Wallace anchors the nastiest defense in basketball, a rookie named Tayshaun is buried on the depth chart, and Minnesota's backup point guard is looking for his sixth team in six years. Nobody builds a champion without a superstar. You're about to find out if nobody is wrong.",
  tips: "The best free agent this summer is the one nobody else calls back. And next June, trust the college tape over the workout tape.",

  cap: { 2002: 40.3, 2003: 43.8, 2004: 43.9, 2005: 49.5 },

  roster: [
    { name: "Ben Wallace", pos: "C", age: 27, sal: 5.5, ovr: { 2002: 87, 2003: 88, 2004: 87, 2005: 86 } },
    { name: "Richard Hamilton", pos: "SG", age: 24, sal: 3.5, ovr: { 2002: 82, 2003: 84, 2004: 85, 2005: 85 } },
    { name: "Corliss Williamson", pos: "PF", age: 28, sal: 4.6, ovr: { 2002: 78, 2003: 76, 2004: 74, 2005: 71 } },
    { name: "Clifford Robinson", pos: "PF", age: 35, sal: 7.0, ovr: { 2002: 76, 2003: 74, 2004: 72, 2005: 68 } },
    { name: "Tayshaun Prince", pos: "SF", age: 22, sal: 1.3, ovr: { 2002: 70, 2003: 78, 2004: 81, 2005: 82 } },
    { name: "Chucky Atkins", pos: "PG", age: 28, sal: 3.5, ovr: { 2002: 74, 2003: 73, 2004: 72, 2005: 70 } },
    { name: "Mehmet Okur", pos: "C", age: 23, sal: 0.6, ovr: { 2002: 72, 2003: 75, 2004: 78, 2005: 80 } },
    { name: "Jon Barry", pos: "SG", age: 33, sal: 2.9, ovr: { 2002: 73, 2003: 71, 2004: 69, 2005: 66 } },
    { name: "Zeljko Rebraca", pos: "C", age: 30, sal: 2.5, ovr: { 2002: 71, 2003: 68, 2004: 66, 2005: 62 } },
    { name: "Michael Curry", pos: "SF", age: 33, sal: 2.4, ovr: { 2002: 66, 2003: 64, 2004: 62, 2005: 60 } }
  ],

  picks: [
    { year: 2003, slot: 2, via: "MEM" }
  ],

  offers: [
    {
      id: "gsw-cliffy", team: "GSW", year: 2003, until: 2003,
      label: "Golden State calls about Uncle Cliffy",
      give: ["Clifford Robinson"],
      get: {
        players: [
          { name: "Bob Sura", pos: "SG", age: 30, sal: 3.6, ovr: { 2003: 72, 2004: 70, 2005: 66 } }
        ],
        picks: []
      }
    },
    {
      id: "den-barry", team: "DEN", year: 2002, until: 2003,
      label: "Denver wants veteran shooting for its rebuild",
      give: ["Jon Barry"],
      get: {
        players: [],
        picks: [{ year: 2004, slot: 46, via: "DEN" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Rasheed Wallace", team: "POR", pos: "PF", age: 28, sal: 17.0,
      ovr: { 2002: 86, 2003: 86, 2004: 85, 2005: 83 },
      cost: 180, from: 2003, until: 2004, direction: "retooling",
      note: "Portland is exhausted. A max talent for pennies on the dollar, tantrums included." },
    { name: "Allen Iverson", team: "PHI", pos: "PG", age: 27, sal: 12.0,
      ovr: { 2002: 90, 2003: 88, 2004: 88, 2005: 87 },
      cost: 400, from: 2002, until: 2005, direction: "retooling",
      note: "Pound for pound the most expensive practice-skipper alive." },
    { name: "Pau Gasol", team: "MEM", pos: "PF", age: 22, sal: 4.5,
      ovr: { 2002: 82, 2003: 84, 2004: 85, 2005: 86 },
      cost: 380, from: 2002, until: 2005, direction: "retooling",
      note: "Memphis isn't trading the franchise. Everyone has a number." },
    { name: "Vince Carter", team: "TOR", pos: "SG", age: 27, sal: 13.3,
      ovr: { 2004: 87, 2005: 86 },
      cost: 260, from: 2004, until: 2004, direction: "retooling",
      note: "Half-man, half-out-the-door in Toronto." },
    { name: "Baron Davis", team: "NOH", pos: "PG", age: 25, sal: 11.3,
      ovr: { 2003: 85, 2004: 82, 2005: 84 },
      cost: 240, from: 2003, until: 2004, direction: "retooling",
      note: "All-Star talent, cranky back, crankier relationship with management." },
    { name: "Antawn Jamison", team: "GSW", pos: "PF", age: 26, sal: 12.0,
      ovr: { 2002: 82, 2003: 82, 2004: 81, 2005: 82 },
      cost: 180, from: 2002, until: 2003, direction: "retooling",
      note: "20 and 8 in total obscurity. Golden State will talk." },
    { name: "Zach Randolph", team: "POR", pos: "PF", age: 22, sal: 2.0,
      ovr: { 2003: 83, 2004: 82, 2005: 80 },
      cost: 190, from: 2003, until: 2005, direction: "retooling",
      note: "20 and 10, with fine print. Part of Portland's everything-must-go sale." },
    { name: "Shareef Abdur-Rahim", team: "ATL", pos: "PF", age: 25, sal: 13.0,
      ovr: { 2002: 81, 2003: 79, 2004: 77, 2005: 77 },
      cost: 160, from: 2002, until: 2003, direction: "retooling",
      note: "Career 20 a game, career zero playoff games. Atlanta shrugs." },
    { name: "Jamal Crawford", team: "CHI", pos: "SG", age: 23, sal: 2.3,
      ovr: { 2003: 76, 2004: 75, 2005: 76 },
      cost: 90, from: 2003, until: 2003, direction: "retooling",
      note: "Handles for days. Chicago's backcourt is a traffic jam." },
    { name: "Bonzi Wells", team: "POR", pos: "SG", age: 26, sal: 7.3,
      ovr: { 2002: 78, 2003: 76, 2004: 74, 2005: 73 },
      cost: 70, from: 2002, until: 2004, direction: "retooling",
      note: "Talented, surly, and on the Portland clearance rack." },
    { name: "Kwame Brown", team: "WAS", pos: "PF", age: 21, sal: 4.5,
      ovr: { 2003: 68, 2004: 70, 2005: 64 },
      cost: 90, from: 2003, until: 2005, direction: "retooling",
      note: "The former #1 pick, heavily discounted. Michael yelled the upside out of him." }
  ],

  freeAgents: {
    2002: [
      { name: "Chauncey Billups", pos: "PG", age: 25, ask: 5.6, pull: 45,
        ovr: { 2002: 82, 2003: 85, 2004: 87, 2005: 88 }, note: "Fifth team in five years. Minnesota didn't even make an offer." },
      { name: "Larry Hughes", pos: "SG", age: 23, ask: 5.0, pull: 40,
        ovr: { 2002: 76, 2003: 78, 2004: 80, 2005: 80 }, note: "Talented, restless, still looking for a role." },
      { name: "Matt Harpring", pos: "SF", age: 26, ask: 4.5, pull: 40,
        ovr: { 2002: 79, 2003: 77, 2004: 75, 2005: 73 }, note: "Plays every possession like a loose ball." },
      { name: "Keon Clark", pos: "PF", age: 27, ask: 4.5, pull: 35,
        ovr: { 2002: 74, 2003: 72, 2004: 55, 2005: 55 }, note: "Springs for days. Demons, too." },
      { name: "Rodney Rogers", pos: "PF", age: 31, ask: 3.0, pull: 35,
        ovr: { 2002: 73, 2003: 71, 2004: 68, 2005: 65 }, note: "Stretch four, bargain bin." },
      { name: "Travis Best", pos: "PG", age: 30, ask: 2.5, pull: 30,
        ovr: { 2002: 72, 2003: 70, 2004: 67, 2005: 64 }, note: "Steady hand, no headlines." }
    ],
    2003: [
      { name: "Karl Malone", pos: "PF", age: 40, ask: 1.5, pull: 85,
        ovr: { 2003: 83, 2004: 60, 2005: 55 }, note: "Taking pocket change to chase one ring. Only a juggernaut need apply." },
      { name: "Gary Payton", pos: "PG", age: 35, ask: 4.9, pull: 80,
        ovr: { 2003: 79, 2004: 76, 2005: 74 }, note: "The Glove is ring-hunting, loudly." },
      { name: "Brad Miller", pos: "C", age: 27, ask: 8.5, pull: 55,
        ovr: { 2003: 82, 2004: 82, 2005: 81 }, note: "An All-Star center who passes. Somehow still underpriced." },
      { name: "P.J. Brown", pos: "PF", age: 33, ask: 8.0, pull: 50,
        ovr: { 2003: 77, 2004: 76, 2005: 74 }, note: "Professional rebounds, professional elbows." },
      { name: "Alonzo Mourning", pos: "C", age: 33, ask: 5.0, pull: 60,
        ovr: { 2003: 62, 2004: 72, 2005: 74 }, note: "The medical file is scarier than the scowl." },
      { name: "Juwan Howard", pos: "PF", age: 30, ask: 5.5, pull: 45,
        ovr: { 2003: 76, 2004: 74, 2005: 72 }, note: "The $100M man, several contracts later." },
      { name: "Michael Olowokandi", pos: "C", age: 28, ask: 5.0, pull: 40,
        ovr: { 2003: 68, 2004: 66, 2005: 64 }, note: "A former #1 pick, in the loosest sense of the word." }
    ],
    2004: [
      { name: "Kobe Bryant", pos: "SG", age: 25, ask: 14.6, pull: 95,
        ovr: { 2004: 95, 2005: 96 }, note: "Taking meetings with the Clippers, of all teams. Almost certainly leverage." },
      { name: "Steve Nash", pos: "PG", age: 30, ask: 10.0, pull: 74,
        ovr: { 2004: 90, 2005: 92 }, note: "Dallas thinks 30-year-old point guards don't age well. Someone will find out." },
      { name: "Carlos Boozer", pos: "PF", age: 22, ask: 9.0, pull: 65,
        ovr: { 2004: 84, 2005: 76 }, note: "A handshake in Cleveland is reportedly not binding." },
      { name: "Antonio McDyess", pos: "PF", age: 29, ask: 3.0, pull: 50,
        ovr: { 2004: 75, 2005: 76 }, note: "The knees took the bounce but left the touch." },
      { name: "Quentin Richardson", pos: "SG", age: 24, ask: 7.0, pull: 45,
        ovr: { 2004: 78, 2005: 74 }, note: "Head taps and heat checks." },
      { name: "Erick Dampier", pos: "C", age: 29, ask: 9.0, pull: 40,
        ovr: { 2004: 78, 2005: 74 }, note: "Just averaged 12 and 12 in a contract year. Draw your own conclusions." },
      { name: "Hedo Turkoglu", pos: "SF", age: 25, ask: 5.0, pull: 45,
        ovr: { 2004: 76, 2005: 78 }, note: "Six-foot-ten and wants the ball late." }
    ],
    2005: [
      { name: "Ray Allen", pos: "SG", age: 29, ask: 16.0, pull: 88,
        ovr: { 2005: 88 }, note: "Seattle is offering the max, and he likes it there." },
      { name: "Michael Redd", pos: "SG", age: 25, ask: 15.0, pull: 80,
        ovr: { 2005: 85 }, note: "The purest lefty jumper alive. Milwaukee is sweating." },
      { name: "Shareef Abdur-Rahim", pos: "PF", age: 28, ask: 6.0, pull: 45,
        ovr: { 2005: 77 }, note: "Still hunting his first playoff game." },
      { name: "Antoine Walker", pos: "PF", age: 28, ask: 8.0, pull: 45,
        ovr: { 2005: 78 }, note: "Why so many threes? Because there are no fours." },
      { name: "Cuttino Mobley", pos: "SG", age: 29, ask: 8.5, pull: 45,
        ovr: { 2005: 78 }, note: "Cat gets buckets wherever he lands." },
      { name: "Donyell Marshall", pos: "PF", age: 32, ask: 5.9, pull: 40,
        ovr: { 2005: 74 }, note: "Stretch four before the term existed." },
      { name: "Damon Jones", pos: "PG", age: 28, ask: 4.0, pull: 35,
        ovr: { 2005: 71 }, note: "Self-proclaimed best shooter in the world. Occasionally correct." }
    ]
  },

  draft: {
    2003: [
      { name: "LeBron James", pos: "SF", realPick: 1, age: 18, ovr: { 2003: 84, 2004: 90, 2005: 94 }, note: "Akron — the most hyped prospect ever. The hype undersells it" },
      { name: "Darko Milicic", pos: "C", realPick: 2, age: 18, ovr: { 2003: 58, 2004: 60, 2005: 64 }, note: "Serbia — the front office loves the workout tape" },
      { name: "Carmelo Anthony", pos: "SF", realPick: 3, age: 19, ovr: { 2003: 82, 2004: 84, 2005: 86 }, note: "Syracuse — just carried a freshman class to a national title" },
      { name: "Chris Bosh", pos: "PF", realPick: 4, age: 19, ovr: { 2003: 76, 2004: 81, 2005: 84 }, note: "Georgia Tech — skinny now, skilled forever" },
      { name: "Dwyane Wade", pos: "SG", realPick: 5, age: 21, ovr: { 2003: 80, 2004: 88, 2005: 91 }, note: "Marquette — scouts nitpick the jumper. Watch the tournament tape" },
      { name: "Chris Kaman", pos: "C", realPick: 6, age: 21, ovr: { 2003: 70, 2004: 72, 2005: 74 }, note: "Central Michigan — seven feet of elbows" },
      { name: "Kirk Hinrich", pos: "PG", realPick: 7, age: 22, ovr: { 2003: 74, 2004: 76, 2005: 77 }, note: "Kansas — four-year guard, day-one starter" },
      { name: "T.J. Ford", pos: "PG", realPick: 8, age: 20, ovr: { 2003: 70, 2004: 55, 2005: 74 }, note: "Texas — fastest player in the draft, medical flags on the spine" },
      { name: "David West", pos: "PF", realPick: 18, age: 22, ovr: { 2003: 66, 2004: 70, 2005: 76 }, note: "Xavier — college player of the year, no lottery buzz" },
      { name: "Boris Diaw", pos: "SF", realPick: 21, age: 21, ovr: { 2003: 68, 2004: 70, 2005: 78 }, note: "France — position: yes" },
      { name: "Kendrick Perkins", pos: "C", realPick: 27, age: 18, ovr: { 2003: 60, 2004: 62, 2005: 66 }, note: "Texas prep — scowl arrives NBA-ready" },
      { name: "Leandro Barbosa", pos: "PG", realPick: 28, age: 20, ovr: { 2003: 68, 2004: 72, 2005: 76 }, note: "Brazil — the Blur, imported" },
      { name: "Josh Howard", pos: "SF", realPick: 29, age: 23, ovr: { 2003: 72, 2004: 76, 2005: 79 }, note: "Wake Forest — ACC player of the year, slid for being 23" },
      { name: "Mo Williams", pos: "PG", realPick: 47, age: 20, ovr: { 2003: 66, 2004: 70, 2005: 74 }, note: "Alabama — second-round scorer with starter juice" },
      { name: "Kyle Korver", pos: "SG", realPick: 51, age: 22, ovr: { 2003: 68, 2004: 70, 2005: 72 }, note: "Creighton — famously sold for a copy machine" }
    ],
    2004: [
      { name: "Dwight Howard", pos: "C", realPick: 1, age: 18, ovr: { 2004: 78, 2005: 83 }, note: "Atlanta prep — shoulders like a superhero" },
      { name: "Emeka Okafor", pos: "C", realPick: 2, age: 21, ovr: { 2004: 76, 2005: 70 }, note: "UConn — ready-made double-double" },
      { name: "Ben Gordon", pos: "SG", realPick: 3, age: 21, ovr: { 2004: 73, 2005: 76 }, note: "UConn — instant offense, no position" },
      { name: "Shaun Livingston", pos: "PG", realPick: 4, age: 18, ovr: { 2004: 66, 2005: 70 }, note: "Peoria prep — 6'7\" point guard from the future" },
      { name: "Devin Harris", pos: "PG", realPick: 5, age: 21, ovr: { 2004: 70, 2005: 72 }, note: "Wisconsin — blur in the open floor" },
      { name: "Luol Deng", pos: "SF", realPick: 7, age: 19, ovr: { 2004: 73, 2005: 76 }, note: "Duke — grown-up wing at 19" },
      { name: "Andre Iguodala", pos: "SF", realPick: 9, age: 20, ovr: { 2004: 75, 2005: 78 }, note: "Arizona — does everything but demand the ball" },
      { name: "Al Jefferson", pos: "PF", realPick: 15, age: 19, ovr: { 2004: 68, 2005: 74 }, note: "Mississippi prep — old-man post game, teenage body" },
      { name: "Josh Smith", pos: "PF", realPick: 17, age: 18, ovr: { 2004: 72, 2005: 76 }, note: "Oak Hill — launches from everywhere, blocks everything" },
      { name: "Jameer Nelson", pos: "PG", realPick: 20, age: 22, ovr: { 2004: 72, 2005: 74 }, note: "Saint Joseph's — college player of the year, somehow still here" },
      { name: "Tony Allen", pos: "SG", realPick: 25, age: 22, ovr: { 2004: 68, 2005: 70 }, note: "Oklahoma State — first-team all-menace" },
      { name: "Kevin Martin", pos: "SG", realPick: 26, age: 21, ovr: { 2004: 66, 2005: 72 }, note: "Western Carolina — funky release, real buckets" },
      { name: "Anderson Varejão", pos: "PF", realPick: 30, age: 21, ovr: { 2004: 68, 2005: 72 }, note: "Brazil — hair and hustle, in that order" },
      { name: "Trevor Ariza", pos: "SF", realPick: 43, age: 19, ovr: { 2004: 65, 2005: 68 }, note: "UCLA — pogo wing hiding in round two" }
    ],
    2005: [
      { name: "Andrew Bogut", pos: "C", realPick: 1, age: 20, ovr: { 2005: 72 }, note: "Utah — polished, cranky, seven feet" },
      { name: "Marvin Williams", pos: "SF", realPick: 2, age: 19, ovr: { 2005: 68 }, note: "North Carolina — sixth man on a champion, top-two pick" },
      { name: "Deron Williams", pos: "PG", realPick: 3, age: 21, ovr: { 2005: 74 }, note: "Illinois — built like a linebacker, passes like a surgeon" },
      { name: "Chris Paul", pos: "PG", realPick: 4, age: 20, ovr: { 2005: 82 }, note: "Wake Forest — small, ruthless, in charge immediately" },
      { name: "Raymond Felton", pos: "PG", realPick: 5, age: 21, ovr: { 2005: 71 }, note: "North Carolina — third point guard off the board" },
      { name: "Charlie Villanueva", pos: "PF", realPick: 7, age: 20, ovr: { 2005: 73 }, note: "UConn — smooth scorer, questions about want-to" },
      { name: "Andrew Bynum", pos: "C", realPick: 10, age: 17, ovr: { 2005: 62 }, note: "New Jersey prep — youngest player in league history" },
      { name: "Danny Granger", pos: "SF", realPick: 17, age: 22, ovr: { 2005: 72 }, note: "New Mexico — knees scared off half the lottery" },
      { name: "Nate Robinson", pos: "PG", realPick: 21, age: 21, ovr: { 2005: 68 }, note: "Washington — 5'9\" with a 40-inch grudge" },
      { name: "David Lee", pos: "PF", realPick: 30, age: 22, ovr: { 2005: 68 }, note: "Florida — runs, rebounds, finishes. That's plenty" },
      { name: "Monta Ellis", pos: "SG", realPick: 40, age: 19, ovr: { 2005: 62 }, note: "Mississippi prep — second round has microwaves too" },
      { name: "Lou Williams", pos: "SG", realPick: 45, age: 18, ovr: { 2005: 60 }, note: "Georgia prep — bench bucket-getter in embryo" }
    ]
  },

  gauntlet: {
    2003: [
      { team: "NJN", ovr: 90, conf: "E" }, { team: "SAS", ovr: 95, conf: "W" },
      { team: "DAL", ovr: 93, conf: "W" }, { team: "LAL", ovr: 93, conf: "W" }
    ],
    2004: [
      { team: "IND", ovr: 93, conf: "E" }, { team: "NJN", ovr: 89, conf: "E" },
      { team: "LAL", ovr: 94, conf: "W" }, { team: "SAS", ovr: 95, conf: "W" },
      { team: "MIN", ovr: 93, conf: "W" }
    ],
    2005: [
      { team: "MIA", ovr: 94, conf: "E" }, { team: "SAS", ovr: 96, conf: "W" },
      { team: "PHX", ovr: 94, conf: "W" }
    ],
    2006: [
      { team: "MIA", ovr: 94, conf: "E" }, { team: "SAS", ovr: 95, conf: "W" },
      { team: "DAL", ovr: 95, conf: "W" }
    ]
  },

  events: [
    { year: 2002, text: "Minnesota's backup point guard is on the market. The league shrugs." },
    { year: 2002, text: "The Wizards are winding down the Jordan experiment. The East is wide open behind New Jersey." },
    { year: 2003, text: "Scouts are split on the #2 pick: the Serbian workout tape or three college stars everyone has seen." },
    { year: 2003, text: "Portland's locker room is a tabloid section. Ownership wants the headlines gone at any price." },
    { year: 2004, text: "The Lakers' superteam just imploded in five games. Defense travels; egos don't." },
    { year: 2005, text: "Larry Brown is flirting with New York. Again. The next man up preaches the same defense." }
  ]
};

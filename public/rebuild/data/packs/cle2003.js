export default {
  id: "cle2003",
  title: "The Chosen One",
  team: { id: "CLE", city: "Cleveland", name: "Cavaliers", colors: ["#860038", "#FDBB30"], conf: "E" },
  startYear: 2003,
  par: 5,
  difficulty: "Hard",
  realOutcome: "Cleveland never found rookie LeBron a real co-star. He dragged the 2007 roster to a Finals sweep at the hands of the Spurs, left in 2010, and the banner waited until 2016.",
  baselineWins: 17,
  intro:
    "July 2003. The ping-pong balls delivered the hometown kid, and the 18-year-old from Akron is already in a wine-and-gold jersey. Around him: a second-round bruiser on a minimum contract, a skilled Lithuanian center with a history of foot surgeries, and a locker room that hasn't won 20 games in two years. Cleveland hasn't celebrated a title since 1964. Build something worthy of the Chosen One — before he's old enough to choose otherwise.",
  tips: "Everything the kid touches gets better. Pay for shooters and grown-ups, and never let a handshake substitute for a contract.",

  cap: { 2003: 43.8, 2004: 43.9, 2005: 49.5, 2006: 53.1 },

  roster: [
    { name: "LeBron James", pos: "SF", age: 18, sal: 4.0, ovr: { 2003: 84, 2004: 90, 2005: 94, 2006: 96 } },
    { name: "Carlos Boozer", pos: "PF", age: 21, sal: 0.7, ovr: { 2003: 81, 2004: 84, 2005: 76, 2006: 84 } },
    { name: "Zydrunas Ilgauskas", pos: "C", age: 28, sal: 12.0, ovr: { 2003: 80, 2004: 82, 2005: 81, 2006: 79 } },
    { name: "Ricky Davis", pos: "SG", age: 23, sal: 5.4, ovr: { 2003: 78, 2004: 77, 2005: 78, 2006: 75 } },
    { name: "Darius Miles", pos: "SF", age: 21, sal: 4.9, ovr: { 2003: 73, 2004: 74, 2005: 71, 2006: 55 } },
    { name: "Dajuan Wagner", pos: "SG", age: 20, sal: 3.2, ovr: { 2003: 70, 2004: 64, 2005: 55, 2006: 55 } },
    { name: "Eric Snow", pos: "PG", age: 30, sal: 4.4, ovr: { 2003: 74, 2004: 73, 2005: 71, 2006: 68 } },
    { name: "Chris Mihm", pos: "C", age: 24, sal: 2.6, ovr: { 2003: 70, 2004: 72, 2005: 70, 2006: 66 } },
    { name: "DeSagana Diop", pos: "C", age: 21, sal: 3.4, ovr: { 2003: 64, 2004: 66, 2005: 68, 2006: 68 } },
    { name: "Ira Newble", pos: "SF", age: 28, sal: 1.6, ovr: { 2003: 68, 2004: 67, 2005: 66, 2006: 64 } },
    { name: "Kevin Ollie", pos: "PG", age: 30, sal: 2.4, ovr: { 2003: 66, 2004: 65, 2005: 63, 2006: 61 } }
  ],

  picks: [],

  offers: [
    {
      id: "bos-ricky", team: "BOS", year: 2003, until: 2003,
      label: "Boston will overpay for Ricky Davis",
      give: ["Ricky Davis", "Chris Mihm"],
      get: {
        players: [
          { name: "Tony Battie", pos: "C", age: 27, sal: 5.3, ovr: { 2003: 72, 2004: 71, 2005: 70, 2006: 68 } },
          { name: "Eric Williams", pos: "SF", age: 31, sal: 3.7, ovr: { 2003: 70, 2004: 68, 2005: 66, 2006: 64 } }
        ],
        picks: []
      }
    },
    {
      id: "por-miles", team: "POR", year: 2003, until: 2004,
      label: "Portland gambles on Darius Miles",
      give: ["Darius Miles"],
      get: {
        players: [
          { name: "Jeff McInnis", pos: "PG", age: 29, sal: 3.6, ovr: { 2003: 75, 2004: 73, 2005: 70, 2006: 62 } }
        ],
        picks: []
      }
    },
    {
      id: "uta-boozer", team: "UTA", year: 2004, until: 2004,
      label: "Utah wants Boozer — sign-and-trade or watch him walk",
      give: ["Carlos Boozer"],
      get: {
        players: [
          { name: "Gordan Giricek", pos: "SG", age: 27, sal: 4.0, ovr: { 2004: 71, 2005: 70, 2006: 67 } }
        ],
        picks: [{ year: 2006, slot: 14, via: "UTA" }]
      }
    }
  ],

  tradeBlock: [
    { name: "Rasheed Wallace", team: "POR", pos: "PF", age: 29, sal: 17.0,
      ovr: { 2003: 86, 2004: 85, 2005: 84, 2006: 81 },
      cost: 200, from: 2003, until: 2003, direction: "retooling",
      note: "Portland wants out of the headlines. A max talent, priced like a problem." },
    { name: "Baron Davis", team: "NOH", pos: "PG", age: 24, sal: 11.3,
      ovr: { 2003: 85, 2004: 82, 2005: 84, 2006: 83 },
      cost: 250, from: 2003, until: 2004, direction: "retooling",
      note: "All-Star with a bad back and a worse relationship with the front office." },
    { name: "Pau Gasol", team: "MEM", pos: "PF", age: 23, sal: 11.0,
      ovr: { 2003: 84, 2004: 85, 2005: 86, 2006: 86 },
      cost: 380, from: 2003, until: 2006, direction: "retooling",
      note: "Memphis isn't trading its franchise player. Probably. Everyone has a price." },
    { name: "Antawn Jamison", team: "GSW", pos: "PF", age: 27, sal: 12.0,
      ovr: { 2003: 82, 2004: 81, 2005: 82, 2006: 81 },
      cost: 180, from: 2003, until: 2004, direction: "retooling",
      note: "20 a night on a team going nowhere. The league's favorite trade chip." },
    { name: "Vince Carter", team: "TOR", pos: "SG", age: 27, sal: 13.3,
      ovr: { 2004: 87, 2005: 86, 2006: 85 },
      cost: 260, from: 2004, until: 2004, direction: "retooling",
      note: "Demanding out of Toronto and barely pretending otherwise." },
    { name: "Zach Randolph", team: "POR", pos: "PF", age: 23, sal: 12.0,
      ovr: { 2004: 83, 2005: 80, 2006: 82 },
      cost: 200, from: 2004, until: 2006, direction: "rebuilding",
      note: "20 and 10, with fine print. Portland is selling everything." },
    { name: "Chris Webber", team: "SAC", pos: "PF", age: 31, sal: 20.0,
      ovr: { 2004: 80, 2005: 78, 2006: 74 },
      cost: 220, from: 2004, until: 2005, direction: "rebuilding",
      note: "Max money, microfracture knee. The name still moves tickets." },
    { name: "Steve Francis", team: "ORL", pos: "PG", age: 27, sal: 14.3,
      ovr: { 2004: 80, 2005: 77, 2006: 72 },
      cost: 150, from: 2004, until: 2005, direction: "retooling",
      note: "Stevie Franchise, marked down. Ball-dominant in every sense." },
    { name: "Drew Gooden", team: "ORL", pos: "PF", age: 22, sal: 4.5,
      ovr: { 2004: 78, 2005: 77, 2006: 77 },
      cost: 80, from: 2004, until: 2004, direction: "retooling",
      note: "Orlando is starting over and the price is a phone call." },
    { name: "Corey Maggette", team: "LAC", pos: "SF", age: 24, sal: 7.0,
      ovr: { 2003: 79, 2004: 80, 2005: 78, 2006: 77 },
      cost: 100, from: 2003, until: 2006, direction: "retooling",
      note: "Lives at the free-throw line. The Clippers always listen." },
    { name: "Allen Iverson", team: "PHI", pos: "PG", age: 31, sal: 18.0,
      ovr: { 2006: 86 },
      cost: 300, from: 2006, until: 2006, direction: "retooling",
      note: "The Answer wants a new question. Philadelphia is done pretending." }
  ],

  freeAgents: {
    2003: [
      { name: "Karl Malone", pos: "PF", age: 40, ask: 1.5, pull: 85,
        ovr: { 2003: 83, 2004: 60, 2005: 55, 2006: 55 }, note: "Taking pocket change to chase one ring. Only a juggernaut need apply." },
      { name: "Gary Payton", pos: "PG", age: 35, ask: 4.9, pull: 80,
        ovr: { 2003: 79, 2004: 76, 2005: 74, 2006: 70 }, note: "The Glove is ring-hunting, and he is not subtle about it." },
      { name: "Brad Miller", pos: "C", age: 27, ask: 8.5, pull: 55,
        ovr: { 2003: 82, 2004: 82, 2005: 81, 2006: 78 }, note: "An All-Star center who passes. Somehow still underpriced." },
      { name: "P.J. Brown", pos: "PF", age: 33, ask: 8.0, pull: 50,
        ovr: { 2003: 77, 2004: 76, 2005: 74, 2006: 72 }, note: "Professional rebounds, professional elbows." },
      { name: "Juwan Howard", pos: "PF", age: 30, ask: 5.5, pull: 45,
        ovr: { 2003: 76, 2004: 74, 2005: 72, 2006: 68 }, note: "The $100M man, several contracts later." },
      { name: "Alonzo Mourning", pos: "C", age: 33, ask: 5.0, pull: 60,
        ovr: { 2003: 62, 2004: 72, 2005: 74, 2006: 72 }, note: "The medical file is scarier than the scowl. Bet on the heart, literally." },
      { name: "Michael Olowokandi", pos: "C", age: 28, ask: 5.0, pull: 40,
        ovr: { 2003: 68, 2004: 66, 2005: 64, 2006: 62 }, note: "A former #1 pick, in the loosest sense of the word." }
    ],
    2004: [
      { name: "Kobe Bryant", pos: "SG", age: 25, ask: 14.6, pull: 95,
        ovr: { 2004: 95, 2005: 96, 2006: 96 }, note: "Taking meetings with the Clippers, of all teams. Almost certainly leverage." },
      { name: "Steve Nash", pos: "PG", age: 30, ask: 10.0, pull: 74,
        ovr: { 2004: 90, 2005: 92, 2006: 91 }, note: "Dallas thinks 30-year-old point guards don't age well. Someone will find out." },
      { name: "Mehmet Okur", pos: "C", age: 25, ask: 8.0, pull: 50,
        ovr: { 2004: 78, 2005: 80, 2006: 82 }, note: "A center who shoots threes. Detroit can't afford to match." },
      { name: "Quentin Richardson", pos: "SG", age: 24, ask: 7.0, pull: 45,
        ovr: { 2004: 78, 2005: 74, 2006: 72 }, note: "Head taps and heat checks." },
      { name: "Antonio McDyess", pos: "PF", age: 29, ask: 3.0, pull: 50,
        ovr: { 2004: 75, 2005: 76, 2006: 74 }, note: "The knees took the bounce but left the touch." },
      { name: "Erick Dampier", pos: "C", age: 29, ask: 9.0, pull: 40,
        ovr: { 2004: 78, 2005: 74, 2006: 72 }, note: "Just averaged 12 and 12 in a contract year. Draw your own conclusions." },
      { name: "Hedo Turkoglu", pos: "SF", age: 25, ask: 5.0, pull: 45,
        ovr: { 2004: 76, 2005: 78, 2006: 80 }, note: "Six-foot-ten and wants the ball late." }
    ],
    2005: [
      { name: "Ray Allen", pos: "SG", age: 29, ask: 16.0, pull: 88,
        ovr: { 2005: 88, 2006: 88 }, note: "Seattle is offering the max, and he likes it there. It would take a lot." },
      { name: "Michael Redd", pos: "SG", age: 25, ask: 15.0, pull: 80,
        ovr: { 2005: 85, 2006: 85 }, note: "The purest lefty jumper alive. Milwaukee is sweating." },
      { name: "Larry Hughes", pos: "SG", age: 26, ask: 12.0, pull: 55,
        ovr: { 2005: 80, 2006: 73 }, note: "Just led the league in steals — in a contract year. Draw your own conclusions." },
      { name: "Shareef Abdur-Rahim", pos: "PF", age: 28, ask: 6.0, pull: 45,
        ovr: { 2005: 77, 2006: 74 }, note: "Career 20 a game, career zero playoff games." },
      { name: "Antoine Walker", pos: "PF", age: 28, ask: 8.0, pull: 45,
        ovr: { 2005: 78, 2006: 75 }, note: "Why so many threes? Because there are no fours." },
      { name: "Donyell Marshall", pos: "PF", age: 32, ask: 5.9, pull: 40,
        ovr: { 2005: 74, 2006: 72 }, note: "Stretch four before the term existed." },
      { name: "Damon Jones", pos: "PG", age: 28, ask: 4.0, pull: 35,
        ovr: { 2005: 71, 2006: 69 }, note: "Self-proclaimed best shooter in the world. Occasionally correct." }
    ],
    2006: [
      { name: "Ben Wallace", pos: "C", age: 31, ask: 15.0, pull: 70,
        ovr: { 2006: 82 }, note: "Four rings' worth of defense — well, one ring, four DPOYs. Chicago is circling." },
      { name: "Peja Stojakovic", pos: "SF", age: 29, ask: 12.8, pull: 55,
        ovr: { 2006: 80 }, note: "Elite shooting, hamstrings sold separately." },
      { name: "Jason Terry", pos: "PG", age: 28, ask: 9.0, pull: 60,
        ovr: { 2006: 84 }, note: "The Jet keeps the same pregame routine and the same jumper." },
      { name: "Al Harrington", pos: "PF", age: 26, ask: 8.5, pull: 45,
        ovr: { 2006: 79 }, note: "Scoring forward looking for his forever team. Again." },
      { name: "Mike James", pos: "PG", age: 31, ask: 5.8, pull: 40,
        ovr: { 2006: 75 }, note: "Just dropped 20 a game out of nowhere. Buyer beware." },
      { name: "Nazr Mohammed", pos: "C", age: 28, ask: 5.0, pull: 35,
        ovr: { 2006: 72 }, note: "Started for a champion. It's on the résumé." },
      { name: "Speedy Claxton", pos: "PG", age: 28, ask: 5.0, pull: 35,
        ovr: { 2006: 73 }, note: "The name is the scouting report." }
    ]
  },

  draft: {
    2004: [
      { name: "Dwight Howard", pos: "C", realPick: 1, age: 18, ovr: { 2004: 78, 2005: 83, 2006: 87 }, note: "Atlanta prep — shoulders like a superhero" },
      { name: "Emeka Okafor", pos: "C", realPick: 2, age: 21, ovr: { 2004: 76, 2005: 70, 2006: 78 }, note: "UConn — ready-made double-double" },
      { name: "Ben Gordon", pos: "SG", realPick: 3, age: 21, ovr: { 2004: 73, 2005: 76, 2006: 78 }, note: "UConn — instant offense, no position" },
      { name: "Shaun Livingston", pos: "PG", realPick: 4, age: 18, ovr: { 2004: 66, 2005: 70, 2006: 71 }, note: "Peoria prep — 6'7\" point guard from the future" },
      { name: "Devin Harris", pos: "PG", realPick: 5, age: 21, ovr: { 2004: 70, 2005: 72, 2006: 75 }, note: "Wisconsin — blur in the open floor" },
      { name: "Luol Deng", pos: "SF", realPick: 7, age: 19, ovr: { 2004: 73, 2005: 76, 2006: 82 }, note: "Duke — grown-up wing at 19" },
      { name: "Andre Iguodala", pos: "SF", realPick: 9, age: 20, ovr: { 2004: 75, 2005: 78, 2006: 81 }, note: "Arizona — does everything but demand the ball" },
      { name: "Al Jefferson", pos: "PF", realPick: 15, age: 19, ovr: { 2004: 68, 2005: 74, 2006: 79 }, note: "Mississippi prep — old-man post game, teenage body" },
      { name: "Josh Smith", pos: "PF", realPick: 17, age: 18, ovr: { 2004: 72, 2005: 76, 2006: 79 }, note: "Oak Hill — launches from everywhere, blocks everything" },
      { name: "J.R. Smith", pos: "SG", realPick: 18, age: 18, ovr: { 2004: 68, 2005: 70, 2006: 73 }, note: "New Jersey prep — no conscience, in a good way. Mostly." },
      { name: "Jameer Nelson", pos: "PG", realPick: 20, age: 22, ovr: { 2004: 72, 2005: 74, 2006: 77 }, note: "Saint Joseph's — college player of the year, somehow still here" },
      { name: "Tony Allen", pos: "SG", realPick: 25, age: 22, ovr: { 2004: 68, 2005: 70, 2006: 72 }, note: "Oklahoma State — first-team all-menace" },
      { name: "Kevin Martin", pos: "SG", realPick: 26, age: 21, ovr: { 2004: 66, 2005: 72, 2006: 78 }, note: "Western Carolina — funky release, real buckets" },
      { name: "Anderson Varejão", pos: "PF", realPick: 30, age: 21, ovr: { 2004: 68, 2005: 72, 2006: 75 }, note: "Brazil — hair and hustle, in that order" },
      { name: "Trevor Ariza", pos: "SF", realPick: 43, age: 19, ovr: { 2004: 65, 2005: 68, 2006: 70 }, note: "UCLA — pogo wing hiding in round two" }
    ],
    2005: [
      { name: "Andrew Bogut", pos: "C", realPick: 1, age: 20, ovr: { 2005: 72, 2006: 76 }, note: "Utah — polished, cranky, seven feet" },
      { name: "Marvin Williams", pos: "SF", realPick: 2, age: 19, ovr: { 2005: 68, 2006: 70 }, note: "North Carolina — sixth man on a champion, top-two pick" },
      { name: "Deron Williams", pos: "PG", realPick: 3, age: 21, ovr: { 2005: 74, 2006: 80 }, note: "Illinois — built like a linebacker, passes like a surgeon" },
      { name: "Chris Paul", pos: "PG", realPick: 4, age: 20, ovr: { 2005: 82, 2006: 85 }, note: "Wake Forest — small, ruthless, in charge immediately" },
      { name: "Raymond Felton", pos: "PG", realPick: 5, age: 21, ovr: { 2005: 71, 2006: 73 }, note: "North Carolina — third point guard off the board" },
      { name: "Charlie Villanueva", pos: "PF", realPick: 7, age: 20, ovr: { 2005: 73, 2006: 74 }, note: "UConn — smooth scorer, questions about want-to" },
      { name: "Andrew Bynum", pos: "C", realPick: 10, age: 17, ovr: { 2005: 62, 2006: 66 }, note: "New Jersey prep — youngest player in league history" },
      { name: "Danny Granger", pos: "SF", realPick: 17, age: 22, ovr: { 2005: 72, 2006: 76 }, note: "New Mexico — knees scared off half the lottery" },
      { name: "Nate Robinson", pos: "PG", realPick: 21, age: 21, ovr: { 2005: 68, 2006: 70 }, note: "Washington — 5'9\" with a 40-inch grudge" },
      { name: "David Lee", pos: "PF", realPick: 30, age: 22, ovr: { 2005: 68, 2006: 73 }, note: "Florida — runs, rebounds, finishes. That's plenty" },
      { name: "Monta Ellis", pos: "SG", realPick: 40, age: 19, ovr: { 2005: 62, 2006: 70 }, note: "Mississippi prep — second round has microwaves too" },
      { name: "Lou Williams", pos: "SG", realPick: 45, age: 18, ovr: { 2005: 60, 2006: 64 }, note: "Georgia prep — bench bucket-getter in embryo" }
    ],
    2006: [
      { name: "Andrea Bargnani", pos: "PF", realPick: 1, age: 20, ovr: { 2006: 70 }, note: "Italy — a seven-footer who shoots. The rest is theoretical" },
      { name: "LaMarcus Aldridge", pos: "PF", realPick: 2, age: 21, ovr: { 2006: 72 }, note: "Texas — bank shot from the elbow, forever" },
      { name: "Adam Morrison", pos: "SF", realPick: 3, age: 21, ovr: { 2006: 64 }, note: "Gonzaga — the mustache scores 28 a game in college" },
      { name: "Tyrus Thomas", pos: "PF", realPick: 4, age: 19, ovr: { 2006: 68 }, note: "LSU — springs for days, jumper TBD" },
      { name: "Shelden Williams", pos: "PF", realPick: 5, age: 22, ovr: { 2006: 62 }, note: "Duke — the Landlord, collecting modest rent" },
      { name: "Brandon Roy", pos: "SG", realPick: 6, age: 21, ovr: { 2006: 80 }, note: "Washington — plays like a ten-year vet already" },
      { name: "Randy Foye", pos: "SG", realPick: 7, age: 22, ovr: { 2006: 70 }, note: "Villanova — tough combo guard" },
      { name: "Rudy Gay", pos: "SF", realPick: 8, age: 19, ovr: { 2006: 73 }, note: "UConn — looks like a superstar in the airport" },
      { name: "J.J. Redick", pos: "SG", realPick: 11, age: 22, ovr: { 2006: 64 }, note: "Duke — most hated shooter in America" },
      { name: "Rajon Rondo", pos: "PG", realPick: 21, age: 20, ovr: { 2006: 70 }, note: "Kentucky — can't shoot, sees everything" },
      { name: "Kyle Lowry", pos: "PG", realPick: 24, age: 20, ovr: { 2006: 66 }, note: "Villanova — built low, plays angry" },
      { name: "Paul Millsap", pos: "PF", realPick: 47, age: 21, ovr: { 2006: 70 }, note: "Louisiana Tech — led the nation in rebounding three straight years" }
    ]
  },

  gauntlet: {
    2004: [
      { team: "DET", ovr: 93, conf: "E" }, { team: "IND", ovr: 92, conf: "E" },
      { team: "LAL", ovr: 94, conf: "W" }, { team: "SAS", ovr: 96, conf: "W" }
    ],
    2005: [
      { team: "DET", ovr: 94, conf: "E" }, { team: "MIA", ovr: 93, conf: "E" },
      { team: "SAS", ovr: 96, conf: "W" }, { team: "PHX", ovr: 94, conf: "W" }
    ],
    2006: [
      { team: "DET", ovr: 95, conf: "E" }, { team: "MIA", ovr: 94, conf: "E" },
      { team: "SAS", ovr: 95, conf: "W" }, { team: "DAL", ovr: 94, conf: "W" }
    ],
    2007: [
      { team: "DET", ovr: 92, conf: "E" }, { team: "CHI", ovr: 89, conf: "E" },
      { team: "SAS", ovr: 96, conf: "W" }, { team: "PHX", ovr: 94, conf: "W" },
      { team: "DAL", ovr: 96, conf: "W" }
    ]
  },

  events: [
    { year: 2003, text: "The Lakers just added two Hall of Famers for pocket change. That's what a juggernaut buys." },
    { year: 2003, text: "Portland's locker room is one police blotter away from a fire sale." },
    { year: 2004, text: "Dallas doubts its 30-year-old point guard has much left in the tank. Phoenix disagrees." },
    { year: 2004, text: "Boozer's agent and Utah's cap space are spending a suspicious amount of time together." },
    { year: 2005, text: "Every contender is hunting shooting. The kid from Akron makes open shots appear from thin air." },
    { year: 2006, text: "Chicago is backing the Brinks truck up to Detroit's shot-blocking center." }
  ]
};

export default {
  id: "lal2004",
  title: "After the Feud",
  team: { id: "LAL", city: "Los Angeles", name: "Lakers", colors: ["#552583", "#FDB927"], conf: "W" },
  startYear: 2004,
  par: 5,
  difficulty: "Legendary",
  realOutcome:
    "Mitch Kupchak took Miami's package, and Shaq won ring number four in 2006 while the Lakers wandered the wilderness giving Smush Parker 82 starts. Kobe dropped 81 on Toronto, then demanded a trade in the summer of 2007. Pau Gasol finally arrived in February 2008 — the trade that saved the franchise — and the Finals rematch with Boston came one season after this window closed.",
  baselineWins: 56,
  intro:
    "July 2004. Detroit just dismantled the dynasty in five games. Phil Jackson is gone, Karl Malone and Gary Payton are on their way out, and Shaq is demanding a trade through every microphone in Los Angeles. Kobe Bryant, 25, just re-signed — this is his franchise now, and your call: rebuild around the alpha, or force the feuding duo to coexist one more time.",
  tips: "Everyone will call about the big fella. The summer's real prize runs pick-and-rolls and is arguing with Dallas about a fourth year.",

  cap: { 2004: 43.9, 2005: 49.5, 2006: 53.1, 2007: 55.6 },

  roster: [
    { name: "Kobe Bryant", pos: "SG", age: 25, sal: 14.2, ovr: { 2004: 95, 2005: 96, 2006: 97, 2007: 96 } },
    { name: "Shaquille O'Neal", pos: "C", age: 32, sal: 27.7, ovr: { 2004: 92, 2005: 90, 2006: 87, 2007: 84 } },
    { name: "Devean George", pos: "SF", age: 26, sal: 4.5, ovr: { 2004: 70, 2005: 66, 2006: 65, 2007: 63 } },
    { name: "Luke Walton", pos: "SF", age: 24, sal: 1.1, ovr: { 2004: 70, 2005: 71, 2006: 74, 2007: 72 } },
    { name: "Kareem Rush", pos: "SG", age: 23, sal: 1.4, ovr: { 2004: 66, 2005: 65, 2006: 63, 2007: 60 } },
    { name: "Chris Mihm", pos: "C", age: 25, sal: 2.6, ovr: { 2004: 72, 2005: 73, 2006: 55, 2007: 60 } },
    { name: "Brian Cook", pos: "PF", age: 23, sal: 1.2, ovr: { 2004: 68, 2005: 70, 2006: 69, 2007: 66 } },
    { name: "Sasha Vujačić", pos: "SG", age: 20, sal: 1.4, ovr: { 2004: 62, 2005: 64, 2006: 68, 2007: 70 } },
    { name: "Slava Medvedenko", pos: "PF", age: 25, sal: 1.6, ovr: { 2004: 66, 2005: 64, 2006: 60, 2007: 55 } },
    { name: "Jumaine Jones", pos: "SF", age: 25, sal: 1.6, ovr: { 2004: 67, 2005: 66, 2006: 64, 2007: 62 } }
  ],

  picks: [],

  offers: [
    {
      id: "mia-shaq", team: "MIA", year: 2004, until: 2004,
      label: "Miami offers its entire young core for the Diesel",
      give: ["Shaquille O'Neal"],
      get: {
        players: [
          { name: "Lamar Odom", pos: "PF", age: 24, sal: 11.4, ovr: { 2004: 81, 2005: 82, 2006: 83, 2007: 84 } },
          { name: "Caron Butler", pos: "SF", age: 24, sal: 2.9, ovr: { 2004: 80, 2005: 83, 2006: 85, 2007: 85 } },
          { name: "Brian Grant", pos: "PF", age: 32, sal: 14.3, ovr: { 2004: 68, 2005: 65, 2006: 62, 2007: 60 } }
        ],
        picks: [{ year: 2006, slot: 20, via: "MIA" }]
      }
    },
    {
      id: "mem-pau", team: "MEM", year: 2007, until: 2007,
      label: "Memphis wants filler salary and futures for Pau Gasol",
      note: "The kind of trade that saves a franchise — if you still have a franchise by then.",
      give: ["Chris Mihm", "Brian Cook"],
      get: {
        players: [
          { name: "Pau Gasol", pos: "C", age: 27, sal: 13.7, ovr: { 2007: 88 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Baron Davis", team: "NOH", pos: "PG", age: 25, sal: 12.4,
      ovr: { 2004: 83, 2005: 82, 2006: 85, 2007: 83 },
      cost: 260, from: 2004, until: 2004,
      note: "New Orleans is drowning in the contract. The talent is real; so is the back." },
    { name: "Vince Carter", team: "TOR", pos: "SG", age: 27, sal: 13.0,
      ovr: { 2004: 84, 2005: 85, 2006: 84, 2007: 82 },
      cost: 170, from: 2004, until: 2004,
      note: "Sulking in Toronto. Half the league thinks he's stopped trying. Half the league is wrong." },
    { name: "Kwame Brown", team: "WAS", pos: "C", age: 22, sal: 5.0,
      ovr: { 2004: 70, 2005: 69, 2006: 68, 2007: 66 },
      cost: 70, from: 2004, until: 2004,
      note: "The former No. 1 pick needs a change of scenery. Hands sold separately." },
    { name: "Ron Artest", team: "IND", pos: "SF", age: 25, sal: 6.8,
      ovr: { 2005: 83, 2006: 81, 2007: 80 },
      cost: 150, from: 2005, until: 2005,
      note: "Post-brawl markdown on a first-team All-Defense wing. You know exactly what the risk is." },
    { name: "Mike Bibby", team: "SAC", pos: "PG", age: 27, sal: 11.5,
      ovr: { 2005: 80, 2006: 78, 2007: 77 },
      cost: 170, from: 2005, until: 2006,
      note: "The Kings' era is ending. A cold-blooded guard with playoff scars." },
    { name: "Shawn Marion", team: "PHX", pos: "SF", age: 27, sal: 14.8,
      ovr: { 2005: 86, 2006: 86, 2007: 84 },
      cost: 300, from: 2005, until: 2007,
      note: "Does everything, credited for none of it. Phoenix listens more than they admit." },
    { name: "Corey Maggette", team: "LAC", pos: "SF", age: 25, sal: 7.0,
      ovr: { 2005: 78, 2006: 76, 2007: 76 },
      cost: 110, from: 2005, until: 2006,
      note: "The other L.A. team taking your calls, for once." },
    { name: "Allen Iverson", team: "PHI", pos: "SG", age: 31, sal: 17.2,
      ovr: { 2006: 87, 2007: 84 },
      cost: 320, from: 2006, until: 2006,
      note: "Philadelphia has finally had enough. The Answer, available. Imagine the backcourt; imagine the basketballs." },
    { name: "Jermaine O'Neal", team: "IND", pos: "PF", age: 27, sal: 18.1,
      ovr: { 2006: 84, 2007: 81 },
      cost: 250, from: 2006, until: 2007,
      note: "Indiana is dismantling. All-NBA production, mileage accumulating fast." },
    { name: "Zach Randolph", team: "POR", pos: "PF", age: 25, sal: 12.9,
      ovr: { 2006: 80, 2007: 81 },
      cost: 140, from: 2006, until: 2007,
      note: "Portland would like to discuss their culture. Twenty and ten would like a word first." },
    { name: "Jason Kidd", team: "NJN", pos: "PG", age: 34, sal: 19.7,
      ovr: { 2007: 84 },
      cost: 300, from: 2007, until: 2007,
      note: "New Jersey is winding down. The best pure point guard alive, on his last great legs." },
    { name: "Kevin Garnett", team: "MIN", pos: "PF", age: 31, sal: 23.8,
      ovr: { 2007: 91 },
      cost: 520, from: 2007, until: 2007,
      note: "McHale is finally, actually listening. It will cost everything you have. It might be worth it." }
  ],

  freeAgents: {
    2004: [
      { name: "Steve Nash", pos: "PG", age: 30, ask: 11.0, pull: 68,
        ovr: { 2004: 90, 2005: 92, 2006: 91, 2007: 90 }, note: "Dallas won't guarantee the years. Imagine him next to a shooting guard who never tires." },
      { name: "Carlos Boozer", pos: "PF", age: 22, ask: 11.5, pull: 55,
        ovr: { 2004: 80, 2005: 74, 2006: 84, 2007: 85 }, note: "Just walked out on a handshake in Cleveland. Talented, and now you know the fine print matters." },
      { name: "Mehmet Okur", pos: "C", age: 25, ask: 8.0, pull: 48,
        ovr: { 2004: 76, 2005: 79, 2006: 81, 2007: 78 }, note: "A center who shoots threes. It sounds stranger in 2004 than it will later." },
      { name: "Quentin Richardson", pos: "SG", age: 24, ask: 8.0, pull: 45,
        ovr: { 2004: 77, 2005: 72, 2006: 73, 2007: 74 }, note: "Corner threes and headbands. Career year incoming somewhere sunny." },
      { name: "Antonio McDyess", pos: "PF", age: 30, ask: 5.0, pull: 50,
        ovr: { 2004: 75, 2005: 74, 2006: 73, 2007: 72 }, note: "The bounce is gone; the jumper and the pride remain." },
      { name: "Derek Fisher", pos: "PG", age: 29, ask: 5.0, pull: 40,
        ovr: { 2004: 73, 2005: 73, 2006: 74, 2007: 74 }, note: "Wants a bigger role than the one he just left. Rings travel well." }
    ],
    2005: [
      { name: "Michael Redd", pos: "SG", age: 25, ask: 15.0, pull: 75,
        ovr: { 2005: 85, 2006: 85, 2007: 84 }, note: "The purest shooter on the market. Milwaukee is offering the full max." },
      { name: "Larry Hughes", pos: "SG", age: 26, ask: 13.0, pull: 55,
        ovr: { 2005: 79, 2006: 74, 2007: 73 }, note: "Led the league in steals. Somebody will pay for the counting stats." },
      { name: "Shareef Abdur-Rahim", pos: "PF", age: 28, ask: 6.0, pull: 45,
        ovr: { 2005: 76, 2006: 74, 2007: 70 }, note: "20-and-8 forever, playoff minutes never. He'd like to fix that." },
      { name: "Antoine Walker", pos: "PF", age: 28, ask: 8.0, pull: 40,
        ovr: { 2005: 76, 2006: 74, 2007: 70 }, note: "Because there are no fours. Employ with caution." },
      { name: "Donyell Marshall", pos: "PF", age: 32, ask: 5.5, pull: 42,
        ovr: { 2005: 74, 2006: 72, 2007: 69 }, note: "Just tied the record with 12 threes off the bench." },
      { name: "Bobby Simmons", pos: "SF", age: 25, ask: 9.4, pull: 38,
        ovr: { 2005: 76, 2006: 71, 2007: 69 }, note: "Most Improved. The market pays for the arrow, not the level." }
    ],
    2006: [
      { name: "Ben Wallace", pos: "C", age: 31, ask: 15.0, pull: 70,
        ovr: { 2006: 83, 2007: 79 }, note: "Four Defensive Player of the Year trophies. Chicago is backing the truck up." },
      { name: "Jason Terry", pos: "SG", age: 28, ask: 9.0, pull: 65,
        ovr: { 2006: 82, 2007: 81 }, note: "Fresh off a Finals run, jets fully operational." },
      { name: "Peja Stojaković", pos: "SF", age: 29, ask: 12.8, pull: 55,
        ovr: { 2006: 80, 2007: 76 }, note: "Elite shooting, aging hamstrings, max-adjacent ask." },
      { name: "Al Harrington", pos: "PF", age: 26, ask: 9.0, pull: 48,
        ovr: { 2006: 78, 2007: 77 }, note: "Scoring four who considers himself a three." },
      { name: "Mike James", pos: "PG", age: 31, ask: 8.0, pull: 38,
        ovr: { 2006: 75, 2007: 70 }, note: "Just averaged 20. Contract-year physics are undefeated." },
      { name: "Bonzi Wells", pos: "SG", age: 29, ask: 7.0, pull: 40,
        ovr: { 2006: 74, 2007: 70 }, note: "Torched the Spurs in April, turned down big money in May." }
    ],
    2007: [
      { name: "Chauncey Billups", pos: "PG", age: 30, ask: 11.0, pull: 72,
        ovr: { 2007: 85 }, note: "Mr. Big Shot hits the market. Detroit blinks last, usually." },
      { name: "Rashard Lewis", pos: "SF", age: 27, ask: 16.0, pull: 58,
        ovr: { 2007: 81 }, note: "Somebody is about to make him the highest-paid player you've never seen guard anyone." },
      { name: "Gerald Wallace", pos: "SF", age: 24, ask: 9.5, pull: 60,
        ovr: { 2007: 81 }, note: "Crash. All energy, all the time, occasionally all hospital." },
      { name: "Mo Williams", pos: "PG", age: 24, ask: 8.5, pull: 45,
        ovr: { 2007: 78 }, note: "Scoring point guard on the rise. Milwaukee hesitates." },
      { name: "Matt Barnes", pos: "SF", age: 27, ask: 1.2, pull: 28,
        ovr: { 2007: 74 }, note: "Fresh off the We Believe run and still on a minimum deal." },
      { name: "Grant Hill", pos: "SF", age: 34, ask: 1.8, pull: 48,
        ovr: { 2007: 75 }, note: "Healthy at last. Class of the league, priced at the minimum." }
    ]
  },

  draft: {
    2005: [
      { name: "Andrew Bogut", pos: "C", realPick: 1, age: 20, ovr: { 2005: 74, 2006: 78, 2007: 80 }, note: "Utah — safe, skilled, Australian" },
      { name: "Marvin Williams", pos: "SF", realPick: 2, age: 19, ovr: { 2005: 68, 2006: 71, 2007: 73 }, note: "North Carolina — sixth man on his own college team" },
      { name: "Deron Williams", pos: "PG", realPick: 3, age: 21, ovr: { 2005: 75, 2006: 83, 2007: 85 }, note: "Illinois — built like a fullback, passes like a surgeon" },
      { name: "Chris Paul", pos: "PG", realPick: 4, age: 20, ovr: { 2005: 83, 2006: 85, 2007: 89 }, note: "Wake Forest — the meanest small man in the sport" },
      { name: "Raymond Felton", pos: "PG", realPick: 5, age: 21, ovr: { 2005: 72, 2006: 74, 2007: 74 }, note: "North Carolina — third point guard off the board" },
      { name: "Andrew Bynum", pos: "C", realPick: 10, age: 17, ovr: { 2005: 62, 2006: 68, 2007: 76 }, note: "St. Joseph's HS — seventeen years old, enormous, years away" },
      { name: "Danny Granger", pos: "SF", realPick: 17, age: 22, ovr: { 2005: 72, 2006: 76, 2007: 80 }, note: "New Mexico — sliding on medical reports" },
      { name: "Nate Robinson", pos: "PG", realPick: 21, age: 21, ovr: { 2005: 68, 2006: 68, 2007: 72 }, note: "Washington — 5'9\" with a 43-inch grudge" },
      { name: "David Lee", pos: "PF", realPick: 30, age: 22, ovr: { 2005: 70, 2006: 76, 2007: 79 }, note: "Florida — last pick of the first round, motor of the first pick" },
      { name: "Monta Ellis", pos: "SG", realPick: 40, age: 19, ovr: { 2005: 62, 2006: 73, 2007: 80 }, note: "Lanier HS, Mississippi — preps-to-pros bucket-getter" },
      { name: "Lou Williams", pos: "SG", realPick: 45, age: 18, ovr: { 2005: 60, 2006: 64, 2007: 70 }, note: "South Gwinnett HS — microwave scorer in the making" }
    ],
    2006: [
      { name: "Andrea Bargnani", pos: "PF", realPick: 1, age: 20, ovr: { 2006: 72, 2007: 74 }, note: "Italy — a 7-footer who shoots; Toronto is sold" },
      { name: "LaMarcus Aldridge", pos: "PF", realPick: 2, age: 20, ovr: { 2006: 71, 2007: 79 }, note: "Texas — mid-range archaeology, built to last" },
      { name: "Adam Morrison", pos: "SF", realPick: 3, age: 21, ovr: { 2006: 66, 2007: 55 }, note: "Gonzaga — led the nation in scoring; the mustache polls well" },
      { name: "Tyrus Thomas", pos: "PF", realPick: 4, age: 19, ovr: { 2006: 68, 2007: 70 }, note: "LSU — pogo stick, assembly required" },
      { name: "Brandon Roy", pos: "SG", realPick: 6, age: 21, ovr: { 2006: 78, 2007: 84 }, note: "Washington — polished now, knees on a timer nobody can see" },
      { name: "Rudy Gay", pos: "SF", realPick: 8, age: 19, ovr: { 2006: 72, 2007: 77 }, note: "UConn — the best athlete in the draft, allegedly coasting" },
      { name: "J.J. Redick", pos: "SG", realPick: 11, age: 22, ovr: { 2006: 64, 2007: 66 }, note: "Duke — most hated shooter in America" },
      { name: "Rajon Rondo", pos: "PG", realPick: 21, age: 20, ovr: { 2006: 72, 2007: 78 }, note: "Kentucky — can't shoot, sees everything" },
      { name: "Kyle Lowry", pos: "PG", realPick: 24, age: 20, ovr: { 2006: 66, 2007: 68 }, note: "Villanova — bowling-ball guard, chip pre-installed" },
      { name: "Paul Millsap", pos: "PF", realPick: 47, age: 21, ovr: { 2006: 70, 2007: 73 }, note: "Louisiana Tech — led the nation in rebounding three straight years" }
    ],
    2007: [
      { name: "Greg Oden", pos: "C", realPick: 1, age: 19, ovr: { 2007: 55 }, note: "Ohio State — franchise center, consensus No. 1; the knee has other plans" },
      { name: "Kevin Durant", pos: "SF", realPick: 2, age: 18, ovr: { 2007: 80 }, note: "Texas — scores like nobody his size ever has" },
      { name: "Al Horford", pos: "C", realPick: 3, age: 21, ovr: { 2007: 78 }, note: "Florida — two rings, zero weaknesses, low ceiling they say" },
      { name: "Mike Conley", pos: "PG", realPick: 4, age: 19, ovr: { 2007: 72 }, note: "Ohio State — fastest first step in the class" },
      { name: "Jeff Green", pos: "SF", realPick: 5, age: 20, ovr: { 2007: 72 }, note: "Georgetown — does a bit of everything, commits to none of it" },
      { name: "Joakim Noah", pos: "C", realPick: 9, age: 22, ovr: { 2007: 73 }, note: "Florida — plays furious, celebrates louder" },
      { name: "Thaddeus Young", pos: "PF", realPick: 12, age: 19, ovr: { 2007: 70 }, note: "Georgia Tech — position TBD, motor confirmed" },
      { name: "Aaron Brooks", pos: "PG", realPick: 26, age: 22, ovr: { 2007: 68 }, note: "Oregon — tiny, fearless, pull-up ready" },
      { name: "Tiago Splitter", pos: "C", realPick: 28, age: 22, ovr: { 2007: 55 }, note: "Brazil via Spain — staying in Europe; the patient will be rewarded" },
      { name: "Carl Landry", pos: "PF", realPick: 31, age: 23, ovr: { 2007: 72 }, note: "Purdue — undersized, over-productive" },
      { name: "Marc Gasol", pos: "C", realPick: 48, age: 22, ovr: { 2007: 55 }, note: "Spain — the other Gasol, still cooking overseas" }
    ]
  },

  gauntlet: {
    2005: [
      { team: "SAS", ovr: 96, conf: "W" }, { team: "PHX", ovr: 94, conf: "W" },
      { team: "DET", ovr: 94, conf: "E" }, { team: "MIA", ovr: 93, conf: "E" }
    ],
    2006: [
      { team: "SAS", ovr: 95, conf: "W" }, { team: "DAL", ovr: 94, conf: "W" },
      { team: "DET", ovr: 95, conf: "E" }, { team: "MIA", ovr: 94, conf: "E" }
    ],
    2007: [
      { team: "SAS", ovr: 96, conf: "W" }, { team: "PHX", ovr: 94, conf: "W" },
      { team: "DET", ovr: 92, conf: "E" }, { team: "CLE", ovr: 89, conf: "E" }
    ],
    2008: [
      { team: "SAS", ovr: 94, conf: "W" }, { team: "NOP", ovr: 93, conf: "W" },
      { team: "BOS", ovr: 96, conf: "E", unless: { name: "Kevin Garnett", then: 88 } }, { team: "DET", ovr: 92, conf: "E" }
    ]
  },

  events: [
    { year: 2004, text: "Miami is offering its entire young core for one phone call." },
    { year: 2004, text: "Steve Nash is taking meetings. Dallas keeps balking at the years." },
    { year: 2004, text: "Phil Jackson has a book coming out. Nobody in the building comes out clean." },
    { year: 2005, text: "Two rookie point guards went third and fourth. The West will be arguing about the order for a decade." },
    { year: 2005, text: "Indiana might finally take calls on Ron Artest. The price reflects November." },
    { year: 2006, text: "Philadelphia has had enough. The Answer can be had." },
    { year: 2007, text: "Kevin McHale is finally listening on his franchise cornerstone." },
    { year: 2007, text: "Memphis wants out of Pau Gasol's contract. Nobody believes the asking price is real." }
  ]
};

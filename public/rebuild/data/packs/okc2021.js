export default {
  id: "okc2021",
  title: "The Vault",
  team: { id: "OKC", city: "Oklahoma City", name: "Thunder", colors: ["#007AC1", "#EF3B24"], conf: "W" },
  startYear: 2021,
  par: 5,
  difficulty: "Hard",
  realOutcome: "Presti kept the vault shut, drafted Chet and Jalen Williams, swapped Giddey for Caruso, signed Hartenstein — and raised the banner in 2025. Year four, exactly.",
  baselineWins: 22,
  intro:
    "July 2021. The scoreboard says 22 wins; the war chest says everything else. Sam Presti spent two summers turning Paul George and Russell Westbrook into a decade of draft capital and a quiet Canadian guard who might be a superstar. You just drafted an Australian teenager sixth. Nobody hangs banners for asset accumulation. Open the vault.",
  tips: "Some draft boards are deeper than the lottery admits — especially the next one, even at pick twelve. And the last piece of a defense is usually a guard nobody drafted as a star.",

  cap: { 2021: 112.4, 2022: 123.7, 2023: 136.0, 2024: 140.6 },

  roster: [
    { name: "Shai Gilgeous-Alexander", pos: "PG", age: 23, sal: 5.5, ovr: { 2021: 87, 2022: 90, 2023: 94, 2024: 96 } },
    { name: "Josh Giddey", pos: "PG", age: 18, sal: 6.1, ovr: { 2021: 74, 2022: 77, 2023: 78, 2024: 76 } },
    { name: "Luguentz Dort", pos: "SG", age: 22, sal: 1.9, ovr: { 2021: 77, 2022: 78, 2023: 80, 2024: 82 } },
    { name: "Darius Bazley", pos: "PF", age: 21, sal: 4.3, ovr: { 2021: 70, 2022: 66, 2023: 62, 2024: 58 } },
    { name: "Kenrich Williams", pos: "SF", age: 26, sal: 2.0, ovr: { 2021: 72, 2022: 73, 2023: 72, 2024: 71 } },
    { name: "Aleksej Pokusevski", pos: "PF", age: 19, sal: 3.3, ovr: { 2021: 64, 2022: 66, 2023: 65, 2024: 60 } },
    { name: "Tre Mann", pos: "PG", age: 20, sal: 2.9, ovr: { 2021: 68, 2022: 69, 2023: 66, 2024: 70 } },
    { name: "Mike Muscala", pos: "C", age: 30, sal: 3.5, ovr: { 2021: 70, 2022: 70, 2023: 68, 2024: 64 } },
    { name: "Ty Jerome", pos: "PG", age: 24, sal: 4.2, ovr: { 2021: 66, 2022: 65, 2023: 55, 2024: 75 } },
    { name: "Isaiah Roby", pos: "PF", age: 23, sal: 1.9, ovr: { 2021: 68, 2022: 64, 2023: 60, 2024: 55 } },
    { name: "Jeremiah Robinson-Earl", pos: "PF", age: 20, sal: 1.8, ovr: { 2021: 66, 2022: 64, 2023: 62, 2024: 60 } }
  ],

  picks: [
    { year: 2022, slot: 12, via: "PHX haul" },
    { year: 2023, slot: 10, via: "DAL swap" },
    { year: 2024, slot: 12, via: "HOU" }
  ],

  offers: [
    {
      id: "phx-bazley", team: "PHX", year: 2022, until: 2022,
      label: "Phoenix wants forward depth for the stretch run",
      give: ["Darius Bazley"],
      get: {
        players: [],
        picks: [{ year: 2023, slot: 38, via: "PHX" }]
      }
    },
    {
      id: "bos-muscala", team: "BOS", year: 2023, until: 2023,
      label: "Boston needs a stretch big who knows his job",
      give: ["Mike Muscala"],
      get: {
        players: [],
        picks: [{ year: 2024, slot: 35, via: "BOS" }]
      }
    },
    {
      id: "chi-caruso", team: "CHI", year: 2024, until: 2024,
      label: "Chicago finally says yes",
      give: ["Josh Giddey"],
      get: {
        players: [
          { name: "Alex Caruso", pos: "SG", age: 30, sal: 9.9, ovr: { 2021: 78, 2022: 79, 2023: 80, 2024: 81 } }
        ],
        picks: []
      }
    }
  ],

  tradeBlock: [
    { name: "Alex Caruso", team: "CHI", pos: "SG", age: 29, sal: 9.9,
      ovr: { 2021: 78, 2022: 79, 2023: 80, 2024: 81 },
      cost: 90, from: 2023, until: 2024, direction: "retooling",
      note: "Chicago keeps saying no. Keep calling." },
    { name: "Domantas Sabonis", team: "IND", pos: "PF", age: 25, sal: 18.5,
      ovr: { 2021: 85, 2022: 86, 2023: 88, 2024: 87 },
      cost: 300, from: 2021, until: 2021, direction: "retooling",
      note: "Indiana's frontcourt math stopped working." },
    { name: "Dejounte Murray", team: "SAS", pos: "PG", age: 25, sal: 16.6,
      ovr: { 2021: 84, 2022: 82, 2023: 81, 2024: 80 },
      cost: 280, from: 2022, until: 2022, direction: "retooling",
      note: "San Antonio is starting over. Again." },
    { name: "Kevin Durant", team: "BKN", pos: "SF", age: 33, sal: 44.1,
      ovr: { 2021: 93, 2022: 93, 2023: 92, 2024: 90 },
      cost: 550, from: 2022, until: 2022, direction: "retooling",
      note: "The request is real. The price is everything you own." },
    { name: "Jrue Holiday", team: "POR", pos: "PG", age: 33, sal: 34.9,
      ovr: { 2021: 85, 2022: 85, 2023: 84, 2024: 83 },
      cost: 320, from: 2023, until: 2023, direction: "retooling",
      note: "Portland flipped him once already. He won't be there long." },
    { name: "OG Anunoby", team: "TOR", pos: "SF", age: 26, sal: 18.6,
      ovr: { 2021: 78, 2022: 80, 2023: 82, 2024: 83 },
      cost: 220, from: 2023, until: 2023, direction: "retooling",
      note: "Toronto listens, then hangs up, then calls back." },
    { name: "Gordon Hayward", team: "CHA", pos: "SF", age: 33, sal: 31.5,
      ovr: { 2021: 78, 2022: 75, 2023: 74, 2024: 68 },
      cost: 60, from: 2023, until: 2023, direction: "retooling",
      note: "Charlotte will eat money to move on. Ask why." },
    { name: "John Collins", team: "ATL", pos: "PF", age: 24, sal: 23.0,
      ovr: { 2021: 80, 2022: 78, 2023: 74, 2024: 73 },
      cost: 180, from: 2021, until: 2022, direction: "retooling",
      note: "Atlanta shops him every single deadline." },
    { name: "Christian Wood", team: "HOU", pos: "C", age: 26, sal: 14.3,
      ovr: { 2021: 78, 2022: 76, 2023: 70, 2024: 62 },
      cost: 120, from: 2021, until: 2022, direction: "retooling",
      note: "Big numbers on a bad team. Buyer beware." },
    { name: "Daniel Gafford", team: "WAS", pos: "C", age: 24, sal: 12.4,
      ovr: { 2021: 74, 2022: 75, 2023: 76, 2024: 78 },
      cost: 70, from: 2023, until: 2023, direction: "retooling",
      note: "Lob threat wasting away in Washington." }
  ],

  freeAgents: {
    2021: [
      { name: "Kyle Lowry", pos: "PG", age: 35, ask: 28.0, pull: 85,
        ovr: { 2021: 81, 2022: 76, 2023: 74, 2024: 70 },
        note: "Wants sunshine and a contender. You are neither. Yet." },
      { name: "Evan Fournier", pos: "SG", age: 28, ask: 18.0, pull: 68,
        ovr: { 2021: 76, 2022: 74, 2023: 66, 2024: 62 },
        note: "New York money is on the table." },
      { name: "Patty Mills", pos: "PG", age: 33, ask: 6.0, pull: 72,
        ovr: { 2021: 74, 2022: 70, 2023: 64, 2024: 60 },
        note: "Only leaves San Antonio for a real winner." },
      { name: "Kelly Oubre Jr.", pos: "SF", age: 25, ask: 12.5, pull: 58,
        ovr: { 2021: 74, 2022: 74, 2023: 74, 2024: 72 },
        note: "Buckets and vibes, order variable." },
      { name: "Otto Porter Jr.", pos: "SF", age: 28, ask: 2.4, pull: 55,
        ovr: { 2021: 70, 2022: 68, 2023: 55, 2024: 55 },
        note: "Cheap, smart, made of glass." },
      { name: "Reggie Bullock", pos: "SG", age: 30, ask: 10.0, pull: 50,
        ovr: { 2021: 72, 2022: 70, 2023: 66, 2024: 60 },
        note: "3-and-D wing, playoff-tested in the Garden." }
    ],
    2022: [
      { name: "Zach LaVine", pos: "SG", age: 27, ask: 37.1, pull: 90,
        ovr: { 2021: 84, 2022: 83, 2023: 82, 2024: 80 },
        note: "Max or nothing, and Chicago has the max ready." },
      { name: "Jalen Brunson", pos: "PG", age: 25, ask: 26.0, pull: 78,
        ovr: { 2021: 80, 2022: 85, 2023: 87, 2024: 89 },
        note: "Dallas assumes. His father works in New York now." },
      { name: "Bobby Portis", pos: "PF", age: 27, ask: 9.0, pull: 75,
        ovr: { 2021: 76, 2022: 76, 2023: 76, 2024: 75 },
        note: "Milwaukee's favorite adopted son. Hard to pry loose." },
      { name: "Bruce Brown", pos: "SG", age: 25, ask: 6.5, pull: 58,
        ovr: { 2021: 72, 2022: 74, 2023: 73, 2024: 71 },
        note: "Does the dirty work. Contenders are circling." },
      { name: "Malik Monk", pos: "SG", age: 24, ask: 9.9, pull: 52,
        ovr: { 2021: 76, 2022: 74, 2023: 75, 2024: 77 },
        note: "Finally figured it out in Los Angeles." },
      { name: "Victor Oladipo", pos: "SG", age: 30, ask: 9.0, pull: 55,
        ovr: { 2021: 66, 2022: 68, 2023: 60, 2024: 55 },
        note: "The 2018 tape is a siren song. The knees keep their own tape." }
    ],
    2023: [
      { name: "Fred VanVleet", pos: "PG", age: 29, ask: 42.8, pull: 60,
        ovr: { 2021: 83, 2022: 80, 2023: 80, 2024: 78 },
        note: "Toronto's era is over. He'll go where the money is — even to a young team." },
      { name: "Kyrie Irving", pos: "PG", age: 31, ask: 40.0, pull: 85,
        ovr: { 2021: 88, 2022: 87, 2023: 87, 2024: 86 },
        note: "The talent is not the question. It has never been the question." },
      { name: "Brook Lopez", pos: "C", age: 35, ask: 24.0, pull: 80,
        ovr: { 2021: 78, 2022: 82, 2023: 80, 2024: 78 },
        note: "Runner-up for Defensive Player of the Year at 35. Milwaukee won't blink." },
      { name: "Jerami Grant", pos: "PF", age: 29, ask: 32.0, pull: 65,
        ovr: { 2021: 79, 2022: 78, 2023: 80, 2024: 77 },
        note: "Portland is paying him like a franchise player to keep him." },
      { name: "Donte DiVincenzo", pos: "SG", age: 26, ask: 11.5, pull: 58,
        ovr: { 2021: 70, 2022: 74, 2023: 78, 2024: 76 },
        note: "Shooting, toughness, championship pedigree, fair price." },
      { name: "Max Strus", pos: "SG", age: 27, ask: 15.8, pull: 55,
        ovr: { 2021: 72, 2022: 73, 2023: 74, 2024: 73 },
        note: "Undrafted to Finals starter. Miami develops them, then loses them." }
    ],
    2024: [
      { name: "Isaiah Hartenstein", pos: "C", age: 26, ask: 28.5, pull: 55,
        ovr: { 2021: 70, 2022: 74, 2023: 78, 2024: 82 },
        note: "New York can't match the number. Hands, screens, rim protection." },
      { name: "Paul George", pos: "SF", age: 34, ask: 49.2, pull: 82,
        ovr: { 2021: 86, 2022: 85, 2023: 85, 2024: 82 },
        note: "You've traded for him before. Philadelphia has the max out." },
      { name: "Klay Thompson", pos: "SG", age: 34, ask: 16.7, pull: 72,
        ovr: { 2021: 78, 2022: 80, 2023: 78, 2024: 75 },
        note: "The Golden State goodbye is getting loud." },
      { name: "DeMar DeRozan", pos: "SF", age: 34, ask: 24.0, pull: 62,
        ovr: { 2021: 87, 2022: 85, 2023: 84, 2024: 82 },
        note: "Chicago is finally, quietly, done." },
      { name: "Tobias Harris", pos: "PF", age: 31, ask: 26.0, pull: 45,
        ovr: { 2021: 80, 2022: 79, 2023: 78, 2024: 75 },
        note: "Philadelphia exhales. The number is smaller now, not small." },
      { name: "Chris Paul", pos: "PG", age: 39, ask: 10.5, pull: 60,
        ovr: { 2021: 87, 2022: 82, 2023: 76, 2024: 72 },
        note: "Still organizing offenses at 39. Wants young legs around him." }
    ]
  },

  draft: {
    2022: [
      { name: "Paolo Banchero", pos: "PF", realPick: 1, age: 19, ovr: { 2022: 80, 2023: 83, 2024: 85 }, note: "Duke — 250 pounds of point forward" },
      { name: "Chet Holmgren", pos: "C", realPick: 2, age: 20, ovr: { 2022: 55, 2023: 84, 2024: 88 }, note: "Gonzaga — 195 pounds of unicorn" },
      { name: "Jabari Smith Jr.", pos: "PF", realPick: 3, age: 19, ovr: { 2022: 72, 2023: 76, 2024: 78 }, note: "Auburn — the jumper is already pro" },
      { name: "Keegan Murray", pos: "PF", realPick: 4, age: 21, ovr: { 2022: 75, 2023: 77, 2024: 76 }, note: "Iowa — quietly efficient at everything" },
      { name: "Jaden Ivey", pos: "PG", realPick: 5, age: 20, ovr: { 2022: 73, 2023: 75, 2024: 74 }, note: "Purdue — fastest player in the class" },
      { name: "Jalen Williams", pos: "SG", realPick: 12, age: 21, ovr: { 2022: 78, 2023: 84, 2024: 87 }, note: "Santa Clara — the wingspan measurement broke the combine" },
      { name: "Jalen Duren", pos: "C", realPick: 13, age: 18, ovr: { 2022: 73, 2023: 76, 2024: 78 }, note: "Memphis — grown-man body, teenage birthday" },
      { name: "Mark Williams", pos: "C", realPick: 15, age: 20, ovr: { 2022: 70, 2023: 74, 2024: 72 }, note: "Duke — the standing reach of a small building" },
      { name: "Christian Braun", pos: "SG", realPick: 21, age: 21, ovr: { 2022: 70, 2023: 72, 2024: 76 }, note: "Kansas — champion, sprinter, glue" },
      { name: "Walker Kessler", pos: "C", realPick: 22, age: 20, ovr: { 2022: 76, 2023: 75, 2024: 74 }, note: "Auburn — blocks everything in the gym" },
      { name: "Nikola Jović", pos: "PF", realPick: 27, age: 19, ovr: { 2022: 64, 2023: 68, 2024: 72 }, note: "Mega Basket — big wing, bigger patience required" },
      { name: "Jaylin Williams", pos: "C", realPick: 34, age: 20, ovr: { 2022: 68, 2023: 70, 2024: 69 }, note: "Arkansas — leads the world in charges drawn" }
    ],
    2023: [
      { name: "Victor Wembanyama", pos: "C", realPick: 1, age: 19, ovr: { 2023: 84, 2024: 92 }, note: "Boulogne-Levallois — you'd have to lose everything to meet him" },
      { name: "Brandon Miller", pos: "SF", realPick: 2, age: 20, ovr: { 2023: 76, 2024: 74 }, note: "Alabama — smooth wing scoring at scale" },
      { name: "Scoot Henderson", pos: "PG", realPick: 3, age: 19, ovr: { 2023: 68, 2024: 70 }, note: "G League Ignite — a runaway train with handles" },
      { name: "Amen Thompson", pos: "PG", realPick: 4, age: 20, ovr: { 2023: 72, 2024: 78 }, note: "Overtime Elite — athleticism from another sport" },
      { name: "Ausar Thompson", pos: "SF", realPick: 5, age: 20, ovr: { 2023: 70, 2024: 71 }, note: "Overtime Elite — the other twin flies too" },
      { name: "Cason Wallace", pos: "PG", realPick: 10, age: 19, ovr: { 2023: 74, 2024: 76 }, note: "Kentucky — point-of-attack menace, zero drama" },
      { name: "Dereck Lively II", pos: "C", realPick: 12, age: 19, ovr: { 2023: 75, 2024: 74 }, note: "Duke — rim protection, rim finishing, nothing wasted" },
      { name: "Keyonte George", pos: "SG", realPick: 16, age: 19, ovr: { 2023: 70, 2024: 71 }, note: "Baylor — shot-maker with starter ambitions" },
      { name: "Jaime Jaquez Jr.", pos: "SF", realPick: 18, age: 22, ovr: { 2023: 75, 2024: 70 }, note: "UCLA — old-school footwork, four years of it" },
      { name: "Brandin Podziemski", pos: "SG", realPick: 19, age: 20, ovr: { 2023: 74, 2024: 73 }, note: "Santa Clara — the pipeline is real" },
      { name: "GG Jackson", pos: "PF", realPick: 45, age: 18, ovr: { 2023: 70, 2024: 68 }, note: "South Carolina — youngest player in the draft, twice over" }
    ],
    2024: [
      { name: "Zaccharie Risacher", pos: "SF", realPick: 1, age: 19, ovr: { 2024: 71 }, note: "Bourg-en-Bresse — the safest French wing available" },
      { name: "Alex Sarr", pos: "C", realPick: 2, age: 19, ovr: { 2024: 68 }, note: "Perth — mobile seven-footer, jumper pending" },
      { name: "Reed Sheppard", pos: "PG", realPick: 3, age: 19, ovr: { 2024: 65 }, note: "Kentucky — the analytics darling of the decade" },
      { name: "Stephon Castle", pos: "SG", realPick: 4, age: 19, ovr: { 2024: 74 }, note: "UConn — champion, defender, born ready" },
      { name: "Donovan Clingan", pos: "C", realPick: 7, age: 20, ovr: { 2024: 72 }, note: "UConn — two rings, one enormous human" },
      { name: "Matas Buzelis", pos: "PF", realPick: 11, age: 19, ovr: { 2024: 68 }, note: "G League Ignite — the last Ignite prospect ever" },
      { name: "Jared McCain", pos: "PG", realPick: 16, age: 20, ovr: { 2024: 73 }, note: "Duke — shooting and social media, both elite" },
      { name: "Yves Missi", pos: "C", realPick: 21, age: 20, ovr: { 2024: 71 }, note: "Baylor — springs for days" },
      { name: "Dillon Jones", pos: "SF", realPick: 26, age: 22, ovr: { 2024: 62 }, note: "Weber State — rebounding wing, front-office favorite" },
      { name: "Jaylen Wells", pos: "SF", realPick: 39, age: 20, ovr: { 2024: 73 }, note: "Washington State — Division II to first-round snub" }
    ]
  },

  gauntlet: {
    2022: [
      { team: "PHX", ovr: 96, conf: "W" }, { team: "GSW", ovr: 95, conf: "W" },
      { team: "MEM", ovr: 93, conf: "W" }, { team: "BOS", ovr: 94, conf: "E" },
      { team: "MIA", ovr: 92, conf: "E" }
    ],
    2023: [
      { team: "DEN", ovr: 96, conf: "W" }, { team: "PHX", ovr: 93, conf: "W" },
      { team: "SAC", ovr: 91, conf: "W" }, { team: "BOS", ovr: 95, conf: "E" },
      { team: "MIL", ovr: 94, conf: "E" }
    ],
    2024: [
      { team: "DEN", ovr: 95, conf: "W" }, { team: "MIN", ovr: 94, conf: "W" },
      { team: "DAL", ovr: 93, conf: "W" }, { team: "BOS", ovr: 97, conf: "E" },
      { team: "NYK", ovr: 92, conf: "E" }
    ],
    2025: [
      { team: "DEN", ovr: 94, conf: "W" }, { team: "MIN", ovr: 93, conf: "W" },
      { team: "LAC", ovr: 92, conf: "W" }, { team: "BOS", ovr: 96, conf: "E" },
      { team: "CLE", ovr: 94, conf: "E" }, { team: "IND", ovr: 92, conf: "E" }
    ]
  },

  events: [
    { year: 2021, text: "National columnists are calling it Tank Commander, season two. Sam Presti calls it collecting." },
    { year: 2021, text: "The vault now holds more than thirty draft picks. Nobody in league history has had this many." },
    { year: 2022, text: "A Lisfranc fracture in a Seattle pro-am ends the No. 2 pick's rookie season before it starts." },
    { year: 2022, text: "A two-time Finals MVP just requested a trade out of Brooklyn. Every vault in the league is being appraised." },
    { year: 2023, text: "Shai Gilgeous-Alexander makes First Team All-NBA. The timeline is ahead of schedule." },
    { year: 2023, text: "Contenders keep calling about your picks. Fifteen firsts is a lot of leverage — or a lot of roster spots." },
    { year: 2024, text: "The front office wants exactly two things this summer: a center with great hands and a guard who guards." },
    { year: 2024, text: "MVP chatter follows SGA into every arena. Defense is the last piece, the coaches keep saying." }
  ]
};

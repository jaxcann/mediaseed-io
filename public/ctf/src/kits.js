// ─────────────────────────────────────────────────────────────
// The roster. A kit is DATA: stat nudges on the shared kernel plus the name
// of one primary and one special. No kit gets its own physics loop — they
// all live inside the same simulation verbs, which is why they compose.
// ─────────────────────────────────────────────────────────────
export const KITS = {
  runner: {
    name: 'The Runner', icon: '🏃',
    blurb: 'All-rounder. Tosses the flag to teammates.',
    speed: 1.04, accel: 1.08, radius: 0.62,
    primary: 'lunge', special: 'toss',
  },
  dog: {
    name: 'The Dog', icon: '🐕',
    blurb: 'Tiny and quick. Can’t throw — but catches anything.',
    speed: 1.02, accel: 1.08, radius: 0.58,
    primary: 'lunge', special: 'none',
    tags: { bigCatch: true },
  },
  slingshot: {
    name: 'The Slingshot', icon: '🎯',
    blurb: 'Tags from range with a water balloon. Lobs clear over hedges.',
    speed: 0.96, accel: 1.0, radius: 0.62,
    primary: 'balloon', special: 'none',
  },
  guard: {
    name: 'The Guard', icon: '🛡️',
    blurb: 'Big fella. Blazing fast at home, waddles abroad. Bowling-ball roll.',
    speed: 1.0, accel: 1.0, radius: 0.80,
    primary: 'lunge', special: 'roll',
    // The half-field speed split lives in rules.js (search homeSpeed) — it keys
    // off the kit name directly, so there is no flag to set here.
  },
  portal: {
    name: 'The Portal', icon: '🌀',
    blurb: 'Drops two linked rings. Anyone — and anything — goes through.',
    speed: 1.03, accel: 1.05, radius: 0.62,
    primary: 'lunge', special: 'portal',
  },
  grappler: {
    name: 'The Grappler', icon: '🪝',
    blurb: 'Hooks the yard to fly around it. Yanks the flag from distance.',
    speed: 0.97, accel: 1.0, radius: 0.62,
    primary: 'lunge', special: 'grapple',
    tags: { longPickup: true },
  },
  skater: {
    name: 'The Skater', icon: '🛹',
    blurb: 'Pops onto a board at speed. Kickflips clean over people and hedges.',
    speed: 1.0, accel: 1.0, radius: 0.62,
    primary: 'lunge', special: 'hurdle',
  },
  karen: {
    name: 'Karen', icon: '📢',
    blurb: 'Somebody’s mom with an air horn. One blast and the whole lane scatters.',
    speed: 0.97, accel: 0.98, radius: 0.70,
    primary: 'lunge', special: 'horn',
  },
  lilt: {
    name: 'Lil T', icon: '🚲',
    blurb: 'Preschooler. Never gets off the trike. Rides UNDER things you go around.',
    speed: 1.0, accel: 0.86, radius: 0.56,
    primary: 'lunge', special: 'duck',
    tags: { alwaysTrike: true },
  },
  hose: {
    name: 'The Hose', icon: '💦',
    blurb: 'Soaks the lawn. Wet grass has no grip — good luck stopping on it.',
    speed: 1.0, accel: 1.02, radius: 0.62,
    primary: 'lunge', special: 'spray',
  },
  nahele: {
    name: 'Nahele', icon: '🪁',
    blurb: 'Swings the yard on a kite line, then rides the wind down.',
    speed: 1.0, accel: 1.0, radius: 0.62,
    primary: 'lunge', special: 'kite',
  },
};

export const KIT_KEYS = Object.keys(KITS);

export function applyKit(a, key) {
  const K = KITS[key];
  a.kit = key;
  a.kitSpeed = K.speed;
  a.kitAccel = K.accel;
  a.r = K.radius;
  a.primary = K.primary;
  a.special = K.special;
  // per-kit state slots, all cleared
  a.roll = null; a.rollCd = 0;
  a.board = false; a.air = 0; a.hurdleCd = 0;
  a.duck = 0; a.duckCd = 0; a.stun = 0;
  a.hornCd = 0; a.sprayCd = 0;
  a.trike = !!K.tags?.alwaysTrike;
  a.grapple = null; a.grappleCd = 0;
  a.swing = null; a.swingCd = 0; a.glide = false;
  a.balloonCd = 0; a.tossCd = 0; a.portalCd = 0;
  a.halfMul = 1;
}

// Bots defend by kit, not by seat: a Guard guards. Every team keeps one defender.
export function assignRoles(actors) {
  for (const team of ['blue', 'red']) {
    const mates = actors.filter(a => a.team === team);
    let hasDef = false;
    for (const a of mates) { a.role = a.kit === 'guard' ? 'def' : 'atk'; if (a.role === 'def') hasDef = true; }
    if (!hasDef) mates[1].role = 'def';
  }
}

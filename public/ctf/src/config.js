// ─────────────────────────────────────────────────────────────
// Every tuning knob in the game lives here. Nothing else has magic numbers.
// The live tuning panel (Tab) writes directly into this object.
// ─────────────────────────────────────────────────────────────
export const CFG = {
  sim: { hz: 60 },

  // ── the movement kernel ──────────────────────────────────
  // Velocity decomposes into FORWARD (along your input) and LATERAL.
  // grip = how fast lateral velocity dies. High grip -> crisp arcade feel.
  // drag = how fast overspeed decays back toward maxSpeed.
  move: {
    maxSpeed:   8.4,
    accel:     21.5,   // slow enough that a hard turn genuinely costs you speed
    brake:     31.7,
    grip:      14.0,
    drag:       2.4,   // overspeed bleed while running
    lungeDrag:  0.30,  // a lunge holds its speed - that is what makes reach real
    carrySlow:  0.93,
    walk:       0.45,  // Ctrl on the keyboard — the throttle a stick has and keys do not
    // Momentum redirect. A hard turn should cost speed smoothly: no small
    // movement of the stick may cost a large chunk of it, or the skill ceiling
    // is a coin flip about which side of a threshold you landed on.
    keepBase:   0.30,  // speed kept through a 90° cut
    keepCurve:  0.70,  // ...rising to keepBase+keepCurve straight ahead
    keepMax:    0.95,
    revFloor:   0.12,  // a full reversal keeps this much
    latCut:     0.50,  // lateral bled off when the redirect has to lift you
    lungeGrip:  0.55,  // you hold a line worse mid-lunge
    wetGrip:    0.22,  // hosed grass barely grips at all
    // Braking is friction, so it has to obey the same surface the turning does.
    // It used to be a flat rate: wet grass, a skateboard and a trike all stopped
    // exactly as fast as sneakers on dry lawn, which defeated the Hose's whole
    // kit — you just let go of the stick.
    wetBrake:   0.34,
    vehicleBrake: 0.75, // how much of a vehicle's grip loss applies to braking
    // Kids are solid. Without this they run straight through each other, which
    // means no screening, no sealing a lane, no shoulder-check, and the Guard's
    // extra radius is nothing but a bigger hurtbox.
    bump: { separate: 1.0, restitution: 0.18 },
  },

  // ── the tag ──────────────────────────────────────────────
  // Aimed with the mouse. Wind-up telegraphs it, recovery punishes a whiff,
  // and reach scales with the momentum you carry into the aim direction.
  lunge: {
    aimSmooth:  44.0,   // one aim step per tick (was applied twice at 22)
    windup:     0.085,
    active:     0.155,
    recover:    0.26,   // baseline; the two below are what make the gamble real
    hitRecover: 0.15,   // a tag that lands lets you go again quickly
    whiffExtra: 0.15,   // ...a miss leaves you hanging
    cooldown:   0.60,
    impulse:     5.1,  // a standing lunge is a poke, nothing more
    stack:      0.95,  // your speed is most of your reach
    maxSpeed:   24.3,
    reach:      0.62,
    reachPerSpeed: 0.038,
    windControl: 0.45,
    recControl:  0.30,
  },

  // Pure mobility. Dashing tags nobody - it gets you there, and the speed
  // it leaves you with is what arms your next lunge.
  dash: {
    impulse:    12.6,
    stack:      0.55,
    maxSpeed:   17.7,
    cooldown:   0.9,
    lock:       0.10,
  },

  tag: {
    respawn:    3.0,
    invuln:     1.2,
    knock:      7.0,
  },

  match: {
    scoreToWin: 3,
    teamSize:   3,
    flagReturn: 6.0,
    duration:   210,
    pickupR:    1.05,
    countdown:  3.4,
    dropLock:   0.7,      // a dropped flag can't be scooped for this long
  },

  // ── character kits ───────────────────────────────────────
  kits: {
    toss:    { range: 14.0, speed: 22.0, catchR: 1.25, cooldown: 0.8, cone: 0.5 },
    dog:     { speedMul: 1.02, accelMul: 1.08, radius: 0.58, catchR: 2.1 },
    balloon: { speed: 14.9, life: 0.76, splash: 1.15, cooldown: 1.15, r: 0.34 },
    guard:   { radius: 0.80, homeSpeed: 1.24, homeAccel: 1.45, awaySpeed: 0.90, awayAccel: 0.9,
               rollSpeed: 15.9, rollDur: 0.55, rollCd: 1.7, rollKnock: 13.0, rollSteer: 2.2 },
    portal:  { range: 12.0, padR: 1.05, life: 14.0, placeCd: 1.1, tpCd: 0.6, exitPush: 1.5 },
    grapple: { range: 10.0, flagRange: 9.5, pull: 46.0, pullMax: 14.0, arrive: 1.3,
               maxT: 1.15, cooldown: 2.6, pickupR: 1.6, zipT: 0.28 },
    kite:    { range: 9.0, minLen: 3.0, boost: 24.3, maxSpeed: 20.5, maxT: 1.7,
               cooldown: 2.4, glideDrag: 0.22 },
    // Skater: the board appears once you're moving. Low grip, high ceiling —
    // you carve instead of corner. Kickflip hurdles clean over people and hedges.
    skater:  { boardAt: 7.4, boardOff: 4.6, boardGrip: 4.4, boardMax: 9.2, boardKeep: 0.78,
               hurdleSpeed: 14.0, hurdleT: 0.44, hurdleCd: 2.0, hurdleH: 1.8 },
    // Karen: an air horn. Not a projectile — an instant cone that shoves and
    // stuns everyone in front of her. Area denial, not a tag.
    karen:   { hornRange: 6.2, hornArc: 0.52, hornKnock: 20.0, hornStun: 0.45, hornCd: 3.2 },
    // Lil T: permanently on the trike. Fast in a straight line, terrible at
    // turning, and small enough to duck under the things everyone else rounds.
    lilt:    { trikeGrip: 5.8, trikeMax: 8.8, trikeKeep: 0.72, duckT: 1.1, duckCd: 3.6, duckBoost: 1.08 },
    // The Hose: sprays the lawn. Wet ground is near-frictionless — a wall of
    // it turns a chase into a pileup.
    hose:    { range: 8.5, arc: 0.30, patchR: 1.7, patchLife: 5.0, wetTime: 1.0,
               cooldown: 0.22, maxPatches: 16, push: 7.0 },
  },

  // ── kickball mode ────────────────────────────────────────
  // Same kernel, a different sport. Everything the kickball sim reads lives
  // here; kickball.js has no magic numbers of its own.
  kickball: {
    // Pinned: this mode's balance depends on runner-vs-ball speed, so it does
    // NOT inherit the CTF pace. Tuned against these two numbers.
    runnerSpeed: 9.6, runnerAccel: 24.5,
    innings: 3, maxInnings: 9, outsPerHalf: 3, strikes: 3, balls: 4,
    home: 'red', away: 'blue',              // home bats in the bottom half
    countdown: 2.6,

    // The diamond. Home sits toward +z; fair territory is the 90° wedge
    // opening toward -z, so the outfield is the deep half of CFG.field.
    // basePath is the balance dial of the whole sport: it is the footrace
    // between a runner on the kernel's 9 m/s and a fielder's throw.
    field: { homeZ: 14.0, basePath: 13.0, moundDist: 8.0,
             baseR: 1.4, fenceY: 3.2, boxAhead: 1.2, benchX: 8.0, benchZ: 1.8 },

    // Pre-pitch stations: [x, depth back from home]. Slot 0 is the pitcher.
    posts: [[0.0, 7.0], [-10.0, 20.0], [10.0, 20.0]],

    // THE DEFENCE REMEMBERS. Three kids cannot cover a 90° wedge out to the
    // fence, so some landing spots are always open — and against a fixed
    // alignment a kicker who can repeat one of them wins forever, which is one
    // answer, not a skill curve. So they shade toward where this team has been
    // putting it. Spread it around and the shade averages out to nothing;
    // groove the same spot and they are standing there in two pitches. The
    // gaps move, and finding them stays the skill.
    // spread is the width of pattern they will still bother reading: scatter
    // your kicks wider than this and the mean means nothing, so they stay home.
    // max is how far they will actually walk. At 12 it was SHORTER than the gap
    // to the deepest groove — the posts sit 20m out and 42m dead centre is 22m
    // past them — so the defence could read that spot perfectly and still be
    // standing 10m in front of it. Being able to reach the thing you have read
    // is the whole mechanism.
    shade: { pull: 0.85, max: 17.0, memory: 0.34, reads: 2, spread: 8.0 },

    pitch: { speed: 10.5, spread: 1.05, zone: 1.5, takeT: 0.30, gap: 0.45 },

    // Kicking is two axes of skill: WHEN (timing -> power) and WHERE
    // (the aim point is the landing spot you are trying to reach).
    kick: {
      window:  0.040,   // dead-centre band, seconds either side of the plate
      maxOff:  0.26,    // past this the kicker swings through it entirely
      powerCurve: 1.0,  // falloff shape once you are outside the window
      minPower: 12.0, maxPower: 30.0,
      minLoft: 0.09, maxLoft: 1.05,
      // How much ARC an aim is allowed to ask for, scaling with how deep you
      // aim. Short aim -> flat screamer that lands early and rolls. Deep aim
      // -> a real fly ball, which is the trade: fence or lazy out.
      flatCap: 0.14, arcCap: 0.52,
      sprayPerSec: 3.2, // radians of direction error per second of mistiming
      // Two loft terms, and between them they ARE the batting game.
      // popPerSec: any mistime lifts the ball. topPerSec is SIGNED — early
      // gets under it and it hangs, late tops it into the dirt.
      popPerSec: 0.9, topPerSec: 1.8,
      maxAngle: 1.15,   // how far off straightaway you may aim (rad)
      aimMin: 6.0, aimMax: 42.0,
      reachR: 2.4,
    },

    ball: {
      g: 20.0, restitution: 0.42, rollFric: 6.0, rollDrag: 1.0, airDrag: 0.10,
      radius: 0.34, carryY: 0.95, catchR: 1.60, flyMinY: 0.70,
      // reachY is deliberately the fence height: a ball you cannot hit OUT is
      // one somebody can get a glove to. Leave a gap between them and every
      // kick threaded through it sails over every head and dies at the wall —
      // an extra-base hit no defence on earth can answer, every single pitch.
      reachY: 3.2,
      grabDelay: 0.14, wallKeep: 0.40,
      // GETTING SET. A catch is not a radius test — it is whether you had time
      // to square up to what is coming at you. The time you need scales with
      // how hard the ball is travelling, so a screamer and a lazy pop are two
      // different plays even when they pass through the same point. Until a
      // fielder is set, only a ball nearly straight at him (hotR of the full
      // radius) is handled cleanly; anything else in reach is KNOCKED DOWN —
      // deflected dead at his feet, still live, nobody out. That is what makes
      // a line drive a hit and a hanging fly ball an out.
      setBase: 0.14, setPerSpeed: 0.030, hotR: 0.34,
      // runPenalty is how much of his hands a kid loses for still being at a
      // dead sprint when a fly arrives; setR is how close to the spot he stops
      // so he can plant. Together they are why MAKING HIM RUN beats a defence.
      runPenalty: 0.20, setR: 1.2,
      knockKeep: 0.18, knockUp: 1.4, knockT: 0.22,
    },

    throw: {
      speed: 26.0, windup: 0.16, cooldown: 0.30, snapR: 3.2, selfLock: 0.16,
      minLoft: 0.06, maxLoft: 0.70, beanLoft: 0.045,
      beanY: 1.6, beanR: 0.55, tagR: 0.30, maxRange: 40.0,
    },

    run: { arriveR: 0.85, ghostSpeed: 6.2, holdR: 0.45 },

    play: { setupT: 0.65, deadT: 0.85, settleT: 0.70, halfT: 1.5,
            maxLiveT: 14.0, maxPitches: 30 },

    // Bots drive the same inputs a player does: aim point, kick, throw, run.
    // readT is the fielders' reaction: nobody breaks on the ball until they
    // have read it, which is what turns a gap into a base hit.
    bot: { timeErr: 0.26, timeCurve: 1.6, skillLo: 0.7, skillHi: 1.3,
           aimJitter: 2.2, readT: 0.14, throwDelay: 0.22, safety: 0.80,
           chaseLead: 0.30, coverPull: 0.35,
           // The man covering the bag breaks cold and has to turn around, so
           // charge him this much on top of the run. recvSlack is how late he
           // may still be when the ball lands in his glove — past that the
           // carrier holds it rather than throwing to an empty bag.
           coverRamp: 0.20, recvSlack: 0.25 },
  },

  cam2k: { back: 17.0, height: 12.5, lookAhead: 0.45, lag: 6.0, fov: 46 },
  camFP: { eye: 1.55, fov: 80, sens: 0.0022, bob: 0.035 },

  cam: {
    height:    23.5,
    tilt:       0.92,
    lag:        7.0,
    lookAhead:  0.34,
    zoomSpeed:  0.05,
  },

  field: { w: 48, h: 33 },
};

// ── difficulty ────────────────────────────────────────────
// One dial the player understands, applied as multipliers over the tuned
// baseline. Varsity IS the baseline — the other tiers bend the bots' hands,
// never their physics, so nobody is ever fighting a cheater.
// The shipped match rules, snapshotted at load while CFG is still pristine.
// Maps carry deltas off this (see MAPS[..].match in layout.js) and every mode
// writes the full set, so no map can leak its rules into the next match.
export const MATCH_DEFAULTS = Object.freeze({
  scoreToWin: CFG.match.scoreToWin,
  duration:   CFG.match.duration,
  respawn:    CFG.tag.respawn,
});

export const TIERS = {
  recess:    { label: 'Recess',    blurb: 'Learning the yard',  reflex: 1.9, aimErr: 2.2, kickErr: 1.7, readT: 1.9, skill: 0.7 },
  varsity:   { label: 'Varsity',   blurb: 'A real game',        reflex: 1.0, aimErr: 1.0, kickErr: 1.0, readT: 1.0, skill: 1.0 },
  allstate:  { label: 'All-State', blurb: 'They do not miss',   reflex: 0.55, aimErr: 0.45, kickErr: 0.55, readT: 0.6, skill: 1.25 },
};

const BASE = {
  botReflexLo: 0.12, botReflexHi: 0.18, botAimErr: 0.5,
  kbTimeErr: 0.26, kbReadT: 0.14, kbAimJitter: 2.2, kbSkillLo: 0.7, kbSkillHi: 1.3,
};
CFG.difficulty = 'varsity';
export function applyDifficulty(tier) {
  const T = TIERS[tier] || TIERS.varsity;
  CFG.difficulty = TIERS[tier] ? tier : 'varsity';
  CFG.bot = {
    reflexLo: BASE.botReflexLo * T.reflex,
    reflexHi: BASE.botReflexHi * T.reflex,
    aimErr:   BASE.botAimErr   * T.aimErr,
  };
  const K = CFG.kickball.bot;
  K.timeErr   = BASE.kbTimeErr   * T.kickErr;
  K.readT     = BASE.kbReadT     * T.readT;
  K.aimJitter = BASE.kbAimJitter * T.aimErr;
  K.skillLo   = BASE.kbSkillLo   * T.skill;
  K.skillHi   = BASE.kbSkillHi   * T.skill;
  return T;
}
applyDifficulty('varsity');

export const TEAMS = {
  blue: { key:'blue', color: 0x3d7dff, dark: 0x1f4bb5, base: { x: -19.0, z: 0 } },
  red:  { key:'red',  color: 0xff4d4d, dark: 0xb52020, base: { x:  19.0, z: 0 } },
};

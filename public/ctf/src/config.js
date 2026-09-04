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

  // ── football (5-on-5, backyard rules) ────────────────────
  // Straight from Madden 09 All-Play's 5-on-5: no kicks, no punts, no
  // penalties, FOUR DOWNS to march the length of the yard, a touchdown is ONE
  // point, first to 5 wins. Playbook of four plays — and you draw your own
  // routes on top of them with the mouse (their "Call Your Shots", made native).
  football: {
    firstTo: 5,
    countdown: 2.6,
    // Pinned pace, same reasoning as kickball: this sport is a footrace
    // between a route, a throw, and an angle of pursuit.
    runnerSpeed: 9.4, runnerAccel: 24.0,
    field: { goalX: 20.0, endzone: 5.0, width: 30.0 },
    snapBack: 2.6,        // QB stands this far behind the line
    // Snap flight, centre to QB — and the ONLY beat in which the brains are
    // consulted between plays (football.js asks them in 'hike' and 'live'
    // only), so it is also the whole line-up window. At 0.4s, 62% of snaps
    // began with the QB less than 1.2m behind his own line and 22% began with
    // him ALREADY past it, which makes a forward pass illegal before the ball
    // is in his hands. This is as long as it can be: the sim's own fallback
    // bots need the defence to be a step late to move the ball at all, and
    // past 0.55s test/football.mjs's stub-vs-stub game stops scoring entirely.
    hikeT: 0.55,
    blitzCount: 2.1,     // "one-mississippi" — rushers hold this long
    routeMax: 4,          // waypoints you may draw per receiver
    // ── the throw (footmech.js) ──
    // Charge picks the PITCH, the cursor picks the SPOT. Nothing homes:
    // you are throwing at grass and leading your man.
    throw: {
      chargeRate: 1.75,   // charge per second held — full bullet in ~0.6s
      touchAt: 0.32,      // below this the ball is floated
      bulletAt: 0.74,     // above this it is a flat bullet
      speed:  { touch: 12.5, normal: 17.5, bullet: 25.0 },
      arc:    { touch: 0.98, normal: 0.52, bullet: 0.20 },  // bulge × √distance
      minAir: 0.22,
      releaseH: 1.55,     // the ball leaves his hand here
      windup: 0.15,       // release animation — you can be sacked during it
      leadCap: 34,
      // accuracy: set your feet and get it off clean, or spray it
      scatterBase: 0.10,  // metres of scatter per 10m, standing still, clean
      scatterMove: 0.60,  // ...added at a full sprint
      scatterPress: 0.95, // ...added with a rusher in your face
      scatterBullet: 0.16,// ...added for forcing the bullet
      pressR: 3.2,        // a rusher inside this is pressure
    },
    // ── the catch window (footmech.js) ──
    catching: {
      catchH: 2.35,       // the ball is playable below this height
      landH: 0.9,         // where it arrives
      reachR: 1.5,        // hands, standing
      pressReach: 0.35,   // ...attacking the ball
      diveReach: 1.7,     // ...laid out for it
      pressBonus: 0.55, diveBonus: 0.5,
      pressT: 0.34,       // how long a press stays hot
      pressLock: 0.22,    // re-press cooldown — mashing does not help
      diveT: 0.55, diveSpeed: 7.5,   // reaching for it, not launching at it
      selfLock: 0.05, throwerLock: 0.45,   // the QB cannot catch his own pass
      offMinDist: 4.0,    // ...and your own side cannot catch it before it clears the line
      contestR: 2.3,
      pickAt: 0.55, pickMargin: 0.12,      // clean play on it = interception
      // drops: the ball is not glue
      dropBase: 0.02, dropAuto: 0.13, dropContest: 0.16,
      dropBullet: 0.14, bulletNear: 9.0, dropBack: 0.10, dropMax: 0.5,
    },
    // ── carrying the ball (footmech.js) ──
    carry: {
      jukeT: 0.38, jukeSpeed: 9.0, jukeCost: 0.26,
      spinT: 0.50, spinSpeed: 7.5, spinCost: 0.34, spinVsDive: 0.45,
      truckT: 0.40, truckSpeed: 3.4, truckCost: 0.30, truckStun: 0.85,
      sprintAt: 7.5,      // moving faster than this counts as sprinting
      sprintDrain: 0.30, stamRegen: 0.50,
      tiredAt: 0.15, tiredMul: 0.86,
      gatherSlow: 0.45,   // a bobbled catch costs you a beat
    },
    // ── tackling (footmech.js) ──
    tackle: {
      // ⚠ Both radii MUST clear separateBodies' floor of a.r + b.r = 1.24m.
      // Two kids can never stand closer than that, so a wrap range inside it
      // is unreachable and tackling silently cannot happen — measured as a
      // whole season with 0.0 tackles per game.
      diveT: 0.40, diveSpeed: 12.5, diveR: 1.6, diveWhiff: 1.35,
      wrapR: 1.62,        // hands on you without a dive
      wrapFill: 1.65,     // wrap meter per second (1.0 = down)
      wrapDrain: 2.4,     // ...drains this fast once you are clear
      gangMul: 2.3,       // a second tackler fills it this much faster
      wrapSlow: 0.42,     // how much a wrap slows the carrier
    },
    block: { engageR: 1.3, slow: 0.5, shedT: 0.9 },
    deadT: 1.1,           // whistle-to-huddle beat. Nothing moves during it —
                          // no brain runs, so the seconds it costs buy nothing —
                          // and the line-up beat above is where they went.
    celebrateT: 2.2,

    // ── bot brains (footbrain.js reads nothing but this block) ──
    // Rebuilt for footmech: the old set tuned a CTF lunge and a one-click
    // throw, and half of it addressed mechanics that no longer exist.
    bot: {
      hustleDash: 1.2,    // dash back to your line-up spot from this far out
      releaseLead: 0.30,  // receivers break on the last beat of the snap, not
                          // the first — a long snap is not a head start
      lineupSlack: 1.6,   // ...unless you are still this far from your spot,
                          // in which case you are late and you keep running
      planSpeed: 10.2,    // speed the brains assume when solving an intercept
                          // (above footspeed on purpose: dash makes up the rest)

      // ── the QB's read ──
      // Three pitches, scored on the ball predictThrow says will actually be
      // thrown: touch over the top, normal, bullet into a window.
      charges: [0.16, 0.5, 0.9],
      minThrow: 2.5,      // shorter than this is a handoff, not a pass
      backThrowMax: 4.0,  // never throw to a man deeper than this behind the line
      ownSlack: 1.2,      // a spot my own man cannot run down is not a read
      leadTrim: 0.95,     // lead him a stride EARLY: the model runs him at book
                          // speed, the real man is still accelerating
      leverR: 6.0,        // a shadow this close is worth throwing away from
      leverOff: 1.4,      // ...by this much, so only his man arrives on it
      reactT: 0.24,       // measured: a defender takes this long to turn and go...
      covSpeed: 9.0,      // ...and then eats the gap at this...
      sepFloor: 2.3,      // ...down to here, and no closer: he arrives goal-side
                          // of the catch, not on top of it (measured across a
                          // season of real arrivals, and flat in flight time)
      sepCap: 4.5,        // separation past this stops sweetening a read
      depthW: 0.26,       // how much downfield depth sweetens a read
      ezBonus: 2.0,       // a catch in the paint is six — take it...
      ezSep: -1.0,        // ...but only if somebody is actually going to catch it
      // flight fractions checked for traffic underneath — dense at the front,
      // because the ball is lowest and the rush is closest right at release
      laneKs: [0.04, 0.09, 0.16, 0.26, 0.40, 0.56, 0.74, 0.90],
      laneChase: 0.75,    // how much of a defender's speed counts toward the lane
      laneNear: 1.0,      // lane traffic is counted from this far out...
      laneFar: 2.5,       // ...to this far short of the catch (that end is `sep`)
      laneR: 2.6,         // a body this near the line, when the ball is low, is traffic
      laneW: 2.0,         // ...and one full body in the lane costs the read this much
      laneVeto: 0.55,     // ...and past this it is simply not a throw
      airW: 1.00,         // every second of hang time is a second of pursuit
      scatterW: 1.2,      // metres of predicted spray, priced into the read
      minHold: 0.65,      // never throw before the routes have had a beat
      // How open the man has to be, in METRES OF DAYLIGHT AT THE CATCH. That
      // is the number the mechanics actually settle on, so it is the number he
      // reads. It starts as a real window and shrinks as the pocket does.
      // Measured sweep across a season, holding everything else fixed:
      //   sepWant/sepMin   throwaways/game   completions/game   picks/game
      //        5.2 / 2.30       18.0               8.2              0.2
      //        4.0 / 1.80        7.2              10.3              1.2
      //        2.6 / 1.00        5.5              11.5              1.0
      //        2.0 / 0.60        5.8              10.0              2.5
      // At the old ask the QB liked almost nothing and threw it away on THREE
      // OF EVERY FOUR dropbacks, which is why the passing game read as broken.
      // Worse, sepMin sat exactly on sepFloor — the closest a defender can
      // ever model as arriving — so a covered man was permanently a hair under
      // the bar and any other penalty tipped him out.
      sepWant: 2.6,       // ...at minHold
      sepDecay: 2.2,      // ...falling off this fast
      sepPress: 1.0,      // a rusher in the picture buys this much off the ask
      sepFourth: 0.5,
      rawMin: -0.6,       // and a bracket this deep is not a read at any urgency     // fourth down: take the shot
      sepMin: 1.00,       // and never worse than this — at the floor the defence
                          // is as near the ball as his own man is
      tuckAfter: 0.95,    // no tucking before the play develops...
      tuckUntil: 1.50,    // ...and none once it is time to get rid of it
      scrambleArc: 1.25,  // headings he will consider running (half-arc, rad)
      scrambleFwd: 0.55,  // how much he prefers straight ahead to a bounce
      scrambleFree: 1.20, // ...and he only goes if nobody can cut it off for
                          // this long, which is about fifteen metres
      dumpT: 0.50,        // under real duress past this, throw it away
      bailT: 1.55,        // and past this, throw it away regardless
      awayDirs: 9, awayRange: [7, 11, 15],  // candidate patches of empty grass
      awayOut: 2.5,       // ...allowed this far past the sideline
      awayMin: 2.6,       // ...and only if it has this much daylight around it
      awayLine: 1.2,      // a body beside the line to it counts nearly as close
      awayNear: 0.3,      // ...counted from right off the hand
      awayCharge: 0.15,   // FLOAT it: over the rusher's head inside one stride
      dropDepth: 1.2,     // extra depth the drop settles to behind the snap spot
      pressR: 3.0,        // a rusher this close is pressure
      sackR: 1.9,         // a rusher this close is now-or-never
      qbFleeR: 4.0,       // after the throw he is still the sim's carrier: run
      // escaping the rush without leaving the pocket
      escapeDirs: 12, escapeStep: 3.0,
      pocketDepth: 0.8,   // he wants to stay at least this far behind the line
      deepPocket: 6.0,    // ...but drifting deeper than this is its own sack
      deepPen: 1.5,
      // ── the counter loop, from the carrier's side ──
      dodgeR: 4.2,        // a dive launched this near me is a threat
      dodgeAim: 0.35,     // ...if its line points this squarely at me (cos)
      jukeLook: 2.0,      // hop the way that still leaves me this much field
      spinAt: 0.7,       // spin once the drag clock has filled this far...
      spinGang: 0.22,     // ...or this far with a second set of hands on you,
                          // because two of them fill it 2.3x as fast
      truckSpeedMin: 4.0, // you cannot run a man over from a standstill
      truckR: 2.6,        // a stander this close in front...
      truckAim: 0.60,     // ...and this squarely in my path (cos) gets trucked

      // ── attacking the ball, both teams ──
      pressR2: 2.6,       // press when the ball is within this (receiver)
      pressDefR: 1.45,    // a DEFENDER must have hands on it — a takeaway is a
                          // play on the ball, not standing in the right postcode
      pressLeadT: 0.32,   // ...and inside this of arriving (press lasts 0.34s)
      pressH: 0.55,       // ...or already this near the catch ceiling (receiver)
      pressArea: 7.0,     // ...a defender only in his own area, never over the
                          // release, where the ball leaves the hand under the
                          // ceiling and the man rushing is the nearest body
      diveCatchT: 0.30,   // lay out only inside this of arrival...
      diveCatchGap: 0.5,  // ...and only when it is truly past your legs

      // ── receivers and blocking ──
      routeDashLeg: 5.0,  // dash a route leg longer than this
      driftStep: 4.0,     // past the route, keep carrying the last leg this far
      openR: 4.0,         // a defender this near while working...
      openSlide: 1.6,     // ...pushes the drift this far off him
      blockGap: 0.55,     // stand this far off the man you are screening —
                          // footmech engages a block at 1.3m and two bodies
                          // cannot be closer than 1.24m, so aim AT him
      blockR: 7.0,        // only screen defenders this near the action
      blockStickT: 0.9,   // committed to your man this long — no perfect switching
      convoyR: 2.0,       // never take a block that parks you this near the carrier

      // ── the dive tackle ──
      // Probed live: a dive reaches 3.7m from dead astern of a full-speed
      // runner, 4.5m at 45°, 5.5m from the side, 9m head-on. That is a
      // straight line in CLOSING SPEED, and this is its fit.
      diveBase: 3.3, diveClose: 0.26,
      diveLead: 0.16,     // seconds of carrier velocity the dive aims ahead
      divePadMate: 0.8,   // the second man needs it this much surer
      diveSackPad: 2.4,   // A rusher leaving his feet at a man who can still
                          // throw it is a huge bet, and unpriced it was the whole
                          // pass rush: measured, 80 of 93 sacks were dives, half
                          // of them landing from five metres out.
      diveSkipWrap: 0.55, // don't dive onto a man already going down in a gang

      // ── coverage ──
      covLev: 0.9,        // goal-side CUSHION on your man. Tight man in a
                          // 5-on-5 with no safety help makes every catch a
                          // coin flip the defence wins — play off, keep him
                          // in front, and tackle the catch
      covShade: 0.5,      // shade off your man's centre line
      shadeWideZ: 6.0,    // wider than this, shade OUTSIDE (kill the quick out);
                          // inside it, shade toward the middle — funnel to help
      covLead: 0.14,      // seconds of his ROUTE you sit on (not his velocity)
      covDash: 3.5,       // dash to catch up from this far off him
      beatBy: 0.7,        // he is this much deeper = you are beaten, recover deep
      recoverLead: 0.5,   // ...and the recovery angle aims this far up his route
      // the ball is up
      ballGoers: 1,       // this many defenders leave coverage for the ball
      ballSlack: 1.1,     // chase a throw you can reach within this of its landing
      pickMargin: 0.1,    // beat everyone by this to the spot = go pick it clean
      contestWin: 0.5,    // within this of the receiver's race = play the ball
      awayX: 5.0,         // the last-ditch fence ball goes this far downfield
      raceOff: 1.5,       // Contest from GOAL-SIDE. The ball flies from the QB to
                          // the spot, so a defender past it is behind the ball the
                          // whole way and the man it was thrown to gets it first;
                          // sprinting to the exact spot just makes him a receiver.
      ballOff: 2.4,       // clearly late = arrive goal-side by this and wrap the catch
      rallyDepth: 5.0,    // late men rally goal-side of the catch by this

      // ── the rush ──
      rushSplit: 1.1,     // the two rushers keep this much lateral bracket
      holdX: 1.1,         // where the line waits out the count
      runKeyV: 4.5,       // QB lateral speed that reads RUN and breaks the count
      edgeLead: 3.5,      // the play-side rusher sets the corner this far ahead
      runKeyX: 1.2,       // QB this close to the line reads RUN too. His own
                          // line-up is 2.6m deep and he snaps at 2.2m on average,
                          // so 2.2 here read every drop-back as a keeper and
                          // turned the count off before the ball was in his hands.
      beatR: 2.2,         // a blocker this close owns you — take an angle instead
      beatDepth: 0.4,     // ...aiming this far past the QB
      beatWide: 3.0,      // ...and this far to the side he is not standing on
      fillDepth: 2.6,     // your man shallower than this on a run key = shed and fill
      fillLineX: 0.5,     // a run fit never crosses the line — fill at this depth

      // ── pursuit ──
      cutoffGap: 4.5,     // depth ladder between pursuit ranks
      surroundR: 6.0,     // this close, non-hunters stop chasing and CONTAIN
      gangR: 3.5,         // ...unless he is already wrapped: then pile on, because
                          // a second set of hands fills the drag clock 2.3× faster
      bracketZ: 2.2,      // cutoff men straddle the runner's lane by this
      containGap: 2.2,    // the contain arc sits this far off the carrier
      containArc: 0.75,   // ...rotated goal-side by this much (radians)
      shedProj: 3.2,      // a body within this along your path is a screen
      shedPerp: 1.3,      // ...if it sits this close to your line
      shedSide: 1.8,      // swing this wide around it, on the empty side
      dashChase: 3.0,     // dash while the gap is bigger than this
      hunterDash: 1.6,    // the hunter dashes even into contact range
      pursuitGoalW: 0.45, // how much pursuit bends the carrier's heading goalward

      // ── the carrier's lane read ──
      vision: 9.0,        // pursuers inside this shape the lane choice
      lanes: 9, laneArc: 1.05, // candidate headings, half-arc in radians
      laneArcBoxed: 2.6,  // boxed in? look nearly everywhere for the bounce
      crowdR: 2.2,        // any body this near a lane's next step is a wall
      crowdPen: 0.8,      // ...and costs the lane this much
      horizon: 0.8,       // seconds ahead a lane is judged
      freeW: 0.6, freeCap: 2.5, // value of a second of freedom, capped
      sidePad: 2.2, sidePen: 1.2, // sideline discomfort without a lead
      stepOutBand: 6.5,   // pinned this close to the boundary...
      stepOutT: 0.85,     // ...with a tackler closing within this...
      stepOutD: 3.4,      // ...or already this near...
      stepOutGoal: 6.0,  // ...and no shot at the corner: step out, take the spot
      carrierBailT: 5.0,  // cornered this long with no lead: take the whistle
      dashAngleT: 2.2,   // dash to break an angle closing within this
      dashProject: 6.0,   // where a dash puts you — it is not steerable...
      dashEdge: 4.5,      // ...so keep this much sideline in hand before firing
      finishDash: 40.0,   // ...or to finish: dash home inside this range
    },
  },

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

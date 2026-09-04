import { CFG } from './config.js';
import { PLAYS, PLAY_KEYS } from './football.js';

// ─────────────────────────────────────────────────────────────
// FOOTBALL control: you are the whole TEAM, not one kid — and now you have
// hands. footmech gave the sport a throw you wind up, a catch you time, and
// a counter loop you play with your fingers. This file is the only place a
// human can reach any of it, so every verb on G gets exactly one gesture:
//
//   HUDDLE    1-4 (or the HUD cards) call the play. Drag off a receiver to
//             draw his route; right-click puts the book's route back. ENTER,
//             or a click on the QB, snaps it.
//   QB        WASD scrambles. HOLD left mouse to wind up — the charge picks
//             the pitch (touch / normal / bullet), the cursor picks the spot,
//             and G.aim.pred is the exact ball that will be thrown, so the
//             preview never lies. RELEASE throws. A flick of a click is a
//             touch pass, never a swallowed input. SHIFT or right-click
//             tucks it: the wind-up is abandoned and he runs.
//   THE BALL  once it is up, control jumps to G.claimant(myTeam) — the kid
//             with the best claim on it, ours or theirs. LEFT CLICK is the
//             timed press; click again (or click while he is plainly short)
//             and he lays out for it.
//   CARRY     WASD runs, SPACE sprints, Q/E juke to that side of his
//             heading (A/D double-tap does the same), SHIFT or right-click
//             spins, LEFT CLICK trucks.
//   DEFENCE   control follows the play — the ball's landing spot while it is
//             up, the carrier once somebody has it. LEFT CLICK dives at the
//             cursor.
//
// Two rules run through all of it:
//
//   NOTHING IS A DEAD CLICK. A committed move you asked for too early is
//   held as INTENT for a beat and fires the moment it becomes legal, and
//   holding the button keeps that intent armed. You press when you decide,
//   not when the sim is ready.
//
//   HANDS OFF, THE KID STILL PLAYS. The driver returns null for everyone the
//   human is not actually steering, so football.js's botInput (and through
//   it footbrain) runs the other nine — and the one you ARE steering goes
//   back to his brain the moment you let go of the stick, not a beat later.
//   That applies to the QB in the pocket too: a driver that pinned him
//   whenever he still had a throw fed him a zero input all play and never
//   consulted his brain, which is a sack on every snap. Only a live wind-up
//   pins a kid to you. The verbs are imperative calls on G, so a click still
//   lands on a kid you are letting run himself.
//
// The one thing bots cannot do is CALL the game: callPlay/snap are outside
// verbs the sim never presses, so this layer also runs the CPU sideline when
// the other team has the ball.
// ─────────────────────────────────────────────────────────────
const K = () => CFG.football;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (ax, az, bx, bz) => Math.hypot(ax - bx, az - bz);
// feel knobs. Read through CFG with the shipped value as the fallback, so a
// later tuning pass can move any of them without touching this file.
const T = (k, d) => K()[k] ?? d;

const DIGITS = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3,
                 Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 };
// double-tap keys, and the side of his OWN body each one names
const LAT = { KeyA: -1, ArrowLeft: -1, KeyD: 1, ArrowRight: 1 };

const HINT = {
  call:    '1-4 pick a play · drag a kid to draw his route',
  set:     'drag a route · right-click resets him · ENTER snap',
  defWait: 'defence · read the routes',
  qb:      'HOLD click charge · release throw · WASD scramble',
  tuck:    'WASD run · SHIFT tuck it and go',
  carrier: 'WASD run · SPACE sprint · Q/E juke · SHIFT spin · click truck',
  catch:   'click catch · click again to lay out',
  defBall: 'click to play the ball · click again to lay out',
  defence: 'WASD chase · SPACE sprint · click dive tackle',
};

// nearest of a team's kids to a point — the auto-handoff that makes defence
// playable. A kid face-down in the grass is nobody's idea of "the guy", so he
// is only picked when there is literally no one else.
function nearest(G, team, x, z) {
  let best = null, bd = 1e9, fall = null, fd = 1e9;
  for (const a of G.actors) {
    if (a.team !== team) continue;
    const d = dist(a.x, a.z, x, z);
    if (d < fd) { fd = d; fall = a; }
    if ((a.m?.prone || 0) > 0.15) continue;
    if (d < bd) { bd = d; best = a; }
  }
  return best || fall;
}

// Where he is going, normalised: his feet first, his eyes if he is standing
// still, downfield if he has neither.
function heading(G, a) {
  let hx = a.vx || 0, hz = a.vz || 0;
  let m = Math.hypot(hx, hz);
  if (m < 0.6) { hx = Math.sin(a.aim || 0); hz = Math.cos(a.aim || 0); m = Math.hypot(hx, hz); }
  if (m < 1e-4) { hx = G.dir(); hz = 0; m = 1; }
  return [hx / m, hz / m];
}
// His LEFT, with Y up: (hz, -hx). The rig is a fixed sideline broadcast, so
// that is also screen-left of wherever he happens to be pointed.
function lateral(G, a, side) {
  const [hx, hz] = heading(G, a);
  return side < 0 ? [hz, -hx] : [-hz, hx];
}
function nearestFoeD(G, a) {
  let bd = 1e9;
  for (const e of G.actors) {
    if (e.team === a.team || (e.m?.prone || 0) > 0) continue;
    bd = Math.min(bd, dist(e.x, e.z, a.x, a.z));
  }
  return bd;
}
// is anybody airborne at him right now — the cue that a juke is the answer
function diveIncoming(G, a) {
  for (const e of G.actors)
    if (e.team !== a.team && (e.m?.dive || 0) > 0 && dist(e.x, e.z, a.x, a.z) < 4.5) return true;
  return false;
}

export function makeFootControl() {
  const S = {
    G: null, steering: null, hint: '', prompt: '', t: 0,
    drag: null, custom: {}, coachT: 0,
    prevR: false,                    // right button last tick, for its own edge
    noCharge: false,                 // tucked out of a wind-up, button still down
    charging: false, charge: 0, aimPt: { x: 0, z: 0 }, cursor: { x: 0, z: 0 },
    bufAct: 0, bufCatch: 0, cd: 0,   // held intent + the held-button re-fire guard
    wheelT: 0, tapT: {},             // post-move grace window + double-tap clock
  };
  const grabR = () => T('routeGrabR', 2.0);      // how close a click must land to a kid
  const gapM  = () => T('routePointGap', 1.2);   // decimation: min metres between drawn points

  // Snap only once the QB is behind his own line. The sim takes a snap from
  // anywhere — but a QB still jogging back from the last play is PAST the
  // line, and the first live tick flags the play as a run (G.crossed), which
  // silently forbids every throw. An early ENTER just waits for him.
  function trySnap(G) {
    const q = G.qb;
    if (!q || (q.x - G.losX()) * G.dir() > -0.5) return false;
    return G.snap();
  }

  // ── the CPU sideline ─────────────────────────────────────
  // The sim has no coach: callPlay and snap are outside verbs, and nothing
  // in football.js presses them. Somebody must call the game for the other
  // team or a CPU possession never leaves the huddle.
  function coach(G, dt) {
    S.coachT += dt;
    if (G.phase === 'huddle') {
      if (S.coachT < T('coachHuddleT', 1.0)) return;
      const toGo = G.toGo();
      let key = PLAY_KEYS[(G.drive * 3 + G.down) % PLAY_KEYS.length];   // vary the look
      if (toGo <= T('coachShortToGo', 8)) key = 'sweep';                // short: run it
      else if (G.down >= 4 && toGo > 14) key = 'long';                  // desperate: air it out
      if (G.callPlay(key)) S.coachT = 0;
    } else if (G.phase === 'set') {
      const tol = T('coachSetTol', 1.7);
      let ready = true;
      for (const a of G.offence())
        if (a.station && dist(a.x, a.z, a.station.x, a.station.z) > tol) { ready = false; break; }
      if (ready || S.coachT > T('coachPatience', 4.0)) { if (G.snap()) S.coachT = 0; }
    }
  }

  // ── Call Your Shots ──────────────────────────────────────
  // Squeeze a long scribble down to routeMax waypoints, always keeping the
  // endpoint — the END of a route is where the throw goes; truncating it
  // would betray the drawing.
  function resample(pts) {
    const max = K().routeMax;
    if (pts.length <= max) return pts;
    const out = [];
    for (let i = 0; i < max; i++) out.push(pts[Math.round(i * (pts.length - 1) / (max - 1))]);
    return out;
  }
  // Routes live in G.routes and only callPlay writes the book's defaults —
  // so "restore one slot" is: re-call the play (defaults for everybody),
  // then lay the surviving hand-drawn routes back on top.
  function rebuild(G) {
    if (!G.play) return;
    G.callPlay(G.play);
    for (const [slot, pts] of Object.entries(S.custom)) G.setRoute(+slot, pts);
  }
  function pickSlot(G, pt) {
    let slot = 0, bd = grabR();
    const off = G.offence();
    for (let i = 2; i <= 4; i++) {
      const d = dist(off[i].x, off[i].z, pt.x, pt.z);
      if (d < bd) { bd = d; slot = i; }
    }
    return slot;                                   // 0 = nobody close enough
  }
  function callBook(G, i) {
    if (G.callPlay(PLAY_KEYS[i])) S.custom = {};   // a fresh call wipes your scribbles
  }

  // main.js feeds these WORLD points
  function beginRouteDrag(pt) {
    const G = S.G;
    if (!G || (G.phase !== 'huddle' && G.phase !== 'set')) return false;
    const slot = pickSlot(G, pt);
    if (slot) {
      const a = G.offence()[slot];
      S.drag = { slot, last: { x: a.x, z: a.z }, pts: [] };
      S.noCharge = true;                           // this press belongs to the chalk
      return true;
    }
    // not on a receiver — was it the QB? clicking him hikes the ball
    const q = G.qb;
    if (q && G.phase === 'set' && dist(q.x, q.z, pt.x, pt.z) < grabR()) {
      // ...and the button that snapped it must not roll straight into a
      // wind-up when the ball arrives: no charging until you let go.
      if (trySnap(G)) { S.noCharge = true; return true; }
    }
    return false;
  }
  function dragRoute(pt) {
    const G = S.G, D = S.drag;
    if (!G || !D) return;
    if (dist(pt.x, pt.z, D.last.x, D.last.z) < gapM()) return;
    D.last = { x: pt.x, z: pt.z };
    D.pts.push(D.last);
    G.setRoute(D.slot, resample(D.pts));           // live preview — chalk appears as you draw
  }
  function endRouteDrag() {
    const G = S.G, D = S.drag;
    S.drag = null;
    if (!G || !D || !D.pts.length) return false;   // a bare tap on a kid draws nothing
    const pts = resample(D.pts);
    if (G.setRoute(D.slot, pts)) S.custom[D.slot] = pts;
    return true;
  }
  function clearRoute(pt) {
    const G = S.G;
    if (!G || (G.phase !== 'huddle' && G.phase !== 'set')) return false;
    const slot = pickSlot(G, pt);
    if (!slot) return false;
    delete S.custom[slot];
    rebuild(G);
    return true;
  }
  // the HUD play buttons — accepts a book key ('sweep'…) or '1'..'4'
  function onPlayButton(key) {
    const G = S.G;
    if (!G) return false;
    const i = PLAYS[key] ? PLAY_KEYS.indexOf(key) : (+key >= 1 && +key <= 4 ? +key - 1 : -1);
    if (i < 0) return false;
    callBook(G, i);
    return true;
  }

  // ── the throw ────────────────────────────────────────────
  // The wind-up and the release aim at the SAME point, so what the preview
  // draws is what leaves his hand. A cursor sitting on his own shoes would
  // be refused by releaseThrow (dist < 1.2) and eat the click, so the point
  // is pushed out along the direction you asked for: a mis-aimed click is a
  // dump-off, never nothing.
  function throwPoint(G, cx, cz) {
    const q = G.qb;
    if (!q) return { x: cx, z: cz };
    let dx = cx - q.x, dz = cz - q.z;
    let d = Math.hypot(dx, dz);
    const min = T('ctlMinThrow', 2.2);
    if (d >= min) return { x: cx, z: cz };
    if (d < 0.05) { dx = G.dir(); dz = 0; d = 1; }
    return { x: q.x + (dx / d) * min, z: q.z + (dz / d) * min };
  }
  // There is no cancelCharge verb — G.aim is plain state the sim itself
  // clears in three places, and abandoning a wind-up is exactly that write.
  function dropAim(G) { G.aim.active = false; G.aim.charge = 0; }

  // ── the driver ───────────────────────────────────────────
  // `inp` is the raw player input for this tick (dx/dz already rotated into
  // world space, aimX/aimZ the world cursor); `keys` is the live key set.
  function driver(G, inp, keys, myTeam, dt = 1 / 60) {
    S.G = G; S.t += dt;
    const dec = k => { if (S[k] > 0) S[k] = Math.max(0, S[k] - dt); };
    dec('bufAct'); dec('bufCatch'); dec('cd'); dec('wheelT');

    // THE MOUSE. input.js reports the left button three ways — the press edge,
    // whether it is still down, and the release edge — which is the whole
    // vocabulary a wind-up needs. A click that opens and closes inside one
    // 60 Hz tick arrives as press AND release together, and that is what makes
    // a flick of the mouse a legal touch pass instead of a swallowed input.
    // An older input.js with only the edge still plays: every click is a flick.
    const taps = inp.taps || new Set();
    const lPress = inp.primary ? 1 : 0;
    const lHeld = inp.hold ?? false;
    const lRel = (inp.release ?? (inp.hold === undefined && inp.primary)) ? 1 : 0;
    // The right button gets its OWN edge off the held flag: inp.special folds
    // E into right-click, and E is the juke key — one press must not be two
    // different moves.
    const rNow = inp.holdR ?? false;
    const rPress = ((rNow || inp.releaseR) && !S.prevR) ? 1 : 0;
    S.prevR = rNow;
    if (!lHeld) S.noCharge = false;

    const shiftTap = taps.has('ShiftLeft') || taps.has('ShiftRight');
    const shiftDown = keys.has('ShiftLeft') || keys.has('ShiftRight');
    // SPACE held, not the edge input.js hands out: dash has its own cooldown,
    // so re-arming it every tick is what "hold to sprint" actually means.
    // (Shift is spin here, and must never double as a dash.)
    const sprint = keys.has('Space');
    const cx = inp.cursor?.x ?? inp.aimX, cz = inp.cursor?.z ?? inp.aimZ;
    S.cursor.x = cx; S.cursor.z = cz;
    const steerMag = Math.hypot(inp.dx, inp.dz);
    // HANDS OFF IS INSTANT — the kickball rule. A latch that kept the wheel for
    // a second after you let go did not hand the kid back to his brain, it
    // handed him a ZERO: `drive()` feeds inp.dx/dz straight through, so a
    // neutral stick froze a ball carrier (or a receiver under a deep ball) on
    // the spot for a full second. The latch survives only as a grace window
    // after a committed move, where the sim is moving him kinematically anyway.
    const handsOn = () => steerMag > 0.05 || S.wheelT > 0;
    const none = () => null;
    const drive = (a) => (x) => (x === a ? { dx: inp.dx, dz: inp.dz, dash: sprint,
      primary: false, special: false, aimX: cx, aimZ: cz } : null);

    // dead / between plays. The wind-up dies WITH the whistle: the sim only
    // clears G.aim at the next huddle, and a live preview drawn over a play
    // that is already over is a lie the view would happily paint.
    if (G.over || G.phase === 'countdown' || G.phase === 'dead') {
      if (G.aim.active) dropAim(G);
      S.steering = null; S.hint = ''; S.prompt = ''; S.coachT = 0;
      S.bufAct = S.bufCatch = S.wheelT = 0; S.charging = false; S.noCharge = true;
      G.spotlight = null;
      return none;
    }

    const mine = G.possession === myTeam;

    // ── the huddle: the only place the human is a coach ──
    if (G.phase === 'huddle' || G.phase === 'set') {
      S.charging = false;
      if (mine) {
        S.coachT = 0;
        for (const k of taps) if (DIGITS[k] !== undefined) { callBook(G, DIGITS[k]); break; }
        if (taps.has('Enter') || taps.has('NumpadEnter')) trySnap(G);
        S.hint = G.play ? HINT.set : HINT.call;
        S.prompt = G.play ? 'SNAP' : 'PICK A PLAY';
        S.steering = G.qb;                         // ring the kid who takes the snap
      } else {
        coach(G, dt);                              // the CPU calls its own game
        S.hint = HINT.defWait; S.prompt = '';
        S.steering = null;
      }
      G.spotlight = S.steering;
      return none;                                 // everybody walks to his spot on bot brains
    }
    S.coachT = 0;

    if (G.phase === 'hike') {
      S.steering = mine ? G.qb : null;
      S.hint = mine ? HINT.qb : HINT.defence;
      S.prompt = mine ? 'HOLD TO THROW' : 'CHASE';
      G.spotlight = S.steering;
      return none;                                 // nobody moves through a snap
    }

    // ── live ──
    const b = G.ball, C = K().catching;
    if (G.aim.active && !G.canThrow()) dropAim(G);  // sacked / crossed mid-wind-up
    S.charging = G.aim.active;
    S.charge = G.aim.charge;

    // ── the ball is up: the catch is the only thing that matters ──
    if (b.inAir) {
      const me = G.claimant(myTeam) || nearest(G, myTeam, b.tx, b.tz);
      S.steering = me; G.spotlight = me;
      S.hint = mine ? HINT.catch : HINT.defBall;
      S.prompt = '';
      if (!me) return none;

      const d = dist(me.x, me.z, b.x, b.z);        // to the ball itself, not the spot
      const late = Math.max(0, (b.air || 0) - (b.t || 0));
      const travelled = dist(b.sx ?? b.x, b.sz ?? b.z, b.x, b.z);
      // his own side cannot legally touch it until it clears the line
      const legal = !mine || travelled >= (C.offMinDist ?? 0);
      const low = b.y <= C.catchH;
      const near = T('ctlCatchNear', 2.3);
      const diveMax = T('ctlDiveCatchR', 4.2);
      const diveWin = T('ctlDiveCatchT', 0.9);
      // A lay-out is a commitment — it travels at the ball's CURRENT spot and
      // leaves you prone if you are wrong — so it is only offered once the
      // ball is nearly down. Before that a click is just a press, which costs
      // nothing: an eager click becomes a free attempt rather than a whiff.
      const canDive = legal && d > near && d < diveMax && (low || late < diveWin);
      if (lPress) {
        const again = (me.m?.catchPress || 0) > 0;   // "click again to lay out"
        if (canDive && (again || d > near + 0.6)) { if (G.diveCatch(me)) S.cd = T('ctlActCd', 0.22); }
        else if (!G.pressCatch(me)) S.bufCatch = T('ctlBufferT', 0.35);   // locked out — hold it
      } else if (S.bufCatch > 0 && legal && (low || late < 0.5)) {
        if (G.pressCatch(me)) S.bufCatch = 0;
      }
      S.prompt = !legal ? '' : d <= near ? 'CATCH' : canDive ? 'LAY OUT' : 'GET UNDER IT';

      // A light hand on the wheel: while you steer, he leans toward the spot
      // the ball is coming down on. You still drive — but a kid under a deep
      // ball should not be asking you to solve ballistics with WASD.
      if (!handsOn()) return none;                 // hands off: his brain runs him
      let dx = inp.dx, dz = inp.dz;
      const k = clamp(1 - late / 1.4, 0, 1) * T('ctlBallAssist', 0.5);
      if (k > 0.01 && steerMag > 0.05) {
        const lx = b.tx - me.x, lz = b.tz - me.z, L = Math.hypot(lx, lz) || 1;
        dx = dx * (1 - k) + (lx / L) * k;
        dz = dz * (1 - k) + (lz / L) * k;
        const m2 = Math.hypot(dx, dz) || 1;
        dx /= m2; dz /= m2;
      }
      return (a) => (a === me ? { dx, dz, dash: sprint, primary: false, special: false,
                                 aimX: b.tx, aimZ: b.tz } : null);
    }

    // ── our ball, in somebody's hands ──
    if (mine) {
      const car = G.carrier;
      if (!car || car.team !== myTeam) {
        S.steering = null; G.spotlight = null; S.hint = ''; S.prompt = '';
        return none;
      }
      S.steering = car; G.spotlight = car;

      // THE POCKET: he still has a throw, so the left button is the wind-up.
      // `windup` is the 0.15s after the release, before the ball is out of his
      // hand — canThrow() is already false there and G.aim is already clear, so
      // without folding it in the driver dropped straight into THE CARRY and
      // offered a man mid-throw a spin and a truck.
      const windup = G.throwWind > 0;
      if (G.canThrow() || G.aim.active || windup) {
        const pt = throwPoint(G, cx, cz);
        S.aimPt = pt;
        // tuck it: abandon the wind-up and run. Held-down button stays dead
        // until you let go, or the next tick would start charging again.
        const tuck = !windup && (rPress > 0 || shiftTap);
        if (tuck) { if (G.aim.active) { dropAim(G); S.noCharge = true; } else G.spin(car); }
        if (G.aim.active) {
          // Let go and you get EXACTLY the ball you were last shown: the
          // release spends the charge the preview was drawn from rather than
          // sneaking one more frame of wind-up in underneath it, which is the
          // difference between a bullet you chose and a bullet you were given.
          if (lRel > 0 || !lHeld) G.releaseThrow(pt.x, pt.z);
          else G.stepCharge(dt, pt.x, pt.z);       // still holding: the preview IS the throw
        } else if (!windup && (lPress > 0 || (lHeld && !S.noCharge)) && !tuck && G.beginCharge()) {
          G.stepCharge(dt, pt.x, pt.z);            // a same-tick click is a touch pass
          if (lRel > 0) G.releaseThrow(pt.x, pt.z);
        }
        // the juke is still his: a rusher leaving his feet at a man holding
        // the ball is answered the same way whether or not he can throw it
        if (!G.aim.active && !windup) jukeVerb(G, car, inp, taps);
        S.charging = G.aim.active; S.charge = G.aim.charge;
        const pitch = G.aim.pred?.type;
        S.hint = G.aim.active ? `${pitch || 'touch'} · release to throw · lead him`
               : windup ? 'it is gone — go and block' : shiftDown ? HINT.tuck : HINT.qb;
        S.prompt = G.aim.active ? 'RELEASE' : windup ? 'THROW!' : 'HOLD TO THROW';
        // HANDS OFF, THE KID STILL PLAYS — and that rule binds hardest here.
        // Driving the QB unconditionally meant a hands-off player's own
        // quarterback stood stock still with the ball, because the driver
        // returned a zero input for him and footbrain was never consulted:
        // measured, that was a SACK on all twenty plays of a hands-off game
        // (0 completions, 0 points) against 1.8 sacks a game for the same
        // brains left alone. The wind-up is the one thing that must survive
        // his brain, so it — not the pocket — is what pins control to him.
        if (!G.aim.active && !handsOn()) return none;
        return drive(car);
      }

      // THE CARRY: no throw left, so the counter loop is the whole game.
      carryVerbs(G, car, inp, taps, { lPress, lHeld, rPress, shiftTap });
      S.hint = HINT.carrier;
      const foe = nearestFoeD(G, car);
      S.prompt = diveIncoming(G, car) ? 'JUKE'
               : (car.m?.wrapBy || 0) > 0 ? 'SPIN'
               : foe < T('ctlTruckR', 3.2) ? 'TRUCK' : 'RUN';
      if (!handsOn()) return none;                 // let go and he runs for daylight
      return drive(car);
    }

    // ── defence, ball on the ground or in a carrier's arms ──
    const car = G.carrier;
    const me = car ? nearest(G, myTeam, car.x, car.z) : nearest(G, myTeam, b.x, b.z);
    S.steering = me; G.spotlight = me;
    S.hint = HINT.defence;
    S.prompt = 'CHASE';
    if (me && car) {
      const d = dist(me.x, me.z, car.x, car.z);
      const range = T('ctlTackleR', 4.4);
      // Hold the button to commit: the intent stays armed while it is down and
      // for a beat after, and the dive goes the instant he is in range. A hit
      // you asked for one step early is still the hit you asked for.
      if (lPress > 0 || lHeld) S.bufAct = T('ctlBufferT', 0.35);
      if (S.bufAct > 0 && S.cd <= 0 && d < range) {
        // aim at the cursor when you are pointing at the play, otherwise lead
        // him — a click is a tackle wherever the mouse happens to be sitting
        const snap = T('ctlTackleSnap', 3.0);
        const atCursor = dist(cx, cz, car.x, car.z) < snap;
        const ax = atCursor ? cx : car.x + (car.vx || 0) * T('ctlTackleLead', 0.22);
        const az = atCursor ? cz : car.z + (car.vz || 0) * T('ctlTackleLead', 0.22);
        if (G.tackleDive(me, ax, az)) { S.bufAct = 0; S.cd = T('ctlActCd', 0.22); }
      }
      if (d < range) S.prompt = 'TACKLE';
    }
    if (!me || !handsOn()) return none;           // hands off, the kid still hunts
    return drive(me);
  }

  // ── the carrier's counters ───────────────────────────────
  // juke beats a dive · spin beats a wrap · truck beats a man who stood you
  // up. The first two ride key edges and fire the frame you ask for them: a
  // counter you have to queue is no counter, and the sim's stamina bar is the
  // thing that stops you spamming them. Only the truck is gated, because only
  // the truck is on a button you can hold down.
  //
  // THE JUKE lives on its own, because it is the one counter a man who still
  // has a THROW can also use. Q / E hop to that side of his heading; the A/D
  // double-tap says the same thing with the run keys — read as a SIDE, not a
  // screen direction, so it still means something to a kid already running
  // down the sideline. The tap clock is kept whatever else is going on: a
  // double-tap that straddles a cooldown is still a double-tap.
  //
  // Split out of carryVerbs so the POCKET can call it too. A quarterback is a
  // ball carrier with a diving rusher in his face, and hanging every counter
  // off "he has no throw left" meant a designed SWEEP — where the QB IS the
  // runner from the snap — had no juke at all until he crossed his own line.
  // These are keyboard keys, so nothing here fights the wind-up on the mouse.
  function jukeVerb(G, car, inp, taps) {
    let side = 0;
    for (const k of taps) {
      const s = LAT[k];
      if (!s) continue;
      const prev = S.tapT[k] ?? -9;
      if (S.t - prev < T('ctlDblTap', 0.30)) { S.tapT[k] = -9; side = s; }
      else S.tapT[k] = S.t;
    }
    if (side) {
      // the key names a side of the SCREEN; if it also has a clear side of
      // HIM, believe that instead — it is the one he can actually cut to
      const [lx, lz] = lateral(G, car, -1);
      const dot = inp.dx * lx + inp.dz * lz;
      if (Math.abs(dot) > 0.35) side = dot > 0 ? -1 : 1;
    }
    if (taps.has('KeyQ')) side = -1;
    else if (taps.has('KeyE')) side = 1;
    if (!side) return false;
    const [jx, jz] = lateral(G, car, side);
    if (!G.juke(car, jx, jz)) return false;
    S.wheelT = T('ctlWheelT', 0.22);
    return true;
  }

  function carryVerbs(G, car, inp, taps, mouse) {
    const { lPress, lHeld, rPress, shiftTap } = mouse;
    jukeVerb(G, car, inp, taps);
    if (rPress > 0 || shiftTap) {
      if (G.spin(car)) S.wheelT = T('ctlWheelT', 0.22);
    }
    // LEFT CLICK: lower the shoulder. Held keeps the intent armed and it
    // fires as contact arrives, so trucking thin air never costs you stamina.
    if (lPress > 0 || lHeld) S.bufAct = T('ctlBufferT', 0.35);
    if (S.bufAct > 0 && S.cd <= 0 && nearestFoeD(G, car) < T('ctlTruckR', 3.2)) {
      if (G.truck(car)) { S.bufAct = 0; S.cd = T('ctlActCd', 0.22); S.wheelT = T('ctlWheelT', 0.22); }
    }
  }

  return {
    get steering() { return S.steering; },
    get hint() { return S.hint; },
    get prompt() { return S.prompt; },
    get charging() { return S.charging; },
    get charge() { return S.charge; },
    get aimPoint() { return S.aimPt; },
    get cursor() { return S.cursor; },
    driver, onPlayButton, beginRouteDrag, dragRoute, endRouteDrag, clearRoute,
  };
}

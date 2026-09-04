import { CFG } from './config.js';
// Keyboard + mouse, or gamepad. Movement and aim are fully decoupled — you
// can run one way and threaten another, which is where the spacing game lives.
export function makeInput(canvas) {
  const keys = new Set(), taps = new Set();
  addEventListener('keydown', e => {
    if (['Space','KeyE','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)) e.preventDefault();
    if (!e.repeat && !keys.has(e.code)) taps.add(e.code);       // a press is a press, however short
    keys.add(e.code);
  });
  addEventListener('keyup', e => keys.delete(e.code));
  addEventListener('blur', () => { keys.clear(); mouse.lDown = false; mouse.rDown = false; mouse.lUp = mouse.rUp = false; });

  // Edges AND held state: a charge-and-release mechanic (football's throw)
  // needs to know the button is still down, and needs the release edge. The
  // release listener is on the window, not the canvas, so letting go with the
  // cursor off the play area still counts as a throw rather than sticking on.
  const mouse = { x: innerWidth/2, y: innerHeight/2, lEdge: false, rEdge: false,
                  lDown: false, rDown: false, lUp: false, rUp: false };
  canvas.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  canvas.addEventListener('mousedown', e => {
    if (e.button === 0) { mouse.lEdge = true; mouse.lDown = true; }
    if (e.button === 2) { mouse.rEdge = true; mouse.rDown = true; }
  });
  addEventListener('mouseup', e => {
    if (e.button === 0 && mouse.lDown) { mouse.lDown = false; mouse.lUp = true; }
    if (e.button === 2 && mouse.rDown) { mouse.rDown = false; mouse.rUp = true; }
  });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  let prevDash = false, prevE = false, prevPadA = false, prevPadB = false, lastPadAim = null;
  return {
    keys, mouse,
    read() {
      let dx = 0, dz = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft'))  dx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) dx += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp'))    dz -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown'))  dz += 1;
      // The kernel treats input magnitude as a throttle, and spacing yourself at
      // part speed is a real mechanic — but the keyboard could only ever send
      // 0 or 1, so a keyboard player literally could not walk. Ctrl is the
      // analog stick a keyboard does not have.
      if (keys.has('ControlLeft') || keys.has('ControlRight')) {
        const L = Math.hypot(dx, dz);
        if (L > 0) { dx = dx / L * CFG.move.walk; dz = dz / L * CFG.move.walk; }
      }
      let dash = keys.has('Space') || keys.has('ShiftLeft');
      const dashTap = taps.has('Space') || taps.has('ShiftLeft');
      let primary = mouse.lEdge;
      const eNow = keys.has('KeyE');
      let special = mouse.rEdge || (eNow && !prevE) || taps.has('KeyE');
      prevE = eNow;
      let padAim = null;

      const gp = navigator.getGamepads?.()[0];
      if (gp) {
        const ax = gp.axes[0] || 0, az = gp.axes[1] || 0;
        // Rescale past the deadzone, or the throttle jumps straight to 0.18 the
        // instant the stick leaves centre and the bottom fifth is unreachable.
        const DZ = 0.18, aL = Math.hypot(ax, az);
        if (aL > DZ) {
          const t = Math.min(1, (aL - DZ) / (1 - DZ)) / aL;
          dx = ax * t; dz = az * t;
        }
        const rx = gp.axes[2] || 0, rz = gp.axes[3] || 0;
        if (Math.hypot(rx, rz) > 0.25) { padAim = { x: rx, z: rz }; lastPadAim = padAim; }
        else if (lastPadAim) padAim = lastPadAim;        // hold the last aim, don't snap to centre
        else if (Math.hypot(dx, dz) > 0.2) padAim = { x: dx, z: dz };
        dash = dash || gp.buttons[0]?.pressed || gp.buttons[5]?.pressed;
        const pA = gp.buttons[7]?.value > 0.4 || gp.buttons[2]?.pressed;
        primary = primary || (pA && !prevPadA); prevPadA = pA;
        const pB = gp.buttons[6]?.value > 0.4 || gp.buttons[3]?.pressed;
        special = special || (pB && !prevPadB); prevPadB = pB;
      }

      const dashEdge = (dash && !prevDash) || dashTap;
      prevDash = dash;
      const tapped = new Set(taps);
      taps.clear();
      const hold = mouse.lDown, holdR = mouse.rDown;
      const release = mouse.lUp, releaseR = mouse.rUp;
      mouse.lEdge = false; mouse.rEdge = false; mouse.lUp = false; mouse.rUp = false;
      return { dx, dz, dash: dashEdge, primary, special, padAim, pad: !!gp, taps: tapped,
               hold, holdR, release, releaseR, mx: mouse.x, my: mouse.y };
    }
  };
}

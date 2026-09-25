/* The lens: field of view and zoom.
   The Zoom button steps smoothly in (1x, 1.3x, 1.6x, 2x, 2.5x, as far as the water allows) and, from the top, steps
   back out again the same way. Holding the button zooms continuously, turning round at each end.
   Pinch and the mouse wheel still zoom freely. The label says what the next press does. */
import * as THREE from '../lib/three.js';
import { camera } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { $ } from '../util/dom.js';
import { clamp } from '../util/math.js';
import { swim } from './input.js';

const fov = { base: 74 };   // wider on tall screens (set by main.js)
const STEPS = [1, 1.3, 1.6, 2, 2.5];
const HOLD_AFTER = 0.3;     // seconds before a press counts as holding
const HOLD_RATE = 0.9;      // how fast holding zooms (the zoom grows by e^0.9, about 2.5 times, per second)
const Z = { dir: 1, down: false, heldFor: 0, holding: false };

// How far zoom may go: less in murky water, where a far view would only show haze.
function zoomCap() { return clamp(1 / Math.max(U.absorb.value.z, 0.01) / 12, 1.5, 2.5); }

// One press: the next step in the current direction, turning round at the top and at 1x.
function stepZoom() {
  const cap = zoomCap(), levels = STEPS.filter(s => s < cap - 0.05).concat([cap]);
  let i = 0; levels.forEach((s, k) => { if (Math.abs(s - swim.zoomTarget) < Math.abs(levels[i] - swim.zoomTarget)) i = k; });
  let next = i + Z.dir;
  if (next >= levels.length) { Z.dir = -1; next = levels.length - 2; }
  if (next < 0) { Z.dir = 1; next = 1; }
  swim.zoomTarget = levels[clamp(next, 0, levels.length - 1)];
}
function pressZoom(down) {
  if (down) { Z.down = true; Z.heldFor = 0; Z.holding = false; return; }
  if (Z.down && !Z.holding) stepZoom();
  Z.down = false;
}
function cancelZoomPress() { Z.down = false; }

function applyFov() {
  camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov.base) / 2) / swim.zoom));
  camera.updateProjectionMatrix();
  U.zoom.value = swim.zoom;   // small things are drawn farther out when zoomed (culling.js, wet() shrink)
}

function updateZoom(dt) {
  const cap = zoomCap();
  if (Z.down && (Z.heldFor += dt) > HOLD_AFTER) {   // holding: zoom continuously, turning round at each end
    Z.holding = true;
    swim.zoomTarget *= Math.exp(Z.dir * HOLD_RATE * dt);
    if (swim.zoomTarget >= cap) { swim.zoomTarget = cap; Z.dir = -1; } else if (swim.zoomTarget <= 1) { swim.zoomTarget = 1; Z.dir = 1; }
  }
  swim.zoomTarget = clamp(swim.zoomTarget, 1, cap);
  if (swim.zoomTarget >= cap - 0.01) Z.dir = -1; else if (swim.zoomTarget <= 1.01) Z.dir = 1;
  const z0 = swim.zoom; swim.zoom += (swim.zoomTarget - swim.zoom) * (1 - Math.exp(-dt * 5));
  if (Math.abs(swim.zoom - z0) > 0.0005) applyFov();
  const lab = (Z.dir > 0 ? 'Zoom in: ' : 'Zoom out: ') + swim.zoomTarget.toFixed(1) + 'x';
  if ($('btnZoom').textContent !== lab) $('btnZoom').textContent = lab;
}

function resetZoom() { swim.zoomTarget = 1; Z.dir = 1; }

export { fov, applyFov, updateZoom, pressZoom, cancelZoomPress, stepZoom, resetZoom };

/* Looking around: mouse, touch, arrow keys and phone motion. (Where you look is where you swim: see glide.js.) */
import * as THREE from '../lib/three.js';
import { state } from '../dive/state.js';
import { canvas } from '../engine/renderer.js';
import { togglePause } from '../ui/playback.js';
import { $ } from '../util/dom.js';
import { clamp } from '../util/math.js';

const look = { yaw: 0, pitch: 0, drag: false, lx: 0, ly: 0 };   // your own turning, on top of the dive path. No limits: you can look all the way around.
const swim = { off: new THREE.Vector3(), zoom: 1, zoomTarget: 1, jolt: 0 };   // off = how far you have swum from the route
const pointers = new Map(); let pinchDist = 0;
canvas.addEventListener('pointerdown', e => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 1) {
    look.drag = true; look.lx = e.clientX; look.ly = e.clientY; canvas.classList.add('drag');
  } else if (pointers.size === 2) {
    look.drag = false; const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) swim.zoomTarget = clamp(swim.zoomTarget * d / pinchDist, 1, 2.5); pinchDist = d; return;
  }
  if (!look.drag) return;
  look.yaw += (e.clientX - look.lx) * 0.005; look.pitch += (e.clientY - look.ly) * 0.004;
  look.lx = e.clientX; look.ly = e.clientY;
});
const endDrag = e => {
  pointers.delete(e.pointerId); pinchDist = 0;
  if (pointers.size === 0) { look.drag = false; canvas.classList.remove('drag'); }
  else if (pointers.size === 1) { const [a] = [...pointers.values()]; look.drag = true; look.lx = a.x; look.ly = a.y; }
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => { e.preventDefault(); swim.zoomTarget = clamp(swim.zoomTarget * Math.exp(-e.deltaY * 0.0015), 1, 2.5); }, { passive: false });
canvas.addEventListener('dblclick', () => recenter());
/* Arrow keys turn the head smoothly: while a key is held the turn speeds up to a steady rate, and when it is let go
   it slows to a stop (like turning your head, not jumping in steps). The keyboard's own repeat is not used. */
const KEY_TURN = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] };
const held = new Set(), turn = { yaw: 0, pitch: 0 };
const YAW_RATE = 1.3, PITCH_RATE = 0.9, EASE = 7;   // radians per second, and how quickly the turn speeds up or slows down
const typing = () => { const el = document.activeElement; return el && el !== document.body && el !== canvas && !el.classList.contains('btn'); };
document.addEventListener('keydown', e => {
  if (KEY_TURN[e.key] && !typing()) { held.add(e.key); e.preventDefault(); }
  if (e.key === ' ' && state.started && document.activeElement === document.body) { e.preventDefault(); togglePause(); }
});
document.addEventListener('keyup', e => held.delete(e.key));
window.addEventListener('blur', () => held.clear());   // a key let go while the window was not in focus
function updateKeys(dt) {
  let wy = 0, wp = 0;
  held.forEach(k => { wy += KEY_TURN[k][0]; wp += KEY_TURN[k][1]; });
  const k = 1 - Math.exp(-dt * EASE);
  turn.yaw += (wy * YAW_RATE - turn.yaw) * k; turn.pitch += (wp * PITCH_RATE - turn.pitch) * k;
  look.yaw += turn.yaw * dt; look.pitch += turn.pitch * dt;
}
function recenter() { look.yaw = 0; look.pitch = 0; gyro.ref = null; }
function cycleZoom() { const t = swim.zoomTarget; swim.zoomTarget = t < 1.3 ? 1.6 : t < 2 ? 2.4 : 1; }

// Turning your phone turns the diver's head (optional, needs a button press).
const gyro = { on: false, ref: null, q: new THREE.Quaternion(), raw: new THREE.Quaternion() };
const zee = new THREE.Vector3(0, 0, 1), qFlip = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), qScr = new THREE.Quaternion(), eG = new THREE.Euler();
function onOrient(e) {
  if (e.alpha == null || e.beta == null || e.gamma == null) return;
  const d = THREE.MathUtils.degToRad, scr = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  eG.set(d(e.beta), d(e.alpha), -d(e.gamma), 'YXZ');
  gyro.raw.setFromEuler(eG).multiply(qFlip).multiply(qScr.setFromAxisAngle(zee, -d(scr)));
  if (!gyro.ref) gyro.ref = gyro.raw.clone().invert();
  gyro.q.copy(gyro.ref).multiply(gyro.raw);
}
async function toggleMotion() {
  const b = $('btnMotion');
  if (gyro.on) { window.removeEventListener('deviceorientation', onOrient); gyro.on = false; gyro.q.identity(); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Motion look: off'; return; }
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return; }
  } catch (err) { return; }
  gyro.ref = null; window.addEventListener('deviceorientation', onOrient); gyro.on = true; b.setAttribute('aria-pressed', 'true'); b.textContent = 'Motion look: on';
}

export { look, swim, gyro, zee, recenter, cycleZoom, toggleMotion, updateKeys };

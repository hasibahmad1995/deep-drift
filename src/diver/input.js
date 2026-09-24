/* Looking around and swimming: mouse, touch, keys and phone motion. */
import * as THREE from '../lib/three.js';
import { state } from '../dive/state.js';
import { canvas } from '../engine/renderer.js';
import { togglePause } from '../ui/playback.js';
import { $ } from '../util/dom.js';
import { clamp } from '../util/math.js';

const look = { yaw: 0, pitch: 0, drag: false, lx: 0, ly: 0 };   // your own turning, on top of the dive path. No limits: you can look all the way around.
const swim = { off: new THREE.Vector3(), hold: false, zoom: 1, zoomTarget: 1, jolt: 0, keys: {} };
const pointers = new Map(); let holdTimer = 0, pinchDist = 0, downX = 0, downY = 0;
canvas.addEventListener('pointerdown', e => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 1) {
    look.drag = true; look.lx = e.clientX; look.ly = e.clientY; downX = e.clientX; downY = e.clientY; canvas.classList.add('drag');
    clearTimeout(holdTimer); holdTimer = setTimeout(() => { if (pointers.size === 1) swim.hold = true; }, 380);   // press and hold to swim ahead
  } else if (pointers.size === 2) {
    look.drag = false; clearTimeout(holdTimer); swim.hold = false; const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
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
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) clearTimeout(holdTimer);
  look.yaw += (e.clientX - look.lx) * 0.005; look.pitch += (e.clientY - look.ly) * 0.004;
  look.lx = e.clientX; look.ly = e.clientY;
});
const endDrag = e => {
  pointers.delete(e.pointerId); clearTimeout(holdTimer); swim.hold = false; pinchDist = 0;
  if (pointers.size === 0) { look.drag = false; canvas.classList.remove('drag'); }
  else if (pointers.size === 1) { const [a] = [...pointers.values()]; look.drag = true; look.lx = a.x; look.ly = a.y; }
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => { e.preventDefault(); swim.zoomTarget = clamp(swim.zoomTarget * Math.exp(-e.deltaY * 0.0015), 1, 2.5); }, { passive: false });
canvas.addEventListener('dblclick', () => recenter());
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 's' || k === 'a' || k === 'd') swim.keys[k] = true;
  if (e.key === 'ArrowLeft') look.yaw += 0.12;
  if (e.key === 'ArrowRight') look.yaw -= 0.12;
  if (e.key === 'ArrowUp') look.pitch += 0.1;
  if (e.key === 'ArrowDown') look.pitch -= 0.1;
  if (e.key === ' ' && state.started && document.activeElement === document.body) { e.preventDefault(); togglePause(); }
});
document.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (swim.keys[k]) swim.keys[k] = false; });
window.addEventListener('blur', () => { swim.keys = {}; swim.hold = false; });
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

export { look, swim, gyro, zee, recenter, cycleZoom, toggleMotion };

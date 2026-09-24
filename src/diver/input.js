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
document.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') look.yaw += 0.12;
  if (e.key === 'ArrowRight') look.yaw -= 0.12;
  if (e.key === 'ArrowUp') look.pitch += 0.1;
  if (e.key === 'ArrowDown') look.pitch -= 0.1;
  if (e.key === ' ' && state.started && document.activeElement === document.body) { e.preventDefault(); togglePause(); }
});
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

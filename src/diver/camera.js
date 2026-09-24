/* Puts the camera where the diver is, looking where the diver looks. */
import * as THREE from '../lib/three.js';
import { LEGS, pathAt } from '../dive/route.js';
import { depthAt } from '../dive/depth.js';
import { state } from '../dive/state.js';
import { updateGlide } from './glide.js';
import { gyro, look, swim, zee } from './input.js';
import { REDUCED } from '../engine/device.js';
import { camera } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { $ } from '../util/dom.js';
import { clamp, rand } from '../util/math.js';
import { UP } from '../world/layout.js';

const qBase = new THREE.Quaternion(), qDrag = new THREE.Quaternion(), qRoll = new THREE.Quaternion(), qJolt = new THREE.Quaternion(), eD = new THREE.Euler(0, 0, 0, 'YXZ'), lookM = new THREE.Matrix4(), ZERO = new THREE.Vector3();
const fov = { base: 74 };   // wider on tall screens (set by main.js)

// Zoom is limited by how far you can see in the water.
function updateZoom(dt) {
  const vis = 1 / Math.max(U.absorb.value.z, 0.012), zoomCap = clamp(vis / 20, 1.2, 2.5);
  swim.zoomTarget = clamp(swim.zoomTarget, 1, zoomCap);
  const z0 = swim.zoom; swim.zoom += (swim.zoomTarget - swim.zoom) * (1 - Math.exp(-dt * 7));
  if (Math.abs(swim.zoom - z0) > 0.0005) { applyFov(); const lab = 'Zoom: ' + swim.zoomTarget.toFixed(1) + 'x'; if ($('btnZoom').textContent !== lab) $('btnZoom').textContent = lab; }
}

function updateCamera(dt) {
  const p = pathAt(state.t);
  // the route's suggested direction, then your own looking around on top
  const basePitch = Math.asin(clamp(p.fwd.y, -1, 1));
  look.pitch = clamp(look.pitch, -1.55 - basePitch, 1.55 - basePitch);
  lookM.lookAt(ZERO, p.fwd, UP); qBase.setFromRotationMatrix(lookM);
  eD.set(look.pitch, look.yaw, 0); qDrag.setFromEuler(eD);
  camera.quaternion.copy(qBase).multiply(qDrag);
  if (gyro.on) camera.quaternion.multiply(gyro.q);
  if (!REDUCED) { qRoll.setFromAxisAngle(zee, 0.025 * Math.sin(state.t * 0.9)); camera.quaternion.multiply(qRoll); }
  if (swim.jolt > 0) { swim.jolt = Math.max(0, swim.jolt - dt * 3); eD.set(rand(-1, 1) * 0.03 * swim.jolt, rand(-1, 1) * 0.03 * swim.jolt, 0, 'XYZ'); qJolt.setFromEuler(eD); camera.quaternion.multiply(qJolt); eD.order = 'YXZ'; }
  camera.updateMatrixWorld();
  updateZoom(dt);
  const pos = updateGlide(dt, p, LEGS[p.si].id);
  camera.position.copy(pos); if (!REDUCED) camera.position.y += 0.07 * Math.sin(state.t * 1.7);
  camera.updateMatrixWorld();
  state.D = depthAt(pos.y); state.stage = p.si;   // the depth where you really are, not where the route is
  return p;
}
function applyFov() { camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov.base) / 2) / swim.zoom)); camera.updateProjectionMatrix(); }

export { updateCamera, applyFov, fov };

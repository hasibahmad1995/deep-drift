/* Puts the camera where the diver is, looking where the diver looks. */
import * as THREE from '../lib/three.js';
import { LEGS, pathAt } from '../dive/route.js';
import { depthAt } from '../dive/depth.js';
import { state } from '../dive/state.js';
import { updateGlide } from './glide.js';
import { updateZoom } from './zoom.js';
import { gyro, look, swim, zee, updateKeys } from './input.js';
import { REDUCED } from '../engine/device.js';
import { camera } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { $ } from '../util/dom.js';
import { clamp, rand } from '../util/math.js';

const qRoll = new THREE.Quaternion(), qJolt = new THREE.Quaternion(), eD = new THREE.Euler(0, 0, 0, 'YXZ');

function updateCamera(dt) {
  const p = pathAt(state.t);
  updateKeys(dt);   // smooth turning with the arrow keys
  // the route's suggested direction, then your own looking around on top. Turning left and right is always around the
  // true vertical and the horizon stays level (like turning your head), even where the dive heads steeply down.
  const baseYaw = Math.atan2(-p.fwd.x, -p.fwd.z), basePitch = Math.asin(clamp(p.fwd.y, -1, 1));
  look.pitch = clamp(look.pitch, -1.5 - basePitch, 1.5 - basePitch);
  eD.set(basePitch + look.pitch, baseYaw + look.yaw, 0); camera.quaternion.setFromEuler(eD);
  if (gyro.on) camera.quaternion.multiply(gyro.q);
  // a gentle sway (and bob, below) that goes on while you hover
  if (!REDUCED) { qRoll.setFromAxisAngle(zee, 0.025 * Math.sin(U.time.value * 0.9)); camera.quaternion.multiply(qRoll); }
  if (swim.jolt > 0) { swim.jolt = Math.max(0, swim.jolt - dt * 3); eD.set(rand(-1, 1) * 0.03 * swim.jolt, rand(-1, 1) * 0.03 * swim.jolt, 0, 'XYZ'); qJolt.setFromEuler(eD); camera.quaternion.multiply(qJolt); eD.order = 'YXZ'; }
  camera.updateMatrixWorld();
  updateZoom(dt);
  const pos = updateGlide(dt, p, LEGS[p.si].id);
  camera.position.copy(pos); if (!REDUCED) camera.position.y += 0.07 * Math.sin(U.time.value * 1.7);
  camera.updateMatrixWorld();
  state.D = depthAt(pos.y); state.stage = p.si;   // the depth where you really are, not where the route is
  return p;
}

export { updateCamera };

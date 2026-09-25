/* Before Begin: a quick test of this computer. Draws the busiest view of the dive (the coral reef) a few times and
   picks the sharpness (pixel count) at which it takes about TARGET ms, so the dive starts smooth instead of
   stuttering until the automatic adjustment (quality.js) catches up. Takes well under a second. */
import * as THREE from '../lib/three.js';
import { renderer, display, scene, camera } from './renderer.js';
import { applyEnvironment } from './environment.js';
import { setSharpness, LEAST } from './quality.js';
import { depthAt } from '../dive/depth.js';
import { pathAt } from '../dive/route.js';
import { updateCulling } from '../world/culling.js';
import { STARTUP } from '../util/steps.js';

const TARGET = 30;        // ms per picture on the reef (about 33 pictures a second)
const BUSIEST = 20;       // dive time (s) of the busiest view: the reef wall covered in corals
const px = new Uint8Array(4), ahead = new THREE.Vector3();

function timePicture(gl) {
  const t0 = performance.now();
  renderer.render(scene, camera);
  gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);   // waits until the graphics card has really finished
  return performance.now() - t0;
}

function chooseSharpness() {
  const p = pathAt(BUSIEST), gl = renderer.getContext();
  camera.position.copy(p.pos); camera.lookAt(ahead.copy(p.pos).add(p.fwd)); camera.updateMatrixWorld();
  applyEnvironment(depthAt(p.pos.y)); updateCulling(camera.position);
  let ratio = display.pixelRatio;
  for (let tries = 0; tries < 5; tries++) {
    setSharpness(ratio); timePicture(gl);   // the first picture after a change is slower: not counted
    const ms = (timePicture(gl) + timePicture(gl)) / 2;
    STARTUP.steps.push(['  sharpness ' + ratio.toFixed(2), Math.round(ms)]);
    if (ms <= TARGET * 1.1 || ratio <= LEAST) break;
    ratio = Math.max(LEAST, ratio * Math.sqrt(TARGET / ms) * 0.97);   // the pixel count goes with the square of the sharpness
  }
  STARTUP.sharpness = display.pixelRatio;
}

export { chooseSharpness };

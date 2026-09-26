/* Breathing: the bubbles that leave the regulator every few seconds. */
import * as THREE from '../lib/three.js';
import { REDUCED } from '../engine/device.js';
import { camera, scene } from '../engine/renderer.js';
import { U } from '../engine/uniforms.js';
import { TAU, rand } from '../util/math.js';
import { canvasTexture } from '../util/textures.js';

const tmpV = new THREE.Vector3();
const bubbleTex = canvasTexture(64, 64, c => {
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(32, 32, 26, 0, TAU); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(32, 32, 26, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(22, 22, 5, 0, TAU); c.fill();
});
const NB = 70, bubblePos = new Float32Array(NB * 3), bubbleSize = new Float32Array(NB), bubbleLife = new Float32Array(NB).fill(-1), bubbleVel = new Float32Array(NB);
const bubbleGeo = new THREE.BufferGeometry(); bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3)); bubbleGeo.setAttribute('aSize', new THREE.BufferAttribute(bubbleSize, 1));
const bubbles = new THREE.Points(bubbleGeo, new THREE.ShaderMaterial({
  uniforms: { uTex: { value: bubbleTex }, uPix: U.pix }, transparent: true, depthWrite: false, fog: false,
  vertexShader: 'attribute float aSize; uniform float uPix; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPix * (300.0 / max(-mv.z, 0.2)); }',
  fragmentShader: `uniform sampler2D uTex; void main(){ vec4 c = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(c.rgb, c.a * 0.8);
    #include <colorspace_fragment>
  }`
}));
bubbles.frustumCulled = false; bubbles.renderOrder = 12; scene.add(bubbles);
const breath = { next: 2.5, exhaleLeft: 0 };   // read by the hose drawing
let bubbleIdx = 0;
function updateBubbles(dt) {
  if (!REDUCED) {
    breath.next -= dt;
    if (breath.next <= 0) { breath.exhaleLeft = 1.5; breath.next = 5.2; }
    if (breath.exhaleLeft > 0) {
      breath.exhaleLeft -= dt;
      for (let k = 0; k < 2; k++) {
        const i = bubbleIdx++ % NB; tmpV.set(rand(-0.03, 0.03), -0.2 + rand(-0.02, 0.02), -0.5).applyMatrix4(camera.matrixWorld);
        bubblePos.set([tmpV.x, tmpV.y, tmpV.z], i * 3); bubbleSize[i] = rand(0.012, 0.05); bubbleLife[i] = 0; bubbleVel[i] = rand(0.5, 1.0);
      }
    }
  }
  for (let i = 0; i < NB; i++) {
    if (bubbleLife[i] < 0) { bubbleSize[i] = 0; continue; }
    bubbleLife[i] += dt; bubblePos[i * 3 + 1] += bubbleVel[i] * dt; bubblePos[i * 3] += Math.sin(bubbleLife[i] * 5 + i) * 0.1 * dt;
    if (bubbleLife[i] > 6 || bubblePos[i * 3 + 1] > -0.05) bubbleLife[i] = -1;   // a bubble that reaches the surface is gone (it never rises into the air)
  }
  bubbleGeo.attributes.position.needsUpdate = true; bubbleGeo.attributes.aSize.needsUpdate = true;
}

export { bubbles, breath, updateBubbles };

/* The green sea turtle. */
import * as THREE from '../lib/three.js';
import { wet } from '../engine/wet.js';
import { col } from '../util/color.js';
import { flat } from '../util/geometry.js';
import { TAU, seeded } from '../util/math.js';
import { canvasTexture } from '../util/textures.js';

/* ---- sea turtle ---- */
function makeTurtle() {
  const g = new THREE.Group(), R = seeded(3);
  const shellTex = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#6b5a2e'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 8; x++) {
      const cx = (x + (y % 2) * 0.5) * 64 + 20, cy = y * 74 + 30;
      c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; c.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34); } c.closePath();
      c.fillStyle = 'rgb(' + (110 + R() * 40) + ',' + (95 + R() * 35) + ',' + (45 + R() * 25) + ')'; c.fill(); c.strokeStyle = '#3a2f15'; c.lineWidth = 4; c.stroke();
    }
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16, 0, TAU, 0, Math.PI * 0.62), wet(new THREE.MeshStandardMaterial({ map: shellTex, roughness: 0.55, metalness: 0.03, side: THREE.DoubleSide }), { detail: false }));
  shell.scale.set(0.55, 0.3, 0.42);
  const skinM = wet(new THREE.MeshStandardMaterial({ color: col('#7d8450'), roughness: 0.72, side: THREE.DoubleSide }), { detail: true });
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), wet(new THREE.MeshStandardMaterial({ color: col('#d8cf9d'), roughness: 0.8 })));
  belly.scale.set(0.5, 0.09, 0.38); belly.position.y = -0.03;
  const head = new THREE.Group();
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.32, 12), skinM); neck.rotation.z = Math.PI / 2; neck.position.set(0.16, 0, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), skinM); skull.scale.set(1.25, 0.9, 0.95); skull.position.set(0.34, 0.0, 0);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
  [1, -1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), wet(eyeM.clone())); e.position.set(0.4, 0.04, s * 0.085); head.add(e); });
  head.add(neck, skull); head.position.set(0.5, 0.02, 0); g.add(head);
  const flip = (len, wid) => flat([[0, 0.03], [len * 0.4, wid], [len * 0.95, wid * 0.25], [len, 0], [len * 0.6, -wid * 0.5], [0, -0.03]], 1);
  const mk = (len, wid) => new THREE.Mesh(flip(len, wid), skinM);
  const fl = [mk(0.75, 0.13), mk(0.75, 0.13)], rl = [mk(0.3, 0.07), mk(0.3, 0.07)];
  fl[0].position.set(0.22, -0.02, 0.32); fl[1].position.set(0.22, -0.02, -0.32);
  rl[0].position.set(-0.4, -0.02, 0.22); rl[1].position.set(-0.4, -0.02, -0.22);
  [...fl, ...rl].forEach(f => g.add(f));
  g.add(shell, belly);
  g.userData.update = t => {
    const s = Math.sin(t * 1.3);
    fl[0].rotation.set(0, -1.3 - s * 0.3, 0.2 + s * 0.6); fl[1].rotation.set(0, 1.3 + s * 0.3 + Math.PI, -(0.2 + s * 0.6));
    fl[1].rotation.set(Math.PI, 1.3 + s * 0.3, -0.2 - s * 0.6);
    rl[0].rotation.set(0, -2.3, 0.2 + s * 0.2); rl[1].rotation.set(Math.PI, 2.3, -0.2 - s * 0.2);
    head.rotation.z = Math.sin(t * 0.65) * 0.05; g.rotation.z = Math.sin(t * 0.65) * 0.03;
  };
  g.scale.setScalar(1.15);
  return g;
}

export { makeTurtle };

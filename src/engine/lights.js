/* Sunlight, the light of the water all around, and the diver's torch and lamp. */
import * as THREE from '../lib/three.js';
import { camera, scene } from './renderer.js';

/* Light, fog and colour of the water change with depth. */
const sunDir = new THREE.Vector3(0.6, 1, 0.15).normalize();
const sun = new THREE.DirectionalLight(0xfff2dc, 3);
sun.position.copy(sunDir).multiplyScalar(100);
const hemi = new THREE.HemisphereLight(0x7fd0ff, 0x1a3b4a, 1);
const torch = new THREE.SpotLight(0xfff0d8, 0, 80, 0.75, 0.85, 1.0);   // the diver's torch
camera.add(torch); camera.add(torch.target);
torch.position.set(0.15, -0.15, 0); torch.target.position.set(0, 0, -10);
const lamp = new THREE.PointLight(0xdfe9ff, 0, 38, 1.4);   // soft light all around the diver in the deep, like a submersible's work lights
camera.add(lamp); lamp.position.set(0, 0.6, 0.5);
scene.add(sun, hemi);

export { sunDir, sun, hemi, torch, lamp };

/* The renderer, the scene and the camera. */
import * as THREE from '../lib/three.js';
import { SETTINGS } from '../config.js';
import { SMALL } from './device.js';
import { $ } from '../util/dom.js';

const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: !SMALL, powerPreference: 'high-performance', preserveDrawingBuffer: /still/.test(location.search) });
const display = { pixelRatio: Math.min(window.devicePixelRatio || 1, SMALL ? 1.5 : SETTINGS.maxPixelRatio) };   // lowered by main.js if the picture is slow
renderer.setPixelRatio(display.pixelRatio);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x1a9cc8, 0.0001);
const camera = new THREE.PerspectiveCamera(74, 1, 0.08, 1500);
scene.add(camera);

export { canvas, renderer, display, scene, camera };

/* Handy names for the browser console and the test scripts, e.g. state.t = 120 then step(0.03).
   Nothing in the dive depends on these. */
import * as THREE from './lib/three.js';
import { renderer, display, scene, camera } from './engine/renderer.js';
import { SMALL } from './engine/device.js';
import { U } from './engine/uniforms.js';
import { state } from './dive/state.js';
import { TOTAL, pathAt } from './dive/route.js';
import { groups } from './world/layout.js';
import { ACTORS } from './life/actors.js';
import { BARRA } from './life/barramundi.js';
import { look, swim } from './diver/input.js';
import { music } from './audio/music.js';

function exposeForTesting(extra) {
  Object.assign(window, { THREE, renderer, display, scene, camera, SMALL, U, state, TOTAL, pathAt, groups, ACTORS, BARRA, look, swim, music }, extra);
}

export { exposeForTesting };

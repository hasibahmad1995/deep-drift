/* Deep Drift: starts everything and runs one picture (frame) after another. */
import * as THREE from './lib/three.js';
import { SETTINGS } from './config.js';
import { $ } from './util/dom.js';
import { clamp } from './util/math.js';
import { renderer, scene, camera } from './engine/renderer.js';
import { U } from './engine/uniforms.js';
import { applyEnvironment } from './engine/environment.js';
import { dome, surface, rayGroup } from './engine/sky.js';
import { snow, glowSpecks, backscatter } from './engine/particles.js';
import { state, clock } from './dive/state.js';
import { TOTAL } from './dive/route.js';
import { addPlace } from './world/layout.js';
import { updateCulling } from './world/culling.js';
import { buildReef } from './world/reef.js';
import { buildTerrain } from './world/terrain.js';
import { buildBenthos } from './world/benthos.js';
import { buildVents } from './world/vents.js';
import { buildWreck } from './world/wreck.js';
import { buildTrench } from './world/trench.js';
import { ACTORS } from './life/actors.js';
import { loadBarramundi } from './life/barramundi.js';
import { buildLife } from './life/cast.js';
import { buildExtras } from './life/extras.js';
import { buildDeepCast } from './life/cast-deep.js';
import { runPassers } from './life/passers.js';
import { TOUCH, HIT, reactActor } from './life/touch.js';
import { updateBubbles } from './diver/bubbles.js';
import { recenter, toggleMotion } from './diver/input.js';
import { updateCamera } from './diver/camera.js';
import { applyFov, fov } from './diver/zoom.js';
import { layoutMask, drawHose } from './ui/mask.js';
import { updateHud } from './ui/hud.js';
import './ui/touch-feedback.js';
import { togglePause, beginDive, goHome } from './ui/playback.js';
import { wireDock } from './ui/dock.js';
import { layoutControls, wirePanels, buildJournal } from './ui/panels.js';
import { toggleMusic } from './audio/music.js';
import { exposeForTesting } from './debug.js';
import { runSteps, STARTUP } from './util/steps.js';
import { warmUp } from './engine/warmup.js';
import { trackFrame } from './engine/quality.js';
import { chooseSharpness } from './engine/benchmark.js';

const tmpV = new THREE.Vector3();
let last = performance.now();

function frame(now) {
  const ms = now - last, dt = Math.min(0.05, ms / 1000); last = now;
  if (window.__hold || STARTUP.busy) { requestAnimationFrame(frame); return; }   // __hold: used only by the test scripts
  trackFrame(ms);   // fewer pixels if the pictures come too slowly (done before drawing, so a change never shows a blank frame)
  step(dt);
  requestAnimationFrame(frame);
}

// Moves everything on by dt seconds and draws one picture.
function step(dt) {
  clock.dt = dt; U.time.value += dt;
  if (state.started) state.life += dt;   // the sea's own time runs on even while the diver hovers (paused)
  if (state.playing) { state.t += dt; if (state.t >= TOTAL) goHome(); }   // the end of the dive: back to the start screen
  if (state.fadeT != null) { state.fadeT += dt; if (state.fadeT > 1.6) state.fadeT = null; }
  const p = updateCamera(dt);
  camera.getWorldDirection(tmpV); TOUCH.point.copy(camera.position).addScaledVector(tmpV, 0.3);
  applyEnvironment(state.D);   // light and water colour for the depth where you really are
  runPassers(p);
  dome.position.copy(camera.position); surface.position.set(camera.position.x, 0, camera.position.z); rayGroup.position.set(camera.position.x, 0, camera.position.z);
  updateCulling(camera.position);   // skip parts of the world too far away to see
  snow.material.uniforms.uCam.value.copy(camera.position); glowSpecks.material.uniforms.uCam.value.copy(camera.position); backscatter.material.uniforms.uCam.value.copy(camera.position);
  for (let i = 0; i < ACTORS.length; i++) {
    const a = ACTORS[i];
    if (a.obj) {
      if (a.active === false) { a.obj.visible = false; continue; }
      // more than 300 m away (far beyond sight): hidden, and moved on only twice a second to save work
      if (a.obj.position.distanceToSquared(camera.position) > 90000 && (a.farWait = (a.farWait || 0) + dt) < 0.5) { a.obj.visible = false; continue; }
      a.farWait = 0;
    }
    // While the dive is paused (or not begun) the diver hovers but the sea lives on: an animal's own clock runs ahead of
    // the dive time by a.lag. Animals that circle or drift (cyclic) always keep moving; others only once the dive has begun.
    if ((!state.playing || !state.started) && (a.cyclic || !a.obj || state.started)) a.lag = (a.lag || 0) + dt;
    a.update(state.t + (a.lag || 0));
    if (a.obj) {
      a.obj.visible = a.obj.position.distanceToSquared(camera.position) <= 90000 && a.active !== false;
      if (a.obj.visible) { if (a.hit === undefined) a.hit = HIT[a.name] || null; if (a.hit) reactActor(a, dt); }
    }
  }
  updateBubbles(dt); drawHose(dt);
  // the one continuous dive only fades out at the very end, and in again after a restart (Begin fades the intro card instead)
  $('fade').style.opacity = clamp(Math.max(state.fadeT == null ? 0 : 1 - state.fadeT / 1.6, 1 - (TOTAL - state.t) / 1.6));
  updateHud(state.D, p.si);
  if (!window.__noRender) renderer.render(scene, camera);   // __noRender: only the tests use it, to run the dive fast
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; fov.base = w / h < 0.8 ? 84 : 74; applyFov(); layoutMask();
}

function boot() {
  STARTUP.bootAt = Math.round(performance.now());   // when our code started (after the files arrived)
  document.title = SETTINGS.siteName; $('brand').textContent = SETTINGS.siteName; $('siteName').textContent = SETTINGS.siteName; $('tagline').textContent = SETTINGS.tagline;
  resize(); window.addEventListener('resize', resize); layoutControls(); buildJournal();
  $('btnPause').addEventListener('click', togglePause); $('btnMusic').addEventListener('click', toggleMusic); $('btnRecenter').addEventListener('click', recenter); $('btnMotion').addEventListener('click', toggleMotion);
  wireDock();
  if (window.matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window) $('btnMotion').hidden = false;
  wirePanels();
  $('btnBegin').addEventListener('click', beginDive);
  $('brand').addEventListener('click', goHome);   // Deep Drift at the top: back to the start screen
  exposeForTesting({ step, STARTUP });
  requestAnimationFrame(t => { last = t; frame(t); });
  runSteps([
    ['the fish model', loadBarramundi],
    ['the coral reef', () => addPlace('reef', buildReef())],
    ['the sea floor', () => addPlace('terrain', buildTerrain())],
    ['the hot vents', () => addPlace('vents', buildVents())],
    ['the wreck', () => addPlace('plain', buildWreck())],
    ['the trench', () => addPlace('trench', buildTrench())],
    ['life on the sea floor', () => addPlace('benthos', buildBenthos())],
    ['the animals', () => { buildLife(); buildExtras(); buildDeepCast(); }],
    ['the lights and colours', warmUp],
    ['the picture for your screen', chooseSharpness],
  ], (label, done) => { $('loadMsg').textContent = label ? `Loading ${label}... ${Math.round(done * 100)}%` : ''; })
    .then(() => { $('btnBegin').disabled = false; $('btnBegin').focus(); });
}
boot();

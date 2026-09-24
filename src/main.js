/* Deep Drift: starts everything and runs one picture (frame) after another. */
import * as THREE from './lib/three.js';
import { SETTINGS } from './config.js';
import { $ } from './util/dom.js';
import { clamp } from './util/math.js';
import { REDUCED } from './engine/device.js';
import { renderer, display, scene, camera } from './engine/renderer.js';
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
import { recenter, cycleZoom, toggleMotion } from './diver/input.js';
import { updateCamera, applyFov, fov } from './diver/camera.js';
import { layoutMask, drawHose } from './ui/mask.js';
import { updateHud } from './ui/hud.js';
import './ui/touch-feedback.js';
import { togglePause, restart } from './ui/playback.js';
import { layoutControls, wirePanels, buildJournal } from './ui/panels.js';
import { toggleMusic } from './audio/music.js';
import { exposeForTesting } from './debug.js';

const tmpV = new THREE.Vector3();
let frames = 0, slow = 0, last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (window.__hold) { requestAnimationFrame(frame); return; }   // used only by the test scripts
  step(dt);
  requestAnimationFrame(frame);
}

// Moves everything on by dt seconds and draws one picture.
function step(dt) {
  clock.dt = dt; U.time.value += dt;
  if (state.playing) { state.t += dt; if (state.t >= TOTAL) state.t = 0; }
  const p = updateCamera(dt);
  camera.getWorldDirection(tmpV); TOUCH.point.copy(camera.position).addScaledVector(tmpV, 0.3);
  applyEnvironment(state.D);   // light and water colour for the depth where you really are
  runPassers(p);
  dome.position.copy(camera.position); surface.position.set(camera.position.x, 0, camera.position.z); rayGroup.position.set(camera.position.x, 0, camera.position.z);
  updateCulling(camera.position);   // skip parts of the world too far away to see
  snow.material.uniforms.uCam.value.copy(camera.position); glowSpecks.material.uniforms.uCam.value.copy(camera.position); backscatter.material.uniforms.uCam.value.copy(camera.position);
  for (let i = 0; i < ACTORS.length; i++) {
    const a = ACTORS[i];
    if (a.obj) { const far = a.obj.position.distanceToSquared(camera.position) > 90000; a.obj.visible = !far && a.active !== false; if (far || a.active === false) continue; }
    a.update(state.t);
    if (a.obj) { if (a.hit === undefined) a.hit = HIT[a.name] || null; if (a.hit) reactActor(a, dt); }
  }
  updateBubbles(dt); drawHose(dt);
  // the one continuous dive only fades in at the start and out at the very end
  $('fade').style.opacity = clamp(Math.max(1 - state.t / 1.6, 1 - (TOTAL - state.t) / 1.6));
  updateHud(state.D, p.si);
  renderer.render(scene, camera);
  // if the picture is slow, draw fewer pixels
  frames++; if (dt > 0.034) slow++;
  if (frames >= 90) { if (slow > 55 && display.pixelRatio > 0.65) { display.pixelRatio = Math.max(0.65, display.pixelRatio * 0.8); renderer.setPixelRatio(display.pixelRatio); resize(); } frames = 0; slow = 0; }
}

function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; fov.base = w / h < 0.8 ? 84 : 74; applyFov(); layoutMask();
}

function boot() {
  document.title = SETTINGS.siteName; $('brand').textContent = SETTINGS.siteName; $('siteName').textContent = SETTINGS.siteName; $('tagline').textContent = SETTINGS.tagline;
  resize(); window.addEventListener('resize', resize); layoutControls(); buildJournal();
  $('btnPause').addEventListener('click', togglePause); $('btnMusic').addEventListener('click', toggleMusic); $('btnRestart').addEventListener('click', restart); $('btnRecenter').addEventListener('click', recenter); $('btnZoom').addEventListener('click', cycleZoom); $('btnMotion').addEventListener('click', toggleMotion);
  if (window.matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window) $('btnMotion').hidden = false;
  wirePanels();
  $('btnBegin').addEventListener('click', () => {
    $('intro').hidden = true; state.started = true; state.playing = !REDUCED; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
    if (REDUCED) $('live').textContent = 'The dive is paused because your device asks for less motion. Press Play to start.';
  });
  exposeForTesting({ step });
  requestAnimationFrame(t => { last = t; frame(t); });
  setTimeout(async () => {
    await loadBarramundi();
    addPlace('reef', buildReef()); addPlace('terrain', buildTerrain()); addPlace('vents', buildVents()); addPlace('plain', buildWreck()); addPlace('trench', buildTrench()); addPlace('benthos', buildBenthos());
    buildLife();
    buildExtras();
    buildDeepCast();
    $('loadMsg').textContent = '';
    $('btnBegin').disabled = false; $('btnBegin').focus();
  }, 30);
}
boot();

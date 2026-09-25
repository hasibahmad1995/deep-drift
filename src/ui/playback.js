/* Begin, pause and play, and going back to the start screen (Deep Drift at the top is the home button). */
import { state } from '../dive/state.js';
import { recenter, swim } from '../diver/input.js';
import { resetZoom } from '../diver/zoom.js';
import { REDUCED } from '../engine/device.js';
import { ACTORS } from '../life/actors.js';
import { PASSERS, deactivatePassers } from '../life/passers.js';
import { reshuffle } from '../life/variety.js';
import { $ } from '../util/dom.js';
import { rand } from '../util/math.js';

// Pause: the diver hovers in place (the dive time stops); the sea keeps moving (see the animal clocks in main.js).
function togglePause() {
  state.playing = !state.playing; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
}

// Begin: the intro card fades away over the live picture, and this dive's version of every animal is rolled.
function beginDive() {
  const intro = $('intro'); intro.classList.add('leaving');
  setTimeout(() => { if (intro.classList.contains('leaving')) intro.hidden = true; }, 800);
  reshuffle();
  state.started = true; state.playing = !REDUCED; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
  PASSERS.next = state.life + rand(4, 9);   // the first visitor comes at a different moment each dive
  if (REDUCED) $('live').textContent = 'The dive is paused because your device asks for less motion. Press Play (in the side panel on the left edge) to start.';
}

// Home: back to the start screen. The dive goes back to the surface behind it and waits for Begin (a new dive).
function goHome() {
  state.started = false; state.playing = false; state.t = 0; state.fadeT = 0;
  recenter(); swim.off.set(0, 0, 0); resetZoom();
  PASSERS.lastT = 0; deactivatePassers(); ACTORS.forEach(a => { a.lag = 0; });
  $('btnPause').textContent = 'Pause';
  ['journal', 'credits'].forEach(id => { $(id).hidden = true; });
  const intro = $('intro'); intro.hidden = false;
  requestAnimationFrame(() => intro.classList.remove('leaving'));   // fades back in
  $('btnBegin').focus();
}

export { togglePause, beginDive, goHome };

/* Pause, play and restart. */
import { state } from '../dive/state.js';
import { recenter, swim } from '../diver/input.js';
import { ACTORS } from '../life/actors.js';
import { PASSERS, deactivatePassers } from '../life/passers.js';
import { reshuffle } from '../life/variety.js';
import { $ } from '../util/dom.js';

function togglePause() {
  state.playing = !state.playing; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
}
// Pause: the diver hovers in place (the dive time stops); the sea keeps moving (see the animal clocks in main.js).
function restart() {
  state.t = 0; state.fadeT = 0; recenter(); swim.off.set(0, 0, 0); swim.zoomTarget = 1; PASSERS.lastT = 0; deactivatePassers();
  ACTORS.forEach(a => { a.lag = 0; }); reshuffle();   // a new version of the dive
  if (!state.playing) togglePause();
}

export { togglePause, restart };

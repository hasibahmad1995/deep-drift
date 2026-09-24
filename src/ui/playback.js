/* Pause, play and restart. */
import { state } from '../dive/state.js';
import { recenter, swim } from '../diver/input.js';
import { PASSERS, deactivatePassers } from '../life/passers.js';
import { $ } from '../util/dom.js';

function togglePause() {
  state.playing = !state.playing; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
}
function restart() { state.t = 0; recenter(); swim.off.set(0, 0, 0); swim.zoomTarget = 1; PASSERS.lastT = 0; deactivatePassers(); if (!state.playing) togglePause(); }

export { togglePause, restart };

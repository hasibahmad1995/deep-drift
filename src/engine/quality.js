/* Keeps the dive smooth on any computer or phone by changing how many pixels are drawn.
   Slow pictures: draw fewer pixels soon (after about half a second). Plenty of spare time: draw more again,
   but only slowly and never above where we started, so the sharpness does not keep jumping up and down. */
import { renderer, display } from './renderer.js';
import { U } from './uniforms.js';

const START = display.pixelRatio, LOWEST = 0.6;
const Q = { n: 0, sum: 0, fastRun: 0 };
U.pix.value = START;

// ms = how long the last picture took (real time). onChange() is called after the pixel count changes (to resize).
function trackFrame(ms, onChange) {
  if (ms > 1000) return;   // the tab was hidden or the page was busy: not a fair sample
  Q.n++; Q.sum += Math.min(ms, 250);
  if (Q.n < 30) return;
  const avg = Q.sum / Q.n; Q.n = 0; Q.sum = 0;
  let next = display.pixelRatio;
  if (avg > 26 && next > LOWEST) { next = Math.max(LOWEST, next * 0.85); Q.fastRun = 0; }          // under about 38 pictures a second
  else if (avg < 13) { if (++Q.fastRun >= 8 && next < START) { next = Math.min(START, next * 1.1); Q.fastRun = 0; } }   // 4 seconds at over 75 a second
  else Q.fastRun = 0;
  if (next !== display.pixelRatio) { display.pixelRatio = next; U.pix.value = next; renderer.setPixelRatio(next); onChange(); }
}

export { trackFrame };

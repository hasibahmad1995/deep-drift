/* Keeps the dive smooth on any computer or phone by changing how many pixels are drawn (the sharpness).
   The starting sharpness is chosen before Begin by a quick test of this machine (benchmark.js), so the dive does not
   have to adjust itself during the first minute. During the dive it changes only if pictures stay slow for about a
   second (then fewer pixels), or stay very fast for several seconds (then more, never above the screen's own). */
import { renderer, display } from './renderer.js';
import { U } from './uniforms.js';

const MOST = display.pixelRatio, LEAST = 0.6;
const Q = { n: 0, sum: 0, slowRun: 0, fastRun: 0 };
U.pix.value = MOST;

// Sets the sharpness right away. Changing the pixel count clears the picture, so call this before drawing a frame.
function setSharpness(r) {
  r = Math.min(MOST, Math.max(LEAST, r));
  if (Math.abs(r - display.pixelRatio) < 0.01) return;
  display.pixelRatio = r; U.pix.value = r; renderer.setPixelRatio(r);
}

// ms = how long the last picture took (real time)
function trackFrame(ms) {
  if (ms > 1000) return;   // the tab was hidden or the page was busy: not a fair sample
  Q.n++; Q.sum += Math.min(ms, 250);
  if (Q.n < 30) return;
  const avg = Q.sum / Q.n; Q.n = 0; Q.sum = 0;
  if (avg > 40) { Q.fastRun = 0; if (++Q.slowRun >= 2) { setSharpness(display.pixelRatio * 0.85); Q.slowRun = 0; } }   // under 25 pictures a second, twice in a row
  else if (avg < 14) { Q.slowRun = 0; if (++Q.fastRun >= 8) { setSharpness(display.pixelRatio * 1.1); Q.fastRun = 0; } }   // over 70 a second for about 4 s
  else { Q.slowRun = 0; Q.fastRun = 0; }
}

export { trackFrame, setSharpness, MOST, LEAST };

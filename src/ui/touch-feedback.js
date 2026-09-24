/* What happens when the diver touches an animal: a small jolt, a caption, a buzz and a sound. */
import { pop } from '../audio/music.js';
import { swim } from '../diver/input.js';
import { TOUCH } from '../life/touch.js';
import { touchMsg } from './hud.js';

let lastHit = 0;
TOUCH.hit = name => {
  const now = performance.now(); if (now - lastHit < 350) return; lastHit = now;
  swim.jolt = 1; touchMsg.text = 'You touched: ' + name; touchMsg.until = now + 2200;
  if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) { /* not allowed here */ } }
  pop();
};

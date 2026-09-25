/* A different dive every time. Each scripted animal registers a "roll": a small function that picks this dive's
   version of it (meeting you at a different depth within where it really lives, nearer or farther, on the left or the
   right, faster or slower, and sometimes not there at all). reshuffle() rolls everything again; it runs at Begin and at every restart.
   Rolls must keep animals out of rock (motion.js checks each new path and falls back to the original one). */
import { rand } from '../util/math.js';

const ROLLS = [];
const chance = p => Math.random() < p;

// Registers a roll and runs it once now, so everything has a valid place before the first reshuffle.
function vary(roll) { ROLLS.push(roll); roll(); }
function reshuffle() { ROLLS.forEach(r => r()); }

// Shared dice for animals that travel together (a pod of dolphins): all members read the same numbers.
function dice() {
  const d = {};
  vary(() => { d.u = Math.random(); d.mirror = chance(0.5); d.far = rand(0.85, 1.25); d.speed = rand(0.85, 1.2); d.here = chance(0.8); });   // u picks the moment
  return d;
}

export { vary, reshuffle, chance, dice };

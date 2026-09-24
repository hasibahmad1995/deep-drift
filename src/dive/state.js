/* Where the dive is now (time, depth, part) and how long the last frame took. */

const state = { D: 0, stage: 0, t: 0, playing: false, started: false };
const clock = { dt: 0.016 };   // seconds since the last picture

export { state, clock };

/* Where the dive is now (time, depth, part) and how long the last frame took. */

// t = dive time (stops while paused: the diver hovers); life = the sea's own time (always runs once started).
// fadeT = seconds since a fade from black began (after a restart), or null.
const state = { D: 0, stage: 0, t: 0, life: 0, playing: false, started: false, fadeT: null };
const clock = { dt: 0.016 };   // seconds since the last picture

export { state, clock };

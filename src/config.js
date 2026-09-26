/* Easy-to-change settings and the colour of the water at each depth. */

// The site's name and subtitle are written in index.html (so the start screen appears at once, before any code runs).
const SETTINGS = {
  speed: 1,            // 1 = normal dive speed. 0.5 = half speed. 2 = double speed.
  musicVolume: 0.5,    // 0 is silent, 1 is loudest
  lookRange: 1.25,     // how far you can turn your head (in radians)
  reefDetail: 1,       // 1 = full coral and fish. Phones use half of this automatically.
  maxPixelRatio: 2     // lower (for example 1.5) if a phone feels slow
};

// The parts of the dive and their timing are in src/dive/route.js; the plan of the world is in src/world/sites.js.

// Colour of the water at each depth (metres) and how fast each colour of light fades per metre.
// Red fades first, then green, then blue. This is why deep water looks blue and then black.
const ENV = [
  { d: 0,     fog: '#1a9cc8', abs: [0.115, 0.042, 0.020] },
  { d: 60,    fog: '#0e6e9c', abs: [0.150, 0.056, 0.028] },
  { d: 200,   fog: '#0b5583', abs: [0.220, 0.090, 0.050] },
  { d: 500,   fog: '#07345a', abs: [0.300, 0.130, 0.080] },
  { d: 1000,  fog: '#041a33', abs: [0.300, 0.120, 0.075] },
  { d: 3000,  fog: '#020c1a', abs: [0.095, 0.058, 0.046] },   // deep water is very clear; it is dark only because no light reaches it
  { d: 11000, fog: '#010409', abs: [0.095, 0.058, 0.046] }
];

export { SETTINGS, ENV };

/* Small number helpers. */

const TAU = Math.PI * 2;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);
const seeded = seed => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

export { TAU, clamp, lerp, smooth, rand, seeded };

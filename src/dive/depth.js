/* Real depth (metres below the surface) and height in the 3D world.
   Near the surface 1 m of depth is 1 m of world. Deeper, the ocean is squeezed more and more, so the whole
   descent to 10,935 m fits in a few minutes. Everything near you stays at real size; only the depth counter
   runs faster than a real descent (the page says so). */

// Each band: [depth where the band starts, world metres per real metre]
const BANDS = [[0, 1.0], [200, 0.3], [1000, 0.25], [1600, 0.1], [4000, 0.05]];
const DEEPEST = 10935;   // the Challenger Deep

// Real depth -> world height (negative, below the surface at y = 0)
function worldY(D) {
  let y = 0;
  for (let i = 0; i < BANDS.length; i++) {
    const [d0, k] = BANDS[i], d1 = i + 1 < BANDS.length ? BANDS[i + 1][0] : Infinity;
    if (D <= d0) break;
    y -= (Math.min(D, d1) - d0) * k;
  }
  return y;
}

// World height -> real depth
function depthAt(y) {
  let rest = -y, D = 0;
  for (let i = 0; i < BANDS.length; i++) {
    const [d0, k] = BANDS[i], d1 = i + 1 < BANDS.length ? BANDS[i + 1][0] : Infinity, span = (d1 - d0) * k;
    if (rest <= span) return d0 + rest / k;
    rest -= span; D = d1;
  }
  return D;
}

export { BANDS, DEEPEST, worldY, depthAt };


/* =====================================================================
   5. ANIMALS
   Most animals are built by code from rings and flat fins. Their skins are pictures
   drawn in code. They swim with a wave that runs along the body.
   ===================================================================== */
const skins = {};   // skin pictures, made once when first needed
function skin(kind) {
  if (skins[kind]) return skins[kind];
  const R = seeded(kind.length * 31 + 7);
  const t = canvasTexture(1024, 256, (g, w, h) => {
    const grad = (stops) => { const lg = g.createLinearGradient(0, 0, 0, h); stops.forEach(([p, c]) => lg.addColorStop(p, c)); g.fillStyle = lg; g.fillRect(0, 0, w, h); };
    if (kind === 'whaleshark') {
      grad([[0, '#5b7a8f'], [0.25, '#2f4a60'], [0.5, '#5b7a8f'], [0.75, '#d7e0e2'], [1, '#5b7a8f']]);
      g.strokeStyle = 'rgba(190,210,220,.16)'; g.lineWidth = 3;
      for (let x = 60; x < w; x += 90) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 6, h * 0.55); g.stroke(); }
      for (let y = 30; y < h * 0.55; y += 44) { g.beginPath(); g.moveTo(60, y); g.lineTo(w, y); g.stroke(); }
      for (let i = 0; i < 520; i++) {
        const x = R() * w, y = R() * h * 0.52, r = 3 + R() * 5;
        g.fillStyle = 'rgba(245,250,250,' + (0.7 + R() * 0.3) + ')'; g.beginPath(); g.ellipse(x, y, r * 1.2, r, 0, 0, TAU); g.fill();
      }
    } else if (kind === 'manta') {
      grad([[0, '#1c242c'], [0.25, '#20292f'], [0.47, '#151b21'], [0.53, '#e9eef0'], [0.75, '#f3f6f7'], [0.97, '#dfe6e9'], [1, '#1c242c']]);
      g.fillStyle = '#eef3f5';
      [[0.16, 0.2], [0.16, 0.3]].forEach(([u, v], k) => { g.beginPath(); g.moveTo(w * 0.08, h * (0.38)); g.quadraticCurveTo(w * 0.2, h * 0.08, w * 0.34, h * 0.1); g.quadraticCurveTo(w * 0.24, h * 0.22, w * 0.2, h * 0.4); g.fill(); });
      g.fillStyle = 'rgba(20,25,30,.5)'; for (let i = 0; i < 26; i++) { g.beginPath(); g.arc(w * (0.3 + R() * 0.3), h * (0.56 + R() * 0.36), 3 + R() * 5, 0, TAU); g.fill(); }
    } else if (kind === 'humpback') {
      grad([[0, '#3b5163'], [0.25, '#1f3142'], [0.5, '#3b5163'], [0.66, '#7f95a3'], [0.8, '#dfe6ea'], [1, '#3b5163']]);
      g.strokeStyle = 'rgba(20,30,40,.35)'; g.lineWidth = 2;
      for (let y = h * 0.6; y < h * 0.95; y += 9) { g.beginPath(); g.moveTo(w * 0.05, y); g.lineTo(w * 0.62, y + 2); g.stroke(); }
      g.fillStyle = 'rgba(220,230,235,.55)'; for (let i = 0; i < 90; i++) { g.beginPath(); g.arc(R() * w, R() * h * 0.5, 1 + R() * 3, 0, TAU); g.fill(); }
    } else if (kind === 'squid') {
      grad([[0, '#b34a33'], [0.25, '#8f3624'], [0.5, '#b34a33'], [0.75, '#e0a184'], [1, '#b34a33']]);
      for (let i = 0; i < 900; i++) { g.fillStyle = 'rgba(70,15,8,' + (0.15 + R() * 0.3) + ')'; g.beginPath(); g.arc(R() * w, R() * h, 1 + R() * 3.5, 0, TAU); g.fill(); }
    } else if (kind === 'angler') {
      grad([[0, '#6a5244'], [0.25, '#45342b'], [0.5, '#6a5244'], [0.75, '#8b7160'], [1, '#6a5244']]);
      for (let i = 0; i < 1000; i++) { g.fillStyle = 'rgba(' + (R() < 0.5 ? '20,12,8' : '110,85,65') + ',' + (0.12 + R() * 0.25) + ')'; g.beginPath(); g.arc(R() * w, R() * h, 1 + R() * 4, 0, TAU); g.fill(); }
    } else if (kind === 'dumbo') {
      grad([[0, '#f6c9bd'], [0.25, '#efb4a6'], [0.5, '#f6c9bd'], [0.75, '#fbe2da'], [1, '#f6c9bd']]);
    } else if (kind === 'snailfish') {
      grad([[0, '#e9c4c6'], [0.25, '#dcaab0'], [0.5, '#e9c4c6'], [0.75, '#f6e3e2'], [1, '#e9c4c6']]);
      g.strokeStyle = 'rgba(190,110,125,.3)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.1, h * 0.02); g.lineTo(w, h * 0.02); g.stroke();
    }
  });
  t.repeat.set(1, 1); skins[kind] = t; return t;
}

/* Builds one animal from a recipe:
   L = length in metres, rows = body shape, paint = colour function,
   fins = extra flat parts, eyes = [x, y, z, radius] as fractions of L. */
function buildCreature(o) {
  const L = o.L, parts = [];
  const body = loft(L, o.rows, o.rings || 48, o.radial || 22);
  paintGeo(body, o.paint || (() => '#888888'));
  parts.push(body);
  (o.fins || []).forEach(f => {
    const g = flat(f.pts, L);
    place(g, f.at[0] * L, f.at[1] * L, f.at[2] * L, f.rot ? f.rot[0] : 0, f.rot ? f.rot[1] : 0, f.rot ? f.rot[2] : 0);
    paintGeo(g, (p, n) => (typeof f.color === 'function' ? f.color(p, n, L) : f.color));
    parts.push(g);
  });
  (o.eyes || []).forEach(e => {
    const g = sphereAt(e[3] * L, e[0] * L, e[1] * L, e[2] * L, 10); g.computeVertexNormals();
    paintGeo(g, () => o.eyeColor || '#0a0a0a'); parts.push(g);
  });
  (o.extra || []).forEach(g => parts.push(g));
  const geo = mergeGeo(parts);
  const mat = wet(new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: o.rough == null ? 0.5 : o.rough, metalness: 0.04, side: THREE.DoubleSide, map: o.map ? skin(o.map) : null,
    transparent: !!o.alpha, opacity: o.alpha || 1,
    emissive: o.emissive ? new THREE.Color(o.emissive) : new THREE.Color(0), emissiveIntensity: 1
  }), { bend: o.bend });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData.len = L; mesh.frustumCulled = false;
  return mesh;
}

const mixc = (a, b, t) => col(a).lerp(col(b), t);
const countershade = (back, belly, edge = 0.22) => (p, n) => mixc(belly, back, smooth(clamp((n.y + 0.02) / edge)));

const SPECIES = {};

// ---- Reef shark (blacktip) and great white ----
function sharkSpec(L, back, belly, tip) {
  const fc = (p, n, LL) => (tip && p.y > 0.06 * LL ? '#141210' : mixc(back, '#000000', 0.15));
  return {
    L, rough: 0.42, bend: { mode: 1, amp: 0.085, speed: 4.6, wave: 5.2, len: L },
    rows: [[0, 0.002, 0.002, 0.002, 0], [0.02, 0.02, 0.022, 0.018, 0], [0.08, 0.05, 0.055, 0.042, 0], [0.2, 0.075, 0.085, 0.072, 0], [0.38, 0.088, 0.105, 0.09, 0], [0.55, 0.07, 0.08, 0.068, 0], [0.75, 0.04, 0.046, 0.04, 0], [0.9, 0.02, 0.024, 0.02, 0], [1, 0.012, 0.014, 0.012, 0]],
    paint: countershade(back, belly),
    fins: [
      { pts: [[0.03, 0], [-0.01, 0.05], [-0.045, 0.115], [-0.075, 0.055], [-0.135, 0]], at: [0.12, 0.085, 0], color: fc },
      { pts: [[0.03, 0], [-0.02, 0.02], [-0.045, 0.045], [-0.07, 0]], at: [-0.22, 0.05, 0], color: fc },
      { pts: [[0.04, 0], [-0.04, 0], [-0.17, 0.19], [-0.09, 0.17], [-0.01, 0.08]], at: [0.1, -0.05, 0.05], rot: [Math.PI / 2 + 0.3, 0, 0], color: fc },
      { pts: [[0.04, 0], [-0.04, 0], [-0.17, 0.19], [-0.09, 0.17], [-0.01, 0.08]], at: [0.1, -0.05, -0.05], rot: [-Math.PI / 2 - 0.3, 0, 0], color: fc },
      { pts: [[0.02, 0], [-0.05, 0.02], [-0.15, 0.17], [-0.19, 0.17], [-0.13, 0.03], [-0.19, -0.085], [-0.15, -0.085], [-0.05, -0.02]], at: [-0.49, 0.01, 0], color: fc }
    ],
    eyes: [[0.44, 0.03, 0.045, 0.011], [0.44, 0.03, -0.045, 0.011]]
  };
}
SPECIES.blacktip = sharkSpec(1.7, '#7d6f5c', '#efe9dc', true);
SPECIES.greatwhite = sharkSpec(4.6, '#56636e', '#f2f4f4', false);

// ---- Whale shark ----
SPECIES.whaleshark = {
  L: 9, rough: 0.6, map: 'whaleshark', bend: { mode: 1, amp: 0.06, speed: 2.4, wave: 4.5, len: 9 },
  rows: [[0, 0.002, 0.002, 0.002, 0], [0.015, 0.05, 0.03, 0.025, 0], [0.06, 0.085, 0.04, 0.035, 0], [0.15, 0.095, 0.055, 0.05, 0], [0.35, 0.09, 0.075, 0.07, 0], [0.55, 0.065, 0.062, 0.06, 0], [0.75, 0.04, 0.04, 0.04, 0], [0.9, 0.02, 0.024, 0.02, 0], [1, 0.012, 0.016, 0.012, 0]],
  paint: () => '#ffffff',
  fins: [
    { pts: [[0.04, 0], [-0.02, 0.06], [-0.07, 0.11], [-0.1, 0.05], [-0.15, 0]], at: [0.1, 0.07, 0], color: '#3f5a70' },
    { pts: [[0.05, 0], [-0.04, 0], [-0.2, 0.2], [-0.11, 0.18], [-0.02, 0.09]], at: [0.16, -0.045, 0.04], rot: [Math.PI / 2 + 0.25, 0, 0], color: '#4a667c' },
    { pts: [[0.05, 0], [-0.04, 0], [-0.2, 0.2], [-0.11, 0.18], [-0.02, 0.09]], at: [0.16, -0.045, -0.04], rot: [-Math.PI / 2 - 0.25, 0, 0], color: '#4a667c' },
    { pts: [[0.02, 0], [-0.05, 0.02], [-0.16, 0.18], [-0.2, 0.18], [-0.14, 0.03], [-0.2, -0.1], [-0.16, -0.1], [-0.05, -0.02]], at: [-0.49, 0.01, 0], color: '#3f5a70' }
  ],
  eyes: [[0.4, 0.015, 0.075, 0.006], [0.4, 0.015, -0.075, 0.006]]
};

// ---- Humpback whale ----
SPECIES.humpback = {
  L: 13, rough: 0.55, map: 'humpback', bend: { mode: 2, amp: 0.05, speed: 1.5, wave: 4, len: 13 },
  rows: [[0, 0.002, 0.002, 0.002, 0], [0.02, 0.035, 0.035, 0.03, 0], [0.1, 0.075, 0.07, 0.06, 0], [0.25, 0.105, 0.11, 0.11, 0], [0.45, 0.125, 0.13, 0.14, 0], [0.62, 0.105, 0.11, 0.1, 0], [0.8, 0.06, 0.06, 0.05, 0], [0.92, 0.03, 0.03, 0.028, 0], [1, 0.02, 0.02, 0.02, 0]],
  paint: () => '#ffffff',
  fins: [
    { pts: [[0.03, 0], [-0.02, 0], [-0.1, 0.25], [-0.07, 0.29], [0.0, 0.1]], at: [0.19, -0.09, 0.09], rot: [Math.PI / 2 + 0.5, 0, 0], color: '#e6edf0' },
    { pts: [[0.03, 0], [-0.02, 0], [-0.1, 0.25], [-0.07, 0.29], [0.0, 0.1]], at: [0.19, -0.09, -0.09], rot: [-Math.PI / 2 - 0.5, 0, 0], color: '#e6edf0' },
    { pts: [[0.03, 0], [-0.01, 0.03], [-0.04, 0.05], [-0.07, 0]], at: [-0.22, 0.09, 0], color: '#2a3d4e' },
    { pts: [[0.0, 0.03], [-0.07, 0.17], [-0.12, 0.2], [-0.12, 0.11], [-0.15, 0], [-0.12, -0.11], [-0.12, -0.2], [-0.07, -0.17], [0, -0.03]], at: [-0.5, 0, 0], rot: [Math.PI / 2, 0, 0], color: '#25384a' }
  ],
  eyes: [[0.4, -0.02, 0.1, 0.006], [0.4, -0.02, -0.1, 0.006]]
};

// ---- Giant manta ray (seen mostly from below or above) ----
SPECIES.manta = {
  L: 7, rough: 0.5, map: 'manta', rings: 60, bend: { mode: 3, amp: 0.2, speed: 2.4, wave: 1.1, len: 7 },
  rows: [[0, 0.003, 0.003, 0.003, 0], [0.02, 0.04, 0.012, 0.012, 0], [0.1, 0.2, 0.03, 0.02, 0], [0.22, 0.42, 0.045, 0.03, 0], [0.32, 0.41, 0.045, 0.03, 0], [0.42, 0.2, 0.035, 0.025, 0], [0.5, 0.04, 0.015, 0.012, 0], [0.55, 0.008, 0.008, 0.008, 0], [1, 0.003, 0.003, 0.003, 0]],
  paint: () => '#ffffff',
  fins: [
    { pts: [[0.03, 0], [0.005, 0.03], [-0.02, 0.005]], at: [0.46, -0.005, 0.03], rot: [Math.PI / 2, 0, 0], color: '#20292f' },
    { pts: [[0.03, 0], [0.005, 0.03], [-0.02, 0.005]], at: [0.46, -0.005, -0.03], rot: [-Math.PI / 2, 0, 0], color: '#20292f' }
  ],
  eyes: [[0.4, 0.012, 0.1, 0.006], [0.4, 0.012, -0.1, 0.006]]
};

// ---- Giant squid ----
SPECIES.squid = {
  L: 4.2, rough: 0.45, map: 'squid', bend: { mode: 1, amp: 0.03, speed: 2.4, wave: 3, len: 4.2 },
  rows: [[0, 0.03, 0.03, 0.03, 0], [0.05, 0.07, 0.07, 0.07, 0], [0.2, 0.095, 0.095, 0.095, 0], [0.6, 0.085, 0.085, 0.085, 0], [0.9, 0.045, 0.045, 0.045, 0], [1, 0.003, 0.003, 0.003, 0]],
  paint: (p, n) => mixc('#b4492f', '#e6a98c', smooth(clamp(-n.y + 0.2))),
  fins: [
    { pts: [[0.1, 0], [0.0, 0.04], [-0.08, 0.16], [-0.16, 0], [-0.08, -0.0]], at: [-0.34, 0.03, 0.0], color: '#a5412b', rot: [0, 0, 0] },
    { pts: [[0.1, 0], [0.0, 0.04], [-0.08, 0.16], [-0.16, 0], [-0.08, -0.0]], at: [-0.34, 0.0, 0.0], color: '#a5412b', rot: [Math.PI / 2, 0, 0] }
  ],
  eyes: [[0.5, 0.0, 0.085, 0.035], [0.5, 0.0, -0.085, 0.035]], eyeColor: '#1b2a30'
};

// ---- Anglerfish ----
// Long, glassy fangs around the wide mouth, pointing in so prey cannot escape.
function anglerTeeth(L) {
  const parts = [], R = seeded(17);
  [1, -1].forEach(jaw => {
    for (let k = 0; k < 11; k++) {
      const a = lerp(-1.25, 1.25, k / 10), len = L * (0.035 + R() * 0.05) * (1 - 0.5 * Math.abs(a) / 1.25), g = new THREE.ConeGeometry(L * 0.007, len, 5);
      g.translate(0, len / 2, 0); g.rotateZ(jaw > 0 ? Math.PI + 0.5 : -0.5);   // top teeth point down and forward, bottom teeth up and forward
      g.translate(L * (0.5 - 0.09 * Math.pow(a / 1.25, 2)), jaw > 0 ? L * 0.06 : -L * 0.08, Math.sin(a) * L * 0.15);
      parts.push(g);
    }
  });
  const g = mergeGeo(parts); return paintGeo(g, () => '#ece8dc');
}
SPECIES.angler = {
  L: 1.1, rough: 0.7, map: 'angler', emissive: 0x0a0604, bend: { mode: 1, amp: 0.05, speed: 3.2, wave: 3, len: 1.1 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.03, 0.12, 0.12, 0.1, 0], [0.12, 0.22, 0.24, 0.22, 0], [0.32, 0.27, 0.28, 0.26, 0], [0.55, 0.2, 0.2, 0.19, 0], [0.78, 0.09, 0.1, 0.09, 0], [0.93, 0.045, 0.05, 0.045, 0], [1, 0.03, 0.03, 0.03, 0]],
  paint: () => '#2e2a28',   // almost black: most deep-sea anglers are dark brown to black
  fins: [
    { pts: [[0.03, 0], [-0.02, 0.06], [-0.07, 0]], at: [-0.22, 0.24, 0], color: '#2c221d' },
    { pts: [[0.03, 0], [-0.03, 0.02], [-0.1, 0.16], [-0.16, 0.15], [-0.1, 0.02], [-0.16, -0.1], [-0.1, -0.1], [-0.03, -0.02]], at: [-0.48, 0, 0], color: '#2c221d' },
    { pts: [[0.03, 0], [-0.05, 0], [-0.12, 0.12], [-0.05, 0.11]], at: [0.05, -0.12, 0.2], rot: [Math.PI / 2 + 0.3, 0, 0], color: '#2c221d' },
    { pts: [[0.03, 0], [-0.05, 0], [-0.12, 0.12], [-0.05, 0.11]], at: [0.05, -0.12, -0.2], rot: [-Math.PI / 2 - 0.3, 0, 0], color: '#2c221d' }
  ],
  eyes: [[0.38, 0.13, 0.19, 0.02], [0.38, 0.13, -0.19, 0.02]], eyeColor: '#c9d6b0',
  extra: [anglerTeeth(1.1)]
};

// ---- Mariana snailfish ----
SPECIES.snailfish = {
  L: 0.34, rough: 0.35, map: 'snailfish', alpha: 0.92, bend: { mode: 1, amp: 0.1, speed: 4, wave: 5, len: 0.34 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.03, 0.06, 0.06, 0.05, 0], [0.12, 0.1, 0.11, 0.09, 0], [0.3, 0.1, 0.1, 0.08, 0], [0.6, 0.06, 0.07, 0.055, 0], [0.9, 0.035, 0.04, 0.035, 0], [1, 0.03, 0.03, 0.03, 0]],
  paint: () => '#a89494'   /* pale animals: not pure white, so the torch does not wash them out */,
  fins: [
    { pts: [[0.3, 0], [0.1, 0.06], [-0.1, 0.08], [-0.4, 0.05], [-0.5, 0]], at: [0.0, 0.07, 0], color: '#b89a9a' },
    { pts: [[0.2, 0], [0, -0.05], [-0.25, -0.07], [-0.5, -0.04], [-0.5, 0]], at: [0.0, -0.06, 0], color: '#b89a9a' },
    { pts: [[0.03, 0], [-0.03, 0.1], [-0.09, 0.1], [-0.05, 0]], at: [0.25, -0.02, 0.09], rot: [Math.PI / 2 + 0.2, 0, 0], color: '#bca2a2' },
    { pts: [[0.03, 0], [-0.03, 0.1], [-0.09, 0.1], [-0.05, 0]], at: [0.25, -0.02, -0.09], rot: [-Math.PI / 2 - 0.2, 0, 0], color: '#bca2a2' }
  ],
  eyes: [[0.44, 0.03, 0.085, 0.022], [0.44, 0.03, -0.085, 0.022]], eyeColor: '#2a1a1c'
};


// ---- Dolphin ----
SPECIES.dolphin = {
  L: 2.4, rough: 0.35, bend: { mode: 2, amp: 0.07, speed: 6, wave: 4, len: 2.4 },
  rows: [[0, 0.002, 0.002, 0.002, 0], [0.03, 0.02, 0.022, 0.018, 0], [0.1, 0.035, 0.045, 0.036, 0], [0.2, 0.075, 0.09, 0.075, 0], [0.42, 0.09, 0.1, 0.09, 0], [0.68, 0.055, 0.06, 0.055, 0], [0.9, 0.025, 0.028, 0.025, 0], [1, 0.015, 0.018, 0.015, 0]],
  paint: countershade('#66757f', '#dde3e5', 0.3),
  fins: [
    { pts: [[0.05, 0], [-0.005, 0.08], [-0.06, 0.12], [-0.055, 0.05], [-0.11, 0]], at: [0.05, 0.09, 0], color: '#586670' },
    { pts: [[0.03, 0], [-0.03, 0], [-0.09, 0.11], [-0.04, 0.1]], at: [0.22, -0.06, 0.06], rot: [Math.PI / 2 + 0.4, 0, 0], color: '#586670' },
    { pts: [[0.03, 0], [-0.03, 0], [-0.09, 0.11], [-0.04, 0.1]], at: [0.22, -0.06, -0.06], rot: [-Math.PI / 2 - 0.4, 0, 0], color: '#586670' },
    { pts: [[0, 0.02], [-0.05, 0.1], [-0.09, 0.13], [-0.09, 0.07], [-0.11, 0], [-0.09, -0.07], [-0.09, -0.13], [-0.05, -0.1], [0, -0.02]], at: [-0.5, 0, 0], rot: [Math.PI / 2, 0, 0], color: '#4e5c66' }
  ],
  eyes: [[0.3, 0.03, 0.075, 0.008], [0.3, 0.03, -0.075, 0.008]]
};

// ---- Sperm whale ----
SPECIES.sperm = {
  L: 13, rough: 0.6, bend: { mode: 2, amp: 0.04, speed: 1.2, wave: 4, len: 13 },
  rows: [[0, 0.07, 0.09, 0.09, 0], [0.04, 0.1, 0.12, 0.12, 0], [0.25, 0.11, 0.13, 0.12, 0], [0.5, 0.09, 0.1, 0.1, 0], [0.75, 0.05, 0.055, 0.05, 0], [0.92, 0.025, 0.03, 0.03, 0], [1, 0.02, 0.02, 0.02, 0]],
  paint: countershade('#3f4a54', '#7c8790', 0.5),
  fins: [
    { pts: [[0.03, 0], [-0.03, 0], [-0.07, 0.08], [-0.02, 0.07]], at: [0.3, -0.1, 0.09], rot: [Math.PI / 2 + 0.4, 0, 0], color: '#3a444d' },
    { pts: [[0.03, 0], [-0.03, 0], [-0.07, 0.08], [-0.02, 0.07]], at: [0.3, -0.1, -0.09], rot: [-Math.PI / 2 - 0.4, 0, 0], color: '#3a444d' },
    { pts: [[0.03, 0], [-0.005, 0.03], [-0.04, 0.04], [-0.07, 0]], at: [-0.22, 0.1, 0], color: '#3a444d' },
    { pts: [[0, 0.03], [-0.06, 0.16], [-0.1, 0.19], [-0.1, 0.1], [-0.13, 0], [-0.1, -0.1], [-0.1, -0.19], [-0.06, -0.16], [0, -0.03]], at: [-0.5, 0, 0], rot: [Math.PI / 2, 0, 0], color: '#333d46' }
  ],
  eyes: [[0.3, -0.02, 0.1, 0.005], [0.3, -0.02, -0.1, 0.005]]
};

// ---- Dumbo octopus ----
// Its eight arms are joined by a web, like an umbrella. It swims mantle first, with the web trailing behind.
function dumboWebGeo(L) {
  const NI = 10, NJ = 48, pos = [], idx = [];
  for (let i = 0; i <= NI; i++) for (let j = 0; j <= NJ; j++) {
    const t = i / NI, a = j / NJ * TAU, arm = Math.pow(Math.abs(Math.cos(a * 4)), 6);   // arm = 1 along each of the 8 arms
    const r = L * (0.1 + 0.3 * Math.pow(t, 1.2)) * (1 + 0.08 * arm), x = -L * (0.12 + 0.45 * t) + L * 0.1 * t * (1 - arm);   // the web sags back between the arms
    pos.push(x, Math.sin(a) * r, Math.cos(a) * r);
  }
  for (let i = 0; i < NI; i++) for (let j = 0; j < NJ; j++) { const a = i * (NJ + 1) + j, b = a + NJ + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return paintGeo(g, p => mixc('#b08a80', '#c4a298', clamp(-p.x / L)));
}
SPECIES.dumbo = {
  L: 0.42, rough: 0.5, map: 'dumbo', alpha: 0.95, bend: { mode: 1, amp: 0.04, speed: 3, wave: 2, len: 0.42 },
  rows: [[0, 0.004, 0.004, 0.004, 0], [0.06, 0.11, 0.13, 0.1, 0], [0.25, 0.17, 0.17, 0.13, 0], [0.55, 0.14, 0.12, 0.1, 0], [0.85, 0.06, 0.05, 0.04, 0], [1, 0.02, 0.02, 0.02, 0]], paint: () => '#a8948e'   /* pale animals: not pure white, so the torch does not wash them out */,
  fins: [{ pts: [[0, 0], [0.06, 0.16], [0.14, 0.17], [0.16, 0.05]], at: [0.16, 0.09, 0.11], rot: [Math.PI / 2 - 0.5, 0, 0], color: '#b8968c' }, { pts: [[0, 0], [0.06, 0.16], [0.14, 0.17], [0.16, 0.05]], at: [0.16, 0.09, -0.11], rot: [-Math.PI / 2 + 0.5, 0, 0], color: '#b8968c' }],
  eyes: [[0.36, 0.05, 0.1, 0.02], [0.36, 0.05, -0.1, 0.02]],
  extra: [dumboWebGeo(0.42)]
};

// ---- Shrimp (vent shrimp and the amphipods of the trench), the same size as the small fish so they can school ----
function shrimpGeo() {
  const L = 0.18, body = loft(L, [[0, 0.004, 0.004, 0.004, 0], [0.06, 0.05, 0.06, 0.05, 0], [0.3, 0.08, 0.1, 0.08, 0], [0.55, 0.06, 0.07, 0.06, 0], [0.85, 0.035, 0.04, 0.03, 0], [1, 0.012, 0.012, 0.012, 0]], 16, 10);
  const p = body.attributes.position;
  for (let i = 0; i < p.count; i++) { const b = Math.max(0, -p.getX(i) / L); p.setY(i, p.getY(i) - b * b * L * 0.55); }   // the tail curls down
  body.computeVertexNormals();
  const parts = [body, place(flat([[0, 0], [-0.08, 0.07], [-0.1, 0], [-0.08, -0.07]], L), -0.5 * L, -0.14 * L, 0, Math.PI / 2, 0, 0)];   // tail fan
  [-1, 1].forEach(sd => {   // two long feelers and five pairs of legs
    parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.45 * L, 0.02 * L, sd * 0.02 * L), new THREE.Vector3(0.9 * L, 0.2 * L, sd * 0.2 * L), new THREE.Vector3(1.2 * L, 0.1 * L, sd * 0.45 * L)]), 8, 0.003, 3));
    for (let k = 0; k < 5; k++) parts.push(place(new THREE.CylinderGeometry(0.002, 0.003, 0.07, 3), (0.25 - k * 0.08) * L, -0.08 * L, sd * 0.05 * L, sd * 0.5, 0, 0));
  });
  const g = mergeGeo(parts);
  paintGeo(g, (q, n) => mixc('#ffffff', '#d8c8c0', clamp(-n.y * 0.6 + 0.2)));
  return g;
}

// ---- Small reef fish, used by the big schools (colour is set for each fish) ----
function smallFishGeo() {
  const L = 0.18;
  const rows = [[0, 0.003, 0.003, 0.003, 0], [0.05, 0.05, 0.08, 0.07, 0], [0.25, 0.09, 0.16, 0.14, 0], [0.55, 0.07, 0.11, 0.1, 0], [0.85, 0.03, 0.05, 0.04, 0], [1, 0.02, 0.03, 0.02, 0]];
  const parts = [loft(L, rows, 14, 10)];
  parts.push(place(flat([[0.05, 0], [-0.05, 0.14], [-0.09, 0.0], [-0.05, -0.14]], L), -0.49 * L, 0, 0));
  parts.push(place(flat([[0.1, 0], [-0.02, 0.1], [-0.1, 0]], L), 0.0, 0.12 * L, 0));
  const g = mergeGeo(parts);
  paintGeo(g, (p, n) => mixc('#ffffff', '#c8c8c8', clamp(-n.y * 0.6 + 0.1)));
  return g;
}

/* ---- the real fish: a CC0 barramundi 3D model ----
   The shape and the pictures are stored separately. The pictures are set up by hand, because
   some web pages do not allow the usual way of loading pictures out of a model file. */
let barra = null;   // { geometry, material } once ready
function texFrom(uri, srgb) {
  const t = new THREE.Texture(); t.flipY = false; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.encoding = THREE.sRGBEncoding;
  const img = new Image(); img.onload = () => { t.image = img; t.needsUpdate = true; }; img.src = uri; return t;
}
function loadBarramundi(done) {
  const finish = (g, m) => { barra = { geometry: g, material: m }; done(); };
  const fallback = () => {   // a plain silver fish, used only if the model cannot be read
    const g = smallFishGeo(); g.scale(5, 5, 5);
    paintGeo(g, (p, n) => mixc('#6f8792', '#e6ecef', smooth(clamp((0.35 - n.y) / 0.6))));
    finish(g, wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.3, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.09, speed: 8, wave: 5.5, len: 0.9 } }));
  };
  try {
    const bin = atob(BARRA_GEO_B64), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    new THREE.GLTFLoader().parse(buf.buffer, '', gltf => {
      let mesh = null; gltf.scene.traverse(o => { if (o.isMesh && !mesh) mesh = o; });
      if (!mesh) { fallback(); return; }
      const g = mesh.geometry.clone(), m = mesh.material;
      g.computeBoundingBox(); const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
      g.translate(-c.x, -c.y, -c.z); g.rotateY(BARRA_TURN); g.scale(0.95 / size.z, 0.95 / size.z, 0.95 / size.z);
      m.map = texFrom(BARRA_TEX.color, true); m.normalMap = texFrom(BARRA_TEX.normal, false); m.roughnessMap = m.metalnessMap = texFrom(BARRA_TEX.orm, false);
      wet(m, { bend: { mode: 1, amp: 0.09, speed: 8, wave: 5.5, len: 0.95 } });
      finish(g, m);
    }, () => fallback());
  } catch (e) { fallback(); }
}
const BARRA_TURN = -Math.PI / 2;

/* ---- the diver's hand: anything inside this small ball (in front of the mask) is "touched" ---- */
const TOUCH = { point: new THREE.Vector3(), r: 0.75, hit: () => {} };

/* ---- schools of fish: many copies of one shape, moving together ----
   A school either circles a point (cfg.omega) or swims along a straight line (cfg.line).
   If the diver touches a fish, that fish darts away and then slowly comes back to the school. */
class School {
  constructor(geo, mat, n, cfg) {
    this.cfg = cfg; this.n = n; this.name = cfg.name || null;
    this.mesh = new THREE.InstancedMesh(geo, mat, n);
    const ph = new Float32Array(n); this.fish = [];
    for (let i = 0; i < n; i++) {
      ph[i] = Math.random() * TAU;
      this.fish.push({ o: new THREE.Vector3(rand(-1, 1), rand(-0.6, 0.6), rand(-1, 1)), lag: rand(0, 1.2), s: rand(0.8, 1.2), w: rand(0, TAU), off: new THREE.Vector3(), vel: new THREE.Vector3() });
      if (cfg.colors) this.mesh.setColorAt(i, col(cfg.colors[Math.floor(Math.random() * cfg.colors.length)]).multiplyScalar(rand(0.8, 1.1)));
    }
    geo.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
    this.mesh.frustumCulled = false;
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.p = new THREE.Vector3(); this.sc = new THREE.Vector3();
    this.up = new THREE.Vector3(0, 1, 0); this.fw = new THREE.Vector3(); this.eu = new THREE.Euler(0, 0, 0, 'YZX');
  }
  centre(t, out) {
    const c = this.cfg;
    if (c.line) return out.copy(c.line.start).addScaledVector(c.line.vel, t - c.line.t0);
    const a = c.omega * t + c.phase;
    return out.set(c.center[0] + Math.cos(a) * c.radius, c.center[1] + Math.sin(a * 0.7) * c.rise, c.center[2] + Math.sin(a) * c.radius);
  }
  dirAt(t, out) {
    const c = this.cfg;
    if (c.line) return out.set(c.line.vel.x, 0, c.line.vel.z);
    const a = c.omega * t + c.phase, d = c.omega > 0 ? 1 : -1;
    return out.set(-Math.sin(a) * d, 0, Math.cos(a) * d);
  }
  update(t) {
    if (!this.mesh.visible) return;
    const c = this.cfg, spread = c.spread, dt = FRAME_DT, TP = TOUCH.point, reach2 = (TOUCH.r + 0.12) * (TOUCH.r + 0.12);
    for (let i = 0; i < this.n; i++) {
      const f = this.fish[i], tt = t - f.lag * 0.5;
      this.centre(tt, this.p);
      this.p.x += f.o.x * spread + Math.sin(t * 0.8 + f.w) * 0.25; this.p.y += f.o.y * spread * 0.6 + Math.sin(t * 1.1 + f.w) * 0.15; this.p.z += f.o.z * spread;
      this.p.add(f.off);
      const dx = this.p.x - TP.x, dy = this.p.y - TP.y, dz = this.p.z - TP.z, d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < reach2) {   // touched: dart away from the diver
        const l = Math.sqrt(d2) || 1, sp = rand(3, 5);
        f.vel.set(dx / l * sp, (dy / l * 0.6 + rand(-0.2, 0.4)) * sp, dz / l * sp);
        TOUCH.hit(this.name || 'a fish');
      }
      if (f.vel.lengthSq() > 0.01) { f.off.addScaledVector(f.vel, dt); f.vel.multiplyScalar(Math.exp(-dt * 1.6)); }
      f.off.multiplyScalar(Math.exp(-dt * 0.22));   // slowly swim back to the school
      this.dirAt(tt, this.fw); const hl = Math.hypot(this.fw.x, this.fw.z) || 1;
      const hx = this.fw.x / hl + f.vel.x * 0.5, hy = f.vel.y * 0.5, hz = this.fw.z / hl + f.vel.z * 0.5, h = Math.hypot(hx, hy, hz) || 1;
      this.eu.set(Math.sin(t * 0.7 + f.w) * 0.12, Math.atan2(-hz, hx), Math.asin(clamp(hy / h, -1, 1)));
      this.q.setFromEuler(this.eu);
      this.sc.setScalar(c.scale * f.s);
      this.m.compose(this.p, this.q, this.sc);
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

/* ---- sea turtle ---- */
function makeTurtle() {
  const g = new THREE.Group(), R = seeded(3);
  const shellTex = canvasTexture(512, 512, (c, w, h) => {
    c.fillStyle = '#6b5a2e'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 7; y++) for (let x = 0; x < 8; x++) {
      const cx = (x + (y % 2) * 0.5) * 64 + 20, cy = y * 74 + 30;
      c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.5; c.lineTo(cx + Math.cos(a) * 34, cy + Math.sin(a) * 34); } c.closePath();
      c.fillStyle = 'rgb(' + (110 + R() * 40) + ',' + (95 + R() * 35) + ',' + (45 + R() * 25) + ')'; c.fill(); c.strokeStyle = '#3a2f15'; c.lineWidth = 4; c.stroke();
    }
  });
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16, 0, TAU, 0, Math.PI * 0.62), wet(new THREE.MeshStandardMaterial({ map: shellTex, roughness: 0.55, metalness: 0.03, side: THREE.DoubleSide }), { detail: false }));
  shell.scale.set(0.55, 0.3, 0.42);
  const skinM = wet(new THREE.MeshStandardMaterial({ color: col('#7d8450'), roughness: 0.72, side: THREE.DoubleSide }), { detail: true });
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), wet(new THREE.MeshStandardMaterial({ color: col('#d8cf9d'), roughness: 0.8 })));
  belly.scale.set(0.5, 0.09, 0.38); belly.position.y = -0.03;
  const head = new THREE.Group();
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.32, 12), skinM); neck.rotation.z = Math.PI / 2; neck.position.set(0.16, 0, 0);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.115, 16, 12), skinM); skull.scale.set(1.25, 0.9, 0.95); skull.position.set(0.34, 0.0, 0);
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.2 });
  [1, -1].forEach(s => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), wet(eyeM.clone())); e.position.set(0.4, 0.04, s * 0.085); head.add(e); });
  head.add(neck, skull); head.position.set(0.5, 0.02, 0); g.add(head);
  const flip = (len, wid) => flat([[0, 0.03], [len * 0.4, wid], [len * 0.95, wid * 0.25], [len, 0], [len * 0.6, -wid * 0.5], [0, -0.03]], 1);
  const mk = (len, wid) => new THREE.Mesh(flip(len, wid), skinM);
  const fl = [mk(0.75, 0.13), mk(0.75, 0.13)], rl = [mk(0.3, 0.07), mk(0.3, 0.07)];
  fl[0].position.set(0.22, -0.02, 0.32); fl[1].position.set(0.22, -0.02, -0.32);
  rl[0].position.set(-0.4, -0.02, 0.22); rl[1].position.set(-0.4, -0.02, -0.22);
  [...fl, ...rl].forEach(f => g.add(f));
  g.add(shell, belly);
  g.userData.update = t => {
    const s = Math.sin(t * 1.3);
    fl[0].rotation.set(0, -1.3 - s * 0.3, 0.2 + s * 0.6); fl[1].rotation.set(0, 1.3 + s * 0.3 + Math.PI, -(0.2 + s * 0.6));
    fl[1].rotation.set(Math.PI, 1.3 + s * 0.3, -0.2 - s * 0.6);
    rl[0].rotation.set(0, -2.3, 0.2 + s * 0.2); rl[1].rotation.set(Math.PI, 2.3, -0.2 - s * 0.2);
    head.rotation.z = Math.sin(t * 0.65) * 0.05; g.rotation.z = Math.sin(t * 0.65) * 0.03;
  };
  g.scale.setScalar(1.15);
  return g;
}

/* ---- jellyfish: a glowing bell with trailing tentacles ---- */
const jellyBellGeo = new THREE.SphereGeometry(1, 40, 20, 0, TAU, 0, Math.PI * 0.56);
function makeJelly(hue, glow) {
  const g = new THREE.Group(), R = Math.random;
  const uni = { uTime: U.time, uPhase: { value: R() * 6 }, uCol: { value: new THREE.Color().setHSL(hue, 0.65, 0.65) }, uFog: { value: scene.fog.color }, uAbs: U.absorb, uGlow: { value: glow }, uLight: { value: 1 } };
  const bell = new THREE.Mesh(jellyBellGeo, new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false,
    vertexShader: `uniform float uTime; uniform float uPhase; varying vec3 vN; varying vec3 vV; varying vec3 vWP; varying vec3 vL;
      void main(){ vec3 p = position; float pulse = sin(uTime * 1.5 + uPhase);
        p.xz *= 1.0 + 0.10 * pulse * (1.0 - p.y) - 0.04 * pulse; p.y *= 1.0 + 0.10 * pulse; vL = position;
        vec4 w = modelMatrix * vec4(p, 1.0); vWP = w.xyz; vN = normalize(mat3(modelMatrix) * normalize(position)); vV = normalize(cameraPosition - w.xyz);
        gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uCol; uniform vec3 uFog; uniform vec3 uAbs; uniform float uGlow; uniform float uLight; varying vec3 vN; varying vec3 vV; varying vec3 vWP; varying vec3 vL;
      void main(){ float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float ang = atan(vL.z, vL.x); float rib = pow(abs(sin(ang * 8.0)), 10.0) * smoothstep(0.1, 0.9, 1.0 - vL.y);
        float rim = smoothstep(0.86, 1.0, 1.0 - vL.y);
        vec3 c = uCol * (0.35 * uLight + uGlow) * (0.5 + 0.9 * fr) + uCol * rib * 0.5 * (uLight + uGlow) + vec3(1.0, 0.9, 0.95) * rim * 0.35 * (uLight + uGlow);
        float a = 0.16 + 0.55 * fr + 0.22 * rib + 0.3 * rim;
        float dist = length(vWP - cameraPosition); vec3 T = exp(-uAbs * dist);
        c = c * T + uFog * (vec3(1.0) - T) * 0.0;
        gl_FragColor = vec4(c, a * (0.4 + 0.6 * T.b));
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  }));
  // tentacles: many thin lines that sway
  const n = 46, seg = 14, pos = [], sd = [];
  for (let i = 0; i < n; i++) {
    const a = R() * TAU, rr = i < 30 ? 0.9 : 0.35 * R(), len = (i < 30 ? 1.3 : 2.0) + R() * 1.2;
    const seed = R() * 6;
    for (let k = 0; k < seg; k++) {
      for (const kk of [k, k + 1]) { pos.push(Math.cos(a) * rr * (1 - 0.15 * kk / seg), -len * kk / seg, Math.sin(a) * rr * (1 - 0.15 * kk / seg)); sd.push(seed); }
    }
  }
  const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('aSeed', new THREE.Float32BufferAttribute(sd, 1));
  const lines = new THREE.LineSegments(lg, new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, fog: false,
    vertexShader: `uniform float uTime; attribute float aSeed; varying float vY; varying vec3 vWP; void main(){ vec3 p = position; float k = -p.y;
        p.x += sin(uTime * 0.9 + aSeed + k * 2.2) * 0.12 * k; p.z += cos(uTime * 0.7 + aSeed + k * 2.0) * 0.12 * k; vY = k;
        vec4 w = modelMatrix * vec4(p, 1.0); vWP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: `uniform vec3 uCol; uniform vec3 uAbs; uniform float uGlow; uniform float uLight; varying float vY; varying vec3 vWP;
      void main(){ float d = length(vWP - cameraPosition); vec3 T = exp(-uAbs * d);
        gl_FragColor = vec4(uCol * (0.4 * uLight + uGlow) , (0.5 - vY * 0.12) * T.b);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`
  }));
  g.add(bell, lines); g.userData.uni = uni;
  return g;
}


/* =====================================================================
   7. THE DIVE PATH (where the diver goes)
   ===================================================================== */
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (REDUCED) SETTINGS.speed *= 0.5;
let TOTAL = 0;
STAGES.forEach(s => { s.dur = s.seconds / SETTINGS.speed; s.t0 = TOTAL; TOTAL += s.dur; });
const stageIndex = t => { for (let i = 0; i < STAGES.length; i++) if (t < STAGES[i].t0 + STAGES[i].dur) return i; return STAGES.length - 1; };
const tu = (si, u) => STAGES[si].t0 + STAGES[si].dur * u;
const groups = {};
const facing = (yaw, pitch, out) => out.set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw));
const worldY = D => (D < 180 ? -D : -(180 + (D - 180) * 0.35));   // deep water is squeezed so the dive stays short

// Where is the diver at time t, and which way do they look?
function pathAt(t) {
  const si = stageIndex(t), S = STAGES[si], u = clamp((t - S.t0) / S.dur), O = STAGE_ORIGIN(si), pos = new THREE.Vector3(), fwd = new THREE.Vector3();
  let D = 0;
  switch (S.id) {
    case 'reef': {
      const uu = clamp((u - 0.025) / 0.975), e = 0.85 * smooth(uu) + 0.15 * uu;
      D = 55 * e;
      pos.set(-(lerp(14, 21, e) + 0.9 * Math.sin(u * 17)), worldY(D) - 2.6, 3.5 * Math.sin(u * 6));
      facing(lerp(0, Math.PI, smooth(clamp((u - 0.03) / 0.1))) + 0.12 * Math.sin(u * 5), u < 0.05 ? 1.25 : lerp(1.25, -0.3, smooth(clamp((u - 0.05) / 0.09))) + 0.08 * Math.sin(u * 9), fwd);
      break;
    }
    case 'blue': {
      D = 55 + 945 * u * u;
      pos.set(lerp(19, 12, u) + 1.5 * Math.sin(u * 3), worldY(D), 3 * Math.sin(u * 2.4));
      facing(Math.PI - 0.35 + 0.5 * Math.sin(u * 2.2), -0.22 + 0.22 * Math.sin(u * 3.3), fwd);
      break;
    }
    case 'mid': {
      D = 1000 + 1500 * u;
      pos.set(-(14 - 3 * u) + 2 * Math.sin(u * 4), worldY(D), 2 * Math.cos(u * 3));
      facing(0.2 + 0.6 * Math.sin(u * 2.6), -0.15 + 0.15 * Math.sin(u * 3), fwd);
      break;
    }
    case 'vents': {
      D = 2600;
      const x = lerp(-32, 44, u), z = 1 + 2 * Math.sin(u * 5), fy = groups.vents ? groups.vents.userData.floorH(x, z) : VENT_FLOOR_Y;
      pos.set(x, fy + 4.6 + 0.6 * Math.sin(u * 7), z).add(O);
      facing(0.25 * Math.sin(u * 5) - 0.2, -0.24, fwd);
      break;
    }
    case 'wreck': {
      D = 3800;
      const a = lerp(-2.5, 0.9, u), R = 24 - 6 * u, cy = (groups.wreck ? groups.wreck.userData.floorH(0, 0) : WRECK_FLOOR_Y) + 7;
      pos.set(Math.cos(a) * R, cy + 5 + 4 * Math.sin(u * 3), Math.sin(a) * R).add(O);
      fwd.set(-Math.cos(a) * R, -6 - 3 * Math.sin(u * 3), -Math.sin(a) * R).normalize();
      break;
    }
    case 'trench': {
      D = 6000 + 4900 * u;
      pos.set(6 * Math.sin(u * 4), lerp(TRENCH_TOP_Y + 110, TRENCH_TOP_Y - 120, smooth(u)), lerp(-40, 55, u)).add(O);
      facing(-Math.PI / 2 + 0.45 * Math.sin(u * 3.2), -0.32 + 0.1 * Math.sin(u * 5), fwd);
      break;
    }
  }
  return { pos, fwd, D, si, u };
}

/* =====================================================================
   8. WHO SWIMS WHERE
   ===================================================================== */
const tmpV = new THREE.Vector3();
function orient(obj, vx, vy, vz) {
  const l = Math.hypot(vx, vy, vz) || 1;
  obj.rotation.order = 'YZX'; obj.rotation.set(0, Math.atan2(-vz, vx), Math.asin(vy / l));
}
// An animal that swims in a straight line and passes the diver at time tMeet.
function passBy(obj, tMeet, offset, vel, name, range, tick) {
  const meet = pathAt(tMeet).pos.clone().add(offset);
  scene.add(obj); orient(obj, vel.x, vel.y, vel.z);
  ACTORS.push({ obj, name, range: range || 22, update(t) {
    obj.position.copy(meet).addScaledVector(vel, t - tMeet);
    orient(obj, vel.x, vel.y, vel.z); if (tick) tick(t);
  } });
}
// An animal that swims in circles around a point.
function orbit(obj, centre, radius, omega, phase, rise, name, range) {
  scene.add(obj);
  ACTORS.push({ obj, name, range: range || 22, update(t) {
    const a = omega * t + phase, d = omega > 0 ? 1 : -1;
    obj.position.set(centre.x + Math.cos(a) * radius, centre.y + rise * Math.sin(a * 0.6), centre.z + Math.sin(a) * radius);
    orient(obj, -Math.sin(a) * d, rise * 0.6 * omega * Math.cos(a * 0.6) / Math.max(radius * omega, 0.01), Math.cos(a) * d);
  } });
}
function makeCreature(spec) { return buildCreature(spec); }
// A direction or place described from the diver's point of view: f = ahead, s = to the right, u = up.
function view(tm, f, s, u) {
  const p = pathAt(tm), right = new THREE.Vector3().crossVectors(p.fwd, UP).normalize();
  return new THREE.Vector3().addScaledVector(p.fwd, f).addScaledVector(right, s).addScaledVector(UP, u);
}

function buildLife() {
  const schools = [];
  const addSchool = (school) => { scene.add(school.mesh); schools.push(school); };
  const fishMat = () => wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const smallMat = fishMat();
  const nb = Math.max(10, Math.round(34 * DETAIL)), nSmall = Math.max(40, Math.round(140 * DETAIL));
  const O = STAGE_ORIGIN(0);
  const cfg = (c, r, om, ph, sp, sc, colors, rise) => ({ center: [-c[0] + O.x, c[1], c[2] + O.z], radius: r, omega: om, phase: ph, spread: sp, scale: sc, colors, rise: rise == null ? 1.2 : rise });
  if (barra) {
    [[[13, -7, 2], 7, 0.16, 0], [[15, -25, 5], 8, -0.14, 2], [[16, -46, -3], 8, 0.15, 4]].forEach(([c, r, om, ph]) =>
      addSchool(Object.assign(new School(barra.geometry.clone(), barra.material, nb, cfg(c, r, om, ph, 2.4, 1.0)), { name: 'Barramundi' })));
  }
  const orange = ['#ff8a1f', '#ff7a1a', '#ffa030', '#ff6a3d'], teal = ['#7fd6c8', '#5fc9d0', '#a0e0d0'], yellow = ['#f2d13a', '#ffd84a', '#f0c020'];
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, nSmall, cfg([15, -15, -4], 7, 0.2, 1, 3.2, 1.0, orange)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.8), cfg([16, -32, 3], 7, -0.18, 3, 3.0, 0.9, teal)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.4), cfg([15, -39, -3], 6, 0.17, 5, 2.4, 1.3, yellow)), { name: 'Reef fish' }));
  addSchool(Object.assign(new School(smallFishGeo(), smallMat, Math.round(nSmall * 0.7), cfg([17, -52, 2], 8, -0.16, 2, 3.2, 1.0, orange)), { name: 'Reef fish' }));
  ACTORS.push({ update: t => schools.forEach(s => s.update(t)), obj: null });

  // sharks, turtle, manta
  [[[19, -30, 0], 12, 0.12, 0], [[17, -41, 8], 10, -0.15, 2], [[20, -21, -7], 13, 0.1, 4.2]].forEach(([c, r, om, ph]) => {
    const m = makeCreature(SPECIES.blacktip); orbit(m, new THREE.Vector3(-c[0], c[1], c[2]).add(STAGE_ORIGIN(0)), r, om, ph, 1.5, 'Blacktip reef shark', 30);
  });
  const turtle = makeTurtle();
  passBy(turtle, tu(0, 0.34), view(tu(0, 0.34), 7, 3, 0.5), view(tu(0, 0.34), 0, -0.75, 0), 'Green sea turtle', 20, turtle.userData.update);
  passBy(makeCreature(SPECIES.manta), tu(0, 0.9), view(tu(0, 0.9), 14, 0, 5), view(tu(0, 0.9), 0, -1.4, 0), 'Giant manta ray', 34);
  // open ocean
  passBy(makeCreature(SPECIES.whaleshark), tu(1, 0.16), view(tu(1, 0.16), 15, 8, -1), view(tu(1, 0.16), 0, -1.3, 0), 'Whale shark', 40);
  passBy(makeCreature(SPECIES.greatwhite), tu(1, 0.34), view(tu(1, 0.34), 12, -7, -2), view(tu(1, 0.34), -0.3, 1.2, 0), 'Great white shark', 34);
  passBy(makeCreature(SPECIES.humpback), tu(1, 0.52), view(tu(1, 0.52), 32, 18, -6), view(tu(1, 0.52), 0, -1.4, 0), 'Humpback whale', 60);
  // jellyfish drift up through the twilight and midnight water
  const jelly = (si, u0, u1, n, hue, glow) => {
    for (let i = 0; i < n; i++) {
      const j = makeJelly(hue + rand(-0.05, 0.05), glow), s = rand(0.6, 1.5), tm = tu(si, lerp(u0, u1, Math.random()));
      j.scale.setScalar(s);
      const meet = pathAt(tm).pos.clone().add(view(tm, rand(4, 16), rand(-9, 9), rand(-4, 5)));
      scene.add(j);
      ACTORS.push({ obj: j, name: 'Jellyfish', range: 12, update(t) { j.position.set(meet.x + Math.sin(t * 0.13 + i) * 0.6, meet.y + (t - tm) * 0.18, meet.z + Math.cos(t * 0.11 + i) * 0.6); } });
    }
  };
  jelly(1, 0.45, 1.0, SMALL ? 9 : 16, 0.85, 0.5);
  jelly(2, 0.0, 0.6, SMALL ? 5 : 9, 0.5, 1.0);
  // midnight zone
  const squid = new THREE.Group(), sm = makeCreature(SPECIES.squid); squid.add(sm);
  const armMat = wet(new THREE.MeshStandardMaterial({ color: col('#a5412b'), roughness: 0.5, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.12, speed: 2.2, wave: 3, len: 2.6 } });
  for (let i = 0; i < 10; i++) {
    const long = i >= 8, len = long ? 4.8 : 2.4 + (i % 3) * 0.3, g = loft(len, [[0, 0.004, 0.004, 0.004, 0], [0.05, 0.03, 0.03, 0.03, 0], [long ? 0.85 : 0.5, 0.012, 0.012, 0.012, 0], [long ? 0.9 : 1, long ? 0.035 : 0.004, long ? 0.03 : 0.004, 0.03, 0], [1, 0.004, 0.004, 0.004, 0]], 24, 8);
    const a = i / 10 * TAU, arm = new THREE.Mesh(g, armMat.clone()); arm.userData.len = len;
    arm.material = wet(new THREE.MeshStandardMaterial({ color: col('#a5412b'), roughness: 0.5, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.12, speed: 2.2, wave: 3, len } });
    arm.position.set(2.1 + len / 2, Math.sin(a) * 0.22, Math.cos(a) * 0.22); arm.rotation.y = Math.cos(a) * 0.06; squid.add(arm);
  }
  passBy(squid, tu(2, 0.3), view(tu(2, 0.3), 12, 6, 0), view(tu(2, 0.3), -0.3, -0.55, 0), 'Giant squid', 34);
  const ang = makeCreature(SPECIES.angler), lure = new THREE.Group();
  const stalk = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0.42, 0.24, 0), new THREE.Vector3(0.55, 0.42, 0), new THREE.Vector3(0.8, 0.5, 0)]), 12, 0.006, 5), new THREE.MeshStandardMaterial({ color: 0x3a2d28, roughness: 0.6 }));
  const bulb = glowSprite(0.7, 0xffe9a8); bulb.position.set(0.8, 0.5, 0); lure.add(stalk, bulb);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: 0xfff2c0, fog: false })); core.position.copy(bulb.position); lure.add(core);
  ang.add(lure);
  passBy(ang, tu(2, 0.72), view(tu(2, 0.72), 4.5, 1.0, -0.2), view(tu(2, 0.72), 0.05, -0.4, 0), 'Anglerfish', 16, () => { bulb.scale.setScalar(0.6 + 0.15 * Math.sin(U.time.value * 3)); });
  // the abyss and the trench
  const wc = new THREE.Vector3(0, groups.wreck.userData.floorH(0, 0) + 9, 0).add(STAGE_ORIGIN(4));
  for (let i = 0; i < 3; i++) {
    const d = makeCreature({
      L: 0.42, rough: 0.5, map: 'dumbo', alpha: 0.95, bend: { mode: 1, amp: 0.04, speed: 3, wave: 2, len: 0.42 },
      rows: [[0, 0.004, 0.004, 0.004, 0], [0.06, 0.11, 0.13, 0.1, 0], [0.25, 0.17, 0.17, 0.13, 0], [0.55, 0.14, 0.12, 0.1, 0], [0.85, 0.06, 0.05, 0.04, 0], [1, 0.02, 0.02, 0.02, 0]], paint: () => '#ffffff',
      fins: [{ pts: [[0, 0], [0.06, 0.16], [0.14, 0.17], [0.16, 0.05]], at: [0.16, 0.09, 0.11], rot: [Math.PI / 2 - 0.5, 0, 0], color: '#f7cfc3' }, { pts: [[0, 0], [0.06, 0.16], [0.14, 0.17], [0.16, 0.05]], at: [0.16, 0.09, -0.11], rot: [-Math.PI / 2 + 0.5, 0, 0], color: '#f7cfc3' }],
      eyes: [[0.36, 0.05, 0.1, 0.02], [0.36, 0.05, -0.1, 0.02]]
    });
    orbit(d, wc.clone().add(new THREE.Vector3(0, i * 1.2 - 3, 0)), 12 + i * 5, 0.09 * (i % 2 ? -1 : 1), i * 2.1, 2, 'Dumbo octopus', 16);
  }
  const tc = new THREE.Vector3(0, TRENCH_TOP_Y - 60, 0).add(STAGE_ORIGIN(5));
  for (let i = 0; i < 6; i++) {
    const sfish = makeCreature(SPECIES.snailfish);
    passBy(sfish, tu(5, 0.25 + i * 0.11), view(tu(5, 0.25 + i * 0.11), rand(4, 8), rand(-3, 3), rand(-1, 1)), view(tu(5, 0.25 + i * 0.11), 0.1, -0.16, 0), 'Mariana snailfish', 12);
  }
}


/* =====================================================================
   9b. MORE TO SEE
   ===================================================================== */
// A named spot (no animal) so the caption and fact can show when you are near.
function pseudo(name, pos, range) { const o = new THREE.Object3D(); o.position.copy(pos); ACTORS.push({ obj: o, name, range, update() {} }); }
function buildExtras() {
  const O0 = STAGE_ORIGIN(0), boat = buildBoat();
  // dolphins pass overhead at the start
  [[0, 0], [2.4, 1.6], [-2.2, 2.6]].forEach(([s, f], i) => {
    const d = makeCreature(SPECIES.dolphin);
    passBy(d, tu(0, 0.16), view(tu(0, 0.16), 9 + f, 3 + s, 1.5 - i * 0.3), view(tu(0, 0.16), 0, -2.4, 0.1), 'Dolphin', 20);
  });
  // moon jellies drift near the reef
  for (let i = 0; i < 9; i++) {
    const j = makeJelly(0.56 + rand(-0.05, 0.05), 0.05), s = rand(0.35, 0.8), tm = tu(0, rand(0.1, 0.7)), meet = pathAt(tm).pos.clone().add(view(tm, rand(3, 9), rand(-6, 6), rand(-2, 3)));
    j.scale.setScalar(s); scene.add(j);
    ACTORS.push({ obj: j, name: 'Jellyfish', range: 8, update(t) { j.position.set(meet.x + Math.sin(t * 0.13 + i) * 0.5, meet.y + (t - tm) * 0.1, meet.z + Math.cos(t * 0.11 + i) * 0.5); } });
  }
  // schools that swirl: silver jacks in the open blue, glowing lanternfish in the dark
  const silverMat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.25, metalness: 0.45, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const glowMat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, emissive: new THREE.Color(0.06, 0.5, 0.8), emissiveIntensity: 1.0, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const swirl = (mat, n, tm, f, s, u, radius, om, spread, scale, colors, name) => {
    const c = pathAt(tm).pos.clone().add(view(tm, f, s, u));
    const sch = new School(smallFishGeo(), mat, n, { center: [c.x, c.y, c.z], radius, omega: om, phase: rand(0, 6), spread, scale, colors, rise: 1.2, name: name || 'Silver jacks' });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); if (name) pseudo(name, c, radius + 9);
  };
  swirl(silverMat, Math.round(220 * Math.max(DETAIL, 0.5)), tu(1, 0.06), 14, 4, 0, 5.5, 0.32, 3, 1.6, ['#c9d3d8', '#b5c2c9', '#dfe6e9'], 'Barramundi'.length ? null : null);
  swirl(glowMat, 90, tu(1, 0.86), 10, 3, -1, 4, 0.25, 2.5, 1.5, ['#9fe8ff', '#7fd6ff'], 'Lanternfish');
  swirl(glowMat, 80, tu(2, 0.1), 9, -3, 0, 4, -0.22, 2.5, 1.5, ['#8fe0ff', '#b0f0ff'], 'Lanternfish');
  // sperm whale in the dark blue
  passBy(makeCreature(SPECIES.sperm), tu(1, 0.8), view(tu(1, 0.8), 15, -8, -3), view(tu(1, 0.8), 0.2, 1.1, 0), 'Sperm whale', 40);
  // a siphonophore: a glowing chain of animals
  const N = 70, sm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), wet(new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.4, emissive: new THREE.Color(0.5, 0.15, 0.45), emissiveIntensity: 1.0 }), { caust: false }), N);
  const sg = new THREE.Group(); sg.add(sm); scene.add(sg); sm.frustumCulled = false;
  for (let i = 0; i < N; i++) sm.setColorAt(i, col(i % 7 === 0 ? '#ffb070' : '#ff7ad0'));
  const tS = tu(2, 0.5), mS = pathAt(tS).pos.clone().add(view(tS, 9, 2, 1)), mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), ss = new THREE.Vector3();
  ACTORS.push({ obj: sg, name: 'Siphonophore', range: 16, update(t) {
    sg.position.copy(mS).add(pp.set((t - tS) * 0.15, (t - tS) * 0.05, 0));
    for (let i = 0; i < N; i++) { const u = i / (N - 1), r = (0.09 + 0.09 * Math.pow(Math.sin(i * 0.9), 2)) * (i % 7 === 0 ? 1.6 : 1);
      pp.set((u - 0.5) * 14, Math.sin(u * 6 + t * 0.7) * 1.3, Math.cos(u * 5 + t * 0.55) * 1.3); ss.setScalar(r); mm.compose(pp, qq, ss); sm.setMatrixAt(i, mm); }
    sm.instanceMatrix.needsUpdate = true;
  } });
  // vents: shrimp swarms, and named spots for captions
  const VO = STAGE_ORIGIN(3), vents = groups.vents.userData.vents, fh = groups.vents.userData.floorH;
  const whiteMat = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, emissive: new THREE.Color(0.25, 0.12, 0.05), emissiveIntensity: 1.0, side: THREE.DoubleSide }), { caust: false, bend: { mode: 1, amp: 0.14, speed: 14, wave: 6, len: 0.18 } });
  [0, 3].forEach(k => {
    const v = vents[k], c = new THREE.Vector3(v[0], fh(v[0], v[1]) + 5, v[1]).add(VO);
    const sch = new School(smallFishGeo(), whiteMat, 90, { center: [c.x, c.y, c.z], radius: 2, omega: 0.7, phase: k, spread: 1.2, scale: 0.5, colors: ['#f3ede0', '#ffe9d0'], rise: 1 });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); pseudo('Vent shrimp', c, 14);
  });
  vents.forEach((v, i) => { pseudo('Hydrothermal vent', new THREE.Vector3(v[0], fh(v[0], v[1]) + 5, v[1]).add(VO), 14); if (i < 3) pseudo('Giant tube worms', new THREE.Vector3(v[0] + 2, fh(v[0], v[1]) + 1, v[1] + 2).add(VO), 9); });
  // tiny amphipods swarm in the trench
  { const tt = tu(5, 0.5), c = pathAt(tt).pos.clone().add(view(tt, 7, 2, -1));
    const sch = new School(smallFishGeo(), whiteMat, 70, { center: [c.x, c.y, c.z], radius: 2.5, omega: 0.5, phase: 1, spread: 1.6, scale: 0.4, colors: ['#f5e6dc', '#ffd9c0'], rise: 1 });
    scene.add(sch.mesh); ACTORS.push({ obj: null, update: t => sch.update(t) }); pseudo('Amphipods', c, 12); }
  // the abyss: the imagined wreck and a whale skeleton
  const WO = STAGE_ORIGIN(4);
  pseudo('Shipwreck', new THREE.Vector3(0, groups.wreck.userData.floorH(0, 0) + 8, 0).add(WO), 30);
  pseudo('Whale skeleton', groups.wreck.userData.bones.position.clone().add(new THREE.Vector3(8, 1, 0)).add(WO), 20);
  initPassers({ silverMat, glowMat, whiteMat });
  // real barramundi name for the reef schools
  [[13, -7, 2], [15, -25, 5], [16, -46, -3]].forEach(c => pseudo('Barramundi', new THREE.Vector3(-c[0] + O0.x, c[1], c[2] + O0.z), 12));
}


/* =====================================================================
   9c. CLOSE ENCOUNTERS: touching animals, things that swim past, the mask and hose
   ===================================================================== */
// How big each animal is for touching: len = body length, rad = body thickness, flee = how fast it darts away, k = how quickly it calms down.
const HIT = {
  'Blacktip reef shark': { len: 1.7, rad: 0.3, flee: 2.4, k: 1.3 }, 'Green sea turtle': { len: 0.9, rad: 0.45, flee: 1.4, k: 1.5 }, 'Giant manta ray': { len: 2.5, rad: 1.2, flee: 1.8, k: 1.0 },
  'Whale shark': { len: 7, rad: 1.1, flee: 0.9, k: 0.7 }, 'Great white shark': { len: 3.6, rad: 0.6, flee: 2.0, k: 1.0 }, 'Humpback whale': { len: 10, rad: 1.5, flee: 0.6, k: 0.6 },
  'Sperm whale': { len: 10, rad: 1.5, flee: 0.6, k: 0.6 }, 'Dolphin': { len: 2, rad: 0.35, flee: 3.2, k: 1.2 }, 'Jellyfish': { len: 0, rad: 0.75, flee: 0.9, k: 1.2 },
  'Giant squid': { len: 5, rad: 0.4, flee: 2.6, k: 1.0 }, 'Anglerfish': { len: 0.9, rad: 0.35, flee: 1.4, k: 1.5 }, 'Dumbo octopus': { len: 0.4, rad: 0.25, flee: 1.3, k: 1.5 },
  'Mariana snailfish': { len: 0.3, rad: 0.15, flee: 1.2, k: 1.5 }
};
const touchMsg = { text: '', until: 0 };
let lastHit = 0;
function pop() {   // a tiny bubble sound for a touch (only if the music is on)
  if (!music.on || !music.ctx) return;
  const ctx = music.ctx, st = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(500, st); o.frequency.exponentialRampToValueAtTime(1100, st + 0.08);
  g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.06, st + 0.01); g.gain.exponentialRampToValueAtTime(0.001, st + 0.16);
  o.connect(g); g.connect(music.bus); o.start(st); o.stop(st + 0.2);
}
TOUCH.hit = name => {
  const now = performance.now(); if (now - lastHit < 350) return; lastHit = now;
  swim.jolt = 1; touchMsg.text = 'You touched: ' + name; touchMsg.until = now + 2200;
  if (navigator.vibrate) { try { navigator.vibrate(18); } catch (e) { /* not allowed here */ } }
  pop();
};
const rA = new THREE.Vector3(), rP1 = new THREE.Vector3(), rP2 = new THREE.Vector3(), rN = new THREE.Vector3(), rD = new THREE.Vector3(), rQ = new THREE.Quaternion(), rE = new THREE.Euler(0, 0, 0, 'YZX');
// If the diver touches this animal it darts away from the hand, turns to face where it is going, and slowly calms down.
function reactActor(a, dt) {
  const o = a.obj, h = a.hit, r = a.react || (a.react = { off: new THREE.Vector3(), vel: new THREE.Vector3() }), sc = o.scale.x || 1;
  o.position.add(r.off);
  if (h.len > 0) {
    rA.set(1, 0, 0).applyQuaternion(o.quaternion).multiplyScalar(h.len * 0.5 * sc); rP1.copy(o.position).sub(rA); rP2.copy(o.position).add(rA);
    rD.copy(rP2).sub(rP1); const l2 = rD.lengthSq(), t = l2 > 0 ? clamp(rN.copy(TOUCH.point).sub(rP1).dot(rD) / l2) : 0; rN.copy(rP1).addScaledVector(rD, t);
  } else rN.copy(o.position);
  if (rN.distanceTo(TOUCH.point) < TOUCH.r + h.rad * sc) {
    rD.copy(rN).sub(TOUCH.point); if (rD.lengthSq() < 1e-4) rD.set(rand(-1, 1), 0.2, rand(-1, 1)); rD.y *= 0.5; rD.normalize();
    r.vel.copy(rD).multiplyScalar(h.flee); TOUCH.hit(a.name);
  }
  if (r.vel.lengthSq() > 0.002) {
    r.off.addScaledVector(r.vel, dt); r.vel.multiplyScalar(Math.exp(-dt * h.k));
    const s = r.vel.length();
    if (s > 0.25 && h.len > 0) { rE.set(0, Math.atan2(-r.vel.z, r.vel.x), Math.asin(clamp(r.vel.y / s, -1, 1))); rQ.setFromEuler(rE); o.quaternion.slerp(rQ, clamp(s / h.flee) * 0.85); }
  }
  r.off.multiplyScalar(Math.exp(-dt * 0.03));
}

/* ---- random visitors: animals and schools that swim right past the diver ---- */
const PASSERS = { indiv: [], swarms: [], next: 8, stage: -1, lastT: 0 };
function deactivatePassers() {
  PASSERS.indiv.forEach(a => { a.active = false; a.obj.visible = false; a.react = null; });
  PASSERS.swarms.forEach(a => { a.active = false; a.sch.mesh.visible = false; });
}
function initPassers(M) {
  const V = () => new THREE.Vector3(), D = Math.max(DETAIL, 0.5);
  const small = wet(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide }), { bend: { mode: 1, amp: 0.14, speed: 12, wave: 6, len: 0.18 } });
  const indiv = (si, name, make, speed, count, lim) => {
    for (let i = 0; i < count; i++) {
      const obj = make(); obj.visible = false; scene.add(obj);
      const a = Object.assign({ obj, name, si, speed, active: false, start: V(), vel: V(), t0: 0, life: 0, range: 10, tick: obj.userData.update || null }, lim || {});
      a.update = t => {
        if (!a.active) return;
        if (t - a.t0 > a.life) { a.active = false; obj.visible = false; return; }
        obj.position.copy(a.start).addScaledVector(a.vel, t - a.t0); orient(obj, a.vel.x, a.vel.y, a.vel.z); if (a.tick) a.tick(t);
      };
      ACTORS.push(a); PASSERS.indiv.push(a);
    }
  };
  const swarm = (si, name, geo, mat, n, colors, scale, lim) => {
    const sch = new School(geo, mat, n, { line: { start: V(), vel: V(), t0: 0 }, spread: 2.2, scale, colors, name });
    sch.mesh.visible = false; scene.add(sch.mesh);
    const a = Object.assign({ obj: null, name, si, sch, active: false, life: 0 }, lim || {});
    a.update = t => { if (!a.active) return; sch.update(t); if (t - sch.cfg.line.t0 > a.life) { a.active = false; sch.mesh.visible = false; } };
    ACTORS.push(a); PASSERS.swarms.push(a);
  };
  const orange = ['#ff8a1f', '#ff7a1a', '#ffa030', '#ff6a3d'], teal = ['#7fd6c8', '#5fc9d0', '#a0e0d0'];
  indiv(0, 'Blacktip reef shark', () => makeCreature(SPECIES.blacktip), 1.8, 2);
  indiv(0, 'Green sea turtle', () => makeTurtle(), 0.8, 1);
  indiv(0, 'Giant manta ray', () => makeCreature(SPECIES.manta), 1.6, 1, { minD: 15 });
  indiv(1, 'Whale shark', () => makeCreature(SPECIES.whaleshark), 1.3, 1);
  indiv(1, 'Great white shark', () => makeCreature(SPECIES.greatwhite), 1.8, 1);
  indiv(1, 'Jellyfish', () => { const j = makeJelly(0.85 + rand(-0.05, 0.05), 0.5); j.scale.setScalar(rand(0.5, 1.1)); return j; }, 0.35, 3, { minD: 150 });
  indiv(2, 'Jellyfish', () => { const j = makeJelly(0.5 + rand(-0.05, 0.05), 1.0); j.scale.setScalar(rand(0.5, 1.2)); return j; }, 0.3, 3);
  indiv(2, 'Anglerfish', () => makeCreature(SPECIES.angler), 0.5, 1);
  indiv(4, 'Dumbo octopus', () => makeCreature(SPECIES.dumbo), 0.6, 2);
  indiv(5, 'Mariana snailfish', () => makeCreature(SPECIES.snailfish), 0.5, 3);
  swarm(0, 'Reef fish', smallFishGeo(), small, Math.round(60 * D), orange, 1.0);
  swarm(0, 'Reef fish', smallFishGeo(), small, Math.round(50 * D), teal, 1.0);
  if (barra) { swarm(0, 'Barramundi', barra.geometry.clone(), barra.material, Math.round(26 * D), null, 1.0); swarm(1, 'Barramundi', barra.geometry.clone(), barra.material, Math.round(24 * D), null, 1.0, { maxD: 260 }); }
  swarm(1, 'Silver jacks', smallFishGeo(), M.silverMat, Math.round(70 * D), ['#c9d3d8', '#b5c2c9', '#dfe6e9'], 1.6);
  swarm(2, 'Lanternfish', smallFishGeo(), M.glowMat, Math.round(60 * D), ['#9fe8ff', '#7fd6ff'], 1.5);
  swarm(3, 'Vent shrimp', smallFishGeo(), M.whiteMat, Math.round(60 * D), ['#f3ede0', '#ffe9d0'], 0.5);
  swarm(4, 'Amphipods', smallFishGeo(), M.whiteMat, Math.round(60 * D), ['#f3ede0', '#ffe9d0'], 0.5);
  swarm(5, 'Amphipods', smallFishGeo(), M.whiteMat, Math.round(60 * D), ['#f5e6dc', '#ffd9c0'], 0.4);
}
const spF = new THREE.Vector3(), spR = new THREE.Vector3(), spU = new THREE.Vector3(), spT = new THREE.Vector3(), spV = new THREE.Vector3();
function spawnPasser(p) {
  const ok = a => a.si === p.si && !a.active && (!a.minD || p.D >= a.minD) && (!a.maxD || p.D <= a.maxD);
  const ind = PASSERS.indiv.filter(ok), sw = PASSERS.swarms.filter(ok);
  if (!ind.length && !sw.length) return;
  spF.copy(p.fwd); spR.crossVectors(spF, UP).normalize(); spU.crossVectors(spR, spF).normalize();
  const useSwarm = sw.length && (!ind.length || Math.random() < 0.45), T = useSwarm ? rand(3, 5) : rand(3.5, 6);
  const meet = pathAt(state.t + T).pos;   // where the diver will be when it arrives
  if (useSwarm) {
    const a = sw[Math.floor(Math.random() * sw.length)], sp = rand(1.7, 2.6);
    spT.copy(meet).addScaledVector(spF, rand(0.5, 2)).addScaledVector(spR, rand(-0.7, 0.7)).addScaledVector(spU, rand(-0.5, 0.5));
    if (Math.random() < 0.6) spV.copy(spR).multiplyScalar(Math.random() < 0.5 ? 1 : -1).addScaledVector(spF, rand(-0.3, 0.3)); else spV.copy(spF).negate().addScaledVector(spR, rand(-0.25, 0.25));
    spV.y *= 0.3; spV.normalize().multiplyScalar(sp);
    const L = a.sch.cfg.line; L.vel.copy(spV); L.start.copy(spT).addScaledVector(spV, -T); L.t0 = state.t;
    a.sch.fish.forEach(f => { f.off.set(0, 0, 0); f.vel.set(0, 0, 0); }); a.sch.mesh.visible = true; a.active = true; a.life = T * 2 + 6;
  } else {
    const a = ind[Math.floor(Math.random() * ind.length)];
    spT.copy(meet).addScaledVector(spR, rand(-1.5, 1.5)).addScaledVector(spU, rand(-1, 1)).addScaledVector(spF, rand(0, 2.5));
    spV.copy(spR).multiplyScalar(Math.random() < 0.5 ? 1 : -1).addScaledVector(spF, rand(-0.3, 0.4)).normalize().multiplyScalar(a.speed);
    if (a.name === 'Jellyfish') spV.set(spV.x * 0.5, 0.25, spV.z * 0.5);
    a.vel.copy(spV); a.start.copy(spT).addScaledVector(spV, -T); a.t0 = state.t; a.life = T * 2 + 3; a.react = null; a.active = true; a.obj.visible = true;
  }
}
function runPassers(p) {
  if (!state.started) return;
  if (state.t < PASSERS.lastT - 1) { deactivatePassers(); PASSERS.stage = -1; }   // the dive started over
  PASSERS.lastT = state.t;
  if (PASSERS.stage !== p.si) { deactivatePassers(); PASSERS.stage = p.si; PASSERS.next = state.t + 3; }
  if (state.playing && state.t >= PASSERS.next) { spawnPasser(p); PASSERS.next = state.t + rand(5, 11); }
}

/* ---- the diver's mask and the air hose (drawn on top of the picture) ---- */
const maskC = $('mask'), hoseC = $('hose');
let maskW = 0, maskH = 0, hoseAcc = 0;
function layoutMask() {
  const W = window.innerWidth, H = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 2);
  maskW = W; maskH = H; maskC.width = Math.round(W * dpr); maskC.height = Math.round(H * dpr); hoseC.width = Math.round(W * 0.75); hoseC.height = Math.round(H * 0.75);
  const g = maskC.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
  const mx = Math.max(8, W * 0.03), mt = Math.max(10, H * 0.05), mb = Math.max(8, H * 0.045), r = Math.min(W, H) * 0.17, L = mx, R = W - mx, T = mt, B = H - mb;
  const nw = Math.min(W * 0.2, 170), nh = Math.min(H * 0.1, 84);
  const win = new Path2D();
  win.moveTo(L + r, T); win.lineTo(R - r, T); win.quadraticCurveTo(R, T, R, T + r); win.lineTo(R, B - r); win.quadraticCurveTo(R, B, R - r, B);
  win.lineTo(W / 2 + nw * 0.95, B); win.bezierCurveTo(W / 2 + nw * 0.55, B, W / 2 + nw * 0.5, B - nh, W / 2, B - nh); win.bezierCurveTo(W / 2 - nw * 0.5, B - nh, W / 2 - nw * 0.55, B, W / 2 - nw * 0.95, B);
  win.lineTo(L + r, B); win.quadraticCurveTo(L, B, L, B - r); win.lineTo(L, T + r); win.quadraticCurveTo(L, T, L + r, T); win.closePath();
  const outer = new Path2D(); outer.rect(0, 0, W, H); outer.addPath(win);
  const rub = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75); rub.addColorStop(0, '#0b0f13'); rub.addColorStop(1, '#010203');
  g.fillStyle = rub; g.fill(outer, 'evenodd');
  g.save(); g.clip(win); g.lineWidth = 16; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.stroke(win);
  const sheen = g.createLinearGradient(0, 0, W, H); sheen.addColorStop(0, 'rgba(255,255,255,0.075)'); sheen.addColorStop(0.28, 'rgba(255,255,255,0)'); sheen.addColorStop(1, 'rgba(120,200,255,0.03)');
  g.fillStyle = sheen; g.fillRect(0, 0, W, H); g.restore();
  g.lineWidth = 2; g.strokeStyle = 'rgba(130,150,165,0.28)'; g.stroke(win);
  drawHose(0, true);
}
// The air hose comes over the shoulder to the regulator at your mouth, and moves a little as you breathe.
const hosePt = (p0, p1, p2, p3, t, out) => { const u = 1 - t; out.x = u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x; out.y = u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y; return out; };
const hp = { x: 0, y: 0 }, hq = { x: 0, y: 0 };
function drawHose(dt, force) {
  if (!force) { hoseAcc += dt; if (hoseAcc < 1 / 30) return; hoseAcc = 0; }
  const g = hoseC.getContext('2d'), W = hoseC.width, H = hoseC.height, s = Math.min(W, H) / 620, now = performance.now(), calm = REDUCED ? 0 : 1;
  g.clearRect(0, 0, W, H);
  const portrait = H > W, sw = calm * Math.sin(now * 0.0011) * 7 * s, br = calm * (exhaleLeft > 0 ? Math.sin(now * 0.035) * 2.5 * s : 0);
  const p0 = { x: W + 30 * s, y: H * (portrait ? 0.6 : 0.5) }, p1 = { x: W * 0.92 + sw, y: H * (portrait ? 0.48 : 0.4) + sw }, p2 = { x: W * (portrait ? 0.9 : 0.8) - sw, y: H * 0.97 }, p3 = { x: W * (portrait ? 0.64 : 0.58) + br, y: H + 26 * s };
  const path = new Path2D(); path.moveTo(p0.x, p0.y); path.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
  g.lineCap = 'round'; g.strokeStyle = '#0d1014'; g.lineWidth = 30 * s; g.stroke(path);
  g.strokeStyle = '#1b2026'; g.lineWidth = 22 * s; g.stroke(path);
  for (let k = 0; k <= 70; k++) {   // ribs
    const t = k / 70; hosePt(p0, p1, p2, p3, t, hp); hosePt(p0, p1, p2, p3, Math.min(1, t + 0.01), hq);
    let dx = hq.x - hp.x, dy = hq.y - hp.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    g.beginPath(); g.moveTo(hp.x - dy * 11 * s, hp.y + dx * 11 * s); g.lineTo(hp.x + dy * 11 * s, hp.y - dx * 11 * s);
    g.strokeStyle = k % 2 ? 'rgba(0,0,0,0.55)' : 'rgba(150,170,185,0.10)'; g.lineWidth = 2.4 * s; g.stroke();
  }
  g.save(); g.translate(-5 * s, -5 * s); g.strokeStyle = 'rgba(120,140,155,0.25)'; g.lineWidth = 3 * s; g.stroke(path); g.restore();
  // the regulator (mouthpiece part)
  g.save(); g.translate(p3.x, H - 6 * s); g.rotate(-0.15);
  g.fillStyle = '#12161a'; g.beginPath(); g.ellipse(0, 0, 58 * s, 40 * s, 0, 0, TAU); g.fill();
  g.strokeStyle = '#2a323a'; g.lineWidth = 4 * s; g.stroke();
  g.fillStyle = '#c9a800'; g.beginPath(); g.arc(-8 * s, -6 * s, 10 * s, 0, TAU); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.10)'; g.beginPath(); g.ellipse(-20 * s, -22 * s, 22 * s, 7 * s, -0.5, 0, TAU); g.fill();
  g.restore();
}

/* =====================================================================
   9. THE DIVER'S VIEW: bubbles, looking around, camera
   ===================================================================== */
const bubbleTex = canvasTexture(64, 64, c => {
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.beginPath(); c.arc(32, 32, 26, 0, TAU); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.arc(32, 32, 26, 0, TAU); c.fill();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(22, 22, 5, 0, TAU); c.fill();
});
const NB = 70, bubblePos = new Float32Array(NB * 3), bubbleSize = new Float32Array(NB), bubbleLife = new Float32Array(NB).fill(-1), bubbleVel = new Float32Array(NB);
const bubbleGeo = new THREE.BufferGeometry(); bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3)); bubbleGeo.setAttribute('aSize', new THREE.BufferAttribute(bubbleSize, 1));
const bubbles = new THREE.Points(bubbleGeo, new THREE.ShaderMaterial({
  uniforms: { uTex: { value: bubbleTex }, uPix: { value: pixelRatio } }, transparent: true, depthWrite: false, fog: false,
  vertexShader: 'attribute float aSize; uniform float uPix; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aSize * uPix * (300.0 / max(-mv.z, 0.2)); }',
  fragmentShader: `uniform sampler2D uTex; void main(){ vec4 c = texture2D(uTex, gl_PointCoord); gl_FragColor = vec4(c.rgb, c.a * 0.8);
    #include <encodings_fragment>
  }`
}));
bubbles.frustumCulled = false; bubbles.renderOrder = 12; scene.add(bubbles);
let nextBreath = 2.5, exhaleLeft = 0, bubbleIdx = 0;
function updateBubbles(dt) {
  if (!REDUCED) {
    nextBreath -= dt;
    if (nextBreath <= 0) { exhaleLeft = 1.5; nextBreath = 5.2; }
    if (exhaleLeft > 0) {
      exhaleLeft -= dt;
      for (let k = 0; k < 2; k++) {
        const i = bubbleIdx++ % NB; tmpV.set(rand(-0.03, 0.03), -0.2 + rand(-0.02, 0.02), -0.5).applyMatrix4(camera.matrixWorld);
        bubblePos.set([tmpV.x, tmpV.y, tmpV.z], i * 3); bubbleSize[i] = rand(0.012, 0.05); bubbleLife[i] = 0; bubbleVel[i] = rand(0.5, 1.0);
      }
    }
  }
  for (let i = 0; i < NB; i++) {
    if (bubbleLife[i] < 0) { bubbleSize[i] = 0; continue; }
    bubbleLife[i] += dt; bubblePos[i * 3 + 1] += bubbleVel[i] * dt; bubblePos[i * 3] += Math.sin(bubbleLife[i] * 5 + i) * 0.1 * dt;
    if (bubbleLife[i] > 6) bubbleLife[i] = -1;
  }
  bubbleGeo.attributes.position.needsUpdate = true; bubbleGeo.attributes.aSize.needsUpdate = true;
}

const look = { yaw: 0, pitch: 0, drag: false, lx: 0, ly: 0 };   // your own turning, on top of the dive path. No limits: you can look all the way around.
const swim = { off: new THREE.Vector3(), hold: false, zoom: 1, zoomTarget: 1, jolt: 0, keys: {} };
const pointers = new Map(); let holdTimer = 0, pinchDist = 0, downX = 0, downY = 0;
canvas.addEventListener('pointerdown', e => {
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY }); canvas.setPointerCapture(e.pointerId);
  if (pointers.size === 1) {
    look.drag = true; look.lx = e.clientX; look.ly = e.clientY; downX = e.clientX; downY = e.clientY; canvas.classList.add('drag');
    clearTimeout(holdTimer); holdTimer = setTimeout(() => { if (pointers.size === 1) swim.hold = true; }, 380);   // press and hold to swim ahead
  } else if (pointers.size === 2) {
    look.drag = false; clearTimeout(holdTimer); swim.hold = false; const [a, b] = [...pointers.values()]; pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
  }
});
canvas.addEventListener('pointermove', e => {
  if (!pointers.has(e.pointerId)) return;
  pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()], d = Math.hypot(a.x - b.x, a.y - b.y);
    if (pinchDist > 0) swim.zoomTarget = clamp(swim.zoomTarget * d / pinchDist, 1, 2.5); pinchDist = d; return;
  }
  if (!look.drag) return;
  if (Math.hypot(e.clientX - downX, e.clientY - downY) > 12) clearTimeout(holdTimer);
  look.yaw += (e.clientX - look.lx) * 0.005; look.pitch += (e.clientY - look.ly) * 0.004;
  look.lx = e.clientX; look.ly = e.clientY;
});
const endDrag = e => {
  pointers.delete(e.pointerId); clearTimeout(holdTimer); swim.hold = false; pinchDist = 0;
  if (pointers.size === 0) { look.drag = false; canvas.classList.remove('drag'); }
  else if (pointers.size === 1) { const [a] = [...pointers.values()]; look.drag = true; look.lx = a.x; look.ly = a.y; }
};
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
canvas.addEventListener('wheel', e => { e.preventDefault(); swim.zoomTarget = clamp(swim.zoomTarget * Math.exp(-e.deltaY * 0.0015), 1, 2.5); }, { passive: false });
canvas.addEventListener('dblclick', () => recenter());
document.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k === 'w' || k === 's' || k === 'a' || k === 'd') swim.keys[k] = true;
  if (e.key === 'ArrowLeft') look.yaw += 0.12;
  if (e.key === 'ArrowRight') look.yaw -= 0.12;
  if (e.key === 'ArrowUp') look.pitch += 0.1;
  if (e.key === 'ArrowDown') look.pitch -= 0.1;
  if (e.key === ' ' && state.started && document.activeElement === document.body) { e.preventDefault(); togglePause(); }
});
document.addEventListener('keyup', e => { const k = e.key.toLowerCase(); if (swim.keys[k]) swim.keys[k] = false; });
window.addEventListener('blur', () => { swim.keys = {}; swim.hold = false; });
function recenter() { look.yaw = 0; look.pitch = 0; gyro.ref = null; }
function cycleZoom() { const t = swim.zoomTarget; swim.zoomTarget = t < 1.3 ? 1.6 : t < 2 ? 2.4 : 1; }

// Turning your phone turns the diver's head (optional, needs a button press).
const gyro = { on: false, ref: null, q: new THREE.Quaternion(), raw: new THREE.Quaternion() };
const zee = new THREE.Vector3(0, 0, 1), qFlip = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)), qScr = new THREE.Quaternion(), eG = new THREE.Euler();
function onOrient(e) {
  if (e.alpha == null || e.beta == null || e.gamma == null) return;
  const d = THREE.MathUtils.degToRad, scr = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
  eG.set(d(e.beta), d(e.alpha), -d(e.gamma), 'YXZ');
  gyro.raw.setFromEuler(eG).multiply(qFlip).multiply(qScr.setFromAxisAngle(zee, -d(scr)));
  if (!gyro.ref) gyro.ref = gyro.raw.clone().invert();
  gyro.q.copy(gyro.ref).multiply(gyro.raw);
}
async function toggleMotion() {
  const b = $('btnMotion');
  if (gyro.on) { window.removeEventListener('deviceorientation', onOrient); gyro.on = false; gyro.q.identity(); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Motion look: off'; return; }
  try {
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') { if ((await DeviceOrientationEvent.requestPermission()) !== 'granted') return; }
  } catch (err) { return; }
  gyro.ref = null; window.addEventListener('deviceorientation', onOrient); gyro.on = true; b.setAttribute('aria-pressed', 'true'); b.textContent = 'Motion look: on';
}

const qBase = new THREE.Quaternion(), qDrag = new THREE.Quaternion(), qRoll = new THREE.Quaternion(), qJolt = new THREE.Quaternion(), eD = new THREE.Euler(0, 0, 0, 'YXZ'), lookM = new THREE.Matrix4(), ZERO = new THREE.Vector3();
const swimDir = new THREE.Vector3(), swimRight = new THREE.Vector3(), swimPos = new THREE.Vector3(), swimLocal = new THREE.Vector3();

// Keeps the diver out of rock, sand, chimneys and the wreck.
function constrain(pos, si) {
  if (si <= 2) {
    pos.y = Math.min(pos.y, -0.8);
    const B = groups.reef && groups.reef.userData.bins;
    if (B && pos.y > -200 && Math.abs(pos.z) < 66) {
      const iz = clamp(Math.floor((pos.z + 65) / 2), 0, 65);
      if (pos.y < -9.2) {
        const iy = clamp(Math.floor(-pos.y / 2), 0, 99); let m = -1e9;
        for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) m = Math.max(m, B.wallMax[clamp(iy + dy, 0, 99) * 66 + clamp(iz + dz, 0, 65)]);
        if (m > -1e8) pos.x = Math.max(pos.x, m + (pos.y > -62 ? 3.0 : 2.0));
      }
      if (pos.x < -24) {
        const bx = clamp(Math.floor(-pos.x / 2), 0, 59); let m = -1e9;
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) m = Math.max(m, B.shelfTop[clamp(bx + dx, 0, 59) * 66 + clamp(iz + dz, 0, 65)]);
        if (m > -1e8) pos.y = Math.max(pos.y, m + 1.6);
      }
    }
  } else if (si === 3) {
    const g = groups.vents, O = STAGE_ORIGIN(3), lx = pos.x - O.x, lz = pos.z - O.z;
    pos.y = Math.max(pos.y, g.userData.floorH(lx, lz) + 1.5);
    g.userData.vents.forEach((v, i) => {
      const dx = lx - v[0], dz = lz - v[1], d = Math.hypot(dx, dz), R = 3.8, top = g.userData.floorH(v[0], v[1]) + g.userData.ventH[i] + 1.2;
      if (d < R && pos.y < top) { const k = d > 0.01 ? R / d : 1; pos.x = O.x + v[0] + (d > 0.01 ? dx * k : R); pos.z = O.z + v[1] + (d > 0.01 ? dz * k : 0); }
    });
  } else if (si === 4) {
    const g = groups.wreck, O = STAGE_ORIGIN(4);
    pos.y = Math.max(pos.y, g.userData.floorH(pos.x - O.x, pos.z - O.z) + 1.5);
    const ship = g.userData.ship; ship.updateWorldMatrix(true, false); swimLocal.copy(pos); ship.worldToLocal(swimLocal);
    const hx = 25, hz = 10, yTop = 16, yBot = -8;
    if (Math.abs(swimLocal.x) < hx && Math.abs(swimLocal.z) < hz && swimLocal.y > yBot && swimLocal.y < yTop) {
      const px = hx - Math.abs(swimLocal.x), pz = hz - Math.abs(swimLocal.z), pt = yTop - swimLocal.y, pb = swimLocal.y - yBot, m = Math.min(px, pz, pt, pb);
      if (m === pz) swimLocal.z = Math.sign(swimLocal.z || 1) * hz; else if (m === px) swimLocal.x = Math.sign(swimLocal.x || 1) * hx; else if (m === pt) swimLocal.y = yTop; else swimLocal.y = yBot;
      pos.copy(ship.localToWorld(swimLocal));
    }
  } else {
    const g = groups.trench, O = STAGE_ORIGIN(5);
    pos.x = O.x + clamp(pos.x - O.x, -10.5, 10.5); pos.y = Math.max(pos.y, g.userData.floorY + 3);
  }
}

// Swimming toward what you look at (held press or W/S/A/D), limited by how far you can see. Zoom is limited the same way.
function updateSwim(dt, p) {
  const vis = 1 / Math.max(U.absorb.value.z, 0.012);            // how far you can see, roughly, in metres
  const leash = clamp(vis * 0.45, 3, 12), zoomCap = clamp(vis / 20, 1.2, 2.5);
  swim.zoomTarget = clamp(swim.zoomTarget, 1, zoomCap);
  const z0 = swim.zoom; swim.zoom += (swim.zoomTarget - swim.zoom) * (1 - Math.exp(-dt * 7));
  if (Math.abs(swim.zoom - z0) > 0.0005) { applyFov(); const lab = 'Zoom: ' + swim.zoomTarget.toFixed(1) + 'x'; if ($('btnZoom').textContent !== lab) $('btnZoom').textContent = lab; }
  swimDir.set(0, 0, 0);
  const fwd = p.fwd; swimRight.crossVectors(fwd, UP).normalize();
  camera.getWorldDirection(swimPos);   // the way you are looking right now
  const K = swim.keys;
  if (swim.hold || K.w) swimDir.add(swimPos);
  if (K.s) swimDir.sub(swimPos);
  camera.updateMatrixWorld(); swimLocal.set(1, 0, 0).transformDirection(camera.matrixWorld);
  if (K.d) swimDir.add(swimLocal); if (K.a) swimDir.sub(swimLocal);
  if (swimDir.lengthSq() > 0) { swimDir.normalize(); swim.off.addScaledVector(swimDir, 2.4 * dt); }
  else swim.off.multiplyScalar(Math.exp(-dt * 0.07));            // slowly drift back toward the dive path
  if (swim.off.length() > leash) swim.off.setLength(leash);
  swimPos.copy(p.pos).add(swim.off); constrain(swimPos, p.si);
  swim.off.copy(swimPos).sub(p.pos);
  return swimPos;
}

function updateCamera(dt) {
  const p = pathAt(state.t);
  const basePitch = Math.asin(clamp(p.fwd.y, -1, 1));
  look.pitch = clamp(look.pitch, -1.55 - basePitch, 1.55 - basePitch);
  lookM.lookAt(ZERO, p.fwd, UP); qBase.setFromRotationMatrix(lookM);
  eD.set(look.pitch, look.yaw, 0); qDrag.setFromEuler(eD);
  camera.quaternion.copy(qBase).multiply(qDrag);
  if (gyro.on) camera.quaternion.multiply(gyro.q);
  if (!REDUCED) { qRoll.setFromAxisAngle(zee, 0.025 * Math.sin(state.t * 0.9)); camera.quaternion.multiply(qRoll); }
  if (swim.jolt > 0) { swim.jolt = Math.max(0, swim.jolt - dt * 3); eD.set(rand(-1, 1) * 0.03 * swim.jolt, rand(-1, 1) * 0.03 * swim.jolt, 0, 'XYZ'); qJolt.setFromEuler(eD); camera.quaternion.multiply(qJolt); eD.order = 'YXZ'; }
  camera.updateMatrixWorld();
  const pos = updateSwim(dt, p);
  camera.position.copy(pos); if (!REDUCED) camera.position.y += 0.07 * Math.sin(state.t * 1.7);
  camera.updateMatrixWorld();
  state.D = p.D; state.stage = p.si;
  return p;
}

/* =====================================================================
   10. SOUND: the whole soundtrack is made live from simple tones
   ===================================================================== */
const music = { ctx: null, master: null, bus: null, on: false, timers: [], pads: [], chord: 0, noise: null };
const CHORDS = [[220, 261.63, 329.63], [174.61, 220, 261.63], [196, 246.94, 293.66], [220, 277.18, 329.63]];
function wobble(ctx, param, rate, depth) { const l = ctx.createOscillator(), g = ctx.createGain(); l.frequency.value = rate; g.gain.value = depth * param.value; l.connect(g); g.connect(param); l.start(); }
function buildMusic() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0;
  const comp = ctx.createDynamicsCompressor(); master.connect(comp); comp.connect(ctx.destination);
  const bus = ctx.createGain(), dry = ctx.createGain(), wet = ctx.createGain(), rev = ctx.createConvolver();
  const len = Math.floor(ctx.sampleRate * 3.5), buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
  rev.buffer = buf; dry.gain.value = 0.8; wet.gain.value = 0.55;
  bus.connect(dry); dry.connect(master); bus.connect(rev); rev.connect(wet); wet.connect(master);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 170;
  const dg = ctx.createGain(); dg.gain.value = 0.35; lp.connect(dg); dg.connect(bus);
  [[55, 'sine', 0, 0.8], [55.3, 'triangle', 0, 0.5], [82.4, 'sine', -5, 0.6]].forEach(([f, type, det, vol]) => {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; g.gain.value = vol; o.connect(g); g.connect(lp); o.start();
  });
  wobble(ctx, dg.gain, 0.05, 0.1);
  const plp = ctx.createBiquadFilter(); plp.type = 'lowpass'; plp.frequency.value = 420;
  const pg = ctx.createGain(); pg.gain.value = 0.13; plp.connect(pg); pg.connect(bus);
  music.pads = CHORDS[0].map((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = 'sine'; o.frequency.value = f; o.detune.value = (i - 1) * 7; g.gain.value = 0.33; o.connect(g); g.connect(plp); o.start(); wobble(ctx, g.gain, 0.03 + i * 0.017, 0.25); return o; });
  const nb = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), nd = nb.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  music.noise = nb;
  Object.assign(music, { ctx, master, bus });
}
const later = (fn, ms) => music.timers.push(setTimeout(fn, ms));
const clearTimers = () => { music.timers.forEach(clearTimeout); music.timers = []; };
function bubbleBlip() {
  if (!music.on) return;
  const ctx = music.ctx, t0 = ctx.currentTime, n = 1 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const st = t0 + i * 0.09 + Math.random() * 0.04, o = ctx.createOscillator(), g = ctx.createGain(), f = 350 + Math.random() * 700;
    o.type = 'sine'; o.frequency.setValueAtTime(f, st); o.frequency.exponentialRampToValueAtTime(f * 2.1, st + 0.07);
    g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.05, st + 0.008); g.gain.exponentialRampToValueAtTime(0.0008, st + 0.13);
    o.connect(g); g.connect(music.bus); o.start(st); o.stop(st + 0.15);
  }
  later(bubbleBlip, 900 + Math.random() * 3200);
}
function breathe() {   // the diver's regulator: a soft breath in, then a breath out with bubbles
  if (!music.on) return;
  const ctx = music.ctx, t0 = ctx.currentTime;
  const noise = (start, dur, f0, f1, vol) => {
    const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = music.noise; s.loop = true; bp.type = 'bandpass'; bp.Q.value = 1.2;
    bp.frequency.setValueAtTime(f0, start); bp.frequency.linearRampToValueAtTime(f1, start + dur);
    g.gain.setValueAtTime(0, start); g.gain.linearRampToValueAtTime(vol, start + dur * 0.3); g.gain.linearRampToValueAtTime(0, start + dur);
    s.connect(bp); bp.connect(g); g.connect(music.bus); s.start(start); s.stop(start + dur + 0.05);
  };
  noise(t0, 1.1, 700, 1500, 0.05); noise(t0 + 1.6, 1.5, 1600, 900, 0.035);
  later(breathe, 5200);
}
function whaleGlide() {
  if (!music.on) return;
  const ctx = music.ctx, st = ctx.currentTime, o = ctx.createOscillator(), o2 = ctx.createOscillator(), vib = ctx.createOscillator(), vg = ctx.createGain(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), g2 = ctx.createGain();
  o.type = 'sine'; o2.type = 'sine'; lp.type = 'lowpass'; lp.frequency.value = 900;
  o.frequency.setValueAtTime(200, st); o.frequency.linearRampToValueAtTime(420, st + 2.5); o.frequency.linearRampToValueAtTime(170, st + 7);
  o2.frequency.setValueAtTime(400, st); o2.frequency.linearRampToValueAtTime(840, st + 2.5); o2.frequency.linearRampToValueAtTime(340, st + 7);
  vib.frequency.value = 5.5; vg.gain.value = 4; vib.connect(vg); vg.connect(o.frequency);
  g2.gain.value = 0.25; g.gain.setValueAtTime(0, st); g.gain.linearRampToValueAtTime(0.08, st + 2); g.gain.linearRampToValueAtTime(0.08, st + 4); g.gain.linearRampToValueAtTime(0, st + 7.5);
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(music.bus);
  [o, o2, vib].forEach(x => { x.start(st); x.stop(st + 8); });
  later(whaleGlide, 22000 + Math.random() * 25000);
}
function chordShift() { if (!music.on) return; music.chord = (music.chord + 1) % CHORDS.length; music.pads.forEach((o, i) => o.frequency.setTargetAtTime(CHORDS[music.chord][i], music.ctx.currentTime, 4)); later(chordShift, 24000); }
function scheduleMusic() { later(bubbleBlip, 1200); later(breathe, 800); later(whaleGlide, 6000); later(chordShift, 22000); }
async function musicOn() {
  if (!music.ctx) buildMusic();
  try { await music.ctx.resume(); } catch (e) { /* the browser refused; the button stays off */ }
  music.on = true; clearTimers();
  const t0 = music.ctx.currentTime, g = music.master.gain;
  g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0); g.linearRampToValueAtTime(SETTINGS.musicVolume, t0 + 3);
  scheduleMusic();
}
function musicOff() {
  music.on = false; clearTimers();
  const t0 = music.ctx.currentTime, g = music.master.gain;
  g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0); g.linearRampToValueAtTime(0, t0 + 1.5);
  later(() => { if (!music.on) music.ctx.suspend(); }, 1700);
}
function toggleMusic() {
  const b = $('btnMusic');
  if (music.on) { musicOff(); b.setAttribute('aria-pressed', 'false'); b.textContent = 'Music: off'; }
  else { musicOn(); b.setAttribute('aria-pressed', 'true'); b.textContent = 'Music: on'; }
}
document.addEventListener('visibilitychange', () => {
  if (!music.ctx || !music.on) return;
  if (document.hidden) { clearTimers(); music.ctx.suspend(); } else { music.ctx.resume(); scheduleMusic(); }
});

/* =====================================================================
   11. THE MAIN LOOP AND BUTTONS
   ===================================================================== */
const ZONE_NAMES = { reef: D => (D < 5 ? 'Sunlit surface' : 'Coral reef'), blue: D => (D < 200 ? 'Open ocean' : 'Twilight zone'), mid: () => 'Midnight zone', vents: () => 'Hydrothermal vents', wreck: () => 'The abyss', trench: () => 'Hadal zone: the deep trench' };
const FACTS = {
  'Green sea turtle': 'Green sea turtles can rest underwater for several hours on one breath.',
  'Blacktip reef shark': 'Blacktip reef sharks grow to about 1.6 m and are usually shy of divers.',
  'Reef fish': 'Reef fish move in groups because there is safety in numbers.',
  'Silver jacks': 'Jacks swim in fast, tight groups that confuse the fish hunting them.',
  'Barramundi': 'Barramundi are born male and many turn female later in life. This fish is a real 3D model.',
  'Giant manta ray': 'A giant manta can have a wingspan of about 7 m.',
  'Whale shark': 'The biggest fish in the sea, up to about 12 m long. It eats tiny plankton.',
  'Great white shark': 'Great whites can grow longer than 5 m.',
  'Humpback whale': 'Male humpbacks sing long songs that can last many minutes.',
  'Sperm whale': 'Sperm whales dive deep to hunt squid.',
  'Dolphin': 'Dolphins find their way and their food with sound clicks.',
  'Jellyfish': 'Jellyfish have no brain, no heart and no bones.',
  'Lanternfish': 'Lanternfish have small light-making organs along their bodies.',
  'Siphonophore': 'A siphonophore looks like one animal but is a chain of many tiny linked animals.',
  'Giant squid': 'A giant squid has the biggest eyes of any animal, about the size of a dinner plate.',
  'Anglerfish': 'The glowing lure of an anglerfish is lit by bacteria that live in it.',
  'Hydrothermal vent': 'Vent water can be hotter than 300 degrees C, but the deep pressure keeps it from boiling.',
  'Giant tube worms': 'Adult tube worms have no mouth or gut. Bacteria inside them make their food.',
  'Vent shrimp': 'Vent shrimp swarm around hot vents and feed on the bacteria there.',
  'Whale skeleton': 'When a whale dies and sinks, its body can feed deep-sea life for many years.',
  'Shipwreck': 'This ship is imagined. I built it from simple shapes.',
  'Dumbo octopus': 'Dumbo octopuses live deep on the seafloor and flap ear-like fins to swim.',
  'Amphipods': 'Amphipods are small shrimp-like animals found even in the deepest trenches.',
  'Mariana snailfish': 'Snailfish live in the Mariana Trench, at depths of about 8,000 m.'
};
let hud = '', capName = '', frames = 0, slow = 0, last = performance.now();
function updateHud(D, si) {
  const shown = D < 100 ? Math.round(D) : Math.round(D / 5) * 5;
  $('depthNumber').textContent = shown.toLocaleString('en');
  const z = ZONE_NAMES[STAGES[si].id](D);
  if (z !== hud) { $('zoneName').textContent = z; hud = z; }
  let best = null, bd = 1e9;
  ACTORS.forEach(a => { if (!a.name || !a.obj) return; const d = a.obj.position.distanceTo(camera.position); if (d < a.range && d < bd) { bd = d; best = a.name; } });
  const touching = performance.now() < touchMsg.until, want = touching ? touchMsg.text : (best ? 'Nearby: ' + best : '');
  if (want !== capName) { capName = want; $('caption').textContent = want; $('fact').textContent = touching ? '' : (best ? (FACTS[best] || '') : ''); }
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (window.__hold) { requestAnimationFrame(frame); return; }   // used only by my test script
  step(dt);
  requestAnimationFrame(frame);
}
function step(dt) {
  FRAME_DT = dt; U.time.value += dt;
  if (state.playing) { state.t += dt; if (state.t >= TOTAL) state.t = 0; }
  const p = updateCamera(dt);
  camera.getWorldDirection(tmpV); TOUCH.point.copy(camera.position).addScaledVector(tmpV, 0.3);
  applyEnvironment(p.D);
  runPassers(p);
  dome.position.copy(camera.position); surface.position.set(camera.position.x, 0, camera.position.z); rayGroup.position.set(camera.position.x, 0, camera.position.z);
  // the sun's shafts and surface belong to the reef water only
  const inReefWater = p.si <= 1;
  surface.visible = surface.visible && inReefWater; rayGroup.visible = rayGroup.visible && inReefWater;
  snow.material.uniforms.uCam.value.copy(camera.position); glowSpecks.material.uniforms.uCam.value.copy(camera.position);
  for (let i = 0; i < ACTORS.length; i++) {
    const a = ACTORS[i];
    if (a.obj) { const far = a.obj.position.distanceToSquared(camera.position) > 90000; a.obj.visible = !far && a.active !== false; if (far || a.active === false) continue; }
    a.update(state.t);
    if (a.obj) { if (a.hit === undefined) a.hit = HIT[a.name] || null; if (a.hit) reactActor(a, dt); }
  }
  // jellyfish light follows the water
  updateBubbles(dt); drawHose(dt);
  // fade to black between the places that are far apart
  let f = 0;
  const S = STAGES[p.si];
  if (p.si >= 2 && p.si <= 5) { f = Math.max(f, 1 - (state.t - S.t0) / 1.4); }
  if (p.si >= 2 && p.si <= 4) { f = Math.max(f, 1 - (S.t0 + S.dur - state.t) / 1.4); }
  if (p.si === 5) f = Math.max(f, 1 - (TOTAL - state.t) / 1.6);
  if (state.t < 1.6) f = Math.max(f, 1 - state.t / 1.6);
  $('fade').style.opacity = clamp(f);
  updateHud(p.D, p.si);
  renderer.render(scene, camera);
  // if the picture is slow, draw fewer pixels
  frames++; if (dt > 0.034) slow++;
  if (frames >= 90) { if (slow > 55 && pixelRatio > 0.65) { pixelRatio = Math.max(0.65, pixelRatio * 0.8); renderer.setPixelRatio(pixelRatio); resize(); } frames = 0; slow = 0; }
}
let baseFov = 74;
function applyFov() { camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(baseFov) / 2) / swim.zoom)); camera.updateProjectionMatrix(); }
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; baseFov = w / h < 0.8 ? 84 : 74; applyFov(); layoutMask();
}
function togglePause() {
  state.playing = !state.playing; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
}
function restart() { state.t = 0; recenter(); swim.off.set(0, 0, 0); swim.zoomTarget = 1; PASSERS.lastT = 0; deactivatePassers(); if (!state.playing) togglePause(); }


/* =====================================================================
   11b. CONTROLS ON PHONES AND TABLETS, THE BLOG, THE CREDITS
   ===================================================================== */
const compactQuery = window.matchMedia('(pointer: coarse), (max-width: 900px)');
function layoutControls() {
  const compact = compactQuery.matches;
  if (compact) { $('sheetBody').append($('controls')); $('btnMenu').hidden = false; }
  else { $('bar').append($('controls')); $('btnMenu').hidden = true; closeSheet(); }
}
function openSheet() { $('sheet').hidden = false; $('sheetBackdrop').hidden = false; $('btnMenu').setAttribute('aria-expanded', 'true'); $('btnPause').focus(); }
function closeSheet() { $('sheet').hidden = true; $('sheetBackdrop').hidden = true; $('btnMenu').setAttribute('aria-expanded', 'false'); }
const journal = { wasPlaying: false };
function openJournal() {
  journal.wasPlaying = state.playing; if (state.playing) togglePause();
  $('journal').hidden = false; $('journal').scrollTop = 0; $('btnCloseJournal').focus();
}
function closeJournal() { $('journal').hidden = true; if (journal.wasPlaying && !state.playing) togglePause(); if (!$('btnMenu').hidden) $('btnMenu').focus(); else $('btnBlog').focus(); }
function openCredits() { $('credits').hidden = false; $('btnCloseCredits').focus(); }
function wirePanels() {
  $('btnMenu').addEventListener('click', () => ($('sheet').hidden ? openSheet() : closeSheet()));
  $('sheetBackdrop').addEventListener('click', closeSheet);
  compactQuery.addEventListener('change', layoutControls);
  $('controls').addEventListener('click', e => {
    const b = e.target.closest('button'); if (b && ['btnRecenter', 'btnRestart', 'btnBlog', 'btnCredits'].includes(b.id)) closeSheet();
  });
  $('btnBlog').addEventListener('click', openJournal); $('linkBlog').addEventListener('click', e => { e.preventDefault(); openJournal(); });
  $('btnCloseJournal').addEventListener('click', closeJournal);
  $('btnCredits').addEventListener('click', openCredits); $('linkCredits').addEventListener('click', e => { e.preventDefault(); openCredits(); });
  $('btnCloseCredits').addEventListener('click', () => { $('credits').hidden = true; });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (!$('credits').hidden) $('credits').hidden = true; else if (!$('journal').hidden) closeJournal(); else if (!$('sheet').hidden) closeSheet();
  });
}
let activeTopic = 'All';
function buildJournal() {
  const filters = $('filters'); filters.textContent = '';
  ['All', ...TOPICS].forEach(name => {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.textContent = name; b.setAttribute('aria-pressed', String(name === activeTopic));
    b.addEventListener('click', () => { activeTopic = name; filters.querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b))); drawCards(); });
    filters.append(b);
  });
  drawCards();
}
function drawCards() {
  const box = $('cards'); box.textContent = '';
  POSTS.filter(p => activeTopic === 'All' || p.topics.includes(activeTopic)).forEach((p, i) => {
    const card = document.createElement('article'); card.className = 'card';
    const h = document.createElement('h4'); h.textContent = p.title;
    const tags = document.createElement('p'); tags.className = 'tags'; tags.textContent = p.topics.join(', ');
    const sum = document.createElement('p'); sum.textContent = p.summary;
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.textContent = 'Read our version';
    const body = document.createElement('div'); body.className = 'body'; body.hidden = true; body.id = 'post-' + i;
    p.body.forEach(t => { const q = document.createElement('p'); q.textContent = t; body.append(q); });
    btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', body.id);
    btn.addEventListener('click', () => { const open = body.hidden; body.hidden = !open; btn.setAttribute('aria-expanded', String(open)); btn.textContent = open ? 'Hide our version' : 'Read our version'; });
    const src = document.createElement('p'); src.className = 'source';
    const a = document.createElement('a'); a.href = p.source.url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = p.source.name;
    src.append('Source: ', a);
    card.append(h, tags, sum, btn, body, src); box.append(card);
  });
}

function boot() {
  document.title = SETTINGS.siteName; $('brand').textContent = SETTINGS.siteName; $('siteName').textContent = SETTINGS.siteName; $('tagline').textContent = SETTINGS.tagline;
  resize(); window.addEventListener('resize', resize); layoutControls(); buildJournal();
  $('btnPause').addEventListener('click', togglePause); $('btnMusic').addEventListener('click', toggleMusic); $('btnRestart').addEventListener('click', restart); $('btnRecenter').addEventListener('click', recenter); $('btnZoom').addEventListener('click', cycleZoom); $('btnMotion').addEventListener('click', toggleMotion);
  if (window.matchMedia('(pointer: coarse)').matches && 'DeviceOrientationEvent' in window) $('btnMotion').hidden = false;
  wirePanels();
  $('btnBegin').addEventListener('click', () => {
    $('intro').hidden = true; state.started = true; state.playing = !REDUCED; $('btnPause').textContent = state.playing ? 'Pause' : 'Play';
    if (REDUCED) $('live').textContent = 'The dive is paused because your device asks for less motion. Press Play to start.';
  });
  requestAnimationFrame(t => { last = t; frame(t); });
  setTimeout(() => {
    loadBarramundi(() => {
      groups.reef = buildReef(); groups.vents = buildVents(); groups.wreck = buildWreck(); groups.trench = buildTrench();
      buildLife();
      buildExtras();
      $('loadMsg').textContent = '';
      $('btnBegin').disabled = false; $('btnBegin').focus();
    });
  }, 30);
}
boot();

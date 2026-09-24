/* Applies the depth to everything: fog, light, sky, specks. */
import * as THREE from '../lib/three.js';
import { ENV } from '../config.js';
import { hemi, lamp, sun, torch } from './lights.js';
import { backscatter, glowSpecks, snow } from './particles.js';
import { scene } from './renderer.js';
import { domeUniforms, rayGroup, rayUniforms, surface, surfaceUniforms } from './sky.js';
import { U } from './uniforms.js';
import { col } from '../util/color.js';
import { clamp, lerp } from '../util/math.js';

/* The colour, fog and light for a given depth (in metres). */
const envColor = new THREE.Color(), envAbs = new THREE.Vector3();
function envAt(D) {
  let i = 0;
  while (i < ENV.length - 2 && D > ENV[i + 1].d) i++;
  const a = ENV[i], b = ENV[i + 1], u = clamp((D - a.d) / (b.d - a.d));
  envColor.copy(col(a.fog)).lerp(col(b.fog), u);
  envAbs.set(lerp(a.abs[0], b.abs[0], u), lerp(a.abs[1], b.abs[1], u), lerp(a.abs[2], b.abs[2], u));
}
/* Applies the depth to everything: fog, light, sky. */
function applyEnvironment(D) {
  envAt(D);
  scene.fog.color.copy(envColor);
  U.absorb.value.copy(envAbs); U.water.value.copy(envColor);
  const light = Math.exp(-D / 32), day = clamp(1 - D / 160);
  // Physically based lights: Math.PI keeps the same brightness as the older engine, which multiplied every light by PI.
  sun.intensity = 3.4 * light * Math.PI; hemi.intensity = (0.55 + 0.6 * Math.exp(-D / 130)) * Math.PI;
  hemi.color.copy(envColor).multiplyScalar(1.5).lerp(new THREE.Color(1, 1, 1), 0.3 * day).add(new THREE.Color(0.02, 0.05, 0.09).multiplyScalar(1 - day)); hemi.groundColor.copy(envColor).multiplyScalar(0.35);
  // Torch and lamp fade with distance (decay 1, see lights.js); these values give about the old brightness at 10 m and 8 m.
  torch.intensity = (clamp((D - 18) / 70) * 3.8 + clamp((D - 1500) / 1500) * 1.2) * Math.PI * 10;   // modest, so animals right in front of you keep their colour; the lamp lights further out
  lamp.intensity = clamp((D - 250) / 900) * 1.5 * Math.PI * 8;
  U.caust.value = clamp(1 - D / 45) * 1.0;
  U.waterUp.value.copy(envColor).multiplyScalar(1.15 + 0.6 * day); U.waterDown.value.copy(envColor).multiplyScalar(0.42);
  domeUniforms.uUp.value.copy(U.waterUp.value); domeUniforms.uDown.value.copy(U.waterDown.value);
  domeUniforms.uGlow.value = day;
  surfaceUniforms.uFogCol.value.copy(envColor); surfaceUniforms.uDay.value = clamp(1 - D / 120);
  surface.visible = D < 140;
  rayUniforms.uI.value = clamp(1 - D / 260);
  rayGroup.visible = D < 260;
  glowSpecks.material.uniforms.uAlpha.value = clamp((D - 120) / 500) * 0.9;
  snow.material.uniforms.uAlpha.value = 0.5 * (0.25 + 0.75 * clamp(1 - D / 400));
  backscatter.material.uniforms.uBeam.value = clamp((D - 60) / 200) * 0.9;   // the beam only shows once it is dark enough for the torch to matter
}

export { envColor, envAbs, envAt, applyEnvironment };

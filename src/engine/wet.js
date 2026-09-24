/* wet(): turns an ordinary material into one that looks underwater. */
import * as THREE from '../lib/three.js';
import { U } from './uniforms.js';

// three.js r128 blends fog after colour encoding. We blend it ourselves inside wet(), before tone mapping,
// so the fog matches the sky dome exactly. So the stock fog step is switched off.
THREE.ShaderChunk.fog_fragment = '';

const GLSL_NOISE = `
float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x), mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0, 1.0)), f.x), f.y); }
float caust(vec3 p, float t){ vec2 q = vec2(p.x * 0.6 + p.z * 0.5, p.y * 0.5 + p.z * 0.35 + p.x * 0.15); float a = vnoise(q + vec2(t * 0.15, t * 0.1));
  float b = vnoise(q * 1.8 - vec2(t * 0.12, -t * 0.09) + a * 2.0); float c = 1.0 - abs(b * 2.0 - 1.0); return pow(c, 7.0) * 1.5; }
`;

// Rock grain seen from three directions and blended by which way the surface faces (so it never looks stretched).
const GLSL_ROCK = `
float tri(vec3 p, vec3 w, float s){ return w.x * vnoise(p.yz * s) + w.y * vnoise(p.xz * s + 17.3) + w.z * vnoise(p.xy * s + 41.1); }
`;

/* Makes an ordinary material feel wet: colour fading with distance, moving light patches (caustics),
   rock grain, and swimming movement.
   detail: rock grain, painted from three directions and bending the light like real bumps.
   bump: how strong those bumps are (default 1).  rust: rust streaks and plates (wreck).  strata: layers of rock (trench).
   bend = { mode, amp, speed, wave, len }
     mode 1 = swims side to side (fish, sharks, squid arms)
     mode 2 = swims up and down (whales)
     mode 3 = flaps wings (manta)
     mode 4 = sways upward-pointing things (tube worms) */
function wet(mat, o = {}) {
  const bend = o.bend || null;
  mat.customProgramCacheKey = () => JSON.stringify(o);
  mat.onBeforeCompile = sh => {
    sh.uniforms.uAbsorb = U.absorb; sh.uniforms.uTime = U.time; sh.uniforms.uCaust = U.caust;
    let vs = 'varying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nattribute float aPhase;\n', fs = 'varying vec3 vWP;\nvarying vec3 vWN;\nuniform float uTime;\nuniform float uCaust;\nuniform vec3 uAbsorb;\n' + GLSL_NOISE + GLSL_ROCK;
    if (bend) {
      sh.uniforms.uBend = { value: new THREE.Vector4(bend.amp, bend.speed, bend.wave, bend.len) };
      vs += 'uniform vec4 uBend;\n';
      let code = '';
      if (bend.mode === 1) code = 'float bt = clamp((0.5*uBend.w - position.x)/uBend.w, 0.0, 1.4); transformed.z += sin(uBend.y*uTime - bt*uBend.z + aPhase)*uBend.x*uBend.w*bt*bt;';
      if (bend.mode === 2) code = 'float bt = clamp((0.5*uBend.w - position.x)/uBend.w, 0.0, 1.4); transformed.y += sin(uBend.y*uTime - bt*uBend.z + aPhase)*uBend.x*uBend.w*bt*bt;';
      if (bend.mode === 3) code = 'float az = abs(position.z); transformed.y += sin(uBend.y*uTime - az*uBend.z + aPhase)*uBend.x*az;';
      if (bend.mode === 4) code = 'float bt = clamp(position.y/uBend.w, 0.0, 1.4); transformed.x += sin(uBend.y*uTime + aPhase)*uBend.x*uBend.w*bt*bt; transformed.z += cos(uBend.y*uTime*0.8 + aPhase)*uBend.x*uBend.w*bt*bt*0.6;';
      sh.vertexShader = sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n' + code);
    }
    sh.vertexShader = sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\nvec4 wp4 = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwp4 = instanceMatrix * wp4;\n#endif\nvWP = (modelMatrix * wp4).xyz;');
    sh.vertexShader = sh.vertexShader.replace('#include <defaultnormal_vertex>', '#include <defaultnormal_vertex>\nvWN = normalize((vec4(transformedNormal, 0.0) * viewMatrix).xyz);');
    sh.vertexShader = vs + sh.vertexShader;
    let f = sh.fragmentShader;
    f = f.replace('#include <tonemapping_fragment>', '#ifdef USE_FOG\n vec3 fogT = exp(-uAbsorb * fogDepth);\n gl_FragColor.rgb = gl_FragColor.rgb * fogT + fogColor * (vec3(1.0) - fogT);\n#endif\n#include <tonemapping_fragment>');
    if (o.detail) {
      let c = '#include <color_fragment>\n vec3 tw = pow(abs(normalize(vWN)), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);\n'
        + ' float rh = tri(vWP, tw, 0.9)*0.5 + tri(vWP, tw, 3.1)*0.3 + tri(vWP, tw, 9.0)*0.14 + tri(vWP, tw, 26.0)*0.06;\n'
        + ' diffuseColor.rgb *= 0.42 + 1.15*rh * (0.8 + 0.4*tri(vWP, tw, 41.0));\n';
      // layers of rock: bands of uneven thickness that break off here and there, with thin dark partings between them
      if (o.strata) c += ' float band = sin(vWP.y*1.7 + tri(vWP, tw, 0.22)*2.4 + vWP.z*0.05); float brk = smoothstep(0.3, 0.62, tri(vWP, tw, 0.13));\n'
        + ' float lay = smoothstep(0.25, 0.8, band) * brk; float part = 1.0 - (1.0 - smoothstep(0.0, 0.07, abs(sin(vWP.y*1.9 + tri(vWP, tw, 0.3)*3.0)))) * 0.35 * smoothstep(0.45, 0.7, tri(vWP, tw, 0.2));\n'
        + ' diffuseColor.rgb *= mix(vec3(0.82, 0.8, 0.78), vec3(1.14, 1.08, 1.0), lay) * part; rh += lay*0.3 - (1.0 - part)*0.6;\n';
      // rust runs down in streaks (long in y), so the pattern is stretched upright in world space
      if (o.rust) c += ' float st = vnoise(vec2(dot(vWP.xz, vec2(1.9, 1.3))*1.3, vWP.y*0.22)) * 0.6 + vnoise(vec2(dot(vWP.xz, vec2(-1.1, 2.1))*4.0, vWP.y*0.7)) * 0.4;\n'
        + ' float patchy = smoothstep(0.35, 0.75, vnoise(vWP.xz*0.35 + vec2(vWP.y*0.3, 0.0)));\n'
        + ' vec3 rustC = mix(vec3(0.30, 0.085, 0.02), vec3(0.62, 0.26, 0.07), vnoise(vWP.xz*3.0 + vWP.y));\n'
        + ' diffuseColor.rgb = mix(diffuseColor.rgb, rustC, clamp(smoothstep(0.5, 0.85, st)*0.6*patchy + rh*0.12, 0.0, 0.7)); rh += st*0.35*patchy;\n';
      f = f.replace('#include <color_fragment>', c);
      // bumps: tilt the surface normal by the slope of the grain (worked out from how the grain changes across the screen)
      f = f.replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n { vec3 dpx = dFdx(-vViewPosition), dpy = dFdy(-vViewPosition); float dhx = dFdx(rh), dhy = dFdy(rh);\n'
        + ' vec3 r1 = cross(dpy, normal), r2 = cross(normal, dpx); float det = dot(dpx, r1); vec3 gr = sign(det) * (dhx * r1 + dhy * r2);\n'
        + ' float bk = ' + (o.bump == null ? 1 : o.bump).toFixed(2) + ' * 0.22 * smoothstep(45.0, 4.0, length(vViewPosition));\n'
        + ' normal = normalize(abs(det) * normal - bk * gr); }');
    }
    if (o.caust !== false) {
      f = f.replace('gl_FragColor = vec4( outgoingLight, diffuseColor.a );',
        'vec3 wn = inverseTransformDirection( normal, viewMatrix );\n outgoingLight += diffuseColor.rgb * caust(vWP, uTime) * uCaust * max(wn.y, 0.0) * vec3(0.9, 1.0, 0.85);\n gl_FragColor = vec4( outgoingLight, diffuseColor.a );');
    }
    sh.fragmentShader = fs + f;
  };
  return mat;
}

export { wet, GLSL_NOISE };

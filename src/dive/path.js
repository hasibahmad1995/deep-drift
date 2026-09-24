/* pathAt(t): where the diver is at time t, which way they face, and the depth. */
import * as THREE from '../lib/three.js';
import { STAGES } from '../config.js';
import { stageIndex, worldY } from './timeline.js';
import { clamp, lerp, smooth } from '../util/math.js';
import { STAGE_ORIGIN, groups } from '../world/layout.js';
import { TRENCH_TOP_Y } from '../world/trench.js';
import { VENT_FLOOR_Y } from '../world/vents.js';
import { WRECK_FLOOR_Y } from '../world/wreck.js';

const facing = (yaw, pitch, out) => out.set(Math.cos(pitch) * Math.cos(yaw), Math.sin(pitch), -Math.cos(pitch) * Math.sin(yaw));
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
      pos.set(6 * Math.sin(u * 4), lerp(TRENCH_TOP_Y + 110, TRENCH_TOP_Y - 142, smooth(u)), lerp(-40, 55, u)).add(O);   // ends about 7 m above the floor
      facing(-Math.PI / 2 + 0.45 * Math.sin(u * 3.2), -0.32 + 0.1 * Math.sin(u * 5), fwd);
      break;
    }
  }
  return { pos, fwd, D, si, u };
}

export { facing, pathAt };

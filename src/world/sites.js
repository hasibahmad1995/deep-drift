/* The plan of the one continuous world.
   The dive goes down the side of a volcanic island: x runs away from the island (downhill), z runs along it.
   Reef (x < -20) -> the island's cliff drops into the dark -> a terrace on the volcano with vents (~1,600 m)
   -> the volcano slope -> the abyssal plain with the wreck (~5,000 m) -> the trench -> the Challenger Deep.
   In the real ocean these places are tens to hundreds of km apart; here they are one after another. */

// Depth of the sea floor (metres) along x, before bumps are added. The trench (x 558 to 652) is built separately.
const FLOOR_PROFILE = [
  [-38, 190], [-35, 400], [-30, 700], [-22, 1000], [0, 1300], [40, 1500], [80, 1575], [100, 1600],   // island cliff
  [205, 1640], [218, 1800],                                                                         // the vent terrace and its edge
  [240, 2400], [270, 3100], [300, 3800], [330, 4500], [355, 4800],                                  // volcano slope
  [450, 5200], [540, 5750], [558, 5980],                                                            // abyssal plain, dipping toward the trench
  [652, 6050], [700, 6200], [900, 6200]                                                             // the far side of the trench
];

// Hydrothermal vents on the terrace: [x, z, chimney height in m]
const VENTS = [[118, -9, 5], [132, 12, 8], [108, 14, 11], [156, -14, 5], [170, 6, 8], [188, -4, 6]];

// The shipwreck and the whale skeleton on the abyssal plain
const WRECK = { x: 420, z: 10, yaw: 0.5 };
const WHALE = { x: 470, z: -16, yaw: 0.55 };

// The trench runs along z. The landward wall drops from x = 558; the far wall rises to x = 652.
const TRENCH = { landTop: 558, landFoot: 574, farFoot: 628, farTop: 652, zMin: -160, zMax: 160 };

export { FLOOR_PROFILE, VENTS, WRECK, WHALE, TRENCH };

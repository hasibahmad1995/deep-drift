/* Where each animal really lives: the depths (in metres) between which it may be met. One list for both the random
   visitors (passers.js) and the scripted animals (motion.js), so a deep-sea animal never turns up near the surface.
   Ranges are where divers or submersibles usually meet them, not the extreme records. */
const LIVES = {
  'Dolphin':             { minD: 0,    maxD: 60 },
  'Blacktip reef shark': { minD: 0,    maxD: 75 },
  'Green sea turtle':    { minD: 0,    maxD: 90 },
  'Giant manta ray':     { minD: 5,    maxD: 120 },
  'Humpback whale':      { minD: 0,    maxD: 200 },
  'Whale shark':         { minD: 10,   maxD: 300 },
  'Great white shark':   { minD: 10,   maxD: 300 },
  'Sperm whale':         { minD: 300,  maxD: 1500 },   // hunts squid in the dark, far below the surface
  'Giant squid':         { minD: 300,  maxD: 1000 },
  'Vampire squid':       { minD: 600,  maxD: 1200 },
  'Gulper eel':          { minD: 500,  maxD: 3000 },
  'Anglerfish':          { minD: 700,  maxD: 2500 },
  'Dumbo octopus':       { minD: 1500, maxD: 6500 },
  'Grenadier fish':      { minD: 800,  maxD: 5500 },
  'Mariana snailfish':   { minD: 6000, maxD: 8300 },   // no fish has been seen much deeper than about 8,300 m
};

export { LIVES };

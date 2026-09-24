/* Zone names and the one-line facts shown for each animal. */

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

export { ZONE_NAMES, FACTS };

/* The ocean's depth zones and the one-line facts shown for each animal. */

// The ocean's five depth zones (by real depth in metres)
function zoneName(D) {
  if (D < 5) return 'Sunlit surface';
  if (D < 200) return 'Sunlight zone';
  if (D < 1000) return 'Twilight zone';
  if (D < 4000) return 'Midnight zone';
  if (D < 6000) return 'Abyssal zone';
  return 'Hadal zone';
}
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
  'Amphipods': 'Amphipods in the Challenger Deep coat themselves with a thin armour of aluminium to cope with the pressure.',
  'Mariana snailfish': 'Snailfish are the deepest fish ever filmed, at 8,336 m. Below about 8,400 m no fish have been seen.',
  'Hatchetfish': 'Hatchetfish glow on their bellies so that, seen from below, they blend into the faint light from above.',
  'Vampire squid': 'Despite its name, the vampire squid eats drifting marine snow. When threatened it can release a cloud of glowing mucus.',
  'Gulper eel': 'The gulper eel can open its mouth far wider than its body, and the tip of its tail can glow.',
  'Grenadier fish': 'Grenadiers, or rattails, are among the most common fish near the deep sea floor, from about 800 to 5,500 m.',
  'Tripod fish': 'Tripod fish stand on three long fin rays, facing the current, and wait for food to drift within reach.',
  'Sea pigs': 'Sea pigs are sea cucumbers that walk across the deep sea mud on tube feet, eating it as they go.',
  'Xenophyophores': 'Each of these fragile lumps is a single giant cell. Some grow as big as a saucer, even in the Challenger Deep.',
  'Brittle stars': 'Brittle stars have five thin, bendy arms. They live on sea floors from the shallows to the deep.',
  'Sea lilies': 'Sea lilies are relatives of starfish. They hold on with a stalk and catch drifting food with feathery arms.',
  'Glass sponges': 'Glass sponges build their skeletons from silica, the same stuff as glass.',
  'Bamboo corals': 'Deep-sea corals grow very slowly in the cold and dark. Some colonies are hundreds of years old.',
  'Black corals': 'Black corals are named for their black skeleton. Some deep black corals are over 4,000 years old.',
  'Sea fans': 'Sea fans grow across the current, like a net, to catch passing food.',
  'Manganese nodules': 'These dark lumps of metal grow on the abyssal plain by only a few millimetres every million years.',
  'Liquid CO2 droplets': 'At a few vents, like the Champagne vent in the Mariana Arc, droplets of liquid carbon dioxide rise from the sea floor.'
};

export { zoneName, FACTS };

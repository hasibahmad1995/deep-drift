
/* =====================================================================
   12. BLOG POSTS
   Every post is written in our own words. The source link goes to the page the post is
   based on. These pages were found with a web search on 24 September 2026 and only their
   opening text was read, so please read each page yourself before you promote the site.
   topics = the filter buttons the post shows under.
   ===================================================================== */
const TOPICS = ['Coral reefs', 'Whales and dolphins', 'Sharks', 'Deep sea', 'Conservation', 'Ocean science'];

const POSTS = [
  { title: 'Why coral reefs matter so much', topics: ['Coral reefs'],
    summary: 'Reefs hold more kinds of life than any other part of the sea.',
    body: ['NOAA describes coral reefs as places that hold more species than any other marine habitat. In variety, they can be compared to rainforests.',
           'Many reefs have already been damaged or destroyed by pollution, unsustainable fishing and a changing climate. NOAA still sounds hopeful: the reefs that remain can be protected if people act now.'],
    source: { name: 'NOAA, Coral Reefs', url: 'https://oceanservice.noaa.gov/ocean/corals/welcome.html' } },

  { title: 'A coral is many tiny animals', topics: ['Coral reefs', 'Conservation'],
    summary: 'A coral colony can be made of hundreds to hundreds of thousands of polyps.',
    body: ['Most corals are colonies. Each colony is built from lots of tiny animals called polyps, anywhere from a few hundred to hundreds of thousands.',
           'NOAA has an online tutorial that explains how reefs work, what threatens them and what people are doing to protect them. It also says thousands of species depend on reefs, and millions of people rely on them for food, protection and work.'],
    source: { name: 'NOAA, Corals tutorial', url: 'https://oceanservice.noaa.gov/education/tutorial_corals/welcome.html' } },

  { title: 'Humpback whales are a comeback story', topics: ['Whales and dolphins', 'Conservation'],
    summary: 'After the end of large-scale hunting, humpbacks have largely recovered, but they are not out of danger.',
    body: ['A Smithsonian research centre lists a talk that calls humpback whales a conservation success story. Commercial whaling once pushed them down, and they have since largely recovered.',
           'The same page says they still need help. The speaker, a biologist with the Pacific Whale Foundation, planned to talk about the biggest threats today and why whales matter for a healthy ocean. Note that this source is an event page for a talk, not a full article.'],
    source: { name: 'Smithsonian Environmental Research Center, Hope for Humpbacks', url: 'https://serc.si.edu/event/hope-for-humpbacks' } },

  { title: 'The white shark: famous, protected and still mysterious', topics: ['Sharks', 'Conservation'],
    summary: 'A slow-growing top predator that scientists are still learning about.',
    body: ['The white shark is dark grey to brown on top and white underneath. NOAA Fisheries points out its torpedo-shaped body, pointed snout and crescent-shaped tail.',
           'White sharks grow slowly and have few young, which makes them easy to harm. That is why they are widely protected. In United States waters they are a prohibited species, and any caught by accident must be let go. NOAA also says many basic questions about their numbers and movements are still unanswered.'],
    source: { name: 'NOAA Fisheries, White Shark', url: 'https://fisheries.noaa.gov/species/white-shark' } },

  { title: 'Life without sunlight at hydrothermal vents', topics: ['Deep sea'],
    summary: 'Down here, bacteria turn vent chemicals into food, and a whole community grows from it.',
    body: ['Deep vents pour out hot, chemical-rich water. Bacteria use a gas from that water, hydrogen sulfide, to make sugars. This is called chemosynthesis, and it needs no sunlight.',
           'Snails, clams and mussels graze on the bacteria. Crabs and shrimp eat the grazers, and larger animals hunt those. Tube worms carry bacteria inside their bodies and grow very fast. NOAA notes that more than 300 animal species have been found at vents, and most live nowhere else. Vents can switch off after months or years, and few last more than a couple of decades.'],
    source: { name: 'NOAA Ocean Exploration, Life at hydrothermal vents', url: 'https://oceanexplorer.noaa.gov/edu/learning/player/lesson05/l5text.htm' } },

  { title: 'The ocean has layers, from sunlit to hadal', topics: ['Deep sea', 'Ocean science'],
    summary: 'Scientists split the water into zones by how much light reaches them.',
    body: ['Woods Hole Oceanographic Institution lists five zones. Sunlight reaches about 200 m in the top layer. The twilight zone runs from 200 to 1,000 m, just past where sunlight can reach.',
           'The midnight zone stretches to about 4,000 m. The abyss covers roughly 3,000 to 6,500 m. The hadal zone, from about 6,000 to 11,000 m, is found only in trenches and is named after Hades, the Greek god of the underworld.'],
    source: { name: 'Woods Hole Oceanographic Institution, Ocean Zones', url: 'https://whoi.edu/know-your-ocean/ocean-topics/how-the-ocean-works/ocean-zones' } },

  { title: 'How much of the ocean have we explored?', topics: ['Ocean science'],
    summary: 'The seafloor has been mapped from space, but sharp, detailed maps cover much less.',
    body: ['NOAA says the ocean covers about 70% of Earth and has an average depth of 3,682 m. Satellites have mapped the whole seafloor, but only in a general way, so features like seamounts and shipwrecks can stay hidden.',
           'Detailed mapping with modern sonar covered about 26% of the seafloor as of June 2024. That number keeps changing, so check the NOAA page for the latest figure.'],
    source: { name: 'NOAA Ocean Exploration, How much of the ocean has been explored?', url: 'https://oceanexplorer.noaa.gov/facts/explored.html' } }
];

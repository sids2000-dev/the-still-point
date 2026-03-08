export interface Challenge {
  id: string;
  type: 'vocabulary' | 'math' | 'logic';
  prompt: string;
  answer: string;
  difficulty: number;
  category: string;
}

export interface StoryBranch {
  label: string;
  nextNodeId: string;
}

export interface StoryNode {
  id: string;
  depth: number;
  narrative: string;
  branches: StoryBranch[];
  challengePool: Challenge[];
  isEnding?: boolean;
}

export const storyNodes: Record<string, StoryNode> = {
  start: {
    id: 'start',
    depth: 0,
    narrative: "The mist parts before you, revealing an ancient garden overgrown with luminescent moss. A stone lantern flickers at the entrance, casting warm shadows on a weathered gate. Your companions gather close — the path ahead splits in two.",
    branches: [
      { label: "Enter through the mossy gate", nextNodeId: "garden_path" },
      { label: "Follow the stream alongside the wall", nextNodeId: "stream_path" }
    ],
    challengePool: [
      { id: "v1", type: "vocabulary", prompt: "What word means 'a feeling of calm and peace'?", answer: "serenity", difficulty: 1, category: "emotions" },
      { id: "m1", type: "math", prompt: "A garden has 7 rows of 8 stones. How many stones total?", answer: "56", difficulty: 1, category: "multiplication" },
      { id: "l1", type: "logic", prompt: "If all moss glows and this plant glows, is it necessarily moss?", answer: "no", difficulty: 1, category: "deduction" },
      { id: "v2", type: "vocabulary", prompt: "What word means 'lasting for a very short time'?", answer: "ephemeral", difficulty: 1, category: "time" },
      { id: "m2", type: "math", prompt: "What is 144 ÷ 12?", answer: "12", difficulty: 1, category: "division" },
    ]
  },
  garden_path: {
    id: 'garden_path',
    depth: 1,
    narrative: "Beyond the gate, the garden reveals itself — koi ponds mirror the sky, cherry blossoms drift like pink snow. A stone bridge arches over dark water where something glimmers below. An elderly keeper tends bonsai nearby, humming softly.",
    branches: [
      { label: "Speak with the garden keeper", nextNodeId: "keeper_wisdom" },
      { label: "Investigate the glimmer in the pond", nextNodeId: "pond_mystery" }
    ],
    challengePool: [
      { id: "v3", type: "vocabulary", prompt: "What Japanese word means 'the beauty of imperfection'?", answer: "wabi-sabi", difficulty: 2, category: "philosophy" },
      { id: "m3", type: "math", prompt: "A bonsai grows 0.5cm per year. How tall after 24 years if it started at 10cm?", answer: "22", difficulty: 2, category: "algebra" },
      { id: "l2", type: "logic", prompt: "Three koi: red, gold, white. Red is not next to white. Gold is in the middle. What order? (left to right, comma separated)", answer: "white,gold,red", difficulty: 2, category: "spatial" },
      { id: "v4", type: "vocabulary", prompt: "What word means 'to think deeply or carefully about something'?", answer: "contemplate", difficulty: 2, category: "thinking" },
      { id: "m4", type: "math", prompt: "If 3 cherry trees each drop 45 blossoms per minute, how many in 4 minutes?", answer: "540", difficulty: 2, category: "multiplication" },
    ]
  },
  stream_path: {
    id: 'stream_path',
    depth: 1,
    narrative: "The stream murmurs ancient secrets as you follow its course. Smooth stones create natural stepping paths. Fireflies begin to emerge in the twilight, dancing in patterns that seem almost deliberate. The water leads to a hidden grotto.",
    branches: [
      { label: "Enter the grotto", nextNodeId: "grotto_depths" },
      { label: "Follow the firefly patterns", nextNodeId: "firefly_dance" }
    ],
    challengePool: [
      { id: "v5", type: "vocabulary", prompt: "What word describes the sound of a gentle stream?", answer: "babbling", difficulty: 2, category: "nature" },
      { id: "m5", type: "math", prompt: "A firefly flashes every 3 seconds. Another every 5 seconds. When do they first flash together? (seconds)", answer: "15", difficulty: 2, category: "lcm" },
      { id: "l3", type: "logic", prompt: "If fireflies only dance when it's warm, and they're dancing now, what can you conclude about the temperature?", answer: "warm", difficulty: 2, category: "deduction" },
      { id: "v6", type: "vocabulary", prompt: "What word means 'a small cave or cavern'?", answer: "grotto", difficulty: 2, category: "geography" },
      { id: "m6", type: "math", prompt: "There are 12 stepping stones. You skip every 3rd stone. How many do you step on?", answer: "8", difficulty: 2, category: "patterns" },
    ]
  },
  keeper_wisdom: {
    id: 'keeper_wisdom',
    depth: 2,
    narrative: "The keeper smiles knowingly. 'You seek the heart of this garden,' she says, placing a warm cup of tea in your hands. 'Every path leads there eventually — but only those who understand balance may enter.' She gestures to a stone puzzle embedded in the ground.",
    branches: [
      { label: "Solve the stone puzzle", nextNodeId: "temple_entrance" },
      { label: "Ask about the garden's history", nextNodeId: "garden_history" }
    ],
    challengePool: [
      { id: "v7", type: "vocabulary", prompt: "What word means 'a state of balance between opposing forces'?", answer: "equilibrium", difficulty: 3, category: "physics" },
      { id: "m7", type: "math", prompt: "A tea ceremony uses 3g of tea per cup. For 5 guests with 2 cups each, plus the host with 1 cup, how many grams needed?", answer: "33", difficulty: 3, category: "word-problems" },
      { id: "l4", type: "logic", prompt: "The keeper says: 'I always lie.' Is this statement possible?", answer: "no", difficulty: 3, category: "paradox" },
      { id: "m8", type: "math", prompt: "A square garden has area 169 sq meters. What is the perimeter?", answer: "52", difficulty: 3, category: "geometry" },
      { id: "v8", type: "vocabulary", prompt: "What word means 'the art of finding something good without looking for it'?", answer: "serendipity", difficulty: 3, category: "discovery" },
    ]
  },
  pond_mystery: {
    id: 'pond_mystery',
    depth: 2,
    narrative: "You reach into the dark water and your fingers close around something cold and smooth — an ancient jade compass. Its needle doesn't point north; instead, it seems to point toward something deeper in the garden. The koi circle excitedly.",
    branches: [
      { label: "Follow the compass", nextNodeId: "temple_entrance" },
      { label: "Examine the compass markings", nextNodeId: "compass_riddle" }
    ],
    challengePool: [
      { id: "v9", type: "vocabulary", prompt: "What precious green stone is culturally significant in East Asia?", answer: "jade", difficulty: 3, category: "materials" },
      { id: "m9", type: "math", prompt: "The compass has 8 symbols equally spaced. What angle between each? (degrees)", answer: "45", difficulty: 3, category: "geometry" },
      { id: "l5", type: "logic", prompt: "A compass points to treasure. Treasure is always hidden. If something is visible, can the compass point to it?", answer: "no", difficulty: 3, category: "deduction" },
      { id: "m10", type: "math", prompt: "Koi swim in circles of radius 2m. What is the circumference? (use 3.14, round to 1 decimal)", answer: "12.6", difficulty: 3, category: "geometry" },
      { id: "v10", type: "vocabulary", prompt: "What word means 'extremely old or ancient'?", answer: "primordial", difficulty: 3, category: "time" },
    ]
  },
  grotto_depths: {
    id: 'grotto_depths',
    depth: 2,
    narrative: "The grotto opens into a cathedral of crystal formations. Water drips in rhythmic patterns, creating natural music. Ancient paintings cover the walls — they depict a story of travelers much like yourselves, seeking something called 'The Still Point'.",
    branches: [
      { label: "Study the ancient paintings", nextNodeId: "painting_revelation" },
      { label: "Follow the crystal path deeper", nextNodeId: "crystal_ending" }
    ],
    challengePool: [
      { id: "v11", type: "vocabulary", prompt: "What word means 'a large underground chamber'?", answer: "cavern", difficulty: 3, category: "geography" },
      { id: "m11", type: "math", prompt: "Water drips 4 times per second. How many drips in 15 minutes?", answer: "3600", difficulty: 3, category: "rates" },
      { id: "l6", type: "logic", prompt: "All travelers in the paintings carried lanterns. You have a lantern. Are you necessarily one of the painted travelers?", answer: "no", difficulty: 3, category: "deduction" },
      { id: "m12", type: "math", prompt: "A crystal grows 2mm per century. How many centuries to grow 3cm?", answer: "15", difficulty: 3, category: "conversion" },
      { id: "v12", type: "vocabulary", prompt: "What word means 'shining with a soft, wavering light'?", answer: "glimmering", difficulty: 3, category: "light" },
    ]
  },
  firefly_dance: {
    id: 'firefly_dance',
    depth: 2,
    narrative: "The fireflies lead you to a moonlit clearing where an ancient sundial sits, covered in moss. But this is no ordinary sundial — it has markings for emotions rather than hours. 'Joy' points toward a flowering meadow. 'Wisdom' points toward a mountain path.",
    branches: [
      { label: "Follow the path of Joy", nextNodeId: "meadow_ending" },
      { label: "Follow the path of Wisdom", nextNodeId: "mountain_climb" }
    ],
    challengePool: [
      { id: "v13", type: "vocabulary", prompt: "What word means 'giving out a steady, soft light'?", answer: "glowing", difficulty: 3, category: "light" },
      { id: "m13", type: "math", prompt: "A sundial casts shadows. If the gnomon is 30cm and the shadow is 45cm, what's the ratio simplified?", answer: "2:3", difficulty: 3, category: "ratios" },
      { id: "l7", type: "logic", prompt: "Joy leads to flowers. Wisdom leads to mountains. Can both paths lead to understanding?", answer: "yes", difficulty: 3, category: "philosophy" },
      { id: "m14", type: "math", prompt: "There are 50 fireflies. Every minute, 5 more appear and 2 leave. How many after 6 minutes?", answer: "68", difficulty: 3, category: "sequences" },
      { id: "v14", type: "vocabulary", prompt: "What word means 'an open area of grassland'?", answer: "meadow", difficulty: 3, category: "nature" },
    ]
  },
  temple_entrance: {
    id: 'temple_entrance',
    depth: 3,
    narrative: "The paths converge at a small wooden temple nestled between ancient cedars. Paper lanterns hang from every eave, swaying gently. Inside, a single room holds a sand garden with carefully raked patterns. In the center: a lotus flower made of pure light.",
    branches: [
      { label: "Touch the lotus of light", nextNodeId: "enlightenment_ending" },
      { label: "Rake the sand garden", nextNodeId: "meditation_ending" }
    ],
    challengePool: [
      { id: "v15", type: "vocabulary", prompt: "What flower symbolizes enlightenment in Buddhism?", answer: "lotus", difficulty: 4, category: "symbolism" },
      { id: "m15", type: "math", prompt: "A sand garden is 6m × 4m. If you rake lines 5cm apart across the width, how many lines?", answer: "120", difficulty: 4, category: "division" },
      { id: "l8", type: "logic", prompt: "If enlightenment requires letting go, and you're trying hard to achieve it, can you achieve it?", answer: "no", difficulty: 4, category: "paradox" },
      { id: "m16", type: "math", prompt: "8 lanterns hang on each of 4 sides. Corner lanterns are shared. How many total lanterns?", answer: "28", difficulty: 4, category: "counting" },
      { id: "v16", type: "vocabulary", prompt: "What Japanese word means 'a state of no-mind, or flow'?", answer: "mushin", difficulty: 4, category: "philosophy" },
    ]
  },
  garden_history: {
    id: 'garden_history',
    depth: 3,
    narrative: "The keeper tells of a garden planted a thousand years ago by wandering monks who sought a place where time moved differently. 'Here,' she whispers, 'a moment can last forever if you let it.' She offers to show you the garden's hidden heart.",
    branches: [
      { label: "Accept her guidance", nextNodeId: "meditation_ending" }
    ],
    challengePool: [
      { id: "v17", type: "vocabulary", prompt: "What word means 'lasting for an indefinitely long time'?", answer: "eternal", difficulty: 4, category: "time" },
      { id: "m17", type: "math", prompt: "If 1 garden year equals 7 normal years, how many garden years in a millennium?", answer: "143", difficulty: 4, category: "division" },
      { id: "l9", type: "logic", prompt: "If a moment can last forever, and forever has no end, does the moment ever finish?", answer: "no", difficulty: 4, category: "paradox" },
      { id: "m18", type: "math", prompt: "The garden has existed for 1000 years. A cherry tree lives 100 years. At least how many generations of trees?", answer: "10", difficulty: 4, category: "division" },
      { id: "v18", type: "vocabulary", prompt: "What word means 'a person living in solitude for religious reasons'?", answer: "hermit", difficulty: 4, category: "people" },
    ]
  },
  compass_riddle: {
    id: 'compass_riddle',
    depth: 3,
    narrative: "The compass markings spell out a riddle in ancient script: 'I am found at the center of gravity, yet I weigh nothing. I am in every heart, yet I am not blood. I connect all things, yet I cannot be held.' The compass begins to spin wildly.",
    branches: [
      { label: "Answer: Love", nextNodeId: "enlightenment_ending" },
      { label: "Answer: Emptiness", nextNodeId: "meditation_ending" }
    ],
    challengePool: [
      { id: "v19", type: "vocabulary", prompt: "What word means 'a short piece of writing that is hard to understand'?", answer: "riddle", difficulty: 4, category: "language" },
      { id: "m19", type: "math", prompt: "The compass has spun 1,440 degrees. How many full rotations?", answer: "4", difficulty: 4, category: "division" },
      { id: "l10", type: "logic", prompt: "Something weighs nothing, is in every heart, and connects all things. Can a physical object satisfy all three conditions?", answer: "no", difficulty: 4, category: "deduction" },
      { id: "m20", type: "math", prompt: "Ancient script uses base 8. What is 77 in base 8 equal to in base 10?", answer: "63", difficulty: 4, category: "number-systems" },
      { id: "v20", type: "vocabulary", prompt: "What word means 'written characters or letters'?", answer: "script", difficulty: 4, category: "writing" },
    ]
  },
  painting_revelation: {
    id: 'painting_revelation',
    depth: 3,
    narrative: "The paintings show the full story: the travelers found The Still Point — not a place, but a state of being. When they stopped searching, they found what they were looking for had been within them all along. The crystals around you begin to hum in harmony.",
    branches: [
      { label: "Close your eyes and listen", nextNodeId: "crystal_ending" }
    ],
    challengePool: [
      { id: "v21", type: "vocabulary", prompt: "What word means 'a sudden, intuitive understanding'?", answer: "epiphany", difficulty: 4, category: "discovery" },
      { id: "m21", type: "math", prompt: "Crystals vibrate at 440Hz. A harmonic vibrates at 3× that frequency. What frequency?", answer: "1320", difficulty: 4, category: "multiplication" },
      { id: "l11", type: "logic", prompt: "If what you seek has always been within you, was the journey necessary?", answer: "yes", difficulty: 4, category: "philosophy" },
      { id: "m22", type: "math", prompt: "5 travelers painted across 3 walls. Wall 1 has 2, wall 2 has 2. How many on wall 3?", answer: "1", difficulty: 4, category: "subtraction" },
      { id: "v22", type: "vocabulary", prompt: "What word means 'a pleasant or harmonious sound'?", answer: "harmony", difficulty: 4, category: "music" },
    ]
  },
  mountain_climb: {
    id: 'mountain_climb',
    depth: 3,
    narrative: "The mountain path winds upward through bamboo groves and past tinkling wind chimes. At the summit, you find a small pavilion with a view of everything below — the garden, the stream, the grotto, all part of one great design.",
    branches: [
      { label: "Sit and contemplate the view", nextNodeId: "enlightenment_ending" }
    ],
    challengePool: [
      { id: "v23", type: "vocabulary", prompt: "What word means 'to climb or go up something steep'?", answer: "ascend", difficulty: 4, category: "movement" },
      { id: "m23", type: "math", prompt: "The mountain is 800m tall. You climb 50m per hour. How many hours to the top?", answer: "16", difficulty: 4, category: "division" },
      { id: "l12", type: "logic", prompt: "From the top, all paths are visible. Does seeing all paths mean you've walked them all?", answer: "no", difficulty: 4, category: "perspective" },
      { id: "m24", type: "math", prompt: "There are 12 wind chimes. Each plays 3 notes. How many unique note combinations if no two chimes share notes?", answer: "36", difficulty: 4, category: "multiplication" },
      { id: "v24", type: "vocabulary", prompt: "What word means 'a roofed structure offering shade'?", answer: "pavilion", difficulty: 4, category: "architecture" },
    ]
  },
  enlightenment_ending: {
    id: 'enlightenment_ending',
    depth: 4,
    narrative: "The light of the lotus washes over your entire team. For a moment, you understand everything — the garden, the journey, each other. The boundaries between self and world dissolve into pure awareness. You have found The Still Point.\n\n🌸 ENDING: The Lotus Awakening 🌸\n\nYour team has achieved enlightenment through courage and curiosity. The garden will remember you.",
    branches: [],
    challengePool: [],
    isEnding: true
  },
  meditation_ending: {
    id: 'meditation_ending',
    depth: 4,
    narrative: "In the raked sand, you see it — the pattern is a map of your journey, every choice you made etched in careful lines. As you sit in silence together, the garden breathes with you. Peace settles like cherry blossoms on still water.\n\n🧘 ENDING: The Sand Garden's Peace 🧘\n\nYour team has found tranquility through patience and reflection. The garden holds your story now.",
    branches: [],
    challengePool: [],
    isEnding: true
  },
  crystal_ending: {
    id: 'crystal_ending',
    depth: 4,
    narrative: "The crystals sing a chord that resonates in your bones. The cave fills with prismatic light, and the ancient paintings come alive — the travelers smile at you, welcoming you to The Still Point. You have become part of the story.\n\n💎 ENDING: The Crystal Resonance 💎\n\nYour team has joined the eternal story through wonder and discovery. The crystals carry your harmony forward.",
    branches: [],
    challengePool: [],
    isEnding: true
  },
  meadow_ending: {
    id: 'meadow_ending',
    depth: 4,
    narrative: "The meadow stretches endlessly under a sky painted in sunset gold and lavender. Wildflowers bend toward you as if in greeting. Your team sits together, watching the day end and feeling that this moment — this exact moment — is enough.\n\n🌻 ENDING: The Meadow of Joy 🌻\n\nYour team has found happiness through simplicity and presence. The flowers bloom brighter for your visit.",
    branches: [],
    challengePool: [],
    isEnding: true
  }
};

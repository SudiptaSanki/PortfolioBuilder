/**
 * festival/data.js
 * Data tables for the Festival template family generator.
 * 100 unique role+theme combinations across 10 craft families and 25 palettes.
 */

// ---------------------------------------------------------------------------
// Person name pools (deterministic pairing keeps personas unique)
// ---------------------------------------------------------------------------
const FIRST_NAMES = [
  'Aarav', 'Meera', 'Rohan', 'Ananya', 'Vikram', 'Lakshmi', 'Arjun', 'Ishita', 'Karthik', 'Priya',
  'Dev', 'Saanvi', 'Aditya', 'Nandini', 'Ravi', 'Kavya', 'Siddharth', 'Aishwarya', 'Nikhil', 'Radhika',
  'Aryan', 'Bhavana', 'Kunal', 'Trisha', 'Harsh', 'Swara', 'Imran', 'Leela', 'Joy', 'Mitali',
  'Om', 'Charu', 'Rudra', 'Gauri', 'Neel', 'Tara', 'Shivam', 'Rukmini', 'Alok', 'Sneha',
  'Manav', 'Padma', 'Yash', 'Sarala', 'Dhruv', 'Malini', 'Kabir', 'Esha', 'Varun', 'Anjali',
  'Aryan', 'Kamala', 'Tarun', 'Shreya', 'Vivek', 'Nitya', 'Rajan', 'Bela', 'Sameer', 'Urvi'
];

const LAST_NAMES = [
  'Chatterjee', 'Iyer', 'Sharma', 'Nair', 'Desai', 'Bose', 'Reddy', 'Kulkarni', 'Menon', 'Banerjee',
  'Rao', 'Pillai', 'Verma', 'Sengupta', 'Patel', 'Ghosh', 'Krishnan', 'Joshi', 'Das', 'Bhatt',
  'Mehta', 'Chauhan', 'Mukherjee', 'Pillai', 'Saxena', 'Trivedi', 'Acharya', 'Dutta', 'Naidu', 'Sinha',
  'Pandey', 'Rathod', 'Sundaram', 'Mishra', 'Barua', 'Kaul', 'Thakur', 'Iyengar', 'Mahajan', 'Sethi'
];

const CITIES = [
  'Kolkata', 'Bengaluru', 'Varanasi', 'Jaipur', 'Chennai', 'Pune', 'Hyderabad', 'Ahmedabad',
  'Kochi', 'Guwahati', 'Bhubaneswar', 'Ujjain', 'Madurai', 'Lucknow', 'Nagpur', 'Patna'
];

// ---------------------------------------------------------------------------
// Craft families: tagline, skills, projects (6), timeline milestones (4)
// ---------------------------------------------------------------------------
const FAMILIES = [
  {
    key: 'dance',
    tagline: 'Where every gesture tells a story older than words.',
    skills: ['Abhinaya expression', 'Nritta technique', 'Stage choreography', 'Classical repertoire', 'Festival productions', 'Guru-led training', ' Costume & aharya', 'Workshop teaching'],
    projects: [
      ['Arangetram Evening', 'A full-length debut performance choreographed for a packed temple auditorium.'],
      ['Navratri Stage Production', 'Nine nights of themed performances blending classical and folk vocabulary.'],
      ['Fusion Ballet Premiere', 'A contemporary retelling of a mythic tale for a city cultural festival.'],
      ['Temple Festival Circuit', 'Seasonal performances across heritage temple stages and sabhas.'],
      ['Online Dance Series', 'A short-form video series teaching core mudras and rhythms to beginners.'],
      ['Charity Gala Showcase', 'A benefit performance raising funds for a rural arts school.']
    ],
    timeline: [
      'Began training under a traditional guru in childhood',
      'Completed arangetram / rangapravesam debut',
      'Founded a small dance workshop for local students',
      'Now performing at festivals across the country'
    ]
  },
  {
    key: 'music',
    tagline: 'Strings and rhythms that carry centuries in a single note.',
    skills: ['Raga improvisation', 'Tala precision', 'Stage performance', 'Ensemble collaboration', 'Recording & mixing', 'Teaching pedagogy', 'Fusion arrangement', 'Devotional repertoire'],
    projects: [
      ['Raga After Dark', 'An intimate candlelit concert series exploring rare evening ragas.'],
      ['Festival Opening Medley', 'A commissioned piece opening a major cultural festival.'],
      ['Album: Courtyard Sessions', 'Live-recorded acoustic album with tabla and tanpura.'],
      ['Bhajan Choir Direction', 'Leading a 30-voice devotional choir through the festive season.'],
      ['Fusion Collab EP', 'Cross-genre EP blending classical strings with modern production.'],
      ['Gurukul Batch', 'A yearly teaching cohort training serious students in fundamentals.']
    ],
    timeline: [
      'First lessons on the family instrument at age six',
      'Ganda bandan / formal initiation under a master',
      'First full-length solo concert',
      'Released debut album and opened a teaching studio'
    ]
  },
  {
    key: 'craft',
    tagline: 'Handmade heritage — one patient piece at a time.',
    skills: ['Traditional technique', 'Natural materials', 'Pattern drafting', 'Colourfast dyeing', 'Custom commissions', 'Quality finishing', 'Exhibition prep', 'Artisan mentoring'],
    projects: [
      ['Bridal Collection 2026', 'A twelve-piece trousseau collection premiered at a wedding expo.'],
      ['Festival Capsule Line', 'Limited edition pieces timed to the festive calendar.'],
      ['Heritage Revival Series', 'Researched and revived a fading regional motif family.'],
      ['Artisan Collab Batch', 'Co-created with a village cluster of fellow craftspeople.'],
      ['Museum Commission', 'A display piece commissioned for a textile and craft gallery.'],
      ['Custom Gifting Studio', 'Personalised handmade gifts for weddings and pujas.']
    ],
    timeline: [
      'Learned the craft inside a family workshop',
      'First independent collection sold out locally',
      'Featured in a national craft exhibition',
      'Opened a studio and began training apprentices'
    ]
  },
  {
    key: 'art',
    tagline: 'Floor to wall — every surface becomes a celebration.',
    skills: ['Freehand line work', 'Natural pigments', 'Composition', 'Large-scale murals', 'Ritual floor art', 'Live art demos', 'Workshops for kids', 'Commission workflow'],
    projects: [
      ['Festival Entrance Rangoli', 'A 20-foot courtyard artwork for a temple festival opening.'],
      ['Wedding Floor Series', 'Bespoke alpona and kolam designs for wedding venues.'],
      ['Gallery Wall Commission', 'A permanent mural installation for a culture centre.'],
      ['Story Scroll Exhibition', 'A travelling exhibition of narrative scroll paintings.'],
      ['School Art Program', 'A year-long program teaching traditional art in schools.'],
      ['Live Festival Art', 'Speed-painting performances streamed during festivals.']
    ],
    timeline: [
      'Drew the first festival floor art with family',
      'First paid mural for a neighbourhood venue',
      'First gallery exhibition and press coverage',
      'Now runs commissions and community workshops'
    ]
  },
  {
    key: 'food',
    tagline: 'Flavours of the festival kitchen, served with warmth.',
    skills: ['Regional recipes', 'Festive menus', 'Bulk catering', 'Sourcing & seasons', 'Presentation', 'Food photography', 'Workshop hosting', 'Hygiene & safety'],
    projects: [
      ['Prasad Menu Design', 'A satvik offering menu crafted for temple celebrations.'],
      ['Diwali Sweet Boxes', 'A sold-out festive gifting collection of handmade mithai.'],
      ['Farm-to-Feast Pop-up', 'Seasonal pop-up dinners celebrating harvest festivals.'],
      ['Wedding Catering Deck', 'Complete festive catering for a 400-guest celebration.'],
      ['Recipe Video Series', 'Short videos recreating grandmother-era festive recipes.'],
      ['Spice Trail Tastings', 'Guided tastings of regional spice blends and pairings.']
    ],
    timeline: [
      'Learned festive cooking in a family kitchen',
      'First catering contract for a community puja',
      'Launched a festive gifting brand',
      'Now runs seasonal pop-ups and a studio kitchen'
    ]
  },
  {
    key: 'spiritual',
    tagline: 'Guiding hearts through ritual, rhythm and reflection.',
    skills: ['Ritual liturgy', 'Sanskrit recitation', 'Muhoorta guidance', 'Counselling', 'Community events', 'Teaching & discourses', 'Interfaith respect', 'Event coordination'],
    projects: [
      ['Annual Puja Handbook', 'A step-by-step festival ritual guide used by 500 families.'],
      ['Shraddha & Sanskar Kit', 'A gentle, well-explained kit for life ceremony rituals.'],
      ['Evening Gita Circle', 'A weekly community study circle now in its sixth year.'],
      ['Festival Calendar Project', 'A beautifully printed panchaanga for the modern household.'],
      ['Heritage Temple Walks', 'Guided walks telling the stories behind city temples.'],
      ['Seva Drives', 'Organising community kitchens during festival seasons.']
    ],
    timeline: [
      'Traditional study under a family guru',
      'Certification in scripture and ritual practice',
      'Began serving a community congregation',
      'Now leads ceremonies, classes and seva projects'
    ]
  },
  {
    key: 'events',
    tagline: 'Turning celebrations into memories that glow forever.',
    skills: ['Theme design', 'Vendor management', 'Budget planning', 'Floral installations', 'Lighting design', 'On-day direction', 'Guest experience', 'Permits & logistics'],
    projects: [
      ['Pandal Concept 2026', 'A full festival pavilion concept with lighting and floral arcs.'],
      ['Wedding Toran Series', 'Handmade garland installations for wedding venues.'],
      ['Diwali Light Trail', 'A walkable light installation through a heritage lane.'],
      ['Corporate Festive Gala', 'A 1,000-guest celebration produced end to end.'],
      ['Community Mela', 'A neighbourhood fair with crafts, food and performances.'],
      ['Eco-Festival Pilot', 'A zero-plastic festival edition with natural decor only.']
    ],
    timeline: [
      'Decorated the first family function',
      'First paid wedding commission',
      'Built a trusted vendor network',
      'Now producing festivals at city scale'
    ]
  },
  {
    key: 'media',
    tagline: 'Stories woven in light, devotion and a well-timed frame.',
    skills: ['Candid photography', 'Cinematic video', 'Colour grading', 'Drone piloting', 'Audio storytelling', 'Editing workflow', 'Social publishing', 'Client direction'],
    projects: [
      ['Festival Photo Essays', 'A published series documenting street celebrations in four cities.'],
      ['Wedding Film Reel', 'Signature same-day edit films for festive weddings.'],
      ['Mythology Podcast', 'A weekly audio retelling of epics with 50k monthly listeners.'],
      ['Temple Architecture Series', 'A documentary short series on living heritage.'],
      ['Brand Festive Campaigns', 'Campaign shoots for home-grown festive brands.'],
      ['Aerial Yatra Film', 'Drone journeys along pilgrimage routes.']
    ],
    timeline: [
      'Shot the first festival on a borrowed camera',
      'First published photo essay',
      'Launched an independent studio',
      'Now producing films, podcasts and campaigns'
    ]
  },
  {
    key: 'fashion',
    tagline: 'Draped, stitched and polished — festive elegance, your way.',
    skills: ['Drape styling', 'Custom fitting', 'Fabric sourcing', 'Bridal looks', 'Jewellery pairing', 'Trend research', 'Boutique ops', 'Client consultations'],
    projects: [
      ['Bridal Lookbook 2026', 'A festive trousseau lookbook shot across heritage locations.'],
      ['Festive Capsule Edit', 'A mix-and-match capsule for the wedding season.'],
      ['Heritage Weave Revival', 'Partnered with weavers to bring back a classic weave.'],
      ['Celebrity Festive Styling', 'Red-carpet and telecast looks for the festive season.'],
      ['Boutique Launch', 'A studio boutique for made-to-measure festive wear.'],
      ['Accessorising Masterclass', 'A styling masterclass covering jewellery and drapes.']
    ],
    timeline: [
      'Styled the first family wedding',
      'Certification in fashion design',
      'Opened a boutique studio',
      'Now styling clients for the biggest festive stages'
    ]
  },
  {
    key: 'wellness',
    tagline: 'Balance for body, breath and spirit — festival to everyday.',
    skills: ['Guided practice', 'Therapy planning', 'Herbal knowledge', 'Breathwork', 'Retreat hosting', 'One-on-one care', 'Group classes', 'Ayurvedic nutrition'],
    projects: [
      ['Festival Reset Retreat', 'A post-festival detox and rest weekend retreat.'],
      ['Morning Sadhana Club', 'A daily community breath and movement practice.'],
      ['Ayurveda Winter Series', 'Seasonal wellness workshops with warm herbal recipes.'],
      ['Sound Bath Evenings', 'Immersive singing-bowl sessions by lamplight.'],
      ['Village Wellness Stay', 'A farmstay retreat with traditional therapies.'],
      ['Corporate Calm Program', 'Workplace wellbeing sessions during festive crunch.']
    ],
    timeline: [
      'Personal practice turned into a calling',
      'Formal certification in therapy and teaching',
      'Opened a calm studio space',
      'Now hosting retreats and community programs'
    ]
  }
];

// ---------------------------------------------------------------------------
// Palettes (25). Each fully specifies the template :root variables + SVG tints.
// light=true flips surfaces/text for daylight themes.
// ---------------------------------------------------------------------------
const PALETTES = [
  { name: 'marigold-dawn', bg: '#1a0e02', bg2: '#2a1604', surface: 'rgba(42,22,4,.72)', primary: '#e9780c', accent2: '#f6931f', gold: '#fbbf24', text: '#fff7e6', muted: '#d8c3a5', border: 'rgba(251,191,36,.28)', light: false, fx: { petal: '#fffaf0', edge: 'rgba(255,236,210,.5)', core: '#ff7a1f', bud: '#ff7a1f' } },
  { name: 'ratri-diya', bg: '#0d0a14', bg2: '#1a1330', surface: 'rgba(26,19,48,.75)', primary: '#f59e0b', accent2: '#a78bfa', gold: '#fbbf24', text: '#f4f1ff', muted: '#b6aed6', border: 'rgba(167,139,250,.3)', light: false, fx: { petal: '#fdf6ff', edge: 'rgba(233,213,255,.45)', core: '#fbbf24', bud: '#e9d5ff' } },
  { name: 'kumkum-crimson', bg: '#1c0507', bg2: '#33090d', surface: 'rgba(51,9,13,.75)', primary: '#dc2626', accent2: '#ef4444', gold: '#fbbf24', text: '#fff1f0', muted: '#e5b8b4', border: 'rgba(251,191,36,.3)', light: false, fx: { petal: '#fff5f0', edge: 'rgba(255,220,200,.5)', core: '#fbbf24', bud: '#fbbf24' } },
  { name: 'gulal-rose', bg: '#2a0d18', bg2: '#421527', surface: 'rgba(66,21,39,.72)', primary: '#f472b6', accent2: '#fb7185', gold: '#fcd34d', text: '#fff0f6', muted: '#e9c3d2', border: 'rgba(244,114,182,.32)', light: false, fx: { petal: '#fff0f6', edge: 'rgba(251,207,232,.5)', core: '#fbbf24', bud: '#fda4af' } },
  { name: 'sandal-cream', bg: '#faf3e3', bg2: '#f3e7cd', surface: 'rgba(255,255,255,.78)', primary: '#b45309', accent2: '#d97706', gold: '#92400e', text: '#3a2a1a', muted: '#7c6a52', border: 'rgba(180,83,9,.25)', light: true, fx: { petal: '#e9780c', edge: 'rgba(180,83,9,.35)', core: '#b45309', bud: '#d97706' } },
  { name: 'peacock-utsav', bg: '#041f22', bg2: '#083a3c', surface: 'rgba(8,58,60,.72)', primary: '#14b8a6', accent2: '#2dd4bf', gold: '#fbbf24', text: '#effffa', muted: '#a8d8d2', border: 'rgba(20,184,166,.35)', light: false, fx: { petal: '#ecfffb', edge: 'rgba(153,246,228,.5)', core: '#fbbf24', bud: '#5eead4' } },
  { name: 'indigo-mela', bg: '#101433', bg2: '#1c2452', surface: 'rgba(28,36,82,.75)', primary: '#818cf8', accent2: '#a5b4fc', gold: '#fbbf24', text: '#eef2ff', muted: '#b6bcf0', border: 'rgba(129,140,248,.35)', light: false, fx: { petal: '#eef2ff', edge: 'rgba(199,210,254,.5)', core: '#fbbf24', bud: '#c7d2fe' } },
  { name: 'emerald-temple', bg: '#04170d', bg2: '#0a2e1a', surface: 'rgba(10,46,26,.75)', primary: '#34d399', accent2: '#6ee7b7', gold: '#fcd34d', text: '#ecfdf5', muted: '#a7d8bd', border: 'rgba(52,211,153,.3)', light: false, fx: { petal: '#ecfdf5', edge: 'rgba(167,243,208,.5)', core: '#fcd34d', bud: '#6ee7b7' } },
  { name: 'brass-ember', bg: '#191006', bg2: '#2b1c0a', surface: 'rgba(43,28,10,.75)', primary: '#d97706', accent2: '#f59e0b', gold: '#fde68a', text: '#fffbeb', muted: '#dbc39c', border: 'rgba(253,230,138,.3)', light: false, fx: { petal: '#fffbeb', edge: 'rgba(253,230,138,.5)', core: '#d97706', bud: '#f59e0b' } },
  { name: 'lotus-blush', bg: '#200a12', bg2: '#38121f', surface: 'rgba(56,18,31,.75)', primary: '#fb7185', accent2: '#fda4af', gold: '#fcd34d', text: '#fff1f2', muted: '#e8c1c8', border: 'rgba(251,113,133,.32)', light: false, fx: { petal: '#fff1f2', edge: 'rgba(254,205,211,.5)', core: '#fbbf24', bud: '#fda4af' } },
  { name: 'holi-canvas', bg: '#1b1030', bg2: '#2d1a4d', surface: 'rgba(45,26,77,.75)', primary: '#f472b6', accent2: '#34d399', gold: '#fde047', text: '#fdf4ff', muted: '#cfc3e8', border: 'rgba(253,224,71,.3)', light: false, fx: { petal: '#fdf4ff', edge: 'rgba(240,171,252,.5)', core: '#fde047', bud: '#f0abfc' } },
  { name: 'pongal-harvest', bg: '#1f1802', bg2: '#36290a', surface: 'rgba(54,41,10,.75)', primary: '#eab308', accent2: '#facc15', gold: '#fde047', text: '#fefce8', muted: '#d9cc9a', border: 'rgba(250,204,21,.3)', light: false, fx: { petal: '#fefce8', edge: 'rgba(254,240,138,.5)', core: '#eab308', bud: '#facc15' } },
  { name: 'onam-pookalam', bg: '#0f2410', bg2: '#1a3d1c', surface: 'rgba(26,61,28,.75)', primary: '#fbbf24', accent2: '#ef4444', gold: '#fde047', text: '#f7fee7', muted: '#bcd9a8', border: 'rgba(251,191,36,.32)', light: false, fx: { petal: '#fef9c3', edge: 'rgba(254,240,138,.5)', core: '#ef4444', bud: '#fca5a5' } },
  { name: 'baisakhi-wheat', bg: '#221a04', bg2: '#3a2e0c', surface: 'rgba(58,46,12,.75)', primary: '#d97706', accent2: '#65a30d', gold: '#fde047', text: '#fefee8', muted: '#d6c48e', border: 'rgba(101,163,13,.35)', light: false, fx: { petal: '#fefee8', edge: 'rgba(254,249,195,.5)', core: '#d97706', bud: '#a3e635' } },
  { name: 'pushpa-ivory', bg: '#fdf8ef', bg2: '#f5ecd8', surface: 'rgba(255,255,255,.82)', primary: '#ea580c', accent2: '#c2410c', gold: '#b45309', text: '#422006', muted: '#8a6f4d', border: 'rgba(234,88,12,.25)', light: true, fx: { petal: '#fb923c', edge: 'rgba(194,65,12,.4)', core: '#b45309', bud: '#f97316' } },
  { name: 'karwa-moon', bg: '#131024', bg2: '#221d3e', surface: 'rgba(34,29,62,.78)', primary: '#c084fc', accent2: '#d8b4fe', gold: '#fbbf24', text: '#faf5ff', muted: '#c3b8e8', border: 'rgba(192,132,252,.32)', light: false, fx: { petal: '#faf5ff', edge: 'rgba(233,213,255,.5)', core: '#fbbf24', bud: '#e9d5ff' } },
  { name: 'rakhi-candy', bg: '#240a14', bg2: '#3d1224', surface: 'rgba(61,18,36,.75)', primary: '#f43f5e', accent2: '#22d3ee', gold: '#fbbf24', text: '#fff1f2', muted: '#e5bfc9', border: 'rgba(244,63,94,.32)', light: false, fx: { petal: '#fff1f2', edge: 'rgba(254,205,211,.5)', core: '#22d3ee', bud: '#fda4af' } },
  { name: 'neon-utsav', bg: '#05060e', bg2: '#0d1024', surface: 'rgba(13,16,36,.8)', primary: '#22d3ee', accent2: '#f472b6', gold: '#fde047', text: '#e0f7ff', muted: '#93b8cc', border: 'rgba(34,211,238,.35)', light: false, fx: { petal: '#e0f7ff', edge: 'rgba(165,243,252,.5)', core: '#fde047', bud: '#a5f3fc' } },
  { name: 'kolam-rice', bg: '#f6f1e7', bg2: '#ece2cd', surface: 'rgba(255,255,255,.85)', primary: '#1d4ed8', accent2: '#dc2626', gold: '#b45309', text: '#1e2a52', muted: '#6b7194', border: 'rgba(29,78,216,.22)', light: true, fx: { petal: '#dc2626', edge: 'rgba(29,78,216,.35)', core: '#b45309', bud: '#1d4ed8' } },
  { name: 'terracotta-earth', bg: '#1e120c', bg2: '#331f14', surface: 'rgba(51,31,20,.75)', primary: '#c2703d', accent2: '#e08d5a', gold: '#eab308', text: '#fdf3ea', muted: '#d4b49c', border: 'rgba(194,112,61,.35)', light: false, fx: { petal: '#fdf3ea', edge: 'rgba(253,243,234,.45)', core: '#c2703d', bud: '#e08d5a' } },
  { name: 'vastu-teal', bg: '#0a1a1a', bg2: '#123232', surface: 'rgba(18,50,50,.75)', primary: '#2dd4bf', accent2: '#5eead4', gold: '#fbbf24', text: '#f0fdfa', muted: '#a5d0cb', border: 'rgba(45,212,191,.3)', light: false, fx: { petal: '#f0fdfa', edge: 'rgba(153,246,228,.5)', core: '#fbbf24', bud: '#5eead4' } },
  { name: 'mehndi-henna', bg: '#171009', bg2: '#291d0f', surface: 'rgba(41,29,15,.78)', primary: '#a16207', accent2: '#65a30d', gold: '#d97706', text: '#fefce8', muted: '#cbb98d', border: 'rgba(161,98,7,.35)', light: false, fx: { petal: '#fefce8', edge: 'rgba(217,119,6,.4)', core: '#65a30d', bud: '#a3e635' } },
  { name: 'surya-saffron', bg: '#201004', bg2: '#381d08', surface: 'rgba(56,29,8,.75)', primary: '#f97316', accent2: '#fb923c', gold: '#fbbf24', text: '#fff7ed', muted: '#e0c4a4', border: 'rgba(249,115,22,.32)', light: false, fx: { petal: '#fff7ed', edge: 'rgba(255,237,213,.5)', core: '#f97316', bud: '#fb923c' } },
  { name: 'shankh-pearl', bg: '#f4f4f0', bg2: '#e8e8df', surface: 'rgba(255,255,255,.85)', primary: '#9333ea', accent2: '#c084fc', gold: '#b45309', text: '#3b0764', muted: '#7e6a99', border: 'rgba(147,51,234,.22)', light: true, fx: { petal: '#9333ea', edge: 'rgba(59,7,100,.3)', core: '#b45309', bud: '#c084fc' } },
  { name: 'meenakari-blue', bg: '#071c2e', bg2: '#0d3049', surface: 'rgba(13,48,73,.75)', primary: '#38bdf8', accent2: '#f43f5e', gold: '#fbbf24', text: '#f0f9ff', muted: '#a3c8e0', border: 'rgba(56,189,248,.32)', light: false, fx: { petal: '#f0f9ff', edge: 'rgba(186,230,253,.5)', core: '#fbbf24', bud: '#7dd3fc' } }
];

// Patterns: 0 mandala-a, 1 mandala-b, 2 rangoli-rings, 3 lotus, 4 temple-scallop, 5 starfield
const PATTERN_COUNT = 6;
const LAYOUT_COUNT = 3;
const FONT_COUNT = 4;

// ---------------------------------------------------------------------------
// 100 rows:
// [themeSlug, 'Theme Name', 'role-slug', 'Role Display', paletteIdx, familyIdx, patternIdx, layoutIdx, fontIdx]
// ---------------------------------------------------------------------------
const ROWS = [
  ['marigold-dawn', 'Marigold Dawn', 'bharatanatyam-dancer', 'Bharatanatyam Dancer', 0, 0, 0, 0, 0],
  ['ratri-diya', 'Ratri Diya', 'kathak-dancer', 'Kathak Dancer', 1, 0, 1, 1, 1],
  ['kumkum-glow', 'Kumkum Glow', 'odissi-dancer', 'Odissi Dancer', 2, 0, 2, 2, 0],
  ['gulal-bloom', 'Gulal Bloom', 'kuchipudi-dancer', 'Kuchipudi Dancer', 3, 0, 3, 0, 2],
  ['temple-emerald', 'Temple Emerald', 'kathakali-performer', 'Kathakali Performer', 7, 0, 4, 1, 3],
  ['lotus-blush', 'Lotus Blush', 'mohiniyattam-dancer', 'Mohiniyattam Dancer', 9, 0, 5, 2, 1],
  ['neon-utsav', 'Neon Utsav', 'bollywood-choreographer', 'Bollywood Choreographer', 17, 0, 0, 0, 3],
  ['vivaha-ribbon', 'Vivaha Ribbon', 'sangeet-choreographer', 'Sangeet Choreographer', 15, 0, 1, 1, 0],
  ['alpona-night', 'Alpona Night', 'folk-theatre-artist', 'Folk Theatre Artist', 18, 0, 2, 2, 2],
  ['nritya-guru', 'Nritya Gurukul', 'dance-school-teacher', 'Dance School Guru', 5, 0, 3, 0, 1],
  ['taal-amber', 'Taal Amber', 'carnatic-vocalist', 'Carnatic Vocalist', 8, 1, 4, 1, 2],
  ['strings-of-dawn', 'Strings of Dawn', 'hindustani-vocalist', 'Hindustani Vocalist', 23, 1, 5, 2, 0],
  ['mridanga-beat', 'Mridanga Beat', 'tabla-maestro', 'Tabla Maestro', 19, 1, 0, 0, 3],
  ['veena-twilight', 'Veena Twilight', 'sitar-artist', 'Sitar Artist', 1, 1, 1, 1, 1],
  ['bansuri-breeze', 'Bansuri Breeze', 'bansuri-flautist', 'Bansuri Flautist', 6, 1, 2, 2, 2],
  ['santoor-springs', 'Santoor Springs', 'santoor-player', 'Santoor Player', 15, 1, 3, 0, 0],
  ['kalahasti-strings', 'Kalahasti Strings', 'veena-artist', 'Veena Artist', 24, 1, 4, 1, 3],
  ['dhol-thunder', 'Dhol Thunder', 'dhol-percussionist', 'Dhol Percussionist', 13, 1, 5, 2, 1],
  ['kirtan-lamplight', 'Kirtan Lamplight', 'kirtan-leader', 'Kirtan Leader', 11, 1, 0, 0, 2],
  ['sangeet-scholar', 'Sangeet Scholar', 'music-school-teacher', 'Music School Guru', 21, 1, 1, 1, 0],
  ['mehndi-vine', 'Mehndi Vine', 'mehndi-artist', 'Mehndi Artist', 21, 2, 2, 2, 1],
  ['loom-of-gold', 'Loom of Gold', 'sari-weaver', 'Sari Weaver', 0, 2, 3, 0, 3],
  ['block-bazaar', 'Block Bazaar', 'block-print-artist', 'Block Print Artist', 12, 2, 4, 1, 2],
  ['zardozi-night', 'Zardozi Night', 'zardozi-embroiderer', 'Zardozi Embroiderer', 2, 2, 5, 2, 0],
  ['phulkari-sky', 'Phulkari Sky', 'phulkari-artist', 'Phulkari Artist', 16, 2, 0, 0, 3],
  ['chikankari-dew', 'Chikankari Dew', 'chikankari-embroiderer', 'Chikankari Embroiderer', 4, 2, 1, 1, 1],
  ['mitti-clay', 'Mitti Clay', 'terracotta-potter', 'Terracotta Potter', 19, 2, 2, 2, 2],
  ['neel-pottery', 'Neel Pottery', 'blue-pottery-artist', 'Blue Pottery Artist', 24, 2, 3, 0, 0],
  ['deepak-brass', 'Deepak Brass', 'brass-lamp-maker', 'Brass Lamp Maker', 8, 2, 4, 1, 3],
  ['murti-marble', 'Murti Marble', 'idol-sculptor', 'Idol Sculptor', 22, 2, 5, 2, 2],
  ['madhubani-dawn', 'Madhubani Dawn', 'madhubani-painter', 'Madhubani Painter', 12, 3, 0, 0, 0],
  ['warli-earth', 'Warli Earth', 'warli-artist', 'Warli Artist', 4, 3, 1, 1, 1],
  ['patua-scroll', 'Patua Scroll', 'patachitra-artist', 'Patachitra Artist', 2, 3, 2, 2, 2],
  ['kalamkari-flow', 'Kalamkari Flow', 'kalamkari-artist', 'Kalamkari Artist', 20, 3, 3, 0, 3],
  ['tanjore-radiance', 'Tanjore Radiance', 'tanjore-painter', 'Tanjore Painter', 2, 3, 4, 1, 0],
  ['mughal-miniature', 'Mughal Miniature', 'miniature-painter', 'Miniature Painter', 24, 3, 5, 2, 1],
  ['fresco-mural', 'Fresco Mural', 'mural-artist', 'Mural Artist', 14, 3, 0, 0, 2],
  ['rangoli-bloom', 'Rangoli Bloom', 'rangoli-artist', 'Rangoli Artist', 18, 3, 1, 1, 3],
  ['pookalam-petal', 'Pookalam Petal', 'pookalam-artist', 'Pookalam Artist', 12, 3, 2, 2, 1],
  ['chitra-star', 'Chitra Star', 'mythology-illustrator', 'Mythology Illustrator', 1, 3, 3, 0, 0],
  ['mithai-sugar', 'Mithai Sugar', 'mithai-chef', 'Mithai Chef', 10, 4, 4, 1, 2],
  ['satvik-garden', 'Satvik Garden', 'satvik-chef', 'Satvik Chef', 6, 4, 5, 2, 0],
  ['chaat-masala', 'Chaat Masala', 'chaat-chef', 'Chaat Chef', 22, 4, 0, 0, 3],
  ['spice-route', 'Spice Route', 'spice-merchant', 'Spice Merchant', 8, 4, 1, 1, 1],
  ['chai-twilight', 'Chai Twilight', 'chai-sommelier', 'Chai Sommelier', 21, 4, 2, 2, 2],
  ['thandai-frost', 'Thandai Frost', 'thandai-maestro', 'Thandai Maestro', 15, 4, 3, 0, 0],
  ['plantain-leaf', 'Plantain Leaf', 'banana-leaf-caterer', 'Banana Leaf Caterer', 6, 4, 4, 1, 3],
  ['halwai-gold', 'Halwai Gold', 'sweet-boutique-owner', 'Sweet Boutique Owner', 11, 4, 5, 2, 1],
  ['rasoi-story', 'Rasoi Story', 'food-blogger', 'Food Blogger', 14, 4, 0, 0, 2],
  ['annam-harvest', 'Annam Harvest', 'harvest-farm-host', 'Harvest Farm Host', 13, 4, 1, 1, 0],
  ['pandit-path', 'Pandit Path', 'temple-priest', 'Temple Priest', 22, 5, 2, 2, 1],
  ['veda-voice', 'Veda Voice', 'vedic-chanting-teacher', 'Vedic Chanting Teacher', 9, 5, 3, 0, 3],
  ['shloka-light', 'Shloka Light', 'sanskrit-scholar', 'Sanskrit Scholar', 4, 5, 4, 1, 2],
  ['jyotish-night', 'Jyotish Night', 'jyotish-astrologer', 'Jyotish Astrologer', 1, 5, 5, 2, 0],
  ['vastu-grid', 'Vastu Grid', 'vastu-consultant', 'Vastu Consultant', 20, 5, 0, 0, 3],
  ['dhyan-still', 'Dhyan Still', 'meditation-teacher', 'Meditation Teacher', 5, 5, 1, 1, 1],
  ['rekha-palm', 'Rekha Palm', 'palmistry-reader', 'Palmistry Reader', 16, 5, 2, 2, 2],
  ['katha-night', 'Katha Night', 'mythology-storyteller', 'Mythology Storyteller', 2, 5, 3, 0, 0],
  ['tirtha-walk', 'Tirtha Walk', 'heritage-walk-guide', 'Heritage Walk Guide', 9, 5, 4, 1, 1],
  ['seva-dawn', 'Seva Dawn', 'seva-organizer', 'Seva Organizer', 12, 5, 5, 2, 2],
  ['vivaha-gold', 'Vivaha Gold', 'wedding-planner', 'Wedding Planner', 2, 6, 0, 0, 0],
  ['utsav-pulse', 'Utsav Pulse', 'festival-organizer', 'Festival Organizer', 17, 6, 1, 1, 3],
  ['pandal-glow', 'Pandal Glow', 'pandal-decorator', 'Pandal Decorator', 0, 6, 2, 2, 1],
  ['malai-string', 'Malai String', 'garland-maker', 'Garland Maker', 10, 6, 3, 0, 2],
  ['pushpa-lane', 'Pushpa Lane', 'flower-boutique-owner', 'Flower Boutique Owner', 3, 6, 4, 1, 0],
  ['roshni-beam', 'Roshni Beam', 'light-sound-designer', 'Light & Sound Designer', 17, 6, 5, 2, 3],
  ['haldi-hour', 'Haldi Hour', 'henna-ceremony-host', 'Henna Ceremony Host', 13, 6, 0, 0, 1],
  ['thali-art', 'Thali Art', 'puja-thali-designer', 'Puja Thali Designer', 9, 6, 1, 1, 2],
  ['deep-orbit', 'Deep Orbit', 'diya-installation-artist', 'Diya Installation Artist', 15, 6, 2, 2, 0],
  ['utsav-host', 'Utsav Host', 'community-utsav-host', 'Community Utsav Host', 5, 6, 3, 0, 3],
  ['shaadi-frame', 'Shaadi Frame', 'wedding-photographer', 'Wedding Photographer', 2, 7, 4, 1, 1],
  ['utsav-lens', 'Utsav Lens', 'festive-videographer', 'Festive Videographer', 16, 7, 5, 2, 2],
  ['ganga-reel', 'Ganga Reel', 'documentary-filmmaker', 'Documentary Filmmaker', 9, 7, 0, 0, 0],
  ['katha-mic', 'Katha Mic', 'mythology-podcaster', 'Mythology Podcaster', 1, 7, 1, 1, 3],
  ['nagari-press', 'Nagari Press', 'culture-journalist', 'Culture Journalist', 23, 7, 2, 2, 1],
  ['chitra-comic', 'Chitra Comic', 'comic-artist', 'Comic Artist', 18, 7, 3, 0, 2],
  ['itihasa-pixel', 'Itihasa Pixel', 'game-artist', 'Game Artist', 17, 7, 4, 1, 0],
  ['festive-feed', 'Festive Feed', 'fashion-influencer', 'Fashion Influencer', 3, 7, 5, 2, 3],
  ['akash-lens', 'Akash Lens', 'drone-filmmaker', 'Drone Filmmaker', 6, 7, 0, 0, 1],
  ['sangrahalaya-hall', 'Sangrahalaya Hall', 'museum-curator', 'Museum Curator', 4, 7, 1, 1, 2],
  ['kanya-silk', 'Kanya Silk', 'bridal-makeup-artist', 'Bridal Makeup Artist', 3, 8, 2, 2, 0],
  ['drape-duchess', 'Drape Duchess', 'ethnic-wear-stylist', 'Ethnic Wear Stylist', 15, 8, 3, 0, 3],
  ['lehenga-luxe', 'Lehenga Luxe', 'lehenga-boutique-owner', 'Lehenga Boutique Owner', 9, 8, 4, 1, 1],
  ['sherwani-line', 'Sherwani Line', 'sherwani-tailor', 'Sherwani Tailor', 7, 8, 5, 2, 2],
  ['kundan-fire', 'Kundan Fire', 'jewellery-designer', 'Jewellery Designer', 2, 8, 0, 0, 0],
  ['sunar-spark', 'Sunar Spark', 'goldsmith', 'Goldsmith', 8, 8, 1, 1, 3],
  ['chudi-rainbow', 'Chudi Rainbow', 'bangle-artisan', 'Bangle Artisan', 10, 8, 2, 2, 1],
  ['kanchi-silk', 'Kanchi Silk', 'silk-boutique-owner', 'Silk Sari Boutique Owner', 6, 8, 3, 0, 2],
  ['resham-care', 'Resham Care', 'textile-conservator', 'Textile Conservator', 4, 8, 4, 1, 0],
  ['ittar-breeze', 'Ittar Breeze', 'attar-perfumer', 'Attar Perfumer', 20, 8, 5, 2, 3],
  ['ayur-veda', 'Ayur Veda', 'ayurveda-doctor', 'Ayurveda Doctor', 6, 9, 0, 0, 1],
  ['pran-wind', 'Pran Wind', 'yoga-guru', 'Yoga Guru', 22, 9, 1, 1, 2],
  ['pranayama-flow', 'Pranayama Flow', 'pranayama-coach', 'Pranayama Coach', 20, 9, 3, 0, 2],
  ['nada-om', 'Nada Om', 'sound-healer', 'Sound Healer', 1, 9, 2, 2, 0],
  ['jadi-booti', 'Jadi Booti', 'herbal-remedies-guide', 'Herbal Remedies Guide', 12, 9, 3, 0, 3],
  ['shanti-ashram', 'Shanti Ashram', 'wellness-retreat-host', 'Wellness Retreat Host', 5, 9, 4, 1, 1],
  ['gram-yatra', 'Gram Yatra', 'village-tourism-host', 'Village Tourism Host', 13, 9, 5, 2, 2],
  ['abhyanga-calm', 'Abhyanga Calm', 'ayurveda-therapist', 'Ayurveda Therapist', 19, 9, 0, 0, 0],
  ['natya-heal', 'Natya Heal', 'natya-therapy-coach', 'Natya Therapy Coach', 3, 9, 1, 1, 3],
  ['arogya-path', 'Arogya Path', 'holistic-lifestyle-blogger', 'Arogya Lifestyle Blogger', 14, 9, 2, 2, 1]
];

// ---------------------------------------------------------------------------
// Worldwide palettes (25-39) for world-festival groups
// ---------------------------------------------------------------------------
const PALETTES_W = [
  { name: 'christmas-hearth', bg: '#0a1410', bg2: '#12241a', surface: 'rgba(18,36,26,.75)', primary: '#d62828', accent2: '#2a9d8f', gold: '#f4d58d', text: '#fff8ec', muted: '#c5cdb8', border: 'rgba(244,213,141,.3)', light: false, fx: { petal: '#eaf4ff', edge: 'rgba(255,255,255,.5)', core: '#f4d58d', bud: '#f4d58d' } },
  { name: 'winter-ice', bg: '#0b1626', bg2: '#12233c', surface: 'rgba(18,35,60,.78)', primary: '#7dd3fc', accent2: '#bae6fd', gold: '#e2e8f0', text: '#f0f9ff', muted: '#9fb6cc', border: 'rgba(125,211,252,.3)', light: false, fx: { petal: '#eaf4ff', edge: 'rgba(255,255,255,.6)', core: '#bae6fd', bud: '#eaf4ff' } },
  { name: 'halloween-dusk', bg: '#120a1e', bg2: '#1d0f30', surface: 'rgba(29,15,48,.78)', primary: '#f97316', accent2: '#a855f7', gold: '#facc15', text: '#fdf4ff', muted: '#b8a6d6', border: 'rgba(168,85,247,.32)', light: false, fx: { petal: '#fdba74', edge: 'rgba(250,204,21,.4)', core: '#a855f7', bud: '#f97316' } },
  { name: 'dia-muertos', bg: '#1e0a2e', bg2: '#2e1244', surface: 'rgba(46,18,68,.75)', primary: '#f472b6', accent2: '#fb923c', gold: '#fde047', text: '#fdf2f8', muted: '#d8bde8', border: 'rgba(244,114,182,.32)', light: false, fx: { petal: '#fb923c', edge: 'rgba(253,224,71,.5)', core: '#f472b6', bud: '#fde047' } },
  { name: 'carnival-rio', bg: '#0e1030', bg2: '#171a45', surface: 'rgba(23,26,69,.75)', primary: '#22c55e', accent2: '#facc15', gold: '#38bdf8', text: '#f7fee7', muted: '#b4c4e0', border: 'rgba(250,204,21,.3)', light: false, fx: { petal: '#facc15', edge: 'rgba(255,255,255,.5)', core: '#22c55e', bud: '#38bdf8' } },
  { name: 'mardi-gras', bg: '#170a2e', bg2: '#241145', surface: 'rgba(36,17,69,.75)', primary: '#a855f7', accent2: '#22c55e', gold: '#facc15', text: '#faf5ff', muted: '#c3b2e0', border: 'rgba(250,204,21,.3)', light: false, fx: { petal: '#facc15', edge: 'rgba(255,255,255,.5)', core: '#22c55e', bud: '#a855f7' } },
  { name: 'eid-emerald', bg: '#05140e', bg2: '#0a2418', surface: 'rgba(10,36,24,.76)', primary: '#10b981', accent2: '#fbbf24', gold: '#fcd34d', text: '#ecfdf5', muted: '#a7d0bb', border: 'rgba(16,185,129,.32)', light: false, fx: { petal: '#fefce8', edge: 'rgba(252,211,77,.5)', core: '#fbbf24', bud: '#10b981' } },
  { name: 'hanukkah-night', bg: '#0a1230', bg2: '#101c48', surface: 'rgba(16,28,72,.78)', primary: '#60a5fa', accent2: '#e2e8f0', gold: '#fbbf24', text: '#eff6ff', muted: '#a5b4d4', border: 'rgba(96,165,250,.32)', light: false, fx: { petal: '#dbeafe', edge: 'rgba(255,255,255,.55)', core: '#fbbf24', bud: '#e2e8f0' } },
  { name: 'lunar-crimson', bg: '#1c0605', bg2: '#32100c', surface: 'rgba(50,16,12,.75)', primary: '#ef4444', accent2: '#fbbf24', gold: '#fde047', text: '#fef2f2', muted: '#e2b8a9', border: 'rgba(251,191,36,.32)', light: false, fx: { petal: '#fef2f2', edge: 'rgba(254,224,71,.5)', core: '#fbbf24', bud: '#ef4444' } },
  { name: 'midautumn-amber', bg: '#131a2e', bg2: '#1d2745', surface: 'rgba(29,39,69,.76)', primary: '#f59e0b', accent2: '#fcd34d', gold: '#fde68a', text: '#fffbeb', muted: '#aeb9d6', border: 'rgba(245,158,11,.32)', light: false, fx: { petal: '#fffbeb', edge: 'rgba(253,230,138,.5)', core: '#f59e0b', bud: '#fcd34d' } },
  { name: 'sakura-hanami', bg: '#fdf0f4', bg2: '#f9dfe8', surface: 'rgba(255,255,255,.82)', primary: '#db2777', accent2: '#f472b6', gold: '#b45309', text: '#4a2436', muted: '#8f6b7c', border: 'rgba(219,39,119,.22)', light: true, fx: { petal: '#f9a8c9', edge: 'rgba(219,39,119,.35)', core: '#c2415a', bud: '#f472b6' } },
  { name: 'matsuri-indigo', bg: '#101326', bg2: '#181d3a', surface: 'rgba(24,29,58,.76)', primary: '#818cf8', accent2: '#f43f5e', gold: '#fbbf24', text: '#eef2ff', muted: '#a7add4', border: 'rgba(129,140,248,.32)', light: false, fx: { petal: '#fbbf24', edge: 'rgba(244,63,94,.4)', core: '#f43f5e', bud: '#818cf8' } },
  { name: 'oktoberfest-bavaria', bg: '#102a43', bg2: '#1a3a5c', surface: 'rgba(26,58,92,.75)', primary: '#3b82f6', accent2: '#93c5fd', gold: '#d97706', text: '#f0f9ff', muted: '#a9c3dd', border: 'rgba(59,130,246,.3)', light: false, fx: { petal: '#fbbf24', edge: 'rgba(255,255,255,.5)', core: '#d97706', bud: '#93c5fd' } },
  { name: 'harvest-gold', bg: '#1f1403', bg2: '#362408', surface: 'rgba(54,36,8,.75)', primary: '#ea580c', accent2: '#ca8a04', gold: '#facc15', text: '#fefce8', muted: '#d6c49a', border: 'rgba(250,204,21,.3)', light: false, fx: { petal: '#fefce8', edge: 'rgba(250,204,21,.5)', core: '#ea580c', bud: '#ca8a04' } },
  { name: 'nowruz-persian', bg: '#062a2e', bg2: '#0a3d40', surface: 'rgba(10,61,64,.75)', primary: '#14b8a6', accent2: '#ef4444', gold: '#fbbf24', text: '#f0fdfa', muted: '#a3cfcb', border: 'rgba(20,184,166,.32)', light: false, fx: { petal: '#fbbf24', edge: 'rgba(239,68,68,.4)', core: '#ef4444', bud: '#14b8a6' } }
];

// ---------------------------------------------------------------------------
// Western persona pools (worldwide rows)
// ---------------------------------------------------------------------------
const FIRST_W = [
  'Emma', 'Noah', 'Olivia', 'Liam', 'Sofia', 'Mateo', 'Ava', 'Lucas', 'Isabella', 'Ethan',
  'Mia', 'Leo', 'Amelia', 'Hugo', 'Valentina', 'Gabriel', 'Clara', 'Diego', 'Luna', 'Oliver',
  'Aria', 'Felix', 'Nora', 'Oscar', 'Elena', 'Marco', 'Iris', 'Theo', 'Rosa', 'Julian',
  'Freya', 'Anton', 'Greta', 'Nikolai', 'Camila', 'Rafael', 'Sylvie', 'Bram', 'Anouk', 'Stefan',
  'Paloma', 'Casper', 'Ingrid', 'Tomas', 'Bianca', 'Andre', 'Elif', 'Marcus', 'Freja', 'Dario',
  'Yara', 'Kenji', 'Amara', 'Mateus', 'Anika', 'Jorge', 'Selma', 'Viktor', 'Lucia', 'Emil'
];

const LAST_W = [
  'Laurent', 'Moretti', 'Hansen', 'Silva', 'Novak', 'Kowalski', 'Fischer', 'Rossi', 'Dubois', 'Andersen',
  'Costa', 'Weber', 'Lindholm', 'Marino', 'Petrov', 'Meyer', 'Vargas', 'Schmidt', 'Jansen', 'Romano',
  'Larsen', 'Garcia', 'Baumann', 'Costa', 'Ivanov', 'Keller', 'Morales', 'Wagner', 'Berg', 'Conti',
  'Nilsson', 'Torres', 'Kruger', 'Popov', 'Delgado', 'Barros', 'Renard', 'Esposito', 'Visser', 'Lang',
  'Vidal', 'Nyberg', 'Santos', 'Kovacs', 'Pereira', 'Lambert', 'Yilmaz', 'Olsen', 'Ferrari', 'Klein'
];

// ---------------------------------------------------------------------------
// Worldwide festival groups: each pins a garland/float/pattern/footer mode
// ---------------------------------------------------------------------------
const GROUPS = [
  { key: 'christmas', label: 'Christmas & Winter', pal: 0, garland: 'pine', float: 'snow', footer: 'snow', pattern: 'snowflake' },
  { key: 'halloween', label: 'Halloween & Autumn', pal: 2, garland: 'vine', float: 'leaves', footer: 'leaves', pattern: 'star' },
  { key: 'dia', label: 'Día de Muertos & Latin Fiestas', pal: 3, garland: 'papel', float: 'marigold', footer: 'leaves', pattern: 'mandala' },
  { key: 'carnival', label: 'Carnival & Mardi Gras', pal: 5, garland: 'bunting', float: 'confetti', footer: 'waves', pattern: 'star' },
  { key: 'eid', label: 'Eid & Ramadan Nights', pal: 6, garland: 'lanterns', float: 'stars', footer: 'waves', pattern: 'star' },
  { key: 'hanukkah', label: 'Hanukkah & Jewish Traditions', pal: 7, garland: 'lights', float: 'snow', footer: 'snow', pattern: 'star' },
  { key: 'lunar', label: 'Lunar New Year & East Asia', pal: 8, garland: 'lanterns', float: 'lanterns', footer: 'waves', pattern: 'mandala' },
  { key: 'japan', label: 'Hanami & Matsuri Japan', pal: 10, garland: 'sakura', float: 'sakura', footer: 'waves', pattern: 'mandala' },
  { key: 'oktoberfest', label: 'Oktoberfest & Alpine Autumn', pal: 12, garland: 'bunting', float: 'leaves', footer: 'leaves', pattern: 'star' },
  { key: 'harvest', label: 'World Harvest & Celebrations', pal: 13, garland: 'vine', float: 'hearts', footer: 'leaves', pattern: 'mandala' }
];

// Worldwide rows: [themeSlug, 'Theme Name', 'role-slug', 'Role Display', groupIdx, layoutIdx, fontIdx]
const WIDE_ROWS = [
  ['pine-hearth', 'Pine Hearth', 'christmas-tree-farmer', 'Christmas Tree Farmer', 0, 0, 0],
  ['sleigh-glow', 'Sleigh Glow', 'santa-photographer', 'Santa Photographer', 0, 1, 1],
  ['bauble-lane', 'Bauble Lane', 'ornament-artisan', 'Ornament Artisan', 0, 2, 2],
  ['gingerbread-manor', 'Gingerbread Manor', 'gingerbread-architect', 'Gingerbread Architect', 0, 0, 3],
  ['twinkle-roof', 'Twinkle Roof', 'christmas-lights-installer', 'Holiday Lights Installer', 0, 1, 0],
  ['cocoa-cloak', 'Cocoa Cloak', 'holiday-baker', 'Holiday Baker', 0, 2, 1],
  ['carved-critters', 'Carved Critters', 'toy-maker', 'Wooden Toy Maker', 0, 0, 2],
  ['carol-candlelight', 'Carol Candlelight', 'carol-choir-director', 'Carol Choir Director', 0, 1, 3],
  ['ribbon-attic', 'Ribbon Attic', 'gift-stylist', 'Gift Wrapping Stylist', 0, 2, 0],
  ['alpine-hush', 'Alpine Hush', 'ski-lodge-host', 'Ski Lodge Host', 0, 0, 1],
  ['moonlit-patch', 'Moonlit Patch', 'pumpkin-carver', 'Pumpkin Carver', 1, 1, 2],
  ['creaky-manor', 'Creaky Manor', 'haunted-house-designer', 'Haunted House Designer', 1, 2, 3],
  ['stitch-of-shadows', 'Stitch of Shadows', 'costume-atelier-owner', 'Costume Atelier Owner', 1, 0, 0],
  ['ink-and-omen', 'Ink and Omen', 'horror-illustrator', 'Horror Illustrator', 1, 1, 1],
  ['sugar-fang', 'Sugar Fang', 'candy-maker', 'Candy Maker', 1, 2, 2],
  ['amber-orchard', 'Amber Orchard', 'autumn-farm-host', 'Autumn Farm Host', 1, 0, 3],
  ['onyx-adorned', 'Onyx Adorned', 'gothic-jeweller', 'Gothic Jeweller', 1, 1, 0],
  ['lantern-of-legends', 'Lantern of Legends', 'haunted-tour-guide', 'Haunted Tour Guide', 1, 2, 1],
  ['spice-of-the-crypt', 'Spice of the Crypt', 'spooky-baker', 'Spooky Baker', 1, 0, 2],
  ['whisper-reel', 'Whisper Reel', 'horror-podcaster', 'Horror Podcaster', 1, 1, 3],
  ['cempasuchil-path', 'Cempasuchil Path', 'ofrenda-artist', 'Ofrenda Artist', 2, 2, 0],
  ['calavera-bloom', 'Calavera Bloom', 'sugar-skull-painter', 'Sugar Skull Face Painter', 2, 0, 1],
  ['papel-ridge', 'Papel Ridge', 'papel-picado-artist', 'Papel Picado Artist', 2, 1, 2],
  ['trumpet-dusk', 'Trumpet Dusk', 'mariachi-performer', 'Mariachi Performer', 2, 2, 3],
  ['falda-fire', 'Falda Fire', 'folklorico-dancer', 'Folclórico Dancer', 2, 0, 0],
  ['wind-beast', 'Wind Beast', 'alebrije-sculptor', 'Alebrije Sculptor', 2, 1, 1],
  ['agave-ember', 'Agave Ember', 'mezcal-sommelier', 'Mezcal Sommelier', 2, 2, 2],
  ['fiesta-mesa', 'Fiesta Mesa', 'fiesta-decorator', 'Fiesta Decorator', 2, 0, 3],
  ['peach-crown', 'Peach Crown', 'latin-portraitist', 'Frida-style Portraitist', 2, 1, 0],
  ['candy-avalanche', 'Candy Avalanche', 'pinata-maker', 'Piñata Maker', 2, 2, 1],
  ['feather-storm', 'Feather Storm', 'samba-dancer', 'Samba Dancer', 3, 0, 2],
  ['sequin-tide', 'Sequin Tide', 'carnival-costume-designer', 'Carnival Costume Designer', 3, 1, 3],
  ['float-of-giants', 'Float of Giants', 'float-builder', 'Parade Float Builder', 3, 2, 0],
  ['lagoon-mask', 'Lagoon Mask', 'venetian-mask-maker', 'Venetian Mask Maker', 3, 0, 1],
  ['pan-drum-gold', 'Pan Drum Gold', 'steel-drum-performer', 'Steel Drum Performer', 3, 1, 2],
  ['street-symphony', 'Street Symphony', 'parade-choreographer', 'Parade Choreographer', 3, 2, 3],
  ['glitter-forge', 'Glitter Forge', 'sequin-artisan', 'Sequin Artisan', 3, 0, 0],
  ['king-cake-court', 'King Cake Court', 'king-cake-baker', 'King Cake Baker', 3, 1, 1],
  ['zoom-lens-mardi', 'Zoom Lens Mardi', 'carnival-photographer', 'Carnival Photographer', 3, 2, 2],
  ['brass-lantern-mardi', 'Brass Lantern Mardi', 'carnival-trumpeter', 'Carnival Trumpeter', 3, 0, 3],
  ['crescent-ink', 'Crescent Ink', 'eid-calligrapher', 'Eid Calligrapher', 4, 1, 0],
  ['fanous-bazaar', 'Fanous Bazaar', 'fanous-lantern-maker', 'Fanous Lantern Maker', 4, 2, 1],
  ['pistachio-honey', 'Pistachio Honey', 'baklava-chef', 'Baklava Chef', 4, 0, 2],
  ['oud-and-dusk', 'Oud and Dusk', 'oud-player', 'Oud Player', 4, 1, 3],
  ['arabesque-lattice', 'Arabesque Lattice', 'arabesque-designer', 'Arabesque Pattern Designer', 4, 2, 0],
  ['kahwa-candle', 'Kahwa Candle', 'kahwa-tea-host', 'Kahwa Tea Host', 4, 0, 1],
  ['date-palm-moon', 'Date Palm Moon', 'date-farmer', 'Date Palm Farmer', 4, 1, 2],
  ['silver-hilal', 'Silver Hilal', 'crescent-jeweller', 'Crescent Jeweller', 4, 2, 3],
  ['suhoor-story', 'Suhoor Story', 'ramadan-recipe-blogger', 'Ramadan Recipe Blogger', 4, 0, 0],
  ['tile-and-tessera', 'Tile and Tessera', 'mosaic-artist', 'Mosaic Artist', 4, 1, 1],
  ['shining-shield', 'Shining Shield', 'menorah-silversmith', 'Menorah Silversmith', 5, 2, 2],
  ['spinning-clay', 'Spinning Clay', 'dreidel-carver', 'Dreidel Carver', 5, 0, 3],
  ['braided-gold', 'Braided Gold', 'challah-baker', 'Challah Baker', 5, 1, 0],
  ['clarinet-lights', 'Clarinet Lights', 'klezmer-clarinettist', 'Klezmer Clarinettist', 5, 2, 1],
  ['museum-blue', 'Museum Blue', 'judaica-artist', 'Judaica Artist', 5, 0, 2],
  ['alef-brush', 'Alef Brush', 'hebrew-calligrapher', 'Hebrew Calligrapher', 5, 1, 3],
  ['latke-lantern', 'Latke Lantern', 'latke-chef', 'Latke Chef', 5, 2, 0],
  ['festive-hearth-tale', 'Festive Hearth Tale', 'holiday-storyteller', 'Holiday Storyteller', 5, 0, 1],
  ['shir-choir', 'Shir Choir', 'synagogue-choir-leader', 'Synagogue Choir Leader', 5, 1, 2],
  ['olive-branch', 'Olive Branch', 'olive-wood-carver', 'Olive Wood Carver', 5, 2, 3],
  ['crimson-lantern-year', 'Crimson Lantern Year', 'lion-dance-performer', 'Lion Dance Performer', 6, 0, 0],
  ['hongbao-press', 'Hongbao Press', 'red-envelope-artist', 'Red Envelope Artist', 6, 1, 1],
  ['pleated-fortune', 'Pleated Fortune', 'dumpling-chef', 'Dumpling Chef', 6, 2, 2],
  ['couplet-brush', 'Couplet Brush', 'couplet-calligrapher', 'Couplet Calligrapher', 6, 0, 3],
  ['scissor-garden', 'Scissor Garden', 'paper-cutting-artist', 'Paper Cutting Artist', 6, 1, 0],
  ['zodiac-parade', 'Zodiac Parade', 'zodiac-illustrator', 'Zodiac Illustrator', 6, 2, 1],
  ['gongfu-cup', 'Gongfu Cup', 'tea-ceremony-master', 'Tea Ceremony Master', 6, 0, 2],
  ['midautumn-yolk', 'Midautumn Yolk', 'mooncake-baker', 'Mooncake Baker', 6, 1, 3],
  ['wind-and-water', 'Wind and Water', 'feng-shui-consultant', 'Feng Shui Consultant', 6, 2, 0],
  ['hanbok-blossom', 'Hanbok Blossom', 'hanbok-stylist', 'Hanbok Stylist', 6, 0, 1],
  ['petal-frame', 'Petal Frame', 'sakura-photographer', 'Sakura Photographer', 7, 1, 2],
  ['moss-bowl', 'Moss Bowl', 'bonsai-master', 'Bonsai Master', 7, 2, 3],
  ['silk-obifu', 'Silk Obifu', 'kimono-stylist', 'Kimono Stylist', 7, 0, 0],
  ['edomite-slice', 'Edomite Slice', 'omakase-chef', 'Omakase Chef', 7, 1, 1],
  ['drum-thunder-matsuri', 'Drum Thunder', 'taiko-drummer', 'Taiko Drummer', 7, 2, 2],
  ['yukata-cotton', 'Yukata Cotton', 'yukata-designer', 'Yukata Designer', 7, 0, 3],
  ['stem-and-bloom', 'Stem and Bloom', 'ikebana-arranger', 'Ikebana Arranger', 7, 1, 0],
  ['paper-crane', 'Paper Crane', 'origami-artist', 'Origami Artist', 7, 2, 1],
  ['yatai-lantern', 'Yatai Lantern', 'matsuri-stall-owner', 'Matsuri Stall Owner', 7, 0, 2],
  ['ink-panel-fest', 'Ink Panel Fest', 'manga-fest-artist', 'Manga Festival Artist', 7, 1, 3],
  ['foam-and-firkin', 'Foam and Firkin', 'brewmaster', 'Brewmaster', 8, 2, 0],
  ['salted-braid', 'Salted Braid', 'pretzel-baker', 'Pretzel Baker', 8, 0, 1],
  ['brass-accordion', 'Brass Accordion', 'alpine-folk-bandleader', 'Alpine Folk Band Leader', 8, 1, 2],
  ['ribbon-dress', 'Ribbon Dress', 'dirndl-tailor', 'Dirndl Tailor', 8, 2, 3],
  ['chestnut-table', 'Chestnut Table', 'beer-garden-host', 'Beer Garden Host', 8, 0, 0],
  ['alpine-whey', 'Alpine Whey', 'cheese-monger', 'Cheese Monger', 8, 1, 1],
  ['polka-keys', 'Polka Keys', 'accordion-player', 'Accordion Player', 8, 2, 2],
  ['grape-vintner', 'Grape Vintner', 'harvest-wine-sommelier', 'Harvest Wine Sommelier', 8, 0, 3],
  ['lebkuchen-heart', 'Lebkuchen Heart', 'gingerbread-heart-maker', 'Gingerbread Heart Maker', 8, 1, 0],
  ['yodel-hall', 'Yodel Hall', 'yodel-choir-leader', 'Yodel Choir Leader', 8, 2, 1],
  ['maize-feast', 'Maize Feast', 'thanksgiving-feast-chef', 'Thanksgiving Feast Chef', 9, 0, 2],
  ['rose-vow', 'Rose Vow', 'valentine-florist', 'Valentine Florist', 9, 1, 3],
  ['haft-sin-spring', 'Haft Sin Spring', 'nowruz-haft-sin-stylist', 'Nowruz Haft-Sin Stylist', 9, 2, 0],
  ['eggshell-meadow', 'Eggshell Meadow', 'easter-egg-painter', 'Easter Egg Painter', 9, 0, 1],
  ['kwanzaa-candlefire', 'Kwanzaa Candlefire', 'kwanzaa-candle-maker', 'Kwanzaa Candle Maker', 9, 1, 2],
  ['longest-night-lantern', 'Longest Night Lantern', 'solstice-lantern-maker', 'Solstice Lantern Maker', 9, 2, 3],
  ['sunflower-plain', 'Sunflower Plain', 'sunflower-farmer', 'Sunflower Farmer', 9, 0, 0],
  ['midnight-sparkle', 'Midnight Sparkle', 'new-year-fireworks-photographer', 'New Year Fireworks Photographer', 9, 1, 1],
  ['rainbow-boulevard', 'Rainbow Boulevard', 'pride-parade-designer', 'Pride Parade Designer', 9, 2, 2],
  ['market-of-seasons', 'Market of Seasons', 'harvest-market-host', 'Harvest Market Host', 9, 0, 3]
];


function personaFor(index, themeSlug) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length];
  const last = LAST_NAMES[(index * 7 + 3) % LAST_NAMES.length];
  const name = `${first} ${last}`;
  const city = CITIES[(index * 5 + 2) % CITIES.length];
  const email = `hello@${themeSlug}.in`;
  return { name, city, email };
}

function westernPersonaFor(index, themeSlug) {
  const first = FIRST_W[index % FIRST_W.length];
  const last = LAST_W[(index * 11 + 5) % LAST_W.length];
  const name = `${first} ${last}`;
  const city = CITIES_W[index % CITIES_W.length];
  const email = `hello@${themeSlug}.com`;
  return { name, city, email };
}

const CITIES_W = [
  'Vienna', 'Rio de Janeiro', 'Kyoto', 'Marrakesh', 'Prague', 'New Orleans', 'Oaxaca',
  'Helsinki', 'Cape Town', 'Dublin', 'Kraków', 'Seville', 'Melbourne', 'Quebec City', 'Cusco', 'Haarlem'
];

module.exports = {
  FIRST_NAMES, LAST_NAMES, CITIES, FAMILIES, PALETTES, ROWS,
  PATTERN_COUNT, LAYOUT_COUNT, FONT_COUNT, personaFor,
  PALETTES_W, FIRST_W, LAST_W, CITIES_W, GROUPS, WIDE_ROWS, westernPersonaFor
};

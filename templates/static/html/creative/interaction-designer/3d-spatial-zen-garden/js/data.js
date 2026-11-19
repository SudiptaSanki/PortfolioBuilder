/* ============================================================
   DATA — works on display and zone definitions
   All photography: stored locally in assets/photos (Unsplash License).
   ============================================================ */
const U = (id, w) => './assets/photos/' + imgLocal(id);
const imgLocal = (id) => 'img_' + id.replace(/[^a-z0-9]/gi, '').slice(-12).toLowerCase() + '.webp';

const WORKS = [
  {
    id: 'aperture',
    no: '01',
    title: 'Aperture Museum',
    year: '2025',
    client: 'Aperture Cultural Trust',
    role: 'Spatial design · WebGL',
    type: 'Spatial / Archviz',
    img: U('photo-1487958449943-2429e8be8625', 1600),
    detail: U('photo-1527576539890-dfa815648363', 1400),
    cap1: 'Foyer volume — 1:1 real-time preview',
    cap2: 'Facade geometry study — chamfered plate',
    blurb:
      'A crystalline museum volume that dissolves into its own reflection. We modelled the glazing as a single folded plate, then let the shader carry the daylight so the building reads as one continuous surface from every approach. Built as a real-time walkthrough for the opening campaign.',
    tags: ['Three.js', 'Custom shader', 'Spatial design', 'Archviz'],
    frame: { x: -7.6, y: 3.55, z: -8.6, ry: 0.34, w: 3.3, h: 4.3 },
  },
  {
    id: 'colonnade',
    no: '02',
    title: 'Colonnade 02',
    year: '2024',
    client: 'Studio Kō',
    role: 'Level design · WebGL',
    type: 'Environmental',
    img: U('photo-1524230572899-a752b3835840', 1600),
    detail: U('photo-1493809842364-78817add7ffb', 1400),
    cap1: 'Processional arcade — arch sequence',
    cap2: 'Interior daylight test',
    blurb:
      'Ninety-six metres of repeating vaults, rebuilt as a navigable corridor of light. Each arch shares one profile; everything else — shadow depth, dust, the temperature of the plaster — is procedural. The visitor is never given a destination, only the rhythm of walking.',
    tags: ['Level design', 'Light study', 'WebGL'],
    frame: { x: -4.4, y: 4.20, z: -9.4, ry: 0.20, w: 3.0, h: 4.0 },
  },
  {
    id: 'terrace',
    no: '03',
    title: 'Terrace House',
    year: '2024',
    client: 'Private — Kamakura',
    role: '3D visualisation · Motion',
    type: 'Archviz film',
    img: U('photo-1600585154340-be6161a56a0c', 1600),
    detail: U('photo-1518495973542-4542c06a5843', 1400),
    cap1: 'Dusk exterior — key frame',
    cap2: 'Canopy pass — light through keyaki',
    blurb:
      'A low house tucked under an old keyaki tree. The film follows one evening from blue hour to lamp light, with the garden doing most of the talking. Every frame was rendered from the same camera rig a visitor would walk in the browser version.',
    tags: ['Visualisation', 'Motion', 'Archviz'],
    frame: { x: -1.5, y: 3.40, z: -10.0, ry: 0.07, w: 3.4, h: 4.4 },
  },
  {
    id: 'cedar',
    no: '04',
    title: 'Cedar Atrium',
    year: '2023',
    client: 'Hotel Kiyomizu',
    role: 'Interior 3D · Lighting',
    type: 'Interior',
    img: U('photo-1600607687939-ce8a6c25118c', 1600),
    detail: U('photo-1545431613-51ec097943c6', 1400),
    cap1: 'Atrium lounge — afternoon pass',
    cap2: 'Diffraction study — glazing film',
    blurb:
      'Warm timber, one shaft of afternoon light, and a lot of restraint. The atrium is a single room with four materials; the whole design lives in how the light moves across them between two and five o’clock. We built a lighting tool so the client could scrub the day themselves.',
    tags: ['Interior', 'Lighting', 'Diffraction study'],
    frame: { x: 1.5, y: 4.10, z: -10.0, ry: -0.07, w: 3.0, h: 3.9 },
  },
  {
    id: 'machiya',
    no: '05',
    title: 'Machiya Dusk',
    year: '2023',
    client: 'Kyoto Craft Archive',
    role: 'Environment art · WebGL',
    type: 'Environment',
    img: U('photo-1493976040374-85c8e12f0c0e', 1600),
    detail: U('photo-1528164344705-47542687000d', 1400),
    cap1: 'Lane at dusk — lantern pass',
    cap2: 'Distant framing — western hills',
    blurb:
      'A Kyoto lane reconstructed from survey photographs: lattice fronts, wet stone, the particular amber of a paper lantern at 6pm. A small archive piece for people who cannot make the walk any more, and a record of a street that changes a little every year.',
    tags: ['Environment art', 'Photogrammetry', 'WebGL'],
    frame: { x: 4.4, y: 3.50, z: -9.4, ry: -0.20, w: 3.3, h: 4.3 },
  },
  {
    id: 'eclipse',
    no: '06',
    title: 'Eclipse Study',
    year: '2025',
    client: 'Self-initiated',
    role: '3D animation · Shader',
    type: 'Experiment',
    img: U('photo-1503706502779-cfd17a034472', 1600),
    detail: U('photo-1470071459604-3b5ec3a7fe05', 1400),
    cap1: 'Corona — 60 second loop',
    cap2: 'Horizon still — landform bed',
    blurb:
      'An exercise in one light source and nothing else. A black disc, a thin corona, and a camera that never quite settles. Built to test a bloom-free approach to glow: everything you see is geometry and exposure, no post-processing stack.',
    tags: ['3D animation', 'Shader', 'Experiment'],
    frame: { x: 7.6, y: 4.30, z: -8.6, ry: -0.34, w: 3.4, h: 4.4 },
  },
];

const ZONES = [
  { no: '01', name: 'Garden Entrance', short: 'GARDEN', chapter: 'CHAPTER 01 / 04' },
  { no: '02', name: 'Work Area', short: 'WORKS', chapter: 'CHAPTER 02 / 04' },
  { no: '03', name: 'Studio Pavilion', short: 'STUDIO', chapter: 'CHAPTER 03 / 04' },
  { no: '04', name: 'Contact Pavilion', short: 'CONTACT', chapter: 'CHAPTER 04 / 04' },
];

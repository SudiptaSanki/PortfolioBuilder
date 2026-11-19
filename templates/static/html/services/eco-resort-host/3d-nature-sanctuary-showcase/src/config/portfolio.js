/**
 * portfolio.js
 * -----------------------------------------------------------------------------
 * Every word, link and number the sanctuary shows lives here. index.html binds
 * to these keys at boot (`data-bind`, `data-bind-href`), the zone jump rail is
 * generated from `zones`, and the copy inside each suite card is written into
 * the page from `suites`. Edit this file only — main.js reads the same object
 * for the six camera stations, so a zone can be renamed without touching code.
 *
 * Fast swap checklist
 *   1. brand.*                 → your name / studio / sanctuary
 *   2. hero.*                  → the opening line and one-paragraph intro
 *   3. suites[0..2]            → three signature suites (or three projects)
 *   4. experiences / values / craft → services, rituals, how it is built
 *   5. contact.*               → email, links, booking CTA copy
 *
 * Zones are fixed by the world model in src/main.js (six camera stations along
 * one valley). Renaming a zone is free; adding or removing one means adding a
 * matching camera pose and an <section> with the same id.
 */

export const portfolio = {
  /* ------------------------------------------------------------------ brand */
  brand: {
    // Shown in the HUD pill, the page title and the footer.
    name: 'VERDANT RIDGE',
    // Two-letter monogram in the round HUD badge.
    mark: 'VR',
    // One short line under the name.
    role: 'Boutique nature sanctuary · 3D portfolio',
    fullName: 'Verdant Ridge Sanctuary',
    tagline: 'A small sanctuary at the head of a green valley.'
  },

  /* ------------------------------------------------------------------- hero */
  hero: {
    // The h1 is three lines; the middle one is set in italic display type.
    lineOne: 'Six landscapes,',
    lineTwo: 'one green valley,',
    lineThree: 'and room to breathe.',
    lede:
      'Verdant Ridge is a nine-suite sanctuary at the head of a glacial valley — a waterfall you can hear from bed, meadows that belong to the deer, and a single path that walks you from the summit to the river.',
    availability: 'Autumn 2027 · nine suites, never more than eighteen guests',
    location: 'Verdant Ridge · a valley with no road through it',
    elevationLabel: 'Summit station',
    elevationValue: '1,142 m'
  },

  /* ---------------------------------------------------------------- welcome */
  welcome: {
    title: 'The meadow floor is the front door',
    bodyOne:
      'There is a gatehouse, but nobody uses it. Guests arrive on foot from the ridge track and the first thing they cross is eleven hectares of wildflower meadow, cut once a year and grazed by red deer the rest of it.',
    bodyTwo:
      'Larch, glass, stone from the riverbed, roofs that disappear into the slope. Everything else is the valley doing what it has done for ten thousand years.',
    note: 'Live from the valley floor'
  },

  values: [
    {
      title: 'Leave the valley louder',
      body: 'No piped music, no night lighting above the path.'
    },
    {
      title: 'Build with what falls',
      body: 'Ridge larch, river stone, wool from the farm below.'
    },
    {
      title: 'Eighteen guests, nine suites',
      body: 'Two per suite, no day visitors, no conferences.'
    }
  ],

  /* ----------------------------------------------------------------- suites */
  suites: [
    {
      kicker: 'Signature suite · 03',
      title: 'Falls Pavilion',
      year: '2026',
      role: 'Two guests · 72 m² · waterfall terrace',
      summary:
        'A glass pavilion set eleven metres from the plunge pool, angled so the 34-metre curtain fills the west wall at dusk. Charred larch outside, wool and river stone within; a sunken bath that takes its water straight off the upper reach.',
      stack: ['34 m curtain view', 'Wood-fired bath', 'Private terrace', 'Sleeps 2'],
      url: 'https://example.com/stays/falls-pavilion',
      cta: 'Walk through the pavilion'
    },
    {
      kicker: 'Signature suite · 07',
      title: 'River House',
      year: '2025',
      role: 'Two guests · 64 m² · plunge pool deck',
      summary:
        'The old keeper’s house, rebuilt around its own stone chimney. The river runs under the north deck, koi hold station in the shallows, and the only door out opens onto a bank of pebbles and moving water.',
      stack: ['Koi shallows', 'River deck', 'Stone hearth', 'Sleeps 2'],
      url: 'https://example.com/stays/river-house',
      cta: 'See the river rooms'
    },
    {
      kicker: 'Signature suite · 09',
      title: 'Ridge Cabin',
      year: '2024',
      role: 'Two guests · 48 m² · canopy deck',
      summary:
        'Nine hundred metres up the ridge, one room in the canopy with the shutters left open. Golden light arrives through the needles around six; the hawks work the thermals until it goes.',
      stack: ['Canopy deck', 'Wood stove', 'No Wi-Fi by design', 'Sleeps 2'],
      url: 'https://example.com/stays/ridge-cabin',
      cta: 'Climb to the cabin'
    }
  ],

  /* ------------------------------------------------------------ experiences */
  experiences: [
    {
      name: 'Dawn with the deer',
      detail: 'A guide, a thermos and ninety quiet minutes on the meadow paths before the light clears the ridge.'
    },
    {
      name: 'Plunge and return',
      detail: 'The pool under the falls holds 11 °C all year. Towels are warmed at the pavilion, not promised.'
    },
    {
      name: 'Koi hour',
      detail: 'Feeding the river koi from the lower deck, with the trout holding in the current behind them.'
    },
    {
      name: 'Pine ridge at six',
      detail: 'The climb to the cabin takes forty minutes. Go at six and the canopy turns to gold on the way up.'
    },
    {
      name: 'Kitchen garden table',
      detail: 'One long table, whatever the garden gives that week, and the farmer from the valley floor at the end of it.'
    }
  ],

  /* ------------------------------------------------------------------ craft */
  /* How the sanctuary (and this page) is built — repurpose as “process”. */
  craft: [
    {
      title: 'One valley, six stations',
      body: 'Sky, hills, water and wildlife share one height field.'
    },
    {
      title: 'Weather you can hear',
      body: 'Fog, sun, spray and the sound mix follow the camera.'
    },
    {
      title: 'Nothing sampled, nothing downloaded',
      body: 'Terrain, trees, deer and birdsong are generated live.'
    }
  ],

  /* ---------------------------------------------------------------- contact */
  contact: {
    title: 'Come down to the valley floor.',
    body:
      'Nine suites, two seasons a year, and a waiting list that is shorter than it sounds. Tell us when you would come and who with — we answer within two days, usually from the gatehouse.',
    email: 'hello@example.com',
    emailHref: 'mailto:hello@example.com',
    links: [
      { label: 'Email', value: 'hello@example.com', href: 'mailto:hello@example.com' },
      { label: 'Instagram', value: '@verdantridge', href: 'https://example.com/instagram' },
      { label: 'Journal', value: 'Notes from the ridge', href: 'https://example.com/journal' },
      { label: 'Press kit', value: 'Photography & floor plans', href: 'https://example.com/press' }
    ]
  },

  footer: {
    credit:
      'Built with three.js, GSAP and Lenis. No textures, no video — the valley, the deer and the sound are generated in the browser.'
  },

  /* ------------------------------------------------------------------ zones */
  /**
   * The six scroll stations, in camera order. `id` must match an <section> in
   * index.html and a camera pose in src/main.js. `grade` drives the HUD contrast
   * for that station: 'bright' = ink on pale glass (sky, meadow, water),
   * 'shade' = pale on dark glass (under the pines).
   */
  zones: [
    {
      id: 'summit',
      number: '01',
      label: 'Summit Overlook',
      short: 'Summit',
      zone: 'Summit Overlook',
      title: 'Summit Overlook · the whole valley',
      grade: 'bright',
      elevation: '1,142 m'
    },
    {
      id: 'meadow',
      number: '02',
      label: 'Emerald Meadow',
      short: 'Meadow',
      zone: 'Emerald Meadow',
      title: 'Emerald Meadow · wildflower floor',
      grade: 'bright',
      elevation: '486 m'
    },
    {
      id: 'falls',
      number: '03',
      label: 'Cascading Falls',
      short: 'Falls',
      zone: 'Cascading Falls',
      title: 'Cascading Falls · the amphitheatre',
      grade: 'bright',
      elevation: '312 m'
    },
    {
      id: 'river',
      number: '04',
      label: 'River Sanctuary',
      short: 'River',
      zone: 'River Sanctuary',
      title: 'River Sanctuary · plunge pool',
      grade: 'bright',
      elevation: '204 m'
    },
    {
      id: 'ridge',
      number: '05',
      label: 'Pine Ridge',
      short: 'Ridge',
      zone: 'Pine Ridge',
      title: 'Pine Ridge · forest canopy',
      grade: 'bright',
      elevation: '688 m'
    },
    {
      id: 'horizon',
      number: '06',
      label: 'Valley Horizon',
      short: 'Horizon',
      zone: 'Valley Horizon',
      title: 'Valley Horizon · contact',
      grade: 'bright',
      elevation: '1,046 m'
    }
  ]
};

export default portfolio;

/* Small helpers used by main.js -------------------------------------------- */

/** Resolve "suites.0.title" against the config object. */
export function resolvePath(source, path) {
  if (!path) return undefined;
  return path.split('.').reduce((value, key) => {
    if (value == null) return undefined;
    return Array.isArray(value) && /^\d+$/.test(key) ? value[Number(key)] : value[key];
  }, source);
}

/** True when the link points at something worth opening. */
export function isRealLink(href) {
  return typeof href === 'string' && href.length > 1 && href !== '#';
}

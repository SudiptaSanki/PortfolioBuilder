/**
 * portfolio.js
 * ============================================================================
 * Every word, number and link the site shows lives here. Edit this file to make
 * the portfolio yours — the layout, the 3D journey and the soundscape all read
 * from these fields, so nothing else needs to change.
 *
 * The structural rule: `stations` is ordered, and each `progress` value is the
 * position along the research campus (0 = the atrium doors, 1 = the twilight
 * archive terrace) where that station's camera is set. The values below are
 * tuned to the six phases of `src/scene/researchWorld.js`:
 *
 *   atrium      0.00 – 0.17   glazed atrium, molecular sculpture, living lattice
 *   optics      0.17 – 0.36   optical table, laser train, dilution refrigerator
 *   wetlab      0.36 – 0.56   bio-reactors, centrifuge, protein hologram
 *   compute     0.56 – 0.76   blade cluster and the embedding/manifold atlas
 *   observatory 0.76 – 0.90   retractable dome, telescope, orbital arcs
 *   archive     0.90 – 1.00   monolith archive and reading terrace at dusk
 *
 * Keep them inside those bands or the camera will look at scenery that does not
 * match the copy.
 * ========================================================================== */

const portfolio = {
  /* ------------------------------------------------------------- identity -- */
  brand: {
    mark: 'QB',
    name: 'QUANTUM & BIO LAB',
    // Short form used on the mobile top bar.
    shortName: 'Q.B. LAB',
    tagline: 'Computational & Experimental Lab',
  },

  principal: {
    role: 'Principal Investigator',
    practice: 'Computational & Experimental Lab · Quantum Optics & Bio-Simulation',
    disciplines: 'Cryo-optics · Protein simulation · Scientific computing',
    experience: '12 years across three continents',
  },

  /* ----------------------------------------------------------- sound gate -- */
  sound: {
    title: 'Enable Lab & Optics Audio?',
    body:
      'The soundscape is synthesised live in your browser — ventilation and instrument hum, the shimmer of a locked laser, a centrifuge spin and gentle harmonic chimes at each station. No files are downloaded. Sound is off unless you turn it on.',
    enable: 'Enable Sound',
    muted: 'Continue Muted',
    hint: 'Enter to enable · Esc to continue muted',
    pillOn: 'Sound On',
    pillOff: 'Sound Off',
  },

  /* --------------------------------------------------------------- stations */
  stations: [
    {
      id: 'atrium',
      no: '01',
      railLabel: 'Atrium',
      progress: 0.075,
      kicker: 'Station 01 · Research Atrium & Living Lattice',
      title: 'A lab should feel like a place you want to think in.',
      lede:
        'A daylight glass-and-timber atrium, a suspended molecular sculpture turning under the skylight, and a living lattice wall of planted timber.',
      body:
        'The atrium is the building’s instrument: light enters through the glazed south wall and the roof lantern, and the floor carries it back into the room. The sculpture overhead is our model system at ten million times life size — a copper centre, a crown of ligands, six bonds that flex as the molecule breathes. The lattice behind it is planted, watered by the building’s grey water, and it does more work than any poster on the wall.',
      facts: [
        { label: 'Atrium volume', value: '4,260 m³' },
        { label: 'Daylight autonomy', value: '78 % of hours' },
        { label: 'Living wall', value: '2,140 plants' },
      ],
      tags: ['Glazed timber', 'Molecular model', 'Living lattice'],
    },
    {
      id: 'optics',
      no: '02',
      railLabel: 'Optics & Cryo',
      progress: 0.265,
      kicker: 'Station 02 · Quantum & Cryo-Optics Bench',
      title: 'We measure a photon by holding the noise still.',
      lede:
        'A pneumatic optical table, a folded laser train in green and red, and a dilution refrigerator stacked in copper stages beside it.',
      body:
        'Two beams leave the table: 532 nm pumps the parametric down-conversion crystal, 633 nm is the reference arm. Each mirror is kinematically mounted and every lens sits in a cage we can align without breaking the vacuum. The cryostat next door cools the detector to twelve millikelvin through a pulse-tube stage, a still, and a mixing chamber — the copper discs are the thermal ladder, and the coldest plate is the one nobody touches.',
      facts: [
        { label: 'Base temperature', value: '12.4 mK' },
        { label: 'Laser lock', value: '96.4 % · 0.8 mHz' },
        { label: 'Crystal', value: 'PPKTP · 30 mm' },
      ],
      tags: ['PPKTP down-conversion', 'Dilution fridge', 'Cavity lock'],
    },
    {
      id: 'wetlab',
      no: '03',
      railLabel: 'Wet Lab',
      progress: 0.46,
      kicker: 'Station 03 · Wet Lab & Bio-Simulation Core',
      title: 'The simulation is only useful if the wet lab can argue with it.',
      lede:
        'Glass bio-reactors, an orbital shaker and a centrifuge under a holographic protein projected in free space.',
      body:
        'Every model we publish is run against something we can pipette. The reactors hold a slow-growing culture at 37 °C; the centrifuge pellets it; the shaker keeps a dozen flasks in motion so growth never settles into a gradient. The protein above the bench is the same structure the cluster is folding tonight — a coarse-grained mesh, not a decoration, with the binding pocket lit in amber.',
      facts: [
        { label: 'Culture volume', value: '12 × 2.0 L' },
        { label: 'Shaker speed', value: '180 rpm' },
        { label: 'Fold accuracy', value: '1.8 Å backbone' },
      ],
      tags: ['Bio-reactors', 'Protein mesh', 'Assay pipeline'],
    },
    {
      id: 'compute',
      no: '04',
      railLabel: 'Supercomputing',
      progress: 0.65,
      kicker: 'Station 04 · Supercomputing & Dataset Atlas',
      title: 'The data are not a table. They are a landscape.',
      lede:
        'A blade cluster in a cold aisle, beside a volumetric embedding atlas with data pulses running across its ridges.',
      body:
        'The cluster runs the simulations that are too slow to watch and too large to hold: 2.7 petabytes of trajectories, embeddings and detector frames, staged between NVMe and tape. The terrain beside it is a UMAP of the whole corpus — each ridge a family of structures, each valley a region where our model is still unsure. When a run finishes, a pulse crosses the surface from the point that changed.',
      facts: [
        { label: 'Active compute', value: '18.6 PFLOPS' },
        { label: 'Corpus', value: '2.7 PB · 214 datasets' },
        { label: 'Embedding dims', value: '1,536 · UMAP 3D' },
      ],
      tags: ['Blade cluster', 'Manifold atlas', 'Reproducible runs'],
    },
    {
      id: 'observatory',
      no: '05',
      railLabel: 'Observatory',
      progress: 0.83,
      kicker: 'Station 05 · Sky-Dome Observatory',
      title: 'Some questions only get answered after the dome opens.',
      lede:
        'A retractable dome opening onto a twilight sky, an articulated telescope and the arcs of everything it is tracking.',
      body:
        'The dome splits and rolls back along its rails when the seeing is good. The telescope is a 0.6 m Ritchey–Chrétien on an equatorial fork; tonight it is tracking a transiting exoplanet, and the arcs overhead are the objects queued behind it. The same detector stack that runs at millikelvin downstairs is mounted here at ambient, which is why the calibration work upstairs matters more than it sounds.',
      facts: [
        { label: 'Aperture', value: '0.6 m · f/8' },
        { label: 'Dome opening', value: '4.2 m slit' },
        { label: 'Tonight', value: '1 transit · 6 targets' },
      ],
      tags: ['Retractable dome', 'Equatorial fork', 'Photometry'],
    },
    {
      id: 'archive',
      no: '06',
      railLabel: 'Archive',
      progress: 0.96,
      kicker: 'Station 06 · Publication Archive & Collaboration Deck',
      title: 'The lab is the people who stay after the experiment fails.',
      lede:
        'Floating illuminated monographs over a reflecting pool, and a warm reading terrace where the group actually argues.',
      body:
        'Each monolith carries a paper and the people who made it. The reading terrace is where the group meets on Fridays: current members, visiting students, and whichever collaborator is awake in another time zone.',
      facts: [
        { label: 'Publications', value: '64 peer-reviewed' },
        { label: 'h-index', value: '31' },
        { label: 'Group', value: '11 researchers · 6 countries' },
      ],
      tags: ['Open access', 'Collaboration', 'Mentorship'],
      publications: [
        {
          title: 'Coherent control of a superconducting qubit with a squeezed optical clock',
          authors: 'Sterling, M., Okonkwo, A., Lindqvist, M.',
          venue: 'Nature Physics',
          year: '2025',
          doi: '10.5555/nphys.2025.0412',
        },
        {
          title: 'Millikelvin photodetection without cryogenic amplifiers',
          authors: 'Sterling, M., Haddad, R., Ferreira, L.',
          venue: 'Physical Review Letters',
          year: '2024',
          doi: '10.5555/prl.2024.1187',
        },
        {
          title: 'A manifold atlas of 2.7 million protein trajectories',
          authors: 'Lindqvist, M., Sterling, M., Sato, K.',
          venue: 'Nature Computational Science',
          year: '2024',
          doi: '10.5555/ncompsci.2024.0093',
        },
        {
          title: 'Bench-to-model: closing the loop between assay and simulation',
          authors: 'Okonkwo, A., Sterling, M.',
          venue: 'Cell Systems',
          year: '2023',
          doi: '10.5555/cels.2023.0318',
        },
      ],
    },
  ],

  /* ---------------------------------------------------------------- grants */
  grants: [
    {
      funder: 'European Research Council',
      scheme: 'Consolidator Grant',
      title: 'Quantum-limited sensing in cryogenic optomechanics',
      period: '2023 – 2028',
      amount: '€2.0 M',
    },
    {
      funder: 'National Science Foundation',
      scheme: 'Mid-Scale RI',
      title: 'An open atlas of protein dynamics',
      period: '2022 – 2026',
      amount: '$3.4 M',
    },
    {
      funder: 'Chan Zuckerberg Initiative',
      scheme: 'Essential Open Source',
      title: 'Reproducible pipelines for single-cell biophysics',
      period: '2024 – 2026',
      amount: '$480 k',
    },
  ],

  /* ---------------------------------------------------------------- people */
  members: [
    { name: 'Principal Investigator', role: 'Principal Investigator' },
    { name: 'Dr. Amara Okonkwo', role: 'Cryo-optics & detection' },
    { name: 'Mikael Lindqvist', role: 'Scientific computing & atlas' },
    { name: 'Dr. Rania Haddad', role: 'Wet lab & assay design' },
    { name: 'Kenji Sato', role: 'Observatory & instrumentation' },
    { name: 'Léa Ferreira', role: 'PhD · quantum sensing' },
  ],

  /* --------------------------------------------------------------- contact */
  contact: {
    label: 'Contact',
    title: 'Come and argue with us about a measurement.',
    body:
      'The lab reads every serious enquiry: collaborations, instrument time, open-dataset requests, and students who want to build something that has to survive contact with a real experiment.',
    primary: {
      label: 'Write to Lab',
      email: 'hello@example.com',
      subject: 'Research enquiry — Research Lab',
    },
    secondary: {
      label: 'Request the group CV & dataset index',
      email: 'hello@example.com',
      subject: 'Group CV and dataset index request',
    },
  },

  /* ------------------------------------------------------------- HUD copy -- */
  hud: {
    rail: 'Research station rail',
    temp: 'Experiment Temp',
    lock: 'Laser Lock',
    compute: 'Active Compute',
    cites: 'Citations',
    datasets: 'Open Datasets',
    progress: 'Station',
    railAria: 'Jump to a station along the research campus',
    soundAria: 'Toggle laboratory and optics audio',
    experimentAria: 'Run an experiment pulse through the campus instruments',
    laserAria: 'Toggle the folded laser alignment path',
    contactAria: 'Contact Principal Investigator',
    experimentLabel: 'Run Experiment',
    laserOn: 'Beam: Folded',
    laserOff: 'Beam: Direct',
    units: {
      temp: 'mK',
      lock: '%',
      compute: 'PF',
      cites: '',
      datasets: '',
    },
  },

  /** Short forms used in the mobile bottom bar. */
  short: {
    temp: 'Temp',
    lock: 'Lock',
    compute: 'Compute',
    cites: 'Cites',
  },

  meta: {
    title: 'QUANTUM & BIO LAB — Computational & Experimental Lab',
    description:
      'A 3D open-world research portfolio: walk a glass-and-timber atrium, a quantum and cryo-optics bench, a wet lab, a supercomputing hall, a retractable sky-dome observatory and a publication archive at dusk.',
    footer: 'Built from one continuous procedural campus. No 3D models, no image files, no audio files.',
  },
};

/* ------------------------------------------------------------------ helpers */

export function getStation(index) {
  const list = portfolio.stations;
  const i = Math.max(0, Math.min(list.length - 1, Math.floor(index || 0)));
  return list[i];
}

export function mailtoHref({ email, subject }) {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : '';
  return `mailto:${email}${query}`;
}

export default portfolio;

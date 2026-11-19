/**
 * portfolio.js
 * ============================================================================
 * Every word, number and link the site shows lives here. Edit this file to make
 * the portfolio yours — the layout, the 3D journey and the soundscape all read
 * from these fields, so nothing else needs to change.
 *
 * The structural rule: `stations` is ordered, and each `progress` value is the
 * position along the dam world (0 = dam crest at golden hour, 1 = deep night)
 * where that station's camera and sky are set. The values below are tuned to
 * the six phases of `src/scene/hydroWorld.js`:
 *
 *   crest       0.00 – 0.18   crest roadway, intake towers, reservoir
 *   spillway    0.18 – 0.38   radial gates, stepped chute, plunge pool
 *   penstocks   0.38 – 0.58   steel conduits descending to the powerhouse
 *   turbine     0.58 – 0.78   Francis runner, rotor, stator, cutaway hall
 *   switchyard  0.78 – 0.92   transformers, bushings, lattice grid
 *   night       0.92 – 1.00   floodlit dam, valley lights, starfield
 *
 * Keep them inside those bands or the camera will look at scenery that does not
 * match the copy.
 * ========================================================================== */

const portfolio = {
  /* ------------------------------------------------------------- identity -- */
  brand: {
    mark: 'CH',
    name: 'CANYON HYDRO WORKS',
    tagline: 'Principal Hydro & Clean-Energy Systems Portfolio',
    // Short form used on the mobile top bar.
    shortName: 'CANYON HYDRO',
  },

  principal: {
    role: 'Principal Hydro & Clean-Energy Systems Engineer',
    // Shown in the final station's signature line. Replace with your own.
    practice: 'Canyon Hydro Works · Reservoir, Spillway & Plant Systems',
    disciplines: 'Hydraulic structures · Turbines · HV grid',
    experience: '18 years of build-and-commission',
  },

  /* ----------------------------------------------------------- sound gate -- */
  sound: {
    title: 'Enable Dam & Turbine Audio?',
    body:
      'The soundscape is synthesised live in your browser — reservoir wind, spillway whitewater, the penstock rush, turbine hum and transformer buzz. No files are downloaded. Sound is off unless you turn it on.',
    enable: 'Enable Sound',
    muted: 'Continue Muted',
    hint: 'Enter to enable · Esc to continue muted',
    pillOn: 'Sound On',
    pillOff: 'Sound Off',
  },

  /* --------------------------------------------------------------- stations */
  stations: [
    {
      id: 'crest',
      no: '01',
      railLabel: 'Crest & Reservoir',
      progress: 0.08,
      kicker: 'Station 01 · Crest & Reservoir',
      title: 'Five hundred and fifty-two metres, and the whole catchment behind it.',
      lede: 'An arch-gravity crest holding a turquoise alpine reservoir above a forested canyon.',
      body:
        'The dam carries its load into the rock of both abutments, not into the valley floor, so the crest is an arc: 300 m on the upstream face, 9 m thick at the roadway, 54 m at the foundation. Two intake towers drop through the concrete to the penstocks. Every reading that matters on this site begins with the level behind this parapet.',
      facts: [
        { label: 'Crest elevation', value: '552 m a.s.l.' },
        { label: 'Gross head', value: '141 m' },
        { label: 'Arch radius', value: '300 m' },
      ],
      tags: ['Arch-gravity', 'Intake towers', 'Reservoir'],
    },
    {
      id: 'spillway',
      no: '02',
      railLabel: 'Spillway Cascade',
      progress: 0.27,
      kicker: 'Station 02 · Spillway Cascade',
      title: 'Five gates that only open for water the turbines cannot take.',
      lede: 'Radial Tainter gates, a stepped chute, a plunge pool and a permanent haze of mist.',
      body:
        'Each radial gate is a segment of a cylinder on a trunnion, lifted by a servo hoist; the water passes over the lip, down an ogee and a stepped chute, and into the plunge pool, where the energy dissipates before the tailrace. The five gates are rated at 1,600 m³/s together. At full opening the mist reaches the crest roadway.',
      facts: [
        { label: 'Radial gates', value: '5 × 13.5 m bay' },
        { label: 'Rated discharge', value: '1,600 m³/s' },
        { label: 'Chute drop', value: '142 m' },
      ],
      tags: ['Tainter gates', 'Stepped chute', 'Plunge pool'],
    },
    {
      id: 'penstocks',
      no: '03',
      railLabel: 'Penstock Conduits',
      progress: 0.48,
      kicker: 'Station 03 · Penstock Conduits',
      title: 'Steel conduits carrying 528 cubic metres a second down the canyon wall.',
      lede: 'Three 8.7 m penstocks, a cutaway flow window, and a pressure that never stops rising.',
      body:
        'From the intake towers the water falls through steel liners, past the butterfly valves, into the spiral cases of the four units. The cutaway windows show the flow pulses accelerating as the head rises. At the bottom of the run the pressure is around 14 bar, which is why the penstock weld map is the most scrutinised drawing on the site.',
      facts: [
        { label: 'Penstocks', value: '3 × 8.7 m ∅' },
        { label: 'Rated turbine flow', value: '528 m³/s' },
        { label: 'Pressure at plant', value: '≈ 14 bar' },
      ],
      tags: ['Steel liners', 'Butterfly valves', 'Flow pulses'],
    },
    {
      id: 'turbine',
      no: '04',
      railLabel: 'Francis Turbine Hall',
      progress: 0.68,
      kicker: 'Station 04 · Francis Turbine Hall',
      title: 'Thirteen blades, three hundred revolutions a minute.',
      lede: 'A cutaway of the unit that turns falling water into 50 Hz current.',
      body:
        'Water enters the spiral case, is straightened by stay vanes and metered by guide vanes onto a 13-blade Francis runner, then drops into the draft tube. The shaft rises to a 12-pole rotor inside 30 stator coils; at 300 rpm the electrical output sits at 50 Hz. Output follows the head and the gate opening, and the energy particles in the cutaway are the excitation field.',
      facts: [
        { label: 'Units', value: '4 × 180 MW' },
        { label: 'Runner', value: 'Francis · 13 blades' },
        { label: 'Synchronous speed', value: '300 rpm · 50 Hz' },
      ],
      tags: ['Runner cutaway', '12-pole rotor', 'Stator coils'],
    },
    {
      id: 'switchyard',
      no: '05',
      railLabel: '500 kV Switchyard',
      progress: 0.84,
      kicker: 'Station 05 · 500 kV Switchyard',
      title: '13.8 kV at the terminals, 500 kV on the canyon line.',
      lede: 'Step-up transformers, ceramic bushings and lattice towers leaving the gorge.',
      body:
        'Each generator feeds a step-up transformer through an isolated-phase bus; the bank lifts 13.8 kV to 500 kV for the line that climbs out of the canyon. Cooling fins, oil conservators and surge arresters fill the yard, and every busbar is rated for the full plant output. At dusk the corona and the busbar glow are the only light left in the yard.',
      facts: [
        { label: 'Generator voltage', value: '13.8 kV' },
        { label: 'Transmission', value: '500 kV' },
        { label: 'Transformer banks', value: '4 · step-up' },
      ],
      tags: ['Step-up transformers', 'Bushings', 'Lattice towers'],
    },
    {
      id: 'night',
      no: '06',
      railLabel: 'Night Panorama',
      progress: 0.96,
      kicker: 'Station 06 · Night Panorama',
      title: 'The dam keeps working while the valley sleeps.',
      lede: 'Floodlit concrete, a lit turbine hall and a grid of valley lights under the stars.',
      body:
        'At night the crest lights come on at 40 % and the spillway floodlights pick out the chute. The hall windows stay bright, the switchyard hums, and the valley below is a second circuit diagram. This is the part of the plant nobody visits — and the reason the reservoir was built.',
      facts: [
        { label: 'Crest lighting', value: 'Floodlit · 40 %' },
        { label: 'Plant status', value: '4 units online' },
        { label: 'Grid', value: '500 kV · stable' },
      ],
      tags: ['Night panorama', 'Valley grid', 'Starry sky'],
    },
  ],

  /* --------------------------------------------------------------- contact */
  contact: {
    label: 'Contact',
    title: 'Talk about a scheme?',
    body:
      'Feasibility, hydraulic design reviews, turbine procurement or commissioning support — the practice answers within two working days.',
    primary: {
      label: 'Start a conversation',
      // Replace with the address that should receive enquiries.
      email: 'hello@example.com',
      subject: 'Portfolio enquiry — Canyon Hydro Works',
    },
    secondary: {
      label: 'Request the project sheet',
      email: 'hello@example.com',
      subject: 'Project sheet request — hydro portfolio',
    },
  },

  /* ------------------------------------------------------------- HUD copy -- */
  hud: {
    rail: 'Hydro station rail',
    head: 'Head',
    flow: 'Flow',
    output: 'Output',
    grid: 'Grid',
    time: 'Time of day',
    progress: 'Station',
    railAria: 'Jump to a hydro station along the dam',
    soundAria: 'Toggle dam and turbine audio',
    spillwayAria: 'Toggle the spillway radial gates',
    cutawayAria: 'Toggle the turbine and generator cutaway',
    contactAria: 'Contact Canyon Hydro Works',
    spillwayOpen: 'Spillway 100%',
    spillwayLow: 'Spillway 25%',
    spillwayOff: 'Spillway %',
    cutawayOn: 'Cutaway On',
    cutawayOff: 'Cutaway Off',
    units: {
      head: 'm',
      flow: 'm³/s',
      output: 'MW',
      grid: 'kV',
    },
  },

  /**
   * Clock time and lighting grade shown for each label the world reports from
   * `getDamPose().timeLabel`.
   */
  clock: {
    'Golden hour': '17:40',
    'Late afternoon': '16:20',
    Sunset: '18:35',
    Dusk: '19:10',
    'Blue hour': '19:45',
    Night: '21:30',
    'Deep night': '23:50',
  },

  /** Short forms used in the mobile bottom bar. */
  shortTime: {
    'Golden hour': 'Golden hr',
    'Late afternoon': 'Afternoon',
    Sunset: 'Sunset',
    Dusk: 'Dusk',
    'Blue hour': 'Blue hr',
    Night: 'Night',
    'Deep night': 'Late night',
  },

  meta: {
    // Used in the HTML <title> and the link preview.
    title: 'CANYON HYDRO WORKS — Hydro & Clean-Energy Portfolio',
    description:
      'A 3D hydro portfolio: walk the crest of a 552 m arch-gravity dam, down the spillway, through the penstocks and the Francis turbine cutaway, to the 500 kV switchyard and a night panorama of the valley grid.',
    footer: 'Built from one continuous procedural dam site. No 3D models, no image files, no audio files.',
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

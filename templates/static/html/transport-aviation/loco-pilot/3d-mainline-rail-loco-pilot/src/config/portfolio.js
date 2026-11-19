/**
 * portfolio.js
 * ============================================================================
 * Every word, number and link the site shows lives here. Edit this file to make
 * the portfolio yours — the layout, the 3D journey and the soundscape all read
 * from these fields, so nothing else needs to change.
 *
 * The only structural rule: `stations` is ordered, and each `progress` value is
 * the position along the rail world (0 = start of the line, 1 = buffer stop)
 * where that station's camera and sky are set. The values below are tuned to
 * the five phases of `src/scene/railWorld.js`:
 *
 *   cab        0.00 – 0.16     inside the locomotive at the origin yard
 *   country    0.16 – 0.38     exterior chase through hills and pine
 *   bridge     0.38 – 0.58     steel truss viaduct over the river gorge
 *   tunnel     0.58 – 0.75     the bore, dusk on the far side
 *   night      0.75 – 1.00     headlamp mainline, signals, terminal arrival
 *
 * Keep them inside those bands or the camera will look at scenery that does not
 * match the copy.
 * ========================================================================== */

const portfolio = {
  /* ------------------------------------------------------------- identity -- */
  brand: {
    mark: 'ID',
    name: 'IRONLINE DIVISION',
    tagline: 'Senior Loco Pilot · Mainline & High-Speed Rail Portfolio',
    // Short form used in the page title and the mobile HUD.
    shortName: 'IRONLINE',
  },

  pilot: {
    name: 'Senior Loco Pilot',
    role: 'Senior Loco Pilot',
    // Shown in the terminal station's signature block.
    depot: 'Kalyan Division · Electric Loco Shed',
    years: '22 years on the footplate',
    distance: '1.42 million km',
  },

  /* ----------------------------------------------------------- sound gate -- */
  sound: {
    title: 'Enable Cab & Track Audio?',
    body:
      'The soundscape is synthesised live in your browser — traction hum, rail-joint clack, the horn. No files are downloaded. Sound is off unless you turn it on.',
    enable: 'Enable Sound',
    muted: 'Continue Muted',
    hint: 'Enter to enable · Esc to continue muted',
    pillOn: 'Sound On',
    pillOff: 'Sound Off',
    horn: 'Horn',
  },

  /* --------------------------------------------------------------- stations */
  stations: [
    {
      id: 'cab',
      no: '01',
      railLabel: 'Cab Departure',
      progress: 0.06,
      kicker: 'Station 01 · Origin Yard',
      title: 'Green aspect. Brake released.',
      lede: 'Twenty-two years on the footplate, and the first move of the day still beats everything.',
      body:
        'The yard is still blue at 05:40. The cab heater ticks, the signal steps from red to green, and six thousand four hundred tonnes settle on the drawbar behind me. I release the brake, let the traction motors find their note, and the day starts moving.',
      facts: [
        { label: 'Locomotive', value: 'WAP-7 · 6,350 hp' },
        { label: 'Load', value: '6,400 t · 58 wagons' },
        { label: 'Departure', value: '05:40 · on time' },
      ],
      tags: ['Cab view', 'Cold start', 'Green board'],
    },
    {
      id: 'countryside',
      no: '02',
      railLabel: 'Countryside Mainline',
      progress: 0.27,
      kicker: 'Station 02 · Countryside Mainline',
      title: 'Line speed, and the long view.',
      lede: 'A hundred and ten an hour through pine and pasture — the part of the job nobody films.',
      body:
        'The corridor opens after the second crossing: telegraph poles ticking past, farmsteads turning in the haze, a level crossing where somebody always waves. Timetable discipline is the whole craft here — hold line speed, protect the schedule, and read the road two signals ahead.',
      facts: [
        { label: 'Line speed', value: '110 km/h' },
        { label: 'Route km', value: '214.6' },
        { label: 'Signalling', value: '4-aspect colour light' },
      ],
      tags: ['Daylight run', 'Line speed', 'Level crossing'],
    },
    {
      id: 'viaduct',
      no: '03',
      railLabel: 'Steel Truss Viaduct',
      progress: 0.48,
      kicker: 'Station 03 · Steel Truss Viaduct',
      title: 'Three hundred metres of steel over the gorge.',
      lede: 'Golden hour on the viaduct is the photograph. The job is the expansion joint at each end.',
      body:
        'The deck narrows to a single line between the trusses and the river runs sixty metres below the sleepers. Crosswinds gust up the gorge; I hold ninety-six and keep the buff forces gentle so the coaches never hunt. Two expansion joints, one at either abutment — you hear both.',
      facts: [
        { label: 'Structure', value: '312 m through-truss' },
        { label: 'Piers', value: '6 · dressed stone' },
        { label: 'Bridge limit', value: '96 km/h' },
      ],
      tags: ['Golden hour', 'Gorge', 'Single line'],
    },
    {
      id: 'tunnel',
      no: '04',
      railLabel: 'Mountain Tunnel',
      progress: 0.66,
      kicker: 'Station 04 · Mountain Tunnel',
      title: 'Sixteen hundred metres of dark, then the far portal.',
      lede: 'The world closes in, and the sound changes before the light does.',
      body:
        'Tunnel lamps strobe past the windscreen, the roar of the bore takes over from the wind, and the haze turns the headlamp into a solid cone. I watch the lining for water and the kilometre posts for the gradient change. Then the portal opens onto deep twilight and the valley is suddenly enormous.',
      facts: [
        { label: 'Bore', value: '1,640 m · single track' },
        { label: 'Gradient', value: '1 in 102 falling' },
        { label: 'Lamp spacing', value: '13 m' },
      ],
      tags: ['Dusk', 'Tunnel roar', 'Gradient watch'],
    },
    {
      id: 'night',
      no: '05',
      railLabel: 'Night Signals',
      progress: 0.84,
      kicker: 'Station 05 · Night Signals',
      title: 'Reading the road at eighty-four, in the dark.',
      lede: 'Night running is where the job goes quiet, and where experience earns its keep.',
      body:
        'The headlamp cuts a corridor of gleaming rail. Gantries arrive as three lit lenses — green, double amber, amber — and the town below twinkles like a second signal diagram. Twenty-two years of nights teaches you the shape of a curve before the beam ever reaches it.',
      facts: [
        { label: 'Headlamp', value: '2 × 300 W · 400 m throw' },
        { label: 'Signal spacing', value: '1.2 km' },
        { label: 'Booked speed', value: '84 km/h' },
      ],
      tags: ['Night running', 'Signal gantries', 'Town lights'],
    },
    {
      id: 'terminal',
      no: '06',
      railLabel: 'Terminal Arrival',
      progress: 0.96,
      kicker: 'Station 06 · Terminal Arrival',
      title: 'Platform stop, brake step by brake step.',
      lede: 'Six coaches, eleven hundred passengers, and a stop mark you have to hit inside half a metre.',
      body:
        'I start braking at the home signal and walk the brake off in steps, letting the train carry itself to the mark. The platform lights slide past the windscreen and stop. Doors release. Somebody claps, which never stops being funny.',
      facts: [
        { label: 'Formation', value: '6 LHB coaches' },
        { label: 'Stop accuracy', value: '± 0.4 m' },
        { label: 'Arrival', value: 'On the mark' },
      ],
      tags: ['Arrival', 'Platform stop', 'Turn-around'],
    },
  ],

  /* --------------------------------------------------------------- contact */
  dispatch: {
    label: 'Dispatch',
    title: 'Worth a conversation?',
    body:
      'Hiring, guest lectures on rail operations, or a walkthrough of this build — dispatch answers within two days.',
    primary: {
      label: 'Message dispatch',
      // Replace with the address that should receive enquiries.
      email: 'hello@example.com',
      subject: 'Portfolio enquiry — IRONLINE DIVISION',
    },
    secondary: {
      label: 'Route CV',
      email: 'hello@example.com',
      subject: 'Route CV request',
    },
  },

  /* ------------------------------------------------------------- HUD copy -- */
  hud: {
    route: 'Route progress',
    speed: 'Speed',
    signal: 'Signal',
    time: 'Time of day',
    progress: 'Journey',
    speedUnit: 'km/h',
    horn: 'Sound the horn',
    soundAria: 'Toggle cab and track audio',
    dispatchAria: 'Contact dispatch',
    railAria: 'Jump to a station along the route',
  },

  /**
   * Signal aspects produced by the world, with the words the HUD shows for each
   * and the colour used for the lamp.
   */
  aspects: {
    green: { label: 'Clear', detail: 'Green', tone: 'green' },
    'double-amber': { label: 'Caution', detail: 'Double amber', tone: 'amber' },
    amber: { label: 'Caution', detail: 'Amber', tone: 'amber' },
    red: { label: 'Stop', detail: 'Red', tone: 'red' },
  },

  /** Clock time shown for each time-of-day the world reports. */
  clock: {
    morning: '05:40',
    daylight: '09:15',
    'golden-hour': '18:20',
    sunset: '19:05',
    dusk: '19:40',
    night: '21:50',
  },

  /** Names of the world's lighting grades, for the small HUD caption. */
  grades: {
    morning: 'Dawn',
    daylight: 'Daylight',
    'golden-hour': 'Golden hour',
    sunset: 'Sunset',
    dusk: 'Dusk',
    night: 'Night',
  },

  meta: {
    // Used in the footer line and the HTML <title>.
    title: 'IRONLINE DIVISION — Loco Pilot Portfolio',
    description:
      'A 3D rail portfolio: ride a mainline electric from the origin yard cab, across a steel viaduct at golden hour, through a mountain tunnel, to a night terminal arrival.',
    footer: 'Built from one continuous procedural rail corridor. No 3D models, no image files, no audio files.',
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

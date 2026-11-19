/**
 * portfolio.js
 * ============================================================================
 * Every word, number and link the site shows lives here. Edit this file to make
 * the portfolio yours — the layout, the 3D flight and the soundscape all read
 * from these fields, so nothing else needs to change.
 *
 * The only structural rule: `stations` is ordered, and each `progress` value is
 * the position along the flight (0 = lined up on 09L, 1 = rolled out on 27R)
 * where that station's camera and sky are set. The values below sit inside the
 * five phases of `src/scene/aeroWorld.js`:
 *
 *   departure   0.00 – 0.15   flight deck, runway 09L at dawn
 *   climb       0.15 – 0.38   rotation, lift-off through the cloud decks
 *   cruise      0.38 – 0.65   FL370 above the cloud sea, morning → sunset
 *   descent     0.65 – 0.85   night descent over the glowing city grid
 *   approach    0.85 – 1.00   final approach and touchdown, runway 27R
 *
 * Keep each `progress` inside its band or the camera will look at scenery that
 * does not match the copy.
 * ========================================================================== */

const portfolio = {
  /* ------------------------------------------------------------- identity -- */
  brand: {
    mark: 'MF',
    name: 'MERIDIAN FLIGHT DECK',
    tagline: 'Senior Airline Captain · Long-Haul & Timezone Operations Portfolio',
    // Short form used in the page title and the mobile HUD.
    shortName: 'MERIDIAN',
  },

  captain: {
    name: 'Commercial Airline Captain',
    role: 'Senior Airline Captain',
    base: 'Long-haul fleet · A350',
    years: '19 years, 14,200 hours',
    signature: 'Commercial Airline Captain · Long-haul fleet · 14,200 hours',
  },

  /* ----------------------------------------------------------- sound gate -- */
  sound: {
    title: 'Enable Cockpit & Engine Audio?',
    body:
      'The soundscape is synthesised live in your browser — two high-bypass turbofans, slipstream wind, the cabin chime. No files are downloaded, and nothing plays until you ask for it.',
    enable: 'Enable Sound',
    muted: 'Continue Muted',
    hint: 'Enter to enable · Esc to continue muted',
    pillOn: 'Sound On',
    pillOff: 'Sound Off',
    chime: 'Chime',
    chimeAria: 'Play the cabin chime',
    // Two-tone cabin chime that plays when sound is enabled.
    enableChime: true,
  },

  /* --------------------------------------------------------------- stations */
  stations: [
    {
      id: 'departure',
      no: '01',
      railLabel: 'Departure',
      progress: 0.06,
      kicker: 'Station 01 · Departure · RWY 09L',
      title: 'Clearance copied. Runway 09L.',
      lede:
        'The flight deck is cold black glass until the first switch, and then it is a sunrise with numbers on it.',
      body:
        'ATIS in the headset, before-start checklist down the line, pushback at 05:22 with the ramp still under sodium light. Taxi is the quiet part of the job: two miles of blue taxiway lights, a turn onto 09L, and the whole aeroplane waiting for a number on the airspeed tape. I have done this four thousand times and I still watch the engine instruments settle before I ask for take-off thrust.',
      facts: [
        { label: 'Aircraft', value: 'A350-900 · twin-aisle' },
        { label: 'Runway', value: '09L · 3,000 m · dry' },
        { label: 'Pushback', value: '05:22 · on schedule' },
      ],
      tags: ['Flight deck', 'Dawn', 'Before start'],
      zone: 'Home base',
    },
    {
      id: 'climb',
      no: '02',
      railLabel: 'Rotation & Climb',
      progress: 0.26,
      kicker: 'Station 02 · Rotation & Climb',
      title: 'Positive rate. Gear up.',
      lede:
        'One hundred and fifty-two knots, a gentle pull, and eleven hours of your life starts leaving the ground.',
      body:
        'Rotation is the only moment where the aeroplane is doing exactly what your hand is asking and nothing else. Climb thrust set, gear cycling into the wells, the SID turning us out over water before the city has finished its first coffee. Every one thousand feet the cabin pressure nudges the ears of three hundred people, and most of them are asleep already.',
      facts: [
        { label: 'Rotation', value: 'Vr 152 kt · flaps 2' },
        { label: 'Climb', value: 'FL370 · step to 390' },
        { label: 'SID', value: 'Coastal 2A departure' },
      ],
      tags: ['Lift-off', 'Cloud deck', 'Climb thrust'],
      zone: 'Climb out',
    },
    {
      id: 'cruise',
      no: '03',
      railLabel: 'Cruise · FL370',
      progress: 0.55,
      kicker: 'Station 03 · Cruise · FL370',
      title: 'Eight hours of daylight, borrowed from the west.',
      lede:
        'Long-haul is mostly a negotiation with your own body clock — the aeroplane flies itself, you do not.',
      body:
        'Above the cloud sea the horizon bends the light. We cross three timezones before the meal service ends, and the sunset comes late and slow because we are chasing it. CPDLC chits arrive as text; the step climb to 390 waits for a lighter aeroplane. This is the part passengers film and pilots monitor: fuel against plan, weather ahead, and the quiet arithmetic of whether the body will sleep at the right hour tonight.',
      facts: [
        { label: 'Cruise', value: 'FL370 · M 0.84' },
        { label: 'Timezones', value: '3 crossed · dusk sector' },
        { label: 'Sunset', value: '18:47 · local' },
      ],
      tags: ['Cloud sea', 'Golden hour', 'Body clock'],
      zone: 'Westbound drift',
    },
    {
      id: 'descent',
      no: '04',
      railLabel: 'Descent · Night City',
      progress: 0.75,
      kicker: 'Station 04 · Descent · Night City',
      title: 'The city switches itself on before we arrive.',
      lede:
        'Forty-four thousand lights, and one of them is the road home.',
      body:
        'Descent begins a hundred and twenty miles out and the world below resolves from a black field into grids, rivers, and the orange seams of motorways. The STAR threads us between arrivals we can see as moving stars. Approach brief, minima, missed-approach altitude — spoken aloud by the pilot flying and confirmed by the pilot monitoring, because that is how two people stay one crew at the end of a long duty day.',
      facts: [
        { label: 'Descent', value: '3° path · 1,800 fpm' },
        { label: 'City lights', value: '44,000+ points' },
        { label: 'Arrival', value: 'ILS 27R · CAT II' },
      ],
      tags: ['Night', 'STAR', 'City grid'],
      zone: 'Arrival zone',
    },
    {
      id: 'approach',
      no: '05',
      railLabel: 'Final · RWY 27R',
      progress: 0.92,
      kicker: 'Station 05 · Final Approach · RWY 27R',
      title: 'Lined up, landing lights on, logbook open.',
      lede:
        'Everything the flight was for happens in the last ninety seconds.',
      body:
        'The runway appears as a seam of white between the approach lights and the city. Flaps full, autopilot out at four hundred feet, hands on the sidestick, eyes on the aiming point. The flare is small and unhurried; the mains settle, and the aeroplane becomes a building moving at a hundred and thirty knots. Then the chime, the doors, a new timezone to sleep in.',
      facts: [
        { label: 'Runway', value: '27R · 3,400 m · night' },
        { label: 'Minima', value: '200 ft · CAT II' },
        { label: 'Touchdown', value: 'Zone +300 m' },
      ],
      tags: ['Final approach', 'Touchdown', 'Logbook'],
      zone: 'Destination',
    },
  ],

  /* --------------------------------------------------------------- contact */
  dispatch: {
    label: 'Logbook',
    title: 'Logbook & contact',
    body:
      'Hiring, simulator instruction, guest lectures on long-haul operations, or a walkthrough of this build — the deck answers within two days.',
    primary: {
      label: 'Write to the deck',
      // Replace with the address that should receive enquiries.
      email: 'hello@example.com',
      subject: 'Portfolio enquiry — MERIDIAN FLIGHT DECK',
    },
    secondary: {
      label: 'Request the CV',
      email: 'hello@example.com',
      subject: 'Logbook CV request',
    },
  },

  /* ------------------------------------------------------------- HUD copy -- */
  hud: {
    rail: 'Flight progress',
    altitude: 'Altitude',
    airspeed: 'Airspeed',
    zone: 'Timezone',
    local: 'Local time',
    progress: 'Flight',
    altitudeUnit: 'ft',
    speedUnit: 'kts',
    chime: 'Sound the cabin chime',
    soundAria: 'Toggle cockpit and engine audio',
    logbookAria: 'Open the logbook and contact details',
    railAria: 'Jump to a station along the flight',
    panelTitle: 'Flight telemetry',
  },

  /** Zone names for each phase id reported by the world. */
  zones: {
    departure: 'Home base',
    climb: 'Climb out',
    cruise: 'Westbound drift',
    descent: 'Arrival zone',
    approach: 'Destination',
  },

  /** Fallback local clock for each phase id (the world also reports one). */
  clockFallback: {
    departure: '05:38',
    climb: '06:21',
    cruise: '18:47',
    descent: '22:14',
    approach: '23:04',
  },

  meta: {
    title: 'MERIDIAN FLIGHT DECK — Aero Pilot Portfolio',
    description:
      'A 3D flight portfolio: a long-haul captain’s day from the flight deck on runway 09L, through rotation and a cloud-sea cruise at FL370, into a night descent over the city and a final approach to 27R.',
    footer:
      'Built from one continuous procedural flight. No 3D models, no image files, no audio files.',
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

// content.js — ALL copy for the portfolio layer lives here.
// Persona copy is in the single PERSONA object below: swap that one
// object to re-skin the whole site. Machine facts are drawn from the
// research inventories in research/ — keep them accurate.

// ------------------------------------------------------------- persona ----
export const PERSONA = {
  name: 'Power Systems Engineer',
  role: 'Power Systems Engineer',
  location: 'Pune · working across India',
  email: 'hello@example.com',
  socials: [
    { label: 'GitHub', href: '#' },
    { label: 'LinkedIn', href: '#' },
  ],
  about: [
    'I am a power-systems engineer: substations, protection and grid operations are my trade. For ten years I have designed, commissioned and troubleshot the equipment that sits between the power station and the city — transformers, breakers, relays and the buses that tie them together.',
    'My work runs from fault-level studies and relay settings at a desk to 06:00 yard walkdowns with a thermal camera: 132/33 kV air-insulated substations, 400 kV transmission interfaces, distribution rings and the control rooms that watch over all of it.',
    'This site is one of those substations, rebuilt in 3D — the 132/33 kV Meridian Road yard at dawn. Scroll through it, drag to look around, and click the equipment: everything you can select is something I have specified, set or commissioned.',
  ],
  experience: [
    {
      role: 'Senior Power Systems Engineer',
      org: 'GridWorks Consulting',
      period: '2021 — Present',
      bullets: [
        'Lead engineer for 132/33 kV AIS substation design and refurbishment — bay layouts to IEC 61936 clearances, earthing to IEEE 80, and commissioning through to first energisation.',
        'Protection coordination and relay setting studies for transmission and distribution clients: distance, differential and overcurrent schemes across 400/132/33/11 kV.',
        'Transformer condition work — OLTC diagnostics, Buchholz and oil-test interpretation, and loading reviews that kept a 50 MVA unit at 87% of its ONAF rating inside its thermal limits.',
      ],
    },
    {
      role: 'Protection Engineer',
      org: 'VoltEdge EPC',
      period: '2017 — 2021',
      bullets: [
        'Set and site-tested protection for eleven 132 kV bays — CT/VT sizing, secondary injection and end-to-end trip testing with the control room.',
        'Ran auto-reclose and fault investigations, including a transient earth-fault trip reclosed in 0.9 s with no customer interruption.',
        'Built the setting-calculation templates the company still uses for feeder and transformer bays.',
      ],
    },
    {
      role: 'Electrical Engineer — Distribution',
      org: 'City Distribution Company',
      period: '2014 — 2017',
      bullets: [
        'Planned and commissioned 11 kV open-ring feeders and RMU switching stations across a city network peaking at 612 MW.',
        'Pole- and plinth-transformer replacements under live-network constraints — 315 kVA and 500 kVA units swapped on planned outages.',
        'Load-curve and loss studies that targeted the feeders worth reinforcing first.',
      ],
    },
  ],
  // The six stations are the project list: each entry links to its
  // standalone station page.
  projects: [
    {
      name: 'Station 01 — Control Room at Dawn',
      meta: 'Grid operations · SCADA / EMS',
      href: 'station01.html',
      body: 'The load-despatch control room at 05:58, watching the morning ramp: grid frequency at 49.93 Hz, ACE at −180 MW, and on the single-line diagram the Meridian Road yard — where FDR-2 has just tripped and auto-reclosed at 05:56.',
      tags: ['SCADA / EMS', 'AGC & ACE', 'Event analysis'],
    },
    {
      name: 'Station 02 — Substation Yard',
      meta: '132/33 kV Meridian Road · AIS',
      href: 'station02.html',
      body: 'The hero yard, and the scene behind this page: two 40/50 MVA transformers, five AIS bays on a double strain bus at 131.4 kV, SF₆ breakers, wave traps at the line entries and a 650 mm fire wall between the transformers.',
      tags: ['Substation design', '132 kV AIS', 'Commissioning'],
    },
    {
      name: 'Station 03 — Transmission Corridor',
      meta: '400 kV Riverbend–Kestrel D/C line',
      href: 'station03.html',
      body: 'A 400 kV double-circuit corridor: lattice towers at 400 m ruling spans, quad ACSR Moose conductors in true catenaries, 23-disc insulator strings and the statutory 8.84 m ground clearance held at the hottest, saggiest hour.',
      tags: ['Overhead lines', 'Sag & clearance', 'Tower loading'],
    },
    {
      name: 'Station 04 — Turbine Hall',
      meta: '660 MW Unit 5 · 3,000 rpm',
      href: 'station04.html',
      body: 'Inside the power station: a 660 MW tandem-compound turbine-generator train more than 55 m long, running at 640 MW on a spring-isolated pedestal tuned to 2–3 Hz — with the 200 t cranes that lift its 360 t stator.',
      tags: ['Generation plant', 'TG pedestal', 'Heavy lifts'],
    },
    {
      name: 'Station 05 — Renewables at Golden Hour',
      meta: 'Suryagarh Hybrid Park, Block C',
      href: 'station05.html',
      body: 'Wind, solar and storage behind one fence at 18:30: 8 × Vestas V150-4.5 MW turbines, 28 MWp of solar and 10 Megapacks discharging at 9.8 MW — so the park still exports 25.3 MW to the 132 kV grid as the sun lets go.',
      tags: ['Hybrid plant', 'Evening ramp', '132 kV pooling'],
    },
    {
      name: 'Station 06 — City Grid at Night',
      meta: 'Feeder F-7 · 11 kV open ring',
      href: 'station06.html',
      body: 'Distribution after dark: an 11 kV open ring down a city street at the 20:15 peak — 612 MW across the city, a 315 kVA pole transformer at 78% load, RMU switching, and the load-curve wall that explains the whole day.',
      tags: ['Distribution', '11 kV rings', 'Load studies'],
    },
  ],
  skills: [
    'Substation design (AIS)', 'Protection relaying', 'IEC 61850',
    'Fault-level studies', 'CT / VT sizing', 'Earthing (IEEE 80)',
    'Transformer diagnostics', 'OLTC & Buchholz', 'SCADA / EMS',
    'Load flow — PowerFactory', 'ETAP', 'Commissioning & SAT',
  ],
  contactBlurb:
    'I am currently open to senior power-systems roles and consulting on substation design, protection and commissioning. The fastest way to reach me is email.',
};

// ------------------------------------------------- journey caption cards --
// One card per camera stop, in flight order — the six verified poses of
// station02-main.js. Facts: research/station02-components.md.
export const STOPS = [
  {
    kicker: 'Station 02 · The Yard',
    title: 'Meridian Road, 132/33 kV, at 06:04',
    body: 'Through the gate of an air-insulated substation on a clear morning: a double 132 kV bus overhead, five bays at 12.2 m pitch, and two 40/50 MVA transformers humming south of the equipment row. The bus sits at 131.4 kV and the city is waking up — this yard feeds a good part of it.',
  },
  {
    kicker: 'The Transformer',
    title: 'T-2 at 87 percent, fans running',
    body: 'Transformer T-2 up close: 40 MVA on natural oil and air, 50 MVA with its radiator fans running — and this morning they are, carrying 43.6 MVA at 87% of the fan-cooled rating. The on-load tap changer sits on tap 7 of 17, holding the 33 kV side steady against the morning ramp.',
  },
  {
    kicker: 'The Lid',
    title: 'Conservator, Buchholz and breathers',
    body: 'From above the lid: the conservator tank breathes for the main tank through a silica-gel breather, and in the pipe between them sits the Buchholz relay — the transformer’s smoke alarm, watching for gas from incipient faults. Porcelain bushings rise through the lid, 650 kVp of lightning-impulse insulation in each stack of sheds.',
  },
  {
    kicker: 'The Bay Line',
    title: 'Disconnector, breaker, CT, arrester',
    body: 'Every bay repeats the same chain: bus disconnector, SF₆ circuit breaker, line disconnector, current transformer, surge arrester. The FDR-2 breaker at the far end is the one that opened and reclosed at 05:56 — its operation counter reads 4,813, one more than its neighbours, and its arrester counter reads 17 for the same reason.',
  },
  {
    kicker: 'The Bus',
    title: 'Two buses, one yard',
    body: 'Along the double strain bus at 9 m: bus-1 and bus-2, each able to feed every bay through its disconnectors, so any single bus — or breaker — can be taken out for maintenance without dropping a feeder. Bus-2 sags a fraction more than bus-1. It has since it was strung; the droppers don’t mind.',
  },
  {
    kicker: 'The Fire Wall',
    title: '650 mm of just-in-case',
    body: 'Between the transformers stands a reinforced-concrete fire wall, 650 mm thick and reaching past the conservator outline. Each transformer holds some 38,500 litres of oil; if one ever burns, the wall buys the other one — and the yard — the time that matters. Scroll on for the work behind the yard.',
  },
];

// ----------------------------------------------------- clickable machines --
// Panel content for the raycast zones built in journey.js from
// station02Anchors(). `lines` are the 2–3 factual lines shown in the
// info panel. Facts: research/station02-components.md.
export const ZONES = {
  'transformer-t2': {
    name: 'Transformer T-2 · 40/50 MVA',
    lines: [
      '132/33 kV, vector group YNd11 — 40 MVA ONAN, 50 MVA with the radiator fans running.',
      'This morning: 43.6 MVA (87% of ONAF), fan groups 1 + 2 running, top-oil 61 °C.',
      'OLTC on tap 7 of 17 (+5% / −15% in 1.25% steps); impedance 10%.',
    ],
  },
  'nameplate-t2': {
    name: 'T-2 nameplate',
    lines: [
      'Rating plate: 40/50 MVA · 132/33 kV · YNd11 · impedance 10.0%.',
      'Rated currents 219 A (HV) / 875 A (LV); insulation 650 kVp LIWV on the HV side.',
      'Oil quantity ≈ 38,500 L; total mass in service ≈ 112 t.',
    ],
  },
  'buchholz-t2': {
    name: 'Buchholz relay · T-2',
    lines: [
      'In the Ø80 mm pipe between tank and conservator (IS 3637) — gas and oil-surge protection.',
      'Gas from an incipient fault collects under the sight glass; a major fault surges oil and trips instantly.',
      'The transformer’s smoke alarm — small, cheap, and it has saved more units than any relay in the yard.',
    ],
  },
  'breaker-fdr2': {
    name: 'FDR-2 circuit breaker · SF₆',
    lines: [
      'Live-tank SF₆ breaker, 3AP1 class for 145 kV — 31.5 kA for 3 s, poles on 1,700 mm centres.',
      'This is the breaker that opened on the 05:56 earth fault and reclosed 0.9 s later.',
      'Operation counter: 4,813 — one ahead of FDR-1, since 05:56.',
    ],
  },
  'wave-trap-fdr1': {
    name: 'Wave traps · FDR-1 entry',
    lines: [
      'Suspended in each phase at the line entry — a tuned LC trap hung in series with the conductor.',
      'They pass 50 Hz power straight through and block the power-line carrier signal, keeping protection and voice channels inside the yard’s own line section.',
    ],
  },
  'firewall': {
    name: 'Fire wall · between T-1 and T-2',
    lines: [
      'Reinforced concrete, 650 mm thick, extending beyond the conservator outline in plan and height.',
      'Utility rule for adjacent oil-filled transformers: if one tank burns, the wall shields the other.',
      'Coping stones cap the top; the fire point and hydrant stand at its south end.',
    ],
  },
  'bus': {
    name: 'Double strain bus · 132 kV',
    lines: [
      'Two strain buses at 9.0 m over a 61 m band — bus-2 strung with a touch more sag than bus-1.',
      'Bus voltage this morning: 131.4 kV. Every bay selects either bus at its disconnectors.',
      'Droppers fall from both buses to each bay, so a bus outage never means a feeder outage.',
    ],
  },
  'future-bay-earth': {
    name: 'Future bay · earthed',
    lines: [
      'The yard’s spare position: disconnector built, ready for the feeder that hasn’t been sanctioned yet.',
      'Its earth switch is CLOSED with the red tag “EARTHED · PTW-118” — earthed is its safe resting state.',
    ],
  },
  'control-building': {
    name: 'Control building',
    lines: [
      'Protection relays, battery room and the SCADA front-end for the yard live in here.',
      'The 33 kV switchboard is indoors — six outgoing feeders leave by cable from this building.',
      'Every trip and reclose in the yard is time-stamped in its event recorder — including 05:56.',
    ],
  },
  'lv-interface': {
    name: '33 kV interface · T-2',
    lines: [
      'Rigid aluminium tube bus carries T-2’s 33 kV output across to the take-off gantry.',
      'Cable sealing ends — black heat-shrink terminations with red stress cones — drop the power underground toward the control building.',
      'Three 36 kV-class surge arresters guard the cable against switching surges.',
    ],
  },
};

/**
 * portfolio.js
 * -----------------------------------------------------------------------------
 * Every word, link, number and station on the site lives here. Edit this file
 * only — index.html binds to these keys at boot and the zone rail is generated
 * from `sections`, so nothing else has to be touched when you swap in your own
 * material.
 *
 * Fast swap checklist
 *   1. brand.*                     → your lab, your name, your role
 *   2. hero.*                      → the big statement and the one-paragraph intro
 *   3. about / capabilities        → what you actually do
 *   4. projects[0..2]              → three real projects (+ URLs)
 *   5. architecture                → how the systems (and this page) are built
 *   6. contact.*                   → email, links, CTA copy
 *
 * The six spatial zones are fixed by the hardware rig (one ATX workstation that
 * can be exploded for inspection). Keep `sections[].id` in sync with the
 * matching <section id="…"> in index.html; the camera path lives in src/main.js.
 */

export const portfolio = {
  /* ------------------------------------------------------------------ brand */
  brand: {
    // Shown in the HUD, the footer and the page title. 20 characters or fewer
    // keeps the top-left pill on one line.
    name: 'SILICON & SYSTEMS',
    // Monogram in the round HUD badge.
    mark: 'S&S',
    // Small line under the name (hidden below 860 px).
    role: 'Computer engineering · AI hardware'
  },

  /* ------------------------------------------------------------------- hero */
  hero: {
    // The h1 is three lines; the middle one is set in italic display type.
    lineOne: 'Computer engineering,',
    lineTwo: 'from logic gate',
    lineThree: 'to thermal loop.',
    lede:
      'Silicon & Systems Lab designs AI accelerators and the systems that keep them honest — RTL and verification, board bring-up, thermal control, and the firmware that reports what the silicon is actually doing.',
    availability: 'Open for architecture & bring-up work',
    focus: 'Accelerators · SoC · thermal systems'
  },

  /* ------------------------------------------------------------------ about */
  about: {
    title: 'The bus is the contract',
    bodyOne:
      'A motherboard is not a picture of a computer, it is a schedule: every device on the board is arguing for a slice of the same memory bus, and the board is the arbitration you can photograph. DDR5 channels, a PCIe 5.0 link, an M.2 drive and eighteen VRM phases all sit inside one impedance budget.',
    bodyTwo:
      'I design across those boundaries. The same engineer who writes the RTL should be able to probe the rail with a scope, read the thermal log at 3 a.m. and explain why the boost clock fell off at minute nine.'
  },

  /* ----------------------------------------------------------- capabilities */
  capabilities: [
    {
      name: 'RTL & verification',
      detail: 'SystemVerilog and Chisel microarchitecture, UVM testbenches, formal coverage on the datapath.'
    },
    {
      name: 'SoC & board bring-up',
      detail: 'Power sequencing, clocking, DDR training, PCIe enumeration — from first light to production firmware.'
    },
    {
      name: 'Accelerator architecture',
      detail: 'Systolic arrays, memory hierarchies and scheduling for inference workloads at the edge.'
    },
    {
      name: 'Thermal & power control',
      detail: 'Loop control, fan curves and telemetry firmware that keeps a performance budget honest.'
    }
  ],

  /* --------------------------------------------------------------- projects */
  // Three featured projects. `stack` renders as chips; keep it to four items.
  projects: [
    {
      kicker: 'Featured project',
      title: 'Tessera NPU',
      year: '2026',
      role: 'Microarchitecture · RTL · verification',
      summary:
        'A 16-tile inference accelerator for edge robotics: a RISC-V control core, a 128×128 INT8 systolic array and a scratchpad hierarchy sized by the workloads rather than by the spec sheet. Delivered as a verified RTL package with 94% coverage on the datapath.',
      stack: ['SystemVerilog', 'UVM', 'Chisel', '5 nm'],
      url: 'https://example.com/work/tessera-npu',
      cta: 'Read the architecture note'
    },
    {
      kicker: 'Featured project',
      title: 'Coldplate',
      year: '2025',
      role: 'Firmware · control · telemetry',
      summary:
        'Thermal control firmware for a liquid-cooled rack of accelerators: a 400 Hz loop over pump and fan duty, per-inlet coolant sensing, and a 2 ms telemetry stream that lets the scheduler trade 4% of throughput for a 9 °C margin instead of throttling blind.',
      stack: ['C', 'FreeRTOS', 'PID', 'Modbus'],
      url: 'https://example.com/work/coldplate',
      cta: 'See the control loop'
    },
    {
      kicker: 'Featured project',
      title: 'Bitstream',
      year: '2024',
      role: 'FPGA · quantisation · deployment',
      summary:
        'An INT8 inference pipeline on a mid-range FPGA for a warehouse robotics team. Tensor scheduling, on-chip buffering and a bit-exact reference model, so the deployment matched the trained network to the last count — 3.2 ms per frame at 11 W.',
      stack: ['Verilog', 'INT8', 'Xilinx', 'Vitis'],
      url: 'https://example.com/work/bitstream',
      cta: 'Open the case study'
    }
  ],

  /* ----------------------------------------------------------- architecture */
  // Describes the page you are on — keep it, or repurpose it as "process".
  architecture: [
    {
      title: 'One rig, six zones',
      body:
        'A single ATX workstation is the whole world. The camera flies a spline through six stations — overview, board, die, loop, tensor core, exploded system — and never cuts.'
    },
    {
      title: 'One state, every surface',
      body:
        'The AI workload and the explode amount are single numbers. Silicon temperature, fan RPM, airflow density, coolant glow, audio tone and the HUD readout are all sampled from them.'
    },
    {
      title: 'Exploded is a dimension',
      body:
        'Every part carries an assembly axis. Scrolling the last zone, or pressing Exploded, drives the same factor — so the case comes apart without a single extra geometry.'
    }
  ],

  /* ---------------------------------------------------------------- contact */
  contact: {
    title: 'Send me a block diagram.',
    body:
      'Architecture reviews, bring-up help, or a system that has to be built twice — once to learn and once to ship. I answer within two days, usually with questions about your power budget.',
    email: 'hello@example.com',
    emailHref: 'mailto:hello@example.com',
    links: [
      { label: 'Email', value: 'hello@example.com', href: 'mailto:hello@example.com' },
      { label: 'GitHub', value: 'silicon-systems', href: 'https://example.com/github' },
      { label: 'LinkedIn', value: 'Muse', href: 'https://example.com/linkedin' },
      { label: 'Read.cv', value: 'muse', href: 'https://example.com/readcv' }
    ]
  },

  footer: {
    credit:
      'Built with three.js, GSAP and Lenis — procedural hardware, no textures, no video.'
  },

  /* --------------------------------------------------------------- stations */
  /**
   * The six spatial zones. `index` is the rail label, `name` the zone title,
   * `spec` the technical subtitle and `label` the short rail caption. The
   * matching camera pose for each zone lives in `CAMERA_POSES` (src/main.js).
   */
  sections: [
    {
      id: 'overview',
      index: '01',
      name: 'Rig Overview',
      short: 'Rig',
      spec: 'Full ATX workstation · 54 × 61 × 36 cm'
    },
    {
      id: 'motherboard',
      index: '02',
      name: 'Motherboard & Bus',
      short: 'Bus',
      spec: 'DDR5 · PCIe 5.0 · M.2 Gen5'
    },
    {
      id: 'cpu',
      index: '03',
      name: 'CPU & Silicon Die',
      short: 'Die',
      spec: '16 cores · 96 MB L3 · 3 nm'
    },
    {
      id: 'cooling',
      index: '04',
      name: 'Liquid Cooling Loop',
      short: 'Loop',
      spec: '360 mm radiator · 2.4 L/min'
    },
    {
      id: 'gpu',
      index: '05',
      name: 'GPU & AI Tensor Core',
      short: 'Tensor',
      spec: 'Triple fan · 24 GB GDDR7'
    },
    {
      id: 'architecture',
      index: '06',
      name: 'System Architecture',
      short: 'System',
      spec: 'Exploded view · portfolio & contact'
    }
  ],

  /* ------------------------------------------------- live telemetry labels */
  // The values are measured every frame; only the labels and units live here.
  telemetry: {
    title: 'Live telemetry',
    items: [
      { id: 'core-temp', label: 'Core temp', unit: '°C' },
      { id: 'fan-rpm', label: 'Fan speed', unit: 'rpm' },
      { id: 'ai-load', label: 'AI load', unit: '%' },
      { id: 'explode', label: 'Explode', unit: '%' }
    ]
  }
};

export default portfolio;

/* Small helpers used by main.js --------------------------------------------- */

/** Resolve "projects.0.title" against the config object. */
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

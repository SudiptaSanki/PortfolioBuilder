// content.js — ALL copy for the portfolio layer lives here.
// Persona copy is in the single PERSONA object below: swap that one object
// to re-skin the whole site. Machine facts are drawn from
// research/datacentre-components.md — keep them accurate.

// ------------------------------------------------------------- persona ----
export const PERSONA = {
  name: 'AI Infrastructure Engineer',
  role: 'AI Infrastructure & ML Platform Engineer',
  location: 'London · working worldwide',
  email: 'hello@example.com',
  socials: [
    { label: 'GitHub', href: '#' },
    { label: 'LinkedIn', href: '#' },
  ],
  about: [
    'I build and run the physical layer of machine learning: GPU training clusters, the liquid cooling that keeps them alive, and the Kubernetes platforms that schedule work across them.',
    'Over the past nine years I have taken clusters from empty halls to production training systems — racking GB200 NVL72 systems, commissioning coolant distribution, and building the observability that tells you a node is failing before the training job does.',
    'This site is one of those halls, rebuilt in 3D. Scroll through it, drag to look around, and click the machines — everything you can select is something I have specified, installed or debugged.',
  ],
  experience: [
    {
      role: 'Senior AI Infrastructure Engineer',
      org: 'Helios Cloud',
      period: '2022 — Present',
      bullets: [
        'Led the build-out of a 2,048-GPU Blackwell training cluster — 32 NVL72 racks across two halls, from floor loading to first training run in five months.',
        'Designed the direct-to-chip liquid-cooling rollout: rack manifolds, CDU placement and leak detection across 8-rack pods.',
        'Cut training-job failure rates by 38% with node-health automation that drains failing GPUs before jobs land on them.',
      ],
    },
    {
      role: 'ML Platform Engineer',
      org: 'Northwind AI',
      period: '2019 — 2022',
      bullets: [
        'Built the multi-tenant Kubernetes GPU platform used by 120+ researchers — Slurm and Kueue scheduling with fractional GPU sharing.',
        'Shipped cluster-wide observability: per-GPU telemetry, p99 latency SLOs, and paging that only fires on faults a human can act on.',
        'Ran the H100 DGX fleet through two hardware refresh cycles with zero migration downtime.',
      ],
    },
    {
      role: 'Systems Engineer',
      org: 'Datacore Systems',
      period: '2016 — 2019',
      bullets: [
        'Commissioned raised-floor data halls — busway, cold-aisle containment and CRAH — for three enterprise build-outs.',
        'Automated provisioning and firmware management for 4,000+ servers with Ansible and custom tooling.',
        'On call for power and cooling incidents across a 6 MW estate.',
      ],
    },
  ],
  projects: [
    {
      name: 'NVL72 Training Cluster Build-Out',
      meta: 'Helios Cloud · 2024 — 2025',
      body: 'End-to-end delivery of a GB200 NVL72 training hall — the room this site models. Power, cooling and network were designed as one system: 120 kW racks on busway distribution, 1.3 MW CDUs per pod, and NVLink domains kept whole so 72 GPUs train as a single node.',
      tags: ['GB200 NVL72', 'Cluster design', 'Commissioning'],
    },
    {
      name: 'Direct-to-Chip Liquid Cooling Rollout',
      meta: 'Helios Cloud · 2023',
      body: 'Retrofitted liquid cooling into a live, air-cooled hall without downtime: rack manifolds, quick-disconnect hose pairs to every tray, and a staged CDU cut-over, pod by pod, while training continued.',
      tags: ['Liquid cooling', 'CDU', 'Live migration'],
    },
    {
      name: 'Cluster Observability Platform',
      meta: 'Northwind AI · 2021',
      body: 'A telemetry platform streaming per-GPU, per-tray and per-CDU metrics into one operational picture — throughput, GPU utilisation, p99 latency and cluster health — with alerts tuned to page only on actionable faults.',
      tags: ['Prometheus', 'Grafana', 'SLOs'],
    },
  ],
  skills: [
    'Kubernetes', 'Slurm / Kueue', 'CUDA & NCCL', 'GB200 NVL72',
    'Liquid cooling', 'NVLink / InfiniBand', 'Terraform', 'Ansible',
    'Prometheus & Grafana', 'Python', 'Go', 'Data-centre commissioning',
  ],
  contactBlurb:
    'I am currently open to senior infrastructure roles and consulting on GPU cluster build-outs. The fastest way to reach me is email.',
};

// ------------------------------------------------- journey caption cards --
// One card per camera stop, in flight order. Facts: research inventory.
export const STOPS = [
  {
    kicker: 'Station 03 · The Hall',
    title: 'A GPU training cluster, row by row',
    body: 'Sixteen racks in two rows of eight face into a contained cold aisle. Perforated floor tiles feed chilled air up through the aisle, and clear containment panels keep it apart from the hot air behind the racks. At roughly 120 kW per rack, this hall draws close to two megawatts — nearly all of it turned into heat the cooling plant must remove.',
  },
  {
    kicker: 'The Racks',
    title: 'GB200 trays, DGX gold',
    body: 'Each standard rack packs 18 compute trays — every tray a Grace CPU paired with four Blackwell GPUs — beneath nine NVLink switch trays and shelves of power supplies. The gold-fronted DGX chassis in the centre racks are the previous generation, kept on for inference work. Hundreds of status LEDs, green for healthy and blue for activity, shine through the perforated doors.',
  },
  {
    kicker: 'Networking',
    title: 'Fibre overhead, copper at the rear',
    body: 'Double-stacked ladder trays run the length of every row: power below, fibre above. Aqua bundles are OM4 multimode, yellow is OS2 single-mode — in a real hall, the colour code is the documentation. At the rear of each rack a copper NVLink cartridge wires the compute trays straight into the switch trays, so 72 GPUs behave as one machine.',
  },
  {
    kicker: 'Liquid Cooling',
    title: 'Water to every tray',
    body: 'Air alone cannot cool a 120 kW rack. A stainless manifold at each rack’s rear feeds a hose pair to every compute tray through quick-disconnect couplings, and the coolant distribution unit at the end of the row can reject up to 1.3 MW, serving eight racks at a time. Blue is supply, orange is return — the same code from the smallest hose to the overhead mains.',
  },
  {
    kicker: 'Power',
    title: 'Busway, tap-offs and copper',
    body: 'An enclosed busway runs above each row. A tap-off box plugs in over every rack and drops a power whip into its top, bare copper busbars ride alongside the trays, and inside the rack a 50 V DC busbar feeds power shelves of six 5.5 kW modules — so a single PSU failure never stops a training run.',
  },
  {
    kicker: 'The Full Picture',
    title: 'Sixteen racks, one system',
    body: 'Compute, network, power and cooling are designed here as a single system — a failure in any one of them idles the whole cluster. Keeping that system training, day and night, is the job. Scroll on for the work behind the hall.',
  },
];

// ----------------------------------------------------- clickable machines --
// Templates for the raycast zones built in journey.js. `lines` are the
// 2–3 factual lines shown in the info panel.
export const ZONES = {
  gb200: (code) => ({
    name: `GB200 NVL72 rack · ${code}`,
    lines: [
      '18× 1U compute trays — each with 2 Grace CPUs and 4 Blackwell GPUs.',
      '9× NVLink switch trays, so 72 GPUs act as a single node.',
      'Around 120 kW per rack, direct-to-chip liquid cooled.',
    ],
  }),
  dgx: (code) => ({
    name: `DGX rack · ${code}`,
    lines: [
      '8U DGX chassis with the gold front panels of the H100 generation.',
      'Retained for inference and fine-tuning workloads.',
      'Air-cooled — note the fan grilles across each front panel.',
    ],
  }),
  manifold: (code) => ({
    name: `Rack manifold · ${code} rear`,
    lines: [
      'A 44U stainless manifold distributes coolant down the rack.',
      'Quick-disconnect couplings with blue caps — one hose pair per tray.',
      'The copper block beside it is the NVLink cable cartridge.',
    ],
  }),
  cdu: () => ({
    name: 'Coolant distribution unit · CDU',
    lines: [
      'Rejects up to 1.3 MW of heat to the facility water loop.',
      'One in-row CDU serves up to eight racks.',
      'Blue supply and orange return mains feed it from overhead.',
    ],
  }),
  busway: () => ({
    name: 'Busway & tap-off boxes',
    lines: [
      'Enclosed busway trunking runs the length of each row.',
      'One tap-off box per rack, with a power whip into the rack top.',
      'Bare copper busbars ride alongside the cable trays.',
    ],
  }),
  trays: () => ({
    name: 'Fibre ladder trays',
    lines: [
      'Double-stacked galvanised trays — power below, fibre above.',
      'Aqua is OM4 multimode fibre; yellow is OS2 single-mode.',
      'Suspended on threaded rods from the ceiling structure.',
    ],
  }),
};

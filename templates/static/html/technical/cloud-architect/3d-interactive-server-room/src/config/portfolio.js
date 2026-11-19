// portfolio.js — all human-facing content for the server room tour.
// Edit this one file to make the site yours: name, role, contact, the six
// tour stops and every machine card. Geometry lives in world.js; this file
// only holds words and live-spec numbers.

export const PROFILE = {
  name: 'Cloud & AI Infrastructure',
  role: 'Principal Cloud & AI Infrastructure',
  hall: 'Station 03 · AI & Cloud Hall',
  location: '16-rack hall · dual-row cold aisle',
  summary:
    'I design, build and operate the compute, cooling and network fabric behind ' +
    'production AI and cloud platforms — from 42 kW GPU racks to 99.99% app APIs.',
  contact: {
    email: 'hello@example.com',
    availability: 'Open to Principal / Staff Infrastructure roles · remote or hybrid',
    note: 'Résumé and full case studies on request.',
    links: [
      { label: 'Email', href: 'mailto:hello@example.com' },
      { label: 'Copy address', action: 'copy-email' },
    ],
  },
  experience: [
    {
      period: '2022 — now',
      title: 'Principal Cloud & AI Infrastructure',
      org: 'AI platform group',
      detail:
        'GPU training estate, liquid cooling and the Kubernetes platform behind every ' +
        'product team. 99.99% API availability across 3 regions.',
    },
    {
      period: '2019 — 2022',
      title: 'Senior Site Reliability Engineer',
      org: 'Cloud applications',
      detail:
        'Autoscaling production APIs and the observability stack; p99 down 38%, pages ' +
        'down two thirds.',
    },
    {
      period: '2017 — 2019',
      title: 'Data Centre Engineer',
      org: 'Colocation operations',
      detail:
        'Power, containment and fibre build-outs across four halls; wrote the change-control ' +
        'runbooks still in use.',
    },
  ],
};

// ------------------------------------------------------------------ tour ---
// pose = camera position / target in world metres (see scene/world.js).
export const STOPS = [
  {
    id: 'entry',
    n: '01',
    title: 'Cold Aisle Entry',
    kicker: 'Work Experience',
    tag: 'Principal Cloud & AI Infrastructure',
    pose: { pos: [2.5, 1.75, 0.0], tgt: [-2.2, 1.0, 0.0] },
    body:
      'Sixteen 42U racks, two rows, one contained cold aisle. This hall carries the ' +
      'AI training estate and the production cloud that ships behind it: 344 kW of IT ' +
      'load, dual A+B power, and a 1.3 MW in-row cooling loop.',
    facts: [
      ['Hall', '16 racks · 2 rows'],
      ['IT load', '344 kW'],
      ['Design', 'N+1 power · N+1 cooling'],
    ],
    focus: { type: 'hall' },
  },
  {
    id: 'dgx',
    n: '02',
    title: 'DGX AI Training Racks',
    kicker: 'A04 — A05',
    tag: 'Multi-GPU training · NVLink · checkpointing',
    pose: { pos: [-2.32, 1.66, -0.28], tgt: [0.1, 1.05, 1.05] },
    body:
      'A04 and A05 are the training spine: eight-GPU nodes on an NVLink fabric, scheduled ' +
      'through Slurm and Kubernetes. Every job checkpoints to B06 so a node can fail ' +
      'without losing more than four minutes of work.',
    facts: [
      ['Per rack', '42 kW · 8 nodes'],
      ['Interconnect', 'NVLink + 400G IB'],
      ['Checkpoint', 'every 4 min → B06'],
    ],
    focus: { type: 'racks', ids: ['A04', 'A05'] },
  },
  {
    id: 'cooling',
    n: '03',
    title: 'In-Row Liquid Cooling',
    kicker: 'CDU-01',
    tag: 'Direct-to-chip · 1.3 MW thermal loop',
    pose: { pos: [3.4, 1.55, -1.8], tgt: [3.58, 1.0, 0.85] },
    body:
      'CDU-01 runs a direct-to-chip loop: 32 °C facility water in, 42 °C return, 42 m³/h ' +
      'of flow across the row. Cold plates sit on every GPU and CPU, so 42 kW racks stay ' +
      'off their thermal limits and fans never spin to maximum.',
    facts: [
      ['Loop', '1.3 MW · N+1 pumps'],
      ['Supply / return', '32.4 °C / 41.8 °C'],
      ['Flow', '42.1 m³/h'],
    ],
    focus: { type: 'rack', id: 'CDU-01' },
  },
  {
    id: 'overhead',
    n: '04',
    title: 'Overhead Fibre & Power Busway',
    kicker: 'Distribution',
    tag: 'Dual A+B feeds · OM4 / OS2 trunks',
    pose: { pos: [3.7, 2.45, -3.5], tgt: [-0.8, 1.85, 0.4] },
    body:
      'Two independent feeds land on separate busways, each rack tapping A and B through ' +
      'its own breaker. Aqua OM4 and yellow OS2 trunks ride the upper tray to both row ' +
      'ends, so a switch, PDU or tray can be replaced with the hall live.',
    facts: [
      ['Power', '2N · A+B busway'],
      ['Fibre', 'OM4 40/100G · OS2 400G'],
      ['Maintenance', 'zero-downtime swap'],
    ],
    focus: { type: 'overhead' },
  },
  {
    id: 'cloud',
    n: '05',
    title: 'App, Cloud & K8s Compute',
    kicker: 'B01 — B04',
    tag: 'Production APIs · autoscaling · 99.99%',
    pose: { pos: [1.35, 1.62, 0.35], tgt: [-1.45, 1.05, -0.7] },
    body:
      'B01 to B04 run the product surface: stateless API nodes, Kubernetes control planes ' +
      'and autoscaling batch runners, with B04 holding the LLM inference pool and its ' +
      'KV-cache. Rollouts are canaried at 1% and roll back on error budget, not opinion.',
    facts: [
      ['Availability', '99.99% · 3 AZ'],
      ['Autoscale', 'HPA + KEDA · 40 s'],
      ['Rollout', '1% canary → 100%'],
    ],
    focus: { type: 'racks', ids: ['B01', 'B02', 'B03', 'B04'] },
  },
  {
    id: 'contact',
    n: '06',
    title: 'NOC & Work Experience',
    kicker: 'Contact',
    tag: 'Career timeline · get in touch',
    pose: { pos: [-2.3, 1.88, 0.0], tgt: [2.4, 1.0, 0.0] },
    body:
      'The hall is monitored from the NOC: power, temperature, flow and error budgets on ' +
      'one wall. If you are hiring for infrastructure that has to stay up, the details are ' +
      'one message away.',
    facts: [
      ['Now', 'Principal Cloud & AI Infra'],
      ['Before', 'SRE · Data centre ops'],
      ['Contact', 'hello@example.com'],
    ],
    focus: { type: 'hall' },
    timeline: true,
  },
];

// --------------------------------------------------------------- machines ---
// code → card. Every rack A01–A08 / B01–B08 plus the in-row CDU.
export const MACHINES = {
  A01: {
    role: 'Edge & Network Core',
    kind: 'Top-of-rack switching',
    handle:
      'Two 32-port 400G switches per rack in an MLAG pair, fed A+B from separate busways. ' +
      'Uplinks leave on diverse OM4 paths to both row ends, so a single optic or switch ' +
      'can fail without dropping a training job.',
    specs: { power: 8.4, coolant: 24.6, load: 46, uptime: 99.995 },
    tags: ['2× 400G ToR', 'MLAG pair', 'A+B feeds'],
  },
  A02: {
    role: 'Cloud App & Kubernetes Nodes',
    kind: 'General compute · 2U dual-socket',
    handle:
      'Stateless Kubernetes workers with local NVMe for image and model cache. Nodes are ' +
      'cordoned and drained before any maintenance, and the autoscaler keeps 20% headroom ' +
      'so a rack can be worked on without touching customer traffic.',
    specs: { power: 12.6, coolant: 26.8, load: 63, uptime: 99.99 },
    tags: ['K8s workers', 'drain-first', 'A+B feeds'],
  },
  A03: {
    role: 'Kubernetes Control Plane',
    kind: 'Etcd quorum · 3 nodes',
    handle:
      'Three control-plane nodes with etcd on separate racks and separate power feeds. ' +
      'Backups run every 30 minutes to object storage in B08, and the quorum is tested in ' +
      'game days before every platform upgrade.',
    specs: { power: 13.2, coolant: 27.1, load: 58, uptime: 99.995 },
    tags: ['etcd quorum', '30 min backups', 'tested failover'],
  },
  A04: {
    role: 'DGX H100 AI Training',
    kind: '8× H100 SXM · NVLink spine',
    handle:
      'The training workhorse: direct-to-chip cold plates on all eight GPUs, 42 kW per rack, ' +
      'and an NVLink fabric that keeps collectives off the network. Jobs checkpoint to B06 ' +
      'every four minutes; a failed node is drained and replaced while the job resumes.',
    specs: { power: 42.5, coolant: 41.8, load: 94, uptime: 99.98 },
    tags: ['8× H100', 'direct-to-chip', '42 kW rack'],
  },
  A05: {
    role: 'DGX H100 AI Training',
    kind: '8× H100 SXM · NVLink spine',
    handle:
      'Twin of A04 on the same spine, so a 16-GPU job can span both racks over NVLink and ' +
      'InfiniBand. Power is capped at 42 kW per rack with per-tray telemetry; the scheduler ' +
      'reads that telemetry before placing a job.',
    specs: { power: 41.8, coolant: 41.2, load: 91, uptime: 99.98 },
    tags: ['8× H100', '16-GPU jobs', 'power-aware scheduling'],
  },
  A06: {
    role: 'Model Fine-Tuning & Eval',
    kind: 'Mixed A100 / L40S',
    handle:
      'Fine-tuning and evaluation sit on air-cooled A100 and L40S nodes, isolated from the ' +
      'H100 spine so a long eval sweep never queues behind a training run. Results stream ' +
      'into the feature store in B06.',
    specs: { power: 22.4, coolant: 30.2, load: 72, uptime: 99.97 },
    tags: ['A100 / L40S', 'eval isolation', 'feature store'],
  },
  A07: {
    role: 'Data Prep & Feature Pipelines',
    kind: 'CPU-heavy · 2U 64-core',
    handle:
      'Dataset tokenisation, dedup and shard building run here on 64-core nodes with 100G ' +
      'to the storage tier. Pipelines are idempotent and resumable, so a pre-empted pod ' +
      'simply picks up its last completed shard.',
    specs: { power: 18.9, coolant: 29.4, load: 68, uptime: 99.96 },
    tags: ['64-core', 'resumable', '100G storage'],
  },
  A08: {
    role: 'Observability & Telemetry',
    kind: 'Metrics · logs · traces',
    handle:
      'Prometheus, Loki and the trace store run on dedicated nodes so a noisy neighbour ' +
      'cannot blind the hall. Per-rack power, flow and temperature telemetry lands here at ' +
      'one-second resolution and feeds the NOC wall.',
    specs: { power: 9.6, coolant: 25.9, load: 51, uptime: 99.99 },
    tags: ['1 s telemetry', 'metrics/logs/traces', 'NOC feed'],
  },
  B01: {
    role: 'Production App & API Nodes',
    kind: 'Stateless · 3 AZ',
    handle:
      'The customer-facing API tier. Nodes are spread across three availability zones and ' +
      'drained before every change; a full rack loss costs capacity, never availability.',
    specs: { power: 14.2, coolant: 27.4, load: 66, uptime: 99.99 },
    tags: ['stateless', '3 AZ', 'drain-first'],
  },
  B02: {
    role: 'Cloud App & Kubernetes Nodes',
    kind: 'General compute · 2U dual-socket',
    handle:
      'Background services, webhooks and internal APIs. HPA scales on request rate and ' +
      'queue depth; KEDA handles the event-driven workers. Nightly node images are built ' +
      'and canaried before they reach this row.',
    specs: { power: 15.1, coolant: 27.9, load: 61, uptime: 99.99 },
    tags: ['HPA + KEDA', 'nightly images', 'A+B feeds'],
  },
  B03: {
    role: 'Autoscaling Batch & CI Runners',
    kind: 'Ephemeral · spot-tolerant',
    handle:
      'CI and batch jobs run on ephemeral runners that tolerate pre-emption. Racks are ' +
      'power-capped per tray so a burst of runners cannot trip a feed; the queue simply ' +
      'absorbs the throttle.',
    specs: { power: 16.8, coolant: 28.6, load: 74, uptime: 99.95 },
    tags: ['ephemeral', 'pre-emption safe', 'per-tray cap'],
  },
  B04: {
    role: 'LLM Inference & KV-Cache',
    kind: 'H100 / L40S inference pool',
    handle:
      'Latency-critical inference: paged KV-cache in host memory, continuous batching and ' +
      'a warm model per node. Direct-to-chip cooling keeps clocks steady under sustained ' +
      'load, and B05 takes the overflow when the pool saturates.',
    specs: { power: 38.6, coolant: 40.6, load: 87, uptime: 99.99 },
    tags: ['KV-cache', 'continuous batching', 'steady clocks'],
  },
  B05: {
    role: 'LLM Inference & KV-Cache',
    kind: 'Overflow inference pool',
    handle:
      'Second inference pool for burst and canary traffic. Requests are routed by queue ' +
      'depth, not round-robin, so a slow model cannot hold a healthy pool open.',
    specs: { power: 37.2, coolant: 39.8, load: 79, uptime: 99.99 },
    tags: ['overflow pool', 'queue-depth routing', 'canary'],
  },
  B06: {
    role: 'NVMe Feature & Object Storage',
    kind: 'All-flash · 12× NVMe per node',
    handle:
      'All-flash storage for checkpoints, datasets and the feature store: erasure-coded ' +
      'across nodes, replicated to B08, and benchmarked monthly. Training writes go to a ' +
      'dedicated namespace so a checkpoint storm cannot starve inference reads.',
    specs: { power: 21.3, coolant: 31.2, load: 58, uptime: 99.995 },
    tags: ['all-flash NVMe', 'erasure coded', 'replicated → B08'],
  },
  B07: {
    role: 'Vector Search & Embeddings',
    kind: 'Memory-optimised · 1.5 TB RAM',
    handle:
      'Vector indexes live in RAM with warm replicas per zone. Index rebuilds run against ' +
      'a shadow copy and switch over atomically, so retrieval never serves a half-built ' +
      'index.',
    specs: { power: 19.4, coolant: 30.4, load: 69, uptime: 99.98 },
    tags: ['in-memory index', 'shadow rebuild', 'atomic switch'],
  },
  B08: {
    role: 'Backup, DR & Object Replication',
    kind: 'Object store · offsite replica',
    handle:
      'Immutable backups and the disaster-recovery replica. Everything critical has a ' +
      'restore test on the calendar, and the offsite copy is verified independently of ' +
      'the primary region.',
    specs: { power: 11.7, coolant: 26.2, load: 43, uptime: 99.99 },
    tags: ['immutable', 'restore-tested', 'offsite replica'],
  },
  'CDU-01': {
    role: 'Liquid Cooling & Thermal Loop',
    kind: 'In-row CDU · 1.3 MW',
    handle:
      'The thermal heart of the row: N+1 pumps, plate heat exchanger and a 32 °C facility ' +
      'supply. It holds the differential pressure steady across every cold plate, alarms ' +
      'on any flow deviation, and fails over to the standby pump in under two seconds.',
    specs: { power: 6.4, coolant: 41.8, load: 82, uptime: 99.999 },
    tags: ['N+1 pumps', '1.3 MW loop', '2 s failover'],
  },
};

export function machineById(id) {
  return MACHINES[id] || null;
}

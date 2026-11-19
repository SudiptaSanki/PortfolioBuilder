/**
 * portfolio.js
 * ============================================================================
 * Every word, number and link the site shows lives here. Edit this file to make
 * the portfolio yours — the layout, the 3D journey and the soundscape all read
 * from these fields, so nothing else needs to change.
 *
 * The structural rule: `stations` is ordered, and each `progress` value is the
 * position along the AI operations campus (0 = the intake hall, 1 = the edge
 * observation deck) where that station's camera is set. The values below are
 * tuned to the six phases of `src/scene/aiOpsWorld.js`:
 *
 *   ingest   0.00 – 0.18   intake portal, fibre lanes, buffer vaults, prisms
 *   core     0.18 – 0.36   transformer rings, Q/K/V filaments, latent space
 *   gpu      0.36 – 0.56   cold aisles, 42U cabinets, coolant manifolds
 *   cicd     0.56 – 0.74   lint / test / image / sign gantry, artifact vault
 *   mesh     0.74 – 0.90   ingress, pods with Envoy sidecars, v1/v2 arcs
 *   edge     0.90 – 1.00   observation deck, procedural Earth, POP arcs
 *
 * Keep them inside those bands or the camera will look at scenery that does not
 * match the copy.
 * ========================================================================== */

const portfolio = {
  /* ------------------------------------------------------------- identity -- */
  brand: {
    mark: 'AX',
    name: 'AXON COMPUTE & OPS',
    // Short form used on the mobile top bar.
    shortName: 'AXON',
    tagline: 'Principal AI/ML Systems & Infrastructure Architect',
  },

  principal: {
    role: 'Principal AI/ML Systems & Infrastructure Architect',
    // Shown in each station's signature line. Replace with your own.
    practice: 'Axon Compute & Ops · Model Platforms & Production Infrastructure',
    disciplines: 'Training clusters · Inference systems · Delivery platforms',
    experience: '14 years of build-and-operate',
  },

  /* ----------------------------------------------------------- sound gate -- */
  sound: {
    title: 'Enable Neural & Cluster Audio?',
    body:
      'The soundscape is synthesised live in your browser — data-centre air, tensor harmonics, packet pulses, coolant hum and the amber canary fabric. No files are downloaded. Sound is off unless you turn it on.',
    enable: 'Enable Sound',
    muted: 'Continue Muted',
    hint: 'Enter to enable · Esc to continue muted',
    pillOn: 'Sound On',
    pillOff: 'Sound Off',
  },

  /* --------------------------------------------------------------- stations */
  stations: [
    {
      id: 'ingest',
      no: '01',
      railLabel: 'Data Ingestion',
      progress: 0.08,
      kicker: 'Station 01 · Data Ingestion & Feature Lake',
      title: 'Every model begins as a river of unglamorous bytes.',
      lede: 'Six fibre lanes, glass buffer vaults and the embedding prisms that turn raw events into features.',
      body:
        'Events arrive from product, edge and batch sources through six illuminated lanes into partitioned buffer vaults, where schema contracts and back-pressure stop the lake from silting up. The prisms write versioned feature vectors into immutable snapshots, so a training run can be reproduced months after it finished.',
      facts: [
        { label: 'Sustained ingest', value: '2.4 TB / h' },
        { label: 'Feature writes', value: '1,180 vectors / s' },
        { label: 'Freshness', value: 'p95 < 90 s' },
      ],
      tags: ['Event lanes', 'Feature store', 'Schema contracts'],
    },
    {
      id: 'core',
      no: '02',
      railLabel: 'Transformer Core',
      progress: 0.27,
      kicker: 'Station 02 · Transformer & Attention Core',
      title: 'Attention is a scheduling problem before it is a maths problem.',
      lede: 'Tilted attention rings, Q/K/V filaments and a volumetric latent space at the centre of the nave.',
      body:
        'Each ring is one layer: queries, keys and values arrive along synaptic filaments, and the softmax that follows is where most of the memory traffic goes. The sphere in the middle is the residual stream — the only state that survives from the first token to the last, and the reason the kernels are fused the way they are.',
      facts: [
        { label: 'Layers', value: '72 · 8,192 wide' },
        { label: 'Attention', value: '64 heads · GQA' },
        { label: 'Context', value: '128k tokens' },
      ],
      tags: ['Fused kernels', 'KV cache', 'Tensor parallel'],
    },
    {
      id: 'gpu',
      no: '03',
      railLabel: 'GPU Cluster',
      progress: 0.46,
      kicker: 'Station 03 · Liquid-Cooled GPU Cluster',
      title: 'Thirty-two thousand accelerators, and one hot aisle.',
      lede: '42U cabinets, eight-GPU sleds, copper and emerald coolant manifolds and a live loss surface.',
      body:
        'Each sled holds eight accelerators on a direct-to-chip cold plate loop; the copper manifolds carry heat out at 45 °C and the emerald returns prove the loop is healthy. Jobs are gang-scheduled across the fabric, and the loss surface beside the aisle is the run currently on the cluster, not a decoration.',
      facts: [
        { label: 'Accelerators', value: '32,768 H-class' },
        { label: 'Interconnect', value: '3.2 Tb/s per node' },
        { label: 'PUE', value: '1.08 · liquid' },
      ],
      tags: ['Cold plates', 'Gang scheduling', 'NVLink fabric'],
    },
    {
      id: 'cicd',
      no: '04',
      railLabel: 'CI/CD Gantry',
      progress: 0.64,
      kicker: 'Station 04 · CI/CD & Container Build Gantry',
      title: 'Nothing reaches a cluster that has not passed the gantry.',
      lede: 'Four arches — LINT, TEST, IMAGE, SIGN — over a precision rail and a glass artifact vault.',
      body:
        'A commit enters at LINT, is proven at TEST, built into a minimal image at IMAGE and signed with provenance at SIGN before any cluster may pull it. The rail carries modules between stages and the vault keeps the immutable digests. A failing gate stops the module where it stands instead of letting it fall through to production.',
      facts: [
        { label: 'Gate time', value: '6 m 40 s median' },
        { label: 'Image base', value: 'distroless · 41 MB' },
        { label: 'Provenance', value: 'SLSA level 3' },
      ],
      tags: ['Signed artifacts', 'Ephemeral runners', 'Supply chain'],
    },
    {
      id: 'mesh',
      no: '05',
      railLabel: 'Kubernetes Mesh',
      progress: 0.82,
      kicker: 'Station 05 · Kubernetes Mesh & Canary',
      title: 'A rollout is a traffic decision, not a deploy.',
      lede: 'Ingress arch, pods with orbiting Envoy sidecars, and v1/v2 arcs that rebalance on demand.',
      body:
        'The ingress arch terminates at the mesh, where every pod carries its own Envoy sidecar and mTLS identity. Toggle Canary Rollout and the weighted arcs shift traffic from v1 to v2 while the new pods scale in behind them; error budget and p99 are the only signals allowed to widen the split.',
      facts: [
        { label: 'Footprint', value: '11 regions · 480 nodes' },
        { label: 'Mesh identity', value: 'mTLS · 100 %' },
        { label: 'Canary', value: '5 → 100 % in 18 min' },
      ],
      tags: ['Istio', 'Progressive delivery', 'Zero trust'],
    },
    {
      id: 'edge',
      no: '06',
      railLabel: 'Global Edge',
      progress: 0.96,
      kicker: 'Station 06 · Global Edge Observability',
      title: 'The last ten milliseconds belong to the edge.',
      lede: 'A procedural Earth beyond the observation deck, POP beacons and great-circle latency arcs.',
      body:
        'Inference is placed where the request is: 214 points of presence hold warm model replicas and route around the slow ones. The arcs overhead are measured round trips, not marketing lines, and the p99 in the rail is the number an on-call engineer actually wakes up for.',
      facts: [
        { label: 'Edge PoPs', value: '214 cities' },
        { label: 'Peak requests', value: '310k QPS' },
        { label: 'On-call SLO', value: 'p99 · 5 min' },
      ],
      tags: ['Anycast', 'Model replicas', 'SLO budgets'],
    },
  ],

  /* --------------------------------------------------------------- contact */
  contact: {
    label: 'Contact',
    title: 'Building something that has to stay up?',
    body:
      'Platform reviews, training-cluster design, inference economics or a delivery pipeline that keeps its promises — the practice answers within two working days.',
    primary: {
      label: 'Start a conversation',
      // Replace with the address that should receive enquiries.
      email: 'hello@example.com',
      subject: 'Portfolio enquiry — Axon Compute & Ops',
    },
    secondary: {
      label: 'Request the platform brief',
      email: 'hello@example.com',
      subject: 'Platform brief request — AI/ML & DevOps portfolio',
    },
  },

  /* ------------------------------------------------------------- HUD copy -- */
  hud: {
    rail: 'AI operations station rail',
    params: 'Active Params',
    throughput: 'Throughput',
    gpu: 'GPU Util',
    p99: 'p99 Latency',
    health: 'Cluster Health',
    progress: 'Station',
    railAria: 'Jump to a station along the AI operations campus',
    soundAria: 'Toggle neural and cluster audio',
    forwardAria: 'Fire an activation wave through the transformer core',
    canaryAria: 'Toggle the v2 canary rollout',
    contactAria: 'Contact Axon Compute & Ops',
    forwardLabel: 'Forward Pass',
    canaryOn: 'Canary v2',
    canaryOff: 'Canary v1',
    units: {
      params: 'B',
      throughput: 'QPS',
      gpu: '%',
      p99: 'ms',
      health: '%',
    },
  },

  /** Short forms used in the mobile bottom bar. */
  short: {
    params: 'Params',
    throughput: 'QPS',
    gpu: 'GPU',
    health: 'Health',
  },

  meta: {
    // Used in the HTML <title> and the link preview.
    title: 'AXON COMPUTE & OPS — AI/ML & DevOps Portfolio',
    description:
      'A 3D AI infrastructure portfolio: walk a data-centre cathedral from the ingestion hall and transformer core, through a liquid-cooled GPU cluster and the CI/CD gantry, to a Kubernetes canary and the global edge.',
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

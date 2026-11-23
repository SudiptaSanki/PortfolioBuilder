/* HOLO MESH — live spatial specimen viewer (index page only)
   SPEC-01 "Calibration Prism": a spatial interface rig built in code
   with Three.js (vendored, MIT) — plinth, prism core, three floating
   UI panels, anchor points and a gesture ring. Layer toggles show and
   hide the real geometry groups, and the readout counts the actual
   triangles of whatever is on the bench. Falls back to the static
   SVG plate when WebGL is unavailable or reduced motion is set. */
import * as THREE from 'three';

const stage = document.getElementById('viewerStage');
const fallback = document.getElementById('viewerFallback');
const roObjects = document.getElementById('roObjects');
const roTris = document.getElementById('roTris');
const roVerts = document.getElementById('roVerts');
const roRot = document.getElementById('roRot');
const roLayers = document.getElementById('roLayers');
const modeBtns = [...document.querySelectorAll('[data-mode]')];
const layerBtns = [...document.querySelectorAll('[data-layer]')];
const turntableBtn = document.getElementById('turntableBtn');
const resetBtn = document.getElementById('resetBtn');

const ACCENT = 0x0e7c8c;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const activeLayers = { panels: true, anchors: true, gesture: true };

/* ---------- model construction (shared by live + counting) ---------- */
function buildSpecimen() {
  const root = new THREE.Group();
  const groups = { core: new THREE.Group(), panels: new THREE.Group(), anchors: new THREE.Group(), gesture: new THREE.Group() };
  Object.values(groups).forEach(g => root.add(g));
  const parts = [];   // { mesh, lines } — surfaces that follow the wire/flat mode
  const markers = []; // always-solid points of light (anchor + gesture markers)

  const flatMat = new THREE.MeshStandardMaterial({ color: 0xa9aeb4, flatShading: true, roughness: 0.85, metalness: 0.15 });
  const panelMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, flatShading: true, roughness: 0.9, metalness: 0.1 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x4c5157, flatShading: true, roughness: 0.9, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0x07303a, emissive: ACCENT, emissiveIntensity: 0.9, roughness: 0.4 });
  const wireMat = new THREE.LineBasicMaterial({ color: ACCENT });
  const wireDimMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.4 });

  function add(group, geo, mat, x, y, z, ry = 0, rx = 0) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = ry; mesh.rotation.x = rx;
    const lines = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat);
    lines.position.copy(mesh.position);
    lines.rotation.copy(mesh.rotation);
    group.add(mesh); group.add(lines);
    parts.push({ mesh, lines });
    return mesh;
  }
  function marker(group, geo, x, y, z) {
    const m = new THREE.Mesh(geo, accentMat);
    m.position.set(x, y, z);
    group.add(m); markers.push(m);
    return m;
  }
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const C = (rt, rb, h, s = 24) => new THREE.CylinderGeometry(rt, rb, h, s);

  /* core: plinth + prism */
  add(groups.core, C(1.3, 1.45, 0.18), darkMat, 0, 0.09, 0);              // plinth
  add(groups.core, C(1.05, 1.05, 0.09), flatMat, 0, 0.23, 0);            // plinth ring
  add(groups.core, new THREE.OctahedronGeometry(0.85), flatMat, 0, 1.35, 0); // the prism
  marker(groups.core, new THREE.OctahedronGeometry(0.3), 0, 1.35, 0);    // lit core
  add(groups.core, C(0.06, 0.06, 0.5, 8), darkMat, 0, 0.5, 0);           // prism stem

  /* panels: three floating interface panels, built like UI —
     frame, header bar, three rows, one square widget */
  function panel(x, y, z, ry, rx) {
    const g = new THREE.Group();
    g.position.set(x, y, z); g.rotation.y = ry; g.rotation.x = rx;
    groups.panels.add(g);
    const local = new THREE.Group(); g.add(local);
    const addLocal = (geo, mat, lx, ly, lz) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(lx, ly, lz);
      const lines = new THREE.LineSegments(new THREE.WireframeGeometry(geo), wireMat);
      lines.position.copy(mesh.position);
      local.add(mesh); local.add(lines);
      parts.push({ mesh, lines });
    };
    addLocal(B(1.15, 0.8, 0.04), panelMat, 0, 0, 0);          // frame
    addLocal(B(0.95, 0.11, 0.02), darkMat, 0, 0.27, 0.03);    // header bar
    addLocal(B(0.95, 0.07, 0.02), flatMat, 0, 0.08, 0.03);    // row 1
    addLocal(B(0.7, 0.07, 0.02), flatMat, -0.12, -0.06, 0.03); // row 2
    addLocal(B(0.2, 0.2, 0.02), darkMat, 0.33, -0.22, 0.03);  // widget
  }
  panel(-1.55, 1.5, 0.35, 0.55, 0);
  panel(1.55, 1.5, 0.35, -0.55, 0);
  panel(0, 2.35, -0.55, 0, -0.4);

  /* anchors: the eight corners of the tracked volume */
  const ax = 1.9, ay = 2.9, az = 1.9;
  const cornerGeo = new THREE.SphereGeometry(0.055, 10, 8);
  [[-ax, 0.05, -az], [ax, 0.05, -az], [-ax, 0.05, az], [ax, 0.05, az],
   [-ax, ay, -az], [ax, ay, -az], [-ax, ay, az], [ax, ay, az]].forEach(p => {
    marker(groups.anchors, cornerGeo, p[0], p[1], p[2]);
  });
  const edgePts = [];
  const cs = [[-ax, 0.05, -az], [ax, 0.05, -az], [ax, 0.05, az], [-ax, 0.05, az],
              [-ax, ay, -az], [ax, ay, -az], [ax, ay, az], [-ax, ay, az]];
  [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]].forEach(e => {
    edgePts.push(new THREE.Vector3(...cs[e[0]]), new THREE.Vector3(...cs[e[1]]));
  });
  const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePts);
  const edges = new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0.55 }));
  groups.anchors.add(edges);

  /* gesture: the orbit ring a hand travels, with two hand points */
  add(groups.gesture, new THREE.TorusGeometry(1.55, 0.022, 8, 48), darkMat, 0, 1.45, 0, 0, Math.PI / 2);
  marker(groups.gesture, new THREE.SphereGeometry(0.07, 10, 8), 1.55, 1.45, 0);
  marker(groups.gesture, new THREE.SphereGeometry(0.07, 10, 8), -1.1, 1.45, 1.1);

  root.position.y = -1.45;
  return { root, groups, parts, wireMat, wireDimMat };
}

function countVisible(model) {
  let tris = 0, verts = 0, objects = 0;
  const on = { core: true, panels: activeLayers.panels, anchors: activeLayers.anchors, gesture: activeLayers.gesture };
  Object.keys(model.groups).forEach(name => {
    if (!on[name]) return;
    model.groups[name].traverse(o => {
      if (o.isMesh) {
        const g = o.geometry;
        tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
        verts += g.attributes.position.count;
        objects += 1;
      }
    });
  });
  return { tris: Math.round(tris), verts, objects };
}

const fmt = n => n.toLocaleString('en-GB');

function showCounts(model, isStatic) {
  const c = countVisible(model);
  roObjects.textContent = c.objects;
  roTris.textContent = fmt(c.tris);
  roVerts.textContent = fmt(c.verts);
  const n = 1 + (activeLayers.panels ? 1 : 0) + (activeLayers.anchors ? 1 : 0) + (activeLayers.gesture ? 1 : 0);
  roLayers.textContent = n + ' / 4' + (isStatic ? ' · PLATE' : '');
}

/* ---------- fallback path: reduced motion or no WebGL ---------- */
let renderer = null;
try {
  if (reduced) throw new Error('reduced-motion');
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
} catch (e) {
  renderer = null;
}

if (!renderer) {
  const countingModel = buildSpecimen();
  showCounts(countingModel, true);
  roRot.textContent = 'STATIC';
  layerBtns.forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.layer;
    activeLayers[key] = !activeLayers[key];
    b.setAttribute('aria-pressed', String(activeLayers[key]));
    showCounts(countingModel, true);
  }));
  modeBtns.forEach(b => b.disabled = true);
  turntableBtn.disabled = true;
  resetBtn.disabled = true;
} else {
  /* ---------- live viewer ---------- */
  fallback.style.display = 'none';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  stage.insertBefore(renderer.domElement, stage.firstChild);
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'Interactive 3D specimen viewer: SPEC-01 Calibration Prism spatial interface. Drag to orbit the specimen.');

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 4 / 3, 0.1, 100);
  camera.position.set(3.9, 1.9, 5.1);
  camera.lookAt(0, 0.05, 0);

  scene.add(new THREE.HemisphereLight(0xf2f4f4, 0x2a2d30, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(ACCENT, 0.5); rim.position.set(-5, 3, -4); scene.add(rim);

  const built = buildSpecimen();
  scene.add(built.root);
  let mode = 'both';

  function applyMode() {
    built.parts.forEach(p => {
      if (mode === 'wire') { p.mesh.visible = false; p.lines.visible = true; p.lines.material = built.wireMat; }
      else if (mode === 'flat') { p.mesh.visible = true; p.lines.visible = false; }
      else { p.mesh.visible = true; p.lines.visible = true; p.lines.material = built.wireDimMat; }
    });
  }
  function applyLayers() {
    built.groups.panels.visible = activeLayers.panels;
    built.groups.anchors.visible = activeLayers.anchors;
    built.groups.gesture.visible = activeLayers.gesture;
    showCounts(built, false);
  }
  applyMode();
  applyLayers();

  modeBtns.forEach(b => b.addEventListener('click', () => {
    mode = b.dataset.mode;
    modeBtns.forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    applyMode();
  }));
  layerBtns.forEach(b => b.addEventListener('click', () => {
    const key = b.dataset.layer;
    activeLayers[key] = !activeLayers[key];
    b.setAttribute('aria-pressed', String(activeLayers[key]));
    applyLayers();
  }));

  /* drag to orbit — pointer events, horizontal drags rotate,
     vertical gestures still scroll the page (touch-action: pan-y) */
  let targetY = 0.55, targetX = 0.12, curY = 0.55, curX = 0.12;
  let dragging = false, lastX = 0, lastY = 0, turntable = false;

  canvas.addEventListener('pointerdown', e => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', e => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    targetY += dx * 0.012;
    targetX = THREE.MathUtils.clamp(targetX + dy * 0.007, -0.45, 0.95);
  });
  const endDrag = () => { dragging = false; };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  turntableBtn.addEventListener('click', () => {
    turntable = !turntable;
    turntableBtn.setAttribute('aria-pressed', String(turntable));
  });
  resetBtn.addEventListener('click', () => { targetY = 0.55; targetX = 0.12; });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  let inView = true;
  new IntersectionObserver(en => { inView = en[0].isIntersecting; }, { threshold: 0.02 }).observe(stage);

  let last = performance.now(), lastDeg = -1;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!inView || document.hidden) return;
    if (turntable && !dragging) targetY += dt * 0.55;
    curY += (targetY - curY) * 0.16;
    curX += (targetX - curX) * 0.16;
    built.root.rotation.y = curY;
    built.root.rotation.x = curX - 0.12;
    const deg = Math.round(((curY * 180 / Math.PI) % 360 + 360) % 360);
    if (deg !== lastDeg) { roRot.textContent = deg + '°'; lastDeg = deg; }
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}

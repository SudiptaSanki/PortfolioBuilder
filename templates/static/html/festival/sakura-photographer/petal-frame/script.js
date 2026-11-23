/* Mio Tachibana — sakura photographs
   Mobile nav, the hanami exposure planner (canvas), and the print enquiry. */

(function () {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.getElementById('mobilenav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const open = mobileNav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

/* ---------- print / walk enquiry ---------- */
  const enquiry = document.getElementById('enquiryForm');
  if (enquiry) {
    const status = document.getElementById('formStatus');
    enquiry.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(enquiry);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 10) {
        status.className = 'form-status err';
        status.textContent = 'A name, a working email and a sentence about what you want is enough to start.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = `Thank you, ${name.split(' ')[0]}. I answer on Sunday evenings, Kyoto time; prints take two weeks to make.`;
      enquiry.reset();
    });
  }

  /* ---------- exposure planner ---------- */
  const canvas = document.getElementById('plannerCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  const APERTURES = [
    { f: 1.4, label: 'f/1.4' },
    { f: 2, label: 'f/2' },
    { f: 2.8, label: 'f/2.8' },
    { f: 4, label: 'f/4' },
    { f: 5.6, label: 'f/5.6' },
    { f: 8, label: 'f/8' },
    { f: 16, label: 'f/16' }
  ];
  const FILMS = {
    portra: { name: 'Portra 400', iso: 400, grain: 0.05, warm: 0.1, note: 'Rate at 320 in flat dawn light' },
    provia: { name: 'Provia 100F', iso: 100, grain: 0.02, warm: 0, note: 'Slide film: protect the highlights' },
    hp5: { name: 'HP5 Plus', iso: 400, grain: 0.13, warm: -0.05, note: 'Push to 800 before sunrise' }
  };

  const hourEl = document.getElementById('hour');
  const apEl = document.getElementById('aperture');
  const hourOut = document.getElementById('hourOut');
  const apOut = document.getElementById('apOut');
  const evOut = document.getElementById('evOut');
  const shutterOut = document.getElementById('shutterOut');
  const dofOut = document.getElementById('dofOut');
  const noteOut = document.getElementById('noteOut');

  let filmKey = 'portra';
  const filmButtons = document.querySelectorAll('.film');

  // fixed scatter so the frame does not jump when a control moves
  const seed = (() => {
    let s = 20260328;
    return () => {
      s = (s * 1103515245 + 12345) % 2147483648;
      return s / 2147483648;
    };
  })();
  const bokeh = Array.from({ length: 34 }, () => ({
    x: seed() * W,
    y: seed() * H,
    r: 0.4 + seed() * 0.6,
    hue: seed(),
    a: 0.25 + seed() * 0.5
  }));
  const petals = Array.from({ length: 14 }, () => ({
    x: seed() * W,
    y: seed() * H,
    r: 3 + seed() * 5,
    rot: seed() * Math.PI,
    a: 0.5 + seed() * 0.4
  }));
  const clusters = [
    { x: 110, y: 430, s: 1.05 }, { x: 200, y: 386, s: .9 }, { x: 292, y: 344, s: 1.1 },
    { x: 386, y: 306, s: .95 }, { x: 470, y: 268, s: 1.12 }, { x: 556, y: 228, s: .88 },
    { x: 636, y: 192, s: 1.0 }, { x: 690, y: 158, s: .8 }
  ];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function hex(c) {
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  function mix(c1, c2, t) {
    const a = hex(c1), b = hex(c2);
    return `rgb(${Math.round(a[0] + (b[0] - a[0]) * t)}, ${Math.round(a[1] + (b[1] - a[1]) * t)}, ${Math.round(a[2] + (b[2] - a[2]) * t)})`;
  }

  // sky stops through the day
  const SKY = [
    { t: 330, top: '#33414f', low: '#8b7f86' },
    { t: 390, top: '#8fa0ad', low: '#efd3cd' },
    { t: 480, top: '#b9cbd3', low: '#f6e5dd' },
    { t: 720, top: '#cfe2e8', low: '#f0eee1' },
    { t: 960, top: '#c3cfd2', low: '#efe0c8' },
    { t: 1130, top: '#6c6274', low: '#e0a98f' }
  ];

  function skyAt(t) {
    for (let i = 0; i < SKY.length - 1; i++) {
      const a = SKY[i], b = SKY[i + 1];
      if (t >= a.t && t <= b.t) {
        const k = (t - a.t) / (b.t - a.t);
        return { top: mix(a.top, b.top, k), low: mix(a.low, b.low, k) };
      }
    }
    return { top: SKY[SKY.length - 1].top, low: SKY[SKY.length - 1].low };
  }

  function evAt(t) {
    const day = clamp((t - 330) / 800, 0, 1);
    return 4.6 + 8.6 * Math.pow(Math.sin(Math.PI * day), 0.85);
  }

  function shutterFor(ev, f, iso) {
    const seconds = (f * f) / (Math.pow(2, ev) * (iso / 100));
    const standard = [1 / 1000, 1 / 500, 1 / 250, 1 / 125, 1 / 60, 1 / 30, 1 / 15, 1 / 8, 1 / 4, 1 / 2, 1, 2, 4];
    let best = standard[0], bestDiff = Infinity;
    standard.forEach((s) => {
      const d = Math.abs(Math.log2(s) - Math.log2(clamp(seconds, 0.0008, 8)));
      if (d < bestDiff) { bestDiff = d; best = s; }
    });
    if (best >= 1) return best === 1 ? '1 s' : `${best.toFixed(0)} s`;
    return `1/${Math.round(1 / best)}`;
  }

  function formatHour(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  function draw() {
    const mins = Number(hourEl.value);
    const ap = APERTURES[Number(apEl.value)];
    const film = FILMS[filmKey];
    const ev = evAt(mins);
    const sky = skyAt(mins);
    const open = 1 - Number(apEl.value) / 6; // 1 wide open, 0 stopped down

    ctx.clearRect(0, 0, W, H);

    const g = ctx.createLinearGradient(0, 0, W * 0.25, H);
    g.addColorStop(0, sky.top);
    g.addColorStop(1, sky.low);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // bokeh
    ctx.save();
    bokeh.forEach((b) => {
      const r = (18 + b.r * 46) * (0.55 + open * 0.9);
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      const tone = b.hue > 0.55 ? '244, 214, 216' : b.hue > 0.25 ? '206, 214, 191' : '230, 206, 190';
      grad.addColorStop(0, `rgba(${tone}, ${0.16 + b.a * 0.28 * (0.4 + open * 0.6)})`);
      grad.addColorStop(0.7, `rgba(${tone}, ${0.08 + b.a * 0.12})`);
      grad.addColorStop(1, 'rgba(240, 230, 220, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();

    // hill line, softened with the aperture
    ctx.save();
    ctx.filter = `blur(${(open * 7).toFixed(1)}px)`;
    ctx.fillStyle = 'rgba(122, 140, 128, .30)';
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.bezierCurveTo(140, 356, 260, 404, 400, 374);
    ctx.bezierCurveTo(540, 344, 640, 396, 720, 366);
    ctx.lineTo(720, 520);
    ctx.lineTo(0, 520);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // branch
    ctx.save();
    ctx.strokeStyle = '#3d3029';
    ctx.lineCap = 'round';
    ctx.lineWidth = 17;
    ctx.beginPath();
    ctx.moveTo(20, 500);
    ctx.bezierCurveTo(150, 452, 210, 380, 330, 330);
    ctx.bezierCurveTo(450, 280, 520, 212, 640, 168);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#5a4638';
    ctx.beginPath();
    ctx.moveTo(120, 462);
    ctx.bezierCurveTo(150, 396, 168, 342, 150, 288);
    ctx.moveTo(330, 330);
    ctx.bezierCurveTo(318, 276, 330, 232, 360, 200);
    ctx.moveTo(470, 270);
    ctx.bezierCurveTo(500, 226, 546, 200, 600, 186);
    ctx.stroke();
    ctx.restore();

    // blossom clusters
    clusters.forEach((c, i) => {
      const scale = c.s * (0.9 + open * 0.15);
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(scale, scale);
      for (let k = 0; k < 7; k++) {
        const a = (k / 7) * Math.PI * 2 + i;
        const px = Math.cos(a) * 24;
        const py = Math.sin(a) * 18;
        const r = 15 + (k % 3) * 4;
        ctx.beginPath();
        ctx.fillStyle = k % 2 ? 'rgba(246, 222, 225, .97)' : 'rgba(238, 199, 204, .97)';
        ctx.strokeStyle = 'rgba(190, 132, 140, .55)';
        ctx.lineWidth = 1.1;
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.fillStyle = 'rgba(176, 96, 110, .5)';
        ctx.arc(px, py, 2.6, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // falling petals
    petals.forEach((p) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = `rgba(244, 214, 218, ${p.a})`;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r, p.r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // film grain
    if (film.grain > 0) {
      ctx.save();
      for (let i = 0; i < 1400; i++) {
        const x = Math.random() * W;
        const y = Math.random() * H;
        const a = Math.random() * film.grain;
        ctx.fillStyle = `rgba(30, 26, 24, ${a})`;
        ctx.fillRect(x, y, 1.4, 1.4);
      }
      ctx.restore();
    }

    // warm or cool cast
    if (film.warm > 0) {
      ctx.fillStyle = `rgba(226, 154, 106, ${film.warm * 0.5})`;
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'source-over';
    }

    // vignette
    const v = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(20, 14, 12, .3)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);

    // viewfinder frame
    ctx.strokeStyle = 'rgba(247, 242, 234, .55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(18.5, 18.5, W - 37, H - 37);
    ctx.strokeStyle = 'rgba(247, 242, 234, .75)';
    ctx.lineWidth = 2;
    const corner = 22;
    [[18, 18, 1, 1], [W - 18, 18, -1, 1], [18, H - 18, 1, -1], [W - 18, H - 18, -1, -1]].forEach(([x, y, dx, dy]) => {
      ctx.beginPath();
      ctx.moveTo(x + dx * corner, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + dy * corner);
      ctx.stroke();
    });
    ctx.fillStyle = 'rgba(247, 242, 234, .85)';
    ctx.font = '500 12px "IBM Plex Mono", monospace';
    ctx.fillText(`67 · 105mm · ${ap.label} · ${shutterFor(ev, ap.f, film.iso)}`, 32, H - 32);
    ctx.textAlign = 'right';
    ctx.fillText(formatHour(mins), W - 32, H - 32);
    ctx.textAlign = 'left';

    // readout
    hourOut.textContent = formatHour(mins);
    apOut.textContent = ap.label;
    evOut.textContent = `EV ${ev.toFixed(1)}`;
    shutterOut.textContent = shutterFor(ev, ap.f, film.iso);
    const dof = (2 * ap.f * 0.045 * 9) / (105 * 105 / 1000); // metres, 3 m subject, 6×7 CoC
    dofOut.textContent = dof < 1 ? `${Math.round(dof * 100)} cm` : `${dof.toFixed(1)} m`;
    noteOut.textContent = film.note;
  }

  hourEl.addEventListener('input', draw);
  apEl.addEventListener('input', draw);
  filmButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      filmKey = btn.dataset.film;
      filmButtons.forEach((b) => b.classList.toggle('is-on', b === btn));
      draw();
    });
  });

  draw();

})();

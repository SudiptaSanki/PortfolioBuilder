/* Casa Melocotón — portraitist site
   Nav, reveal, ex-voto painter, catalogue filter, sitting enquiry. */

(function () {
  'use strict';

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
  }

  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

/* ---------- sitting enquiry ---------- */
  const sitting = document.getElementById('sittingForm');
  if (sitting) {
    const status = document.getElementById('formStatus');
    sitting.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(sitting);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const who = String(data.get('who') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || who.length < 2 || message.length < 10) {
        status.className = 'form-status err';
        status.textContent = 'Please add your name, a working email, who the portrait is of, and a little about the sitting you want.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = `Gracias, ${name.split(' ')[0]}. I answer sitting letters on Mondays and Thursdays; you will hear within the week.`;
      sitting.reset();
    });
  }

  /* ---------- catalogue filter ---------- */
  const filters = document.querySelectorAll('.filter');
  const items = document.querySelectorAll('.portrait');
  if (filters.length && items.length) {
    filters.forEach((btn) => {
      btn.addEventListener('click', () => {
        filters.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
        const kind = btn.dataset.filter;
        items.forEach((item) => { item.hidden = !(kind === 'all' || item.dataset.kind === kind); });
      });
    });
  }

  /* ---------- ex-voto bench ---------- */
  const stage = document.getElementById('retabloPreview');
  const form = document.getElementById('exvotoForm');
  if (!stage || !form) return;

  const GROUNDS = {
    cobalt: { panel: '#1f3a6e', sky: '#26457d', ground: '#2c4f86', ink: '#f3ddc0', line: '#122a52' },
    peach: { panel: '#e0a173', sky: '#eab389', ground: '#d19062', ink: '#3a2418', line: '#8a5230' },
    verde: { panel: '#3f6b4a', sky: '#4b7a56', ground: '#37603f', ink: '#f1e3c6', line: '#1f3a28' },
    tin: { panel: '#c9d6c2', sky: '#d6e0cf', ground: '#bacbb4', ink: '#2e3a2c', line: '#6f7f6a' }
  };

  function esc(t) {
    return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function wrap(text, max) {
    const words = String(text).trim().split(/\s+/);
    const lines = [];
    let line = '';
    words.forEach((w) => {
      if ((line + ' ' + w).trim().length > max && line) { lines.push(line); line = w; }
      else line = (line + ' ' + w).trim();
    });
    if (line) lines.push(line);
    return lines.slice(0, 2);
  }

  function crown(kind, ink, line) {
    if (kind === 'roses') {
      return `<g>
        <circle cx="140" cy="146" r="15" fill="#c4473f" stroke="${line}" stroke-width="1.4"/>
        <circle cx="140" cy="146" r="6" fill="#8f2b2a"/>
        <circle cx="164" cy="139" r="16" fill="#d94f5c" stroke="${line}" stroke-width="1.4"/>
        <circle cx="164" cy="139" r="6" fill="#a8302f"/>
        <circle cx="188" cy="146" r="14" fill="#c4473f" stroke="${line}" stroke-width="1.4"/>
        <circle cx="188" cy="146" r="5" fill="#8f2b2a"/>
        <path d="M128 156c8-10 18-16 30-18M200 156c-8-10-18-16-30-18" stroke="#3f6b4a" stroke-width="3.5" fill="none"/>
      </g>`;
    }
    if (kind === 'cactus') {
      return `<g>
        <path d="M150 160c-2-18 0-30 2-38 3 8 5 20 3 38Z" fill="#3f6b4a" stroke="${line}" stroke-width="1.3"/>
        <path d="M152 140c-12-4-16-12-14-20 8 4 12 10 14 18M156 138c10-6 12-14 10-22-8 6-10 12-10 20" fill="#4f7f5a" stroke="${line}" stroke-width="1.2"/>
        <circle cx="164" cy="140" r="6" fill="#e08a1e" stroke="${line}" stroke-width="1.2"/>
        <circle cx="164" cy="140" r="2.4" fill="#c4476a"/>
      </g>`;
    }
    return `<g>
      <circle cx="134" cy="150" r="12" fill="#e08a1e" stroke="${line}" stroke-width="1.2"/><circle cx="134" cy="150" r="4.5" fill="#c4473f"/>
      <circle cx="151" cy="141" r="13" fill="#d94f5c" stroke="${line}" stroke-width="1.2"/><circle cx="151" cy="141" r="4.5" fill="#e08a1e"/>
      <circle cx="170" cy="138" r="14" fill="#e08a1e" stroke="${line}" stroke-width="1.2"/><circle cx="170" cy="138" r="4.5" fill="#3f6b4a"/>
      <circle cx="189" cy="142" r="12" fill="#d94f5c" stroke="${line}" stroke-width="1.2"/><circle cx="189" cy="142" r="4.5" fill="#e08a1e"/>
      <path d="M122 158c10-10 20-14 34-18M200 156c-10-10-20-14-30-18" stroke="#3f6b4a" stroke-width="3.5" fill="none"/>
    </g>`;
  }

  function witness(kind, ink, line) {
    if (kind === 'monkey') {
      return `<g transform="translate(58 306)">
        <ellipse cx="0" cy="10" rx="15" ry="19" fill="#6d4a30" stroke="${line}" stroke-width="1.2"/>
        <circle cx="0" cy="-14" r="13" fill="#6d4a30" stroke="${line}" stroke-width="1.2"/>
        <ellipse cx="0" cy="-9" rx="8" ry="9" fill="#c99b74"/>
        <circle cx="-4" cy="-13" r="1.6" fill="#241a17"/><circle cx="4" cy="-13" r="1.6" fill="#241a17"/>
        <path d="M-3-5c2 1.4 4 1.4 6 0" stroke="#241a17" stroke-width="1.2" fill="none"/>
        <path d="M-13 4c-6-6-4-14 2-16M13 4c6-6 4-14-2-16" stroke="#6d4a30" stroke-width="5" fill="none" stroke-linecap="round"/>
      </g>`;
    }
    if (kind === 'moon') {
      return `<g>
        <path d="M72 96a30 30 0 1 0 22 50 34 34 0 1 1-22-50Z" fill="#f3e4b8" stroke="${line}" stroke-width="1.2"/>
        <circle cx="120" cy="86" r="2.4" fill="#f3e4b8"/><circle cx="108" cy="116" r="1.8" fill="#f3e4b8"/>
        <circle cx="136" cy="108" r="1.6" fill="#f3e4b8"/>
        <path d="M118 74v6M115 77h6M140 124v5M137.5 126.5h5" stroke="#f3e4b8" stroke-width="1.2"/>
      </g>`;
    }
    return `<g>
      <path d="M262 136c14-2 22-14 20-28-2-12-12-17-19-11" fill="#2f7a86" stroke="${line}" stroke-width="1.2"/>
      <path d="M263 98c7-4 13-2 15 4 2 6-2 10-8 10" fill="#3d8f97" stroke="${line}" stroke-width="1.2"/>
      <circle cx="269" cy="101" r="1.7" fill="#f5e6cf"/>
      <path d="M276 104l16-2-16 5Z" fill="#e08a1e" stroke="${line}" stroke-width=".8"/>
      <path d="M262 132c-4 12 0 22 6 30" stroke="#c4473f" stroke-width="4" fill="none"/>
      <path d="M256 112c-14 6-20 16-18 26 8-6 14-12 18-20" fill="#3d8f97" stroke="${line}" stroke-width="1"/>
    </g>`;
  }

  function render() {
    const groundKey = (form.querySelector('input[name="ground"]:checked') || {}).value || 'cobalt';
    const crownKey = (form.querySelector('input[name="crown"]:checked') || {}).value || 'marigold';
    const witnessKey = (form.querySelector('input[name="witness"]:checked') || {}).value || 'hummingbird';
    const dedication = document.getElementById('dedication').value || 'Por lo que se salvó.';
    const p = GROUNDS[groundKey] || GROUNDS.cobalt;
    const lines = wrap(dedication, 34);

    let svg = `<svg viewBox="0 0 340 460" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ex-voto on a tin panel with a figure, a ${crownKey} crown, a ${witnessKey} and a painted dedication">`;
    // tin panel with scalloped top
    svg += `<path d="M10 30c0-12 8-20 20-20h280c12 0 20 8 20 20v420H10Z" fill="${p.panel}" stroke="#6f7f6a" stroke-width="2"/>`;
    svg += `<path d="M10 30c12 6 24-6 36 0s24-6 36 0 24-6 36 0 24-6 36 0 24-6 36 0 24-6 36 0 24-6 36 0 24-6 36 0 24-6 36 0" fill="none" stroke="#8a9a84" stroke-width="1.4"/>`;
    // inner painted field
    svg += `<rect x="26" y="46" width="288" height="330" fill="${p.sky}" stroke="${p.ink}" stroke-width="1.4"/>`;
    svg += `<path d="M26 300c40-18 74-10 104 6 34 18 76 16 108-2 30-16 54-14 76-4v70H26Z" fill="${p.ground}"/>`;
    // distant hills
    svg += `<path d="M26 268c30-26 58-24 82-4 26 22 50 20 76-2 24-20 56-26 130-2v16c-40-10-70-6-96 8-40 22-80 18-122-4-24-14-46-14-70-2Z" fill="${p.panel}" opacity=".55"/>`;
    // figure
    svg += `<path d="M110 316c6-32 30-48 60-48s54 16 60 48Z" fill="${p.ink}" stroke="${p.line}" stroke-width="1.4"/>`;
    svg += `<path d="M158 252v24h22v-24Z" fill="#b9744c" stroke="${p.line}" stroke-width="1.2"/>`;
    svg += `<ellipse cx="169" cy="220" rx="34" ry="42" fill="#d99a68" stroke="${p.line}" stroke-width="1.4"/>`;
    svg += `<path d="M135 218c0-26 14-40 34-40s34 14 34 40c0 7-1 12-4 17 0-24-12-36-30-36s-30 12-30 36c-3-5-4-10-4-17Z" fill="#241a17"/>`;
    svg += `<path d="M150 212c5-4 11-3 15 1M174 213c4-4 10-5 15-1" stroke="#241a17" stroke-width="3.4" stroke-linecap="round" fill="none"/>`;
    svg += `<ellipse cx="156" cy="220" rx="5" ry="3.6" fill="#f5e6cf"/><circle cx="156" cy="220" r="2.2" fill="#241a17"/>`;
    svg += `<ellipse cx="182" cy="220" rx="5" ry="3.6" fill="#f5e6cf"/><circle cx="182" cy="220" r="2.2" fill="#241a17"/>`;
    svg += `<path d="M169 224v11c0 2-2 3-4 2" stroke="#a35f39" stroke-width="1.6" fill="none"/>`;
    svg += `<path d="M160 246c5 3 11 3 16 0" stroke="#8f3a34" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    svg += `<circle cx="134" cy="232" r="3.4" fill="#e08a1e"/><circle cx="204" cy="232" r="3.4" fill="#e08a1e"/>`;
    // arms
    svg += `<path d="M118 300c-2 10 2 16 10 18M220 300c2 10-2 16-10 18" stroke="${p.line}" stroke-width="1.6" fill="none" opacity=".5"/>`;
    svg += `<g transform="translate(0 26)">${crown(crownKey, p.ink, p.line)}</g>`;
    svg += witness(witnessKey, p.ink, p.line);

    // dedication margin
    svg += `<rect x="26" y="376" width="288" height="76" fill="${p.panel}" stroke="${p.ink}" stroke-width="1.2"/>`;
    svg += `<path d="M34 388h64" stroke="#e08a1e" stroke-width="2"/>`;
    lines.forEach((line, i) => {
      svg += `<text x="34" y="${404 + i * 18}" font-family="Courier Prime, monospace" font-size="12" fill="${p.ink}">${esc(line)}</text>`;
    });
    svg += `<text x="306" y="${440}" text-anchor="end" font-family="Courier Prime, monospace" font-size="8.5" fill="${p.ink}" opacity=".8">EX-VOTO · CDMX 2026</text>`;
    // punched holes
    svg += `<circle cx="26" cy="26" r="3" fill="#3a2a1e" opacity=".55"/><circle cx="314" cy="26" r="3" fill="#3a2a1e" opacity=".55"/>`;
    svg += `</svg>`;

    stage.innerHTML = svg;
  }

  form.addEventListener('submit', (e) => { e.preventDefault(); render(); });
  form.querySelectorAll('input[type="radio"]').forEach((r) => r.addEventListener('change', render));
  const ded = document.getElementById('dedication');
  if (ded) ded.addEventListener('input', render);
  render();

})();

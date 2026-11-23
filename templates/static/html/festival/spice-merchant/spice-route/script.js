/* Sarala Saxena — spice merchant
   Nav, reveal, the blend bench and the enquiry form. No libraries, no audio. */

(function () {
  'use strict';

  /* ---------- nav ---------- */
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', (e) => {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------- enquiry form ---------- */
  const enquiry = document.getElementById('enquiryForm');
  if (enquiry) {
    const status = document.getElementById('formStatus');
    enquiry.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(enquiry);
      const name = String(data.get('name') || '').trim();
      const email = String(data.get('email') || '').trim();
      const need = String(data.get('need') || '').trim();
      const message = String(data.get('message') || '').trim();
      if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = 'I need a name, a working email and a sentence about what you cook. The rest can follow.';
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Noted, ' + name.split(' ')[0] + '. Your note about ' + (need || 'a spice order') + ' is in the book; I answer on Tuesdays and Fridays, after the shop closes.';
      enquiry.reset();
    });
  }

  /* ---------- blend bench ---------- */
  const bench = document.getElementById('bench');
  const controls = document.getElementById('blendForm');
  if (!bench || !controls) return;

  const SPICES = {
    coriander: { label: 'Coriander', colour: '#bfa068', price: 700 },
    cumin: { label: 'Cumin', colour: '#8f6c3c', price: 950 },
    cardamom: { label: 'Cardamom', colour: '#6d7f49', price: 4600 },
    cinnamon: { label: 'Cinnamon', colour: '#aa5732', price: 1400 },
    clove: { label: 'Clove', colour: '#593726', price: 2200 },
    chilli: { label: 'Chilli', colour: '#a33c22', price: 1600 },
    pepper: { label: 'Pepper', colour: '#4a4034', price: 1800 },
    turmeric: { label: 'Turmeric', colour: '#cf8a22', price: 1200 },
    ginger: { label: 'Ginger', colour: '#b8865a', price: 900 },
    mustard: { label: 'Mustard', colour: '#8a7a2a', price: 400 }
  };

  const BLENDS = {
    garam: {
      name: 'Garam masala',
      code: 'G',
      note: 'The winter blend. Warm, not hot; a spoonful at the end of cooking, never the beginning.',
      mix: { coriander: 32, cumin: 22, cardamom: 18, cinnamon: 16, clove: 12 }
    },
    sambar: {
      name: 'Sambar podi',
      code: 'S',
      note: 'Roasted on the tawa until the coriander turns the colour of a brick, then ground coarse.',
      mix: { coriander: 34, chilli: 20, cumin: 16, pepper: 14, turmeric: 10, mustard: 6 }
    },
    chai: {
      name: 'Chai masala',
      code: 'C',
      note: 'For a kettle, not a cup: a quarter teaspoon per 200 ml of milk, boiled twice.',
      mix: { cardamom: 32, cinnamon: 22, clove: 14, ginger: 18, pepper: 14 }
    },
    rasam: {
      name: 'Rasam podi',
      code: 'R',
      note: 'Pepper-forward and sharp. Two teaspoons in tamarind water, tempered with ghee and curry leaf.',
      mix: { coriander: 36, pepper: 26, cumin: 20, chilli: 12, turmeric: 6 }
    }
  };

  const order = ['garam', 'sambar', 'chai', 'rasam'];
  let current = 'garam';
  let mix = Object.assign({}, BLENDS.garam.mix);
  let batch = 150;

  const ratiosBox = document.getElementById('ratios');
  const legend = document.getElementById('mixLegend');
  const jarLayers = document.getElementById('jarLayers');
  const batchInput = document.getElementById('batch');
  const batchOut = document.getElementById('batchOut');
  const ticketNo = document.getElementById('ticketNo');
  const ticketBlend = document.getElementById('ticketBlend');
  const ticketWeight = document.getElementById('ticketWeight');
  const ticketPrice = document.getElementById('ticketPrice');
  const ticketStamp = document.getElementById('ticketStamp');
  const ticket = document.getElementById('ticket');
  const jarBlend = document.getElementById('jarLabelBlend');
  const jarWeight = document.getElementById('jarLabelWeight');
  const jarLot = document.getElementById('jarLabelLot');
  const mixCost = document.getElementById('mixCost');
  const hint = document.getElementById('benchHint');

  function total() {
    return Object.values(mix).reduce((a, b) => a + b, 0) || 1;
  }

  function shares() {
    const sum = total();
    return Object.keys(mix).map((k) => ({ key: k, pct: (mix[k] / sum) * 100, grams: (mix[k] / sum) * batch }));
  }

  // rounded percentages that always add up to 100 (largest remainder)
  function displayShares() {
    const rows = shares();
    const floors = rows.map((r) => Math.floor(r.pct));
    let remainder = 100 - floors.reduce((a, b) => a + b, 0);
    const order = rows.map((r, i) => ({ i, frac: r.pct - Math.floor(r.pct) })).sort((a, b) => b.frac - a.frac);
    for (let k = 0; k < remainder; k++) floors[order[k % order.length].i] += 1;
    return rows.map((r, i) => ({ key: r.key, pct: floors[i], grams: r.grams }));
  }

  function lotNumber() {
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const b = BLENDS[current];
    return 'SS-' + yy + mm + '-' + b.code + String(batch).padStart(3, '0');
  }

  function drawRows() {
    ratiosBox.innerHTML = '';
    const head = document.createElement('p');
    head.className = 'ratios-head';
    head.innerHTML = 'Ratio, by weight <span>drag one; the others rebalance as percentages</span>';
    ratiosBox.appendChild(head);
    Object.keys(mix).forEach((key) => {
      const s = SPICES[key];
      const row = document.createElement('div');
      row.className = 'ratio-row';
      row.innerHTML =
        '<label for="p-' + key + '"><span class="swatch" style="background:' + s.colour + '"></span>' + s.label + '</label>' +
        '<input type="range" id="p-' + key + '" data-key="' + key + '" min="1" max="60" step="1" value="' + Math.round(mix[key]) + '" aria-label="' + s.label + ' share">' +
        '<output for="p-' + key + '" data-out="' + key + '">' + displayShares().find((x) => x.key === key).pct + '%</output>';
      ratiosBox.appendChild(row);
      row.querySelector('input').addEventListener('input', onRatio);
    });
  }

  function onRatio(e) {
    const key = e.target.dataset.key;
    const value = Math.max(1, Number(e.target.value));
    const others = Object.keys(mix).filter((k) => k !== key);
    const othersSum = others.reduce((a, k) => a + mix[k], 0) || 1;
    const remaining = Math.max(others.length, 100 - value);
    const scale = remaining / othersSum;
    mix[key] = value;
    others.forEach((k) => { mix[k] = Math.max(0.5, mix[k] * scale); });
    // re-normalise to exactly 100 for a clean parts model
    const t = total();
    Object.keys(mix).forEach((k) => { mix[k] = (mix[k] / t) * 100; });
    syncRowValues();
    render();
  }

  function syncRowValues() {
    Object.keys(mix).forEach((k) => {
      const input = document.getElementById('p-' + k);
      const out = ratiosBox.querySelector('[data-out="' + k + '"]');
      if (input) input.value = String(Math.round(mix[k]));
      if (out) out.textContent = displayShares().find((x) => x.key === k).pct + '%';
    });
  }

  function render() {
    const rows = shares();
    const shown = displayShares();
    const b = BLENDS[current];

    // legend
    legend.innerHTML = rows.map((r, i) => {
      const s = SPICES[r.key];
      return '<li><span class="dot" style="background:' + s.colour + '"></span>' +
        '<span class="nm">' + s.label + '</span>' +
        '<span class="pc">' + shown[i].pct + '%</span>' +
        '<span class="gm">' + Math.round(r.grams) + ' g</span></li>';
    }).join('');

    // jar layers, bottom up
    const bottom = 384;
    const jarHeight = 286;
    let y = bottom;
    jarLayers.innerHTML = rows.slice().reverse().map((r) => {
      const s = SPICES[r.key];
      const h = (r.pct / 100) * jarHeight;
      y -= h;
      if (h < 0.5) return '';
      const wave = 'M60 ' + (y + 1.6).toFixed(1) + 'c26 4 54-4 80 0s54 3 100-1v' + h.toFixed(1) + 'H60Z';
      return '<rect x="60" y="' + y.toFixed(1) + '" width="180" height="' + h.toFixed(1) + '" fill="' + s.colour + '"/>' +
        '<path d="' + wave + '" fill="' + s.colour + '" opacity=".55"/>' +
        '<rect x="60" y="' + y.toFixed(1) + '" width="180" height="' + Math.min(3, h * .3).toFixed(1) + '" fill="#fff" opacity=".14"/>';
    }).join('');

    // ticket + label
    batchOut.textContent = batch + ' g';
    ticketBlend.textContent = b.name;
    ticketWeight.textContent = batch + ' g';
    ticketNo.textContent = 'NO. ' + lotNumber().replace('SS-', '');
    jarBlend.textContent = b.name.toUpperCase();
    jarWeight.textContent = batch + ' g';
    jarLot.textContent = 'LOT ' + lotNumber();

    const perKg = rows.reduce((a, r) => a + (r.pct / 100) * SPICES[r.key].price, 0);
    const raw = (perKg * batch) / 1000;
    const shop = Math.max(60, Math.round((raw * 1.35) / 5) * 5);
    ticketPrice.textContent = '₹' + shop.toLocaleString('en-IN');
    mixCost.textContent = 'Ground weight ' + batch + ' g · spice cost ₹' + Math.round(raw) +
      ' at today\'s rates · packing and grinding included in the shop price.';

    if (ticketStamp) ticketStamp.hidden = true;
    if (ticket) ticket.classList.remove('stamped');
    if (hint) hint.textContent = b.note;
  }

  function resetMix() {
    mix = Object.assign({}, BLENDS[current].mix);
    batch = 150;
    batchInput.value = '150';
    drawRows();
    render();
  }

  function choose(key) {
    current = key;
    resetMix();
  }

  controls.querySelectorAll('input[name="blend"]').forEach((r) => {
    r.addEventListener('change', () => { if (r.checked) choose(r.value); });
  });

  batchInput.addEventListener('input', () => {
    batch = Number(batchInput.value);
    render();
  });

  controls.addEventListener('submit', (e) => {
    e.preventDefault();
    ticketStamp.hidden = false;
    ticket.classList.add('stamped');
    const rows = shares();
    const top = rows.slice().sort((a, b) => b.pct - a.pct)[0];
    hint.textContent = 'Weighed ' + batch + ' g of ' + BLENDS[current].name.toLowerCase() +
      ' at ' + new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) +
      '. ' + SPICES[top.key].label.toLowerCase() + ' leads at ' + Math.round(top.pct) +
      '%; the pouch is stamped with lot ' + lotNumber() + '.';
  });

  document.getElementById('resetBtn').addEventListener('click', resetMix);

  drawRows();
  render();

  // Keep the bench honest if the page is restored from the back-forward cache.
  window.addEventListener('pageshow', (e) => { if (e.persisted) render(); });
  void order;
})();

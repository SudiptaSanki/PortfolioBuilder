/* Sillage — headspace console and page behaviour.
   All numbers below come from published vapour-pressure tables and
   supplier safety sheets; the console is a teaching model. */

(function () {
  'use strict';

  var MATERIALS = [
    { id: 'limonene', name: 'Limonene', cas: '5989-27-5', rt: 3.8, vp: 1.9, note: 'orange peel, lift',
      fam: { citrus: 1 } },
    { id: 'hexenol', name: 'cis-3-Hexenol', cas: '928-96-1', rt: 4.6, vp: 0.99, note: 'cut grass, crushed leaf',
      fam: { green: 1 } },
    { id: 'linalool', name: 'Linalool', cas: '78-70-6', rt: 9.2, vp: 0.019, note: 'lavender, soft wood',
      fam: { floral: 0.85, citrus: 0.15 } },
    { id: 'calone', name: 'Calone 1951', cas: '28940-11-6', rt: 11.4, vp: 0.0056, note: 'melon skin, sea air',
      fam: { marine: 1 } },
    { id: 'eugenol', name: 'Eugenol', cas: '97-53-0', rt: 14.8, vp: 0.0085, note: 'clove, warm spice',
      fam: { spice: 0.9, woody: 0.1 } },
    { id: 'damascenone', name: 'beta-Damascenone', cas: '23696-85-7', rt: 17.2, vp: 0.0026, note: 'rose, cooked apple',
      fam: { floral: 0.9, woody: 0.1 } },
    { id: 'hedione', name: 'Hedione', cas: '24851-98-7', rt: 28.4, vp: 0.0004, note: 'jasmine, transparent',
      fam: { floral: 1 } },
    { id: 'isoe', name: 'Iso E Super', cas: '54464-57-2', rt: 33.6, vp: 0.0001, note: 'cedar, velvet',
      fam: { woody: 0.7, amber: 0.3 } },
    { id: 'geosmin', name: 'Geosmin', cas: '16423-19-1', rt: 36.1, vp: 0.00006, note: 'wet soil, beetroot',
      fam: { earthy: 1 } },
    { id: 'vanillin', name: 'Vanillin', cas: '121-33-5', rt: 41.5, vp: 0.000002, note: 'vanilla, powder',
      fam: { balsamic: 1 } },
    { id: 'ambroxan', name: 'Ambroxan', cas: '6790-58-5', rt: 47.8, vp: 0.00000012, note: 'ambergris, skin',
      fam: { amber: 1 } },
    { id: 'galaxolide', name: 'Galaxolide', cas: '1222-05-5', rt: 52.6, vp: 0.000005, note: 'clean musk, laundry',
      fam: { musk: 1 } }
  ];

  var FAMILIES = ['citrus', 'green', 'floral', 'marine', 'spice', 'woody', 'amber', 'musk', 'earthy', 'balsamic'];
  var FAMILY_LABEL = {
    citrus: 'Citrus', green: 'Green', floral: 'Floral', marine: 'Marine', spice: 'Spice',
    woody: 'Woody', amber: 'Amber', musk: 'Musk', earthy: 'Earthy', balsamic: 'Balsamic'
  };

  // Explicit preset tables (percent of concentrate by weight)
  var PRESET_TABLE = {
    fig: { limonene: 4, hexenol: 0.8, linalool: 2.4, calone: 0.6, eugenol: 0, damascenone: 0.05, hedione: 8, isoe: 6, geosmin: 0.005, vanillin: 1.2, ambroxan: 1.5, galaxolide: 6 },
    amber: { limonene: 0.4, hexenol: 0.02, linalool: 1.2, calone: 0, eugenol: 0.4, damascenone: 0.15, hedione: 6, isoe: 12, geosmin: 0, vanillin: 3.5, ambroxan: 9, galaxolide: 5 },
    metal: { limonene: 0.6, hexenol: 0.4, linalool: 1.2, calone: 2.5, eugenol: 0.02, damascenone: 0, hedione: 2, isoe: 10, geosmin: 0.01, vanillin: 0, ambroxan: 4, galaxolide: 4 },
    stone: { limonene: 0.3, hexenol: 1.1, linalool: 0.6, calone: 0.9, eugenol: 0.5, damascenone: 0, hedione: 1.5, isoe: 8, geosmin: 0.03, vanillin: 0.6, ambroxan: 3, galaxolide: 3 }
  };

  var doses = {};
  MATERIALS.forEach(function (m) { doses[m.id] = 0; });

  function tierOf(vp) {
    if (vp > 0.1) return 'top';
    if (vp >= 0.001) return 'heart';
    return 'base';
  }

  function volatilityScore(vp) {
    var lg = Math.log10(vp);
    return Math.max(0, Math.min(1, (lg + 7.2) / 7.5));
  }

  function fmtDose(v) {
    if (v <= 0) return '0';
    if (v < 0.1) return v.toFixed(3);
    if (v < 1) return v.toFixed(2);
    return v.toFixed(1);
  }

  /* ---------------- library ---------------- */

  var library = document.getElementById('library');
  var rows = {};

  if (library) {
    MATERIALS.forEach(function (m) {
      var tier = tierOf(m.vp);
      var row = document.createElement('div');
      row.className = 'row is-' + tier;
      row.innerHTML =
        '<label class="row__name" for="dose-' + m.id + '">' + m.name +
        '<span class="row__cas">' + m.cas + ' &middot; ' + m.note + '</span></label>' +
        '<output class="row__val" id="val-' + m.id + '" for="dose-' + m.id + '">0</output>' +
        '<input type="range" id="dose-' + m.id + '" name="' + m.id + '" min="0" max="15" step="0.01" value="0" ' +
        'aria-label="' + m.name + ', percent of concentrate">';
      library.appendChild(row);
      var input = row.querySelector('input');
      rows[m.id] = { input: input, out: row.querySelector('output'), row: row };
      input.addEventListener('input', function () {
        doses[m.id] = parseFloat(input.value) || 0;
        setPresetState(null);
        render();
      });
    });
    applyPreset('fig');
  }

  function setDose(id, value) {
    if (!rows[id]) return;
    var v = Math.max(0, Math.min(15, Number(value) || 0));
    doses[id] = v;
    rows[id].input.value = String(v);
    render();
  }

  function applyPreset(key) {
    var table = PRESET_TABLE[key];
    if (!table) return;
    MATERIALS.forEach(function (m) {
      var v = typeof table[m.id] === 'number' ? table[m.id] : 0;
      doses[m.id] = v;
      if (rows[m.id]) {
        rows[m.id].input.value = String(v);
      }
    });
    setPresetState(key);
    render();
  }

  function setPresetState(key) {
    document.querySelectorAll('[data-preset]').forEach(function (b) {
      if (key && b.dataset.preset === key) b.setAttribute('aria-pressed', 'true');
      else if (!key) b.removeAttribute('aria-pressed');
      else b.setAttribute('aria-pressed', 'false');
    });
  }

  document.querySelectorAll('[data-preset]').forEach(function (btn) {
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', function () { applyPreset(btn.dataset.preset); });
  });

  /* ---------------- computation ---------------- */

  function compute() {
    var total = 0;
    var tiers = { top: 0, heart: 0, base: 0 };
    var fam = {};
    FAMILIES.forEach(function (f) { fam[f] = 0; });
    var volatility = 0;
    MATERIALS.forEach(function (m) {
      var d = doses[m.id] || 0;
      if (d <= 0) return;
      total += d;
      tiers[tierOf(m.vp)] += d;
      Object.keys(m.fam).forEach(function (f) { fam[f] += d * m.fam[f]; });
      volatility += d * volatilityScore(m.vp);
    });
    var sillage = total > 0 ? Math.round((volatility / total) * 100) : 0;
    return { total: total, tiers: tiers, families: fam, sillage: sillage };
  }

  function advisoryFor(total, result) {
    var notes = [];
    if (doses.geosmin >= 0.02) notes.push('Geosmin at ' + fmtDose(doses.geosmin) + ' % will read as wet cellar rather than wet stone. Most briefs want 0.005 %.');
    if (doses.vanillin >= 4) notes.push('Vanillin above 4 % starts to yellow the cartridge nozzle and drags the whole accord toward vanilla.');
    if (doses.hedione >= 12) notes.push('Hedione at ' + fmtDose(doses.hedione) + ' % will flatten the florals underneath it. It is a solvent as much as a material.');
    if (total > 40) notes.push('The accord is ' + total.toFixed(1) + ' % of the concentrate. Above 40 % there is little room left for the carrier and the rest of the formula.');
    if (total > 0 && result.tiers.top / total < 0.02) notes.push('Under 2 % top notes: the opening will arrive slowly on skin and not at all on a cold cartridge.');
    if (total > 0 && result.tiers.base / total > 0.85) notes.push('Base materials dominate. Expect a heavy trail and a cartridge that keeps working after the visitor has walked away.');
    if (!notes.length) return 'No material is above its advisory threshold.';
    return notes[0];
  }

  /* ---------------- readout ---------------- */

  function renderReadout(result) {
    var total = result.total;
    var pct = function (v) { return total > 0 ? Math.round((v / total) * 100) : 0; };
    var setText = function (id, t) { var el = document.getElementById(id); if (el) el.textContent = t; };

    setText('plot-total', total.toFixed(1) + ' % charged');
    setText('tier-top', pct(result.tiers.top) + ' %');
    setText('tier-heart', pct(result.tiers.heart) + ' %');
    setText('tier-base', pct(result.tiers.base) + ' %');

    var bar = document.getElementById('tier-bar');
    if (bar) {
      bar.innerHTML = '';
      ['top', 'heart', 'base'].forEach(function (k) {
        var s = document.createElement('span');
        s.style.width = (total > 0 ? (result.tiers[k] / total) * 100 : 0) + '%';
        s.style.background = k === 'top' ? 'var(--resin)' : k === 'heart' ? 'var(--heart)' : 'var(--verdigris)';
        s.title = k + ' ' + pct(result.tiers[k]) + ' %';
        bar.appendChild(s);
      });
    }

    var list = document.getElementById('families');
    if (list) {
      var maxFam = 0;
      FAMILIES.forEach(function (f) { maxFam = Math.max(maxFam, result.families[f]); });
      list.innerHTML = FAMILIES.map(function (f) {
        var v = result.families[f];
        var w = maxFam > 0 ? (v / maxFam) * 100 : 0;
        return '<li><span>' + FAMILY_LABEL[f] + '</span><span class="track"><i style="width:' + w.toFixed(1) + '%"></i></span>' +
          '<b>' + (total > 0 ? Math.round((v / total) * 100) : 0) + '%</b></li>';
      }).join('');
    }

    setText('sillage-value', String(result.sillage));
    var fill = document.getElementById('sillage-fill');
    if (fill) fill.style.width = result.sillage + '%';

    var note = document.getElementById('sillage-note');
    if (note) {
      var verdict = result.sillage > 62 ? 'Leaves the skin inside two hours; reads as a top-note accord.'
        : result.sillage > 38 ? 'A balanced arc: an hour of lift, then a long middle.'
        : 'Skin-close and slow. Suitable for a cartridge that must last a gallery day.';
      note.textContent = verdict + ' Weighted by vapour pressure at 32 °C.';
    }

    var adv = document.getElementById('advisory');
    if (adv) adv.textContent = advisoryFor(total, result);
  }

  /* ---------------- chromatogram ---------------- */

  var canvas = document.getElementById('chromatogram');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var tooltip = null;
  var peakBoxes = [];

  if (canvas) {
    tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.setAttribute('role', 'status');
    canvas.parentNode.appendChild(tooltip);
  }

  var MAX_MIN = 60;

  function draw() {
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cssW = canvas.clientWidth || 640;
    var ratio = 360 / 640;
    var cssH = Math.round(cssW * ratio);
    if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    var m = { l: 40, r: 14, t: 20, b: 30 };
    var w = cssW - m.l - m.r;
    var h = cssH - m.t - m.b;
    var styles = getComputedStyle(document.documentElement);
    var ink = styles.getPropertyValue('--ink').trim() || '#1c1912';
    var muted = styles.getPropertyValue('--muted').trim() || '#6a6254';
    var rule = 'rgba(28,25,18,0.12)';
    var colour = {
      top: styles.getPropertyValue('--resin').trim() || '#8a3f14',
      heart: styles.getPropertyValue('--heart').trim() || '#7a5a2e',
      base: styles.getPropertyValue('--verdigris').trim() || '#39544a'
    };

    var maxDose = 0;
    MATERIALS.forEach(function (mt) { maxDose = Math.max(maxDose, doses[mt.id] || 0); });

    // grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = rule;
    ctx.font = '9px "IBM Plex Mono", monospace';
    ctx.fillStyle = muted;
    for (var i = 0; i <= 6; i += 1) {
      var gx = m.l + (w * i) / 6;
      ctx.beginPath();
      ctx.moveTo(gx, m.t);
      ctx.lineTo(gx, m.t + h);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.fillText(String(i * 10), gx, m.t + h + 14);
    }
    for (var j = 0; j <= 3; j += 1) {
      var gy = m.t + (h * j) / 3;
      ctx.beginPath();
      ctx.moveTo(m.l, gy);
      ctx.lineTo(m.l + w, gy);
      ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(28,25,18,0.45)';
    ctx.beginPath();
    ctx.moveTo(m.l, m.t + h);
    ctx.lineTo(m.l + w, m.t + h);
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = muted;
    ctx.fillText('min', 8, m.t + h + 14);
    ctx.save();
    ctx.translate(11, m.t + h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('detector response', 0, 0);
    ctx.restore();

    // baseline ripple to signal a real detector trace
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(28,25,18,0.22)';
    for (var x = 0; x <= w; x += 2) {
      var n = Math.sin(x * 0.09) * 1.4 + Math.sin(x * 0.31) * 0.9;
      var y = m.t + h - 2 + n;
      if (x === 0) ctx.moveTo(m.l + x, y); else ctx.lineTo(m.l + x, y);
    }
    ctx.stroke();

    peakBoxes = [];
    var labels = [];
    var ordered = MATERIALS.slice().sort(function (a, b) { return (doses[b.id] || 0) - (doses[a.id] || 0); });

    MATERIALS.forEach(function (mt) {
      var d = doses[mt.id] || 0;
      if (d <= 0 || maxDose <= 0) return;
      var cx = m.l + (mt.rt / MAX_MIN) * w;
      var height = Math.max(4, (Math.sqrt(d) / Math.sqrt(maxDose)) * (h - 14));
      var sigma = Math.max(4, w * 0.011);
      var tier = tierOf(mt.vp);
      ctx.beginPath();
      ctx.moveTo(cx - sigma * 3, m.t + h);
      var top = m.t + h - height;
      for (var px = -sigma * 3; px <= sigma * 3; px += 1) {
        var yy = m.t + h - height * Math.exp(-(px * px) / (2 * sigma * sigma));
        ctx.lineTo(cx + px, yy);
      }
      ctx.lineTo(cx + sigma * 3, m.t + h);
      ctx.closePath();
      ctx.fillStyle = colour[tier];
      ctx.globalAlpha = 0.82;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colour[tier];
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - sigma * 3, m.t + h);
      for (var px2 = -sigma * 3; px2 <= sigma * 3; px2 += 1) {
        var yy2 = m.t + h - height * Math.exp(-(px2 * px2) / (2 * sigma * sigma));
        ctx.lineTo(cx + px2, yy2);
      }
      ctx.stroke();

      peakBoxes.push({ id: mt.id, x: cx, y: top, w: sigma * 3, r: mt.rt });

      if (ordered.slice(0, 3).indexOf(mt) !== -1 || d / maxDose > 0.55) {
        labels.push({ x: cx, y: top - 6, text: mt.name, d: d });
      }
    });

    // labels, nudged apart
    labels.sort(function (a, b) { return a.x - b.x; });
    var lastY = {};
    ctx.font = '9.5px "IBM Plex Mono", monospace';
    ctx.fillStyle = ink;
    labels.forEach(function (lb) {
      var key = Math.round(lb.x / 40);
      var y = lb.y;
      if (lastY[key] && y > lastY[key] - 11) y = lastY[key] - 11;
      lastY[key] = y;
      ctx.textAlign = 'center';
      ctx.fillText(lb.text, Math.max(m.l + 26, Math.min(m.l + w - 26, lb.x)), Math.max(m.t + 8, y));
    });

    if (maxDose === 0) {
      ctx.textAlign = 'center';
      ctx.fillStyle = muted;
      ctx.font = '11px "IBM Plex Mono", monospace';
      ctx.fillText('No material charged — set a dose to see a trace', m.l + w / 2, m.t + h / 2);
    }

    var desc = document.getElementById('chroma-desc');
    if (desc) {
      var active = MATERIALS.filter(function (mt) { return (doses[mt.id] || 0) > 0; })
        .map(function (mt) { return mt.name + ' ' + fmtDose(doses[mt.id]) + ' % at ' + mt.rt + ' minutes'; });
      desc.textContent = active.length ? 'Chromatogram. ' + active.join('; ') + '.' : 'Chromatogram empty.';
    }
  }

  function render() {
    var result = compute();
    MATERIALS.forEach(function (m) {
      if (rows[m.id]) rows[m.id].out.textContent = fmtDose(doses[m.id] || 0);
    });
    renderReadout(result);
    draw();
  }

  if (canvas) {
    canvas.addEventListener('mousemove', function (ev) {
      var rect = canvas.getBoundingClientRect();
      var x = ev.clientX - rect.left;
      var y = ev.clientY - rect.top;
      var hit = null;
      peakBoxes.forEach(function (b) {
        if (Math.abs(x - b.x) < Math.max(7, b.w * 0.5) && y > b.y - 12 && y < rect.height) hit = b;
      });
      if (hit) {
        var mt = MATERIALS.filter(function (m) { return m.id === hit.id; })[0];
        tooltip.textContent = mt.name + ' · ' + fmtDose(doses[mt.id]) + ' % · RT ' + mt.rt + ' min';
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.classList.add('on');
      } else {
        tooltip.classList.remove('on');
      }
    });
    canvas.addEventListener('mouseleave', function () { tooltip.classList.remove('on'); });
    window.addEventListener('resize', draw);
  }

  /* ---------------- page behaviour ---------------- */

  // projects filter
  var filterButtons = document.querySelectorAll('[data-filter]');
  var cases = document.querySelectorAll('.case');
  if (filterButtons.length && cases.length) {
    var countEl = document.getElementById('case-count');
    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var f = btn.dataset.filter;
        filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
        var shown = 0;
        cases.forEach(function (c) {
          var match = f === 'all' || c.dataset.kind === f;
          c.classList.toggle('is-hidden', !match);
          if (match) shown += 1;
        });
        if (countEl) countEl.textContent = shown + ' of ' + cases.length + ' shown';
      });
    });
  }

  // contact brief form
  var form = document.getElementById('brief-form');
  if (form) {
    var resultPanel = document.getElementById('brief-result');
    var preview = document.getElementById('brief-preview');
    var send = document.getElementById('brief-send');

    var showError = function (field, message) {
      var err = document.getElementById('err-' + field.name);
      if (err) err.textContent = message;
      if (field.type !== 'checkbox') field.setAttribute('aria-invalid', message ? 'true' : 'false');
    };

    var validate = function () {
      var ok = true;
      var fields = form.querySelectorAll('input, select, textarea');
      fields.forEach(function (field) {
        if (field.type === 'checkbox') {
          showError(field, field.checked ? '' : 'Please confirm you are happy for us to hold this brief.');
          if (!field.checked) ok = false;
          return;
        }
        var v = field.value.trim();
        var msg = '';
        if (field.required && !v) msg = 'This is needed before we can reply.';
        else if (field.type === 'email' && v && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) msg = 'Check the address — it is missing an @ or a domain.';
        else if (field.type === 'number' && v && (Number(v) < 1 || Number(v) > 12)) msg = 'Our rigs take 1 to 12 channels.';
        showError(field, msg);
        if (msg) ok = false;
      });
      return ok;
    };

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var valid = validate();
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (!valid) {
        if (resultPanel) resultPanel.hidden = true;
        if (firstBad) firstBad.focus();
        return;
      }
      var data = {
        name: form.elements.name.value.trim(),
        email: form.elements.email.value.trim(),
        org: form.elements.org.value.trim() || '—',
        type: form.elements.type.value,
        channels: form.elements.channels.value || '—',
        timeline: form.elements.timeline.value,
        message: form.elements.message.value.trim()
      };
      var text = [
        'BRIEF — SILLAGE',
        'name      ' + data.name,
        'email     ' + data.email,
        'client    ' + data.org,
        'work      ' + data.type,
        'channels  ' + data.channels,
        'timeline  ' + data.timeline,
        '',
        data.message
      ].join('\n');
      preview.textContent = text;
      send.href = 'mailto:studio@sillage.example?subject=' +
        encodeURIComponent('Brief — ' + data.type + ' — ' + data.name) +
        '&body=' + encodeURIComponent(text);
      resultPanel.hidden = false;
      resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

    form.addEventListener('input', function (ev) {
      if (ev.target.getAttribute('aria-invalid') === 'true') showError(ev.target, '');
    });
  }

  // year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  if (library) render();

  window.__aroma = {
    setDose: setDose,
    preset: applyPreset,
    doses: function () { return JSON.parse(JSON.stringify(doses)); },
    read: function () {
      var r = compute();
      return {
        total: Math.round(r.total * 1000) / 1000,
        sillage: r.sillage,
        tiers: { top: Math.round(r.tiers.top * 1000) / 1000, heart: Math.round(r.tiers.heart * 1000) / 1000, base: Math.round(r.tiers.base * 1000) / 1000 },
        text: (document.getElementById('plot-total') || {}).textContent || ''
      };
    }
  };
})();

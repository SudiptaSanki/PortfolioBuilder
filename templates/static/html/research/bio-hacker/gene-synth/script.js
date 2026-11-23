// Gene Synth — Bench 14 restriction digest, gel and GC track.
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menuBtn = document.getElementById('menuBtn');
  var nav = document.getElementById('siteNav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* ---------- contact form ---------- */
  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var message = form.elements.message.value.trim();
      var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
      if (!name || !ok || message.length < 12) {
        status.className = 'form-status err';
        status.textContent = !name ? 'Name required.' : !ok ? 'Check the email address.' : 'Add a line about what you want to do at the bench.';
        return;
      }
      status.className = 'form-status';
      status.textContent = 'Request logged. You will hear back before the next Tuesday session.';
      form.reset();
    });
  }

  /* ---------- sequences ---------- */
  var SEQ = {
    pLUX1: 'CCGTAATGCCTTTCCCTAACAGAGTTTTTCGAACTCGTGTTGTCGAGCGACGGAATTAGAGAATTCAAATGGCAGAAAACTGGCAGGGCTTTTAGTCGTGGGATGATCAGTGGGTAAAGGTGGCGCGGGGTAACGCGCGCGGATCCTCAGCTGCAACGCGGAGCTGGTGTGTTATCCATTCATGGCAGACAACTAATACGCATAAGCGTAGCCAACCGCATTAGCGTATGAAGCTTATAATGCGAGTTGGGCGTACATACAGTTATAGTGTTTACCGATCTCAGGGATATAGAATCCTAACTCGAGAATGGAACAAAGCACCCTTGGTGTATCTCTTCTCCATTTCCGCCGCGTGCGAGTGTCGACTCTTCTATATATCCACGCCGCCAGCAGCTAAAAGGAGTGAAGGTTTACTTCGAGATATGAGGTGCTGCAGAGCCCGTAACGTGCTTGCAACTGAGGTACATGCGGTTAGTACGAAACCTTCCTCCCCGGGATTTGGTGTACAACTCTCCCATAGCCTAAAGCATAGGGGCAAAGGGTACCGAATACCTTTATCTGATTTGCGGCCGCGTCACGGCTCCCACTCACACTTCAATTGTAACTATTACC',
    pGEL2: 'GCTAAAGACAATTACATAACATACACGTCAGCACGAAACTTGTTGGCCCAGTGTGAATCGCTTAAGGGTTAAGTAAGTGTGATGCATACGGAATTCCTTGCTGTGTCCACCCCATCGGACTGGCATTTTTATTACACTCAGAAACAGAACTCGGGTAATTTTGACAGGTCACGCAGAGGCGCGCCCTCCTGAAGTGCGTGGGATCCCGCTATGAATCTCTGATTTACCCACTCTGCCAAACTCCAGCGCGGTCAGTTCCATCACCCTAAGTAACCGAATAATGCGTTCGCTCTATTGACTACGACGCGCTCATTCCCTTGTCGGAGAGTTAAGCTTCAAGGACGCTGTCTGAGACTAGAAGACAGATAGTGCACACGACCGGCGTCGGAGAAACTCTATTTGCCGCCTGACAAGTCAATGCTCGAGGTAGGGGCAGCGCAGTATGCCAAGACTATAGGCACTGTCGCATCACAAACGATTAACTGATAAATGAGCCCTTTATGACACGGGGTCGACACTGGTTTACGATAGTATGTCCAACGGCGAGCTTTACATTTGCTGTGAGAGGTACAGGGATTAGTGAGAAGCCGTGCGTATCAACTGCAGCCTTGGGGGTCGTTACCACTCTGTTCCCACGAGCGGCATTTCTGGATGGCCAGCCCCGGGCATTTAATTTCACCCATAAACCAGCGTAAAGCTGGGTACCGCTCCAGCGGCCGC'
  };

  var ENZYMES = {
    EcoRI: { site: 'GAATTC', cut: 1 },
    BamHI: { site: 'GGATCC', cut: 1 },
    HindIII: { site: 'AAGCTT', cut: 1 },
    XhoI: { site: 'CTCGAG', cut: 1 },
    SalI: { site: 'GTCGAC', cut: 1 },
    PstI: { site: 'CTGCAG', cut: 5 },
    SmaI: { site: 'CCCGGG', cut: 3 },
    KpnI: { site: 'GGTACC', cut: 5 },
    NotI: { site: 'GCGGCCGC', cut: 2 }
  };

  var seqEl = document.getElementById('seq');
  if (!seqEl) return;

  var enzymesEl = document.getElementById('enzymes');
  var gelEl = document.getElementById('gel');
  var gcEl = document.getElementById('gc');

  function clean(raw) {
    return raw.toUpperCase().replace(/[^ACGT]/g, '');
  }

  function selectedEnzymes() {
    return Array.prototype.slice.call(enzymesEl.querySelectorAll('input:checked')).map(function (i) { return i.value; });
  }

  function findCuts(seq) {
    var cuts = [];
    var hits = [];
    selectedEnzymes().forEach(function (name) {
      var enz = ENZYMES[name];
      var from = 0;
      while (true) {
        var i = seq.indexOf(enz.site, from);
        if (i === -1) break;
        cuts.push(i + enz.cut);
        hits.push({ enzyme: name, at: i + enz.cut });
        from = i + 1;
      }
    });
    cuts = cuts.filter(function (c) { return c > 0 && c < seq.length; });
    cuts.sort(function (a, b) { return a - b; });
    return { cuts: cuts, hits: hits };
  }

  function fragments(seq, cuts) {
    var edges = [0].concat(cuts, [seq.length]);
    var out = [];
    for (var i = 1; i < edges.length; i++) {
      var size = edges[i] - edges[i - 1];
      if (size > 0) out.push(size);
    }
    return out.sort(function (a, b) { return b - a; });
  }

  /* ---------- gel ---------- */
  function gelY(size, top, bottom) {
    var lo = Math.log10(70), hi = Math.log10(3200);
    var t = (Math.log10(Math.max(size, 70)) - lo) / (hi - lo);
    return bottom - t * (bottom - top);
  }

  function drawGel(seq, cuts, frags, hits) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(280, Math.round(gelEl.clientWidth || 640));
    var h = Math.round(w * (w < 480 ? 0.78 : 420 / 640));
    if (gelEl.width !== w * dpr || gelEl.height !== h * dpr) {
      gelEl.width = w * dpr;
      gelEl.height = h * dpr;
      gelEl.style.height = h + 'px';
    }
    var g = gelEl.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);

    g.fillStyle = '#101b1d';
    g.fillRect(0, 0, w, h);

    // gel bed edge
    var left = 44, right = w - 44, top = 64, bottom = h - 40;
    g.strokeStyle = 'rgba(217,242,228,0.14)';
    g.lineWidth = 1;
    g.strokeRect(left, top - 36, right - left, bottom - top + 36);

    // wells
    var half = Math.max(10, w * 0.042);
    var lanes = [
      { x: Math.round(w * 0.2), label: 'L', sub: 'ladder' },
      { x: Math.round(w * 0.48), label: 'U', sub: 'uncut' },
      { x: Math.round(w * 0.73), label: 'D', sub: 'digest' }
    ];
    lanes.forEach(function (lane) {
      g.fillStyle = 'rgba(217,242,228,0.10)';
      g.fillRect(lane.x - half, top - 24, half * 2, 8);
      g.strokeStyle = 'rgba(217,242,228,0.35)';
      g.strokeRect(lane.x - half, top - 24, half * 2, 8);
      g.fillStyle = 'rgba(217,242,228,0.55)';
      g.font = '10px "Martian Mono", monospace';
      g.textAlign = 'center';
      g.fillText(lane.label, lane.x, top - 34);
      g.fillStyle = 'rgba(217,242,228,0.28)';
      g.font = '8px "Martian Mono", monospace';
      g.fillText(lane.sub, lane.x, bottom + 18);
    });

    // ladder
    var ladder = [100, 200, 300, 400, 500, 600, 700, 800, 1000, 1200, 1500, 2000, 3000];
    ladder.forEach(function (size) {
      var y = gelY(size, top + 6, bottom);
      g.fillStyle = 'rgba(217,242,228,0.55)';
      g.fillRect(lanes[0].x - half, y - 1.6, half * 2, 3.2);
      g.fillStyle = 'rgba(217,242,228,0.4)';
      g.font = '9px "Martian Mono", monospace';
      g.textAlign = 'right';
      g.fillText(String(size), lanes[0].x - half - 6, y + 3);
    });

    // uncut lane
    var yU = gelY(seq.length, top + 6, bottom);
    g.fillStyle = 'rgba(217,242,228,0.75)';
    g.fillRect(lanes[1].x - half, yU - 2, half * 2, 4);

    // digest lane, bands that co-migrate within 4 % are drawn as one thicker band
    var groups = [];
    frags.forEach(function (f) {
      var last = groups[groups.length - 1];
      if (last && Math.abs(last.size - f) / Math.max(last.size, f) < 0.04) {
        last.count += 1;
      } else {
        groups.push({ size: f, count: 1 });
      }
    });
    groups.forEach(function (band) {
      var y = gelY(band.size, top + 6, bottom);
      var thickness = Math.min(9, 3.2 + (band.count - 1) * 2.6);
      var alpha = band.size < 70 ? 0.28 : 0.9;
      g.fillStyle = 'rgba(217,242,228,' + alpha + ')';
      g.fillRect(lanes[2].x - half, y - thickness / 2, half * 2, thickness);
      if (band.size < 70) {
        g.fillStyle = 'rgba(217,242,228,0.45)';
        g.font = '9px "Martian Mono", monospace';
        g.textAlign = 'left';
        g.fillText('run off', lanes[2].x + half + 6, y + 3);
      }
    });

    // size axis
    g.strokeStyle = 'rgba(217,242,228,0.18)';
    g.beginPath();
    g.moveTo(left - 8, top + 6);
    g.lineTo(left - 8, bottom);
    g.stroke();

    // selected cut sites on a small linear map along the bottom
    var mapY = h - 16;
    g.strokeStyle = 'rgba(217,242,228,0.35)';
    g.beginPath();
    g.moveTo(left, mapY);
    g.lineTo(right, mapY);
    g.stroke();
    hits.forEach(function (hit) {
      var x = left + (hit.at / seq.length) * (right - left);
      g.strokeStyle = '#e0743f';
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(x, mapY - 6);
      g.lineTo(x, mapY + 6);
      g.stroke();
    });
    g.fillStyle = 'rgba(217,242,228,0.4)';
    g.font = '8px "Martian Mono", monospace';
    g.textAlign = 'right';
    g.fillText(seq.length + ' bp', right, mapY - 8);
  }

  /* ---------- GC track ---------- */
  function drawGC(seq, cuts) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(240, Math.round(gcEl.clientWidth || 420));
    var h = Math.round(w * (w < 340 ? 0.4 : 150 / 420));
    if (gcEl.width !== w * dpr || gcEl.height !== h * dpr) {
      gcEl.width = w * dpr;
      gcEl.height = h * dpr;
      gcEl.style.height = h + 'px';
    }
    var g = gcEl.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);

    var left = 26, right = w - 8, top = 12, bottom = h - 20;
    // 50 % guide
    g.strokeStyle = 'rgba(20,17,15,0.25)';
    g.setLineDash([2, 3]);
    g.beginPath();
    g.moveTo(left, (top + bottom) / 2);
    g.lineTo(right, (top + bottom) / 2);
    g.stroke();
    g.setLineDash([]);

    var win = 25;
    if (seq.length < win) { win = Math.max(5, Math.floor(seq.length / 2)); }
    var pts = [];
    for (var i = 0; i <= seq.length - win; i += Math.max(1, Math.floor(win / 5))) {
      var chunk = seq.slice(i, i + win);
      var gc = 0;
      for (var k = 0; k < chunk.length; k++) {
        if (chunk[k] === 'G' || chunk[k] === 'C') gc++;
      }
      var frac = gc / chunk.length;
      var x = left + (i / Math.max(1, seq.length)) * (right - left);
      var y = bottom - frac * (bottom - top);
      pts.push([x, y]);
    }
    if (pts.length > 1) {
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (var p = 1; p < pts.length; p++) g.lineTo(pts[p][0], pts[p][1]);
      g.strokeStyle = '#d8451c';
      g.lineWidth = 1.3;
      g.stroke();
      // area tint
      g.lineTo(pts[pts.length - 1][0], bottom);
      g.lineTo(pts[0][0], bottom);
      g.closePath();
      g.fillStyle = 'rgba(216,69,28,0.07)';
      g.fill();
    }

    // cut ticks
    cuts.forEach(function (c) {
      var x = left + (c / seq.length) * (right - left);
      g.strokeStyle = 'rgba(20,17,15,0.55)';
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(x, top - 2);
      g.lineTo(x, bottom);
      g.stroke();
    });

    g.fillStyle = 'rgba(20,17,15,0.55)';
    g.font = '8px "Martian Mono", monospace';
    g.textAlign = 'left';
    g.fillText('100%', 2, top + 6);
    g.fillText('0%', 2, bottom);
    g.textAlign = 'right';
    g.fillText(seq.length + ' bp', right, h - 4);
    g.textAlign = 'left';
    g.fillText('50%', 2, (top + bottom) / 2 + 3);
  }

  /* ---------- readouts ---------- */
  function update() {
    var raw = seqEl.value;
    var seq = clean(raw);
    var dropped = raw.replace(/[\s>0-9]/g, '').length - seq.length;

    var gcCount = 0;
    for (var i = 0; i < seq.length; i++) if (seq[i] === 'G' || seq[i] === 'C') gcCount++;
    var gcPct = seq.length ? (100 * gcCount / seq.length) : 0;
    document.getElementById('seqMeta').textContent = seq.length + ' bp · ' + gcPct.toFixed(1) + ' % GC' + (dropped > 0 ? ' · ' + dropped + ' non-ACGT removed' : '');

    var names = selectedEnzymes();
    document.getElementById('enzymeCount').textContent = names.length + (names.length === 1 ? ' selected' : ' selected');

    var found = findCuts(seq);
    var frags = fragments(seq, found.cuts);

    document.getElementById('statFrags').textContent = String(frags.length);
    document.getElementById('statMax').textContent = frags.length ? frags[0] + ' bp' : '—';
    document.getElementById('statMin').textContent = frags.length ? frags[frags.length - 1] + ' bp' : '—';

    var coMigrate = false;
    for (var a = 1; a < frags.length; a++) {
      if (Math.abs(frags[a] - frags[a - 1]) / Math.max(frags[a], frags[a - 1]) < 0.04) coMigrate = true;
    }
    var resEl = document.getElementById('statRes');
    resEl.textContent = coMigrate ? '2 co-migrate' : 'OK';
    resEl.style.color = coMigrate ? '#d8451c' : '';

    var list = document.getElementById('frags');
    list.innerHTML = '';
    if (!seq.length) {
      var empty = document.createElement('li');
      empty.className = 'frag-empty';
      empty.textContent = 'No sequence. Paste DNA above or load a preset.';
      list.appendChild(empty);
    } else if (!frags.length) {
      var none = document.createElement('li');
      none.className = 'frag-empty';
      none.textContent = 'No fragments.';
      list.appendChild(none);
    } else {
      frags.forEach(function (f, idx) {
        var li = document.createElement('li');
        var label = document.createElement('span');
        label.textContent = '#' + (idx + 1);
        var val = document.createElement('span');
        val.textContent = f.toLocaleString('en-US') + ' bp';
        li.appendChild(label);
        li.appendChild(val);
        list.appendChild(li);
      });
      var cutsLi = document.createElement('li');
      cutsLi.style.borderTop = '1px solid rgba(20,17,15,.3)';
      cutsLi.style.marginTop = '4px';
      cutsLi.style.color = '#6a645b';
      cutsLi.innerHTML = '<span>cuts</span><span>' + found.cuts.length + (names.length ? ' by ' + names.join(' + ') : '') + '</span>';
      list.appendChild(cutsLi);
    }

    document.getElementById('gelNote').textContent = '3 lanes · ' + found.cuts.length + ' cuts';
    drawGel(seq, found.cuts, frags, found.hits);
    drawGC(seq, found.cuts);
  }

  seqEl.addEventListener('input', update);
  enzymesEl.addEventListener('change', update);

  Array.prototype.forEach.call(document.querySelectorAll('[data-seq]'), function (btn) {
    btn.addEventListener('click', function () {
      var key = btn.getAttribute('data-seq');
      seqEl.value = key === 'clear' ? '' : SEQ[key];
      update();
    });
  });

  update();

})();

/* Cipher Vault — BB84 sifting diagram and the ML-KEM handshake bench. */

(function () {
  'use strict';

  /* ------------------------------------------------------------- mobile nav */
  var railMenu = document.getElementById('railMenu');
  var railNav = document.getElementById('railNav');
  if (railMenu && railNav) {
    railMenu.addEventListener('click', function () {
      var open = railNav.classList.toggle('open');
      railMenu.setAttribute('aria-expanded', open ? 'true' : 'false');
      railMenu.textContent = open ? 'Close' : 'Sections';
    });
    railNav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        railNav.classList.remove('open');
        railMenu.setAttribute('aria-expanded', 'false');
        railMenu.textContent = 'Sections';
      }
    });
  }

  /* ----------------------------------------------------------------- intake */
  var intake = document.getElementById('intake');
  if (intake) {
    var fstatus = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    function setErr(id, message) {
      var input = document.getElementById(id);
      var err = document.getElementById(id + 'Err');
      if (input) input.setAttribute('aria-invalid', message ? 'true' : 'false');
      if (err) err.textContent = message || '';
      return !message;
    }

    ['name', 'email', 'msg'].forEach(function (id) {
      var input = document.getElementById(id);
      if (input) input.addEventListener('input', function () { setErr(id, ''); });
    });

    intake.addEventListener('submit', function (event) {
      event.preventDefault();
      var ok = true;
      if (!intake.elements.name.value.trim()) ok = setErr('name', 'A name is needed for the reply.') && ok;
      else setErr('name', '');
      if (!intake.elements.email.value.trim()) ok = setErr('email', 'Please add an email address.') && ok;
      else if (!emailRe.test(intake.elements.email.value.trim())) ok = setErr('email', 'That address looks incomplete.') && ok;
      else setErr('email', '');
      if (intake.elements.msg.value.trim().length < 24) ok = setErr('msg', 'A sentence or two about the estate is enough to start.') && ok;
      else setErr('msg', '');

      if (!ok) {
        fstatus.className = 'form-status show';
        fstatus.textContent = 'The brief needs a name, an email address and a sentence about the estate.';
        var bad = intake.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var who = intake.elements.name.value.trim().split(' ')[0];
      fstatus.className = 'form-status show';
      fstatus.textContent = 'Thank you, ' + who + '. I will reply within two working days with a scoping call or a straight answer that you need less than you asked for. This is a demonstration form in a portfolio template; nothing was transmitted.';
      intake.reset();
      ['name', 'email', 'msg'].forEach(function (id) { setErr(id, ''); });
    });
  }

  /* --------------------------------------------------------------- BB84 data */
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  var SLOTS = 24;
  var rand = mulberry32(20261120);
  var aliceBits = [], aliceBasis = [], bobBasis = [], sifted = [], errors = [];

  (function build() {
    /* Bob guesses wrong in six fixed slots, so 18 of 24 are sifted. */
    var flip = [2, 5, 9, 13, 17, 21];
    for (var i = 0; i < SLOTS; i++) {
      aliceBits.push(rand() < 0.5 ? 1 : 0);
      aliceBasis.push(rand() < 0.5 ? '+' : 'x');
      bobBasis.push(i in flip ? (aliceBasis[i] === '+' ? 'x' : '+') : aliceBasis[i]);
    }
    for (var j = 0; j < SLOTS; j++) {
      if (aliceBasis[j] === bobBasis[j]) sifted.push(j);
    }
    /* two bit errors in the sifted set, at fixed positions */
    errors[sifted[3]] = true;
    errors[sifted[11]] = true;
  })();

  var canvas = document.getElementById('bb84');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var progress = 1;
  var animating = false;

  function setCanvasSize() {
    if (!canvas) return;
    var dpr = window.devicePixelRatio || 1;
    var cssW = canvas.clientWidth || 760;
    var cssH = Math.round(cssW * 380 / 680);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.height = cssH + 'px';
    if (ctx) ctx.setTransform(dpr * (cssW / 680), 0, 0, dpr * (cssW / 680), 0, 0);
  }

  function draw() {
    if (!ctx) return;
    var W = 680, H = 380;
    ctx.clearRect(0, 0, W, H);

    var left = 100, right = 656, top = 62, colW = (right - left) / SLOTS;
    var rows = [
      { key: 'bit', y: 92, label: 'Alice bit' },
      { key: 'ab', y: 148, label: 'Alice basis' },
      { key: 'bb', y: 204, label: 'Bob basis' },
      { key: 'res', y: 270, label: 'Sifted' }
    ];

    ctx.font = '11.5px "JetBrains Mono", monospace';
    ctx.textBaseline = 'middle';

    /* column guides */
    ctx.strokeStyle = 'rgba(232,228,220,0.07)';
    ctx.lineWidth = 1;
    for (var i = 0; i <= SLOTS; i++) {
      var x = left + i * colW;
      ctx.beginPath(); ctx.moveTo(x, top - 16); ctx.lineTo(x, 322); ctx.stroke();
    }

    /* headers */
    ctx.fillStyle = '#7f8a8c';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('PHOTON SLOT', left, 32);
    ctx.textAlign = 'right';
    ctx.fillText('24 SLOTS · 0.1 ns GATE', right, 32);

    /* row labels */
    rows.forEach(function (r) {
      ctx.fillStyle = '#7f8a8c';
      ctx.textAlign = 'left';
      ctx.font = '10px "JetBrains Mono", monospace';
      ctx.fillText(r.label, 16, r.y + 2);
    });

    var visible = Math.round(progress * SLOTS);

    for (var s = 0; s < visible; s++) {
      var cx = left + s * colW + colW / 2;

      /* bit cell */
      ctx.beginPath();
      ctx.arc(cx, 92, 6.5, 0, Math.PI * 2);
      if (aliceBits[s] === 1) {
        ctx.fillStyle = '#d9a15c';
        ctx.fill();
      } else {
        ctx.strokeStyle = '#5f6a6d';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      /* bases */
      ctx.textAlign = 'center';
      ctx.font = '14.5px "JetBrains Mono", monospace';
      ctx.fillStyle = '#b3b8b6';
      ctx.fillText(aliceBasis[s] === '+' ? '+' : '×', cx, 148);
      ctx.fillStyle = '#7f8a8c';
      ctx.fillText(bobBasis[s] === '+' ? '+' : '×', cx, 204);

      var kept = aliceBasis[s] === bobBasis[s];
      if (kept) {
        ctx.fillStyle = 'rgba(217,161,92,0.09)';
        ctx.fillRect(left + s * colW + 1, 236, colW - 2, 54);
        ctx.strokeStyle = 'rgba(217,161,92,0.45)';
        ctx.lineWidth = 1;
        ctx.strokeRect(left + s * colW + 1.5, 236.5, colW - 3, 53);
        if (errors[s]) {
          ctx.strokeStyle = '#c96a55';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(cx - 5, 258); ctx.lineTo(cx + 5, 268);
          ctx.moveTo(cx + 5, 258); ctx.lineTo(cx - 5, 268);
          ctx.stroke();
        } else {
          ctx.fillStyle = '#d9a15c';
          ctx.beginPath();
          ctx.arc(cx, 263, 5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.strokeStyle = 'rgba(232,228,220,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 4, 263); ctx.lineTo(cx + 4, 263);
        ctx.stroke();
      }
    }

    /* baseline + annotation */
    ctx.strokeStyle = 'rgba(232,228,220,0.22)';
    ctx.beginPath(); ctx.moveTo(left, 330); ctx.lineTo(right, 330); ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#7f8a8c';
    ctx.font = '10.5px "JetBrains Mono", monospace';
    ctx.fillText('kept where bases agree · × marks a bit error in the sifted key', left, 352);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#d9a15c';
    ctx.fillText(visible + ' / 24 slots read', right, 352);
  }

  var runState = document.getElementById('runState');
  var qberEl = document.getElementById('qber');
  var siftedEl = document.getElementById('sifted');
  var keyrateEl = document.getElementById('keyrate');
  var runBtn = document.getElementById('runBtn');
  var resetBtn = document.getElementById('resetBtn');

  function stats(upto) {
    var kept = 0, errs = 0;
    for (var i = 0; i < upto; i++) {
      if (aliceBasis[i] === bobBasis[i]) {
        kept++;
        if (errors[i]) errs++;
      }
    }
    var qber = kept ? (errs / kept) * 100 : 0;
    if (qberEl) qberEl.textContent = kept ? qber.toFixed(1) + '%' : '—';
    if (siftedEl) siftedEl.textContent = String(kept);
    if (keyrateEl) keyrateEl.textContent = kept ? (kept * 0.105).toFixed(1) + ' kbps' : '—';
    return { kept: kept, errs: errs, qber: qber };
  }

  function finish() {
    animating = false;
    progress = 1;
    draw();
    var st = stats(SLOTS);
    if (runState) runState.textContent = st.qber > 11 ? 'aborted · qber high' : 'key agreed';
  }

  function animate() {
    if (animating) return;
    animating = true;
    if (runState) runState.textContent = 'exchanging';
    var start = performance.now();
    var duration = 1200;
    function frame(now) {
      var p = Math.min(1, (now - start) / duration);
      progress = p;
      draw();
      stats(Math.round(p * SLOTS));
      if (p < 1) {
        requestAnimationFrame(frame);
      } else {
        finish();
      }
    }
    requestAnimationFrame(frame);
    setTimeout(function () { if (animating) finish(); }, duration + 350);
  }

  if (canvas) {
    setCanvasSize();
    draw();
    stats(SLOTS);
    if (runBtn) runBtn.addEventListener('click', function () {
      progress = 0;
      animate();
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      progress = 1;
      draw();
      stats(SLOTS);
      if (runState) runState.textContent = 'idle';
    });
    window.addEventListener('resize', function () {
      setCanvasSize();
      draw();
    });
  }

  /* ------------------------------------------------------------- KEM bench */
  var KEMS = {
    x25519: { label: 'X25519', ek: 32, ct: 32, proc: 0.05, k: 0 },
    ml512: { label: 'ML-KEM-512', ek: 800, ct: 768, proc: 0.09, k: 2 },
    ml768: { label: 'ML-KEM-768', ek: 1184, ct: 1088, proc: 0.13, k: 3 },
    ml1024: { label: 'ML-KEM-1024', ek: 1568, ct: 1568, proc: 0.19, k: 4 },
    hybrid: { label: 'X25519 + ML-KEM-768', ek: 1216, ct: 1120, proc: 0.18, k: 3 }
  };

  var bench = {
    kem: document.getElementById('kem'),
    rtt: document.getElementById('rtt'),
    mtu: document.getElementById('mtu'),
    bw: document.getElementById('bw')
  };

  if (!bench.kem) return;

  var out = {
    ek: document.getElementById('outEk'),
    ct: document.getElementById('outCt'),
    delta: document.getElementById('outDelta'),
    time: document.getElementById('outTime'),
    kemTag: document.getElementById('kemTag'),
    rttTag: document.getElementById('rttTag'),
    mtuTag: document.getElementById('mtuTag'),
    bwTag: document.getElementById('bwTag'),
    compare: document.getElementById('compare'),
    latTitle: document.getElementById('latTitle'),
    latDims: document.getElementById('latDims'),
    latSvg: document.getElementById('latSvg'),
    pktSvg: document.getElementById('pktSvg'),
    pktTag: document.getElementById('pktTag'),
    note: document.getElementById('benchNote')
  };

  function fmt(n) { return n.toLocaleString('en-US'); }

  function buildCompare() {
    var max = 0;
    Object.keys(KEMS).forEach(function (k) { max = Math.max(max, KEMS[k].ek + KEMS[k].ct); });
    out.compare.innerHTML = '';
    Object.keys(KEMS).forEach(function (key) {
      var k = KEMS[key];
      var bytes = k.ek + k.ct;
      var row = document.createElement('div');
      row.className = 'cmp-row';
      row.dataset.kem = key;
      row.innerHTML = '<span>' + k.label + '</span><span class="bar"><i style="width:' +
        ((bytes / max) * 100).toFixed(1) + '%"></i></span><b>' + fmt(bytes) + ' B</b>';
      out.compare.appendChild(row);
    });
  }

  function drawLattice(k) {
    var svg = out.latSvg;
    if (!svg) return;
    if (!k) {
      svg.innerHTML = '<rect x="1" y="1" width="898" height="318" fill="none" stroke="rgba(232,228,220,0.11)"/>' +
        '<path d="M120 190 C 260 40, 640 40, 780 170" fill="none" stroke="#d9a15c" stroke-width="1.6"/>' +
        '<path d="M120 90 C 280 240, 620 240, 780 90" fill="none" stroke="rgba(232,228,220,0.25)" stroke-width="1" stroke-dasharray="5 5"/>' +
        '<text x="450" y="112" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="15" fill="#e8e4dc">Curve25519</text>' +
        '<text x="450" y="136" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#7f8a8c">no module lattice · 32 B public keys</text>' +
        '<text x="450" y="300" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#7f8a8c">Montgomery curve over GF(2^255 − 19)</text>';
      return;
    }
    var gap = 10;
    var avail = 244;
    var cell = (avail - (k - 1) * gap) / k;
    var size = k * cell + (k - 1) * gap;
    var x0 = (900 - size) / 2, y0 = 140 - size / 2;
    var parts = ['<rect x="1" y="1" width="898" height="318" fill="none" stroke="rgba(232,228,220,0.11)"/>'];
    for (var r = 0; r < k; r++) {
      for (var c = 0; c < k; c++) {
        var x = x0 + c * (cell + gap), y = y0 + r * (cell + gap);
        parts.push('<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + cell.toFixed(1) + '" height="' + cell.toFixed(1) + '" fill="rgba(217,161,92,0.07)" stroke="rgba(217,161,92,0.5)"/>');
        parts.push('<text x="' + (x + cell / 2).toFixed(1) + '" y="' + (y + cell / 2 - 1).toFixed(1) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="12" fill="#e8e4dc">A' + r + c + '</text>');
        parts.push('<text x="' + (x + cell / 2).toFixed(1) + '" y="' + (y + cell / 2 + 14).toFixed(1) + '" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="9" fill="#7f8a8c">256 coeff</text>');
      }
    }
    parts.push('<text x="450" y="300" text-anchor="middle" font-family="JetBrains Mono, monospace" font-size="11" fill="#7f8a8c">R_q = Z_q[x] / (x^256 + 1), q = 3329 · k × k matrix of polynomials</text>');
    svg.innerHTML = parts.join('');
  }

  function drawPackets(cp, sp, payload, ek, ct) {
    var svg = out.pktSvg;
    if (!svg) return;
    var x0 = 230;
    var rows = [
      { label: 'client → server', n: cp, bytes: ek, y: 26 },
      { label: 'server → client', n: sp, bytes: ct, y: 72 }
    ];
    var parts = ['<rect x="1" y="1" width="898" height="128" fill="none" stroke="rgba(232,228,220,0.11)"/>'];
    rows.forEach(function (r) {
      parts.push('<text x="' + (x0 - 16) + '" y="' + (r.y + 14) + '" text-anchor="end" font-family="JetBrains Mono, monospace" font-size="11" fill="#7f8a8c">' + r.label + '</text>');
      for (var i = 0; i < r.n; i++) {
        parts.push('<rect x="' + (x0 + i * 42) + '" y="' + r.y + '" width="34" height="18" fill="' + (i < r.n - 1 ? 'rgba(217,161,92,0.78)' : 'rgba(217,161,92,0.4)') + '"/>');
      }
      parts.push('<text x="' + (x0 + r.n * 42 + 8) + '" y="' + (r.y + 14) + '" font-family="JetBrains Mono, monospace" font-size="11" fill="#e8e4dc">' + r.n + ' packet' + (r.n === 1 ? '' : 's') + ' · ' + fmt(r.bytes) + ' B</text>');
    });
    parts.push('<text x="14" y="118" font-family="JetBrains Mono, monospace" font-size="10" fill="#7f8a8c">payload ' + payload + ' B per packet · last block may be partial</text>');
    svg.innerHTML = parts.join('');
  }

  function updateBench() {
    var k = KEMS[bench.kem.value];
    var rtt = Number(bench.rtt.value);
    var mtu = Number(bench.mtu.value);
    var bw = Number(bench.bw.value);
    var payload = mtu - 52;

    out.kemTag.textContent = k.label;
    out.rttTag.textContent = rtt + ' ms';
    out.mtuTag.textContent = mtu + ' B';
    out.bwTag.textContent = bw + ' Mbps';

    out.ek.textContent = fmt(k.ek);
    out.ct.textContent = fmt(k.ct);
    out.delta.textContent = (k.ek + k.ct - 64 > 0 ? '+' : '') + fmt(k.ek + k.ct - 64);

    var transferMs = ((k.ek + k.ct) * 8) / (bw * 1e6) * 1000;
    var t = 2 * rtt + 2 * k.proc + transferMs;
    out.time.textContent = t < 10 ? t.toFixed(1) : String(Math.round(t));

    var cp = Math.ceil(k.ek / payload);
    var sp = Math.ceil(k.ct / payload);
    out.pktTag.textContent = cp + ' + ' + sp + ' packets';

    Array.prototype.forEach.call(out.compare.children, function (row) {
      row.classList.toggle('on', row.dataset.kem === bench.kem.value);
    });

    out.latTitle.textContent = k.k ? 'Module lattice · ' + k.label + ' · k = ' + k.k : 'Curve25519 · no lattice';
    out.latDims.textContent = k.k ? k.k + ' × ' + k.k + ' matrices' : 'Montgomery curve';
    drawLattice(k.k);
    drawPackets(cp, sp, payload, k.ek, k.ct);

    var spill = k.ek > payload;
    out.note.textContent = (k.k === 0
      ? 'X25519 sends 32 bytes each way. It is cheap, well understood and not quantum-safe; a hybrid adds the ML-KEM share on top rather than replacing it.'
      : 'Key exchange adds ' + fmt(k.ek + k.ct) + ' bytes on this path: ' + cp + ' packet' + (cp === 1 ? '' : 's') +
        ' each way at a ' + payload + ' B payload' + (spill ? ', with the client share spilling past the first packet' : ', and the client share still fits one packet') +
        '. ' + (k.k === 4 ? 'ML-KEM-1024 buys Category 5 with 3,136 bytes; justify it with a threat model, not a preference.' : '') +
        ' Handshake floor is two round trips plus ' + (2 * k.proc).toFixed(2) + ' ms of key work.');
  }

  buildCompare();
  ['kem', 'rtt', 'mtu', 'bw'].forEach(function (id) {
    bench[id].addEventListener('input', updateBench);
    bench[id].addEventListener('change', updateBench);
  });
  updateBench();
})();

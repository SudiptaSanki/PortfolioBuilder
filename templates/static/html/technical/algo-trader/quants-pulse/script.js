/* Raghavan — execution bench.
   The ladder walks real depth; the algo cost is half-spread + square-root impact + timing.
   Every figure on the readouts comes out of these two functions. */

(function () {
  'use strict';

  var page = document.body.getAttribute('data-page') || 'index';

  document.querySelectorAll('.navbar a').forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href === page + '.html') a.setAttribute('aria-current', 'page');
  });

  /* ---------------- research note filter ---------------- */

  var filts = document.querySelectorAll('.filt');
  if (filts.length) {
    filts.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-filter');
        filts.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var shown = 0;
        document.querySelectorAll('.rnote').forEach(function (n) {
          var topics = (n.getAttribute('data-topic') || '').split(' ');
          var match = want === 'all' || topics.indexOf(want) !== -1;
          n.hidden = !match;
          if (match) shown += 1;
        });
        var out = document.getElementById('noteCount');
        if (out) out.textContent = shown + (shown === 1 ? ' note' : ' notes');
      });
    });
  }

  /* ---------------- contact form ---------------- */

  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var setErr = function (field, msg) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.err') : null;
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };
    ['name', 'email', 'message'].forEach(function (n) {
      var f = form.elements[n];
      if (!f) return;
      f.addEventListener('input', function () { if (f.getAttribute('aria-invalid') === 'true') setErr(f, ''); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements.name, email = form.elements.email, message = form.elements.message;
      if (!name.value.trim()) { setErr(name, 'Please add a name.'); ok = false; } else setErr(name, '');
      if (!emailRe.test(email.value.trim())) { setErr(email, 'An address that accepts mail.'); ok = false; } else setErr(email, '');
      if (message.value.trim().length < 12) { setErr(message, 'One line about the book or the question.'); ok = false; } else setErr(message, '');
      if (!ok) {
        if (status) { status.className = 'status show'; status.textContent = 'A name, a valid address and a line about what you want to discuss.'; }
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      if (status) {
        status.className = 'status show ok';
        status.textContent = 'Noted, ' + name.value.trim().split(/\s+/)[0] + '. I answer desk mail on Monday and Thursday, and I do not discuss positions, client money or anything that looks like a solicitation.';
      }
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
      form.querySelectorAll('.err').forEach(function (f) { f.textContent = ''; });
    });
  }

  if (page !== 'index') return;

  /* ---------------- model ---------------- */

  var MID = 5004.25;
  var TICK = 0.25;
  var MULT = 50;
  var ADV = 250000;
  var LEVEL_SIZE = 120;

  var el = {
    form: document.getElementById('benchForm'),
    ladder: document.getElementById('ladderCanvas'),
    sharpe: document.getElementById('sharpeSvg'),
    ladderNote: document.getElementById('ladderNote'),
    sharpeNote: document.getElementById('sharpeNote'),
    slip: document.getElementById('roSlip'),
    short: document.getElementById('roShort'),
    fill: document.getElementById('roFill'),
    market: document.getElementById('roMarket'),
    net: document.getElementById('roSharpe'),
    cap: document.getElementById('roCap'),
    verdict: document.getElementById('verdict'),
    outs: {
      size: document.getElementById('sizeOut'),
      part: document.getElementById('partOut'),
      vol: document.getElementById('volOut'),
      spread: document.getElementById('spreadOut'),
      alpha: document.getElementById('alphaOut')
    }
  };
  if (!el.form || !el.ladder) return;

  var lctx = el.ladder.getContext('2d');
  var last = null;

  function readState() {
    var fd = new FormData(el.form);
    return {
      size: parseFloat(fd.get('size')),
      part: parseFloat(fd.get('part')),
      vol: parseFloat(fd.get('vol')),
      spread: parseFloat(fd.get('spread')),
      strategy: String(fd.get('strategy') || '1'),
      alpha: parseFloat(fd.get('alpha'))
    };
  }

  var GROSS = { '1': 2.1, '2': 1.64, '3': 1.88 };

  function walk(s) {
    var levels = [];
    var bestAsk = MID + (s.spread * TICK) / 2;
    for (var i = 0; i < 10; i += 1) {
      levels.push({ price: bestAsk + i * TICK, size: LEVEL_SIZE });
    }
    var extra = 8;
    for (var j = 0; j < extra; j += 1) {
      levels.push({ price: bestAsk + (10 + j) * TICK, size: 200 });
    }
    var remaining = s.size;
    var cost = 0;
    var filled = 0;
    var used = 0;
    levels.forEach(function (lv) {
      if (remaining <= 0) return;
      var take = Math.min(lv.size, remaining);
      cost += take * lv.price;
      filled += take;
      remaining -= take;
      used += 1;
    });
    while (remaining > 0) {
      var price = levels[levels.length - 1].price + TICK;
      cost += remaining * price;
      filled += remaining;
      remaining = 0;
    }
    var avg = filled ? cost / filled : MID;
    return {
      avgFill: avg,
      slipBps: ((avg - MID) / MID) * 1e4,
      levelsUsed: used,
      depth: levels.length * LEVEL_SIZE
    };
  }

  function algo(s) {
    var sigmaBps = s.vol * 100;
    var impact = 0.6 * sigmaBps * Math.sqrt(s.size / ADV);
    var halfSpread = ((s.spread / 2) * TICK / MID) * 1e4;
    var days = s.size / (ADV * (s.part / 100));
    var timing = s.alpha * days / 2;
    var total = impact + halfSpread + timing;
    var notional = s.size * MID * MULT;
    return {
      impact: impact,
      halfSpread: halfSpread,
      timing: timing,
      total: total,
      days: days,
      notional: notional,
      shortfall: (total / 1e4) * notional
    };
  }

  function capacity(s, alpha) {
    var limit = alpha / 3;
    var halfSpread = ((s.spread / 2) * TICK / MID) * 1e4;
    if (halfSpread >= limit) return 0;
    var sigmaBps = s.vol * 100;
    // impact only, ignoring the tiny timing term, solved for size
    var ratio = (limit - halfSpread) / (0.6 * sigmaBps);
    var q = ratio * ratio * ADV;
    return Math.min(q, ADV * (s.part / 100) * 5);
  }

  /* ---------------- drawing ---------------- */

  function sizeCanvas() {
    var w = el.ladder.parentElement.clientWidth - 24;
    if (w < 40) return null;
    var h = 200;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    el.ladder.width = Math.round(w * dpr);
    el.ladder.height = Math.round(h * dpr);
    el.ladder.style.height = h + 'px';
    lctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function drawLadder(s, walkRes) {
    var box = sizeCanvas();
    if (!box) return;
    var w = box.w, h = box.h;
    var ctx = lctx;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(0, 0, w, h);

    var rows = 9;
    var rowH = (h - 34) / (rows * 2 + 1);
    var midY = 26 + (h - 34) / 2;
    var cx = w * 0.5;
    var maxBar = w * 0.36;

    ctx.font = '400 8px "Space Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#131a22';
    ctx.fillText('mid ' + MID.toFixed(2), cx, 14);

    ctx.strokeStyle = 'rgba(19,26,34,0.35)';
    ctx.beginPath();
    ctx.moveTo(8, midY);
    ctx.lineTo(w - 8, midY);
    ctx.stroke();

    var askStart = MID + (s.spread * TICK) / 2;
    var consumedLeft = s.size;

    for (var i = 0; i < rows; i += 1) {
      var askPrice = askStart + i * TICK;
      var bidPrice = MID - (s.spread * TICK) / 2 - i * TICK;
      var yUp = midY - (i + 1) * rowH - 2;
      var yDn = midY + (i + 1) * rowH + 2;
      var size = i < 8 ? LEVEL_SIZE : 200;

      // asks (right)
      var usedHere = Math.max(0, Math.min(size, consumedLeft));
      consumedLeft -= usedHere;
      ctx.fillStyle = 'rgba(19,26,34,0.16)';
      ctx.fillRect(cx + 2, yUp - rowH * 0.34, (size / LEVEL_SIZE) * maxBar * 0.6, rowH * 0.68);
      if (usedHere > 0) {
        ctx.fillStyle = 'rgba(163,42,30,0.75)';
        ctx.fillRect(cx + 2, yUp - rowH * 0.34, (usedHere / LEVEL_SIZE) * maxBar * 0.6, rowH * 0.68);
      }
      ctx.fillStyle = '#5b5f58';
      ctx.textAlign = 'left';
      ctx.fillText(askPrice.toFixed(2), cx + (size / LEVEL_SIZE) * maxBar * 0.6 + 8, yUp + 3);

      // bids (left)
      ctx.fillStyle = 'rgba(31,92,67,0.30)';
      ctx.fillRect(cx - 2 - (size / LEVEL_SIZE) * maxBar * 0.6, yDn - rowH * 0.34, (size / LEVEL_SIZE) * maxBar * 0.6, rowH * 0.68);
      ctx.fillStyle = '#5b5f58';
      ctx.textAlign = 'right';
      ctx.fillText(bidPrice.toFixed(2), cx - (size / LEVEL_SIZE) * maxBar * 0.6 - 8, yDn + 3);
    }

    // the walk marker
    var walkIdx = Math.min(rows - 1, Math.floor(s.size / LEVEL_SIZE));
    var walkY = midY - (walkIdx + 1) * rowH - 2;
    ctx.strokeStyle = '#a32a1e';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx + 2, walkY);
    ctx.lineTo(cx + maxBar * 0.75, walkY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#a32a1e';
    ctx.textAlign = 'left';
    ctx.font = '400 8px "Space Mono", monospace';
    ctx.fillText('avg ' + walkRes.avgFill.toFixed(2), cx + maxBar * 0.5, walkY - 6);
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(19,26,34,0.55)';
    ctx.fillText('bids', cx - maxBar * 0.55, h - 8);
    ctx.fillText('asks', cx + maxBar * 0.55, h - 8);
  }

  function drawSharpe(s, cost, gross) {
    var svg = el.sharpe;
    if (!svg) return;
    var w = 300, h = 210;
    var padL = 30, padR = 12, padT = 14, padB = 30;
    var xMax = 30;
    var yMax = Math.max(1, gross * 1.15);
    var xOf = function (bps) { return padL + (bps / xMax) * (w - padL - padR); };
    var yOf = function (v) { return padT + (1 - v / yMax) * (h - padT - padB); };
    var net = function (bps) { return Math.max(-0.4, gross * (1 - bps / s.alpha)); };

    var grid = '';
    [0, 0.5, 1].forEach(function (f) {
      var y = yOf(yMax * f).toFixed(1);
      grid += '<path d="M' + padL + ' ' + y + ' H' + (w - padR) + '" stroke="rgba(19,26,34,0.12)" stroke-width="1"/>' +
        '<text x="' + (padL - 5) + '" y="' + (parseFloat(y) + 3) + '" text-anchor="end" font-family="Space Mono, monospace" font-size="7" fill="#5b5f58">' + (yMax * f).toFixed(1) + '</text>';
    });
    [0, 10, 20, 30].forEach(function (bps) {
      var x = xOf(bps).toFixed(1);
      grid += '<path d="M' + x + ' ' + padT + ' V' + (h - padB) + '" stroke="rgba(19,26,34,0.10)" stroke-width="1"/>' +
        '<text x="' + x + '" y="' + (h - padB + 12) + '" text-anchor="middle" font-family="Space Mono, monospace" font-size="7" fill="#5b5f58">' + bps + '</text>';
    });

    var d = '';
    for (var b = 0; b <= xMax; b += 0.5) {
      var v = net(b);
      var x = xOf(b), y = yOf(Math.max(v, -0.4));
      d += (b === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1) + ' ';
    }

    var zeroY = yOf(0);
    var cx = xOf(Math.min(cost, xMax));
    var cy = yOf(Math.max(net(Math.min(cost, xMax)), -0.4));
    var netNow = gross * (1 - cost / s.alpha);

    svg.innerHTML =
      grid +
      '<path d="M' + padL + ' ' + zeroY.toFixed(1) + ' H' + (w - padR) + '" stroke="rgba(19,26,34,0.5)" stroke-width="1" stroke-dasharray="2 2"/>' +
      '<path d="' + d + '" fill="none" stroke="#131a22" stroke-width="1.6"/>' +
      '<path d="M' + xOf(s.alpha).toFixed(1) + ' ' + padT + ' V' + (h - padB) + '" stroke="rgba(163,42,30,0.55)" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<text x="' + (xOf(s.alpha) - 3).toFixed(1) + '" y="' + (padT + 8) + '" text-anchor="end" font-family="Work Sans, sans-serif" font-size="7" fill="#a32a1e">alpha</text>' +
      '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="3.2" fill="#a32a1e"/>' +
      '<text x="' + Math.min(cx + 6, w - 60).toFixed(1) + '" y="' + Math.max(cy - 7, padT + 10).toFixed(1) + '" font-family="Space Mono, monospace" font-size="8" fill="#131a22">' + netNow.toFixed(2) + '</text>' +
      '<text x="' + (w - padR) + '" y="' + (h - 6) + '" text-anchor="end" font-family="Work Sans, sans-serif" font-size="7" fill="#5b5f58">slippage, bps</text>';
  }

  function fmtMoney(v) {
    if (v >= 1e6) return '$' + (v / 1e6).toFixed(2) + 'm';
    if (v >= 1e3) return '$' + Math.round(v / 1e3) + 'k';
    return '$' + Math.round(v);
  }

  function render() {
    var s = readState();
    var gross = GROSS[s.strategy] || 2.1;
    var walkRes = walk(s);
    var a = algo(s);
    var netSharpe = gross * (1 - a.total / s.alpha);
    var capQ = capacity(s, s.alpha);
    var capM = capQ * MID * MULT / 1e6;

    el.outs.size.textContent = s.size + ' lots';
    el.outs.part.textContent = s.part + ' %';
    el.outs.vol.textContent = s.vol.toFixed(2) + ' %';
    el.outs.spread.textContent = s.spread + (s.spread === 1 ? ' tick' : ' ticks');
    el.outs.alpha.textContent = s.alpha + ' bps';

    el.slip.innerHTML = a.total.toFixed(1) + '<small>bps</small>';
    el.short.textContent = fmtMoney(a.shortfall);
    el.fill.textContent = walkRes.avgFill.toFixed(2);
    el.market.innerHTML = walkRes.slipBps.toFixed(1) + '<small>bps</small>';
    el.net.textContent = netSharpe.toFixed(2);
    el.cap.innerHTML = '$' + Math.round(capM) + '<small>m</small>';

    el.ladderNote.textContent = s.size + ' lots · ' + Math.min(18, Math.ceil(s.size / LEVEL_SIZE)) + ' levels';
    el.sharpeNote.textContent = gross.toFixed(2) + ' gross';

    var warn = [el.slip, el.net];
    warn.forEach(function (n) { n.parentElement.classList.remove('warn'); });
    if (a.total > s.alpha / 2 && el.slip) el.slip.parentElement.classList.add('warn');
    if (netSharpe < 0.5 && el.net) el.net.parentElement.classList.add('warn');

    var bits = [];
    bits.push('A ' + s.size + '-lot order costs ' + a.total.toFixed(1) + ' bps as an algorithm (' + a.impact.toFixed(1) + ' impact, ' + a.halfSpread.toFixed(1) + ' half-spread, ' + a.timing.toFixed(1) + ' timing) and ' + walkRes.slipBps.toFixed(1) + ' bps walked straight through the book.');
    if (walkRes.slipBps < a.total - 0.4) {
      bits.push('At this size the single market order is cheaper, which is the honest reason small books trade in clips: there is no queue to protect.');
    } else {
      bits.push('The patient order is cheaper here because the depth runs out before the schedule does; ' + Math.ceil(s.size / LEVEL_SIZE) + ' levels is a lot of the visible book to take at once.');
    }
    bits.push('Working it at ' + s.part + ' % of tape volume takes ' + (a.days * 6.5 * 60).toFixed(0) + ' minutes.');
    if (a.total > s.alpha / 2) {
      bits.push('Costs are above half of the ' + s.alpha + ' bps edge: net Sharpe falls to ' + netSharpe.toFixed(2) + ' and the strategy is living on borrowed alpha.');
    } else {
      bits.push('Net Sharpe stays at ' + netSharpe.toFixed(2) + ' after ' + a.total.toFixed(1) + ' bps of cost against a ' + s.alpha + ' bps edge.');
    }
    if (s.size > capQ) bits.push('This order is above the capacity estimate of about ' + Math.round(capQ) + ' lots at a one-third alpha haircut.');
    el.verdict.textContent = bits.join(' ');

    drawLadder(s, walkRes);
    drawSharpe(s, a.total, gross);

    last = {
      s: s,
      algo: a,
      walk: walkRes,
      net: netSharpe,
      capacityQ: capQ,
      capacityM: capM,
      gross: gross,
      verdict: el.verdict.textContent
    };
  }

  el.form.addEventListener('input', render);
  el.form.addEventListener('change', render);
  el.form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  var t = null;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { if (last) { drawLadder(last.s, last.walk); drawSharpe(last.s, last.algo.total, last.gross); } }, 150);
  });

  render();

  window.__desk = {
    read: function () {
      return {
        size: last.s.size,
        part: last.s.part,
        vol: last.s.vol,
        spread: last.s.spread,
        alpha: last.s.alpha,
        strategy: last.s.strategy,
        slipBps: last.algo.total,
        impact: last.algo.impact,
        halfSpread: last.algo.halfSpread,
        timing: last.algo.timing,
        shortfall: last.algo.shortfall,
        avgFill: last.walk.avgFill,
        marketSlipBps: last.walk.slipBps,
        netSharpe: last.net,
        gross: last.gross,
        capacityQ: last.capacityQ,
        capacityM: last.capacityM,
        verdict: last.verdict,
        readouts: {
          slip: el.slip.textContent,
          short: el.short.textContent,
          fill: el.fill.textContent,
          market: el.market.textContent,
          net: el.net.textContent,
          cap: el.cap.textContent
        },
        audio: typeof window.AudioContext !== 'undefined' && window.__audioCreated === true
      };
    },
    set: function (name, value) {
      var f = el.form.elements[name];
      if (f) f.value = value;
      render();
    }
  };
})();

/* Kapadia Inference — context budget bench and page behaviour.
   All figures are arithmetic on token counts, cache geometry and GPU bandwidth. */

(function () {
  'use strict';

  var page = document.body.getAttribute('data-page') || 'index';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------------- project filter ---------------- */

  var tabs = document.querySelectorAll('.tab');
  if (tabs.length) {
    tabs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-filter');
        tabs.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        var cases = document.querySelectorAll('.case');
        var shown = 0;
        cases.forEach(function (c) {
          var domains = (c.getAttribute('data-domain') || '').split(' ');
          var match = want === 'all' || domains.indexOf(want) !== -1;
          c.hidden = !match;
          if (match) shown += 1;
        });
        var out = document.getElementById('caseCount');
        if (out) out.textContent = shown + (shown === 1 ? ' case study' : ' case studies');
      });
    });
  }

  /* ---------------- contact form ---------------- */

  var form = document.getElementById('contactForm');
  if (form) {
    var status = document.getElementById('formStatus');
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var setError = function (field, msg) {
      var wrap = field.closest('.field');
      var err = wrap ? wrap.querySelector('.f-err') : null;
      field.setAttribute('aria-invalid', msg ? 'true' : 'false');
      if (err) err.textContent = msg || '';
    };
    ['name', 'email', 'message'].forEach(function (n) {
      var f = form.elements[n];
      if (!f) return;
      f.addEventListener('input', function () {
        if (f.getAttribute('aria-invalid') === 'true') setError(f, '');
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements.name;
      var email = form.elements.email;
      var message = form.elements.message;
      if (!name.value.trim()) { setError(name, 'A name is enough.'); ok = false; } else setError(name, '');
      if (!emailRe.test(email.value.trim())) { setError(email, 'A working address, so the reply arrives.'); ok = false; } else setError(email, '');
      if (message.value.trim().length < 15) { setError(message, 'Two sentences about the feature is a good start.'); ok = false; } else setError(message, '');
      if (!ok) {
        if (status) { status.className = 'form-status show'; status.textContent = 'The form needs a name, a valid email and a line about the feature.'; }
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      if (status) {
        status.className = 'form-status show ok';
        status.textContent = 'Thanks, ' + name.value.trim().split(/\s+/)[0] + '. This is a queued enquiry, not a booking: I read new briefs on Monday and Thursday and reply with two questions and a rough shape for the work.';
      }
      form.reset();
      form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.setAttribute('aria-invalid', 'false'); });
      form.querySelectorAll('.f-err').forEach(function (f) { f.textContent = ''; });
    });
  }

  if (page !== 'index') return;

  /* ---------------- model ---------------- */

  var MODELS = {
    '8': { name: 'Llama 3.1 8B', layers: 32, kv: 8, dim: 128, params: 8, active: 8, spec: '32 layers · 8 KV heads · 128 dim' },
    '32': { name: 'Qwen2.5 32B', layers: 64, kv: 8, dim: 128, params: 32, active: 32, spec: '64 layers · 8 KV heads · 128 dim' },
    '70': { name: 'Llama 3.1 70B', layers: 80, kv: 8, dim: 128, params: 70, active: 70, spec: '80 layers · 8 KV heads · 128 dim' },
    moe: { name: 'Mixtral 8×7B', layers: 32, kv: 8, dim: 128, params: 46.7, active: 12.9, spec: '32 layers · 8 KV heads · 128 dim · 12.9B active' }
  };

  var GPUS = {
    a100: { name: 'A100 80 GB', bw: 2.0, mem: 80, peak: 312, hourly: 2.5 },
    h100: { name: 'H100 80 GB', bw: 3.35, mem: 80, peak: 990, hourly: 4.6 },
    l40s: { name: 'L40S 48 GB', bw: 0.864, mem: 48, peak: 362, hourly: 1.5 },
    '4090': { name: 'RTX 4090 24 GB', bw: 1.008, mem: 24, peak: 165, hourly: 0.8 }
  };

  var el = {
    form: document.getElementById('budgetForm'),
    canvas: document.getElementById('decodeCanvas'),
    segs: {
      system: document.getElementById('segSystem'),
      shots: document.getElementById('segShots'),
      retrieval: document.getElementById('segRetrieval'),
      history: document.getElementById('segHistory'),
      output: document.getElementById('segOutput'),
      over: document.getElementById('segOver')
    },
    used: document.getElementById('windowUsed'),
    scaleMid: document.getElementById('scaleMid'),
    scaleEnd: document.getElementById('scaleEnd'),
    targetName: document.getElementById('targetName'),
    targetSpec: document.getElementById('targetSpec'),
    chartNote: document.getElementById('chartNote'),
    roPrompt: document.getElementById('roPrompt'),
    roKv: document.getElementById('roKv'),
    roCache: document.getElementById('roCache'),
    roTps: document.getElementById('roTps'),
    roTtft: document.getElementById('roTtft'),
    roCost: document.getElementById('roCost'),
    verdict: document.getElementById('verdict'),
    footGpu: document.getElementById('footGpu'),
    cache8: document.getElementById('cache8'),
    cache32: document.getElementById('cache32'),
    cache128: document.getElementById('cache128'),
    cacheWeights: document.getElementById('cacheWeights'),
    contextOut: document.getElementById('contextOut'),
    systemOut: document.getElementById('systemOut'),
    shotsOut: document.getElementById('shotsOut'),
    chunksOut: document.getElementById('chunksOut'),
    chunkSizeOut: document.getElementById('chunkSizeOut'),
    turnsOut: document.getElementById('turnsOut'),
    turnSizeOut: document.getElementById('turnSizeOut'),
    outputOut: document.getElementById('outputOut'),
    batchOut: document.getElementById('batchOut')
  };
  if (!el.form || !el.canvas) return;

  function readState() {
    var fd = new FormData(el.form);
    return {
      model: fd.get('model') || '70',
      gpu: fd.get('gpu') || 'a100',
      bytes: parseFloat(fd.get('precision') || '2'),
      context: parseFloat(fd.get('context') || '128') * 1000,
      system: parseFloat(fd.get('system') || '420'),
      shots: parseFloat(fd.get('shots') || '600'),
      chunks: parseFloat(fd.get('chunks') || '6'),
      chunkSize: parseFloat(fd.get('chunkSize') || '320'),
      turns: parseFloat(fd.get('turns') || '3'),
      turnSize: parseFloat(fd.get('turnSize') || '180'),
      output: parseFloat(fd.get('output') || '800'),
      batch: parseFloat(fd.get('batch') || '8')
    };
  }

  function compute(s) {
    var m = MODELS[s.model] || MODELS['70'];
    var g = GPUS[s.gpu] || GPUS.a100;
    var retrieval = s.chunks * s.chunkSize;
    var history = s.turns * s.turnSize;
    var prompt = s.system + s.shots + retrieval + history;
    var total = prompt + s.output;
    var kvPerToken = 2 * m.layers * m.kv * m.dim * s.bytes;
    var cache = kvPerToken * total * s.batch;
    var weights = m.params * 1e9 * s.bytes;
    var vram = weights + cache + 2 * 1024 * 1024 * 1024;
    var gpus = Math.max(1, Math.ceil((weights + cache) / (g.mem * 1e9 * 0.95)));
    var latency = ((weights + cache) / (gpus * g.bw * 1e12)) / 0.75;
    var tps = 1 / latency;
    var ttft = (2 * m.active * 1e9 * prompt) / (gpus * g.peak * 1e12 * 0.35);
    var prefillBatch = ttft * s.batch;
    var batchTime = prefillBatch + s.output * latency;
    var costPer1k = (g.hourly * gpus / 3600) * batchTime * 1000 / s.batch;
    return {
      model: m, gpu: g, gpus: gpus,
      retrieval: retrieval, history: history, prompt: prompt, total: total,
      kvPerToken: kvPerToken, cache: cache, weights: weights, vram: vram,
      latency: latency, tps: tps, ttft: ttft, costPer1k: costPer1k,
      fill: total / s.context, headroom: s.context - total
    };
  }

  function fmt(n, digits) {
    if (n >= 1000) return Math.round(n).toLocaleString('en-GB');
    return Number(n.toFixed(digits == null ? 1 : digits)).toString();
  }

  function verdictFor(s, r) {
    var bits = [];
    if (r.total > s.context) {
      var over = r.total - s.context;
      bits.push('Does not fit: ' + fmt(r.total) + ' tokens against a ' + fmt(s.context / 1000, 0) + 'k window, ' + fmt(over) + ' over. Two chunks and one turn would give back ' + fmt(2 * s.chunkSize + s.turnSize) + ' tokens.');
    } else {
      bits.push('Fits at ' + Math.round(r.fill * 100) + '% of the window — ' + fmt(r.total) + ' of ' + fmt(s.context / 1000, 0) + 'k tokens, ' + fmt(r.headroom) + ' left for the answer and the next turn.');
    }
    if (r.vram > r.gpu.mem * 1e9 * r.gpus) {
      bits.push('The cache and weights need ' + fmt(r.vram / 1e9) + ' GB, so this configuration spills.');
    } else if (r.gpus > 1) {
      bits.push('Weights plus cache need ' + r.gpus + '× ' + r.gpu.name + ' at ' + (s.bytes * 8) + '-bit; one GPU cannot hold the model.');
    }
    if (r.fill > 0.6 && r.total <= s.context) {
      bits.push('Past roughly 60% fill, recall on a needle-in-haystack test usually drops; every extra chunk has to pay for itself in the eval set.');
    }
    if (r.tps < 15) {
      bits.push('Decode lands at ' + r.tps.toFixed(0) + ' tokens a second, which is slow for a chat surface; INT8 cache or a smaller model buys the difference.');
    }
    if (s.output < 300 && r.total <= s.context) {
      bits.push('An output reserve under 300 tokens will truncate structured answers at the schema.');
    }
    return bits.join(' ');
  }

  /* ---------------- chart ---------------- */

  var ctx = el.canvas.getContext('2d');
  var last = { s: null, r: null };

  function sizeChart() {
    var hold = el.canvas.parentElement;
    var w = hold.clientWidth - 24;
    if (w < 20) return null;
    var cap = hold.querySelector('figcaption');
    var avail = hold.clientHeight - (cap ? cap.offsetHeight : 0) - 26;
    var h = Math.max(140, Math.min(400, avail > 60 ? avail : Math.round(w * 0.4)));
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    el.canvas.width = Math.round(w * dpr);
    el.canvas.height = Math.round(h * dpr);
    el.canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  function draw(s, r) {
    var size = sizeChart();
    if (!size) return;
    var w = size.w, h = size.h;
    var padL = 34, padR = 12, padT = 12, padB = 22;
    ctx.clearRect(0, 0, w, h);

    var maxTps = 1 / (((r.weights) / (r.gpus * r.gpu.bw * 1e12)) / 0.75);
    var yMax = Math.max(10, maxTps * 1.12);
    var xMax = s.context;
    var xOf = function (t) { return padL + (t / xMax) * (w - padL - padR); };
    var yOf = function (v) { return padT + (1 - v / yMax) * (h - padT - padB); };

    // grid and axes
    ctx.font = '400 9px "JetBrains Mono", monospace';
    ctx.strokeStyle = 'rgba(233,234,228,0.10)';
    ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(function (frac) {
      var y = Math.round(yOf(yMax * frac)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(153,160,167,0.85)';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(yMax * frac), padL - 6, y + 3);
    });
    [0, 0.5, 1].forEach(function (frac) {
      var x = Math.round(xOf(xMax * frac)) + 0.5;
      ctx.beginPath();
      ctx.moveTo(x, padT);
      ctx.lineTo(x, h - padB);
      ctx.stroke();
      ctx.fillStyle = 'rgba(153,160,167,0.85)';
      ctx.textAlign = frac === 0 ? 'left' : frac === 1 ? 'right' : 'center';
      ctx.fillText(frac === 0 ? '0' : Math.round(xMax * frac / 1000) + 'k', x, h - padB + 13);
    });

    // 60% context-rot marker
    ctx.setLineDash([2, 4]);
    ctx.strokeStyle = 'rgba(232,195,158,0.45)';
    var x60 = Math.round(xOf(xMax * 0.6)) + 0.5;
    ctx.beginPath();
    ctx.moveTo(x60, padT);
    ctx.lineTo(x60, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(215,154,106,0.8)';
    ctx.textAlign = 'left';
    ctx.fillText('60%', x60 + 4, padT + 9);

    // decode curve
    ctx.beginPath();
    for (var px = padL; px <= w - padR; px += 1) {
      var token = ((px - padL) / (w - padL - padR)) * xMax;
      var bytes = r.weights + r.kvPerToken * token * s.batch;
      var v = 1 / ((bytes / (r.gpus * r.gpu.bw * 1e12)) / 0.75);
      var yv = yOf(v);
      if (px === padL) ctx.moveTo(px, yv);
      else ctx.lineTo(px, yv);
    }
    ctx.strokeStyle = 'rgba(233,234,228,0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // operating point
    var opX = xOf(Math.min(r.total, xMax));
    var opY = yOf(Math.min(r.tps, yMax));
    ctx.setLineDash([1, 3]);
    ctx.strokeStyle = 'rgba(232,195,158,0.6)';
    ctx.beginPath();
    ctx.moveTo(opX, padT);
    ctx.lineTo(opX, h - padB);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(opX, opY, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c39e';
    ctx.fill();

    ctx.fillStyle = 'rgba(233,234,228,0.9)';
    ctx.textAlign = 'left';
    ctx.font = '400 9px "JetBrains Mono", monospace';
    ctx.fillText(Math.round(r.tps) + ' tok/s', Math.min(opX + 6, w - 52), Math.max(padT + 10, opY - 8));
  }

  function update(s, r) {
    if (el.contextOut) el.contextOut.textContent = Math.round(s.context / 1000) + 'k';
    if (el.systemOut) el.systemOut.textContent = fmt(s.system, 0);
    if (el.shotsOut) el.shotsOut.textContent = fmt(s.shots, 0);
    if (el.chunksOut) el.chunksOut.textContent = fmt(s.chunks, 0);
    if (el.chunkSizeOut) el.chunkSizeOut.textContent = fmt(s.chunkSize, 0);
    if (el.turnsOut) el.turnsOut.textContent = fmt(s.turns, 0);
    if (el.turnSizeOut) el.turnSizeOut.textContent = fmt(s.turnSize, 0);
    if (el.outputOut) el.outputOut.textContent = fmt(s.output, 0);
    if (el.batchOut) el.batchOut.textContent = fmt(s.batch, 0);
    if (el.targetName) el.targetName.textContent = r.model.name;
    if (el.targetSpec) el.targetSpec.textContent = r.model.spec;
    if (el.scaleMid) el.scaleMid.textContent = Math.round(s.context / 2000) + 'k';
    if (el.scaleEnd) el.scaleEnd.textContent = Math.round(s.context / 1000) + 'k';

    // window bar: widths are percentages of the window, overflow gets its own red slice
    var pct = function (v) { return Math.max(0, Math.min(100, (v / s.context) * 100)); };
    var over = Math.max(0, r.total - s.context);
    var segData = [
      [el.segs.system, s.system],
      [el.segs.shots, s.shots],
      [el.segs.retrieval, r.retrieval],
      [el.segs.history, r.history],
      [el.segs.output, s.output]
    ];
    segData.forEach(function (pair) {
      if (!pair[0]) return;
      pair[0].style.flex = '0 0 ' + pct(pair[1]).toFixed(2) + '%';
      pair[0].style.display = pair[1] > 0 ? 'block' : 'none';
    });
    if (el.segs.over) {
      el.segs.over.style.flex = '0 0 ' + pct(over).toFixed(2) + '%';
      el.segs.over.style.display = over > 0 ? 'block' : 'none';
    }
    if (el.used) el.used.textContent = Math.round(r.fill * 100) + '% of ' + Math.round(s.context / 1000) + 'k';

    if (el.roPrompt) el.roPrompt.textContent = fmt(r.prompt, 0);
    if (el.roKv) el.roKv.textContent = fmt(r.kvPerToken / 1024, 0) + ' KiB';
    if (el.roCache) el.roCache.textContent = fmt(r.cache / 1e9) + ' GB';
    if (el.roTps) el.roTps.textContent = r.tps.toFixed(0) + ' tok/s';
    if (el.roTtft) el.roTtft.textContent = Math.round(r.ttft * 1000) + ' ms';
    if (el.roCost) el.roCost.textContent = '€' + (r.costPer1k < 0.1 ? r.costPer1k.toFixed(3) : r.costPer1k.toFixed(2));
    if (el.chartNote) el.chartNote.textContent = r.model.name + ' · ' + (s.bytes * 8) + '-bit · batch ' + s.batch;
    if (el.footGpu) el.footGpu.textContent = r.gpus + '× ' + r.gpu.name + ' · ' + r.gpu.bw + ' TB/s · 75% of roofline';
    var cacheAt = function (ctx) { return r.kvPerToken * (ctx + s.output) * s.batch / 1e9; };
    if (el.cache8) el.cache8.textContent = cacheAt(8000).toFixed(1) + ' GB';
    if (el.cache32) el.cache32.textContent = cacheAt(32000).toFixed(1) + ' GB';
    if (el.cache128) el.cache128.textContent = cacheAt(128000).toFixed(1) + ' GB';
    if (el.cacheWeights) el.cacheWeights.textContent = (r.weights / 1e9).toFixed(0) + ' GB';
    if (el.verdict) el.verdict.textContent = verdictFor(s, r);

    var warn = [el.roCache, el.roTps];
    warn.forEach(function (n) { if (n && n.parentElement) n.parentElement.classList.remove('warn'); });
    if (r.vram > r.gpu.mem * 1e9 * r.gpus * 0.92 && el.roCache) el.roCache.parentElement.classList.add('warn');
    if (r.tps < 15 && el.roTps) el.roTps.parentElement.classList.add('warn');

    draw(s, r);
  }

  function render() {
    last.s = readState();
    last.r = compute(last.s);
    update(last.s, last.r);
  }

  el.form.addEventListener('input', render);
  el.form.addEventListener('change', render);
  el.form.addEventListener('submit', function (e) { e.preventDefault(); render(); });

  var t = null;
  window.addEventListener('resize', function () {
    clearTimeout(t);
    t = setTimeout(function () { if (last.s) draw(last.s, last.r); }, 140);
  });

  render();

  // The chart fills its grid row, which the controls column decides. Follow that box.
  if ('ResizeObserver' in window) {
    var chartHold = el.canvas.parentElement;
    var lastBox = chartHold.clientHeight;
    var ro = new ResizeObserver(function () {
      var h = chartHold.clientHeight;
      if (Math.abs(h - lastBox) < 6) return;
      lastBox = h;
      if (last.s) draw(last.s, last.r);
    });
    ro.observe(chartHold);
  }
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { if (last.s) draw(last.s, last.r); });
  }

  /* ---------------- probe hooks ---------------- */

  window.__budget = {
    read: function () {
      var s = last.s, r = last.r;
      return {
        model: s.model, gpu: s.gpu, context: s.context, batch: s.batch,
        prompt: r.prompt, total: r.total, fill: r.fill, headroom: r.headroom,
        kvPerToken: r.kvPerToken, cache: r.cache, vram: r.vram, gpus: r.gpus,
        tps: r.tps, ttft: r.ttft, costPer1k: r.costPer1k,
        verdict: el.verdict ? el.verdict.textContent : '',
        readouts: {
          prompt: el.roPrompt && el.roPrompt.textContent,
          kv: el.roKv && el.roKv.textContent,
          cache: el.roCache && el.roCache.textContent,
          tps: el.roTps && el.roTps.textContent,
          ttft: el.roTtft && el.roTtft.textContent,
          cost: el.roCost && el.roCost.textContent
        }
      };
    },
    set: function (name, value) {
      var f = el.form.elements[name];
      if (f) f.value = value;
      render();
    }
  };
  void reduce;
})();

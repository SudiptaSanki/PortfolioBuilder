/* Sequin Tide — the atelier bench: sequin count, weight, hours, cost, and the plot. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- navigation ---------- */
  var navBtn = $("#navBtn"), nav = $("#siteNav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- lookbook: flips and filters ---------- */
  var lookGrid = $("#lookGrid");
  if (lookGrid) {
    $$(".flip-btn", lookGrid).forEach(function (btn) {
      btn.addEventListener("click", function () {
        var card = btn.closest(".look-card");
        var flipped = card.classList.toggle("flipped");
        btn.setAttribute("aria-expanded", flipped ? "true" : "false");
        btn.textContent = flipped ? "Back to the front" : "Materials & hours";
      });
    });

    $$("[data-look-filter]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var filter = chip.getAttribute("data-look-filter");
        $$("[data-look-filter]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        $$(".look-card", lookGrid).forEach(function (card) {
          var match = filter === "all" || card.getAttribute("data-kind") === filter;
          card.hidden = !match;
          if (match) shown++;
        });
        var empty = $("#lookEmpty");
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- fitting brief ---------- */
  var brief = $("#briefForm");
  if (brief) {
    var bf = {
      name: { i: $("#bName"), e: $("#bNameErr"), ok: function (v) { return v.trim().length >= 2; }, msg: "A name for the ticket" },
      email: { i: $("#bEmail"), e: $("#bEmailErr"), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "Check the email address" },
      event: { i: $("#bEvent"), e: $("#bEventErr"), ok: function (v) { return v.trim().length >= 3; }, msg: "Which event is the costume for" },
      notes: { i: $("#bNotes"), e: $("#bNotesErr"), ok: function (v) { return v.trim().length >= 20; }, msg: "The dancer, the venue and what must not happen" }
    };
    var status = $("#briefStatus"), touched = false;
    function verify(key) {
      var f = bf[key]; if (!f.i) return true;
      var good = f.ok(f.i.value);
      f.e.textContent = good ? "" : f.msg;
      f.i.classList.toggle("invalid", !good);
      f.i.setAttribute("aria-invalid", good ? "false" : "true");
      return good;
    }
    Object.keys(bf).forEach(function (key) {
      if (!bf[key].i) return;
      bf[key].i.addEventListener("blur", function () { verify(key); });
      bf[key].i.addEventListener("input", function () { if (touched) verify(key); });
    });
    brief.addEventListener("submit", function (e) {
      e.preventDefault();
      touched = true;
      var good = Object.keys(bf).map(verify).every(Boolean);
      if (!good) {
        status.textContent = "A few lines still need an answer.";
        status.classList.add("warn");
        var bad = Object.keys(bf).map(function (k) { return bf[k].i; }).filter(function (i) { return i && i.classList.contains("invalid"); })[0];
        if (bad) bad.focus();
        return;
      }
      status.classList.remove("warn");
      status.textContent = "The ticket is ready: " + $("#bEvent").value.trim() + ", " + $("#bName").value.trim() + ". Copy it into a letter to the atelier — nothing has been sent from this page.";
    });
  }

  /* ---------- the bench ---------- */
  var canvas = $("#lookCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var SIL = {
    gown: { name: "Sari gown", area: 14000, layers: 2, frame: 0.35, hem: 682, note: "full skirt" },
    corset: { name: "Corset & fishtail", area: 10800, layers: 2, frame: 0.28, hem: 420, note: "fitted, flared hem" },
    tutu: { name: "Tutu", area: 6200, layers: 6, frame: 0.42, hem: 310, note: "six tulle layers" },
    headdress: { name: "Headdress & cape", area: 7600, layers: 1, frame: 0.30, hem: 900, note: "cape and wire fan" }
  };
  var SEQ = {
    "3": { mm: 3, weight: 0.012, per1000: 150 },
    "5": { mm: 5, weight: 0.028, per1000: 320 },
    "8": { mm: 8, weight: 0.060, per1000: 540 }
  };
  var FAB = {
    satin: { name: "Duchess satin", gsm: 220, price: 780 },
    tulle: { name: "Silk tulle", gsm: 40, price: 420 },
    organza: { name: "Organza", gsm: 60, price: 520 },
    brocade: { name: "Brocade", gsm: 320, price: 1450 }
  };
  var el = {
    form: $("#lookForm"), sil: $("#silhouette"), cov: $("#coverage"), covOut: $("#covOut"),
    seq: $("#sequin"), fab: $("#fabric"), method: $("#method"),
    seqOut: $("#outSeq"), weight: $("#outWeight"), hours: $("#outHours"),
    fabric: $("#outFabric"), cost: $("#outCost"), verdict: $("#verdict")
  };
  var nf = new Intl.NumberFormat("en-IN");
  var st = null;
  var raf = 0, last = 0;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function read() {
    return {
      sil: SIL[el.sil.value] || SIL.gown,
      coverage: parseInt(el.cov.value, 10) / 100,
      seq: SEQ[el.seq.value] || SEQ["5"],
      fab: FAB[el.fab.value] || FAB.tulle,
      hand: el.method.value === "hand"
    };
  }

  function numbers(s) {
    var seqAreaCm2 = Math.PI * Math.pow(s.seq.mm / 2, 2) / 100;
    var count = Math.round(s.sil.area * s.coverage / seqAreaCm2 * 0.9);
    var seqG = count * s.seq.weight;
    var garmentM2 = s.sil.area / 10000;
    var fabricM = garmentM2 * s.sil.layers / (1.15 * 0.7);
    var fabricG = garmentM2 * s.sil.layers * s.fab.gsm;
    var trimG = s.sil.frame * 1000;
    var totalG = seqG + fabricG + trimG;
    var rate = s.hand ? 220 : 900;
    var hours = count / rate;
    var seqCost = count / 1000 * s.seq.per1000;
    var fabCost = fabricM * s.fab.price;
    var labour = hours * 320;
    var trimCost = 900 + s.sil.frame * 1400;
    var cost = (seqCost + fabCost + labour + trimCost) * 1.12;
    return {
      count: count, seqG: seqG, seqKg: seqG / 1000, fabricM: fabricM,
      fabricG: fabricG, totalKg: totalG / 1000, hours: hours,
      days: hours / 7, cost: Math.round(cost / 100) * 100
    };
  }

  function verdict(s, n) {
    var w = n.totalKg;
    var carry = w > 6
      ? "That is too heavy for a four-hour parade walk. Take a layer out of the skirt or drop to 3 mm sequins."
      : w > 4
        ? "That sits right at the limit. A dancer can wear it, but only with a proper underframe and a second pair of hands at the float."
        : "A dancer can carry this for a full afternoon without the frame digging in.";
    return nf.format(n.count) + " sequins, " + w.toFixed(2) + " kg on the body. " + carry +
      " " + (n.days > 12 ? "At this rate the sewing runs " + Math.round(n.days) + " working days, so the order has to be in early." :
        "It is about " + Math.ceil(n.days) + " working days at the table.");
  }

  function paint(t) {
    if (!st) return;
    var W = 720, H = 680;
    var n = numbers(st);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f8ecda";
    ctx.fillRect(0, 0, W, H);

    /* cutting-table grid and a measuring tape down the left */
    ctx.save();
    ctx.strokeStyle = "rgba(23,19,28,.055)";
    ctx.lineWidth = 1;
    for (var gx = 40; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 32; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#17131c";
    ctx.fillRect(28, 60, 26, 560);
    ctx.fillStyle = "#f8ecda";
    ctx.font = "9px 'DM Mono', monospace";
    ctx.textAlign = "center";
    for (var i = 0; i < 28; i++) {
      var y = 76 + i * 19;
      var long = i % 5 === 0;
      ctx.fillRect(28, y, long ? 14 : 8, 1.5);
      if (long) {
        ctx.save();
        ctx.translate(44, y + 4);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(i * 100), 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    var box = { x: 190, y: 78, w: 340, h: 520 };
    function X(u) { return box.x + u * box.w; }
    function Y(v) { return box.y + v * box.h; }

    /* silhouette path in normalised coordinates */
    var p = new Path2D();
    var kind = st.sil.name;
    if (kind === "Sari gown") {
      p.moveTo(X(0.36), Y(0.155));
      p.lineTo(X(0.64), Y(0.155));
      p.bezierCurveTo(X(0.67), Y(0.26), X(0.6), Y(0.36), X(0.585), Y(0.43));
      p.bezierCurveTo(X(0.72), Y(0.56), X(0.85), Y(0.76), X(0.93), Y(0.97));
      p.bezierCurveTo(X(0.72), Y(1.015), X(0.28), Y(1.015), X(0.07), Y(0.97));
      p.bezierCurveTo(X(0.15), Y(0.76), X(0.28), Y(0.56), X(0.415), Y(0.43));
      p.bezierCurveTo(X(0.4), Y(0.36), X(0.33), Y(0.26), X(0.36), Y(0.155));
    } else if (kind === "Corset & fishtail") {
      p.moveTo(X(0.36), Y(0.15));
      p.lineTo(X(0.64), Y(0.15));
      p.bezierCurveTo(X(0.66), Y(0.3), X(0.56), Y(0.38), X(0.56), Y(0.46));
      p.bezierCurveTo(X(0.6), Y(0.66), X(0.56), Y(0.8), X(0.56), Y(0.86));
      p.bezierCurveTo(X(0.66), Y(0.9), X(0.78), Y(0.94), X(0.86), Y(0.975));
      p.bezierCurveTo(X(0.6), Y(1.01), X(0.4), Y(1.01), X(0.14), Y(0.975));
      p.bezierCurveTo(X(0.22), Y(0.94), X(0.34), Y(0.9), X(0.44), Y(0.86));
      p.bezierCurveTo(X(0.44), Y(0.8), X(0.4), Y(0.66), X(0.44), Y(0.46));
      p.bezierCurveTo(X(0.44), Y(0.38), X(0.34), Y(0.3), X(0.36), Y(0.15));
    } else if (kind === "Tutu") {
      p.moveTo(X(0.36), Y(0.17));
      p.lineTo(X(0.64), Y(0.17));
      p.bezierCurveTo(X(0.66), Y(0.32), X(0.6), Y(0.42), X(0.6), Y(0.5));
      p.bezierCurveTo(X(0.8), Y(0.52), X(0.92), Y(0.6), X(0.93), Y(0.66));
      p.bezierCurveTo(X(0.7), Y(0.74), X(0.3), Y(0.74), X(0.07), Y(0.66));
      p.bezierCurveTo(X(0.08), Y(0.6), X(0.2), Y(0.52), X(0.4), Y(0.5));
      p.bezierCurveTo(X(0.4), Y(0.42), X(0.34), Y(0.32), X(0.36), Y(0.17));
    } else {
      /* headdress: a cape from the shoulders plus a tall fan */
      p.moveTo(X(0.5), Y(0.16));
      p.bezierCurveTo(X(0.64), Y(0.24), X(0.7), Y(0.42), X(0.74), Y(0.62));
      p.lineTo(X(0.96), Y(0.96));
      p.bezierCurveTo(X(0.7), Y(1.02), X(0.3), Y(1.02), X(0.04), Y(0.96));
      p.lineTo(X(0.26), Y(0.62));
      p.bezierCurveTo(X(0.3), Y(0.42), X(0.36), Y(0.24), X(0.5), Y(0.16));
    }

    /* fabric base */
    ctx.save();
    var grad = ctx.createLinearGradient(X(0.1), Y(0.2), X(0.9), Y(1));
    if (kind === "Sari gown") { grad.addColorStop(0, "#e8435a"); grad.addColorStop(.55, "#c22f47"); grad.addColorStop(1, "#8d1b31"); }
    else if (kind === "Corset & fishtail") { grad.addColorStop(0, "#241d29"); grad.addColorStop(.6, "#17131c"); grad.addColorStop(1, "#3a2f36"); }
    else if (kind === "Tutu") { grad.addColorStop(0, "#f3b6c4"); grad.addColorStop(.6, "#e88ea6"); grad.addColorStop(1, "#cf6f8b"); }
    else { grad.addColorStop(0, "#d9a13b"); grad.addColorStop(.6, "#b5862d"); grad.addColorStop(1, "#8a611d"); }
    ctx.fillStyle = grad;
    ctx.fill(p);
    ctx.restore();

    /* sequins clipped to the garment */
    ctx.save();
    ctx.clip(p);
    var tr = ctx.getTransform();
    var dotsWanted = Math.round(2600 + 9000 * st.coverage);
    var rnd = mulberry32(118 * st.seq.mm + Math.round(st.coverage * 100) + kind.length);
    var dotR = st.seq.mm === 3 ? 2.1 : st.seq.mm === 5 ? 3.1 : 4.6;
    var palette = ["#f7cf7a", "#fff1d6", "#f3b6c4", "#e8c07a", "#d9a13b"];
    for (var d = 0; d < dotsWanted; d++) {
      var px = X(0.05) + rnd() * (box.w * 0.9);
      var py = Y(0.12) + rnd() * (box.h * 0.9);
      if (!ctx.isPointInPath(p, px * tr.a + tr.e, py * tr.d + tr.f)) continue;
      ctx.beginPath();
      ctx.fillStyle = palette[Math.floor(rnd() * palette.length)];
      ctx.globalAlpha = 0.42 + rnd() * 0.5;
      ctx.arc(px, py, dotR * (0.65 + rnd() * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = "rgba(255,246,222,.55)";
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 5]);
    if (kind === "Sari gown" || kind === "Corset & fishtail") {
      ctx.beginPath();
      ctx.moveTo(X(0.5), Y(0.44));
      ctx.lineTo(X(0.5), Y(0.99));
      ctx.stroke();
    }
    if (kind === "Tutu") {
      for (var l = 1; l < 6; l++) {
        ctx.beginPath();
        ctx.ellipse(X(0.5), Y(0.5 + l * 0.026), box.w * (0.28 + l * 0.018), 9, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    if (kind === "Headdress & cape") {
      ctx.beginPath();
      ctx.moveTo(X(0.5), Y(0.2));
      ctx.lineTo(X(0.5), Y(0.96));
      ctx.stroke();
    }
    ctx.restore();

    /* head and arms for scale, drawn behind nothing in particular */
    ctx.save();
    ctx.fillStyle = "#8c5f45";
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(0.1), box.w * 0.052, box.h * 0.036, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#241b16";
    ctx.beginPath();
    ctx.ellipse(X(0.5), Y(0.086), box.w * 0.05, box.h * 0.028, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8c5f45";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    if (kind !== "Headdress & cape") {
      ctx.beginPath(); ctx.moveTo(X(0.335), Y(0.19)); ctx.lineTo(X(0.28), Y(0.4)); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(X(0.665), Y(0.19)); ctx.lineTo(X(0.72), Y(0.4)); ctx.stroke();
    }
    ctx.restore();

    /* callouts */
    ctx.save();
    ctx.font = "10px 'DM Mono', monospace";
    ctx.fillStyle = "#4a3f4c";
    ctx.strokeStyle = "rgba(23,19,28,.35)";
    ctx.lineWidth = 1;
    var hemY = Y(0.975);
    ctx.beginPath(); ctx.moveTo(X(0.93), hemY); ctx.lineTo(650, hemY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(646, hemY - 5); ctx.lineTo(646, hemY + 5); ctx.stroke();
    ctx.textAlign = "left";
    ctx.fillText(st.sil.hem + " mm", 656, hemY + 3);
    ctx.fillText("hem", 656, hemY + 16);

    ctx.fillStyle = "#17131c";
    ctx.font = "500 10.5px 'DM Mono', monospace";
    ctx.fillText("FRONT", 196, 62);
    ctx.fillStyle = "#7a6b75";
    ctx.font = "9.5px 'DM Mono', monospace";
    ctx.fillText(st.sil.note.toUpperCase() + " · " + st.fab.name.toUpperCase(), 196, 646);
    ctx.textAlign = "right";
    ctx.fillText(nf.format(n.count) + " SEQUINS IN TOTAL", 700, 646);
    ctx.restore();

    /* a slow shimmer on the plot */
    if (!reduced) {
      var g = ctx.createLinearGradient(X(0.1), 0, X(0.9), 0);
      var pos = (Math.sin(t * 0.5) + 1) / 2;
      g.addColorStop(Math.max(0, pos - 0.16), "rgba(255,255,255,0)");
      g.addColorStop(pos, "rgba(255,247,222,.22)");
      g.addColorStop(Math.min(1, pos + 0.16), "rgba(255,255,255,0)");
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.fillStyle = g;
      ctx.fill(p);
      ctx.restore();
    }
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function render() {
    st = read();
    var n = numbers(st);
    el.covOut.textContent = Math.round(st.coverage * 100) + "%";
    el.seqOut.textContent = nf.format(n.count);
    el.weight.textContent = n.totalKg.toFixed(2) + " kg";
    el.hours.textContent = Math.round(n.hours) + " h";
    el.fabric.textContent = n.fabricM.toFixed(1) + " m";
    el.cost.textContent = "₹" + nf.format(n.cost);
    el.verdict.textContent = verdict(st, n);
    paint(performance.now() / 1000);
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var k = (rect.width / 720) * dpr;
    canvas.width = Math.round(720 * k);
    canvas.height = Math.round(680 * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paint(performance.now() / 1000);
  }

  ["change", "input"].forEach(function (evt) {
    el.form.addEventListener(evt, function (e) {
      if (e.target === el.cov || e.target.tagName === "SELECT") render();
    });
  });
  el.form.addEventListener("submit", function (e) { e.preventDefault(); });

  var presets = {
    redblack: { sil: "corset", cov: "65", seq: "5", fab: "satin", method: "hand" },
    float: { sil: "gown", cov: "80", seq: "8", fab: "organza", method: "hand" },
    street: { sil: "tutu", cov: "35", seq: "8", fab: "tulle", method: "machine" }
  };
  $$("[data-preset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = presets[btn.getAttribute("data-preset")];
      if (!p) return;
      el.sil.value = p.sil; el.cov.value = p.cov; el.seq.value = p.seq;
      el.fab.value = p.fab; el.method.value = p.method;
      $$("[data-preset]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      render();
    });
  });

  function loop(ts) {
    if (!document.hidden && ts - last > 110) { last = ts; paint(ts / 1000); }
    raf = requestAnimationFrame(loop);
  }

  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  render();
  resize();
  if (!reduced) raf = requestAnimationFrame(loop);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && !reduced && !raf) { raf = requestAnimationFrame(loop); }
  });
})();

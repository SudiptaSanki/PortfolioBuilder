/* Deepak Brass — bench arithmetic and the drawing that follows it. */
(function () {
  "use strict";

  var $ = function (sel, root) { return (root || document).querySelector(sel); };

  /* ---------- navigation ---------- */
  var navBtn = $("#navBtn");
  var nav = $("#siteNav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? "Close" : "Menu";
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        navBtn.setAttribute("aria-expanded", "false");
        navBtn.textContent = "Menu";
      }
    });
  }

  /* ---------- commission ledger filters ---------- */
  var ledger = $("#ledger");
  if (ledger) {
    var chips = Array.prototype.slice.call(document.querySelectorAll("[data-filter]"));
    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var filter = chip.getAttribute("data-filter");
        chips.forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        Array.prototype.forEach.call(ledger.querySelectorAll(".ledger-row"), function (row) {
          var match = filter === "all" || row.getAttribute("data-kind") === filter;
          row.hidden = !match;
          if (match) shown++;
          if (!match) row.open = false;
        });
        var label = chip.textContent.toLowerCase();
        ledger.setAttribute("aria-label", shown + " commissions shown: " + label);
      });
    });
  }

  /* ---------- enquiry form ---------- */
  var form = $("#enquiryForm");
  if (form) {
    var fields = {
      name: { input: $("#fName"), error: $("#eName"), test: function (v) { return v.trim().length >= 2; }, msg: "Please give a name the workshop can write back to" },
      email: { input: $("#fEmail"), error: $("#eEmail"), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "That email address is missing something" },
      city: { input: $("#fCity"), error: $("#eCity"), test: function (v) { return v.trim().length >= 2; }, msg: "A city or town helps with delivery" },
      notes: { input: $("#fNotes"), error: $("#eNotes"), test: function (v) { return v.trim().length >= 20; }, msg: "A sentence or two about the room and the flame" }
    };
    var status = $("#formStatus");
    var touched = false;

    function check(key) {
      var f = fields[key];
      if (!f.input) return true;
      var ok = f.test(f.input.value);
      f.error.textContent = ok ? "" : f.msg;
      f.input.classList.toggle("invalid", !ok);
      f.input.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }

    Object.keys(fields).forEach(function (key) {
      var input = fields[key].input;
      if (!input) return;
      input.addEventListener("blur", function () { check(key); });
      input.addEventListener("input", function () { if (touched) check(key); });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      touched = true;
      var ok = Object.keys(fields).map(check).every(Boolean);
      if (!ok) {
        status.textContent = "The highlighted fields need a little more.";
        status.classList.add("warn");
        var firstBad = Object.keys(fields).map(function (k) { return fields[k].input; })
          .filter(function (i) { return i && i.classList.contains("invalid"); })[0];
        if (firstBad) firstBad.focus();
        return;
      }
      var qty = ($("#fQty") && $("#fQty").value) || "1";
      status.classList.remove("warn");
      status.textContent = "Ready to send: " + qty + " lamp" + (qty === "1" ? "" : "s") +
        " for " + $("#fCity").value.trim() + ". Copy this into a letter to the workshop — nothing has been sent from this page.";
    });
  }

  /* ---------- the lamp bench ---------- */
  var canvas = $("#lampCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var FORMS = {
    akhand: {
      name: "Akhand jyot", wicks: 4, height: 318, width: 118,
      capacity: 180, sheet: 1420, hang: false, reservoir: "domed",
      note: "one pour, four lip cups"
    },
    panch: {
      name: "Panchmukhi", wicks: 5, height: 118, width: 196,
      capacity: 90, sheet: 1180, hang: false, reservoir: "shallow",
      note: "wide shallow bowl"
    },
    samai: {
      name: "Samai", wicks: 3, height: 620, width: 150,
      capacity: 240, sheet: 2860, hang: false, reservoir: "tall",
      note: "turned stem, three cups"
    },
    jhoomar: {
      name: "Jhoomar", wicks: 7, height: 470, width: 330,
      capacity: 300, sheet: 3680, hang: true, reservoir: "ring",
      note: "seven cups on a ring"
    }
  };

  var OILS = {
    sesame: { name: "sesame", rate: 3.4 },
    mustard: { name: "mustard", rate: 3.8 },
    coconut: { name: "coconut", rate: 3.0 },
    ghee: { name: "ghee", rate: 2.9 }
  };

  var el = {
    form: $("#lampForm"), type: $("#lampType"), gauge: $("#gauge"),
    oil: $("#oil"), trim: $("#trim"), trimOut: $("#trimOut"),
    weight: $("#outWeight"), weightNote: $("#outWeightNote"),
    capacity: $("#outCapacity"), burn: $("#outBurn"), burnNote: $("#outBurnNote"),
    flames: $("#outFlames"), lumens: $("#outLumens"),
    nights: $("#outNights"), oilMonth: $("#outOilMonth"), verdict: $("#verdict")
  };

  var nf = new Intl.NumberFormat("en-IN");
  var state = null;
  var raf = 0;
  var lastPaint = 0;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readState() {
    var form = FORMS[el.type.value] || FORMS.akhand;
    var gauge = parseFloat(el.gauge.value);
    var trim = parseFloat(el.trim.value);
    var oil = OILS[el.oil.value] || OILS.sesame;
    return { form: form, gauge: gauge, trim: trim, oil: oil };
  }

  function figureNumbers(s) {
    var f = s.form;
    /* Capacity follows the trim; a wider bowl gains more than its depth. */
    var capacity = Math.round(f.capacity * s.trim * (1 + (s.trim - 1) * 0.45));
    /* Brass sheet area grows a little with the trim, weight follows gauge. */
    var sheet = f.sheet * (1 + (s.trim - 1) * 0.7);
    var brassG = sheet * (s.gauge / 10) * 8.5 * 1.12;
    var draw = f.wicks * s.oil.rate;
    var burn = capacity / draw;
    var nightsPerFill = burn / 12;
    var perNight = Math.min(capacity, draw * 12);
    var monthly = perNight * 30;
    return {
      capacity: capacity,
      sheet: sheet,
      brassG: brassG,
      draw: draw,
      burn: burn,
      nightsPerFill: nightsPerFill,
      monthly: monthly,
      flames: f.wicks,
      lumens: f.wicks * 11,
      height: f.height,
      width: f.width,
      hang: f.hang
    };
  }

  function fmtWeight(g) {
    return g >= 1000 ? (g / 1000).toFixed(2) + " kg" : Math.round(g) + " g";
  }
  function fmtDuration(h) {
    if (h < 1) return Math.round(h * 60) + " min";
    var whole = Math.floor(h);
    var mins = Math.round((h - whole) * 60);
    return mins ? whole + " h " + mins + " m" : whole + " h";
  }
  function fmtOil(ml) {
    return ml >= 1000 ? (ml / 1000).toFixed(2) + " L" : Math.round(ml) + " ml";
  }

  function verdictText(s, n) {
    var oil = s.oil.name;
    if (n.burn >= 12) {
      return "One fill carries the night. " + n.capacity + " ml of " + oil + " at " +
        n.draw.toFixed(1) + " ml an hour gives " + fmtDuration(n.burn) +
        " of flame, so a 12-hour vigil finishes with oil still in the bowl. " +
        "Fill it " + (n.nightsPerFill >= 1.95 ? n.nightsPerFill.toFixed(0) + " nights" : "every night") +
        " and top up the wicks monthly.";
    }
    if (n.burn >= 8) {
      return "A late refill. " + fmtDuration(n.burn) + " is honest light, but a 12-hour night asks for a " +
        "second fill around the tenth hour. If the lamp must not go out, widen the reservoir by a quarter " +
        "or drop to two wicks.";
    }
    return "This is a prayer lamp, not a vigil lamp. At " + fmtDuration(n.burn) +
      " a fill it needs " + (12 / n.burn).toFixed(1) + " refills across a 12-hour night. " +
      "The " + s.form.name.toLowerCase() + " is the right form for a short evening; an akhand jyot is the right form for morning.";
  }

  function render() {
    var s = readState();
    state = s;
    var n = figureNumbers(s);
    el.trimOut.textContent = s.trim.toFixed(2) + "×";
    el.weight.textContent = fmtWeight(n.brassG);
    el.weightNote.textContent = s.gauge.toFixed(1) + " mm sheet + 12% sprue";
    el.capacity.textContent = n.capacity + " ml";
    el.burn.textContent = fmtDuration(n.burn);
    el.burnNote.textContent = n.draw.toFixed(1) + " ml/h across " + n.flames + " wick" + (n.flames > 1 ? "s" : "");
    el.flames.textContent = String(n.flames);
    el.lumens.textContent = "≈ " + n.lumens + " lumens in total";
    el.nights.textContent = n.nightsPerFill >= 2
      ? "every " + Math.round(n.nightsPerFill) + " nights"
      : n.nightsPerFill >= 1 ? "nightly" : (12 / n.burn).toFixed(1) + "× a night";
    el.oilMonth.textContent = fmtOil(n.monthly);
    el.verdict.textContent = verdictText(s, n);
    paint(performance.now() / 1000);
  }

  /* ---------- the drawing ---------- */
  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var cssW = rect.width;
    var cssH = cssW * (560 / 760);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var k = (cssW / 760) * dpr;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paint(performance.now() / 1000);
  }

  function line(x1, y1, x2, y2, color, width, dash) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width || 1;
    if (dash) ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function paint(t) {
    if (!state) return;
    var W = 760, H = 560, ground = 498;
    var s = state;
    var f = s.form;
    var n = figureNumbers(s);

    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f3ead6";
    ctx.fillRect(0, 0, W, H);

    /* drafting grid */
    ctx.save();
    ctx.strokeStyle = "rgba(36,29,21,.05)";
    ctx.lineWidth = 1;
    for (var gx = 40; gx < W; gx += 40) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (var gy = 40; gy < H; gy += 40) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.restore();

    var scale = Math.min(400 / f.height, 3.3);
    if (f.width * scale > 380) scale = 380 / f.width;
    var hPx = f.height * scale;
    var wPx = f.width * scale;
    var cx = 300;
    var baseY = ground;
    var topY = f.hang ? baseY - hPx + 40 : baseY - hPx;

    var brass = ctx.createLinearGradient(cx - wPx / 2, 0, cx + wPx / 2, 0);
    brass.addColorStop(0, "#7c5318");
    brass.addColorStop(0.22, "#c99343");
    brass.addColorStop(0.44, "#e2bd76");
    brass.addColorStop(0.66, "#a9762a");
    brass.addColorStop(0.86, "#d9ad5e");
    brass.addColorStop(1, "#6a4514");
    var brassDark = "#5e3f12";

    /* ground */
    line(60, ground + 1, 560, ground + 1, "rgba(36,29,21,.55)", 1.4);
    ctx.save();
    ctx.strokeStyle = "rgba(36,29,21,.22)";
    ctx.lineWidth = 1;
    for (var hx = 64; hx < 560; hx += 13) {
      ctx.beginPath(); ctx.moveTo(hx, ground + 2); ctx.lineTo(hx - 9, ground + 12); ctx.stroke();
    }
    ctx.restore();

    if (f.hang) {
      /* hanging chains from the ceiling point to the crown ring */
      var crownY = topY + 12;
      line(cx - wPx * 0.5, crownY + 10, cx, 42, "rgba(74,63,49,.8)", 1.4);
      line(cx + wPx * 0.5, crownY + 10, cx, 42, "rgba(74,63,49,.8)", 1.4);
      line(cx, crownY + 10, cx, 42, "rgba(74,63,49,.8)", 1.4);
      ctx.save();
      ctx.fillStyle = "#4a3f31";
      ctx.beginPath(); ctx.arc(cx, 39, 5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      line(cx - wPx * 0.5, crownY + 10, cx + wPx * 0.5, crownY + 10, "rgba(74,63,49,.5)", 1);
    }

    /* proportions in millimetres, measured up from the ground */
    var H_ = f.height;
    var baseH = f.hang ? H_ * 0.06 : H_ * 0.055;
    var rimRatio = f.hang ? 0.42 : 0.82;
    var bowlBottomRatio = f.hang ? 0.20 : 0.66;
    var rimY = baseY - H_ * rimRatio * scale;
    var bowlH = H_ * (rimRatio - bowlBottomRatio) * scale;
    var bowlBottomY = rimY + bowlH;
    var baseTopY = baseY - baseH * scale;
    var rx = wPx / 2;

    /* ---- base and stem ---- */
    if (!f.hang) {
      ctx.save();
      ctx.fillStyle = brass;
      ctx.beginPath();
      ctx.ellipse(cx, baseY - 2, rx * 0.82, Math.max(5, rx * 0.13), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* plinth */
      ctx.save();
      ctx.fillStyle = brassDark;
      ctx.beginPath();
      ctx.moveTo(cx - rx * 0.74, baseY - 2);
      ctx.bezierCurveTo(cx - rx * 0.74, baseTopY + 8, cx - rx * 0.4, baseTopY, cx, baseTopY);
      ctx.bezierCurveTo(cx + rx * 0.4, baseTopY, cx + rx * 0.74, baseTopY + 8, cx + rx * 0.74, baseY - 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      /* stem */
      var stemW = rx * 0.17;
      var stemTop = bowlBottomY + bowlH * 0.08;
      ctx.save();
      ctx.fillStyle = brass;
      ctx.beginPath();
      ctx.moveTo(cx - stemW * 1.25, baseTopY);
      ctx.lineTo(cx - stemW * 0.72, stemTop);
      ctx.lineTo(cx + stemW * 0.72, stemTop);
      ctx.lineTo(cx + stemW * 1.25, baseTopY);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      /* two turned knops */
      [[0.34, 1.9], [0.63, 1.5]].forEach(function (kn) {
        var ky = baseTopY - (baseTopY - stemTop) * kn[0];
        ctx.save();
        ctx.fillStyle = "#c99343";
        ctx.beginPath();
        ctx.ellipse(cx, ky, stemW * kn[1], stemW * 0.38, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    /* ---- reservoir bowl ---- */
    ctx.save();
    ctx.fillStyle = brass;
    ctx.beginPath();
    if (f.reservoir === "shallow") {
      ctx.moveTo(cx - rx, rimY);
      ctx.bezierCurveTo(cx - rx, rimY + bowlH * 1.2, cx - rx * 0.6, bowlBottomY, cx, bowlBottomY);
      ctx.bezierCurveTo(cx + rx * 0.6, bowlBottomY, cx + rx, rimY + bowlH * 1.2, cx + rx, rimY);
    } else {
      ctx.moveTo(cx - rx, rimY);
      ctx.bezierCurveTo(cx - rx, rimY + bowlH * 0.62, cx - rx * 0.56, bowlBottomY, cx, bowlBottomY);
      ctx.bezierCurveTo(cx + rx * 0.56, bowlBottomY, cx + rx, rimY + bowlH * 0.62, cx + rx, rimY);
    }
    ctx.closePath();
    ctx.fill();

    /* a single soft highlight on the left shoulder, not across the bowl */
    ctx.strokeStyle = "rgba(255,246,216,.28)";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(cx - rx * 0.78, rimY + bowlH * 0.2);
    ctx.quadraticCurveTo(cx - rx * 0.9, rimY + bowlH * 0.48, cx - rx * 0.62, rimY + bowlH * 0.72);
    ctx.stroke();
    ctx.restore();

    /* collar where the bowl meets the stem */
    ctx.save();
    ctx.fillStyle = "#c99343";
    ctx.beginPath();
    ctx.ellipse(cx, bowlBottomY + 4, rx * 0.24, Math.max(3, rx * 0.05), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(94,63,18,.5)";
    ctx.beginPath();
    ctx.ellipse(cx, bowlBottomY + 8, rx * 0.2, Math.max(2, rx * 0.035), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* engraved band */
    ctx.save();
    ctx.strokeStyle = "rgba(94,63,18,.55)";
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.ellipse(cx, rimY + bowlH * 0.34, rx * 0.86, bowlH * 0.1, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    /* rim */
    ctx.save();
    ctx.fillStyle = "#e2bd76";
    ctx.beginPath();
    ctx.ellipse(cx, rimY, rx, Math.max(5, rx * 0.075), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(58,42,18,.78)";
    ctx.beginPath();
    ctx.ellipse(cx, rimY + 1, rx * 0.86, Math.max(3.5, rx * 0.052), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(169,118,42,.55)";
    ctx.beginPath();
    ctx.ellipse(cx, rimY + 2, rx * 0.7, Math.max(2, rx * 0.035), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    /* ---- wick cups + flames ---- */
    var wicks = f.wicks;
    var span = f.reservoir === "shallow" ? 0.7 : (f.hang ? 0.9 : 0.62);
    for (var i = 0; i < wicks; i++) {
      var frac = wicks === 1 ? 0.5 : i / (wicks - 1);
      var wx = cx + (frac - 0.5) * wPx * span;
      var wy = rimY - (f.hang ? bowlH * 0.34 : 1) - Math.abs(frac - 0.5) * (f.hang ? 0 : 4);
      if (f.hang) wy = rimY - bowlH * 0.06;

      /* cup */
      ctx.save();
      ctx.fillStyle = "#6d4a17";
      ctx.beginPath();
      ctx.ellipse(wx, wy, Math.max(6, rx * 0.075), Math.max(2.5, rx * 0.028), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#3a2a12";
      ctx.beginPath();
      ctx.ellipse(wx, wy - 1, Math.max(3, rx * 0.036), Math.max(1.4, rx * 0.016), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* wick */
      line(wx, wy - 1, wx, wy - 6, "#2e2316", 1.6);

      /* flame, gently unsteady */
      var wob = reduced ? 0 : Math.sin(t * 2.1 + i * 1.7) * 0.06 + Math.sin(t * 5.3 + i) * 0.03;
      var fh = 16 + (rx * 0.03) + (i % 2) * 2;
      ctx.save();
      ctx.translate(wx, wy - 5);
      ctx.scale(1 + wob, 1 - wob * 0.5);
      var fg = ctx.createLinearGradient(0, 0, 0, -fh);
      fg.addColorStop(0, "#fff3cf");
      fg.addColorStop(0.45, "#f6bb52");
      fg.addColorStop(1, "#d4691b");
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-fh * 0.34, -fh * 0.35, -fh * 0.2, -fh * 0.78, 0, -fh);
      ctx.bezierCurveTo(fh * 0.2, -fh * 0.78, fh * 0.34, -fh * 0.35, 0, 0);
      ctx.fill();
      ctx.restore();

      /* halo */
      ctx.save();
      var halo = ctx.createRadialGradient(wx, wy - 9, 1, wx, wy - 9, 26);
      halo.addColorStop(0, "rgba(246,187,82,.30)");
      halo.addColorStop(1, "rgba(246,187,82,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(wx, wy - 9, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    /* ---- dimensions ---- */
    var dimX = 596;
    ctx.save();
    ctx.strokeStyle = "rgba(74,63,49,.6)";
    ctx.fillStyle = "#4a3f31";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(dimX, topY); ctx.lineTo(dimX, baseY); ctx.stroke();
    [[topY], [baseY]].forEach(function (p) {
      ctx.beginPath(); ctx.moveTo(dimX - 7, p[0]); ctx.lineTo(dimX + 7, p[0]); ctx.stroke();
    });
    ctx.beginPath(); ctx.moveTo(dimX - 7, topY + 3); ctx.lineTo(dimX, topY); ctx.lineTo(dimX + 7, topY + 3); ctx.fill();
    ctx.beginPath(); ctx.moveTo(dimX - 7, baseY - 3); ctx.lineTo(dimX, baseY); ctx.lineTo(dimX + 7, baseY - 3); ctx.fill();
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText(f.height + " mm", dimX + 12, (topY + baseY) / 2);
    ctx.fillStyle = "rgba(111,99,82,.9)";
    ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.fillText("overall", dimX + 12, (topY + baseY) / 2 + 14);

    /* width dimension below the ground */
    var wy2 = baseY + 34;
    ctx.strokeStyle = "rgba(74,63,49,.5)";
    ctx.beginPath(); ctx.moveTo(cx - rx, wy2); ctx.lineTo(cx + rx, wy2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - rx, wy2 - 6); ctx.lineTo(cx - rx, wy2 + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + rx, wy2 - 6); ctx.lineTo(cx + rx, wy2 + 6); ctx.stroke();
    ctx.fillStyle = "#4a3f31";
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(f.width + " mm across the rim", cx, wy2 + 20);
    ctx.restore();

    /* ---- specification legend, kept clear of the drawing ---- */
    ctx.save();
    ctx.strokeStyle = "rgba(74,63,49,.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(40, 386, 178, 68);
    ctx.fillStyle = "#6f6352";
    ctx.font = "9.5px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("RESERVOIR", 50, 404);
    ctx.fillText("SHEET", 50, 420);
    ctx.fillText("BURN", 50, 436);
    ctx.fillStyle = "#241d15";
    ctx.font = "500 10.5px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right";
    ctx.fillText(n.capacity + " ml", 208, 404);
    ctx.fillText(s.gauge.toFixed(1) + " mm", 208, 420);
    ctx.fillText(n.burn.toFixed(1) + " h", 208, 436);
    ctx.restore();

    /* ---- title block ---- */
    ctx.save();
    ctx.strokeStyle = "rgba(36,29,21,.35)";
    ctx.strokeRect(40, 40, 172, 54);
    ctx.fillStyle = "#241d15";
    ctx.font = "500 10.5px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("PRAJAPATI BRASS", 50, 58);
    ctx.fillStyle = "#6f6352";
    ctx.font = "9.5px 'IBM Plex Mono', monospace";
    ctx.fillText("ELEVATION · 1:4", 50, 72);
    ctx.fillText(f.name.toUpperCase(), 50, 86);
    ctx.restore();
  }

  /* ---------- wiring ---------- */
  ["change", "input"].forEach(function (evt) {
    if (el.form) el.form.addEventListener(evt, function (e) {
      if (e.target === el.trim || e.target.tagName === "SELECT") render();
    });
  });
  if (el.form) el.form.addEventListener("submit", function (e) { e.preventDefault(); });

  var presets = {
    night: { type: "akhand", gauge: "0.8", oil: "sesame", trim: "1.15" },
    temple: { type: "samai", gauge: "1", oil: "ghee", trim: "1.2" },
    table: { type: "panch", gauge: "0.6", oil: "coconut", trim: "0.85" }
  };
  Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (btn) {
    btn.addEventListener("click", function () {
      var p = presets[btn.getAttribute("data-preset")];
      if (!p) return;
      el.type.value = p.type;
      el.gauge.value = p.gauge;
      el.oil.value = p.oil;
      el.trim.value = p.trim;
      Array.prototype.forEach.call(document.querySelectorAll("[data-preset]"), function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
      render();
    });
  });

  if (window.ResizeObserver) {
    new ResizeObserver(function () { resize(); }).observe(canvas);
  } else {
    window.addEventListener("resize", resize);
  }

  /* animation only while visible and only when motion is welcome */
  function loop(ts) {
    if (!document.hidden && ts - lastPaint > 90) {
      lastPaint = ts;
      paint(ts / 1000);
    }
    raf = requestAnimationFrame(loop);
  }

  render();
  resize();
  if (!reduced) raf = requestAnimationFrame(loop);
  document.addEventListener("visibilitychange", function () {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && !reduced && !raf) { raf = requestAnimationFrame(loop); }
  });
})();

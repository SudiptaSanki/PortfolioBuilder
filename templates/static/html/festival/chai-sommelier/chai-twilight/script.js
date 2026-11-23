/* Chai Twilight — brew arithmetic, a curve, and a cup that fills. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- nav ---------- */
  var navBtn = $("#navBtn"), nav = $("#siteNav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- tasting filters ---------- */
  var grid = $("#tastingGrid");
  if (grid) {
    $$("[data-tasting]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-tasting");
        $$("[data-tasting]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        $$(".tasting", grid).forEach(function (card) {
          var match = f === "all" || card.getAttribute("data-kind") === f;
          card.hidden = !match;
          if (match) shown++;
        });
        var note = $("#tastingCount");
        if (note) note.textContent = shown + " sittings listed";
      });
    });
  }

  /* ---------- booking form ---------- */
  var form = $("#bookForm");
  if (form) {
    var bf = {
      name: { i: $("#kName"), e: $("#kNameErr"), ok: function (v) { return v.trim().length >= 2; }, msg: "A name for the table" },
      email: { i: $("#kEmail"), e: $("#kEmailErr"), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "Check the email address" },
      date: { i: $("#kDate"), e: $("#kDateErr"), ok: function (v) { return v.trim().length >= 3; }, msg: "Which Thursday to Sunday" },
      notes: { i: $("#kNotes"), e: $("#kNotesErr"), ok: function (v) { return v.trim().length >= 12; }, msg: "Who is coming, and what they drink" }
    };
    var status = $("#bookStatus"), touched = false;
    function check(k) {
      var x = bf[k]; if (!x.i) return true;
      var ok = x.ok(x.i.value);
      x.e.textContent = ok ? "" : x.msg;
      x.i.classList.toggle("invalid", !ok);
      x.i.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    Object.keys(bf).forEach(function (k) {
      if (!bf[k].i) return;
      bf[k].i.addEventListener("blur", function () { check(k); });
      bf[k].i.addEventListener("input", function () { if (touched) check(k); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      touched = true;
      var good = Object.keys(bf).map(check).every(Boolean);
      if (!good) {
        status.textContent = "A few fields still need an answer.";
        status.classList.add("warn");
        var bad = Object.keys(bf).map(function (k) { return bf[k].i; }).filter(function (i) { return i && i.classList.contains("invalid"); })[0];
        if (bad) bad.focus();
        return;
      }
      status.classList.remove("warn");
      status.textContent = "Table request ready: " + $("#kDate").value.trim() + " for " + $("#kGuests").value + ". Copy it into an email — nothing has been sent from this page.";
    });
  }

  /* ---------- the brew bench ---------- */
  var canvas = $("#brewCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var TEAS = {
    assam: { name: "Assam CTC, Halmari", factor: 1.15, mg: 27, price: 65, tau: 1.5, note: "malty, thick" },
    darjeeling: { name: "Darjeeling first flush", factor: 0.85, mg: 22, price: 320, tau: 2.4, note: "green apple, wet stone" },
    nilgiri: { name: "Nilgiri, Korakundah", factor: 0.95, mg: 24, price: 180, tau: 2.0, note: "bright, floral" },
    kangra: { name: "Kangra orthodox", factor: 0.90, mg: 23, price: 240, tau: 2.2, note: "honeyed, soft" },
    masala: { name: "House masala blend", factor: 1.05, mg: 25, price: 90, tau: 1.7, note: "spice, malt" }
  };
  var SPICE = {
    none: { name: "nothing", cost: 0 },
    cardamom: { name: "cardamom", cost: 1.6 },
    ginger: { name: "ginger", cost: 0.8 },
    clove: { name: "clove", cost: 1.2 },
    fennel: { name: "fennel", cost: 0.6 },
    masala: { name: "house masala", cost: 2.4 }
  };
  var el = {
    form: $("#brewForm"), tea: $("#tea"), grams: $("#grams"), water: $("#water"),
    milk: $("#milk"), sugar: $("#sugar"), minutes: $("#minutes"), heat: $("#heat"), spice: $("#spice"),
    gOut: $("#gOut"), wOut: $("#wOut"), mOut: $("#mOut"), sOut: $("#sOut"), bOut: $("#bOut"),
    strength: $("#outStrength"), caffeine: $("#outCaffeine"), ratio: $("#outRatio"),
    cost: $("#outCost"), verdict: $("#verdict")
  };
  var st = null;
  var raf = 0, last = 0;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function read() {
    return {
      tea: TEAS[el.tea.value] || TEAS.assam,
      grams: parseFloat(el.grams.value),
      water: parseFloat(el.water.value),
      milk: parseFloat(el.milk.value) / 100,
      sugar: parseFloat(el.sugar.value),
      minutes: parseFloat(el.minutes.value),
      heat: el.heat.value,
      spice: SPICE[el.spice.value] || SPICE.none
    };
  }

  function calc(s) {
    var extract = Math.min(0.96, 1 - Math.exp(-s.minutes / s.tea.tau));
    var ratio = s.grams / s.water * 100;
    var strength = (ratio * 1.6 + extract * 3.4) * (1 - s.milk * 0.35) * (s.tea.factor / 1.05);
    strength = Math.max(0.5, Math.min(10, strength));
    var caffeine = s.grams * s.tea.mg * extract * 0.85;
    var milkMl = s.water * s.milk;
    var cost = s.grams / 100 * s.tea.price + milkMl * 0.055 + s.sugar * 0.9 + s.spice.cost;
    return { extract: extract, ratio: ratio, strength: strength, caffeine: caffeine, milkMl: milkMl, cost: cost };
  }

  function verdict(s, c) {
    var bits = [];
    if (s.tea.name.indexOf("Darjeeling") === 0 && s.heat === "rolling") {
      bits.push("A first flush at a rolling boil will turn bitter and lose the fruit; take it off the heat at 85°C.");
    } else if (s.heat === "rolling" && s.minutes >= 6) {
      bits.push("Six minutes at a rolling boil is stewing, not brewing — the leaf gives up tannin and nothing else.");
    }
    if (c.strength > 8.6) bits.push("Very strong: " + c.strength.toFixed(1) + " out of 10, which is either a proper cutting chai or too much leaf, depending on the house.");
    else if (c.strength < 4) bits.push("Thin at " + c.strength.toFixed(1) + " out of 10 — more leaf or another minute, not more sugar.");
    else bits.push("Balanced at " + c.strength.toFixed(1) + " out of 10.");
    if (s.milk > 0.5) bits.push("Milk is " + Math.round(s.milk * 100) + "% of the liquid; at that point you are tasting milk with a tea accent.");
    else if (s.milk === 0) bits.push("No milk, so the leaf is entirely exposed — the cup will show every fault in the brew.");
    else bits.push("Milk sits at " + Math.round(s.milk * 100) + "%, enough to soften the tannin without hiding the leaf.");
    bits.push(s.tea.note + " in the cup; " + Math.round(c.caffeine) + " mg caffeine and about ₹" + c.cost.toFixed(0) + " of what is in it.");
    return bits.join(" ");
  }

  function render() {
    st = read();
    var c = calc(st);
    el.gOut.textContent = st.grams + " g";
    el.wOut.textContent = st.water + " ml";
    el.mOut.textContent = Math.round(st.milk * 100) + "%";
    el.sOut.textContent = st.sugar === 1 ? "1 tsp" : st.sugar + " tsp";
    el.bOut.textContent = st.minutes + " min";
    el.strength.textContent = c.strength.toFixed(1);
    el.caffeine.textContent = Math.round(c.caffeine);
    el.ratio.textContent = c.ratio.toFixed(2);
    el.cost.textContent = "₹" + c.cost.toFixed(0);
    el.verdict.textContent = verdict(st, c);
    paint(performance.now() / 1000);
  }

  function paint(t) {
    if (!st) return;
    var W = 820, H = 460;
    var c = calc(st);
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f4e8d4";
    ctx.fillRect(0, 0, W, H);

    /* faint table grid */
    ctx.save();
    ctx.strokeStyle = "rgba(42,33,24,.045)";
    for (var gx = 40; gx < W; gx += 40) { ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke(); }
    for (var gy = 40; gy < H; gy += 40) { ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }
    ctx.restore();

    /* ---------- chart ---------- */
    var x0 = 76, x1 = 500, y0 = 76, y1 = 372;
    ctx.save();
    ctx.strokeStyle = "rgba(42,33,24,.28)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.stroke();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = "rgba(42,33,24,.14)";
    for (var i = 1; i <= 4; i++) {
      var yy = y1 - (y1 - y0) * i / 4;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x1, yy); ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "#7d6b55";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    for (var m = 0; m <= 8; m += 2) {
      var mx = x0 + (x1 - x0) * m / 8;
      ctx.fillText(m + "m", mx, y1 + 16);
    }
    ctx.textAlign = "right";
    ctx.fillText("100%", x0 - 8, y0 + 4);
    ctx.fillText("50%", x0 - 8, (y0 + y1) / 2 + 3);
    ctx.fillText("0", x0 - 8, y1 + 3);

    /* extraction curve */
    ctx.save();
    var grad = ctx.createLinearGradient(x0, y0, x1, y1);
    grad.addColorStop(0, "rgba(181,72,47,.10)");
    grad.addColorStop(1, "rgba(181,72,47,.28)");
    ctx.beginPath();
    ctx.moveTo(x0, y1);
    for (var step = 0; step <= 80; step++) {
      var tm = step / 10;
      var ef = Math.min(0.96, 1 - Math.exp(-tm / st.tea.tau));
      ctx.lineTo(x0 + (x1 - x0) * tm / 8, y1 - (y1 - y0) * ef);
    }
    ctx.lineTo(x1, y1);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    for (var s2 = 0; s2 <= 80; s2++) {
      var t2 = s2 / 10;
      var e2 = Math.min(0.96, 1 - Math.exp(-t2 / st.tea.tau));
      var px = x0 + (x1 - x0) * t2 / 8, py = y1 - (y1 - y0) * e2;
      if (s2 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = "#b5482f";
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();

    /* marker at the chosen minute */
    var mx2 = x0 + (x1 - x0) * st.minutes / 8;
    var my2 = y1 - (y1 - y0) * c.extract;
    ctx.save();
    ctx.strokeStyle = "rgba(42,33,24,.5)";
    ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(mx2, y1); ctx.lineTo(mx2, my2); ctx.stroke();
    ctx.restore();
    ctx.save();
    ctx.fillStyle = "#f4e8d4";
    ctx.strokeStyle = "#b5482f";
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.arc(mx2, my2, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.fillStyle = "#2a2118";
    ctx.font = "500 13px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    ctx.fillText("NOW · " + st.minutes + " MIN · " + Math.round(c.extract * 100) + "% EXTRACTED", mx2 + 12 > 360 ? 220 : mx2 + 12, my2 - 12);

    /* chart captions */
    ctx.fillStyle = "#2a2118";
    ctx.font = "500 13px 'JetBrains Mono', monospace";
    ctx.fillText("EXTRACTION", x0, 48);
    ctx.fillStyle = "#7d6b55";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(st.tea.name.toUpperCase() + " · TAU " + st.tea.tau.toFixed(1) + " MIN", x0, 62);
    ctx.textAlign = "right";
    ctx.fillText("LEAF " + st.grams + " G", x1, 48);

    /* ---------- the cup ---------- */
    var cx = 655, top = 150, rim = 128, bottom = 300, halfTop = 74, halfBottom = 46;
    ctx.save();
    /* saucer */
    ctx.fillStyle = "rgba(42,33,24,.12)";
    ctx.beginPath(); ctx.ellipse(cx, 322, 96, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#c98a5b";
    ctx.beginPath(); ctx.ellipse(cx, 318, 88, 14, 0, 0, Math.PI * 2); ctx.fill();

    /* cup body */
    ctx.beginPath();
    ctx.moveTo(cx - halfTop, rim);
    ctx.lineTo(cx - halfBottom, bottom - 18);
    ctx.quadraticCurveTo(cx - halfBottom + 6, bottom + 6, cx, bottom + 6);
    ctx.quadraticCurveTo(cx + halfBottom - 6, bottom + 6, cx + halfBottom, bottom - 18);
    ctx.lineTo(cx + halfTop, rim);
    ctx.closePath();
    ctx.fillStyle = "#a5603c";
    ctx.fill();

    /* interior */
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx - halfTop + 8, rim + 4);
    ctx.lineTo(cx - halfBottom + 6, bottom - 20);
    ctx.quadraticCurveTo(cx - halfBottom + 12, bottom - 2, cx, bottom - 2);
    ctx.quadraticCurveTo(cx + halfBottom - 12, bottom - 2, cx + halfBottom - 6, bottom - 20);
    ctx.lineTo(cx + halfTop - 8, rim + 4);
    ctx.closePath();
    ctx.clip();

    /* tea body */
    var liquidTop = rim + 26 + (1 - 0.78) * 0;
    var teaTop = rim + 30;
    var teaGrad = ctx.createLinearGradient(0, teaTop, 0, bottom);
    teaGrad.addColorStop(0, "#d9a86a");
    teaGrad.addColorStop(0.45, "#b4794f");
    teaGrad.addColorStop(1, "#7c4b34");
    ctx.fillStyle = teaGrad;
    ctx.fillRect(cx - halfTop, teaTop, halfTop * 2, bottom - teaTop);

    /* milk layer at the top of the liquid */
    if (st.milk > 0) {
      var milkH = 66 * st.milk;
      var milkGrad = ctx.createLinearGradient(0, teaTop, 0, teaTop + milkH);
      milkGrad.addColorStop(0, "#f0dcc0");
      milkGrad.addColorStop(1, "#cfa276");
      ctx.fillStyle = milkGrad;
      ctx.fillRect(cx - halfTop, teaTop, halfTop * 2, milkH);
      ctx.strokeStyle = "rgba(255,246,230,.5)";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - halfTop, teaTop + milkH); ctx.lineTo(cx + halfTop, teaTop + milkH); ctx.stroke();
    }

    /* surface */
    ctx.fillStyle = "#e0b88a";
    ctx.beginPath(); ctx.ellipse(cx, teaTop, halfTop - 6, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* rim */
    ctx.beginPath();
    ctx.ellipse(cx, rim, halfTop, 12, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "#7c4b34";
    ctx.lineWidth = 3;
    ctx.stroke();

    /* steam */
    var wob = reduced ? 0 : Math.sin(t * 1.3) * 3;
    ctx.strokeStyle = "rgba(90,70,50,.28)";
    ctx.lineWidth = 1.6;
    [-24, 0, 24].forEach(function (o, i) {
      ctx.beginPath();
      ctx.moveTo(cx + o, rim - 8);
      ctx.bezierCurveTo(cx + o + 10 + wob, rim - 38, cx + o - 10, rim - 62, cx + o + 4 + wob, rim - 92);
      ctx.stroke();
    });

    /* labels */
    ctx.fillStyle = "#2a2118";
    ctx.textAlign = "center";
    ctx.font = "500 13px 'JetBrains Mono', monospace";
    ctx.fillText("ONE CUP", cx, 52);
    ctx.fillStyle = "#7d6b55";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(Math.round(st.water) + " ML WATER + " + Math.round(c.milkMl) + " ML MILK", cx, 70);
    ctx.fillStyle = "#2a2118";
    ctx.font = "500 13px 'JetBrains Mono', monospace";
    ctx.fillText(st.sugar + " TSP SUGAR · " + (st.spice.name === "nothing" ? "NO ADD-IN" : st.spice.name.toUpperCase()), cx, 356);
    ctx.fillStyle = "#7d6b55";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText(st.heat === "rolling" ? "ROLLING BOIL" : st.heat === "simmer" ? "GENTLE SIMMER" : "JUST BELOW BOIL", cx, 372);

    /* little spoon */
    ctx.strokeStyle = "#8a7458";
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(cx + 92, 292); ctx.lineTo(cx + 120, 222); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(cx + 124, 214, 7, 12, -0.5, 0, Math.PI * 2); ctx.stroke();

    /* footer note */
    ctx.textAlign = "left";
    ctx.fillStyle = "#7d6b55";
    ctx.font = "11px 'JetBrains Mono', monospace";
    ctx.fillText("CHAI TWILIGHT · JORASANKO · SLIP 0241", 40, 434);
    ctx.textAlign = "right";
    ctx.fillText("1 OF 1 CUP", 780, 434);
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var k = (rect.width / 820) * dpr;
    canvas.width = Math.round(820 * k);
    canvas.height = Math.round(460 * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    paint(performance.now() / 1000);
  }

  ["change", "input"].forEach(function (evt) {
    el.form.addEventListener(evt, function (e) {
      if (e.target.type === "range" || e.target.tagName === "SELECT") render();
    });
  });
  el.form.addEventListener("submit", function (e) { e.preventDefault(); });

  var presets = {
    cutting: { tea: "assam", grams: "5", water: "120", milk: "35", sugar: "2", minutes: "4", heat: "rolling", spice: "none" },
    first: { tea: "darjeeling", grams: "3", water: "200", milk: "0", sugar: "0", minutes: "3", heat: "below", spice: "none" },
    crowd: { tea: "masala", grams: "10", water: "400", milk: "30", sugar: "3", minutes: "5", heat: "rolling", spice: "masala" }
  };
  $$("[data-brew]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = presets[btn.getAttribute("data-brew")];
      if (!p) return;
      Object.keys(p).forEach(function (k) { if (el[k]) el[k].value = p[k]; });
      $$("[data-brew]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      render();
    });
  });

  function loop(ts) {
    if (!document.hidden && ts - last > 140) { last = ts; paint(ts / 1000); }
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

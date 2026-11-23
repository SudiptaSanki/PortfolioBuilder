/* Zoom Lens Mardi — exposure maths, the preview frame, and the contact sheet. */
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

  /* ---------- contact sheet filters ---------- */
  var sheet = $("#sheet");
  if (sheet) {
    var sheetNote = $("#sheetCount");
    if (sheetNote) sheetNote.textContent = "9 of 9 frames";
    $$("[data-sheet]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-sheet");
        $$("[data-sheet]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        $$(".sheet-card", sheet).forEach(function (card) {
          var match = f === "all" || card.getAttribute("data-kind") === f;
          card.hidden = !match;
          if (match) shown++;
        });
        var note = $("#sheetCount");
        if (note) note.textContent = shown + " of 9 frames";
      });
    });
  }

  /* ---------- assignment form ---------- */
  var form = $("#assignmentForm");
  if (form) {
    var f = {
      name: { i: $("#aName"), e: $("#aNameErr"), ok: function (v) { return v.trim().length >= 2; }, msg: "A name for the reply" },
      email: { i: $("#aEmail"), e: $("#aEmailErr"), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "Check the email address" },
      outlet: { i: $("#aOutlet"), e: $("#aOutletErr"), ok: function (v) { return v.trim().length >= 2; }, msg: "Who is the assignment for" },
      dates: { i: $("#aDates"), e: $("#aDatesErr"), ok: function (v) { return v.trim().length >= 3; }, msg: "Which nights, and this year or next" },
      notes: { i: $("#aNotes"), e: $("#aNotesErr"), ok: function (v) { return v.trim().length >= 15; }, msg: "Access, filing deadline, usage" }
    };
    var status = $("#aStatus"), touched = false;
    function check(k) {
      var x = f[k]; if (!x.i) return true;
      var ok = x.ok(x.i.value);
      x.e.textContent = ok ? "" : x.msg;
      x.i.classList.toggle("invalid", !ok);
      x.i.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    Object.keys(f).forEach(function (k) {
      if (!f[k].i) return;
      f[k].i.addEventListener("blur", function () { check(k); });
      f[k].i.addEventListener("input", function () { if (touched) check(k); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      touched = true;
      var good = Object.keys(f).map(check).every(Boolean);
      if (!good) {
        status.textContent = "Some fields still need an answer.";
        status.classList.add("warn");
        var bad = Object.keys(f).map(function (k) { return f[k].i; }).filter(function (i) { return i && i.classList.contains("invalid"); })[0];
        if (bad) bad.focus();
        return;
      }
      status.classList.remove("warn");
      status.textContent = "Assignment ready: " + $("#aOutlet").value.trim() + ", " + $("#aDates").value.trim() + ". Copy it into an email — nothing has been sent from this page.";
    });
  }

  /* ---------- the night meter ---------- */
  var canvas = $("#nightCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  if (!ctx) return;

  var SCENES = {
    sodium: { ev: 6, name: "sodium street" },
    float: { ev: 7, name: "float floodlight" },
    shadow: { ev: 4, name: "side-street shadow" },
    band: { ev: 5, name: "brass band" },
    dawn: { ev: 9, name: "Zulu morning" }
  };
  var el = {
    form: $("#meterForm"), scene: $("#scene"), iso: $("#iso"), aperture: $("#aperture"),
    shutter: $("#shutter"), subject: $("#subject"), flash: $("#flash"), lens: $("#lens"),
    distance: $("#distance"), distOut: $("#distOut"),
    offset: $("#outOffset"), smear: $("#outSmear"), flashOut: $("#outFlash"), grain: $("#outGrain"),
    grainNote: $("#grainNote"), verdict: $("#verdict"),
    exifLens: $("#exifLens"), exifExpo: $("#exifExpo")
  };
  var state = null;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function readState() {
    var S = SCENES[el.scene.value] || SCENES.float;
    return {
      scene: S,
      iso: parseFloat(el.iso.value),
      n: parseFloat(el.aperture.value),
      t: parseFloat(el.shutter.value),
      v: parseFloat(el.subject.value),
      gn: parseFloat(el.flash.value),
      lens: parseFloat(el.lens.value),
      d: parseFloat(el.distance.value)
    };
  }

  function calc(s) {
    var camEV = Math.log2((s.n * s.n) / s.t) - Math.log2(s.iso / 100);
    var offset = s.scene.ev - camEV;              /* + means the frame is overexposed */
    var smearFull = s.lens * (s.v * s.t / s.d) * (6000 / 36); /* pixels on a 24 MP frame */
    var flashStops = s.gn ? Math.log2((s.gn * Math.sqrt(s.iso / 100)) / (s.n * s.d)) : null;
    var noise = s.iso <= 400 ? 1 : s.iso <= 800 ? 2 : s.iso <= 1600 ? 3.2 : s.iso <= 3200 ? 5 : s.iso <= 6400 ? 7.5 : 9.5;
    return { camEV: camEV, offset: offset, smear: smearFull, flashStops: flashStops, noise: noise };
  }

  function verdict(s, c) {
    var parts = [];
    if (Math.abs(c.offset) < 0.4) {
      parts.push("On the meter: " + s.scene.name + " at f/" + s.n + " and 1/" + Math.round(1 / s.t) + " with ISO " + s.iso + ".");
    } else if (c.offset > 0) {
      parts.push("Over by " + c.offset.toFixed(1) + " stops. The float will clip and the faces will go chalk; stop down or take the ISO lower.");
    } else {
      parts.push("Under by " + Math.abs(c.offset).toFixed(1) + " stops. The shadows will block up and the beads will disappear.");
    }
    if (c.smear > 60) parts.push("At this shutter a walking dancer travels " + Math.round(c.smear) + " pixels — hands and beads will ribbon.");
    else if (c.smear > 18) parts.push("Only " + Math.round(c.smear) + " pixels of travel: enough movement to keep the throw alive, still sharp at the face.");
    else parts.push("Very little movement: " + Math.round(c.smear) + (Math.round(c.smear) === 1 ? " pixel" : " pixels") + " of travel, so the frame will look almost staged.");
    if (c.flashStops !== null) {
      if (c.flashStops > 1.5) parts.push("The flash is " + c.flashStops.toFixed(1) + " stops hot at " + s.d + " m — turn it down two or three stops.");
      else if (c.flashStops < -1.5) parts.push("The flash barely reaches at " + s.d + " m; move closer or open up.");
      else parts.push("Flash sits close to ambient at " + s.d + " m.");
    } else {
      parts.push("No flash: everything depends on the parade light and your hands.");
    }
    if (c.noise >= 7.5) parts.push("Grain will be part of the picture, not a defect — at this ISO print small or lean into it.");
    return parts.join(" ");
  }

  function render() {
    var s = readState();
    state = s;
    var c = calc(s);
    el.distOut.textContent = s.d.toFixed(1).replace(".0", "") + " m";
    el.offset.textContent = (c.offset >= 0 ? "+" : "") + c.offset.toFixed(1);
    el.smear.textContent = Math.round(c.smear) + " px";
    el.flashOut.textContent = c.flashStops === null ? "off" : (c.flashStops >= 0 ? "+" : "") + c.flashStops.toFixed(1);
    el.grain.textContent = c.noise.toFixed(1);
    el.grainNote.textContent = c.noise < 3 ? "clean" : c.noise < 5 ? "fine" : c.noise < 7.5 ? "visible" : "heavy";
    el.exifLens.textContent = s.lens + " mm";
    el.exifExpo.textContent = "f/" + s.n + " · 1/" + Math.round(1 / s.t) + " · ISO " + s.iso;
    el.verdict.textContent = verdict(s, c);
    paint(c);
  }

  function paint(c) {
    if (!state) return;
    var s = state, W = 880, H = 520;
    var dawn = s.scene.ev >= 9;
    ctx.clearRect(0, 0, W, H);

    /* sky, by the scene */
    var bg = ctx.createLinearGradient(0, 0, 0, H);
    if (dawn) {
      bg.addColorStop(0, "#efc6a4");
      bg.addColorStop(.55, "#c9b39c");
      bg.addColorStop(1, "#8e8a86");
    } else if (s.scene.ev <= 4) {
      bg.addColorStop(0, "#10141f");
      bg.addColorStop(.6, "#0c0d13");
      bg.addColorStop(1, "#07070a");
    } else {
      bg.addColorStop(0, "#1c1722");
      bg.addColorStop(.55, "#171018");
      bg.addColorStop(1, "#0a090c");
    }
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    /* far roofline */
    ctx.fillStyle = dawn ? "rgba(74,68,84,.45)" : "rgba(6,6,9,.85)";
    ctx.beginPath();
    ctx.moveTo(0, 316);
    ctx.lineTo(70, 316); ctx.lineTo(70, 288); ctx.lineTo(122, 288); ctx.lineTo(122, 306);
    ctx.lineTo(196, 306); ctx.lineTo(196, 272); ctx.lineTo(250, 272); ctx.lineTo(250, 300);
    ctx.lineTo(330, 300); ctx.lineTo(330, 282); ctx.lineTo(390, 282); ctx.lineTo(390, 308);
    ctx.lineTo(470, 308); ctx.lineTo(470, 276); ctx.lineTo(540, 276); ctx.lineTo(540, 304);
    ctx.lineTo(640, 304); ctx.lineTo(640, 286); ctx.lineTo(700, 286); ctx.lineTo(700, 310);
    ctx.lineTo(790, 310); ctx.lineTo(790, 292); ctx.lineTo(850, 292); ctx.lineTo(850, 312);
    ctx.lineTo(W, 312); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fill();

    /* bokeh bulbs */
    var rnd = seeded(4711);
    var bokeh = [];
    var count = dawn ? 10 : 30;
    for (var i = 0; i < count; i++) {
      var bx = rnd() * W, by = 30 + rnd() * 300, br = 7 + rnd() * 26;
      var hue = rnd();
      bokeh.push({ x: bx, y: by, r: br, col: hue < .55 ? "255,176,58" : hue < .8 ? "201,163,255" : "127,209,185", a: dawn ? .05 : .05 + rnd() * .12 });
    }
    bokeh.forEach(function (b) {
      var g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, "rgba(" + b.col + "," + (b.a + .18) + ")");
      g.addColorStop(1, "rgba(" + b.col + ",0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
    });

    /* searchlights from the float */
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    var beam1 = ctx.createLinearGradient(610, 200, 210, 470);
    beam1.addColorStop(0, dawn ? "rgba(255,235,200,.22)" : "rgba(255,190,120,.16)");
    beam1.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = beam1;
    ctx.beginPath(); ctx.moveTo(610, 200); ctx.lineTo(160, 470); ctx.lineTo(330, 470); ctx.closePath(); ctx.fill();
    var beam2 = ctx.createLinearGradient(610, 200, 830, 450);
    beam2.addColorStop(0, dawn ? "rgba(255,235,200,.18)" : "rgba(255,190,120,.13)");
    beam2.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = beam2;
    ctx.beginPath(); ctx.moveTo(610, 200); ctx.lineTo(790, 450); ctx.lineTo(880, 450); ctx.closePath(); ctx.fill();
    ctx.restore();

    /* the float, off to the right */
    var fx = 610, fy = 330;
    var glow = ctx.createRadialGradient(fx, fy - 120, 10, fx, fy - 120, 270);
    glow.addColorStop(0, dawn ? "rgba(255,236,200,.35)" : "rgba(255,180,90,.28)");
    glow.addColorStop(1, "rgba(232,137,47,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.fillStyle = dawn ? "#3a2f36" : "#0d0a0e";
    ctx.beginPath();
    ctx.moveTo(fx - 176, fy + 46);
    ctx.bezierCurveTo(fx - 156, fy - 78, fx - 80, fy - 120, fx, fy - 118);
    ctx.bezierCurveTo(fx + 80, fy - 120, fx + 152, fy - 76, fx + 172, fy + 46);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = dawn ? "rgba(90,70,90,.5)" : "rgba(255,176,58,.28)";
    ctx.lineWidth = 2;
    ctx.stroke();
    /* canopy bulbs */
    ctx.fillStyle = dawn ? "rgba(120,90,80,.55)" : "#ffd89a";
    for (var b = 0; b < 10; b++) {
      var ang = Math.PI + (b / 9) * Math.PI;
      var bx2 = fx + Math.cos(ang) * 146;
      var by2 = fy - 18 + Math.sin(ang) * 96;
      ctx.beginPath(); ctx.arc(bx2, by2, dawn ? 2.4 : 3.4, 0, Math.PI * 2); ctx.fill();
    }
    /* rider silhouette on the float */
    ctx.fillStyle = dawn ? "#2a222a" : "#07060a";
    ctx.beginPath();
    ctx.moveTo(fx - 36, fy - 54);
    ctx.bezierCurveTo(fx - 34, fy - 118, fx + 34, fy - 118, fx + 36, fy - 54);
    ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(fx, fy - 112, 15, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    /* the dancer, with motion copies */
    var smearPx = Math.min(80, c.smear * (W / 6000) * 2.4);
    var copies = smearPx > 2 ? 5 : 1;
    var ink = dawn ? "#2c2530" : "#050507";
    for (var k = copies - 1; k >= 0; k--) {
      var dx = (k / Math.max(1, copies - 1)) * -smearPx;
      drawDancer(316 + dx, 292, k === 0 ? 1 : 0.12, 1.46, ink, dawn ? "#8a4b3f" : "#ffb03a");
    }

    /* bead strands from the raised hand */
    ctx.strokeStyle = dawn ? "rgba(150,80,70,.55)" : "rgba(201,163,255,.75)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(372, 218);
    ctx.bezierCurveTo(440, 160, 520, 178, 560, 232);
    ctx.stroke();
    ctx.strokeStyle = dawn ? "rgba(110,120,110,.5)" : "rgba(127,209,185,.65)";
    ctx.beginPath();
    ctx.moveTo(352, 240);
    ctx.bezierCurveTo(410, 196, 470, 204, 508, 244);
    ctx.stroke();
    ctx.fillStyle = dawn ? "#7a4a3f" : "#ffb03a";
    [[560, 232], [508, 244]].forEach(function (pt) {
      ctx.beginPath(); ctx.arc(pt[0], pt[1], 2.6, 0, Math.PI * 2); ctx.fill();
    });

    /* confetti */
    var conf = seeded(88);
    var confColours = dawn ? ["#a35c4a", "#8a7a5a", "#5a6a6a"] : ["#c9a3ff", "#7fd1b9", "#ffb03a", "#e2543f"];
    for (var cf = 0; cf < 46; cf++) {
      ctx.save();
      ctx.globalAlpha = .35 + conf() * .4;
      ctx.fillStyle = confColours[Math.floor(conf() * confColours.length)];
      ctx.translate(conf() * W, 40 + conf() * 330);
      ctx.rotate(conf() * Math.PI);
      ctx.fillRect(0, 0, 3 + conf() * 3, 2);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    /* crowd foreground */
    ctx.fillStyle = dawn ? "#241f28" : "#07070a";
    ctx.beginPath();
    ctx.moveTo(0, 430);
    for (var x = 0; x <= W; x += 46) {
      ctx.quadraticCurveTo(x + 23, 398 - ((x / 46) % 3) * 7, x + 46, 428);
    }
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
    for (var hx = 30; hx < W; hx += 90) {
      ctx.beginPath(); ctx.arc(hx, 418, 15, 0, Math.PI * 2); ctx.fill();
    }

    /* exposure overlay */
    if (c.offset > 0.15) {
      ctx.fillStyle = "rgba(255,238,205," + Math.min(.24, c.offset * .05) + ")";
      ctx.fillRect(0, 0, W, H);
    } else if (c.offset < -0.15) {
      ctx.fillStyle = "rgba(0,0,0," + Math.min(.55, Math.abs(c.offset) * .09) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    /* grain */
    var grainCount = Math.round(c.noise * 420);
    var gr = seeded(99);
    ctx.fillStyle = "#f2ecdf";
    for (var gI = 0; gI < grainCount; gI++) {
      ctx.globalAlpha = 0.04 + gr() * 0.14;
      ctx.fillRect(gr() * W, gr() * H, 1.4, 1.4);
    }
    ctx.globalAlpha = 1;

    /* histogram */
    var hx2 = W - 236, hy = 24, hw = 212, hh = 88;
    ctx.fillStyle = "rgba(8,8,10,.72)";
    ctx.fillRect(hx2, hy, hw, hh);
    ctx.strokeStyle = "rgba(242,236,223,.18)";
    ctx.strokeRect(hx2, hy, hw, hh);
    var shift = Math.max(-40, Math.min(40, c.offset * 14));
    var hr = seeded(2024);
    for (var barI = 0; barI < 32; barI++) {
      var centre = hw / 2 + shift;
      var d = Math.abs(barI * 6.6 + 3 - centre) / 48;
      var hgt = Math.max(2, (Math.exp(-d * d) * 0.78 + hr() * 0.16) * (hh - 12));
      ctx.fillStyle = "rgba(255,176,58,.72)";
      ctx.fillRect(hx2 + 4 + barI * 6.4, hy + hh - 4 - hgt, 4.4, hgt);
    }
    ctx.fillStyle = "rgba(242,236,223,.55)";
    ctx.font = "9px 'Space Mono', monospace";
    ctx.fillText("RGB", hx2 + 6, hy + 12);

    /* frame marks + caption */
    ctx.strokeStyle = dawn ? "rgba(40,35,40,.5)" : "rgba(242,236,223,.45)";
    ctx.lineWidth = 1;
    [[20, 20, 1, 1], [W - 20, 20, -1, 1], [20, H - 20, 1, -1], [W - 20, H - 20, -1, -1]].forEach(function (m) {
      ctx.beginPath();
      ctx.moveTo(m[0], m[1] + 18 * m[3]); ctx.lineTo(m[0], m[1]); ctx.lineTo(m[0] + 18 * m[2], m[1]);
      ctx.stroke();
    });
    ctx.fillStyle = dawn ? "rgba(40,35,40,.75)" : "rgba(242,236,223,.6)";
    ctx.font = "9px 'Space Mono', monospace";
    ctx.fillText("PREVIEW · " + (s.gn ? "FLASH ON" : "AMBIENT") + " · " + s.scene.name.toUpperCase(), 28, 40);
    ctx.fillText((c.offset >= 0 ? "+" : "") + c.offset.toFixed(1) + " EV · " + Math.round(c.smear) + " PX", 28, H - 28);
  }

  function drawDancer(x, y, alpha, scale, ink, accent) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    /* skirt */
    ctx.fillStyle = ink;
    ctx.beginPath();
    ctx.moveTo(-46, 178);
    ctx.bezierCurveTo(-22, 96, -16, 46, 0, 24);
    ctx.bezierCurveTo(16, 46, 22, 96, 46, 178);
    ctx.closePath();
    ctx.fill();

    /* torso and head */
    ctx.beginPath();
    ctx.moveTo(-18, 34);
    ctx.bezierCurveTo(-22, 6, 22, 6, 18, 34);
    ctx.lineTo(16, 76);
    ctx.lineTo(-16, 76);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, -8, 15, 0, Math.PI * 2);
    ctx.fill();

    /* raised arm */
    ctx.strokeStyle = ink;
    ctx.lineWidth = 9;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(14, 34);
    ctx.lineTo(34, -4);
    ctx.lineTo(40, -40);
    ctx.stroke();

    /* crown of feathers */
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    for (var i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, -18);
      ctx.quadraticCurveTo(i * 14, -62, i * 20, -86);
      ctx.stroke();
    }
    ctx.fillStyle = accent;
    for (var j = -2; j <= 2; j++) {
      ctx.beginPath();
      ctx.arc(j * 20, -86, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function seeded(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function resize() {
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var k = (rect.width / 880) * dpr;
    canvas.width = Math.round(880 * k);
    canvas.height = Math.round(520 * k);
    ctx.setTransform(k, 0, 0, k, 0, 0);
    render();
  }

  ["change", "input"].forEach(function (evt) {
    el.form.addEventListener(evt, function (e) {
      if (e.target === el.distance || e.target.tagName === "SELECT") render();
    });
  });
  el.form.addEventListener("submit", function (e) { e.preventDefault(); });

  var presets = {
    muses: { scene: "float", iso: "6400", aperture: "2", shutter: "0.0167", subject: "1.2", flash: "0", lens: "35", distance: "6" },
    indians: { scene: "shadow", iso: "800", aperture: "2", shutter: "0.004", subject: "0.2", flash: "24", lens: "85", distance: "3" },
    zulu: { scene: "dawn", iso: "400", aperture: "4", shutter: "0.002", subject: "0.7", flash: "0", lens: "24", distance: "8" }
  };
  $$("[data-preset]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var p = presets[btn.getAttribute("data-preset")];
      if (!p) return;
      Object.keys(p).forEach(function (k) { if (el[k]) el[k].value = p[k]; });
      $$("[data-preset]").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
      render();
    });
  });

  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener("resize", resize);

  render();
  resize();
})();

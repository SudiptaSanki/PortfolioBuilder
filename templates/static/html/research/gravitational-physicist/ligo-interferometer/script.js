/* ============================================================
   Castellano Detector Characterisation — page script
   Sound ruling: ONE user-started schematic teaching sweep in
   the chirp panel (sonification is a real teaching practice in
   this field). It is labelled schematic everywhere it appears,
   is slowed and pitch-shifted, and is never presented as data.
   Nothing autoplays; nothing sounds on hover.
   ============================================================ */
(function () {
  "use strict";

  /* Cross-document view transitions: Chrome surfaces an aborted
     transition as an unhandled rejection. Swallow only that one. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- mobile menu ---------------- */
  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("mobilePanel");
  if (menuBtn && panel) {
    var panelLinks = panel.querySelectorAll("a");
    function setMenu(open) {
      panel.classList.toggle("open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.classList.toggle("locked", open);
      if (open) {
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            if (panelLinks.length) panelLinks[0].focus();
          });
        });
      }
    }
    menuBtn.addEventListener("click", function () {
      setMenu(!panel.classList.contains("open"));
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) {
        setMenu(false);
        menuBtn.focus();
      }
    });
    panelLinks.forEach(function (a) {
      a.addEventListener("click", function () { setMenu(false); });
    });
  }

  /* ============================================================
     NOISE BUDGET EXPLORER (index)
     One model, three readers: the drawn curves, the band
     readout and the printed table all come from these functions,
     so they cannot disagree.
     Units: amplitude spectral density, x1e-24 strain / sqrt(Hz).
     Schematic budget in the shape of a 4 km detector's.
     ============================================================ */
  var NOISE = {
    seis:  { name: "Seismic",  color: "#b3401e", fn: function (f) { return 6000 * Math.pow(10 / f, 4); } },
    therm: { name: "Thermal",  color: "#96690d", fn: function (f) { return 4 + 260 * Math.pow(12 / f, 2) + 9 * Math.pow(f / 900, 2); } },
    quant: { name: "Quantum",  color: "#14665f", fn: function (f) { return Math.hypot(26000 / (f * f), 0.022 * f); } }
  };
  var FLOOR = { name: "Everything else", color: "#59626e", value: 2.5 };
  var BANDS = [
    { range: "10–40 Hz",    rep: 20,   why: {
      Seismic: "The ground itself. Microseisms, weather, traffic and trains move the test masses more than any signal could — which is why the band below ~10 Hz is a wall, not a slope.",
      Thermal: "With the ground quieted, suspension thermal noise — the mirrors' own pendulum modes jiggling with heat — sets the floor here.",
      Quantum: "Radiation-pressure noise: the laser light itself pushing on the mirrors, hardest at low frequencies where the light has time to push.",
      "Everything else": "No single source leads here once the big three are dealt with — the remaining budget is a crowd of small terms." } },
    { range: "40–300 Hz",   rep: 110,  why: {
      Seismic: "Seismic noise, unusually, still leads here — in this budget the ground isolation is the weak link in the most sensitive band.",
      Thermal: "The money band, and heat owns it: thermal fluctuations in the mirror coatings blur the surface the laser reads. Most signals sweep through here.",
      Quantum: "Quantum noise leads the money band in this budget — photon counting statistics above, radiation pressure below.",
      "Everything else": "No single source leads the money band in this budget — a crowd of small terms shares it." } },
    { range: "300–5,000 Hz", rep: 1200, why: {
      Seismic: "Seismic noise at high frequency is almost unheard of — it would mean the isolation stack is resonating. A finding, not a budget line.",
      Thermal: "Coating thermal noise's high-frequency tail leads here in this budget — the mirrors' surfaces are the limit even at a kilohertz.",
      Quantum: "Shot noise: at high frequencies there are fewer photons per measurement interval, so the counting statistics of light itself set the floor.",
      "Everything else": "No single source leads here in this budget — the top end is shared between small terms." } }
  ];

  var svg = document.getElementById("noiseSvg");
  if (svg) {
    var NS = "http://www.w3.org/2000/svg";
    var W = 720, H = 430, L = 64, R = 14, T = 16, B = 48;
    var FMIN = 10, FMAX = 5000, YMIN = 1, YMAX = 10000;
    function X(f) { return L + (Math.log10(f) - Math.log10(FMIN)) / (Math.log10(FMAX) - Math.log10(FMIN)) * (W - L - R); }
    function Y(v) { return T + (Math.log10(YMAX) - Math.log10(Math.max(v, YMIN))) / (Math.log10(YMAX) - Math.log10(YMIN)) * (H - T - B); }
    function el(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      return n;
    }
    function pathFor(fn) {
      var d = "", N = 90, i, f, v;
      for (i = 0; i <= N; i++) {
        f = FMIN * Math.pow(FMAX / FMIN, i / N);
        v = fn(f);
        d += (i === 0 ? "M" : "L") + X(f).toFixed(1) + " " + Y(v).toFixed(1) + " ";
      }
      return d;
    }
    /* grid + axes */
    [10, 100, 1000].forEach(function (f) {
      svg.appendChild(el("line", { x1: X(f), y1: T, x2: X(f), y2: H - B, stroke: "#ddd7c6", "stroke-width": 1 }));
      var t = el("text", { x: X(f), y: H - B + 20, "text-anchor": "middle", "font-size": 12, fill: "#59626e", "font-family": "IBM Plex Mono, monospace" });
      t.textContent = f >= 1000 ? (f / 1000) + "k" : String(f);
      svg.appendChild(t);
    });
    [1, 10, 100, 1000, 10000].forEach(function (v) {
      svg.appendChild(el("line", { x1: L, y1: Y(v), x2: W - R, y2: Y(v), stroke: "#ddd7c6", "stroke-width": 1 }));
      var t = el("text", { x: L - 8, y: Y(v) + 4, "text-anchor": "end", "font-size": 12, fill: "#59626e", "font-family": "IBM Plex Mono, monospace" });
      t.textContent = String(v);
      svg.appendChild(t);
    });
    var ax = el("text", { x: (L + W - R) / 2, y: H - 8, "text-anchor": "middle", "font-size": 12, fill: "#59626e", "font-family": "IBM Plex Mono, monospace" });
    ax.textContent = "FREQUENCY (Hz)";
    svg.appendChild(ax);
    var ay = el("text", { x: 16, y: (T + H - B) / 2, "text-anchor": "middle", "font-size": 12, fill: "#59626e", "font-family": "IBM Plex Mono, monospace", transform: "rotate(-90 16 " + ((T + H - B) / 2) + ")" });
    ay.textContent = "STRAIN NOISE (×10⁻²⁴ /√Hz)";
    svg.appendChild(ay);

    var paths = {};
    ["seis", "therm", "quant"].forEach(function (key) {
      var p = el("path", { d: pathFor(NOISE[key].fn), fill: "none", stroke: NOISE[key].color, "stroke-width": 2, "stroke-dasharray": "5 4", opacity: 0.9 });
      svg.appendChild(p);
      paths[key] = p;
    });
    var totalPath = el("path", { d: "", fill: "none", stroke: "#274690", "stroke-width": 3 });
    svg.appendChild(totalPath);

    var state = { seis: true, therm: true, quant: true };
    function totalAt(f) {
      var sum = FLOOR.value * FLOOR.value;
      for (var k in NOISE) if (state[k]) { var v = NOISE[k].fn(f); sum += v * v; }
      return Math.sqrt(sum);
    }
    function dominant(f) {
      var best = { name: FLOOR.name, color: FLOOR.color, v: FLOOR.value };
      for (var k in NOISE) if (state[k]) {
        var v = NOISE[k].fn(f);
        if (v > best.v) best = { name: NOISE[k].name, color: NOISE[k].color, v: v };
      }
      return best;
    }
    var bandCells = {
      low:  { src: document.getElementById("bandLowSource"),  asd: document.getElementById("bandLowAsd"),  why: document.getElementById("bandLowWhy") },
      mid:  { src: document.getElementById("bandMidSource"),  asd: document.getElementById("bandMidAsd"),  why: document.getElementById("bandMidWhy") },
      high: { src: document.getElementById("bandHighSource"), asd: document.getElementById("bandHighAsd"), why: document.getElementById("bandHighWhy") }
    };
    var cellKeys = ["low", "mid", "high"];
    function fmt(v) { return v >= 100 ? Math.round(v).toString() : (Math.round(v * 10) / 10).toString(); }
    function render() {
      for (var k in NOISE) paths[k].style.display = state[k] ? "" : "none";
      totalPath.setAttribute("d", pathFor(totalAt));
      BANDS.forEach(function (band, i) {
        var d = dominant(band.rep);
        var cell = bandCells[cellKeys[i]];
        if (!cell.src) return;
        cell.src.innerHTML = "";
        var dot = document.createElement("span");
        dot.className = "dot";
        dot.style.background = d.color;
        cell.src.appendChild(dot);
        cell.src.appendChild(document.createTextNode(d.name));
        cell.asd.textContent = "≈ " + fmt(d.v) + " ×10⁻²⁴ /√Hz at " + band.rep + " Hz";
        cell.why.textContent = band.why[d.name];
      });
      var tl = document.getElementById("totalLine");
      if (tl) {
        tl.innerHTML = "Total noise at 110 Hz, the heart of the band: <b>" + fmt(totalAt(110)) + " ×10⁻²⁴ /√Hz</b> — the sources add in quadrature, which is why killing the biggest one matters more than polishing the rest.";
      }
    }
    document.querySelectorAll(".toggle-btn[data-noise]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-noise");
        state[key] = !state[key];
        btn.setAttribute("aria-pressed", state[key] ? "true" : "false");
        render();
      });
    });
    render();
  }

  /* ============================================================
     CHIRP PANEL — one schematic teaching sweep (index)
     ============================================================ */
  var playBtn = document.getElementById("chirpPlay");
  if (playBtn) {
    var status = document.getElementById("chirpStatus");
    var head = document.getElementById("chirpHead");
    var actx = null, playing = false, raf = 0, startedAt = 0;
    var DUR = 1600; /* ms — the real 0.2 s sweep slowed x8 */
    function setStatus(t) { if (status) status.textContent = t; }
    function stopHead() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (head) head.setAttribute("x1", 70); if (head) head.setAttribute("x2", 70);
    }
    function animateHead() {
      if (!playing || !head) return;
      var p = Math.min((performance.now() - startedAt) / DUR, 1);
      var x = 70 + p * (690 - 70);
      head.setAttribute("x1", x); head.setAttribute("x2", x);
      if (p < 1) raf = requestAnimationFrame(animateHead);
    }
    playBtn.addEventListener("click", function () {
      if (playing) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { setStatus("This browser has no Web Audio — the track above is the lesson; the sound is only its echo."); return; }
      if (!actx) actx = new AC();
      if (actx.state === "suspended") actx.resume();
      playing = true;
      playBtn.disabled = true;
      setStatus("Playing: schematic sweep, 70 → 300 Hz over 1.6 s (real chirp: 35 → 150 Hz in ~0.2 s).");
      var t0 = actx.currentTime + 0.03;
      var osc = actx.createOscillator();
      var gain = actx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(70, t0);
      osc.frequency.exponentialRampToValueAtTime(300, t0 + DUR / 1000);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + DUR / 1000);
      osc.connect(gain); gain.connect(actx.destination);
      osc.start(t0); osc.stop(t0 + DUR / 1000 + 0.05);
      startedAt = performance.now();
      if (!reduced) animateHead();
      osc.onended = function () {
        playing = false;
        playBtn.disabled = false;
        stopHead();
        setStatus("Finished. That rising shape — frequency and loudness climbing together into merger — is the chirp. Schematic only: not detector data.");
      };
    });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && actx && actx.state === "running") actx.suspend();
    });
  }

  /* ============================================================
     CONTACT FORM — demonstration only, transmits nothing
     ============================================================ */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmBox = document.getElementById("confirmBox");
    var refOut = document.getElementById("confirmRef");
    var echoOut = document.getElementById("confirmEcho");
    function fieldOf(input) { return input.closest(".field"); }
    function validate(input) {
      var f = fieldOf(input);
      if (!f) return true;
      var ok = true;
      var v = (input.value || "").trim();
      if (input.hasAttribute("required") && !v) ok = false;
      if (ok && input.type === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) ok = false;
      f.classList.toggle("invalid", !ok);
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    var inputs = form.querySelectorAll("input, select, textarea");
    inputs.forEach(function (input) {
      input.addEventListener("input", function () { validate(input); });
      input.addEventListener("change", function () { validate(input); });
    });
    /* preselect engagement type from ?type= */
    try {
      var q = new URLSearchParams(window.location.search).get("type");
      var typeSel = document.getElementById("fType");
      if (q && typeSel) {
        for (var i = 0; i < typeSel.options.length; i++) {
          if (typeSel.options[i].value === q) { typeSel.value = q; break; }
        }
      }
    } catch (e) { /* no-op */ }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var allOk = true, firstBad = null;
      inputs.forEach(function (input) {
        if (!validate(input)) { allOk = false; if (!firstBad) firstBad = input; }
      });
      if (!allOk) { if (firstBad) firstBad.focus(); return; }
      var name = document.getElementById("fName").value.trim();
      var typeText = "";
      var ts = document.getElementById("fType");
      if (ts) typeText = ts.options[ts.selectedIndex].text;
      var ref = "CC-2026-" + (100 + Math.floor(Math.random() * 900));
      if (refOut) refOut.textContent = ref;
      if (echoOut) echoOut.textContent = "Thank you, " + name + ". Your " + typeText.toLowerCase() + " enquiry is logged with reference " + ref + ". On a live site this would now be on its way; this demonstration form transmits nothing, so please also use the email address on this page for anything urgent.";
      form.style.display = "none";
      if (confirmBox) {
        confirmBox.classList.add("show");
        confirmBox.setAttribute("tabindex", "-1");
        confirmBox.focus();
      }
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        inputs.forEach(function (input) {
          var f = fieldOf(input);
          if (f) f.classList.remove("invalid");
          input.setAttribute("aria-invalid", "false");
        });
        if (confirmBox) confirmBox.classList.remove("show");
        form.style.display = "";
        var first = document.getElementById("fName");
        if (first) first.focus();
      });
    }
  }
})();

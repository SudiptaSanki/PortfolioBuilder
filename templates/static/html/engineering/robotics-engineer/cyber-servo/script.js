/* ============================================================
   VOGEL MOTION CONTROL — script.js
   Sound ruling: NONE. Motion control is not a sound profession
   and a servo noise teaches nothing; the stub's click synth was
   decoration and has been removed, not rebuilt.
   ============================================================ */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* --- View-transition abort guard ----------------------------------
     Cross-document view transitions that Chrome aborts surface as an
     unhandled InvalidStateError rejection; the navigation itself has
     already completed. Swallow ONLY that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Mobile menu: the log-sheet panel ---------------------------- */
  var menuBtn = document.getElementById("menuBtn");
  var panel = document.getElementById("mobilePanel");
  if (menuBtn && panel) {
    var closeBtn = document.getElementById("panelClose");
    var firstLink = panel.querySelector("a.plink");
    function openPanel() {
      panel.classList.add("open");
      menuBtn.setAttribute("aria-expanded", "true");
      document.documentElement.classList.add("lock");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      });
    }
    function closePanel(returnFocus) {
      panel.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      document.documentElement.classList.remove("lock");
      if (returnFocus) menuBtn.focus();
    }
    menuBtn.addEventListener("click", openPanel);
    if (closeBtn) closeBtn.addEventListener("click", function () { closePanel(true); });
    panel.addEventListener("click", function (e) { if (e.target === panel) closePanel(true); });
    panel.querySelectorAll("a.plink").forEach(function (a) {
      a.addEventListener("click", function () { closePanel(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel(true);
    });
  }

  /* --- Reveal on scroll (opacity only, has one job: pace the log) -- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length && !reduced && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ================================================================
     THE TUNING BENCH
     One data model drives the scope traces AND the readout sheet;
     the printed bench card in the HTML carries the same numbers,
     and the verification probe cross-checks all three.
     Axis: bench rig Axis 2, position loop, 100% step command.
     ================================================================ */
  var PRESETS = {
    under: {
      name: "Under-damped", tag: "gains too hot",
      kp: "42.0", ki: "18.0", kd: "0.40",
      over: "28%", rise: "0.19 s", settle: "1.1 s", sse: "0%",
      feel: "<strong>Arrives early and argues about it.</strong> The gripper buzzes at the end of every move, parts land past the pocket and bounce, and the motor runs hot correcting errors it made itself. Fast on the trace, scrap in the bin.",
      pts: [[0,0],[0.05,16],[0.10,42],[0.15,70],[0.20,93],[0.25,110],[0.30,121],[0.35,128],[0.40,124],[0.45,114],[0.50,103],[0.55,95],[0.60,91],[0.65,94],[0.70,99],[0.75,104],[0.80,106],[0.85,104],[0.90,101],[0.95,98.5],[1.00,97.5],[1.10,98.5],[1.20,100.5],[1.30,101],[1.40,100.3],[1.50,100],[1.75,100],[2.00,100]]
    },
    tuned: {
      name: "Tuned", tag: "the tune that ships",
      kp: "26.0", ki: "12.0", kd: "1.80",
      over: "≈ 2%", rise: "0.22 s", settle: "0.35 s", sse: "0%",
      feel: "<strong>One clean move.</strong> A breath of overshoot you can measure but not hear, then the axis sits still and holds against disturbance. No buzz, no creep, cycle time intact. This is the tune that ships.",
      pts: [[0,0],[0.05,10],[0.10,32],[0.15,55],[0.20,74],[0.25,87],[0.30,95],[0.35,99],[0.40,100.8],[0.45,101.8],[0.50,101.2],[0.55,100.5],[0.60,100.1],[0.70,100],[0.85,100],[1.00,100],[1.50,100],[2.00,100]]
    },
    over: {
      name: "Over-damped", tag: "gains too cautious",
      kp: "9.0", ki: "6.0", kd: "2.60",
      over: "0%", rise: "0.92 s", settle: "1.5 s", sse: "0%",
      feel: "<strong>Nothing vibrates, nothing overshoots — and nothing is on time.</strong> The axis creeps the last stretch of every move, the cycle budget bleeds a tenth of a second at a time, and the controller waits on a machine that is being careful.",
      pts: [[0,0],[0.10,4],[0.20,12],[0.30,24],[0.40,37],[0.50,49],[0.60,59],[0.70,68],[0.80,75],[0.90,81],[1.00,86],[1.10,90],[1.20,93],[1.30,95.5],[1.40,97],[1.50,98],[1.60,98.8],[1.70,99.3],[1.80,99.6],[2.00,99.9]]
    }
  };
  /* scope geometry: x = 58 + t*282 (0–2 s), y = 302 − pct*1.83 (0–140%) */
  function X(t) { return 58 + t * 282; }
  function Y(p) { return 302 - p * 1.83; }
  function smoothPath(pts) {
    var d = "M " + X(pts[0][0]).toFixed(1) + " " + Y(pts[0][1]).toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      var c1x = X(p1[0]) + (X(p2[0]) - X(p0[0])) / 6, c1y = Y(p1[1]) + (Y(p2[1]) - Y(p0[1])) / 6;
      var c2x = X(p2[0]) - (X(p3[0]) - X(p1[0])) / 6, c2y = Y(p2[1]) - (Y(p3[1]) - Y(p1[1])) / 6;
      d += " C " + c1x.toFixed(1) + " " + c1y.toFixed(1) + ", " + c2x.toFixed(1) + " " + c2y.toFixed(1) + ", " + X(p2[0]).toFixed(1) + " " + Y(p2[1]).toFixed(1);
    }
    return d;
  }
  var bench = document.getElementById("bench");
  if (bench) {
    var paths = {
      under: document.getElementById("path-under"),
      tuned: document.getElementById("path-tuned"),
      over: document.getElementById("path-over")
    };
    Object.keys(PRESETS).forEach(function (k) {
      if (paths[k]) paths[k].setAttribute("d", smoothPath(PRESETS[k].pts));
    });
    var peakDot = document.getElementById("peakDot");
    var peakLabel = document.getElementById("peakLabel");
    var ro = {
      name: document.getElementById("ro-name"),
      tag: document.getElementById("ro-tag"),
      gains: document.getElementById("ro-gains"),
      over: document.getElementById("ro-over"),
      rise: document.getElementById("ro-rise"),
      settle: document.getElementById("ro-settle"),
      sse: document.getElementById("ro-sse"),
      feel: document.getElementById("ro-feel")
    };
    var buttons = bench.querySelectorAll(".preset");
    var cardRows = document.querySelectorAll(".bench-card tbody tr");
    function selectPreset(key) {
      var p = PRESETS[key];
      if (!p) return;
      Object.keys(paths).forEach(function (k) {
        if (paths[k]) paths[k].classList.toggle("sel", k === key);
      });
      buttons.forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-preset") === key ? "true" : "false");
      });
      cardRows.forEach(function (r) {
        if (r.getAttribute("data-preset") === key) r.setAttribute("aria-current", "true");
        else r.removeAttribute("aria-current");
      });
      if (key === "under") {
        peakDot.setAttribute("cx", X(0.35)); peakDot.setAttribute("cy", Y(128));
        peakDot.style.display = ""; peakLabel.style.display = "";
      } else {
        peakDot.style.display = "none"; peakLabel.style.display = "none";
      }
      ro.name.textContent = p.name;
      ro.tag.textContent = p.tag;
      ro.gains.textContent = "Kp " + p.kp + " · Ki " + p.ki + " · Kd " + p.kd;
      ro.over.textContent = p.over;
      ro.rise.textContent = p.rise;
      ro.settle.textContent = p.settle;
      ro.sse.textContent = p.sse;
      ro.feel.innerHTML = p.feel;
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { selectPreset(b.getAttribute("data-preset")); });
    });
    selectPreset("tuned");
  }

  /* ================================================================
     TORQUE CALCULATOR — τ = m · g · r, design torque at SF × 2.
     A sizing signal, never a quotation (research rule).
     ================================================================ */
  var tqM = document.getElementById("tq-mass");
  var tqR = document.getElementById("tq-radius");
  if (tqM && tqR) {
    var tqMV = document.getElementById("tq-mass-val");
    var tqRV = document.getElementById("tq-radius-val");
    var tqStatic = document.getElementById("tq-static");
    var tqDesign = document.getElementById("tq-design");
    var tqVerdict = document.getElementById("tq-verdict");
    var G = 9.81, SF = 2;
    function fmt(n) { return (Math.round(n * 10) / 10).toFixed(1); }
    function calc() {
      var m = parseFloat(tqM.value), r = parseFloat(tqR.value);
      var stat = m * G * r, des = stat * SF;
      tqMV.textContent = fmt(m) + " kg";
      tqRV.textContent = r.toFixed(2) + " m";
      tqStatic.textContent = fmt(stat) + " N·m";
      tqDesign.textContent = fmt(des) + " N·m";
      tqVerdict.textContent = "Size this axis for at least " + fmt(des) + " N·m continuous, then add acceleration torque for your move profile on top — gravity is only the part that never switches off.";
    }
    tqM.addEventListener("input", calc);
    tqR.addEventListener("input", calc);
    calc();
  }

  /* ================================================================
     CONTACT FORM — demonstration form. Nothing is transmitted;
     the label on the page says so. Confirmation ref is derived
     deterministically from the entered details.
     ================================================================ */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var done = document.getElementById("cf-done");
    var refEl = document.getElementById("cf-ref");
    var again = document.getElementById("cf-again");
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById("cf-type");
    var wanted = params.get("type");
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    function field(id) { return document.getElementById(id); }
    function setErr(input, errId, bad) {
      var e = document.getElementById(errId);
      if (e) e.classList.toggle("on", bad);
      if (bad) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
      return !bad;
    }
    ["cf-name", "cf-email", "cf-msg"].forEach(function (id) {
      var el = field(id);
      if (el) el.addEventListener("input", function () {
        el.removeAttribute("aria-invalid");
        var e = document.getElementById("err-" + id.slice(3));
        if (e) e.classList.remove("on");
      });
    });
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var name = field("cf-name"), email = field("cf-email"), msg = field("cf-msg");
      var ok = true;
      ok = setErr(name, "err-name", !name.value.trim()) && ok;
      ok = setErr(email, "err-email", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) && ok;
      ok = setErr(msg, "err-msg", !msg.value.trim()) && ok;
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var s = name.value.trim() + "|" + email.value.trim() + "|" + msg.value.trim();
      var h = 0;
      for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
      var ref = "KV-2026-" + (100 + (h % 900));
      if (refEl) refEl.textContent = ref;
      form.style.display = "none";
      if (done) { done.classList.add("on"); done.setAttribute("tabindex", "-1"); done.focus(); }
    });
    if (again) again.addEventListener("click", function () {
      form.reset();
      form.style.display = "";
      if (done) done.classList.remove("on");
      var n = field("cf-name"); if (n) n.focus();
    });
  }
})();

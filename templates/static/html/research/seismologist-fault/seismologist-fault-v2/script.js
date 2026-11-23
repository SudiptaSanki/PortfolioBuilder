/* FAULTLINE — station log interactions.
   The explorer runs on the printed relation log10 E = 4.8 + 1.5M.
   The estimator runs on the printed fee table. Nothing here invents
   a number the page does not also print. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when interrupted;
     swallow only that specific rejection so the console stays clean. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" &&
        /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var GBP = function (n) { return "£" + n.toLocaleString("en-GB"); };
  var NUM = function (n) { return n.toLocaleString("en-GB"); };

  /* ---------- mobile log-index panel ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var panel = document.getElementById("logPanel");
  if (menuBtn && panel) {
    var closeBtn = document.getElementById("logClose");
    var openPanel = function () {
      panel.removeAttribute("hidden");
      /* focus inside the rAF after .open — focusing while the panel is
         still visibility:hidden is a silent no-op */
      requestAnimationFrame(function () {
        panel.classList.add("open");
        menuBtn.setAttribute("aria-expanded", "true");
        var first = panel.querySelector(".lp-link") || closeBtn;
        if (first) first.focus();
      });
    };
    var closePanel = function () {
      panel.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
      window.setTimeout(function () { panel.setAttribute("hidden", ""); }, 60);
      menuBtn.focus();
    };
    menuBtn.addEventListener("click", openPanel);
    if (closeBtn) closeBtn.addEventListener("click", closePanel);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  /* ---------- reveal on scroll (log entries settle as read) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    }
  }

  /* ---------- magnitude–energy explorer ---------- */
  var magVal = document.getElementById("magValue");
  if (magVal) {
    var TNT_J = 4.184e9; /* printed on the page: 1 tonne TNT = 4.184 x 10^9 J */
    var mag = 6.0;
    var range = document.getElementById("magRange");
    var roLog = document.getElementById("roLog");
    var roJoules = document.getElementById("roJoules");
    var roTnt = document.getElementById("roTnt");
    var working = document.getElementById("expWorking");

    function sciParts(E) {
      var exp = Math.floor(Math.log10(E));
      var mant = E / Math.pow(10, exp);
      mant = Math.round(mant * 10) / 10;
      if (mant >= 10) { mant = 1.0; exp += 1; }
      return { mant: mant.toFixed(1), exp: exp };
    }
    function sup(n) {
      var map = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
                  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
      return String(n).split("").map(function (c) { return map[c] || c; }).join("");
    }
    function tntText(E) {
      var t = E / TNT_J;
      if (t < 1) return "≈ " + Math.round(t * 1000) + " kg TNT";
      if (t < 1000) return "≈ " + (Math.round(t * 10) / 10).toLocaleString("en-GB") + " tonnes TNT";
      if (t < 1e6) return "≈ " + (Math.round(t / 100) / 10).toLocaleString("en-GB") + " kt TNT";
      return "≈ " + (Math.round(t / 1e5) / 10).toLocaleString("en-GB") + " Mt TNT";
    }
    function renderMag() {
      var logE = 4.8 + 1.5 * mag;
      var E = Math.pow(10, logE);
      var p = sciParts(E);
      magVal.firstChild.nodeValue = mag.toFixed(1);
      if (range) range.value = mag.toFixed(1);
      roLog.textContent = logE.toFixed(2);
      roJoules.textContent = p.mant + " × 10" + sup(p.exp) + " J";
      roJoules.setAttribute("data-joules", E.toPrecision(4));
      roTnt.textContent = tntText(E);
      roTnt.setAttribute("data-tnt-tonnes", (E / TNT_J).toPrecision(4));
      working.textContent =
        "4.8 + 1.5 × " + mag.toFixed(1) + " = " + logE.toFixed(2) +
        "  →  E = 10^" + logE.toFixed(2) + " J  →  ÷ 4.184 × 10⁹ J/t for the TNT figure";
      document.querySelectorAll("table.data tr[data-mag]").forEach(function (tr) {
        tr.classList.toggle("hl", Math.abs(parseFloat(tr.getAttribute("data-mag")) - mag) < 0.05);
      });
    }
    document.getElementById("magMinus").addEventListener("click", function () {
      mag = Math.max(1.0, Math.round((mag - 0.1) * 10) / 10); renderMag();
    });
    document.getElementById("magPlus").addEventListener("click", function () {
      mag = Math.min(9.0, Math.round((mag + 0.1) * 10) / 10); renderMag();
    });
    if (range) range.addEventListener("input", function () {
      mag = parseFloat(range.value); renderMag();
    });
    renderMag();

    /* ----- ratio: two magnitudes, one honest comparison ----- */
    var a = 6.0, b = 3.0;
    var aVal = document.getElementById("magAValue");
    var bVal = document.getElementById("magBValue");
    var ratioOut = document.getElementById("ratioOut");
    var ratioWorking = document.getElementById("ratioWorking");
    function fmtRatio(r) {
      if (r >= 100) return NUM(Math.round(r));
      if (r >= 10) return (Math.round(r * 10) / 10).toLocaleString("en-GB");
      return (Math.round(r * 100) / 100).toLocaleString("en-GB");
    }
    function renderRatio() {
      aVal.firstChild.nodeValue = a.toFixed(1);
      bVal.firstChild.nodeValue = b.toFixed(1);
      var d = Math.abs(a - b);
      var r = Math.pow(10, 1.5 * d);
      var hi = Math.max(a, b).toFixed(1), lo = Math.min(a, b).toFixed(1);
      ratioOut.textContent = "M " + hi + " ≈ " + fmtRatio(r) + "× M " + lo;
      ratioOut.setAttribute("data-ratio", r.toPrecision(5));
      ratioWorking.textContent =
        "10^(1.5 × |" + a.toFixed(1) + " − " + b.toFixed(1) + "|) = 10^" +
        (1.5 * d).toFixed(2) + " ≈ " + fmtRatio(r) + "×";
    }
    function bindPair(minusId, plusId, get, set) {
      document.getElementById(minusId).addEventListener("click", function () {
        set(Math.max(1.0, Math.round((get() - 0.1) * 10) / 10)); renderRatio();
      });
      document.getElementById(plusId).addEventListener("click", function () {
        set(Math.min(9.0, Math.round((get() + 0.1) * 10) / 10)); renderRatio();
      });
    }
    bindPair("magAMinus", "magAPlus", function () { return a; }, function (v) { a = v; });
    bindPair("magBMinus", "magBPlus", function () { return b; }, function (v) { b = v; });
    renderRatio();
  }

  /* ---------- programme estimator ---------- */
  var estTotal = document.getElementById("estTotalVal");
  if (estTotal) {
    var RATES = { lead: 780, field: 540, analyst: 460, hire: 95, telemetry: 120 };
    var TYPES = {
      densification: { days: { lead: 12, field: 20, analyst: 14 }, report: 1850 },
      catalogue:     { days: { lead: 8,  field: 0,  analyst: 22 }, report: 1400 },
      hazard:        { days: { lead: 10, field: 4,  analyst: 12 }, report: 1650 },
      deployment:    { days: { lead: 6,  field: 16, analyst: 6 },  report: 1200 }
    };
    var state = { type: "densification",
                  days: { lead: 12, field: 20, analyst: 14 },
                  stations: 8, report: 1850 };
    var qtyEls = {}, amtEls = {};
    ["lead", "field", "analyst", "stations"].forEach(function (k) {
      qtyEls[k] = document.getElementById("qty-" + k);
      amtEls[k] = document.getElementById("amt-" + k);
    });
    var reportAmt = document.getElementById("amt-report");
    var typeSel = document.getElementById("estType");

    function renderEst() {
      var total = 0, line;
      ["lead", "field", "analyst"].forEach(function (k) {
        line = state.days[k] * RATES[k]; total += line;
        qtyEls[k].textContent = state.days[k];
        amtEls[k].textContent = state.days[k] + " days × " + GBP(RATES[k]) + " = " + GBP(line);
      });
      line = state.stations * RATES.hire; total += line;
      qtyEls.stations.textContent = state.stations;
      amtEls.stations.textContent =
        state.stations + " stations × " + GBP(RATES.hire) + " hire + " +
        state.stations + " × " + GBP(RATES.telemetry) + " telemetry = " +
        GBP(line + state.stations * RATES.telemetry);
      total += state.stations * RATES.telemetry;
      total += state.report;
      reportAmt.textContent = "fixed for this study type = " + GBP(state.report);
      estTotal.textContent = GBP(total);
      estTotal.setAttribute("data-total", total);
    }
    document.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-step");
        var delta = parseInt(btn.getAttribute("data-delta"), 10);
        if (key === "stations") {
          state.stations = Math.min(40, Math.max(0, state.stations + delta));
        } else {
          state.days[key] = Math.min(90, Math.max(0, state.days[key] + delta));
        }
        renderEst();
      });
    });
    if (typeSel) typeSel.addEventListener("change", function () {
      var t = TYPES[typeSel.value];
      if (!t) return;
      state.type = typeSel.value;
      state.days = { lead: t.days.lead, field: t.days.field, analyst: t.days.analyst };
      state.report = t.report;
      renderEst();
    });
    renderEst();
  }

  /* ---------- enquiry form (demonstration — nothing is transmitted) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var conf = document.getElementById("confirmation");
    function setErr(id, msg) {
      var el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg || "";
      el.hidden = !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var email = document.getElementById("fEmail").value.trim();
      var msg = document.getElementById("fMsg").value.trim();
      var ok = true;
      if (name.length < 2) { setErr("errName", "LOG ENTRY INCOMPLETE — your name is needed."); ok = false; }
      else setErr("errName", "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setErr("errEmail", "LOG ENTRY INCOMPLETE — that email address does not parse."); ok = false;
      } else setErr("errEmail", "");
      if (msg.length < 20) {
        setErr("errMsg", "LOG ENTRY TOO SHORT — say what the ground is doing, in a sentence or two (20+ characters)."); ok = false;
      } else setErr("errMsg", "");
      if (!ok) return;
      var ref = "FLT-" + new Date().getFullYear() + "-" +
                Math.floor(1000 + Math.random() * 9000);
      document.getElementById("confRef").textContent = ref;
      document.getElementById("confType").textContent =
        document.getElementById("fType").selectedOptions[0].textContent;
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute("data-ref", ref);
      conf.scrollIntoView({ behavior: "smooth", block: "center" });
      var h = conf.querySelector("h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
    });
  }
})();

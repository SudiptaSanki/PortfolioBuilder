/* ============================================================
   ALMEIDA SCENT SYSTEMS — bench script
   Sound ruling: NO audio anywhere on this site. The stub's
   "scent frequency" hover synth was removed, not rebuilt:
   scent is not sound, a smell has no frequency, and hover-
   triggered audio is a deal-breaker regardless. (CREDITS.md)
   ============================================================ */

/* Cross-document view transitions abort noisily in Chromium;
   the navigation itself always completes. Swallow only that
   specific rejection. */
window.addEventListener("unhandledrejection", function (e) {
  var r = e.reason;
  if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
    e.preventDefault();
  }
});

(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile bench-index panel ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var panel = document.getElementById("bench-panel");
  if (menuBtn && panel) {
    var closeTimer = null;
    function openPanel() {
      window.clearTimeout(closeTimer);
      panel.hidden = false;
      menuBtn.setAttribute("aria-expanded", "true");
      if (!reduceMotion) {
        panel.style.maxHeight = "0px";
        panel.style.opacity = "0";
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            panel.style.maxHeight = panel.scrollHeight + "px";
            panel.style.opacity = "1";
          });
        });
        closeTimer = window.setTimeout(function () { panel.style.maxHeight = "none"; }, 420);
      }
      /* Focus only once the panel is actually visible (rAF after open). */
      requestAnimationFrame(function () {
        var first = panel.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      });
    }
    function closePanel() {
      menuBtn.setAttribute("aria-expanded", "false");
      if (reduceMotion) { panel.hidden = true; return; }
      panel.style.maxHeight = panel.scrollHeight + "px";
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          panel.style.maxHeight = "0px";
          panel.style.opacity = "0";
        });
      });
      closeTimer = window.setTimeout(function () { panel.hidden = true; }, 400);
    }
    menuBtn.addEventListener("click", function () {
      if (panel.hidden) openPanel(); else closePanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        closePanel();
        menuBtn.focus();
      }
    });
  }

  /* ---------- reveal on scroll (motion-safe, JS-gated) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- helpers ---------- */
  function gbp(n) { return "£" + n.toLocaleString("en-GB"); }
  function fmt(n, dp) { return n.toFixed(dp); }
  function fmtConc(c) {
    if (c >= 0.001) return c.toFixed(3);
    return String(parseFloat(c.toPrecision(2)));
  }

  /* ==========================================================
     DOSE CALCULATOR — C = E / Q, Q = V × ACH ÷ 60
     The compound bands below are the same figures printed in
     Table D1 on this page. The table is the source; if the two
     ever disagree, the table is right and this is a bug.
     ========================================================== */
  var doseRoot = document.getElementById("dose-calc");
  if (doseRoot) {
    var COMPOUNDS = {
      isoamyl:  { name: "Isoamyl acetate", low: 0.002,   high: 0.2,   band: "0.002 – 0.2" },
      vanillin: { name: "Vanillin",        low: 0.00005, high: 0.005, band: "0.00005 – 0.005" },
      geosmin:  { name: "Geosmin",         low: 0.00001, high: 0.0005, band: "0.00001 – 0.0005" },
      h2s:      { name: "Hydrogen sulfide (training surrogate)", low: 0.0007, high: 0.14, band: "0.0007 – 0.14" }
    };
    var dose = { compound: "isoamyl", volume: 120, ach: 2.0, emission: 0.40 };
    var DOSE_STEPS = {
      volume:   { step: 20,   min: 20,  max: 500 },
      ach:      { step: 0.5,  min: 0.5, max: 12 },
      emission: { step: 0.05, min: 0.05, max: 2.0 }
    };
    var el = function (id) { return document.getElementById(id); };
    var valEls = { volume: el("dv-volume"), ach: el("dv-ach"), emission: el("dv-emission") };

    function renderDose() {
      var c = COMPOUNDS[dose.compound];
      valEls.volume.textContent = dose.volume + " m³";
      valEls.ach.textContent = fmt(dose.ach, 1) + " /h";
      valEls.emission.textContent = fmt(dose.emission, 2) + " mg/min";
      var q = dose.volume * dose.ach / 60;
      var conc = dose.emission / q;
      el("dose-workings").innerHTML =
        '<span class="w-line">Q = V × ACH ÷ 60 = ' + dose.volume + " × " + fmt(dose.ach, 1) + " ÷ 60 = <b>" + fmt(q, 2) + " m³/min</b></span>" +
        '<span class="w-line">C = E ÷ Q = ' + fmt(dose.emission, 2) + " ÷ " + fmt(q, 2) + " = <b>" + fmtConc(conc) + " mg/m³</b></span>" +
        '<span class="w-line">Printed band, ' + c.name + " (Table D1): <b>" + c.band + " mg/m³</b></span>";
      var verdict = el("dose-verdict");
      var stamp = el("dose-verdict-stamp");
      var text = el("dose-verdict-text");
      verdict.classList.remove("below", "within", "above");
      if (conc < c.low) {
        verdict.classList.add("below");
        stamp.textContent = "Below band";
        text.textContent = "Below the printed band — most of a panel would miss it entirely. If the lesson depends on the scent being noticed, this dose is a rumour.";
      } else if (conc > c.high) {
        verdict.classList.add("above");
        stamp.textContent = "Above band";
        text.textContent = "Above the printed band — expect it to read as strong, and expect complaints before you expect subtlety. Dose down, or ventilate up.";
      } else {
        verdict.classList.add("within");
        stamp.textContent = "Within band";
        text.textContent = "Within the printed band — most of a panel would notice it; some would not. A band describes a population. It is never a promise about one nose.";
      }
    }
    doseRoot.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        doseRoot.querySelectorAll(".chip").forEach(function (c2) { c2.setAttribute("aria-pressed", "false"); });
        chip.setAttribute("aria-pressed", "true");
        dose.compound = chip.getAttribute("data-compound");
        renderDose();
      });
    });
    doseRoot.querySelectorAll("[data-dose-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-dose-step");
        var dir = parseInt(btn.getAttribute("data-dir"), 10);
        var cfg = DOSE_STEPS[key];
        var next = Math.round((dose[key] + dir * cfg.step) * 100) / 100;
        dose[key] = Math.min(cfg.max, Math.max(cfg.min, next));
        renderDose();
      });
    });
    renderDose();
  }

  /* ==========================================================
     ESTIMATOR — rates are the same figures printed in the fee
     table on this page.
     ========================================================== */
  var estRoot = document.getElementById("estimator");
  if (estRoot) {
    var est = {
      design:      { rate: 1250, qty: 6, min: 0, max: 30 },
      integration: { rate: 1450, qty: 4, min: 0, max: 30 },
      channels:    { rate: 680,  qty: 3, min: 1, max: 24 },
      visits:      { rate: 950,  qty: 1, min: 0, max: 6 }
    };
    function renderEst() {
      var total = 0;
      Object.keys(est).forEach(function (key) {
        var row = est[key];
        var line = row.rate * row.qty;
        total += line;
        document.getElementById("est-qty-" + key).textContent = row.qty;
        document.getElementById("est-line-" + key).textContent = gbp(line);
      });
      document.getElementById("est-grand-num").textContent = gbp(total);
    }
    estRoot.querySelectorAll("[data-est-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-est-step");
        var dir = parseInt(btn.getAttribute("data-dir"), 10);
        var row = est[key];
        row.qty = Math.min(row.max, Math.max(row.min, row.qty + dir));
        renderEst();
      });
    });
    renderEst();
  }

  /* ==========================================================
     ENQUIRY FORM — demonstration only; nothing is transmitted.
     ========================================================== */
  var form = document.getElementById("enquiry-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var checks = [
        { id: "f-name", ok: function (v) { return v.trim().length >= 2; } },
        { id: "f-email", ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
        { id: "f-env", ok: function (v) { return v !== ""; } },
        { id: "f-msg", ok: function (v) { return v.trim().length >= 10; } }
      ];
      var firstBad = null;
      checks.forEach(function (chk) {
        var input = document.getElementById(chk.id);
        var field = input.closest(".field");
        var valid = chk.ok(input.value);
        field.classList.toggle("invalid", !valid);
        input.setAttribute("aria-invalid", valid ? "false" : "true");
        if (!valid && !firstBad) firstBad = input;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = "DA-ENQ-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("confirm-ref").textContent = ref;
      form.hidden = true;
      var conf = document.getElementById("confirmation");
      conf.hidden = false;
      conf.setAttribute("tabindex", "-1");
      conf.focus({ preventScroll: false });
    });
    form.querySelectorAll("input, select, textarea").forEach(function (input) {
      input.addEventListener("input", function () {
        input.closest(".field").classList.remove("invalid");
      });
    });
  }
})();

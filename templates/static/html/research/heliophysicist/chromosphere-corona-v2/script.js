/* Lindqvist Heliophysics — shared script.
   Menu, flare-scale explorer, programme estimator, enquiry form.
   Every block is guarded so the file is safe on all four pages. */
(function () {
  "use strict";

  /* Cross-document view transitions abort noisily when interrupted;
     swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var yearEl = document.getElementById("yr");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- mobile menu ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menuPanel");
  if (btn && panel) {
    var firstLink = panel.querySelector("a");
    function setMenu(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.classList.toggle("open", open);
      panel.setAttribute("aria-hidden", open ? "false" : "true");
      if (open) {
        requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
      }
    }
    btn.addEventListener("click", function () {
      setMenu(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setMenu(false);
        btn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setMenu(false);
    });
  }

  /* ---------- flare scale explorer ---------- */
  var explorer = document.getElementById("flareExplorer");
  if (explorer) {
    var BASES = { A: -8, B: -7, C: -6, M: -5, X: -4 }; /* log10 of class base, W/m^2 */
    var state = {
      a: { cls: "C", suf: 1.0 },
      b: { cls: "X", suf: 2.0 }
    };

    function flux(f) { return Math.pow(10, BASES[f.cls]) * f.suf; }
    function fmtExp(exp) { return "10<sup>" + (exp < 0 ? "−" + Math.abs(exp) : exp) + "</sup>"; }
    function fmtFlux(f) {
      return f.suf.toFixed(1) + " × " + fmtExp(BASES[f.cls]) + " W/m²";
    }
    function fmtRatio(r) {
      var v = Math.round(r * 10) / 10;
      return (v % 1 === 0) ? String(Math.round(v)) : String(v);
    }
    function designation(f) { return f.cls + f.suf.toFixed(1); }

    function render(which) {
      var f = state[which];
      var cell = explorer.querySelector('[data-flare="' + which + '"]');
      cell.querySelectorAll(".cls-btn").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-cls") === f.cls ? "true" : "false");
      });
      cell.querySelector(".sv").textContent = f.suf.toFixed(1);
      cell.querySelector('[data-step="-1"]').disabled = f.suf <= 1.0;
      cell.querySelector('[data-step="1"]').disabled = f.suf >= 9.9;
      cell.querySelector(".designation").textContent = designation(f);
      cell.querySelector(".fluxline").innerHTML = "Peak flux&nbsp; " + fmtFlux(f);
      cell.querySelector(".arith").innerHTML =
        f.cls + " base 1.0 × " + fmtExp(BASES[f.cls]) + " W/m² × suffix " + f.suf.toFixed(1) +
        " = <strong>" + fmtFlux(f) + "</strong>";
      var pct = ((Math.log10(flux(f)) + 8) / 5) * 100;
      var marker = document.getElementById("marker-" + which);
      marker.style.left = pct.toFixed(1) + "%";
      marker.querySelector(".mtag").textContent = designation(f);
    }

    function renderRatio() {
      var fa = flux(state.a), fb = flux(state.b);
      var main = document.getElementById("ratioMain");
      var arith = document.getElementById("ratioArith");
      if (Math.abs(fa - fb) < 1e-12) {
        main.innerHTML = "Both entries sit at the same peak flux — <strong>ratio 1×</strong>.";
        arith.textContent = "Equal classes and suffixes give equal fluxes; the ladder markers coincide.";
        return;
      }
      var hi = fb > fa ? state.b : state.a;
      var lo = fb > fa ? state.a : state.b;
      var ratio = flux(hi) / flux(lo);
      main.innerHTML =
        "<strong>" + designation(hi) + "</strong> peaked at <strong>" + fmtRatio(ratio) +
        "×</strong> the soft X-ray flux of <strong>" + designation(lo) + "</strong>.";
      var classFactor = Math.pow(10, BASES[hi.cls] - BASES[lo.cls]);
      var sufFactor = ratio / classFactor;
      var split;
      if (classFactor > 1 && sufFactor > 1) {
        split = "×" + fmtRatio(classFactor) + " from the class step" +
          (BASES[hi.cls] - BASES[lo.cls] > 1 ? "s" : "") + " (" + lo.cls + " → " + hi.cls +
          "), ×" + fmtRatio(sufFactor) + " from the suffixes (" + hi.suf.toFixed(1) + " ÷ " + lo.suf.toFixed(1) + ")";
      } else if (classFactor === 1) {
        split = "all of it from the suffixes (" + hi.suf.toFixed(1) + " ÷ " + lo.suf.toFixed(1) +
          ") — same class, so only the suffixes separate them";
      } else {
        split = "all of it from the class step" + (BASES[hi.cls] - BASES[lo.cls] > 1 ? "s" : "") +
          " (" + lo.cls + " → " + hi.cls + ") — the suffixes are equal";
      }
      arith.innerHTML =
        "(" + fmtFlux(hi) + ") ÷ (" + fmtFlux(lo) + ") = " + fmtRatio(ratio) + " — " + split + ".";
    }

    function renderAll() { render("a"); render("b"); renderRatio(); }

    explorer.querySelectorAll('[data-flare]').forEach(function (cell) {
      var which = cell.getAttribute("data-flare");
      cell.querySelectorAll(".cls-btn").forEach(function (b) {
        b.addEventListener("click", function () {
          state[which].cls = b.getAttribute("data-cls");
          renderAll();
        });
      });
      cell.querySelectorAll(".step-btn").forEach(function (b) {
        b.addEventListener("click", function () {
          var d = parseInt(b.getAttribute("data-step"), 10);
          var next = Math.round((state[which].suf + d * 0.1) * 10) / 10;
          state[which].suf = Math.min(9.9, Math.max(1.0, next));
          renderAll();
        });
      });
    });
    renderAll();
  }

  /* ---------- programme estimator ---------- */
  var est = document.getElementById("estimator");
  if (est) {
    var RATES = { standard: 1150, rapid: 1650 };
    var PREP = 480, REPORT = 720;
    var estState = { rate: "standard", days: 6 };
    var money = function (n) { return "$" + n.toLocaleString("en-US"); };

    function renderEst() {
      est.querySelectorAll(".rate-opt").forEach(function (b) {
        b.setAttribute("aria-pressed", b.getAttribute("data-rate") === estState.rate ? "true" : "false");
      });
      est.querySelector(".sv").textContent = String(estState.days);
      est.querySelector('[data-days="-1"]').disabled = estState.days <= 1;
      est.querySelector('[data-days="1"]').disabled = estState.days >= 40;
      var dayCost = estState.days * RATES[estState.rate];
      document.getElementById("estDaysLine").textContent =
        "Analysis — " + estState.days + (estState.days === 1 ? " day" : " days") + " × " +
        money(RATES[estState.rate]) + (estState.rate === "rapid" ? " (rapid response)" : " (standard)");
      document.getElementById("estDaysAmt").textContent = money(dayCost);
      document.getElementById("estPrepAmt").textContent = money(PREP);
      document.getElementById("estReportAmt").textContent = money(REPORT);
      document.getElementById("estTotal").textContent = money(dayCost + PREP + REPORT);
    }
    est.querySelectorAll(".rate-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        estState.rate = b.getAttribute("data-rate");
        renderEst();
      });
    });
    est.querySelectorAll(".step-btn[data-days]").forEach(function (b) {
      b.addEventListener("click", function () {
        estState.days = Math.min(40, Math.max(1, estState.days + parseInt(b.getAttribute("data-days"), 10)));
        renderEst();
      });
    });
    renderEst();
  }

  /* ---------- enquiry form (demonstration — nothing is transmitted) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var conf = document.getElementById("confirmation");
    function fieldRow(input) { return input.closest(".f-row"); }
    function setInvalid(input, bad) {
      var row = fieldRow(input);
      if (row) row.classList.toggle("invalid", bad);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      return !bad;
    }
    function validate() {
      var ok = true;
      var name = form.querySelector("#fName");
      var email = form.querySelector("#fEmail");
      var type = form.querySelector("#fType");
      var msg = form.querySelector("#fMsg");
      ok = setInvalid(name, name.value.trim().length < 2) && ok;
      ok = setInvalid(email, !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setInvalid(type, !type.value) && ok;
      ok = setInvalid(msg, msg.value.trim().length < 20) && ok;
      return ok;
    }
    ["fName", "fEmail", "fType", "fMsg"].forEach(function (id) {
      var el = form.querySelector("#" + id);
      el.addEventListener("input", function () { setInvalid(el, false); });
      el.addEventListener("change", function () { setInvalid(el, false); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) {
        var firstBad = form.querySelector(".invalid input, .invalid select, .invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var seed = (form.querySelector("#fName").value + form.querySelector("#fEmail").value).toUpperCase();
      var h = 0;
      for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
      document.getElementById("confRef").textContent = "LH-" + h.toString(36).toUpperCase().slice(0, 6);
      form.style.display = "none";
      conf.classList.add("show");
      conf.setAttribute("tabindex", "-1");
      conf.focus();
    });
  }
})();

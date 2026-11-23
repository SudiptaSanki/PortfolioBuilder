/* AREOID — map-sheet interactions.
   The sol converter runs on the constants printed on the page:
   1 sol = 88,775 s · 1 Earth day = 86,400 s · 1 Mars year = 668.6 sols.
   The estimator runs on the printed fee table. Nothing here invents
   a number the page does not also print. There is no audio anywhere:
   a geologist's product is the map and the report, not a hum. */
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

  var NUM = function (n) { return n.toLocaleString("en-GB"); };
  var EUR = function (n) { return "€" + n.toLocaleString("en-GB"); };

  /* ---------- sheet-index panel (mobile) ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var panel = document.getElementById("sheetPanel");
  if (menuBtn && panel) {
    var closeBtn = document.getElementById("sheetClose");
    var openPanel = function () {
      panel.removeAttribute("hidden");
      /* focus inside the rAF after .open — focusing while the panel is
         still visibility:hidden is a silent no-op */
      requestAnimationFrame(function () {
        panel.classList.add("open");
        menuBtn.setAttribute("aria-expanded", "true");
        var first = panel.querySelector(".sp-link") || closeBtn;
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
    panel.addEventListener("click", function (e) { if (e.target === panel) closePanel(); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  /* ---------- reveal on scroll (sheets settle as read) ---------- */
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

  /* ---------- the sol converter ---------- */
  var solValEl = document.getElementById("solValue");
  if (solValEl) {
    var SOL_S = 88775;        /* printed: 1 sol = 88,775 seconds */
    var DAY_S = 86400;        /* printed: 1 Earth day = 86,400 seconds */
    var YEAR_SOLS = 668.6;    /* printed: 1 Mars year = 668.6 sols */
    var sols = 30;
    var range = document.getElementById("solRange");
    var roSeconds = document.getElementById("roSeconds");
    var roBig = document.getElementById("roBig");
    var roYear = document.getElementById("roYear");
    var working = document.getElementById("solWorking");

    function renderSol() {
      var total = sols * SOL_S;
      var days = Math.floor(total / DAY_S);
      var rem = total - days * DAY_S;
      var h = Math.floor(rem / 3600);
      var m = Math.floor((rem - h * 3600) / 60);
      var s = rem - h * 3600 - m * 60;
      var pct = (sols / YEAR_SOLS) * 100;
      var remain = YEAR_SOLS - sols;

      solValEl.textContent = NUM(sols);
      if (range && Number(range.value) !== sols) range.value = sols;
      roSeconds.textContent = NUM(total) + " s";
      roBig.textContent = days + " d  " + h + " h  " + m + " m  " + s + " s";
      roBig.setAttribute("data-seconds", total);
      roBig.setAttribute("data-days", days);
      roBig.setAttribute("data-h", h);
      roBig.setAttribute("data-m", m);
      roBig.setAttribute("data-s", s);
      var yearTxt = NUM(sols) + " ÷ 668.6 = " + pct.toFixed(1) + "% of one Mars year";
      if (remain >= 0) {
        yearTxt += " · " + remain.toFixed(1) + " sols of the year remain";
      } else {
        yearTxt += " · " + Math.abs(remain).toFixed(1) + " sols past a full Mars year";
      }
      roYear.textContent = yearTxt;
      roYear.setAttribute("data-pct", pct.toFixed(1));

      working.innerHTML =
        "<span class=\"w-step\">Step 1 — </span><b>" + NUM(sols) + " sols</b> × 88,775 s = <b>" + NUM(total) + " s</b><br>" +
        "<span class=\"w-step\">Step 2 — </span>" + NUM(total) + " s ÷ 86,400 s = <b>" + NUM(days) + " whole Earth days</b>, remainder <b>" + NUM(rem) + " s</b><br>" +
        "<span class=\"w-step\">Step 3 — </span>" + NUM(rem) + " s = <b>" + h + " h " + m + " m " + s + " s</b> past the last whole day";
    }
    var setSols = function (n) {
      sols = Math.max(1, Math.min(669, Math.round(n)));
      renderSol();
    };
    document.getElementById("solMinus").addEventListener("click", function () { setSols(sols - 1); });
    document.getElementById("solPlus").addEventListener("click", function () { setSols(sols + 1); });
    if (range) range.addEventListener("input", function () { setSols(Number(range.value)); });
    document.querySelectorAll(".chip[data-sols]").forEach(function (chip) {
      chip.addEventListener("click", function () { setSols(Number(chip.getAttribute("data-sols"))); });
    });
    renderSol();
  }

  /* ---------- the programme estimator ---------- */
  var estTotal = document.getElementById("estTotal");
  if (estTotal) {
    var RATES = { support: 1450, field: 1850 };   /* printed in the fee table */
    var qty = { support: 10, field: 0 };
    var pkgSel = document.getElementById("estPackage");
    var amtEls = {
      support: document.getElementById("amtSupport"),
      field: document.getElementById("amtField"),
      pkg: document.getElementById("amtPackage")
    };
    var qtyEls = {
      support: document.getElementById("qtySupport"),
      field: document.getElementById("qtyField")
    };
    var estWorking = document.getElementById("estWorking");

    function renderEst() {
      var aSupport = qty.support * RATES.support;
      var aField = qty.field * RATES.field;
      var aPkg = Number(pkgSel.value);
      var total = aSupport + aField + aPkg;
      qtyEls.support.textContent = qty.support;
      qtyEls.field.textContent = qty.field;
      amtEls.support.textContent = EUR(aSupport);
      amtEls.field.textContent = EUR(aField);
      amtEls.pkg.textContent = EUR(aPkg);
      estTotal.textContent = EUR(total);
      estTotal.setAttribute("data-total", total);
      var pkgName = pkgSel.options[pkgSel.selectedIndex].text;
      estWorking.innerHTML =
        "<span class=\"w-step\">Science support — </span>" + qty.support + " days × €1,450 = <b>" + EUR(aSupport) + "</b><br>" +
        "<span class=\"w-step\">Analogue field days — </span>" + qty.field + " days × €1,850 = <b>" + EUR(aField) + "</b><br>" +
        "<span class=\"w-step\">Report package — </span>" + pkgName + " = <b>" + EUR(aPkg) + "</b>";
    }
    [["support", "supMinus", "supPlus"], ["field", "fldMinus", "fldPlus"]].forEach(function (cfg) {
      var key = cfg[0], max = key === "support" ? 60 : 30;
      document.getElementById(cfg[1]).addEventListener("click", function () {
        qty[key] = Math.max(0, qty[key] - 1); renderEst();
      });
      document.getElementById(cfg[2]).addEventListener("click", function () {
        qty[key] = Math.min(max, qty[key] + 1); renderEst();
      });
    });
    pkgSel.addEventListener("change", renderEst);
    renderEst();
  }

  /* ---------- enquiry form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var conf = document.getElementById("confirmation");
    var fields = {
      name: { el: document.getElementById("fName"), ok: function (v) { return v.trim().length >= 2; } },
      email: { el: document.getElementById("fEmail"), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); } },
      type: { el: document.getElementById("fType"), ok: function (v) { return v !== ""; } },
      message: { el: document.getElementById("fMessage"), ok: function (v) { return v.trim().length >= 20; } }
    };
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener("input", function () {
        fields[k].el.closest(".field").classList.remove("invalid");
      });
      fields[k].el.addEventListener("change", function () {
        fields[k].el.closest(".field").classList.remove("invalid");
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var valid = true, firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var good = f.ok(f.el.value);
        f.el.closest(".field").classList.toggle("invalid", !good);
        if (!good) { valid = false; if (!firstBad) firstBad = f.el; }
      });
      if (!valid) { firstBad.focus(); return; }
      var ref = "AG-ENQ-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("confRef").textContent = ref;
      document.getElementById("confName").textContent = fields.name.el.value.trim();
      form.setAttribute("hidden", "");
      conf.removeAttribute("hidden");
      conf.setAttribute("tabindex", "-1");
      conf.focus();
      conf.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
})();

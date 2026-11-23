/* Valk Foundry — specimen tools.
   Every figure below is copied from the tables printed on the page
   (Tables C1, W1, B1 and R1). The tools read the same numbers the
   visitor reads, so the arithmetic can be checked by eye. */

(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts them; swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile contents panel ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("menu-panel");
  if (btn && panel) {
    var closePanel = function () {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", function () {
      var open = panel.hidden;
      panel.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
      if (open) {
        var first = panel.querySelector("a");
        if (first) first.focus();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        closePanel();
        btn.focus();
      }
    });
  }

  /* ---------- shared formatting ---------- */
  function fmtInt(n) { return Math.round(n).toLocaleString("en-GB"); }
  function fmtEuro(n) { return "€" + fmtInt(n); }
  function fmtKg(g) { return (g / 1000).toFixed(1) + " kg"; }

  /* ---------- printed tables, as data ---------- */
  /* Table C1 — sorts per standard page (180 × 110 mm, set solid) */
  var SORTS_PER_PAGE = { 8: 4600, 10: 3400, 11: 2850, 12: 2500, 14: 1950, 18: 1150, 24: 620, 30: 400, 36: 270, 48: 150, 60: 95, 72: 65 };
  /* Table W1 — average weight per sort in grams (weighed per 100 sorts) */
  var WEIGHT_PER_SORT = { 8: 1.1, 10: 1.7, 11: 2.0, 12: 2.4, 14: 3.3, 18: 5.4, 24: 9.6, 30: 15.0, 36: 21.6, 48: 38.4, 60: 60.0, 72: 86.4 };
  /* Table B1 — bill of type, sorts per 100, text faces */
  var BILL_TEXT = [
    ["Lowercase letters", 56],
    ["Capitals", 11],
    ["Figures", 9],
    ["Punctuation", 9],
    ["Spaces & quads", 15]
  ];
  /* Table B1 (display) — Spaarne fount as it can be supplied today */
  var BILL_DISPLAY = [
    ["Capitals", 46],
    ["Figures", 20],
    ["Punctuation", 14],
    ["Spaces & quads", 20],
    ["Lowercase letters", 0]
  ];
  var FACES = {
    "valk-text": { name: "Valk Text", bill: BILL_TEXT, sizes: [10, 11, 12, 14, 18, 24, 36], incomplete: false },
    "staal-roman": { name: "Staal Roman (revival)", bill: BILL_TEXT, sizes: [10, 12, 14], incomplete: false },
    "spaarne-display": { name: "Spaarne Display", bill: BILL_DISPLAY, sizes: [24, 30, 36, 48, 60, 72], incomplete: true }
  };
  /* Table R1 — estimator rates */
  var RATES = { text: 0.14, display: 0.38, day: 420 };

  function stepper(inputId, minusId, plusId, step) {
    var input = document.getElementById(inputId);
    if (!input) return null;
    var minus = document.getElementById(minusId);
    var plus = document.getElementById(plusId);
    function clamp() {
      var min = parseFloat(input.min || "0");
      var max = parseFloat(input.max || "999999");
      var v = parseFloat(input.value || "0");
      if (isNaN(v)) v = min;
      input.value = Math.min(max, Math.max(min, v));
    }
    if (minus) minus.addEventListener("click", function () { input.value = (parseFloat(input.value || "0") - step); clamp(); input.dispatchEvent(new Event("change")); });
    if (plus) plus.addEventListener("click", function () { input.value = (parseFloat(input.value || "0") + step); clamp(); input.dispatchEvent(new Event("change")); });
    input.addEventListener("change", clamp);
    return input;
  }

  /* ---------- Sorts & Weight Planner ---------- */
  var faceSel = document.getElementById("pl-face");
  if (faceSel) {
    var sizeSel = document.getElementById("pl-size");
    var pagesIn = stepper("pl-pages", "pl-pages-minus", "pl-pages-plus", 1);
    var out = document.getElementById("pl-workings");
    var statePanel = document.getElementById("pl-state");

    function fillSizes() {
      var face = FACES[faceSel.value];
      var keep = parseInt(sizeSel.value, 10);
      sizeSel.innerHTML = "";
      face.sizes.forEach(function (s) {
        var o = document.createElement("option");
        o.value = s; o.textContent = s + " pt";
        sizeSel.appendChild(o);
      });
      sizeSel.value = face.sizes.indexOf(keep) >= 0 ? keep : (face.sizes.indexOf(12) >= 0 ? 12 : face.sizes[0]);
    }

    function line(label, value) {
      var li = document.createElement("li");
      var a = document.createElement("span"); a.textContent = label;
      var b = document.createElement("span"); b.textContent = value;
      li.appendChild(a); li.appendChild(b);
      return li;
    }

    function compute() {
      var face = FACES[faceSel.value];
      var size = parseInt(sizeSel.value, 10);
      var pages = Math.max(1, parseInt(pagesIn.value || "1", 10));
      var perPage = SORTS_PER_PAGE[size];
      var total = perPage * pages;
      var weightG = total * WEIGHT_PER_SORT[size];
      out.innerHTML = "";
      out.appendChild(line("Sorts on one page at " + size + " pt (Table C1)", fmtInt(perPage)));
      out.appendChild(line("Pages of standing type", fmtInt(pages)));
      out.appendChild(line("Total sorts — " + perPage.toLocaleString("en-GB") + " × " + pages, fmtInt(total)));
      face.bill.forEach(function (row) {
        if (row[1] === 0) {
          out.appendChild(line(row[0] + " — not cut, cannot be supplied", "0"));
        } else {
          out.appendChild(line(row[0] + " — " + row[1] + " per 100 (Table B1)", fmtInt(total * row[1] / 100)));
        }
      });
      out.appendChild(line("Weight per sort at " + size + " pt (Table W1)", WEIGHT_PER_SORT[size].toFixed(1) + " g"));
      var tot = line("Metal weight — " + fmtInt(total) + " × " + WEIGHT_PER_SORT[size].toFixed(1) + " g", fmtKg(weightG));
      tot.className = "total";
      out.appendChild(tot);
      statePanel.hidden = !face.incomplete;
    }

    faceSel.addEventListener("change", function () { fillSizes(); compute(); });
    sizeSel.addEventListener("change", compute);
    pagesIn.addEventListener("change", compute);
    pagesIn.addEventListener("input", compute);
    fillSizes();
    compute();
  }

  /* ---------- Booking estimator ---------- */
  var estSorts = document.getElementById("est-sorts");
  if (estSorts) {
    var sortsIn = stepper("est-sorts", "est-sorts-minus", "est-sorts-plus", 500);
    var daysIn = stepper("est-days", "est-days-minus", "est-days-plus", 1);
    var bandSel = document.getElementById("est-band");
    var estOut = document.getElementById("est-workings");

    function eline(label, value) {
      var li = document.createElement("li");
      var a = document.createElement("span"); a.textContent = label;
      var b = document.createElement("span"); b.textContent = value;
      li.appendChild(a); li.appendChild(b);
      return li;
    }

    function estCompute() {
      var sorts = Math.max(0, parseInt(sortsIn.value || "0", 10));
      var days = Math.max(0, parseInt(daysIn.value || "0", 10));
      var rate = RATES[bandSel.value];
      var casting = sorts * rate;
      var commission = days * RATES.day;
      estOut.innerHTML = "";
      estOut.appendChild(eline("Casting — " + fmtInt(sorts) + " sorts × €" + rate.toFixed(2) + " (" + (bandSel.value === "text" ? "text sizes, to 18 pt" : "display sizes, 24 pt and up") + ")", fmtEuro(casting)));
      estOut.appendChild(eline("Punchcutting commission — " + days + " day" + (days === 1 ? "" : "s") + " × €420", fmtEuro(commission)));
      estOut.appendChild(eline("Proof pull & crating", "included"));
      var tot = eline("Estimate", fmtEuro(casting + commission));
      tot.className = "total";
      estOut.appendChild(tot);
    }

    sortsIn.addEventListener("change", estCompute);
    sortsIn.addEventListener("input", estCompute);
    daysIn.addEventListener("change", estCompute);
    daysIn.addEventListener("input", estCompute);
    bandSel.addEventListener("change", estCompute);
    estCompute();
  }

  /* ---------- Enquiry form (demonstration) ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var errorBox = document.getElementById("form-error");
    var errorText = document.getElementById("form-error-text");
    var conf = document.getElementById("confirmation");
    var confRef = document.getElementById("confirmation-ref");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cf-name").value.trim();
      var email = document.getElementById("cf-email").value.trim();
      var msg = document.getElementById("cf-message").value.trim();
      var problems = [];
      if (name.length < 2) problems.push("your name");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) problems.push("a valid email address");
      if (msg.length < 10) problems.push("a few words about the work (10 characters or more)");
      if (problems.length) {
        errorText.textContent = "The form still needs: " + problems.join("; ") + ". Nothing has been sent.";
        errorBox.hidden = false;
        conf.hidden = true;
        errorBox.setAttribute("tabindex", "-1");
        errorBox.focus();
        return;
      }
      errorBox.hidden = true;
      var seed = 0;
      var s = name + email + msg;
      for (var i = 0; i < s.length; i++) seed = (seed * 31 + s.charCodeAt(i)) % 9000;
      confRef.textContent = "VF-2026-" + (1000 + seed);
      conf.hidden = false;
      conf.setAttribute("tabindex", "-1");
      conf.focus();
    });
  }
})();

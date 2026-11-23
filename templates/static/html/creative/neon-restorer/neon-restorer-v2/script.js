/* The Dombrowski Neon Archive — register filter, rescue assessment,
   rate-card estimator, enquiry form. No sound, by ruling. */
(function () {
  "use strict";

  /* Cross-document view transitions abort noisily in some browsers when a
     navigation is interrupted; the navigation itself always completes.
     Swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- Mobile menu ---------- */
  var menuBtn = document.getElementById("menuBtn");
  var menuPanel = document.getElementById("menuPanel");
  if (menuBtn && menuPanel) {
    var closeMenu = function () {
      menuPanel.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    };
    menuBtn.addEventListener("click", function () {
      var open = menuPanel.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open) {
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector("a");
          if (first) first.focus();
        });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menuPanel.classList.contains("open")) {
        closeMenu();
        menuBtn.focus();
      }
    });
    menuPanel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
  }

  /* ---------- Register filter ---------- */
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".filter-btn"));
  var regRows = Array.prototype.slice.call(document.querySelectorAll(".reg-row"));
  var regCount = document.getElementById("regCount");
  if (filterBtns.length && regRows.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var f = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
        var shown = 0;
        regRows.forEach(function (row) {
          var show = f === "all" || row.getAttribute("data-fate") === f;
          row.hidden = !show;
          if (show) shown++;
        });
        if (regCount) {
          var label = f === "all" ? "all fates" : btn.textContent.trim().toLowerCase();
          regCount.textContent = "Showing " + shown + " of " + regRows.length + " entries — " + label + ".";
        }
      });
    });
  }

  /* ---------- Printed tables, restated for the tools ----------
     These figures are the same ones printed in Tables A, B and C and on
     the rate card beside the tools. If the printed table changes, this
     changes with it — the tool may not disagree with the page. */
  var GRADES = {
    "1": { surv: 85, hours: 2 },
    "2": { surv: 65, hours: 3 },
    "3": { surv: 40, hours: 5 },
    "4": { surv: 10, hours: null }
  };
  var CLASSES = {
    fascia:  { tube: 3, access: "Street level — no access plant; van and two crew." },
    script:  { tube: 4, access: "MEWP (cherry picker), 1 day." },
    rooftop: { tube: 6, access: "Scaffold tower, 2 days." }
  };
  var RATES = { survey: 350, perLetter: 160, perMetre: 95, perDay: 220, rehang: 180 };
  var DOC_HOURS = 8;        /* Table C: document & rest, flat */
  var REMAKE_PER_LETTER = 6; /* Table C: document & remake, per letter */

  function fmtMetres(n) {
    return (Math.round(n * 10) / 10).toString().replace(/\.0$/, "");
  }
  function fmtGBP(n) {
    return "£" + n.toLocaleString("en-GB");
  }
  function line(text) {
    var p = document.createElement("p");
    p.textContent = text;
    return p;
  }

  /* ---------- Rescue Assessment ---------- */
  var assessForm = document.getElementById("assessForm");
  if (assessForm) {
    var aClass = document.getElementById("aClass");
    var aLetters = document.getElementById("aLetters");
    var aGrade = document.getElementById("aGrade");
    var aOut = document.getElementById("assessOut");
    assessForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var cls = CLASSES[aClass.value];
      var g = GRADES[aGrade.value];
      var letters = parseInt(aLetters.value, 10);
      if (!cls || !g || !letters || letters < 1) {
        aOut.innerHTML = "";
        var warn = line("Enter a letter count of 1 or more — the assessment needs a sign to assess.");
        warn.className = "verdict";
        aOut.appendChild(warn);
        return;
      }
      var totalTube = letters * cls.tube;
      aOut.innerHTML = "";
      aOut.appendChild(line("Tube in the sign: " + letters + " letters × " + cls.tube + " m per letter = " + totalTube + " m of tube."));
      if (aGrade.value === "4") {
        aOut.appendChild(line("Expected survival at Grade 4: " + totalTube + " m × 10% = " + fmtMetres(totalTube * 0.10) + " m. At that figure the original glass cannot be saved, and a ‘rescue’ would be a fiction. The archive will not sell one. The honest options, from Table C:"));
        aOut.appendChild(line("Option 1 — Document & rest: " + DOC_HOURS + " bench hours, flat. Full photographic record, pattern rubbing and measured drawing; then the sign rests as it is, with its record kept by the owner."));
        aOut.appendChild(line("Option 2 — Document & remake: " + DOC_HOURS + " + (" + letters + " letters × " + REMAKE_PER_LETTER + " h) = " + (DOC_HOURS + letters * REMAKE_PER_LETTER) + " bench hours. New tube bent to the original pattern, stamped and dated on the reverse; the index entry states plainly that the sign is a remake."));
        var v4 = line("Verdict: beyond tube rescue. Document it properly, one way or the other.");
        v4.className = "verdict";
        aOut.appendChild(v4);
        return;
      }
      var survive = totalTube * g.surv / 100;
      aOut.appendChild(line("Original tube expected to survive: " + totalTube + " m × " + g.surv + "% = " + fmtMetres(survive) + " m. The remainder is remade to the original pattern and stamped with its year on the reverse."));
      aOut.appendChild(line("Bench time: " + letters + " letters × " + g.hours + " h per letter = " + (letters * g.hours) + " bench hours."));
      aOut.appendChild(line("Access & transport: " + cls.access));
      var v = line("Verdict: Grade " + aGrade.value + " is rescuable tube work. The sign keeps its original glass wherever the glass is sound.");
      v.className = "verdict";
      aOut.appendChild(v);
    });
  }

  /* ---------- Booking estimator ---------- */
  var estForm = document.getElementById("estForm");
  if (estForm) {
    var eLetters = document.getElementById("eLetters");
    var eMetres = document.getElementById("eMetres");
    var eDays = document.getElementById("eDays");
    var eOut = document.getElementById("estOut");
    estForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var letters = parseInt(eLetters.value, 10) || 0;
      var metres = parseInt(eMetres.value, 10) || 0;
      var days = parseInt(eDays.value, 10) || 0;
      var lSurvey = RATES.survey;
      var lBench = letters * RATES.perLetter;
      var lTube = metres * RATES.perMetre;
      var lAccess = days * RATES.perDay;
      var lRehang = RATES.rehang;
      var total = lSurvey + lBench + lTube + lAccess + lRehang;
      eOut.innerHTML = "";
      eOut.appendChild(line("Survey & written condition report: " + fmtGBP(lSurvey) + " (flat, per sign)."));
      eOut.appendChild(line("Bench restoration: " + letters + " letters × " + fmtGBP(RATES.perLetter) + " = " + fmtGBP(lBench) + "."));
      eOut.appendChild(line("Replacement tube, bent & filled: " + metres + " m × " + fmtGBP(RATES.perMetre) + " = " + fmtGBP(lTube) + "."));
      eOut.appendChild(line("Access plant: " + days + " days × " + fmtGBP(RATES.perDay) + " = " + fmtGBP(lAccess) + "."));
      eOut.appendChild(line("Return, re-hang & test at dusk: " + fmtGBP(lRehang) + " (flat, per sign)."));
      var t = line("Estimate from the printed rate card: " + fmtGBP(total) + ". An estimate, not a quotation — the survey fixes the figure.");
      t.className = "verdict";
      eOut.appendChild(t);
    });
  }

  /* ---------- Enquiry form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var done = document.getElementById("formDone");
    var fields = {
      cName: { el: document.getElementById("cName"), err: document.getElementById("cNameErr"),
               test: function (v) { return v.trim().length >= 2; }, msg: "Give your name, so the reply has someone to greet." },
      cEmail: { el: document.getElementById("cEmail"), err: document.getElementById("cEmailErr"),
                test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, msg: "Give an email address the archive can reply to." },
      cSign: { el: document.getElementById("cSign"), err: document.getElementById("cSignErr"),
               test: function (v) { return v.trim().length >= 3; }, msg: "Name the sign and its town — that is how it enters the index." },
      cMsg: { el: document.getElementById("cMsg"), err: document.getElementById("cMsgErr"),
              test: function (v) { return v.trim().length >= 10; }, msg: "A few words about the sign: where it is, what state it is in, what is about to happen to it." }
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      Object.keys(fields).forEach(function (k) {
        var f = fields[k];
        var valid = f.test(f.el.value);
        f.err.hidden = valid;
        if (!valid) { ok = false; if (!firstBad) firstBad = f.el; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var ref = "DNR-2026-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("formRef").textContent = ref;
      form.hidden = true;
      done.hidden = false;
      done.setAttribute("tabindex", "-1");
      done.focus();
    });
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener("input", function () { fields[k].err.hidden = true; });
    });
  }
})();

/* ============================================================
   Chitin Archive — page script
   Sound ruling: none. The profession is measurement and
   testimony, not audio; no sound passes the need-test.
   Nothing sounds, ever.
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

  /* ---------------- mobile menu: the index drawer ---------------- */
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

  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());

  function fmtNum(n) {
    return (Math.round(n * 10) / 10) % 1 === 0
      ? String(Math.round(n))
      : (Math.round(n * 10) / 10).toFixed(1);
  }
  function fmtGBP(n) {
    return "£" + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /* ============================================================
     DEGREE-DAY CALCULATOR (index) — teaching example only.
     One source of truth: add() computes; the workings, the big
     readout and the stage-table highlight all render from it,
     so they cannot disagree.
       daily = max(0, Tmean - 10)      ADD = daily * days
     Stage bands are Table T1 as printed on the page.
     ============================================================ */
  var tempVal = document.getElementById("tempVal");
  var daysVal = document.getElementById("daysVal");
  if (tempVal && daysVal) {
    var BASE = 10;
    var state = { temp: 18, days: 21 };
    var STAGES = [
      { name: "Egg", band: "0 – 25", max: 25, note: "Eggs only; no larvae. In the example, the clock has barely started." },
      { name: "First instar", band: "25 – 60", max: 60, note: "Newly hatched larvae — the first stage an examiner can stage with confidence." },
      { name: "Second instar", band: "60 – 110", max: 110, note: "Larvae growing; the stage is read from the posterior spiracles." },
      { name: "Third instar — feeding", band: "110 – 175", max: 175, note: "Peak feeding size. In casework, crop content and length are recorded before preservation." },
      { name: "Post-feeding — wandering", band: "175 – 240", max: 240, note: "Larvae have left the food source to pupariate; the crop has emptied." },
      { name: "Pupa — within the puparium", band: "240 – 420", max: 420, note: "The longest single stage — and the puparium persists as evidence after emergence." },
      { name: "Adult — emerged", band: "420 +", max: Infinity, note: "Development complete. Empty puparial cases are what remain to be found." }
    ];
    var workLines = document.getElementById("workLines");
    var stageName = document.getElementById("stageName");
    var stageNote = document.getElementById("stageNote");
    var stageRows = document.querySelectorAll("#stageTable tbody tr");

    function renderCalc() {
      var daily = Math.max(0, state.temp - BASE);
      var add = daily * state.days;
      tempVal.textContent = state.temp.toFixed(1);
      daysVal.textContent = String(state.days);

      var lines = "";
      if (state.temp > BASE) {
        lines += "<div>Daily accumulation: " + state.temp.toFixed(1) + " − " + BASE.toFixed(1) + " = <b>" + fmtNum(daily) + "</b> degree-days per day</div>";
      } else {
        lines += "<div>Daily accumulation: " + state.temp.toFixed(1) + " − " + BASE.toFixed(1) + " is at or below the base → <b>0</b> degree-days per day (the clock does not run)</div>";
      }
      lines += "<div>Over " + state.days + " days at a constant mean: " + fmtNum(daily) + " × " + state.days + " = <span class=\"result\"><b>" + fmtNum(add) + " ADD</b></span></div>";
      workLines.innerHTML = lines;

      var idx = 0;
      for (var i = 0; i < STAGES.length; i++) {
        if (add < STAGES[i].max) { idx = i; break; }
        idx = STAGES.length - 1;
      }
      stageName.textContent = STAGES[idx].name;
      stageNote.textContent = fmtNum(add) + " ADD falls in the " + STAGES[idx].band + " ADD band of Table T1. " + STAGES[idx].note;
      stageRows.forEach(function (row) {
        row.setAttribute("data-active", row.getAttribute("data-stage") === String(idx) ? "true" : "false");
      });
    }
    document.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.getAttribute("data-step").split(":");
        var key = parts[0], delta = parseFloat(parts[1]);
        if (key === "temp") {
          state.temp = Math.min(32, Math.max(4, Math.round((state.temp + delta) * 2) / 2));
        } else {
          state.days = Math.min(90, Math.max(1, state.days + delta));
        }
        renderCalc();
      });
    });
    renderCalc();
  }

  /* ============================================================
     INSTRUCTION ESTIMATOR (index)
     Line totals and the grand total all come from RATES, the
     same figures printed in each row's description.
     ============================================================ */
  var estTotal = document.getElementById("estTotal");
  if (estTotal) {
    var RATES = { scene: 650, lab: 520, report: 480, court: 950 };
    var days = { scene: 1, lab: 3, report: 2, court: 1 };
    function renderEst() {
      var total = 0;
      Object.keys(RATES).forEach(function (k) {
        var line = RATES[k] * days[k];
        total += line;
        document.getElementById("est-" + k).textContent = String(days[k]);
        document.getElementById("lt-" + k).innerHTML =
          days[k] + (days[k] === 1 ? " day" : " days") + " × " + fmtGBP(RATES[k]) + "<b>" + fmtGBP(line) + "</b>";
      });
      estTotal.textContent = fmtGBP(total);
    }
    document.querySelectorAll("[data-est]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var parts = btn.getAttribute("data-est").split(":");
        var k = parts[0], d = parseInt(parts[1], 10);
        days[k] = Math.min(15, Math.max(0, days[k] + d));
        renderEst();
      });
    });
    renderEst();
  }

  /* ============================================================
     ENQUIRY FORM (contact) — demonstration: validates in-page,
     logs a register reference, transmits nothing.
     ============================================================ */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    var confRef = document.getElementById("confRef");
    function check(field) {
      var wrap = form.querySelector('[data-field="' + field + '"]');
      var input = wrap.querySelector("input, select, textarea");
      var v = (input.value || "").trim();
      var ok = true;
      if (field === "name" || field === "org") ok = v.length >= 2;
      if (field === "role") ok = v.length > 0;
      if (field === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
      if (field === "msg") ok = v.length >= 10;
      wrap.classList.toggle("invalid", !ok);
      return ok;
    }
    ["name", "org", "role", "email", "msg"].forEach(function (f) {
      var input = form.querySelector('[data-field="' + f + '"] input, [data-field="' + f + '"] select, [data-field="' + f + '"] textarea');
      if (input) input.addEventListener("input", function () {
        form.querySelector('[data-field="' + f + '"]').classList.remove("invalid");
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var results = ["name", "org", "role", "email", "msg"].map(check);
      if (results.indexOf(false) !== -1) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "ENQ-" + new Date().getFullYear() + "-" + String(1000 + Math.floor(Math.random() * 9000));
      confRef.textContent = ref;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.focus();
    });
  }
})();

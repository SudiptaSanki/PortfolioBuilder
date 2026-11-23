/* Marlowe Palaeobotany — register tools.
   Every number on the page is computed from values printed on the page. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* Cross-document view transitions abort harmlessly when a navigation is
     interrupted; swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var fmtInt = function (n) { return n.toLocaleString("en-GB"); };
  var fmtGBP = function (n) { return "£" + n.toLocaleString("en-GB"); };

  /* ---------- mobile index panel ---------- */
  var btn = document.querySelector(".index-btn");
  var panel = document.getElementById("index-panel");
  if (btn && panel) {
    var closePanel = function () {
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
    };
    btn.addEventListener("click", function () {
      var opening = panel.hidden;
      if (opening) {
        panel.hidden = false;
        btn.setAttribute("aria-expanded", "true");
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      } else {
        closePanel();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { closePanel(); btn.focus(); }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closePanel();
    });
  }

  /* ---------- reveal on scroll (opacity only) ---------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- Tool 1: the Period Measure ---------- */
  var PERIODS = {
    cambrian:     { name: "Cambrian",     start: 538.8, end: 485.4 },
    ordovician:   { name: "Ordovician",   start: 485.4, end: 443.8 },
    silurian:     { name: "Silurian",     start: 443.8, end: 419.2 },
    devonian:     { name: "Devonian",     start: 419.2, end: 358.9 },
    carboniferous:{ name: "Carboniferous",start: 358.9, end: 298.9 },
    permian:      { name: "Permian",      start: 298.9, end: 251.9 },
    triassic:     { name: "Triassic",     start: 251.9, end: 201.4 },
    jurassic:     { name: "Jurassic",     start: 201.4, end: 145.0 },
    cretaceous:   { name: "Cretaceous",   start: 145.0, end: 66.0 },
    paleogene:    { name: "Paleogene",    start: 66.0,  end: 23.03 },
    neogene:      { name: "Neogene",      start: 23.03, end: 2.58 },
    quaternary:   { name: "Quaternary",   start: 2.58,  end: 0 }
  };
  var PHANEROZOIC = 538.8; /* Ma — base of the Cambrian, as printed in the table */
  var periodSel = document.getElementById("period-select");
  if (periodSel) {
    var pDur = document.getElementById("period-duration");
    var pShare = document.getElementById("period-share");
    var pArith = document.getElementById("period-arith");
    var pRowNote = document.getElementById("period-row-note");
    var renderPeriod = function () {
      var p = PERIODS[periodSel.value];
      if (!p) return;
      var dur = p.start - p.end;
      var share = (dur / PHANEROZOIC) * 100;
      pDur.textContent = dur.toFixed(1) + " million years";
      pShare.textContent = share.toFixed(1) + "% of the Phanerozoic";
      pArith.textContent =
        p.start.toFixed(2).replace(/\.?0+$/, "") + " − " + p.end.toFixed(2).replace(/\.?0+$/, "") +
        " = " + dur.toFixed(1) + " Myr · " + dur.toFixed(1) + " ÷ 538.8 × 100 = " + share.toFixed(1) + "%";
      document.querySelectorAll("table.timescale tbody tr").forEach(function (tr) {
        tr.classList.toggle("hl", tr.getAttribute("data-period") === periodSel.value);
      });
      if (pRowNote) {
        pRowNote.textContent = p.name + " row highlighted in the table — the same figures the sheet reads.";
      }
    };
    periodSel.addEventListener("change", renderPeriod);
    renderPeriod();
  }

  /* ---------- Tool 2: the Radiocarbon Limit ---------- */
  var HALF_LIFE = 5730; /* years — printed on the page */
  var rcState = { n: 0 };
  var rcVal = document.getElementById("rc-value");
  if (rcVal) {
    var rcMinus = document.getElementById("rc-minus");
    var rcPlus = document.getElementById("rc-plus");
    var rcFrac = document.getElementById("rc-fraction");
    var rcPct = document.getElementById("rc-percent");
    var rcYears = document.getElementById("rc-years");
    var rcBar = document.getElementById("rc-bar-fill");
    var rcNote = document.getElementById("rc-note");
    var renderRC = function () {
      var n = rcState.n;
      var denom = Math.pow(2, n);
      var pct = 100 / denom;
      rcVal.firstChild.textContent = String(n);
      rcFrac.textContent = n === 0 ? "all of it — 1/1" : "1/" + fmtInt(denom) + " remains";
      rcPct.textContent = (pct >= 0.1 ? pct.toFixed(2).replace(/0$/, "") : pct.toFixed(3)) + "% of the original ¹⁴C";
      rcYears.textContent = fmtInt(n * HALF_LIFE) + " years elapsed";
      rcBar.style.width = Math.max(pct, 0.6) + "%";
      rcMinus.disabled = n <= 0;
      rcPlus.disabled = n >= 10;
      rcNote.textContent = n >= 8
        ? "At " + n + " half-lives the remaining ¹⁴C is at the edge of what a laboratory can measure. Amber is millions of years older than this entire scale."
        : "Each step halves what is left. Step to 8 or beyond and the signal reaches the practical limit of the method.";
    };
    rcMinus.addEventListener("click", function () { if (rcState.n > 0) { rcState.n--; renderRC(); } });
    rcPlus.addEventListener("click", function () { if (rcState.n < 10) { rcState.n++; renderRC(); } });
    renderRC();
  }

  /* ---------- the documentation estimator ---------- */
  var estBand = document.getElementById("est-band");
  if (estBand) {
    var BANDS = {
      register: { label: "Register & photograph only", rate: 95 },
      standard: { label: "Standard documentation", rate: 210 },
      deep:     { label: "Deep documentation", rate: 460 }
    };
    var CT_DAY = 620, REPORT = 240;
    var pieces = 12, days = 0;
    var pVal = document.getElementById("est-pieces-value");
    var dVal = document.getElementById("est-days-value");
    var pMinus = document.getElementById("est-pieces-minus"), pPlus = document.getElementById("est-pieces-plus");
    var dMinus = document.getElementById("est-days-minus"), dPlus = document.getElementById("est-days-plus");
    var reportChk = document.getElementById("est-report");
    var lines = document.getElementById("est-lines");
    var renderEst = function () {
      var band = BANDS[estBand.value];
      var pieceTotal = pieces * band.rate;
      var ctTotal = days * CT_DAY;
      var repTotal = reportChk.checked ? REPORT : 0;
      var total = pieceTotal + ctTotal + repTotal;
      pVal.firstChild.textContent = String(pieces);
      dVal.firstChild.textContent = String(days);
      pMinus.disabled = pieces <= 1; pPlus.disabled = pieces >= 60;
      dMinus.disabled = days <= 0; dPlus.disabled = days >= 5;
      lines.innerHTML =
        "<div>" + pieces + " pieces × " + fmtGBP(band.rate) + " (" + band.label.toLowerCase() + ") = " + fmtGBP(pieceTotal) + "</div>" +
        "<div>Micro-CT session days: " + days + " × " + fmtGBP(CT_DAY) + " = " + fmtGBP(ctTotal) + "</div>" +
        "<div>Full written report: " + (reportChk.checked ? fmtGBP(REPORT) : "not included — £0") + "</div>" +
        "<div class=\"total\">Estimated total: " + fmtGBP(total) + "</div>";
    };
    estBand.addEventListener("change", renderEst);
    reportChk.addEventListener("change", renderEst);
    pMinus.addEventListener("click", function () { if (pieces > 1) { pieces--; renderEst(); } });
    pPlus.addEventListener("click", function () { if (pieces < 60) { pieces++; renderEst(); } });
    dMinus.addEventListener("click", function () { if (days > 0) { days--; renderEst(); } });
    dPlus.addEventListener("click", function () { if (days < 5) { days++; renderEst(); } });
    renderEst();
  }

  /* ---------- enquiry form ---------- */
  var form = document.getElementById("enquiry-form");
  if (form) {
    var confirmBox = document.getElementById("confirmation");
    var setErr = function (id, msg) {
      var field = document.getElementById("f-" + id);
      var err = document.getElementById("err-" + id);
      if (field) field.classList.toggle("invalid", !!msg);
      if (err) { err.textContent = msg || ""; err.hidden = !msg; }
      return !msg;
    };
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("enq-name").value.trim();
      var email = document.getElementById("enq-email").value.trim();
      var org = document.getElementById("enq-org").value;
      var piecesV = document.getElementById("enq-pieces").value.trim();
      var msg = document.getElementById("enq-message").value.trim();
      var ok = true;
      ok = setErr("name", name ? "" : "Your name is needed for the register.") && ok;
      ok = setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? "" : "Enter an email address the reply can reach.") && ok;
      ok = setErr("org", org ? "" : "Choose the kind of collection this is.") && ok;
      ok = setErr("pieces", piecesV && +piecesV >= 1 ? "" : "At least one piece — enter the count, even if it is a guess.") && ok;
      ok = setErr("message", msg.length >= 12 ? "" : "A sentence or two about the material — what it is said to be, and where it sits now.") && ok;
      if (!ok) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid select, .field.invalid textarea");
        if (firstBad) firstBad.focus();
        return;
      }
      var seed = (name.replace(/[^A-Za-z]/g, "").slice(0, 2) || "EN").toUpperCase();
      var ref = "ENQ-" + seed + "-" + String(piecesV).padStart(2, "0") + "-" + (1000 + ((name.length * 137 + msg.length * 31) % 9000));
      document.getElementById("confirmation-ref").textContent = ref;
      document.getElementById("confirmation-line").textContent =
        "Entered for " + name + " — " + piecesV + (piecesV === "1" ? " piece" : " pieces") + ", " + org.toLowerCase() + ".";
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute("tabindex", "-1");
      confirmBox.focus();
    });
    ["name", "email", "org", "pieces", "message"].forEach(function (id) {
      var el = document.getElementById("enq-" + id);
      if (el) el.addEventListener("input", function () { setErr(id, ""); });
    });
  }
})();

/* ABYSSAL SMOKER — shared script
   Menu (all pages) · Dive Budget Planner + Cruise Estimator (index) · Enquiry form (contact) */

/* Cross-document view transitions abort as an unhandled rejection in Chrome
   when a navigation interrupts one; the navigation itself always completes.
   Swallow only that specific abort so it never surfaces as a page error. */
window.addEventListener("unhandledrejection", function (e) {
  var r = e.reason;
  if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
    e.preventDefault();
  }
});

/* ---------- mobile log-index panel ---------- */
(function () {
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("menuPanel");
  if (!btn || !panel) return;
  var closeBtn = panel.querySelector(".mpanel-close");
  function open() {
    panel.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () {
      panel.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      var first = panel.querySelector("nav a");
      if (first) first.focus();
    });
  }
  function close() {
    panel.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
    window.setTimeout(function () { panel.hidden = true; }, 60);
    btn.focus();
  }
  btn.addEventListener("click", open);
  if (closeBtn) closeBtn.addEventListener("click", close);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !panel.hidden) close();
  });
})();

/* ---------- number helpers ---------- */
function fmt(n) { return n.toLocaleString("en-US"); }
function money(n) { return "$" + fmt(n); }

/* ---------- Dive Budget Planner (index) ----------
   Planning figures are printed on the page (table #planFigs) and mirrored here.
   Transit times are rounded UP to the next minute — conservative planning. */
(function () {
  var root = document.getElementById("planner");
  if (!root) return;
  var FIG = { window: 540, allow: 45, desc: 35, asc: 30, min: 120 };
  var range = document.getElementById("depthRange");
  var out = document.getElementById("depthOut");
  var minus = document.getElementById("depthMinus");
  var plus = document.getElementById("depthPlus");
  var calc = document.getElementById("calcLines");
  var btVal = document.getElementById("btVal");
  var btHrs = document.getElementById("btHrs");
  var flag = document.getElementById("flagBox");
  var flagText = document.getElementById("flagText");
  var line = document.getElementById("profLine");
  var dLab = document.getElementById("profDepthLab");
  var descLab = document.getElementById("profDescLab");
  var botLab = document.getElementById("profBotLab");
  var ascLab = document.getElementById("profAscLab");

  var X0 = 48, XW = 568, Y0 = 26, YH = 224;
  function x(t) { return X0 + (t / FIG.window) * XW; }
  function y(d, depth) { return Y0 + (d / depth) * YH; }

  function render() {
    var depth = parseInt(range.value, 10);
    var descT = Math.ceil(depth / FIG.desc);
    var ascT = Math.ceil(depth / FIG.asc);
    var bottom = FIG.window - FIG.allow - descT - ascT;
    out.textContent = fmt(depth);
    calc.innerHTML =
      '<div class="ln"><span class="k">Descent&nbsp;&nbsp;</span>' + fmt(depth) + ' m ÷ ' + FIG.desc + ' m/min = ' +
        (depth / FIG.desc).toFixed(1) + ' → <span class="r">' + descT + ' min</span> <span class="k">(rounded up)</span></div>' +
      '<div class="ln"><span class="k">Ascent&nbsp;&nbsp;&nbsp;</span>' + fmt(depth) + ' m ÷ ' + FIG.asc + ' m/min = ' +
        (depth / FIG.asc).toFixed(1) + ' → <span class="r">' + ascT + ' min</span> <span class="k">(rounded up)</span></div>' +
      '<div class="ln"><span class="k">Bottom&nbsp;&nbsp;&nbsp;</span>' + FIG.window + ' − ' + FIG.allow + ' − ' + descT + ' − ' + ascT +
        ' = <span class="r">' + bottom + ' min</span></div>';
    btVal.textContent = bottom + " min";
    btHrs.textContent = "= " + Math.floor(bottom / 60) + " h " + String(bottom % 60).padStart(2, "0") + " min on the bottom";
    if (bottom < FIG.min) {
      flag.hidden = false;
      flagText.textContent = "At " + fmt(depth) + " m the dive returns " + bottom + " minutes of bottom time — below this practice's minimum useful bottom time of " + FIG.min + " minutes. Most of the day is spent travelling. Replan: a shallower target, a survey-only dive with no sampling, or a second day on station.";
    } else {
      flag.hidden = true;
    }
    /* dive-profile diagram — scales to the chosen depth; labelled a diagram */
    var pts = [
      x(0) + "," + y(0, depth),
      x(descT) + "," + y(depth, depth),
      x(descT + bottom) + "," + y(depth, depth),
      x(descT + bottom + ascT) + "," + y(0, depth)
    ].join(" ");
    line.setAttribute("points", pts);
    dLab.setAttribute("x", X0 + 4); dLab.setAttribute("y", y(depth, depth) - 8);
    dLab.textContent = fmt(depth) + " m";
    descLab.setAttribute("x", (x(0) + x(descT)) / 2 - 6); descLab.setAttribute("y", (y(0, depth) + y(depth, depth)) / 2 - 8);
    descLab.textContent = "down " + descT + " min";
    botLab.setAttribute("x", (x(descT) + x(descT + bottom)) / 2); botLab.setAttribute("y", y(depth, depth) + 20);
    botLab.textContent = "bottom " + bottom + " min";
    ascLab.setAttribute("x", (x(descT + bottom) + x(descT + bottom + ascT)) / 2 + 6); ascLab.setAttribute("y", (y(0, depth) + y(depth, depth)) / 2 - 8);
    ascLab.textContent = "up " + ascT + " min";
  }
  range.addEventListener("input", render);
  minus.addEventListener("click", function () {
    range.value = Math.max(parseInt(range.min, 10), parseInt(range.value, 10) - parseInt(range.step, 10));
    render();
  });
  plus.addEventListener("click", function () {
    range.value = Math.min(parseInt(range.max, 10), parseInt(range.value, 10) + parseInt(range.step, 10));
    render();
  });
  render();
})();

/* ---------- Cruise Estimator (index) ----------
   Rates are printed on the page (table #estRates) and mirrored here. */
(function () {
  var root = document.getElementById("estimator");
  if (!root) return;
  var RATE = { vessel: 52000, team: 1900, sample: 240, report: 12000 };
  var state = { days: 14, samples: 120 };
  var daysN = document.getElementById("daysN");
  var samplesN = document.getElementById("samplesN");
  var lines = document.getElementById("estLines");
  function render() {
    var v = state.days * RATE.vessel;
    var t = state.days * RATE.team;
    var a = state.samples * RATE.sample;
    var total = v + t + a + RATE.report;
    daysN.textContent = state.days;
    samplesN.textContent = state.samples;
    lines.innerHTML =
      '<div class="ln"><span class="k">Vessel — ' + state.days + ' days × ' + money(RATE.vessel) + '</span><span class="v">' + money(v) + '</span></div>' +
      '<div class="ln"><span class="k">Science team — ' + state.days + ' days × ' + money(RATE.team) + '</span><span class="v">' + money(t) + '</span></div>' +
      '<div class="ln"><span class="k">Analysis — ' + state.samples + ' samples × ' + money(RATE.sample) + '</span><span class="v">' + money(a) + '</span></div>' +
      '<div class="ln"><span class="k">Report &amp; data delivery — fixed</span><span class="v">' + money(RATE.report) + '</span></div>' +
      '<div class="ln total"><span class="k">Planning total</span><span class="v">' + money(total) + '</span></div>';
  }
  function bind(id, key, step, min, max) {
    document.getElementById(id + "Minus").addEventListener("click", function () {
      state[key] = Math.max(min, state[key] - step); render();
    });
    document.getElementById(id + "Plus").addEventListener("click", function () {
      state[key] = Math.min(max, state[key] + step); render();
    });
  }
  bind("days", "days", 1, 3, 40);
  bind("samples", "samples", 10, 0, 400);
  render();
})();

/* ---------- Enquiry form (contact) — demonstration form, nothing is transmitted ---------- */
(function () {
  var form = document.getElementById("enquiryForm");
  if (!form) return;
  var panel = document.getElementById("confirmPanel");
  var refEl = document.getElementById("confirmRef");
  function setErr(id, msg) {
    var f = document.getElementById(id);
    var e = document.getElementById(id + "Err");
    if (e) e.textContent = msg || "";
    if (f) f.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var name = document.getElementById("fName");
    var org = document.getElementById("fOrg");
    var email = document.getElementById("fEmail");
    var msg = document.getElementById("fMsg");
    var ok = true;
    ok = setErr("fName", name.value.trim().length >= 2 ? "" : "Please give your name.") && ok;
    ok = setErr("fOrg", org.value.trim().length >= 2 ? "" : "Please give your institution or programme.") && ok;
    ok = setErr("fEmail", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()) ? "" : "Please give a valid email address.") && ok;
    ok = setErr("fMsg", msg.value.trim().length >= 20 ? "" : "Please describe the programme in a sentence or two (20+ characters).") && ok;
    if (!ok) {
      var bad = form.querySelector('[aria-invalid="true"]');
      if (bad) bad.focus();
      return;
    }
    var ref = "VENT-ENQ-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000);
    refEl.textContent = ref;
    form.hidden = true;
    panel.hidden = false;
    panel.setAttribute("tabindex", "-1");
    panel.focus();
  });
})();

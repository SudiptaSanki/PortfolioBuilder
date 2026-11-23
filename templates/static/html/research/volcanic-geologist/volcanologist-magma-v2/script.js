/* Voss Volcano Science — shared script.
   Instruments: VEI explorer (index), programme estimator (index),
   mobile log-index panel, enquiry form (contact), reveal-on-scroll.
   No audio anywhere: volcanology fails the sound need-test. */

/* Cross-document view transitions abort noisily when interrupted;
   the navigation itself always completes. Swallow only that rejection. */
window.addEventListener("unhandledrejection", function (e) {
  var r = e.reason;
  if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
    e.preventDefault();
  }
});

/* ---------- mobile log-index panel ---------- */
(function () {
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("log-panel");
  if (!btn || !panel) return;
  function setOpen(open) {
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    panel.classList.toggle("open", open);
    if (open) {
      /* focus only once the panel is actually visible (rAF after class) */
      requestAnimationFrame(function () {
        var first = panel.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      });
    }
  }
  btn.addEventListener("click", function () {
    setOpen(!panel.classList.contains("open"));
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) {
      setOpen(false);
      btn.focus();
    }
  });
  panel.addEventListener("click", function (e) {
    if (e.target.closest("a")) setOpen(false);
  });
})();

/* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
(function () {
  var els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
    els.forEach(function (el) { el.classList.add("in"); });
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.08 });
  els.forEach(function (el) { io.observe(el); });
})();

/* ---------- helpers ---------- */
function fmtInt(n) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
function fmtEUR(n) { return "€" + fmtInt(n); }

/* ---------- VEI explorer ---------- */
(function () {
  var root = document.getElementById("vei-explorer");
  if (!root) return;

  /* The printed scale. loExp = log10 of the level's lower bound in km3.
     VEI 1 spans two orders (0.00001–0.001), so its lower bound is 10^-5
     and VEI 2 begins at 10^-3 — the table on the page says the same. */
  var VEI = [
    { v: 0, range: "< 0.00001",       loExp: null, term: "Gentle — effusive", ex: "Kīlauea, Hawaiʻi — effusive episodes" },
    { v: 1, range: "0.00001 – 0.001", loExp: -5,   term: "Gentle",            ex: "Stromboli, Italy — routine activity" },
    { v: 2, range: "0.001 – 0.01",    loExp: -3,   term: "Explosive",         ex: "Etna, Italy — paroxysmal episodes" },
    { v: 3, range: "0.01 – 0.1",      loExp: -2,   term: "Explosive",         ex: "Soufrière Hills, Montserrat — 1995–2010 phases" },
    { v: 4, range: "0.1 – 1",         loExp: -1,   term: "Cataclysmic",       ex: "Eyjafjallajökull, Iceland — 2010" },
    { v: 5, range: "1 – 10",          loExp: 0,    term: "Cataclysmic",       ex: "Mount St. Helens, USA — 1980" },
    { v: 6, range: "10 – 100",        loExp: 1,    term: "Colossal",          ex: "Pinatubo, Philippines — 1991" },
    { v: 7, range: "100 – 1,000",     loExp: 2,    term: "Super-colossal",    ex: "Tambora, Indonesia — 1815" },
    { v: 8, range: "> 1,000",         loExp: 3,    term: "Mega-colossal",     ex: "Toba, Indonesia — about 74,000 years ago" }
  ];
  function loText(exp) {
    if (exp >= 0) return fmtInt(Math.pow(10, exp));
    var s = "0.";
    for (var i = 0; i < -exp - 1; i++) s += "0";
    return s + "1";
  }
  function ratioText(diff) {
    if (diff >= 0) return fmtInt(Math.pow(10, diff));
    var s = "0.";
    for (var i = 0; i < -diff - 1; i++) s += "0";
    return s + "1";
  }

  var state = { a: 3, b: 6 };
  var valA = document.getElementById("vei-a-val");
  var valB = document.getElementById("vei-b-val");
  var outA = document.getElementById("vei-a-out");
  var outB = document.getElementById("vei-b-out");
  var ratio = document.getElementById("vei-ratio");
  var btns = {
    aMinus: document.getElementById("vei-a-minus"), aPlus: document.getElementById("vei-a-plus"),
    bMinus: document.getElementById("vei-b-minus"), bPlus: document.getElementById("vei-b-plus")
  };
  var rungs = root.querySelectorAll(".rung");
  var rows = root.querySelectorAll("table.vei tbody tr");

  function describe(d) {
    return "<span class=\"big\">VEI " + d.v + "</span> — bulk volume <b>" + d.range +
      " km³</b> · " + d.term + " · recorded example: " + d.ex + ".";
  }

  function render() {
    var A = VEI[state.a], B = VEI[state.b];
    valA.textContent = "VEI " + A.v;
    valB.textContent = "VEI " + B.v;
    outA.innerHTML = describe(A) + " Rung <b>" + (A.v + 1) + " of 9</b> on the ladder.";
    outB.innerHTML = describe(B) + " Rung <b>" + (B.v + 1) + " of 9</b> on the ladder.";
    btns.aMinus.disabled = state.a <= 0; btns.aPlus.disabled = state.a >= 8;
    btns.bMinus.disabled = state.b <= 0; btns.bPlus.disabled = state.b >= 8;
    rungs.forEach(function (r) {
      var v = +r.getAttribute("data-v");
      r.classList.toggle("on-a", v === state.a);
      r.classList.toggle("on-b", v === state.b);
    });
    rows.forEach(function (tr) {
      var v = +tr.getAttribute("data-v");
      tr.classList.toggle("sel", v === state.a || v === state.b);
    });

    if (A.loExp === null || B.loExp === null) {
      ratio.innerHTML = "<span class=\"arith\">No ratio from VEI 0.</span><br>" +
        "VEI 0 has no lower bound — its range is simply \u201cless than 0.00001 km³\u201d, " +
        "so a ratio from it is not defined. Step both levels to VEI 1 or above and the sheet will divide.";
    } else {
      var diff = B.loExp - A.loExp;
      var loA = loText(A.loExp), loB = loText(B.loExp);
      var r = ratioText(diff);
      var sentence;
      if (diff === 0) {
        sentence = "Same rung. Two eruptions at the same VEI can still differ tenfold inside the range — the scale sorts by order of magnitude, not by exact size.";
      } else if (diff > 0) {
        sentence = "VEI " + B.v + "'s lower bound is <b>" + r + "×</b> VEI " + A.v + "'s. " +
          "That is what \u201clogarithmic\u201d means in practice: three rungs apart is not \u201cthree more\u201d, it is a thousand times the rock.";
      } else {
        sentence = "VEI " + B.v + "'s lower bound is <b>" + r + "×</b> VEI " + A.v + "'s — the smaller event, by lower bound. " +
          "Swap the steppers to read the comparison the other way up.";
      }
      ratio.innerHTML = "<span class=\"arith\">Lower bounds — VEI " + B.v + " = " + loB +
        " km³, VEI " + A.v + " = " + loA + " km³: <b>" + loB + " ÷ " + loA + " = " + r + "×</b></span><br>" + sentence;
    }
  }

  function step(which, d) {
    state[which] = Math.min(8, Math.max(0, state[which] + d));
    render();
  }
  btns.aMinus.addEventListener("click", function () { step("a", -1); });
  btns.aPlus.addEventListener("click", function () { step("a", 1); });
  btns.bMinus.addEventListener("click", function () { step("b", -1); });
  btns.bPlus.addEventListener("click", function () { step("b", 1); });
  render();
})();

/* ---------- programme estimator ---------- */
(function () {
  var root = document.getElementById("estimator");
  if (!root) return;
  var rows = [
    { id: "senior",  label: "Lead volcanologist",      rate: 1150, unit: "day",     n: 6 },
    { id: "field",   label: "Field scientist",         rate: 780,  unit: "day",     n: 10 },
    { id: "analyst", label: "Data analyst",            rate: 620,  unit: "day",     n: 8 },
    { id: "report",  label: "Assessment reports",      rate: 2400, unit: "report",  n: 1 }
  ];
  var linesEl = document.getElementById("est-lines");
  var totalEl = document.getElementById("est-total");

  function render() {
    var total = 0, html = "";
    rows.forEach(function (r) {
      var sub = r.n * r.rate;
      total += sub;
      html += "<div class=\"row\"><span>" + r.n + " × " + fmtEUR(r.rate) + " — " + r.label.toLowerCase() +
        "</span><span>" + fmtEUR(sub) + "</span></div>";
      var val = document.getElementById("est-" + r.id + "-val");
      if (val) val.textContent = r.n;
      var minus = document.getElementById("est-" + r.id + "-minus");
      if (minus) minus.disabled = r.n <= 0;
    });
    linesEl.innerHTML = html;
    totalEl.textContent = fmtEUR(total);
  }
  rows.forEach(function (r) {
    var minus = document.getElementById("est-" + r.id + "-minus");
    var plus = document.getElementById("est-" + r.id + "-plus");
    if (minus) minus.addEventListener("click", function () { r.n = Math.max(0, r.n - 1); render(); });
    if (plus) plus.addEventListener("click", function () { r.n = Math.min(120, r.n + 1); render(); });
  });
  render();
})();

/* ---------- enquiry form (contact page — demonstration only) ---------- */
(function () {
  var form = document.getElementById("enquiry-form");
  if (!form) return;
  var confirm = document.getElementById("enquiry-confirm");
  var refEl = document.getElementById("confirm-ref");

  function check(fieldId, ok) {
    var f = document.getElementById(fieldId);
    var wrap = f.closest(".field");
    wrap.classList.toggle("invalid", !ok);
    f.setAttribute("aria-invalid", ok ? "false" : "true");
    return ok;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = document.getElementById("f-name");
    var email = document.getElementById("f-email");
    var msg = document.getElementById("f-message");
    var ok = true;
    ok = check("f-name", name.value.trim().length >= 2) && ok;
    ok = check("f-email", /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
    ok = check("f-message", msg.value.trim().length >= 20) && ok;
    if (!ok) {
      var firstBad = form.querySelector(".field.invalid input, .field.invalid textarea");
      if (firstBad) firstBad.focus();
      return;
    }
    var ref = "ENQ-" + Math.floor(1000 + Math.random() * 9000);
    refEl.textContent = ref;
    form.hidden = true;
    confirm.hidden = false;
    confirm.setAttribute("tabindex", "-1");
    confirm.focus({ preventScroll: false });
  });
  ["f-name", "f-email", "f-message"].forEach(function (id) {
    var f = document.getElementById(id);
    f.addEventListener("input", function () {
      f.closest(".field").classList.remove("invalid");
    });
  });
})();

/* ---------- footer year ---------- */
(function () {
  var y = document.getElementById("yr");
  if (y) y.textContent = new Date().getFullYear();
})();

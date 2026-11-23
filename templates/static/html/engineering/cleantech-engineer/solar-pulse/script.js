/* Hartley Solar Design — shared script.
   Sound ruling: FAILS the need-test — no audio anywhere on this site.
   The stub's hover "grid hum" was deleted, not rebuilt: a solar
   designer's portfolio has nothing that needs to hum.

   THE MODEL — one source of truth for the whole page.
   BASE: reference monthly yield in kWh per kWp, south-facing,
   ~35 deg tilt, unshaded, central England (992 kWh/kWp/yr,
   capacity factor 11.3%). FACTOR: orientation/tilt deratings in
   the standard guidance shape (SE/SW ~0.96, flat ~0.87,
   east-west split ~0.83 of optimal). The explorer bars, the
   printed month table and the payback estimator all compute from
   these numbers, so they cannot disagree. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* View-transition abort guard: when Chrome aborts a cross-document
     transition it surfaces an unhandled InvalidStateError rejection
     although the navigation completed. Swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- mobile menu ---------------- */
  var panel = document.getElementById("mobilePanel");
  var openBtn = document.getElementById("menuBtn");
  var closeBtn = document.getElementById("panelClose");
  if (panel && openBtn && closeBtn) {
    var lastFocus = null;
    function openPanel() {
      lastFocus = document.activeElement;
      panel.classList.add("open");
      panel.setAttribute("aria-hidden", "false");
      openBtn.setAttribute("aria-expanded", "true");
      document.body.classList.add("locked");
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { closeBtn.focus(); });
      });
    }
    function closePanel() {
      panel.classList.remove("open");
      panel.setAttribute("aria-hidden", "true");
      openBtn.setAttribute("aria-expanded", "false");
      document.body.classList.remove("locked");
      if (lastFocus) lastFocus.focus();
    }
    openBtn.addEventListener("click", openPanel);
    closeBtn.addEventListener("click", closePanel);
    panel.querySelector(".scrim").addEventListener("click", closePanel);
    panel.querySelectorAll("nav a").forEach(function (a) {
      a.addEventListener("click", closePanel);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel();
    });
  }

  /* ---------------- reveals ---------------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length && !reduceMotion && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  } else {
    rvEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------------- yield explorer + estimator ---------------- */
  var BASE = [30, 48, 82, 112, 128, 132, 130, 116, 92, 62, 36, 24];
  var FACTOR = { south: 1.00, sesw: 0.96, ew: 0.83, flat: 0.87 };
  var MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  var RATE = { low: 1350, mid: 1550, high: 1750, importP: 0.245, exportP: 0.15 };

  var state = { kwp: 5, orient: "south", sc: 0.5 };
  var fmt = function (n) { return n.toLocaleString("en-GB"); };
  var money = function (n) { return "£" + fmt(Math.round(n / 5) * 5); };

  var barsEl = document.getElementById("bars");
  if (barsEl) {
    var fills = barsEl.querySelectorAll(".bar-fill");
    var vals = barsEl.querySelectorAll(".bar-val");
    var cols = barsEl.querySelectorAll(".bar-col");
    var rows = document.querySelectorAll("#yieldTable tbody tr[data-m]");
    var totalKwhEl = document.getElementById("tAnnual");
    var roAnnual = document.getElementById("roAnnual");
    var roJune = document.getElementById("roJune");
    var roDec = document.getElementById("roDec");
    var roCF = document.getElementById("roCF");
    var roShape = document.getElementById("roShape");

    function months() {
      var f = FACTOR[state.orient];
      return BASE.map(function (b) { return Math.round(b * state.kwp * f); });
    }

    function render() {
      var m = months();
      var annual = m.reduce(function (a, b) { return a + b; }, 0);
      var max = Math.max.apply(null, m);
      var minI = m.indexOf(Math.min.apply(null, m));
      var maxI = m.indexOf(max);
      m.forEach(function (v, i) {
        fills[i].style.height = Math.max(2, (v / max) * 100) + "%";
        vals[i].textContent = fmt(v);
        cols[i].classList.toggle("worst", i === minI);
        if (rows[i]) {
          rows[i].querySelector(".kwh").textContent = fmt(v);
          rows[i].querySelector(".share").textContent = (v / annual * 100).toFixed(1) + "%";
          rows[i].classList.toggle("worst-row", i === minI);
        }
      });
      document.querySelectorAll(".bar-months span").forEach(function (s, i) {
        s.classList.toggle("worst", i === minI);
      });
      if (totalKwhEl) totalKwhEl.textContent = fmt(annual);
      roAnnual.textContent = fmt(annual) + " kWh";
      roJune.textContent = fmt(m[maxI]) + " kWh";
      roDec.textContent = fmt(m[minI]) + " kWh";
      roCF.textContent = (annual / (state.kwp * 8760) * 100).toFixed(1) + "%";
      roShape.textContent = MONTHS[maxI] + " makes " + (m[maxI] / m[minI]).toFixed(1) +
        "× what " + MONTHS[minI] + " makes. Any design quoted on the summer figure alone is sized for a season you don't live in.";
      renderEstimate(annual);
    }

    function renderEstimate(annual) {
      var cost = document.getElementById("estCost");
      if (!cost) return;
      var costMid = state.kwp * RATE.mid;
      var saving = annual * (state.sc * RATE.importP + (1 - state.sc) * RATE.exportP);
      document.getElementById("estPayback").textContent =
        (costMid / saving).toFixed(1) + " years";
      cost.textContent = money(costMid);
      document.getElementById("estCostBand").textContent =
        money(state.kwp * RATE.low) + " – " + money(state.kwp * RATE.high);
      document.getElementById("estGen").textContent = fmt(annual) + " kWh";
      document.getElementById("estSaving").textContent = money(saving);
      document.getElementById("estBand").textContent =
        (state.kwp * RATE.low / saving).toFixed(1) + " – " +
        (state.kwp * RATE.high / saving).toFixed(1) + " years";
    }

    function wireChips(containerId, key, parse) {
      var c = document.getElementById(containerId);
      if (!c) return;
      c.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () {
          c.querySelectorAll(".chip").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
          chip.setAttribute("aria-pressed", "true");
          state[key] = parse(chip.getAttribute("data-v"));
          render();
        });
      });
    }
    wireChips("sizeChips", "kwp", parseFloat);
    wireChips("orientChips", "orient", function (v) { return v; });
    wireChips("scChips", "sc", parseFloat);
    render();
  }

  /* ---------------- contact form ---------------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmBox = document.getElementById("confirmBox");
    var params = new URLSearchParams(window.location.search);
    var typeSel = document.getElementById("fType");
    var wanted = params.get("type");
    if (typeSel && wanted) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    function setInvalid(id, bad) {
      var f = document.getElementById(id);
      if (f) f.classList.toggle("invalid", bad);
      return !bad;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var email = document.getElementById("fEmail").value.trim();
      var msg = document.getElementById("fMsg").value.trim();
      var ok = true;
      ok = setInvalid("fldName", name.length < 2) && ok;
      ok = setInvalid("fldEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) && ok;
      ok = setInvalid("fldMsg", msg.length < 10) && ok;
      if (!ok) return;
      var h = 0, s = name + "|" + email + "|" + msg;
      for (var j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) % 900;
      document.getElementById("confRef").textContent = "HS-2026-" + (100 + h);
      document.getElementById("confName").textContent = name.split(" ")[0];
      form.style.display = "none";
      confirmBox.classList.add("show");
      confirmBox.setAttribute("tabindex", "-1");
      confirmBox.focus();
    });
    ["fName", "fEmail", "fMsg"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener("input", function () {
        el.closest(".field").classList.remove("invalid");
      });
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.style.display = "";
        confirmBox.classList.remove("show");
        document.getElementById("fName").focus();
      });
    }
  }
})();

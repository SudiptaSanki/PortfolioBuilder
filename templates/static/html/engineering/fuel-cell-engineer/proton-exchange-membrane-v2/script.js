/* OPERATING POINT — shared behaviour.
   No audio anywhere: fuel-cell design is not a sound profession and
   nothing on this site teaches through sound (program sound need-test).
   The stub's proton-particle canvas is gone; the curve is the visual. */
(function () {
  "use strict";

  /* Cross-document view transitions: when the browser aborts one
     (rapid navigation, bfcache), the abort surfaces as an unhandled
     promise rejection. Swallow ONLY that specific rejection; the
     navigation itself always completes. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile bench-index panel ---------- */
  var btn = document.getElementById("benchBtn");
  var panel = document.getElementById("benchPanel");
  if (btn && panel) {
    function setPanel(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open) {
        panel.hidden = false;
        panel.classList.add("open");
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus({ preventScroll: true });
        });
      } else {
        panel.classList.remove("open");
        panel.hidden = true;
      }
    }
    btn.addEventListener("click", function () {
      setPanel(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setPanel(false);
        btn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setPanel(false);
    });
  }

  /* ---------- scroll reveal (progressive: content visible without JS) ---------- */
  if (!reduced && "IntersectionObserver" in window) {
    var rvEls = document.querySelectorAll(".rv");
    rvEls.forEach(function (el) { el.classList.add("pre"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.remove("pre");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12 });
    rvEls.forEach(function (el) { io.observe(el); });
  }

  var gbp = function (n) { return "£" + n.toLocaleString("en-GB"); };
  var num = function (n) { return n.toLocaleString("en-GB"); };

  /* Generic stepper wiring: buttons carry data-step-btn (value element
     id) and data-dir (-1/+1); the value element carries
     data-min/max/step/value. Wired ONCE for the whole page; every tool
     registers its render callback in stepperCallbacks. */
  var stepperCallbacks = [];
  var steppersWired = false;
  function wireSteppers() {
    if (steppersWired) return;
    steppersWired = true;
    document.querySelectorAll("[data-step-btn]").forEach(function (b) {
      b.addEventListener("click", function () {
        var valEl = document.getElementById(b.getAttribute("data-step-btn"));
        if (!valEl) return;
        var step = parseFloat(valEl.getAttribute("data-step")) || 1;
        var min = parseFloat(valEl.getAttribute("data-min"));
        var max = parseFloat(valEl.getAttribute("data-max"));
        var cur = parseFloat(valEl.getAttribute("data-value"));
        var next = cur + (parseFloat(b.getAttribute("data-dir")) * step);
        if (!isNaN(min)) next = Math.max(min, next);
        if (!isNaN(max)) next = Math.min(max, next);
        valEl.setAttribute("data-value", next);
        valEl.querySelector(".v-num").textContent = next;
        stepperCallbacks.forEach(function (fn) { fn(); });
      });
    });
  }

  /* ================= STACK SIZER (index) =================
     Printed Table 1 governs. Reference cell R-1, bench figures,
     80 °C, H2/air at 1.5 bar abs, beginning of life:
       j (A/cm2): 0.2   0.5   0.8   1.0   1.2   1.5   2.0
       V_cell   : 0.82  0.76  0.71  0.68  0.64  0.58  0.47
     Relations printed on the sheet:
       I = j x A · V_stack = N x V_cell · P = V_stack x I
       eta (LHV) = V_cell / 1.25 V                                  */
  var sizerRoot = document.getElementById("sizerTool");
  if (sizerRoot) {
    var POINTS = [
      { j: 0.2, v: 0.82 }, { j: 0.5, v: 0.76 }, { j: 0.8, v: 0.71 },
      { j: 1.0, v: 0.68 }, { j: 1.2, v: 0.64 }, { j: 1.5, v: 0.58 },
      { j: 2.0, v: 0.47 }
    ];
    var selPoint = 2; /* 0.8 A/cm2 — the practice's sizing point */
    var cellVal = document.getElementById("cellVal");
    var areaVal = document.getElementById("areaVal");
    var roI = document.getElementById("roI");
    var roV = document.getElementById("roV");
    var roP = document.getElementById("roP");
    var roEta = document.getElementById("roEta");
    var arith = document.getElementById("sizerArith");
    var cost = document.getElementById("sizerCost");
    var marker = document.getElementById("curveMarker");
    var markerDot = document.getElementById("curveMarkerDot");
    var pointLabel = document.getElementById("curvePointLabel");
    var pickerBtns = sizerRoot.querySelectorAll("[data-point]");

    function fmtJ(j) { return (j % 1 === 0 ? j.toFixed(1) : String(j)); }

    function renderSizer() {
      var N = parseFloat(cellVal.getAttribute("data-value"));
      var A = parseFloat(areaVal.getAttribute("data-value"));
      var p = POINTS[selPoint];
      var I = p.j * A;
      var V = N * p.v;
      var W = V * I;
      var eta = p.v / 1.25 * 100;
      roI.innerHTML = Math.round(I) + " <span>A</span>";
      roV.innerHTML = V.toFixed(1) + " <span>V</span>";
      roP.innerHTML = (W / 1000).toFixed(1) + " <span>kW</span>";
      roEta.innerHTML = eta.toFixed(1) + " <span>%</span>";
      arith.innerHTML =
        "<li>Current — <b>I = j × A</b> = " + fmtJ(p.j) + " A/cm² × " + A + " cm² = <b>" + Math.round(I) + " A</b></li>" +
        "<li>Stack voltage — <b>V = N × V<sub>cell</sub></b> = " + N + " × " + p.v.toFixed(2) + " V = <b>" + V.toFixed(1) + " V</b></li>" +
        "<li>Power — <b>P = V × I</b> = " + V.toFixed(1) + " V × " + Math.round(I) + " A = <b>" + num(Math.round(W)) + " W = " + (W / 1000).toFixed(1) + " kW</b></li>" +
        "<li>Efficiency, LHV — <b>η = V<sub>cell</sub> ÷ 1.25 V</b> = " + p.v.toFixed(2) + " ÷ 1.25 = <b>" + eta.toFixed(1) + "%</b></li>";
      if (selPoint === 0) {
        cost.innerHTML = "<b>What this point costs</b>" +
          "This is the gentlest printed point — nothing is given up in efficiency. " +
          "The price is paid in size instead: at 0.2 A/cm² each cell does a fraction of the work, " +
          "so the stack grows. Efficiency and power density pull opposite ways on the same curve; " +
          "the design question is where on it your duty cycle actually lives.";
      } else {
        var dEta = (POINTS[0].v - p.v) / 1.25 * 100;
        cost.innerHTML = "<b>What this point costs</b>" +
          "Running at " + fmtJ(p.j) + " A/cm² instead of 0.2 gives up <b>" + dEta.toFixed(1) +
          " points of efficiency</b> (65.6% → " + eta.toFixed(1) + "%) — the same cells make more " +
          "power and burn more hydrogen doing it. That trade is sometimes right. It should never be invisible.";
      }
      /* keep Table 1's highlighted row in step with the picker */
      sizerRoot.querySelectorAll("[data-trow]").forEach(function (tr, i) {
        tr.classList.toggle("pt-row", i === selPoint);
      });
      /* move the hero curve marker to the selected point */
      if (marker) {
        var cx = 70 + (p.j / 2.2) * 400;
        var cy = 250 - ((p.v - 0.30) / 0.65) * 220;
        marker.setAttribute("cx", cx.toFixed(1));
        marker.setAttribute("cy", cy.toFixed(1));
        markerDot.setAttribute("cx", cx.toFixed(1));
        markerDot.setAttribute("cy", cy.toFixed(1));
        pointLabel.textContent = fmtJ(p.j) + " A/cm² · " + p.v.toFixed(2) + " V · η " + eta.toFixed(1) + "%";
      }
    }

    pickerBtns.forEach(function (b) {
      b.addEventListener("click", function () {
        selPoint = parseInt(b.getAttribute("data-point"), 10);
        pickerBtns.forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        renderSizer();
      });
    });
    stepperCallbacks.push(renderSizer);
    wireSteppers();
    renderSizer();
  }

  /* ================= ESTIMATOR (index) =================
     Printed rates govern: design £1,150/day · balance-of-plant
     £980/day · bench day £1,450 · validation report £2,600 each. */
  var estRoot = document.getElementById("estTool");
  if (estRoot) {
    var LINES = [
      { id: "estDesign", label: "Stack design", rate: 1150, unit: "days" },
      { id: "estBop", label: "Balance-of-plant engineering", rate: 980, unit: "days" },
      { id: "estBench", label: "Bench validation", rate: 1450, unit: "days" },
      { id: "estReport", label: "Validation reports", rate: 2600, unit: "reports" }
    ];
    var estLines = document.getElementById("estLines");
    var estTotal = document.getElementById("estTotal");
    function renderEst() {
      var total = 0;
      var html = "";
      LINES.forEach(function (L) {
        var el = document.getElementById(L.id);
        var n = parseFloat(el.getAttribute("data-value"));
        var sub = n * L.rate;
        total += sub;
        html += "<li>" + L.label + " — " + n + " " + L.unit + " × " + gbp(L.rate) + " = <b>" + gbp(sub) + "</b></li>";
      });
      estLines.innerHTML = html;
      estTotal.textContent = gbp(total);
    }
    stepperCallbacks.push(renderEst);
    wireSteppers();
    renderEst();
  }

  /* ================= ENQUIRY FORM (contact) ================= */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var conf = document.getElementById("confirmation");
    var confRef = document.getElementById("confRef");
    var confEcho = document.getElementById("confEcho");
    function setErr(input, errEl, bad) {
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (errEl) errEl.classList.toggle("on", bad);
      return !bad;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName");
      var email = document.getElementById("fEmail");
      var app = document.getElementById("fApp");
      var msg = document.getElementById("fMsg");
      var ok = true;
      ok = setErr(name, document.getElementById("eName"), name.value.trim().length < 2) && ok;
      ok = setErr(email, document.getElementById("eEmail"), !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setErr(app, document.getElementById("eApp"), !app.value) && ok;
      ok = setErr(msg, document.getElementById("eMsg"), msg.value.trim().length < 10) && ok;
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "OP-ENQ-" + String(1000 + (Date.now() % 9000));
      confRef.textContent = ref;
      confEcho.textContent = "Application: " + app.options[app.selectedIndex].text +
        " · For: " + name.value.trim() + " · Reply to: " + email.value.trim();
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute("tabindex", "-1");
      conf.focus({ preventScroll: false });
    });
    ["fName", "fEmail", "fApp", "fMsg"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener("input", function () { el.setAttribute("aria-invalid", "false"); });
      el.addEventListener("change", function () { el.setAttribute("aria-invalid", "false"); });
    });
  }
})();

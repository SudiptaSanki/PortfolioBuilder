/* ============================================================
   Kovač Karst Hydrogeology — page script
   Sound ruling: none. The profession is field measurement, not
   audio; no sound passes the need-test. Nothing sounds, ever.
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

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  void reduced;

  /* ---------------- mobile menu: the field index ---------------- */
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

  function fmtInt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }
  function fmtEUR(n) { return "€" + fmtInt(n); }

  /* ============================================================
     RECESSION EXPLORER (index)
     One relation, three readers: the printed arithmetic, the big
     result figures and the drawn curve all come from maillet(),
     so they cannot disagree.
       Q(t) = Q0 * e^(-alpha * t)     t-half = ln(2) / alpha
     ============================================================ */
  var ex = document.getElementById("explorer");
  if (ex) {
    var state = { q0: 300, alpha: 0.030, t: 20 };
    var LIMITS = {
      q0:    { min: 50,   max: 2000, step: 50 },
      alpha: { min: 0.005, max: 0.150, step: 0.005 },
      t:     { min: 0,    max: 120,  step: 5 }
    };
    function maillet(q0, alpha, t) { return q0 * Math.exp(-alpha * t); }

    var valEls = {
      q0: document.getElementById("exQ0Val"),
      alpha: document.getElementById("exAlphaVal"),
      t: document.getElementById("exTVal")
    };
    var lineAt = document.getElementById("calcAt");
    var lineExp = document.getElementById("calcExp");
    var lineQ = document.getElementById("calcQ");
    var lineHalf = document.getElementById("calcHalf");
    var resQ = document.getElementById("resQ");
    var resHalf = document.getElementById("resHalf");
    var resChar = document.getElementById("resChar");
    var path = document.getElementById("recPath");
    var marker = document.getElementById("recMarker");
    var markerDot = document.getElementById("recDot");
    var markerLabel = document.getElementById("recLabel");
    var axisQ = document.getElementById("axisQ");

    function character(alpha) {
      if (alpha < 0.010) return "slow — storage-fed";
      if (alpha <= 0.050) return "mixed — conduit + storage";
      return "fast — conduit-drained";
    }

    /* chart geometry: viewBox 560 x 240, plot area x 46..544, y 14..206 */
    function ptX(t) { return 46 + (t / 120) * 498; }
    function ptY(q, q0) { return 206 - (q / q0) * 192; }

    function render() {
      valEls.q0.querySelector(".num").textContent = fmtInt(state.q0);
      valEls.alpha.querySelector(".num").textContent = state.alpha.toFixed(3);
      valEls.t.querySelector(".num").textContent = String(state.t);

      var at = state.alpha * state.t;
      var ef = Math.exp(-at);
      var q = maillet(state.q0, state.alpha, state.t);
      var half = Math.LN2 / state.alpha;

      lineAt.textContent = state.alpha.toFixed(3) + " × " + state.t + " = " + at.toFixed(3);
      lineExp.textContent = "e^−" + at.toFixed(3) + " = " + ef.toFixed(4);
      lineQ.textContent = fmtInt(state.q0) + " × " + ef.toFixed(4) + " = " + fmtInt(q) + " L/s";
      lineHalf.textContent = "0.693 ÷ " + state.alpha.toFixed(3) + " = " + half.toFixed(1) + " days";
      resQ.innerHTML = fmtInt(q) + " <small>L/s</small>";
      resHalf.innerHTML = half.toFixed(1) + " <small>days</small>";
      resChar.textContent = character(state.alpha);
      axisQ.textContent = "Q₀ " + fmtInt(state.q0);

      var d = "";
      for (var t = 0; t <= 120; t += 3) {
        var x = ptX(t), y = ptY(maillet(state.q0, state.alpha, t), state.q0);
        d += (t === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1) + " ";
      }
      path.setAttribute("d", d.trim());
      var mx = ptX(state.t), my = ptY(q, state.q0);
      marker.setAttribute("d", "M" + mx.toFixed(1) + " 14 V206");
      markerDot.setAttribute("cx", mx.toFixed(1));
      markerDot.setAttribute("cy", my.toFixed(1));
      markerLabel.setAttribute("x", Math.min(mx + 8, 470).toFixed(1));
      markerLabel.setAttribute("y", Math.max(my - 10, 24).toFixed(1));
      markerLabel.textContent = "day " + state.t + " · " + fmtInt(q) + " L/s";

      ex.querySelectorAll("[data-step]").forEach(function (btn) {
        var key = btn.getAttribute("data-step");
        var dir = Number(btn.getAttribute("data-dir"));
        var lim = LIMITS[key];
        var next = state[key] + dir * lim.step;
        btn.disabled = next < lim.min - 1e-9 || next > lim.max + 1e-9;
      });
    }

    ex.querySelectorAll("[data-step]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var key = btn.getAttribute("data-step");
        var dir = Number(btn.getAttribute("data-dir"));
        var lim = LIMITS[key];
        var next = state[key] + dir * lim.step;
        next = Math.round(next * 1000) / 1000;
        if (next < lim.min || next > lim.max) return;
        state[key] = next;
        render();
      });
    });
    render();
  }

  /* ============================================================
     PROGRAMME ESTIMATOR (index)
     Printed rates only: the lines are multiplied out on the page
     so the total can be checked with a pencil.
     ============================================================ */
  var est = document.getElementById("estimator");
  if (est) {
    var RATES = {
      tracer:    { rate: 760, consum: 1850, report: 5, consumLabel: "Tracer dye, charcoal receptors, fluorometric laboratory analysis" },
      monitor:   { rate: 640, consum: 940,  report: 3, consumLabel: "Logger hire, calibration standards, site consumables for one season" },
      delineate: { rate: 720, consum: 380,  report: 6, consumLabel: "Geological map data, GIS licences for the study, printed catchment maps" }
    };
    var typeSel = document.getElementById("estType");
    var daysVal = document.getElementById("estDaysVal");
    var days = 10;
    var lField = document.getElementById("estField");
    var lReport = document.getElementById("estReport");
    var lConsum = document.getElementById("estConsum");
    var lConsumK = document.getElementById("estConsumK");
    var lTotal = document.getElementById("estTotal");
    var minus = document.getElementById("estDaysMinus");
    var plus = document.getElementById("estDaysPlus");

    function renderEst() {
      var r = RATES[typeSel.value];
      var field = days * r.rate;
      var report = r.report * r.rate;
      daysVal.querySelector(".num").textContent = String(days);
      lField.textContent = days + " person-days × " + fmtEUR(r.rate) + " = " + fmtEUR(field);
      lReport.textContent = r.report + " days × " + fmtEUR(r.rate) + " = " + fmtEUR(report);
      lConsumK.textContent = r.consumLabel;
      lConsum.textContent = fmtEUR(r.consum);
      lTotal.textContent = fmtEUR(field + report + r.consum);
      minus.disabled = days <= 2;
      plus.disabled = days >= 60;
    }
    typeSel.addEventListener("change", renderEst);
    minus.addEventListener("click", function () { if (days > 2) { days -= 2; renderEst(); } });
    plus.addEventListener("click", function () { if (days < 60) { days += 2; renderEst(); } });
    renderEst();
  }

  /* ============================================================
     ENQUIRY FORM (contact) — demonstration only.
     Validates, then confirms in-page with a reference built from
     the entry. Nothing is transmitted anywhere; the page says so.
     ============================================================ */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmBox = document.getElementById("confirmBox");
    function setInvalid(id, bad) {
      var f = document.getElementById(id);
      if (f) f.classList.toggle("invalid", bad);
      return !bad;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("cfName");
      var email = document.getElementById("cfEmail");
      var msg = document.getElementById("cfMsg");
      var ok = true;
      ok = setInvalid("fldName", !name.value.trim()) && ok;
      ok = setInvalid("fldEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setInvalid("fldMsg", msg.value.trim().length < 20) && ok;
      if (!ok) {
        var firstBad = form.querySelector(".field.invalid input, .field.invalid textarea, .field.invalid select");
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "KA-" + new Date().getFullYear() + "-" +
        String(Math.abs([].reduce.call(name.value.trim() + email.value.trim(),
          function (a, c) { return (a * 31 + c.charCodeAt(0)) | 0; }, 7)) % 9000 + 1000);
      document.getElementById("confirmRef").textContent = ref;
      document.getElementById("confirmName").textContent = name.value.trim();
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute("tabindex", "-1");
      confirmBox.focus();
      confirmBox.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
    });
    ["cfName", "cfEmail", "cfMsg"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener("input", function () {
        el.closest(".field").classList.remove("invalid");
      });
    });
  }

  /* footer year */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();

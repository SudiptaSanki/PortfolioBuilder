/* ORBITAL DRILL — shared behaviour.
   No audio anywhere: this practice is not a sound profession and
   nothing here teaches through sound (program sound need-test). */
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

  /* ---------- mobile dossier index panel ---------- */
  var btn = document.getElementById("indexBtn");
  var panel = document.getElementById("indexPanel");
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

  var money = function (n) { return "$" + n.toLocaleString("en-US"); };

  /* ================= WINDOW CALCULATOR (index) =================
     Printed relation: 1/S = | 1/P_E − 1/P_T |,  P_E = 1.00 yr.
     Semi-major axis from Kepler's third law: a = P_T^(2/3) AU.   */
  var pVal = document.getElementById("pVal");
  if (pVal) {
    var range = document.getElementById("pRange");
    var sYr = document.getElementById("sYr");
    var sMo = document.getElementById("sMo");
    var aAu = document.getElementById("aAu");
    var arith = document.getElementById("arithLines");
    var meaning = document.getElementById("meaningText");
    var tOrbit = document.getElementById("tOrbit");
    var tDot = document.getElementById("tDot");
    var chips = document.querySelectorAll(".chip[data-p]");
    var P = 2.0;

    var fmt = function (x, d) { return x.toFixed(d); };

    function render() {
      var invE = 1 / 1.0;
      var invT = 1 / P;
      var diff = Math.abs(invE - invT);
      var a = Math.pow(P, 2 / 3);

      pVal.textContent = fmt(P, 2);
      if (range && document.activeElement !== range) range.value = P;
      aAu.textContent = fmt(a, 2);

      /* orbit diagram (schematic, not to scale) */
      var r = Math.min(126, Math.max(30, 55 * Math.sqrt(a)));
      if (tOrbit) tOrbit.setAttribute("r", r.toFixed(1));
      if (tDot) {
        tDot.setAttribute("cx", (150 + r).toFixed(1));
        tDot.setAttribute("cy", "150");
      }

      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", Math.abs(parseFloat(c.getAttribute("data-p")) - P) < 0.001 ? "true" : "false");
      });

      if (diff < 1e-9) {
        sYr.textContent = "—";
        sMo.textContent = "no finite recurrence";
        arith.innerHTML =
          "<li><span class='step-tag'>STEP 1</span>1/P<sub>E</sub> = 1 / 1.00 = <b>1.0000 yr⁻¹</b></li>" +
          "<li><span class='step-tag'>STEP 2</span>1/P<sub>T</sub> = 1 / " + fmt(P, 2) + " = <b>1.0000 yr⁻¹</b></li>" +
          "<li><span class='step-tag'>STEP 3</span>| 1.0000 − 1.0000 | = <b>0.0000</b></li>" +
          "<li><span class='step-tag'>STEP 4</span>S = 1 / 0 — <b>undefined</b>. A target sharing Earth's period keeps its geometry; its windows are set by phasing, not by a repeating calendar.</li>";
        meaning.innerHTML = "<strong>The co-orbital case.</strong> When P<sub>T</sub> equals Earth's period the synodic formula divides by zero — there is no tidy recurrence to plan around, which is itself a finding a study has to state plainly.";
        return;
      }

      var S = 1 / diff;
      var months = S * 12;
      sYr.textContent = fmt(S, 2);
      sMo.textContent = fmt(months, 1) + " months";
      arith.innerHTML =
        "<li><span class='step-tag'>STEP 1</span>1/P<sub>E</sub> = 1 / 1.00 = <b>" + fmt(invE, 4) + " yr⁻¹</b></li>" +
        "<li><span class='step-tag'>STEP 2</span>1/P<sub>T</sub> = 1 / " + fmt(P, 2) + " = <b>" + fmt(invT, 4) + " yr⁻¹</b></li>" +
        "<li><span class='step-tag'>STEP 3</span>| " + fmt(invE, 4) + " − " + fmt(invT, 4) + " | = <b>" + fmt(diff, 4) + " yr⁻¹</b></li>" +
        "<li><span class='step-tag'>STEP 4</span>S = 1 / " + fmt(diff, 4) + " = <b>" + fmt(S, 2) + " yr</b> = <b>" + fmt(months, 1) + " months</b></li>";
      meaning.innerHTML = "<strong>What S buys you:</strong> a favourable Earth–target geometry recurs every <strong>" +
        fmt(S, 2) + " years</strong>. Miss it and the mission does not slip by weeks — it slips by one full synodic period, or pays for the difference in propellant. This is why the window arithmetic is done before the spacecraft is sized, not after.";
    }

    function setP(v) {
      P = Math.round(Math.min(6.0, Math.max(0.6, v)) / 0.05) * 0.05;
      P = Math.round(P * 100) / 100;
      render();
    }
    document.getElementById("pDown").addEventListener("click", function () { setP(P - 0.05); });
    document.getElementById("pUp").addEventListener("click", function () { setP(P + 0.05); });
    if (range) range.addEventListener("input", function () { setP(parseFloat(range.value)); });
    chips.forEach(function (c) {
      c.addEventListener("click", function () { setP(parseFloat(c.getAttribute("data-p"))); });
    });
    render();
  }

  /* ================= STUDY ESTIMATOR (index) =================
     Blended rate printed on the page: $1,400 per person-day.
     Additional target: 6 person-days each, max 5.
     Add-ons are the flat fees printed beside each checkbox.      */
  var estLines = document.getElementById("estLines");
  if (estLines) {
    var RATE = 1400, PER_TARGET = 6, MAX_T = 5;
    var totalEl = document.getElementById("estTotal");
    var tValEl = document.getElementById("tVal");
    var extra = 0;

    function estRender() {
      var type = document.querySelector("input[name='stype']:checked");
      var days = parseInt(type.getAttribute("data-days"), 10);
      var name = type.getAttribute("data-name");
      var lines = [];
      var total = 0;

      var base = days * RATE;
      lines.push("<li><span>" + name + " — " + days + " person-days × " + money(RATE) + "</span><span>" + money(base) + "</span></li>");
      total += base;

      if (extra > 0) {
        var ex = extra * PER_TARGET * RATE;
        lines.push("<li><span>Additional targets — " + extra + " × " + PER_TARGET + " person-days × " + money(RATE) + "</span><span>" + money(ex) + "</span></li>");
        total += ex;
      }
      document.querySelectorAll(".addon input:checked").forEach(function (cb) {
        var flat = parseInt(cb.getAttribute("data-flat"), 10);
        lines.push("<li><span>" + cb.getAttribute("data-name") + " — flat</span><span>" + money(flat) + "</span></li>");
        total += flat;
      });

      estLines.innerHTML = lines.join("");
      totalEl.textContent = money(total);
      tValEl.textContent = extra;
    }
    document.querySelectorAll("input[name='stype']").forEach(function (r) {
      r.addEventListener("change", estRender);
    });
    document.querySelectorAll(".addon input").forEach(function (cb) {
      cb.addEventListener("change", estRender);
    });
    document.getElementById("tDown").addEventListener("click", function () {
      extra = Math.max(0, extra - 1); estRender();
    });
    document.getElementById("tUp").addEventListener("click", function () {
      extra = Math.min(MAX_T, extra + 1); estRender();
    });
    estRender();
  }

  /* ================= CONTACT FORM (contact) ================= */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirm = document.getElementById("confirmBox");
    function setErr(input, errId, bad) {
      var err = document.getElementById(errId);
      input.setAttribute("aria-invalid", bad ? "true" : "false");
      if (err) err.classList.toggle("show", bad);
      return !bad;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName");
      var email = document.getElementById("fEmail");
      var msg = document.getElementById("fMsg");
      var ok = true;
      ok = setErr(name, "eName", name.value.trim().length < 2) && ok;
      ok = setErr(email, "eEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) && ok;
      ok = setErr(msg, "eMsg", msg.value.trim().length < 20) && ok;
      if (!ok) {
        var firstBad = form.querySelector("[aria-invalid='true']");
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = "OD-ENQ-2026-" + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById("confirmRef").textContent = ref;
      form.hidden = true;
      confirm.hidden = false;
      confirm.setAttribute("tabindex", "-1");
      confirm.focus({ preventScroll: false });
    });
    ["fName", "fEmail", "fMsg"].forEach(function (id) {
      var el = document.getElementById(id);
      el.addEventListener("input", function () {
        el.setAttribute("aria-invalid", "false");
        var err = el.closest(".field").querySelector(".err");
        if (err) err.classList.remove("show");
      });
    });
  }
})();

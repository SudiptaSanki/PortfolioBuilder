/* Root Remedy — herbarium-sheet interactions.
   Menu drawer, consensus calculator, programme estimator, enquiry form.
   No audio anywhere on this site, by ruling: field recordings belong
   to the communities who made them. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a navigation
     is interrupted; swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal: sections pressed onto the sheet ---------- */
  var rvEls = document.querySelectorAll(".rv");
  if (rvEls.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      rvEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      rvEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- the drawer (mobile menu) ---------- */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("mobilePanel");
  if (btn && panel) {
    function setOpen(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      panel.classList.toggle("open", open);
      if (open) {
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      }
    }
    btn.addEventListener("click", function () {
      setOpen(btn.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        btn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
  }

  function fmtEUR(n) { return "€" + n.toLocaleString("en-US"); }

  /* ---------- §01 the consensus calculator (ICF) ---------- */
  var icfRoot = document.getElementById("icfCalc");
  if (icfRoot) {
    var NUR_MIN = 2, NUR_MAX = 400;
    var nur = 48, nt = 6;
    var nurVal = document.getElementById("nurVal");
    var ntVal = document.getElementById("ntVal");
    var lineNum = document.getElementById("arithNum");
    var lineDen = document.getElementById("arithDen");
    var lineDiv = document.getElementById("arithDiv");
    var icfVal = document.getElementById("icfVal");
    var bandEl = document.getElementById("icfBand");
    var clampNote = document.getElementById("ntClamp");

    function bandText(v) {
      if (v >= 0.85) return "Strong agreement. The reports gather on very few taxa — the classic signature of a category a community treats as settled knowledge, held in common.";
      if (v >= 0.6) return "Clear agreement. Most reports name a small set of taxa, with a longer tail of individual choices around them.";
      if (v >= 0.3) return "Moderate spread. Reports divide among a wider set of taxa — knowledge here is real but less uniformly shared.";
      return "Wide spread. Nearly every report names a different taxon. That can mean individual experimentation, a category drawn too broadly, or knowledge in the middle of changing hands.";
    }

    function renderICF(clamped) {
      nurVal.textContent = nur;
      ntVal.textContent = nt;
      var num = nur - nt, den = nur - 1;
      var icf = num / den;
      lineNum.textContent = "Nur − Nt = " + nur + " − " + nt + " = " + num;
      lineDen.textContent = "Nur − 1 = " + nur + " − 1 = " + den;
      lineDiv.innerHTML = "ICF = " + num + " ÷ " + den + " = <span class=\"res\">" + icf.toFixed(3) + "</span>";
      icfVal.textContent = icf.toFixed(3);
      bandEl.textContent = bandText(icf);
      clampNote.hidden = !(clamped || nt >= nur);
    }

    icfRoot.querySelectorAll("[data-icf]").forEach(function (b) {
      b.addEventListener("click", function () {
        var target = b.getAttribute("data-icf");
        var delta = parseInt(b.getAttribute("data-delta"), 10);
        var clamped = false;
        if (target === "nur") {
          var nextNur = nur + delta;
          if (nextNur < NUR_MIN) { nextNur = NUR_MIN; clamped = true; }
          if (nextNur > NUR_MAX) { nextNur = NUR_MAX; clamped = true; }
          nur = nextNur;
          if (nt > nur) { nt = nur; clamped = true; }
        } else {
          var nextNt = nt + delta;
          if (nextNt < 1) { nextNt = 1; clamped = true; }
          if (nextNt > nur) { nextNt = nur; clamped = true; }
          nt = nextNt;
        }
        renderICF(clamped);
      });
    });
    renderICF(false);
  }

  /* ---------- §03 the programme estimator ---------- */
  var estRoot = document.getElementById("estimator");
  if (estRoot) {
    var RATES = { field: 420, liaison: 260, trans: 95 };
    var LIMITS = { field: [1, 60], liaison: [0, 60], trans: [0, 120] };
    var est = { field: 10, liaison: 6, trans: 20 };
    var archive = 1800;

    function renderEst() {
      document.getElementById("estFieldVal").textContent = est.field;
      document.getElementById("estLiaisonVal").textContent = est.liaison;
      document.getElementById("estTransVal").textContent = est.trans;
      var f = est.field * RATES.field, l = est.liaison * RATES.liaison, t = est.trans * RATES.trans;
      document.getElementById("estFieldAmt").textContent = fmtEUR(f);
      document.getElementById("estLiaisonAmt").textContent = fmtEUR(l);
      document.getElementById("estTransAmt").textContent = fmtEUR(t);
      document.getElementById("estArchiveAmt").textContent = fmtEUR(archive);
      document.getElementById("estTotal").textContent = fmtEUR(f + l + t + archive);
    }

    estRoot.querySelectorAll("[data-est]").forEach(function (b) {
      b.addEventListener("click", function () {
        var k = b.getAttribute("data-est");
        var d = parseInt(b.getAttribute("data-delta"), 10);
        var v = est[k] + d;
        if (v < LIMITS[k][0]) v = LIMITS[k][0];
        if (v > LIMITS[k][1]) v = LIMITS[k][1];
        est[k] = v;
        renderEst();
      });
    });
    estRoot.querySelectorAll(".archive-opt").forEach(function (b) {
      b.addEventListener("click", function () {
        estRoot.querySelectorAll(".archive-opt").forEach(function (o) { o.setAttribute("aria-pressed", "false"); });
        b.setAttribute("aria-pressed", "true");
        archive = parseInt(b.getAttribute("data-price"), 10);
        renderEst();
      });
    });
    renderEst();
  }

  /* ---------- contact: the enquiry form (demonstration) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmBox = document.getElementById("enquiryConfirm");
    function mark(input, ok) {
      var field = input.closest(".field, .check-field");
      if (field) field.classList.toggle("invalid", !ok);
      input.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName");
      var email = document.getElementById("fEmail");
      var type = document.getElementById("fType");
      var msg = document.getElementById("fMsg");
      var agree = document.getElementById("fAgree");
      var ok = true, firstBad = null;
      var checks = [
        [name, name.value.trim().length >= 2],
        [email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())],
        [type, type.value !== ""],
        [msg, msg.value.trim().length >= 10],
        [agree, agree.checked]
      ];
      checks.forEach(function (c) {
        if (!mark(c[0], c[1])) { ok = false; if (!firstBad) firstBad = c[0]; }
      });
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var ref = "RR-" + (1000 + Math.floor(Math.random() * 9000));
      document.getElementById("refCode").textContent = ref;
      form.hidden = true;
      confirmBox.hidden = false;
      var h = confirmBox.querySelector("h3");
      if (h) { h.setAttribute("tabindex", "-1"); h.focus(); }
    });
    form.querySelectorAll("input, select, textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        var field = el.closest(".field, .check-field");
        if (field) field.classList.remove("invalid");
      });
    });
  }
})();

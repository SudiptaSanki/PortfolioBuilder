/* Vocal Cortex — protocol tools.
   No audio, no canvas, no tracking. The stub's hover-beep synth and
   waveform wallpaper were removed: this is a research-support practice,
   and its working tools are the session planner and the study estimator. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");

  /* Cross-document view transitions abort harmlessly when a navigation is
     interrupted; Chrome reports that abort as an unhandled rejection.
     Swallow only that exact rejection so real errors still surface. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile index panel ---------- */
  var btn = document.getElementById("menuBtn");
  var panel = document.getElementById("mobilePanel");
  if (btn && panel) {
    var closeMenu = function (refocus) {
      panel.classList.remove("open");
      panel.hidden = true;
      btn.setAttribute("aria-expanded", "false");
      if (refocus) btn.focus();
    };
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      if (open) { closeMenu(false); return; }
      panel.hidden = false;
      /* rAF so the panel is rendered before the class + focus land */
      requestAnimationFrame(function () {
        panel.classList.add("open");
        btn.setAttribute("aria-expanded", "true");
        var first = panel.querySelector("a");
        if (first) first.focus();
      });
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") closeMenu(true);
    });
  }

  /* ---------- reveal on scroll (opacity only, reduced-motion safe) ---------- */
  var revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.1 });
      revealEls.forEach(function (el) { io.observe(el); });
    }
  }

  /* ---------- steppers ---------- */
  var state = {};
  function fmtInt(n) { return n.toLocaleString("en-GB"); }
  function fmtSec(sec) {
    var s = Math.round(sec * 100) / 100;
    return (s % 1 === 0) ? fmtInt(s) : String(s);
  }
  function fmtMS(sec) {
    var m = Math.floor(sec / 60), s = Math.round(sec - m * 60);
    if (s === 60) { m += 1; s = 0; }
    return m + " min " + String(s).padStart(2, "0") + " s";
  }
  document.querySelectorAll("[data-stepper]").forEach(function (wrap) {
    var key = wrap.getAttribute("data-target");
    var min = parseFloat(wrap.getAttribute("data-min"));
    var max = parseFloat(wrap.getAttribute("data-max"));
    var step = parseFloat(wrap.getAttribute("data-step"));
    var unit = wrap.getAttribute("data-unit") || "";
    var out = wrap.querySelector("output");
    state[key] = parseFloat(wrap.getAttribute("data-value"));
    var render = function () { out.textContent = fmtInt(state[key]) + unit; };
    wrap.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        var dir = parseFloat(b.getAttribute("data-dir"));
        var next = state[key] + dir * step;
        if (next < min) next = min;
        if (next > max) next = max;
        if (next !== state[key]) {
          state[key] = next;
          render();
          document.dispatchEvent(new CustomEvent("stepper-change", { detail: { key: key } }));
        }
      });
    });
    render();
  });

  /* ---------- session planner (rules R1–R3 are printed on the page) ---------- */
  var BLOCK = 40, BREAK_S = 90, SETUP_S = 600;
  function plan() {
    var trials = state.trials, stim = state.stim, resp = state.resp, iti = state.iti;
    if (trials == null) return;
    var perTrialMs = stim + resp + iti;
    var perTrialS = perTrialMs / 1000;
    var trialsS = trials * perTrialS;
    var blocks = Math.ceil(trials / BLOCK);
    var breaks = blocks - 1;
    var breaksS = breaks * BREAK_S;
    var totalS = trialsS + breaksS + SETUP_S;
    var exact = (totalS % 1 === 0);
    document.getElementById("pLine1").textContent =
      fmtInt(stim) + " + " + fmtInt(resp) + " + " + fmtInt(iti) + " = " + fmtInt(perTrialMs) + " ms (" + fmtSec(perTrialS) + " s)";
    document.getElementById("pLine2").textContent =
      fmtInt(trials) + " × " + fmtSec(perTrialS) + " s = " + fmtSec(trialsS) + " s";
    document.getElementById("pLine3").textContent =
      fmtInt(blocks) + (blocks === 1 ? " block" : " blocks") + " of " + BLOCK + " → " +
      fmtInt(breaks) + (breaks === 1 ? " break" : " breaks") + " × " + BREAK_S + " s = " + fmtInt(breaksS) + " s";
    document.getElementById("pLine4").textContent = fmtInt(SETUP_S) + " s (10 min, rule R3)";
    document.getElementById("pLine5").textContent =
      fmtSec(trialsS) + " + " + fmtInt(breaksS) + " + " + fmtInt(SETUP_S) + " = " + fmtSec(totalS) + " s " +
      (exact ? "= " : "≈ ") + fmtMS(totalS);
  }

  /* ---------- study estimator (rates are printed on the page) ---------- */
  var RATES = { design: 640, stimdays: 520, analysis: 580, perpart: 12 };
  function estimate() {
    if (state.design == null) return;
    var d = state.design * RATES.design;
    var s = state.stimdays * RATES.stimdays;
    var a = state.analysis * RATES.analysis;
    var p = state.participants * state.sessions * RATES.perpart;
    document.getElementById("eLine1").textContent =
      fmtInt(state.design) + " days × £" + fmtInt(RATES.design) + " = £" + fmtInt(d);
    document.getElementById("eLine2").textContent =
      fmtInt(state.stimdays) + " days × £" + fmtInt(RATES.stimdays) + " = £" + fmtInt(s);
    document.getElementById("eLine3").textContent =
      fmtInt(state.analysis) + " days × £" + fmtInt(RATES.analysis) + " = £" + fmtInt(a);
    document.getElementById("eLine4").textContent =
      fmtInt(state.participants) + " participants × " + fmtInt(state.sessions) +
      (state.sessions === 1 ? " session" : " sessions") + " × £" + RATES.perpart + " = £" + fmtInt(p);
    document.getElementById("eLine5").textContent = "£" + fmtInt(d + s + a + p);
  }
  document.addEventListener("stepper-change", function () { plan(); estimate(); });
  plan(); estimate();

  /* ---------- enquiry form (demonstration — nothing is transmitted) ---------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var conf = document.getElementById("confirmation");
    function setErr(id, show) {
      var el = document.getElementById(id);
      if (el) el.classList.toggle("show", !!show);
      return !show;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements.name.value.trim();
      var inst = form.elements.institution.value.trim();
      var email = form.elements.email.value.trim();
      var msg = form.elements.message.value.trim();
      var ok = true;
      ok = setErr("errName", name.length < 2) && ok;
      ok = setErr("errInst", inst.length < 2) && ok;
      ok = setErr("errEmail", !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) && ok;
      ok = setErr("errMsg", msg.length < 20) && ok;
      if (!ok) {
        var firstBad = form.querySelector(".err.show");
        if (firstBad) {
          var field = document.getElementById(firstBad.getAttribute("data-for"));
          if (field) field.focus();
        }
        return;
      }
      var seed = (name.length * 7 + email.length * 13 + msg.length) % 9000 + 1000;
      document.getElementById("confRef").textContent = "VC-ENQ-" + seed;
      document.getElementById("confEcho").textContent =
        "Logged for: " + name + ", " + inst + " — study type: " +
        form.elements.studytype.value + ".";
      form.hidden = true;
      conf.hidden = false;
      conf.setAttribute("tabindex", "-1");
      conf.focus();
    });
    ["name", "institution", "email", "message"].forEach(function (n) {
      form.elements[n].addEventListener("input", function () {
        var map = { name: "errName", institution: "errInst", email: "errEmail", message: "errMsg" };
        setErr(map[n], false);
      });
    });
  }

  /* ---------- footer year ---------- */
  var yr = document.getElementById("yr");
  if (yr) yr.textContent = String(new Date().getFullYear());
})();

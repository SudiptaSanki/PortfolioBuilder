/* Alting Kinetic Works — shared script.
   Silent by design: this site ships no audio (ruling printed in every footer).
   Tools on a page initialise only when their elements exist. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a navigation is
     interrupted; swallow only that specific rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var G = 9.81;
  function lenFromPeriod(T) { return G * Math.pow(T / (2 * Math.PI), 2); }
  function fmt(n, d) { return n.toFixed(d); }
  function money(n) { return "\u20AC" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* ---------------- mobile menu ---------------- */
  var menuBtn = document.getElementById("menuBtn");
  var menuPanel = document.getElementById("menuPanel");
  if (menuBtn && menuPanel) {
    function closeMenu() {
      menuPanel.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    }
    menuBtn.addEventListener("click", function () {
      var open = menuPanel.hidden;
      if (open) {
        menuPanel.hidden = false;
        menuBtn.setAttribute("aria-expanded", "true");
        requestAnimationFrame(function () {
          var first = menuPanel.querySelector("a");
          if (first) first.focus();
        });
      } else {
        closeMenu();
        menuBtn.focus();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !menuPanel.hidden) { closeMenu(); menuBtn.focus(); }
    });
  }

  /* ---------------- the wave field (index hero) ---------------- */
  var svg = document.getElementById("waveField");
  if (svg) {
    var N = 15, K = 30, CYCLE = 60, AMP = 12 * Math.PI / 180;
    var RAIL_Y = 56, SCALE = 470, X0 = 120, XSPAN = 720;
    var NS = "http://www.w3.org/2000/svg";
    var clock = document.getElementById("waveClock");
    var phaseLabel = document.getElementById("wavePhase");
    var releaseBtn = document.getElementById("releaseBtn");
    var pends = [];

    var rail = document.createElementNS(NS, "rect");
    rail.setAttribute("x", 30); rail.setAttribute("y", RAIL_Y - 5);
    rail.setAttribute("width", 900); rail.setAttribute("height", 5);
    rail.setAttribute("fill", "#dfa254");
    svg.appendChild(rail);

    for (var i = 0; i < N; i++) {
      var swings = K + i;
      var period = CYCLE / swings;
      var lenM = lenFromPeriod(period);
      var lenPx = lenM * SCALE;
      var px = X0 + (XSPAN / (N - 1)) * i;
      var gEl = document.createElementNS(NS, "g");
      var line = document.createElementNS(NS, "line");
      line.setAttribute("stroke", "#9fb0ba"); line.setAttribute("stroke-width", "2");
      var bob = document.createElementNS(NS, "circle");
      bob.setAttribute("r", "13"); bob.setAttribute("fill", "#dfa254");
      bob.setAttribute("stroke", "#141b21"); bob.setAttribute("stroke-width", "2");
      var tick = document.createElementNS(NS, "text");
      tick.setAttribute("x", px); tick.setAttribute("y", RAIL_Y - 14);
      tick.setAttribute("text-anchor", "middle");
      tick.setAttribute("fill", "#9fb0ba"); tick.setAttribute("font-size", "13");
      tick.setAttribute("font-family", "Archivo, sans-serif");
      tick.textContent = String(i + 1);
      gEl.appendChild(line); gEl.appendChild(bob);
      svg.appendChild(gEl); svg.appendChild(tick);
      pends.push({ f: swings / CYCLE, lenPx: lenPx, px: px, line: line, bob: bob });
    }

    function drawAt(t) {
      for (var j = 0; j < pends.length; j++) {
        var p = pends[j];
        var th = AMP * Math.cos(2 * Math.PI * p.f * t);
        var bx = p.px + Math.sin(th) * p.lenPx;
        var by = RAIL_Y + Math.cos(th) * p.lenPx;
        p.line.setAttribute("x1", p.px); p.line.setAttribute("y1", RAIL_Y);
        p.line.setAttribute("x2", bx.toFixed(1)); p.line.setAttribute("y2", by.toFixed(1));
        p.bob.setAttribute("cx", bx.toFixed(1)); p.bob.setAttribute("cy", by.toFixed(1));
      }
      if (clock) clock.textContent = "t = " + fmt(t % CYCLE, 1) + " s of " + CYCLE + " s";
    }

    var running = false, visible = false, startStamp = 0, rafId = 0, frame = 0;
    function loop(now) {
      if (!running) return;
      var t = (now - startStamp) / 1000;
      frame++;
      if (frame % 2 === 0 || t < 0.2) drawAt(t); /* SwiftShader-friendly cadence */
      rafId = requestAnimationFrame(loop);
    }
    function start() {
      if (reduced || running) return;
      running = true;
      startStamp = performance.now();
      rafId = requestAnimationFrame(loop);
    }
    function pause() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
    }

    if (reduced) {
      svg.setAttribute("data-mode", "static");
      drawAt(15);
      if (phaseLabel) phaseLabel.textContent = "Static phase diagram \u2014 drawn at t = 15.0 s, a quarter of the cycle, where alternate pendulums stand at their extremes.";
      if (clock) clock.textContent = "t = 15.0 s of 60 s (held)";
    } else {
      svg.setAttribute("data-mode", "live");
      drawAt(0);
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          visible = entries[0].isIntersecting;
          if (visible) start(); else pause();
        }, { threshold: 0.2 });
        io.observe(svg);
      } else { visible = true; start(); }
    }

    if (releaseBtn) {
      releaseBtn.addEventListener("click", function () {
        if (reduced) {
          var held = svg.getAttribute("data-held") === "0" ? 15 : 0;
          svg.setAttribute("data-held", String(held));
          drawAt(held);
          if (phaseLabel) phaseLabel.textContent = held === 0
            ? "Static phase diagram \u2014 drawn at t = 0.0 s, the release instant, all fifteen together."
            : "Static phase diagram \u2014 drawn at t = 15.0 s, a quarter of the cycle, where alternate pendulums stand at their extremes.";
          if (clock) clock.textContent = "t = " + fmt(held, 1) + " s of 60 s (held)";
        } else {
          startStamp = performance.now();
          if (!running && visible) start();
          drawAt(0);
        }
      });
    }

    window.__wave = {
      mode: function () { return svg.getAttribute("data-mode"); },
      positions: function () {
        return pends.map(function (p) { return Math.round(parseFloat(p.bob.getAttribute("cx")) * 10) / 10; });
      }
    };
  }

  /* ---------------- stepper helper ---------------- */
  function bindStepper(rootId, outId, min, max, onChange) {
    var root = document.getElementById(rootId);
    if (!root) return null;
    var out = document.getElementById(outId);
    var val = parseInt(out.textContent, 10) || min;
    root.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        val += parseInt(b.getAttribute("data-step"), 10);
        if (val < min) val = min;
        if (val > max) val = max;
        out.textContent = String(val);
        onChange(val);
      });
    });
    return { get: function () { return val; }, set: function (v) { val = v; out.textContent = String(v); } };
  }

  /* ---------------- Wave & Wind Planner ---------------- */
  var planner = document.getElementById("planner");
  if (planner) {
    var plBase = document.getElementById("plBase");
    var plWork = document.getElementById("plWork");
    var plVerdict = document.getElementById("plVerdict");
    var plRows = document.getElementById("plRows");
    var plCount = bindStepper("plCountStep", "plCountOut", 9, 21, runPlanner);

    function runPlanner() {
      var count = plCount.get();
      var T0 = parseFloat(plBase.value);
      var K0 = 30, C = K0 * T0, adopted = K0, refused = false;
      if (C > 90) { refused = true; adopted = Math.floor(90 / T0); }
      var Ca = adopted * T0;
      var rows = "", lMax = 0, lMin = Infinity;
      for (var i = 0; i < count; i++) {
        var swings = adopted + i;
        var T = Ca / swings;
        var L = lenFromPeriod(T);
        if (L > lMax) lMax = L;
        if (L < lMin) lMin = L;
        rows += "<tr><td>P" + (i + 1) + "</td><td class=\"n\">" + swings + "</td><td class=\"n\">" + fmt(T, 2) + " s</td><td class=\"n\">" + fmt(L, 3) + " m</td></tr>";
      }
      plRows.innerHTML = rows;
      var lines = "";
      lines += "<li><span>Cycle rule \u2014 swings of the slowest pendulum</span><span>" + K0 + "</span></li>";
      lines += "<li><span>Requested re-phase C = " + K0 + " \u00D7 T\u2080</span><span>" + K0 + " \u00D7 " + fmt(T0, 2) + " s = " + fmt(C, 1) + " s</span></li>";
      if (refused) {
        lines += "<li><span>Adopted cycle \u2014 largest whole count inside 90 s</span><span>" + adopted + " \u00D7 " + fmt(T0, 2) + " s = " + fmt(Ca, 1) + " s</span></li>";
      }
      lines += "<li><span>Frequency step \u0394f = 1 \u00F7 C</span><span>" + fmt(1 / Ca, 4) + " Hz</span></li>";
      lines += "<li><span>Longest rod L = g(T\u2080 \u00F7 2\u03C0)\u00B2</span><span>" + fmt(lMax, 3) + " m</span></li>";
      lines += "<li><span>Shortest rod (pendulum " + count + ")</span><span>" + fmt(lMin, 3) + " m</span></li>";
      lines += "<li class=\"total\"><span>Field re-phases every</span><span>" + fmt(Ca, 1) + " s</span></li>";
      plWork.innerHTML = lines;
      planner.setAttribute("data-rephase", fmt(Ca, 1));
      planner.setAttribute("data-lmax", fmt(lMax, 3));
      planner.setAttribute("data-lmin", fmt(lMin, 3));
      planner.setAttribute("data-adopted", String(adopted));
      if (refused) {
        plVerdict.hidden = false;
        plVerdict.className = "verdict bad";
        plVerdict.innerHTML = "<strong>Too slow to watch.</strong> At a base period of " + fmt(T0, 2) +
          " s the standard 30-swing cycle needs " + fmt(C, 1) + " s to re-phase \u2014 longer than anyone stands in front of a field. " +
          "The planner shortens the spread instead: the slowest pendulum swings " + adopted + " times, the set below is the adopted set, " +
          "and the field re-phases every " + fmt(Ca, 1) + " s.";
      } else {
        plVerdict.hidden = false;
        plVerdict.className = "verdict";
        plVerdict.innerHTML = "<strong>Inside one visit.</strong> The field re-phases every " + fmt(Ca, 1) +
          " s, so a visitor who stays a minute sees the pattern leave and come back. The rod set below is cut from the printed relation, not fitted afterwards.";
      }
    }
    plBase.addEventListener("change", runPlanner);
    runPlanner();
  }

  /* ---------------- Commission estimator ---------------- */
  var estimator = document.getElementById("estimator");
  if (estimator) {
    var estClass = document.getElementById("estClass");
    var estFound = document.getElementById("estFound");
    var estWork = document.getElementById("estWork");
    var estQty = bindStepper("estQtyStep", "estQtyOut", 1, 24, runEstimator);

    function runEstimator() {
      var opt = estClass.options[estClass.selectedIndex];
      var rate = parseFloat(opt.getAttribute("data-rate"));
      var name = opt.getAttribute("data-name");
      var qty = estQty.get();
      var fopt = estFound.options[estFound.selectedIndex];
      var fee = parseFloat(fopt.getAttribute("data-fee"));
      var pieces = rate * qty, founds = fee * qty;
      var sub = pieces + founds, install = sub * 0.10, total = sub + install;
      estWork.innerHTML =
        "<li><span>" + name + " \u00D7 " + qty + " at " + money(rate) + "</span><span>" + money(pieces) + "</span></li>" +
        "<li><span>Foundations (" + fopt.getAttribute("data-name") + ") \u00D7 " + qty + " at " + money(fee) + "</span><span>" + money(founds) + "</span></li>" +
        "<li><span>Installation &amp; commissioning at 10% of the two lines above</span><span>" + money(install) + "</span></li>" +
        "<li><span>First inspection (at the class interval, in the price)</span><span>" + money(0) + "</span></li>" +
        "<li class=\"total\"><span>Commission shape</span><span>" + money(total) + "</span></li>";
      estimator.setAttribute("data-total", String(Math.round(total)));
    }
    estClass.addEventListener("change", runEstimator);
    estFound.addEventListener("change", runEstimator);
    runEstimator();
  }

  /* ---------------- enquiry form (contact page) ---------------- */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var confirmation = document.getElementById("confirmation");
    function setErr(id, msg) {
      var el = document.getElementById(id);
      if (el) { el.textContent = msg || ""; el.hidden = !msg; }
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("fName").value.trim();
      var email = document.getElementById("fEmail").value.trim();
      var site = document.getElementById("fSite").value.trim();
      var msg = document.getElementById("fMsg").value.trim();
      var ok = true;
      if (name.length < 2) { setErr("eName", "Please give your name."); ok = false; } else setErr("eName", "");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setErr("eEmail", "Please give an email address that can receive a reply."); ok = false; } else setErr("eEmail", "");
      if (site.length < 3) { setErr("eSite", "Please name the site \u2014 town or postcode is enough at this stage."); ok = false; } else setErr("eSite", "");
      if (msg.length < 20) { setErr("eMsg", "A little more, please \u2014 what should move, and where? (20 characters or more.)"); ok = false; } else setErr("eMsg", "");
      if (!ok) return;
      var ref = "AKW-2026-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("confRef").textContent = ref;
      document.getElementById("confName").textContent = name;
      document.getElementById("confSite").textContent = site;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.setAttribute("tabindex", "-1");
      confirmation.focus();
    });
  }
})();

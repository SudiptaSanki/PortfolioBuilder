/* Frequency Room — measurement-sheet interactions.
   Sound ruling: the acoustic engineer's profession IS sound, and one
   interaction here genuinely teaches through audio — the tone bench
   (Sheet 03, home page), where hearing 50 Hz vs 1 kHz is the lesson.
   It passes the programme's sound need-test under its strictest form:
   tones are generated only when a visitor presses a tone button,
   never on load, never on hover; the level is fixed low in code;
   every tone stops itself after two seconds; a Stop button is always
   present. Everywhere else, the site is silent. */
(function () {
  "use strict";

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts one; swallow only that rejection. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- mobile menu: the sheet-index panel ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("sheetPanel");
  if (menuBtn && panel) {
    var open = false;
    function setPanel(toOpen) {
      open = toOpen;
      menuBtn.setAttribute("aria-expanded", String(open));
      if (open) {
        panel.hidden = false;
        document.body.classList.add("locked");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            panel.classList.add("open");
            var first = panel.querySelector("a");
            if (first) first.focus();
          });
        });
      } else {
        panel.classList.remove("open");
        panel.hidden = true;
        document.body.classList.remove("locked");
      }
    }
    menuBtn.addEventListener("click", function () { setPanel(!open); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) { setPanel(false); menuBtn.focus(); }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) setPanel(false);
    });
  }

  /* ---------- reveal on scroll (opacity only, gated) ---------- */
  if (!reduceMotion && "IntersectionObserver" in window) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) { el.classList.add("rv"); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ================================================================
     SHEET 01 + 02 — room mode explorer & Sabine decay budget
     ================================================================ */
  var valL = document.getElementById("valL");
  if (valL) {
    var C = 343; /* m/s at 20 °C, as printed on the sheet */
    var dims = { L: 4.2, W: 3.6, H: 2.5 };
    var ranges = { L: [2.4, 8.0], W: [2.0, 7.0], H: [2.1, 4.0] };
    var names = { L: "Length", W: "Width", H: "Height" };
    var targetSel = document.getElementById("targetSel");

    function fmt(n) { return n.toFixed(1); }
    function modes(d) { var f = C / (2 * d); return [f, f * 2, f * 3]; }

    function render() {
      var all = {}; /* dim -> [f1,f2,f3] */
      ["L", "W", "H"].forEach(function (k) {
        all[k] = modes(dims[k]);
        document.getElementById("val" + k).innerHTML = fmt(dims[k]) + " <small>m</small>";
        document.getElementById("m" + k + "d").textContent = fmt(dims[k]) + " m";
        for (var i = 0; i < 3; i++) {
          var cell = document.getElementById("m" + k + (i + 1));
          cell.textContent = fmt(all[k][i]) + " Hz";
          cell.classList.remove("clash");
        }
      });

      /* formula line, worked for the length */
      document.getElementById("formulaLine").textContent =
        "Length, worked in full: f₁ = 343 ÷ (2 × " + fmt(dims.L) + " m) = " + fmt(all.L[0]) +
        " Hz — then ×2 and ×3 for the harmonics above.";

      /* lowest mode */
      var lowK = "L";
      ["W", "H"].forEach(function (k) { if (all[k][0] < all[lowK][0]) lowK = k; });
      document.getElementById("lowestLine").innerHTML =
        "<strong>Lowest axial mode: " + fmt(all[lowK][0]) + " Hz</strong> (" + names[lowK].toLowerCase() +
        "). Below it the room cannot support a standing wave at all — bass down there is pressure, not resonance, and no panel will change that.";

      /* pile-up detection: modes from different dimensions within 3 Hz */
      var flat = [];
      ["L", "W", "H"].forEach(function (k) {
        all[k].forEach(function (v, i) { flat.push({ k: k, n: i + 1, v: v }); });
      });
      var clashes = [];
      for (var a = 0; a < flat.length; a++) {
        for (var b = a + 1; b < flat.length; b++) {
          if (flat[a].k !== flat[b].k && Math.abs(flat[a].v - flat[b].v) <= 3) {
            clashes.push([flat[a], flat[b]]);
          }
        }
      }
      var pile = document.getElementById("pileup");
      if (clashes.length) {
        clashes.forEach(function (pair) {
          pair.forEach(function (m) {
            document.getElementById("m" + m.k + m.n).classList.add("clash");
          });
        });
        var c0 = clashes[0];
        document.getElementById("pileupText").textContent =
          names[c0[0].k] + " mode " + c0[0].n + " (" + fmt(c0[0].v) + " Hz) lands on " +
          names[c0[1].k].toLowerCase() + " mode " + c0[1].n + " (" + fmt(c0[1].v) + " Hz)" +
          (clashes.length > 1 ? " — and " + (clashes.length - 1) + " more coincidence(s) besides." : ".");
        pile.hidden = false;
      } else {
        pile.hidden = true;
      }

      /* ---- Sheet 02: Sabine budget, from the same dimensions ---- */
      var V = dims.L * dims.W * dims.H;
      var T = targetSel ? parseFloat(targetSel.value) : 0.30;
      var A = 0.161 * V / T;
      var area = A / 0.95;
      var panels = Math.ceil(area / 0.72 - 1e-9);
      var cost = panels * 85;
      document.getElementById("wVin").textContent = fmt(dims.L) + " × " + fmt(dims.W) + " × " + fmt(dims.H);
      document.getElementById("wV").textContent = fmt(V) + " m³";
      document.getElementById("wVin2").textContent = fmt(V);
      document.getElementById("wTin").textContent = T.toFixed(2);
      document.getElementById("wA").textContent = fmt(A) + " m² sabins";
      document.getElementById("wAin").textContent = fmt(A);
      document.getElementById("wArea").textContent = fmt(area) + " m²";
      document.getElementById("wPanels").textContent = panels + " panels";
      document.getElementById("wPanelsIn").textContent = panels;
      document.getElementById("wCost").textContent = "£" + cost.toLocaleString("en-GB");

      var fs = Math.round(2000 * Math.sqrt(T / V));
      document.getElementById("schroederLine").innerHTML =
        "<strong>Cross-over estimate ≈ " + fs + " Hz</strong> (Schroeder frequency, from the Sheet 02 target in " +
        fmt(V) + " m³). Below it, treat modes; above it, treat reflections. It is an estimate — a survey measures the real transition.";
    }

    document.querySelectorAll(".step-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var k = btn.getAttribute("data-dim");
        var dir = parseInt(btn.getAttribute("data-dir"), 10);
        var next = Math.round((dims[k] + dir * 0.1) * 10) / 10;
        if (next < ranges[k][0] || next > ranges[k][1]) return;
        dims[k] = next;
        render();
      });
    });
    if (targetSel) targetSel.addEventListener("change", render);
    render();
  }

  /* ================================================================
     SHEET 03 — the tone bench (the site's only sound, user-started)
     ================================================================ */
  var toneStatus = document.getElementById("toneStatus");
  if (toneStatus) {
    var toneNote = document.getElementById("toneNote");
    var NOTES = {
      "50": "50 Hz — deep bass. Most laptop and phone speakers, and many small monitors, produce very little down here: if you heard almost nothing, that is your playback device reaching its limit, not the tone failing. This is the band where room modes do their damage — and where small speakers' silence can hide it.",
      "100": "100 Hz — upper bass. In a 3.4 m room this sits on the second axial mode of the length (343 ÷ 3.4 ≈ 101 Hz) — the boom zone of most small studios, and the band a kick drum's body lives in.",
      "250": "250 Hz — lower midrange. Too much energy stored here is the boxy, congested sound of an untreated room; the fundamentals of many voices sit in this band too, which is why podcast rooms are treated for it first.",
      "1000": "1 kHz — the reference tone. Sensitivity and specification figures are conventionally quoted at 1 kHz because the ear behaves predictably here. Your device's volume is uncalibrated, so take pitch from this tone — never loudness.",
      "4000": "4 kHz — the presence band. The ear is near its most sensitive here, which is why harshness and sibilance live in this region — and why a room that rings at 4 kHz makes every recording sound cheap."
    };
    var LABELS = { "50": "50 Hz", "100": "100 Hz", "250": "250 Hz", "1000": "1 kHz", "4000": "4 kHz" };
    var actx = null, osc = null, gainNode = null, stopTimer = null, activeBtn = null;

    function clearPressed() {
      document.querySelectorAll(".tone-btn[data-freq]").forEach(function (b) {
        b.setAttribute("aria-pressed", "false");
      });
      activeBtn = null;
    }
    function stopTone(ended) {
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      if (osc) {
        try {
          var t = actx.currentTime;
          gainNode.gain.cancelScheduledValues(t);
          gainNode.gain.setValueAtTime(gainNode.gain.value, t);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
          osc.stop(t + 0.08);
        } catch (e) { /* already stopped */ }
        osc = null;
      }
      clearPressed();
      if (ended === "auto") {
        toneStatus.innerHTML = "<span class=\"st\">STOPPED.</span> The tone ended on its own — the two-second limit. Press another, or the same one again.";
      } else if (ended === "manual") {
        toneStatus.innerHTML = "<span class=\"st\">STOPPED.</span> By you. The bench is silent again.";
      }
    }
    function playTone(freq, btn) {
      stopTone();
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        actx = new AC();
      }
      if (actx.state === "suspended") actx.resume();
      var t = actx.currentTime;
      osc = actx.createOscillator();
      gainNode = actx.createGain();
      osc.type = "sine";
      osc.frequency.value = parseInt(freq, 10);
      gainNode.gain.setValueAtTime(0.0001, t);
      gainNode.gain.exponentialRampToValueAtTime(0.12, t + 0.03);
      osc.connect(gainNode);
      gainNode.connect(actx.destination);
      osc.start();
      btn.setAttribute("aria-pressed", "true");
      activeBtn = btn;
      toneStatus.innerHTML = "<span class=\"st\">PLAYING.</span> " + LABELS[freq] + " — a pure sine tone, generated now, in your browser. It stops itself after two seconds.";
      toneNote.textContent = NOTES[freq];
      stopTimer = setTimeout(function () { stopTone("auto"); }, 2000);
    }
    document.querySelectorAll(".tone-btn[data-freq]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        playTone(btn.getAttribute("data-freq"), btn);
      });
    });
    var stopBtn = document.getElementById("toneStop");
    if (stopBtn) stopBtn.addEventListener("click", function () { stopTone("manual"); });
  }

  /* ================================================================
     CONTACT — enquiry form (demonstration: transmits nothing)
     ================================================================ */
  var form = document.getElementById("enquiryForm");
  if (form) {
    var typeSel = document.getElementById("fType");
    var wanted = new URLSearchParams(window.location.search).get("type");
    if (wanted && typeSel) {
      for (var i = 0; i < typeSel.options.length; i++) {
        if (typeSel.options[i].value === wanted) { typeSel.selectedIndex = i; break; }
      }
    }
    var fields = [
      { input: document.getElementById("fName"), err: document.getElementById("eName"),
        ok: function (v) { return v.trim().length > 0; } },
      { input: document.getElementById("fEmail"), err: document.getElementById("eEmail"),
        ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
      { input: document.getElementById("fMsg"), err: document.getElementById("eMsg"),
        ok: function (v) { return v.trim().length > 1; } }
    ];
    fields.forEach(function (f) {
      f.input.addEventListener("input", function () {
        f.input.removeAttribute("aria-invalid");
        f.err.hidden = true;
      });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) {
        var good = f.ok(f.input.value);
        f.input.setAttribute("aria-invalid", good ? "false" : "true");
        f.err.hidden = good;
        if (!good && !firstBad) firstBad = f.input;
      });
      if (firstBad) { firstBad.focus(); return; }
      var ref = "FR-2026-" + (100 + Math.floor(Math.random() * 900));
      document.getElementById("confirmRef").textContent = ref;
      form.hidden = true;
      var box = document.getElementById("confirmBox");
      box.hidden = false;
      box.setAttribute("tabindex", "-1");
      box.focus();
    });
    var again = document.getElementById("againBtn");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        fields.forEach(function (f) {
          f.input.removeAttribute("aria-invalid");
          f.err.hidden = true;
        });
        document.getElementById("confirmBox").hidden = true;
        form.hidden = false;
        document.getElementById("fName").focus();
      });
    }
  }
})();

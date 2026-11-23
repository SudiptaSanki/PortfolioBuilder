/* yodel-hall — shared script.
   Contents: view-transition abort guard · mobile riser menu · the live
   Appenzell clock · the Season Planner (index) · the pitch bench
   (index, fenced) · the audition form (contact). Every block runs
   only where its elements exist. */
(function () {
  "use strict";

  /* ---------- view-transition abort guard ---------- */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- mobile menu: riser strips ---------- */
  var menuBtn = document.getElementById("menu-btn");
  var panel = document.getElementById("mobile-panel");
  if (menuBtn && panel) {
    var closeMenu = function () {
      panel.hidden = true;
      panel.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    };
    menuBtn.addEventListener("click", function () {
      var open = panel.hidden;
      if (open) {
        panel.hidden = false;
        panel.classList.add("open");
        menuBtn.setAttribute("aria-expanded", "true");
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      } else {
        closeMenu();
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        closeMenu();
        menuBtn.focus();
      }
    });
  }

  /* ---------- the honestly-live element: Appenzell time ---------- */
  var clock = document.getElementById("hall-clock");
  if (clock) {
    var fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Zurich",
      weekday: "short", hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    });
    var tick = function () { clock.textContent = fmt.format(new Date()); };
    tick();
    window.setInterval(tick, 1000);
  }

  /* ---------- Season Planner (index) ---------- */
  var form = document.getElementById("planner-form");
  if (form) {
    var partSel = document.getElementById("p-part");
    var weeksOut = document.getElementById("p-weeks");
    var weeks = 12;
    var MIN_W = 1, MAX_W = 36;
    var SET_PIECES = 4, PER_WEEK = 2, WEEK_FEE = 10;

    var setWeeks = function (w) {
      weeks = Math.max(MIN_W, Math.min(MAX_W, w));
      weeksOut.textContent = String(weeks);
    };
    document.getElementById("w-minus").addEventListener("click", function () { setWeeks(weeks - 1); });
    document.getElementById("w-plus").addEventListener("click", function () { setWeeks(weeks + 1); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var rate = parseInt(partSel.value, 10);
      var partName = partSel.options[partSel.selectedIndex].text.split(" — ")[0];
      var rehearsals = weeks * PER_WEEK;
      var learned = Math.floor(rehearsals / rate);
      var pieces = Math.min(SET_PIECES, learned);
      var fee = weeks * WEEK_FEE;

      var out = document.getElementById("planner-out");
      document.getElementById("out-title").textContent =
        "Your season — " + partName.toLowerCase() + ", " + weeks + (weeks === 1 ? " week" : " weeks") + " to Herisau";
      document.getElementById("out-line").textContent =
        "From today you get " + rehearsals + " rehearsals before the festival. At the printed " +
        "rate for your row — one piece every " + rate + " rehearsals — that is " + pieces +
        " of the " + SET_PIECES + " festival pieces learned properly.";
      document.getElementById("out-rehearsals").textContent =
        rehearsals + " (" + weeks + " weeks × " + PER_WEEK + " a week)";
      document.getElementById("out-pieces").textContent =
        pieces + " of " + SET_PIECES + " — " +
        (pieces >= SET_PIECES ? "the full festival set" :
         pieces >= 2 ? "enough for the two-piece guest set" : "not yet a singable set");
      document.getElementById("out-fee").textContent =
        "CHF " + fee + " (" + weeks + " weeks × CHF " + WEEK_FEE + " pro-rata)" +
        " + CHF 25 music folder, once";

      var verdict = document.getElementById("out-verdict");
      if (pieces >= SET_PIECES) {
        verdict.className = "verdict";
        verdict.textContent =
          "You make the full festival set. Come to the audition evenings on 2 and 5 February, " +
          "and by June you will be standing in the rows at Herisau with all four pieces in your throat.";
      } else if (pieces >= 2) {
        verdict.className = "verdict warn";
        verdict.textContent =
          "Honestly: that is not enough time for the whole set, and I will not pretend otherwise. " +
          "The smaller honest option is the two-piece guest set — the Naturjodel and the opening " +
          "Jodellied — sung with us at Herisau, and the remaining pieces learned for the autumn " +
          "concert, when there is no jury and no hurry.";
      } else {
        verdict.className = "verdict warn";
        verdict.textContent =
          "Too few rehearsals — even the guest set would be a guess, and we do not guess in " +
          "front of a jury. Join as a listening member this season, sing the autumn concert with " +
          "us, and audition in September for the road to the Eidgenössisches Jodlerfest 2029, " +
          "with two full seasons to learn the craft properly.";
      }
      out.hidden = false;
      out.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  /* ---------- the pitch bench (index) — the fence ----------
     Nothing exists until a tap. One AudioContext, created on the
     first tap; master gain 0.12; every tone stops itself within
     two seconds; no files, no autoplay, no hover or scroll triggers. */
  window.YODEL_BENCH = { contexts: 0, lastPeak: 0, playing: false };
  var benchStatus = document.getElementById("bench-status");
  var toneBtns = document.querySelectorAll(".tone-btn");
  if (toneBtns.length) {
    var actx = null, master = null;
    var playTone = function (freq, startAt, dur) {
      var osc = actx.createOscillator();
      var g = actx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      var lp = actx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 1400;
      g.gain.setValueAtTime(0.0001, startAt);
      g.gain.exponentialRampToValueAtTime(1, startAt + 0.07);
      g.gain.setValueAtTime(1, startAt + dur - 0.35);
      g.gain.exponentialRampToValueAtTime(0.0001, startAt + dur);
      osc.connect(lp); lp.connect(g); g.connect(master);
      osc.start(startAt); osc.stop(startAt + dur + 0.05);
    };
    toneBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var mode = btn.getAttribute("data-mode");
        var label = btn.getAttribute("data-label");
        if (!actx) {
          var AC = window.AudioContext || window.webkitAudioContext;
          if (!AC) {
            if (benchStatus) benchStatus.textContent =
              "This browser cannot play the reference tones. Come to a rehearsal and I will sing you the two notes in person.";
            return;
          }
          actx = new AC();
          window.YODEL_BENCH.contexts += 1;
          master = actx.createGain();
          master.gain.value = 0.12;
          master.connect(actx.destination);
        }
        if (actx.state === "suspended") actx.resume();
        var t = actx.currentTime + 0.02;
        var total;
        if (mode === "flip") {
          playTone(164.81, t, 0.85);
          playTone(329.63, t + 0.9, 0.85);
          total = 1.8;
        } else {
          playTone(parseFloat(btn.getAttribute("data-freq")), t, 1.6);
          total = 1.65;
        }
        window.YODEL_BENCH.lastPeak = 0.12;
        window.YODEL_BENCH.playing = true;
        toneBtns.forEach(function (b) { b.classList.remove("playing"); });
        btn.classList.add("playing");
        if (benchStatus) benchStatus.textContent =
          "Playing: " + label + " — it stops on its own.";
        window.setTimeout(function () {
          window.YODEL_BENCH.playing = false;
          btn.classList.remove("playing");
          if (benchStatus) benchStatus.textContent =
            "Stopped. Tap again whenever you need the pitch.";
        }, total * 1000 + 150);
      });
    });
  }

  /* ---------- audition form (contact) ---------- */
  var audition = document.getElementById("audition-form");
  if (audition) {
    audition.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("c-name").value.trim();
      var ref = "YH-2027-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("confirm-ref").textContent = ref;
      document.getElementById("confirm-name").textContent =
        name ? ("Thank you, " + name + ".") : "Thank you.";
      var box = document.getElementById("confirm");
      box.hidden = false;
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }
})();

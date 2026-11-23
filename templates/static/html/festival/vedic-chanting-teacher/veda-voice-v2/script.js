/* veda-voice — shared script.
   Menu, view-transition abort guard, course planner, reference-tone
   bench, enrolment form. Everything is feature-detected per page. */
(function () {
  "use strict";

  /* Aborted CSS view transitions surface as unhandled rejections;
     swallow only that exact case. */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  /* ---------- contents panel (mobile nav) ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var panel = document.getElementById("contents-panel");
  if (menuBtn && panel) {
    var closeMenu = function () {
      panel.hidden = true;
      menuBtn.setAttribute("aria-expanded", "false");
    };
    menuBtn.addEventListener("click", function () {
      var opening = panel.hidden;
      panel.hidden = !opening;
      menuBtn.setAttribute("aria-expanded", String(opening));
      if (opening) {
        requestAnimationFrame(function () {
          var first = panel.querySelector("a");
          if (first) first.focus();
        });
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) {
        closeMenu();
        menuBtn.focus();
      }
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeMenu();
    });
  }

  /* ---------- course planner ---------- */
  /* Mirrors the syllabus table printed on the page. Pace = units per
     week at 2 sessions/week in a batch. One-to-one moves at 1.5x.
     Sessions/week scales pace by spw/2. Foundation adds 4 weeks. */
  var TEXTS = {
    sri:          { name: "Śrī Sūktam",           units: 15,  unit: "ṛks",      pace: 3 },
    purusha:      { name: "Puruṣa Sūktam",        units: 16,  unit: "ṛks",      pace: 4 },
    pushpam:      { name: "Mantra Puṣpam",        units: 8,   unit: "sections", pace: 4 },
    isa:          { name: "Īśa Upaniṣad",         units: 18,  unit: "verses",   pace: 3 },
    rudram:       { name: "Rudram (Namakam)",     units: 11,  unit: "anuvākas", pace: 1 },
    chamakam:     { name: "Chamakam",             units: 11,  unit: "anuvākas", pace: 1 },
    sahasranamam: { name: "Viṣṇu Sahasranāmam",   units: 108, unit: "ślokas",   pace: 9 }
  };
  var RATES = { batch: 500, one: 1200 };
  var MULT = { batch: 1, one: 1.5 };
  var FOUNDATION_WEEKS = 4;
  var DEADLINE = Date.UTC(2027, 8, 4); /* Sat 4 Sep 2027, Ganeshotsav chanting */
  var MONTHS = ["January","February","March","April","May","June","July",
                "August","September","October","November","December"];

  function fmtDate(ms) {
    var d = new Date(ms);
    return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()] + " " + d.getUTCFullYear();
  }
  function inr(n) { return "₹" + n.toLocaleString("en-IN"); }

  function planFor(key, type, spw, beginner, startMs) {
    var t = TEXTS[key];
    var pace = t.pace * MULT[type] * (spw / 2);
    var weeks = Math.ceil(t.units / pace) + (beginner ? FOUNDATION_WEEKS : 0);
    var sessions = weeks * spw;
    return {
      key: key, text: t, pace: pace, weeks: weeks, sessions: sessions,
      fee: sessions * RATES[type],
      finish: startMs + weeks * 7 * 86400000
    };
  }

  var planForm = document.getElementById("planner");
  if (planForm) {
    var out = document.getElementById("plan-out");
    planForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var key = document.getElementById("p-text").value;
      var type = document.getElementById("p-type").value;
      var spw = parseInt(document.getElementById("p-spw").value, 10);
      var beginner = document.getElementById("p-beginner").checked;
      var wantsFestival = document.getElementById("p-festival").checked;
      var startVal = document.getElementById("p-start").value || "2027-06-07";
      var parts = startVal.split("-").map(Number);
      var startMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);

      var p = planFor(key, type, spw, beginner, startMs);
      document.getElementById("r-text").textContent =
        p.text.name + " — " + p.text.units + " " + p.text.unit;
      document.getElementById("r-pace").textContent =
        (Math.round(p.pace * 100) / 100) + " " + p.text.unit + " / week";
      document.getElementById("r-weeks").textContent =
        p.weeks + " weeks" + (beginner ? " (incl. 4 foundation)" : "");
      document.getElementById("r-sessions").textContent = p.sessions + " sessions";
      document.getElementById("r-fee").textContent = inr(p.fee);
      document.getElementById("r-finish").textContent = fmtDate(p.finish);

      var verdict = document.getElementById("plan-verdict");
      var vText = document.getElementById("verdict-text");
      verdict.classList.remove("warn");
      if (!wantsFestival) {
        vText.textContent = "No festival deadline set. When you are ready, the contact page enrols you for the next batch Monday after your start date.";
      } else if (p.finish <= DEADLINE) {
        vText.textContent = "You finish on " + fmtDate(p.finish) + " — in time to chant with the group at the Kothrud Ganeshotsav on Saturday 4 September 2027. The last two weeks are revision and group rehearsal, and they are inside the " + p.weeks + " weeks above.";
      } else {
        verdict.classList.add("warn");
        var best = planFor(key, "one", 3, beginner, startMs);
        if (best.finish <= DEADLINE) {
          vText.textContent = "At this pace you finish on " + fmtDate(p.finish) + " — after the Ganeshotsav chanting on 4 September 2027. The faster honest route: three one-to-one sessions a week finishes " + fmtDate(best.finish) + ", at " + inr(best.fee) + ". Or keep this pace and chant this text at Diwali instead — the group chants there too.";
        } else {
          var bestKey = null, bestFit = null;
          Object.keys(TEXTS).forEach(function (k) {
            var q = planFor(k, type, spw, beginner, startMs);
            if (q.finish <= DEADLINE && (!bestFit || q.text.units > bestFit.text.units)) {
              bestKey = k; bestFit = q;
            }
          });
          if (bestFit) {
            vText.textContent = "At this pace you finish on " + fmtDate(p.finish) + " — after the Ganeshotsav chanting on 4 September 2027, and even three one-to-one sessions a week cannot land " + p.text.name + " in time from this start date. Take " + bestFit.text.name + " this year — it finishes " + fmtDate(bestFit.finish) + " at this pace — and start " + p.text.name + " in October, with a full year to learn it properly.";
          } else {
            vText.textContent = "From this start date, no text on the syllabus can be learned properly before the Ganeshotsav chanting on 4 September 2027 — I will not sell you a rushed one. Enrol for the batch that starts after the festival, and chant with the group at the Diwali morning programme instead.";
          }
        }
      }
      out.hidden = false;
      out.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }

  /* ---------- reference tone bench ---------- */
  /* The fence: nothing exists until a tap. One AudioContext, created
     on first tap; peak gain 0.12; every tone stops itself in 1.8 s. */
  window.VEDA_BENCH = { contexts: 0, lastPeak: 0, playing: false };
  var actx = null, master = null;
  var benchStatus = document.getElementById("bench-status");
  var toneBtns = document.querySelectorAll(".tone-btn");
  toneBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var freq = parseFloat(btn.getAttribute("data-freq"));
      var label = btn.getAttribute("data-label");
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) {
          if (benchStatus) benchStatus.textContent = "This browser cannot play the reference tones. Your voice teacher at your first lesson will give you the Sa in person.";
          return;
        }
        actx = new AC();
        window.VEDA_BENCH.contexts += 1;
        master = actx.createGain();
        master.gain.value = 0.12;
        master.connect(actx.destination);
      }
      if (actx.state === "suspended") actx.resume();
      var t = actx.currentTime;
      var osc = actx.createOscillator();
      var g = actx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(1, t + 0.08);
      g.gain.setValueAtTime(1, t + 1.35);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
      osc.connect(g); g.connect(master);
      osc.start(t); osc.stop(t + 1.85);
      window.VEDA_BENCH.lastPeak = 0.12;
      window.VEDA_BENCH.playing = true;
      toneBtns.forEach(function (b) { b.classList.remove("playing"); });
      btn.classList.add("playing");
      if (benchStatus) benchStatus.textContent = "Playing " + label + " — " + freq + " Hz, stopping on its own.";
      window.setTimeout(function () {
        window.VEDA_BENCH.playing = false;
        btn.classList.remove("playing");
        if (benchStatus) benchStatus.textContent = "Stopped. Tap again whenever you need the pitch.";
      }, 1950);
    });
  });

  /* ---------- enrolment form ---------- */
  var enrol = document.getElementById("enrol-form");
  if (enrol) {
    enrol.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("e-name").value.trim();
      var ref = "VV-2027-" + Math.floor(1000 + Math.random() * 9000);
      var box = document.getElementById("confirm");
      document.getElementById("confirm-ref").textContent = ref;
      document.getElementById("confirm-name").textContent =
        name ? ("Thank you, " + name + ".") : "Thank you.";
      box.hidden = false;
      box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
  }
})();

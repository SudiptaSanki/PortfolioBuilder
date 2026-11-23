/* Analog Groove — interactions.
   The stub's spinning canvas and hover "needle scratch" synth are deleted:
   a DJ's sets are other people's recordings, so this site plays none of
   them. What it offers instead are working tools: a set builder that plans
   from the published crate, and a tap-tempo counter whose optional click
   starts only when the visitor presses play. */

(function () {
  "use strict";

  /* ---------- View-transition abort guard (narrowly filtered) ---------- */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Reveal on scroll (section entrances only) ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mobile crate-index panel ---------- */
  var toggle = document.querySelector(".crate-toggle");
  var panel = document.getElementById("cratePanel");
  if (toggle && panel) {
    var lastFocus = null;
    function openPanel() {
      lastFocus = document.activeElement;
      panel.classList.add("open");
      toggle.setAttribute("aria-expanded", "true");
      requestAnimationFrame(function () {
        var first = panel.querySelector("a");
        if (first) first.focus();
      });
    }
    function closePanel(returnFocus) {
      panel.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      if (returnFocus && lastFocus) lastFocus.focus();
    }
    toggle.addEventListener("click", function () {
      if (panel.classList.contains("open")) closePanel(true); else openPanel();
    });
    panel.addEventListener("click", function (e) {
      if (e.target.closest("a")) closePanel(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("open")) closePanel(true);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 760 && panel.classList.contains("open")) closePanel(false);
    });
  }

  /* ================================================================
     THE SET BUILDER
     Plans a set from the published crate below. Every figure in the
     plan — start times, totals, BPM steps — is computed from this
     data, and the same data is printed in the crate table on the
     page, so anyone can check the arithmetic.
     ================================================================ */
  var CRATE = [
    { t: "Lovely Day", a: "Bill Withers", y: 1977, bpm: 98, key: "10A", dur: 255, e: 1, g: "Soul" },
    { t: "What's Going On", a: "Marvin Gaye", y: 1971, bpm: 100, key: "1A", dur: 233, e: 1, g: "Soul" },
    { t: "Lean on Me", a: "Bill Withers", y: 1972, bpm: 88, key: "7A", dur: 257, e: 1, g: "Soul" },
    { t: "Move On Up", a: "Curtis Mayfield", y: 1970, bpm: 98, key: "11A", dur: 166, e: 2, g: "Soul" },
    { t: "TSOP (The Sound of Philadelphia)", a: "MFSB ft. The Three Degrees", y: 1974, bpm: 112, key: "8A", dur: 222, e: 2, g: "Philly soul" },
    { t: "Got to Give It Up (Part 1)", a: "Marvin Gaye", y: 1977, bpm: 106, key: "5A", dur: 251, e: 2, g: "Funk" },
    { t: "Superstition", a: "Stevie Wonder", y: 1972, bpm: 101, key: "4A", dur: 266, e: 3, g: "Funk" },
    { t: "Papa's Got a Brand New Bag", a: "James Brown", y: 1965, bpm: 97, key: "6A", dur: 126, e: 3, g: "Funk" },
    { t: "Brick House", a: "Commodores", y: 1977, bpm: 105, key: "8A", dur: 208, e: 3, g: "Funk" },
    { t: "Rock Steady", a: "Aretha Franklin", y: 1971, bpm: 104, key: "12A", dur: 195, e: 3, g: "Soul" },
    { t: "It's Your Thing", a: "The Isley Brothers", y: 1969, bpm: 98, key: "3A", dur: 169, e: 3, g: "Funk" },
    { t: "I Want You Back", a: "The Jackson 5", y: 1969, bpm: 99, key: "4A", dur: 181, e: 3, g: "Motown" },
    { t: "Dancing Queen", a: "ABBA", y: 1976, bpm: 101, key: "11A", dur: 231, e: 3, g: "Pop-disco" },
    { t: "Good Times", a: "Chic", y: 1979, bpm: 110, key: "11A", dur: 222, e: 4, g: "Disco" },
    { t: "Le Freak", a: "Chic", y: 1978, bpm: 119, key: "8A", dur: 211, e: 4, g: "Disco" },
    { t: "He's the Greatest Dancer", a: "Sister Sledge", y: 1979, bpm: 114, key: "10A", dur: 231, e: 4, g: "Disco" },
    { t: "We Are Family", a: "Sister Sledge", y: 1979, bpm: 108, key: "8A", dur: 216, e: 4, g: "Disco" },
    { t: "September", a: "Earth, Wind & Fire", y: 1978, bpm: 126, key: "11A", dur: 215, e: 4, g: "Disco" },
    { t: "Love Is the Message", a: "MFSB", y: 1973, bpm: 116, key: "5A", dur: 396, e: 4, g: "Philly disco" },
    { t: "Stayin' Alive", a: "Bee Gees", y: 1977, bpm: 103, key: "4A", dur: 285, e: 4, g: "Disco" },
    { t: "Upside Down", a: "Diana Ross", y: 1980, bpm: 108, key: "5A", dur: 219, e: 4, g: "Disco" },
    { t: "I'm Coming Out", a: "Diana Ross", y: 1980, bpm: 110, key: "10A", dur: 239, e: 4, g: "Disco" },
    { t: "Give Up the Funk", a: "Parliament", y: 1976, bpm: 104, key: "2A", dur: 222, e: 4, g: "Funk" },
    { t: "Flash Light", a: "Parliament", y: 1978, bpm: 107, key: "9A", dur: 269, e: 4, g: "Funk" },
    { t: "Boogie Wonderland", a: "Earth, Wind & Fire", y: 1979, bpm: 132, key: "4A", dur: 288, e: 5, g: "Disco" },
    { t: "You Should Be Dancing", a: "Bee Gees", y: 1976, bpm: 124, key: "3A", dur: 256, e: 5, g: "Disco" },
    { t: "I Feel Love", a: "Donna Summer", y: 1977, bpm: 130, key: "3A", dur: 354, e: 5, g: "Electronic disco" },
    { t: "Last Dance", a: "Donna Summer", y: 1978, bpm: 124, key: "9A", dur: 199, e: 5, g: "Disco" },
    { t: "Don't Leave Me This Way", a: "Thelma Houston", y: 1976, bpm: 118, key: "1A", dur: 217, e: 5, g: "Disco" },
    { t: "Disco Inferno", a: "The Trammps", y: 1976, bpm: 121, key: "6A", dur: 213, e: 5, g: "Disco" },
    { t: "Ring My Bell", a: "Anita Ward", y: 1979, bpm: 126, key: "2A", dur: 211, e: 5, g: "Disco" },
    { t: "Funkytown", a: "Lipps Inc.", y: 1980, bpm: 120, key: "7A", dur: 240, e: 5, g: "Disco" },
    { t: "Ain't No Mountain High Enough", a: "Marvin Gaye & Tammi Terrell", y: 1967, bpm: 118, key: "12A", dur: 159, e: 3, g: "Motown" }
  ];

  /* Energy arcs: [fraction of slot reached, target energy] checkpoints. */
  var ARCS = {
    warmup:  { label: "Warm-up", points: [[0, 1], [0.4, 2], [0.8, 3], [1, 3]] },
    peak:    { label: "Peak time", points: [[0, 3], [0.25, 4], [0.6, 5], [1, 5]] },
    allnight:{ label: "All night long", points: [[0, 2], [0.2, 4], [0.45, 3], [0.6, 5], [0.85, 5], [1, 2]] },
    winddown:{ label: "Wind-down", points: [[0, 4], [0.2, 3], [0.5, 2], [1, 1]] }
  };

  function fmt(sec) {
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function fmtClock(sec) {
    var m = Math.floor(sec / 60), s = Math.round(sec % 60);
    if (s === 60) { m += 1; s = 0; }
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function keyNum(k) { return parseInt(k, 10); }
  function keyDist(a, b) {
    var d = Math.abs(keyNum(a) - keyNum(b)) % 12;
    return Math.min(d, 12 - d);
  }
  function keyNote(prev, next) {
    if (!prev) return "Opening record — sets the room's starting key, " + next.key + ".";
    var sameNum = keyNum(prev.key) === keyNum(next.key);
    var sameLetter = prev.key.slice(-1) === next.key.slice(-1);
    var d = keyDist(prev.key, next.key);
    var dbpm = next.bpm - prev.bpm;
    var bpmTxt = dbpm === 0 ? "same tempo" :
      (dbpm > 0 ? "+" + dbpm + " BPM, pitch rides up" : dbpm + " BPM, pitch eases down");
    if (sameNum && sameLetter) return "Same key " + next.key + " — a long blend is safe; " + bpmTxt + ".";
    if (sameNum && !sameLetter) return "Relative key " + prev.key + " → " + next.key + " — blends clean; " + bpmTxt + ".";
    if (d === 1) return "One step round the wheel, " + prev.key + " → " + next.key + " — a standard harmonic move; " + bpmTxt + ".";
    return "Keys sit apart (" + prev.key + " → " + next.key + ") — play it end-to-end, no blend; " + bpmTxt + ".";
  }
  function targetEnergy(arc, frac) {
    var pts = arc.points, i;
    for (i = 1; i < pts.length; i++) {
      if (frac <= pts[i][0]) {
        var f0 = pts[i - 1][0], e0 = pts[i - 1][1], f1 = pts[i][0], e1 = pts[i][1];
        var t = (frac - f0) / Math.max(0.0001, f1 - f0);
        return e0 + (e1 - e0) * t;
      }
    }
    return pts[pts.length - 1][1];
  }

  function buildPlan(slotMin, arcKey, variation) {
    var slotSec = slotMin * 60;
    var arc = ARCS[arcKey];
    /* First pass hugs the arc (tolerance 0.9). If that leaves the slot
       more than ten minutes short, a second pass widens the tolerance —
       a fuller crate beats a perfect curve, but the curve wins ties. */
    var attempt = attemptPlan(slotSec, arc, variation, 0.9);
    if (slotSec - attempt.total > 600) {
      var wide = attemptPlan(slotSec, arc, variation, 1.6);
      if (wide.total > attempt.total) attempt = wide;
    }
    return attempt;
  }

  function attemptPlan(slotSec, arc, variation, tolerance) {
    var used = {}, plan = [], total = 0;
    var guard = 0;
    while (guard++ < 200) {
      var frac = total / slotSec;
      var want = targetEnergy(arc, frac);
      var best = null, bestScore = -Infinity;
      var bestAny = null, bestAnyDiff = Infinity, bestAnyScore = -Infinity;
      CRATE.forEach(function (rec, idx) {
        if (used[idx]) return;
        if (total + rec.dur > slotSec) return;
        var eDiff = Math.abs(rec.e - want);
        var score = 100 - eDiff * 34;
        var prev = plan.length ? plan[plan.length - 1].rec : null;
        if (prev) {
          var kd = keyDist(prev.key, rec.key);
          var sameL = prev.key.slice(-1) === rec.key.slice(-1);
          if (kd === 0 && sameL) score += 26;
          else if (kd === 0) score += 22;
          else if (kd === 1) score += 14;
          else if (kd > 3) score -= 10;
          score -= Math.min(18, Math.abs(rec.bpm - prev.bpm) * 0.8);
        }
        /* variation rotates tie-breaks so "pull another" differs */
        score += ((idx * 7 + variation * 13) % 11) * 0.35;
        /* Reach candidate: if nothing sits inside the tolerance, the DJ
           reaches one shelf up or down rather than ending the plan —
           the closest energy that fits, so long slots never dead-end. */
        if (eDiff < bestAnyDiff || (eDiff === bestAnyDiff && score > bestAnyScore)) {
          bestAnyDiff = eDiff; bestAnyScore = score; bestAny = { rec: rec, idx: idx };
        }
        if (eDiff > tolerance) return;
        if (score > bestScore) { bestScore = score; best = { rec: rec, idx: idx }; }
      });
      if (!best) best = bestAny;
      if (!best) break;
      used[best.idx] = true;
      plan.push({ rec: best.rec, start: total });
      total += best.rec.dur;
    }
    return { plan: plan, total: total, slotSec: slotSec, arc: arc };
  }

  var slotGroup = document.getElementById("slotGroup");
  var arcGroup = document.getElementById("arcGroup");
  var planEl = document.getElementById("setPlan");
  var summaryEl = document.getElementById("planSummary");
  var repullBtn = document.getElementById("repullBtn");
  var state = { slot: 60, arc: "warmup", variation: 0 };

  function selectedValue(group, attr) {
    var btn = group.querySelector('[aria-pressed="true"]');
    return btn ? btn.getAttribute(attr) : null;
  }
  function wireGroup(group, attr, onPick) {
    if (!group) return;
    group.addEventListener("click", function (e) {
      var btn = e.target.closest("button");
      if (!btn) return;
      group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", "false"); });
      btn.setAttribute("aria-pressed", "true");
      onPick(btn.getAttribute(attr));
    });
  }

  function renderPlan() {
    if (!planEl || !summaryEl) return;
    var result = buildPlan(state.slot, state.arc, state.variation);
    planEl.innerHTML = "";
    result.plan.forEach(function (item, i) {
      var prev = i > 0 ? result.plan[i - 1].rec : null;
      var li = document.createElement("li");
      li.setAttribute("data-duration", item.rec.dur);
      li.innerHTML =
        '<span class="p-time">' + fmtClock(item.start) + "</span>" +
        '<span class="p-title">' + item.rec.t + ' <span>— ' + item.rec.a + " (" + item.rec.y + ")</span></span>" +
        '<span class="p-meta">' + item.rec.bpm + " BPM · " + item.rec.key + " · " + fmt(item.rec.dur) + "</span>" +
        '<span class="p-note">' + keyNote(prev, item.rec) + "</span>";
      planEl.appendChild(li);
    });
    var under = result.slotSec - result.total;
    var bpms = result.plan.map(function (p) { return p.rec.bpm; });
    var range = bpms.length ? Math.min.apply(null, bpms) + "–" + Math.max.apply(null, bpms) + " BPM" : "—";
    summaryEl.setAttribute("data-total-seconds", result.total);
    summaryEl.setAttribute("data-slot-seconds", result.slotSec);
    summaryEl.setAttribute("data-count", result.plan.length);
    summaryEl.innerHTML =
      "<span>Records: <strong>" + result.plan.length + "</strong></span>" +
      "<span>Plays: <strong>" + fmt(result.total) + "</strong> of " + fmt(result.slotSec) + "</span>" +
      "<span>Room left: <strong>" + fmt(under) + "</strong></span>" +
      "<span>Tempo range: <strong>" + range + "</strong></span>" +
      "<span>Arc: <strong>" + result.arc.label + "</strong></span>";
    var note = document.getElementById("planNote");
    if (note) {
      note.textContent = under >= 300
        ? "The plan runs " + fmt(under) + " short of the slot on purpose: that is where requests and one long last record live. A plan that fills every second leaves the DJ nothing to answer the room with."
        : "The plan fills the slot to within " + fmt(under) + " — the last record is chosen to land the room, not to fill time.";
    }
  }

  if (slotGroup && arcGroup && planEl) {
    wireGroup(slotGroup, "data-slot", function (v) { state.slot = parseInt(v, 10); state.variation = 0; renderPlan(); });
    wireGroup(arcGroup, "data-arc", function (v) { state.arc = v; state.variation = 0; renderPlan(); });
    if (repullBtn) repullBtn.addEventListener("click", function () { state.variation += 1; renderPlan(); });
    state.slot = parseInt(selectedValue(slotGroup, "data-slot") || "60", 10);
    state.arc = selectedValue(arcGroup, "data-arc") || "warmup";
    renderPlan();
  }

  /* ================================================================
     TAP TEMPO + CLICK
     The click is a working tool, not a set recording. No AudioContext
     exists until the visitor presses "Play click" — user-started only.
     ================================================================ */
  var tapPad = document.getElementById("tapPad");
  var tempoRead = document.getElementById("tempoRead");
  var clickBtn = document.getElementById("clickToggle");
  var resetBtn = document.getElementById("tempoReset");
  var taps = [], tapBpm = 0;
  var audioCtx = null, clickTimer = null, clickOn = false;

  function updateTempoRead() {
    if (!tempoRead) return;
    if (tapBpm > 0) {
      tempoRead.innerHTML = "Tempo: <strong>" + tapBpm.toFixed(1) + " BPM</strong>";
    } else {
      tempoRead.innerHTML = "Tempo: <strong>—</strong>";
    }
  }
  if (tapPad) {
    tapPad.addEventListener("click", function () {
      var now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2500) taps = [];
      taps.push(now);
      if (taps.length > 7) taps.shift();
      if (taps.length > 1) {
        var intervals = [];
        for (var i = 1; i < taps.length; i++) intervals.push(taps[i] - taps[i - 1]);
        var avg = intervals.reduce(function (a, b) { return a + b; }, 0) / intervals.length;
        tapBpm = 60000 / avg;
        updateTempoRead();
        if (clickOn) restartClick();
      }
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      taps = []; tapBpm = 0; updateTempoRead();
      if (clickOn) toggleClick();
    });
  }
  function playClick() {
    if (!audioCtx) return;
    var t = audioCtx.currentTime;
    var osc = audioCtx.createOscillator();
    var gain = audioCtx.createGain();
    osc.type = "square";
    osc.frequency.value = 1900;
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t); osc.stop(t + 0.035);
  }
  function restartClick() {
    if (clickTimer) { clearInterval(clickTimer); clickTimer = null; }
    if (!clickOn || !(tapBpm > 0)) return;
    playClick();
    clickTimer = setInterval(playClick, 60000 / tapBpm);
  }
  function toggleClick() {
    if (!clickBtn) return;
    if (!clickOn) {
      if (!(tapBpm > 0)) {
        if (tempoRead) tempoRead.innerHTML = "Tap the pad first — the click needs a tempo.";
        return;
      }
      if (!audioCtx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        audioCtx = new AC();
      }
      if (audioCtx.state === "suspended") audioCtx.resume();
      clickOn = true;
      clickBtn.setAttribute("aria-pressed", "true");
      clickBtn.textContent = "Stop click";
      restartClick();
    } else {
      clickOn = false;
      clickBtn.setAttribute("aria-pressed", "false");
      clickBtn.textContent = "Play click";
      if (clickTimer) { clearInterval(clickTimer); clickTimer = null; }
      if (audioCtx && audioCtx.state === "running") audioCtx.suspend();
    }
  }
  if (clickBtn) clickBtn.addEventListener("click", toggleClick);

  /* Small test hook: lets the verification probe assert audio state
     without reaching into closures. */
  window.AnalogGroove = {
    audioState: function () { return audioCtx ? audioCtx.state : "none"; },
    tapBpm: function () { return tapBpm; },
    clickOn: function () { return clickOn; },
    crateSize: CRATE.length
  };

  /* ================================================================
     BOOKING FORM — demonstration only; validates and confirms
     in-page. Nothing is transmitted anywhere.
     ================================================================ */
  var form = document.getElementById("bookingForm");
  if (form) {
    var summary = document.getElementById("errorSummary");
    var confirmation = document.getElementById("confirmation");
    function setError(field, msg) {
      var wrap = field.closest(".field");
      var err = wrap ? wrap.querySelector(".error") : null;
      if (err) err.textContent = msg || "";
      if (msg) field.setAttribute("aria-invalid", "true");
      else field.removeAttribute("aria-invalid");
      return !msg;
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.elements["name"];
      var email = form.elements["email"];
      var type = form.elements["type"];
      var date = form.elements["date"];
      var venue = form.elements["venue"];
      var message = form.elements["message"];
      var problems = [];
      if (!setError(name, name.value.trim().length >= 2 ? "" : "Please give your name.")) problems.push("name");
      if (!setError(email, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? "" : "Please give a valid email address.")) problems.push("email");
      if (!setError(type, type.value ? "" : "Please choose the kind of booking.")) problems.push("booking type");
      if (!setError(date, date.value ? "" : "Please pick the event date (or your best guess).")) problems.push("date");
      if (!setError(venue, venue.value.trim().length >= 3 ? "" : "Please give the venue and town.")) problems.push("venue");
      if (!setError(message, message.value.trim().length >= 10 ? "" : "A sentence or two about the night helps (10+ characters).")) problems.push("message");
      if (problems.length) {
        if (summary) {
          summary.hidden = false;
          summary.textContent = "The form needs attention: please check " + problems.join(", ") + ".";
          summary.setAttribute("tabindex", "-1");
          summary.focus();
        }
        return;
      }
      if (summary) summary.hidden = true;
      var ref = "AG-2026-" + Math.floor(100 + Math.random() * 900);
      var slotSel = form.elements["slot"];
      var slotTxt = slotSel && slotSel.value ? slotSel.options[slotSel.selectedIndex].text : "to be agreed";
      if (confirmation) {
        confirmation.querySelector(".ref").textContent = ref;
        var detail = confirmation.querySelector(".confirm-detail");
        if (detail) {
          detail.textContent = "A " + type.value + " on " + date.value + " at " + venue.value.trim() +
            ", slot " + slotTxt + ". Frankie replies within two working days with availability and a firm quote — the fees page shows the shape of it meanwhile.";
        }
        form.hidden = true;
        confirmation.hidden = false;
        confirmation.setAttribute("tabindex", "-1");
        confirmation.focus();
        confirmation.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
      }
    });
    var again = document.getElementById("sendAnother");
    if (again) {
      again.addEventListener("click", function () {
        form.reset();
        form.hidden = false;
        if (confirmation) confirmation.hidden = true;
        var nameField = form.elements["name"];
        if (nameField) nameField.focus();
      });
    }
  }
})();

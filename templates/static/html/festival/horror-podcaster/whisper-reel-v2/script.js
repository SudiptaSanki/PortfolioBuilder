/* whisper-reel — menu, sponsorship planner, sound-design bench, contact form.
   No libraries. Sound exists ONLY on the bench: one AudioContext, created
   on the first deliberate tap, master gain 0.12, every cue self-stops
   inside 2 seconds. Nothing autoplays; nothing plays on hover or scroll. */
(function () {
  "use strict";

  /* --- view-transition abort guard (CSS opt-in is in style.css) --- */
  window.addEventListener("unhandledrejection", function (e) {
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= mobile menu — the case index ================= */
  var btn = document.querySelector(".menu-btn");
  var panel = document.getElementById("case-panel");
  if (btn && panel) {
    var hideTimer = null;
    function openPanel() {
      window.clearTimeout(hideTimer);
      panel.hidden = false;
      requestAnimationFrame(function () {
        panel.classList.add("open");
        var first = panel.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      });
      btn.setAttribute("aria-expanded", "true");
    }
    function closePanel() {
      panel.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      if (reduced) { panel.hidden = true; }
      else { hideTimer = window.setTimeout(function () { panel.hidden = true; }, 300); }
    }
    btn.addEventListener("click", function () {
      if (panel.hidden || !panel.classList.contains("open")) openPanel(); else closePanel();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !panel.hidden) { closePanel(); btn.focus(); }
    });
    panel.addEventListener("click", function (e) { if (e.target.closest("a")) closePanel(); });
  }

  /* ================= sponsorship planner ================= */
  var SEASONS = {
    "1": { downloads: 8000,
      eps: ["Static", "The Coat Closet Tapes", "Neighbour\u2019s Dog", "Third Landing", "The Wrong Attic", "Please Hold", "A Voice in the Vent", "The Night Clerk", "Undertow", "First Halloween"],
      soldPre: [], soldMid: [] },
    "2": { downloads: 15000,
      eps: ["First Frost", "The Bell in the Field", "Room 6 Is Occupied", "The Night Orchard", "Letters to the Drowned", "A Scream, Catalogued", "The Undertow Waltz", "Grandmother\u2019s Radio", "The Man Who Collected Doors", "Low Water", "The Feast of Small Hours", "What the Well Said"],
      soldPre: [], soldMid: [2, 9] },
    "3": { downloads: 22000,
      eps: ["The Night Bus Doesn\u2019t Stop", "Static in the Nursery", "The Undertaker\u2019s Apprentice", "The Underpass Choir", "What the Attic Keeps", "Dead Air", "What the River Keeps", "The Last Tenant", "A Polite Haunting", "Harvest Home"],
      soldPre: [1], soldMid: [4, 7] }
  };
  var RATES = { pre: { seconds: 30, cpm: 25, label: "pre-roll" }, mid: { seconds: 60, cpm: 40, label: "mid-roll" } };
  var fmt = function (n) { return n.toLocaleString("en-US"); };
  var money = function (n) { return "$" + fmt(n); };
  var code = function (s, n) { return "E" + s + "." + (n < 10 ? "0" + n : "" + n); };

  var planner = document.getElementById("planner");
  if (planner) {
    var state = { season: "3", placement: "mid", count: 4 };
    var outCount = document.getElementById("p-count");
    var rSeconds = document.getElementById("r-seconds");
    var rReach = document.getElementById("r-reach");
    var rPrice = document.getElementById("r-price");
    var rNote = document.getElementById("r-note");
    var rWarn = document.getElementById("r-warn");

    function compute() {
      var S = SEASONS[state.season];
      var R = RATES[state.placement];
      var sold = state.placement === "pre" ? S.soldPre : S.soldMid;
      var open = [];
      for (var i = 1; i <= S.eps.length; i++) if (sold.indexOf(i) === -1) open.push(i);
      var used = open.slice(0, Math.min(state.count, open.length));
      var perEp = (S.downloads / 1000) * R.cpm;
      rSeconds.textContent = fmt(used.length * R.seconds) + " s";
      rReach.textContent = fmt(used.length * S.downloads);
      rPrice.textContent = money(used.length * perEp);
      var names = used.map(function (n) { return code(state.season, n) + " \u201C" + S.eps[n - 1] + "\u201D"; });
      rNote.textContent = "Your slots, in release order: " + names.join(" · ") + ". " +
        "That is " + used.length + " × " + money(perEp) + " (Season " + state.season + " " + R.label +
        " at " + fmt(S.downloads) + " downloads × $" + R.cpm + " CPM).";
      if (state.count > open.length) {
        var soldNames = sold.map(function (n) { return code(state.season, n) + " \u201C" + S.eps[n - 1] + "\u201D"; });
        rWarn.hidden = false;
        rWarn.textContent = "Only " + open.length + " of Season " + state.season + "\u2019s " + S.eps.length +
          " " + R.label + " slots are open — " + soldNames.join(" and ") +
          " are already sold (see the ledger above). The figures price the " + open.length +
          " open slots. For more, take the same placement in another season, where the ledger shows what is left.";
      } else {
        rWarn.hidden = true;
        rWarn.textContent = "";
      }
      outCount.textContent = state.count;
    }

    planner.querySelectorAll("[data-season]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.season = b.getAttribute("data-season");
        planner.querySelectorAll("[data-season]").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        var max = SEASONS[state.season].eps.length;
        if (state.count > max) state.count = max;
        compute();
      });
    });
    planner.querySelectorAll("[data-placement]").forEach(function (b) {
      b.addEventListener("click", function () {
        state.placement = b.getAttribute("data-placement");
        planner.querySelectorAll("[data-placement]").forEach(function (x) {
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        compute();
      });
    });
    document.getElementById("p-minus").addEventListener("click", function () {
      if (state.count > 1) { state.count--; compute(); }
    });
    document.getElementById("p-plus").addEventListener("click", function () {
      var max = SEASONS[state.season].eps.length;
      if (state.count < max) { state.count++; compute(); }
    });
    compute();
  }

  /* ================= the sound-design bench (fenced) ================= */
  window.__wrBench = { contexts: 0, lastPeak: 0, playing: false };
  var actx = null, master = null;
  function ensureCtx() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      actx = new AC();
      window.__wrBench.contexts += 1;
      master = actx.createGain();
      master.gain.value = 0.12; /* the ceiling, same as the bench mix note */
      window.__wrBench.lastPeak = 0.12;
      master.connect(actx.destination);
    }
    if (actx.state === "suspended") actx.resume();
    return actx;
  }
  function env(gainNode, t, peak, dur) {
    var g = gainNode.gain;
    g.setValueAtTime(0.0001, t);
    g.exponentialRampToValueAtTime(peak, t + 0.03);
    g.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  var CUES = {
    room: { dur: 1.8, play: function (t) {
      var len = Math.floor(actx.sampleRate * 2);
      var buf = actx.createBuffer(1, len, actx.sampleRate);
      var d = buf.getChannelData(0), last = 0;
      for (var i = 0; i < len; i++) { var w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; }
      var src = actx.createBufferSource(); src.buffer = buf;
      var f = actx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 420;
      var g = actx.createGain(); env(g, t, 0.55, 1.8);
      src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + 1.85);
    } },
    door: { dur: 1.6, play: function (t) {
      var o = actx.createOscillator(); o.type = "sawtooth";
      var pts = [165, 128, 152, 98, 124, 82];
      o.frequency.setValueAtTime(pts[0], t);
      for (var i = 1; i < pts.length; i++) o.frequency.linearRampToValueAtTime(pts[i], t + (1.35 * i) / (pts.length - 1));
      var f = actx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 640; f.Q.value = 5;
      var g = actx.createGain(); env(g, t, 0.4, 1.6);
      o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + 1.65);
    } },
    sting: { dur: 1.2, play: function (t) {
      [110, 116.5, 220, 233].forEach(function (fr) {
        var o = actx.createOscillator(); o.type = "triangle"; o.frequency.value = fr;
        var g = actx.createGain(); env(g, t, 0.22, 1.15);
        o.connect(g); g.connect(master); o.start(t); o.stop(t + 1.2);
      });
    } }
  };
  document.querySelectorAll(".cue").forEach(function (cueBtn) {
    var stateEl = cueBtn.querySelector(".state");
    var idleText = stateEl ? stateEl.textContent : "";
    cueBtn.addEventListener("click", function () {
      var cue = CUES[cueBtn.getAttribute("data-cue")];
      if (!cue || window.__wrBench.playing) return;
      if (!ensureCtx()) return;
      var t = actx.currentTime + 0.02;
      cue.play(t);
      window.__wrBench.playing = true;
      cueBtn.classList.add("playing");
      if (stateEl) stateEl.textContent = "Playing…";
      window.setTimeout(function () {
        window.__wrBench.playing = false;
        cueBtn.classList.remove("playing");
        if (stateEl) stateEl.textContent = idleText;
      }, cue.dur * 1000 + 120);
    });
  });

  /* ================= contact form ================= */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("f-name");
      var email = document.getElementById("f-email");
      var msg = document.getElementById("f-msg");
      var fields = [name, email, msg];
      for (var i = 0; i < fields.length; i++) {
        if (!fields[i].value.trim()) { fields[i].focus(); return; }
      }
      if (email.value.indexOf("@") === -1) { email.focus(); return; }
      var ref = "WR-2026-" + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById("confirm-ref").textContent = ref;
      var confirm = document.getElementById("confirm");
      confirm.hidden = false;
      confirm.focus({ preventScroll: false });
    });
  }
})();

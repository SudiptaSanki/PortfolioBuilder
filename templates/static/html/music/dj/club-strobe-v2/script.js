/* SABLE — the night sheet's workings.
   Every tool on this site reads the figures printed in its own DOM
   table: the planner parses the pool table, the estimator parses the
   fee table. No figure lives only in this file. */
(function(){
  "use strict";

  /* Aborted cross-document view transitions surface as unhandled
     InvalidStateError rejections; the navigation itself completes.
     Swallow only that rejection. */
  window.addEventListener("unhandledrejection", function(e){
    var r = e.reason;
    if (r && r.name === "InvalidStateError" && /Transition was aborted/.test(r.message || "")) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- the running-order sheet (mobile menu) ---------- */
  var btn = document.getElementById("sheetBtn");
  var panel = document.getElementById("sheetPanel");
  if (btn && panel) {
    var firstLink = panel.querySelector("a");
    btn.addEventListener("click", function(){
      var open = panel.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      if (open && firstLink) {
        requestAnimationFrame(function(){ firstLink.focus({ preventScroll: true }); });
      }
    });
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && panel.classList.contains("open")) {
        panel.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
        btn.focus();
      }
    });
  }

  /* ---------- reveal (opacity only) ---------- */
  var revs = document.querySelectorAll(".rev");
  if (revs.length) {
    if (reduced || !("IntersectionObserver" in window)) {
      revs.forEach(function(el){ el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(en){
          if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
        });
      }, { threshold: 0.12 });
      revs.forEach(function(el){ io.observe(el); });
    }
  }

  function fmt(sec){ /* seconds -> m:ss */
    sec = Math.round(sec);
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }
  function gbp(n){ return "£" + n.toLocaleString("en-GB"); }

  /* ---------- the set planner (reads #poolTable) ---------- */
  var pool = document.getElementById("poolTable");
  if (pool) {
    var OVERLAP = 12; /* seconds — the house rule, printed on the page */
    var built = [];   /* rows, in tap order */
    var setList = document.getElementById("setList");
    var setEmpty = document.getElementById("setEmpty");
    var works = document.getElementById("setWorks");

    function renderSet(){
      setList.innerHTML = "";
      var start = 0, sum = 0, bpms = [];
      built.forEach(function(row, i){
        var dur = parseInt(row.getAttribute("data-dur"), 10);
        var bpm = parseInt(row.getAttribute("data-bpm"), 10);
        var title = row.cells[2].childNodes[0].textContent.trim();
        var prod = row.cells[2].querySelector(".sub").textContent.trim();
        sum += dur; bpms.push(bpm);
        var li = document.createElement("li");
        var st = document.createElement("span"); st.className = "st"; st.textContent = fmt(start);
        var ti = document.createElement("span"); ti.className = "ti";
        ti.appendChild(document.createTextNode(title + " "));
        var sm = document.createElement("small"); sm.textContent = "— " + prod;
        ti.appendChild(sm);
        var du = document.createElement("span"); du.className = "du"; du.textContent = fmt(dur);
        li.appendChild(st); li.appendChild(ti); li.appendChild(du);
        setList.appendChild(li);
        start += dur - OVERLAP;
      });
      var n = built.length;
      setEmpty.hidden = n > 0;
      works.hidden = n === 0;
      if (n > 0) {
        var blends = (n - 1) * OVERLAP;
        var total = sum - blends;
        document.getElementById("wSumLab").textContent =
          "Durations added: " + built.map(function(r){ return fmt(parseInt(r.getAttribute("data-dur"), 10)); }).join(" + ");
        document.getElementById("wSum").textContent = fmt(sum) + " · " + sum.toLocaleString("en-GB") + " s";
        document.getElementById("wBlendLab").textContent =
          "Blends taken back: " + (n - 1) + " × " + OVERLAP + " s";
        document.getElementById("wBlend").textContent = "− " + blends + " s";
        document.getElementById("wBpm").textContent =
          Math.min.apply(null, bpms) + "–" + Math.max.apply(null, bpms) + " · " + n + (n === 1 ? " track" : " tracks");
        document.getElementById("wTotal").textContent =
          sum.toLocaleString("en-GB") + " − " + blends + " = " + total.toLocaleString("en-GB") + " s · " + fmt(total);
      }
    }

    pool.querySelectorAll("[data-add]").forEach(function(b){
      b.addEventListener("click", function(){
        var row = b.closest("tr");
        var idx = built.indexOf(row);
        if (idx >= 0) {
          built.splice(idx, 1);
          b.setAttribute("aria-pressed", "false"); b.textContent = "Add";
          row.classList.remove("sel");
        } else {
          built.push(row);
          b.setAttribute("aria-pressed", "true"); b.textContent = "In set";
          row.classList.add("sel");
        }
        renderSet();
      });
    });
    var clearBtn = document.getElementById("setClear");
    if (clearBtn) clearBtn.addEventListener("click", function(){
      built = [];
      pool.querySelectorAll("[data-add]").forEach(function(b){
        b.setAttribute("aria-pressed", "false"); b.textContent = "Add";
        b.closest("tr").classList.remove("sel");
      });
      renderSet();
    });
    renderSet();
  }

  /* ---------- tap tempo ---------- */
  var tapPad = document.getElementById("tapPad");
  if (tapPad) {
    var taps = [];
    var tapBpm = document.getElementById("tapBpm");
    var tapMeta = document.getElementById("tapMeta");
    tapPad.addEventListener("click", function(){
      var now = performance.now();
      if (taps.length && now - taps[taps.length - 1] > 2000) taps = [];
      taps.push(now);
      if (taps.length > 6) taps.shift();
      if (taps.length >= 2) {
        var ivs = [];
        for (var i = 1; i < taps.length; i++) ivs.push(taps[i] - taps[i - 1]);
        var avg = ivs.reduce(function(a, b){ return a + b; }, 0) / ivs.length;
        var bpm = Math.round(60000 / avg);
        tapBpm.textContent = bpm;
        tapMeta.textContent = "From your last " + ivs.length + (ivs.length === 1 ? " interval" : " intervals") +
          " — average gap " + Math.round(avg) + " ms. Keep tapping to steady it; pause two seconds to reset.";
      } else {
        tapMeta.textContent = "One tap counted. Keep tapping in time.";
      }
    });
  }

  /* ---------- the booth loop (the strict pattern) ----------
     Tap-started only. Synthesised kick + hats at a printed 124 BPM.
     Master gain 0.12. Self-stops after four bars. Stop control.
     Labelled on the page as NOT a recording. */
  var playBtn = document.getElementById("benchPlay");
  if (playBtn) {
    var stopBtn = document.getElementById("benchStop");
    var status = document.getElementById("benchStatus");
    var ctx = null, master = null, noiseBuf = null, endTimer = null, playing = false;

    function makeNoise(c){
      var buf = c.createBuffer(1, c.sampleRate * 0.5, c.sampleRate);
      var d = buf.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return buf;
    }
    function kick(t){
      var o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(110, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.11);
      g.gain.setValueAtTime(0.9, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + 0.26);
    }
    function hat(t){
      var src = ctx.createBufferSource(); src.buffer = noiseBuf;
      var f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7000;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
      src.connect(f); f.connect(g); g.connect(master);
      src.start(t); src.stop(t + 0.05);
    }
    function stopLoop(msg){
      if (endTimer) { clearTimeout(endTimer); endTimer = null; }
      if (ctx) {
        var c = ctx;
        try {
          master.gain.setTargetAtTime(0.0001, c.currentTime, 0.03);
          setTimeout(function(){ c.close(); }, 160);
        } catch (e) { /* already closed */ }
        ctx = null; master = null;
      }
      playing = false;
      playBtn.disabled = false;
      if (msg) status.innerHTML = msg;
    }
    playBtn.addEventListener("click", function(){
      if (playing) return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { status.textContent = "This browser has no Web Audio — the bench stays silent, and the ruling is printed in the footer."; return; }
      ctx = new AC();
      if (ctx.state === "suspended") ctx.resume();
      master = ctx.createGain();
      master.gain.value = 0.12; /* fixed low gain — printed on the page */
      master.connect(ctx.destination);
      noiseBuf = makeNoise(ctx);
      var bpm = 124, beat = 60 / bpm, t0 = ctx.currentTime + 0.06;
      for (var i = 0; i < 16; i++) {
        kick(t0 + i * beat);
        hat(t0 + (i + 0.5) * beat);
      }
      playing = true;
      playBtn.disabled = true;
      status.innerHTML = "<b>Playing.</b> Four bars at 124 BPM — synthesised, not a recording. It stops itself at the end of the fourth bar.";
      endTimer = setTimeout(function(){
        stopLoop("<b>Finished.</b> Four bars, as printed. Press play to hear the tempo again.");
      }, (16 * beat + 0.35) * 1000);
    });
    if (stopBtn) stopBtn.addEventListener("click", function(){
      if (!playing) { status.textContent = "Nothing is playing. The loop starts only from the play button."; return; }
      stopLoop("<b>Stopped.</b> The bench is silent again.");
    });
  }

  /* ---------- booking estimator (reads #feeTable) ---------- */
  var feeTable = document.getElementById("feeTable");
  if (feeTable) {
    var slotRows = feeTable.querySelectorAll("tr[data-rate]");
    var travelRows = feeTable.querySelectorAll("tr[data-travel]");
    var SLOT_NAMES = ["Warm-up set", "Headline set", "Residency night", "Recorded mix commission"];
    var TRAVEL_NAMES = ["local", "regional", "international"];
    var HOUR_RATE = 180; /* printed in the fee table */
    var slotIdx = 1, hours = 0, travelIdx = 0;

    var eSlotLab = document.getElementById("eSlotLab"), eSlot = document.getElementById("eSlot");
    var eHrLab = document.getElementById("eHrLab"), eHr = document.getElementById("eHr");
    var eTrLab = document.getElementById("eTrLab"), eTr = document.getElementById("eTr");
    var estTotal = document.getElementById("estTotal");
    var hrVal = document.getElementById("hrVal");

    function renderEst(){
      var slotFee = parseInt(slotRows[slotIdx].getAttribute("data-rate"), 10);
      var hrFee = hours * HOUR_RATE;
      var trFee = parseInt(travelRows[travelIdx].getAttribute("data-travel"), 10);
      eSlotLab.textContent = SLOT_NAMES[slotIdx];
      eSlot.textContent = gbp(slotFee);
      eHrLab.textContent = "Extra time: " + hours + " × " + gbp(HOUR_RATE);
      eHr.textContent = gbp(hrFee);
      eTrLab.textContent = "Travel (" + TRAVEL_NAMES[travelIdx] + ")";
      eTr.textContent = gbp(trFee);
      estTotal.textContent = gbp(slotFee + hrFee + trFee);
      hrVal.textContent = hours + (hours === 1 ? " hour" : " hours");
    }
    document.querySelectorAll("[data-slot-btn]").forEach(function(b){
      b.addEventListener("click", function(){
        slotIdx = parseInt(b.getAttribute("data-slot-btn"), 10);
        document.querySelectorAll("[data-slot-btn]").forEach(function(x){
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        renderEst();
      });
    });
    document.querySelectorAll("[data-travel-btn]").forEach(function(b){
      b.addEventListener("click", function(){
        travelIdx = parseInt(b.getAttribute("data-travel-btn"), 10);
        document.querySelectorAll("[data-travel-btn]").forEach(function(x){
          x.setAttribute("aria-pressed", x === b ? "true" : "false");
        });
        renderEst();
      });
    });
    document.getElementById("hrPlus").addEventListener("click", function(){
      if (hours < 4) { hours++; renderEst(); }
    });
    document.getElementById("hrMinus").addEventListener("click", function(){
      if (hours > 0) { hours--; renderEst(); }
    });
    renderEst();
  }

  /* ---------- booking form (demonstration — transmits nothing) ---------- */
  var form = document.getElementById("bkForm");
  if (form) {
    form.addEventListener("submit", function(e){
      e.preventDefault();
      var F = {
        bkName:  { ok: function(v){ return v.trim().length > 1; } },
        bkOrg:   { ok: function(v){ return v.trim().length > 1; } },
        bkEmail: { ok: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); } },
        bkSlot:  { ok: function(v){ return v !== ""; } },
        bkDate:  { ok: function(v){ return v.trim().length > 3; } },
        bkCity:  { ok: function(v){ return v.trim().length > 1; } },
        bkMsg:   { ok: function(v){ return v.trim().length > 9; } }
      };
      var allOk = true, firstBad = null;
      Object.keys(F).forEach(function(id){
        var el = document.getElementById(id);
        var err = document.getElementById("e-" + id);
        var ok = F[id].ok(el.value);
        if (err) err.classList.toggle("on", !ok);
        if (!ok) { allOk = false; if (!firstBad) firstBad = el; }
      });
      if (!allOk) { if (firstBad) firstBad.focus(); return; }
      var ref = "SB-2026-" + Math.floor(1000 + Math.random() * 9000);
      document.getElementById("bkRef").textContent = ref;
      document.getElementById("bkEcho").textContent =
        document.getElementById("bkSlot").value + " · " +
        document.getElementById("bkOrg").value.trim() + ", " +
        document.getElementById("bkCity").value.trim() + " · " +
        document.getElementById("bkDate").value.trim() +
        " — for " + document.getElementById("bkName").value.trim() + ".";
      var done = document.getElementById("bkDone");
      done.hidden = false;
      done.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    });
    ["bkName","bkOrg","bkEmail","bkSlot","bkDate","bkCity","bkMsg"].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function(){
        var err = document.getElementById("e-" + id);
        if (err) err.classList.remove("on");
      });
    });
  }
})();

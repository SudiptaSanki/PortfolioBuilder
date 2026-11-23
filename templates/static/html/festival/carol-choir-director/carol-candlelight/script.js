/* Carol Candlelight — a four-part voicing desk, a staff, and optional sound. */
(function () {
  "use strict";
  window.__audioCount = 0;
  window.__audioCreated = false;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- nav ---------- */
  var navBtn = $("#navBtn"), nav = $("#siteNav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? "Close" : "Menu";
    });
  }

  /* ---------- service book filters ---------- */
  var services = $("#services");
  if (services) {
    $$("[data-season]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        var f = chip.getAttribute("data-season");
        $$("[data-season]").forEach(function (c) { c.setAttribute("aria-pressed", c === chip ? "true" : "false"); });
        var shown = 0;
        $$(".service", services).forEach(function (row) {
          var match = f === "all" || row.getAttribute("data-kind") === f;
          row.hidden = !match;
          if (match) shown++;
        });
        var note = $("#serviceCount");
        if (note) note.textContent = shown + " services listed";
      });
    });
  }

  /* ---------- join form ---------- */
  var join = $("#joinForm");
  if (join) {
    var jf = {
      name: { i: $("#jName"), e: $("#jNameErr"), ok: function (v) { return v.trim().length >= 2; }, msg: "A name for the choir list" },
      email: { i: $("#jEmail"), e: $("#jEmailErr"), ok: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: "Check the email address" },
      voice: { i: $("#jVoice"), e: $("#jVoiceErr"), ok: function (v) { return v.trim().length >= 2; }, msg: "Which part do you sing" },
      notes: { i: $("#jNotes"), e: $("#jNotesErr"), ok: function (v) { return v.trim().length >= 15; }, msg: "A line about your singing and your Wednesdays" }
    };
    var status = $("#joinStatus"), touched = false;
    function check(k) {
      var x = jf[k]; if (!x.i) return true;
      var ok = x.ok(x.i.value);
      x.e.textContent = ok ? "" : x.msg;
      x.i.classList.toggle("invalid", !ok);
      x.i.setAttribute("aria-invalid", ok ? "false" : "true");
      return ok;
    }
    Object.keys(jf).forEach(function (k) {
      if (!jf[k].i) return;
      jf[k].i.addEventListener("blur", function () { check(k); });
      jf[k].i.addEventListener("input", function () { if (touched) check(k); });
    });
    join.addEventListener("submit", function (e) {
      e.preventDefault();
      touched = true;
      var good = Object.keys(jf).map(check).every(Boolean);
      if (!good) {
        status.textContent = "A few fields need an answer.";
        status.classList.add("warn");
        var bad = Object.keys(jf).map(function (k) { return jf[k].i; }).filter(function (i) { return i && i.classList.contains("invalid"); })[0];
        if (bad) bad.focus();
        return;
      }
      status.classList.remove("warn");
      status.textContent = "Ready to send: " + $("#jVoice").value + " for " + $("#jName").value.trim() + ". Copy it into an email to the director — nothing has been sent from this page.";
    });
  }

  /* ================= music theory ================= */
  var LETTER_PC = [0, 2, 4, 5, 7, 9, 11];
  var LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
  var MAJOR = [0, 2, 4, 5, 7, 9, 11];
  var MINOR = [0, 2, 3, 5, 7, 8, 10];
  var KEYS = {
    C: { tonic: 0, acc: 0, minor: false, sig: [] },
    G: { tonic: 4, acc: 0, minor: false, sig: ["F#"] },
    D: { tonic: 1, acc: 0, minor: false, sig: ["F#", "C#"] },
    A: { tonic: 5, acc: 0, minor: false, sig: ["F#", "C#", "G#"] },
    F: { tonic: 3, acc: 0, minor: false, sig: ["Bb"] },
    Bb: { tonic: 6, acc: -1, minor: false, sig: ["Bb", "Eb"] },
    Am: { tonic: 5, acc: 0, minor: true, sig: [] },
    Em: { tonic: 2, acc: 0, minor: true, sig: ["F#"] },
    Dm: { tonic: 1, acc: 0, minor: true, sig: ["Bb"] }
  };
  var ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii"];

  function scaleOf(keyId) {
    var k = KEYS[keyId] || KEYS.G;
    var steps = k.minor ? MINOR : MAJOR;
    var tonicPc = (LETTER_PC[k.tonic] + k.acc + 12) % 12;
    var out = [];
    for (var i = 0; i < 7; i++) {
      var letter = (k.tonic + i) % 7;
      var want = (tonicPc + steps[i]) % 12;
      var acc = ((want - LETTER_PC[letter] + 12) % 12);
      if (acc > 6) acc -= 12;
      out.push({ letter: letter, acc: acc, name: LETTERS[letter] + (acc === 1 ? "♯" : acc === -1 ? "♭" : "") });
    }
    return { key: k, degrees: out, tonicPc: tonicPc, name: (LETTERS[k.tonic] + (k.acc === -1 ? "♭" : "")) + (k.minor ? " minor" : " major") };
  }

  function pcOf(note) { return (LETTER_PC[note.letter] + note.acc + 12) % 12; }
  function midiOf(note, octave) { return 12 * (octave + 1) + LETTER_PC[note.letter] + note.acc; }
  function letterOfMidi(midi) {
    var pc = ((midi % 12) + 12) % 12;
    for (var l = 0; l < 7; l++) {
      if (LETTER_PC[l] === pc) return { letter: l, acc: 0 };
    }
    for (var m = 0; m < 7; m++) {
      if ((LETTER_PC[m] + 1) % 12 === pc) return { letter: m, acc: 1 };
      if (((LETTER_PC[m] - 1) + 12) % 12 === pc) return { letter: m, acc: -1 };
    }
    return { letter: 0, acc: 0 };
  }

  function chordTones(scale, degree) {
    var tones = [];
    var d = degree % 7;
    for (var i = 0; i < 3; i++) {
      var idx = d + i * 2;
      var note = scale.degrees[idx % 7];
      tones.push({ letter: note.letter, acc: note.acc, pc: pcOf(note), carry: Math.floor(idx / 7) });
    }
    return tones;
  }

  function qualityOf(scale, degree) {
    var t = chordTones(scale, degree);
    var third = (t[1].pc - t[0].pc + 12) % 12;
    var fifth = (t[2].pc - t[0].pc + 12) % 12;
    if (third === 4 && fifth === 7) return "major";
    if (third === 3 && fifth === 7) return "minor";
    if (third === 3 && fifth === 6) return "diminished";
    if (third === 4 && fifth === 8) return "augmented";
    return "chord";
  }

  function place(pc, min, max) {
    var m = ((pc % 12) + 12) % 12;
    var v = Math.floor(min / 12) * 12 + m;
    if (v < min) v += 12;
    if (v > max) v -= 12;
    return v;
  }

  function voice(scale, degree, inversion, spacing) {
    var t = chordTones(scale, degree);
    var sop, alto, tenor, bass;
    if (spacing === "open") {
      sop = place(t[0].pc, 72, 81);
      alto = place(t[2].pc, sop - 11, sop - 4);
      tenor = place(t[1].pc, alto - 12, alto - 3);
      bass = place(t[inversion % 3].pc, 40, Math.min(55, tenor - 2));
    } else {
      sop = place(t[0].pc, 67, 79);
      alto = place(t[2].pc, sop - 11, sop - 2);
      tenor = place(t[1].pc, alto - 11, alto - 2);
      bass = place(t[inversion % 3].pc, 40, Math.min(55, tenor - 2));
    }
    if (bass >= tenor) bass -= 12;
    if (bass < 40) bass += 12;
    return { bass: bass, tenor: tenor, alto: alto, sop: sop, tones: t };
  }

  function rangeCheck(v) {
    var issues = [];
    if (v.sop < 60 || v.sop > 81) issues.push("Soprano outside C4–A5");
    if (v.alto < 55 || v.alto > 74) issues.push("Alto outside G3–D5");
    if (v.tenor < 48 || v.tenor > 67) issues.push("Tenor outside C3–G4");
    if (v.bass < 41 || v.bass > 62) issues.push("Bass outside F2–D4");
    return issues;
  }

  function parallelCheck(prev, cur) {
    var pairs = [["sop", "alto"], ["sop", "tenor"], ["sop", "bass"], ["alto", "tenor"], ["alto", "bass"], ["tenor", "bass"]];
    var hits = [];
    pairs.forEach(function (p) {
      var a1 = prev[p[0]], a2 = prev[p[1]], b1 = cur[p[0]], b2 = cur[p[1]];
      var m1 = Math.sign(b1 - a1), m2 = Math.sign(b2 - a2);
      if (m1 === 0 || m2 === 0 || m1 !== m2) return;
      var i1 = Math.abs(a1 - a2) % 12, i2 = Math.abs(b1 - b2) % 12;
      if (i1 === i2 && (i1 === 7 || i1 === 0)) {
        hits.push(p[0] + "/" + p[1] + (i1 === 7 ? " fifth" : " octave"));
      }
    });
    return hits;
  }

  /* ================= staff drawing ================= */
  var SVGNS = "http://www.w3.org/2000/svg";
  var staffEl = $("#staff");

  function elNS(name, attrs, text) {
    var node = document.createElementNS(SVGNS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function drawStaff(voicing, scale, degree, inversion, spacing) {
    if (!staffEl) return;
    while (staffEl.firstChild) staffEl.removeChild(staffEl.firstChild);
    var W = 760, trebleBottom = 150, bassBottom = 292, gap = 9;
    var left = 150, right = 706;

    /* paper grain lines */
    staffEl.appendChild(elNS("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: "none" }));

    /* staves */
    for (var s = 0; s < 5; s++) {
      var yT = trebleBottom - s * gap;
      var yB = bassBottom - s * gap;
      staffEl.appendChild(elNS("line", { x1: left, y1: yT, x2: right, y2: yT, stroke: "#3c4a40", "stroke-width": s === 0 || s === 4 ? 1.4 : 0.9 }));
      staffEl.appendChild(elNS("line", { x1: left, y1: yB, x2: right, y2: yB, stroke: "#3c4a40", "stroke-width": s === 0 || s === 4 ? 1.4 : 0.9 }));
    }
    /* left bracket */
    staffEl.appendChild(elNS("path", { d: "M136 " + (trebleBottom - 40) + " C126 " + (trebleBottom - 10) + " 126 " + (bassBottom + 10) + " 136 " + (bassBottom + 40), fill: "none", stroke: "#3c4a40", "stroke-width": 1.4 }));
    staffEl.appendChild(elNS("line", { x1: 136, y1: trebleBottom - 40, x2: 136, y2: bassBottom + 40, stroke: "#3c4a40", "stroke-width": 2.2 }));
    staffEl.appendChild(elNS("text", { x: left + 14, y: trebleBottom + 8, "font-family": "Georgia, serif", "font-size": 66, fill: "#22312a" }, "𝄞"));
    staffEl.appendChild(elNS("text", { x: left + 18, y: bassBottom - 2, "font-family": "Georgia, serif", "font-size": 42, fill: "#22312a" }, "𝄢"));
    staffEl.appendChild(elNS("text", { x: 126, y: bassBottom - 46, "text-anchor": "end", "font-family": "Courier Prime, monospace", "font-size": 8, fill: "#6c6a58" }, "T·B"));

    /* key signature */
    var sigPositions = { "F#": [38, 24], "C#": [35, 21], "G#": [39, 25], "Bb": [34, 20], "Eb": [37, 23] };
    KEYS[$("#key") ? $("#key").value : "G"].sig.forEach(function (sig, i) {
      var pos = sigPositions[sig];
      if (!pos) return;
      var yT2 = trebleBottom - (pos[0] - 30) * 4.5;
      var yB2 = bassBottom - (pos[1] - 18) * 4.5;
      staffEl.appendChild(elNS("text", { x: left + 62 + i * 11, y: yT2 + 5, "font-family": "Georgia, serif", "font-size": 17, fill: "#22312a" }, sig.indexOf("#") >= 0 ? "♯" : "♭"));
      staffEl.appendChild(elNS("text", { x: left + 62 + i * 11, y: yB2 + 5, "font-family": "Georgia, serif", "font-size": 17, fill: "#22312a" }, sig.indexOf("#") >= 0 ? "♯" : "♭"));
    });

    /* time signature */
    staffEl.appendChild(elNS("text", { x: left + 100, y: trebleBottom - 26, "font-family": "Georgia, serif", "font-size": 15, fill: "#22312a" }, "4"));
    staffEl.appendChild(elNS("text", { x: left + 100, y: trebleBottom - 10, "font-family": "Georgia, serif", "font-size": 15, fill: "#22312a" }, "4"));

    var voices = [
      { key: "sop", label: "S", x: 392, clef: "treble", color: "#7a2e26", stem: -1 },
      { key: "alto", label: "A", x: 450, clef: "treble", color: "#2f5d45", stem: 1 },
      { key: "tenor", label: "T", x: 506, clef: "bass", color: "#2c4a6b", stem: -1 },
      { key: "bass", label: "B", x: 564, clef: "bass", color: "#6b4a1f", stem: 1 }
    ];

    /* voice labels above the system */
    voices.forEach(function (v) {
      staffEl.appendChild(elNS("text", { x: v.x, y: 64, "text-anchor": "middle", "font-family": "Courier Prime, monospace", "font-size": 10, fill: "#6c6a58", "letter-spacing": 1 }, v.label));
    });

    voices.forEach(function (v) {
      var midi = voicing[v.key];
      var n = letterOfMidi(midi);
      var octave = Math.floor(midi / 12) - 1;
      var step = (octave * 7 + n.letter) - (v.clef === "treble" ? 30 : 18);
      var y = (v.clef === "treble" ? trebleBottom : bassBottom) - step * 4.5;
      var x = v.x;

      /* ledger lines */
      if (step > 8) {
        for (var L = 10; L <= step; L += 2) {
          var ly = (v.clef === "treble" ? trebleBottom : bassBottom) - L * 4.5;
          staffEl.appendChild(elNS("line", { x1: x - 15, y1: ly, x2: x + 15, y2: ly, stroke: "#3c4a40", "stroke-width": 1 }));
        }
      }
      if (step < 0) {
        for (var M = -2; M >= step; M -= 2) {
          var ly2 = (v.clef === "treble" ? trebleBottom : bassBottom) - M * 4.5;
          staffEl.appendChild(elNS("line", { x1: x - 15, y1: ly2, x2: x + 15, y2: ly2, stroke: "#3c4a40", "stroke-width": 1 }));
        }
      }

      /* accidental when it is not in the key signature */
      var keySig = KEYS[$("#key") ? $("#key").value : "G"].sig;
      var sign = (n.acc === 1 ? "♯" : n.acc === -1 ? "♭" : "");
      var inSig = sign && keySig.indexOf(LETTERS[n.letter] + sign) >= 0;
      if (sign && !inSig) {
        staffEl.appendChild(elNS("text", { x: x - 26, y: y + 5, "font-family": "Georgia, serif", "font-size": 17, fill: "#22312a" }, sign));
      }

      /* note head */
      var head = elNS("ellipse", { cx: x, cy: y, rx: 7, ry: 5, fill: v.color, transform: "rotate(-18 " + x + " " + y + ")" });
      staffEl.appendChild(head);
      /* stem */
      var stemLen = 30;
      var stemX = v.stem < 0 ? x + 5.8 : x - 5.8;
      staffEl.appendChild(elNS("line", { x1: stemX, y1: y, x2: stemX, y2: y + (v.stem < 0 ? -stemLen : stemLen), stroke: v.color, "stroke-width": 1.6 }));
      /* part letter next to the head */
      staffEl.appendChild(elNS("text", { x: x - 22, y: y + 20, "font-family": "Courier Prime, monospace", "font-size": 8.5, fill: "#8a8672" }, v.label));
    });

    /* lyric line under the treble staff */
    staffEl.appendChild(elNS("text", { x: 200, y: trebleBottom + 46, "font-family": "EB Garamond, serif", "font-style": "italic", "font-size": 14, fill: "#6c6a58" }, "Ve-ni, ve-ni, Em-man-u-el"));
    staffEl.appendChild(elNS("line", { x1: 200, y1: trebleBottom + 56, x2: 600, y2: trebleBottom + 56, stroke: "#bdb59d", "stroke-width": 0.8 }));

    /* footer of the manuscript */
    staffEl.appendChild(elNS("text", { x: 150, y: 326, "font-family": "Courier Prime, monospace", "font-size": 9, fill: "#8a8672" }, "St Brigid's · SATB · " + scale.name + " · " + ROMAN[degree] + (inversion ? (inversion === 1 ? "6" : "64") : "")));
    staffEl.appendChild(elNS("text", { x: right, y: 326, "text-anchor": "end", "font-family": "Courier Prime, monospace", "font-size": 9, fill: "#8a8672" }, spacing === "open" ? "OPEN SCORE" : "CLOSE SCORE"));
  }

  /* ================= bench logic ================= */
  var staff = $("#staff");
  if (!staff) return;
  var el = {
    key: $("#key"), degree: $("#degree"), inversion: $("#inversion"), spacing: $("#spacing"),
    name: $("#chordName"), checks: $("#checks"), partCount: $("#partCount"),
    play: $("#playBtn"), cadence: $("#cadenceBtn"), stop: $("#stopBtn"), status: $("#audioStatus")
  };
  var current = null;
  var actx = null;
  var timers = [];

  function noteNameOfMidi(midi) {
    var n = letterOfMidi(midi);
    return LETTERS[n.letter] + (n.acc === 1 ? "♯" : n.acc === -1 ? "♭" : "") + (Math.floor(midi / 12) - 1);
  }

  function build() {
    var scale = scaleOf(el.key.value);
    var degree = parseInt(el.degree.value, 10);
    var inversion = parseInt(el.inversion.value, 10);
    var spacing = el.spacing.value;
    var v = voice(scale, degree, inversion, spacing);
    return { scale: scale, degree: degree, inversion: inversion, spacing: spacing, v: v };
  }

  function renderChecks(state) {
    var v = state.v, scale = state.scale;
    var items = [];
    var ranges = rangeCheck(v);
    if (ranges.length === 0) {
      items.push({ ok: true, text: "Ranges are inside the parish limits: S " + noteNameOfMidi(v.sop) + ", A " + noteNameOfMidi(v.alto) + ", T " + noteNameOfMidi(v.tenor) + ", B " + noteNameOfMidi(v.bass) + "." });
    } else {
      items.push({ ok: false, text: ranges.join("; ") + ". Move the octave or change the inversion." });
    }
    var sa = v.sop - v.alto, at = v.alto - v.tenor, tb = v.tenor - v.bass;
    var spacingOk = sa <= 12 && at <= 12 && tb <= 19;
    items.push({
      ok: spacingOk,
      text: spacingOk
        ? "Spacing holds: S–A " + sa + " semitones, A–T " + at + ", T–B " + tb + "."
        : "Spacing is wide: S–A " + sa + ", A–T " + at + ", T–B " + tb + " — the middle will sound hollow."
    });
    var rootPc = state.v.tones[0].pc;
    var rootCount = [v.sop, v.alto, v.tenor, v.bass].filter(function (m) { return ((m % 12) + 12) % 12 === rootPc; }).length;
    items.push({
      ok: rootCount >= 2,
      text: rootCount >= 2 ? "The root is doubled, which is what a parish choir wants on a final chord." : "The root appears once; consider doubling it in the alto."
    });
    var prevDegree = (state.degree + 6) % 7;
    var prev = voice(scale, prevDegree, 0, state.spacing);
    var parallels = parallelCheck(prev, v);
    items.push({
      ok: parallels.length === 0,
      text: parallels.length === 0
        ? "No parallel fifths or octaves against the chord a degree below (" + ROMAN[prevDegree] + ", root position)."
        : "Parallel " + parallels.join(", ") + " against " + ROMAN[prevDegree] + ". Revise the inner parts."
    });
    items.push({
      ok: true,
      text: "Doubling the third is avoided; the fifth may be omitted in a four-part texture if the root needs weight."
    });

    el.checks.innerHTML = "";
    items.forEach(function (it) {
      var li = document.createElement("li");
      var mark = document.createElement("span");
      mark.className = it.ok ? "ok" : "warn";
      mark.textContent = it.ok ? "✓" : "!";
      var txt = document.createElement("span");
      txt.textContent = it.text;
      li.appendChild(mark);
      li.appendChild(txt);
      el.checks.appendChild(li);
    });
  }

  function render() {
    var state = build();
    current = state;
    var v = state.v;
    var q = qualityOf(state.scale, state.degree);
    var invName = state.inversion === 0 ? "root position" : state.inversion === 1 ? "first inversion" : "second inversion";
    el.name.textContent = state.scale.name + " · " + ROMAN[state.degree] + " (" + q + ") · " + invName;
    el.partCount.textContent = "4 parts · " + (state.spacing === "open" ? "open" : "close");
    renderChecks(state);
    drawStaff(v, state.scale, state.degree, state.inversion, state.spacing);
    staff.setAttribute("aria-label", "Four-part chord: soprano " + noteNameOfMidi(v.sop) + ", alto " + noteNameOfMidi(v.alto) + ", tenor " + noteNameOfMidi(v.tenor) + ", bass " + noteNameOfMidi(v.bass));
  }

  /* ================= audio (opt-in only) ================= */
  function ensureContext() {
    if (actx) return actx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    actx = new AC();
    window.__audioCount = (window.__audioCount || 0) + 1;
    window.__audioCreated = true;
    return actx;
  }

  function playNote(midi, when, dur) {
    var ctx = ensureContext();
    if (!ctx) return;
    var t0 = ctx.currentTime + when;
    var freq = 440 * Math.pow(2, (midi - 69) / 12);
    var o1 = ctx.createOscillator();
    var o2 = ctx.createOscillator();
    var g = ctx.createGain();
    o1.type = "triangle";
    o2.type = "sine";
    o1.frequency.value = freq;
    o2.frequency.value = freq;
    o2.detune.value = 3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(0.085, t0 + 0.28);
    g.gain.setValueAtTime(0.085, t0 + Math.max(0.3, dur - 0.5));
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o1.connect(g); o2.connect(g); g.connect(ctx.destination);
    o1.start(t0); o2.start(t0);
    o1.stop(t0 + dur + 0.05); o2.stop(t0 + dur + 0.05);
  }

  function stopAll() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    if (actx) {
      try { actx.close(); } catch (e) { /* already closed */ }
      actx = null;
    }
    if (el.stop) el.stop.disabled = true;
    if (el.status) {
      el.status.textContent = "Sound stopped. Nothing is playing.";
      el.status.classList.remove("live");
    }
  }

  function playChord() {
    if (!current) return;
    var ctx = ensureContext();
    if (!ctx) {
      el.status.textContent = "This browser has no audio output available.";
      return;
    }
    if (ctx.state === "suspended") ctx.resume();
    var v = current.v;
    var dur = 2.6;
    [v.sop, v.alto, v.tenor, v.bass].forEach(function (m, i) { playNote(m, i * 0.03, dur); });
    el.stop.disabled = false;
    el.status.textContent = "Sounding: " + noteNameOfMidi(v.sop) + " / " + noteNameOfMidi(v.alto) + " / " + noteNameOfMidi(v.tenor) + " / " + noteNameOfMidi(v.bass) + ".";
    el.status.classList.add("live");
    timers.push(setTimeout(function () {
      stopAll();
      el.status.textContent = "The chord has rung out. Press play to hear it again.";
    }, (dur + 0.3) * 1000));
  }

  function playCadence() {
    if (!current) return;
    var ctx = ensureContext();
    if (!ctx) { el.status.textContent = "This browser has no audio output available."; return; }
    if (ctx.state === "suspended") ctx.resume();
    var degrees = [0, 3, 4, 0];
    var scale = current.scale;
    var dur = 1.5;
    degrees.forEach(function (d, i) {
      var vv = voice(scale, d, i === degrees.length - 1 ? 0 : 0, current.spacing);
      [vv.sop, vv.alto, vv.tenor, vv.bass].forEach(function (m, j) { playNote(m, i * 1.35 + j * 0.02, dur); });
    });
    el.stop.disabled = false;
    el.status.textContent = "Sounding: I – IV – V – I in " + scale.name + ".";
    el.status.classList.add("live");
    timers.push(setTimeout(function () {
      stopAll();
      el.status.textContent = "Cadence finished. Silence again.";
    }, 6200));
  }

  [el.key, el.degree, el.inversion, el.spacing].forEach(function (node) {
    if (node) node.addEventListener("change", render);
  });
  if (el.play) el.play.addEventListener("click", playChord);
  if (el.cadence) el.cadence.addEventListener("click", playCadence);
  if (el.stop) el.stop.addEventListener("click", stopAll);
  window.addEventListener("pagehide", function () { if (actx) { try { actx.close(); } catch (e) {} } });

  render();

  function resizeStaff() {
    if (!staff) return;
    var rect = staff.getBoundingClientRect();
    if (!rect.width) return;
    staff.style.height = Math.round(rect.width * (340 / 760)) + "px";
  }
  if (window.ResizeObserver) new ResizeObserver(resizeStaff).observe(staff);
  else window.addEventListener("resize", resizeStaff);
  resizeStaff();
})();

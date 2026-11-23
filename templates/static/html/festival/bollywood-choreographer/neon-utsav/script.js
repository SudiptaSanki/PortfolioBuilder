/* ============================================================
   Neon Utsav — Tara Bakshi
   The cue-sheet planner and an opt-in taal metronome.
   No audio is created until the visitor presses "Count it out".
   ============================================================ */
(function () {
  'use strict';

  var navBtn = document.getElementById('menuBtn');
  if (navBtn) {
    navBtn.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      navBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  /* ---------- booking form ---------- */

  var form = document.getElementById('bookForm');
  if (form) {
    var emailRe = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
    var note = document.getElementById('formNote');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var checks = [
        ['bookName', function (v) { return v.trim().length > 1; }, 'A name, so I know who is on the floor.'],
        ['bookEmail', function (v) { return emailRe.test(v.trim()); }, 'That email will bounce. Check it once.'],
        ['bookDate', function (v) { return v.trim() !== ''; }, 'Give me a date, even an approximate one.'],
        ['bookMessage', function (v) { return v.trim().length > 15; }, 'Tell me the venue and the number of dancers.']
      ];
      checks.forEach(function (c) {
        var input = document.getElementById(c[0]);
        var err = document.getElementById('err-' + c[0]);
        if (!c[1](input.value)) {
          if (err) err.textContent = c[2];
          ok = false;
        } else if (err) {
          err.textContent = '';
        }
      });
      var consent = document.getElementById('bookConsent');
      if (!consent.checked) {
        document.getElementById('err-consent').textContent = 'Tick the box so I may hold on to these details.';
        ok = false;
      } else {
        document.getElementById('err-consent').textContent = '';
      }
      if (!ok) {
        var first = form.querySelector('.err:not(:empty)');
        if (first) {
          var field = first.parentElement.querySelector('input, textarea, select');
          if (field) field.focus();
        }
        return;
      }
      note.hidden = false;
      note.textContent = 'Booked into the inbox. I answer new enquiries on Mondays and Thursdays; if the date is inside two weeks, write again with URGENT in the first line.';
      form.reset();
    });
  }

  /* ---------- planner ---------- */

  var canvas = document.getElementById('stageMap');
  if (!canvas) return;

  var el = {
    dancers: document.getElementById('dancers'),
    tempo: document.getElementById('tempo'),
    eights: document.getElementById('eights'),
    formation: document.getElementById('formation'),
    dancersOut: document.getElementById('dancersOut'),
    tempoOut: document.getElementById('tempoOut'),
    eightsOut: document.getElementById('eightsOut'),
    dur: document.getElementById('outDur'),
    counts: document.getElementById('outCounts'),
    changes: document.getElementById('outChanges'),
    risk: document.getElementById('outRisk'),
    cueBody: document.getElementById('cueBody'),
    cueMeta: document.getElementById('cueMeta'),
    beatDots: document.getElementById('beatDots'),
    beatText: document.getElementById('beatText'),
    play: document.getElementById('playBtn'),
    stop: document.getElementById('stopBtn'),
    soundNote: document.getElementById('soundNote')
  };

  var PINK = '#ff2d78';
  var CYAN = '#2ee6d6';
  var LAMP = '#ffb257';
  var WHITE = '#f2ecff';
  var MUTED = '#8b7fa8';

  var order = ['v', 'tworows', 'line', 'circle', 'diagonal'];
  var names = { v: 'V open', line: 'Front line', tworows: 'Two rows', circle: 'Circle', diagonal: 'Diagonal' };

  function setup(cv, w, h) {
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    return ctx;
  }

  /* Stage box in canvas coordinates: audience at the bottom. */
  var ST = { x: 70, y: 44, w: 520, h: 300 };

  function positions(formation, n) {
    var pts = [];
    var i;
    if (formation === 'line') {
      for (i = 0; i < n; i++) {
        pts.push({ x: ST.x + 40 + (i / Math.max(1, n - 1)) * (ST.w - 80), y: ST.y + ST.h - 42 });
      }
    } else if (formation === 'tworows') {
      var front = Math.ceil(n / 2);
      for (i = 0; i < n; i++) {
        var inFront = i < front;
        var idx = inFront ? i : i - front;
        var cnt = inFront ? front : n - front;
        pts.push({
          x: ST.x + 50 + (idx / Math.max(1, cnt - 1)) * (ST.w - 100),
          y: ST.y + ST.h - (inFront ? 40 : 128)
        });
      }
    } else if (formation === 'v') {
      var centre = (n - 1) / 2;
      for (i = 0; i < n; i++) {
        var off = i - centre;
        pts.push({
          x: ST.x + ST.w / 2 + off * 46,
          y: ST.y + ST.h - 40 - Math.abs(off) * 40
        });
      }
    } else if (formation === 'circle') {
      var cx = ST.x + ST.w / 2;
      var cy = ST.y + ST.h / 2 + 10;
      var r = 104;
      for (i = 0; i < n; i++) {
        var a = -Math.PI / 2 + (i / n) * Math.PI * 2;
        pts.push({ x: cx + Math.cos(a) * r * 1.35, y: cy + Math.sin(a) * r * 0.72 });
      }
    } else {
      for (i = 0; i < n; i++) {
        var t = i / Math.max(1, n - 1);
        pts.push({
          x: ST.x + 54 + t * (ST.w - 108),
          y: ST.y + ST.h - 38 - t * (ST.h - 110)
        });
      }
    }
    return pts;
  }

  function drawStage(formation, n, nextFormation, tempo) {
    var W = 660, H = 420;
    var ctx = setup(canvas, W, H);

    /* house */
    ctx.fillStyle = '#0b0716';
    ctx.fillRect(0, 0, W, H);

    /* stage floor */
    var floorGrad = ctx.createLinearGradient(0, ST.y, 0, ST.y + ST.h);
    floorGrad.addColorStop(0, '#160f26');
    floorGrad.addColorStop(1, '#0d0819');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(ST.x, ST.y, ST.w, ST.h);

    /* floor boards */
    ctx.strokeStyle = 'rgba(242,236,255,0.06)';
    ctx.lineWidth = 1;
    for (var b = 1; b < 12; b++) {
      var bx = ST.x + (ST.w / 12) * b;
      ctx.beginPath(); ctx.moveTo(bx, ST.y); ctx.lineTo(bx, ST.y + ST.h); ctx.stroke();
    }
    for (var d = 1; d < 8; d++) {
      var by = ST.y + (ST.h / 8) * d;
      ctx.beginPath(); ctx.moveTo(ST.x, by); ctx.lineTo(ST.x + ST.w, by); ctx.stroke();
    }

    /* proscenium edge and apron */
    ctx.strokeStyle = 'rgba(255,45,120,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(ST.x, ST.y, ST.w, ST.h);

    /* centre line and marks */
    ctx.strokeStyle = 'rgba(46,230,214,0.28)';
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.moveTo(ST.x + ST.w / 2, ST.y);
    ctx.lineTo(ST.x + ST.w / 2, ST.y + ST.h + 14);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = MUTED;
    ctx.font = '400 9px "DM Mono", monospace';
    ctx.fillText('UPSTAGE', ST.x + 8, ST.y - 12);
    ctx.fillText('AUDIENCE', ST.x + ST.w / 2 - 26, ST.y + ST.h + 30);

    /* house light spill from the front */
    var spill = ctx.createLinearGradient(0, ST.y + ST.h, 0, ST.y + ST.h - 90);
    spill.addColorStop(0, 'rgba(255,178,87,0.16)');
    spill.addColorStop(1, 'rgba(255,178,87,0)');
    ctx.fillStyle = spill;
    ctx.fillRect(ST.x, ST.y + ST.h - 90, ST.w, 90);

    /* ghost of the next formation */
    var ghost = positions(nextFormation, n);
    ctx.save();
    ctx.setLineDash([3, 5]);
    ctx.strokeStyle = 'rgba(46,230,214,0.55)';
    ctx.lineWidth = 1.2;
    ghost.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 9, 0, Math.PI * 2);
      ctx.stroke();
    });
    /* travel arrows from current to next for a few dancers */
    ctx.strokeStyle = 'rgba(46,230,214,0.3)';
    ctx.beginPath();
    var cur = positions(formation, n);
    for (var k = 0; k < Math.min(cur.length, ghost.length); k += 2) {
      ctx.moveTo(cur[k].x, cur[k].y);
      ctx.lineTo(ghost[k].x, ghost[k].y);
    }
    ctx.stroke();
    ctx.restore();

    /* the dancers */
    var pts = positions(formation, n);
    pts.forEach(function (p, i) {
      var glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
      glow.addColorStop(0, 'rgba(255,45,120,0.45)');
      glow.addColorStop(1, 'rgba(255,45,120,0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
      ctx.fill();

      /* shoulders: a short bar turned to face the audience */
      ctx.save();
      ctx.translate(p.x, p.y);
      var angle = formation === 'circle' ? Math.atan2(ST.y + ST.h / 2 - p.y, ST.x + ST.w / 2 - p.x) : 0;
      ctx.rotate(angle);
      ctx.fillStyle = PINK;
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,45,120,0.85)';
      ctx.beginPath();
      ctx.ellipse(0, 6, 8.5, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(242,236,255,0.85)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, -4.2);
      ctx.lineTo(0, -9);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = 'rgba(242,236,255,0.5)';
      ctx.font = '400 8px "DM Mono", monospace';
      ctx.fillText(String(i + 1), p.x + 11, p.y - 9);
    });

    /* count strip along the bottom */
    var stripY = 372;
    var cellW = (ST.w) / 8;
    for (var c = 0; c < 8; c++) {
      var x = ST.x + c * cellW;
      ctx.strokeStyle = c === 0 ? 'rgba(255,45,120,0.8)' : 'rgba(242,236,255,0.18)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 1, stripY, cellW - 2, 26);
      ctx.fillStyle = c === 0 ? PINK : MUTED;
      ctx.font = '500 10px "DM Mono", monospace';
      ctx.fillText(String(c + 1), x + cellW / 2 - 3, stripY + 17);
    }
    ctx.fillStyle = MUTED;
    ctx.font = '400 9px "DM Mono", monospace';
    ctx.fillText('ONE CYCLE · ' + tempo + ' BPM', ST.x, stripY - 8);

    /* stage label */
    ctx.fillStyle = WHITE;
    ctx.font = '500 10px "DM Mono", monospace';
    ctx.fillText(names[formation].toUpperCase() + ' · ' + n + ' DANCERS', ST.x, 22);
  }

  function cycleNext(f) {
    var i = order.indexOf(f);
    return order[(i + 1) % order.length];
  }

  function cueRows(formation, n, eights) {
    var rows = [];
    var next = cycleNext(formation);
    for (var e = 1; e <= eights; e++) {
      var a, b, f;
      if (e === 1) {
        a = 'Walk in on the downbeat, mark the first four';
        b = 'Settle into the ' + names[formation].toLowerCase() + ', breathe before the lift';
        f = names[formation];
      } else if (e === eights) {
        a = 'Half-turn out of ' + names[formation].toLowerCase() + ', two counts of travel';
        b = 'Land the final pose on 7, hold 8 — nobody moves until the lights do';
        f = names[next];
      } else if (e % 2 === 0) {
        a = 'Repeat the second phrase, arms mirrored';
        b = 'Drift to ' + names[next].toLowerCase() + ' over the last two counts';
        f = names[next];
      } else {
        a = 'Chorus phrase — front row leads, back row echoes one count late';
        b = 'Hold the centre, then cut to ' + names[cycleNext(next)].toLowerCase();
        f = names[formation];
      }
      rows.push([String(e).padStart(2, '0'), a, b, f]);
    }
    return rows;
  }

  function riskLevel(formation, n, tempo) {
    var score = 0;
    if (formation === 'line') score += n > 12 ? 3 : 1;
    if (formation === 'circle') score += 1;
    if (formation === 'diagonal') score += n > 10 ? 2 : 1;
    if (tempo > 132) score += 2;
    else if (tempo > 116) score += 1;
    if (n > 14) score += 1;
    if (score >= 5) return 'high';
    if (score >= 3) return 'medium';
    return 'low';
  }

  var current = { formation: 'v', dancers: 12, tempo: 104, eights: 4 };

  function readPlanner() {
    return {
      dancers: parseInt(el.dancers.value, 10),
      tempo: parseInt(el.tempo.value, 10),
      eights: parseInt(el.eights.value, 10),
      formation: el.formation.value
    };
  }

  function renderPlanner() {
    var s = readPlanner();
    current = s;
    el.dancersOut.textContent = String(s.dancers);
    el.tempoOut.textContent = String(s.tempo);
    el.eightsOut.textContent = String(s.eights);

    var seconds = (s.eights * 8 * 60) / s.tempo;
    el.dur.textContent = seconds.toFixed(1);
    el.counts.textContent = String(s.eights * 8);
    el.changes.textContent = String(Math.max(0, s.eights - 1));
    el.risk.textContent = riskLevel(s.formation, s.dancers, s.tempo);

    drawStage(s.formation, s.dancers, cycleNext(s.formation), s.tempo);

    var rows = cueRows(s.formation, s.dancers, s.eights);
    var html = '';
    rows.forEach(function (r) {
      html += '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td>' + r[3] + '</td></tr>';
    });
    el.cueBody.innerHTML = html;
    el.cueMeta.textContent = s.dancers + ' dancers · ' + names[s.formation] + ' · ' + s.tempo + ' BPM · ' + s.eights + ' eights';
    buildBeatDots();
  }

  function buildBeatDots() {
    if (el.beatDots.children.length !== 8) {
      el.beatDots.innerHTML = '';
      for (var i = 1; i <= 8; i++) {
        var sp = document.createElement('span');
        sp.textContent = String(i);
        el.beatDots.appendChild(sp);
      }
    }
  }

  function setBeat(idx, label) {
    var dots = el.beatDots.children;
    for (var i = 0; i < dots.length; i++) {
      dots[i].className = i === idx ? 'on' : '';
    }
    if (label) el.beatText.textContent = label;
  }

  ['input', 'change'].forEach(function (evt) {
    el.dancers.addEventListener(evt, renderPlanner);
    el.tempo.addEventListener(evt, renderPlanner);
    el.eights.addEventListener(evt, renderPlanner);
    el.formation.addEventListener(evt, renderPlanner);
  });

  renderPlanner();

  /* ---------- opt-in taal metronome ---------- */

  var actx = null;
  var noiseBuf = null;
  var timer = null;
  var nextTime = 0;
  var beat = 0;
  var pulseTimers = [];

  function makeNoise(ctx) {
    var len = Math.floor(ctx.sampleRate * 0.12);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var data = buf.getChannelData(0);
    for (var i = 0; i < len; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    return buf;
  }

  function hit(ctx, time, kind, strong) {
    var gain = ctx.createGain();
    gain.connect(ctx.destination);
    var vol = strong ? 0.22 : 0.11;
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(vol, time + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + (strong ? 0.26 : 0.16));

    if (kind === 'clap') {
      var src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      var hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1400;
      src.connect(hp).connect(gain);
      src.start(time);
      src.stop(time + 0.14);
      return;
    }

    var osc = ctx.createOscillator();
    osc.type = 'sine';
    if (kind === 'tabla') {
      osc.frequency.setValueAtTime(strong ? 210 : 330, time);
      osc.frequency.exponentialRampToValueAtTime(strong ? 150 : 240, time + 0.08);
    } else {
      osc.frequency.setValueAtTime(strong ? 96 : 168, time);
      osc.frequency.exponentialRampToValueAtTime(strong ? 62 : 120, time + 0.12);
    }
    osc.connect(gain);
    osc.start(time);
    osc.stop(time + 0.3);

    if (strong) {
      var thump = ctx.createOscillator();
      var tg = ctx.createGain();
      thump.type = 'triangle';
      thump.frequency.setValueAtTime(54, time);
      thump.frequency.exponentialRampToValueAtTime(40, time + 0.18);
      tg.gain.setValueAtTime(0.14, time);
      tg.gain.exponentialRampToValueAtTime(0.0001, time + 0.24);
      thump.connect(tg).connect(ctx.destination);
      thump.start(time);
      thump.stop(time + 0.26);
    }
  }

  function taalKind() {
    var r = document.querySelector('input[name="taal"]:checked');
    return r ? r.value : 'dhol';
  }

  function scheduler() {
    if (!actx) return;
    var spb = 60 / current.tempo;
    while (nextTime < actx.currentTime + 0.18) {
      var kind = taalKind();
      var strong = beat % 4 === 0;
      hit(actx, nextTime, kind, strong);
      var when = Math.max(0, (nextTime - actx.currentTime) * 1000);
      var b = beat % 8;
      pulseTimers.push(setTimeout(function (bb, s) {
        return function () {
          var word = ['dha', 'dhin', 'na', 'tin', 'dha', 'dhin', 'na', 'tin'][bb];
          setBeat(bb, 'Count ' + (bb + 1) + ' · ' + (bb === 7 ? 'hold and breathe' : word));
        };
      }(b, strong), when));
      nextTime += spb;
      beat += 1;
    }
  }

  function startAudio() {
    if (!actx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        el.soundNote.textContent = 'This browser will not play audio. The planner still works silently.';
        return;
      }
      actx = new AC();
      noiseBuf = makeNoise(actx);
    }
    if (actx.state === 'suspended') actx.resume();
    beat = 0;
    nextTime = actx.currentTime + 0.08;
    timer = setInterval(scheduler, 40);
    scheduler();
    el.play.setAttribute('aria-pressed', 'true');
    el.play.disabled = true;
    el.stop.disabled = false;
    el.soundNote.textContent = 'Counting ' + taalKind() + ' at ' + current.tempo + ' BPM. Press stop to end it.';
  }

  function stopAudio() {
    if (timer) { clearInterval(timer); timer = null; }
    pulseTimers.forEach(clearTimeout);
    pulseTimers = [];
    setBeat(-1, 'Count stopped · press to hear the taal again');
    el.play.disabled = false;
    el.stop.disabled = true;
    el.play.setAttribute('aria-pressed', 'false');
    el.soundNote.textContent = 'Stopped. Nothing is playing until you press again.';
    if (actx) {
      var ctx = actx;
      actx = null;
      setTimeout(function () { if (ctx.state !== 'closed') ctx.close(); }, 60);
    }
  }

  el.play.addEventListener('click', startAudio);
  el.stop.addEventListener('click', stopAudio);

  document.addEventListener('visibilitychange', function () {
    if (document.hidden && (timer || actx)) stopAudio();
  });

  /* tempo changes while playing restart the interval cleanly */
  el.tempo.addEventListener('change', function () {
    if (timer) { stopAudio(); startAudio(); }
  });
})();

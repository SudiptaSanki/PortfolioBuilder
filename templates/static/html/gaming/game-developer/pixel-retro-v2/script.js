/* ============================================================
   VEGA PIXEL WORKS — pixel-retro
   Sound ruling: ONE fenced exception. The "Lanternfall sketch"
   button plays a short square-wave melody synthesised live in
   the browser — labelled on the page as a synthesised sketch,
   NOT a recording and not the game's soundtrack (the game's
   music is credited to a collaborator in the case file). It
   starts only on an explicit tap, plays at fixed low gain
   (0.10), stops itself at the end of the sketch (~4.6 s), and
   has a stop control. That is the frequency-room pattern, and
   it is the only AudioContext this site ever creates. The
   stub's hover blips were removed, not rebuilt: hover audio
   is banned on this program, full stop.
   ============================================================ */
(function () {
  'use strict';

  /* Cross-document view transitions abort harmlessly when a second
     navigation interrupts the first; Chrome surfaces that abort as
     an unhandled rejection. Swallow only that exact rejection. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var eur = function (n) { return '€' + n.toLocaleString('en-GB'); };
  var num = function (n) { return n.toLocaleString('en-GB'); };

  /* ==========================================================
     PIXEL ARTWORK — the persona's own work, drawn as data.
     Each piece is a character map + palette; the renderer turns
     it into an SVG of true 1-unit pixels (crispEdges), so the
     art is honest at any integer scale. The palette counter
     below reads the LIGHTHOUSE's colours back out of the
     rendered SVG — the count is measured, never typed in.
     ========================================================== */
  var ART = {
    lighthouse: {
      pal: { K:'#2b2436', Y:'#f2b63c', R:'#bc4632', W:'#f6efdd', B:'#6d5a44', G:'#8b93a0' },
      rows: [
        '.......KK.......',
        '......KYYK......',
        '......KYYK......',
        '.....KKKKKK.....',
        '.....KRRRRK.....',
        '.....KRRRRK.....',
        '.....KWWWWK.....',
        '.....KWKKWK.....',
        '.....KWWWWK.....',
        '.....KRRRRK.....',
        '....KKRRRRKK....',
        '....KWWKKWWK....',
        '....KWWKKWWK....',
        '...KKWWWWWWKK...',
        '..KBBGGBBBGGBK..',
        '.KBBBKBBBBKBBBK.'
      ]
    },
    keeperBody: [
      '....KKKK....',
      '...KYYYYK...',
      '...KWWWWK...',
      '...KWWWWK...',
      '..KRRRRRRK..',
      '.KRRKRRKRRK.',
      '.KRRRRRRRRK.',
      '..KRRRRRRK..',
      '...GGGGGG...',
      '...GG..GG...'
    ],
    keeperPal: { K:'#2b2436', Y:'#f2b63c', W:'#f0d7b8', R:'#a03a2a', G:'#4d5a68', B:'#4a3826' },
    keeperLegs: [
      ['...GG..GG...','...GG..GG...','..BBB..BBB..','..BBB..BBB..'],
      ['..GG....GG..','..GG.....GG.','.BBB.....BBB','.BBB.....BBB'],
      ['...GG..GG...','...GG..GG...','..BBB..BBB..','..BBB..BBB..'],
      ['..GG....GG..','.GG.....GG..','BBB......BBB','BBB......BBB']
    ],
    tileset: {
      pal: { g:'#5d8a48', G:'#4d7a40', F:'#f6efdd', p:'#e58a7a', D:'#9a7a4e', d:'#7d6240', s:'#8b93a0', a:'#4f84a8', A:'#7fb0c9', e:'#3a6a8c', B:'#6d5a44', K:'#2b2436' },
      rows: [
        'ggggggggDDDDDDDDaaaaaaaaBBBBBBBB',
        'gGggGgggDdDDDDdDAAAAAAAABgBgBgBg',
        'ggFgggggDDDDDDDDaAAAaaaABBBBBBBB',
        'ggggggGgDdsDDDDDaaaaaaaaBgBgBgBg',
        'gGggggggDDDDDDDDaAAaaAAABBBBBBBB',
        'gggpGgggDdDDDDdDAAAAAAAABgBgBgBg',
        'ggggggggDDDDDDDDaaAAAaaaBBBBBBBB',
        'gGggGgggDDDDDDDDaaaaaaaaBgBgBgBg'
      ]
    },
    compass: {
      pal: { K:'#2b2436', A:'#b98a2e', T:'#2e6f6a', W:'#f6efdd' },
      rows: [
        '.......AA.......',
        '.......AA.......',
        '......AAAA......',
        '..T....AA....T..',
        '...T...AA...T...',
        '....T..AA..T....',
        '.TTTTTAKKATTTTT.',
        'AAAAAAAAKKAAAAAA',
        '.TTTTTAKKATTTTT.',
        '....T..AA..T....',
        '...T...AA...T...',
        '..T....AA....T..',
        '......AAAA......',
        '.......AA.......',
        '.......AA.......',
        '.......WW.......'
      ]
    }
  };
  ART.keeperFrames = ART.keeperLegs.map(function (legs) {
    return { pal: ART.keeperPal, rows: ART.keeperBody.concat(legs) };
  });

  function svgFromMap(art, title) {
    var h = art.rows.length, w = art.rows[0].length;
    var parts = ['<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + title + '" xmlns="http://www.w3.org/2000/svg">'];
    for (var y = 0; y < h; y++) {
      var row = art.rows[y];
      for (var x = 0; x < row.length; x++) {
        var c = art.pal[row[x]];
        if (c) parts.push('<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="' + c + '"/>');
      }
    }
    parts.push('</svg>');
    return parts.join('');
  }

  document.querySelectorAll('[data-art]').forEach(function (el) {
    var name = el.getAttribute('data-art');
    var title = el.getAttribute('data-art-title') || name;
    if (name === 'lighthouse') el.innerHTML = svgFromMap(ART.lighthouse, title);
    else if (name === 'tileset') el.innerHTML = svgFromMap(ART.tileset, title);
    else if (name === 'compass') el.innerHTML = svgFromMap(ART.compass, title);
    else if (name.indexOf('keeper') === 0) {
      var idx = parseInt(name.replace('keeper', ''), 10) - 1;
      el.innerHTML = svgFromMap(ART.keeperFrames[idx], title);
    }
  });

  /* The Lanternfall cover scene: flat bands + the lighthouse
     sprite itself, in situ — the same artwork data, placed. */
  var scene = document.getElementById('sceneArt');
  if (scene) {
    var P = [];
    var rect = function (x, y, w, h, fill, op) {
      P.push('<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '/>');
    };
    rect(0, 0, 48, 7, '#2f3a63');            // night sky
    rect(0, 7, 48, 5, '#46538a');            // low sky
    rect(0, 12, 48, 6, '#2e5a74');           // sea
    rect(0, 18, 48, 9, '#27506a');           // deep sea
    // moon (plus-disc)
    rect(7, 1, 1, 1, '#f4e7c8'); rect(6, 2, 3, 1, '#f4e7c8'); rect(7, 3, 1, 1, '#f4e7c8');
    // stars
    [[13,1],[21,0],[30,2],[43,1],[17,4],[38,0],[3,5],[26,5]].forEach(function (s) { rect(s[0], s[1], 1, 1, '#f6efdd'); });
    // beam from the lamp (lamp room sits at scene x 37-38, y 4-5)
    rect(17, 4, 21, 1, '#f7e3a1', 0.85); rect(12, 5, 26, 1, '#f7e3a1', 0.85); rect(17, 6, 21, 1, '#f7e3a1', 0.85);
    // boat, left
    rect(11, 17, 1, 4, '#232030');
    rect(12, 19, 1, 1, '#f6efdd'); rect(12, 20, 2, 1, '#f6efdd');
    rect(9, 21, 6, 1, '#232030'); rect(10, 22, 4, 1, '#232030');
    // rocks under the lighthouse
    rect(30, 20, 18, 2, '#232030'); rect(28, 22, 20, 2, '#232030'); rect(29, 24, 19, 3, '#1d1a29');
    rect(33, 21, 2, 1, '#57462f'); rect(42, 23, 3, 1, '#57462f'); rect(36, 25, 2, 1, '#57462f');
    // waves
    [[4,14],[18,15],[24,13],[7,19],[20,21],[13,24],[26,17],[2,16],[16,13],[22,25]].forEach(function (s) { rect(s[0], s[1], 2, 1, '#f6efdd', 0.8); });
    // the lighthouse sprite, placed at x=32, y=4
    var lh = ART.lighthouse;
    for (var yy = 0; yy < lh.rows.length; yy++) {
      var r2 = lh.rows[yy];
      for (var xx = 0; xx < r2.length; xx++) {
        var cc = lh.pal[r2[xx]];
        if (cc) rect(32 + xx, 4 + yy, 1, 1, cc);
      }
    }
    scene.innerHTML = '<svg viewBox="0 0 48 27" role="img" aria-label="Lanternfall cover scene: a lighthouse on rocks at night, beam lit, a small boat on the water — the practice\'s own pixel artwork" xmlns="http://www.w3.org/2000/svg">' + P.join('') + '</svg>';
  }

  /* ---------- pause-screen mobile panel ---------- */
  var btn = document.querySelector('.pause-btn');
  var panel = document.getElementById('pausePanel');
  var scrim = document.getElementById('scrim');
  if (btn && panel && scrim) {
    var closePanel = function () {
      panel.classList.remove('open');
      panel.setAttribute('aria-hidden', 'true');
      btn.setAttribute('aria-expanded', 'false');
      scrim.classList.remove('on');
      window.setTimeout(function () { scrim.hidden = true; }, reduced ? 0 : 240);
      btn.focus({ preventScroll: true });
    };
    btn.addEventListener('click', function () {
      var willOpen = !panel.classList.contains('open');
      if (willOpen) {
        scrim.hidden = false;
        panel.classList.add('open');
        panel.setAttribute('aria-hidden', 'false');
        btn.setAttribute('aria-expanded', 'true');
        requestAnimationFrame(function () {
          void scrim.offsetWidth;
          scrim.classList.add('on');
          var first = panel.querySelector('nav a');
          if (first) first.focus({ preventScroll: true });
        });
      } else {
        closePanel();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
    scrim.addEventListener('click', closePanel);
    panel.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) closePanel();
    });
  }

  /* ---------- reveal (opacity only, JS-gated) ---------- */
  var revs = document.querySelectorAll('.rev');
  if (revs.length && !reduced && 'IntersectionObserver' in window) {
    revs.forEach(function (el) { el.classList.add('rev-pre'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.remove('rev-pre'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  }

  /* ==========================================================
     THE PALETTE & FRAME TOOL
     Table P1 is printed on the page; the tool parses its rows
     (data-w / data-h / data-min), so tool and sheet cannot
     disagree. Bands are parsed from the printed band list
     (data-max hours) for the same reason.
     ========================================================== */
  var pTable = document.getElementById('palTable');
  if (pTable) {
    var sizes = Array.prototype.slice.call(pTable.querySelectorAll('tbody tr')).map(function (tr) {
      return {
        tr: tr,
        name: tr.getAttribute('data-name'),
        w: parseInt(tr.getAttribute('data-w'), 10),
        h: parseInt(tr.getAttribute('data-h'), 10),
        min: parseFloat(tr.getAttribute('data-min'))
      };
    });
    var bands = Array.prototype.slice.call(document.querySelectorAll('#bandList li')).map(function (li) {
      return { max: parseFloat(li.getAttribute('data-max')), name: li.getAttribute('data-band') };
    });
    var size = sizes[2]; // 32 x 32, the house standard
    var frames = 12;
    var workEl = document.getElementById('toolWork');
    var stampEl = document.getElementById('toolStamp');
    var vtextEl = document.getElementById('toolVerdictText');
    var frameVal = document.getElementById('frameVal');

    var renderTool = function () {
      sizes.forEach(function (s) { s.tr.classList.toggle('sel', s === size); });
      document.querySelectorAll('#sizeChips .chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c.getAttribute('data-size') === size.name ? 'true' : 'false');
      });
      frameVal.textContent = frames;
      document.getElementById('frameMinus').disabled = frames <= 1;
      document.getElementById('framePlus').disabled = frames >= 48;
      var perFrame = size.w * size.h;
      var totalPx = perFrame * frames;
      var totalMin = frames * size.min;
      var hours = totalMin / 60;
      var band = bands[bands.length - 1];
      for (var i = 0; i < bands.length; i++) { if (hours <= bands[i].max) { band = bands[i]; break; } }
      var lines = [];
      lines.push('Canvas        ' + size.w + ' × ' + size.h + '  =  ' + num(perFrame) + ' px per frame');
      lines.push('Frames        ' + frames);
      lines.push('Pixels drawn  ' + num(perFrame) + ' × ' + frames + '  =  ' + num(totalPx) + ' px');
      lines.push('Drawing time  ' + frames + ' frames × ' + size.min + ' min  =  ' + num(totalMin) + ' min  =  ' + (Math.round(hours * 10) / 10) + ' h');
      lines.push('Effort band   ' + band.name);
      workEl.textContent = lines.join('\n');
      stampEl.textContent = band.name;
      stampEl.className = 'stamp' + (band.max <= 3 ? '' : band.max <= 8 ? ' warn' : ' bad');
      vtextEl.textContent = size.name + ' at ' + frames + ' frames is ' + num(totalPx) + ' pixels of drawing — ' +
        (Math.round(hours * 10) / 10) + ' hours at the printed rate. ' +
        (band.max <= 3
          ? 'Small enough to start this week; the first frame still gets approved before the rest are drawn.'
          : band.max <= 8
            ? 'A full drawing day. Book it as one block — animation drawn in scraps loses its timing.'
            : 'This is a booking, not a favour: it goes in the diary ahead, with the palette locked before frame one.');
    };
    document.querySelectorAll('#sizeChips .chip').forEach(function (c) {
      c.addEventListener('click', function () {
        sizes.forEach(function (s) { if (s.name === c.getAttribute('data-size')) size = s; });
        renderTool();
      });
    });
    document.getElementById('frameMinus').addEventListener('click', function () { frames = Math.max(1, frames - 1); renderTool(); });
    document.getElementById('framePlus').addEventListener('click', function () { frames = Math.min(48, frames + 1); renderTool(); });
    renderTool();
  }

  /* ---------- the palette counter ----------
     Counts the distinct fills in the rendered lighthouse SVG
     and checks them against the printed house rule. */
  var counter = document.getElementById('palCount');
  if (counter) {
    var svg = document.querySelector('#spriteBox svg');
    var rule = document.getElementById('palRule');
    var limit = parseInt(rule.getAttribute('data-limit'), 10);
    var seen = {};
    svg.querySelectorAll('rect').forEach(function (r) { seen[r.getAttribute('fill')] = true; });
    var count = Object.keys(seen).length;
    document.getElementById('palCountNum').textContent = count;
    var ok = count <= limit;
    var cStamp = document.getElementById('palStamp');
    cStamp.textContent = ok ? 'Inside the rule' : 'Over the rule';
    cStamp.className = 'stamp' + (ok ? '' : ' bad');
    document.getElementById('palVerdict').textContent = ok
      ? 'The lighthouse from Lanternfall is drawn in ' + count + ' colours, counted from the artwork itself — ' + (limit - count) + ' under the house limit of ' + limit + '. The rule is not a slogan; it is measured, here, on the sprite.'
      : 'Counted at ' + count + ' colours — over the house limit of ' + limit + '. This sprite would go back for a palette pass before it shipped.';
  }

  /* ==========================================================
     THE COMMISSION ESTIMATOR
     Rates parsed from the printed Table F1 (data-key rows).
     ========================================================== */
  var feeTable = document.getElementById('feeTable');
  if (feeTable) {
    var rates = {};
    feeTable.querySelectorAll('tbody tr[data-key]').forEach(function (tr) {
      rates[tr.getAttribute('data-key')] = parseInt(tr.querySelector('.num').textContent.replace(/[^0-9]/g, ''), 10);
    });
    var scope = 'set';
    var counts = { frame: 0, char: 0, round: 0 };
    var limits = { frame: [0, 24], char: [0, 3], round: [0, 2] };
    var scopeNames = { set: 'Character sprite set — base', tileset: 'Tileset sheet — base', anim: 'Animation pass — base' };
    var lineNames = { frame: 'additional frames', char: 'additional characters', round: 'additional revision rounds' };
    var workEl2 = document.getElementById('estWork');
    var totalEl = document.getElementById('estTotal');

    var ids = { frame: ['xframeMinus', 'xframeVal', 'xframePlus'], char: ['charMinus', 'charVal', 'charPlus'], round: ['roundMinus', 'roundVal', 'roundPlus'] };
    var renderEst = function () {
      var lines = [], total = rates[scope];
      lines.push(scopeNames[scope] + '  ' + eur(rates[scope]));
      Object.keys(counts).forEach(function (k) {
        var c = counts[k];
        if (c > 0) { lines.push('+ ' + c + ' × ' + eur(rates[k]) + '  (' + lineNames[k] + ')  = ' + eur(c * rates[k])); total += c * rates[k]; }
        document.getElementById(ids[k][1]).textContent = c;
        document.getElementById(ids[k][0]).disabled = c <= limits[k][0];
        document.getElementById(ids[k][2]).disabled = c >= limits[k][1];
      });
      lines.push('----------------------------------------');
      lines.push('TOTAL  ' + eur(total));
      workEl2.textContent = lines.join('\n');
      totalEl.textContent = eur(total);
    };
    document.querySelectorAll('#scopeChips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#scopeChips .chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        scope = chip.getAttribute('data-scope');
        renderEst();
      });
    });
    Object.keys(counts).forEach(function (k) {
      document.getElementById(ids[k][0]).addEventListener('click', function () { counts[k] = Math.max(limits[k][0], counts[k] - 1); renderEst(); });
      document.getElementById(ids[k][2]).addEventListener('click', function () { counts[k] = Math.min(limits[k][1], counts[k] + 1); renderEst(); });
    });
    renderEst();
  }

  /* ==========================================================
     THE SOUND SKETCH — fenced exception, see the header note.
     A 7-note square-wave figure, played twice, ~4.6 s total,
     gain 0.10, self-stopping, with a stop control.
     ========================================================== */
  var sndBtn = document.getElementById('sndPlay');
  if (sndBtn) {
    var actx = null, playing = false, stopTimer = null, oscs = [];
    var sndState = document.getElementById('sndState');
    var NOTES = [659.25, 783.99, 880.00, 783.99, 659.25, 587.33, 659.25]; // E5 G5 A5 G5 E5 D5 E5
    var NOTE_LEN = 0.33;
    var stopSketch = function () {
      oscs.forEach(function (o) { try { o.stop(); } catch (e) {} });
      oscs = [];
      if (stopTimer) { clearTimeout(stopTimer); stopTimer = null; }
      playing = false;
      sndBtn.textContent = 'Play the sketch';
      sndState.textContent = 'Stopped.';
    };
    sndBtn.addEventListener('click', function () {
      if (playing) { stopSketch(); return; }
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) { sndState.textContent = 'This browser has no Web Audio — the sketch stays silent.'; return; }
      if (!actx) actx = new AC();
      if (actx.state === 'suspended') actx.resume();
      var gain = actx.createGain();
      gain.gain.setValueAtTime(0.10, actx.currentTime);
      gain.connect(actx.destination);
      var t0 = actx.currentTime + 0.05;
      for (var pass = 0; pass < 2; pass++) {
        NOTES.forEach(function (f, i) {
          var o = actx.createOscillator();
          o.type = 'square';
          o.frequency.setValueAtTime(f, t0);
          var start = t0 + (pass * NOTES.length + i) * NOTE_LEN;
          o.frequency.setValueAtTime(f, start);
          o.connect(gain);
          o.start(start);
          o.stop(start + NOTE_LEN * 0.92);
          oscs.push(o);
        });
      }
      playing = true;
      sndBtn.textContent = 'Stop the sketch';
      sndState.textContent = 'Playing — synthesised live, square wave, fixed low volume. It stops itself.';
      stopTimer = setTimeout(stopSketch, (NOTES.length * 2 * NOTE_LEN + 0.3) * 1000);
    });
  }

  /* ==========================================================
     THE ENQUIRY FORM — demonstration: validates, confirms
     in-page with a generated reference, transmits nothing.
     ========================================================== */
  var form = document.getElementById('enquiryForm');
  if (form) {
    var fields = {
      name: [document.getElementById('fName'), document.getElementById('eName')],
      email: [document.getElementById('fEmail'), document.getElementById('eEmail')],
      msg: [document.getElementById('fMsg'), document.getElementById('eMsg')]
    };
    var typeSel = document.getElementById('fType');
    var confirmBox = document.getElementById('confirmBox');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      Object.keys(fields).forEach(function (k) {
        var input = fields[k][0], err = fields[k][1];
        var bad = !input.value.trim();
        if (k === 'email' && !bad && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim())) bad = true;
        err.hidden = !bad;
        input.setAttribute('aria-invalid', bad ? 'true' : 'false');
        if (bad) ok = false;
      });
      if (!ok) {
        var firstBad = form.querySelector('[aria-invalid="true"]');
        if (firstBad) firstBad.focus();
        return;
      }
      var ref = 'VW-2026-' + Math.floor(1000 + Math.random() * 9000);
      document.getElementById('confirmRef').textContent = ref;
      document.getElementById('confirmText').textContent = 'Thank you, ' + fields.name[0].value.trim() +
        ' — your ' + typeSel.options[typeSel.selectedIndex].textContent.toLowerCase() +
        ' enquiry is logged under reference ' + ref + '. On the live site this is where the confirmation lands; nothing has been transmitted from this demonstration.';
      form.hidden = true;
      confirmBox.hidden = false;
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
    });
  }
})();

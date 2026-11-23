/* Nightlantern — the route lantern and booking form. Silent by design: no audio anywhere. */

(function () {
  'use strict';

  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      toggle.setAttribute('aria-expanded', nav.classList.toggle('is-open') ? 'true' : 'false');
    });
  }

  var STOPS = [
    {
      x: 110, y: 300,
      name: 'Shobhabazar Rajbari gate',
      dist: '0 m — meeting point',
      cls: 'guardian',
      tale: 'The gate is not the oldest thing on the street, but it is the most watched. Two sentinels are said to stand inside the arch after the household has gone to bed, and they do not like being counted. Walkers are asked to pass without stopping and to keep their voices below the level of the traffic.',
      sound: 'A gate bolt, drawn and re-drawn.',
      rule: 'Do not stop. Do not count the figures.',
      dread: 2, dreadLabel: 'uneasy'
    },
    {
      x: 205, y: 250,
      name: 'Kumortuli ghat',
      dist: '340 m · 6 min',
      cls: 'petni',
      tale: 'The potters bring unfinished idols down to the water here before every Durga Puja. A petni — the ghost of a woman who died unmarried — is said to stand on the fourth step and count them. If her count is wrong, one idol stays behind. The potters count twice, and they do not laugh about it.',
      sound: 'Wet clay set down on stone, then a count in a voice that is almost yours.',
      rule: 'Keep to the top step. Do not finish her count for her.',
      dread: 3, dreadLabel: 'watchful'
    },
    {
      x: 305, y: 285,
      name: 'The lane behind Marble Palace',
      dist: '260 m · 5 min',
      cls: 'nishi',
      tale: 'The narrowest part of the walk, and the one where people most often hear their own name. A nishi calls in the voice of someone you love — a mother, a friend, a person no longer living. It is not dangerous in itself. The danger is the turning around, and the second call that comes from further down the lane.',
      sound: 'Your name, once, at conversational volume, from behind you.',
      rule: 'Do not answer. Do not turn. Keep the lantern ahead of you.',
      dread: 4, dreadLabel: 'sharp'
    },
    {
      x: 395, y: 215,
      name: 'The printing press, Rabindra Sarani',
      dist: '410 m · 9 min',
      cls: 'brahmadaitya',
      tale: 'The press closed in 1998 and the compositors still argue about whether it did. A brahmadaitya — the ghost of a learned Brahmin — is the gentlest spirit on the route: it corrects proofs left on the desk overnight, in a hand nobody in the family recognises. The night watchman leaves one deliberate mistake so the correction has somewhere to go.',
      sound: 'A composing stick set down, then a page turned twice.',
      rule: 'No photographs through the window. It dislikes a flash.',
      dread: 1, dreadLabel: 'harmless'
    },
    {
      x: 485, y: 250,
      name: 'The zamindar house, Beadon Street',
      dist: '300 m · 6 min',
      cls: 'skondhokata',
      tale: 'A house with a courtyard, a broken fountain and a story about a headless figure that walks the upper verandah. The skondhokata is not a demon; it is a warning about a debt, and the family has been paying it in small ways for four generations — a lamp left burning, a plate set out on the anniversary.',
      sound: 'Bare feet on a wooden floor, one flight above the street.',
      rule: 'Stay in the lane. The gate is private and it is late.',
      dread: 3, dreadLabel: 'watchful'
    },
    {
      x: 600, y: 168,
      name: 'Nimtala ghat',
      dist: '490 m · 11 min',
      cls: 'ferryman',
      tale: 'The last stop and the quietest. The ghat has burned its dead for centuries, and the story here is not a monster but a man with a boat who will take you across for nothing, if you are not ready to be on this bank. The walk ends before the story does, by design, and the group walks back together.',
      sound: 'An oar held still in water. Not rowing. Waiting.',
      rule: 'Nobody walks home alone. That is the last rule and the first.',
      dread: 2, dreadLabel: 'quiet'
    }
  ];

  var tool = document.getElementById('routeTool');
  if (tool) {
    var glow = document.getElementById('lanternGlow');
    var pin = document.getElementById('lanternPin');
    var range = document.getElementById('lanternRange');
    var nodes = Array.prototype.slice.call(document.querySelectorAll('.map-stop'));
    var current = 0;

    var elNo = document.getElementById('stopNo');
    var elName = document.getElementById('stopName');
    var elDist = document.getElementById('stopDist');
    var elClass = document.getElementById('stopClass');
    var elTale = document.getElementById('stopTale');
    var elSound = document.getElementById('stopSound');
    var elRule = document.getElementById('stopRule');
    var elDread = document.getElementById('stopDread');
    var elDreadLabel = document.getElementById('stopDreadLabel');

    function dreadMarks(n) {
      var out = '';
      for (var i = 0; i < 5; i++) out += i < n ? '•' : '·';
      return out;
    }

    function setStop(i, focusNode) {
      current = Math.max(0, Math.min(STOPS.length - 1, i));
      var s = STOPS[current];
      glow.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ')');
      pin.setAttribute('transform', 'translate(' + s.x + ' ' + s.y + ')');
      nodes.forEach(function (n, k) {
        n.classList.toggle('is-on', k === current);
        n.setAttribute('aria-pressed', k === current ? 'true' : 'false');
      });
      if (range.value !== String(current)) range.value = String(current);
      elNo.textContent = '0' + (current + 1);
      elName.textContent = s.name;
      elDist.textContent = s.dist;
      elClass.textContent = s.cls;
      elTale.textContent = s.tale;
      elSound.textContent = s.sound;
      elRule.textContent = s.rule;
      elDread.textContent = dreadMarks(s.dread);
      elDreadLabel.textContent = s.dreadLabel;
      if (focusNode) focusNode.focus({ preventScroll: true });
    }

    nodes.forEach(function (n, k) {
      n.addEventListener('click', function () { setStop(k); });
      n.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setStop(k, n); }
      });
    });
    range.addEventListener('input', function () { setStop(parseInt(this.value, 10)); });
    document.getElementById('prevStop').addEventListener('click', function () { setStop(current - 1); });
    document.getElementById('nextStop').addEventListener('click', function () {
      setStop(current === STOPS.length - 1 ? 0 : current + 1);
    });
    setStop(0);
  }

  /* ---------- booking form ---------- */
  var form = document.getElementById('bookForm');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var ok = true;
      form.querySelectorAll('[data-required]').forEach(function (input) {
        var wrap = input.closest('.field');
        var v = (input.value || '').trim();
        var bad = !v;
        if (!bad && input.type === 'email') bad = !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
        if (!bad && input.type === 'number') bad = Number(v) < 1 || Number(v) > 12;
        wrap.classList.toggle('bad', bad);
        if (bad) ok = false;
      });
      var okBox = document.getElementById('okBox');
      var badSum = document.getElementById('badSum');
      if (okBox) okBox.classList.toggle('show', ok);
      if (badSum) badSum.classList.toggle('show', !ok);
      if (ok && okBox) { okBox.scrollIntoView({ block: 'center', behavior: 'smooth' }); form.reset(); }
    });
    form.querySelectorAll('input, select, textarea').forEach(function (el) {
      el.addEventListener('input', function () {
        var w = el.closest('.field');
        if (w) w.classList.remove('bad');
      });
    });
  }
})();

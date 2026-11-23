/* Alef Brush — the letter studio, navigation and commission form. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- head nav ---------- */
  var head = document.querySelector('.head');
  var menu = document.querySelector('.menu');
  if (head && menu) {
    menu.addEventListener('click', function () {
      var open = head.classList.toggle('open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    head.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        head.classList.remove('open');
        menu.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- commission form ---------- */
  var cf = document.getElementById('commission-form');
  if (cf) {
    cf.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = [
        ['name', 'name', function (v) { return v.trim().length >= 2; }, 'A name to write on the envelope, please.'],
        ['email', 'email', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, 'That email looks incomplete.'],
        ['piece', 'piece', function (v) { return !!v; }, 'Choose the kind of commission, even approximately.'],
        ['text', 'text', function (v) { return v.trim().length >= 6; }, 'The words matter more than the design — even a rough line helps.']
      ];
      ['name', 'email', 'piece', 'text', 'agree'].forEach(function (id) {
        var el = document.getElementById('err-' + id);
        if (el) el.textContent = '';
      });
      var firstBad = null;
      fields.forEach(function (row) {
        var input = document.getElementById(row[1]);
        if (!input) return;
        if (!row[2](input.value)) {
          var err = document.getElementById('err-' + row[0]);
          if (err) err.textContent = row[3];
          if (!firstBad) firstBad = input;
        }
      });
      var agree = document.getElementById('agree');
      if (agree && !agree.checked) {
        var ae = document.getElementById('err-agree');
        if (ae) ae.textContent = 'Please confirm the timing — it is the one thing I cannot shorten.';
        firstBad = firstBad || agree;
      }
      var status = document.getElementById('form-status');
      if (firstBad) {
        status.className = 'form-status bad';
        status.textContent = 'A few fields still need you.';
        firstBad.focus();
        return;
      }
      var name = document.getElementById('name').value.trim().split(' ')[0];
      status.className = 'form-status ok';
      status.textContent = 'Thank you, ' + name + '. This is a portfolio preview, so the note has not been sent — write to tamar@alefbrush.co.il and I will reply with a quotation and a paper sample list within three working days.';
      cf.querySelector('button[type="submit"]').textContent = 'Note prepared';
    });
  }

  /* ---------- letter studio ---------- */
  var LETTERS = [
    { c: 'א', n: 'Alef', v: 1, tagin: false, sofit: null, note: 'Silent. Two arms and a diagonal — the first letter, and the only one that makes no sound.' },
    { c: 'ב', n: 'Bet', v: 2, tagin: false, sofit: null, note: 'A house with its door open to the left. The Torah begins with it: bereshit, in the beginning.' },
    { c: 'ג', n: 'Gimel', v: 3, tagin: true, sofit: null, note: 'A camel’s neck, and one of the crowned letters. The sages saw a wealthy man running after a poor one — g’milut hasadim, acts of kindness.' },
    { c: 'ד', n: 'Dalet', v: 4, tagin: false, sofit: null, note: 'A door, and never closed on the poor man standing in it. Four, for the four directions.' },
    { c: 'ה', n: 'He', v: 5, tagin: false, sofit: null, note: 'Breath. The letter that lets a word out, with a small window cut in its left side.' },
    { c: 'ו', n: 'Vav', v: 6, tagin: false, sofit: null, note: 'A hook. It joins one word to the next — the reason the Torah’s “and” is a letter and not a comma.' },
    { c: 'ז', n: 'Zayin', v: 7, tagin: true, sofit: null, note: 'A sword, and one of the seven crowned letters. Seven, for the days of the week.' },
    { c: 'ח', n: 'Het', v: 8, tagin: false, sofit: null, note: 'A fence. With yod it makes chai, life — which is why a gift is given in multiples of eighteen.' },
    { c: 'ט', n: 'Tet', v: 9, tagin: true, sofit: null, note: 'A coiled snake, crowned. Nine, the first letter of tov — good.' },
    { c: 'י', n: 'Yod', v: 10, tagin: false, sofit: null, note: 'The smallest letter, a point of ink, and the seed of every other. It hangs above the line.' },
    { c: 'כ', n: 'Kaf', v: 20, tagin: false, sofit: 'ך', note: 'A palm curved to hold. At the end of a word it becomes the final kaf, which reaches below the line.' },
    { c: 'ל', n: 'Lamed', v: 30, tagin: false, sofit: null, note: 'The tallest letter, the only one that rises above the roof. The sages read it as a heart learning — lamed, lev.' },
    { c: 'מ', n: 'Mem', v: 40, tagin: false, sofit: 'ם', note: 'Water: open in the middle of a word, closed at the end. Forty, for the days on Sinai.' },
    { c: 'נ', n: 'Nun', v: 50, tagin: false, sofit: 'ן', note: 'A fish. The final nun stretches all the way down, the longest descender in the alphabet.' },
    { c: 'ס', n: 'Samekh', v: 60, tagin: false, sofit: null, note: 'A closed circle — support, the letter that holds. The only letter with no opening in it at all.' },
    { c: 'ע', n: 'Ayin', v: 70, tagin: true, sofit: null, note: 'An eye, crowned. Seventy, for the seventy faces the tradition gives the Torah.' },
    { c: 'פ', n: 'Pe', v: 80, tagin: false, sofit: 'ף', note: 'A mouth with a tooth inside it. The final pe folds its tongue in.' },
    { c: 'צ', n: 'Tsadi', v: 90, tagin: true, sofit: 'ץ', note: 'A righteous person bent under the weight, crowned. The final tsadi straightens and drops.' },
    { c: 'ק', n: 'Qof', v: 100, tagin: false, sofit: null, note: 'The eye of a needle, or the back of a head. It begins kedushah, holiness.' },
    { c: 'ר', n: 'Resh', v: 200, tagin: false, sofit: null, note: 'A head, bowed. Two hundred, and the first letter of rosh — head, or beginning.' },
    { c: 'ש', n: 'Shin', v: 300, tagin: true, sofit: null, note: 'Three flames and three crowns. The letter on the mezuzah case, and the one that begins shalom.' },
    { c: 'ת', n: 'Tav', v: 400, tagin: false, sofit: null, note: 'A seal. The last letter, and the mark of truth at the end of a document.' }
  ];

  var grid = document.getElementById('alefbet');
  if (!grid) return;

  var glyph = document.getElementById('glyph');
  var revealRect = document.getElementById('reveal-rect');
  var taginG = document.getElementById('tagin-g');
  var guidesG = document.getElementById('guides-g');
  var guidesToggle = document.getElementById('guides');
  var taginToggle = document.getElementById('tagin');
  var sofitToggle = document.getElementById('sofit');
  var prName = document.getElementById('pr-name');
  var prHeb = document.getElementById('pr-heb');
  var prVal = document.getElementById('pr-value');
  var prTag = document.getElementById('pr-tag');
  var prNote = document.getElementById('pr-note');
  var replay = document.getElementById('replay');

  var current = LETTERS[0];
  var inkColor = '#191512';
  var anim = null;

  grid.innerHTML = LETTERS.map(function (l, i) {
    return '<button type="button" data-i="' + i + '" aria-pressed="' + (i === 0 ? 'true' : 'false') + '" aria-label="' + l.n + '">' + l.c + '</button>';
  }).join('');

  function setInk() {
    var chosen = document.querySelector('input[name="ink"]:checked');
    inkColor = chosen && chosen.value === 'lapis' ? '#2b4270' : chosen && chosen.value === 'gold' ? '#a3843f' : '#191512';
    glyph.setAttribute('fill', inkColor);
    taginG.setAttribute('stroke', inkColor);
  }

  function renderTarget() {
    var showSofit = sofitToggle.checked && current.sofit;
    var ch = showSofit ? current.sofit : current.c;
    glyph.textContent = ch;
    prName.textContent = current.n;
    prHeb.textContent = ch;
    var SOFIT_VAL = { 'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900 };
    prVal.textContent = String(showSofit ? SOFIT_VAL[current.sofit] : current.v);
    prNote.textContent = current.note + (showSofit ? ' This is the final form, used only at the end of a word.' : '');
    var tagBits = [];
    if (current.n === 'Alef') tagBits.push('first letter');
    if (current.sofit) tagBits.push('has a final form');
    if (current.tagin) tagBits.push('crowned');
    if (!tagBits.length) tagBits.push('no final form');
    prTag.textContent = tagBits.join(' · ');

    taginG.setAttribute('opacity', taginToggle.checked && current.tagin ? '1' : '0');
    taginG.setAttribute('transform', 'translate(0,64)');

    var sofitLabel = sofitToggle.parentNode;
    var canSofit = !!current.sofit;
    sofitToggle.disabled = !canSofit;
    sofitLabel.classList.toggle('is-off', !canSofit);
    if (!canSofit) sofitToggle.checked = false;

    var tagLabel = taginToggle.parentNode;
    taginToggle.disabled = !current.tagin;
    tagLabel.classList.toggle('is-off', !current.tagin);
    if (!current.tagin) taginToggle.checked = false;
  }

  function ink(replay) {
    if (anim) cancelAnimationFrame(anim);
    setInk();
    var total = 312;
    if (reduced) {
      revealRect.setAttribute('x', '24');
      revealRect.setAttribute('width', String(total));
      return;
    }
    var start = null;
    var dur = replay ? 1500 : 1150;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var w = total * eased;
      revealRect.setAttribute('x', String(336 - w));
      revealRect.setAttribute('width', String(w));
      if (t < 1) {
        anim = requestAnimationFrame(step);
      } else {
        revealRect.setAttribute('x', '24');
        revealRect.setAttribute('width', String(total));
        anim = null;
      }
    }
    revealRect.setAttribute('x', '336');
    revealRect.setAttribute('width', '0');
    anim = requestAnimationFrame(step);
  }

  grid.addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-i]');
    if (!btn) return;
    current = LETTERS[parseInt(btn.dataset.i, 10)];
    grid.querySelectorAll('button').forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
    btn.setAttribute('aria-pressed', 'true');
    renderTarget();
    ink(false);
  });

  document.querySelectorAll('input[name="ink"]').forEach(function (r) {
    r.addEventListener('change', function () { setInk(); ink(false); });
  });
  if (guidesToggle) {
    guidesToggle.addEventListener('change', function () {
      guidesG.style.display = guidesToggle.checked ? '' : 'none';
    });
  }
  if (taginToggle) {
    taginToggle.addEventListener('change', function () {
      taginG.setAttribute('opacity', taginToggle.checked && current.tagin ? '1' : '0');
    });
  }
  if (sofitToggle) {
    sofitToggle.addEventListener('change', function () {
      renderTarget();
      ink(true);
    });
  }
  if (replay) {
    replay.addEventListener('click', function () {
      renderTarget();
      ink(true);
    });
  }

  renderTarget();
  ink(false);
})();

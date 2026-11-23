/* Rekha Palm — the palm atlas.
   Five rekhas, two hands, and the honest limits of each line. No libraries,
   no canvas, no audio: the drawing is the interface. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        burger.focus();
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealables = document.querySelectorAll('.record, .how__steps li, .refuse blockquote, .study');
  if ('IntersectionObserver' in window) {
    Array.prototype.forEach.call(revealables, function (el) { el.classList.add('rise'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.04 });
    Array.prototype.forEach.call(revealables, function (el) { io.observe(el); });
  }

  /* ---------- readings filter ---------- */
  var chips = document.querySelectorAll('.filters .chip');
  if (chips.length) {
    var items = document.querySelectorAll('.readings [data-type]');
    Array.prototype.forEach.call(chips, function (chip) {
      chip.addEventListener('click', function () {
        var want = chip.getAttribute('data-filter');
        Array.prototype.forEach.call(chips, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        Array.prototype.forEach.call(items, function (it) {
          it.hidden = want !== 'all' && it.getAttribute('data-type') !== want;
        });
      });
    });
  }

  /* ---------- sitting form ---------- */
  var form = document.getElementById('sitting-form');
  if (form) {
    var sent = document.getElementById('sent');
    var sentList = document.getElementById('sent-list');
    function val(id) { var f = document.getElementById(id); return f ? f.value.trim() : ''; }
    function err(k, m, f) {
      var e = document.getElementById('e-' + k);
      if (e) e.textContent = m || '';
      if (f) f.setAttribute('aria-invalid', m ? 'true' : 'false');
    }
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var n = 0;
      var name = val('s-name'), email = val('s-email'), date = val('s-date');
      var mode = val('s-mode'), kind = val('s-kind'), msg = val('s-message');
      var agree = document.getElementById('s-agree').checked;

      if (name.length < 2) { err('name', 'A name to write in the notebook.', document.getElementById('s-name')); n++; } else err('name', '', document.getElementById('s-name'));
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err('email', 'This address looks incomplete.', document.getElementById('s-email')); n++; } else err('email', '', document.getElementById('s-email'));
      if (!date) { err('date', 'The day you are in Fort Kochi, even approximate.', document.getElementById('s-date')); n++; } else err('date', '', document.getElementById('s-date'));
      if (!mode) { err('mode', 'In the room, or by video?', document.getElementById('s-mode')); n++; } else err('mode', '', document.getElementById('s-mode'));
      if (!kind) { err('kind', 'Choose the closest kind of sitting.', document.getElementById('s-kind')); n++; } else err('kind', '', document.getElementById('s-kind'));
      if (msg.length < 20) { err('message', 'A line about what brings you — it helps me keep the hour useful.', document.getElementById('s-message')); n++; } else err('message', '', document.getElementById('s-message'));
      if (!agree) { err('agree', 'Please confirm the limits of a reading before you send.', null); n++; } else err('agree', '');

      if (n > 0) { var f = form.querySelector('[aria-invalid="true"]'); if (f) f.focus(); return; }

      var msel = document.getElementById('s-mode');
      var ksel = document.getElementById('s-kind');
      sentList.innerHTML = '<dt>Name</dt><dd>' + name.replace(/[<>]/g, '') + '</dd>' +
        '<dt>Date</dt><dd>' + date + '</dd>' +
        '<dt>How</dt><dd>' + msel.options[msel.selectedIndex].text + '</dd>' +
        '<dt>Sitting</dt><dd>' + ksel.options[ksel.selectedIndex].text + '</dd>';
      form.hidden = true;
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }

  /* ---------- the palm atlas ---------- */
  var handSvg = document.getElementById('atlas-hand');
  if (!handSvg) return;

  var LINES = {
    jeevan: {
      no: 'Line A', name: 'Jeevan rekha', en: 'the life line',
      runs: 'from between the thumb and the index finger, round the base of the thumb, towards the wrist',
      classical: 'The old texts read it as the line of vitality and the body\u2019s reserves — not the length of a life. A long, unbroken curve is read as a steady constitution; a broken or chained one as interruptions in energy: an illness, a move, a change of work. A line that doubles back is read as a life lived in two places.',
      active: 'In the working hand it is read as what you have done with the vitality you were given — the years that took something out of you, and the years that put it back.',
      passive: 'In the receiving hand it is read as the reserve you came in with, which is the part nobody chooses and the part a reading should treat most gently.',
      caution: 'It does not tell you how long you will live. Nothing on the hand does, and any reader who says otherwise is selling certainty.',
      ask: 'Which year took the most out of you, and what did you do to get it back?'
    },
    mastishk: {
      no: 'Line B', name: 'Mastishk rekha', en: 'the head line',
      runs: 'from between the index and middle fingers, across the palm, sometimes sloping towards the mount of the moon',
      classical: 'The line of the mind: how a person thinks, not what they think. A straight line is read as practical reasoning, a slope towards the moon as imagination, and a line that forks at the end as a mind that can hold two ideas at once. Breaks are read as changes of mind, which are ordinary.',
      active: 'In the working hand it is read as the habits of thought you have built: what you do when a problem will not move.',
      passive: 'In the receiving hand it is read as the mind you were born with, which is often more curious and less disciplined than the working hand suggests.',
      caution: 'It is not a measure of intelligence, and it says nothing about memory, illness or the brain. A hand is not a scan.',
      ask: 'When you are stuck, do you think harder, or do you stop and walk?'
    },
    hriday: {
      no: 'Line C', name: 'Hriday rekha', en: 'the heart line',
      runs: 'from the edge of the palm below the little finger, across the upper palm, towards the index and middle fingers',
      classical: 'The old texts read this as the line of feeling and the heart\u2019s weather: how a person gives affection, how they take it, and whether the two are the same. A curve that ends high, between the index and middle fingers, is read as a person who loves with judgement; one that ends low, near the middle finger alone, as one who loves with appetite.',
      active: 'In the working hand it is read as the shape feeling has taken in your life: what you have learned to do with it, and what you have decided not to say.',
      passive: 'In the receiving hand it is read as the first shape of it — the household you learned affection in, before you had words for what was missing.',
      caution: 'It does not tell you whether a marriage will last, and I will not pretend it does. It describes a manner of loving, not an outcome.',
      ask: 'When did you last say the thing you actually felt, rather than the version of it that would be easier to hear?'
    },
    bhagya: {
      no: 'Line D', name: 'Bhagya rekha', en: 'the fate line',
      runs: 'from the base of the palm below the middle finger, up towards the centre of the hand, sometimes as far as the heart line',
      classical: 'The fate line is the most over-read line in the palm and the least reliable. Classically it is read as the line of work and structure — not destiny. Where it begins low and runs clear, the texts read a life that finds its shape early; where it begins late, a life that takes its shape after thirty. A line that stops is read as a change of direction, not an ending.',
      active: 'In the working hand it is read as the structure you have given your days: the work you chose, the work you stayed in, and the work you left.',
      passive: 'In the receiving hand it is read as the expectation your family placed on you before you had a say in it. Every reader I respect treats this hand with care.',
      caution: 'It does not name a career, a salary or a date. Anyone who tells you the year your luck changes is reading your face, not your hand.',
      ask: 'Whose idea was the work you do, and when did it become yours?'
    },
    surya: {
      no: 'Line E', name: 'Surya rekha', en: 'the sun line',
      runs: 'from the base of the palm towards the mount below the ring finger, sometimes joining the fate line',
      classical: 'The sun line is the line of recognition — what a person is seen for, not what they are worth. Clear and long, the texts read a public life; faint or absent, a private one. Absence is common and is not a deficiency: many of the most contented hands I have read have no sun line at all.',
      active: 'In the working hand it is read as what you have let other people see of your work, and what you have kept back.',
      passive: 'In the receiving hand it is read as an early ease with being looked at, which some people have and some people spend thirty years learning.',
      caution: 'It does not promise fame, money or a stage. Recognition in this practice means being seen by the people who matter to you, which is a smaller and more useful thing.',
      ask: 'Who do you want to be seen by, and would you recognise their approval if it arrived?'
    }
  };

  var state = { line: 'hriday', hand: 'active' };
  window.__atlas = state;

  var el = {
    no: document.getElementById('read-no'),
    name: document.getElementById('read-name'),
    en: document.getElementById('read-en'),
    runs: document.getElementById('read-runs'),
    classical: document.getElementById('read-classical'),
    hand: document.getElementById('read-hand'),
    caution: document.getElementById('read-caution'),
    ask: document.getElementById('read-ask'),
    cap: document.getElementById('hand-cap'),
    mark: document.getElementById('hand-mark')
  };

  function paint() {
    var L = LINES[state.line];
    el.no.textContent = L.no;
    el.name.childNodes[0].nodeValue = L.name;
    el.en.textContent = L.en;
    el.runs.textContent = L.runs;
    el.classical.textContent = L.classical;
    el.hand.textContent = state.hand === 'active' ? L.active : L.passive;
    el.caution.textContent = L.caution;
    el.ask.textContent = 'A question worth taking home: ' + L.ask;
    el.cap.textContent = state.hand === 'active' ? 'Reading the working hand (right).' : 'Reading the receiving hand (left).';
    el.mark.textContent = state.hand === 'active' ? 'R' : 'L';
    handSvg.setAttribute('aria-label', 'Palm plate showing the ' + L.name + ', ' + L.en + ', highlighted on the ' + (state.hand === 'active' ? 'right' : 'left') + ' hand.');

    Array.prototype.forEach.call(handSvg.querySelectorAll('.pline'), function (g) {
      var on = g.getAttribute('data-line') === state.line;
      g.classList.toggle('is-on', on);
      g.classList.toggle('is-dim', !on);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.line'), function (b) {
      var on = b.getAttribute('data-line') === state.line;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    Array.prototype.forEach.call(document.querySelectorAll('.hand'), function (b) {
      var on = b.getAttribute('data-hand') === state.hand;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function chooseLine(name) {
    if (!LINES[name]) return;
    state.line = name;
    paint();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.line'), function (b) {
    b.addEventListener('click', function () { chooseLine(b.getAttribute('data-line')); });
  });

  Array.prototype.forEach.call(handSvg.querySelectorAll('.pline'), function (g) {
    g.addEventListener('click', function () { chooseLine(g.getAttribute('data-line')); });
    g.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chooseLine(g.getAttribute('data-line')); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll('.hand'), function (b) {
    b.addEventListener('click', function () {
      state.hand = b.getAttribute('data-hand');
      paint();
    });
  });

  paint();
})();

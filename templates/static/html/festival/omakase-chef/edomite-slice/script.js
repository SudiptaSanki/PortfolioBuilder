/* Edomite Slice — Kenta Mizuno
   Silent: no audio, no libraries. */
(function () {
  'use strict';

  /* ---------- nav ---------- */
  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A' && window.innerWidth <= 760) {
        menu.setAttribute('aria-expanded', 'false');
        nav.classList.remove('is-open');
      }
    });
  }

  /* ---------- reveal ---------- */
  var revealEls = [].slice.call(document.querySelectorAll('.reveal'));
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        });
      }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { io.observe(el); });
    } else {
      revealEls.forEach(function (el) { el.classList.add('is-in'); });
    }
  }

  /* ---------- omakase builder ---------- */
  var list = document.getElementById('course-list');
  if (list) {
    var COURSES = {
      spring: [
        ['Sakizuke', '先付', 'Hotaru ika, sumiso', 1200],
        ['Otsukuri', 'お造り', 'Sayori, shiso, fresh wasabi', 2400],
        ['Nigiri', '握り', 'Katsuo, straw-smoked', 1400],
        ['Nigiri', '握り', 'Kasugo, kombu-cured', 1200],
        ['Nigiri', '握り', 'Akagai, two cuts', 1300],
        ['Tsumami', '摘み', 'Takenoko, kinome', 1600],
        ['Nigiri', '握り', 'Shima aji, aged two days', 1600],
        ['Nigiri', '握り', 'Kuruma ebi, served warm', 1800],
        ['Nigiri', '握り', 'Akami, seven days', 1800],
        ['Nigiri', '握り', 'Uni, Hokkaido', 2600],
        ['Kappa maki', '巻き', 'Cucumber, sesame', 900],
        ['Tome', '止め', 'Anago, tsume; miso soup', 2000]
      ],
      summer: [
        ['Sakizuke', '先付', 'Ayu, grilled, with ume', 1200],
        ['Otsukuri', 'お造り', 'Suzuki, shiso, wasabi', 2400],
        ['Nigiri', '握り', 'Shinko, two days vinegared', 1400],
        ['Nigiri', '握り', 'Aji, ginger, negi', 1200],
        ['Nigiri', '握り', 'Tako, soft-boiled', 1300],
        ['Tsumami', '摘み', 'Hamo, otoshi-bori', 2200],
        ['Nigiri', '握り', 'Kohada, four days', 1600],
        ['Nigiri', '握り', 'Akami, seven days', 1800],
        ['Nigiri', '握り', 'Uni, Hokkaido', 2600],
        ['Nigiri', '握り', 'Ikura, marinated', 1800],
        ['Kappa maki', '巻き', 'Cucumber, sesame', 900],
        ['Tome', '止め', 'Anago, tsume; miso soup', 2000]
      ],
      autumn: [
        ['Sakizuke', '先付', 'Sanma, grilled, with sudachi', 1200],
        ['Otsukuri', 'お造り', 'Kamasu, shiso', 2400],
        ['Nigiri', '握り', 'Ika, scored', 1200],
        ['Nigiri', '握り', 'Akami, seven days', 1800],
        ['Nigiri', '握り', 'Kohada, four days', 1600],
        ['Tsumami', '摘み', 'Matsutake, grilled', 2800],
        ['Nigiri', '握り', 'Kuruma ebi, warm', 1800],
        ['Nigiri', '握り', 'Otoro, ten days', 2800],
        ['Nigiri', '握り', 'Ikura, marinated', 1800],
        ['Nigiri', '握り', 'Uni, Hokkaido', 2600],
        ['Kanpyo maki', '巻き', 'Gourd, sesame', 900],
        ['Tome', '止め', 'Anago, tsume; miso soup', 2000]
      ],
      winter: [
        ['Sakizuke', '先付', 'Ankimo, ponzu, momiji', 1600],
        ['Otsukuri', 'お造り', 'Hirame, engawa', 2600],
        ['Nigiri', '握り', 'Buri, aged three days', 1600],
        ['Nigiri', '握り', 'Akagai, two cuts', 1300],
        ['Nigiri', '握り', 'Hotate, brushed with nikiri', 1400],
        ['Tsumami', '摘み', 'Shirako, ponzu', 2000],
        ['Nigiri', '握り', 'Toro, ten days', 2800],
        ['Nigiri', '握り', 'Kohada, four days', 1600],
        ['Nigiri', '握り', 'Uni, Hokkaido', 2600],
        ['Nigiri', '握り', 'Ikura, marinated', 1800],
        ['Kanpyo maki', '巻き', 'Gourd, sesame', 900],
        ['Tome', '止め', 'Anago, tsume; miso soup', 2000]
      ]
    };
    var PICKS = {
      light: [0, 1, 2, 4, 7, 11],
      standard: [0, 1, 2, 4, 6, 8, 9, 10, 11],
      full: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    };
    var NOTES = {
      light: 'Six courses, finished before the rice goes cold. The counter keeps the pace; you are out in about an hour and a quarter.',
      standard: 'The omakase as it is usually served: three tsumami, six nigiri, a maki and the anago. About two hours at the counter.',
      full: 'Everything that is ready tonight, including the pieces that only appear when the fish is good enough. Two and a half hours, and the last of the miso is at the end.'
    };
    var STATE = { season: 'summer', appetite: 'standard', sake: false };
    var seasonName = { spring: 'Spring · 春', summer: 'Summer · 夏', autumn: 'Autumn · 秋', winter: 'Winter · 冬' };
    var yen = new Intl.NumberFormat('en-US');

    function render() {
      var all = COURSES[STATE.season];
      var picks = PICKS[STATE.appetite];
      var rows = picks.map(function (i) { return all[i]; });
      list.innerHTML = '';
      rows.forEach(function (c, idx) {
        var li = document.createElement('li');
        var no = document.createElement('span');
        no.className = 'c-no';
        no.textContent = String(idx + 1).padStart(2, '0');
        var nm = document.createElement('span');
        nm.className = 'c-name';
        nm.innerHTML = c[0] + ' <em lang="ja">' + c[1] + '</em>';
        var desc = document.createElement('span');
        desc.className = 'c-desc';
        desc.textContent = c[2];
        nm.appendChild(desc);
        var pr = document.createElement('span');
        pr.className = 'c-price';
        pr.textContent = '¥ ' + yen.format(c[3]);
        li.appendChild(no); li.appendChild(nm); li.appendChild(pr);
        list.appendChild(li);
      });
      var sum = rows.reduce(function (s, c) { return s + c[3]; }, 0);
      var total = sum + (STATE.sake ? 7500 : 0);
      document.getElementById('out-total').textContent = '¥ ' + yen.format(total);
      document.getElementById('out-count').textContent = rows.length + ' courses' + (STATE.sake ? ' + pairing' : '');
      document.getElementById('out-season').textContent = seasonName[STATE.season];
      document.getElementById('out-note').textContent = NOTES[STATE.appetite] + (STATE.sake ? ' Three pours of sake are chosen the same morning, never printed in advance.' : '');
    }

    var seasonBtns = [].slice.call(document.querySelectorAll('.season'));
    seasonBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        seasonBtns.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
        STATE.season = btn.getAttribute('data-season');
        render();
      });
    });
    var appet = document.getElementById('b-appetite');
    var sake = document.getElementById('b-sake');
    if (appet) appet.addEventListener('change', function () { STATE.appetite = appet.value; render(); });
    if (sake) sake.addEventListener('change', function () { STATE.sake = sake.checked; render(); });
    render();
  }

  /* ---------- menu archive filter ---------- */
  var chips = [].slice.call(document.querySelectorAll('.chip[data-season]'));
  if (chips.length) {
    var items = [].slice.call(document.querySelectorAll('.arch-item'));
    var empty = document.querySelector('.arch-empty');
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        chips.forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        var f = chip.getAttribute('data-season');
        var shown = 0;
        items.forEach(function (it) {
          var match = f === 'all' || it.getAttribute('data-season') === f;
          it.hidden = !match;
          if (match) shown++;
        });
        if (empty) empty.hidden = shown !== 0;
      });
    });
  }

  /* ---------- reservation form ---------- */
  var form = document.getElementById('reserve-form');
  if (form) {
    var sent = document.getElementById('r-sent');
    var fields = {
      name: { el: document.getElementById('r-name'), msg: 'Please give the name for the reservation.' },
      email: { el: document.getElementById('r-email'), msg: 'An email that reaches you.' },
      date: { el: document.getElementById('r-date'), msg: 'Choose the date you want.' },
      seats: { el: document.getElementById('r-seats'), msg: 'How many seats, between one and four.' },
      seating: { el: document.getElementById('r-seating'), msg: 'Choose a seating.' }
    };
    function err(k, m) {
      var e = document.getElementById('err-r-' + k);
      if (e) e.textContent = m || '';
      if (fields[k].el) fields[k].el.setAttribute('aria-invalid', m ? 'true' : 'false');
    }
    function check() {
      var ok = true;
      if (!fields.name.el.value.trim()) { err('name', fields.name.msg); ok = false; } else err('name');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(fields.email.el.value.trim())) { err('email', fields.email.msg); ok = false; } else err('email');
      if (!fields.date.el.value) { err('date', fields.date.msg); ok = false; } else err('date');
      var n = parseInt(fields.seats.el.value, 10);
      if (!(n >= 1 && n <= 4)) { err('seats', fields.seats.msg); ok = false; } else err('seats');
      if (!fields.seating.el.value) { err('seating', fields.seating.msg); ok = false; } else err('seating');
      return ok;
    }
    Object.keys(fields).forEach(function (k) {
      if (!fields[k].el) return;
      var h = function () { if (fields[k].el.getAttribute('aria-invalid') === 'true') check(); };
      fields[k].el.addEventListener('input', h);
      fields[k].el.addEventListener('change', h);
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!check()) {
        var bad = form.querySelector('[aria-invalid="true"]');
        if (bad) bad.focus();
        return;
      }
      var nm = fields.name.el.value.trim().split(' ')[0];
      var note = document.getElementById('r-sent-note');
      if (note) {
        note.textContent = 'Thank you, ' + nm + '. Your request is on the list for that date. I confirm reservations by telephone within two days, and nothing is held until it is confirmed.';
      }
      form.hidden = true;
      if (sent) { sent.hidden = false; sent.focus(); }
    });
  }
})();

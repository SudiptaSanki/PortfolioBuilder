/* Kanya Silk — page behaviour. Silent by design: no audio, no libraries. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- chrome ---------- */
  var drawer = document.getElementById('drawer');
  var menuBtn = document.querySelector('.menu-btn');
  if (drawer && menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = drawer.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        drawer.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- reveals ---------- */
  var rvs = Array.prototype.slice.call(document.querySelectorAll('.rv'));
  if (rvs.length) {
    if (reduceMotion) {
      rvs.forEach(function (el) { el.classList.add('in'); });
    } else {
      var ticking = false;
      var reveal = function () {
        ticking = false;
        var limit = window.innerHeight * 0.94;
        rvs = rvs.filter(function (el) {
          if (el.classList.contains('in')) return false;
          if (el.getBoundingClientRect().top < limit) { el.classList.add('in'); return false; }
          return true;
        });
      };
      window.addEventListener('scroll', function () {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(reveal);
      }, { passive: true });
      reveal();
    }
  }

  /* ---------- the board ---------- */
  var board = document.getElementById('b-price');
  if (board) {
    var TONE = {
      warm: { shift: [7, -2, -10], base: 'warm sand', blush: 'warm rose', lip: 'rosewood', eye: 'cocoa', light: 'champagne' },
      cool: { shift: [-6, 2, 12], base: 'cool porcelain', blush: 'cool rose', lip: 'berry', eye: 'taupe', light: 'pearl' },
      neutral: { shift: [0, 0, 0], base: 'neutral beige', blush: 'soft rose', lip: 'brick', eye: 'espresso', light: 'champagne' }
    };
    var OUTFIT = {
      red: { base: '#C98A72', blush: '#C96F63', lip: '#8E2F3A', eye: '#6B3A2E', light: '#E8C79E' },
      gold: { base: '#D2A177', blush: '#C98C6F', lip: '#A34E3F', eye: '#7A5230', light: '#F0D9A8' },
      pastel: { base: '#E0B49B', blush: '#E3AFA6', lip: '#B45F63', eye: '#8A6B70', light: '#F5E3CF' },
      ivory: { base: '#DCB69E', blush: '#D9A79A', lip: '#A85C55', eye: '#6E4B44', light: '#F7EBDD' }
    };
    var state = { tone: 'warm', outfit: 'red', when: 'muhurtham', finish: 'classic' };

    function hex2rgb(h) {
      return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
    }
    function rgb2hex(a) {
      return '#' + a.map(function (v) {
        var n = Math.max(0, Math.min(255, Math.round(v)));
        return (n < 16 ? '0' : '') + n.toString(16);
      }).join('');
    }
    function mix(hex, shift, factor) {
      var rgb = hex2rgb(hex);
      var f = factor === undefined ? 1 : factor;
      return rgb2hex([rgb[0] + shift[0] * f, rgb[1] + shift[1] * f, rgb[2] + shift[2] * f]);
    }

    function build() {
      var t = TONE[state.tone];
      var o = OUTFIT[state.outfit];
      var sw = {
        base: mix(o.base, t.shift, 1),
        blush: mix(o.blush, t.shift, 0.8),
        lip: mix(o.lip, t.shift, 0.6),
        eye: mix(o.eye, t.shift, 0.6),
        light: mix(o.light, t.shift, 0.5)
      };
      if (state.finish === 'bold') {
        sw.lip = mix(sw.lip, [-30, -34, -26], 1);
        sw.eye = mix(sw.eye, [-24, -26, -22], 1);
      } else if (state.finish === 'dewy') {
        sw.light = mix(sw.light, [8, 8, 8], 1);
        sw.base = mix(sw.base, [5, 5, 4], 1);
      }
      return sw;
    }

    function setSwatch(id, colour, name) {
      var el = document.getElementById(id);
      if (el) el.style.background = colour;
      var n = document.getElementById(id + '-name');
      if (n) n.textContent = name;
    }

    function timeline(when) {
      var rows;
      if (when === 'reception') {
        rows = [['3:00 pm', 'Call time', 'Skin prep begins'], ['3:45 pm', 'Base', 'Warm light check'], ['5:15 pm', 'Eyes and hair', 'Jasmine after the pins'], ['6:30 pm', 'Ready', 'Drape, jewellery, out']];
      } else if (when === 'both') {
        rows = [['4:00 am', 'Muhurtham call', 'Skin prep by lamplight'], ['6:45 am', 'Muhurtham ready', 'Drape and jewellery'], ['2:00 pm', 'Reset', 'Clean, hydrate, rebuild'], ['5:30 pm', 'Reception ready', 'Darker eye, deeper lip']];
      } else {
        rows = [['4:00 am', 'Call time', 'Skin prep begins'], ['4:45 am', 'Base', 'Daylight check at the door'], ['6:00 am', 'Hair and jasmine', 'Braid set, flowers last'], ['6:45 am', 'Ready', 'Drape, jewellery, out']];
      }
      var wrap = document.getElementById('b-timeline');
      if (!wrap) return;
      wrap.innerHTML = rows.map(function (r) {
        return '<div><time>' + r[0] + '</time><b>' + r[1] + '</b><small>' + r[2] + '</small></div>';
      }).join('');
    }

    function paint() {
      var t = TONE[state.tone];
      var sw = build();
      var bold = state.finish === 'bold';
      var dewy = state.finish === 'dewy';

      setSwatch('sw-base', sw.base, t.base);
      setSwatch('sw-blush', sw.blush, t.blush);
      setSwatch('sw-lip', sw.lip, bold ? 'deep ' + t.lip : t.lip);
      setSwatch('sw-eye', sw.eye, bold ? 'smoked ' + t.eye : t.eye);
      setSwatch('sw-light', sw.light, t.light);

      var baseNote = dewy ? 'Skin left dewy, powder only at the T-zone' : (bold ? 'Full coverage, set matte through the centre' : 'Matched at the jaw, checked at the door');
      set('r-base', baseNote);
      set('r-eye', bold ? 'Smoked lid, soft liner, lashes at the outer corner' : (dewy ? 'Washed brown, no liner on the lower line' : 'Soft brown smudge, no hard liner'));
      set('r-lip', bold ? 'Deep matte, lined and set through the centre' : (dewy ? 'Tinted balm, gloss at the centre only' : 'Satin, lined in the same family'));
      set('r-set', dewy ? 'Setting spray, no powder on the cheeks' : 'Powder only where the camera will shine');

      var outfitName = { red: 'Kanjeevaram red', gold: 'gold', pastel: 'pastel', ivory: 'ivory' }[state.outfit];
      var whenName = { muhurtham: 'muhurtham', reception: 'reception', both: 'both ceremonies' }[state.when];
      set('board-label', t.base.split(' ')[0].charAt(0).toUpperCase() + t.base.split(' ')[0].slice(1) + ' · ' + outfitName + ' · ' + state.finish + ' · ' + whenName);

      timeline(state.when);

      var price = 35000;
      if (state.when === 'both') price += 18000;
      if (state.finish === 'bold') price += 3000;
      if (state.outfit === 'ivory') price += 1500;
      set('b-price', '₹' + price.toLocaleString('en-IN'));

      var note;
      if (state.when === 'both') note = 'A double day is two faces and a reset in between. I block the whole day, and nothing else is booked.';
      else if (state.when === 'reception') note = 'Evening light is harder. More definition, less powder, and a lip that will not disappear in flash photography.';
      else note = 'A muhurtham look has to survive a hot room, a garland and a hundred photographs before lunch. That is the brief.';
      if (state.finish === 'bold') note += ' A bold finish is agreed at the trial, never on the morning.';
      set('b-note', note);
    }

    function set(id, text) {
      var el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    function bind(id, key) {
      var group = document.getElementById(id);
      if (!group) return;
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state[key] = chip.dataset[key];
        paint();
      });
    }

    bind('tone-chips', 'tone');
    bind('outfit-chips', 'outfit');
    bind('when-chips', 'when');
    bind('finish-chips', 'finish');

    paint();
  }

  /* ---------- looks filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var rows = Array.prototype.slice.call(document.querySelectorAll('.row-look'));
    var showing = document.getElementById('showing');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.fchip');
      if (!btn) return;
      var f = btn.dataset.filter;
      filters.querySelectorAll('.fchip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var n = 0;
      rows.forEach(function (r) {
        var show = f === 'all' || r.dataset.type === f;
        r.hidden = !show;
        if (show) n++;
      });
      if (showing) showing.textContent = n + ' looks';
    });
  }

  /* ---------- trial form ---------- */
  var form = document.getElementById('trial-form');
  if (form) {
    var sent = document.getElementById('sent');
    function field(id) { return document.getElementById(id); }
    function err(id, msg) {
      var e = document.getElementById(id + '-err');
      var input = field(id);
      if (e) e.textContent = msg;
      if (input) input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    }

    form.addEventListener('input', function (e) {
      if (e.target.id && document.getElementById(e.target.id + '-err')) err(e.target.id, '');
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = field('n-name');
      var mail = field('n-email');
      var date = field('n-date');
      var note = field('n-note');
      var agree = field('n-agree');
      var ok = true;

      if (!name || name.value.trim().length < 2) { err('n-name', 'A name for the reply.'); ok = false; } else err('n-name', '');
      if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { err('n-email', 'An address the reply can reach.'); ok = false; } else err('n-email', '');
      if (!date || !date.value) { err('n-date', 'Choose the wedding date, even if it may move.'); ok = false; }
      else {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var picked = new Date(date.value + 'T12:00:00');
        if (isNaN(picked.getTime())) { err('n-date', 'That date does not read.'); ok = false; }
        else if (picked < today) { err('n-date', 'That date has already passed.'); ok = false; }
        else err('n-date', '');
      }
      if (!note || note.value.trim().length < 10) { err('n-note', 'Tell me the sari and the venue.'); ok = false; } else err('n-note', '');
      if (!agree || !agree.checked) { err('n-agree', 'Please confirm the date is not held until I reply.'); ok = false; } else err('n-agree', '');

      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first && first.focus) first.focus();
        return;
      }

      var d = new Date(date.value + 'T12:00:00');
      set('sent-mail', mail.value.trim());
      set('sent-date', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      var type = field('n-type');
      set('sent-type', type ? type.value : 'Bridal');
      var venue = field('n-venue');
      set('sent-venue', venue && venue.value.trim() ? venue.value.trim() : 'To be confirmed');
      form.hidden = true;
      sent.hidden = false;
      sent.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function set(id, text) {
    var el = document.getElementById(id);
    if (el) el.textContent = text;
  }
})();

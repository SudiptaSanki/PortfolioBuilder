/* Kanchi Silk — page behaviour. Silent by design: no audio, no libraries. */
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

  /* ---------- the counter ---------- */
  var sari = document.getElementById('sari');
  if (sari) {
    var BODY = {
      maroon: { hex: '#6E1E2C', name: 'Maroon' },
      peacock: { hex: '#12585C', name: 'Peacock' },
      ivory: { hex: '#F0E4CB', name: 'Ivory' },
      black: { hex: '#1C1614', name: 'Black' },
      mustard: { hex: '#B8862A', name: 'Mustard' }
    };
    var BORDER = {
      korvai: { name: 'korvai', factor: 1, band: 28, triangles: false },
      temple: { name: 'temple', factor: 1.06, band: 28, triangles: true },
      plain: { name: 'plain zari', factor: 0.82, band: 11, triangles: false }
    };
    var PALLU = {
      plain: { name: 'plain pallu', factor: 0.86 },
      manga: { name: 'manga buta', factor: 1.0 },
      vanasingaram: { name: 'vanasingaram', factor: 1.22 }
    };

    var state = { body: 'maroon', border: 'korvai', pallu: 'manga', length: 6.3 };

    function el(id) { return document.getElementById(id); }
    function set(id, html) { var e = el(id); if (e) e.innerHTML = html; }

    function paint() {
      var b = BODY[state.body];
      var bd = BORDER[state.border];
      var pl = PALLU[state.pallu];

      var body = el('sari-body');
      if (body) body.setAttribute('fill', b.hex);
      var blouse = el('blouse-body');
      if (blouse) blouse.setAttribute('fill', b.hex);

      /* border bands */
      var top = el('border-top');
      var bottom = el('border-bottom');
      if (top) { top.setAttribute('height', bd.band); }
      if (bottom) { bottom.setAttribute('height', bd.band); bottom.setAttribute('y', String(396 - bd.band)); }

      var tris = el('border-triangles');
      if (tris) tris.setAttribute('display', bd.triangles ? 'inline' : 'none');

      /* pallu takes the zari ground; its motifs follow the body colour */
      var pallu = el('pallu');
      if (pallu) pallu.setAttribute('fill', state.body === 'ivory' ? '#8E6A24' : '#C9A24B');

      var groups = { plain: 'motif-plain', manga: 'motif-manga', vanasingaram: 'motif-vanasingaram' };
      Object.keys(groups).forEach(function (k) {
        var g = el(groups[k]);
        if (g) g.setAttribute('display', k === state.pallu ? 'inline' : 'none');
        /* motif ink readable on the gold pallu */
        if (g && g.getAttribute('display') === 'inline') {
          if (k !== 'plain') {
            g.setAttribute('stroke', state.body === 'black' ? '#2B0810' : '#4A1220');
            var fills = g.querySelectorAll('circle');
            fills.forEach(function (c) { c.setAttribute('fill', '#4A1220'); });
          }
        }
      });

      var folds = el('sari-folds');
      if (folds) folds.setAttribute('opacity', state.body === 'ivory' ? '.07' : '.14');

      /* numbers */
      var lengthFactor = state.length === 8 ? 1.27 : 1;
      var price = Math.round((34000 * bd.factor * pl.factor * lengthFactor) / 500) * 500;
      var weight = Math.round(480 * lengthFactor + 112 * bd.factor * pl.factor * lengthFactor);
      var zari = Math.round(108 * bd.factor * pl.factor * lengthFactor);
      var weeks = 3 + Math.round(price / 6500);

      set('s-weight', weight + ' g<small>with zari</small>');
      set('s-zari', zari + ' g<small>silver-gilt</small>');
      set('s-weeks', weeks + '<small>weeks</small>');
      set('s-price', '₹' + price.toLocaleString('en-IN') + '<small>with blouse piece</small>');

      var name = b.name + ' · ' + bd.name + ' · ' + pl.name + (state.length === 8 ? ' · 8 yards' : ' · 6.3 yards');
      var label = el('sari-name');
      if (label) label.textContent = name;

      var notes = [];
      if (state.border === 'korvai') notes.push('A korvai border is joined at the loom by interlocking the warp, so there is no seam — only a line you can feel with a finger.');
      else if (state.border === 'temple') notes.push('The temple border is a row of triangles cut by the shuttle; older weavers call it the gopuram border.');
      else notes.push('A plain zari edge is the least expensive border and the easiest to spoil: there is nowhere for a wandering weft to hide.');
      if (state.pallu === 'vanasingaram') notes.push('A vanasingaram pallu is a forest — vines, birds and animals across the full width. It adds weeks, not metres.');
      if (state.length === 8) notes.push('The eight-yard madisar is worn in the old drape: heavier, harder to pleat, and still what a grandmother asks for at a wedding.');
      var n = el('counter-note');
      if (n) n.textContent = notes.join(' ');
    }

    function bind(id, key, parse) {
      var group = el(id);
      if (!group) return;
      group.addEventListener('click', function (e) {
        var chip = e.target.closest('.chip');
        if (!chip) return;
        group.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
        chip.setAttribute('aria-pressed', 'true');
        state[key] = parse(chip);
        paint();
      });
    }

    bind('body-chips', 'body', function (c) { return c.dataset.body; });
    bind('border-chips', 'border', function (c) { return c.dataset.border; });
    bind('pallu-chips', 'pallu', function (c) { return c.dataset.pallu; });
    bind('length-chips', 'length', function (c) { return Number(c.dataset.length); });

    paint();
  }

  /* ---------- collection filter ---------- */
  var filters = document.querySelector('.filters');
  if (filters) {
    var pieces = Array.prototype.slice.call(document.querySelectorAll('.piece'));
    var showing = document.getElementById('showing');
    filters.addEventListener('click', function (e) {
      var btn = e.target.closest('.fchip');
      if (!btn) return;
      var f = btn.dataset.filter;
      filters.querySelectorAll('.fchip').forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      var n = 0;
      pieces.forEach(function (p) {
        var show = f === 'all' || p.dataset.type === f;
        p.hidden = !show;
        if (show) n++;
      });
      if (showing) showing.textContent = n + ' on the shelf';
    });
  }

  /* ---------- appointment form ---------- */
  var form = document.getElementById('visit-form');
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
      var name = field('a-name');
      var mail = field('a-email');
      var date = field('a-date');
      var note = field('a-note');
      var agree = field('a-agree');
      var ok = true;

      if (!name || name.value.trim().length < 2) { err('a-name', 'A name, so I know who to expect.'); ok = false; } else err('a-name', '');
      if (!mail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) { err('a-email', 'An address the reply can reach.'); ok = false; } else err('a-email', '');
      if (!date || !date.value) { err('a-date', 'Choose the day you would like to come.'); ok = false; }
      else {
        var today = new Date(); today.setHours(0, 0, 0, 0);
        var picked = new Date(date.value + 'T12:00:00');
        if (isNaN(picked.getTime())) { err('a-date', 'That date does not read.'); ok = false; }
        else if (picked < today) { err('a-date', 'A past date cannot be booked.'); ok = false; }
        else err('a-date', '');
      }
      if (!note || note.value.trim().length < 10) { err('a-note', 'Tell me the occasion and the colours you have in mind.'); ok = false; } else err('a-note', '');
      if (!agree || !agree.checked) { err('a-agree', 'Please confirm the appointment is not held until I reply.'); ok = false; } else err('a-agree', '');

      if (!ok) {
        var first = form.querySelector('[aria-invalid="true"]');
        if (first && first.focus) first.focus();
        return;
      }

      var d = new Date(date.value + 'T12:00:00');
      set('sent-mail', mail.value.trim());
      set('sent-date', d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
      var time = field('a-time');
      set('sent-time', time ? time.value : 'Morning');
      var visit = field('a-visit');
      set('sent-visit', visit ? visit.value : 'In the shop');
      form.hidden = true;
      sent.hidden = false;
      sent.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  function set(id, text) {
    var e = document.getElementById(id);
    if (e) e.textContent = text;
  }
})();

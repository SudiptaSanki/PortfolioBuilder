/* Sundaram Gurukkal — the day book, the menu and the office form. No audio. */

(function () {
  'use strict';

  var menu = document.querySelector('.menu');
  var nav = document.querySelector('.nav');
  if (menu && nav) {
    menu.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      menu.setAttribute('aria-expanded', open ? 'true' : 'false');
      menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a') && window.innerWidth <= 700) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        menu.setAttribute('aria-expanded', 'false');
        menu.focus();
      }
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  /* ------------------------------------------------------------ day book -- */
  var kolam = document.getElementById('kolam');
  if (kolam) {
    var NS = 'http://www.w3.org/2000/svg';
    var riteSel = document.getElementById('rite');
    var guestsIn = document.getElementById('guests');
    var guestsOut = document.getElementById('guests-out');
    var dirNote = document.getElementById('direction-note');
    var samagriList = document.getElementById('samagri');
    var f = {
      duration: document.getElementById('f-duration'),
      priests: document.getElementById('f-priests'),
      hands: document.getElementById('f-hands'),
      lamps: document.getElementById('f-lamps'),
      prep: document.getElementById('f-prep'),
      dakshina: document.getElementById('f-dakshina')
    };
    var capRite = document.getElementById('cap-rite');
    var capGuests = document.getElementById('cap-guests');

    var RITES = {
      vivaha: {
        name: 'Vivaha', duration: '3–4 hours', priests: 2, hands: 3, prep: '2 days',
        dak: [25000, 45000], lamps: 18,
        items: ['Rice', 'Ghee', 'Turmeric', 'Kumkum', 'Camphor', 'Sandal', 'Coconuts', 'Bananas', 'Flowers', 'Banana leaves', 'Milk', 'New cloth', 'Samith']
      },
      griha: {
        name: 'Griha pravesham', duration: '2–3 hours', priests: 1, hands: 1, prep: '1 day',
        dak: [8000, 15000], lamps: 9,
        items: ['Rice', 'Ghee', 'Turmeric', 'Kumkum', 'Camphor', 'Coconuts', 'Milk', 'Jaggery', 'Flowers', 'Sesame oil', 'Wicks', 'Kalasam']
      },
      upanayana: {
        name: 'Upanayanam', duration: '3 hours', priests: 2, hands: 2, prep: '2 days',
        dak: [12000, 22000], lamps: 12,
        items: ['Rice', 'Ghee', 'Turmeric', 'Kumkum', 'Camphor', 'Sandal', 'Coconuts', 'Bananas', 'Flowers', 'Samith', 'New cloth', 'Thread']
      },
      shraddha: {
        name: 'Shraddha', duration: '1.5 hours', priests: 1, hands: 1, prep: '1 day',
        dak: [3000, 6000], lamps: 5,
        items: ['Rice', 'Ghee', 'Turmeric', 'Kumkum', 'Camphor', 'Sesame oil', 'Wicks', 'Black gram', 'Bananas', 'Banana leaves', 'Jaggery']
      },
      satyanarayana: {
        name: 'Satyanarayana puja', duration: '2 hours', priests: 1, hands: 2, prep: '1 day',
        dak: [6000, 12000], lamps: 11,
        items: ['Rice', 'Ghee', 'Turmeric', 'Kumkum', 'Camphor', 'Sandal', 'Coconuts', 'Bananas', 'Flowers', 'Milk', 'Honey', 'Jaggery', 'Banana leaves']
      },
      navagraha: {
        name: 'Navagraha shanti homam', duration: '1.5 hours', priests: 2, hands: 1, prep: '1 day',
        dak: [9000, 16000], lamps: 9,
        items: ['Rice', 'Ghee', 'Turmeric', 'Kumkum', 'Camphor', 'Sandal', 'Coconuts', 'Bananas', 'Flowers', 'Samith', 'Sesame oil', 'Wicks']
      }
    };

    var state = { rite: 'vivaha', guests: 60, dir: 'East' };

    function el(tag, attrs) {
      var n = document.createElementNS(NS, tag);
      if (attrs) Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      return n;
    }

    function lampsFor() {
      return Math.max(5, Math.round(RITES[state.rite].lamps + state.guests / 22));
    }

    function quantity(item, g, lamps) {
      var round1 = function (v) { return (Math.round(v * 10) / 10).toString(); };
      switch (item) {
        case 'Rice': return round1(1.5 + g * 0.05) + ' kg';
        case 'Ghee': return round1(0.4 + g * 0.008) + ' kg';
        case 'Turmeric': return Math.round(80 + g * 1.2) + ' g';
        case 'Kumkum': return Math.round(80 + g * 0.7) + ' g';
        case 'Camphor': return Math.round(20 + g * 0.25) + ' g';
        case 'Sandal': return Math.round(30 + g * 0.3) + ' g';
        case 'Coconuts': return String(2 + Math.ceil(g / 25));
        case 'Bananas': return String(12 + Math.ceil(g * 1.2));
        case 'Flowers': return (2 + Math.ceil(g / 18)) + ' garlands';
        case 'Banana leaves': return Math.ceil(g / 4) + ' leaves';
        case 'Milk': return round1(1 + g * 0.02) + ' L';
        case 'Jaggery': return Math.round(200 + g * 2) + ' g';
        case 'Honey': return '100 g';
        case 'Sesame oil': return round1((250 + lamps * 15) / 1000) + ' L';
        case 'Wicks': return String(lamps * 2);
        case 'Kalasam': return '1 brass pot';
        case 'Samith': return round1(2 + g * 0.02) + ' kg';
        case 'New cloth': return '2 dhotis, 1 sari';
        case 'Thread': return '1 spool, 3 ply';
        case 'Black gram': return round1(0.2 + g * 0.003) + ' kg';
        default: return '—';
      }
    }

    function drawKolam() {
      var W = 560;
      var H = 400;
      var lamps = lampsFor();
      var n = state.guests < 40 ? 5 : state.guests < 160 ? 7 : 9;
      var cell = 220 / (n - 1);
      var ox = (W - 220) / 2;
      var oy = 58;

      while (kolam.firstChild) kolam.removeChild(kolam.firstChild);
      kolam.setAttribute('aria-label',
        'Kolam plan for ' + RITES[state.rite].name + ' with ' + lamps + ' lamps, mandap facing ' + state.dir + '.');

      kolam.appendChild(el('rect', { x: 0, y: 0, width: W, height: H, fill: '#fbf5e7' }));

      // a faint grid, as on graph paper
      var g = el('g', { stroke: '#e3d7bd', 'stroke-width': 0.7 });
      for (var gx = 20; gx < W; gx += 20) g.appendChild(el('line', { x1: gx, y1: 0, x2: gx, y2: H }));
      for (var gy = 20; gy < H; gy += 20) g.appendChild(el('line', { x1: 0, y1: gy, x2: W, y2: gy }));
      kolam.appendChild(g);

      // the pulli grid
      for (var i = 0; i < n; i++) {
        for (var j = 0; j < n; j++) {
          kolam.appendChild(el('circle', { cx: ox + i * cell, cy: oy + j * cell, r: 1.7, fill: '#b08a55' }));
        }
      }

      // kolam loops: diamonds through the outer ring and a four-petal centre
      var mid = ox + (n - 1) * cell / 2;
      var midY = oy + (n - 1) * cell / 2;
      var r = (n - 1) * cell / 2;
      var kolamLine = { fill: 'none', stroke: '#a9651c', 'stroke-width': 1.5, 'stroke-linecap': 'round' };
      kolam.appendChild(el('path', {
        d: 'M' + mid + ' ' + (midY - r) + ' L' + (mid + r) + ' ' + midY + ' L' + mid + ' ' + (midY + r) + ' L' + (mid - r) + ' ' + midY + ' Z',
        fill: 'none', stroke: '#a9651c', 'stroke-width': 1.8
      }));
      kolam.appendChild(el('path', {
        d: 'M' + mid + ' ' + (midY - r * 0.62) + ' L' + (mid + r * 0.62) + ' ' + midY + ' L' + mid + ' ' + (midY + r * 0.62) + ' L' + (mid - r * 0.62) + ' ' + midY + ' Z',
        fill: 'none', stroke: '#a9651c', 'stroke-width': 1.1, 'stroke-opacity': 0.7
      }));

      var petals = el('g', { fill: 'none', stroke: '#a9651c', 'stroke-width': 1.2, 'stroke-opacity': 0.8 });
      [0, 45, 90, 135, 180, 225, 270, 315].forEach(function (deg) {
        var rad = (deg * Math.PI) / 180;
        var px = mid + Math.cos(rad) * r * 0.34;
        var py = midY + Math.sin(rad) * r * 0.34;
        petals.appendChild(el('ellipse', {
          cx: px, cy: py, rx: r * 0.09, ry: r * 0.26,
          transform: 'rotate(' + (deg + 90) + ' ' + px + ' ' + py + ')'
        }));
      });
      kolam.appendChild(petals);

      // mandap in the centre
      var size = r * 0.62;
      kolam.appendChild(el('rect', {
        x: mid - size / 2, y: midY - size / 2, width: size, height: size,
        fill: '#f6ecd6', stroke: '#a9651c', 'stroke-width': 1.4
      }));
      kolam.appendChild(el('rect', {
        x: mid - size / 2 + 8, y: midY - size / 2 + 8, width: size - 16, height: size - 16,
        fill: 'none', stroke: '#c9a06a', 'stroke-width': 0.9, 'stroke-dasharray': '3 3'
      }));

      // the lamp at the centre
      kolam.appendChild(el('path', {
        d: 'M' + (mid - 12) + ' ' + (midY + 12) + ' q12 12 24 0 l-5 -10 h-14 Z',
        fill: '#d99b3c'
      }));
      kolam.appendChild(el('circle', { cx: mid, cy: midY - 2, r: 4.2, fill: '#d99b3c' }));
      kolam.appendChild(el('circle', { cx: mid, cy: midY - 2, r: 12, fill: '#d99b3c', 'fill-opacity': 0.12 }));

      // lamps along the front edge, in two rows of up to 12
      var perRow = Math.min(12, lamps);
      var rows = Math.ceil(lamps / perRow);
      var lampY = oy + (n - 1) * cell + 40;
      for (var l = 0; l < lamps; l++) {
        var row = Math.floor(l / perRow);
        var indexInRow = l % perRow;
        var count = row === rows - 1 ? lamps - row * perRow : perRow;
        var lx = 70 + ((W - 140) * (indexInRow + 0.5)) / count;
        var ly = lampY + row * 26;
        kolam.appendChild(el('path', { d: 'M' + (lx - 6) + ' ' + ly + ' q6 7 12 0 l-3 -6 h-6 Z', fill: '#d99b3c' }));
        kolam.appendChild(el('circle', { cx: lx, cy: ly - 7, r: 2.2, fill: '#e9b45f' }));
      }

      // compass and orientation arrow
      var cx = W - 58;
      var cy = 64;
      kolam.appendChild(el('circle', { cx: cx, cy: cy, r: 24, fill: 'none', stroke: '#c9a06a', 'stroke-width': 1 }));
      var dirAngle = { North: -90, East: 0, South: 90, West: 180 }[state.dir];
      var rad2 = (dirAngle * Math.PI) / 180;
      kolam.appendChild(el('line', {
        x1: cx, y1: cy, x2: cx + Math.cos(rad2) * 30, y2: cy + Math.sin(rad2) * 30,
        stroke: '#a9651c', 'stroke-width': 2
      }));
      kolam.appendChild(el('circle', { cx: cx + Math.cos(rad2) * 30, cy: cy + Math.sin(rad2) * 30, r: 3, fill: '#a9651c' }));
      [['N', 0, -34], ['E', 36, 0], ['S', 0, 38], ['W', -36, 0]].forEach(function (d) {
        var t = el('text', {
          x: cx + d[1], y: cy + d[2], 'text-anchor': 'middle',
          fill: d[0] === state.dir.charAt(0) ? '#a9651c' : '#8b8172',
          'font-size': 10, 'font-family': 'IBM Plex Mono, monospace'
        });
        t.textContent = d[0];
        kolam.appendChild(t);
      });

      var title = el('text', { x: 24, y: 26, fill: '#6b5c46', 'font-size': 10, 'font-family': 'IBM Plex Mono, monospace' });
      title.textContent = RITES[state.rite].name.toUpperCase() + ' · KOLAM PLAN';
      kolam.appendChild(title);
      var sub = el('text', { x: 24, y: 40, fill: '#8b8172', 'font-size': 9, 'font-family': 'IBM Plex Mono, monospace' });
      sub.textContent = lamps + ' lamps · ' + state.guests + ' guests · facing ' + state.dir;
      kolam.appendChild(sub);
    }

    function render() {
      var rite = RITES[state.rite];
      var lamps = lampsFor();
      guestsOut.textContent = String(state.guests);
      capRite.textContent = rite.name;
      capGuests.textContent = state.guests + ' guests';

      samagriList.textContent = '';
      rite.items.forEach(function (item) {
        var li = document.createElement('li');
        var s = document.createElement('span');
        s.textContent = item;
        var b = document.createElement('b');
        b.textContent = quantity(item, state.guests, lamps);
        li.appendChild(s); li.appendChild(b);
        samagriList.appendChild(li);
      });

      f.duration.textContent = rite.duration;
      f.priests.textContent = String(rite.priests);
      f.hands.textContent = String(rite.hands);
      f.lamps.textContent = String(lamps);
      f.prep.textContent = rite.prep;
      f.dakshina.textContent = '₹' + rite.dak[0].toLocaleString('en-IN') + '–' + rite.dak[1].toLocaleString('en-IN');

      drawKolam();
    }

    riteSel.addEventListener('change', function () { state.rite = riteSel.value; render(); });
    guestsIn.addEventListener('input', function () { state.guests = parseInt(guestsIn.value, 10); render(); });

    var dirs = document.querySelectorAll('[data-dir]');
    var DIR_NOTES = {
      East: 'East is the usual choice. The family sits facing the lamp, the lamp faces the door.',
      North: 'North suits a site with the entrance on the south. Keep the cooking fire to the south-east.',
      West: 'West is chosen when the street is on the east. The lamp still faces the door, not the street.',
      South: 'South is rare and needs a reason. Tell the office at the first meeting, not on the day.'
    };
    Array.prototype.forEach.call(dirs, function (chip) {
      chip.addEventListener('click', function () {
        state.dir = chip.dataset.dir;
        Array.prototype.forEach.call(dirs, function (c) {
          var on = c === chip;
          c.classList.toggle('is-on', on);
          c.setAttribute('aria-checked', on ? 'true' : 'false');
        });
        dirNote.textContent = DIR_NOTES[state.dir];
        drawKolam();
      });
    });

    var dayForm = document.getElementById('daybook-form');
    if (dayForm) dayForm.addEventListener('submit', function (e) { e.preventDefault(); });

    render();
  }

  /* --------------------------------------------------------------- form -- */
  var enquiry = document.getElementById('booking-form');
  if (enquiry) {
    var status = document.getElementById('form-status');
    var fields = [
      { id: 'family', test: function (v) { return v.trim().length >= 2; }, msg: 'The family name, please.' },
      { id: 'name', test: function (v) { return v.trim().length >= 2; }, msg: 'Who should the office reply to?' },
      { id: 'email', test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'That email looks incomplete.' },
      { id: 'rite', test: function (v) { return v !== ''; }, msg: 'Choose the rite.' },
      { id: 'date', test: function (v) { return v !== ''; }, msg: 'A date, even approximate, helps.' },
      { id: 'message', test: function (v) { return v.trim().length >= 12; }, msg: 'A line about the family and the place is enough.' }
    ];

    function setErr(id, msg) {
      var e = document.getElementById('err-' + id);
      if (e) e.textContent = msg;
      var input = document.getElementById(id);
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    fields.forEach(function (fd) {
      var input = document.getElementById(fd.id);
      if (input) {
        input.addEventListener('input', function () { setErr(fd.id, ''); });
        input.addEventListener('change', function () { setErr(fd.id, ''); });
      }
    });

    enquiry.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      fields.forEach(function (fd) {
        var input = document.getElementById(fd.id);
        if (!input) return;
        var ok = fd.test(input.value);
        setErr(fd.id, ok ? '' : fd.msg);
        if (!ok && !bad) bad = input;
      });
      if (bad) {
        if (status) status.textContent = 'The office still needs: ' + fields.filter(function (fd) {
          var i = document.getElementById(fd.id);
          return i && !fd.test(i.value);
        }).map(function (fd) { return fd.id; }).join(', ') + '.';
        bad.focus();
        return;
      }
      var get = function (id) { var e2 = document.getElementById(id); return e2 ? e2.value : ''; };
      var subject = 'Rite enquiry — ' + get('rite') + ' — ' + get('family');
      var body = 'Family: ' + get('family') +
        '\nContact: ' + get('name') +
        '\nEmail: ' + get('email') +
        '\nRite: ' + get('rite') +
        '\nDate: ' + get('date') +
        '\nPlace: ' + get('place') +
        '\n\n' + get('message');
      var link = document.getElementById('mail-link');
      if (link) {
        link.href = 'mailto:office@sundaramgurukkal.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        link.hidden = false;
      }
      if (status) status.textContent = 'Checked. Open the message in your mail app to send it. The office replies on the same day it opens, usually before the evening puja.';
    });
  }
})();

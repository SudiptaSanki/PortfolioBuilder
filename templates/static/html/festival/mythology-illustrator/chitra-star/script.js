/* Chitra Star — studio site behaviour
   Nav, reveals, the panel composer (SVG miniature), plate filters, commission form. */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var toggle = document.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.querySelectorAll('.nav a').forEach(function (link) {
      link.addEventListener('click', function () {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var reveals = document.querySelectorAll('.reveal');
  if (!reduced && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('in'); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- panel composer ---------- */
  (function composer() {
    var svg = document.getElementById('panel-figure');
    if (!svg) return;
    var rasaSel = document.getElementById('rasa');
    var stageSel = document.getElementById('stage');
    var figureSel = document.getElementById('figure');
    var formatSel = document.getElementById('format');
    var caption = document.querySelector('[data-out="brief"]');

    var RASA = {
      shringara: { name: 'Shringara', dev: 'शृंगार', sense: 'love', dress: '#b8342a', accent: '#d9b36a', field: 'vermilion', palette: 'deep indigo field, vermilion cloth, gold line' },
      veera: { name: 'Veera', dev: 'वीर', sense: 'courage', dress: '#a24a1c', accent: '#e3b96f', field: 'ochre', palette: 'storm indigo field, burnt ochre cloth, brass line' },
      karuna: { name: 'Karuna', dev: 'करुणा', sense: 'compassion', dress: '#6d7f96', accent: '#cdd3d2', field: 'ash', palette: 'indigo field, ash-blue cloth, bone line' },
      adbhuta: { name: 'Adbhuta', dev: 'अद्भुत', sense: 'wonder', dress: '#c2701f', accent: '#f0d49a', field: 'saffron', palette: 'indigo field, saffron cloth, pale gold line' },
      shanta: { name: 'Shanta', dev: 'शांत', sense: 'peace', dress: '#dfd0ae', accent: '#8fa07a', field: 'pale', palette: 'indigo field, unbleached cloth, sage line' }
    };

    var STAGE = {
      monsoon: { label: 'monsoon courtyard', sky: ['#242c4a', '#3d3f5e'], rain: true, ground: '#2f4a44' },
      night: { label: 'night river', sky: ['#131730', '#262f4e'], rain: false, ground: '#1f2f45' },
      dawn: { label: 'dawn garden', sky: ['#e7c39b', '#c98f6e'], rain: false, ground: '#7d6247' },
      forest: { label: 'forest hermitage', sky: ['#2b4335', '#4a5a3b'], rain: false, ground: '#46543a' }
    };

    function rosette(x, y, s, color) {
      var petals = '';
      for (var i = 0; i < 8; i += 1) {
        var a = (Math.PI / 4) * i;
        var px = Math.cos(a) * 4.4 * s;
        var py = Math.sin(a) * 4.4 * s;
        petals += '<ellipse cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) + '" rx="' + (2.1 * s).toFixed(1) + '" ry="' + (1.1 * s).toFixed(1) + '" transform="rotate(' + (a * 180 / Math.PI).toFixed(0) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')" fill="' + color + '"/>';
      }
      return '<g transform="translate(' + x + ' ' + y + ')">' + petals + '<circle r="' + (1.5 * s).toFixed(1) + '" fill="' + color + '"/></g>';
    }

    function stars() {
      var pts = [[70, 74, 1.7], [120, 106, 1.2], [186, 70, 1.4], [250, 96, 1.1], [318, 66, 1.6], [376, 104, 1.3], [420, 72, 1.5], [96, 148, 1.1], [410, 152, 1.2], [300, 130, 1]];
      return pts.map(function (p) {
        return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#efd9a9" opacity=".85"/>';
      }).join('');
    }

    function leafCluster(x, y, scale, color) {
      var out = '';
      var pts = [[0, 0, 1], [12, -6, .8], [-11, -4, .75], [6, 8, .7], [-7, 7, .65]];
      pts.forEach(function (p) {
        out += '<ellipse cx="' + (x + p[0] * scale) + '" cy="' + (y + p[1] * scale) + '" rx="' + (13 * scale * p[2]) + '" ry="' + (5.4 * scale * p[2]) + '" transform="rotate(' + (p[0] * 2) + ' ' + (x + p[0] * scale) + ' ' + (y + p[1] * scale) + ')" fill="' + color + '"/>';
      });
      return out;
    }

    function nayika(rasa) {
      return '' +
        '<g transform="translate(240 398)">' +
          '<ellipse cx="0" cy="112" rx="98" ry="12" fill="#0e1122" opacity=".4"/>' +
          '<path d="M-54 110c-6-26 4-44 22-52l56 6c18 10 26 28 22 46z" fill="' + rasa.dress + '"/>' +
          '<path d="M-48 104c-2-16 6-28 18-34l18 6-10 40z" fill="#0b0d1c" opacity=".16"/>' +
          '<path d="M-30 62c14-6 30-4 40 4" stroke="' + rasa.accent + '" stroke-width="2" fill="none" opacity=".55"/>' +
          '<path d="M-20 58c-4-26 4-44 20-48 16-4 28 8 30 26l2 24-30 10z" fill="#c99a63"/>' +
          '<path d="M-18 52c12-8 28-10 40-4l2 12-40 6z" fill="' + rasa.accent + '" opacity=".75"/>' +
          '<path d="M16 18c14 10 20 26 14 44-8 2-14-2-18-10z" fill="' + rasa.accent + '"/>' +
          '<path d="M-8 6h14v10h-14z" fill="#b98c58"/>' +
          '<circle cx="-2" cy="-10" r="15" fill="#c99a63"/>' +
          '<path d="M-16-12c0-14 10-21 21-17 9 3 13 12 11 21-4-10-19-15-32-4z" fill="#171320"/>' +
          '<circle cx="13" cy="-20" r="7" fill="#171320"/>' +
          '<path d="M-16-8l-5 4 5 3z" fill="#c99a63"/>' +
          '<circle cx="8" cy="-6" r="2.6" fill="' + rasa.accent + '"/>' +
          '<path d="M-18 52c-18 6-28 16-32 28" stroke="#c99a63" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          '<path d="M14 56c10 12 8 24 0 32" stroke="#c99a63" stroke-width="9" fill="none" stroke-linecap="round"/>' +
          '<g transform="translate(-60 84)">' +
            '<circle r="27" fill="#f4d79b" opacity=".2"/>' +
            '<path d="M-11 2h22l-5 10h-12z" fill="#c9a24a"/>' +
            '<path d="M0-9c5 8 3 12 0 13-3-1-5-5 0-13z" fill="#f6cd7c"/>' +
          '</g>' +
        '</g>';
    }

    function rishi(rasa) {
      return '' +
        '<g transform="translate(236 392)">' +
          '<ellipse cx="0" cy="120" rx="78" ry="12" fill="#0e1122" opacity=".45"/>' +
          '<path d="M-30 120l4-84h52l4 84z" fill="#ece0c6"/>' +
          '<path d="M-18 118l2-80h32l2 80z" fill="#f7edda" opacity=".8"/>' +
          '<path d="M-26 40c0-16 11-26 26-26s26 10 26 26l-4 12h-44z" fill="' + rasa.dress + '"/>' +
          '<path d="M-22 30c8-10 36-10 44 0" stroke="' + rasa.accent + '" stroke-width="3" fill="none"/>' +
          '<circle cx="0" cy="0" r="15" fill="#c99a63"/>' +
          '<path d="M-14 6c4 12 10 17 14 17s10-5 14-17c-3 6-8 9-14 9s-11-3-14-9z" fill="#efe7d6"/>' +
          '<path d="M-15-3c0-11 6-17 15-17s15 6 15 17c-4-9-26-9-30 0z" fill="#d9d2c4"/>' +
          '<path d="M-22 44c-14 12-18 34-16 54" stroke="#c99a63" stroke-width="8" fill="none" stroke-linecap="round"/>' +
          '<path d="M22 44c12 10 16 28 15 44" stroke="#c99a63" stroke-width="8" fill="none" stroke-linecap="round"/>' +
          '<path d="M-40 16v112" stroke="#8a5a2b" stroke-width="4" stroke-linecap="round"/>' +
          '<circle cx="-40" cy="12" r="6" fill="' + rasa.accent + '"/>' +
          '<g fill="' + rasa.accent + '" opacity=".9"><circle cx="-20" cy="66" r="2.4"/><circle cx="-14" cy="74" r="2.4"/><circle cx="-22" cy="82" r="2.4"/></g>' +
        '</g>';
    }

    function peacock(rasa) {
      var feathers = '';
      for (var i = 0; i < 7; i += 1) {
        var a = -70 + i * 23;
        feathers += '<g transform="rotate(' + a + ')"><path d="M0 0c-10-40-6-74 0-86 6 12 10 46 0 86z" fill="' + (i % 2 ? '#2f6a5c' : '#275a4e') + '"/><circle cx="0" cy="-74" r="7" fill="#1b3c4a"/><circle cx="0" cy="-74" r="3.4" fill="' + rasa.accent + '"/></g>';
      }
      return '' +
        '<g transform="translate(240 424)">' +
          '<ellipse cx="0" cy="86" rx="86" ry="11" fill="#0e1122" opacity=".4"/>' +
          '<g transform="translate(0 -8)">' + feathers + '</g>' +
          '<ellipse cx="0" cy="44" rx="34" ry="30" fill="' + rasa.dress + '"/>' +
          '<path d="M14 30c16-16 16-42 8-54" stroke="' + rasa.dress + '" stroke-width="12" fill="none" stroke-linecap="round"/>' +
          '<circle cx="24" cy="-28" r="13" fill="' + rasa.dress + '"/>' +
          '<circle cx="30" cy="-31" r="2.6" fill="#0e1122"/>' +
          '<path d="M36 -28l12 3-12 4z" fill="' + rasa.accent + '"/>' +
          '<g stroke="' + rasa.accent + '" stroke-width="2" stroke-linecap="round">' +
            '<path d="M22-42v-10M26-41l4-9M18-41l-4-9"/>' +
          '</g>' +
          '<path d="M-30 60l-16 22M-8 64l-8 24M16 62l6 22" stroke="' + rasa.accent + '" stroke-width="3" stroke-linecap="round"/>' +
          '<g transform="translate(-66 64)">' +
            '<ellipse cx="0" cy="6" rx="24" ry="5" fill="#20303f"/>' +
            '<path d="M0 0c-7-12-3-21 0-23 3 2 7 11 0 23z" fill="#e9b8b2"/>' +
            '<path d="M0 0c-12-7-17-4-19 0 3 5 12 7 19 0z" fill="#d98d8a"/>' +
            '<path d="M0 0c12-7 17-4 19 0-3 5-12 7-19 0z" fill="#d98d8a"/>' +
          '</g>' +
        '</g>';
    }

    function render() {
      var rasa = RASA[rasaSel.value] || RASA.shringara;
      var stage = STAGE[stageSel.value] || STAGE.monsoon;
      var figure = figureSel.value;
      var tall = formatSel.value === 'tall';
      var W = 480, H = 600;
      var inner = { x: 30, y: 30, w: 420, h: 540 };
      var groundY = 468;

      var rain = '';
      if (stage.rain) {
        for (var i = 0; i < 26; i += 1) {
          var x = 40 + ((i * 47) % 400);
          var y = 46 + ((i * 71) % 380);
          rain += '<path d="M' + x + ' ' + y + 'l-4 14" stroke="#a9b6c8" stroke-width="1" opacity=".34"/>';
        }
      }

      var orb = stageSel.value === 'dawn'
        ? '<circle cx="368" cy="118" r="30" fill="#f8e0b0" opacity=".95"/>'
        : '<g><circle cx="372" cy="112" r="28" fill="#f1d9a6" opacity=".92"/><circle cx="383" cy="103" r="24" fill="' + stage.sky[0] + '" opacity=".72"/></g>';

      var horizon = '';
      if (stageSel.value === 'night') {
        horizon = '<rect x="' + inner.x + '" y="' + (groundY - 6) + '" width="' + inner.w + '" height="' + (inner.y + inner.h - groundY + 6) + '" fill="#1a2a40"/>' +
          '<g stroke="#6f86a8" stroke-width="1.1" opacity=".45" fill="none">' +
          '<path d="M60 512q22-7 44 0t44 0 44 0 44 0 44 0 44 0 44 0 44 0"/>' +
          '<path d="M60 546q22-7 44 0t44 0 44 0 44 0 44 0 44 0 44 0 44 0"/>' +
          '<path d="M60 580q22-7 44 0t44 0 44 0 44 0 44 0 44 0 44 0 44 0"/>' +
          '</g>';
      } else if (stageSel.value === 'dawn') {
        horizon = '<path d="M' + inner.x + ' ' + groundY + 'h' + inner.w + 'v66h-' + inner.w + 'z" fill="#8a6a4a"/>' +
          '<path d="M' + inner.x + ' ' + groundY + 'c70-14 120 6 180 0s120-14 240-4v10H' + inner.x + 'z" fill="#6f5738"/>';
      } else if (stageSel.value === 'forest') {
        horizon = '<path d="M' + inner.x + ' ' + groundY + 'h' + inner.w + 'v66h-' + inner.w + 'z" fill="#3d4a34"/>' +
          '<g fill="#2c4030"><ellipse cx="90" cy="470" rx="70" ry="26"/><ellipse cx="400" cy="476" rx="80" ry="24"/></g>';
      } else {
        horizon = '<path d="M' + inner.x + ' ' + groundY + 'h' + inner.w + 'v66h-' + inner.w + 'z" fill="#3a4a44"/>' +
          '<g stroke="#7c8f88" stroke-width="1" opacity=".4"><path d="M60 500h360M60 524h360M60 550h360"/></g>';
      }

      var foliage = '';
      if (stageSel.value === 'forest') {
        foliage = leafCluster(104, 300, 1.2, '#3f5b40') + leafCluster(390, 268, 1.1, '#3f5b40') +
          '<path d="M104 330v130" stroke="#2b3a2a" stroke-width="6"/>' +
          '<path d="M390 300v142" stroke="#2b3a2a" stroke-width="5"/>';
      } else if (stageSel.value === 'dawn') {
        foliage = leafCluster(110, 268, 1.1, '#7c8a58') + leafCluster(378, 246, 1, '#7c8a58') +
          '<g fill="' + rasa.accent + '" opacity=".9"><circle cx="140" cy="300" r="4"/><circle cx="356" cy="286" r="3.4"/><circle cx="330" cy="318" r="2.8"/></g>';
      } else {
        foliage = leafCluster(96, 250, 1.05, '#33503f') + leafCluster(392, 236, .95, '#33503f') +
          '<g fill="#b8342a" opacity=".85"><circle cx="128" cy="268" r="3.6"/><circle cx="366" cy="252" r="3.2"/></g>';
      }

      var plaqueDev = '';
      if (stageSel.value === 'night') {
        plaqueDev = '<g opacity=".5" stroke="#d9b36a" stroke-width="1" fill="none"><path d="M60 92h24M72 80v24"/></g>';
      }

      var figureArt = figure === 'rishi' ? rishi(rasa) : figure === 'peacock' ? peacock(rasa) : nayika(rasa);

      var text = rasa.name + ',' + ' ' + stage.label;
      if (caption) {
        caption.textContent = text + ': ' + (figure === 'rishi' ? 'a rishi with a staff' : figure === 'peacock' ? 'a peacock beside a lotus' : 'a nayika with a lamp') +
          ', ' + rasa.sense + ' carried in the line. Palette: ' + (figure === 'peacock' ? 'indigo field, peacock green, brass' : rasa.palette) + '.' +
          (tall ? ' Temple panel, 60 × 90 cm.' : ' Folio, 24 × 30 cm.');
      }

      svg.setAttribute('data-rasa', rasaSel.value);
      svg.style.aspectRatio = tall ? '2 / 3' : '4 / 5';
      var VW = 480;
      var VH = tall ? 720 : 600;

      svg.innerHTML =
        '<title id="panel-title">' + rasa.name + ' panel: ' + (figure === 'rishi' ? 'rishi' : figure === 'peacock' ? 'peacock' : 'nayika') + ' in a ' + stage.label + '</title>' +
        '<defs><linearGradient id="field' + rasaSel.value + '" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0" stop-color="' + stage.sky[0] + '"/><stop offset="1" stop-color="' + stage.sky[1] + '"/></linearGradient>' +
        '</defs>' +
        '<rect width="' + VW + '" height="' + VH + '" fill="#efe3c8"/>' +
        '<g transform="translate(0 ' + (tall ? 60 : 0) + ')">' +
          '<rect x="' + inner.x + '" y="' + inner.y + '" width="' + inner.w + '" height="' + inner.h + '" fill="url(#field' + rasaSel.value + ')"/>' +
          stars() + orb + rain + plaqueDev + foliage + horizon + figureArt +
          '<g fill="none" stroke="' + rasa.accent + '" stroke-width="1" opacity=".4"><path d="M' + (inner.x + 10) + ' ' + (groundY + 34) + 'h' + (inner.w - 20) + '"/></g>' +
        '</g>' +
        '<rect x="18" y="18" width="' + (VW - 36) + '" height="' + (VH - 36) + '" fill="none" stroke="#b08a45" stroke-width="2"/>' +
        '<rect x="25" y="25" width="' + (VW - 50) + '" height="' + (VH - 50) + '" fill="none" stroke="#b08a45" stroke-width=".7"/>' +
        rosette(40, 40, 1.1, '#8a6a2e') + rosette(VW - 40, 40, 1.1, '#8a6a2e') +
        rosette(40, VH - 40, 1.1, '#8a6a2e') + rosette(VW - 40, VH - 40, 1.1, '#8a6a2e') +
        '<circle cx="' + (VW / 2) + '" cy="11" r="3" fill="#b08a45"/>' +
        '<circle cx="' + (VW / 2) + '" cy="' + (VH - 11) + '" r="3" fill="#b08a45"/>';
    }

    [rasaSel, stageSel, figureSel, formatSel].forEach(function (el) {
      if (el) el.addEventListener('change', render);
    });
    render();
  })();

  /* ---------- plate filters ---------- */
  (function plates() {
    var buttons = document.querySelectorAll('.plate-filters button');
    if (!buttons.length) return;
    var items = document.querySelectorAll('.plate');
    buttons.forEach(function (button) {
      button.addEventListener('click', function () {
        var filter = button.getAttribute('data-filter');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', b === button ? 'true' : 'false'); });
        items.forEach(function (item) {
          item.hidden = !(filter === 'all' || item.getAttribute('data-kind') === filter);
        });
        var status = document.getElementById('plate-status');
        if (status) status.textContent = document.querySelectorAll('.plate:not([hidden])').length + ' of ' + items.length + ' plates shown';
      });
    });
  })();

  /* ---------- commission form ---------- */
  (function form() {
    var f = document.getElementById('contact-form');
    if (!f) return;
    var note = document.getElementById('form-note');
    f.addEventListener('submit', function (event) {
      event.preventDefault();
      var name = f.querySelector('#name');
      var email = f.querySelector('#email');
      var message = f.querySelector('#message');
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        if (note) { note.textContent = 'A name, an email and a few lines about the story are needed before I can answer.'; note.hidden = false; }
        return;
      }
      if (note) {
        note.textContent = 'Received, ' + name.value.trim().split(' ')[0] + '. I read the first enquiry on Monday morning and reply with questions and a date for the block sketch.';
        note.hidden = false;
      }
      f.reset();
    });
  })();
})();

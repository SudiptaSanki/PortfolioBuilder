/* Bauble Lane — interactions. No audio is created on this site. */

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- menu ---------- */
  var menu = document.querySelector('.bench-menu');
  var drawer = document.getElementById('bench-drawer');
  if (menu && drawer) {
    menu.addEventListener('click', function () {
      var open = menu.getAttribute('aria-expanded') === 'true';
      menu.setAttribute('aria-expanded', String(!open));
      menu.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        menu.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- ornament designer ---------- */
  var shapeEl = document.getElementById('live-shape');
  if (shapeEl) {
    var SHAPES = {
      round: {
        label: 'Round',
        path: 'M130 86c36 0 66 34 66 76s-30 76-66 76-66-34-66-76 30-76 66-76z',
        weight: 1, extra: 0
      },
      onion: {
        label: 'Onion',
        path: 'M130 66c42 0 72 44 72 94 0 46-32 70-72 70s-72-24-72-70c0-50 30-94 72-94z',
        weight: 1.12, extra: 6
      },
      drop: {
        label: 'Drop',
        path: 'M130 72c28 30 60 66 60 102 0 46-26 72-60 72s-60-26-60-72c0-36 32-72 60-102z',
        weight: 1.06, extra: 3
      },
      mushroom: {
        label: 'Mushroom',
        path: 'M130 72c46 0 78 28 78 58 0 18-16 26-20 44-6 26-30 42-58 42s-52-16-58-42c-4-18-20-26-20-44 0-30 32-58 78-58z',
        weight: 1.18, extra: 4
      }
    };

    var COLOURS = {
      red: { label: 'ruby red', hex: '#A8202A', light: '#E8756B', mid: '#B62A2A', dark: '#5A0C11' },
      green: { label: 'spruce green', hex: '#2F6B4F', light: '#7FB394', mid: '#2F6B4F', dark: '#123024' },
      gold: { label: 'amber gold', hex: '#C08A2E', light: '#F5D79A', mid: '#C08A2E', dark: '#5A3A0C' },
      ice: { label: 'ice blue', hex: '#8FB6B8', light: '#E4F2F0', mid: '#8FB6B8', dark: '#2E4E58' },
      silver: { label: 'clear silver', hex: '#C6CDCB', light: '#FBFCFA', mid: '#C6CDCB', dark: '#6E7A77' }
    };

    var FINISHES = {
      mirror: { label: 'mirror', add: 0, weeks: 4, note: 'Mirrored inside, gold line by hand' },
      matt: { label: 'matt', add: 2, weeks: 6, note: 'Matt outside, unmirrored, stencilled' },
      iridescent: { label: 'iridescent', add: 8, weeks: 8, note: 'Mother-of-pearl wash over clear glass' },
      painted: { label: 'hand-painted', add: 26, weeks: 10, note: 'Painted freehand by one maker' }
    };

    var SIZES = { 6: { price: 14, weight: 24 }, 8: { price: 24, weight: 42 }, 10: { price: 34, weight: 78 }, 12: { price: 48, weight: 120 } };

    var state = { shape: 'round', colour: 'red', finish: 'mirror', size: '8', cap: 'brass' };

    var capEl = document.getElementById('live-cap');
    var patternEl = document.getElementById('live-pattern');
    var sheenEl = document.getElementById('live-sheen');
    var highlightEl = document.getElementById('live-highlight');
    var grad = document.getElementById('liveGlass');

    var out = {
      num: document.getElementById('spec-num'),
      name: document.getElementById('spec-name'),
      glass: document.getElementById('spec-glass'),
      finish: document.getElementById('spec-finish'),
      size: document.getElementById('spec-size'),
      weight: document.getElementById('spec-weight'),
      cap: document.getElementById('spec-cap'),
      price: document.getElementById('spec-price'),
      lead: document.getElementById('spec-lead')
    };

    function setGradient(c) {
      grad.children[0].setAttribute('stop-color', c.light);
      grad.children[1].setAttribute('stop-color', c.mid);
      grad.children[2].setAttribute('stop-color', c.dark);
      grad.children[3].setAttribute('stop-color', c.dark);
    }

    function render() {
      var sh = SHAPES[state.shape];
      var col = COLOURS[state.colour];
      var fin = FINISHES[state.finish];
      var size = parseInt(state.size, 10);
      var sizeInfo = SIZES[size];

      shapeEl.setAttribute('d', sh.path);
      var clip = document.getElementById('live-clip-path');
      if (clip) clip.setAttribute('d', sh.path);
      setGradient(col);
      sheenEl.setAttribute('d', sh.path);

      if (state.finish === 'iridescent') {
        sheenEl.setAttribute('opacity', '0.45');
        highlightEl.setAttribute('opacity', '0.22');
      } else if (state.finish === 'matt') {
        sheenEl.setAttribute('opacity', '0');
        highlightEl.setAttribute('opacity', '0.10');
      } else if (state.finish === 'painted') {
        sheenEl.setAttribute('opacity', '0');
        highlightEl.setAttribute('opacity', '0.18');
      } else {
        sheenEl.setAttribute('opacity', '0');
        highlightEl.setAttribute('opacity', '0.30');
      }

      patternEl.setAttribute('opacity', state.finish === 'painted' ? '1' : '0');
      if (state.finish === 'painted') {
        patternEl.setAttribute('stroke', state.cap === 'brass' ? '#F6D98C' : '#DCE4E2');
      }

      capEl.setAttribute('fill', state.cap === 'brass' ? 'url(#liveCap)' : '#BFC9C6');

      var each = sizeInfo.price + fin.add + sh.extra;
      var ten = Math.round((each * 10 * 0.92) / 5) * 5;
      var weight = Math.round(sizeInfo.weight * sh.weight);
      var weeks = fin.weeks + (size === 12 ? 2 : 0);

      out.name.textContent = sh.label + ', ' + col.label + ', ' + fin.label;
      out.glass.textContent = col.label.charAt(0).toUpperCase() + col.label.slice(1) + ', lead-free';
      out.finish.textContent = fin.note;
      out.size.textContent = String(size);
      out.weight.textContent = String(weight);
      out.cap.textContent = (state.cap === 'brass' ? 'Brass' : 'Silvered steel') + ', 3 kg tested';
      out.price.textContent = '\u20AC' + each + ' each \u00B7 \u20AC' + ten + ' for ten';
      out.lead.textContent = weeks + ' weeks from confirmation';

      var seed = 100 + sh.label.length * 7 + col.label.length * 13 + fin.label.length * 3 + size * 2;
      out.num.textContent = String(seed);
    }

    document.querySelectorAll('.chips').forEach(function (group) {
      var key = group.getAttribute('data-group');
      group.querySelectorAll('.chip').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state[key] = btn.getAttribute('data-value');
          group.querySelectorAll('.chip').forEach(function (b) {
            b.classList.toggle('is-on', b === btn);
          });
          render();
        });
      });
    });

    var swatches = document.querySelector('.swatches');
    if (swatches) {
      swatches.querySelectorAll('.swatch').forEach(function (btn) {
        btn.addEventListener('click', function () {
          state.colour = btn.getAttribute('data-value');
          swatches.querySelectorAll('.swatch').forEach(function (b) {
            b.classList.toggle('is-on', b === btn);
          });
          render();
        });
      });
    }

    render();
  }

  /* ---------- order card ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    var done = document.getElementById('order-done');
    var summary = document.getElementById('order-summary');
    var mail = document.getElementById('order-mail');
    var edit = document.getElementById('order-edit');
    var FIELD = { name: 'c-name', email: 'c-email', qty: 'c-qty', date: 'c-date', note: 'c-note' };

    function warn(key, msg) {
      var el = document.getElementById('w-' + key);
      var input = document.getElementById(FIELD[key]);
      if (el) el.textContent = msg || '';
      if (input) {
        if (msg) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'A name for the order card.'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Check the address.'; },
      qty: function (v) {
        var n = parseInt(v, 10);
        if (!n || n < 1) return 'At least one piece.';
        if (n > 500) return 'More than 500 needs a conversation, not a form.';
        return '';
      },
      date: function (v) {
        if (!v) return 'When do you need them?';
        var d = new Date(v + 'T00:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        return d >= today ? '' : 'That date has already gone by.';
      },
      note: function (v) { return v.trim().length >= 20 ? '' : 'A colour, a shape, an initial — twenty characters at least.'; }
    };

    Object.keys(rules).forEach(function (key) {
      var el = document.getElementById(FIELD[key]);
      el.addEventListener('blur', function () { warn(key, rules[key](el.value)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') warn(key, rules[key](el.value));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      Object.keys(rules).forEach(function (key) {
        var el = document.getElementById(FIELD[key]);
        var msg = rules[key](el.value);
        warn(key, msg);
        if (msg && !bad) bad = el;
      });
      var lead = document.getElementById('c-lead');
      var leadMsg = document.getElementById('w-lead');
      if (!lead.checked) {
        if (leadMsg) leadMsg.textContent = 'Please confirm the lead time before we put you in the book.';
        if (!bad) bad = lead;
      } else if (leadMsg) {
        leadMsg.textContent = '';
      }
      if (bad) { bad.focus(); return; }

      var name = document.getElementById('c-name').value.trim();
      var email = document.getElementById('c-email').value.trim();
      var qty = document.getElementById('c-qty').value;
      var date = document.getElementById('c-date').value;
      var kind = document.getElementById('c-kind').value;
      var size = document.getElementById('c-size').value;
      var note = document.getElementById('c-note').value.trim();
      var nice = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      summary.textContent = name + ', your card for ' + qty + ' pieces (' + size.toLowerCase() + ') needed by ' + nice +
        ' is ready to send. We answer within a week, and the date is only held once the order is confirmed and paid in part.';

      var body = [
        'Commission card — Bauble Lane',
        '',
        'Name: ' + name,
        'Email: ' + email,
        'Pieces: ' + qty,
        'Size: ' + size,
        'For: ' + kind,
        'Needed by: ' + nice,
        '',
        note
      ].join('\n');
      mail.href = 'mailto:bench@baublelane.de?subject=' + encodeURIComponent('Commission — ' + qty + ' pieces, ' + nice) + '&body=' + encodeURIComponent(body);

      form.hidden = true;
      done.hidden = false;
      done.focus();
    });

    if (edit) {
      edit.addEventListener('click', function () {
        done.hidden = true;
        form.hidden = false;
        document.getElementById('c-note').focus();
      });
    }
  }
})();

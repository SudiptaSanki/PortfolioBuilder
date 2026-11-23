/* Halwai Gold — box builder and page behaviour. Silent, no audio. */

(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- nav ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var nav = document.getElementById('nav');
  if (menuBtn && nav) {
    menuBtn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        nav.classList.remove('open');
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- reveal ---------- */
  var targets = document.querySelectorAll('.tile, .section-head, .box-stage, .box-panel, .price-list li, .how-list li, .order-card, .form-card, .shop-info, .side-note, .timeline li, .page-head .lead');
  if ('IntersectionObserver' in window && !reduce) {
    targets.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.05 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ---------- sweet artwork ---------- */
  var ART = {
    motichoor: '<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="34" r="20" fill="#E0A33B"/><circle cx="32" cy="34" r="16" fill="#EAB354"/><g fill="#C4842A"><circle cx="26" cy="28" r="1.7"/><circle cx="34" cy="25" r="1.7"/><circle cx="40" cy="33" r="1.7"/><circle cx="28" cy="40" r="1.7"/><circle cx="37" cy="42" r="1.7"/><circle cx="23" cy="35" r="1.5"/><circle cx="31" cy="33" r="1.5"/></g><g fill="#F7D98E"><circle cx="30" cy="27" r="1"/><circle cx="38" cy="38" r="1"/><circle cx="25" cy="32" r="1"/></g><path d="M32 13v3" stroke="#B98A2E" stroke-width="1.4"/></svg>',
    kajukatli: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 12l22 22-22 22-22-22z" fill="#F7EFD9" stroke="#D9C79C" stroke-width="1.4"/><path d="M32 20l14 14-14 14-14-14z" fill="#E9DFC4" opacity="0.75"/><path d="M24 26h16M32 18v28" stroke="#D9C79C" stroke-width="0.8"/><path d="M32 12l9 9-9 3-9-3z" fill="#E3E7EA" opacity="0.9"/></svg>',
    besan: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="16" width="38" height="32" rx="2" fill="#EDCB79" stroke="#C19A4E" stroke-width="1.4"/><path d="M13 26h38M13 38h38" stroke="#DDB55E" stroke-width="0.8"/><g fill="#8FA35A"><circle cx="23" cy="21" r="1.8"/><circle cx="41" cy="21" r="1.8"/><circle cx="32" cy="32" r="1.8"/><circle cx="23" cy="43" r="1.8"/><circle cx="41" cy="43" r="1.8"/></g></svg>',
    pista: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="24" width="48" height="17" rx="8.5" fill="#DCE0B4" stroke="#B9C07E" stroke-width="1.4"/><circle cx="17" cy="32.5" r="7" fill="#C9D196"/><circle cx="17" cy="32.5" r="3" fill="#8FA35A"/><path d="M30 27h20M30 32.5h20M30 38h20" stroke="#B9C07E" stroke-width="0.9"/></svg>',
    sohan: '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 14l24 12-24 12-24-12z" fill="#F0D9A6" stroke="#C9A85F" stroke-width="1.3"/><path d="M8 26l24 12 24-12v8L32 46 8 34z" fill="#E3C98F" stroke="#C9A85F" stroke-width="1.3"/><g fill="#D8B978"><circle cx="24" cy="24" r="1.4"/><circle cx="36" cy="21" r="1.4"/><circle cx="44" cy="27" r="1.4"/><circle cx="20" cy="30" r="1.4"/></g></svg>',
    sandesh: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="36" rx="21" ry="14" fill="#F2D9D2" stroke="#D6A99C" stroke-width="1.4"/><ellipse cx="32" cy="32" rx="13" ry="8" fill="#E9BEB4"/><path d="M32 25c4 3 4 8 0 11-4-3-4-8 0-11Z" fill="#C98F84"/><path d="M14 32c8-5 28-5 36 0" stroke="#D6A99C" stroke-width="0.9" fill="none"/></svg>',
    chikki: '<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="11" y="18" width="42" height="28" rx="3" fill="#C98E4E" stroke="#A06E36" stroke-width="1.4"/><g fill="#EFE3C8"><circle cx="22" cy="27" r="3"/><circle cx="38" cy="24" r="2.6"/><circle cx="45" cy="36" r="3"/><circle cx="30" cy="38" r="2.8"/><circle cx="18" cy="39" r="2.2"/></g><g fill="#8E5F2C"><circle cx="33" cy="28" r="2"/><circle cx="26" cy="34" r="1.8"/><circle cx="42" cy="30" r="1.6"/></g></svg>',
    jamun: '<svg viewBox="0 0 64 64" aria-hidden="true"><ellipse cx="32" cy="46" rx="20" ry="7" fill="#C98E4E" opacity="0.5"/><circle cx="32" cy="34" r="16" fill="#7A4322"/><circle cx="27" cy="29" r="5" fill="#95562E" opacity="0.7"/><path d="M25 22c3 2 4 5 3 8" stroke="#B07A48" stroke-width="1.6" fill="none"/><circle cx="38" cy="40" r="1.6" fill="#E9D7B8"/><circle cx="26" cy="42" r="1.4" fill="#E9D7B8"/></svg>'
  };

  var SWEETS = {
    motichoor: { name: 'Motichoor laddoo', g: 22, rate: 780 },
    kajukatli: { name: 'Kaju katli', g: 14, rate: 1180 },
    besan: { name: 'Besan barfi', g: 20, rate: 720 },
    pista: { name: 'Pista roll', g: 20, rate: 1320 },
    sohan: { name: 'Sohan papdi', g: 26, rate: 760 },
    sandesh: { name: 'Rose sandesh', g: 20, rate: 1150 },
    chikki: { name: 'Dry fruit chikki', g: 24, rate: 980 },
    jamun: { name: 'Gulab jamun', g: 40, rate: 620 }
  };

  Object.keys(ART).forEach(function (k) {
    var el = document.querySelector('.sweet[data-sweet="' + k + '"] .sweet-art');
    if (el) el.innerHTML = ART[k];
  });

  /* ---------- box builder ---------- */
  var slotsWrap = document.getElementById('boxSlots');
  if (slotsWrap) {
    var slots = Array.prototype.slice.call(slotsWrap.querySelectorAll('.bslot'));
    var menuBtns = Array.prototype.slice.call(document.querySelectorAll('.sweet'));
    var state = new Array(9).fill(null);
    var ribbon = 'maroon';
    var gold = false;

    var countEl = document.getElementById('boxCount');
    var piecesEl = document.getElementById('pricePieces');
    var weightEl = document.getElementById('priceWeight');
    var sweetsEl = document.getElementById('priceSweets');
    var goldEl = document.getElementById('priceGold');
    var totalEl = document.getElementById('priceTotal');
    var statusEl = document.getElementById('boxStatus');
    var ribbonEl = document.getElementById('ribbon');
    var goldInput = document.getElementById('goldLeaf');

    function rupees(n) {
      return '₹' + Math.round(n).toLocaleString('en-IN');
    }

    function totals() {
      var pieces = state.filter(Boolean);
      var weight = pieces.reduce(function (s, k) { return s + SWEETS[k].g; }, 0);
      var sweetsCost = pieces.reduce(function (s, k) { return s + SWEETS[k].g / 1000 * SWEETS[k].rate; }, 0);
      var total = 60 + sweetsCost + (gold ? 180 : 0);
      return { pieces: pieces, weight: weight, sweetsCost: sweetsCost, total: total };
    }

    function render() {
      slots.forEach(function (slot, i) {
        var key = state[i];
        var art = slot.querySelector('.bslot-art');
        if (key) {
          art.innerHTML = ART[key];
          slot.classList.add('filled');
          slot.setAttribute('aria-label', 'Square ' + (i + 1) + ', ' + SWEETS[key].name + '. Remove');
        } else {
          art.innerHTML = '';
          slot.classList.remove('filled');
          slot.setAttribute('aria-label', 'Square ' + (i + 1) + ', empty');
        }
      });

      var t = totals();
      countEl.textContent = t.pieces.length + ' / 9';
      piecesEl.textContent = String(t.pieces.length);
      weightEl.textContent = t.weight + ' g';
      sweetsEl.textContent = t.pieces.length ? rupees(t.sweetsCost) : '—';
      goldEl.textContent = gold ? '₹180' : '—';
      totalEl.textContent = rupees(t.total);
      ribbonEl.style.setProperty('--ribbon', ribbon === 'maroon' ? '#8E2A2A' : ribbon === 'gold' ? '#C8963E' : '#4E6B3C');

      var counts = {};
      t.pieces.forEach(function (k) { counts[k] = (counts[k] || 0) + 1; });
      menuBtns.forEach(function (btn) {
        btn.setAttribute('aria-pressed', String(!!counts[btn.dataset.sweet]));
      });
    }

    menuBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.dataset.sweet;
        var free = state.indexOf(null);
        if (free === -1) {
          statusEl.textContent = 'All nine squares are full. Tap one in the box to take it out first.';
          return;
        }
        state[free] = key;
        statusEl.textContent = '';
        render();
      });
    });

    slots.forEach(function (slot, i) {
      slot.addEventListener('click', function () {
        if (state[i]) {
          state[i] = null;
          statusEl.textContent = '';
          render();
        }
      });
    });

    document.querySelectorAll('.swatch').forEach(function (s) {
      s.addEventListener('click', function () {
        ribbon = s.dataset.ribbon;
        document.querySelectorAll('.swatch').forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        s.setAttribute('aria-pressed', 'true');
        render();
      });
    });

    if (goldInput) {
      goldInput.addEventListener('change', function () {
        gold = goldInput.checked;
        render();
      });
    }

    document.getElementById('classicNine').addEventListener('click', function () {
      state = ['kajukatli', 'kajukatli', 'kajukatli', 'motichoor', 'motichoor', 'motichoor', 'besan', 'besan', 'pista'];
      statusEl.textContent = '';
      render();
    });

    document.getElementById('emptyBox').addEventListener('click', function () {
      state = new Array(9).fill(null);
      statusEl.textContent = '';
      render();
    });

    document.getElementById('tieBox').addEventListener('click', function () {
      var t = totals();
      if (!t.pieces.length) {
        statusEl.textContent = 'The box is empty. Choose a sweet from the counter first.';
        return;
      }
      var counts = {};
      t.pieces.forEach(function (k) { counts[k] = (counts[k] || 0) + 1; });
      var list = Object.keys(counts).map(function (k) { return counts[k] + ' × ' + SWEETS[k].name; }).join(', ');
      statusEl.textContent = 'Tied: ' + list + '. ' + t.weight + ' g, ' + ribbon + ' ribbon' + (gold ? ', gold leaf' : '') + ', ' + rupees(t.total) + '. Bring this line to the counter or quote it in your order.';
    });

    render();
  }

  /* ---------- order form ---------- */
  var form = document.getElementById('order-form');
  if (form) {
    var status = document.getElementById('order-status');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      ['name', 'email', 'phone', 'message'].forEach(function (id) {
        var el = form.querySelector('#' + id);
        if (!el) return;
        var wrap = el.closest('.field');
        var valid = el.value.trim().length > 0;
        if (id === 'email') valid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim());
        if (id === 'phone') valid = el.value.replace(/[^\d]/g, '').length >= 8;
        if (wrap) wrap.classList.toggle('invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        status.className = 'form-status err on';
        status.textContent = 'I need a name, an email, a phone number the shop can reach, and a line about the order.';
        return;
      }
      var name = form.querySelector('#name').value.trim().split(' ')[0];
      status.className = 'form-status on';
      status.textContent = 'Thank you, ' + name + '. The order is with the counter and Nandini answers emails after the morning rush, usually by 15:00. For anything inside 48 hours, call the shop number instead.';
      form.reset();
    });
    form.querySelectorAll('input, textarea, select').forEach(function (el) {
      el.addEventListener('input', function () {
        var wrap = el.closest('.field');
        if (wrap) wrap.classList.remove('invalid');
      });
    });
  }
})();

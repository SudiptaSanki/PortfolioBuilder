/* Lagoon Mask — gallery behaviour.
   Mobile panel menu, clip-reveal exhibits, the Commission Planner,
   and the bench form. No audio anywhere: a mask bench is a quiet room. */
(function () {
  'use strict';
  document.documentElement.classList.add('js');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* View-transition aborts surface as unhandled rejections in Chrome;
     swallow only that one, let everything else report. */
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    if (r && r.name === 'InvalidStateError' && /Transition was aborted/.test(r.message || '')) {
      e.preventDefault();
    }
  });

  /* ---------- mobile panel menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var panel = document.getElementById('menu-panel');
  if (btn && panel) {
    var closeBtn = panel.querySelector('.menu-close');
    var firstLink = panel.querySelector('nav a');
    function openPanel() {
      panel.removeAttribute('hidden');
      /* force reflow so the transition runs from the hidden state */
      void panel.offsetWidth;
      panel.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(function () { if (firstLink) firstLink.focus(); });
    }
    function closePanel() {
      panel.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      window.setTimeout(function () { panel.setAttribute('hidden', ''); }, reduced ? 0 : 320);
      btn.focus();
    }
    btn.addEventListener('click', openPanel);
    if (closeBtn) closeBtn.addEventListener('click', closePanel);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) closePanel();
    });
  }

  /* ---------- clip reveal (assigned scroll effect) ---------- */
  var clips = Array.prototype.slice.call(document.querySelectorAll('.clip'));
  if (clips.length) {
    if (reduced || !('IntersectionObserver' in window)) {
      clips.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
      clips.forEach(function (el) { io.observe(el); });
      /* safety: nothing stays clipped if the observer never fires */
      window.setTimeout(function () {
        clips.forEach(function (el) {
          var r = el.getBoundingClientRect();
          if (r.top < window.innerHeight && r.bottom > 0) el.classList.add('in');
        });
      }, 2600);
    }
  }

  /* ---------- Mask Commission Planner ----------
     The arithmetic below reads the same figures printed in the
     price table on this page (data-price / data-days on each row). */
  var planner = document.getElementById('planner-form');
  if (planner) {
    var QUEUE_DAYS = 6; /* bench queue, also printed on the page */
    var out = {
      form: document.getElementById('r-form'),
      finish: document.getElementById('r-finish'),
      decor: document.getElementById('r-decor'),
      total: document.getElementById('r-total'),
      deposit: document.getElementById('r-deposit'),
      days: document.getElementById('r-days'),
      ready: document.getElementById('r-ready')
    };
    function picked(name) {
      var el = planner.querySelector('input[name="' + name + '"]:checked');
      return el ? { price: +el.getAttribute('data-price'), days: +el.getAttribute('data-days'), label: el.getAttribute('data-label') } : { price: 0, days: 0, label: '—' };
    }
    function euro(n) { return '€' + n.toLocaleString('en-GB'); }
    function compute() {
      var f = picked('form'), fi = picked('finish'), d = picked('decor');
      var total = f.price + fi.price + d.price;
      var days = f.days + fi.days + d.days;
      out.form.textContent = f.label + ' — ' + euro(f.price);
      out.finish.textContent = fi.label + ' — ' + euro(fi.price);
      out.decor.textContent = d.label + ' — ' + euro(d.price);
      out.total.textContent = euro(total);
      out.deposit.textContent = euro(Math.round(total * 0.4));
      out.days.textContent = days + ' working days';
      out.ready.textContent = (days + QUEUE_DAYS) + ' working days';
    }
    planner.addEventListener('change', compute);
    compute();
  }

  /* ---------- bench form (contact page) ---------- */
  var form = document.getElementById('bench-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = (form.querySelector('#f-name').value || '').trim();
      var ref = 'LM-2027-' + Math.floor(1000 + Math.random() * 9000);
      var box = document.getElementById('confirmation');
      document.getElementById('c-name').textContent = name ? name.split(' ')[0] : 'Friend';
      document.getElementById('c-ref').textContent = ref;
      form.setAttribute('hidden', '');
      box.removeAttribute('hidden');
      box.setAttribute('tabindex', '-1');
      box.focus();
      box.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();

/* Aoyama Togishi — interactions.
   No audio, no canvas, no autoplay. Everything here has a job:
   stage tabs teach the process, the lightbox serves the register,
   the form validates honestly. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- gentle reveal (skipped under reduced motion) ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length && !reduceMotion && 'IntersectionObserver' in window) {
    revealEls.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- process stage tabs ---------- */
  var tablist = document.querySelector('[role="tablist"]');
  if (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });
    function selectTab(index, focus) {
      tabs.forEach(function (tab, i) {
        var selected = i === index;
        tab.setAttribute('aria-selected', selected ? 'true' : 'false');
        tab.tabIndex = selected ? 0 : -1;
        if (panels[i]) panels[i].hidden = !selected;
      });
      if (focus) tabs[index].focus();
    }
    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectTab(i, false); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
        if (next !== null) { e.preventDefault(); selectTab(next, true); }
      });
    });
  }

  /* ---------- lightbox for the bench register ---------- */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbTitle = lightbox.querySelector('.lb-title');
    var lbText = lightbox.querySelector('.lb-text');
    var lbCount = lightbox.querySelector('.lb-count');
    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    var items = triggers.map(function (btn) {
      return {
        src: btn.getAttribute('data-full'),
        alt: btn.querySelector('img') ? btn.querySelector('img').alt : '',
        title: btn.getAttribute('data-title'),
        text: btn.getAttribute('data-text')
      };
    });
    var current = 0;
    var lastFocus = null;

    function render() {
      var item = items[current];
      lbImg.src = item.src;
      lbImg.alt = item.alt;
      lbTitle.textContent = item.title;
      lbText.textContent = item.text;
      lbCount.textContent = (current + 1) + ' / ' + items.length;
    }
    function open(index, btn) {
      current = index;
      lastFocus = btn;
      render();
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      lightbox.querySelector('.lb-close').focus();
    }
    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      if (lastFocus) lastFocus.focus();
    }
    function step(delta) {
      current = (current + delta + items.length) % items.length;
      render();
    }
    triggers.forEach(function (btn, i) {
      btn.addEventListener('click', function () { open(i, btn); });
    });
    lightbox.querySelector('.lb-close').addEventListener('click', close);
    lightbox.querySelector('.lb-prev').addEventListener('click', function () { step(-1); });
    lightbox.querySelector('.lb-next').addEventListener('click', function () { step(1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- mobile nav: ink overlay, fade only ---------- */
  var menuBtn = document.querySelector('.menu-btn');
  var mnav = document.getElementById('mnav');
  if (menuBtn && mnav) {
    var mnavClose = mnav.querySelector('.mnav-close');
    var hideTimer = null;
    function openMenu() {
      window.clearTimeout(hideTimer);
      mnav.hidden = false;
      document.body.style.overflow = 'hidden';
      menuBtn.setAttribute('aria-expanded', 'true');
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          mnav.classList.add('open');
          if (mnavClose) mnavClose.focus();
        });
      });
    }
    function closeMenu(restoreFocus) {
      if (mnav.hidden) return;
      mnav.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      hideTimer = window.setTimeout(function () { mnav.hidden = true; }, reduceMotion ? 0 : 420);
      if (restoreFocus !== false) menuBtn.focus();
    }
    menuBtn.addEventListener('click', openMenu);
    if (mnavClose) mnavClose.addEventListener('click', function () { closeMenu(); });
    mnav.querySelectorAll('.mnav-nav a').forEach(function (link) {
      link.addEventListener('click', function () { closeMenu(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeMenu(false);
    });
  }

  /* ---------- enquiry form: validation + honest confirmation ---------- */
  var form = document.getElementById('enquiry-form');
  if (form) {
    var confirmation = document.getElementById('confirmation');
    function setError(field, message) {
      var err = form.querySelector('[data-error-for="' + field.id + '"]');
      if (message) {
        field.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = message; err.classList.add('show'); }
        return false;
      }
      field.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.classList.remove('show'); }
      return true;
    }
    function validateField(field) {
      var value = field.value.trim();
      if (field.hasAttribute('required') && !value) {
        return setError(field, 'This field is needed so the enquiry can be read properly.');
      }
      if (field.type === 'email' && value) {
        var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        return setError(field, ok ? '' : 'That email address does not look complete.');
      }
      return setError(field, '');
    }
    var fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(function (field) {
      field.addEventListener('blur', function () { validateField(field); });
      field.addEventListener('input', function () {
        if (field.getAttribute('aria-invalid') === 'true') validateField(field);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (field) {
        if (!validateField(field) && !firstBad) firstBad = field;
      });
      if (firstBad) { firstBad.focus(); return; }
      var name = form.querySelector('#f-name').value.trim();
      var ref = document.getElementById('confirmation-ref');
      if (ref) ref.textContent = name;
      form.hidden = true;
      confirmation.classList.add('show');
      confirmation.setAttribute('tabindex', '-1');
      confirmation.focus();
      confirmation.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    });
  }
})();

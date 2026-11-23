/* Byrne Naval Architecture — interactions.
   No audio (sound need-test: a design office's work is figures, not
   sound — the stub's hover chime was deleted). No decorative canvas:
   the drawing layers and the speed/range figures do the work. */
(function () {
  'use strict';

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- mobile sheet index ---------- */
  var btn = document.querySelector('.sheet-index-btn');
  var panel = document.getElementById('sheet-panel');
  if (btn && panel) {
    function closePanel() {
      btn.setAttribute('aria-expanded', 'false');
      panel.classList.remove('open');
    }
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      panel.classList.toggle('open', !open);
      if (!open) {
        var first = panel.querySelector('a');
        if (first) first.focus();
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        closePanel();
        btn.focus();
      }
    });
    panel.addEventListener('focusout', function (e) {
      if (!panel.contains(e.relatedTarget) && e.relatedTarget !== btn) closePanel();
    });
  }

  /* ---------- register explorer: design tabs ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.sheet-tabs [role="tab"]'));
  function selectTab(tab, focus) {
    tabs.forEach(function (t) {
      var selected = t === tab;
      t.setAttribute('aria-selected', String(selected));
      t.tabIndex = selected ? 0 : -1;
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p) p.hidden = !selected;
    });
    if (focus) tab.focus();
  }
  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectTab(tab, false); });
    tab.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight') j = (i + 1) % tabs.length;
      if (e.key === 'ArrowLeft') j = (i - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End') j = tabs.length - 1;
      if (j !== null) { e.preventDefault(); selectTab(tabs[j], true); }
    });
  });

  /* ---------- drawing layer toggles (per panel) ---------- */
  document.querySelectorAll('.design-panel').forEach(function (panelEl) {
    var drawing = panelEl.querySelector('.drawing');
    if (!drawing) return;
    panelEl.querySelectorAll('[data-layer]').forEach(function (box) {
      box.addEventListener('change', function () {
        drawing.classList.toggle('no-' + box.getAttribute('data-layer'), !box.checked);
      });
    });
  });

  /* ---------- Meridian: speed costs range ----------
     Usable fuel 1,620 L = the full 1,800 L tank less the 10% reserve
     this office contracts on every range figure. Burn figures are
     the boat's measured sea-trial numbers, interpolated linearly. */
  var slider = document.getElementById('speed-range');
  if (slider) {
    var curve = [[5.5, 6.5], [6.5, 10], [7.5, 16], [8.5, 26], [9.5, 44]];
    var USABLE = 1620;
    var outSpeed = document.getElementById('sp-speed');
    var outBurn = document.getElementById('sp-burn');
    var outHours = document.getElementById('sp-hours');
    var outRange = document.getElementById('sp-range');
    var note = document.getElementById('sp-note');
    function burnAt(kn) {
      for (var i = 0; i < curve.length - 1; i++) {
        var a = curve[i], b = curve[i + 1];
        if (kn >= a[0] && kn <= b[0]) {
          return a[1] + (b[1] - a[1]) * ((kn - a[0]) / (b[0] - a[0]));
        }
      }
      return curve[curve.length - 1][1];
    }
    function render() {
      var kn = parseFloat(slider.value);
      var burn = burnAt(kn);
      var hours = USABLE / burn;
      var range = kn * hours;
      outSpeed.textContent = kn.toFixed(1) + ' kn';
      outBurn.textContent = burn.toFixed(1) + ' L/h';
      outHours.textContent = Math.round(hours) + ' h';
      outRange.textContent = Math.round(range).toLocaleString('en-GB') + ' nm';
      slider.setAttribute('aria-valuetext',
        kn.toFixed(1) + ' knots: ' + Math.round(range).toLocaleString('en-GB') +
        ' nautical miles on a full tank with 10 percent reserve');
      if (kn <= 6) {
        note.textContent = 'This is the line the brochure would print — displacement speed, and it is the only line that is true.';
      } else if (kn <= 8) {
        note.textContent = 'Working speed. The range falls by roughly a third for each knot from here.';
      } else {
        note.textContent = 'Flank territory: the last knot and a half costs more fuel than the first three knots combined.';
      }
    }
    slider.addEventListener('input', render);
    render();
  }

  /* ---------- enquiry form: validation + in-page confirmation.
     Demonstration form — nothing is transmitted; the page says so. */
  var form = document.querySelector('form.enquiry');
  if (form) {
    var confirmBox = document.getElementById('enquiry-confirm');
    function setErr(field, msg) {
      var err = form.querySelector('[data-err-for="' + field.id + '"]');
      if (msg) {
        field.setAttribute('aria-invalid', 'true');
        if (err) { err.textContent = msg; err.classList.add('show'); }
        return false;
      }
      field.removeAttribute('aria-invalid');
      if (err) { err.textContent = ''; err.classList.remove('show'); }
      return true;
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      var name = form.querySelector('#f-name');
      var email = form.querySelector('#f-email');
      var type = form.querySelector('#f-type');
      var msg = form.querySelector('#f-msg');
      if (!setErr(name, name.value.trim() ? '' : 'Please give your name.')) { ok = false; firstBad = firstBad || name; }
      var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim());
      if (!setErr(email, emailOk ? '' : 'Please give an email address we can reply to.')) { ok = false; firstBad = firstBad || email; }
      if (!setErr(type, type.value ? '' : 'Please choose the kind of enquiry.')) { ok = false; firstBad = firstBad || type; }
      if (!setErr(msg, msg.value.trim().length >= 20 ? '' : 'A few lines help — 20 characters or more: size, grounds, and the honest budget if you have one.')) { ok = false; firstBad = firstBad || msg; }
      if (!ok) { if (firstBad) firstBad.focus(); return; }
      var ref = 'BNA-' + new Date().getFullYear() + '-' +
        String(Math.floor(100 + Math.random() * 900));
      var refEl = document.getElementById('confirm-ref');
      if (refEl) refEl.textContent = ref;
      confirmBox.classList.add('show');
      confirmBox.setAttribute('tabindex', '-1');
      confirmBox.focus();
      confirmBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    });
    form.querySelectorAll('input, select, textarea').forEach(function (f) {
      f.addEventListener('input', function () { setErr(f, ''); });
    });
  }
})();

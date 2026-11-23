/* Annam Harvest — interactions. No audio is created on this site. */

(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- mobile masthead ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var drawer = document.getElementById('mast-drawer');
  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      var open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      toggle.setAttribute('aria-label', open ? 'Open menu' : 'Close menu');
      drawer.hidden = open;
    });
    drawer.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        drawer.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ---------- pongal pot calculator ---------- */
  var range = document.getElementById('guests');
  if (range) {
    var out = {
      people: document.getElementById('for-people'),
      count: document.getElementById('pot-count'),
      rice: document.getElementById('v-rice'),
      dal: document.getElementById('v-dal'),
      jaggery: document.getElementById('v-jaggery'),
      ghee: document.getElementById('v-ghee'),
      cashew: document.getElementById('v-cashew'),
      water: document.getElementById('v-water'),
      time: document.getElementById('v-time'),
      uRice: document.getElementById('u-rice'),
      uDal: document.getElementById('u-dal'),
      uJaggery: document.getElementById('u-jaggery'),
      uGhee: document.getElementById('u-ghee'),
      uCashew: document.getElementById('u-cashew'),
      foot: document.getElementById('calc-foot'),
      guestOut: document.getElementById('guest-out'),
      fill: document.getElementById('pot-fill')
    };

    function round(v, step) { return Math.round(v / step) * step; }

    function cups(grams) {
      var c = grams / 200;
      var whole = Math.floor(c);
      var frac = c - whole;
      var marks = [[1, '1'], [0.75, '¾'], [0.5, '½'], [0.25, '¼']];
      var fracText = '';
      if (frac > 0.12) {
        var best = marks[0];
        var dist = 9;
        marks.forEach(function (m) { var d = Math.abs(frac - m[0]); if (d < dist) { dist = d; best = m; } });
        fracText = best[1];
      }
      if (whole && fracText) return whole + ' ' + fracText + ' cups';
      if (whole) return whole + (whole === 1 ? ' cup' : ' cups');
      return fracText ? fracText + ' cup' : 'a scant cup';
    }

    function update() {
      var g = parseInt(range.value, 10);
      var rice = round(g * 65, 10);
      var dal = round(rice / 3, 10);
      var jaggery = round(rice * 0.9, 10);
      var ghee = round(rice * 0.25, 5);
      var cashew = Math.max(10, round(rice * 0.08, 5));
      var waterMl = rice * 3 + ghee + dal * 4;
      var pots = g <= 20 ? 1 : g <= 40 ? 2 : 3;
      var potLitres = Math.ceil((waterMl + rice * 1.1) / 1000) + 2;
      var minutes = Math.min(85, 35 + Math.ceil(Math.max(0, g - 8) / 12) * 7);

      out.people.textContent = String(g);
      out.guestOut.textContent = String(g);
      out.count.textContent = pots === 1 ? 'one pot' : pots + ' pots';
      out.rice.textContent = String(rice);
      out.dal.textContent = String(dal);
      out.jaggery.textContent = String(jaggery);
      out.ghee.textContent = String(ghee);
      out.cashew.textContent = String(cashew);
      out.water.textContent = (waterMl / 1000).toFixed(1);
      out.time.textContent = String(minutes);
      out.uRice.textContent = cups(rice);
      out.uDal.textContent = cups(dal);
      out.uJaggery.textContent = (jaggery / 200).toFixed(1).replace('.0', '') + ' blocks';
      out.uGhee.textContent = Math.round(ghee / 15) + ' tbsp';
      out.uCashew.textContent = 'about ' + Math.round(cashew / 1.4) + ' nuts';

      if (pots === 1) {
        out.foot.textContent = 'One pot for ' + g + ': a ' + potLitres + '-litre urli, and the milk added only when the rice has broken.';
      } else {
        out.foot.textContent = pots + ' pots for ' + g + ': split the rice evenly, keep the jaggery in one pot only, and let ' + (pots === 2 ? 'both' : 'all three') + ' boil over.';
      }

      if (out.fill) {
        var hgt = Math.round(26 + Math.min(1, g / 60) * 42);
        out.fill.setAttribute('y', String(104 + (60 - Math.min(60, hgt))));
        out.fill.setAttribute('height', String(Math.min(60, hgt)));
      }
    }

    range.addEventListener('input', update);
    var minus = document.getElementById('minus');
    var plus = document.getElementById('plus');
    if (minus) minus.addEventListener('click', function () {
      range.value = String(Math.max(4, parseInt(range.value, 10) - 1));
      update();
    });
    if (plus) plus.addEventListener('click', function () {
      range.value = String(Math.min(60, parseInt(range.value, 10) + 1));
      update();
    });
    update();
  }

  /* ---------- visit form ---------- */
  var form = document.getElementById('visit-form');
  if (form) {
    var sent = document.getElementById('sent');
    var summary = document.getElementById('sent-summary');
    var mail = document.getElementById('sent-mail');
    var edit = document.getElementById('sent-edit');
    var FIELDS = { name: 'v-name', email: 'v-email', date: 'v-date' };

    function setMsg(key, text) {
      var el = document.getElementById('m-' + key);
      var input = document.getElementById(FIELDS[key]);
      if (el) el.textContent = text || '';
      if (input) {
        if (text) input.setAttribute('aria-invalid', 'true');
        else input.removeAttribute('aria-invalid');
      }
    }

    var rules = {
      name: function (v) { return v.trim().length >= 2 ? '' : 'Whom should we expect?'; },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'We need an email to reply.'; },
      date: function (v) {
        if (!v) return 'Give us a date to work with.';
        var d = new Date(v + 'T00:00:00');
        var today = new Date(); today.setHours(0, 0, 0, 0);
        return d >= today ? '' : 'That date has gone by.';
      }
    };

    Object.keys(rules).forEach(function (key) {
      var el = document.getElementById(FIELDS[key]);
      el.addEventListener('blur', function () { setMsg(key, rules[key](el.value)); });
      el.addEventListener('input', function () {
        if (el.getAttribute('aria-invalid') === 'true') setMsg(key, rules[key](el.value));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = null;
      Object.keys(rules).forEach(function (key) {
        var el = document.getElementById(FIELDS[key]);
        var msg = rules[key](el.value);
        setMsg(key, msg);
        if (msg && !bad) bad = el;
      });
      var ok = document.getElementById('v-ok');
      var okMsg = document.getElementById('m-ok');
      if (!ok.checked) {
        if (okMsg) okMsg.textContent = 'Please confirm the shared bathroom and the single menu.';
        if (!bad) bad = ok;
      } else if (okMsg) {
        okMsg.textContent = '';
      }
      if (bad) { bad.focus(); return; }

      var name = document.getElementById('v-name').value.trim();
      var email = document.getElementById('v-email').value.trim();
      var date = document.getElementById('v-date').value;
      var people = document.getElementById('v-people').value;
      var kind = document.getElementById('v-kind').value;
      var note = document.getElementById('v-note').value.trim();
      var nice = new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

      summary.textContent = name + ', your message about ' + kind.toLowerCase() + ' on ' + nice + ' for ' + people +
        (people === '1' ? ' person' : ' people') + ' is ready. It is not booked until the farm replies, and in January the reply can take three days.';

      var body = [
        'Visit enquiry — Annam Harvest',
        '',
        'Name: ' + name,
        'Email: ' + email,
        'Date: ' + nice,
        'People: ' + people,
        'What they would like: ' + kind,
        '',
        note || '(No further notes.)'
      ].join('\n');
      mail.href = 'mailto:table@annamharvest.in?subject=' + encodeURIComponent('Visit — ' + nice) + '&body=' + encodeURIComponent(body);

      form.hidden = true;
      sent.hidden = false;
      sent.focus();
    });

    if (edit) {
      edit.addEventListener('click', function () {
        sent.hidden = true;
        form.hidden = false;
        document.getElementById('v-name').focus();
      });
    }
  }
})();

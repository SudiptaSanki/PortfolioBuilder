/* Devika Menon — festival operations
   The site model: density, gates, water, and the order the decisions have to be made in. */

(function () {
  'use strict';

  var navbtn = document.querySelector('.navbtn');
  var nav = document.getElementById('nav');
  if (navbtn && nav) {
    navbtn.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navbtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = String(new Date().getFullYear());

  var el = {
    crowd: document.getElementById('m-crowd'),
    area: document.getElementById('m-area'),
    gates: document.getElementById('m-gates'),
    days: document.getElementById('m-days'),
    no: document.getElementById('v-no'),
    title: document.getElementById('v-title'),
    sub: document.getElementById('v-sub'),
    stamp: document.getElementById('v-stamp'),
    verdict: document.getElementById('v-verdict'),
    num: document.getElementById('gauge-num'),
    fill: document.getElementById('gauge-fill'),
    metrics: document.getElementById('metrics'),
    orders: document.getElementById('order-list'),
    foot: document.getElementById('v-foot')
  };
  var ready = !!(el.crowd && el.metrics);

  var ARC = 289; // length of the semicircle path, for the gauge

  function fmt(n) {
    return Number(n).toLocaleString('en-IN');
  }

  function model(state) {
    var crowd = state.crowd;
    var area = state.area;
    var gates = state.gates;
    var days = state.days;

    var simultaneous = Math.round(crowd * 0.45);
    var density = simultaneous / area;
    var peakInflow = Math.round(crowd * 0.28);
    var gateCapacity = gates * 1200;
    var lanesNeeded = Math.ceil(peakInflow / 600);
    var marshals = Math.ceil(crowd / 250) + 8;
    var toiletsW = Math.ceil((crowd * 0.52) / 60);
    var toiletsM = Math.ceil((crowd * 0.48) / 100);
    var water = Math.round((crowd * 1.2) / 1000) + 2;
    var wasteKg = Math.round(crowd * 0.09);
    var power = 40 + Math.round(crowd * 0.02);
    var medical = Math.ceil(crowd / 15000) + 1;
    var siteCap4 = area * 4;

    var verdict, cls, stamp;
    if (density < 2) {
      verdict = 'Comfortable for a standing crowd. The risk here is boredom, not crush: keep one gate busy and the water close to where people wait.';
      cls = 'is-low'; stamp = 'Low';
    } else if (density < 4) {
      verdict = 'Busy but workable. A standing crowd can still step aside for an ambulance, and the aarti can hold its time if the gates keep moving.';
      cls = ''; stamp = 'Workable';
    } else if (density < 6) {
      verdict = 'Heavy. At this density the crowd cannot make room for itself. The gates have to move faster than the arrival, or the ritual has to be split.';
      cls = 'is-heavy'; stamp = 'Heavy';
    } else {
      verdict = 'Critical. This is the density at which people are carried rather than walking. The site cannot take this figure at one time, whatever the plan says.';
      cls = 'is-critical'; stamp = 'Critical';
    }

    var orders = [];
    if (gateCapacity < peakInflow) {
      orders.push('<b>Open more gate than you have.</b> ' + gates + (gates === 1 ? ' gate passes ' : ' gates pass ') + fmt(gateCapacity) + ' an hour; the peak hour is ' + fmt(peakInflow) + '. You need ' + lanesNeeded + ' lanes, which is ' + Math.ceil(lanesNeeded / 2) + ' more gates, or a one-way loop that takes the exit off the gate.');
    } else {
      orders.push('<b>The gates can take the peak hour.</b> ' + fmt(gateCapacity) + ' through ' + gates + (gates === 1 ? ' gate ' : ' gates ') + 'against an arrival of ' + fmt(peakInflow) + '. Hold the bag check at six seconds and count every ten minutes.');
    }
    if (density >= 6) {
      orders.push('<b>Cap the site at ' + fmt(siteCap4) + '.</b> Four persons per m\u00b2 is the working limit for ' + fmt(area) + ' m\u00b2. Either move the main ritual to a larger ground or run it twice, and put the cap in the police permission so the gate can enforce it.');
    } else if (density >= 4) {
      orders.push('<b>Split the aarti into two sittings.</b> 45% of the day standing at once is ' + fmt(simultaneous) + ' in ' + fmt(area) + ' m\u00b2. Two sittings 40 minutes apart, the second announced from the stage, brings each to about ' + (density / 2).toFixed(1) + ' persons per m\u00b2.');
    }
    if (days >= 3) {
      orders.push('<b>Rotate the marshals.</b> ' + fmt(marshals) + ' people on a ' + days + '-day festival is ' + fmt(marshals * 2) + ' shifts. The same crew cannot work every night and still count straight on the last one; brief the police again on day ' + Math.min(4, days) + '.');
    }
    orders.push('<b>Water before the queue.</b> ' + fmt(water) + ' kL for the day: two 1,000 L tanks at the main gate, one at the medical post, and a refill run agreed at 14:00 and 18:00.');
    if (toiletsW + toiletsM > 0) {
      orders.push('<b>' + (toiletsW + toiletsM) + ' toilet units</b> (' + toiletsW + ' for women, ' + toiletsM + ' for men). Put the women\u2019s block on the side the queue does not use, or the line will block the north lane by 18:30.');
    }
    if (crowd >= 40000) {
      orders.push('<b>A lost-child desk at every gate.</b> At ' + fmt(crowd) + ' a day, one desk at the main gate is a ten-minute walk from the other end of the site. Two people, one board, a working phone and the announcement script already written.');
    }

    var metrics = [
      ['Standing at once', fmt(simultaneous), '45% of the day'],
      ['Density', density.toFixed(1) + ' /m\u00b2', '4 is the working limit'],
      ['Peak arrival', fmt(peakInflow) + ' /h', '28% of the day in one hour'],
      ['Gate capacity', fmt(gateCapacity) + ' /h', gates + ' gates, 2 lanes, 600 each'],
      ['Marshals', fmt(marshals), 'one per 250, plus 8 fixed'],
      ['Toilets', fmt(toiletsW + toiletsM), toiletsW + ' women, ' + toiletsM + ' men'],
      ['Water', fmt(water) + ' kL', '1.2 L a head, plus the crew'],
      ['Waste', (wasteKg / 1000).toFixed(1) + ' t', '90 g a head, separated at the bin'],
      ['Power', fmt(power) + ' kW', 'sound, lights, medical, kitchen'],
      ['Medical', fmt(medical), 'posts, each with an ambulance route'],
      ['Site at 4/m\u00b2', fmt(siteCap4), 'the most this area should hold'],
      ['Shift roster', fmt(marshals * 2), 'two shifts over ' + days + (days === 1 ? ' day' : ' days')]
    ];

    return {
      numbers: {
        simultaneous: simultaneous, density: +density.toFixed(1), peakInflow: peakInflow,
        gateCapacity: gateCapacity, lanesNeeded: lanesNeeded, marshals: marshals,
        toiletsW: toiletsW, toiletsM: toiletsM, water: water, wasteKg: wasteKg,
        power: power, medical: medical, siteCap4: siteCap4, days: days
      },
      verdict: verdict, cls: cls, stamp: stamp, orders: orders, metrics: metrics
    };
  }

  function render(state) {
    var m = model(state);
    el.no.textContent = 'SITE MODEL \u00b7 ' + (state.gates === 1 ? 'ONE GATE' : state.gates + ' GATES') + ' \u00b7 ' + state.days + (state.days === 1 ? ' DAY' : ' DAYS');
    el.title.textContent = fmt(state.crowd) + ' through ' + fmt(state.area) + ' m\u00b2';
    el.sub.textContent = fmt(m.numbers.simultaneous) + ' standing at once, ' + fmt(m.numbers.peakInflow) + ' arriving in the peak hour';

    el.stamp.className = 'stamp ' + m.cls;
    el.stamp.textContent = m.stamp;
    el.verdict.innerHTML = '<strong>' + m.stamp + '.</strong> ' + m.verdict;

    el.num.textContent = m.numbers.density.toFixed(1);
    var frac = Math.min(1, m.numbers.density / 8);
    el.fill.style.strokeDasharray = (ARC * frac).toFixed(1) + ' 500';

    el.metrics.innerHTML = m.metrics.map(function (row) {
      return '<div><dt>' + row[0] + '</dt><dd>' + row[1] + '<small>' + row[2] + '</small></dd></div>';
    }).join('');

    el.orders.innerHTML = m.orders.slice(0, 5).map(function (o, i) {
      return '<li><span class="n">0' + (i + 1) + '</span><span>' + o + '</span></li>';
    }).join('');

    el.foot.textContent = m.numbers.density >= 4
      ? 'Above four persons per m\u00b2, a standing crowd cannot step aside. That is the number this sheet is built on.'
      : 'Density is a model, not a measurement. Count the gate every ten minutes on the day and correct it.';

    window.__model = {
      state: state, numbers: m.numbers, verdict: m.verdict, stamp: m.stamp,
      orders: m.orders, metrics: m.metrics,
      title: el.title.textContent, sub: el.sub.textContent
    };
  }

  function read() {
    return {
      crowd: parseInt(el.crowd.value, 10),
      area: parseInt(el.area.value, 10),
      gates: parseInt(el.gates.value, 10),
      days: parseInt(el.days.value, 10)
    };
  }

  if (ready) {
    ['crowd', 'area', 'gates', 'days'].forEach(function (k) {
      el[k].addEventListener('change', function () { render(read()); });
    });
    render(read());
  }

  /* festival filter */
  var filters = document.querySelector('.filters');
  if (filters) {
    var items = Array.prototype.slice.call(document.querySelectorAll('[data-type]'));
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var want = chip.getAttribute('data-filter');
      filters.querySelectorAll('.chip').forEach(function (c) { c.setAttribute('aria-pressed', c === chip ? 'true' : 'false'); });
      items.forEach(function (it) { it.hidden = want !== 'all' && it.getAttribute('data-type') !== want; });
    });
  }

  /* brief form */
  var form = document.getElementById('brief-form');
  if (form) {
    var fields = {
      name: { el: document.getElementById('o-name'), test: function (v) { return v.trim().length >= 2; }, msg: 'Who is writing.' },
      org: { el: document.getElementById('o-org'), test: function (v) { return v.trim().length >= 2; }, msg: 'The temple, committee or company.' },
      email: { el: document.getElementById('o-email'), test: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'An email that works.' },
      phone: { el: document.getElementById('o-phone'), test: function (v) { return v.replace(/\D/g, '').length >= 10; }, msg: 'Ten digits for the day itself.' },
      date: { el: document.getElementById('o-date'), test: function (v) { return !!v; }, msg: 'The first day of the festival.' },
      message: { el: document.getElementById('o-message'), test: function (v) { return v.trim().length >= 20; }, msg: 'The site, the footfall last year, and what worried you.' }
    };
    function setErr(k, on) {
      var f = fields[k];
      var box = f.el.closest('.field').querySelector('.err');
      if (on) f.el.setAttribute('aria-invalid', 'true');
      else f.el.removeAttribute('aria-invalid');
      box.textContent = on ? f.msg : '';
    }
    Object.keys(fields).forEach(function (k) {
      fields[k].el.addEventListener('input', function () {
        if (fields[k].el.getAttribute('aria-invalid') === 'true' && fields[k].test(fields[k].el.value)) setErr(k, false);
      });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var bad = 0;
      Object.keys(fields).forEach(function (k) {
        var good = fields[k].test(fields[k].el.value);
        setErr(k, !good);
        if (!good) bad++;
      });
      var agree = document.getElementById('o-agree');
      var agreeErr = document.getElementById('o-agree-err');
      if (!agree.checked) { agreeErr.textContent = 'Please confirm the committee has authorised this brief.'; bad++; }
      else agreeErr.textContent = '';
      if (bad) { (form.querySelector('[aria-invalid="true"]') || agree).focus(); return; }
      document.getElementById('sent-name').textContent = fields.name.el.value.trim();
      document.getElementById('sent-when').textContent = fields.date.el.value + ' \u00b7 ' + document.getElementById('o-festival').value;
      document.getElementById('sent-where').textContent = document.getElementById('o-site').value;
      form.hidden = true;
      var sent = document.getElementById('sent');
      sent.hidden = false;
      sent.focus();
      sent.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }
})();

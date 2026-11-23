/* Alpine Hush — panel navigation, the snow-day planner and the enquiry form. */
(function () {
  'use strict';

  /* ---------- panel nav ---------- */
  var panel = document.querySelector('.panel');
  var toggle = document.querySelector('.panel-toggle');
  if (panel && toggle) {
    toggle.addEventListener('click', function () {
      var open = panel.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  /* ---------- enquiry form ---------- */
  var ef = document.getElementById('enquiry-form');
  if (ef) {
    ef.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('name');
      var email = document.getElementById('email');
      var dates = document.getElementById('dates');
      var note = document.getElementById('note');
      var agree = document.getElementById('agree');
      ['name', 'email', 'dates', 'note', 'agree'].forEach(function (id) {
        var el = document.getElementById('err-' + id);
        if (el) el.textContent = '';
      });
      var bad = null;
      if (name.value.trim().length < 2) { document.getElementById('err-name').textContent = 'A name for the booking, please.'; bad = bad || name; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim())) { document.getElementById('err-email').textContent = 'That email looks incomplete.'; bad = bad || email; }
      if (dates.value.trim().length < 4) { document.getElementById('err-dates').textContent = 'Even approximate dates help — “early Feb”.'; bad = bad || dates; }
      if (note.value.trim().length < 6) { document.getElementById('err-note').textContent = 'Who is coming, and how well do they ski?'; bad = bad || note; }
      if (!agree.checked) { document.getElementById('err-agree').textContent = 'Please confirm the minimum stay and the cancellation terms.'; bad = bad || agree; }
      var status = document.getElementById('form-status');
      if (bad) {
        status.className = 'form-status bad';
        status.textContent = 'A few fields still need you before this can go to Elise.';
        bad.focus();
        return;
      }
      status.className = 'form-status ok';
      status.textContent = 'Danke, ' + name.value.trim().split(' ')[0] + '. This is a portfolio preview, so nothing has been sent — write to stay@stillhaus.at with the same details and Elise will answer within a day, usually in the evening after dinner.';
      ef.querySelector('button[type="submit"]').textContent = 'Enquiry noted';
    });
  }

  /* ---------- snow-day planner ---------- */
  var form = document.getElementById('plan-form');
  if (!form) return;

  var RATE = { dec: 128, jan: 158, feb: 168, mar: 152, apr: 118 };
  var PASS = { dec: 62, jan: 78, feb: 78, mar: 74, apr: 58 };
  var MONTH_NAME = { dec: 'Early December', jan: 'January', feb: 'February', mar: 'March', apr: 'April' };
  var MONTH_NOTE = {
    dec: 'The quietest week of the season: lifts open on 5 December, the village is still itself, and the rate is the lowest of the winter.',
    jan: 'January is cold and, after the first week, empty. Snow is reliable above 1,600 m and the sun leaves the valley at about 15:40.',
    feb: 'February brings the deepest base and the school holidays. Book by October; the last week of the month is the busiest of the year.',
    mar: 'March is the connoisseur’s month — longer days, spring snow on the south faces, and the White Ring usually in good condition.',
    apr: 'April is corn snow and closing lifts. Half the mountain shuts after Easter, the rate drops, and the terrace opens for lunch.'
  };
  var LEVEL = {
    first: { label: 'First time', rent: 38, school: 140, note: 'Lessons with the Zug ski school, 09:30, two hours a day. The nursery slope is 200 m from the boot room, and I will walk you over on the first morning.' },
    cruise: { label: 'Cruising', rent: 38, school: 0, note: 'The blue-red circuit from Zug through Lech and back is 14 km and can be skied without repeating a run. I will mark the route on the piste map at breakfast.' },
    off: { label: 'Off-piste', rent: 52, school: 0, note: 'A guide is booked for the group, one per four guests. We read the avalanche report at breakfast and the guide decides; some mornings the decision is no.' }
  };

  var el = {
    nights: document.getElementById('nights'),
    guests: document.getElementById('guests'),
    nightsOut: document.getElementById('nights-out'),
    guestsOut: document.getElementById('guests-out'),
    month: document.getElementById('month'),
    lines: document.getElementById('lines'),
    total: document.getElementById('total'),
    per: document.getElementById('per'),
    note: document.getElementById('note')
  };

  function euro(n) {
    return '€' + Math.round(n).toLocaleString('en-GB');
  }

  function update() {
    var nights = parseInt(el.nights.value, 10);
    var guests = parseInt(el.guests.value, 10);
    var month = el.month.value;
    var levelKey = form.querySelector('input[name="level"]:checked').value;
    var level = LEVEL[levelKey];

    el.nightsOut.textContent = String(nights);
    el.guestsOut.textContent = String(guests);

    var rooms = Math.ceil(guests / 2);
    var singleSupp = guests % 2 === 1 ? 35 * nights : 0;
    var lodging = guests * nights * RATE[month] + singleSupp;
    var passes = guests * nights * PASS[month];
    var rental = guests * nights * level.rent;
    var school = guests * level.school;
    var guide = levelKey === 'off' ? Math.ceil(guests / 4) * 320 : 0;
    var tax = guests * nights * 3;
    var total = lodging + passes + rental + school + guide + tax;

    var rows = [
      ['Rooms', rooms + ' ' + (rooms === 1 ? 'room' : 'rooms') + ' · ' + guests + ' ' + (guests === 1 ? 'guest' : 'guests') + ' · ' + nights + ' nights', euro(lodging)],
      ['Ski pass', 'Ski Arlberg, ' + nights + ' days, ' + euro(PASS[month]) + ' each', euro(passes)],
      ['Ski & boot rental', euro(level.rent) + ' per person per day', euro(rental)],
      ['Lessons', levelKey === 'first' ? 'Two half-days each, Zug ski school' : 'Not included', school ? euro(school) : '—'],
      ['Guide', levelKey === 'off' ? 'One guide per four guests, per day' : 'Not included', guide ? euro(guide) : '—'],
      ['Kurtaxe', 'Visitor tax, €3 per person per night', euro(tax)]
    ];

    el.lines.innerHTML = rows.map(function (r) {
      return '<li><span>' + r[0] + '<em>' + r[1] + '</em></span><span>' + r[2] + '</span></li>';
    }).join('');

    el.total.textContent = euro(total);
    el.per.textContent = euro(total / (guests * nights)) + ' per person per night';
    el.note.textContent = MONTH_NAME[month] + ': ' + MONTH_NOTE[month] + ' ' + level.note;
  }

  form.addEventListener('input', update);
  form.addEventListener('change', update);
  update();
})();
